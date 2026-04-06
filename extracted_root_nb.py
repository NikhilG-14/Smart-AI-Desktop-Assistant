import pandas as pd
import numpy as np
import pickle
import os
import seaborn as sns
import matplotlib.pyplot as plt
from sentence_transformers import SentenceTransformer
from sklearn.svm import LinearSVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report

# Setup paths
DATASET_PATH = 'backend/data/dataset.csv'
MODEL_PATH = 'backend/models/intent_model.pkl'

print("Libraries loaded successfully.")

# Load dataset
if not os.path.exists(DATASET_PATH):
    raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

df = pd.read_csv(DATASET_PATH)

# Basic preprocessing
def preprocess_text(text):
    return text.lower().strip()

df['clean_text'] = df['command'].apply(preprocess_text)

print(f"Dataset loaded with {len(df)} entries.")
display(df.head())

print("Loading Sentence Transformer model...")
embedder = SentenceTransformer('all-MiniLM-L6-v2')

print("Generating embeddings...")
X = embedder.encode(df['clean_text'].tolist(), show_progress_bar=True)
y = df['intent']

print(f"Embeddings shape: {X.shape}")

# Split into Train and Test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

print(f"Training set size: {X_train.shape[0]}")
print(f"Test set size: {X_test.shape[0]}")

# Train SVM Classifier
classifier = LinearSVC(random_state=42)
classifier.fit(X_train, y_train)

print("Model training complete.")

# Predictions
y_pred = classifier.predict(X_test)

# Accuracy Score
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {accuracy * 100:.2f}%")

# Detailed Report
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Confusion Matrix Visualization
plt.figure(figsize=(12, 10))
cm = confusion_matrix(y_test, y_pred, labels=classifier.classes_)
sns.heatmap(cm, annot=True, fmt='d', xticklabels=classifier.classes_, yticklabels=classifier.classes_, cmap='Blues')
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.title('Confusion Matrix')
plt.xticks(rotation=45, ha='right')
plt.show()

# Re-train on FULL dataset before saving to ensure maximum performance
print("Retraining on full dataset...")
final_model = LinearSVC(random_state=42)
final_model.fit(X, y)

os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
with open(MODEL_PATH, 'wb') as f:
    pickle.dump(final_model, f)

print(f"Model saved successfully to {MODEL_PATH}")

def predict_intent(text):
    clean_text = preprocess_text(text)
    embedding = embedder.encode([clean_text])
    prediction = final_model.predict(embedding)[0]
    return prediction

# Test phrases
test_phrases = [
    "open google chrome",
    "find react tutorials on youtube",
    "increase the volume",
    "shutdown the pc",
    "what is the time",
    "play some taylor swift on spotify"
]

print("{:<40} | {:<20}".format("PHRASE", "PREDICTED INTENT"))
print("-"*60)
for phrase in test_phrases:
    intent = predict_intent(phrase)
    print(f"{phrase:<40} | {intent}")