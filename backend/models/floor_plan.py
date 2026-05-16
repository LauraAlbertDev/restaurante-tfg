from sqlalchemy import Column, Integer, String, JSON
from pydantic import BaseModel
from typing import Optional

class FloorPlan(Base):
    __tablename__ = "floor_plans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    layout_data = Column(JSON)

class FloorPlanBase(BaseModel):
    name: Optional[str] = "Main Hall"
    layout_data: dict

class FloorPlanCreate(FloorPlanBase):
    pass

class FloorPlanResponse(FloorPlanBase):
    id: int
    class Config:
        from_attributes = True