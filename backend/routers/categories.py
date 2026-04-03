from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database import get_db
from repositories.category_repository import CategoryRepository
from models.category import CategoryResponse, CategoryCreate

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("/", response_model=List[CategoryResponse])
def list_categories(db = Depends(get_db)):
    repo = CategoryRepository(db)
    return repo.get_all()

@router.post("/", response_model=CategoryResponse)
def crear_categoria(data: CategoryCreate, db = Depends(get_db)):
    repo = CategoryRepository(db)

    if repo.get_by_name(data.name):
        raise HTTPException(status_code=400, detail="Ya existe esa categoría")

    new_id = repo.create(data.name)
    return {"id": new_id, "name": data.name}

@router.put("/{id}", response_model=CategoryResponse)
def editar_categoria(id: int, data: CategoryCreate, db = Depends(get_db)):
    repo = CategoryRepository(db)

    if repo.get_by_name(data.name, exclude_id=id):
        raise HTTPException(status_code=400, detail="Ese nombre ya está en uso")

    repo.update(id, data.name)
    return {"id": id, "name": data.name}

@router.delete("/{id}")
def eliminar_categoria(id: int, db = Depends(get_db)):
    repo = CategoryRepository(db)

    if repo.has_products(id):
        raise HTTPException(status_code=400, detail="No puedes borrar: tiene productos asociados")

    repo.delete(id)
    return {"ok": True, "message": "Categoría eliminada correctamente"}