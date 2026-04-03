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
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

    def get_all(self, archived: int = 0):
        sql = "SELECT * FROM comment WHERE archived = %s ORDER BY id DESC"
        return self._execute(sql, (archived,), fetch="all")

    def get_by_id(self, comment_id: int):
        return self._execute("SELECT * FROM comment WHERE id = %s", (comment_id,), fetch="one")

    def create(self, comment: UserComment):
        data = comment.model_dump()
        sql = """
              INSERT INTO comment (name, tel, email, message, note, archived)
              VALUES (%(name)s, %(tel)s, %(email)s, %(message)s, %(note)s, 0) \
              """
        return self._execute(sql, data)

    def update(self, comment_id: int, comment: UserComment):
        data = comment.model_dump()
        data['id'] = comment_id
        sql = """
              UPDATE comment
              SET name = %(name)s, tel = %(tel)s, email = %(email)s,
                  message = %(message)s, note = %(note)s
              WHERE id = %(id)s \
              """
        self._execute(sql, data)
        return True

    def toggle_archive(self, comment_id: int):
        comment = self.get_by_id(comment_id)
        if not comment:
            return None

        new_status = 1 if comment["archived"] == 0 else 0

        sql = "UPDATE comment SET archived = %s WHERE id = %s"
        self._execute(sql, (new_status, comment_id))
        return new_status