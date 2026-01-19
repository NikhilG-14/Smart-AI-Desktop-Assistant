from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

# ML Core
from backend.nlp.intent_classifier import IntentClassifier
from backend.nlp.entity_extractor import EntityExtractor
from backend.os_adapter.system_actions import SystemActions

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
    1. Input Text
    2. Intent Classification (SVM)
    3. Entity Extraction (Regex/NLP)
    4. Action Execution (OS Adapter)
    """
    user_text = request.message
    
    # 1. Predict Intent
    intent = classifier.predict(user_text)
    print(f"Predicted Intent: {intent}")
    
    # 2. Extract Entities
    entities = extractor.extract(user_text, intent)
    print(f"Extracted Entities: {entities}")
    
    # 3. Execute Action
    try:
        response_text = actions.execute_action(intent, entities)
        
        # Augment response with debug info for "Smart AI" showcase
        # response_text += f"\n[Brain: {intent} | Entities: {entities}]"
        
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": classifier.model is not None}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
