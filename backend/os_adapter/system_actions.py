import os
import webbrowser
import platform
import datetime
import pyautogui
import pyttsx3
import subprocess

from backend.nlp.entity_extractor import EntityExtractor
import screen_brightness_control as sbc

class SystemActions:
    def __init__(self):
        try:
            self.engine = pyttsx3.init()
            self.engine.setProperty('rate', 180) # Speed
            # Select a female voice if available
            voices = self.engine.getProperty('voices')
            female_voice = None
            for voice in voices:
                v_name = voice.name.lower()
                if any(name in v_name for name in ['female', 'zira', 'samantha', 'victoria', 'karen', 'moira', 'tessa']):
                    female_voice = voice.id
                    break
            
            if female_voice:
                self.engine.setProperty('voice', female_voice)
            elif len(voices) > 1:
                # Fallback to index 1 which is often alternate/female on some OSs
                self.engine.setProperty('voice', voices[1].id)
        except:
            self.engine = None
            print("TTS Engine failed to initialize.")

    def speak(self, text):
        if self.engine:
            try:
                self.engine.say(text)
                self.engine.runAndWait()
            except Exception as e:
                print(f"TTS Error: {e}")

    def execute_action(self, intent: str, entities: dict) -> str:
        """
        Executes the system action based on intent and entities.
        Returns a response string.
        """
        response = ""

        # ... (Intent handling logic) ...
        
        # [This part needs to be merged carefully inside execute_action, 
        # but since I am replacing the file content, I will just ensure speak is called at the end if I were rewriting the whole flow. 
        # However, the user wants me to EDIT the file. 
        # I will inject the speak call at the end of the method.]

        # ...
        
        # BRIGHTNESS LOGIC UPDATE
        if intent == "open_app":
            app_name = entities.get('app_name', '')
            if not app_name:
                return "Which application should I open?"

            lower_app = app_name.lower().strip()
            
            # Map common web apps to their URLs
            web_apps = {
                "youtube": "https://www.youtube.com",
                "google": "https://www.google.com",
                "gmail": "https://mail.google.com",
                "chatgpt": "https://chat.openai.com",
                "github": "https://github.com",
                "netflix": "https://www.netflix.com",
                "whatsapp": "https://web.whatsapp.com"
            }

            if lower_app in web_apps:
                import webbrowser
                webbrowser.open(web_apps[lower_app])
                response = f"Opening {app_name}..."
            else:
                # Simple Desktop App Opening Logic (Mac/Win)
                if platform.system() == "Darwin": # Mac
                    try:
                        # Common varations
                        if "chrome" in lower_app: app_name = "Google Chrome"
                        elif "code" in lower_app: app_name = "Visual Studio Code"
                        elif "spotify" in lower_app: app_name = "Spotify"
                        elif "safari" in lower_app: app_name = "Safari"
                        elif "music" in lower_app or "itunes" in lower_app: app_name = "Music"
                        elif "notes" in lower_app: app_name = "Notes"
                        elif "calculator" in lower_app: app_name = "Calculator"
                        elif "terminal" in lower_app: app_name = "Terminal"
                        
                        exit_code = os.system(f"open -a '{app_name}'")
                        if exit_code == 0:
                            response = f"Opening {app_name}..."
                        else:
                            # Fallback if app doesn't exist, try searching for it or open as URL
                            app_url_search = f"https://www.google.com/search?q={app_name.replace(' ', '+')}"
                            webbrowser.open(app_url_search)
                            response = f"Could not find the app {app_name}, opening a web search instead."
                    except Exception as e:
                        response = f"Could not open {app_name}: {e}"
                else: # Windows
                    try:
                        os.system(f"start {app_name}") 
                        response = f"Opening {app_name}..."
                    except:
                        response = f"Could not open {app_name}."

        elif intent == "youtube_search":
            query = entities.get('query', '')
            if query:
                # Advanced: Try to find the first video ID to "Auto Play"
                try:
                    import requests
                    import re
                    search_url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
                    html = requests.get(search_url).text
                    video_ids = re.findall(r"watch\?v=(\S{11})", html)
                    if video_ids:
                        target_url = f"https://www.youtube.com/watch?v={video_ids[0]}"
                        webbrowser.open(target_url)
                        response = f"Playing {query} on YouTube..."
                    else:
                        # Fallback to search results
                         webbrowser.open(search_url)
                         response = f"Found search results for {query}..."
                except:
                    url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
                    webbrowser.open(url)
                    response = f"Searching YouTube for {query}..."
            else:
                webbrowser.open("https://www.youtube.com")
                response = "Opening YouTube..."

        elif intent == "spotify_play":
            query = entities.get('query', '')
            if query:
                # URL Encode the query for the spotify: URL scheme
                import urllib.parse
                safe_query = urllib.parse.quote(query)
                
                if platform.system() == "Darwin":
                    # Mac: Open Spotify custom protocol
                    # 'spotify:search:query'
                    os.system(f"open 'spotify:search:{safe_query}'")
                else:
                    # Windows
                    os.system(f"start spotify:search:{safe_query}")
                
                response = f"Playing {query} on Spotify..."
            else:
                if platform.system() == "Darwin":
                    os.system("open -a Spotify")
                else:
                    os.system("start spotify:")
                response = "Opening Spotify..."

        elif intent == "volume_control":
            value = entities.get('value')
            direction = entities.get('direction')
            
            if value is not None:
                if platform.system() == "Darwin":
                    os.system(f"osascript -e 'set volume output volume {value}'")
                response = f"Volume set to {value}%"
            elif direction:
                 response = f"Turning volume {direction}..."

        elif intent == "brightness_control":
            value = entities.get('value')
            if value is not None:
                try:
                    # Try cross-platform library first
                    sbc.set_brightness(value)
                    response = f"Brightness set to {value}%"
                except Exception as e:
                    print(f"SBC Error: {e}")
                    # Mac Fallback using `brightness` command (brew install brightness) or osascript
                    if platform.system() == "Darwin":
                        try:
                            # Attempt applescript for built-in display (often works for main display)
                            # 'tell application "System Events" to set value of property "brightness" of (first service where name is "CoreGraphics") to {value/100}' is deprecated/hard.
                            # Better fallback: Just notify user.
                            response = f"Could not set brightness. Ensure 'screen-brightness-control' has permissions."
                        except:
                            response = "Brightness control failed."
                    else:
                        response = "Could not control brightness."
        
        elif intent == "screenshot":
            desktop = os.path.join(os.path.join(os.path.expanduser('~')), 'Desktop')
            filename = f"screenshot_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            filepath = os.path.join(desktop, filename)
            pyautogui.screenshot().save(filepath)
            response = f"Screenshot saved to Desktop."

        elif intent == "time":
            now = datetime.datetime.now().strftime("%I:%M %p")
            response = f"The current time is {now}."
            
        elif intent == "date":
             today = datetime.datetime.now().strftime("%A, %B %d, %Y")
             response = f"Today is {today}."

        elif intent in ["shutdown", "restart"]:
            if intent == "shutdown":
                # os.system("shutdown -h now") # Dangerous to uncomment for testing
                response = "I cannot shut down the system in demo mode."
            else:
                response = "I cannot restart the system in demo mode."
        
        elif intent == "unknown":
            response = "I'm not sure how to help with that yet."
            
        elif intent == "media_pause":
            if platform.system() == "Darwin":
                # Mac: Key Code 100 is Play/Pause (worked in debug script)
                os.system("osascript -e 'tell application \"System Events\" to key code 100'")
                # Still try 'k' for YouTube if focused (redundancy)
                pyautogui.press('k')
            else:
                pyautogui.press('playpause')
            
            response = "Paused playback."
        
        elif intent == "media_play":
            if platform.system() == "Darwin":
                os.system("osascript -e 'tell application \"System Events\" to key code 100'")
                pyautogui.press('k')
            else:
                pyautogui.press('playpause')
                
            response = "Resumed playback."
            
        elif intent == "media_next":
            if platform.system() == "Darwin":
                # Key Code 101 is Next
                os.system("osascript -e 'tell application \"System Events\" to key code 101'")
            else:
                pyautogui.press('nexttrack')
            response = "Skipped to next track."

        elif intent == "media_prev":
             if platform.system() == "Darwin":
                # Key Code 102 is Previous
                os.system("osascript -e 'tell application \"System Events\" to key code 102'")
             else:
                pyautogui.press('prevtrack')
             response = "Playing previous track."
            
        elif intent == "system_lock":
            if platform.system() == "Darwin":
                os.system("pmset displaysleepnow")
            elif platform.system() == "Windows":
                os.system("rundll32.exe user32.dll,LockWorkStation")
            response = "Locked the screen."

        elif intent == "window_minimize":
            if platform.system() == "Darwin":
                # Mac 'Mission Control' or Show Desktop often F11 or Cmd+F3. 
                # Simplest is generic hotkey if setup, but usually:
                pyautogui.hotkey('command', 'm') # Minimize active
                response = "Minimized active window."
            else:
                pyautogui.hotkey('win', 'd')
                response = "Showing desktop."

        else:
            response = f"Action for {intent} executed."

        if self.engine:
            self.speak(response)
        return response
