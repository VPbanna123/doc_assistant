
import os
import tempfile
import logging
from faster_whisper import WhisperModel
from pydub import AudioSegment
import io

logging.basicConfig()
logging.getLogger("faster_whisper").setLevel(logging.WARNING)

class EnhancedSpeechToText:
    def __init__(self):
        print("🎤 Loading Faster-Whisper model...")
        try:
            self.whisper_model = WhisperModel(
                "base",
                device="cpu",
                compute_type="int8",
                download_root=None,
                local_files_only=False
            )
            print("✅ Faster-Whisper model loaded successfully!")
            self.whisper_available = True
        except Exception as e:
            print(f"❌ Faster-Whisper model loading failed: {e}")
            self.whisper_model = None
            self.whisper_available = False

    def convert_audio_format(self, audio_input):
        """Convert audio file to WAV format - handles both file objects and file paths"""
        try:
            # Check if input is a file path (string) or file object
            if isinstance(audio_input, str):
                # It's a file path - process directly
                print(f"🔄 Converting audio from file path: {audio_input}")
                
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
                    try:
                        # Load audio directly from file path
                        audio_segment = AudioSegment.from_file(audio_input)
                        audio_segment = audio_segment.set_channels(1)
                        audio_segment = audio_segment.set_frame_rate(16000)
                        audio_segment.export(temp_wav.name, format="wav")
                        print(f"✅ Audio converted successfully to: {temp_wav.name}")
                        return temp_wav.name
                    except Exception as e:
                        print(f"Audio conversion failed: {e}")
                        # If conversion fails, check if original file is already compatible
                        if audio_input.lower().endswith(('.wav', '.mp3', '.m4a', '.flac', '.ogg')):
                            print("Using original file as fallback")
                            return audio_input
                        return None
            else:
                # It's a file object
                print("🔄 Converting audio from file object...")
                
                audio_data = audio_input.read()
                audio_input.seek(0)

                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
                    audio_io = io.BytesIO(audio_data)
                    try:
                        audio_segment = AudioSegment.from_file(audio_io)
                        audio_segment = audio_segment.set_channels(1)
                        audio_segment = audio_segment.set_frame_rate(16000)
                        audio_segment.export(temp_wav.name, format="wav")
                        return temp_wav.name
                    except Exception as e:
                        print(f"Audio conversion failed: {e}")
                        temp_wav.write(audio_data)
                        return temp_wav.name
                        
        except Exception as e:
            print(f"Audio conversion error: {e}")
            return None

    def faster_whisper_transcribe(self, audio_input):
        """Transcribe using faster-whisper - handles both file objects and file paths"""
        if not self.whisper_available:
            return None

        try:
            print("🎧 Converting audio format...")
            wav_path = self.convert_audio_format(audio_input)
            if not wav_path:
                print("❌ Audio conversion failed")
                return None

            print(f"🚀 Transcribing with Faster-Whisper: {wav_path}")
            
            # Verify file exists and is not empty
            if not os.path.exists(wav_path):
                print(f"❌ Audio file not found: {wav_path}")
                return None
                
            if os.path.getsize(wav_path) == 0:
                print(f"❌ Audio file is empty: {wav_path}")
                return None

            segments, info = self.whisper_model.transcribe(
                wav_path,
                beam_size=5,
                language=None,
                task="transcribe",
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=1000),
                word_timestamps=False,
                condition_on_previous_text=True
            )

            transcript_parts = []
            total_duration = 0
            for segment in segments:
                transcript_parts.append(segment.text)
                total_duration = max(total_duration, segment.end)

            full_transcript = " ".join(transcript_parts).strip()

            # Clean up temporary WAV file if it was created
            try:
                if wav_path != audio_input and os.path.exists(wav_path):
                    os.unlink(wav_path)
                    print(f"🧹 Cleaned up temporary file: {wav_path}")
            except:
                pass

            detected_language = info.language
            language_confidence = info.language_probability

            language_names = {
                'hi': 'Hindi', 'kn': 'Kannada', 'mr': 'Marathi',
                'ta': 'Tamil', 'te': 'Telugu', 'bn': 'Bengali',
                'gu': 'Gujarati', 'pa': 'Punjabi', 'en': 'English',
                'ur': 'Urdu', 'ne': 'Nepali', 'si': 'Sinhala',
                'ml': 'Malayalam', 'or': 'Odia', 'as': 'Assamese'
            }

            language_name = language_names.get(detected_language, detected_language.upper())
            confidence_level = "high" if language_confidence > 0.8 else "medium" if language_confidence > 0.5 else "low"

            print(f"✅ Transcription completed!")
            print(f"   Language: {language_name} ({language_confidence:.2f})")
            print(f"   Duration: {total_duration:.1f}s")
            print(f"   Text: {full_transcript[:100]}{'...' if len(full_transcript) > 100 else ''}")

            return {
                "text": full_transcript,
                "language": language_name,
                "language_code": detected_language,
                "language_confidence": language_confidence,
                "duration": total_duration,
                "source": "faster_whisper",
                "confidence": confidence_level,
                "segments_count": len(transcript_parts)
            }

        except Exception as e:
            print(f"❌ Faster-Whisper transcription error: {e}")
            import traceback
            traceback.print_exc()
            
            # Clean up on error
            try:
                if 'wav_path' in locals() and wav_path != audio_input and os.path.exists(wav_path):
                    os.unlink(wav_path)
            except:
                pass
            return None

    def transcribe_audio(self, audio_input, preferred_language="auto"):
        """Main transcription method - handles both file objects and file paths"""
        if not self.whisper_available:
            return {
                "text": "Faster-Whisper not available. Please install: pip install faster-whisper",
                "language": "unknown",
                "source": "error",
                "confidence": "low"
            }

        print("🎯 Starting transcription...")
        print(f"   Input type: {type(audio_input)}")
        if isinstance(audio_input, str):
            print(f"   File path: {audio_input}")
            print(f"   File exists: {os.path.exists(audio_input)}")
            print(f"   File size: {os.path.getsize(audio_input) if os.path.exists(audio_input) else 'N/A'} bytes")
        
        result = self.faster_whisper_transcribe(audio_input)

        if result and result["text"] and result["text"].strip():
            print("✅ Transcription successful!")
            return result
        else:
            print("❌ Transcription failed or returned empty text")

        return {
            "text": "Unable to transcribe audio. Please check audio quality and format.",
            "language": "unknown",
            "language_code": "unknown",
            "source": "failed",
            "confidence": "low"
        }

# Global instance
enhanced_speech = EnhancedSpeechToText()
