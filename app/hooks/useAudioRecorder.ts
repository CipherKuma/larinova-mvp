"use client";

import { useRef, useState, useCallback } from "react";

interface UseAudioRecorderOptions {
  chunkIntervalMs?: number;
  maxDurationMs?: number;
  onChunk?: (blob: Blob) => void;
  onMaxDuration?: () => void;
}

interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  isStopping: boolean;
  duration: number;
  error: string | null;
  permissionDenied: boolean;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const {
    chunkIntervalMs = 4000,
    maxDurationMs = 15000,
    onChunk,
    onMaxDuration,
  } = options;

  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    isStopping: false,
    duration: 0,
    error: null,
    permissionDenied: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    setState((s) => ({ ...s, isStopping: true }));

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        mediaRecorderRef.current = null;
        streamRef.current = null;
        setState((s) => ({
          ...s,
          isRecording: false,
          isPaused: false,
          isStopping: false,
        }));
      };
      mediaRecorderRef.current.stop();
    } else {
      cleanup();
      setState((s) => ({
        ...s,
        isRecording: false,
        isPaused: false,
        isStopping: false,
      }));
    }
  }, [cleanup]);

  const start = useCallback(async () => {
    try {
      setState((s) => ({ ...s, error: null, permissionDenied: false }));

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          const blob = new Blob([e.data], { type: "audio/webm" });
          onChunk?.(blob);
        }
      };

      recorder.start(chunkIntervalMs);
      startTimeRef.current = Date.now();

      durationTimerRef.current = setInterval(() => {
        setState((s) => ({
          ...s,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 100);

      if (maxDurationMs) {
        timerRef.current = setTimeout(() => {
          stop();
          onMaxDuration?.();
        }, maxDurationMs);
      }

      setState((s) => ({
        ...s,
        isRecording: true,
        isPaused: false,
        duration: 0,
      }));
    } catch (err: unknown) {
      const error = err as Error;
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setState((s) => ({
          ...s,
          permissionDenied: true,
          error: "Microphone access denied",
        }));
      } else {
        setState((s) => ({
          ...s,
          error: error.message || "Failed to start recording",
        }));
      }
    }
  }, [chunkIntervalMs, maxDurationMs, onChunk, onMaxDuration, stop]);

  return { ...state, start, stop };
}
