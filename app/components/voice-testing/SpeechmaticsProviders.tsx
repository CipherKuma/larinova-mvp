"use client";

import { useEffect, useState } from "react";
import { RealtimeTranscriptionProvider } from "@speechmatics/real-time-client-react";
import { PCMAudioRecorderProvider } from "@speechmatics/browser-audio-input-react";

const RECORDING_SAMPLE_RATE = 16_000;

export function SpeechmaticsProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [audioContext, setAudioContext] = useState<AudioContext>();

  useEffect(() => {
    const ctx = new AudioContext({ sampleRate: RECORDING_SAMPLE_RATE });
    setAudioContext(ctx);

    return () => {
      void ctx.close();
    };
  }, []);

  return (
    <RealtimeTranscriptionProvider>
      <PCMAudioRecorderProvider
        workletScriptURL="/js/pcm-audio-worklet.min.js"
        audioContext={audioContext}
      >
        {children}
      </PCMAudioRecorderProvider>
    </RealtimeTranscriptionProvider>
  );
}
