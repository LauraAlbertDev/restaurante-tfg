from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from auth.security import admin_required, hash_password, get_current_user
from models.user import UserCreateByAdmin
from repositories.user_repository import UserRepository

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/")
def get_users(db=Depends(get_db), admin=Depends(admin_required)):
    return UserRepository(db).get_all()

@router.get("/me")
def perfil(user: dict = Depends(get_current_user), db = Depends(get_db)):
    repo = UserRepository(db)
    data = repo.get_by_id(user["id"])
    if not data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return data

@router.post("/create")
def create_user(data: UserCreateByAdmin, db=Depends(get_db), admin=Depends(admin_required)):
    repo = UserRepository(db)
    if repo.email_exists(data.email):
        raise HTTPException(status_code=400, detail="EMAIL_EXISTS")

    hashed = hash_password(data.password)
    repo.create(data.name, data.email, hashed, data.type)
    return {"message": "User created"}

@router.put("/update/{user_id}")
def update_user_admin(user_id: int, data: dict, db=Depends(get_db), admin=Depends(admin_required)):
    repo = UserRepository(db)

    if repo.email_exists(data.get("email"), exclude_id=user_id):
        raise HTTPException(status_code=400, detail="EMAIL_ALREADY_IN_USE")

    password = data.get("password")
    hashed = hash_password(password) if password and password.strip() else None

    repo.update(
        user_id,
        data.get("name"),
        data.get("email"),
        data.get("type"),
        hashed
    )
    return {"ok": True}

@router.put("/toggle/{id}")
def toggle_user(id: int, db=Depends(get_db), admin=Depends(admin_required)):
    UserRepository(db).toggle_status(id)
    return {"message": "Updated status"}

@router.put("/me")
def update_perfil(data: dict, db=Depends(get_db), current_user=Depends(get_current_user)):
    repo = UserRepository(db)
    user_id = current_user["id"]

    if repo.email_exists(data.get("email"), exclude_id=user_id):
        raise HTTPException(status_code=400, detail="Email already in use")

    password = data.get("password")
    hashed = hash_password(password) if password and password.strip() else None

    user_actual = repo.get_by_id(user_id)
    repo.update(user_id, data.get("name"), data.get("email"), user_actual["type"], hashed)

    return {"ok": True}