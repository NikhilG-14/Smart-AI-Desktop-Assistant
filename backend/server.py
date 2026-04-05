from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import json
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
    Multi-agent streaming pipeline.
    """
    user_text = request.message

    # ── 1. Wake-word gate ──────────────────────────────────────────────
    wake_words = ["vanini", "vani", "vanni", "वानी", "वाणि", "वनी"]
    lower_text = user_text.lower().strip()
    matched    = next((w for w in wake_words if w in lower_text), None)

    if not matched:
        # Silently ignore requests without the wake-word
        async def empty_gen():
            if False: yield ""  # generator marker
        return StreamingResponse(empty_gen(), media_type="text/plain")

    # Strip wake word
    clean_text = lower_text.replace(matched, "", 1).strip()
    if not clean_text:
        async def yes_gen():
            yield "Yes?"
        return StreamingResponse(yes_gen(), media_type="text/plain")

    # ── 2. NLU (SVM hint) ─────────────────────────────────────────────
    try:
        predicted_intent = classifier.predict(clean_text)
        entities         = extractor.extract(clean_text, predicted_intent)
    except Exception as e:
        logger.warning(f"NLU error: {e}")
        predicted_intent, entities = None, {}

    # ── 3. Decision Engine & Orchestrate ──────────────────────────────
    async def stream_generator():
        try:
            # Step A: Get routing decision (Sync call to Llama 3.2)
            decision = decision_engine.decide(clean_text, predicted_intent, entities)
            logger.info(f"Decision → {decision}")
        except Exception as e:
            logger.error(f"Decision engine failed: {e}")
            decision = {"agent": "data", "intent": "general_query", "slots": {"query": clean_text}}

        # Step B: Yield chunks from Orchestrator
        try:
            for chunk in orchestrator.route(decision):
                # We yield raw text chunks for simplicity in the UI
                yield chunk
        except Exception as e:
            logger.error(f"Orchestration error: {e}")
            yield f"Error: {e}"

    return StreamingResponse(stream_generator(), media_type="text/plain")


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
