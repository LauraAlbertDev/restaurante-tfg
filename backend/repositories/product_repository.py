from .base_repository import BaseRepository
from .audit_mixin import AuditMixin
class ProductRepository(BaseRepository, AuditMixin):
    def __init__(self, db):
        super().__init__(db)

    def _get_cursor(self, dictionary=True):
        # buffered=True evita el error "Unread result found" cuando haces SELECT y luego UPDATE
        return self.db.cursor(dictionary=dictionary, buffered=True)

    def get_all(self, category_id=None, archived=0, name_filter=None):
        sql = f"""
              SELECT p.*, c.name as category_name, {self.get_audit_select(alias='p')},
                     a.id as allergen_id, a.name as allergen_name, 
                     a.color as allergen_color
              FROM products p
                       LEFT JOIN categories c ON p.category_id = c.id
                       LEFT JOIN product_allergens pa ON p.id = pa.product_id
                       LEFT JOIN allergens a ON pa.allergen_id = a.id
                       {self.get_audit_joins(alias='p')}
              WHERE p.archived = %s
              """
        params = [archived]
        if category_id:
            sql += " AND p.category_id = %s"
            params.append(category_id)
        if name_filter:
            sql += " AND LOWER(p.name) LIKE LOWER(%s)"
            params.append(f"%{name_filter}%")

        sql += " ORDER BY p.id ASC"

        with self._get_cursor() as cur:
            cur.execute(sql, params)
            return self.group_allergens(cur.fetchall())

    def get_one(self, product_id):
        with self._get_cursor() as cur:
            sql = """
                  SELECT p.*, c.name as category_name
                  FROM products p
                           LEFT JOIN categories c ON p.category_id = c.id
                  WHERE p.id = %s
                  """
            cur.execute(sql, (product_id,))
            product = cur.fetchone()

            if product:
                cur.execute("""
                            SELECT a.id, a.name, a.color
                            FROM allergens a
                                     JOIN product_allergens pa ON a.id = pa.allergen_id
                            WHERE pa.product_id = %s
                            """, (product_id,))
                product['allergens'] = cur.fetchall()
            return product

    def create(self, product_data, allergen_ids,creator_id):
        sql = """
              INSERT INTO products (name, description, image, price, category_id, stock,
                                    vegan, vegetarian, lactose_free, created_by)
              VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
              """
        params = (
            product_data.name, getattr(product_data, 'description', None),
            product_data.image or "placeholder.jpg", product_data.price,
            product_data.category_id, int(product_data.stock),
            getattr(product_data, 'vegan', 0), getattr(product_data, 'vegetarian', 0),
            getattr(product_data, 'lactose_free', 0), creator_id
        )

        try:
            with self._get_cursor(dictionary=False) as cur:
                cur.execute(sql, params)
                product_id = cur.lastrowid
                if allergen_ids:
                    self._set_allergens_internal(cur, product_id, allergen_ids)
                self.db.commit()
                return product_id
        except Exception as e:
            self.db.rollback()
            raise e

    def update(self, product_id, product_data, allergen_ids, editor_id):
        with self._get_cursor() as cur:
            cur.execute("SELECT image FROM products WHERE id = %s", (product_id,))
            row = cur.fetchone()
            old_image = row['image'] if row else None

            new_image = product_data.image if product_data.image != "placeholder.jpg" else None

            sql = """
                  UPDATE products
                  SET name=%s, description=%s, image=COALESCE(%s, image), price=%s,
                      category_id=%s, stock=%s, vegan=%s, vegetarian=%s, lactose_free=%s,
                      updated_by=%s, updated_at=NOW()
                  WHERE id=%s
                  """
            params = (
                product_data.name, product_data.description, new_image, product_data.price,
                product_data.category_id, int(product_data.stock),
                getattr(product_data, 'vegan', 0), getattr(product_data, 'vegetarian', 0),
                getattr(product_data, 'lactose_free', 0),
                editor_id, product_id
            )

            try:
                cur.execute(sql, params)
                cur.execute("DELETE FROM product_allergens WHERE product_id = %s", (product_id,))
                if allergen_ids:
                    self._set_allergens_internal(cur, product_id, allergen_ids)

                self.db.commit()
                return old_image if product_data.image and product_data.image != "placeholder.jpg" else None
            except Exception as e:
                self.db.rollback()
                raise e

    def delete(self, product_id):
        with self._get_cursor() as cur:
            cur.execute("SELECT image FROM products WHERE id = %s", (product_id,))
            product = cur.fetchone()
            image_name = product['image'] if product else None

            try:
                cur.execute("DELETE FROM products WHERE id = %s", (product_id,))
                self.db.commit()
                return image_name
            except Exception as e:
                self.db.rollback()
                raise e

    def toggle_archive(self, product_id):
        with self._get_cursor() as cur:
            cur.execute("SELECT archived FROM products WHERE id = %s", (product_id,))
            row = cur.fetchone()
            if not row: return None

            new_status = 0 if row['archived'] else 1
            try:
                cur.execute("UPDATE products SET archived = %s WHERE id = %s", (new_status, product_id))
                self.db.commit()
                return new_status
            except Exception as e:
                self.db.rollback()
                raise e

    def _set_allergens_internal(self, cur, product_id, allergen_ids):
        """Método auxiliar para insertar alérgenos en una transacción activa."""
        if not allergen_ids: return
        sql = "INSERT INTO product_allergens (product_id, allergen_id) VALUES (%s, %s)"
        vals = [(product_id, aid) for aid in allergen_ids]
        cur.executemany(sql, vals)

    def group_allergens(self, rows):
        """Transforma filas planas de la DB en objetos Producto con listas de alérgenos."""
        products = {}
        for row in rows:
            pid = row['id']
            if pid not in products:
                products[pid] = {**row, 'allergens': []}
                for key in ['allergen_id', 'allergen_name', 'allergen_color']:
                    products[pid].pop(key, None)
            if row['allergen_id']:
                products[pid]['allergens'].append({
                    'id': row['allergen_id'],
                    'name': row['allergen_name'],
                    'color': row['allergen_color']
                })
        return list(products.values())

    def get_or_create_category(self, category_name: str) -> int:
        if not category_name: category_name = "Sin Categoría"
        category_name = category_name.strip()

        with self._get_cursor() as cur:
            cur.execute("SELECT id FROM categories WHERE LOWER(name) = LOWER(%s)", (category_name,))
            row = cur.fetchone()
            if row: return row['id']

            try:
                cur.execute("INSERT INTO categories (name) VALUES (%s)", (category_name,))
                self.db.commit()
                return cur.lastrowid
            except Exception as e:
                self.db.rollback()
                raise e

    def duplicate(self, product_id: int):
        product = self.get_one(product_id)
        if not product: return None

        sql = """INSERT INTO products (name, description, image, price, category_id, stock, vegan, vegetarian, lactose_free)
                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"""

        try:
            with self._get_cursor(dictionary=False) as cur:
                cur.execute(sql, (
                    f"{product['name']} (Copia)", product['description'], product['image'],
                    product['price'], product['category_id'], product['stock'],
                    product['vegan'], product['vegetarian'], product['lactose_free']
                ))
                new_id = cur.lastrowid
                if product.get('allergens'):
                    allergen_ids = [a['id'] for a in product['allergens']]
                    self._set_allergens_internal(cur, new_id, allergen_ids)
                self.db.commit()
                return new_id
        except Exception as e:
            self.db.rollback()
            raise e

    def count_image_usage(self, filename: str) -> int:
        with self._get_cursor() as cur:
            cur.execute("SELECT COUNT(*) as count FROM products WHERE image = %s", (filename,))
            res = cur.fetchone()
            return res['count'] if res else 0

    def get_all_for_export(self, archived=0):
        sql = """
              SELECT p.name, p.price, c.name as category_name, p.stock,
                     p.vegan, p.vegetarian, p.lactose_free, p.image
              FROM products p
                       LEFT JOIN categories c ON p.category_id = c.id
              WHERE p.archived = %s
              ORDER BY p.id ASC
              """
        with self._get_cursor() as cur:
            cur.execute(sql, [archived])
            return cur.fetchall()