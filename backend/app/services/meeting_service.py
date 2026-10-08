from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.meeting_code import generate_meeting_code
from app.core.time import utcnow_iso
from app.models.user import User
from app.models.meeting import Meeting
from app.models.meeting_session import MeetingSession
from app.models.participant import Participant
from app.repositories.meeting_repository import MeetingRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.participant_repository import ParticipantRepository
from app.schemas.meeting import MeetingCreate, MeetingResponse, UpcomingMeetingResponse, RecentMeetingResponse
from app.schemas.session import SessionJoinResponse

class MeetingService:
    def __init__(self, db: Session):
        self.db = db
        self.meeting_repo = MeetingRepository(db)
        self.session_repo = SessionRepository(db)
        self.participant_repo = ParticipantRepository(db)

    def _generate_unique_code(self) -> str:
        """
        Generates a 10-digit meeting code ensuring uniqueness against existing database records.
        Retries up to 10 times in case of code collision.
        """
        for _ in range(10):
            code = generate_meeting_code()
            if not self.meeting_repo.get_by_code(code):
                return code
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate a unique meeting code. Please try again."
        )

    def create_instant_meeting(self, user: User) -> SessionJoinResponse:
        """
        Creates an instant meeting, starts a live session, and joins the user as host in a single transaction.
        """
        meeting_code = self._generate_unique_code()
        now_str = utcnow_iso()

        # 1. Insert Meeting (instant, live)
        meeting = Meeting(
            host_id=user.id,
            meeting_code=meeting_code,
            title=f"{user.display_name}'s Instant Meeting",
            description=None,
            type="instant",
            scheduled_start=None,
            duration_minutes=None,
            status="live",
            created_at=now_str
        )
        self.meeting_repo.create(meeting)

        # 2. Insert Meeting Session (started_at = now, ended_at = None)
        session = MeetingSession(
            meeting_id=meeting.id,
            started_at=now_str,
            ended_at=None
        )
        self.session_repo.create(session)

        # 3. Insert Host Participant (role = host, status = joined)
        participant = Participant(
            session_id=session.id,
            user_id=user.id,
            display_name=user.display_name,
            role="host",
            status="joined",
            is_muted=0,
            joined_at=now_str
        )
        self.participant_repo.create(participant)

        self.db.commit()

        return SessionJoinResponse(
            session_id=session.id,
            participant_id=participant.id,
            meeting_code=meeting_code,
            title=meeting.title,
            role="host"
        )

    def schedule_meeting(self, user: User, data: MeetingCreate) -> MeetingResponse:
        """
        Schedules a meeting for a future date/time. Does not create a session until started.
        """
        meeting_code = self._generate_unique_code()

        meeting = Meeting(
            host_id=user.id,
            meeting_code=meeting_code,
            title=data.title,
            description=data.description,
            type="scheduled",
            scheduled_start=data.scheduled_start,
            duration_minutes=data.duration_minutes,
            status="scheduled",
            created_at=utcnow_iso()
        )
        self.meeting_repo.create(meeting)
        self.db.commit()

        return MeetingResponse(
            id=meeting.id,
            host_id=meeting.host_id,
            host_display_name=user.display_name,
            meeting_code=meeting.meeting_code,
            title=meeting.title,
            description=meeting.description,
            type=meeting.type,
            scheduled_start=meeting.scheduled_start,
            duration_minutes=meeting.duration_minutes,
            status=meeting.status,
            created_at=meeting.created_at
        )

    def get_meeting_by_code(self, code: str) -> MeetingResponse:
        """
        Validates meeting existence by 10-digit code and returns title, host name, and status.
        """
        meeting = self.meeting_repo.get_by_code(code)
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found. Please check the Meeting ID."
            )
        
        return MeetingResponse(
            id=meeting.id,
            host_id=meeting.host_id,
            host_display_name=meeting.host.display_name if meeting.host else "Host",
            meeting_code=meeting.meeting_code,
            title=meeting.title,
            description=meeting.description,
            type=meeting.type,
            scheduled_start=meeting.scheduled_start,
            duration_minutes=meeting.duration_minutes,
            status=meeting.status,
            created_at=meeting.created_at
        )

    def get_upcoming_meetings(self, user: User) -> List[UpcomingMeetingResponse]:
        """
        Returns upcoming scheduled meetings hosted by user where status='scheduled' and scheduled_start >= now.
        """
        now_str = utcnow_iso()
        meetings = self.meeting_repo.get_upcoming_meetings(user.id, now_str)
        return [
            UpcomingMeetingResponse(
                id=m.id,
                meeting_code=m.meeting_code,
                title=m.title,
                description=m.description,
                scheduled_start=m.scheduled_start,
                duration_minutes=m.duration_minutes,
                status=m.status,
                host_display_name=user.display_name
            )
            for m in meetings
        ]

    def get_recent_meetings(self, user: User) -> List[RecentMeetingResponse]:
        """
        Returns recent sessions the user joined and left. Excludes currently joined or removed sessions.
        Returns can_rejoin = (session.ended_at IS NULL).
        """
        recent_tuples = self.session_repo.get_recent_user_sessions(user.id, limit=10)
        results = []

        for session, meeting, display_name_used, max_left_at in recent_tuples:
            can_rejoin = session.ended_at is None
            
            # Calculate duration in minutes if session ended or left
            duration_mins = None
            if session.started_at and max_left_at:
                try:
                    start_dt = datetime.fromisoformat(session.started_at)
                    left_dt = datetime.fromisoformat(max_left_at)
                    duration_mins = max(1, int((left_dt - start_dt).total_seconds() // 60))
                except Exception:
                    duration_mins = None

            results.append(
                RecentMeetingResponse(
                    session_id=session.id,
                    meeting_id=meeting.id,
                    meeting_code=meeting.meeting_code,
                    title=meeting.title,
                    host_display_name=meeting.host.display_name if meeting.host else "Host",
                    started_at=session.started_at,
                    ended_at=session.ended_at,
                    left_at=max_left_at,
                    duration_minutes=duration_mins,
                    can_rejoin=can_rejoin,
                    display_name_used=display_name_used
                )
            )

        return results
