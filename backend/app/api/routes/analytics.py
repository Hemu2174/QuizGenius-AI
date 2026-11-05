from typing import Dict, Any
from fastapi import APIRouter

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", summary="Analytics Overview (Phase 1 Stub)")
async def get_analytics_overview() -> Dict[str, Any]:
    """
    Returns high-level user statistics. In Phase 1, returns zero-state counts.
    Never returns fabricated metrics.
    """
    return {
        "documents_uploaded": 0,
        "quizzes_generated": 0,
        "average_score": 0,
        "study_time_minutes": 0,
        "recent_activity": []
    }

