-- =============================================================================
-- QUIZGENIUS AI - PHASE 3 DATABASE MIGRATION
-- Tables: quizzes, questions
-- Includes foreign keys, ownership cascading, RLS policies, and triggers.
-- =============================================================================

BEGIN;

-- 1. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    question_type TEXT NOT NULL DEFAULT 'mcq'
        CHECK (question_type IN ('mcq', 'short_answer', 'mixed')),
    difficulty TEXT NOT NULL DEFAULT 'medium'
        CHECK (difficulty IN ('easy', 'medium', 'hard')),
    total_questions INTEGER NOT NULL DEFAULT 0 CHECK (total_questions >= 0),
    status TEXT NOT NULL DEFAULT 'completed'
        CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensures a quiz ID and its owner form a unique pair for question referencing.
    CONSTRAINT uq_quizzes_id_user UNIQUE (id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_quizzes_user_id
ON public.quizzes(user_id);

CREATE INDEX IF NOT EXISTS idx_quizzes_document_id
ON public.quizzes(document_id);

CREATE INDEX IF NOT EXISTS idx_quizzes_created_at
ON public.quizzes(created_at DESC);

-- 2. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_type TEXT NOT NULL
        CHECK (question_type IN ('mcq', 'short_answer')),
    question_text TEXT NOT NULL,
    options JSONB, -- Stored as {"A": "...", "B": "...", "C": "...", "D": "..."} for MCQs
    correct_answer TEXT, -- "A", "B", "C", or "D" for MCQs
    expected_answer TEXT, -- Model answer for short_answer questions
    key_points JSONB, -- Array of strings for short_answer key concepts
    explanation TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'medium'
        CHECK (difficulty IN ('easy', 'medium', 'hard')),
    topic TEXT NOT NULL DEFAULT 'General',
    source_chunk_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    source_pages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Enforces that the question owner matches the quiz owner
    CONSTRAINT fk_questions_quiz_owner
        FOREIGN KEY (quiz_id, user_id)
        REFERENCES public.quizzes(id, user_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_id
ON public.questions(quiz_id);

CREATE INDEX IF NOT EXISTS idx_questions_user_id
ON public.questions(user_id);

CREATE INDEX IF NOT EXISTS idx_questions_topic
ON public.questions(topic);

-- 3. UPDATED_AT TRIGGER FOR QUIZZES
DROP TRIGGER IF EXISTS set_quizzes_updated_at ON public.quizzes;
CREATE TRIGGER set_quizzes_updated_at
    BEFORE UPDATE ON public.quizzes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. ROW LEVEL SECURITY (RLS) FOR QUIZZES
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own quizzes" ON public.quizzes;
CREATE POLICY "Users can view their own quizzes"
    ON public.quizzes
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own quizzes" ON public.quizzes;
CREATE POLICY "Users can insert their own quizzes"
    ON public.quizzes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own quizzes" ON public.quizzes;
CREATE POLICY "Users can update their own quizzes"
    ON public.quizzes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own quizzes" ON public.quizzes;
CREATE POLICY "Users can delete their own quizzes"
    ON public.quizzes
    FOR DELETE
    USING (auth.uid() = user_id);

-- 5. ROW LEVEL SECURITY (RLS) FOR QUESTIONS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own questions" ON public.questions;
CREATE POLICY "Users can view their own questions"
    ON public.questions
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own questions" ON public.questions;
CREATE POLICY "Users can insert their own questions"
    ON public.questions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own questions" ON public.questions;
CREATE POLICY "Users can update their own questions"
    ON public.questions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own questions" ON public.questions;
CREATE POLICY "Users can delete their own questions"
    ON public.questions
    FOR DELETE
    USING (auth.uid() = user_id);

COMMIT;

