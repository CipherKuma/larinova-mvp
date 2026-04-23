"use client";

import { useLocale } from "next-intl";
import { TranscriptionViewStreaming } from "./TranscriptionViewStreaming";
import { TranscriptionViewBatch } from "./TranscriptionViewBatch";

interface Transcript {
  id: string;
  speaker: "doctor" | "patient" | "unknown";
  text: string;
  translation?: string;
  confidence: number;
  timestamp_start: number;
  timestamp_end: number;
  created_at: string;
}

interface TranscriptionViewProps {
  consultationId: string;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  transcripts: Transcript[];
  onTranscriptUpdate: (
    transcripts: Transcript[] | ((prev: Transcript[]) => Transcript[]),
  ) => void;
  onDiarizationComplete?: (consultationId: string) => void;
}

export function TranscriptionView(props: TranscriptionViewProps) {
  const locale = useLocale();

  if (locale === "in") {
    return <TranscriptionViewStreaming {...props} />;
  }

  return <TranscriptionViewBatch {...props} />;
}
