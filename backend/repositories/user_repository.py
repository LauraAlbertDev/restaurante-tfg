from mysql.connector import IntegrityError

class UserRepository:
    def __init__(self, db):
        self.db = db

    def get_all(self):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT id, name, email, type, active, created_at FROM users ORDER BY id DESC")
        res = cursor.fetchall()
        cursor.close()
        return res

    def get_by_id(self, user_id: int):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT id, name, email, type, active FROM users WHERE id=%s", (user_id,))
        res = cursor.fetchone()
        cursor.close()
        return res

    def email_exists(self, email: str, exclude_id: int = None):
        cursor = self.db.cursor()
        if exclude_id:
            cursor.execute("SELECT id FROM users WHERE email=%s AND id<>%s", (email, exclude_id))
        else:
            cursor.execute("SELECT id FROM users WHERE email=%s", (email,))
        exists = cursor.fetchone() is not None
        cursor.close()
        return exists

    def create(self, name, email, hashed_pw, user_type):
        cursor = self.db.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, password, type, active) VALUES (%s, %s, %s, %s, 1)",
            (name, email, hashed_pw, user_type)
        )
        self.db.commit()
        cursor.close()

    def update(self, user_id, name, email, user_type, hashed_pw=None):
        cursor = self.db.cursor()
        if hashed_pw:
            query = "UPDATE users SET name=%s, email=%s, type=%s, password=%s WHERE id=%s"
            params = (name, email, user_type, hashed_pw, user_id)
        else:
            query = "UPDATE users SET name=%s, email=%s, type=%s WHERE id=%s"
            params = (name, email, user_type, user_id)

        cursor.execute(query, params)
        self.db.commit()
        cursor.close()

    def toggle_status(self, user_id):
        cursor = self.db.cursor()
        cursor.execute("UPDATE users SET active = NOT active WHERE id=%s", (user_id,))
        self.db.commit()
        cursor.close()