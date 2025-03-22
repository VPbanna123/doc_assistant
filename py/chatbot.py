import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables (API key)
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)

def chatbot_response(user_message):
    """Get response from Gemini chatbot."""
    try:
        model = genai.GenerativeModel("gemini-1.5-pro")
        response = model.generate_content(user_message)
        return response.text
    except Exception as e:
        return f"Error: {str(e)}"
