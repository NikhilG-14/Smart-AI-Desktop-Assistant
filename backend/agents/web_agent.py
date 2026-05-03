import logging
import urllib.parse
import webbrowser

from backend.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class WebAgent(BaseAgent):
    """Handles web searches and opening specific websites."""

    SUPPORTED_INTENTS = {"search_web", "open_website"}

    def __init__(self):
        super().__init__("web")

    def can_handle(self, intent: str) -> bool:
        return intent in self.SUPPORTED_INTENTS

    def execute(self, intent: str, slots: dict) -> str:
        logger.info(f"[WebAgent] intent={intent} slots={slots}")

        if intent == "search_web":
            query = (slots.get("query") or slots.get("search_term") or "").strip()
            if not query:
                return "What would you like to search for?"
            url = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
            webbrowser.open(url)
            return f"Searching the web for: {query}"

        elif intent == "open_website":
            url = (slots.get("url") or slots.get("website") or "").strip()
            if not url:
                return "Which website would you like to open?"
            if not url.startswith(("http://", "https://")):
                url = "https://" + url
            webbrowser.open(url)
            return f"Opening {url}"

        return f"WebAgent: unhandled intent '{intent}'."
