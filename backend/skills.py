import webbrowser
import pyautogui
import screen_brightness_control as sbc
import platform
import datetime
import os

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
    """Searches YouTube for the query and opens the results."""
    try:
        # Create a search URL
        url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
        webbrowser.open(url)
        return f"Searched YouTube for: {query}"
    except Exception as e:
        return f"Error searching YouTube: {str(e)}"

def system_control(feature: str, value: int) -> str:
    """
    Controls system volume or brightness.
    feature: 'volume' or 'brightness'
    value: integer between 0 and 100
    """
    try:
        if feature == "volume":
            # Using osascript for Mac as User is on Mac.
            if platform.system() == "Darwin":
                cmd = f"set volume output volume {value}"
                os.system(f"osascript -e '{cmd}'")
                return f"Set volume to {value}%"
            else:
                 return "Volume control is optimized for Mac in this demo."

        elif feature == "brightness":
            sbc.set_brightness(value)
            return f"Set brightness to {value}%"
        
        return f"Unknown feature: {feature}"
    except Exception as e:
        return f"Error controlling system: {str(e)}"

def get_time() -> str:
    """Returns the current date and time."""
    now = datetime.datetime.now()
    return f"The current time is {now.strftime('%Y-%m-%d %H:%M:%S')}"

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
