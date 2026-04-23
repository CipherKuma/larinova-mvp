#!/usr/bin/env python3
"""
Local Whisper Server for Arabic Speech Recognition
Run: python3 scripts/whisper-server.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import tempfile
import os
from deep_translator import GoogleTranslator
from pyannote.audio import Pipeline
import torch

app = Flask(__name__)
CORS(app)

# Load Whisper model (medium for better accuracy)
print("Loading Whisper model...")
model = whisper.load_model("medium")  # Options: tiny, base, small, medium, large
print("Model loaded successfully!")

# Load speaker diarization model (requires HF token)
# To use: set HF_TOKEN environment variable
try:
    hf_token = os.getenv('HF_TOKEN')
    if hf_token:
        print("Loading speaker diarization model...")
        diarization_pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=hf_token
        )
        if torch.cuda.is_available():
            diarization_pipeline.to(torch.device("cuda"))
        print("Speaker diarization loaded successfully!")
    else:
        print("⚠️  HF_TOKEN not set - speaker diarization disabled")
        diarization_pipeline = None
except Exception as e:
    print(f"⚠️  Could not load speaker diarization: {e}")
    diarization_pipeline = None

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file'}), 400
        
        audio_file = request.files['audio']
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name
        
        try:
            # Transcribe with automatic language detection
            result = model.transcribe(
                tmp_path,
                language=None,  # Auto-detect language (Arabic, English, etc.)
                task='transcribe',
                fp16=False
            )

            original_text = result['text'].strip()
            detected_language = result['language']
            translation = None

            print(f"📝 Original text: {original_text}")
            print(f"🌍 Detected language: {detected_language}")

            # Translate based on detected language
            try:
                if detected_language == 'ar':
                    # Arabic → English translation
                    print("🔄 Translating Arabic → English...")
                    translation = GoogleTranslator(source='ar', target='en').translate(original_text)
                    print(f"✅ Translation: {translation}")
                elif detected_language == 'en':
                    # English → Arabic translation
                    print("🔄 Translating English → Arabic...")
                    translation = GoogleTranslator(source='en', target='ar').translate(original_text)
                    print(f"✅ Translation: {translation}")
                else:
                    print(f"⚠️  Language '{detected_language}' - no translation configured")
            except Exception as trans_error:
                print(f"❌ Translation error: {trans_error}")
                translation = None

            return jsonify({
                'text': original_text,
                'translation': translation,
                'language': detected_language,
                'segments': [
                    {
                        'text': seg['text'],
                        'start': seg['start'],
                        'end': seg['end']
                    }
                    for seg in result['segments']
                ]
            })
        finally:
            # Clean up temp file
            os.unlink(tmp_path)
    
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'whisper-base', 'language': 'auto-detect'})

if __name__ == '__main__':
    print("\n🎤 Whisper Server Starting...")
    print("📝 Language: AUTO-DETECT (Arabic, English, and 90+ languages)")
    print("🌐 Server: http://localhost:5001")
    print("\n")
    app.run(host='0.0.0.0', port=5001, debug=False)
