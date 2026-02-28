/**
 * Browser microphone capture for PTT: getUserMedia + AudioContext -> PCM 16-bit mono at native rate (base64).
 * No resampling: stream at context sample rate (typically 48kHz) for correct speed and clarity.
 * Must be started from a user gesture so the browser can prompt for mic permission.
 */

function floatTo16BitPcm(float32Array: Float32Array): Uint8Array {
  const len = float32Array.length;
  const buffer = new ArrayBuffer(len * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export interface PttCaptureHandle {
  stop: () => void;
}

/**
 * Create and resume an AudioContext in the current call stack (e.g. inside mousedown).
 * Call this from a user gesture so the context is allowed to start. Pass the result to startPttCapture.
 */
export function createPttAudioContext(): AudioContext {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioContextClass();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// Load from same-origin URL to avoid CSP blocking data: inline script (build can inline worklet as data URL).
function getWorkletUrl(): string {
  if (typeof window === "undefined") return "";
  const base = (import.meta.env?.BASE_URL ?? "/").replace(/\/$/, "");
  const path = base ? `${base}/ptt-processor.worklet.js` : "/ptt-processor.worklet.js";
  return `${window.location.origin}${path}`;
}

/**
 * Start capturing microphone and call onChunk with base64-encoded PCM 16-bit mono at native sample rate.
 * Uses Audio Worklet. No resampling: stream at context sample rate (e.g. 48000) for correct speed and clarity.
 * Pass a context from createPttAudioContext() (called in the same user gesture) so capture is not suspended.
 * Returns a handle with stop() to end capture and release the stream.
 */
export function startPttCapture(
  onChunk: (base64: string, sampleRate: number) => void,
  existingContext?: AudioContext
): Promise<PttCaptureHandle> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      reject(new Error("getUserMedia not supported"));
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(async (stream) => {
        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = existingContext ?? new AudioContextClass();
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        const sampleRate = Math.round(ctx.sampleRate);

        try {
          await ctx.audioWorklet.addModule(getWorkletUrl());
        } catch (err) {
          stream.getTracks().forEach((t) => t.stop());
          reject(err instanceof Error ? err : new Error("Failed to load audio worklet"));
          return;
        }

        const source = ctx.createMediaStreamSource(stream);
        const workletNode = new AudioWorkletNode(ctx, "ptt-pcm-processor");
        workletNode.port.onmessage = (e: MessageEvent<{ samples: ArrayBuffer }>) => {
          const samples = new Float32Array(e.data.samples);
          const pcm = floatTo16BitPcm(samples);
          const base64 = arrayBufferToBase64(pcm.buffer);
          onChunk(base64, sampleRate);
        };
        source.connect(workletNode);

        const stop = () => {
          try {
            workletNode.disconnect();
            source.disconnect();
            stream.getTracks().forEach((t) => t.stop());
            ctx.close();
          } catch {
            // ignore
          }
        };

        resolve({ stop });
      })
      .catch(reject);
  });
}
