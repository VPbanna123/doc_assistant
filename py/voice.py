# from flask import Blueprint, request, jsonify
# import base64
# import requests
# import os

# voice_bp = Blueprint('voice', __name__)

# # Set your Gemini API key as an environment variable or replace it here
# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your_gemini_api_key")
# GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

# @voice_bp.route('/process', methods=['POST'])
# def process_voice():
#     try:
#         if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key":
#             return jsonify({'error': 'Missing Gemini API key'}), 500

#         if 'audio' not in request.files:
#             return jsonify({'error': 'No audio file provided'}), 400

#         audio_file = request.files['audio']
        
#         # Convert audio file to bytes
#         audio_bytes = audio_file.read()
#         audio_content = base64.b64encode(audio_bytes).decode('utf-8')

#         payload = {
#             "model": "gemini-1.5-flash-latest",  # Updated model name
#             "contents": [{
#                 "role": "user",
#                 "parts": [{
#                     "audio": {
#                         "mimeType": "audio/wav",
#                         "data": audio_content
#                     }
#                 }]
#             }]
#         }

#         # Use query parameter instead of header
#         response = requests.post(
#             f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={GEMINI_API_KEY}",
#             json=payload
#         )

#         if response.status_code != 200:
#             return jsonify({'error': f"Gemini API error: {response.text}"}), response.status_code

#         data = response.json()
#         transcription = data['candidates'][0]['content']['parts'][0]['text']

#         return jsonify({
#             "transcription": transcription,
#             "reply": transcription  # Direct return for testing
#         })

#     except Exception as e:
#         # return jsonify({'error': f"An error occurred: {str(e)}"}), 500