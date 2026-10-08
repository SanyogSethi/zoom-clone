from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    host_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    meeting_code = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    type = Column(String, nullable=False)
    scheduled_start = Column(String, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    status = Column(String, nullable=False, default="scheduled")
    created_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())

    __table_args__ = (
        CheckConstraint("type IN ('instant','scheduled')", name="check_meeting_type"),
        CheckConstraint("status IN ('scheduled','live','ended')", name="check_meeting_status"),
        CheckConstraint("duration_minutes > 0", name="check_duration_positive"),
        CheckConstraint(
            "type = 'instant' OR (scheduled_start IS NOT NULL AND duration_minutes IS NOT NULL)",
            name="check_scheduled_meeting_fields"
        ),
    )

    # Relationships
    host = relationship("User", back_populates="meetings")
    sessions = relationship("MeetingSession", back_populates="meeting", cascade="all, delete-orphan")
