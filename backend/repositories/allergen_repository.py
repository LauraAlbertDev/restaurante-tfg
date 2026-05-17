class AllergenRepository:
    DEFAULT_COLOR = "#0d6efd"

    def __init__(self, db):
        self.db = db

    def _execute_query(self, query, params=None, fetch="all", dictionary=True, commit=False):
        cur = self.db.cursor(dictionary=dictionary)
        try:
            cur.execute(query, params or ())

            if commit:
                self.db.commit()
                return cur.lastrowid

            if fetch == "one":
                return cur.fetchone()
            if fetch == "all":
                return cur.fetchall()
            return None
        except Exception as e:
            if commit:
                self.db.rollback()
            raise e
        finally:
            cur.close()

    def get_all(self):
        return self._execute_query(
            "SELECT id, name, color FROM allergens ORDER BY name ASC"
        )

    def get_by_id(self, allergen_id: int):
        return self._execute_query(
            "SELECT * FROM allergens WHERE id = %s",
            (allergen_id,),
            fetch="one"
        )

    def get_by_name(self, name: str, exclude_id: int = None):
        sql = "SELECT * FROM allergens WHERE LOWER(name) = LOWER(%s)"
        params = [name.strip()]

        if exclude_id:
            sql += " AND id <> %s"
            params.append(exclude_id)

        with self.db.cursor(dictionary=True) as cur:
            cur.execute(sql, params)
            return cur.fetchone()

    def create(self, name: str, color: str = None):
        return self._execute_query(
            "INSERT INTO allergens (name, color) VALUES (%s, %s)",
            (name, color or self.DEFAULT_COLOR),
            commit=True
        )

    def update(self, allergen_id: int, name: str, color: str = None):
        with self.db.cursor() as cur:
            sql = """
                  UPDATE allergens
                  SET name = %s,
                      color = COALESCE(%s, color)
                  WHERE id = %s \
                  """
            try:
                cur.execute(sql, (name, color, allergen_id))
                self.db.commit()
            except Exception as e:
                self.db.rollback()
                raise e

    def delete(self, allergen_id: int):
        with self.db.cursor() as cur:
            try:
                cur.execute("DELETE FROM product_allergens WHERE allergen_id = %s", (allergen_id,))
                cur.execute("DELETE FROM allergens WHERE id = %s", (allergen_id,))

                self.db.commit()
            except Exception as e:
                self.db.rollback()
                raise e

    def has_products(self, allergen_id: int):
        with self.db.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM product_allergens WHERE allergen_id = %s",
                (allergen_id,)
            )
            res = cur.fetchone()
            return res[0] > 0 if res else False