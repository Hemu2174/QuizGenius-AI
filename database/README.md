# QuizGenius AI – Database Architecture & Migrations

## Overview
QuizGenius AI is engineered on **Supabase PostgreSQL** with Row Level Security (RLS) and cascading integrity constraints.

## Migration Files

### 1. `database/migrations/001_phase2_schema.sql` (Phase 2)
Sets up core user profiles, document catalog, chunks, and storage policies:
- `profiles`: Linked to `auth.users(id)` with auto-trigger on signup.
- `documents`: Stores uploaded PDF metadata, extraction status, page count, and full text.
- `document_chunks`: Stores bounded text chunks with `chunk_index`, `page_start`, `page_end`.
- Storage policies on bucket `study-documents`.

### 2. `database/migrations/002_phase3_quiz_generation.sql` (Phase 3)
Adds AI quiz generation and question persistence with RLS:
- `quizzes`:
  - `id`: UUID primary key
  - `user_id`: UUID references `auth.users(id)`
  - `document_id`: UUID references `documents(id)`
  - `title`: TEXT
  - `description`: TEXT
  - `question_type`: TEXT ('mcq', 'short_answer', 'mixed')
  - `difficulty`: TEXT ('easy', 'medium', 'hard')
  - `total_questions`: INTEGER
  - `status`: TEXT ('draft', 'generating', 'completed', 'failed')
  - `created_at` & `updated_at`: TIMESTAMPTZ
  - Constraint: `UNIQUE(id, user_id)`
  - Trigger: `handle_updated_at`
  - RLS: Select, insert, update, delete scoped to `auth.uid() = user_id`.

- `questions`:
  - `id`: UUID primary key
  - `quiz_id`: UUID references `quizzes(id, user_id)`
  - `user_id`: UUID references `auth.users(id)`
  - `question_type`: TEXT ('mcq', 'short_answer')
  - `question_text`: TEXT
  - `options`: JSONB (`{"A": "...", "B": "...", "C": "...", "D": "..."}`)
  - `correct_answer`: TEXT ('A', 'B', 'C', or 'D')
  - `expected_answer`: TEXT
  - `key_points`: JSONB (list of key concepts)
  - `explanation`: TEXT
  - `difficulty`: TEXT ('easy', 'medium', 'hard')
  - `topic`: TEXT
  - `source_chunk_ids`: JSONB
  - `source_pages`: JSONB
  - RLS: Select, insert, update, delete scoped to `auth.uid() = user_id`.

## How to Execute Migrations

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project and navigate to the **SQL Editor**.
3. Run `database/migrations/001_phase2_schema.sql` (if not already applied).
4. Run `database/migrations/002_phase3_quiz_generation.sql`.
