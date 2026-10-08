from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.time import utcnow_iso
from app.models.user import User
from app.models.meeting import Meeting
from app.models.meeting_session import MeetingSession
from app.models.participant import Participant
from app.repositories.meeting_repository import MeetingRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.participant_repository import ParticipantRepository
from app.schemas.session import SessionJoinResponse, ParticipantResponse

class SessionService:
    def __init__(self, db: Session):
        self.db = db
        self.meeting_repo = MeetingRepository(db)
        self.session_repo = SessionRepository(db)
        self.participant_repo = ParticipantRepository(db)

    def join_meeting(self, meeting_code: str, user: User, display_name: Optional[str] = None) -> SessionJoinResponse:
        """
        Validates meeting code, handles session creation for scheduled meetings, checks removal status,
        and creates a new participant record per join.
        """
        meeting = self.meeting_repo.get_by_code(meeting_code)
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found. Please check the Meeting ID."
            )

        if meeting.status == "ended":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This meeting has ended."
            )

        now_str = utcnow_iso()
        session = self.session_repo.get_active_session_by_meeting_id(meeting.id)

        # Joining a scheduled meeting with no live session creates the session (status becomes live in ONE transaction)
        if not session:
            session = MeetingSession(
                meeting_id=meeting.id,
                started_at=now_str,
                ended_at=None
            )
            self.session_repo.create(session)
            meeting.status = "live"

        # Validate user was not previously removed from this session (403 Forbidden)
        if self.participant_repo.has_user_been_removed(session.id, user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You were removed from this meeting session and cannot rejoin."
            )

        # Determine display name: use provided, or reuse previous participant display name, or default user name
        final_display_name = display_name
        if not final_display_name:
            prev_p = self.participant_repo.get_user_latest_participant_in_session(session.id, user.id)
            if prev_p and prev_p.display_name:
                final_display_name = prev_p.display_name
            else:
                final_display_name = user.display_name

        # Determine participant role
        role = "host" if meeting.host_id == user.id else "participant"

        # Create new participant row (preserves per-stay history)
        participant = Participant(
            session_id=session.id,
            user_id=user.id,
            display_name=final_display_name,
            role=role,
            status="joined",
            is_muted=0,
            joined_at=now_str,
            left_at=None
        )
        self.participant_repo.create(participant)

        self.db.commit()

        return SessionJoinResponse(
            session_id=session.id,
            participant_id=participant.id,
            meeting_code=meeting.meeting_code,
            title=meeting.title,
            role=role
        )

    def leave_session(self, session_id: int, participant_id: int, user: User):
        """
        Updates participant status to 'left'. If no joined participants remain,
        ends session and meeting status in ONE transaction.
        """
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting session not found."
            )

        participant = self.participant_repo.get_by_id(participant_id)
        if not participant or participant.session_id != session_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Participant record not found."
            )

        now_str = utcnow_iso()
        participant.status = "left"
        participant.left_at = now_str

        self.db.flush()

        # Check if any remaining participants in session are currently 'joined'
        remaining_joined = self.participant_repo.get_joined_participants(session_id)
        if len(remaining_joined) == 0:
            session.ended_at = now_str
            meeting = self.meeting_repo.get_by_id(session.meeting_id)
            if meeting:
                meeting.status = "ended"

        self.db.commit()
        return {"detail": "Successfully left meeting session"}

    def end_session(self, session_id: int, user: User):
        """
        Host-only action: ends session and meeting in ONE transaction and marks all joined participants as left.
        """
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting session not found."
            )

        meeting = self.meeting_repo.get_by_id(session.meeting_id)
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found."
            )

        if meeting.host_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the meeting host can end the meeting for all."
            )

        now_str = utcnow_iso()

        # Update session ended_at and meeting status together in ONE transaction
        session.ended_at = now_str
        meeting.status = "ended"

        # Update all joined participants to left
        joined_participants = self.participant_repo.get_joined_participants(session_id)
        for p in joined_participants:
            p.status = "left"
            p.left_at = now_str

        self.db.commit()
        return {"detail": "Meeting ended for all participants"}

    def get_session_participants(self, session_id: int) -> List[ParticipantResponse]:
        """
        Returns all participant records for a session.
        """
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting session not found."
            )

        participants = self.participant_repo.get_all_session_participants(session_id)
        return [
            ParticipantResponse(
                id=p.id,
                session_id=p.session_id,
                user_id=p.user_id,
                display_name=p.display_name,
                role=p.role,
                status=p.status,
                is_muted=bool(p.is_muted),
                joined_at=p.joined_at,
                left_at=p.left_at
            )
            for p in participants
        ]

    def mute_all_participants(self, session_id: int, user: User):
        """
        Host-only action: mutes all currently joined non-host participants in the session.
        """
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

        meeting = self.meeting_repo.get_by_id(session.meeting_id)
        if meeting.host_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only host can mute all participants.")

        joined = self.participant_repo.get_joined_participants(session_id)
        for p in joined:
            if p.role != "host":
                p.is_muted = 1

        self.db.commit()
        return {"detail": "All participants muted"}

    def mute_participant(self, participant_id: int, user: User):
        """
        Mutes a specific participant.
        """
        participant = self.participant_repo.get_by_id(participant_id)
        if not participant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found.")

        participant.is_muted = 1
        self.db.commit()
        return {"detail": "Participant muted"}

    def remove_participant(self, participant_id: int, user: User):
        """
        Host-only action: removes a participant from the session and prevents rejoining.
        """
        participant = self.participant_repo.get_by_id(participant_id)
        if not participant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found.")

        session = self.session_repo.get_by_id(participant.session_id)
        meeting = self.meeting_repo.get_by_id(session.meeting_id)

        if meeting.host_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only host can remove participants.")

        now_str = utcnow_iso()
        participant.status = "removed"
        participant.left_at = now_str

        self.db.commit()
        return {"detail": "Participant removed from meeting"}
