import mysql.connector

class CategoryRepository:
    def __init__(self, db):
        self.db = db

    def _get_connection(self):
        return mysql.connector.connect(**self.db_config)

    def get_all(self):
        cur = self.db.cursor(dictionary=True)
        cur.execute("SELECT id, name FROM categories")
        return cur.fetchall()

    def get_by_name(self, name, exclude_id=None):
        cur = self.db.cursor(dictionary=True)
        sql = "SELECT id FROM categories WHERE LOWER(name) = LOWER(%s)"
        params = [name]
        if exclude_id:
            sql += " AND id <> %s"
            params.append(exclude_id)

        cur.execute(sql, params)
        return cur.fetchone()

    def create(self, name):
        cur = self.db.cursor()
        cur.execute("INSERT INTO categories (name) VALUES (%s)", (name,))
        self.db.commit()
        return cur.lastrowid

    def has_products(self, category_id):
        cur = self.db.cursor()
        cur.execute("SELECT COUNT(*) FROM products WHERE category_id = %s", (category_id,))
        res = cur.fetchone()
        return res[0] > 0 if res else False

    def delete(self, category_id):
        cur = self.db.cursor()
        cur.execute("DELETE FROM categories WHERE id = %s", (category_id,))
        self.db.commit()

    def update(self, category_id, name):
        cur = self.db.cursor()
        cur.execute("UPDATE categories SET name = %s WHERE id = %s", (name, category_id))
        self.db.commit()