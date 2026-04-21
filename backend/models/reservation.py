from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from enum import Enum
from .audit import AuditBase

class ReservationStatus(str, Enum):
    UNCONFIRMED = "unconfirmed"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"

class ReservationSchema(BaseModel):
    name: str
    phone: str
    date: date
    hour: str
    rices: Optional[str] = None
    n_people: int
    notes: Optional[str] = None
    status: ReservationStatus = ReservationStatus.UNCONFIRMED
    created_by: Optional[int] = None

class ReservationResponse(ReservationSchema, AuditBase):
    id: int
    status: ReservationStatus
    created_by: Optional[int] = None
    updated_at: Optional[datetime] = None
    creator_name: Optional[str] = None
    editor_name: Optional[str] = None

    class Config:
        from_attributes = True