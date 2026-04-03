import json
import shutil
import os
import io
import pandas as pd
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from fastapi.responses import StreamingResponse
from database import get_db
from repositories.product_repository import ProductRepository
from models.product import ProductCreate, ProductResponse

from services.file_service import FileService

router = APIRouter(prefix="/products", tags=["Products"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "frontend", "public", "assets", "images")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/", response_model=List[ProductResponse])
def list_products(category_id: int = None, archived: int = 0, db = Depends(get_db)):
    return ProductRepository(db).get_all(category_id, archived)

# routers/product_router.py

@router.get("/export")
def export_products(db = Depends(get_db)):
    products = ProductRepository(db).get_all_for_export(archived=0)

    if not products:
        raise HTTPException(status_code=404, detail="No hay productos para exportar")

    df = pd.DataFrame(products)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Productos')

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={'Content-Disposition': 'attachment; filename="plantilla_productos.xlsx"'}
    )


@router.get("/get/{product_id}", response_model=ProductResponse)
def get_one_product(product_id: int, db = Depends(get_db)):
    product = ProductRepository(db).get_one(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@router.post("/")
async def create_product(
        name: str = Form(...),
        description: str = Form(...),
        price: float = Form(...),
        category_id: int = Form(...),
        stock: int = Form(0),
        vegan: int = Form(0),
        vegetarian: int = Form(0),
        lactose_free: int = Form(0),
        allergen_ids: str = Form("[]"),
        image_file: UploadFile = File(None),
        db = Depends(get_db)
):
    filename = await FileService.save_image(image_file)

    product_data = ProductCreate(
        name=name, description=description, price=price, category_id=category_id,
        stock=stock, image=filename,
        vegan=vegan, vegetarian=vegetarian, lactose_free=lactose_free
    )

    repo = ProductRepository(db)
    pid = repo.create(product_data, json.loads(allergen_ids))
    return {"id": pid, "message": "Product created"}

@router.put("/{product_id}")
async def update_product(
        product_id: int,
        name: str = Form(...),
        description: str = Form(None),
        price: float = Form(...),
        category_id: int = Form(...),
        stock: str = Form("0"),
        vegan: int = Form(0),
        vegetarian: int = Form(0),
        lactose_free: int = Form(0),
        allergen_ids: str = Form("[]"),
        image_file: UploadFile = File(None),
        db = Depends(get_db)
):
    filename = None
    if image_file and image_file.filename:
        filename = await FileService.save_image(image_file)
    try:
        val_stock = int(stock)
    except (ValueError, TypeError):
        val_stock = 0

    # 3. Preparar datos para el repositorio
    product_data = ProductCreate(
        name=name,
        description=description,
        price=price,
        category_id=category_id,
        stock=val_stock,
        image=filename, # Será None si no hay imagen nueva
        vegan=vegan,
        vegetarian=vegetarian,
        lactose_free=lactose_free
    )

    repo = ProductRepository(db)
    old_image = repo.update(product_id, product_data, json.loads(allergen_ids))

    if filename and old_image and old_image != "placeholder.jpg":
        delete_physical_file(old_image)

    updated_product = repo.get_one(product_id)

    if not updated_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return updated_product

@router.put("/archive/{product_id}")
def toggle_archive(product_id: int, db = Depends(get_db)):
    status = ProductRepository(db).toggle_archive(product_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"new_archived_status": status}

@router.delete("/{product_id}")
def delete_product(product_id: int, db = Depends(get_db)):
    repo = ProductRepository(db)
    product = repo.get_one(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    image_to_delete = product.get('image')

    repo.delete(product_id)

    if image_to_delete:
        if repo.count_image_usage(image_to_delete) == 0:
            delete_physical_file(image_to_delete)

    return {"message": "Deleted"}


def delete_physical_file(filename: str):
    if filename and filename != "placeholder.jpg":
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"DEBUG: Error al borrar {filename}: {e}")


@router.post("/import")
async def import_products(file: UploadFile = File(...), db=Depends(get_db)):
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="Formato no soportado")

    try:
        contents = await file.read()
        # Cargar datos
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))

        # Limpiar nombres de columnas (quitar espacios y poner minúsculas)
        df.columns = [c.lower().strip() for c in df.columns]

        # Validación mínima según tu plantilla
        if 'name' not in df.columns or 'category_name' not in df.columns:
            raise HTTPException(status_code=400, detail="Faltan columnas: 'name' o 'category_name'")

        repo = ProductRepository(db)
        records = df.to_dict(orient='records')

        count = repo.import_data(records)
        return {"message": f"Éxito: {count} productos importados."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando archivo: {str(e)}")




@router.post("/{product_id}/duplicate")
def duplicate_product(product_id: int, db = Depends(get_db)):
    repo = ProductRepository(db)
    new_product_id = repo.duplicate(product_id)
    if not new_product_id:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return repo.get_one(new_product_id)