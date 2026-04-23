"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square } from "lucide-react";
import {
  useRealtimeTranscription,
  useRealtimeEventListener,
} from "@speechmatics/real-time-client-react";
import {
  usePCMAudioListener,
  usePCMAudioRecorderContext,
} from "@speechmatics/browser-audio-input-react";
import { Transcript } from "../VoiceAITester";

const RECORDING_SAMPLE_RATE = 16_000;

interface SpeechmaticsTranscriberProps {
  transcripts: Transcript[];
  onTranscriptUpdate: (
    transcripts: Transcript[] | ((prev: Transcript[]) => Transcript[]),
  ) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function SpeechmaticsTranscriber({
  transcripts,
  onTranscriptUpdate,
  isRecording,
  onStartRecording,
  onStopRecording,
}: SpeechmaticsTranscriberProps) {
  const [error, setError] = useState<string | null>(null);
  const currentTextRef = useRef<string>("");
  const currentLanguageRef = useRef<"en" | "ar" | "unknown">("unknown");

  const { startTranscription, stopTranscription, sendAudio, socketState } =
    useRealtimeTranscription();
  const { startRecording, stopRecording } = usePCMAudioRecorderContext();

  usePCMAudioListener(sendAudio);

  // Translation helper
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

  // Handle transcription events
  useRealtimeEventListener("receiveMessage", async (event: any) => {
    const { data } = event;

    if (data.message === "AddTranscript") {
      const { metadata } = data;
      const text = metadata?.transcript?.trim() || "";

      if (!text) return;

      // Detect language
      const isArabic = /[\u0600-\u06FF]/.test(text);
      const language: "en" | "ar" = isArabic ? "ar" : "en";

      // Check if this is a continuation or new sentence
      const isNewSentence =
        currentLanguageRef.current !== language ||
        text.length < currentTextRef.current.length ||
        !currentTextRef.current;

      if (isNewSentence && currentTextRef.current) {
        // Save previous sentence
        const targetLang = currentLanguageRef.current === "ar" ? "en" : "ar";
        const translation = await translateText(
          currentTextRef.current,
          targetLang,
        );

        onTranscriptUpdate((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            text: currentTextRef.current.toUpperCase(),
            translation: translation?.toUpperCase(),
            language: currentLanguageRef.current,
            timestamp: Date.now(),
          },
        ]);

        // Start new sentence
        currentTextRef.current = text;
        currentLanguageRef.current = language;
      } else {
        // Continue current sentence
        currentTextRef.current = text;
        currentLanguageRef.current = language;
      }
    }

    if (data.message === "Error") {
      console.error("Speechmatics error:", data);
      setError(data.reason || "Transcription error occurred");
    }
  });

  const handleStart = useCallback(async () => {
    try {
      setError(null);

      // Fetch JWT
      const response = await fetch("/api/speechmatics/jwt", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to get Speechmatics JWT");
      }

      const { jwt } = await response.json();

      // Start transcription
      await startTranscription(jwt, {
        audio_format: {
          type: "raw",
          encoding: "pcm_f32le",
          sample_rate: RECORDING_SAMPLE_RATE,
        },
        transcription_config: {
          language: "ar", // Arabic with code-switching
          enable_partials: true,
          max_delay: 1,
          operating_point: "enhanced",
        },
      });

      await startRecording({} as any);
      onStartRecording();
    } catch (err: any) {
      console.error("Error starting:", err);
      setError(err.message || "Failed to start recording");
    }
  }, [startTranscription, startRecording, onStartRecording]);

  const handleStop = useCallback(async () => {
    // Save final sentence if exists
    if (currentTextRef.current) {
      const targetLang = currentLanguageRef.current === "ar" ? "en" : "ar";
      const translation = await translateText(
        currentTextRef.current,
        targetLang,
      );

      onTranscriptUpdate((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          text: currentTextRef.current.toUpperCase(),
          translation: translation?.toUpperCase(),
          language: currentLanguageRef.current,
          timestamp: Date.now(),
        },
      ]);

      currentTextRef.current = "";
      currentLanguageRef.current = "unknown";
    }

    stopRecording();
    stopTranscription();
    onStopRecording();
  }, [stopRecording, stopTranscription, onStopRecording, onTranscriptUpdate]);

  return (
    <div className="space-y-4">
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
