from pydantic import BaseModel, Field, EmailStr

class UserComment(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    tel: str = Field(..., min_length=9)
    email: EmailStr
    message: str = Field(..., min_length=1)
    note: str | None = None



