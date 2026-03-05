from pydantic import BaseModel

class UserComment(BaseModel):
    name: str
    tel: str
    email: str
    message: str
    note: str | None = None


