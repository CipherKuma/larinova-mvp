import { AssemblyAI, RealtimeTranscriber } from "assemblyai";

// Initialize AssemblyAI client
const assemblyaiClient = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY || "",
});

export interface TranscriptionConfig {
  sampleRate?: number;
  encoding?: string;
}

export function createRealtimeTranscriber(
  config?: TranscriptionConfig,
): RealtimeTranscriber {
  const transcriber = assemblyaiClient.realtime.transcriber({
    sampleRate: config?.sampleRate || 16000,
    // Additional configuration can be added here
  });

  return transcriber;
}

export interface TranscriptResult {
  speaker: string;
  text: string;
  confidence: number;
  timestamp_start: number;
  timestamp_end: number;
  language?: string;
}

// Speaker detection logic - for MVP, defaults to 'unknown'
// In production, this would use AssemblyAI's speaker diarization
export function detectSpeaker(speakerLabel?: string): string {
  if (!speakerLabel) {
    return "unknown";
  }

  // Map AssemblyAI speaker labels (A, B, C, etc.) to doctor/patient
  // For MVP, we'll use simple logic - can be enhanced later
  return speakerLabel === "A" ? "doctor" : "patient";
}

export { assemblyaiClient };
