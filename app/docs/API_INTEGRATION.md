# Larinova MVP - API Integration Guide

## Overview

This guide covers integration of external services:
1. **AssemblyAI** - Real-time transcription with speaker diarization
2. **Resend** - Email automation for consultation summaries

---

## 1. AssemblyAI Integration

### What is AssemblyAI?

AssemblyAI provides AI-powered audio transcription with:
- **Real-time streaming transcription**
- **Speaker diarization** (who is speaking when)
- **Multi-language support**
- **High accuracy** (90%+ for clear audio)

### Pricing & Free Tier

- **Free Credits**: $50 for new accounts
- **Usage**: ~$0.022/minute (~$1.30/hour)
- **Free tier duration**: ~2,200 minutes (~37 hours)
- **Perfect for MVP testing**

---

### Setup AssemblyAI

#### Step 1: Create Account

1. Go to https://www.assemblyai.com
2. Sign up with email
3. Verify email address
4. Get $50 free credits automatically

#### Step 2: Get API Key

1. Go to dashboard: https://www.assemblyai.com/app
2. Click on **API Keys** in sidebar
3. Copy your API key (starts with `aai_`)
4. Add to `.env.local`:

```bash
ASSEMBLYAI_API_KEY=aai_xxxxxxxxxxxxxx
```

---

### Implementation

#### Architecture Overview

```
┌─────────────┐     WebSocket      ┌──────────────┐
│   Browser   │ ←──────────────→  │  Next.js API │
│  (Doctor)   │                    │   Route      │
└─────────────┘                    └──────┬───────┘
                                           │
                                           │ WebSocket
                                           ↓
                                   ┌──────────────┐
                                   │ AssemblyAI   │
                                   │ Real-time    │
                                   │ Transcription│
                                   └──────────────┘
```

#### Step 1: Install SDK

```bash
npm install assemblyai
```

#### Step 2: Create Transcription Service

Create `lib/assemblyai/transcription.ts`:

```typescript
import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

export async function createRealtimeTranscriber(
  onTranscript: (transcript: any) => void,
  onError: (error: Error) => void
) {
  const transcriber = client.realtime.transcriber({
    sampleRate: 16000,
    encoding: 'pcm_s16le',
  });

  transcriber.on('transcript', (transcript: any) => {
    if (!transcript.text) return;

    const speaker = detectSpeaker(transcript); // Custom logic
    onTranscript({
      text: transcript.text,
      speaker,
      confidence: transcript.confidence,
      created: new Date().toISOString(),
    });
  });

  transcriber.on('error', onError);

  await transcriber.connect();
  return transcriber;
}

// Helper function to detect speaker (doctor vs patient)
function detectSpeaker(transcript: any): 'doctor' | 'patient' | 'unknown' {
  // You can use additional logic here
  // For MVP, we'll use a simple approach
  return 'unknown';
}
```

#### Step 3: Create API Route for Streaming

Create `app/api/consultation/transcribe/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { createRealtimeTranscriber } from '@/lib/assemblyai/transcription';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { consultationId } = await req.json();

  if (!consultationId) {
    return new Response('Missing consultation ID', { status: 400 });
  }

  const supabase = await createClient();

  // Create WebSocket-like stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const transcriber = await createRealtimeTranscriber(
          // On transcript received
          async (transcript) => {
            // Save to database
            await supabase.from('larinova_transcripts').insert({
              consultation_id: consultationId,
              speaker: transcript.speaker,
              text: transcript.text,
              confidence: transcript.confidence,
              language: 'en', // Detect language
            });

            // Send to client
            const data = `data: ${JSON.stringify(transcript)}\n\n`;
            controller.enqueue(encoder.encode(data));
          },
          // On error
          (error) => {
            console.error('Transcription error:', error);
            controller.error(error);
          }
        );

        // Store transcriber reference (you'll need to manage this)
        // For production, use Redis or in-memory store
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

#### Step 4: Client-Side Audio Capture

Create `lib/assemblyai/audioCapture.ts`:

```typescript
export class AudioCapture {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;

