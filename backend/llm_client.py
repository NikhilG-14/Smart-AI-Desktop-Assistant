import os
import json
import requests
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

logger = logging.getLogger(__name__)

MODEL_NAME     = os.getenv("OLLAMA_MODEL",    "vani-model:latest")
ROUTING_MODEL  = os.getenv("ROUTING_MODEL",   "llama3.2:latest")
DATA_MODEL     = os.getenv("DATA_MODEL",      "vani-model:latest")
BASE_URL       = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_TEMP       = float(os.getenv("LLM_TEMPERATURE", 0))
LLM_TIMEOUT    = int(os.getenv("LLM_TIMEOUT", 60))

OLLAMA_URL = f"{BASE_URL}/api/generate"

_SYSTEM_PROMPT = (
    "You are V.A.N.I.N.I., a helpful desktop assistant. "
    "Answer concisely and clearly in 1–3 sentences. "
    "Be helpful, polite, and avoid markdown or JSON symbols in your speech."
)


def _call_ollama(
    prompt: str,
    system_prompt: str = "",
    model: str = MODEL_NAME,
    temperature: float = LLM_TEMP,
    timeout: int = LLM_TIMEOUT,
) -> str:
    """Synchronous version for internal logic (DecisionEngine)."""
    payload = {
        "model": model, "prompt": prompt, "system": system_prompt,
        "temperature": temperature, "stream": False,
    }
    try:
        resp = requests.post(OLLAMA_URL, json=payload, timeout=timeout)
        resp.raise_for_status()
        return resp.json().get("response", "").strip()
    except Exception as e:
        logger.error(f"Ollama error: {e}")
        raise


def _stream_ollama(
    prompt: str,
    system_prompt: str = "",
    model: str = MODEL_NAME,
    temperature: float = LLM_TEMP,
):
    """Asynchronous generator for streaming responses to the frontend."""
    payload = {
        "model": model, "prompt": prompt, "system": system_prompt,
        "temperature": temperature, "stream": True,
    }
    try:
        with requests.post(OLLAMA_URL, json=payload, stream=True) as resp:
            resp.raise_for_status()
            for line in resp.iter_lines():
                if line:
                    chunk = json.loads(line.decode("utf-8"))
                    text = chunk.get("response", "")
                    if text:
                        yield text
                    if chunk.get("done"):
                        break
    except Exception as e:
        logger.error(f"Ollama streaming error: {e}")
        yield f"Error: {e}"


def analyze_screen(user_query: str) -> str:
    """
    Visual analysis via a vision-capable model.
    The current model (qwen3:1.7b) is not a vision model,
    so this returns a friendly error.
    """
    return "Visual analysis is not supported with the current model settings."
