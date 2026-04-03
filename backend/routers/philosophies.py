from fastapi import APIRouter, HTTPException, Depends
from database import get_db
from pydantic import BaseModel

from models.philosophy import PhilosophyUpdate
from repositories.philosophy_repository import PhilosophyRepository

router = APIRouter(prefix="/philosophies", tags=["Philosophies"])

@router.get("/")
def get_philosophies(db=Depends(get_db)):
    return PhilosophyRepository(db).get_all()

@router.put("/{philosophy_id}")
def update_philosophy(
        philosophy_id: int,
        philosophy: PhilosophyUpdate,
        db=Depends(get_db)
):
    repo = PhilosophyRepository(db)
    if not repo.get_by_id(philosophy_id):
        raise HTTPException(status_code=404, detail="Filosofía no encontrada")

    updated = repo.update(philosophy_id, philosophy.model_dump())
    return updated