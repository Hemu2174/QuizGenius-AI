# QuizGenius AI – Phase 2 Implementation

> **AI-Powered Learning Platform**: Upload lecture notes and PDF documents, extract high-fidelity text with PyMuPDF, chunk documents with page provenance, generate MCQs and short-answer questions using Generative AI, attempt interactive quizzes, receive instant scores, and identify weak topics with explanations.

---

## 1. Project Overview

QuizGenius AI is a modern SaaS educational platform built for students and lifelong learners. The platform solves the active recall challenge by turning static study materials (PDFs, lecture slides, chapter summaries) into diagnostic, AI-generated quizzes.

### Implementation Status

- **Phase 1 (Frontend & Backend Foundation)**: COMPLETED
- **Phase 2 (Supabase Auth, Private Storage, PyMuPDF Extraction & Document Pipeline)**: COMPLETED
- **Phase 3 (Groq AI Question Generation & Quiz Engine)**: NEXT UP

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
- **PDF Extraction**: PyMuPDF (`pymupdf` v1.25+)
- **Database & Auth**: Supabase Python SDK (`supabase` v2.4+)
- **Validation**: Pydantic v2
- **Environment**: Python dotenv

### Cloud Services & Database
- **Supabase Authentication**: Real Email/Password signup, signin, password recovery, session persistence
- **Supabase PostgreSQL**: Tables (`profiles`, `documents`, `document_chunks`) with Row Level Security (RLS)
- **Supabase Storage**: Private `study-documents` bucket with per-user folder isolation (`{user_id}/{filename}.pdf`)
- **Groq API**: Reserved for Phase 3 question synthesis (LLaMA 3.3 70B)

---

## 3. Project Structure

```
quizgenius-ai/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Button.jsx             # Reusable button with variants & loading state
│   │   │   ├── EmptyState.jsx         # Zero-state placeholder component
│   │   │   ├── Header.jsx             # Top bar with live status, Supabase user profile & logout
│   │   │   ├── LoadingSpinner.jsx     # Accessible loading spinner
│   │   │   ├── PageHeader.jsx         # Consistent page title & actions wrapper
│   │   │   ├── ProtectedRoute.jsx     # Route guard with session check & login redirect
│   │   │   ├── Sidebar.jsx            # Responsive navigation & backend status badge
│   │   │   ├── StatCard.jsx           # KPI card supporting zero-state formatting
│   │   │   └── UploadCard.jsx         # Live Supabase upload & backend extraction trigger
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Real Supabase Auth context provider
│   │   ├── hooks/
│   │   │   └── useHealthCheck.js      # Polling hook for FastAPI health check
│   │   ├── layouts/
│   │   │   ├── AuthLayout.jsx         # Auth pages container (redirects authenticated users)
│   │   │   └── MainLayout.jsx         # Protected dashboard shell
│   │   ├── pages/
│   │   │   ├── Analytics.jsx          # Performance analytics layout
│   │   │   ├── Dashboard.jsx          # Live document KPIs, quick upload & recent activity
│   │   │   ├── Documents.jsx          # Document library with search, chunks drawer, retry & delete
│   │   │   ├── ForgotPassword.jsx     # Supabase password reset form
│   │   │   ├── Login.jsx              # Supabase email/password login
│   │   │   ├── NotFound.jsx           # 404 page
│   │   │   ├── Quizzes.jsx            # Quiz listing page
│   │   │   ├── Settings.jsx           # User profile management connected to Supabase
│   │   │   └── Signup.jsx             # Supabase email/password registration
│   │   ├── services/
│   │   │   ├── api.js                 # Centralized Axios client with JWT interceptor
│   │   │   └── supabase.js            # Supabase JavaScript client instance
│   │   ├── utils/
│   │   │   └── formatters.js          # File size and date formatters
│   │   ├── App.jsx                    # React Router DOM configuration
│   │   ├── index.css                  # Tailwind CSS root styling
│   │   └── main.jsx                   # React entry point
│   ├── .env                           # Local frontend environment (ignored by git)
│   ├── .env.example                   # Frontend template environment
│   └── package.json                   # Dependencies & npm scripts
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── analytics.py       # GET /api/analytics/overview
│   │   │       ├── auth.py            # GET /api/auth/me, GET /api/auth/status
│   │   │       ├── documents.py       # Document CRUD, PyMuPDF process & retry
│   │   │       ├── health.py          # GET /api/health
│   │   │       └── quizzes.py         # Quizzes endpoints (Phase 3)
│   │   ├── core/
│   │   │   ├── auth.py                # Supabase Bearer JWT verification dependency
│   │   │   └── config.py              # Environment settings & chunking parameters
│   │   ├── schemas/
│   │   │   ├── document.py            # Document processing, chunking & retry schemas
│   │   │   ├── health.py              # Health check schemas
│   │   │   ├── quiz.py                # Quiz schemas
│   │   │   └── user.py                # User profile schemas
│   │   ├── services/
│   │   │   ├── pdf_service.py         # PyMuPDF text extraction & word-boundary chunker
│   │   │   └── supabase_service.py    # Supabase Python SDK client, storage & DB queries
│   │   ├── utils/
│   │   │   └── helpers.py             # Byte formatting utilities
│   │   └── main.py                    # FastAPI root with CORS & exception handlers
│   ├── tests/
│   │   ├── test_api.py                # Health & endpoint tests
│   │   └── test_phase2.py             # Phase 2 PyMuPDF, auth & chunking test suite
│   ├── .env                           # Local backend environment (ignored by git)
│   ├── .env.example                   # Backend template environment
│   └── requirements.txt               # Python package dependencies
│
├── database/
│   ├── migrations/
│   │   └── 001_phase2_schema.sql      # Supabase SQL migration (profiles, docs, chunks, RLS)
│   └── README.md                      # Database documentation & migration execution instructions
│
├── PROJECT_STATUS.md                  # Comprehensive implementation status & test record
├── .gitignore                         # Git exclusion rules (protects .env files)
└── README.md                          # Master documentation
```

