from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class MeetingSession(Base):
    __tablename__ = "meeting_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    ended_at = Column(String, nullable=True)

    # Relationships
    meeting = relationship("Meeting", back_populates="sessions")
    participants = relationship("Participant", back_populates="session", cascade="all, delete-orphan")
