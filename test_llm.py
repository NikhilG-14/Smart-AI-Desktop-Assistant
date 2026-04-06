import requests
import json
try:
    resp = requests.post('http://localhost:11434/api/generate', json={'model': 'qwen3:8b', 'prompt': 'test', 'stream': False}, timeout=10)
    print("Status code:", resp.status_code)
    print("Response:", resp.text)
except Exception as e:
    print("Error:", e)
