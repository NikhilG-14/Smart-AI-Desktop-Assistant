# Step 1: Import Required Libraries

import pandas as pd
import numpy as np

import re
import string
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

import matplotlib.pyplot as plt
import seaborn as sns

# Step 2: Load the Dataset

# Load CSV file
df = pd.read_csv('dataset.csv', comment='#')

# Check Data
df.head()

df.info()

# Remove null values
df.dropna(inplace=True)
# Remove duplicates
df.drop_duplicates(inplace=True)

df.shape


# Step 4: Text Preprocessing Function

#Convert to lowercase
#Remove punctuation
#Remove numbers
#Remove extra spaces 

def clean_text(text):
    text = text.lower()
    text = re.sub(r'\d+', '', text)
    text = text.translate(str.maketrans('', '', string.punctuation))
    text = text.strip()
    return text


df.columns

df["clean_command"] = df["command"].apply(clean_text)
df.head()


df.columns


df.columns = df.columns.str.strip().str.lower()
df.columns


# Step 5: Feature & Label Separation

X = df["clean_command"]
y = df["intent"]


# Step 6: Train-Test Split

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("Training samples:", X_train.shape)
print("Testing samples:", X_test.shape)


# Step 7: Build NLP Pipeline (TF-IDF + SVM)

# This is the most important part for good accuracy

model = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 2),
        stop_words="english",
        max_df=0.95,
        min_df=2
    )),
    ("classifier", LinearSVC(C=1.5))
])


# Step 8: Train the Model

model.fit(X_train, y_train)

# Step 9: Model Evaluation 

y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
accuracy


df["intent"].value_counts()


df["intent"] = df["intent"].replace({
    "media_play": "media_control",
    "media_pause": "media_control",
    "media_next": "media_control",
    "media_prev": "media_control",
    "spotify_play": "media_control"
})


intent_counts = df["intent"].value_counts()
valid_intents = intent_counts[intent_counts >= 5].index
df = df[df["intent"].isin(valid_intents)]


X = df["clean_command"]
y = df["intent"]

from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC

model = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 2),
        stop_words="english",
        min_df=2
    )),
    ("clf", LinearSVC(
        C=2.0,
        class_weight="balanced"
    ))
])


model.fit(X_train, y_train)


from sklearn.metrics import accuracy_score

y_pred = model.predict(X_test)
accuracy_score(y_test, y_pred)


from sklearn.model_selection import GridSearchCV

param_grid = {
    "tfidf__ngram_range": [(1,1), (1,2)],
    "clf__C": [0.5, 1, 2, 3]
}

grid = GridSearchCV(
    model,
    param_grid,
    cv=5,
    scoring="accuracy",
    n_jobs=-1
)

grid.fit(X_train, y_train)


best_model = grid.best_estimator_

y_pred = best_model.predict(X_test)
accuracy_score(y_test, y_pred)


df["intent"] = df["intent"].replace({
    "youtube_search": "media_control",
    "spotify_play": "media_control"
})


df["intent"].value_counts()


model = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 3),   # ⬅️ BIG CHANGE
        stop_words="english",
        min_df=1,             # allow rare but useful words
        sublinear_tf=True
    )),
    ("clf", LinearSVC(
        C=3.0,
        class_weight="balanced"
    ))
])


model.fit(X_train, y_train)


y_pred = model.predict(X_test)
accuracy_score(y_test, y_pred)


from sklearn.model_selection import cross_val_score

scores = cross_val_score(
    model,
    X,
    y,
    cv=5,
    scoring="accuracy"
)

scores, scores.mean()


y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
accuracy


print(classification_report(y_test, y_pred))


cm = confusion_matrix(y_test, y_pred)

plt.figure(figsize=(10,6))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=model.classes_,
            yticklabels=model.classes_)
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Confusion Matrix")
plt.show()


import joblib

joblib.dump(model, "intent_classification_model.pkl")


model = joblib.load("intent_classification_model.pkl")


