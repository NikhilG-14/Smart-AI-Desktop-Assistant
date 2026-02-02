import pyautogui
import os
import time
import platform

print(f"OS: {platform.system()}")

print("Testing direct 'k' press (YouTube toggle)...")
time.sleep(2)
pyautogui.press('k')
print("Pressed 'k'")

time.sleep(2)

print("Testing 'playpause' key...")
if platform.system() == "Darwin":
    # Try applescript method
    print("Executing osascript for media key...")
    os.system("osascript -e 'tell application \"System Events\" to key code 100'") # 100 is Play/Pause
else:
    pyautogui.press('playpause')

print("Done.")
