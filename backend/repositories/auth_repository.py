class AuthRepository:
    def __init__(self, db):
        self.db = db

    def get_user_by_email(self, email: str):
        sql = "SELECT * FROM users WHERE email = %s AND active = 1"
        with self.db.cursor(dictionary=True) as cursor:
            cursor.execute(sql, (email.strip().lower(),))
            return cursor.fetchone()

    def register_user(self, name, email, hashed_password, user_type="employee"):
        sql = """
              INSERT INTO users (name, email, password, type, active)
              VALUES (%s, %s, %s, %s, 1) \
              """
        params = (name.strip(), email.strip().lower(), hashed_password, user_type)

        with self.db.cursor() as cursor:
            try:
                cursor.execute(sql, params)
                self.db.commit()
                return cursor.lastrowid
            except Exception as e:
                self.db.rollback()
                raise e