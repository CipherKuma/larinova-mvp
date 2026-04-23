export interface TranscribeOptions {
  language?: string;
  consultationId?: string;
}

export interface TranscriptSegment {
  id: string;
  speaker: "doctor" | "patient" | "unknown";
  text: string;
  confidence: number;
  timestamp_start: number;
  timestamp_end: number;
  created_at: string;
}

export interface TranscriptionResult {
  transcript: string;
  segments: TranscriptSegment[];
  language?: string;
  provider: "sarvam" | "deepgram";
}

export interface BatchTranscriptionProvider {
  mode: "batch";
  name: "deepgram";
  transcribe(
    audio: Blob,
    opts: TranscribeOptions,
  ): Promise<TranscriptionResult>;
  translate(text: string, from: string, to: string): Promise<string>;
}

export interface StreamingTranscriptionProvider {
  mode: "streaming";
  name: "sarvam";
  getStreamingSession(opts: TranscribeOptions): Promise<{
    token: string;
    wsUrl: string;
    expiresAt: number;
  }>;
  finalize(segments: TranscriptSegment[]): Promise<TranscriptionResult>;
  translate(text: string, from: string, to: string): Promise<string>;
}

export type TranscriptionProvider =
  | BatchTranscriptionProvider
  | StreamingTranscriptionProvider;
