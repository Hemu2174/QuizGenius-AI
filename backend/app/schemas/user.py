from typing import Optional, Dict, Any
from pydantic import BaseModel


class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None


class UserResponse(UserBase):
    id: str
    is_active: bool = True


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    user_metadata: Dict[str, Any] = {}
    auth_provider: str = "supabase"
