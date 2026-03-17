from pydantic import BaseModel

class Philosophy(BaseModel):
    icon: Optional[str] = None
    title: str
    message: str

class PhilosophyUpdate(BaseModel):
    icon: str
    title: str
    message: str