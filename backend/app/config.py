import os
from pydantic import BaseModel

class Settings(BaseModel):
    """
    Application settings loaded from environment variables or defaults.
    """
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./zoom.db")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

settings = Settings()

