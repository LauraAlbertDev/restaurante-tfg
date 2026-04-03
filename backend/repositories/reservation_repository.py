from .base_repository import BaseRepository

class ReservationRepository(BaseRepository):
    def create(self, data: dict):
        if data.get('notes') is None:
            data['notes'] = ""

        query = """
                INSERT INTO reservations (name, phone, date, hour, n_people, notes)
                VALUES (%(name)s, %(phone)s, %(date)s, %(hour)s, %(n_people)s, %(notes)s)
                """
        with self._get_cursor() as cursor:
            cursor.execute(query, data)
            self.db.commit()
            return cursor.lastrowid

    def get_all(self):
        query = """
                SELECT id, name, phone, date,
                       SUBSTRING(CAST(hour AS CHAR), 1, 5) as hour,
                       n_people, notes
                FROM reservations
                """
        with self._get_cursor() as cursor:
            cursor.execute(query)
            return cursor.fetchall()

    def get_by_id(self, reservation_id: int):
        query = """
                SELECT id, name, phone, date,
                       SUBSTRING(CAST(hour AS CHAR), 1, 5) as hour,
                       n_people, notes
                FROM reservations WHERE id=%s
                """
        with self._get_cursor() as cursor:
            cursor.execute(query, (reservation_id,))
            return cursor.fetchone()

    def update(self, reservation_id: int, data: dict):
        data['id'] = reservation_id
        query = """
                UPDATE reservations
                SET name=%(name)s, phone=%(phone)s, n_people=%(n_people)s,
                    date=%(date)s, hour=%(hour)s, notes=%(notes)s
                WHERE id=%(id)s
                """
        with self._get_cursor() as cursor:
            cursor.execute(query, data)
            self.db.commit()
            return True

    def delete(self, reservation_id: int):
        query = "DELETE FROM reservations WHERE id = %s"
        with self._get_cursor() as cursor:
            cursor.execute(query, (reservation_id,))
            self.db.commit()
            return cursor.rowcount > 0

    def get_total_people_by_shift(self, date_str: str, hour_str: str):
        query = """
                SELECT SUM(n_people) as total
                FROM reservations
                WHERE date = %s AND LEFT(hour, 5) = %s
                """
        with self._get_cursor() as cursor:
            cursor.execute(query, (date_str, hour_str))
            res = cursor.fetchone()
            return int(res['total']) if res and res['total'] else 0