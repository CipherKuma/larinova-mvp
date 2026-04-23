"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square } from "lucide-react";
import { Transcript } from "../VoiceAITester";

interface OpenAITranscriberProps {
  transcripts: Transcript[];
  onTranscriptUpdate: (
    transcripts: Transcript[] | ((prev: Transcript[]) => Transcript[]),
  ) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function OpenAITranscriber({
  transcripts,
  onTranscriptUpdate,
  isRecording,
  onStartRecording,
  onStopRecording,
}: OpenAITranscriberProps) {
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const processAudioChunk = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model", "whisper-1");
      formData.append("language", "ar"); // Multilingual
      formData.append("response_format", "verbose_json");

      const response = await fetch("/api/openai/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.text && data.text.trim()) {
        // Detect language
        const isArabic = /[\u0600-\u06FF]/.test(data.text);
        const language: "en" | "ar" = isArabic ? "ar" : "en";
        const targetLang = language === "ar" ? "en" : "ar";
        const translation = await translateText(data.text, targetLang);

        onTranscriptUpdate((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            text: data.text.toUpperCase(),
            translation: translation?.toUpperCase(),
            language,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err) {
      console.error("Transcription error:", err);
    }
  };

  const handleStart = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      onStartRecording();

      // Process audio every 3 seconds
      intervalRef.current = setInterval(() => {
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
          processAudioChunk(audioBlob);
          chunksRef.current = [];
        }
      }, 3000);
    } catch (err: any) {
      console.error("Error starting:", err);
      setError(err.message || "Failed to start recording");
    }
  }, [onStartRecording, onTranscriptUpdate]);

  const handleStop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());

      // Process final chunk
      setTimeout(() => {
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
          processAudioChunk(audioBlob);
        }
      }, 100);
    }

    onStopRecording();
  }, [onStopRecording]);

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="border border-blue-500 bg-blue-50 p-3">
        <div className="text-[9px] md:text-[10px] font-semibold text-blue-900 uppercase mb-1">
          OpenAI Whisper (Chunked Processing)
        </div>
        <div className="text-[8px] md:text-[9px] text-blue-800">
          Processes audio in 3-second chunks. Supports Arabic + English
          multilingual transcription.
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
    </div>
  );
}
