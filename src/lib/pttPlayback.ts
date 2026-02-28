/**
 * Play PCM 16-bit 16kHz mono chunks in real time via Web Audio API.
 * Chunks are scheduled back-to-back so they don't overlap (clear speech).
 */
const PLAYBACK_SAMPLE_RATE = 16000;

let audioContext: AudioContext | null = null;
/** When the next chunk should start so playback is continuous. */
let nextStartTime = 0;

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

export function playPcmBase64Chunk(base64: string): void {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    playPcmBytes(bytes);
  } catch {
    // ignore decode errors
  }
}

export function playPcmBytes(bytes: Uint8Array): void {
  const ctx = getContext();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const numSamples = Math.floor(bytes.length / 2);
  if (numSamples <= 0) return;

  const buffer = ctx.createBuffer(1, numSamples, PLAYBACK_SAMPLE_RATE);
  const channel = buffer.getChannelData(0);
  const view = new DataView(bytes.buffer, bytes.byteOffset, numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    const s = view.getInt16(i * 2, true);
    channel[i] = s / 32768;
  }

  const duration = numSamples / PLAYBACK_SAMPLE_RATE;
  const when = Math.max(ctx.currentTime, nextStartTime);
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
