import os
import json
import re
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
from dotenv import load_dotenv
import pyautogui
from backend.os_adapter.system_actions import SystemActions
from backend.skills import open_website

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Warning: GEMINI_API_KEY not found in .env file.")

# Configure Gemini
if api_key:
    genai.configure(api_key=api_key)

# Initialize System Actions
actions = SystemActions()

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
🔹 USER PROMPT TEMPLATE (WHAT YOU SEND PER MESSAGE)
User command:
"<USER_INPUT>"
🔹 BEHAVIOR RULES (CRITICAL)
- If user says "pause it", rely on context and return pause_media
- If user says "unpause" or "resume", return resume_media
- If user says "play something", ask clarification
- If user asks for something not listed, return unsupported
- Never guess app names
- Never assume video titles
"""

# Initialize the model (No tools, just JSON mode)
model = genai.GenerativeModel(
    model_name='gemini-2.0-flash',
    system_instruction=SYSTEM_PROMPT,
    generation_config={"response_mime_type": "application/json"}
)

chat = model.start_chat()

def process_command(user_input: str) -> str:
    """
    Sends input to Gemini, parses JSON intent, and executes the action locally.
    Returns a natural language response string for the frontend.
    """
    if not api_key:
        return "I need a GEMINI_API_KEY to process commands."

    try:
        # 1. Get Intent from Brain
        response = chat.send_message(f'User command:\n"{user_input}"')
        response_text = response.text
        
        # 2. Parse JSON
        try:
            # Clean up markdown code blocks if present (though response_mime_type should prevent this)
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

        elif intent == "unsupported":
            return "I cannot perform that action yet."
            
        else:
            return f"I recognized the intent '{intent}' but don't have a protocol for it yet."

    except ResourceExhausted:
         print("Quota Exceeded (429).")
         return "My cognitive systems are overloaded (Quota Exceeded). Please wait a moment before sending another command."
    except Exception as e:
        print(f"Error in process_command: {e}")
        return f"System Error: {str(e)}"

def analyze_screen(user_query: str) -> str:
    """
    Takes a screenshot and asks Gemini 1.5 Flash to explain it.
    """
    if not api_key:
        return "I need a GEMINI_API_KEY to see your screen."

    try:
        print("Capturing screen for analysis...")
        screenshot = pyautogui.screenshot()
        
        vision_model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = user_query or "Describe what is on this screen in detail."
        response = vision_model.generate_content([prompt, screenshot])
        
        return response.text
    except ResourceExhausted:
        return "I cannot verify visual data right now (Quota Exceeded). Please try again later."
    except Exception as e:
        return f"Vision Error: {str(e)}"
