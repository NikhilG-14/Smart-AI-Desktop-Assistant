from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import psutil

# ML Core
from backend.nlp.intent_classifier import IntentClassifier
from backend.nlp.entity_extractor import EntityExtractor
from backend.os_adapter.system_actions import SystemActions
from backend.llm_client import process_command, analyze_screen
from backend.database import init_db, SessionLocal, Reminder, Timer
from sqlalchemy.orm import Session
from fastapi import Depends
import datetime

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
    init_db()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ReminderBase(BaseModel):
    message: str
    due_time: datetime.datetime

class TimerBase(BaseModel):
    label: str = "Timer"
    duration_seconds: int

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
    
    # --- Wake Word Check ---
    WAKE_WORD = "jarvis"
    if not user_text.lower().startswith(WAKE_WORD):
        return {"response": None}  # Or customized message: "Say 'Jarvis' to wake me up."
    
    # Strip wake word
    user_text = user_text[len(WAKE_WORD):].strip()
    if not user_text:
         return {"response": "Yes?"}

    # --- 0. Vision / Screen Analysis Check ---
    vision_triggers = ["read screen", "look at screen", "what is on screen", "explain this screen", "scan screen"]
    if any(trigger in user_text.lower() for trigger in vision_triggers):
        print(f"Vision Trigger Detected for: {user_text}")
        return {"response": analyze_screen(user_text)}

    # --- 2. Brain (LLM) First Strategy ---
    # The user requested Strict JSON handling via LLM.
    # We prioritize the Gemini Brain for all commands to ensure accuracy and rule adherence.
    print(f"Routing '{user_text}' to Vanini's Brain...")
    
    try:
        # process_command now handles the JSON parsing and local execution internally
        llm_response = process_command(user_text)
        return {"response": llm_response}
    except Exception as e:
        print(f"Gemini Error: {e}")
        # Fallback to SVM if needed (or just error out if Brain is critical)
        return {"response": f"Brain Error: {str(e)}"}
    
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

# --- Database Endpoints ---

@app.post("/reminders")
def create_reminder(reminder: ReminderBase, db: Session = Depends(get_db)):
    db_reminder = Reminder(message=reminder.message, due_time=reminder.due_time)
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@app.get("/reminders")
def get_reminders(db: Session = Depends(get_db)):
    return db.query(Reminder).filter(Reminder.is_completed == False).all()

@app.delete("/reminders/{reminder_id}")
def delete_reminder(reminder_id: int, db: Session = Depends(get_db)):
    db_reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if db_reminder:
        db.delete(db_reminder)
        db.commit()
    return {"status": "success"}

@app.post("/timers")
def create_timer(timer: TimerBase, db: Session = Depends(get_db)):
    db_timer = Timer(label=timer.label, duration_seconds=timer.duration_seconds)
    db.add(db_timer)
    db.commit()
    db.refresh(db_timer)
    return db_timer

@app.get("/timers")
def get_timers(db: Session = Depends(get_db)):
    return db.query(Timer).filter(Timer.is_active == True).all()

@app.delete("/timers/{timer_id}")
def delete_timer(timer_id: int, db: Session = Depends(get_db)):
    db_timer = db.query(Timer).filter(Timer.id == timer_id).first()
    if db_timer:
        db.delete(db_timer)
        db.commit()
    return {"status": "success"}

@app.get("/system/stats")
def get_system_stats():
    """Return real-time system statistics."""
    cpu = psutil.cpu_percent(interval=None)
    ram = psutil.virtual_memory()
    
    # Optional: GPU stats manually if needed, or keep simple
    return {
        "cpu": cpu,
        "ram": {
            "percent": ram.percent,
            "used": round(ram.used / (1024**3), 1),
            "total": round(ram.total / (1024**3), 1)
        }
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": classifier.model is not None}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
