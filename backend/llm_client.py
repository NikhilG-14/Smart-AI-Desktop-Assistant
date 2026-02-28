import os
import json
import requests
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

logger = logging.getLogger(__name__)

MODEL_NAME  = os.getenv("OLLAMA_MODEL",    "qwen3:1.7b")
BASE_URL    = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_TEMP    = float(os.getenv("LLM_TEMPERATURE", 0))
LLM_TIMEOUT = int(os.getenv("LLM_TIMEOUT", 60))

OLLAMA_URL = f"{BASE_URL}/api/generate"


def _call_ollama(
    prompt: str,
    system_prompt: str = "",
    model: str = MODEL_NAME,
    temperature: float = LLM_TEMP,
    timeout: int = LLM_TIMEOUT,
) -> str:
    """
    Low-level helper: send a prompt to Ollama and return the raw response string.
    Used by DecisionEngine and DataAgent.
    """
    payload: Dict[str, Any] = {
        "model":       model,
        "prompt":      prompt,
        "temperature": temperature,
        "stream":      False,
    }
    if system_prompt:
        payload["system"] = system_prompt

    try:
        resp = requests.post(OLLAMA_URL, json=payload, timeout=timeout)
        resp.raise_for_status()
        return resp.json().get("response", "").strip()
    except requests.exceptions.RequestException as e:
        logger.error(f"Ollama connection error: {e}")
        raise
    except Exception as e:
        logger.error(f"Ollama unexpected error: {e}")
        raise


def analyze_screen(user_query: str) -> str:
    """
    Visual analysis via a vision-capable model.
    The current model (qwen3:1.7b) is not a vision model,
    so this returns a friendly error.
    """
    return "Visual analysis is not supported with the current model settings."
