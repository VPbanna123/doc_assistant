from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from enhanced_speech import enhanced_speech
from enhanced_ocr import enhanced_ocr
from utils import enhanced_chatbot_response, get_language_name, get_supported_languages
import google.generativeai as genai
import os
import sys
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
from typing import Optional
import tempfile

load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="🏥 Doctor Assistant API",
    description="AI-powered medical assistant with OCR, speech-to-text, and medical search",
    version="2.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    language: str = "en"

class SummarizeRequest(BaseModel):
    text: str
    language: str = "en"

class ChatResponse(BaseModel):
    reply: str
    sources: list[str] = []
    search_performed: bool = False
    search_query: str = ""

class TranscriptionResponse(BaseModel):
    transcription: str
    language: str = ""
    language_code: str = ""
    source: str = ""
    confidence: str = ""

class OCRResponse(BaseModel):
    text: str
    format: str = "plain"
    source: str = ""
    confidence: float = 0.0
    formatted_report: str = ""

# Initialize Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def summarize_text(text: str, language: str = "en") -> str:
    """Summarize medical text using Gemini in specified language"""
    if not GEMINI_API_KEY:
        return "Gemini API key not configured for summarization."

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        language_name = get_language_name(language)
        
        prompt = f"""
        As a medical expert, analyze this medical text and provide a structured summary in {language_name}.

        **Medical Text:** {text}

        Please respond ONLY in {language_name} and provide a comprehensive summary including:
        - **Patient Information** (if available)
        - **Key Findings**
        - **Test Results**
        - **Medications/Treatments**
        - **Recommendations**
        - **Important Notes**

        Format the response clearly with proper medical terminology in {language_name}.
        Ensure the entire response is in {language_name}, including section headers.
        """

        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Summarization error: {str(e)}"

# MAIN FULL WORKFLOW ENDPOINT
@app.post("/full-workflow")
async def full_workflow(
    file: UploadFile = File(...),
    image: Optional[UploadFile] = File(None),
    language: str = Form("en")
):
    # Initialize response
    response_data = {
        "transcription": "",
        "chatbot_reply": "",
        "sources": [],
        "search_performed": False,
        "extracted_text": "",
        "summary": "",
        "language": language,
        "formatted_report": "",
        "debug_info": {
            "received_file": bool(file),
            "received_filename": file.filename if file else None,
            "received_image": bool(image and image.filename),
            "received_language": language
        }
    }
    
    transcript_text = ""
    extracted_text = ""
    
    # STEP 1: AUDIO TRANSCRIPTION
    if file and file.filename:
        try:
            await file.seek(0)
            audio_bytes = await file.read()
            
            if len(audio_bytes) == 0:
                response_data["transcription"] = "Error: Audio file is empty"
            else:
                # Save to temporary file
                file_extension = os.path.splitext(file.filename)[1] or '.mp3'
                with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension, mode='wb') as tmp:
                    tmp.write(audio_bytes)
                    tmp.flush()
                    audio_path = tmp.name
                
                # Transcribe using enhanced_speech
                with open(audio_path, 'rb') as audio_file_obj:
                    transcript_result = enhanced_speech.transcribe_audio(audio_file_obj)
                
                if transcript_result and isinstance(transcript_result, dict):
                    transcript_text = transcript_result.get("text", "").strip()
                    response_data["transcription"] = transcript_text
                else:
                    response_data["transcription"] = "Transcription failed - invalid result format"
                
                # Cleanup temp file
                try:
                    os.unlink(audio_path)
                except Exception as cleanup_error:
                    pass
                    
        except Exception as e:
            import traceback
            traceback.print_exc()
            response_data["transcription"] = f"Audio processing error: {str(e)}"
    else:
        response_data["transcription"] = "No audio file provided"
    
    # STEP 2: IMAGE OCR PROCESSING
    if image and image.filename:
        try:
            await image.seek(0)
            
            ocr_result = enhanced_ocr.extract_text(image.file)
            
            if ocr_result and isinstance(ocr_result, dict):
                extracted_text = ocr_result.get("text", "").strip()
                response_data["extracted_text"] = extracted_text
                
                # Format medical report
                try:
                    formatted_report = enhanced_ocr.format_medical_report(ocr_result)
                    response_data["formatted_report"] = formatted_report
                except Exception as format_error:
                    response_data["formatted_report"] = extracted_text
            else:
                response_data["extracted_text"] = "OCR failed - invalid result format"
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            response_data["extracted_text"] = f"OCR processing error: {str(e)}"
    else:
        response_data["extracted_text"] = "No image file provided"
    
    # STEP 3: MEDICAL ANALYSIS WITH CHATBOT
    try:
        # Combine all available text for analysis
        combined_text = ""
        
        if transcript_text:
            combined_text += f"PATIENT AUDIO TRANSCRIPTION:\n{transcript_text}\n\n"
            
        if extracted_text:
            combined_text += f"MEDICAL DOCUMENT TEXT (OCR):\n{extracted_text}\n\n"
        
        if combined_text.strip():
            # Create comprehensive medical analysis prompt
            language_name = get_language_name(language)
            medical_prompt = f"""
As an expert medical AI assistant, analyze the following medical information and provide a comprehensive professional assessment:

{combined_text}

Please provide a detailed medical analysis in {language_name} including:

1. **Patient Information Summary** (if available from the data)
2. **Primary Symptoms Analysis** (from audio/documents)
3. **Key Medical Findings** (test results, measurements, observations)
4. **Clinical Assessment** (potential diagnoses based on symptoms/findings)
5. **Recommendations** (suggested actions, follow-up care, lifestyle changes)
6. **Important Warnings** (urgent concerns, contraindications, precautions)
7. **Additional Notes** (relevant medical context or considerations)

Format your response in clear, professional medical language suitable for healthcare professionals.
Use proper medical terminology and provide evidence-based analysis.
Respond entirely in: {language_name}
"""
            
            chatbot_result = enhanced_chatbot_response(medical_prompt, language)
            
            if chatbot_result and isinstance(chatbot_result, dict):
                response_data["chatbot_reply"] = chatbot_result.get("response", "")
                response_data["sources"] = chatbot_result.get("sources", [])
                response_data["search_performed"] = chatbot_result.get("search_performed", False)
            else:
                response_data["chatbot_reply"] = "Medical analysis failed - chatbot error"
            
        else:
            response_data["chatbot_reply"] = "No medical data available for analysis. Please provide audio recording or medical documents."
            response_data["sources"] = []
            response_data["search_performed"] = False
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        response_data["chatbot_reply"] = f"Medical analysis error: {str(e)}"
        response_data["sources"] = []
        response_data["search_performed"] = False
    
    # STEP 4: GENERATE FINAL SUMMARY
    try:
        if combined_text.strip() and response_data["chatbot_reply"]:
            # Combine all information for summary
            full_analysis = f"""
MEDICAL DATA:
{combined_text}

AI ANALYSIS:
{response_data['chatbot_reply']}
"""
            
            summary_text = summarize_text(full_analysis, language)
            response_data["summary"] = summary_text
            
        else:
            response_data["summary"] = "Unable to create summary - insufficient medical data provided."
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        response_data["summary"] = f"Summary generation error: {str(e)}"
    
    return JSONResponse(content=response_data)