---

## 4. Setup & Running

### 1. Database & Storage Setup (Supabase)

1. Open your Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to the **SQL Editor** tab.
3. Open or copy the contents of [`database/migrations/001_phase2_schema.sql`](file:///c:/Users/Hemanth/Documents/GitHub/QuizGenius-AI/database/migrations/001_phase2_schema.sql).
4. Run the SQL script. This sets up:
   - `profiles` table with automatic `on_auth_user_created` trigger.
   - `documents` and `document_chunks` tables with cascades and updated-at triggers.
   - Row Level Security (RLS) policies on all tables so users can only access their own data.
   - Storage RLS policies for bucket `study-documents`.
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
# Copy .env.example to .env and fill in your Supabase credentials
```

Start the FastAPI backend:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Documentation (Swagger UI): `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and fill in your Supabase credentials
```

Start the Vite development server:
```bash
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 5. Environment Variables Reference

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
SUPABASE_STORAGE_BUCKET=study-documents

GROQ_API_KEY=gsk_...
```
> [!IMPORTANT]
> `SUPABASE_SECRET_KEY` must **only** be configured on the backend. Never expose it in the frontend or git commits.

### Frontend (`frontend/.env`)
```ini
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

---

## 6. Testing & Verification

Run the automated backend test suite:
```bash
python -u backend/tests/test_phase2.py
python -u backend/tests/test_api.py
```

Run frontend build verification:
```bash
cd frontend
npm run build
```

---

## 7. Next Phase: Phase 3 Roadmap

- **Groq AI Integration**: LLaMA 3.3 70B parameterization for question synthesis from document chunks.
- **Multiple Choice & Conceptual Questions**: Automatic distractor generation, correct answer tagging, and in-depth explanations.
- **Interactive Quiz Engine**: Timed tests, instant scoring, and answer review interface.
