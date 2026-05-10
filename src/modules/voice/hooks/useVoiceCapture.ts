"use client";

import { useState, useCallback, useRef } from "react";
import apiClient from "@/shared/lib/api-client";
import {
  calculateRms,
  classifyNoise,
  getMicGuidance,
  MAX_RECORDING_MS,
  MIN_RECORDING_MS,
  NOISE_SAMPLE_MS,
  type AudioQuality,
} from "@/modules/voice/lib/audio-quality";

export type RecordingState =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "processing"
  | "too_short"
  | "too_noisy"
  | "ready_to_upload"
  | "uploading"
  | "error";

const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
  },
};

const SUPPORTED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg",
];

interface WebKitAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

const DEFAULT_QUALITY: AudioQuality = {
  noiseFloor: 0,
  speechLevel: 0,
  snr: 0,
  isTooNoisy: false,
  isTooShort: false,
};

export interface VoiceResult {
  transactions: Array<{
    intent: string;
    resolvedCustomer: {
      name: string;
      isNew: boolean;
      isAmbiguous: boolean;
      customerId?: string;
      tag?: string;
    };
    items: Array<{
      product_name: string;
      product_id?: string;
      quantity: number;
      unit_price: number;
    }>;
    total_amount: number;
    amount?: number;
    transaction_type: string;
    confidence_score: number;
    reasoning_summary: string;
    voice_confirmation: string;
  }>;
  overall_transcript: string;
  detectedLanguage?: "yo" | "en" | "mixed";
  confirmationAudio?: string | null;
}

