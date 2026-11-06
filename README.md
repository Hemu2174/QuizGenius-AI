# QuizGenius AI – Phase 3 Implementation

> **AI-Powered Learning Platform**: Upload lecture notes and PDF documents, extract high-fidelity text with PyMuPDF, chunk documents with page provenance, generate grounded MCQs and short-answer questions using Groq Generative AI + RAG, inspect instant explanations, and review source citations.

---

## 1. Project Overview

QuizGenius AI is a modern SaaS educational platform built for students and lifelong learners. The platform solves the active recall challenge by turning static study materials (PDFs, lecture slides, chapter summaries) into diagnostic, AI-generated quizzes.

### Implementation Status

- **Phase 1 (Frontend & Backend Foundation)**: COMPLETED
- **Phase 2 (Supabase Auth, Private Storage, PyMuPDF Extraction & Document Pipeline)**: COMPLETED
- **Phase 3 (Groq AI Question Generation, RAG Context Retrieval & Quiz Review Engine)**: COMPLETED
- **Phase 4 (Interactive Test-Taking, Timer, Submission, Auto-Grading & Weak-Topic Analytics)**: NEXT UP

---

## 2. Technology Stack

### Frontend
- **Framework**: React.js 18 (Vite 5)
- **Language**: JavaScript (Strictly JSX / JS — no TypeScript)
- **Styling**: Tailwind CSS 3.4 (Indigo / Violet design system, soft shadows, rounded cards)
- **Icons**: Lucide React
- **Routing**: React Router DOM 6
- **Charts**: Recharts 2
- **Auth & Storage**: `@supabase/supabase-js` v2.49+
- **HTTP Client**: Axios with JWT Bearer token interceptor

### Backend
- **Language**: Python 3.10+
- **API Framework**: FastAPI
- **ASGI Server**: Uvicorn
- **AI Inference Engine**: Groq SDK (`groq` v0.37+)
- **Configured Groq Model**: `qwen/qwen3.8-27b` (configurable via `GROQ_MODEL`)
- **PDF Extraction**: PyMuPDF (`pymupdf` v1.25+)
- **Database & Auth**: Supabase Python SDK (`supabase` v2.4+)
- **Validation**: Pydantic v2
- **Environment**: Python dotenv

### Cloud Services & Database
- **Supabase Authentication**: Email/Password signup, signin, password recovery, session persistence
- **Supabase PostgreSQL**: Tables (`profiles`, `documents`, `document_chunks`, `quizzes`, `questions`) with Row Level Security (RLS)
- **Supabase Storage**: Private `study-documents` bucket with per-user folder isolation (`{user_id}/{filename}.pdf`)
- **Groq API**: High-speed LLM inference with structured JSON object generation

---

## 3. Project Structure

