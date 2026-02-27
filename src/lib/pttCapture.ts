/**
 * Browser microphone capture for PTT: getUserMedia + AudioContext -> PCM 16-bit 16kHz mono (base64).
 * Must be started from a user gesture so the browser can prompt for mic permission.
 */

const TARGET_SAMPLE_RATE = 16000;

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
 * Start capturing microphone and call onChunk with base64-encoded PCM 16-bit 16kHz mono.
 * Call this from a user gesture (e.g. mousedown on PTT button) so getUserMedia can prompt.
 * Returns a handle with stop() to end capture and release the stream.
 */
export function startPttCapture(onChunk: (base64: string) => void): Promise<PttCaptureHandle> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      reject(new Error("getUserMedia not supported"));
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass();
        const source = ctx.createMediaStreamSource(stream);
        const bufferSize = 4096;
        const numChannels = 2; // mic often stereo; we mix to mono
        const processor = ctx.createScriptProcessor(bufferSize, numChannels, 1);
        const inputSampleRate = ctx.sampleRate;

        processor.onaudioprocess = (e: AudioProcessingEvent) => {
          const ib = e.inputBuffer;
          const mono =
            ib.numberOfChannels === 1
              ? ib.getChannelData(0)
              : (() => {
                  const left = ib.getChannelData(0);
                  const right = ib.getChannelData(1);
                  const m = new Float32Array(left.length);
                  for (let i = 0; i < left.length; i++) m[i] = (left[i] + right[i]) / 2;
                  return m;
                })();
          const resampled = resampleTo16k(mono, ib.sampleRate);
          const pcm = floatTo16BitPcm(resampled);
          const base64 = arrayBufferToBase64(pcm.buffer);
          onChunk(base64);
          const out = e.outputBuffer.getChannelData(0);
          out.fill(0);
        };

        source.connect(processor);
        processor.connect(ctx.destination);

        const stop = () => {
          try {
            processor.disconnect();
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
