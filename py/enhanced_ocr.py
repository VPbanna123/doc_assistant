
# # enhanced_ocr.py - OCR using Tesseract
# import os
# import requests
# import pytesseract
# import cv2
# import numpy as np
# from PIL import Image
# import io
# from dotenv import load_dotenv

# load_dotenv()

# OCR_SPACE_API_KEY = os.getenv("OCR_SPACE_API_KEY")


# class EnhancedOCR:
#     def __init__(self):
#         try:
#             version = pytesseract.get_tesseract_version()
#             print(f"✅ Tesseract version: {version}")
#         except Exception as e:
#             print(f"⚠️ Tesseract issue: {e}")

#     def preprocess_image(self, image):
#         """Image preprocessing for better OCR"""
#         try:
#             opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
#             gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
#             blurred = cv2.GaussianBlur(gray, (5, 5), 0)
#             _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
#             return Image.fromarray(thresh)
#         except Exception as e:
#             print(f"Preprocessing error: {e}")
#             return image

#     def tesseract_ocr(self, image_file):
#         """Tesseract OCR with multiple configurations"""
#         try:
#             image_file.seek(0)
#             image = Image.open(image_file)

#             if image.mode != 'RGB':
#                 image = image.convert('RGB')

#             processed_image = self.preprocess_image(image)

#             configs = [
#                 '--oem 3 --psm 6',
#                 '--oem 3 --psm 4',
#                 '--oem 3 --psm 8',
#                 '--oem 3 --psm 11'
#             ]

#             best_text = ""
#             best_confidence = 0

#             for config in configs:
#                 try:
#                     data = pytesseract.image_to_data(
#                         processed_image,
#                         lang='eng',
#                         config=config,
#                         output_type=pytesseract.Output.DICT
#                     )

#                     confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
#                     if confidences:
#                         avg_confidence = sum(confidences) / len(confidences)
#                         text = pytesseract.image_to_string(processed_image, lang='eng', config=config)
#                         if avg_confidence > best_confidence and text.strip():
#                             best_confidence = avg_confidence
#                             best_text = text.strip()
#                 except Exception:
#                     continue

#             if not best_text or best_confidence < 30:
#                 try:
#                     basic_text = pytesseract.image_to_string(image)
#                     if basic_text.strip():
#                         best_text = basic_text.strip()
#                         best_confidence = 50
#                 except Exception:
#                     pass

#             return {
#                 "text": best_text,
#                 "format": "plain",
#                 "source": "tesseract",
#                 "confidence": best_confidence
#             }

#         except Exception as e:
#             print(f"❌ Tesseract OCR error: {e}")
#             return {
#                 "text": f"OCR Error: {str(e)}",
#                 "format": "plain",
#                 "source": "error",
#                 "confidence": 0
#             }

#     def ocr_space_backup(self, image_file):
#         """OCR.space API backup"""
#         try:
#             if not OCR_SPACE_API_KEY:
#                 return None

#             image_file.seek(0)
#             files = {'file': ('image.jpg', image_file, 'image/jpeg')}
#             data = {
#                 'apikey': OCR_SPACE_API_KEY,
#                 'language': 'eng',
#                 'OCREngine': '2',
#                 'detectOrientation': 'true',
#                 'scale': 'true'
#             }

#             response = requests.post(
#                 'https://api.ocr.space/parse/image',
#                 files=files,
#                 data=data,
#                 timeout=30
#             )

#             if response.status_code == 200:
#                 result = response.json()
#                 if result.get('ParsedResults') and len(result['ParsedResults']) > 0:
#                     parsed_text = result['ParsedResults'][0].get('ParsedText', '')
#                     if parsed_text.strip():
#                         return {
#                             "text": parsed_text.strip(),
#                             "format": "plain",
#                             "source": "ocr_space",
#                             "confidence": 80
#                         }
#             return None
#         except Exception as e:
#             print(f"OCR.space error: {e}")
#             return None

#     def extract_text(self, image_file):
#         """Extract text with fallback options"""
#         print("🚀 Starting OCR extraction...")

#         result = self.tesseract_ocr(image_file)
#         if result and result["text"] and "OCR Error" not in result["text"] and result["confidence"] > 20:
#             return result

#         image_file.seek(0)
#         backup_result = self.ocr_space_backup(image_file)
#         if backup_result and backup_result["text"]:
#             return backup_result

