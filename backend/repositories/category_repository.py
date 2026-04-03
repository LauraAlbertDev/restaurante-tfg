import mysql.connector

class CategoryRepository:
    def __init__(self, db):
        self.db = db

    def get_all(self):
        with self.db.cursor(dictionary=True) as cur:
            cur.execute("SELECT id, name FROM categories ORDER BY name ASC")
            return cur.fetchall()

    def get_by_name(self, name:str, exclude_id=None):
        sql = "SELECT * FROM categories WHERE LOWER(name) = LOWER(%s)"
        params = [name.strip()]

        if exclude_id:
            sql += " AND id <> %s"
            params.append(exclude_id)

        with self.db.cursor(dictionary=True) as cur:
            cur.execute(sql, params)
            return cur.fetchone()

    def create(self, name: str):
        with self.db.cursor() as cur:
            try:
                cur.execute("INSERT INTO categories (name) VALUES (%s)", (name.strip(),))
                self.db.commit()
                return cur.lastrowid
            except Exception as e:
                self.db.rollback()
                raise e

    def has_products(self, category_id: int) -> bool:
        with self.db.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM products WHERE category_id = %s", (category_id,))
            res = cur.fetchone()
            return res[0] > 0 if res else False

    def delete(self, category_id: int):
        with self.db.cursor() as cur:
            try:
                cur.execute("DELETE FROM categories WHERE id = %s", (category_id,))
                self.db.commit()
            except Exception as e:
                self.db.rollback()
                raise e

    def update(self, category_id: int, name: str):
        with self.db.cursor() as cur:
            try:
                cur.execute("UPDATE categories SET name = %s WHERE id = %s", (name.strip(), category_id))
                self.db.commit()
            except Exception as e:
                self.db.rollback()
                raise e