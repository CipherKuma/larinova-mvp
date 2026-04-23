/**
 * Transcription mode configuration.
 * USE_STREAMING=true  → real-time WebSocket streaming (lower latency, requires stable connection)
 * USE_STREAMING=false → batch mode (record full audio, then transcribe)
 */
export const TRANSCRIPTION_CONFIG = {
  useStreaming: process.env.USE_STREAMING === "true",
} as const;
