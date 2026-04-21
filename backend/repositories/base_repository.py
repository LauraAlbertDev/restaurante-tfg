from contextlib import contextmanager
import logging

class BaseRepository:
    def __init__(self, db_conn):
        self.db = db_conn

    @contextmanager
    def _get_cursor(self):
        cursor = self.db.cursor(dictionary=True)
        try:
            yield cursor
        except Exception as e:
            logging.error(f"Error en operación de base de datos: {e}")
            raise e
        finally:
            cursor.close()

    def commit(self):
        self.db.commit()