#         return {
#             "text": "Unable to extract text from image. Please ensure clear, readable text.",
#             "format": "plain",
#             "source": "failed",
#             "confidence": 0
#         }

#     def format_medical_report(self, ocr_result):
#         """Format OCR result for medical reports"""
#         text = ocr_result["text"]
#         confidence = ocr_result.get("confidence", 0)
#         source = ocr_result["source"]

#         if not text or "Unable to extract text" in text:
#             return """## 📋 Medical Report Analysis

# ❌ **OCR Failed**
# - No readable text found
# - Try uploading clearer image
# - Ensure good lighting and contrast"""

#         confidence_emoji = "🟢" if confidence > 70 else "🟡" if confidence > 40 else "🔴"

#         return f"""## 📋 Medical Report Analysis

# {confidence_emoji} **OCR Quality: {confidence:.1f}%** *(using {source})*

# ### 📄 Extracted Text:
# {text}

# ### 🔍 Key Information to Review:
# - **Patient Information**
# - **Test Results & Values**
# - **Clinical Findings**
# - **Medications & Dosages**
# - **Important Dates**
# - **Doctor's Recommendations**

# ---
# *🤖 Processed using advanced OCR*"""


# # Global instance
# enhanced_ocr = EnhancedOCR()

# enhanced_ocr.py - OCR using Tesseract
import os
import requests
import pytesseract
import cv2
import numpy as np
from PIL import Image
import io
from dotenv import load_dotenv

load_dotenv()

OCR_SPACE_API_KEY = os.getenv("OCR_SPACE_API_KEY")

