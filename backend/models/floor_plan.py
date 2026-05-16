from pydantic import BaseModel
from typing import Optional
from sqlalchemy import Column, Date


class FloorPlanBase(BaseModel):
    __tablename__ = "floor_plans"
    name: Optional[str] = "Main Hall"
    layout_data: dict  
    date = Column(Date, nullable=True)

class FloorPlanCreate(FloorPlanBase):
    pass

class FloorPlanResponse(FloorPlanBase):
    id: int

    class Config:
        from_attributes = True