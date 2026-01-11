import re

class EntityExtractor:
    def extract(self, text: str, intent: str) -> dict:
        entities = {}
        text = text.lower()

        if intent == "open_app":
            # Strategies to find app name
            # 1. "open chrome", "launch spotify"
            match = re.search(r'(open|launch|start)\s+(.*)', text)
            if match:
                entities['app_name'] = match.group(2).strip()
            # 2. "can you open chrome"
            match = re.search(r'(open|launch|start)\s+(.*)\s+(for me|please)', text)
            if match:
                entities['app_name'] = match.group(2).strip()
                
        elif intent == "youtube_search":
            # "search for x on youtube", "search youtube for x"
            if "search youtube for" in text:
                entities['query'] = text.split("search youtube for")[1].strip()
            elif "search for" in text and "on youtube" in text:
                part = text.split("search for")[1]
                entities['query'] = part.split("on youtube")[0].strip()
            elif "play" in text and "on youtube" in text:
                 part = text.split("play")[1]
                 entities['query'] = part.split("on youtube")[0].strip()
            elif "open youtube and play" in text:
                 entities['query'] = text.split("open youtube and play")[1].strip()
            else:
                # Fallback: remove 'youtube', 'search', 'play'
                cleaned = text.replace("youtube", "").replace("search", "").replace("play", "").strip()
                entities['query'] = cleaned

        elif intent == "spotify_play":
            # "play x on spotify", "open spotify and play x"
            if "on spotify" in text:
                head = text.split("on spotify")[0]
                if "play" in head:
                    entities['query'] = head.split("play")[1].strip()
                elif "search" in head:
                    entities['query'] = head.split("search")[1].strip()
                elif "search for" in head:
                    entities['query'] = head.split("search for")[1].strip()
            elif "open spotify and play" in text:
                entities['query'] = text.split("open spotify and play")[1].strip()
            else:
                 # Fallback
                 entities['query'] = text.replace("spotify", "").replace("play", "").replace("search", "").strip()

        elif intent in ["volume_control", "brightness_control"]:
            # Extract numbers
            numbers = re.findall(r'\d+', text)
            if numbers:
                entities['value'] = int(numbers[0])
            else:
                # Heuristics for non-numeric
                if "increase" in text or "up" in text:
                    entities['direction'] = "up"
                elif "decrease" in text or "down" in text:
                    entities['direction'] = "down"
                elif "mute" in text:
                    entities['value'] = 0
                elif "max" in text:
                    entities['value'] = 100

        return entities
