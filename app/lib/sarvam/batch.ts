// Thin client for Sarvam's Batch Speech-to-Text API. Used post-consult to
// re-transcribe the full recording with diarization, then replace the
// per-chunk live transcripts with speaker-labeled segments.
//
// Six-step flow:
//   1. POST /speech-to-text/job/v1                        → job_id
//   2. POST /speech-to-text/job/v1/upload-files            → presigned PUT URLs
//   3. PUT  <presigned-url>                                → upload audio
//   4. POST /speech-to-text/job/v1/{id}/start              → kick off
//   5. GET  /speech-to-text/job/v1/{id}/status (poll)      → Completed/Failed
//   6. POST /speech-to-text/job/v1/download-files          → presigned GET URLs
//      then GET <presigned-url>                            → diarized JSON
//
// Diarized JSON contains `entries[]` with { transcript, start_time_seconds,
// end_time_seconds, speaker_id }. We map speaker_id → "doctor" | "patient"
// using a heuristic (first speaker to talk == doctor by clinical convention,
// or LLM tie-breaker if ambiguous).

const SARVAM_BASE = "https://api.sarvam.ai";

export type BatchJobState =
  | "Accepted"
  | "Pending"
  | "Running"
  | "Completed"
  | "Failed";

export interface BatchJobResponse {
  job_id: string;
  job_state: BatchJobState;
  storage_container_type?: string;
  job_parameters?: Record<string, unknown>;
  total_files?: number;
  successful_files_count?: number;
  failed_files_count?: number;
  error_message?: string | null;
  job_details?: Array<{
    inputs?: Array<{ file_name: string; file_id: string }>;
    outputs?: Array<{ file_name: string; file_id: string }>;
    state?: string;
    error_message?: string | null;
  }>;
}

export interface DiarizedEntry {
  transcript: string;
  start_time_seconds: number;
  end_time_seconds: number;
  speaker_id: string;
}

export interface BatchDiarizedResult {
  transcript?: string;
  language_code?: string;
  entries?: DiarizedEntry[];
  diarized_transcript?: { entries?: DiarizedEntry[] };
}

interface BatchOptions {
  apiKey: string;
  languageCode?: string;
  model?: string;
  numSpeakers?: number;
  inputAudioCodec?: string;
  filename?: string;
}

async function sarvamFetch(
  apiKey: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const res = await fetch(`${SARVAM_BASE}${path}`, {
    ...init,
    headers: {
      "api-subscription-key": apiKey,
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init.headers || {}),
    },
  });
  return res;
}

