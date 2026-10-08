from fastapi import APIRouter, Depends
from app.models.user import User
from app.schemas.user import UserResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns default seeded user details (ID = 1).
    """
    return current_user
