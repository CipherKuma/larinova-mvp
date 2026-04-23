import type {
  BatchTranscriptionProvider,
  TranscribeOptions,
  TranscriptSegment,
  TranscriptionResult,
} from "./types";

// Medical terminology keyterms for Bahasa Indonesia
const MEDICAL_KEYTERMS = [
  "dokter",
  "pasien",
  "sakit",
  "demam",
  "tekanan darah",
  "resep",
  "obat",
  "diagnosis",
  "gejala",
  "pemeriksaan",
  "rawat inap",
  "rawat jalan",
  "puskesmas",
  "rumah sakit",
  "poliklinik",
  "anamnesis",
  "tindakan",
];

function getApiKey(): string {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) throw new Error("DEEPGRAM_API_KEY not configured");
  return key;
}

type DeepgramWord = {
  word: string;
  start: number;
  end: number;
  speaker?: number;
  confidence?: number;
};

function makeSegment(
  words: DeepgramWord[],
  speakerIdx: number,
): TranscriptSegment {
  const text = words.map((w) => w.word).join(" ");
  const confidence =
    words.reduce((acc, w) => acc + (w.confidence ?? 0.8), 0) / words.length;
  const speakerLabel: "doctor" | "patient" | "unknown" =
    speakerIdx === 0 ? "doctor" : speakerIdx === 1 ? "patient" : "unknown";

  return {
    id: `seg-${Date.now()}-${Math.random()}`,
    speaker: speakerLabel,
    text,
    confidence,
    timestamp_start: words[0]?.start ?? 0,
    timestamp_end: words[words.length - 1]?.end ?? 0,
    created_at: new Date().toISOString(),
  };
}

function buildSegmentsFromWords(
  words: DeepgramWord[],
  fullTranscript: string,
): TranscriptSegment[] {
  if (words.length === 0) {
    return [
      {
        id: `seg-${Date.now()}`,
        speaker: "unknown",
        text: fullTranscript,
        confidence: 0.8,
        timestamp_start: 0,
        timestamp_end: 0,
        created_at: new Date().toISOString(),
      },
    ];
  }

  const segments: TranscriptSegment[] = [];
  let currentSpeaker = words[0]?.speaker ?? 0;
  let currentWords: DeepgramWord[] = [];

  for (const word of words) {
    const speaker = word.speaker ?? 0;
    if (speaker !== currentSpeaker && currentWords.length > 0) {
      segments.push(makeSegment(currentWords, currentSpeaker));
      currentWords = [];
      currentSpeaker = speaker;
    }
    currentWords.push(word);
  }
  if (currentWords.length > 0) {
    segments.push(makeSegment(currentWords, currentSpeaker));
  }

  return segments;
}

export const deepgramBatchProvider: BatchTranscriptionProvider = {
  mode: "batch",
  name: "deepgram",

  async transcribe(
    audio: Blob,
    _opts: TranscribeOptions,
  ): Promise<TranscriptionResult> {
    const apiKey = getApiKey();
    const arrayBuffer = await audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.error("[DEEPGRAM] Transcribing audio:", {
      blobSize: audio.size,
      blobType: audio.type,
      bufferLength: buffer.length,
    });

    if (buffer.length === 0) {
      throw new Error("Deepgram error: audio buffer is empty (0 bytes)");
    }

    // Direct REST API call — faster than SDK (no extra serialization layer)
    const params = new URLSearchParams({
      model: "nova-3",
      language: "id",
      diarize: "true",
      punctuate: "true",
      smart_format: "true",
    });
    for (const kw of MEDICAL_KEYTERMS) {
      params.append("keyterm", `${kw}:2`);
    }

    const startMs = Date.now();
    const response = await fetch(
      `https://api.deepgram.com/v1/listen?${params.toString()}`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": audio.type || "audio/webm",
        },
        body: buffer,
      },
    );

    const elapsed = Date.now() - startMs;

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("[DEEPGRAM] API error:", {
        status: response.status,
        elapsed: `${elapsed}ms`,
        body: errorBody.substring(0, 300),
      });
      throw new Error(
        `Deepgram error (${response.status}): ${errorBody.substring(0, 200)}`,
      );
    }

    const result = await response.json();
    const channel = result?.results?.channels?.[0];
    const alternative = channel?.alternatives?.[0];
    const transcript = alternative?.transcript || "";
    const words = (alternative?.words || []) as DeepgramWord[];
    const segments = buildSegmentsFromWords(words, transcript);

    console.error("[DEEPGRAM] Success:", {
      elapsed: `${elapsed}ms`,
      transcriptLength: transcript.length,
      segmentCount: segments.length,
      transcriptPreview: transcript.substring(0, 100),
    });

    return {
      transcript,
      segments,
      language: "id",
      provider: "deepgram",
    };
  },

  async translate(text: string, _from: string, _to: string): Promise<string> {
    // Translation not configured for Indonesia in this sprint.
    // SOAP generation handles Bahasa natively via Claude Service.
    return text;
  },
};
