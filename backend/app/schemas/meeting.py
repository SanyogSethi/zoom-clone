from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class MeetingCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    scheduled_start: str
    duration_minutes: int = Field(..., gt=0)

class MeetingResponse(BaseModel):
    id: int
    host_id: int
    host_display_name: str
    meeting_code: str
    title: str
    description: Optional[str] = None
    type: str
    scheduled_start: Optional[str] = None
    duration_minutes: Optional[int] = None
    status: str
    created_at: str

    model_config = ConfigDict(from_attributes=True)

class UpcomingMeetingResponse(BaseModel):
    id: int
    meeting_code: str
    title: str
    description: Optional[str] = None
    scheduled_start: str
    duration_minutes: int
    status: str
    host_display_name: str

    model_config = ConfigDict(from_attributes=True)

class RecentMeetingResponse(BaseModel):
    session_id: int
    meeting_id: int
    meeting_code: str
    title: str
    host_display_name: str
    started_at: str
    ended_at: Optional[str] = None
    left_at: Optional[str] = None
    duration_minutes: Optional[int] = None
    can_rejoin: bool
    display_name_used: str

    model_config = ConfigDict(from_attributes=True)
