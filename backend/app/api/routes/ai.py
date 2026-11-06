"""
QuizGenius AI — AI Health and Status Route (Phase 3)
Provides system readiness and model availability status for Groq inference.
"""
from fastapi import APIRouter
from app.services.groq_service import groq_service
from app.schemas.quiz import AIStatusResponse

router = APIRouter(prefix="/ai", tags=["AI Engine"])


@router.get("/status", response_model=AIStatusResponse, summary="Check Groq AI Engine Status")
async def get_ai_status() -> AIStatusResponse:
    """
    Returns the availability and configuration status of the Groq AI service.
    Guarantees no API keys or credentials are leaked.
    """
    info = groq_service.check_status()
    return AIStatusResponse(
        status=info["status"],
        model=info["model"],
        is_configured=info["is_configured"],
        message=info["message"],
    )

