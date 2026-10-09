from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.session import ParticipantResponse, LeaveSessionRequest
from app.services.session_service import SessionService

router = APIRouter(prefix="/api", tags=["Sessions & Participants"])

@router.post("/sessions/{session_id}/leave")
def leave_session(
    session_id: int,
    payload: LeaveSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marks participant as left. Ends meeting if last joined participant leaves.
    """
    service = SessionService(db)
    return service.leave_session(session_id, payload.participant_id, current_user)

@router.post("/sessions/{session_id}/end")
def end_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Host-only endpoint: ends the meeting for all participants in ONE transaction.
    """
    service = SessionService(db)
    return service.end_session(session_id, current_user)

@router.get("/sessions/{session_id}/participants", response_model=List[ParticipantResponse])
def get_session_participants(
    session_id: int,
    db: Session = Depends(get_db)
):
    """
    Returns list of all active and past participants for a meeting session.
    """
    service = SessionService(db)
    return service.get_session_participants(session_id)

@router.post("/sessions/{session_id}/mute-all")
def mute_all_participants(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Host-only endpoint: mutes all joined non-host participants in the session.
    """
    service = SessionService(db)
    return service.mute_all_participants(session_id, current_user)

@router.post("/participants/{participant_id}/mute")
def mute_participant(
    participant_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mutes a target participant.
    """
    service = SessionService(db)
    return service.mute_participant(participant_id, current_user)

@router.post("/participants/{participant_id}/unmute")
def unmute_participant(
    participant_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unmutes a target participant.
    """
    service = SessionService(db)
    return service.unmute_participant(participant_id, current_user)

@router.post("/participants/{participant_id}/remove")
def remove_participant(
    participant_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Host-only endpoint: removes participant from meeting session and revokes rejoin rights.
    """
    service = SessionService(db)
    return service.remove_participant(participant_id, current_user)


# Cross-profile WebRTC signaling relay store
import time
from pydantic import BaseModel

class SignalMessage(BaseModel):
    meeting_code: str
    from_id: str
    to_id: Optional[str] = None
    type: str
    data: dict

_SIGNALING_STORE: dict = {}
_SIGNAL_COUNTER = 0

@router.post("/signaling/send")
def send_signal(msg: SignalMessage):
    """
    Relays a WebRTC signaling message across browser profiles and windows.
    """
    global _SIGNAL_COUNTER
    _SIGNAL_COUNTER += 1
    msg_id = f"sig_{_SIGNAL_COUNTER}_{time.time()}"

    if msg.meeting_code not in _SIGNALING_STORE:
        _SIGNALING_STORE[msg.meeting_code] = []

    _SIGNALING_STORE[msg.meeting_code].append({
        "id": msg_id,
        "from_id": msg.from_id,
        "to_id": msg.to_id,
        "type": msg.type,
        "data": msg.data,
        "timestamp": time.time()
    })

    # Keep store memory bounded (keep items within last 30 seconds)
    now = time.time()
    _SIGNALING_STORE[msg.meeting_code] = [
        m for m in _SIGNALING_STORE[msg.meeting_code]
        if now - m["timestamp"] < 30
    ]
    return {"status": "ok", "id": msg_id}

@router.get("/signaling/poll")
def poll_signals(meeting_code: str, participant_id: str):
    """
    Polls pending WebRTC signaling messages for a participant from the last 30 seconds.
    """
    messages = _SIGNALING_STORE.get(meeting_code, [])
    now = time.time()
    valid_messages = [
        m for m in messages
        if now - m["timestamp"] < 30
    ]
    _SIGNALING_STORE[meeting_code] = valid_messages

    relevant = [
        m for m in valid_messages
        if m["from_id"] != participant_id
        and (m["to_id"] is None or m["to_id"] == participant_id)
    ]
    return relevant

