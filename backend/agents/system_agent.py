import logging
import platform
import os
import datetime
import webbrowser
import urllib.parse

import pyautogui
import screen_brightness_control as sbc

from backend.agents.base_agent import BaseAgent
from backend.database import SessionLocal, Reminder, Timer

logger = logging.getLogger(__name__)


class SystemAgent(BaseAgent):
    """
    Handles all OS-level actions:
    volume, brightness, media control, screenshots,
    system lock, time/date, timers, reminders.

    Deliberately does NOT import SystemActions to avoid the pyttsx3 TTS
    dependency inside the agent; TTS is handled at the server level.
    """

    SUPPORTED_INTENTS = {
        "volume_control", "brightness_control",
        "media_pause", "media_play", "media_next", "media_prev",
        "screenshot", "system_lock", "window_minimize",
        "time", "date", "shutdown", "restart",
        "set_timer", "set_reminder",
    }

    def __init__(self):
        super().__init__("system")

    def can_handle(self, intent: str) -> bool:
        return intent in self.SUPPORTED_INTENTS

    def execute(self, intent: str, slots: dict) -> str:
        logger.info(f"[SystemAgent] intent={intent} slots={slots}")

        if intent == "volume_control":
            return self._set_volume(slots.get("level", slots.get("value", 50)))

        elif intent == "brightness_control":
            return self._set_brightness(slots.get("level", slots.get("value", 50)))

        elif intent == "media_pause":
            return self._media_key("pause")

        elif intent == "media_play":
            return self._media_key("play")

        elif intent == "media_next":
            return self._media_key("next")

        elif intent == "media_prev":
            return self._media_key("prev")

        elif intent == "screenshot":
            return self._screenshot()

        elif intent == "system_lock":
            return self._lock()

        elif intent == "window_minimize":
            return self._minimize()

        elif intent == "time":
            return f"The time is {datetime.datetime.now().strftime('%I:%M %p')}."

        elif intent == "date":
            return f"Today is {datetime.datetime.now().strftime('%A, %B %d, %Y')}."

        elif intent in ("shutdown", "restart"):
            return "System power control is disabled in safe mode."

        elif intent == "set_timer":
            return self._set_timer(slots.get("duration", "5 minutes"))

        elif intent == "set_reminder":
            return self._set_reminder(slots.get("message", "Reminder"))

        return f"SystemAgent: unhandled intent '{intent}'."

    # ── helpers ────────────────────────────────────────────────────────

    def _set_volume(self, value) -> str:
        try:
            level = int(value)
            level = max(0, min(100, level))
            if platform.system() == "Darwin":
                os.system(f"osascript -e 'set volume output volume {level}'")
            return f"Volume set to {level}%."
        except Exception as e:
            return f"Could not set volume: {e}"

    def _set_brightness(self, value) -> str:
        try:
            level = int(value)
            level = max(0, min(100, level))
            sbc.set_brightness(level)
            return f"Brightness set to {level}%."
        except Exception as e:
            return f"Could not set brightness: {e}"

    def _media_key(self, action: str) -> str:
        try:
            if platform.system() == "Darwin":
                key_codes = {"play": 100, "pause": 100, "next": 101, "prev": 102}
                code = key_codes.get(action, 100)
                os.system(f"osascript -e 'tell application \"System Events\" to key code {code}'")
                if action in ("play", "pause"):
                    pyautogui.press("k")
            else:
                key_map = {"play": "playpause", "pause": "playpause",
                           "next": "nexttrack", "prev": "prevtrack"}
                pyautogui.press(key_map.get(action, "playpause"))
            return f"Media: {action}."
        except Exception as e:
            return f"Media control error: {e}"

    def _screenshot(self) -> str:
        try:
            desktop = os.path.join(os.path.expanduser("~"), "Desktop")
            fname   = f"screenshot_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            path    = os.path.join(desktop, fname)
            pyautogui.screenshot().save(path)
            return f"Screenshot saved to Desktop as {fname}."
        except Exception as e:
            return f"Screenshot failed: {e}"

    def _lock(self) -> str:
        try:
            if platform.system() == "Darwin":
                os.system("pmset displaysleepnow")
            elif platform.system() == "Windows":
                os.system("rundll32.exe user32.dll,LockWorkStation")
            return "Screen locked."
        except Exception as e:
            return f"Lock failed: {e}"

    def _minimize(self) -> str:
        try:
            if platform.system() == "Darwin":
                pyautogui.hotkey("command", "m")
            else:
                pyautogui.hotkey("win", "d")
            return "Window minimized."
        except Exception as e:
            return f"Minimize failed: {e}"

    def _set_timer(self, duration_str: str) -> str:
        try:
            secs = 0
            parts = str(duration_str).lower().split()
            for i, part in enumerate(parts):
                if part.isdigit():
                    n = int(part)
                    # look ahead for unit
                    unit = parts[i + 1] if i + 1 < len(parts) else ""
                    if "hour" in unit:
                        secs += n * 3600
                    elif "minute" in unit or "min" in unit:
                        secs += n * 60
                    else:
                        secs += n  # assume seconds

            if secs == 0:
                secs = 300  # default 5 min

            db = SessionLocal()
            db.add(Timer(
                label="Timer",
                duration_seconds=secs,
                start_time=datetime.datetime.now(),
                is_active=True,
            ))
            db.commit()
            db.close()
            return f"Timer set for {duration_str}."
        except Exception as e:
            return f"Timer error: {e}"

    def _set_reminder(self, message: str) -> str:
        try:
            clean = message.replace("remind me to", "").strip()
            due   = datetime.datetime.now() + datetime.timedelta(minutes=5)

            parts = clean.split()
            if "in" in parts:
                idx = parts.index("in")
                if idx + 1 < len(parts) and parts[idx + 1].isdigit():
                    due   = datetime.datetime.now() + datetime.timedelta(minutes=int(parts[idx + 1]))
                    clean = " ".join(parts[:idx])

            db = SessionLocal()
            db.add(Reminder(message=clean, due_time=due))
            db.commit()
            db.close()
            return f"Reminder set: '{clean}' at {due.strftime('%I:%M %p')}."
        except Exception as e:
            return f"Reminder error: {e}"
