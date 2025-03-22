import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables (API key)
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)

def summarize_text(text):
    """Summarize text using Gemini API."""
    try:
        model = genai.GenerativeModel("gemini-1.5-pro")
        prompt = f"Summarize the following medical report:\n{text}"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error: {str(e)}"