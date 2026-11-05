"""
QuizGenius AI — Authentication API Routes
"""
from fastapi import APIRouter, Depends
from app.core.auth import get_current_user, AuthenticatedUser
from app.schemas.user import UserProfileResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me", response_model=UserProfileResponse, summary="Get Current Authenticated User")
async def get_my_profile(current_user: AuthenticatedUser = Depends(get_current_user)) -> UserProfileResponse:
    """
    Returns the profile and verification status of the currently authenticated user
    derived from the Supabase JWT.
    """
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        user_metadata=current_user.metadata,
        auth_provider="supabase",
    )


@router.get("/status", summary="Auth Status")
async def auth_status():
    """Returns the operational status of the Supabase authentication provider."""
    return {
        "status": "active",
        "phase": 2,
        "provider": "supabase",
        "message": "Supabase authentication is active with JWT token verification and RLS isolation.",
    }
