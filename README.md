<div align="center">

# 🚀 EduMind: The Ultimate AI-Powered Adaptive Learning Ecosystem

**Closing the Loop on Competitive Entrance Prep (JEE/NEET) with Predictive Machine Learning, Interactive 3D Simulation Labs, and Real-Time LaTeX Remediation.**

[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)

[Features](#-key-features) • [Architecture](#-architecture--ml-pipelines) • [Installation](#-quick-start) • [Roadmap](#-roadmap) • [Contributing](#-contributing)

</div>

---

## 🌟 The Vision

**EduMind** is a state-of-the-art, high-fidelity AI-driven adaptive learning workspace designed for students preparing for high-stakes examinations like **JEE** and **NEET**. Traditional study tools fail to bridge the gap between *diagnosing a student's mistakes* and *providing immediate conceptual, spatial, and mathematical clarity*. 

EduMind redefines educational technology by integrating machine learning, spatial 3D simulations, and context-aware LLMs into a seamless, blazing-fast learning hub.

---

## 🔥 Key Features

| Feature | Description | Highlight |
|---------|-------------|-----------|
| 📈 **Predictive Analytics** | Time-series score forecasting & risk profiling | Uses **Ridge Regression** & **Random Forest** to accurately predict learning trajectories. |
| 🔬 **3D Interactive Labs** | Real-time, interactive physics and chemistry simulations | Powered by **Three.js**, visualize rotational kinematics or stereochemistry organically. |
| 🤖 **Ask ARIA (AI Tutor)** | Context-aware, built-in intelligent tutoring system | Analyzes formulas and outputs step-by-step proofs dynamically. |
| ✍️ **Robust LaTeX Engine** | Flawless mathematical rendering on the web | Zero escape collisions, ensuring perfect normalization of $y = mx+b$ and complex calculus. |

---

## 🏗️ Architecture & ML Pipelines

### Flow Diagram

```mermaid
flowchart TD
    %% Define Styles
    classDef frontend fill:#6366f1,stroke:#4f46e5,color:#fff;
    classDef backend fill:#10b981,stroke:#059669,color:#fff;
    classDef database fill:#3ecf8e,stroke:#24b47e,color:#fff;
    classDef ml fill:#f59e0b,stroke:#d97706,color:#fff;

    Start([Student registers & completes survey]) --> UI[React Frontend Hub]:::frontend
    UI --> Survey[Save Onboarding Survey]:::frontend
    Survey -->|Upsert profile| DB[(Supabase DB)]:::database

    %% Learning loop
    DB --> |User Profile & Progress| API[FastAPI backend]:::backend
    API --> |Predict risk / readiness| RF[Random Forest Predictor]:::ml
    API --> |Forecast score trends| Ridge[Ridge Forecaster]:::ml

    %% Course & Diagnostics
    RF & Ridge --> |Personalized Metrics| Dashboard[Dynamic Dashboard Analytics]:::frontend
    Dashboard --> |Take Quiz / Interactive Test| Quiz[Adaptive Quiz Engine]:::frontend
    Quiz --> |Submit Quiz Results| DB
    DB --> |Trigger analysis| Heatmap[Weak Topic Heatmap]:::frontend
    Heatmap --> |Generates focused assessment| Diagnostics[Adaptive Retest Generator]:::frontend
    Diagnostics --> Quiz
```

### 🧠 Machine Learning & Intelligent Tutoring System

EduMind deploys a layered intelligence engine combining custom-trained scikit-learn models for analytical telemetry with Groq-hosted LLMs for cognitive science tutoring.

#### 1. Predictive Performance Classification (`backend/ml/performance.py`)
* **Model**: Random Forest Classifier (`weights/performance_model.pkl`)
* **Target Categories**: `At-Risk`, `On-Track`, `Advanced`
* **Features Used**: Average quiz scores, self-study hours, total doubt queries raised, quizzes completed, and active daily streak.
* **Feature Importance Analytics**: Calculates the exact mathematical impact of each study vector (e.g. study time vs. quiz scores) to show students what controls their trajectory.
* **Groq Integration**: If the student has identified weaknesses stored in the database, the engine queries `llama-3.1-8b-instant` to generate custom telemetry-driven study recommendations (concise, 15-word action items) targeting their weak topics.
* **Deterministic Fallback**: Automatically activates a heuristic rule-based recommender engine if model weights are unbuilt or API keys are missing.

#### 2. Time-Series Score Forecasting (`backend/ml/forecaster.py`)
* **Model**: Ridge Regression (`weights/forecaster_model.pkl`)
* **Goal**: Projects a student's score trend over the next 30 days (evaluating six future intervals spaced 5 days apart).
* **Seasonality Adjustment**: Computes a continuous weekly seasonality cycle using a mathematical sine wave transformation ($\sin(\theta)$) to mirror human learning variance.
* **Uncertainty Bounds**: Generates expanding upper and lower confidence intervals over time to reflect increasing statistical uncertainty, rendering beautiful margin-of-error bounds on the frontend charting system.

#### 3. Cognitive AI Agent: Professor ARIA
The backend exposes advanced LLM endpoints leveraging **Groq Cloud API** models (`llama-3.3-70b-versatile` & `llama-3.1-8b-instant`) to drive the adaptive learning cycle:
* **Adaptive Question Generation (`/tests/generate`)**: Generates dynamically formatted JEE/NEET questions with unique solution steps when static pools are depleted.
* **Targeted Custom Test Assembly (`/tests/generate-custom`)**: Accepts student requested topics, matches them with active weak points, and crafts specialized mocks.
* **Dynamic LaTeX Remediation Advice (`/tests/aria-feedback`)**: Analyzes incorrect options chosen by students, detects conceptual misconceptions, outputs structured explanation blocks with inline/block LaTeX rendering, and maps out targeted recovery plans.
* **Smart Quiz Retake / Retry Similar (`/tests/retry-similar`)**: Automatically compiles a 5-question retry drill containing questions directly related to recently registered mistakes to ensure immediate knowledge gap closure.
* **Offline Fallback & Local Resiliency**: When network or DB queries fail, the platform switches to a client-side offline grading engine. The local results are cached in local storage and synced automatically with the central database on reconnection.

---

## 🗄️ Supabase Schema Topology

The backbone of EduMind connects user profiles with their performance vectors for seamless data mining.

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar name
        varchar email
        varchar role
        text avatar_url "Stores onboarding survey JSON data"
        timestamp created_at
    }
    QUIZ_RESULTS {
        uuid id PK
        uuid student_id FK
        float score
        int correct_answers
        int time_taken_seconds
    }
    MISTAKE_ANALYSIS {
        uuid id PK
        uuid student_id FK
        varchar question_id
        text explanation_text
        varchar ai_classification
    }
    USERS ||--o{ QUIZ_RESULTS : "completes"
    USERS ||--o{ MISTAKE_ANALYSIS : "reviews"
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **Supabase Account**
- **Groq API Key** (For ARIA LLM)

### 2. Environment Variables

**`backend/.env`**
```env
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_KEY="your-service-role-key"
GROQ_API_KEY="gsk_your_api_key"
SECRET_KEY="secure-jwt-signing-key"
```

**`frontend/.env`**
```env
VITE_API_URL="http://localhost:8000"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Or source venv/bin/activate on macOS/Linux
pip install -r requirements.txt

# Run initial generation scripts
python sanitize_caches.py
python sync_to_frontend.py
python train_models.py

# Launch FastAPI Server
uvicorn main:app --reload
```
*API Docs available at `http://localhost:8000/docs`*

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
*Platform boots at `http://localhost:5173`*

---

## 🗺️ Roadmap

- [x] **Core Backend Services**: Secured JWT FastApi endpoints, robust Supabase integration.
- [x] **Production Grade Resiliency**: Try-catch fallbacks for external dependencies (Groq/Supabase).
- [x] **3D Kinematics and Chemistry Labs**: Real-time HUD and rendering optimizations.
- [x] **Bcrypt Security Audit**: Native hash validation integrated globally.
- [ ] **Multiplayer WebRTC Sessions**: Allow students to join the same 3D workspace.
- [ ] **Voice-Enabled ARIA**: Transcribe vocal input to trigger intelligent science tutoring.

---

<div align="center">
Made with ❤️ by the EduMind Team.
</div>
