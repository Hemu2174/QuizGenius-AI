"""
QuizGenius AI — Authentication Dependency
Extracts and validates Supabase Bearer JWTs and returns the authenticated user context.
"""
from typing import Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.supabase_service import supabase_service

security = HTTPBearer(auto_error=True)


class AuthenticatedUser:
    def __init__(self, user_dict: Dict[str, Any], token: str):
        self.id: str = user_dict["id"]
        self.email: str = user_dict.get("email", "")
        self.metadata: Dict[str, Any] = user_dict.get("user_metadata", {})
        self.full_name: str = (
            self.metadata.get("full_name")
            or self.metadata.get("name")
            or (self.email.split("@")[0].capitalize() if self.email else "Student")
        )
        self.token: str = token

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "user_metadata": self.metadata,
        }


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> AuthenticatedUser:
    """FastAPI dependency to enforce authentication on protected routes."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header with Bearer token."
        )

    user_dict = supabase_service.verify_token(credentials.credentials)
    return AuthenticatedUser(user_dict=user_dict, token=credentials.credentials)

