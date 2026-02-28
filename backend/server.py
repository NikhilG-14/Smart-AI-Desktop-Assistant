from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uvicorn
import psutil
import datetime
import logging

# ── Existing components (unchanged) ────────────────────────────────────────
from backend.nlp.intent_classifier import IntentClassifier
from backend.nlp.entity_extractor   import EntityExtractor
from backend.database import init_db, SessionLocal, Reminder, Timer

# ── New agent-mode components ───────────────────────────────────────────────
from backend.decision_engine import DecisionEngine
from backend.orchestrator    import AgentOrchestrator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Vanini – Multi-Agent Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Initialize components ──────────────────────────────────────────────────
classifier      = IntentClassifier()
extractor       = EntityExtractor()
decision_engine = DecisionEngine()
orchestrator    = AgentOrchestrator()


@app.on_event("startup")
def startup():
    classifier.load()
    init_db()
    logger.info("Vanini started — multi-agent mode active ✓")


# ── Pydantic models ────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str

class ReminderBase(BaseModel):
    message: str
    due_time: datetime.datetime

class TimerBase(BaseModel):
    label: str = "Timer"
    duration_seconds: int


# ── Database dependency ────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Main chat endpoint ─────────────────────────────────────────────────────
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Multi-agent pipeline:
      1. Wake-word check
      2. NLU  (existing SVM intent classifier + entity extractor)
      3. AI Decision Engine  → picks agent + extracts/refines slots
      4. Agent Orchestrator  → dispatches to System / Web / App / Data agent
      5. Response to user
    """
    user_text = request.message

    # ── 1. Wake-word gate ──────────────────────────────────────────────
    wake_words = ["vanini", "vani", "vanni", "वानी", "वाणि", "वनी"]
    lower_text = user_text.lower().strip()
    matched    = next((w for w in wake_words if w in lower_text), None)

    if not matched:
        return {"ignored": True, "response": ""}

    # Strip wake word
    clean_text = lower_text.replace(matched, "", 1).strip()
    if not clean_text:
        return {"response": "Yes?"}

    # ── 2. Vision check (unchanged shortcut) ──────────────────────────
    vision_triggers = ["read screen", "look at screen", "what is on screen",
                       "explain this screen", "scan screen"]
    if any(t in clean_text for t in vision_triggers):
        from backend.llm_client import analyze_screen
        return {"response": analyze_screen(clean_text)}

    # ── 3. NLU ────────────────────────────────────────────────────────
    try:
        predicted_intent = classifier.predict(clean_text)
        entities         = extractor.extract(clean_text, predicted_intent)
        logger.info(f"NLU → intent='{predicted_intent}'  entities={entities}")
    except Exception as e:
        logger.warning(f"NLU error: {e}")
        predicted_intent = None
        entities         = {}

    # ── 4. Decision Engine ────────────────────────────────────────────
    try:
        decision = decision_engine.decide(clean_text, predicted_intent, entities)
        logger.info(f"Decision → {decision}")
    except Exception as e:
        logger.error(f"Decision engine failed: {e}")
        decision = {
            "agent": "data", "intent": "general_query",
            "slots": {"query": clean_text},
            "needs_clarification": False,
        }

    # ── 5. Orchestrate ────────────────────────────────────────────────
    try:
        response = orchestrator.route(decision)
    except Exception as e:
        logger.error(f"Orchestrator failed: {e}", exc_info=True)
        response = f"Sorry, something went wrong: {e}"

    return {"response": response}


# ── Database endpoints (unchanged) ────────────────────────────────────────
@app.post("/reminders")
def create_reminder(reminder: ReminderBase, db: Session = Depends(get_db)):
    obj = Reminder(message=reminder.message, due_time=reminder.due_time)
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@app.get("/reminders")
def get_reminders(db: Session = Depends(get_db)):
    return db.query(Reminder).filter(Reminder.is_completed == False).all()

@app.delete("/reminders/{reminder_id}")
def delete_reminder(reminder_id: int, db: Session = Depends(get_db)):
    obj = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if obj: db.delete(obj); db.commit()
    return {"status": "success"}

@app.post("/timers")
def create_timer(timer: TimerBase, db: Session = Depends(get_db)):
    obj = Timer(label=timer.label, duration_seconds=timer.duration_seconds)
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@app.get("/timers")
def get_timers(db: Session = Depends(get_db)):
    return db.query(Timer).filter(Timer.is_active == True).all()

@app.delete("/timers/{timer_id}")
def delete_timer(timer_id: int, db: Session = Depends(get_db)):
    obj = db.query(Timer).filter(Timer.id == timer_id).first()
    if obj: db.delete(obj); db.commit()
    return {"status": "success"}

@app.get("/system/stats")
def get_system_stats():
    cpu = psutil.cpu_percent(interval=None)
    ram = psutil.virtual_memory()
    return {
        "cpu": cpu,
        "ram": {
            "percent": ram.percent,
            "used":  round(ram.used  / (1024 ** 3), 1),
            "total": round(ram.total / (1024 ** 3), 1),
        },
    }

@app.get("/health")
def health_check():
    return {
        "status":       "ok",
        "model_loaded": classifier.model is not None,
        "agents":       list(orchestrator.agents.keys()),
        "mode":         "multi-agent",
    }


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
