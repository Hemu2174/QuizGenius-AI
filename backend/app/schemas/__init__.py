"""QuizGenius AI Schemas Module"""
from app.schemas.health import HealthResponse
from app.schemas.document import (
    DocumentProcessRequest,
    DocumentResponse,
    DocumentDetailResponse,
    DocumentChunkResponse,
    DocumentRetryResponse,
)
from app.schemas.user import UserResponse, UserProfileResponse

__all__ = [
    "HealthResponse",
    "DocumentProcessRequest",
    "DocumentResponse",
    "DocumentDetailResponse",
    "DocumentChunkResponse",
    "DocumentRetryResponse",
    "UserResponse",
    "UserProfileResponse",
]