class EnhancedOCR:
    def __init__(self):
        try:
            version = pytesseract.get_tesseract_version()
            print(f"✅ Tesseract version: {version}")
        except Exception as e:
            print(f"⚠️ Tesseract issue: {e}")

    def preprocess_image(self, image):
        """Image preprocessing for better OCR"""
        try:
            opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            return Image.fromarray(thresh)
        except Exception as e:
            print(f"Preprocessing error: {e}")
            return image

    def tesseract_ocr(self, image_input):
        """Tesseract OCR with multiple configurations - handles both file objects and file paths"""
        try:
            # Check if input is a file path (string) or file object
            if isinstance(image_input, str):
                # It's a file path
                print(f"📖 Opening image from file path: {image_input}")
                if not os.path.exists(image_input):
                    print(f"❌ Image file not found: {image_input}")
                    return {
                        "text": "Image file not found",
                        "format": "plain",
                        "source": "error",
                        "confidence": 0
                    }
                
                image = Image.open(image_input)
                print(f"✅ Image loaded successfully: {image.size}, {image.mode}")
            else:
                # It's a file object
                print("📖 Opening image from file object...")
                image_input.seek(0)
                image = Image.open(image_input)
                print(f"✅ Image loaded successfully: {image.size}, {image.mode}")

            if image.mode != 'RGB':
                print(f"🔄 Converting image from {image.mode} to RGB")
                image = image.convert('RGB')

            processed_image = self.preprocess_image(image)

            configs = [
                '--oem 3 --psm 6',
                '--oem 3 --psm 4',
                '--oem 3 --psm 8',
                '--oem 3 --psm 11'
            ]

            best_text = ""
            best_confidence = 0

            print("🔍 Trying multiple OCR configurations...")
            for i, config in enumerate(configs):
                try:
                    print(f"   Trying config {i+1}/{len(configs)}: {config}")
                    data = pytesseract.image_to_data(
                        processed_image,
                        lang='eng',
                        config=config,
                        output_type=pytesseract.Output.DICT
                    )

                    confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
                    if confidences:
                        avg_confidence = sum(confidences) / len(confidences)
                        text = pytesseract.image_to_string(processed_image, lang='eng', config=config)
                        text = text.strip()
                        
                        print(f"   Result: {len(text)} chars, {avg_confidence:.1f}% confidence")
                        
                        if avg_confidence > best_confidence and text:
                            best_confidence = avg_confidence
                            best_text = text
                            print(f"   ✅ New best result!")
                except Exception as config_error:
                    print(f"   ❌ Config failed: {config_error}")
                    continue

            # Fallback to basic OCR if no good result
            if not best_text or best_confidence < 30:
                try:
                    print("🔄 Trying basic OCR as fallback...")
                    basic_text = pytesseract.image_to_string(image)
                    if basic_text.strip():
                        best_text = basic_text.strip()
                        best_confidence = 50
                        print("✅ Basic OCR succeeded")
                except Exception:
                    print("❌ Basic OCR also failed")
                    pass

            print(f"🎯 Final OCR result:")
            print(f"   Text length: {len(best_text)} characters")
            print(f"   Confidence: {best_confidence:.1f}%")
            print(f"   Preview: {best_text[:100]}{'...' if len(best_text) > 100 else ''}")

            return {
                "text": best_text,
                "format": "plain",
                "source": "tesseract",
                "confidence": best_confidence
            }

        except Exception as e:
            print(f"❌ Tesseract OCR error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "text": f"OCR Error: {str(e)}",
                "format": "plain",
                "source": "error",
                "confidence": 0
            }

    def ocr_space_backup(self, image_input):
        """OCR.space API backup - handles both file objects and file paths"""
        try:
            if not OCR_SPACE_API_KEY:
                print("⚠️ OCR.space API key not configured")
                return None

            print("🌐 Trying OCR.space as backup...")
            
            # Handle file path vs file object
            if isinstance(image_input, str):
                # It's a file path
                with open(image_input, 'rb') as f:
                    files = {'file': ('image.jpg', f, 'image/jpeg')}
                    return self._call_ocr_space_api(files)
            else:
                # It's a file object
                image_input.seek(0)
                files = {'file': ('image.jpg', image_input, 'image/jpeg')}
                return self._call_ocr_space_api(files)

        except Exception as e:
            print(f"❌ OCR.space error: {e}")
            return None

    def _call_ocr_space_api(self, files):
        """Helper method to call OCR.space API"""
        data = {
            'apikey': OCR_SPACE_API_KEY,
            'language': 'eng',
            'OCREngine': '2',
            'detectOrientation': 'true',
            'scale': 'true'
        }

        response = requests.post(
            'https://api.ocr.space/parse/image',
            files=files,
            data=data,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            if result.get('ParsedResults') and len(result['ParsedResults']) > 0:
                parsed_text = result['ParsedResults'][0].get('ParsedText', '')
                if parsed_text.strip():
                    print(f"✅ OCR.space succeeded: {len(parsed_text)} characters")
                    return {
                        "text": parsed_text.strip(),
                        "format": "plain",
                        "source": "ocr_space",
                        "confidence": 80
                    }
        return None

    def extract_text(self, image_input):
        """Extract text with fallback options - handles both file objects and file paths"""
        print("🚀 Starting OCR extraction...")
        print(f"   Input type: {type(image_input)}")
        
        if isinstance(image_input, str):
            print(f"   File path: {image_input}")
            print(f"   File exists: {os.path.exists(image_input)}")
            if os.path.exists(image_input):
                print(f"   File size: {os.path.getsize(image_input)} bytes")

        # Try primary OCR method
        result = self.tesseract_ocr(image_input)
        if result and result["text"] and "OCR Error" not in result["text"] and result["confidence"] > 20:
            print("✅ Primary OCR successful!")
            return result

        print("⚠️ Primary OCR failed or low confidence, trying backup...")
        
        # Try backup method
        backup_result = self.ocr_space_backup(image_input)
        if backup_result and backup_result["text"]:
            print("✅ Backup OCR successful!")
            return backup_result

        print("❌ All OCR methods failed")
        return {
            "text": "Unable to extract text from image. Please ensure clear, readable text.",
            "format": "plain",
            "source": "failed",
            "confidence": 0
        }

    def format_medical_report(self, ocr_result):
        """Format OCR result for medical reports"""
        text = ocr_result["text"]
        confidence = ocr_result.get("confidence", 0)
        source = ocr_result["source"]

        if not text or "Unable to extract text" in text:
            return """## 📋 Medical Report Analysis

❌ **OCR Failed**
- No readable text found
- Try uploading clearer image
- Ensure good lighting and contrast"""

        confidence_emoji = "🟢" if confidence > 70 else "🟡" if confidence > 40 else "🔴"

        return f"""## 📋 Medical Report Analysis

{confidence_emoji} **OCR Quality: {confidence:.1f}%** *(using {source})*

### 📄 Extracted Text:
{text}

### 🔍 Key Information to Review:
- **Patient Information**
- **Test Results & Values**
- **Clinical Findings**
- **Medications & Dosages**
- **Important Dates**
- **Doctor's Recommendations**

---
*🤖 Processed using advanced OCR*"""

# Global instance
enhanced_ocr = EnhancedOCR()
