from pydantic import BaseModel
from datetime import date
from typing import Optional

class ReservationSchema(BaseModel):
    name: str
    phone: str
    date: date
    hour: str
    n_people: int
    notes: Optional[str] = None

class ReservationResponse(ReservationSchema):
    id: int

    class Config:
        from_attributes = True