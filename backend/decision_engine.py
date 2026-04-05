import json
import logging
from typing import Optional, Dict, Any

from backend.llm_client import _call_ollama, ROUTING_MODEL

logger = logging.getLogger(__name__)

# ── System prompt: Ollama decides EVERYTHING ────────────────────────────────
_SYSTEM_PROMPT = """\
You are the AI Orchestrator for a desktop assistant named V.A.N.I.N.I.
Your job is to route the user's request to the correct specialist agent and extract parameters (slots).

AVAILABLE AGENTS:
1. agent "system": For OS-level actions.
   Intents: time, date, volume_control, brightness_control, media_pause, media_play, media_next, media_prev, screenshot, system_lock, set_timer, set_reminder.
   (IMPORTANT: "what is the time", "tell me the time", "current time" MUST go to system/time)

2. agent "web": For browser/internet.
   Intents: search_web, open_website.

3. agent "app": For local applications.
   Intents: open_app, close_app, play_youtube.

4. agent "data": For general questions, math, jokes, or conversation.
   Intents: general_query, calculate, convert_units, tell_joke.

Rules:
- Return ONLY strict JSON.
- If the user asks for time or date, ALWAYS use agent "system".
- For "open [app]", use agent "app" with slot "app_name".
- If unsure, use agent "data" with intent "general_query" and slot "query".

Output Format:
{
  "agent": "system" | "web" | "app" | "data",
  "intent": string,
  "slots": object,
  "confidence": number,
  "needs_clarification": boolean,
  "clarification_question": string | null
}
"""


class DecisionEngine:
    """
    Fully AI-driven router.
    Ollama identifies intent, picks the agent, and extracts slots.
    The SVM predicted_intent (if any) is passed as a hint only —
    Ollama makes the final call.
    """

    def __init__(self, model: str = ROUTING_MODEL):
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
