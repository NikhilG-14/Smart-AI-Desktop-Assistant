import json
import logging
from typing import Optional, Dict, Any

from backend.llm_client import _call_ollama, MODEL_NAME

logger = logging.getLogger(__name__)

# ── System prompt: Ollama decides EVERYTHING ────────────────────────────────
_SYSTEM_PROMPT = """\
You are the AI brain of a voice-controlled desktop assistant.
A user has said something. Your ONLY job is to:
  1. Understand what they want (intent)
  2. Pick which specialist agent should handle it
  3. Extract the parameters (slots) the agent needs
  4. Return a strict JSON response

AVAILABLE AGENTS AND THEIR INTENTS:
  agent "system" – controls the operating system
    intents: volume_control, brightness_control, media_pause, media_play,
              media_next, media_prev, screenshot, system_lock, window_minimize,
              time, date, shutdown, restart, set_timer, set_reminder

  agent "web" – opens browsers and searches the internet
    intents: search_web, open_website

  agent "app" – launches or closes applications, plays media
    intents: open_app, close_app, play_youtube, spotify_play

  agent "data" – answers questions, does math, conversational fallback
    intents: general_query, calculate, convert_units, tell_joke

SLOT EXAMPLES:
  volume_control   → { "level": 50 }
  set_timer        → { "duration": "10 minutes" }
  open_app         → { "app_name": "Chrome" }
  play_youtube     → { "query": "lofi music" }
  search_web       → { "query": "python tutorials" }
  open_website     → { "url": "github.com" }
  set_reminder     → { "message": "call mom in 30 minutes" }
  general_query    → { "query": "what is machine learning" }
  calculate        → { "expression": "25 * 4" }
  convert_units    → { "value": 100, "from_unit": "km", "to_unit": "miles" }

OUTPUT FORMAT — return ONLY this JSON, no other text, no markdown:
{
  "agent": "system" | "web" | "app" | "data",
  "intent": string,
  "slots": object,
  "confidence": number between 0.0 and 1.0,
  "needs_clarification": boolean,
  "clarification_question": string or null
}

RULES:
- Always return valid JSON.
- If the command is ambiguous, set needs_clarification = true and ask one question.
- If you cannot match any intent, route to data / general_query.
- Do NOT invent agents or intents outside the list above.
"""


class DecisionEngine:
    """
    Fully AI-driven router.
    Ollama identifies intent, picks the agent, and extracts slots.
    The SVM predicted_intent (if any) is passed as a hint only —
    Ollama makes the final call.
    """

    def __init__(self, model: str = MODEL_NAME):
        self.model = model

    def decide(
        self,
        user_input: str,
        predicted_intent: Optional[str] = None,
        entities: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Always calls Ollama to produce a routing + extraction decision.
        predicted_intent from SVM is provided as a hint, not used directly.
        """
        hint = ""
        if predicted_intent and predicted_intent not in ("unknown", "unsupported"):
            hint = f'\n(Local NLP hint — may be wrong: "{predicted_intent}")'
        if entities:
            hint += f"\n(Extracted entities so far: {json.dumps(entities)})"

        prompt = (
            f'User said: "{user_input}"{hint}\n\n'
            f"Route this to the correct agent and extract slots. Return JSON only:"
        )

        try:
            raw = _call_ollama(prompt, _SYSTEM_PROMPT, self.model)
            logger.debug(f"[DecisionEngine] Raw LLM output: {raw}")
            decision = self._parse(raw)
            logger.info(
                f"[DecisionEngine] agent={decision.get('agent')} "
                f"intent={decision.get('intent')} slots={decision.get('slots')}"
            )
            return decision
        except Exception as e:
            logger.error(f"[DecisionEngine] Ollama error: {e}")
            return self._fallback(user_input)

    # ── helpers ────────────────────────────────────────────────────────

    def _parse(self, raw: str) -> Dict[str, Any]:
        """Extract the first JSON object from the LLM response."""
        # Strip any Markdown code fences the model might add
        clean = raw.replace("```json", "").replace("```", "").strip()
        start = clean.find("{")
        end   = clean.rfind("}") + 1
        if start >= 0 and end > start:
            try:
                return json.loads(clean[start:end])
            except json.JSONDecodeError as e:
                logger.warning(f"[DecisionEngine] JSON parse error: {e} | raw: {raw[:200]}")
        return self._fallback(raw)

    def _fallback(self, query: str) -> Dict[str, Any]:
        return {
            "agent":                  "data",
            "intent":                 "general_query",
            "slots":                  {"query": query},
            "confidence":             0.30,
            "needs_clarification":    False,
            "clarification_question": None,
        }
