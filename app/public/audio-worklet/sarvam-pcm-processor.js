// Downsamples the mic stream from the AudioContext sampleRate (typically
// 48000 Hz, Float32 in [-1, 1]) to 16000 Hz Int16 PCM and posts ~100ms
// frames to the main thread. The main thread base64-encodes and ships
// each frame over WebSocket to the Sarvam STT proxy.

class SarvamPcmProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = options?.processorOptions || {};
    this.targetSampleRate = opts.targetSampleRate || 16000;
    this.frameMs = opts.frameMs || 100;
    this.targetSamplesPerFrame = Math.round(
      (this.targetSampleRate * this.frameMs) / 1000,
    );
    this.ratio = sampleRate / this.targetSampleRate;
    this.resampleBuffer = [];
    this.outBuffer = new Int16Array(this.targetSamplesPerFrame);
    this.outIndex = 0;
    this.fractionalIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel || channel.length === 0) return true;

    // Linear-interpolation downsample from sampleRate → targetSampleRate.
    // Maintains a fractional sample cursor across calls so we don't lose
    // fidelity at chunk boundaries.
    let i = this.fractionalIndex;
    while (i < channel.length) {
      const i0 = Math.floor(i);
      const i1 = Math.min(i0 + 1, channel.length - 1);
      const t = i - i0;
      const sample = channel[i0] * (1 - t) + channel[i1] * t;

      // Float32 [-1,1] → Int16 [-32768, 32767]
      let s = Math.max(-1, Math.min(1, sample));
      this.outBuffer[this.outIndex++] = s < 0 ? s * 0x8000 : s * 0x7fff;

      if (this.outIndex >= this.targetSamplesPerFrame) {
        // Send the completed frame; copy because we mutate outBuffer
        const frame = new Int16Array(this.outBuffer);
        this.port.postMessage(frame.buffer, [frame.buffer]);
        this.outIndex = 0;
      }

      i += this.ratio;
    }
    this.fractionalIndex = i - channel.length;
    return true;
  }
}

registerProcessor("sarvam-pcm-processor", SarvamPcmProcessor);
