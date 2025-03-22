import whisper

# Load a smaller Whisper model
model = whisper.load_model("tiny")  

def transcribe_audio(audio_file):
    file_path = "test.mp3"
    audio_file.save(file_path)  # Save file instead of loading into RAM

    result = model.transcribe(file_path, fp16=False)  # Disable 16-bit floats to save memory
    return result["text"]