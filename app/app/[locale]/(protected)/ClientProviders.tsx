"use client";

import { useEffect, useState } from "react";
import { RealtimeTranscriptionProvider } from "@speechmatics/real-time-client-react";
import { PCMAudioRecorderProvider } from "@speechmatics/browser-audio-input-react";
import { SidebarProvider } from "@/components/layout/SidebarContext";

// Recommended sample rate for speech
const RECORDING_SAMPLE_RATE = 16_000;

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [audioContext, setAudioContext] = useState<AudioContext | undefined>(
    undefined,
  );

  useEffect(() => {
    // Create AudioContext on client side only
    const ctx = new AudioContext({ sampleRate: RECORDING_SAMPLE_RATE });
    setAudioContext(ctx);

    return () => {
      ctx.close();
    };
  }, []);

  return (
    <SidebarProvider>
      <RealtimeTranscriptionProvider>
        <PCMAudioRecorderProvider
          workletScriptURL="/js/pcm-audio-worklet.min.js"
          audioContext={audioContext}
        >
          {children}
        </PCMAudioRecorderProvider>
      </RealtimeTranscriptionProvider>
    </SidebarProvider>
  );
}
