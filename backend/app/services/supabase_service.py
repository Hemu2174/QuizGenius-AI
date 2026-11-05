"""
QuizGenius AI — Supabase Integration Service
Manages authentication token verification, user-scoped RLS client creation,
private bucket Storage downloads, and PostgreSQL document persistence.
"""
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
from supabase import create_client, Client, ClientOptions
from app.core.config import settings


class SupabaseService:
    def __init__(self):
        self.url = settings.SUPABASE_URL
        self.publishable_key = settings.SUPABASE_PUBLISHABLE_KEY
        self.secret_key = settings.SUPABASE_SECRET_KEY
        self.bucket_name = settings.STORAGE_BUCKET_NAME

        # Base client for auth verification
        base_key = self.secret_key if self.secret_key else self.publishable_key
        if self.url and base_key:
            self.base_client: Client = create_client(self.url, base_key)
        else:
            self.base_client = None

        # Dedicated admin client (if secret key is available)
        if self.url and self.secret_key:
            self.admin_client: Optional[Client] = create_client(self.url, self.secret_key)
        else:
            self.admin_client = None

    def get_user_client(self, token: str) -> Client:
        """
        Creates a client configured with the user's JWT header.
        Ensures all operations are evaluated under that user's identity and RLS policies.
        """
        if not self.url or not self.publishable_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase is not configured on the backend."
            )
        options = ClientOptions(headers={"Authorization": f"Bearer {token}"})
        return create_client(self.url, self.publishable_key, options=options)

    def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verifies the Supabase JWT access token using Supabase Auth.
        Returns user dictionary with 'id', 'email', and 'user_metadata'.
        """
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token is missing."
            )

        # Normalize Bearer prefix if passed
        if token.lower().startswith("bearer "):
            token = token[7:].strip()

        if not self.base_client:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase credentials are not configured on the server."
            )

        try:
            auth_response = self.base_client.auth.get_user(token)
            if not auth_response or not auth_response.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired authentication session."
                )
            user = auth_response.user
            return {
                "id": str(user.id),
                "email": user.email,
                "user_metadata": user.user_metadata or {},
                "created_at": str(user.created_at) if hasattr(user, "created_at") else None,
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token verification failed: {str(e)}"
            )

    def download_document_file(self, storage_path: str, token: str) -> bytes:
        """
        Downloads the PDF file bytes from the private 'study-documents' bucket.
        Uses admin client if secret key is present, otherwise uses user-scoped client.
        """
        # Strip leading slashes
        clean_path = storage_path.lstrip("/")

        # Prefer admin client if available, else user client
        client_to_use = self.admin_client if self.admin_client else self.get_user_client(token)

        try:
            response = client_to_use.storage.from_(self.bucket_name).download(clean_path)
            if not response:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Document file not found at path '{clean_path}'."
                )
            return response
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to download document from storage: {str(e)}"
            )

    def delete_document_file(self, storage_path: str, token: str) -> bool:
        """Deletes the document file from the private Supabase storage bucket."""
        clean_path = storage_path.lstrip("/")
        client_to_use = self.admin_client if self.admin_client else self.get_user_client(token)
        try:
            client_to_use.storage.from_(self.bucket_name).remove([clean_path])
            return True
        except Exception:
            # Continue even if storage file removal fails
            return False

    def create_signed_download_url(self, storage_path: str, token: str, expires_in: int = 3600) -> Optional[str]:
        """Creates a temporary signed URL for viewing/downloading the private PDF."""
        clean_path = storage_path.lstrip("/")
        client_to_use = self.admin_client if self.admin_client else self.get_user_client(token)
        try:
            res = client_to_use.storage.from_(self.bucket_name).create_signed_url(clean_path, expires_in)
            if isinstance(res, dict) and "signedURL" in res:
                return res["signedURL"]
            if hasattr(res, "signed_url"):
                return res.signed_url
            if hasattr(res, "signedURL"):
                return res.signedURL
            return None
        except Exception:
            return None


supabase_service = SupabaseService()
