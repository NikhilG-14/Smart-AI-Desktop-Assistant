from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

DATABASE_URL = "sqlite:///./assistant.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String, index=True)
    due_time = Column(DateTime)
    is_completed = Column(Boolean, default=False)

class Timer(Base):
    __tablename__ = "timers"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String, default="Timer")
    duration_seconds = Column(Integer)
    start_time = Column(DateTime, default=datetime.datetime.now)
    is_active = Column(Boolean, default=True)

def init_db():
    Base.metadata.create_all(bind=engine)
