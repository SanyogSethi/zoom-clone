from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    GoogleLoginRequest,
    TokenResponse,
    AuthUserResponse
)
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registers a new user with salted bcrypt password hashing and returns a signed JWT access token.
    """
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    hashed_pw = hash_password(payload.password)
    new_user = User(
        email=payload.email.lower(),
        display_name=payload.display_name.strip(),
        password_hash=hashed_pw,
        avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={payload.display_name.strip()}",
        timezone="UTC"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=AuthUserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates user email and salted password against stored bcrypt hash.
    """
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=AuthUserResponse.model_validate(user)
    )

@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates or auto-registers a user via Google OAuth2 ID token.
    Supports live Google ID tokens and dev fallback tokens for local testing.
    """
    token_str = payload.credential.strip()
    google_email = None
    google_name = None
    google_picture = None

    # 1. Attempt standard Google ID token verification
    try:
        id_info = id_token.verify_oauth2_token(token_str, google_requests.Request())
        google_email = id_info.get("email")
        google_name = id_info.get("name") or id_info.get("given_name")
        google_picture = id_info.get("picture")
    except Exception:
        # 2. Development fallback for local profile selection or dev token
        if token_str.startswith("dev_") or "@" in token_str:
            clean_str = token_str.replace("dev_", "")
            if "@" in clean_str:
                google_email = clean_str
                google_name = clean_str.split("@")[0].capitalize()
            else:
                google_email = f"{clean_str}@example.com"
                google_name = clean_str.capitalize()
            google_picture = f"https://api.dicebear.com/7.x/avataaars/svg?seed={google_name}"
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google OAuth credential token."
            )

    if not google_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google ID token missing email claim."
        )

    user = db.query(User).filter(User.email == google_email.lower()).first()
    if not user:
        user = User(
            email=google_email.lower(),
            display_name=google_name or google_email.split("@")[0],
            avatar_url=google_picture or f"https://api.dicebear.com/7.x/avataaars/svg?seed={google_name}",
            timezone="UTC"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=AuthUserResponse.model_validate(user)
    )

@router.get("/me", response_model=AuthUserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns currently authenticated user info from JWT access token.
    """
    return AuthUserResponse.model_validate(current_user)

@router.get("/profiles", response_model=List[AuthUserResponse])
def get_profiles(db: Session = Depends(get_db)):
    """
    Returns list of active user profiles for dev multi-tab testing.
    """
    users = db.query(User).order_by(User.id.asc()).all()
    return [AuthUserResponse.model_validate(u) for u in users]