  async start(onAudioData: (data: Blob) => void) {
    // Request microphone permission
    this.audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000,
      },
    });

    this.mediaRecorder = new MediaRecorder(this.audioStream, {
      mimeType: 'audio/webm',
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        onAudioData(event.data);
      }
    };

    this.mediaRecorder.start(250); // Send data every 250ms
  }

  stop() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
    }
  }
}
```

#### Step 5: React Component

Create `components/consultation/TranscriptionView.tsx`:

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { AudioCapture } from '@/lib/assemblyai/audioCapture';
import { Button } from '@/components/ui/button';

export function TranscriptionView({ consultationId }: { consultationId: string }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const audioCapture = useRef<AudioCapture | null>(null);
  const eventSource = useRef<EventSource | null>(null);

  const startRecording = async () => {
    // Start transcription stream
    eventSource.current = new EventSource(
      `/api/consultation/transcribe?consultationId=${consultationId}`
    );

    eventSource.current.onmessage = (event) => {
      const transcript = JSON.parse(event.data);
      setTranscripts((prev) => [...prev, transcript]);
    };

    // Start audio capture
    audioCapture.current = new AudioCapture();
    await audioCapture.current.start(async (audioBlob) => {
      // Send audio to backend (implement WebSocket for production)
      // For MVP, you can use HTTP polling
    });

    setIsRecording(true);
  };

  const stopRecording = () => {
    audioCapture.current?.stop();
    eventSource.current?.close();
    setIsRecording(false);
  };

  return (
    <div className="border border-black p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display uppercase">Live Transcription</h2>
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          className="uppercase"
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {transcripts.map((transcript, idx) => (
          <div
            key={idx}
            className={`p-4 border border-black ${
              transcript.speaker === 'doctor' ? 'bg-black text-white' : 'bg-white'
            }`}
          >
            <div className="text-xs uppercase mb-2 opacity-60">
              {transcript.speaker} • {transcript.confidence?.toFixed(2)}
            </div>
            <div>{transcript.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### Advanced: Speaker Diarization

For better speaker identification, use AssemblyAI's speaker diarization:

```typescript
// In transcription.ts
export async function createRealtimeTranscriber() {
  const transcriber = client.realtime.transcriber({
    sampleRate: 16000,
    encoding: 'pcm_s16le',
    speakerDiarization: true, // Enable speaker diarization
  });

  transcriber.on('transcript.final', (transcript: any) => {
    // transcript.speaker will contain speaker label (A, B, C, etc.)
    const speakerLabel = transcript.speaker;

    // Map speaker labels to doctor/patient
    // You can ask user to identify speakers at start
    const speaker = mapSpeaker(speakerLabel);

    // Process transcript...
  });
}
```

---

### Multi-Language Support

AssemblyAI automatically detects languages. To enable:

```typescript
const transcriber = client.realtime.transcriber({
  sampleRate: 16000,
  languageDetection: true, // Auto-detect language
});
```

Supported languages:
- English, Spanish, French, German, Italian, Portuguese
- Arabic, Hindi, Japanese, Korean, Chinese (Mandarin)
- And 50+ more languages

---

## 2. Resend Email Integration

### What is Resend?

Resend is a modern email API for developers:
- **Simple API**
- **React Email templates** support
- **High deliverability**
- **Generous free tier**

### Pricing & Free Tier

- **Free Tier**: 3,000 emails/month, 100 emails/day
- **Paid**: $20/month for 50,000 emails
- **Perfect for MVP**

---

### Setup Resend

#### Step 1: Create Account

1. Go to https://resend.com
2. Sign up with email
3. Verify email address

#### Step 2: Get API Key

1. Go to **API Keys** section
2. Click **"Create API Key"**
3. Name: `larinova-mvp`
4. Copy key (starts with `re_`)
5. Add to `.env.local`:

```bash
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@yourdomain.com # For now, use your email
```

---

### Implementation

#### Step 1: Install SDK

```bash
npm install resend
```

#### Step 2: Create Email Service

Create `lib/resend/email.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendConsultationSummary({
  patientEmail,
  patientName,
  doctorName,
  consultationDate,
  summary,
  diagnosis,
  prescriptions,
}: {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  consultationDate: string;
  summary: string;
  diagnosis: string;
  prescriptions: any[];
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'hello@larinova.com',
      to: patientEmail,
      subject: `Consultation Summary - ${consultationDate}`,
      html: generateEmailTemplate({
        patientName,
        doctorName,
        consultationDate,
        summary,
        diagnosis,
        prescriptions,
      }),
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send exception:', error);
    return { success: false, error };
  }
}

