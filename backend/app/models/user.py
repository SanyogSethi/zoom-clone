from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False)
    display_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    timezone = Column(String, nullable=False, default="UTC")
    created_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    # Relationships
    meetings = relationship("Meeting", back_populates="host", cascade="all, delete-orphan")
    participants = relationship("Participant", back_populates="user")
