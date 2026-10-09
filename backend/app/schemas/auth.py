from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional

class RegisterRequest(BaseModel):
    email: EmailStr
    display_name: str = Field(..., min_length=2)
    password: str = Field(..., min_length=6)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class GoogleLoginRequest(BaseModel):
    credential: str  # Google OAuth ID Token or dev token

class AuthUserResponse(BaseModel):
    id: int
    email: str
    display_name: str
    avatar_url: Optional[str] = None
    timezone: str

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse
