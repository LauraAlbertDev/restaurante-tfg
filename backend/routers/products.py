import json
import os
import io
import mysql.connector
import pandas as pd
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile, Body, status, Header
from fastapi.responses import StreamingResponse
from database import get_db
from repositories.product_repository import ProductRepository
from models.product import ProductCreate, ProductResponse, ProductForm, StockUpdate
from auth.security import get_current_user
from services.file_service import FileService

router = APIRouter(prefix="/products", tags=["Products"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = "/app/assets/images"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/", response_model=List[ProductResponse])
def list_products(category_id: int = None, archived: int = 0, db = Depends(get_db)):
    return ProductRepository(db).get_all(category_id, archived)

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
        data: ProductForm = Depends(ProductForm),
        current_user=Depends(get_current_user),
        db=Depends(get_db)
):
    try:
        filename = "placeholder.jpg"
        if data.image_file and data.image_file.filename:
            saved_name = await FileService.save_image(data.image_file, old_image=None)
            filename = f"assets/images/{saved_name}"

        product_create = data.to_product_create(filename)

        repo = ProductRepository(db)
        pid = repo.create(product_create, product_create.allergen_ids, creator_id=current_user["id"])

        return repo.get_one(pid)

    except mysql.connector.errors.IntegrityError as err:
        if err.errno == 1062:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un producto con el nombre '{data.name}'"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error de integridad en la base de datos"
        )

@router.put("/{product_id}")
async def update_product(
        product_id: int,
        data: ProductForm = Depends(ProductForm),
        current_user=Depends(get_current_user),
        db=Depends(get_db)
):
    repo = ProductRepository(db)

    old_product = repo.get_one(product_id)
    if not old_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    try:
        old_image_name = old_product.get('image')
        new_filename = old_image_name

        if data.image_file and data.image_file.filename:
            saved_name = await FileService.save_image(data.image_file, old_image=old_image_name)
            new_filename = f"assets/images/{saved_name}"
        else:
            if old_image_name:
                new_filename = old_image_name

        product_data = data.to_product_create(new_filename)

        repo.update(
            product_id,
            product_data,
            json.loads(data.allergen_ids) if data.allergen_ids else [],
            editor_id=current_user["id"]
        )

        if data.image_file and data.image_file.filename and old_image_name and old_image_name != "placeholder.jpg":
            if repo.count_image_usage(old_image_name) == 0:
                filename_clean = old_image_name.replace("assets/images/", "")
                try:
                    FileService.delete_image(filename_clean)
                except:
                    pass

        return repo.get_one(product_id)

    except mysql.connector.errors.IntegrityError as err:
        if err.errno == 1062:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede actualizar. Ya existe otro producto llamado '{data.name}'"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error de integridad al actualizar el producto"
        )


@router.put("/archive/{product_id}")
def toggle_archive(product_id: int, db = Depends(get_db)):
    status_archived = ProductRepository(db).toggle_archive(product_id)
    if status_archived is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"new_archived_status": status_archived}


@router.delete("/{product_id}")
def delete_product(product_id: int, db = Depends(get_db)):
    repo = ProductRepository(db)
    product = repo.get_one(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    image_to_delete = product.get('image')

    repo.delete(product_id)

    if image_to_delete and image_to_delete != "placeholder.jpg":
        if repo.count_image_usage(image_to_delete) == 0:
            filename_clean = image_to_delete.replace("assets/images/", "")
            try:
                FileService.delete_image(filename_clean)
            except:
                pass

    return {"message": "Deleted"}


@router.post("/import")
async def import_products(
        file: UploadFile = File(...),
        # 1. Recibimos como str para evitar el problema de conversión booleana de FastAPI
        update_duplicates: str = Form("false"),
        current_user=Depends(get_current_user),
        db=Depends(get_db)
):
    if not file.filename.lower().endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="Formato no soportado.")

    # 2. Conversión explícita a booleano
    should_update = update_duplicates.lower() == "true"

    try:
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')

        df.columns = [c.lower().strip() for c in df.columns]
        # Limpieza de valores nulos de Pandas
        records = df.where(pd.notnull(df), None).to_dict(orient='records')

        repo = ProductRepository(db)

        # 3. Quitamos el db.start_transaction() manual.
        # Dejamos que el repositorio gestione sus commits/rollbacks
        # para evitar conflictos de transacciones.

        for record in records:
            # Procesar alérgenos
            if record.get('allergens_names'):
                raw_val = str(record['allergens_names'])
                clean_str = raw_val.replace('[', '').replace(']', '').replace("'", "").replace('"', "")
                names = [n.strip() for n in clean_str.split(',') if n.strip()]
                record['allergen_ids'] = repo.get_allergen_ids_by_names(names)
            else:
                record['allergen_ids'] = None

        # 4. Llamamos a la importación
        count = repo.import_data(records, creator_id=current_user['id'], update=should_update)

        return {"message": f"Éxito: {count} productos procesados."}

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error en el servidor: {str(e)}")

    
@router.post("/{product_id}/duplicate")
def duplicate_product(product_id: int, db = Depends(get_db)):
    repo = ProductRepository(db)
    new_product_id = repo.duplicate(product_id)
    if not new_product_id:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return repo.get_one(new_product_id)


@router.patch("/{product_id}/stock", response_model=ProductResponse)
async def update_product_stock(
    product_id: int,
    data: StockUpdate = Body(...),
    db = Depends(get_db)
):
    repo = ProductRepository(db)

    product = repo.get_one(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )

    new_stock_value = product['stock'] + data.amount

    if data.amount < 0 and new_stock_value < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock insuficiente. Disponible: {product['stock']}, solicitado: {abs(data.amount)}"
        )

    try:
        updated_product = repo.update_stock(product_id, data.amount)
        if not updated_product:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al recuperar el producto actualizado"
            )

        return updated_product

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la base de datos: {str(e)}"
        )