from backend.llm_client import process_command, analyze_screen

def verify():
    print("Testing Ollama Integration...")
    
    # Test 1: Open App
    print("\n--- Test 1: Open Calculator ---")
    response = process_command("open calculator")
    print(f"Response: {response}")
    
    # Test 2: Search Web
    print("\n--- Test 2: Search Web ---")
    response = process_command("search web for latest news")
    print(f"Response: {response}")
    
    # Test 3: Vision (Should be unsupported)
    print("\n--- Test 3: Vision Check ---")
    response = analyze_screen("what's on my screen?")
    print(f"Response: {response}")

if __name__ == "__main__":
    verify()
