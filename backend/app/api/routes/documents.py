"""
QuizGenius AI — Document API Routes (Phase 2)
Handles secure document listing, PyMuPDF text extraction & chunking,
metadata retrieval, retry logic, and document deletion.
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.config import settings
from app.core.auth import get_current_user, AuthenticatedUser
from app.services.supabase_service import supabase_service
from app.services.pdf_service import pdf_service, ScannedPDFException
from app.services.retrieval_service import retrieval_service
from app.schemas.quiz import DocumentTopicsResponse
from app.schemas.document import (
    DocumentProcessRequest,
    DocumentResponse,
    DocumentDetailResponse,
    DocumentChunkResponse,
    DocumentRetryResponse,
)

router = APIRouter(prefix="/documents", tags=["Documents"])


def _handle_supabase_error(e: Exception):
    """Formats Supabase / PostgREST errors into descriptive HTTP exceptions."""
    err_str = str(e)
    if "Could not find the table" in err_str or "PGRST205" in err_str:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Supabase database tables are not yet initialized. Please execute the migration file "
                "'database/migrations/001_phase2_schema.sql' in your Supabase SQL Editor."
            ),
        )
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Database operation failed: {err_str}",
    )


@router.get("", response_model=List[DocumentResponse], summary="List Authenticated User's Documents")
async def list_documents(
    current_user: AuthenticatedUser = Depends(get_current_user)
) -> List[DocumentResponse]:
    """
    Returns all study documents uploaded by the authenticated user.
    Enforces user isolation via Supabase RLS.
    """
    client = supabase_service.get_user_client(current_user.token)
    try:
        res = (
            client.from_("documents")
            .select("*, document_chunks(count)")
            .eq("user_id", current_user.id)
            .order("created_at", desc=True)
            .execute()
        )
        data = res.data or []
        documents = []
        for row in data:
            # Extract count from join
            chunk_count = 0
            if "document_chunks" in row and isinstance(row["document_chunks"], list) and len(row["document_chunks"]) > 0:
                chunk_count = row["document_chunks"][0].get("count", 0)

            documents.append(
                DocumentResponse(
                    id=str(row["id"]),
                    user_id=str(row["user_id"]),
                    title=row.get("title") or "Untitled Document",
                    original_filename=row.get("original_filename") or "",
                    storage_path=row.get("storage_path") or "",
                    file_size=row.get("file_size") or 0,
                    mime_type=row.get("mime_type") or "application/pdf",
                    status=row.get("status") or "uploaded",
                    page_count=row.get("page_count") or 0,
                    error_message=row.get("error_message"),
                    chunk_count=chunk_count,
                    created_at=row["created_at"],
                    updated_at=row.get("updated_at"),
                )
            )
        return documents
    except Exception as e:
        _handle_supabase_error(e)


@router.post("/process", response_model=DocumentResponse, summary="Process Uploaded PDF Document")
async def process_document(
    payload: DocumentProcessRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DocumentResponse:
    """
    Downloads the private PDF from Supabase Storage, extracts text page-by-page
    using PyMuPDF, generates structured chunks, and stores them in PostgreSQL.
    """
    client = supabase_service.get_user_client(current_user.token)

    document_id = payload.document_id
    storage_path = payload.storage_path

    # Step 1: If document_id is not given, register a new document record
    if not document_id:
        if not storage_path or not payload.original_filename:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="storage_path and original_filename are required to register a new document.",
            )

        # Validate security: path must start with user's ID
        clean_path = storage_path.lstrip("/")
        if not clean_path.startswith(f"{current_user.id}/"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Storage path does not match authenticated user ID.",
            )

        # Validate PDF extension
        if not payload.original_filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF documents are supported.",
            )

        # Validate size (10 MB maximum)
        max_bytes = 10 * 1024 * 1024
        if payload.file_size and payload.file_size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of 10 MB (Received: {payload.file_size} bytes).",
            )

        title = payload.title or payload.original_filename.rsplit(".", 1)[0]
        try:
            insert_res = (
                client.from_("documents")
                .insert({
                    "user_id": current_user.id,
                    "title": title,
                    "original_filename": payload.original_filename,
                    "storage_path": clean_path,
                    "file_size": payload.file_size or 0,
                    "mime_type": payload.mime_type or "application/pdf",
                    "status": "processing",
                    "page_count": 0,
                })
                .execute()
            )
            if not insert_res.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create document record in database.",
                )
            doc_record = insert_res.data[0]
            document_id = str(doc_record["id"])
        except Exception as e:
            _handle_supabase_error(e)
    else:
        # Document already registered; verify ownership
        try:
            doc_res = client.from_("documents").select("*").eq("id", document_id).eq("user_id", current_user.id).execute()
            if not doc_res.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Document not found or access denied.",
                )
            doc_record = doc_res.data[0]
            storage_path = doc_record["storage_path"]
            # Set status to processing
            client.from_("documents").update({"status": "processing", "error_message": None}).eq("id", document_id).execute()
        except HTTPException:
            raise
        except Exception as e:
            _handle_supabase_error(e)

    # Step 2: Download file from Supabase private storage
    try:
        pdf_bytes = supabase_service.download_document_file(storage_path, current_user.token)
    except HTTPException:
        # Mark document as failed
        client.from_("documents").update({
            "status": "failed",
            "error_message": "Could not download document from storage.",
        }).eq("id", document_id).execute()
        raise

    # Step 3: Extract text and chunks using PyMuPDF
    try:
        extracted = pdf_service.extract_text_and_chunks(
            pdf_bytes,
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
        )
    except ScannedPDFException as e:
        error_msg = str(e)
        client.from_("documents").update({
            "status": "failed",
            "error_message": error_msg,
        }).eq("id", document_id).execute()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=error_msg,
        )
    except Exception as e:
        error_msg = f"PDF text extraction failed: {str(e)}"
        client.from_("documents").update({
            "status": "failed",
            "error_message": error_msg,
        }).eq("id", document_id).execute()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=error_msg,
        )

    # Step 4: Save chunks and mark completed (Safe retry: clear old chunks first)
    try:
        # Remove any existing chunks
        client.from_("document_chunks").delete().eq("document_id", document_id).execute()

        # Batch insert chunks
        chunk_items = [
            {
                "document_id": document_id,
                "user_id": current_user.id,
                "chunk_index": c["chunk_index"],
                "content": c["content"],
                "page_start": c.get("page_start"),
                "page_end": c.get("page_end"),
            }
            for c in extracted["chunks"]
        ]
        if chunk_items:
            client.from_("document_chunks").insert(chunk_items).execute()

        # Update document to completed
        update_res = (
            client.from_("documents")
            .update({
                "status": "completed",
                "page_count": extracted["page_count"],
                "extracted_text": extracted["extracted_text"],
                "error_message": None,
            })
            .eq("id", document_id)
            .execute()
        )

        final_doc = update_res.data[0] if update_res.data else doc_record

        return DocumentResponse(
            id=str(final_doc["id"]),
            user_id=str(final_doc["user_id"]),
            title=final_doc["title"],
            original_filename=final_doc["original_filename"],
            storage_path=final_doc["storage_path"],
            file_size=final_doc["file_size"],
            mime_type=final_doc["mime_type"],
            status="completed",
            page_count=extracted["page_count"],
            error_message=None,
            chunk_count=len(extracted["chunks"]),
            created_at=final_doc["created_at"],
            updated_at=final_doc.get("updated_at"),
        )
    except HTTPException:
        raise
    except Exception as e:
        _handle_supabase_error(e)


@router.get("/{document_id}", response_model=DocumentDetailResponse, summary="Get Document Details and Chunks")
async def get_document(
    document_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DocumentDetailResponse:
    """
    Retrieves full details, extracted text, chunk preview, and temporary
    signed download URL for a document. Enforces user ownership.
    """
    client = supabase_service.get_user_client(current_user.token)
    try:
        doc_res = (
            client.from_("documents")
            .select("*")
            .eq("id", document_id)
            .eq("user_id", current_user.id)
            .execute()
        )
        if not doc_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found or access denied.",
            )
        doc = doc_res.data[0]

        # Retrieve chunks
        chunk_res = (
            client.from_("document_chunks")
            .select("id, chunk_index, content, page_start, page_end, created_at")
            .eq("document_id", document_id)
            .order("chunk_index")
            .execute()
        )
        chunks = [
            DocumentChunkResponse(
                id=str(c["id"]),
                chunk_index=c["chunk_index"],
                content=c["content"],
                page_start=c.get("page_start"),
                page_end=c.get("page_end"),
                created_at=c.get("created_at"),
            )
            for c in (chunk_res.data or [])
        ]

        # Generate temporary signed download URL
        signed_url = supabase_service.create_signed_download_url(
            doc["storage_path"], current_user.token, expires_in=3600
        )

        return DocumentDetailResponse(
            id=str(doc["id"]),
            user_id=str(doc["user_id"]),
            title=doc["title"],
            original_filename=doc["original_filename"],
            storage_path=doc["storage_path"],
            file_size=doc["file_size"],
            mime_type=doc["mime_type"],
            status=doc["status"],
            page_count=doc.get("page_count", 0),
            error_message=doc.get("error_message"),
            chunk_count=len(chunks),
            extracted_text=doc.get("extracted_text"),
            download_url=signed_url,
            chunks=chunks,
            created_at=doc["created_at"],
            updated_at=doc.get("updated_at"),
        )
    except HTTPException:
        raise
    except Exception as e:
        _handle_supabase_error(e)


@router.delete("/{document_id}", summary="Delete Document and Associated Chunks/Storage")
async def delete_document(
    document_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Deletes the document from the database (cascading to chunks) and
    removes the physical PDF file from the private storage bucket.
    """
    client = supabase_service.get_user_client(current_user.token)
    try:
        # Check ownership and fetch storage path
        doc_res = (
            client.from_("documents")
            .select("id, storage_path")
            .eq("id", document_id)
            .eq("user_id", current_user.id)
            .execute()
        )
        if not doc_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found or access denied.",
            )
        doc = doc_res.data[0]

        # Remove file from storage
        supabase_service.delete_document_file(doc["storage_path"], current_user.token)

        # Delete database row (cascade deletes document_chunks)
        client.from_("documents").delete().eq("id", document_id).execute()

        return {
            "success": True,
            "message": "Document deleted successfully.",
            "document_id": document_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        _handle_supabase_error(e)


@router.post("/{document_id}/retry", response_model=DocumentRetryResponse, summary="Retry Processing Failed Document")
async def retry_processing(
    document_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DocumentRetryResponse:
    """
    Retries text extraction and chunk generation for a previously failed document.
    """
    client = supabase_service.get_user_client(current_user.token)
    try:
        doc_res = (
            client.from_("documents")
            .select("*")
            .eq("id", document_id)
            .eq("user_id", current_user.id)
            .execute()
        )
        if not doc_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found or access denied.",
            )
        doc = doc_res.data[0]

        process_req = DocumentProcessRequest(
            document_id=document_id,
            storage_path=doc["storage_path"],
            original_filename=doc["original_filename"],
        )
        updated_doc = await process_document(process_req, current_user)

        return DocumentRetryResponse(
            message="Document re-processed successfully.",
            document=updated_doc,
        )
    except HTTPException:
        raise
    except Exception as e:
        _handle_supabase_error(e)


@router.get("/{document_id}/topics", response_model=DocumentTopicsResponse, summary="Extract Key Topics from Document")
async def get_document_topics(
    document_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DocumentTopicsResponse:
    """
    Extracts representative educational topics from document chunks.
    Verifies document ownership before analyzing chunks.
    """
    client = supabase_service.get_user_client(current_user.token)
    try:
        # Verify ownership
        doc_res = (
            client.from_("documents")
            .select("id, status")
            .eq("id", document_id)
            .eq("user_id", current_user.id)
            .execute()
        )
        if not doc_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found or access denied.",
            )
        
        doc = doc_res.data[0]
        if doc.get("status") != "completed":
            return DocumentTopicsResponse(
                document_id=document_id,
                topics=["General Overview", "Core Concepts"]
            )

        topics = retrieval_service.extract_document_topics(
            client=client,
            document_id=document_id,
            user_id=current_user.id
        )
        return DocumentTopicsResponse(document_id=document_id, topics=topics)
    except HTTPException:
        raise
    except Exception as e:
        _handle_supabase_error(e)

