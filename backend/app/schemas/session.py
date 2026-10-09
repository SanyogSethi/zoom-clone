from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class SessionJoinRequest(BaseModel):
    display_name: Optional[str] = None
    participant_id: Optional[int] = None

class SessionJoinResponse(BaseModel):
    session_id: int
    participant_id: int
    meeting_code: str
    title: str
    role: str
    display_name: str

class ParticipantResponse(BaseModel):
    id: int
    session_id: int
    user_id: Optional[int] = None
    display_name: str
    role: str
    status: str
    is_muted: bool
    joined_at: str
    left_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class LeaveSessionRequest(BaseModel):
    participant_id: int
