from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from typing import List
from models.allergen import (AllergenCreate, AllergenResponse)
from repositories.allergen_repository import AllergenRepository

router = APIRouter(prefix="/allergens", tags=["Allergens"])

@router.get("/", response_model=List[AllergenResponse])
def list_allergens(db = Depends(get_db)):
    cur = db.cursor(dictionary=True)
    try:
        cur.execute("SELECT * FROM allergens ORDER BY name ASC")
        allergens = cur.fetchall()
        return allergens
    finally:
        cur.close()


@router.post("/", response_model=AllergenResponse)
def create_allergen(data: AllergenCreate, db = Depends(get_db)):
    repo = AllergenRepository(db)

    if repo.get_by_name(data.name):
        raise HTTPException(status_code=400, detail="Ya existe ese alérgeno")

    new_id = repo.create(data.name, data.color)
    return {"id": new_id, "name": data.name, "color": data.color}

@router.put("/{id}", response_model=AllergenResponse)
def edit_allergen(id: int, data: AllergenCreate, db = Depends(get_db)):
    repo = AllergenRepository(db)

    if repo.get_by_name(data.name, exclude_id=id):
        raise HTTPException(status_code=400, detail="Ese nombre ya está en uso")

    repo.update(id, data.name, data.color)
    updated_allergen = repo.get_by_id(id)

    if not updated_allergen:
        raise HTTPException(status_code=404, detail="No encontrado")

    return updated_allergen

@router.delete("/{id}")
def delete_allergen(id: int, db = Depends(get_db)):
    repo = AllergenRepository(db)

    if repo.has_products(id):
        raise HTTPException(status_code=400, detail="No puedes borrar: tiene productos asociados")

    repo.delete(id)
    return {"ok": True, "message": "Alérgeno eliminada correctamente"}