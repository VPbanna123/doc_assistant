import pytesseract
from PIL import Image
import io

def extract_text(image_file):
    image = Image.open(io.BytesIO(image_file.read()))
    text = pytesseract.image_to_string(image)
    return text