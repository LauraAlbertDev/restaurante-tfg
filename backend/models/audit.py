from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AuditBase(BaseModel):
    created_by: Optional[int] = None
    creator_name: Optional[str] = None
    updated_at: Optional[datetime] = None
    updated_by: Optional[int] = None
    editor_name: Optional[str] = None