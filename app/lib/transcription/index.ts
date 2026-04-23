import type { TranscriptionProvider } from "./types";
import { sarvamStreamingProvider } from "./sarvam";
import { deepgramBatchProvider } from "./deepgram";

type Locale = "in" | "id";

export function getTranscriptionProvider(
  locale: Locale,
): TranscriptionProvider {
  if (locale === "in") return sarvamStreamingProvider;
  if (locale === "id") return deepgramBatchProvider;
  throw new Error(`No transcription provider for locale: ${locale}`);
}

export type {
  TranscriptionProvider,
  BatchTranscriptionProvider,
  StreamingTranscriptionProvider,
  TranscriptionResult,
  TranscriptSegment,
  TranscribeOptions,
} from "./types";
