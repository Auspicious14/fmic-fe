/**
 * Converts any recording the browser can play (webm/opus from Chrome,
 * mp4/aac from Safari, ogg from Firefox) into a 16 kHz mono 16-bit WAV.
 *
 * Why in the browser: the backend runs on serverless hosting with no ffmpeg,
 * and Gemini reliably accepts WAV but not every browser format. A 30-second
 * note is ~1 MB, well under upload limits.
 */
const TARGET_SAMPLE_RATE = 16000;

interface WebKitAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export async function convertToWav16kMono(blob: Blob): Promise<Blob> {
  const AudioContextCtor =
    window.AudioContext || (window as WebKitAudioWindow).webkitAudioContext;
  if (!AudioContextCtor || typeof OfflineAudioContext === "undefined") {
    throw new Error("Web Audio is not available in this browser");
  }

  const decodeContext = new AudioContextCtor();
  let decoded: AudioBuffer;
  try {
    decoded = await decodeContext.decodeAudioData(await blob.arrayBuffer());
  } finally {
    decodeContext.close().catch(() => {});
  }

  // Resample + downmix to mono by rendering through an offline context.
  const frameCount = Math.ceil(decoded.duration * TARGET_SAMPLE_RATE);
  const offline = new OfflineAudioContext(1, frameCount, TARGET_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();

  return encodeWav(rendered.getChannelData(0), TARGET_SAMPLE_RATE);
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}
