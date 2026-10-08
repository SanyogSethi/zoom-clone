from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User

def get_current_user(db: Session = Depends(get_db)) -> User:
    """
    Dependency returning the default seeded user (ID = 1).
    No login/credentials handling; joins and meeting actions map to default user.
    """
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Default user (ID 1) not found. Please run seed script."
        )
    return user
