from backend.nlp.intent_classifier import IntentClassifier

def test():
    print("Loading model...")
    classifier = IntentClassifier()
    classifier.load()
    
    test_phrases = [
        # Exact matches (Baseline)
        "open chrome",
        "what time is it",
        
        # Semantic matches (The new superpower)
        "launch the web surfer",       # Should match 'open_app' or 'open browser'
        "kill the machine",            # Should match 'shutdown' (aggressive phrasing)
        "drop some beats",             # Should match 'spotify_play' or 'youtube_search'
        "maximize the audio",          # Should match 'volume_control'
        "I need to work on code",      # Should match 'open_app' (visual studio code context)
    ]
    
    print("\n" + "="*50)
    print(f"{'TEST PHRASE':<30} | {'PREDICTED INTENT'}")
    print("="*50)
    
    for phrase in test_phrases:
        intent = classifier.predict(phrase)
        print(f"{phrase:<30} | {intent}")
    print("="*50 + "\n")

if __name__ == "__main__":
    test()
