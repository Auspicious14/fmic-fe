export interface AudioQuality {
  noiseFloor: number;
  speechLevel: number;
  snr: number;
  isTooNoisy: boolean;
  isTooShort: boolean;
}

export interface VoiceTranscript {
  id: string;
  text: string;
  confidence: number;
  timestamp: string;
}

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'error';
