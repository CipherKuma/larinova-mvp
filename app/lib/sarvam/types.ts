export type SarvamLanguageCode =
  | "hi-IN"
  | "ta-IN"
  | "te-IN"
  | "kn-IN"
  | "ml-IN"
  | "mr-IN"
  | "gu-IN"
  | "bn-IN"
  | "pa-IN"
  | "od-IN"
  | "en-IN";

export const SARVAM_LANGUAGES: { code: SarvamLanguageCode; label: string }[] = [
  { code: "ta-IN", label: "Tamil" },
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "Hindi" },
  { code: "te-IN", label: "Telugu" },
  { code: "kn-IN", label: "Kannada" },
  { code: "ml-IN", label: "Malayalam" },
  { code: "mr-IN", label: "Marathi" },
  { code: "gu-IN", label: "Gujarati" },
  { code: "bn-IN", label: "Bengali" },
  { code: "pa-IN", label: "Punjabi" },
  { code: "od-IN", label: "Odia" },
];

export interface SarvamTranscriptResponse {
  transcript: string;
  language_code?: string;
}

export interface SarvamTranslateRequest {
  input: string;
  source_language_code: string;
  target_language_code: string;
}

export interface SarvamTranslateResponse {
  translated_text: string;
}

export interface SarvamChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface SarvamChatRequest {
  model: string;
  messages: SarvamChatMessage[];
}

export interface SarvamChatResponse {
  choices: { message: { content: string } }[];
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}
