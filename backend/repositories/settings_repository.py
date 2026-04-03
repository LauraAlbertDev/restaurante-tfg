from .base_repository import BaseRepository

class SettingsRepository(BaseRepository):

    def get_admin_settings(self):
        with self._get_cursor() as cursor:
            cursor.execute("SELECT day_of_week, max_capacity, is_open FROM capacity_rules ORDER BY day_of_week")
            days = cursor.fetchall()

            cursor.execute("SELECT id, start_time FROM shift_configs WHERE is_active = TRUE ORDER BY start_time ASC")
            shifts = cursor.fetchall()

            for s in shifts:
                s['start_time'] = str(s['start_time'])[:5]

            return {"dayRules": days, "shifts": shifts}

    def get_capacity_for_day(self, day_index: int):
        query = "SELECT max_capacity, is_open FROM capacity_rules WHERE day_of_week = %s"
        with self._get_cursor() as cursor:
            cursor.execute(query, (day_index,))
            res = cursor.fetchone()
            return res if res else {"max_capacity": 150, "is_open": 1}

    def update_day_config(self, day_index: int, max_capacity: int, is_open: bool):
        query = """
                UPDATE capacity_rules
                SET max_capacity = %(max)s, is_open = %(open)s
                WHERE day_of_week = %(day)s
                """
        params = {
            "max": max_capacity,
            "open": 1 if is_open else 0,
            "day": day_index
        }
        with self._get_cursor() as cursor:
            cursor.execute(query, params)
            self.db.commit()
            return True