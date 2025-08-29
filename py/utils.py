import os
import re
import backoff
import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

# Configuration
NUM_SEARCH = 5
LLM_MODEL = 'gemini-1.5-flash'
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
PSE_ID = os.getenv('PROGRAMMABLE_SEARCH_ENGINE_ID')

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Language mapping - CENTRALIZED HERE
LANGUAGE_NAMES = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French', 
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi',
}

# Helper functions for language handling
def get_language_name(code: str) -> str:
    """Get full language name from language code"""
    return LANGUAGE_NAMES.get(code, 'English')

def get_supported_languages() -> dict:
    """Get all supported languages"""
    return LANGUAGE_NAMES

def get_disclaimer(language: str) -> str:
    """Get medical disclaimer in specified language"""
    disclaimers = {
        'en': "\n\n*⚠️ This information is for educational purposes. Always consult healthcare professionals for medical advice.*",
        'es': "\n\n*⚠️ Esta información es para fines educativos. Siempre consulte a profesionales de la salud para obtener consejos médicos.*",
        'fr': "\n\n*⚠️ Ces informations sont à des fins éducatives. Consultez toujours des professionnels de la santé pour des conseils médicaux.*",
        'de': "\n\n*⚠️ Diese Informationen dienen Bildungszwecken. Wenden Sie sich für medizinische Beratung immer an Gesundheitsfachkräfte.*",
        'it': "\n\n*⚠️ Queste informazioni sono a scopo educativo. Consulta sempre i professionisti sanitari per consigli medici.*",
        'pt': "\n\n*⚠️ Esta informação é para fins educacionais. Consulte sempre profissionais de saúde para aconselhamento médico.*",
        'ru': "\n\n*⚠️ Эта информация предназначена для образовательных целей. Всегда обращайтесь к медицинским работникам за медицинской консультацией.*",
        'zh': "\n\n*⚠️ 此信息仅供教育目的。请始终咨询医疗专业人员获取医疗建议。*",
        'ja': "\n\n*⚠️ この情報は教育目的のものです。医学的アドバイスについては、必ず医療従事者にご相談ください。*",
        'ko': "\n\n*⚠️ 이 정보는 교육 목적입니다. 의료 조언은 항상 의료 전문가에게 문의하세요.*",
        'ar': "\n\n*⚠️ هذه المعلومات لأغراض تعليمية. استشر دائماً المتخصصين في الرعاية الصحية للحصول على المشورة الطبية.*",
        'hi': "\n\n*⚠️ यह जानकारी शैक्षणिक उद्देश्यों के लिए है। चिकित्सा सलाह के लिए हमेशा स्वास्थ्य पेशेवरों से सलाह लें।*",
    }
    return disclaimers.get(language, disclaimers['en'])

def get_short_disclaimer(language: str) -> str:
    """Get short medical disclaimer in specified language"""
    disclaimers = {
        'en': "\n\n*⚠️ Educational purposes only. Consult healthcare professionals.*",
        'es': "\n\n*⚠️ Solo para fines educativos. Consulte a profesionales de la salud.*",
        'fr': "\n\n*⚠️ À des fins éducatives uniquement. Consultez des professionnels de la santé.*",
        'de': "\n\n*⚠️ Nur zu Bildungszwecken. Wenden Sie sich an Gesundheitsfachkräfte.*",
        'it': "\n\n*⚠️ Solo a scopo educativo. Consulta professionisti sanitari.*",
        'pt': "\n\n*⚠️ Apenas para fins educacionais. Consulte profissionais de saúde.*",
        'ru': "\n\n*⚠️ Только в образовательных целях. Обратитесь к медицинским работникам.*",
        'zh': "\n\n*⚠️ 仅供教育目的。咨询医疗专业人员。*",
        'ja': "\n\n*⚠️ 教育目的のみ。医療従事者にご相談ください。*",
        'ko': "\n\n*⚠️ 교육 목적만. 의료 전문가에게 문의하세요.*",
        'ar': "\n\n*⚠️ لأغراض تعليمية فقط. استشر المتخصصين في الرعاية الصحية.*",
        'hi': "\n\n*⚠️ केवल शैक्षणिक उद्देश्यों के लिए। स्वास्थ्य पेशेवरों से सलाह लें।*",
    }
    return disclaimers.get(language, disclaimers['en'])

def get_system_prompt(language: str) -> str:
    """Get system prompt in specified language"""
    language_name = get_language_name(language)
    return f"You are a knowledgeable medical assistant. Provide comprehensive, well-structured answers to medical questions in {language_name}. Ensure all responses are in {language_name} only."

def get_answer_prompt(language: str) -> str:
    """Get answer prompt template in specified language"""
    language_name = get_language_name(language)
    
    return f"""
Provide a COMPREHENSIVE medical answer to the user's query in {language_name}.

REQUIREMENTS:
1. **Length:** Detailed explanations (8-15 lines)
2. **Structure:** Clear headings, bullet points
3. **Citations:** Use [1], [2], [3] after relevant facts
4. **Medical Focus:** Include symptoms, causes, treatments, prevention
5. **Clarity:** Explain medical terms clearly
6. **Language:** Respond ONLY in {language_name}

Available Sources:
{{context_block}}

User Question: {{query}}

Provide detailed medical answer with citations in {language_name}:
"""

