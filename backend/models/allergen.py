from pydantic import BaseModel
from typing import Optional

class AllergenCreate(BaseModel):
    name: str
    color: Optional[str] = "#0d6efd"

class AllergenResponse(BaseModel):
    id: int
    name: str
    color: Optional[str] = "#0d6efd"

    class Config:
        from_attributes = True