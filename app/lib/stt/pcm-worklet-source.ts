// PCM downsample worklet, inlined as a string so we can hand it to
// AudioWorklet.addModule() via a blob URL. Loading from /public/ broke when
// the Serwist service worker intercepted the request and returned 406; the
// blob-URL path bypasses the SW entirely. Code is identical to the original
// at public/audio-worklet/sarvam-pcm-processor.js (which is now unused).

export const PCM_WORKLET_SOURCE = `
class SarvamPcmProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = (options && options.processorOptions) || {};
    this.targetSampleRate = opts.targetSampleRate || 16000;
    this.frameMs = opts.frameMs || 100;
    this.targetSamplesPerFrame = Math.round(
      (this.targetSampleRate * this.frameMs) / 1000
    );
    this.ratio = sampleRate / this.targetSampleRate;
    this.outBuffer = new Int16Array(this.targetSamplesPerFrame);
    this.outIndex = 0;
    this.fractionalIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel || channel.length === 0) return true;

    let i = this.fractionalIndex;
    while (i < channel.length) {
      const i0 = Math.floor(i);
      const i1 = Math.min(i0 + 1, channel.length - 1);
      const t = i - i0;
      const sample = channel[i0] * (1 - t) + channel[i1] * t;
      let s = Math.max(-1, Math.min(1, sample));
      this.outBuffer[this.outIndex++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      if (this.outIndex >= this.targetSamplesPerFrame) {
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
`;
