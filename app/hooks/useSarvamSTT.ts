"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface UseSarvamSTTOptions {
  languageCode?: string;
  locale?: string;
  chunkDurationMs?: number;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface SarvamSTTState {
  isRecording: boolean;
  isConnecting: boolean;
  transcript: string;
  interimText: string;
  duration: number;
  error: string | null;
  permissionDenied: boolean;
}

export function useSarvamSTT(options: UseSarvamSTTOptions = {}) {
  const {
    languageCode = "ta-IN",
    locale,
    chunkDurationMs = 3000,
    onTranscript,
    onError,
  } = options;

  const [state, setState] = useState<SarvamSTTState>({
    isRecording: false,
    isConnecting: false,
    transcript: "",
    interimText: "",
    duration: 0,
    error: null,
    permissionDenied: false,
  });

  const streamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const transcriptRef = useRef<string>("");
  const detectedLanguageRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const recordingRef = useRef(false);
  const processingRef = useRef(false);
  const languageCodeRef = useRef(languageCode);
  const localeRef = useRef(locale);

  useEffect(() => {
    languageCodeRef.current = languageCode;
  }, [languageCode]);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      recordingRef.current = false;
    };
  }, []);

  const cleanup = useCallback(() => {
    recordingRef.current = false;

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const stop = useCallback(() => {
    cleanup();
    if (mountedRef.current) {
      setState((s) => ({
        ...s,
        isRecording: false,
        isConnecting: false,
        interimText: "",
      }));
    }
  }, [cleanup]);

  // Record a short clip, stop it, send the complete file
  const recordAndSend = useCallback(
    async (stream: MediaStream) => {
      return new Promise<void>((resolve) => {
        if (!recordingRef.current || !stream.active) {
          resolve();
          return;
        }

        const recorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/webm",
        });

        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          if (chunks.length === 0) {
            resolve();
            return;
          }

          const blob = new Blob(chunks, { type: "audio/webm" });

          if (processingRef.current) {
            resolve();
            return;
          }
          processingRef.current = true;

          if (mountedRef.current) {
            setState((s) => ({ ...s, interimText: "..." }));
          }

          try {
            const formData = new FormData();
            formData.append("file", blob, "audio.webm");
            formData.append("language_code", languageCodeRef.current);
            if (localeRef.current) {
              formData.append("locale", localeRef.current);
            }

            const res = await fetch("/api/consultation/transcribe", {
              method: "POST",
              body: formData,
            });

            if (res.ok) {
              const data = await res.json();
              if (data.transcript && data.transcript.trim()) {
                const text = data.transcript.trim();
                transcriptRef.current = transcriptRef.current
                  ? `${transcriptRef.current} ${text}`
                  : text;

                if (data.language_code) {
                  detectedLanguageRef.current = data.language_code;
                }

                if (mountedRef.current) {
                  setState((s) => ({
                    ...s,
                    transcript: transcriptRef.current,
                    interimText: "",
                  }));
                }

                onTranscript?.(text, true);
              } else {
                if (mountedRef.current) {
                  setState((s) => ({ ...s, interimText: "" }));
                }
              }
            } else {
              if (mountedRef.current) {
                setState((s) => ({ ...s, interimText: "" }));
              }
            }
          } catch {
            if (mountedRef.current) {
              setState((s) => ({ ...s, interimText: "" }));
            }
          } finally {
            processingRef.current = false;
          }

          resolve();
        };

        recorder.start();
        setTimeout(() => {
          if (recorder.state === "recording") {
            recorder.stop();
          } else {
            resolve();
          }
        }, chunkDurationMs);
      });
    },
    [chunkDurationMs, onTranscript],
  );

  const start = useCallback(async () => {
    setState((s) => ({
      ...s,
      error: null,
      permissionDenied: false,
      isConnecting: true,
      transcript: "",
      interimText: "",
      duration: 0,
    }));
    transcriptRef.current = "";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      recordingRef.current = true;

      // Duration timer
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

      // Record loop — fresh recorder every chunkDurationMs
      const recordLoop = async () => {
        while (recordingRef.current && streamRef.current?.active) {
          await recordAndSend(streamRef.current);
        }
      };

      recordLoop();
    } catch (err: unknown) {
      const error = err as Error;
      cleanup();

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        if (mountedRef.current) {
          setState((s) => ({
            ...s,
            permissionDenied: true,
            error: "Microphone access denied",
            isConnecting: false,
          }));
        }
        onError?.("Microphone access denied");
      } else {
        const errMsg = error.message || "Failed to start recording";
        if (mountedRef.current) {
          setState((s) => ({
            ...s,
            error: errMsg,
            isConnecting: false,
          }));
        }
        onError?.(errMsg);
      }
    }
  }, [cleanup, recordAndSend, onError]);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = "";
    setState((s) => ({
      ...s,
      transcript: "",
      interimText: "",
    }));
  }, []);

  return {
    ...state,
    transcriptRef,
    detectedLanguageRef,
    streamRef,
    start,
    stop,
    resetTranscript,
  };
}