def search_with_pse(query, language="en"):
    """Search medical sources using Google Custom Search"""
    try:
        if not all([GOOGLE_API_KEY, PSE_ID]):
            return {}

        service = build("customsearch", "v1", developerKey=GOOGLE_API_KEY)
        
        # Add language-specific search terms if not English
        if language != 'en':
            language_name = get_language_name(language)
            medical_query = f"{query} medical health symptoms treatment causes prevention {language_name}"
        else:
            medical_query = f"{query} medical health symptoms treatment causes prevention"
            
        res = service.cse().list(q=medical_query, cx=PSE_ID, num=NUM_SEARCH).execute()

        if 'items' in res:
            search_results = {}
            for item in res['items']:
                url = item['link']
                snippet = item.get('snippet', '')[:400]
                title = item.get('title', '')[:150]
                search_results[url] = {'snippet': snippet, 'title': title}

            print(f"✅ Found {len(search_results)} medical sources")
            return search_results
        return {}
    except Exception as e:
        print(f"❌ Search error: {e}")
        return {}

@backoff.on_exception(backoff.expo, (google_exceptions.ResourceExhausted, google_exceptions.ServiceUnavailable))
def llm_check_search(query, language="en"):
    """Check if query needs web search"""
    try:
        if not GEMINI_API_KEY:
            return query

        language_name = get_language_name(language)
        prompt = f"User Query: {query}\n\nRespond in {language_name}."
        
        model = genai.GenerativeModel(
            LLM_MODEL,
            system_instruction=f"Decide if query needs web search. If yes, reformulate for search in {language_name}. If no, respond 'ns'."
        )
        response = model.generate_content(prompt)
        cleaned_response = response.text.lower().strip()

        if re.fullmatch(r"\bns\b", cleaned_response):
            return None
        return cleaned_response
    except Exception:
        return query

@backoff.on_exception(backoff.expo, (google_exceptions.ResourceExhausted, google_exceptions.ServiceUnavailable))
def llm_answer_with_search(query, search_results=None, language="en"):
    """Generate comprehensive medical answer in specified language"""
    try:
        if not GEMINI_API_KEY:
            return "Gemini API key not configured."

        if search_results:
            context_parts = []
            for i, (url, data) in enumerate(search_results.items(), 1):
                context_parts.append(f"[{i}] {data['snippet']}")
            context_block = "\n\n".join(context_parts)
        else:
            context_block = "No sources available."

        answer_prompt = get_answer_prompt(language)
        prompt = answer_prompt.format(context_block=context_block, query=query)

        system_prompt = get_system_prompt(language)
        
        model = genai.GenerativeModel(
            LLM_MODEL,
            system_instruction=system_prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=800,
                temperature=0.4
            )
        )

        response = model.generate_content(prompt)
        answer_text = response.text
        answer_text = re.sub(r'<[^>]+>', '', answer_text)

        # Add disclaimer in appropriate language
        disclaimer = get_disclaimer(language)
        return answer_text + disclaimer

    except Exception as e:
        return f"Error generating medical response: {str(e)}"

def enhanced_chatbot_response(user_message, language="en"):
    """Enhanced chatbot with comprehensive responses in specified language"""
    try:
        search_query = llm_check_search(user_message, language)
        language_name = get_language_name(language)

        if search_query:
            print(f"🔍 Searching for: {search_query}")
            search_results = search_with_pse(search_query, language)
            response = llm_answer_with_search(user_message, search_results, language)
            return {
                "response": response,
                "sources": list(search_results.keys()) if search_results else [],
                "search_performed": True,
                "search_query": search_query
            }
        else:
            print("💭 Direct response...")
            if GEMINI_API_KEY:
                model = genai.GenerativeModel(
                    "gemini-1.5-flash",
                    generation_config=genai.types.GenerationConfig(
                        max_output_tokens=600,
                        temperature=0.4
                    )
                )

                comprehensive_prompt = f"""
                As a medical assistant, provide detailed answer to: {user_message}
                
                IMPORTANT: Respond ONLY in {language_name}.

                Requirements:
                - 8-15 lines of detailed explanation
                - Clear structure with bullet points  
                - Include symptoms, causes, treatments, prevention
                - Explain medical terms clearly
                - Use **bold** for key terms
                - Ensure entire response is in {language_name}
                """

                response = model.generate_content(comprehensive_prompt)
                clean_response = re.sub(r'<[^>]+>', '', response.text)

                disclaimer = get_short_disclaimer(language)
                return {
                    "response": clean_response + disclaimer,
                    "sources": [],
                    "search_performed": False
                }
            else:
                return {
                    "response": "Gemini API key not configured.",
                    "sources": [],
                    "search_performed": False
                }
    except Exception as e:
        return {
            "response": f"Error: {str(e)}",
            "sources": [],
            "search_performed": False
        }
