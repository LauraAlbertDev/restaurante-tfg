from models.comments import UserComment

class CommentRepository:
    def __init__(self, db_conn):
        self.db = db_conn

    def _execute(self, query, params=None, fetch=None):
        cursor = self.db.cursor(dictionary=True)
        try:
            cursor.execute(query, params or ())
            if fetch == "all": return cursor.fetchall()
            if fetch == "one": return cursor.fetchone()
            self.db.commit()
            return cursor.lastrowid
        finally:
            cursor.close()

    def get_all(self, archived: int = 0):
        return self._execute("SELECT * FROM comment WHERE archived=%s ORDER BY id DESC", (archived,), fetch="all")

    def create(self, comment: UserComment):
        sql = """INSERT INTO comment (name, tel, email, message, note)
                 VALUES (%(name)s, %(tel)s, %(email)s, %(message)s, %(note)s)"""
        return self._execute(sql, comment.model_dump()) 

    def toggle_archive(self, comment_id: int):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT archived FROM comment WHERE id = %s", (comment_id,))
        res = cursor.fetchone()
        if not res: return None

        new_status = 0 if res["archived"] == 1 else 1
        self._execute("UPDATE comment SET archived = %s WHERE id = %s", (new_status, comment_id))
        return new_status