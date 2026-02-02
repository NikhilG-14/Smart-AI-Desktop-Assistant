
# Smart AI Assistant (Minor Project)

A powerful desktop assistant application combining a React/Electron frontend with a Python-based intelligent backend. This project features natural language processing (NLP) for intent classification and entity extraction, allowing users to perform system actions through chat commands.

## 🚀 Features

- **Intelligent Chat Interface**: Communicate with the assistant using natural language.
- **Intent Classification**: Uses an SVM-based ML model to understand user commands.
- **Entity Extraction**: Smartly identifies parameters and details from your requests.
- **System Control**: Perform OS-level actions like:
  - Brightness control
  - Text-to-Speech (TTS)
  - Application launching
- **Modern UI**: Built with React, TypeScript, and TailwindCSS for a sleek experience.
- **Cross-Platform**: Packaged with Electron for desktop use.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Vite, Electron
- **Backend**: Python, FastAPI, Scikit-learn, NLTK
- **Communication**: REST API (FastAPI)

## 📋 Prerequisites

Ensure you have the following installed on your machine:

- **Python 3.8+**
- **Node.js** (v18 or higher) & **npm**

## ⚙️ Installation & Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd minor
   ```

### Backend Setup

The backend handles the ML logical and system operations.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. (Optional but recommended) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```

3. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

   *Note: If you encounter issues with `pyaudio` (needed for voice features), you may need to install system-level dependencies like `portaudio` first (e.g., `brew install portaudio` on Mac).*

### Frontend Setup

The frontend provides the user interface and desktop integration.

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install the Node.js dependencies:
   ```bash
   npm install
   ```

## 🧠 Training the Model

The AI model is pre-trained, but you can retrain it with new data if needed.

1. **Prepare your dataset**:
   - Edit or replace `backend/data/dataset.csv` with your custom data.
   - Format: `command,intent` (e.g., "turn on the lights,control_device")

2. **Run the training script**:
   Make sure you are in the root directory (`minor/`) and your virtual environment is active.

   ```bash
   python -m backend.train
   ```

   This will:
   - Load the dataset.
   - Train the SVM classifier.
   - Save the model artifacts to `backend/models/`.
   - Run a quick test prediction to verify accuracy.

## ▶️ Running the Application

You need to run both the backend and frontend simultaneously.

### 1. Start the Backend Server

From the project root directory (`minor/`):

```bash
python -m backend.server
```
> The API server will start at `http://127.0.0.1:8000`.

### 2. Start the Frontend Application

Open a new terminal, navigate to the frontend directory, and start the app:

```bash
cd frontend
npm run dev
```
> This command will launch the Electron application and the Vite development server.

## 🔧 Building for Production

To create a production build of the desktop application:

1. Navigate to the `frontend` directory.
2. Run the build command:
   ```bash
   npm run build
   ```
The output (executable/installer) will be generated in the `dist` or `dist-electron` folder.

## 📁 Project Structure

```
minor/s
├── backend/            # Python FastAPI Server & ML Models
│   ├── data/          # Training data (dataset.csv)
│   ├── models/        # Saved ML models (pkl files)
│   ├── nlp/           # NLP Logic (Intent Classifier, Entity Extractor)
│   ├── os_adapter/    # System Actions Implementation
│   ├── server.py      # Entry point for the backend API
│   ├── train.py       # Script to retrain the model
│   └── requirements.txt
│
├── frontend/           # React + Electron Application
│   ├── electron/      # Electron main process logic
│   ├── src/           # React components and UI logic
│   └── package.json
│
└── README.md           # This file
```

