import re
import string

def preprocess_text(text: str) -> str:
    """
    Cleans the input text for the NLP model.
    1. Lowercase
    2. Remove punctuation
    3. Remove extra whitespace
    """
    if not text:
        return ""
    
    # Lowercase
    text = text.lower()
    
    # Remove punctuation
    text = text.translate(str.maketrans("", "", string.punctuation))
    
    # Remove multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text
