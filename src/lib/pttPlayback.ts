/**
 * Play PCM 16-bit mono chunks in real time via Web Audio API.
 * Uses sampleRate from the stream (e.g. 48000) for correct speed and clarity.
 * Chunks are scheduled back-to-back so they don't overlap.
 */
/** Default when sender doesn't pass sample rate. Use 48k so 48k capture (typical) plays at correct speed. */
const FALLBACK_SAMPLE_RATE = 48000;
/** Don't schedule more than this far ahead to avoid buildup. */
const MAX_SCHEDULE_AHEAD = 0.12;

let audioContext: AudioContext | null = null;
let nextStartTime = 0;

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

export function playPcmBase64Chunk(base64: string, sampleRate?: number): void {
  try {
    const sr = sampleRate != null && sampleRate > 0 ? sampleRate : FALLBACK_SAMPLE_RATE;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    playPcmBytes(bytes, sr);
  } catch {
    // ignore decode errors
  }
}

export function playPcmBytes(bytes: Uint8Array, sampleRate: number = FALLBACK_SAMPLE_RATE): void {
  const ctx = getContext();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const numSamples = Math.floor(bytes.length / 2);
  if (numSamples <= 0) return;

  const sr = sampleRate > 0 ? sampleRate : FALLBACK_SAMPLE_RATE;
  const buffer = ctx.createBuffer(1, numSamples, sr);
  const channel = buffer.getChannelData(0);
  const view = new DataView(bytes.buffer, bytes.byteOffset, numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    let s = view.getInt16(i * 2, true) / 32768;
    s = Math.tanh(s);
    channel[i] = s;
  }

  const duration = numSamples / sr;
  let when = Math.max(ctx.currentTime, nextStartTime);
  if (when > ctx.currentTime + MAX_SCHEDULE_AHEAD) {
    when = ctx.currentTime;
    nextStartTime = when;
  }
  nextStartTime = when + duration;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(when);
}

/** Call when a new PTT stream starts so the first chunk plays immediately instead of after old schedule. */
export function resetPttPlaybackSchedule(): void {
  nextStartTime = 0;
}