```
quizgenius-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Button.jsx             # Reusable button with variants & loading state
│   │   │   ├── EmptyState.jsx         # Zero-state placeholder component
│   │   │   ├── GenerateQuizModal.jsx  # Interactive multi-step AI quiz generation dialog
│   │   │   ├── Header.jsx             # Top bar with live status, user profile & logout
│   │   │   ├── LoadingSpinner.jsx     # Accessible loading spinner
│   │   │   ├── PageHeader.jsx         # Consistent page title & actions wrapper
│   │   │   ├── ProtectedRoute.jsx     # Route guard with session check & login redirect
│   │   │   ├── QuizDetailModal.jsx    # Question review modal with highlighted correct answers
│   │   │   ├── Sidebar.jsx            # Responsive navigation & backend status badge
│   │   │   ├── StatCard.jsx           # KPI card supporting zero-state formatting
│   │   │   └── UploadCard.jsx         # Live Supabase upload & extraction trigger
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Supabase Auth context provider
│   │   ├── pages/
│   │   │   ├── Analytics.jsx          # Performance analytics layout
│   │   │   ├── Dashboard.jsx          # Live document & quiz KPIs, quick upload & generator
│   │   │   ├── Documents.jsx          # Document library with chunks drawer & quiz trigger
│   │   │   ├── Quizzes.jsx            # Quiz management view with search, filters & review
│   │   │   ├── Settings.jsx           # User profile management connected to Supabase
│   │   │   ├── Login.jsx, Signup.jsx, ForgotPassword.jsx # Auth pages
│   │   ├── services/
│   │   │   ├── api.js                 # Axios client with JWT interceptor & service modules
│   │   │   └── supabase.js            # Supabase JavaScript client instance
│   │   ├── utils/
│   │   │   └── formatters.js          # File size and date formatters
│   │   └── App.jsx                    # React Router DOM configuration
│   ├── .env                           # Local frontend environment (ignored by git)
│   ├── .env.example                   # Frontend template environment
│   └── package.json                   # Dependencies & npm scripts
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── ai.py              # GET /api/ai/status (Groq readiness & model availability)
│   │   │       ├── analytics.py       # GET /api/analytics/overview
│   │   │       ├── auth.py            # GET /api/auth/me, GET /api/auth/status
│   │   │       ├── documents.py       # Document CRUD, PyMuPDF extraction & topic discovery
│   │   │       ├── health.py          # GET /api/health
│   │   │       └── quizzes.py         # AI quiz synthesis, listing, inspection & deletion
│   │   ├── core/
│   │   │   ├── auth.py                # Supabase Bearer JWT verification dependency
│   │   │   └── config.py              # Environment settings, chunking & Groq configuration
│   │   ├── schemas/
│   │   │   ├── document.py            # Document processing schemas
│   │   │   ├── health.py              # Health check schemas
│   │   │   ├── quiz.py                # Pydantic schemas for generated MCQs & Short Answers
│   │   │   └── user.py                # User profile schemas
│   │   ├── services/
│   │   │   ├── groq_service.py        # Groq API client with prompt injection defense & retry logic
│   │   │   ├── pdf_service.py         # PyMuPDF text extraction & word-boundary chunker
│   │   │   ├── retrieval_service.py   # Keyword-ranked RAG context retrieval & topic discovery
│   │   │   └── supabase_service.py    # Supabase Python SDK client, storage & DB queries
│   │   └── main.py                    # FastAPI root with CORS & exception handlers
│   ├── tests/
│   │   ├── test_api.py                # Root & protected endpoint regression tests
│   │   ├── test_phase2.py             # Phase 2 PyMuPDF, auth & chunking test suite
│   │   └── test_phase3.py             # Phase 3 Groq, RAG, schemas & generation pipeline tests
│   ├── .env                           # Local backend environment (ignored by git)
│   ├── .env.example                   # Backend template environment
│   └── requirements.txt               # Python package dependencies
│
├── database/
│   ├── migrations/
│   │   ├── 001_phase2_schema.sql      # Supabase SQL migration (profiles, docs, chunks, RLS)
│   │   └── 002_phase3_quiz_generation.sql # Supabase SQL migration (quizzes, questions, RLS)
│   └── README.md                      # Database documentation & migration execution instructions
│
├── PROJECT_STATUS.md                  # Comprehensive implementation status & test record
├── .gitignore                         # Git exclusion rules (protects .env files)
└── README.md                          # Master documentation
```

---

## 4. Setup & Running

### 1. Database Migrations (Supabase)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** tab.
3. Run [`database/migrations/001_phase2_schema.sql`](file:///c:/Users/Hemanth/Documents/GitHub/QuizGenius-AI/database/migrations/001_phase2_schema.sql) (if not already applied).
4. Run [`database/migrations/002_phase3_quiz_generation.sql`](file:///c:/Users/Hemanth/Documents/GitHub/QuizGenius-AI/database/migrations/002_phase3_quiz_generation.sql).
   - This sets up `quizzes` and `questions` tables with cascading foreign keys and Row Level Security.
5. Ensure a private bucket named `study-documents` exists under **Storage** in your Supabase dashboard.

### 2. Backend Setup

```bash
cd backend

# Create & activate a virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env and fill in your Supabase & Groq credentials
```

Start the FastAPI backend:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Documentation (Swagger UI): `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`
- AI Engine Status: `http://localhost:8000/api/ai/status`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 5. Environment Configuration

### Backend (`backend/.env`)
```ini
PROJECT_NAME="QuizGenius AI"
APP_ENV=development
PORT=8000
HOST=0.0.0.0
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
STORAGE_BUCKET_NAME=study-documents

GROQ_API_KEY=gsk_...
GROQ_MODEL=qwen/qwen3.8-27b
GROQ_TEMPERATURE=0.3
GROQ_MAX_TOKENS=4096
```

> [!IMPORTANT]
> `SUPABASE_SECRET_KEY` and `GROQ_API_KEY` must **only** be configured on the backend. Never expose them to the frontend or git commits.

### Frontend (`frontend/.env`)
```ini
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

---

## 6. Testing & Verification

Run the automated backend test suites:
```bash
python -u backend/tests/test_phase3.py
python -u backend/tests/test_phase2.py
python -u backend/tests/test_api.py
```

Run frontend production build verification:
```bash
cd frontend
npm run build
```

---

## 7. Next Phase: Phase 4 Roadmap

- **Interactive Test-Taking Engine**: Timed testing UI with real-time countdown clock, progress tracker, and answer selector.
- **Automated Grading Engine**: Instant scoring for MCQs and semantic LLM grading for short-answer responses against key points.
- **Weak-Topic Diagnostics**: Automated mistake pattern recognition, topic mastery categorization, and Recharts performance progression.
