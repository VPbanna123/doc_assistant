from flask import Flask, request, jsonify
from flask_cors import CORS
from whisper_transcribe import transcribe_audio
from chatbot import chatbot_response
from ocr_extraction import extract_text
from summarizer import summarize_text
# from voice import voice_bp 

app = Flask(__name__)
CORS(app)
# app.register_blueprint(voice_bp, url_prefix='/api/voice')

# 1️⃣ Speech-to-text (Whisper)
@app.route('/transcribe', methods=['POST'])
def transcribe():
    audio_file = request.files['file']
    text = transcribe_audio(audio_file)
    return jsonify({"transcription": text})

# 2️⃣ Chatbot for Symptoms, Disease Prediction, and Test Suggestions
@app.route('/chatbot', methods=['POST'])
def chat():
    user_message = request.json.get("message")
    response = chatbot_response(user_message)
    return jsonify({"reply": response})

# 3️⃣ OCR for Medical Report
@app.route('/extract-text', methods=['POST'])
def ocr():
    image_file = request.files['image']
    extracted_text = extract_text(image_file)
    return jsonify({"text": extracted_text})

# 4️⃣ Summarizer for Medical Report
@app.route('/summarize', methods=['POST'])
def summarize():
    text = request.json.get("text")
    summary = summarize_text(text)
    return jsonify({"summary": summary})

# 5️⃣ Full Workflow (Test End-to-End)
# @app.route('/full-workflow', methods=['POST'])
# def full_workflow():
#     """Runs full process: Transcription → Chatbot → OCR → Summarization"""
#     try:
#         # Step 1: Transcribe audio
#         audio_file = request.files['file']
#         transcript = transcribe_audio(audio_file)

#         # Step 2: Get chatbot response

#         health_prompt = f"""Act as a senior health expert. Analyze this doctor-patient conversation:
#         {transcript}
        
#         Provide structured response with:
#         - Key symptoms observed
#         - Potential diagnoses (list 3 possibilities)
#         - Recommended medical tests
#         - Urgency level (low/medium/high)
#         - Brief clinical rationale"""

#         chatbot_result = chatbot_response(health_prompt)

#         # Step 3 (Optional): Extract text from report
#         if 'image' in request.files:
#             image_file = request.files['image']
#             extracted_text = extract_text(image_file)

#             # Step 4: Summarize extracted text
#             summary = summarize_text(extracted_text)

#             return jsonify({
#                 "transcription": transcript,
#                 "chatbot_reply": chatbot_result,
#                 "extracted_text": extracted_text,
#                 "summary": summary
#             })

#         return jsonify({
#             "transcription": transcript,
#             "chatbot_reply": chatbot_result
#         })

#     except Exception as e:
#         return jsonify({"error": str(e)})
@app.route('/full-workflow', methods=['POST'])
def full_workflow():
    """Runs full process: Transcription → Chatbot → OCR → Summarization"""
    try:
        # Check if audio file exists in request
        if 'file' not in request.files:
            return jsonify({"error": "Audio/video file is required"}), 400
            
        # Step 1: Transcribe audio
        audio_file = request.files['file']
        if audio_file.filename == '':
            return jsonify({"error": "No audio/video file selected"}), 400
            
        transcript = transcribe_audio(audio_file)

        # Step 2: Get chatbot response
        health_prompt = f"""Act as a senior health expert. Analyze this doctor-patient conversation:
        {transcript}
        
        Provide structured response with:
        - Key symptoms observed
        - Potential diagnoses (list 3 possibilities)
        - Recommended medical tests
        - Urgency level (low/medium/high)
        - Brief clinical rationale

         Format response in markdown with clear section headings."""

        chatbot_result = chatbot_response(health_prompt)

        # Prepare the response
        response_data = {
            "transcription": transcript,
            "chatbot_reply": chatbot_result
        }

        # Step 3 (Optional): Extract text from report if image exists
        if 'image' in request.files and request.files['image'].filename != '':
            image_file = request.files['image']
            extracted_text = extract_text(image_file)
            response_data["extracted_text"] = extracted_text

            # Step 4: Summarize extracted text only if we have text
            if extracted_text:
                summary = summarize_text(extracted_text)
                response_data["summary"] = summary

        return jsonify(response_data)

    except Exception as e:
        # Log the full error for debugging
        app.logger.error(f"Error in full workflow: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
     app.run(debug=True, port=5002)