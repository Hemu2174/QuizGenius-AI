from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.documents import router as documents_router
from app.api.routes.quizzes import router as quizzes_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.auth import router as auth_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(documents_router)
api_router.include_router(quizzes_router)
api_router.include_router(analytics_router)
api_router.include_router(auth_router)

__all__ = ["api_router"]

