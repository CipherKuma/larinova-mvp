"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PCM_WORKLET_SOURCE } from "@/lib/stt/pcm-worklet-source";

interface UseSarvamStreamingSTTOptions {
  // Omit for onboarding sessions — token is issued under "onboarding" purpose
  // when consultationId is not provided.
  consultationId?: string;
  languageCode?: string;
  mode?: "transcribe" | "translate" | "verbatim" | "translit" | "codemix";
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

interface StreamingSTTState {
  isRecording: boolean;
  isConnecting: boolean;
  transcript: string;
  interimText: string;
  duration: number;
  error: string | null;
  permissionDenied: boolean;
  speaking: boolean;
}

const TARGET_SAMPLE_RATE = 16000;
const FRAME_MS = 100;

// Convert ArrayBuffer of Int16 PCM to base64 without spawning a giant
// intermediate string. Browser-only.
function pcmToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function useSarvamStreamingSTT(opts: UseSarvamStreamingSTTOptions) {
  const {
    consultationId,
    languageCode = "unknown",
    mode = "codemix",
    onTranscript,
    onError,
    onSpeechStart,
    onSpeechEnd,
  } = opts;

  const [state, setState] = useState<StreamingSTTState>({
    isRecording: false,
    isConnecting: false,
    transcript: "",
    interimText: "",
    duration: 0,
    error: null,
    permissionDenied: false,
    speaking: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const transcriptRef = useRef<string>("");
  // Mirrors detected language from server `language_code` field. Compatible
  // with the older useSarvamSTT hook so consumers can read the same ref.
  const detectedLanguageRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const waitForTranscriptResolversRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const cleanup = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    try {
      workletNodeRef.current?.disconnect();
    } catch {
      // ignore
    }
    workletNodeRef.current = null;
    try {
      sourceNodeRef.current?.disconnect();
    } catch {
      // ignore
    }
    sourceNodeRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (wsRef.current && wsRef.current.readyState <= 1) {
      try {
        wsRef.current.close(1000, "client done");
      } catch {
        // ignore
      }
    }
    wsRef.current = null;
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const handleServerMessage = useCallback(
    (raw: string) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      // Sarvam wraps events both as flat { type: "transcript", text }
      // and as nested { type: "data", data: { transcript, ... } }.
      // Handle both.
      const type = msg.type as string | undefined;
      const data = (msg.data as Record<string, unknown> | undefined) || msg;

      if (type === "speech_start" || data?.signal_type === "START_SPEECH") {
        if (mountedRef.current) {
          setState((s) => ({ ...s, speaking: true }));
        }
        onSpeechStart?.();
        return;
      }
      if (type === "speech_end" || data?.signal_type === "END_SPEECH") {
        if (mountedRef.current) {
          setState((s) => ({ ...s, speaking: false }));
        }
        onSpeechEnd?.();
        return;
      }

      const text =
        (msg.text as string | undefined) ||
        (msg.transcript as string | undefined) ||
        (data?.text as string | undefined) ||
        (data?.transcript as string | undefined);
      if (!text) return;

      if (type === "transcript" || type === "data") {
        const trimmed = text.trim();
        if (!trimmed) return;
        transcriptRef.current = transcriptRef.current
          ? `${transcriptRef.current} ${trimmed}`
          : trimmed;
        const lang =
          (msg.language_code as string | undefined) ||
          (data?.language_code as string | undefined);
        if (lang) detectedLanguageRef.current = lang;
        if (mountedRef.current) {
          setState((s) => ({
            ...s,
            transcript: transcriptRef.current,
            interimText: "",
          }));
        }
        onTranscript?.(trimmed, true);
        waitForTranscriptResolversRef.current.forEach((resolve) => resolve());
        waitForTranscriptResolversRef.current = [];
        return;
      }

      if (type === "interim" || type === "partial") {
        if (mountedRef.current) {
          setState((s) => ({ ...s, interimText: text }));
        }
        onTranscript?.(text, false);
      }
    },
    [onTranscript, onSpeechStart, onSpeechEnd],
  );

  const start = useCallback(async () => {
    if (state.isRecording || state.isConnecting) return;

    setState((s) => ({
      ...s,
      error: null,
      permissionDenied: false,
      isConnecting: true,
      transcript: "",
      interimText: "",
      duration: 0,
      speaking: false,
    }));
    transcriptRef.current = "";

    try {
      // 1. Get the proxy URL + JWT from the server. consultationId is omitted
      // for onboarding sessions; the server treats that as purpose=onboarding.
      const tokenRes = await fetch("/api/consultation/stt-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consultationId ? { consultationId } : {}),
      });
      if (!tokenRes.ok) {
        const errBody = await tokenRes.json().catch(() => ({}));
        throw new Error(errBody?.error || "Failed to get STT token");
      }
      const { token, wsUrl } = (await tokenRes.json()) as {
        token: string;
        wsUrl: string;
      };

      // 2. Get mic
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      // 3. Open WebSocket with all tuning params for Sarvam
      const params = new URLSearchParams({
        token,
        model: "saaras:v3",
        "language-code": languageCode,
        mode,
        sample_rate: String(TARGET_SAMPLE_RATE),
        high_vad_sensitivity: "true",
        vad_signals: "true",
        input_audio_codec: "pcm_s16le",
        flush_signal: "true",
      });
      const ws = new WebSocket(`${wsUrl}?${params.toString()}`);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      const wsReady = new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("STT WebSocket open timed out"));
        }, 10000);
        ws.addEventListener(
          "open",
          () => {
            clearTimeout(timeoutId);
            resolve();
          },
          { once: true },
        );
        ws.addEventListener(
          "error",
          (ev) => {
            clearTimeout(timeoutId);
            reject(new Error("STT WebSocket error"));
          },
          { once: true },
        );
      });

      ws.addEventListener("message", (ev) => {
        if (typeof ev.data === "string") {
          handleServerMessage(ev.data);
        }
      });
      ws.addEventListener("close", (ev) => {
        waitForTranscriptResolversRef.current.forEach((resolve) => resolve());
        waitForTranscriptResolversRef.current = [];
        if (mountedRef.current) {
          setState((s) => ({
            ...s,
            isRecording: false,
            isConnecting: false,
          }));
        }
        if (ev.code !== 1000 && ev.code !== 1005) {
          onError?.(`STT connection closed: ${ev.code} ${ev.reason}`);
        }
      });

      await wsReady;

      // 4. Set up audio pipeline: mic → AudioContext → AudioWorklet
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      // Load the worklet from a Blob URL rather than /audio-worklet/*.js.
      // The Serwist service worker was intercepting that path and returning
      // 406 (likely a defaultCache mismatch on request.destination =
      // "audioworklet"); a blob: URL is same-origin but never goes through
      // the SW fetch handler.
      const workletBlob = new Blob([PCM_WORKLET_SOURCE], {
        type: "application/javascript",
      });
      const workletBlobUrl = URL.createObjectURL(workletBlob);
      try {
        await audioCtx.audioWorklet.addModule(workletBlobUrl);
      } finally {
        URL.revokeObjectURL(workletBlobUrl);
      }
      const source = audioCtx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      const workletNode = new AudioWorkletNode(
        audioCtx,
        "sarvam-pcm-processor",
        {
          processorOptions: {
            targetSampleRate: TARGET_SAMPLE_RATE,
            frameMs: FRAME_MS,
          },
          numberOfInputs: 1,
          numberOfOutputs: 0,
          channelCount: 1,
        },
      );
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return;
        }
        const audioBase64 = pcmToBase64(e.data);
        wsRef.current.send(
          JSON.stringify({
            audio: {
              data: audioBase64,
              sample_rate: TARGET_SAMPLE_RATE,
              encoding: "audio/pcm_s16le",
            },
          }),
        );
      };

      source.connect(workletNode);

      startTimeRef.current = Date.now();
      durationTimerRef.current = setInterval(() => {
        if (mountedRef.current) {
          setState((s) => ({
            ...s,
            duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
          }));
        }
      }, 500);

      if (mountedRef.current) {
        setState((s) => ({
          ...s,
          isRecording: true,
          isConnecting: false,
        }));
      }
    } catch (err: unknown) {
      cleanup();
      const error = err as Error;
      const isPermission =
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError";
      if (mountedRef.current) {
        setState((s) => ({
          ...s,
          permissionDenied: isPermission,
          error: isPermission
            ? "Microphone access denied"
            : error.message || "Failed to start recording",
          isConnecting: false,
          isRecording: false,
        }));
      }
      onError?.(error.message || "Failed to start streaming STT");
    }
  }, [
    consultationId,
    languageCode,
    mode,
    handleServerMessage,
    cleanup,
    onError,
    state.isRecording,
    state.isConnecting,
  ]);

  const waitForFinalTranscript = useCallback((timeoutMs = 2500) => {
    return new Promise<void>((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        resolve();
      };
      const timeoutId = setTimeout(done, timeoutMs);
      waitForTranscriptResolversRef.current.push(done);
    });
  }, []);

  const stop = useCallback(async () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    try {
      workletNodeRef.current?.disconnect();
    } catch {
      // ignore
    }
    workletNodeRef.current = null;
    try {
      sourceNodeRef.current?.disconnect();
    } catch {
      // ignore
    }
    sourceNodeRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: "flush" }));
      } catch {
        // ignore
      }
    }
    await waitForFinalTranscript();
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) {
      try {
        wsRef.current.close(1000, "client done");
      } catch {
        // ignore
      }
    }
    wsRef.current = null;
    if (mountedRef.current) {
      setState((s) => ({
        ...s,
        isRecording: false,
        isConnecting: false,
        interimText: "",
        speaking: false,
      }));
    }
  }, [waitForFinalTranscript]);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = "";
    setState((s) => ({ ...s, transcript: "", interimText: "" }));
  }, []);

  return {
    ...state,
    start,
    stop,
    resetTranscript,
    streamRef,
    transcriptRef,
    detectedLanguageRef,
  };
}