# Additional endpoints
@app.post("/chatbot", response_model=ChatResponse)
async def chat(chat_req: ChatRequest):
    try:
        result = enhanced_chatbot_response(chat_req.message, chat_req.language)
        return ChatResponse(
            reply=result["response"],
            sources=result["sources"],
            search_performed=result["search_performed"],
            search_query=result.get("search_query", "")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    try:
        result = enhanced_speech.transcribe_audio(file.file)
        return TranscriptionResponse(
            transcription=result["text"],
            language=result.get("language", ""),
            language_code=result.get("language_code", ""),
            source=result["source"],
            confidence=result["confidence"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")

@app.post("/extract-text", response_model=OCRResponse)
async def ocr(image: UploadFile = File(...)):
    if not image.filename:
        raise HTTPException(status_code=400, detail="No image provided")

    try:
        ocr_result = enhanced_ocr.extract_text(image.file)
        formatted_report = enhanced_ocr.format_medical_report(ocr_result)

        return OCRResponse(
            text=ocr_result["text"],
            format=ocr_result["format"],
            source=ocr_result["source"],
            confidence=ocr_result.get("confidence", 0.0),
            formatted_report=formatted_report
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR error: {str(e)}")

@app.post("/summarize")
async def summarize(req: SummarizeRequest):
    try:
        summary = summarize_text(req.text, req.language)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization error: {str(e)}")

@app.get("/")
async def root():
    return {
        "message": "🏥 Doctor Assistant API is running!",
        "status": "healthy",
        "version": "2.0.0",
        "supported_languages": list(get_supported_languages().keys())
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "🏥 Doctor Assistant API",
        "supported_languages": get_supported_languages(),
        "features": {
            "🤖 Medical AI": "Gemini-powered medical analysis",
            "🔎 Medical Search": "Google Custom Search",
            "🔍 OCR": "Tesseract with preprocessing",
            "📝 Summarization": "AI-powered medical summaries",
            "🎤 Speech": "Faster-Whisper transcription",
            "🌐 Multi-language": "Support for 12 languages"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="127.0.0.1", 
        port=5002, 
        reload=False, 
        log_level="info"
    )
