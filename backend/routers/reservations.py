from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from database import get_db
from models.reservation import ReservationResponse, ReservationSchema
from auth.security import get_current_user_optional

from repositories.reservation_repository import ReservationRepository
from repositories.settings_repository import SettingsRepository

router = APIRouter(prefix="/reservations", tags=["Reservations"])

# =============================================================================
# 1. RUTAS DE CONFIGURACIÓN Y ESTADO (Rutas fijas - Prioridad Alta)
# =============================================================================

@router.get("/closed-dates")
def get_closed_dates(db=Depends(get_db)):
    query = "SELECT day_date FROM special_days WHERE is_open = 0 AND day_date >= CURDATE()"
    with ReservationRepository(db)._get_cursor() as cursor:
        cursor.execute(query)
        return [row['day_date'].strftime('%Y-%m-%d') for row in cursor.fetchall()]

@router.get("/admin/settings")
def get_settings(db=Depends(get_db)):
    return SettingsRepository(db).get_admin_settings()

@router.get("/occupancy/{date_str}")
def get_occupancy(date_str: str, db=Depends(get_db)):
    res_repo = ReservationRepository(db)
    set_repo = SettingsRepository(db)
    try:
        fecha_dt = datetime.strptime(date_str, '%Y-%m-%d').date()
        config = set_repo.get_capacity_for_day(fecha_dt.weekday())
        settings = set_repo.get_admin_settings()
        turnos = settings.get('shifts', [])

        num_turnos = len(turnos)
        limite = (config['max_capacity'] // num_turnos) if num_turnos > 0 else 0

        return [{
            "hour": t['start_time'],
            "total": res_repo.get_total_people_by_shift(date_str, t['start_time']),
            "max": limite,
            "is_open": config['is_open']
        } for t in turnos]
    except Exception:
        raise HTTPException(status_code=400, detail="Fecha o formato inválido")

# =============================================================================
# 2. RUTAS DE ACCIÓN Y ESCRITURA (POST / PUT)
# =============================================================================

@router.post("/")
def create_reservation(
        reservation: ReservationSchema,
        db=Depends(get_db),
        auth_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Crea una reserva validando capacidad si no es personal del restaurante."""
    res_repo = ReservationRepository(db)
    set_repo = SettingsRepository(db)

    try:
        is_staff = auth_user and auth_user.get("type") in ["admin", "employee"]

        if not is_staff:
            dia_semana = reservation.date.weekday()
            config_dia = set_repo.get_capacity_for_day(dia_semana)

            if not config_dia.get('is_open'):
                raise HTTPException(status_code=400, detail="Restaurante cerrado para esta fecha.")

            settings = set_repo.get_admin_settings()
            turnos_activos = settings.get('shifts', [])
            num_turnos = len(turnos_activos)

            if num_turnos == 0:
                raise HTTPException(status_code=400, detail="No hay turnos configurados.")

            limite_por_turno = config_dia['max_capacity'] // num_turnos
            fecha_str = reservation.date.strftime('%Y-%m-%d')
            ocupacion_actual = res_repo.get_total_people_by_shift(fecha_str, reservation.hour)

            if (ocupacion_actual + reservation.n_people) > limite_por_turno:
                plazas = max(0, limite_por_turno - ocupacion_actual)
                raise HTTPException(status_code=400, detail=f"Solo quedan {plazas} plazas.")

        new_id = res_repo.create(reservation.model_dump())
        return {"status": "success", "id": new_id, "message": "Reserva confirmada"}

    except HTTPException as e: raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al crear reserva")

@router.post("/admin/update-day")
def update_day(data: dict, db=Depends(get_db)):
    success = SettingsRepository(db).update_day_config(
        day_index=data.get('day'),
        max_capacity=data.get('limit'),
        is_open=data.get('is_open', True)
    )
    return {"status": "ok"} if success else HTTPException(500)

@router.post("/admin/special-day")
def add_special_day(data: dict, db=Depends(get_db)):
    repo = SettingsRepository(db)
    query = """
            INSERT INTO special_days (day_date, is_open, description)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE is_open = %s, description = %s
            """
    with repo._get_cursor() as cursor:
        cursor.execute(query, (
            data["special_date"], data["is_open"], data.get("description", ""),
            data["is_open"], data.get("description", "")
        ))
        db.commit()
    return {"status": "success"}

@router.delete("/admin/special-day/{date_str}")
def delete_special_day(date_str: str, db=Depends(get_db)):
    repo = SettingsRepository(db)
    query = "DELETE FROM special_days WHERE day_date = %s"
    with repo._get_cursor() as cursor:
        cursor.execute(query, (date_str,))
        db.commit()
        return {"status": "success"}

@router.post("/admin/shifts/add")
def add_shift(data: dict, db=Depends(get_db)):
    repo = SettingsRepository(db)
    time_val = f"{data['time']}:00"
    query = "INSERT INTO shift_configs (start_time, is_active) VALUES (%s, 1)"
    try:
        with repo._get_cursor() as cursor:
            cursor.execute(query, (time_val,))
            db.commit()
        return {"status": "ok"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/admin/shifts/{shift_id}")
def delete_shift(shift_id: int, db=Depends(get_db)):
    repo = SettingsRepository(db)
    query = "DELETE FROM shift_configs WHERE id = %s"
    with repo._get_cursor() as cursor:
        cursor.execute(query, (shift_id,))
        db.commit()
    return {"status": "ok"}

# =============================================================================
# 3. RUTAS CRUD CON PARÁMETROS (IDs - Prioridad Baja)
# =============================================================================

@router.get("/", response_model=List[ReservationResponse])
def list_reservations(db=Depends(get_db)):
    """Lista todas las reservas."""
    return ReservationRepository(db).get_all()

@router.get("/{reservation_id}", response_model=ReservationResponse)
def get_reservation(reservation_id: int, db=Depends(get_db)):
    """Obtiene una reserva por su ID (Soluciona el error 405)."""
    reserva = ReservationRepository(db).get_by_id(reservation_id)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return reserva

@router.put("/update/{reservation_id}")
def update_reservation(reservation_id: int, data: dict, db=Depends(get_db)):
    repo = ReservationRepository(db)
    if repo.update(reservation_id, data):
        return {"status": "success", "message": "Actualizada"}
    raise HTTPException(500)

@router.delete("/{reservation_id}")
def delete_reservation(reservation_id: int, db=Depends(get_db)):
    repo = ReservationRepository(db)
    if repo.delete(reservation_id):
        return {"status": "success"}
    raise HTTPException(404, detail="No se encontró la reserva")

@router.delete("/admin/special-day/{date_str}")
def delete_special_day(date_str: str, db=Depends(get_db)):
    repo = SettingsRepository(db)
    query = "DELETE FROM special_days WHERE day_date = %s"
    try:
        with repo._get_cursor() as cursor:
            cursor.execute(query, (date_str,))
            db.commit()
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404)
        return {"status": "success"}
    except Exception:
        db.rollback()
        raise HTTPException(500)