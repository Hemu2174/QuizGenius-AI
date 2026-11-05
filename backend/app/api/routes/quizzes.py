from typing import List
from fastapi import APIRouter, HTTPException, status
from app.schemas.quiz import QuizResponse

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

@router.get("", response_model=List[QuizResponse], summary="List Quizzes (Phase 1 Stub)")
async def list_quizzes() -> List[QuizResponse]:
    """
    Returns user quizzes. In Phase 1, returns an empty list.
    """
    return []

@router.post("/generate", summary="Generate Quiz with AI (Prepared for Phase 2)")
async def generate_quiz():
    """
    Prepared endpoint for Groq AI question generation.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="AI quiz generation is scheduled for Phase 2."
    )

