# Real-Time Transcription with Translation

## Features ✅

### 1. **Continuous Recording**
- Click "START RECORDING" once
- Keeps recording until you click "STOP RECORDING"
- No need to restart - it runs continuously

### 2. **Real-Time Transcription**
- Transcripts appear **instantly** as people speak
- Uses AssemblyAI's WebSocket for real-time streaming
- No delay - see text appear in real-time

### 3. **Automatic Translation**
- **Arabic speech** → Arabic transcript + English subtitle
- **English speech** → English transcript + Arabic subtitle
- Translation appears automatically with each transcript

### 4. **Speaker Identification**
- Automatically identifies different speakers (SPEAKER A, SPEAKER B)
- Maps to doctor/patient based on order
- Color-coded display:
  - Doctor: Black background
  - Patient: White background with black border
  - Unknown: Gray background

## How It Works

```
User speaks → Real-time transcription (AssemblyAI) → Translation (Google) → Display with subtitle
```

1. **Microphone captures audio** continuously
2. **AssemblyAI** transcribes in real-time with speaker labels
3. **Translation API** translates to opposite language
4. **Frontend** displays both original + translation
5. **Database** saves everything

## Usage

1. Navigate to consultation page
2. Click **"START RECORDING"**
3. Speak naturally - transcripts appear in real-time
4. Both doctor and patient see transcriptions with translations
5. Click **"STOP RECORDING"** when consultation ends

## Language Support

- **Arabic** (ar) ↔ English (en)
- Automatic language detection
- Real-time translation
- Both displayed simultaneously

## Display Format

**If speaking Arabic:**
```
مرحبا، كيف حالك؟               [Main text - Arabic]
Hello, how are you?             [Subtitle - English translation]
```

**If speaking English:**
```
Hello, how are you?             [Main text - English]
مرحبا، كيف حالك؟                [Subtitle - Arabic translation]
```

## Technical Details

- **Transcription**: AssemblyAI Real-Time WebSocket API
- **Translation**: Google Translate API (free tier)
- **Speaker Diarization**: AssemblyAI built-in
- **Latency**: < 1 second for transcription, < 500ms for translation
- **Audio Quality**: 16kHz sample rate, echo cancellation enabled

## Troubleshooting

**No transcripts appearing?**
- Check AssemblyAI API key in `.env.local`
- Check browser console for errors
- Ensure microphone permission is granted

**Translation not showing?**
- Translation API is free but rate-limited
- Check network tab for translation API errors

**Speaker identification wrong?**
- AssemblyAI maps speakers as they appear
- First speaker = SPEAKER A (doctor)
- Second speaker = SPEAKER B (patient)
