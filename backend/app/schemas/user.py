from pydantic import BaseModel, ConfigDict
from typing import Optional

class UserResponse(BaseModel):
    id: int
    email: str
    display_name: str
    avatar_url: Optional[str] = None
    timezone: str
    created_at: str

    model_config = ConfigDict(from_attributes=True)
