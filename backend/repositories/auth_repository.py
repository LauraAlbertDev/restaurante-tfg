class AuthRepository:
    def __init__(self, db):
        self.db = db

    def get_user_by_email(self, email: str):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email=%s AND active=1", (email,))
        user = cursor.fetchone()
        cursor.close()
        return user

    def register_user(self, name, email, hashed_password, user_type="employee"):
        cursor = self.db.cursor()
        cursor.execute(
            """
            INSERT INTO users (name, email, password, type, active)
            VALUES (%s, %s, %s, %s, 1)
            """,
            (name, email, hashed_password, user_type)
        )
        self.db.commit()
        cursor.close()