/**
 * Audio Worklet processor: reads mic input, mixes to mono, posts Float32Array to main thread.
 * Main thread resamples to 16 kHz and encodes as PCM base64.
 */
class PttPcmProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = inputs[0];
    if (!input || !input.length) return true;
    const ch0 = input[0];
    if (!ch0 || ch0.length === 0) return true;
    let mono = ch0;
    if (input.length > 1 && input[1].length === ch0.length) {
      const m = new Float32Array(ch0.length);
      const ch1 = input[1];
      for (let i = 0; i < ch0.length; i++) m[i] = (ch0[i] + ch1[i]) / 2;
      mono = m;
    }
    const copy = new Float32Array(mono.length);
    copy.set(mono);
    this.port.postMessage({ samples: copy.buffer }, [copy.buffer]);
    return true;
  }
}

registerProcessor("ptt-pcm-processor", PttPcmProcessor);
