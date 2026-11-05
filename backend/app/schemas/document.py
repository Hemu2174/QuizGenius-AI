"""
QuizGenius AI — Document Pydantic Schemas
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class DocumentProcessRequest(BaseModel):
    """Payload to initiate or register and process a document."""
    document_id: Optional[str] = Field(None, description="Existing document ID in database (if already created)")
    title: Optional[str] = Field(None, description="User-friendly title of the document")
    original_filename: Optional[str] = Field(None, description="Original name of the uploaded file")
    storage_path: Optional[str] = Field(None, description="Relative path in Supabase Storage bucket 'study-documents'")
    file_size: Optional[int] = Field(0, description="Size of file in bytes")
    mime_type: Optional[str] = Field("application/pdf", description="MIME type of document")


class DocumentChunkResponse(BaseModel):
    id: str
    chunk_index: int
    content: str
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    created_at: Optional[datetime] = None


class DocumentResponse(BaseModel):
    id: str
    user_id: str
    title: str
    original_filename: str
    storage_path: str
    file_size: int
    mime_type: str
    status: str = "uploaded"  # uploaded, processing, completed, failed
    page_count: int = 0
    error_message: Optional[str] = None
    chunk_count: int = 0
    download_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocumentDetailResponse(DocumentResponse):
    extracted_text: Optional[str] = None
    chunks: List[DocumentChunkResponse] = []


class DocumentRetryResponse(BaseModel):
    message: str
    document: DocumentResponse
