from backend.nlp.intent_classifier import IntentClassifier
import os

def main():
    dataset_path = "backend/data/dataset.csv"
    if not os.path.exists(dataset_path):
        print(f"Error: Dataset not found at {dataset_path}")
        return

    classifier = IntentClassifier()
    classifier.train(dataset_path)
    
    # simple test
    test_phrase = "open google chrome"
    print(f"Test Prediction for '{test_phrase}': {classifier.predict(test_phrase)}")

if __name__ == "__main__":
    main()
