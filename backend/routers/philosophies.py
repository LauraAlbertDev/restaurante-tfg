from fastapi import APIRouter, HTTPException
from database import get_connection
from pydantic import BaseModel

router = APIRouter(prefix="/philosophies", tags=["Philosophies"])


# 🔹 Modelo para update
class PhilosophyUpdate(BaseModel):
    icon: str
    title: str
    message: str


############# GET ALL #############

@router.get("/")
def get_philosophies():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM philosophies ORDER BY id ASC")
    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return data


############# UPDATE #############

@router.put("/{philosophy_id}")
def update_philosophy(philosophy_id: int, philosophy: PhilosophyUpdate):

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
                       UPDATE philosophies
                       SET icon=%s,
                           title=%s,
                           message=%s
                       WHERE id=%s
                       """, (
                           philosophy.icon,
                           philosophy.title,
                           philosophy.message,
                           philosophy_id
                       ))

        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Philosophy not found")

        # devolver registro actualizado
        cursor.execute("SELECT * FROM philosophies WHERE id=%s", (philosophy_id,))
        updated = cursor.fetchone()

        cursor.close()
        conn.close()

        return updated

    except Exception as e:
        print("🔥 MYSQL ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))