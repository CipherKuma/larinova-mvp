"use client";

import { useState, useRef, useCallback } from "react";

export default function STTTestPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const streamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const processingRef = useRef(false);
  const recordingRef = useRef(false);

  const log = (msg: string) => {
    console.log(`[STT-TEST] ${msg}`);
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`]);
  };

  // Record a short clip and send it
  const recordAndSend = useCallback(
    async (stream: MediaStream, durationMs: number) => {
      return new Promise<void>((resolve) => {
        if (!recordingRef.current) {
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
          log(`Complete chunk: ${blob.size} bytes`);

          if (processingRef.current) {
            resolve();
            return;
          }
          processingRef.current = true;
          setInterimText("processing...");

          try {
            const formData = new FormData();
            formData.append("file", blob, "audio.webm");
            formData.append("language_code", "en-IN");

            const res = await fetch("/api/consultation/transcribe", {
              method: "POST",
              body: formData,
            });

            const data = await res.json();
            log(`Response: ${JSON.stringify(data).substring(0, 200)}`);

            if (data.transcript && data.transcript.trim()) {
              const text = data.transcript.trim();
              setTranscript((prev) => (prev ? `${prev} ${text}` : text));
              setInterimText("");
              log(`Got: "${text}"`);
            } else {
              setInterimText("");
            }
          } catch (err: any) {
            log(`Error: ${err.message}`);
            setInterimText("");
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
        }, durationMs);
      });
    },
    [],
  );

  const startRecording = async () => {
    setError(null);
    setTranscript("");
    setInterimText("");
    setLogs([]);
    setDuration(0);

    try {
      log("Requesting mic access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      log("Mic access granted");

      recordingRef.current = true;
      setIsRecording(true);

      // Duration timer
      startTimeRef.current = Date.now();
      durationTimerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      // Record 3-second clips in a loop
      const recordLoop = async () => {
        while (recordingRef.current && streamRef.current) {
          await recordAndSend(streamRef.current, 3000);
        }
      };

      log("Starting record loop (3s clips)...");
      recordLoop();
    } catch (err: any) {
      log(`Start error: ${err.name} — ${err.message}`);
      setError(err.message);
    }
  };

  const stopRecording = () => {
    log("Stopping...");
    recordingRef.current = false;

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setInterimText("");
    log("Stopped");
  };

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "40px auto",
        padding: 20,
        fontFamily: "monospace",
        color: "#f0f0f0",
        background: "#0a0f1e",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Sarvam STT Test Page</h1>

      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        {!isRecording ? (
          <button
            onClick={startRecording}
            style={{
              padding: "10px 24px",
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            style={{
              padding: "10px 24px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Stop ({duration}s)
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            background: "#7f1d1d",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          Error: {error}
        </div>
      )}

      <div
        style={{
          padding: 16,
          background: "#111827",
          borderRadius: 8,
          marginBottom: 16,
          minHeight: 80,
        }}
      >
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
          TRANSCRIPT
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
          {transcript || (
            <span style={{ color: "#4b5563" }}>No transcript yet...</span>
          )}
          {interimText && (
            <span style={{ color: "#6b7280" }}> {interimText}</span>
          )}
        </div>
      </div>

      <div
        style={{
          padding: 16,
          background: "#111827",
          borderRadius: 8,
          maxHeight: 300,
          overflowY: "auto",
        }}
      >
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
          LOGS
        </div>
        {logs.map((l, i) => (
          <div
            key={i}
            style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}
          >
            {l}
          </div>
        ))}
        {logs.length === 0 && (
          <div style={{ fontSize: 11, color: "#4b5563" }}>
            Click Start to see logs...
          </div>
        )}
      </div>
    </div>
  );
}
