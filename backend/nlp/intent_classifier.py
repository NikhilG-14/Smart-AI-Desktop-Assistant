import pandas as pd
import pickle
import os
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.svm import LinearSVC
from sklearn.linear_model import LogisticRegression
from backend.nlp.preprocess import preprocess_text

MODEL_PATH = "backend/models/intent_model.pkl"

class IntentClassifier:
    def __init__(self):
        self.model = None
        # Load the sentence transformer model
        # 'all-MiniLM-L6-v2' is a small, fast model suitable for running locally
        print("Loading Sentence Transformer model...")
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        print("Sentence Transformer loaded.")

    def train(self, dataset_path: str):
        """
        Trains the classifier using Sentence BERT embeddings.
        Expects columns: 'command', 'intent'
        """
        print(f"Loading dataset from {dataset_path}...")
        df = pd.read_csv(dataset_path)
        
        # Preprocess not strictly needed for SBERT but good for consistency
        df['clean_text'] = df['command'].apply(preprocess_text)
        
        print("Generating embeddings (this may take a moment)...")
        # Encode all commands into vectors
        X = self.embedder.encode(df['clean_text'].tolist(), show_progress_bar=True)
        y = df['intent']
        
        print("Training Classifier...")
        # Use LinearSVC for robust classification on small datasets
        self.model = LinearSVC()
        self.model.fit(X, y)
        
        # Save ONLY the classifier head (SVM)
        # We re-load the embedder from the library each time to save disk space/pickle complexity
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        with open(MODEL_PATH, 'wb') as f:
            pickle.dump(self.model, f)
        print(f"Classifier model saved to {MODEL_PATH}")

    def load(self):
        """Loads the trained classifier from disk."""
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, 'rb') as f:
                self.model = pickle.load(f)
            print("Intent Classifier loaded successfully.")
        else:
            print("Model file not found. Please train the model first.")
            self.model = None

    def predict(self, text: str) -> str:
        """Predicts the intent of a single command."""
        if not self.model:
            return "unknown"
        
        # 1. Cleaning
        clean_text = preprocess_text(text)
        
        # 2. Embedding
        # Extract embedding for the single sentence
        embedding = self.embedder.encode([clean_text])
        
        # 3. Prediction
        prediction = self.model.predict(embedding)[0]
        return prediction
