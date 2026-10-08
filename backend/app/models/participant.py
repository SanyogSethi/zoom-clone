from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("meeting_sessions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    display_name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="participant")
    status = Column(String, nullable=False, default="joined")
    is_muted = Column(Integer, nullable=False, default=0)
    joined_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    left_at = Column(String, nullable=True)

    __table_args__ = (
        CheckConstraint("role IN ('host','participant')", name="check_participant_role"),
        CheckConstraint("status IN ('joined','left','removed')", name="check_participant_status"),
    )

    # Relationships
    session = relationship("MeetingSession", back_populates="participants")
    user = relationship("User", back_populates="participants")
