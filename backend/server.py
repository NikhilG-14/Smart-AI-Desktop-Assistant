from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

# ML Core
from backend.nlp.intent_classifier import IntentClassifier
from backend.nlp.entity_extractor import EntityExtractor
from backend.os_adapter.system_actions import SystemActions
from backend.llm_client import process_command, analyze_screen

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize System Components
classifier = IntentClassifier()
extractor = EntityExtractor()
actions = SystemActions()

@app.on_event("startup")
def load_models():
    """Load the trained ML model on startup."""
    classifier.load()

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Main pipeline:
    1. Check for Vision/Screen Analysis triggers.
    2. Check for Complex Commands (heuristic).
    3. Intent Classification (SVM).
    4. Fallback to LLM if SVM is unsure.
    """
    user_text = request.message
    
    # --- 0. Vision / Screen Analysis Check ---
    vision_triggers = ["read screen", "look at screen", "what is on screen", "explain this screen", "scan screen"]
    if any(trigger in user_text.lower() for trigger in vision_triggers):
        print(f"Vision Trigger Detected for: {user_text}")
        return {"response": analyze_screen(user_text)}

    # --- 1. Fast Intent Classification (SVM) ---
    # We still try SVM first for speed on simple commands like "volume up"
    intent = classifier.predict(user_text)
    print(f"Predicted Intent (SVM): {intent}")
    
    # --- 2. Smart Routing ---
    # distinct "unknown" class in SVM or simple heuristics for complexity
    is_complex = len(user_text.split()) > 6 or " and " in user_text.lower() 
    
    # If the SVM is confident it's a simple command, we might still execute it. 
    # But if it's "unknown" OR "complex", we prefer the Brain (LLM).
    if intent == "unknown" or is_complex:
        print("Routing to Gemini Brain (Complex/Unknown)...")
        llm_response = process_command(user_text)
        return {"response": llm_response}
    
    # --- 3. Execute Local Action (Fast Path) ---
    # Extract Entities
    entities = extractor.extract(user_text, intent)
    print(f"Extracted Entities: {entities}")
    
    # Execute
    try:
        response_text = actions.execute_action(intent, entities)
        return {"response": response_text}
    except Exception as e:
        print(f"Action Error: {e}")
        # Final fallback if local execution fails: Ask Gemini
        return {"response": process_command(user_text)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": classifier.model is not None}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
