/**
 * Play PCM 16-bit 16kHz mono chunks in real time via Web Audio API.
 */
let audioContext: AudioContext | null = null;

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

  const numSamples = bytes.length / 2;
  const buffer = ctx.createBuffer(1, numSamples, 16000);
  const channel = buffer.getChannelData(0);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < numSamples; i++) {
    const s = view.getInt16(i * 2, true);
    channel[i] = s / 32768;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
}
