from __future__ import annotations
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from typing import Annotated, Optional
from fastapi import HTTPException, Depends, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import bcrypt
from auth.jwt_config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_HOURS

security = HTTPBearer()

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except (JWTError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid or expired"
        )

async def get_current_user_optional(authorization: Annotated[Optional[str], Header()] = None):
    if not authorization:
        return None

    try:
        token = authorization.split(" ")[1] if " " in authorization else authorization
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None

def admin_required(user=Depends(get_current_user)):
    if user.get("type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user

def leader_or_admin(user=Depends(get_current_user)):
    if user.get("type") not in ["admin", "leader"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Leader or Admin access required"
        )
    return user

def employee_or_admin(user=Depends(get_current_user)):
    if user.get("type") not in ["admin", "leader", "employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: Leader, employee or Admin only"
        )
    return user


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))