class PhilosophyRepository:
    def __init__(self, db_conn):
        self.db = db_conn

    def _get_cursor(self):
        return self.db.cursor(dictionary=True)

    def get_all(self):
        with self._get_cursor() as cursor:
            cursor.execute("SELECT * FROM philosophies ORDER BY id ASC")
            return cursor.fetchall()

    def get_by_id(self, philosophy_id: int):
        with self._get_cursor() as cursor:
            cursor.execute("SELECT * FROM philosophies WHERE id=%s", (philosophy_id,))
            return cursor.fetchone()

    def update(self, philosophy_id: int, data: dict):
        query = """
                UPDATE philosophies
                SET icon = %(icon)s, title = %(title)s, message = %(message)s
                WHERE id = %(id)s
                """
        params = {
            "icon": data.get("icon"),
            "title": data.get("title"),
            "message": data.get("message"),
            "id": philosophy_id
        }

        try:
            with self._get_cursor() as cursor:
                cursor.execute(query, params)
                if cursor.rowcount == 0:
                    return None
            self.db.commit()
            return self.get_by_id(philosophy_id)
        except Exception as e:
            self.db.rollback()
            raise e