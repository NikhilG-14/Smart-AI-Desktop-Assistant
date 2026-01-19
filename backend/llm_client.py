import os
import google.generativeai as genai
from dotenv import load_dotenv
import pyautogui
from PIL import Image
import tempfile
from backend.skills import open_website, search_youtube, system_control, get_time, take_screenshot

# Load environment variables
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Warning: GEMINI_API_KEY not found in .env file.")

# Configure Gemini
if api_key:
    genai.configure(api_key=api_key)

# Define the tools available to the model (Command Mode)
tools_list = [open_website, search_youtube, system_control, get_time, take_screenshot]

# Initialize the model with tools for Action Execution
model = genai.GenerativeModel(
    model_name='gemini-2.0-flash-exp',
    tools=tools_list,
    system_instruction="You are JARVIS, an advanced AI assistant. You have valid tools to control the computer. Always use them when requested. When asked to play specific content, use the search_youtube tool with the full query. Be concise and professional."
)

# Start a chat session with automatic function calling enabled.
chat = model.start_chat(enable_automatic_function_calling=True)

def process_command(user_input: str) -> str:
    """
    Sends the user input to the Gemini chat session.
    Gemini handles tool execution internally and returns a natural language response.
    """
    if not api_key:
        return "I need a GEMINI_API_KEY to process complex commands or have conversations."

    try:
        response = chat.send_message(user_input)
        return response.text
    except Exception as e:
        return f"Error contacting Gemini Brain: {str(e)}"

def analyze_screen(user_query: str) -> str:
    """
    Takes a screenshot and asks Gemini 1.5 Flash to explain it based on the query.
    Used for 'read screen', 'explain this', 'what is on my screen'.
    """
    if not api_key:
        return "I need a GEMINI_API_KEY to see your screen."

    try:
        print("Capturing screen for analysis...")
        screenshot = pyautogui.screenshot()
        
        # Flash handles images natively
        vision_model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = user_query or "Describe what is on this screen in detail."
        response = vision_model.generate_content([prompt, screenshot])
        
        return response.text
    except Exception as e:
        return f"Vision Error: {str(e)}"