async function expectOk(res: Response, label: string) {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Sarvam batch ${label} failed: ${res.status} ${body}`);
  }
}

export async function submitDiarizationJob(
  audio: Blob,
  opts: BatchOptions,
): Promise<{ jobId: string }> {
  const apiKey = opts.apiKey;
  const filename = opts.filename || "consultation.webm";
  const inputAudioCodec = opts.inputAudioCodec || "webm";

  // 1. Initiate
  const initRes = await sarvamFetch(apiKey, "/speech-to-text/job/v1", {
    method: "POST",
    body: JSON.stringify({
      job_parameters: {
        language_code: opts.languageCode || "unknown",
        model: opts.model || "saaras:v3",
        with_timestamps: true,
        with_diarization: true,
        num_speakers: opts.numSpeakers ?? 2,
        input_audio_codec: inputAudioCodec,
      },
    }),
  });
  await expectOk(initRes, "init");
  const { job_id } = (await initRes.json()) as { job_id: string };

  // 2. Get upload URLs
  const uploadRes = await sarvamFetch(
    apiKey,
    "/speech-to-text/job/v1/upload-files",
    {
      method: "POST",
      body: JSON.stringify({ job_id, files: [filename] }),
    },
  );
  await expectOk(uploadRes, "upload-files");
  const uploadJson = (await uploadRes.json()) as {
    upload_urls: Record<string, { file_url: string }>;
  };
  const presigned = uploadJson.upload_urls?.[filename]?.file_url;
  if (!presigned) {
    throw new Error("Sarvam batch: no presigned upload URL returned");
  }

  // 3. Upload the file via PUT to the presigned URL
  const uploadFileRes = await fetch(presigned, {
    method: "PUT",
    body: audio,
    headers: {
      "Content-Type": audio.type || "audio/webm",
      "x-ms-blob-type": "BlockBlob", // Azure presigned URLs require this
    },
  });
  if (!uploadFileRes.ok) {
    const body = await uploadFileRes.text().catch(() => "");
    throw new Error(
      `Sarvam batch upload PUT failed: ${uploadFileRes.status} ${body}`,
    );
  }

  // 4. Start the job
  const startRes = await sarvamFetch(
    apiKey,
    `/speech-to-text/job/v1/${job_id}/start`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
  await expectOk(startRes, "start");

  return { jobId: job_id };
}

export async function pollUntilDone(
  apiKey: string,
  jobId: string,
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<BatchJobResponse> {
  const interval = opts.intervalMs || 5000;
  const timeout = opts.timeoutMs || 4 * 60 * 1000;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const res = await sarvamFetch(
      apiKey,
      `/speech-to-text/job/v1/${jobId}/status`,
    );
    await expectOk(res, "status");
    const status = (await res.json()) as BatchJobResponse;
    if (status.job_state === "Completed") return status;
    if (status.job_state === "Failed") {
      throw new Error(
        `Sarvam batch job failed: ${status.error_message || "unknown"}`,
      );
    }
    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error(`Sarvam batch job timed out after ${timeout}ms`);
}

export async function downloadDiarizedResult(
  apiKey: string,
  jobId: string,
  status: BatchJobResponse,
): Promise<BatchDiarizedResult> {
  const outputFile = status.job_details?.[0]?.outputs?.[0]?.file_name;
  if (!outputFile) {
    throw new Error("Sarvam batch: no output file in job details");
  }

  const dlRes = await sarvamFetch(
    apiKey,
    "/speech-to-text/job/v1/download-files",
    {
      method: "POST",
      body: JSON.stringify({ job_id: jobId, files: [outputFile] }),
    },
  );
  await expectOk(dlRes, "download-files");
  const dlJson = (await dlRes.json()) as {
    download_urls: Record<string, { file_url: string }>;
  };
  const presigned = dlJson.download_urls?.[outputFile]?.file_url;
  if (!presigned) {
    throw new Error("Sarvam batch: no presigned download URL");
  }

  const fileRes = await fetch(presigned);
  if (!fileRes.ok) {
    throw new Error(`Sarvam batch download GET failed: ${fileRes.status}`);
  }
  return (await fileRes.json()) as BatchDiarizedResult;
}

// One-shot helper: submit, poll, download.
export async function transcribeWithDiarization(
  audio: Blob,
  opts: BatchOptions & { intervalMs?: number; timeoutMs?: number },
): Promise<BatchDiarizedResult> {
  const { jobId } = await submitDiarizationJob(audio, opts);
  const status = await pollUntilDone(opts.apiKey, jobId, {
    intervalMs: opts.intervalMs,
    timeoutMs: opts.timeoutMs,
  });
  return downloadDiarizedResult(opts.apiKey, jobId, status);
}

// Map Sarvam's opaque speaker_id values (often "speaker_0", "speaker_1")
// to "doctor" / "patient" using a simple heuristic: the speaker who has
// the longer total speaking time is usually the doctor in OPD context.
// Returns a map { speakerId → role }.
export function inferSpeakerRoles(
  entries: DiarizedEntry[],
): Record<string, "doctor" | "patient"> {
  const totals: Record<string, number> = {};
  for (const e of entries) {
    const dur = (e.end_time_seconds || 0) - (e.start_time_seconds || 0);
    totals[e.speaker_id] = (totals[e.speaker_id] || 0) + Math.max(0, dur);
  }
  const ids = Object.keys(totals);
  if (ids.length === 0) return {};
  if (ids.length === 1) return { [ids[0]]: "doctor" };
  ids.sort((a, b) => totals[b] - totals[a]);
  return {
    [ids[0]]: "doctor",
    [ids[1]]: "patient",
    ...Object.fromEntries(ids.slice(2).map((id) => [id, "patient" as const])),
  };
}
