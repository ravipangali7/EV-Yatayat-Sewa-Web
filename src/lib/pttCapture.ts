/**
 * Browser microphone capture for PTT: getUserMedia + AudioContext -> PCM 16-bit 16kHz mono (base64).
 * Must be started from a user gesture so the browser can prompt for mic permission.
 * Batches ~20ms of audio per chunk for clearer streaming.
 */

const TARGET_SAMPLE_RATE = 16000;
/** Send chunks of this many samples at 16kHz (~20ms) for stable playback. */
const BATCH_SAMPLES_16K = 320;

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

function resampleTo16k(input: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === TARGET_SAMPLE_RATE) return input;
  const ratio = inputSampleRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const idx = Math.floor(srcIndex);
    const frac = srcIndex - idx;
    const next = Math.min(idx + 1, input.length - 1);
    output[i] = input[idx] * (1 - frac) + input[next] * frac;
  }
  return output;
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
 * Start capturing microphone and call onChunk with base64-encoded PCM 16-bit 16kHz mono.
 * Uses Audio Worklet (replaces deprecated ScriptProcessorNode).
 * Pass a context from createPttAudioContext() (called in the same user gesture) so capture is not suspended.
 * Returns a handle with stop() to end capture and release the stream.
 */
export function startPttCapture(
  onChunk: (base64: string) => void,
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
        const inputSampleRate = ctx.sampleRate;

        try {
          await ctx.audioWorklet.addModule(getWorkletUrl());
        } catch (err) {
          stream.getTracks().forEach((t) => t.stop());
          reject(err instanceof Error ? err : new Error("Failed to load audio worklet"));
          return;
        }

        const source = ctx.createMediaStreamSource(stream);
        const workletNode = new AudioWorkletNode(ctx, "ptt-pcm-processor");
        const batch: number[] = [];
        const flushBatch = (float32Samples: Float32Array) => {
          const resampled = resampleTo16k(float32Samples, inputSampleRate);
          const pcm = floatTo16BitPcm(resampled);
          const base64 = arrayBufferToBase64(pcm.buffer);
          onChunk(base64);
        };
        workletNode.port.onmessage = (e: MessageEvent<{ samples: ArrayBuffer }>) => {
          const samples = new Float32Array(e.data.samples);
          const resampled = resampleTo16k(samples, inputSampleRate);
          for (let i = 0; i < resampled.length; i++) batch.push(resampled[i]);
          while (batch.length >= BATCH_SAMPLES_16K) {
            const chunk = batch.splice(0, BATCH_SAMPLES_16K);
            flushBatch(new Float32Array(chunk));
          }
        };
        source.connect(workletNode);

        const stop = () => {
          try {
            if (batch.length > 0) {
              flushBatch(new Float32Array(batch.splice(0, batch.length)));
            }
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
