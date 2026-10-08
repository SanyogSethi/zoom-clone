from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.meeting import Meeting

class MeetingRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, meeting_id: int) -> Optional[Meeting]:
        return self.db.query(Meeting).filter(Meeting.id == meeting_id).first()

    def get_by_code(self, code: str) -> Optional[Meeting]:
        return self.db.query(Meeting).filter(Meeting.meeting_code == code).first()

    def create(self, meeting: Meeting) -> Meeting:
        self.db.add(meeting)
        self.db.flush()
        return meeting

    def get_upcoming_meetings(self, host_id: int, current_time_iso: str) -> List[Meeting]:
        """
        Retrieves scheduled meetings hosted by user where status='scheduled'
        and scheduled_start >= now, ordered by scheduled_start ASC.
        """
        return (
            self.db.query(Meeting)
            .filter(
                Meeting.host_id == host_id,
                Meeting.type == "scheduled",
                Meeting.status == "scheduled",
                Meeting.scheduled_start >= current_time_iso
            )
            .order_by(Meeting.scheduled_start.asc())
            .all()
        )
