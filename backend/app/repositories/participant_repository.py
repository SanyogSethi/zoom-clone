from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.participant import Participant

class ParticipantRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, participant_id: int) -> Optional[Participant]:
        return self.db.query(Participant).filter(Participant.id == participant_id).first()

    def get_user_latest_participant_in_session(self, session_id: int, user_id: int) -> Optional[Participant]:
        """
        Retrieves the latest participant record for a user in a session to preserve display name across rejoins.
        """
        return (
            self.db.query(Participant)
            .filter(
                Participant.session_id == session_id,
                Participant.user_id == user_id
            )
            .order_by(Participant.id.desc())
            .first()
        )

    def has_user_been_removed(self, session_id: int, user_id: int) -> bool:
        """
        Checks if user has any 'removed' participant row in the specified session.
        """
        count = (
            self.db.query(Participant)
            .filter(
                Participant.session_id == session_id,
                Participant.user_id == user_id,
                Participant.status == "removed"
            )
            .count()
        )
        return count > 0

    def get_joined_participants(self, session_id: int) -> List[Participant]:
        """
        Retrieves all currently active ('joined') participants in a session.
        """
        return (
            self.db.query(Participant)
            .filter(
                Participant.session_id == session_id,
                Participant.status == "joined"
            )
            .all()
        )

    def get_all_session_participants(self, session_id: int) -> List[Participant]:
        """
        Retrieves all participant records for a session.
        """
        return (
            self.db.query(Participant)
            .filter(Participant.session_id == session_id)
            .order_by(Participant.joined_at.asc())
            .all()
        )

    def create(self, participant: Participant) -> Participant:
        self.db.add(participant)
        self.db.flush()
        return participant
