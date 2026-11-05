from fastapi import APIRouter
from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse, summary="Service Health Check")
async def get_health() -> HealthResponse:
    """
    Returns the real-time operational status, application name, and version of the backend.
    Used by the frontend to display connection status.
    """
    return HealthResponse(
        name=settings.PROJECT_NAME,
        status="online",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
    )

