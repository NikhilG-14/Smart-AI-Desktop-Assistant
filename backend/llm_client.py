import os
import json
import requests
import pyautogui
from dotenv import load_dotenv
from backend.os_adapter.system_actions import SystemActions
from backend.skills import open_website, set_reminder, set_timer

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

# Initialize System Actions
actions = SystemActions()

MODEL_NAME = os.getenv("OLLAMA_MODEL", "qwen3:1.7b")
BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", 0))
LLM_TIMEOUT = int(os.getenv("LLM_TIMEOUT", 60))

OLLAMA_URL = f"{BASE_URL}/api/generate"

SYSTEM_PROMPT = """You are a desktop assistant embedded inside an Electron application.

Your ONLY responsibility is to:
1. Identify the user's intent
2. Extract structured parameters (slots)
3. Return a STRICT JSON response

IMPORTANT RULES:
- You do NOT execute actions
- You do NOT explain anything
- You do NOT chat
- You do NOT invent abilities
- You ONLY return JSON
- If intent is unclear, ask a clarification question in JSON
- If intent is unsupported, return intent = "unsupported"

You must assume:
- OS-level control is handled externally
- Browser automation is handled externally
- YouTube, system control, and app launching exist as skills

Your output must strictly match the schema below.
Any deviation is a failure.
🔹 OUTPUT SCHEMA (FIXED)
{
  "intent": string,
  "slots": object,
  "confidence": number,
  "needs_clarification": boolean,
  "clarification_question": string | null
}
🔹 SUPPORTED INTENTS
open_app
close_app
play_youtube
pause_media
resume_media
mute_system
unmute_system
set_volume
search_web
set_reminder
set_timer
unsupported

🔹 SLOT DEFINITIONS
open_app:
  app_name: string

play_youtube:
  query: string

set_volume:
  level: number (0–100)

search_web:
  query: string

set_reminder:
  message: string (raw user text for the reminder)
  
set_timer:
  duration: string (e.g. '10 minutes', '30 seconds')

🔹 USER PROMPT TEMPLATE (WHAT YOU SEND PER MESSAGE)
User command:
"<USER_INPUT>"

🔹 BEHAVIOR RULES (CRITICAL)
- If user says "pause it", rely on context and return pause_media
- If user says "unpause" or "resume", return resume_media
- If user says "play something", ask clarification
- If user asks for something not listed, return unsupported
- For reminders, pass the full text like "remind me to buy milk in 10 mins" as the message slot
- For timers, extract the duration phrase
"""

def process_command(user_input: str) -> str:
    """
    Sends input to Ollama, parses JSON intent, and executes the action locally.
    Returns a natural language response string for the frontend.
    """
    try:
        # 1. Get Intent from Ollama
        payload = {
            "model": MODEL_NAME,
            "prompt": f"{SYSTEM_PROMPT}\n\nUser command:\n\"{user_input}\"",
            "temperature": LLM_TEMPERATURE,
            "stream": False
        }
        
        response = requests.post(
            OLLAMA_URL,
            json=payload,
            timeout=LLM_TIMEOUT
        )
        response.raise_for_status()
        
        response_json = response.json()
        response_text = response_json.get("response", "")

        # 2. Parse JSON
        try:
            # Although format="json" helps, sometimes models chatter.
            clean_json = response_text.replace('```json', '').replace('```', '').strip()
            data = json.loads(clean_json)
        except json.JSONDecodeError:
            print(f"JSON Parse Error. Raw response: {response_text}")
            return "I understood that, but my internal protocol failed to parse the directive."

        intent = data.get("intent", "unsupported")
        slots = data.get("slots", {})
        clarification = data.get("clarification_question")

        if data.get("needs_clarification") and clarification:
            return clarification

        print(f"Brain Intent: {intent} | Slots: {slots}")

        # 3. Execute Local Action based on Intent Mapping
        if intent == "open_app":
            return actions.execute_action("open_app", {"app_name": slots.get("app_name")})
        
        elif intent == "play_youtube":
            return actions.execute_action("youtube_search", {"query": slots.get("query")})
            
        elif intent == "set_volume":
            # Map 0-100 level
            level = slots.get("level")
            if level is not None:
                return actions.execute_action("volume_control", {"value": level})
            return "Volume level not specified."

        elif intent == "pause_media":
            return actions.execute_action("media_pause", {})
            
        elif intent == "resume_media":
            return actions.execute_action("media_play", {})
            
        elif intent == "search_web":
            query = slots.get("query")
            if query:
                # Use skills.open_website for generic search (constructing google url)
                url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
                return open_website(url)
            return "What should I search for on the web?"

        elif intent == "mute_system":
             return actions.execute_action("volume_control", {"value": 0})
             
        elif intent == "unmute_system":
             # Hard to 'unmute' to previous level without state, setting to 50 as safe default
             return actions.execute_action("volume_control", {"value": 50})

        elif intent == "set_reminder":
            message = slots.get("message")
            if message:
                return set_reminder(message)
            return "What should I remind you about?"

        elif intent == "set_timer":
            duration = slots.get("duration")
            if duration:
                return set_timer(duration)
            return "How long should I set the timer for?"

        elif intent == "unsupported":
            return "I cannot perform that action yet."
            
        else:
            return f"I recognized the intent '{intent}' but don't have a protocol for it yet."

    except requests.exceptions.RequestException as e:
        print(f"Ollama Connection Error: {e}")
        return "I cannot reach my brain (Ollama is offline or unreachable)."
    except Exception as e:
        print(f"Error in process_command: {e}")
        return f"System Error: {str(e)}"

def analyze_screen(user_query: str) -> str:
    """
    Takes a screenshot and asks Ollama to explain it.
    NOTE: qwen3:1.7b is not a vision model, so this will either fail or we need a vision model.
    For now, disabling vision or returning a friendly error.
    """
    return "Visual analysis is not supported with the current model settings."
