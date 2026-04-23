"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, ChevronDown } from "lucide-react";
import { Transcript } from "../VoiceAITester";
import { SARVAM_LANGUAGES, type SarvamLanguageCode } from "@/lib/sarvam/types";

interface SarvamTranscriberProps {
  transcripts: Transcript[];
  onTranscriptUpdate: (
    transcripts: Transcript[] | ((prev: Transcript[]) => Transcript[]),
  ) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function SarvamTranscriber({
  transcripts,
  onTranscriptUpdate,
  isRecording,
  onStartRecording,
  onStopRecording,
}: SarvamTranscriberProps) {
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<SarvamLanguageCode>("ta-IN");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const processAudioChunk = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("language_code", language);

      const response = await fetch("/api/consultation/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.transcript && data.transcript.trim()) {
        onTranscriptUpdate((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            text: data.transcript.trim(),
            language: language.startsWith("en") ? "en" : "unknown",
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err) {
      console.error("Sarvam transcription error:", err);
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

      // Process audio every 4 seconds
      intervalRef.current = setInterval(() => {
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, {
            type: "audio/webm",
          });
          chunksRef.current = [];
          processAudioChunk(audioBlob);
        }
      }, 4000);
    } catch (err: any) {
      console.error("Error starting:", err);
      setError(err.message || "Failed to start recording");
    }
  }, [onStartRecording, language]);

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
          const audioBlob = new Blob(chunksRef.current, {
            type: "audio/webm",
          });
          chunksRef.current = [];
          processAudioChunk(audioBlob);
        }
      }, 100);
    }

    onStopRecording();
  }, [onStopRecording]);

  const selectedLang = SARVAM_LANGUAGES.find((l) => l.code === language);

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="border border-emerald-500 bg-emerald-50 p-3">
        <div className="text-[9px] md:text-[10px] font-semibold text-emerald-900 uppercase mb-1">
          Sarvam Saaras v2 (Chunked Processing)
        </div>
        <div className="text-[8px] md:text-[9px] text-emerald-800">
          Processes audio in 4-second chunks. Supports 11 Indian languages
          including Tamil, Hindi, Telugu, and more.
        </div>
      </div>

      {/* Language Selector */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-[9px] md:text-[10px] uppercase text-muted-foreground font-semibold">
          Language:
        </span>
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            disabled={isRecording}
            className="h-8 px-3 border border-border rounded flex items-center gap-1.5 text-[9px] md:text-[10px] font-semibold uppercase bg-card hover:bg-muted transition-colors disabled:opacity-50"
          >
            {selectedLang?.label || "Tamil"}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showLangDropdown && (
            <div className="absolute top-full mt-1 left-0 z-50 bg-card border border-border rounded shadow-lg max-h-48 overflow-y-auto min-w-[140px]">
              {SARVAM_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLangDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[9px] md:text-[10px] uppercase hover:bg-muted transition-colors ${
                    language === lang.code
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-foreground"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
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

      {/* Powered by Sarvam AI */}
      <div className="flex items-center justify-end mt-3">
        <span className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs text-muted-foreground uppercase tracking-wider">
          Powered by{" "}
          <span className="text-primary font-semibold">Sarvam AI</span>
        </span>
      </div>
    </div>
  );
}
