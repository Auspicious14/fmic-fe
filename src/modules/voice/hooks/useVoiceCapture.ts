"use client";

import { useState, useCallback, useRef } from "react";
import apiClient from "@/shared/lib/api-client";

const MIN_RECORDING_MS = 1500;

export function useVoiceCapture() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingStartTime = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Pick best supported mime type — single recorder, no duplication
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg']
        .find(type => MediaRecorder.isTypeSupported(type)) ?? '';

      const recorder = new MediaRecorder(stream, {
        ...(mimeType && { mimeType }),
        audioBitsPerSecond: 128000,
      });

      audioChunks.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data);
      };

      recorder.start(1000);
      mediaRecorder.current = recorder;
      recordingStartTime.current = Date.now();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      throw new Error("Could not access microphone. Check browser permissions.");
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorder.current) {
        return reject(new Error("No active recording found"));
      }

      // Guard: reject if recording was too short
      const duration = Date.now() - recordingStartTime.current;
      if (duration < MIN_RECORDING_MS) {
        mediaRecorder.current.stop();
        mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
        return reject(new Error("Hold the button while speaking — recording too short"));
      }

      mediaRecorder.current.onstop = () => {
        const mimeType = mediaRecorder.current?.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        resolve(audioBlob);
      };

      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
    });
  }, []);

  const processAudio = useCallback(async (audio: Blob) => {
    setIsProcessing(true);
    try {
      const form = new FormData();
      // Pass actual mime type so FastAPI receives correct content type
      form.append("audio", audio, `voice.${mimeToExt(audio.type)}`);
      form.append("mime_type", audio.type || "audio/webm");

      const response = await apiClient.post("/voice/ingest-audio", form, {
        headers: { "Content-Type": "multipart/form-data" },
        // Long timeout — HF Space cold start can take 30-60s
        timeout: 90000,
      });
      return response.data;
    } finally {
      setIsProcessing(false);
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
    startRecording,
    stopRecording,
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