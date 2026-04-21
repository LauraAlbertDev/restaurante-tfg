from repositories.audit_mixin import AuditMixin
from repositories.base_repository import BaseRepository

class ReservationRepository(BaseRepository, AuditMixin):
    def create(self, data: dict, user_id: int = None):
        sql = """
              INSERT INTO reservations (name, phone, date, hour, n_people, rices, notes, created_by, status)
              VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
              """
        params = (
            data.get('name'), data.get('phone'), data.get('date'),
            data.get('hour'), data.get('n_people'), data.get('rices'),
            data.get('notes', ""), user_id, data.get('status', 'unconfirmed')
        )
        with self._get_cursor() as cur:
            cur.execute(sql, params)
            self.db.commit()
            return cur.lastrowid

    def get_all(self):
        query = f"""
                SELECT r.*, r.hour as raw_hour, {self.get_audit_select(alias='r')}
                FROM reservations r
                {self.get_audit_joins(alias='r')}
                ORDER BY r.date DESC, r.hour DESC
                """
        with self._get_cursor() as cur:
            cur.execute(query)
            return [self._format_row_hour(row) for row in cur.fetchall()]

    def get_by_id(self, reservation_id: int):
        query = f"""
                SELECT r.*, r.hour as raw_hour, {self.get_audit_select(alias='r')}
                FROM reservations r
                {self.get_audit_joins(alias='r')}
                WHERE r.id = %s
                """
        with self._get_cursor() as cur:
            cur.execute(query, (reservation_id,))
            return self._format_row_hour(cur.fetchone())

    def update(self, reservation_id: int, data: dict, editor_id: int = None):
        campos = ['name', 'phone', 'n_people', 'date', 'hour', 'rices', 'notes', 'status']

        update_data = {c: data.get(c) for c in campos}
        update_data['updated_by'] = editor_id
        update_data['id'] = reservation_id

        query = """
                UPDATE reservations
                SET name=%(name)s, phone=%(phone)s, n_people=%(n_people)s,
                    date=%(date)s, hour=%(hour)s, rices=%(rices)s, notes=%(notes)s,
                    status=%(status)s, updated_by=%(updated_by)s, updated_at=NOW()
                WHERE id=%(id)s
                """

        with self._get_cursor() as cur:
            cur.execute(query, update_data)
            self.db.commit()
            return cur.rowcount > 0

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

    def _format_row_hour(self, row):
        if row is not None and row.get('raw_hour'):
            row['hour'] = str(row['raw_hour'])[:5]
        return row