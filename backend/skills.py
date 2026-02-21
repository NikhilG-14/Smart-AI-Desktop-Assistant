import webbrowser
import pyautogui
import screen_brightness_control as sbc
import platform
import datetime
import os
import time
from backend.database import SessionLocal, Reminder, Timer, engine
from sqlalchemy.orm import Session
# Ensure tables exist if running skills individually (though server handles it)
from backend.database import Base
Base.metadata.create_all(bind=engine)

def open_website(url: str) -> str:
    """Opens a specific URL in the default web browser."""
    try:
        if not url.startswith("http"):
            url = "https://" + url
        webbrowser.open(url)
        return f"Opened website: {url}"
    except Exception as e:
        return f"Error opening website: {str(e)}"

def search_youtube(query: str) -> str:
    """
    Searches YouTube for the query and opens the results.
    Tries to auto-play the first video for a 'run X' experience.
    """
    try:
        # Search URL
        search_query = query.replace(' ', '+')
        
        # We can try to guess a direct video link or just open search
        # Ideally, we open the search results. To "run" it, the user might need to click, 
        # but we can try to use a "I'm feeling lucky" style or just open the search.
        # Improved: Open search results which usually auto-plays preview or is one click away.
        url = f"https://www.youtube.com/results?search_query={search_query}&sp=EgIQAQ%253D%253D" # Filter for video
        
        webbrowser.open(url)
        
        # Optional: Wait and hit Enter to play first result? (Risky/Flaky)
        # For now, just opening the search is safe.
        
        return f"Searching YouTube for: {query}"
    except Exception as e:
        return f"Error searching YouTube: {str(e)}"

def system_control(feature: str, value: int = 0, command: str = "") -> str:
    """
    Controls system volume, brightness, or media playback.
    feature: 'volume', 'brightness', 'media'
    value: integer between 0 and 100 (for volume/brightness)
    command: 'play', 'pause', 'next', 'prev', 'stop' (for media)
    """
    try:
        if feature == "volume":
            # Using osascript for Mac
            if platform.system() == "Darwin":
                cmd = f"set volume output volume {value}"
                os.system(f"osascript -e '{cmd}'")
                return f"Set volume to {value}%"
            else:
                 return "Volume control is optimized for Mac in this demo."

        elif feature == "brightness":
            sbc.set_brightness(value)
            return f"Set brightness to {value}%"
            
        elif feature == "media":
            # PyAutoGUI Keys: playpause, nexttrack, prevtrack, volumeup, volumedown, mute
            key_map = {
                'play': 'playpause',
                'pause': 'playpause',
                'stop': 'playpause', # Often same key
                'next': 'nexttrack',
                'previous': 'prevtrack',
                'prev': 'prevtrack'
            }
            
            key = key_map.get(command.lower())
            if key:
                if platform.system() == "Darwin":
                    # Mac integration for media keys can be tricky with pyautogui alone,
                    # mostly works if permissions granted.
                    # Fallback/Helper for YouTube: 'k' is play/pause, 'j' rewind, 'l' forward
                    if command in ['play', 'pause', 'stop']:
                         pyautogui.press('k') # YouTube specific
                         time.sleep(0.1)
                
                pyautogui.press(key)
                return f"Media Control: {command}"
            else:
                return f"Unknown media command: {command}"
        
        return f"Unknown feature: {feature}"
    except Exception as e:
        return f"Error controlling system: {str(e)}"

def get_time() -> str:
    """Returns the current date and time."""
    now = datetime.datetime.now()
    return f"The current time is {now.strftime('%Y-%m-%d %I:%M %p')}"

def take_screenshot() -> str:
    """Takes a screenshot and saves it to the desktop."""
    try:
        # Get desktop path
        desktop = os.path.join(os.path.join(os.path.expanduser('~')), 'Desktop')
        filename = f"screenshot_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        filepath = os.path.join(desktop, filename)
        
        screenshot = pyautogui.screenshot()
        screenshot.save(filepath)
        return f"Screenshot saved to {filepath}"
    except Exception as e:
        return f"Error taking screenshot: {str(e)}"

def set_timer(duration_str: str) -> str:
    """
    Sets a timer. content should be like '10 minutes', '30 seconds', etc.
    """
    try:
        duration_seconds = 0
        parts = duration_str.lower().split()
        
        # Simple parsing logic
        if 'minute' in duration_str:
            # Extract number before 'minute'
            for part in parts:
                if part.isdigit():
                    duration_seconds += int(part) * 60
        elif 'second' in duration_str:
             for part in parts:
                if part.isdigit():
                    duration_seconds += int(part)
        elif 'hour' in duration_str:
             for part in parts:
                if part.isdigit():
                    duration_seconds += int(part) * 3600
        
        if duration_seconds == 0:
            return "Could not understand duration. Please say something like '10 minutes'."

        db: Session = SessionLocal()
        timer = Timer(label="Timer", duration_seconds=duration_seconds, start_time=datetime.datetime.now(), is_active=True)
        db.add(timer)
        db.commit()
        db.close()
        
        return f"Timer set for {duration_str}."
    except Exception as e:
        return f"Error setting timer: {str(e)}"

def set_reminder(message: str) -> str:
    """
    Sets a reminder. Currently just parses a simple message. 
    Ideal format: 'remind me to X in Y minutes' or just 'remind me to X' (saves without time).
    """
    try:
        # Very basic extraction for demo. 
        # In a real app, use dateparser or similar.
        # Assuming format "remind me to [action] in [time]"
        
        message = message.replace("remind me to", "").strip()
        due_time = datetime.datetime.now() + datetime.timedelta(minutes=5) # Default 5 mins if no time found
        
        # Check for "in X minutes"
        parts = message.split()
        if "in" in parts:
            idx = parts.index("in")
            if idx + 1 < len(parts) and parts[idx+1].isdigit():
                minutes = int(parts[idx+1])
                due_time = datetime.datetime.now() + datetime.timedelta(minutes=minutes)
                # Remove time part from message
                message = " ".join(parts[:idx])
        
        db: Session = SessionLocal()
        reminder = Reminder(message=message, due_time=due_time)
        db.add(reminder)
        db.commit()
        db.close()
        
        return f"Reminder set: '{message}' for {due_time.strftime('%I:%M %p')}."
    except Exception as e:
        return f"Error setting reminder: {str(e)}"
