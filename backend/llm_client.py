import os
import google.generativeai as genai
from dotenv import load_dotenv
from backend.skills import open_website, search_youtube, system_control, get_time, take_screenshot

# Load environment variables
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Warning: GEMINI_API_KEY not found in .env file.")

# Configure Gemini
genai.configure(api_key=api_key)

# Define the tools available to the model
# The Gemini SDK can inspect the docstrings of these functions automatically.
tools_list = [open_website, search_youtube, system_control, get_time, take_screenshot]

# Initialize the model with tools
model = genai.GenerativeModel(
    model_name='gemini-1.5-flash',
    tools=tools_list,
    system_instruction="You are JARVIS, a helpful and efficient automated assistant. You can control the user's computer using the provided tools. When asked to do something, execute the tool and then confirm to the user what you did. Be concise."
)

# Start a chat session with automatic function calling enabled.
# This handles the loop of: Model -> Tool Call -> Code Execute -> Model -> Text Response
chat = model.start_chat(enable_automatic_function_calling=True)

def process_command(user_input: str) -> str:
    """
    Sends the user input to the Gemini chat session.
    Gemini handles tool execution internally and returns a natural language response.
    """
    try:
        response = chat.send_message(user_input)
        return response.text
    except Exception as e:
        return f"Error contacting Gemini Brain: {str(e)}"
