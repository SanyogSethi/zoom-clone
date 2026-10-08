from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.meeting_session import MeetingSession
from app.models.meeting import Meeting
from app.models.participant import Participant

class SessionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, session_id: int) -> Optional[MeetingSession]:
        return self.db.query(MeetingSession).filter(MeetingSession.id == session_id).first()

    def get_active_session_by_meeting_id(self, meeting_id: int) -> Optional[MeetingSession]:
        """
        Retrieves the currently live session for a meeting (where ended_at IS NULL).
        """
        return (
            self.db.query(MeetingSession)
            .filter(
                MeetingSession.meeting_id == meeting_id,
                MeetingSession.ended_at.is_(None)
            )
            .first()
        )

    def create(self, session: MeetingSession) -> MeetingSession:
        self.db.add(session)
        self.db.flush()
        return session

    def get_recent_user_sessions(self, user_id: int, limit: int = 10) -> List[Tuple[MeetingSession, Meeting, str, str]]:
        """
        Retrieves sessions the user joined and then left.
        Excludes sessions where the user currently has a 'joined' row or any 'removed' row.
        One entry per session, ordered by last left_at DESC, limit 10.
        Returns tuples of (MeetingSession, Meeting, display_name_used, max_left_at).
        """
        # Subquery to exclude sessions where user is currently joined or was removed
        excluded_subquery = (
            self.db.query(Participant.session_id)
            .filter(
                Participant.user_id == user_id,
                Participant.status.in_(["joined", "removed"])
            )
            .distinct()
            .subquery()
        )

        # Query sessions where user has at least one 'left' participant row
        query = (
            self.db.query(
                MeetingSession,
                Meeting,
                Participant.display_name,
                func.max(Participant.left_at).label("max_left_at")
            )
            .join(Meeting, MeetingSession.meeting_id == Meeting.id)
            .join(Participant, Participant.session_id == MeetingSession.id)
            .filter(
                Participant.user_id == user_id,
                Participant.status == "left",
                MeetingSession.id.not_in(self.db.query(excluded_subquery.c.session_id))
            )
            .group_by(MeetingSession.id)
            .order_by(func.max(Participant.left_at).desc())
            .limit(limit)
        )

        return query.all()