function generateEmailTemplate({
  patientName,
  doctorName,
  consultationDate,
  summary,
  diagnosis,
  prescriptions,
}: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6;
            color: #000000;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            border-bottom: 2px solid #000000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #000000;
          }
          .section h2 {
            margin-top: 0;
            text-transform: uppercase;
            font-size: 18px;
            letter-spacing: 1px;
          }
          .prescription-item {
            padding: 15px;
            border-left: 3px solid #000000;
            margin-bottom: 15px;
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #cccccc;
            font-size: 12px;
            color: #666666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Larinova</h1>
          <p>Consultation Summary</p>
        </div>

        <p>Dear ${patientName},</p>
        <p>This is a summary of your consultation with Dr. ${doctorName} on ${consultationDate}.</p>

        <div class="section">
          <h2>Consultation Summary</h2>
          <p>${summary}</p>
        </div>

        <div class="section">
          <h2>Diagnosis</h2>
          <p>${diagnosis || 'No specific diagnosis recorded'}</p>
        </div>

        ${prescriptions.length > 0 ? `
          <div class="section">
            <h2>Prescriptions</h2>
            ${prescriptions.map((item: any) => `
              <div class="prescription-item">
                <strong>${item.medicine_name}</strong><br>
                Dosage: ${item.dosage}<br>
                Frequency: ${item.frequency}<br>
                Duration: ${item.duration}<br>
                ${item.instructions ? `Instructions: ${item.instructions}` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <p>If you have any questions about this consultation or prescription, please contact your doctor.</p>

        <div class="footer">
          <p>This email was sent by Larinova - Zero-Knowledge AI Medical Platform</p>
          <p>© 2026 Larinova. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}
```

#### Step 3: Create API Route

Create `app/api/consultation/send-summary/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sendConsultationSummary } from '@/lib/resend/email';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { consultationId } = await req.json();

    if (!consultationId) {
      return NextResponse.json(
        { error: 'Missing consultation ID' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch consultation details
    const { data: consultation, error: consultationError } = await supabase
      .from('larinova_consultations')
      .select(`
        *,
        patient:larinova_patients(*),
        doctor:larinova_doctors(*),
        prescription:larinova_prescriptions(
          *,
          items:larinova_prescription_items(*)
        )
      `)
      .eq('id', consultationId)
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    // Send email
    const result = await sendConsultationSummary({
      patientEmail: consultation.patient.email,
      patientName: consultation.patient.full_name,
      doctorName: consultation.doctor.full_name,
      consultationDate: new Date(consultation.start_time).toLocaleDateString(),
      summary: consultation.summary || 'No summary available',
      diagnosis: consultation.diagnosis || '',
      prescriptions: consultation.prescription?.items || [],
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Update prescription with email sent timestamp
    if (consultation.prescription?.id) {
      await supabase
        .from('larinova_prescriptions')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', consultation.prescription.id);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Send summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Step 4: Trigger Email from Frontend

```typescript
// In your consultation completion component
async function completeConsultation() {
  // 1. Save prescription
  const prescriptionResponse = await fetch('/api/consultation/prescription', {
    method: 'POST',
    body: JSON.stringify({
      consultationId,
      medicines: selectedMedicines,
      doctorNotes,
    }),
  });

  // 2. Send email
  const emailResponse = await fetch('/api/consultation/send-summary', {
    method: 'POST',
    body: JSON.stringify({ consultationId }),
  });

  if (emailResponse.ok) {
    toast.success('Email sent to patient successfully!');
  }
}
```

---

## Testing APIs

### Test AssemblyAI Connection

```bash
curl -X GET "https://api.assemblyai.com/v2/transcript" \
  -H "Authorization: YOUR_ASSEMBLYAI_KEY"
```

Expected: List of transcripts (empty array if none)

### Test Resend Email

Create `app/api/test-email/route.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'your-email@example.com', // Your email
    subject: 'Larinova Test Email',
    html: '<p>If you receive this, Resend is working!</p>',
  });

  return Response.json({ data, error });
}
```

Visit: `http://localhost:3000/api/test-email`

---

## Error Handling

### AssemblyAI Error Codes

- `401`: Invalid API key
- `400`: Bad request (check audio format)
- `429`: Rate limit exceeded
- `500`: Server error

### Resend Error Codes

- `401`: Invalid API key
- `422`: Validation error (check email format)
- `429`: Rate limit exceeded

---

## Production Considerations

### AssemblyAI
- Use WebSocket for real-time streaming
- Implement reconnection logic
- Store transcriber sessions in Redis
- Add audio quality checks

### Resend
- Verify your domain for better deliverability
- Use email templates (React Email)
- Implement email queue for high volume
- Track email opens/clicks

---

## Next Steps

1. ✅ Set up AssemblyAI account and get API key
2. ✅ Set up Resend account and get API key
3. ✅ Add API keys to `.env.local`
4. ✅ Test both APIs with test routes
5. ✅ Implement transcription in consultation flow
6. ✅ Implement email automation after consultation
7. 🚀 Start building features!

---

**Document Version:** 1.0
**Last Updated:** January 23, 2026
