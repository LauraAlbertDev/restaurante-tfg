from models.comment import UserComment

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

    def get_by_id(self, comment_id: int):
        return self._execute("SELECT * FROM comment WHERE id = %s", (comment_id,), fetch="one")

    def create(self, comment: UserComment):
        sql = """INSERT INTO comment (name, tel, email, message, note)
                 VALUES (%(name)s, %(tel)s, %(email)s, %(message)s, %(note)s)"""

        return self._execute(sql, comment.dict())

    def update(self, comment_id: int, comment: UserComment):
        data = comment.dict()
        data['id'] = comment_id
        query = """UPDATE comment 
                   SET name = %(name)s, tel = %(tel)s, email = %(email)s, message = %(message)s, note = %(note)s 
                   WHERE id = %(id)s"""
        return self._execute(query, data)

    def toggle_archive(self, comment_id: int):
        res = self.get_by_id(comment_id)
        if not res:
            return None

        new_status = 0 if res["archived"] == 1 else 1
        self._execute("UPDATE comment SET archived = %s WHERE id = %s", (new_status, comment_id))
        return new_status