from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    name: str = Field(..., description="Application name")
    status: str = Field(..., description="Service health status, e.g. online")
    version: str = Field(..., description="Application release version")
    environment: str = Field(default="development", description="Runtime environment")

