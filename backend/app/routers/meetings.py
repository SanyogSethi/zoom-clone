from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.meeting import MeetingCreate, MeetingResponse, UpcomingMeetingResponse, RecentMeetingResponse
from app.schemas.session import SessionJoinRequest, SessionJoinResponse
from app.services.meeting_service import MeetingService
from app.services.session_service import SessionService

router = APIRouter(prefix="/api/meetings", tags=["Meetings"])

@router.get("/upcoming", response_model=List[UpcomingMeetingResponse])
def get_upcoming_meetings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns list of upcoming scheduled meetings hosted by the user.
    """
    service = MeetingService(db)
    return service.get_upcoming_meetings(current_user)

@router.get("/recent", response_model=List[RecentMeetingResponse])
def get_recent_meetings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns list of recent meetings the user joined and left, with live rejoin eligibility status.
    """
    service = MeetingService(db)
    return service.get_recent_meetings(current_user)

@router.post("/instant", response_model=SessionJoinResponse, status_code=status.HTTP_201_CREATED)
def create_instant_meeting(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates an instant meeting and live session, returning host join details.
    """
    service = MeetingService(db)
    return service.create_instant_meeting(current_user)

@router.post("/schedule", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def schedule_meeting(
    payload: MeetingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Schedules a meeting for a future date and time.
    """
    service = MeetingService(db)
    return service.schedule_meeting(current_user, payload)

@router.get("/{code}", response_model=MeetingResponse)
def get_meeting_by_code(
    code: str,
    db: Session = Depends(get_db)
):
    """
    Validates meeting existence by 10-digit meeting code.
    """
    service = MeetingService(db)
    return service.get_meeting_by_code(code)

@router.post("/{code}/join", response_model=SessionJoinResponse)
def join_meeting(
    code: str,
    payload: Optional[SessionJoinRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Joins a meeting session using 10-digit meeting code and optional display name.
    """
    service = SessionService(db)
    display_name = payload.display_name if payload else None
    return service.join_meeting(code, current_user, display_name)
