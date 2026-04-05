import requests
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

model = os.getenv("OLLAMA_MODEL")
base_url = os.getenv("OLLAMA_BASE_URL")
url = f"{base_url}/api/generate"

print(f"Testing connection to {url}")
print(f"Using model: {model}")

payload = {
    "model": model,
    "prompt": "Test connection",
    "stream": False
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:200]}...")
except Exception as e:
    print(f"Error: {e}")
