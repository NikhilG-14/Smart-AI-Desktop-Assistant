import logging
import os
import platform
import urllib.parse
import webbrowser
import re
import requests as http_requests

from backend.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

# Common web-app shortcuts
_WEB_APPS = {
    "youtube":   "https://www.youtube.com",
    "google":    "https://www.google.com",
    "gmail":     "https://mail.google.com",
    "chatgpt":   "https://chat.openai.com",
    "github":    "https://github.com",
    "netflix":   "https://www.netflix.com",
    "whatsapp":  "https://web.whatsapp.com",
    "instagram": "https://www.instagram.com",
    "twitter":   "https://twitter.com",
    "linkedin":  "https://www.linkedin.com",
}

# Mac app-name corrections
_MAC_APP_NAMES = {
    "chrome":   "Google Chrome",
    "vscode":   "Visual Studio Code",
    "code":     "Visual Studio Code",
    "spotify":  "Spotify",
    "safari":   "Safari",
    "music":    "Music",
    "itunes":   "Music",
    "notes":    "Notes",
    "calculator": "Calculator",
    "terminal": "Terminal",
    "finder":   "Finder",
    "slack":    "Slack",
    "zoom":     "Zoom",
}


class AppAgent(BaseAgent):
    """Handles launching / closing desktop apps and media playback apps."""

    SUPPORTED_INTENTS = {"open_app", "close_app", "play_youtube", "youtube_search", "spotify_play"}

    def __init__(self):
        super().__init__("app")

    def can_handle(self, intent: str) -> bool:
        return intent in self.SUPPORTED_INTENTS

    def execute(self, intent: str, slots: dict) -> str:
        logger.info(f"[AppAgent] intent={intent} slots={slots}")

        if intent == "open_app":
            return self._open_app(slots.get("app_name", ""))

        elif intent == "close_app":
            return self._close_app(slots.get("app_name", ""))

        elif intent in ("play_youtube", "youtube_search"):
            return self._youtube(slots.get("query", slots.get("video", "")))

        elif intent == "spotify_play":
            return self._spotify(slots.get("query", slots.get("song", "")))

        return f"AppAgent: unhandled intent '{intent}'."

    # ── helpers ────────────────────────────────────────────────────────

    def _open_app(self, app_name: str) -> str:
        if not app_name:
            return "Which application would you like to open?"

        lower = app_name.lower().strip()

        # Web-app shortcut?
        if lower in _WEB_APPS:
            webbrowser.open(_WEB_APPS[lower])
            return f"Opening {app_name}…"

        # Desktop app
        if platform.system() == "Darwin":
            display_name = _MAC_APP_NAMES.get(lower, app_name)
            rc = os.system(f"open -a '{display_name}'")
            if rc == 0:
                return f"Opening {display_name}…"
            # Fallback: web search
            fallback = f"https://www.google.com/search?q={urllib.parse.quote(app_name)}"
            webbrowser.open(fallback)
            return f"Could not find '{app_name}', opened a web search instead."

        # Windows
        os.system(f"start {app_name}")
        return f"Opening {app_name}…"

    def _close_app(self, app_name: str) -> str:
        if not app_name:
            return "Which application would you like to close?"
        try:
            if platform.system() == "Darwin":
                os.system(f"osascript -e 'quit app \"{app_name}\"'")
            else:
                os.system(f"taskkill /IM {app_name}.exe /F")
            return f"Closed {app_name}."
        except Exception as e:
            return f"Could not close {app_name}: {e}"

    def _youtube(self, query: str) -> str:
        if not query:
            webbrowser.open("https://www.youtube.com")
            return "Opening YouTube."

        # Try to extract first video ID for direct playback
        try:
            search_url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}"
            html = http_requests.get(search_url, timeout=5).text
            ids  = re.findall(r"watch\?v=(\S{11})", html)
            if ids:
                webbrowser.open(f"https://www.youtube.com/watch?v={ids[0]}")
                return f"Playing '{query}' on YouTube."
            webbrowser.open(search_url)
            return f"Opened YouTube search for '{query}'."
        except Exception:
            webbrowser.open(f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}")
            return f"Searching YouTube for '{query}'."

    def _spotify(self, query: str) -> str:
        if query:
            safe = urllib.parse.quote(query)
            if platform.system() == "Darwin":
                os.system(f"open 'spotify:search:{safe}'")
            else:
                os.system(f"start spotify:search:{safe}")
            return f"Playing '{query}' on Spotify."
        else:
            if platform.system() == "Darwin":
                os.system("open -a Spotify")
            else:
                os.system("start spotify:")
            return "Opening Spotify."
