from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from models.user import UserRegister, UserLogin, LoginResponse
from auth.security import create_token, verify_password, hash_password
from repositories.auth_repository import AuthRepository

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register(user: UserRegister, db=Depends(get_db)):
    repo = AuthRepository(db)

    if repo.get_user_by_email(user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ya registrado"
        )

    hashed = hash_password(user.password)
    repo.register_user(user.name, user.email, hashed)

    return {"message": "Empleado registrado correctamente"}

@router.post("/login", response_model=LoginResponse)
def login(data: UserLogin, db=Depends(get_db)):
    repo = AuthRepository(db)
    user = repo.get_user_by_email(data.email)

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Email o contraseña incorrectos"
    )

    if not user:
        raise credentials_exception

    if not verify_password(data.password, user["password"]):
        raise credentials_exception

    token = create_token({
        "id": user["id"],
        "name": user["name"],
        "type": user["type"]
    })

    return {
        "token": token,
        "name": user["name"],
        "type": user["type"]
    }