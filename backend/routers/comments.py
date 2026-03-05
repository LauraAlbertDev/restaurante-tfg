from fastapi import APIRouter, HTTPException, Query
from database import get_connection
from repositories.comment_repository import CommentRepository
from models.comments import  UserComment # Importamos tus modelos de Pydantic

router = APIRouter(prefix="/comments", tags=["Comments"])

@router.post("/add_comment")
def add_comment(comment: UserComment):
    with get_connection() as conn:
        repo = CommentRepository(conn)
        repo.create(comment)
        return {"status": "success", "message": "Comment created"}

@router.get("/")
def get_comments(archived: int = Query(0)):
    with get_connection() as conn:
        repo = CommentRepository(conn)
        return repo.get_all(archived)

def check_exists(item):
    if item is None:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    return item

@router.get("/{comment_id}")
def get_comment(comment_id: int):
    with get_connection() as conn:
        repo = CommentRepository(conn)
        comment = repo.get_by_id(comment_id)
        return check_exists(comment)

@router.put("/archive/{comment_id}")
def toggle_archive(comment_id: int):
    with get_connection() as conn:
        repo = CommentRepository(conn)
        new_status = repo.toggle_archive(comment_id)
        check_exists(new_status) # Si no existe, lanza el 404
        return repo.get_all(archived=0)