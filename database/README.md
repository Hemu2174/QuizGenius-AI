# QuizGenius AI – Database Architecture & Schema Roadmap

## Overview
QuizGenius AI is engineered to run on **Supabase PostgreSQL**. In Phase 1, data persistence is not yet active, and the frontend connects to the FastAPI backend for health and system status.

## Planned PostgreSQL Tables for Phase 2 & 3

### 1. `profiles` (Supabase Auth Integration)
Stores extended user profile information linked to `auth.users.id`.
```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. `documents`
Tracks uploaded source materials (PDFs and notes) stored in Supabase Storage buckets.
```sql
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'pdf',
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    extracted_text TEXT,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. `quizzes`
Generated quizzes created via the Groq AI engine.
```sql
CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_count INT DEFAULT 5,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. `questions` & `options`
Questions (MCQs and short-answer) and corresponding multiple-choice options.
```sql
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT CHECK (question_type IN ('mcq', 'short_answer')),
    explanation TEXT,
    topic TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE
);
```

### 5. `quiz_attempts` & `topic_analytics`
Records student attempts, scores, and weak-topic analysis.
```sql
CREATE TABLE public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL,
    total_questions INT NOT NULL,
    time_spent_seconds INT DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);
```

