from database import get_connection
from models.philosophies import Philosophy
from fastapi import APIRouter

router = APIRouter(prefix="/philosophies", tags=["Philosophies"])


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


