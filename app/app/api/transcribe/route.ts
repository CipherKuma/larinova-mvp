import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const assemblyaiKey = process.env.ASSEMBLYAI_API_KEY;

    if (!assemblyaiKey) {
      return NextResponse.json(
        { error: "AssemblyAI API key not configured" },
        { status: 500 },
      );
    }

    // Get the audio blob and language preferences from the request
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const doctorLanguage = (formData.get("doctorLanguage") as string) || "en";
    const patientLanguage = (formData.get("patientLanguage") as string) || "en";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    // Step 1: Upload audio file to AssemblyAI
    const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: {
        authorization: assemblyaiKey,
      },
      body: audioFile,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload audio to AssemblyAI");
    }

    const { upload_url } = await uploadResponse.json();

    // Step 2: Request transcription with speaker diarization
    // Configure based on whether both speakers use the same language
    const sameLanguage = doctorLanguage === patientLanguage;

    const transcriptConfig: any = {
      audio_url: upload_url,
      speaker_labels: true, // Enable speaker diarization
    };

    if (sameLanguage) {
      // Same language: Force specific language for better accuracy
      transcriptConfig.language_code = doctorLanguage;
      // Improve diarization by specifying expected number of speakers
      transcriptConfig.speakers_expected = 2;
    } else {
      // Different languages: Use language detection with restrictions
      transcriptConfig.language_detection = true;
      transcriptConfig.language_detection_options = {
        expected_languages: [doctorLanguage, patientLanguage],
      };
    }

    const transcriptResponse = await fetch(
      "https://api.assemblyai.com/v2/transcript",
      {
        method: "POST",
        headers: {
          authorization: assemblyaiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(transcriptConfig),
      },
    );

    if (!transcriptResponse.ok) {
      throw new Error("Failed to request transcription");
    }

    const { id } = await transcriptResponse.json();

    // Step 3: Poll for transcription result
    let transcript;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait

    while (attempts < maxAttempts) {
      const resultResponse = await fetch(
        `https://api.assemblyai.com/v2/transcript/${id}`,
        {
          headers: {
            authorization: assemblyaiKey,
          },
        },
      );

      transcript = await resultResponse.json();

      if (transcript.status === "completed") {
        break;
      } else if (transcript.status === "error") {
        throw new Error(transcript.error || "Transcription failed");
      }

      // Wait 1 second before polling again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!transcript || transcript.status !== "completed") {
      throw new Error("Transcription timeout");
    }

    // Extract speaker-labeled utterances
    const utterances = transcript.utterances || [];

    return NextResponse.json({
      text: transcript.text,
      language: transcript.language_code,
      doctorLanguage,
      patientLanguage,
      utterances: utterances.map((u: any) => ({
        speaker: u.speaker,
        text: u.text,
        start: u.start,
        end: u.end,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Transcription failed" },
      { status: 500 },
    );
  }
}