export function useVoiceCapture() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [quality, setQuality] = useState<AudioQuality>(DEFAULT_QUALITY);
  const [levelHint, setLevelHint] = useState<"Listening..." | "Move closer" | "Good level">("Listening...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingStartTime = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const meterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopRecordingRef = useRef<() => Promise<Blob | null>>(async () => null);
  const noiseSamples = useRef<number[]>([]);
  const speechSamples = useRef<number[]>([]);
  const lastSpeechAt = useRef<number | null>(null);

  const cleanupTimers = useCallback(() => {
    if (meterIntervalRef.current) clearInterval(meterIntervalRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    meterIntervalRef.current = null;
    maxTimerRef.current = null;
  }, []);

  const cleanupAudioGraph = useCallback(() => {
    cleanupTimers();
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current = null;
  }, [cleanupTimers]);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopMetering = useCallback(() => {
    cleanupAudioGraph();
  }, [cleanupAudioGraph]);

  const buildQuality = useCallback((duration: number): AudioQuality => {
    const noiseFloor =
      noiseSamples.current.length > 0
        ? noiseSamples.current.reduce((sum, value) => sum + value, 0) /
          noiseSamples.current.length
        : 0;

    const speechLevel =
      speechSamples.current.length > 0
        ? speechSamples.current.reduce((sum, value) => sum + value, 0) /
          speechSamples.current.length
        : 0;

    return classifyNoise({
      speechLevel,
      noiseFloor,
      durationMs: duration,
      minDurationMs: MIN_RECORDING_MS,
    });
  }, []);

  const startMetering = useCallback((stream: MediaStream) => {
    const AudioContextCtor =
      window.AudioContext || (window as WebKitAudioWindow).webkitAudioContext;
    if (!AudioContextCtor) return;

    const audioContext = new AudioContextCtor();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    noiseSamples.current = [];
    speechSamples.current = [];
    lastSpeechAt.current = null;

    const sampleBuffer = new Float32Array(analyser.fftSize);

    meterIntervalRef.current = setInterval(() => {
      analyser.getFloatTimeDomainData(sampleBuffer);
      const rms = calculateRms(sampleBuffer);
      const elapsed = Date.now() - recordingStartTime.current;

      setDurationMs(elapsed);

      if (elapsed <= NOISE_SAMPLE_MS) {
        noiseSamples.current.push(rms);
        setLevelHint("Listening...");
        return;
      }

      const noiseFloor =
        noiseSamples.current.length > 0
          ? noiseSamples.current.reduce((sum, value) => sum + value, 0) /
            noiseSamples.current.length
          : 0.01;

      const speechThreshold = Math.max(0.02, noiseFloor * 2.2);
      if (rms >= speechThreshold) {
        speechSamples.current.push(rms);
        lastSpeechAt.current = Date.now();
      }

      setLevelHint(getMicGuidance(rms, noiseFloor));
    }, 100);
  }, []);

  const resetRecording = useCallback(() => {
    setAudioBlob(null);
    setDurationMs(0);
    setQuality(DEFAULT_QUALITY);
    setLevelHint("Listening...");
    setErrorMessage(null);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      resetRecording();
      setRecordingState("requesting_permission");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("No microphone available on this browser.");
      }

      const mimeType = SUPPORTED_MIME_TYPES.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );

      if (!mimeType) {
        throw new Error("Audio recording is not supported on this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      audioChunks.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data);
      };

      recorder.start(1000);
      mediaRecorder.current = recorder;
      recordingStartTime.current = Date.now();
      startMetering(stream);
      setIsRecording(true);
      setRecordingState("recording");

      maxTimerRef.current = setTimeout(() => {
        void stopRecordingRef.current();
      }, MAX_RECORDING_MS);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      cleanupAudioGraph();
      cleanupStream();
      setIsRecording(false);
      setRecordingState("error");

      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone permission denied. Please allow microphone access and try again."
          : err instanceof Error
            ? err.message
            : "Could not access microphone. Check browser permissions.";

      setErrorMessage(message);
      throw new Error(message);
    }
  }, [cleanupAudioGraph, cleanupStream, resetRecording, startMetering]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorder.current) {
        return reject(new Error("No active recording found"));
      }

      const duration = Date.now() - recordingStartTime.current;
      mediaRecorder.current.onstop = () => {
        stopMetering();

        const mimeType = mediaRecorder.current?.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        const resultQuality = buildQuality(duration);

        setDurationMs(duration);
        setQuality(resultQuality);
        setIsRecording(false);
        cleanupStream();
        mediaRecorder.current = null;

        if (resultQuality.isTooShort) {
          setRecordingState("too_short");
          setErrorMessage("Speak again. That clip was too short.");
          resolve(null);
          return;
        }

        if (resultQuality.isTooNoisy) {
          setRecordingState("too_noisy");
          setErrorMessage("Too much noise. Move the phone closer and try again.");
          resolve(null);
          return;
        }

        setAudioBlob(audioBlob);
        setRecordingState("ready_to_upload");
        resolve(audioBlob);
      };

      mediaRecorder.current.stop();
    });
  }, [buildQuality, cleanupStream, stopMetering]);

  stopRecordingRef.current = stopRecording;

  const cancelRecording = useCallback(() => {
    cleanupAudioGraph();
    cleanupStream();
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
    mediaRecorder.current = null;
    audioChunks.current = [];
    setIsRecording(false);
    setIsProcessing(false);
    setRecordingState("idle");
    resetRecording();
  }, [cleanupAudioGraph, cleanupStream, resetRecording]);

  const processAudio = useCallback(async (audio: Blob) => {
    setIsProcessing(true);
    setRecordingState("uploading");
    try {
      const form = new FormData();
      form.append("audio", audio, `voice.${mimeToExt(audio.type)}`);

      setRecordingState("processing");
      const response = await apiClient.post("/api/voice/ingest-audio", form, {
        timeout: 90000,
      });
      return response.data;
    } catch (err) {
      setRecordingState("error");
      throw err;
    } finally {
      setIsProcessing(false);
      setRecordingState((state) => (state === "error" ? "error" : "idle"));
    }
  }, []);

  const processTranscript = useCallback(async (transcript: string) => {
    setIsProcessing(true);
    try {
      const response = await apiClient.post("/voice/process", { transcript });
      return response.data;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Accepts pre-fetched base64 audio directly — no extra API call needed
  // Backend already returns confirmationAudio in processAudio response
  const playAudioBase64 = useCallback(async (base64Audio: string): Promise<void> => {
    try {
      const audioUrl = `data:audio/wav;base64,${base64Audio}`;
      const audio = new Audio(audioUrl);
      return new Promise((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = (e) => reject(e);
        audio.play().catch(reject);
      });
    } catch (error) {
      console.error("Audio playback failed:", error);
    }
  }, []);

  // Fallback: fetch TTS on demand when confirmationAudio is null
  const playTTS = useCallback(async (
    text: string,
    lang: string = "pcm-NG"
  ): Promise<void> => {
    try {
      const response = await apiClient.post("/voice/tts", { text, lang });
      await playAudioBase64(response.data.audio);
    } catch (error) {
      console.error("TTS playback failed:", error);
    }
  }, [playAudioBase64]);

  return {
    isRecording,
    isProcessing,
    audioBlob,
    durationMs,
    quality,
    recordingState,
    levelHint,
    errorMessage,
    startRecording,
    stopRecording,
    cancelRecording,
    processAudio,
    processTranscript,
    playAudioBase64,  // use this when confirmationAudio exists in response
    playTTS,          // use this as fallback when confirmationAudio is null
  };
}

function mimeToExt(mimeType: string): string {
  const map: Record<string, string> = {
    "audio/webm": "webm",
    "audio/webm;codecs=opus": "webm",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "video/webm": "webm",
  };
  return map[mimeType] ?? "webm";
}
