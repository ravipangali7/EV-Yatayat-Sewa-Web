/**
 * Controllable playback for recorded PCM (16-bit, 16 kHz, mono).
 * Supports play, pause, resume from offset, and progress callbacks.
 */
const SAMPLE_RATE = 16000;
let audioContext: AudioContext | null = null;
let currentBuffer: AudioBuffer | null = null;
let currentDurationSeconds = 0;
let currentSource: AudioBufferSourceNode | null = null;
let startTime = 0;
let startOffset = 0;
let rafId: number | null = null;

function getContext(): AudioContext {
  if (!audioContext) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContext = new Ctx();
  }
  if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
  return audioContext;
}

function pcmBytesToAudioBuffer(bytes: Uint8Array, ctx: AudioContext): AudioBuffer {
  const numSamples = Math.floor(bytes.length / 2);
  if (numSamples <= 0) throw new Error("Invalid PCM length");
  const buffer = ctx.createBuffer(1, numSamples, SAMPLE_RATE);
  const channel = buffer.getChannelData(0);
  const view = new DataView(bytes.buffer, bytes.byteOffset, numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    const s = view.getInt16(i * 2, true);
    channel[i] = s / 32768;
  }
  return buffer;
}

export async function loadFromBlob(blob: Blob): Promise<{ durationSeconds: number }> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const ctx = getContext();
  currentBuffer = pcmBytesToAudioBuffer(bytes, ctx);
  currentDurationSeconds = currentBuffer.length / SAMPLE_RATE;
  return { durationSeconds: currentDurationSeconds };
}

function tick(
  onProgress: (current: number, duration: number) => void,
  onEnded: () => void
): void {
  if (!currentSource || !currentBuffer) return;
  const ctx = getContext();
  const current = startOffset + (ctx.currentTime - startTime);
  const duration = currentDurationSeconds;
  onProgress(current, duration);
  if (current >= duration - 0.05) {
    if (rafId != null) cancelAnimationFrame(rafId);
    rafId = null;
    onEnded();
    return;
  }
  rafId = requestAnimationFrame(() => tick(onProgress, onEnded));
}

export function play(
  offsetSeconds: number,
  onProgress: (current: number, duration: number) => void,
  onEnded: () => void
): void {
  if (!currentBuffer) return;
  stop();
  const ctx = getContext();
  const source = ctx.createBufferSource();
  source.buffer = currentBuffer;
  source.connect(ctx.destination);
  source.onended = () => {
    currentSource = null;
    if (rafId != null) cancelAnimationFrame(rafId);
    rafId = null;
    onEnded();
  };
  startTime = ctx.currentTime;
  startOffset = Math.max(0, Math.min(offsetSeconds, currentDurationSeconds));
  source.start(0, startOffset);
  currentSource = source;
  rafId = requestAnimationFrame(() => tick(onProgress, onEnded));
}

export function pause(): number {
  const ctx = getContext();
  const current = currentSource
    ? startOffset + (ctx.currentTime - startTime)
    : 0;
  if (rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      // already stopped
    }
    currentSource = null;
  }
  return Math.min(current, currentDurationSeconds);
}

export function stop(): void {
  pause();
}

export function getDuration(): number {
  return currentDurationSeconds;
}
