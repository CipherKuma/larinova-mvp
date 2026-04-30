"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square } from "lucide-react";
import { SpeechmaticsTranscriber } from "./providers/SpeechmaticsTranscriber";
import { DeepgramTranscriber } from "./providers/DeepgramTranscriber";
import { OpenAITranscriber } from "./providers/OpenAITranscriber";
import { AssemblyAITranscriber } from "./providers/AssemblyAITranscriber";
import { SarvamTranscriber } from "./providers/SarvamTranscriber";
import { SpeechmaticsProviders } from "./SpeechmaticsProviders";

type AIProvider =
  | "openai"
  | "deepgram"
  | "speechmatics"
  | "assemblyai"
  | "sarvam";

export interface Transcript {
  id: string;
  text: string;
  translation?: string;
  language: "en" | "ar" | "unknown";
  timestamp: number;
}

interface VoiceAITesterProps {
  provider: AIProvider;
}

export function VoiceAITester({ provider }: VoiceAITesterProps) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const handleClear = () => {
    setTranscripts([]);
  };

  const renderProvider = () => {
    const commonProps = {
      transcripts,
      onTranscriptUpdate: setTranscripts,
      isRecording,
      onStartRecording: () => setIsRecording(true),
      onStopRecording: () => setIsRecording(false),
    };

    switch (provider) {
      case "speechmatics":
        return (
          <SpeechmaticsProviders>
            <SpeechmaticsTranscriber {...commonProps} />
          </SpeechmaticsProviders>
        );
      case "deepgram":
        return <DeepgramTranscriber {...commonProps} />;
      case "openai":
        return <OpenAITranscriber {...commonProps} />;
      case "assemblyai":
        return <AssemblyAITranscriber {...commonProps} />;
      case "sarvam":
        return <SarvamTranscriber {...commonProps} />;
    }
  };

  return (
    <div className="border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border p-3 md:p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[10px] md:text-xs lg:text-sm xl:text-xl 2xl:text-2xl font-display uppercase font-bold">
              {provider.toUpperCase()} TRANSCRIPTION
            </h2>
            <p className="text-[7px] md:text-[8px] lg:text-[9px] xl:text-xs 2xl:text-sm text-muted-foreground mt-1 uppercase">
              Real-time • Multilingual • Auto-translation
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isRecording && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs uppercase font-semibold">
                  RECORDING
                </span>
              </div>
            )}

            <Button
              onClick={handleClear}
              variant="outline"
              size="sm"
              disabled={transcripts.length === 0}
              className="text-[8px] md:text-[9px] lg:text-[10px] uppercase"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Transcription Area */}
      <div className="p-3 md:p-4 lg:p-6">{renderProvider()}</div>

      {/* Transcripts Display */}
      {transcripts.length > 0 && (
        <div className="border-t border-border p-3 md:p-4 lg:p-6">
          <div className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs uppercase text-muted-foreground mb-3 md:mb-4">
            TRANSCRIPTS ({transcripts.length})
          </div>

          <div className="space-y-2 md:space-y-3 max-h-96 overflow-y-auto">
            {transcripts.map((transcript) => {
              const time = new Date(transcript.timestamp);
              const hours = time.getHours();
              const minutes = time.getMinutes().toString().padStart(2, "0");
              const timeString = `${hours}:${minutes}`;

              return (
                <div key={transcript.id} className="flex gap-2 md:gap-3">
                  {/* Timestamp */}
                  <div className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs text-muted-foreground font-mono min-w-[35px] md:min-w-[40px]">
                    {timeString}
                  </div>

                  {/* Text and Translation */}
                  <div className="flex-1">
                    {/* Original Text */}
                    <div className="text-[9px] md:text-[10px] lg:text-xs xl:text-sm text-foreground">
                      {transcript.text}
                    </div>

                    {/* Translation */}
                    {transcript.translation && (
                      <div className="text-[8px] md:text-[9px] lg:text-[10px] xl:text-xs text-blue-600 mt-0.5">
                        {transcript.translation}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
