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
            self.engine.setProperty('rate', 180)
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
        response = ""

        if intent == "open_app":
            app_name = entities.get('app_name', '')
            if not app_name:
                return "Which application should I open?"

            # ------------------ MAC PART (UNCHANGED) ------------------
            if platform.system() == "Darwin":
                try:
                    if "chrome" in app_name:
                        app_name = "Google Chrome"
                    if "code" in app_name:
                        app_name = "Visual Studio Code"

                    os.system(f"open -a '{app_name}'")
                    response = f"Opening {app_name}..."
                except Exception as e:
                    response = f"Could not open {app_name}: {e}"

            # ------------------ WINDOWS PART (OPTION 1 FIX) ------------------
            else:
                try:
                    app_key = app_name.lower().strip()
                    app_key = app_key.replace(".", "").replace("app", "").strip()

                    # Use PowerShell to ask Windows to open the app by name
                    command = f'powershell -Command "Start-Process \\"{app_key}\\""'

                    subprocess.Popen(command, shell=True)

                    response = f"Opening {app_name}..."

                except Exception as e:
                    response = f"Could not open {app_name}: {e}"


        elif intent == "youtube_search":
            query = entities.get('query', '')
            if query:
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
                import urllib.parse
                safe_query = urllib.parse.quote(query)

                if platform.system() == "Darwin":
                    os.system(f"open 'spotify:search:{safe_query}'")
                else:
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
                    sbc.set_brightness(value)
                    response = f"Brightness set to {value}%"
                except Exception as e:
                    print(f"SBC Error: {e}")
                    if platform.system() == "Darwin":
                        response = f"Could not set brightness. Ensure 'screen-brightness-control' has permissions."
                    else:
                        response = "Could not control brightness."

        elif intent == "screenshot":
            desktop = os.path.join(os.path.expanduser('~'), 'Desktop')
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
            response = "I cannot perform this action in demo mode."

        elif intent == "unknown":
            response = "I'm not sure how to help with that yet."

        elif intent == "media_pause":
            pyautogui.press('k')
            pyautogui.press('playpause')
            response = "Paused playback."

        elif intent == "media_play":
            pyautogui.press('k')
            pyautogui.press('playpause')
            response = "Resumed playback."

        elif intent == "media_next":
            pyautogui.press('nexttrack')
            response = "Skipped to next track."

        elif intent == "media_prev":
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
                pyautogui.hotkey('command', 'm')
                response = "Minimized active window."
            else:
                pyautogui.hotkey('win', 'd')
                response = "Showing desktop."

        else:
            response = f"Action for {intent} executed."

        if self.engine:
            self.speak(response)

        return response
