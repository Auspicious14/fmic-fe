import { type AudioQuality } from "../index";
export type { AudioQuality };

export const MIN_RECORDING_MS = 700;
export const MAX_RECORDING_MS = 9000;
export const NOISE_SAMPLE_MS = 500;

export function calculateRms(samples: Float32Array | number[]): number {
  if (!samples.length) return 0;

  let sumSquares = 0;
  for (let i = 0; i < samples.length; i += 1) {
    sumSquares += samples[i] * samples[i];
  }

  return Math.sqrt(sumSquares / samples.length);
}

export function classifyDuration(durationMs: number, minMs = MIN_RECORDING_MS) {
  return {
    durationMs,
    isTooShort: durationMs < minMs,
  };
}

export function estimateSnr(speechLevel: number, noiseFloor: number): number {
  if (speechLevel <= 0) return 0;
  const safeNoise = Math.max(noiseFloor, 0.001);
  return 20 * Math.log10(speechLevel / safeNoise);
}

export function classifyNoise({
  speechLevel,
  noiseFloor,
  durationMs,
  minDurationMs = MIN_RECORDING_MS,
  minSpeechRms = 0.025,
  minSnrDb = 7,
}: {
  speechLevel: number;
  noiseFloor: number;
  durationMs: number;
  minDurationMs?: number;
  minSpeechRms?: number;
  minSnrDb?: number;
}): AudioQuality {
  const snr = estimateSnr(speechLevel, noiseFloor);
  const { isTooShort } = classifyDuration(durationMs, minDurationMs);
  const hasWeakSpeech = speechLevel < minSpeechRms;

  return {
    noiseFloor,
    speechLevel,
    snr,
    isTooShort,
    isTooNoisy: !isTooShort && (hasWeakSpeech || snr < minSnrDb),
  };
}

export function getMicGuidance(currentRms: number, noiseFloor: number): "Listening..." | "Move closer" | "Good level" {
  const snr = estimateSnr(currentRms, noiseFloor);
  if (currentRms < 0.018 || snr < 5) return "Move closer";
  if (currentRms > 0.04 && snr >= 7) return "Good level";
  return "Listening...";
}
