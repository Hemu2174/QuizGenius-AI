
-- =============================================================================
-- QUIZGENIUS AI - PHASE 2 DATABASE MIGRATION
-- Tables: profiles, documents, document_chunks
-- Includes secure triggers, RLS and private Storage policies.
-- =============================================================================

BEGIN;

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email
ON public.profiles(email);

-- 2. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0 CHECK (file_size >= 0),
    mime_type TEXT NOT NULL DEFAULT 'application/pdf',
    status TEXT NOT NULL DEFAULT 'uploaded'
        CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
    extracted_text TEXT,
    page_count INTEGER NOT NULL DEFAULT 0 CHECK (page_count >= 0),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensures a document ID and its owner form a unique pair.
    CONSTRAINT uq_documents_id_user UNIQUE (id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id
ON public.documents(user_id);

CREATE INDEX IF NOT EXISTS idx_documents_status
ON public.documents(status);

CREATE INDEX IF NOT EXISTS idx_documents_created_at
ON public.documents(created_at DESC);

-- 3. DOCUMENT CHUNKS TABLE
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    user_id UUID NOT NULL,
    chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
    content TEXT NOT NULL,
    page_start INTEGER,
    page_end INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_document_chunk_index
        UNIQUE (document_id, chunk_index),

    -- Enforces that the chunk owner matches the document owner.
    CONSTRAINT fk_chunk_document_owner
        FOREIGN KEY (document_id, user_id)
        REFERENCES public.documents(id, user_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_chunk_pages
        CHECK (
            page_start IS NULL
            OR page_end IS NULL
            OR page_end >= page_start
        )
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_id
ON public.document_chunks(document_id);

CREATE INDEX IF NOT EXISTS idx_document_chunks_user_id
ON public.document_chunks(user_id);

-- 4. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at
ON public.profiles;

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_documents_updated_at
ON public.documents;

CREATE TRIGGER set_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 5. SECURE NEW USER PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data ->> 'full_name',
            NEW.raw_user_meta_data ->> 'name',
            split_part(NEW.email, '@', 1)
        ),
        NEW.email
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for users who already exist.
INSERT INTO public.profiles (id, full_name, email)
SELECT
    id,
    COALESCE(
        raw_user_meta_data ->> 'full_name',
        raw_user_meta_data ->> 'name',
        split_part(email, '@', 1)
    ),
    email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile"
ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile"
ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile"
ON public.profiles;

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- DOCUMENT POLICIES
DROP POLICY IF EXISTS "Users can view own documents"
ON public.documents;

CREATE POLICY "Users can view own documents"
ON public.documents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own documents"
ON public.documents;

CREATE POLICY "Users can insert own documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own documents"
ON public.documents;

CREATE POLICY "Users can update own documents"
ON public.documents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own documents"
ON public.documents;

CREATE POLICY "Users can delete own documents"
ON public.documents
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- DOCUMENT CHUNK POLICIES
-- Both user_id and the parent document's owner are verified.

DROP POLICY IF EXISTS "Users can view own chunks"
ON public.document_chunks;

CREATE POLICY "Users can view own chunks"
ON public.document_chunks
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.documents d
        WHERE d.id = document_chunks.document_id
          AND d.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert own chunks"
ON public.document_chunks;

CREATE POLICY "Users can insert own chunks"
ON public.document_chunks
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.documents d
        WHERE d.id = document_chunks.document_id
          AND d.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update own chunks"
ON public.document_chunks;

CREATE POLICY "Users can update own chunks"
ON public.document_chunks
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.documents d
        WHERE d.id = document_chunks.document_id
          AND d.user_id = auth.uid()
    )
)
WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.documents d
        WHERE d.id = document_chunks.document_id
          AND d.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can delete own chunks"
ON public.document_chunks;

CREATE POLICY "Users can delete own chunks"
ON public.document_chunks
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.documents d
        WHERE d.id = document_chunks.document_id
          AND d.user_id = auth.uid()
    )
);

-- 7. TABLE PERMISSIONS
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.profiles, public.documents, public.document_chunks
TO authenticated;

-- 8. PRIVATE STORAGE BUCKET
-- Keep the existing bucket private and enforce PDF/10 MB limits.

INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'study-documents',
    'study-documents',
    FALSE,
    10485760,
    ARRAY['application/pdf']
)
ON CONFLICT (id)
DO UPDATE SET
    public = FALSE,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf'];

-- STORAGE INSERT POLICY
DROP POLICY IF EXISTS "Users can upload study documents"
ON storage.objects;

CREATE POLICY "Users can upload study documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'study-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- STORAGE SELECT POLICY
DROP POLICY IF EXISTS "Users can read own study documents"
ON storage.objects;

CREATE POLICY "Users can read own study documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'study-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- STORAGE UPDATE POLICY
-- Required if the frontend uses upsert for uploads.
DROP POLICY IF EXISTS "Users can update own study documents"
ON storage.objects;

CREATE POLICY "Users can update own study documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'study-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'study-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- STORAGE DELETE POLICY
DROP POLICY IF EXISTS "Users can delete own study documents"
ON storage.objects;

CREATE POLICY "Users can delete own study documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'study-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

COMMIT;

-- =============================================================================
-- PHASE 2 DATABASE MIGRATION COMPLETE
-- =============================================================================
