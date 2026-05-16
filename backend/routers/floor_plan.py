from fastapi import APIRouter, Depends, HTTPException, Query
import json
from database import get_db

router = APIRouter(
    prefix="/floor-plans",
    tags=["floor-plans"]
)


@router.get("/floor-plan")
def get_floor_plan(date: str = Query(None), db=Depends(get_db)):
    cursor = db.cursor(dictionary=True, buffered=True)
    try:
        if date:
            cursor.execute("SELECT * FROM floor_plans WHERE fecha = %s LIMIT 1", (date,))
            plan = cursor.fetchone()
            if plan:
                return format_response(plan)

        cursor.execute("SELECT * FROM floor_plans WHERE fecha IS NULL LIMIT 1")
        plan = cursor.fetchone()

        if not plan:
            return {"id": 0, "name": "Default", "layout_data": {"objects": []}, "fecha": None}

        return format_response(plan)
    finally:
        cursor.close()

def format_response(plan):
    if isinstance(plan['layout_data'], str):
        plan['layout_data'] = json.loads(plan['layout_data'])
    return plan


@router.post("/floor-plan/daily")
@router.post("/")
def save_floor_plan(payload: dict, db=Depends(get_db)):
    cursor = db.cursor(dictionary=True, buffered=True)
    try:
        name = payload.get('name', 'Mapa Principal')
        layout_data = payload.get('layout_data')
        fecha = payload.get('fecha')

        if not layout_data:
            raise HTTPException(status_code=400, detail="No layout data")

        layout_str = json.dumps(layout_data)

        if fecha:
            cursor.execute("SELECT id FROM floor_plans WHERE fecha = %s", (fecha,))
        else:
            cursor.execute("SELECT id FROM floor_plans WHERE fecha IS NULL")

        registro = cursor.fetchone()

        if registro:
            print(f"DEBUG: Registro encontrado (ID: {registro['id']}). Ejecutando UPDATE...")
            sql = "UPDATE floor_plans SET name = %s, layout_data = %s WHERE id = %s"
            cursor.execute(sql, (name, layout_str, registro['id']))
        else:
            print(f"DEBUG: Registro NO encontrado. Ejecutando INSERT...")
            sql = "INSERT INTO floor_plans (name, layout_data, fecha) VALUES (%s, %s, %s)"
            cursor.execute(sql, (name, layout_str, fecha))
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        print(f"ERROR CRÍTICO: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()