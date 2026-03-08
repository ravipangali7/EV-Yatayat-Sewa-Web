/**
 * Audio Worklet: mic input -> mono, noise gate, AGC -> Float32Array to main thread.
 * Main thread encodes as PCM base64.
 */
const GATE_THRESHOLD = 0.018;
const GATE_ATTACK = 0.35;
const GATE_RELEASE = 0.08;
const AGC_TARGET = 0.3;
const AGC_SMOOTH = 0.12;
const AGC_MAX_GAIN = 4;
const AGC_EPS = 1e-6;

function rms(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    sum += s * s;
  }
  return Math.sqrt(sum / (samples.length || 1));
}

class PttPcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._gateOpen = 0;
    this._runningRms = 0.01;
  }

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
    const blockRms = rms(mono);
    this._runningRms = AGC_SMOOTH * blockRms + (1 - AGC_SMOOTH) * this._runningRms;
    if (blockRms >= GATE_THRESHOLD) {
      this._gateOpen = Math.min(1, this._gateOpen + GATE_ATTACK);
    } else {
      this._gateOpen = Math.max(0, this._gateOpen - GATE_RELEASE);
    }
    const gain = Math.min(AGC_MAX_GAIN, AGC_TARGET / (this._runningRms + AGC_EPS));
    const out = new Float32Array(mono.length);
    for (let i = 0; i < mono.length; i++) {
      let s = mono[i] * gain * this._gateOpen;
      s = Math.max(-1, Math.min(1, s));
      out[i] = s;
    }
    this.port.postMessage({ samples: out.buffer }, [out.buffer]);
    return true;
  }
}

registerProcessor("ptt-pcm-processor", PttPcmProcessor);
