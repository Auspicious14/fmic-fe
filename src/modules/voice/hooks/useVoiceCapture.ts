
"use client";

import { useState, useCallback, useRef } from 'react';
import apiClient from '@/shared/lib/api-client';

export function useVoiceCapture() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus',
      };
      
      if (!MediaRecorder.isTypeSupported(options.mimeType as string)) {
        options.mimeType = 'audio/webm';
      }
      
      if (!MediaRecorder.isTypeSupported(options.mimeType as string)) {
        options.mimeType = 'audio/ogg';
      }

      mediaRecorder.current = new MediaRecorder(stream, options);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.start(1000); // 1s chunks for potential streaming
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      throw new Error("Could not access microphone");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    return new Promise<Blob>((resolve, reject) => {
      if (!mediaRecorder.current) return reject("No recorder found");

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: mediaRecorder.current?.mimeType || 'audio/webm' });
        resolve(audioBlob);
      };

      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    });
  }, []);

  const processAudio = useCallback(async (audio: Blob) => {
    setIsProcessing(true);
    try {
      const form = new FormData();
      form.append('audio', audio, 'voice.webm');
      const response = await apiClient.post('/voice/ingest-audio', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processTranscript = useCallback(async (transcript: string) => {
    setIsProcessing(true);
    try {
      const response = await apiClient.post('/voice/process', { transcript });
      return response.data;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const playTTS = useCallback(async (text: string, lang: string = 'pcm-NG') => {
    try {
      const response = await apiClient.post('/voice/tts', { text, lang });
      const audioBase64 = response.data.audio;
      const audioUrl = `data:audio/wav;base64,${audioBase64}`;
      const audio = new Audio(audioUrl);
      
      return new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = (e) => reject(e);
        audio.play().catch(reject);
      });
    } catch (error) {
      console.error('TTS playback failed:', error);
    }
  }, []);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    processAudio,
    processTranscript,
    playTTS,
  };
}
