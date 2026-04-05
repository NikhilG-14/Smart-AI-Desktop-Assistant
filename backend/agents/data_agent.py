import logging
import random
from typing import Dict, Any

from backend.agents.base_agent import BaseAgent
from backend.llm_client import _call_ollama, _stream_ollama, DATA_MODEL, _SYSTEM_PROMPT as _BASE_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

_JOKES = [
    "Why do programmers prefer dark mode? Light attracts bugs!",
    "Why did the developer go broke? He used up all his cache!",
    "What's a computer's favourite beat? An algorithm!",
    "Why was the JavaScript developer sad? He didn't know how to null his feelings.",
    "How many programmers does it take to change a light bulb? None — that's a hardware problem.",
]

_SYSTEM_PROMPT = (
    "You are a helpful desktop assistant. "
    "Answer the user's question concisely and clearly in 1–3 sentences. "
    "No JSON, no markdown, just plain text."
)


class DataAgent(BaseAgent):
    """
    Handles conversational / knowledge requests:
    general queries, calculations, unit conversions, jokes.
    Delegates to the Ollama LLM in free-text (non-JSON) mode.
    """

    SUPPORTED_INTENTS = {"general_query", "calculate", "convert_units", "tell_joke"}

    def __init__(self, model: str = DATA_MODEL):
        super().__init__("data")
        self.model = model

    def can_handle(self, intent: str) -> bool:
        return intent in self.SUPPORTED_INTENTS

    def execute(self, intent: str, slots: Dict[str, Any]) -> str:
        logger.info(f"[DataAgent] intent={intent} slots={slots}")

        if intent == "tell_joke":
            return random.choice(_JOKES)

        elif intent == "calculate":
            expr = slots.get("expression", slots.get("query", "")).strip()
            if not expr:
                return "What would you like me to calculate?"
            return self._ask_llm(f"Calculate: {expr}. Return only the numeric result.")

        elif intent == "convert_units":
            value     = slots.get("value", "1")
            from_unit = slots.get("from_unit", slots.get("from", ""))
            to_unit   = slots.get("to_unit",   slots.get("to",   ""))
            if not from_unit or not to_unit:
                return "Please specify both source and target units."
            return self._ask_llm(f"Convert {value} {from_unit} to {to_unit}. One line answer only.")

        else:  # general_query (and fallback)
            query = slots.get("query", slots.get("question", "")).strip()
            if not query:
                yield "How can I help you?"
            else:
                for chunk in _stream_ollama(query, _BASE_SYSTEM_PROMPT, self.model):
                    yield chunk

    def _ask_llm(self, prompt: str) -> str:
        try:
            answer = _call_ollama(prompt, _SYSTEM_PROMPT, self.model)
            return answer or "I don't have an answer for that right now."
        except Exception as e:
            logger.error(f"[DataAgent] LLM error: {e}")
            return "I couldn't reach my knowledge base. Please try again."
