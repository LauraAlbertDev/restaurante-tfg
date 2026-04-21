from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserDB(BaseModel):
    id: int
    name: str
    email: EmailStr
    type: str
    active: bool
    created_in: datetime

class LoginResponse(BaseModel):
    token: str
    name: str
    type: str

class UserCreateByAdmin(BaseModel):
    name: str
    email: EmailStr
    password: str
    type: Literal["employee", "leader", "admin"]

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    active: Optional[bool] = None
    type: Optional[str] = None
