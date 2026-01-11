import pandas as pd
import pickle
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import make_pipeline
from backend.nlp.preprocess import preprocess_text

MODEL_PATH = "backend/models/intent_model.pkl"

class IntentClassifier:
    def __init__(self):
        self.model = None

    def train(self, dataset_path: str):
        """
        Trains the SVM model on the provided dataset CSV.
        Expects columns: 'command', 'intent'
        """
        print(f"Loading dataset from {dataset_path}...")
        df = pd.read_csv(dataset_path)
        
        # Preprocess
        df['clean_text'] = df['command'].apply(preprocess_text)
        
        X = df['clean_text']
        y = df['intent']
        
        print("Training SVM model...")
        # Create a pipeline: Text -> TF-IDF -> SVM
        self.model = make_pipeline(TfidfVectorizer(), LinearSVC())
        self.model.fit(X, y)
        
        # Save the model
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        with open(MODEL_PATH, 'wb') as f:
            pickle.dump(self.model, f)
        print(f"Model saved to {MODEL_PATH}")

    def load(self):
        """Loads the trained model from disk."""
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, 'rb') as f:
                self.model = pickle.load(f)
            print("Model loaded successfully.")
        else:
            print("Model file not found. Please train the model first.")
            self.model = None

    def predict(self, text: str) -> str:
        """Predicts the intent of a single command."""
        if not self.model:
            return "unknown"
        
        clean_text = preprocess_text(text)
        prediction = self.model.predict([clean_text])[0]
        return prediction
