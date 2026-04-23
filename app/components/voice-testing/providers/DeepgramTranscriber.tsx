"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, AlertCircle } from "lucide-react";
import { Transcript } from "../VoiceAITester";

interface DeepgramTranscriberProps {
  transcripts: Transcript[];
  onTranscriptUpdate: (
    transcripts: Transcript[] | ((prev: Transcript[]) => Transcript[]),
  ) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function DeepgramTranscriber({
  transcripts,
  onTranscriptUpdate,
  isRecording,
  onStartRecording,
  onStopRecording,
}: DeepgramTranscriberProps) {
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const currentTextRef = useRef<string>("");

  const translateText = async (
    text: string,
    targetLang: string,
  ): Promise<string | null> => {
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang }),
      });
      const data = await response.json();
      return data.translation;
    } catch (err) {
      console.error("Translation failed:", err);
      return null;
    }
  };

  const handleStart = useCallback(async () => {
    try {
      setError(null);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get Deepgram API key from our backend
      const response = await fetch("/api/deepgram/token", { method: "POST" });
      const { apiKey } = await response.json();

      // Connect to Deepgram
      const socket = new WebSocket(
        `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&language=en&punctuate=true&interim_results=true`,
        ["token", apiKey],
      );

      socketRef.current = socket;

      socket.onopen = () => {
        console.log("Deepgram connected");

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        });

        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        });

        mediaRecorder.start(250);
        onStartRecording();
      };

      socket.onmessage = async (message) => {
        const data = JSON.parse(message.data);

        if (data.channel?.alternatives?.[0]) {
          const transcript = data.channel.alternatives[0].transcript;
          const isFinal = data.is_final;

          if (transcript && transcript.trim()) {
            if (isFinal) {
              // Save completed sentence with translation
              const translation = await translateText(transcript, "ar");

              onTranscriptUpdate((prev) => [
                ...prev,
                {
                  id: `${Date.now()}-${Math.random()}`,
                  text: transcript.toUpperCase(),
                  translation: translation?.toUpperCase(),
                  language: "en",
                  timestamp: Date.now(),
                },
              ]);

              currentTextRef.current = "";
            } else {
              // Update current text
              currentTextRef.current = transcript;
            }
          }
        }
      };

      socket.onerror = (err) => {
        console.error("Deepgram error:", err);
        setError("Connection error occurred");
      };

      socket.onclose = () => {
        console.log("Deepgram disconnected");
      };
    } catch (err: any) {
      console.error("Error starting:", err);
      setError(err.message || "Failed to start recording");
    }
  }, [onStartRecording, onTranscriptUpdate]);

  const handleStop = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }

    if (socketRef.current) {
      socketRef.current.close();
    }

    onStopRecording();
  }, [onStopRecording]);

  return (
    <div className="space-y-4">
      {/* Warning Banner */}
      <div className="border border-yellow-500 bg-yellow-50 p-3 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-yellow-700 mt-0.5" />
        <div>
          <div className="text-[9px] md:text-[10px] font-semibold text-yellow-900 uppercase">
            Arabic Not Supported
          </div>
          <div className="text-[8px] md:text-[9px] text-yellow-800">
            Deepgram does not support Arabic. Transcribing English only with
            Arabic translation.
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {!isRecording ? (
          <Button onClick={handleStart} size="lg" className="uppercase">
            <Mic className="w-4 h-4 mr-2" />
            Start Recording
          </Button>
        ) : (
          <Button
            onClick={handleStop}
            size="lg"
            variant="destructive"
            className="uppercase"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop Recording
          </Button>
        )}
      </div>

      {/* Status */}
      {error && (
        <div className="text-center text-red-600 text-xs uppercase">
          {error}
        </div>
      )}

      {/* Current Text Preview */}
      {isRecording && currentTextRef.current && (
        <div className="border border-border p-4 bg-muted">
          <div className="text-[8px] uppercase text-muted-foreground mb-2">
            Current (Live):
          </div>
          <div className="text-sm">{currentTextRef.current}</div>
        </div>
      )}
    </div>
  );
}
