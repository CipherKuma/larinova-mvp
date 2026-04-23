"use client";

import { useEffect, useRef } from "react";
import { Orb, type AgentState } from "@/components/ui/orb";

interface ListeningOrbProps {
  stream?: MediaStream | null;
  agentState?: AgentState;
  size?: number;
  colors?: [string, string];
  className?: string;
}

const EMERALD_GRADIENT: [string, string] = ["#34d399", "#059669"];

export function ListeningOrb({
  stream,
  agentState,
  size = 240,
  colors = EMERALD_GRADIENT,
  className,
}: ListeningOrbProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const bufferRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const volumeRef = useRef<number>(0);

  useEffect(() => {
    if (!stream) {
      sourceRef.current?.disconnect();
      sourceRef.current = null;
      analyserRef.current = null;
      bufferRef.current = null;
      volumeRef.current = 0;
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
      audioCtxRef.current = null;
      return;
    }

    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.75;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;
    bufferRef.current = new Uint8Array(new ArrayBuffer(analyser.fftSize));

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    return () => {
      source.disconnect();
      if (ctx.state !== "closed") {
        ctx.close().catch(() => {});
      }
    };
  }, [stream]);

  const getInputVolume = () => {
    const analyser = analyserRef.current;
    const buf = bufferRef.current;
    if (!analyser || !buf) return 0;
    analyser.getByteTimeDomainData(buf);
    let sumSquares = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128;
      sumSquares += v * v;
    }
    const rms = Math.sqrt(sumSquares / buf.length);
    const scaled = Math.min(1, rms * 3.5);
    volumeRef.current = volumeRef.current * 0.6 + scaled * 0.4;
    return volumeRef.current;
  };

  const derivedState: AgentState =
    agentState !== undefined ? agentState : stream ? "listening" : null;

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Orb
        colors={colors}
        agentState={derivedState}
        volumeMode="manual"
        getInputVolume={getInputVolume}
      />
    </div>
  );
}
