from contextlib import contextmanager

class BaseRepository:
    def __init__(self, db_conn):
        self.db = db_conn

    @contextmanager
    def _get_cursor(self):
        cursor = self.db.cursor(dictionary=True)
        try:
            yield cursor
        finally:
            cursor.close()


