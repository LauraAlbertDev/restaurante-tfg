from types import SimpleNamespace
from typing import List

from .base_repository import BaseRepository
from models.audit_mixin import AuditMixin
class ProductRepository(BaseRepository, AuditMixin):
    def __init__(self, db):
        super().__init__(db)

    def _get_cursor(self, dictionary=True):
        return self.db.cursor(dictionary=dictionary, buffered=True)

    def get_all(self, category_id=None, archived=0, name_filter=None):
        sql = f"""
              SELECT p.*, c.name as category_name, {self.get_audit_select(alias='p')},
                     a.id as allergen_id, a.name as allergen_name, 
                     a.color as allergen_color, p.updated_at
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
                  SELECT p.id,
                         p.name,
                         p.description,
                         p.price,
                         p.image,
                         p.stock,
                         p.category_id,
                         p.vegan,
                         p.vegetarian,
                         p.archived,
                         p.updated_by,
                         p.updated_at,
                         c.name as category_name,
                         u.name as editor_name
                  FROM products p
                           LEFT JOIN categories c ON p.category_id = c.id
                           LEFT JOIN users u ON p.updated_by = u.id
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
                                    vegan, vegetarian, created_by)
              VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
              """
        params = (
            product_data.name, getattr(product_data, 'description', None),
            product_data.image or "placeholder.jpg", product_data.price,
            product_data.category_id, int(product_data.stock),
            getattr(product_data, 'vegan', 0), getattr(product_data, 'vegetarian', 0),
            creator_id
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
        print(f"DEBUG UPDATE: ID={product_id}, Nombre={product_data.name}, Precio={product_data.price}")
        with self._get_cursor() as cur:
            cur.execute("SELECT image FROM products WHERE id = %s", (product_id,))
            row = cur.fetchone()
            old_image = row['image'] if row else None

            new_image = product_data.image if product_data.image != "placeholder.jpg" else None

            sql = """
                  UPDATE products
                  SET name=%s, description=%s, image=COALESCE(%s, image), price=%s,
                      category_id=%s, stock=%s, vegan=%s, vegetarian=%s,
                      updated_by=%s, updated_at=NOW()
                  WHERE id=%s
                  """
            params = (
                product_data.name, getattr(product_data, 'description', None), new_image, product_data.price,
                product_data.category_id, int(product_data.stock),
                getattr(product_data, 'vegan', 0), getattr(product_data, 'vegetarian', 0),
                editor_id, product_id
            )

            try:
                cur.execute(sql, params)
                if allergen_ids is not None:
                    cur.execute("DELETE FROM product_allergens WHERE product_id = %s", (product_id,))
                    self._set_allergens_internal(cur, product_id, allergen_ids)

                self.db.commit()
                return self.get_one(product_id)
            except Exception as e:
                print(f"ERROR CRÍTICO EN UPDATE: {str(e)}")  # <--- AÑADE ESTO
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
        if not allergen_ids: return
        sql = "INSERT INTO product_allergens (product_id, allergen_id) VALUES (%s, %s)"
        vals = [(product_id, aid) for aid in allergen_ids]
        cur.executemany(sql, vals)

    def group_allergens(self, rows):
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

        sql = """INSERT INTO products (name, description, image, price, category_id, stock, vegan, vegetarian)
                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""

        try:
            with self._get_cursor(dictionary=False) as cur:
                cur.execute(sql, (
                    f"{product['name']} (Copia)", product['description'], product['image'],
                    product['price'], product['category_id'], product['stock'],
                    product['vegan'], product['vegetarian']
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
              SELECT p.id, p.name, p.price, c.name AS category_name, p.stock, p.vegan, p.vegetarian,p.image,
                     GROUP_CONCAT(a.name SEPARATOR ', ') AS allergens_names
              FROM products p
                       LEFT JOIN categories c ON p.category_id = c.id
                       LEFT JOIN product_allergens pa ON p.id = pa.product_id
                       LEFT JOIN allergens a ON pa.allergen_id = a.id
              WHERE p.archived = %s
              GROUP BY p.id
              ORDER BY p.id ASC 
              """
        with self._get_cursor() as cur:
            cur.execute(sql, [archived])
            rows = cur.fetchall()

            for row in rows:
                names = row.get('allergens_names')
                row['allergens_names'] = [n.strip() for n in names.split(',')] if names else []
            return rows


    def get_allergen_map(self):
        with self._get_cursor() as cur:
            cur.execute("SELECT id, name FROM allergens")
            return {row['name'].lower().strip(): row['id'] for row in cur.fetchall()}

    def import_data(self, records, creator_id, update=False):
        count = 0
        from types import SimpleNamespace

        for record in records:
            # 1. Normalización estricta del nombre para la búsqueda
            raw_name = record.get('name', '')
            product_name = str(raw_name).strip() if raw_name else None
            if not product_name:
                continue

            # 2. Preparar campos para el objeto
            cat_name = record.get('category_name')
            record['category_id'] = self.get_category_id_by_name(cat_name) if cat_name else None
            record['stock'] = int(record.get('stock') or 0)

            # Asegurar que los campos opcionales existan en el diccionario para evitar errores en SimpleNamespace
            record.setdefault('description', None)
            record.setdefault('image', 'placeholder.jpg')
            record.setdefault('vegan', 0)
            record.setdefault('vegetarian', 0)

            # 3. Buscar usando normalización (SQL TRIM/LOWER)
            existing = self.get_by_name(product_name)

            # 4. Creación del objeto para pasar a las funciones del repo
            product_obj = SimpleNamespace(**record)

            if existing and update:
                print(f"DEBUG: Actualizando producto '{product_name}' (ID: {existing['id']})")
                self.update(existing['id'], product_obj, record.get('allergen_ids', []), creator_id)
                count += 1
            elif not existing:
                print(f"DEBUG: Creando nuevo producto '{product_name}'")
                self.create(product_obj, record.get('allergen_ids', []), creator_id)
                count += 1
            else:
                print(f"DEBUG: Producto '{product_name}' existe y update=False. Saltando.")

        return count

    def get_category_id_by_name(self, name: str):
        cursor = self.db.cursor(dictionary=True)
        query = "SELECT id FROM categories WHERE name = %s LIMIT 1"
        cursor.execute(query, (name,))
        result = cursor.fetchone()
        cursor.close()
        return result['id'] if result else None

    def get_by_name(self, name: str):
        cursor = self.db.cursor(dictionary=True)
        query = "SELECT * FROM products WHERE TRIM(LOWER(name)) = TRIM(LOWER(%s)) LIMIT 1"
        cursor.execute(query, (name,))
        result = cursor.fetchone()
        cursor.close()
        return result

    def _map_to_product(self, row, category_id):
        name = row.get('name')
        if not name or str(name).strip() == "":
            raise ValueError("El campo 'name' es obligatorio y no puede estar vacío.")

        description = row.get('description')
        if not description or str(description).strip() == "":
            raise ValueError(f"El producto '{name}' requiere una descripción obligatoria.")

        price_raw = row.get('price')
        try:
            price = float(price_raw)
            if price < 0:
                raise ValueError
        except (TypeError, ValueError):
            raise ValueError(f"El producto '{name}' tiene un precio inválido: '{price_raw}'. Debe ser un número positivo.")

        return type('obj', (object,), {
            'name': str(name).strip(),
            'description': str(description).strip(),
            'price': price,
            'category_id': category_id,
            'stock': int(row.get('stock', 0)),
            'image': row.get('image') or 'placeholder.jpg',
            'vegan': int(row.get('vegan', 0)),
            'vegetarian': int(row.get('vegetarian', 0))
        })

    def _parse_allergens(self, raw_val, allergen_map):
        if not raw_val or str(raw_val).strip() in ["", "[]", "None"]:
            return None
        clean_str = str(raw_val).translate(str.maketrans('', '', "[]'\""))
        names = [n.strip().lower() for n in clean_str.split(',') if n.strip()]
        return [allergen_map[n] for n in names if n in allergen_map]

    def get_allergen_ids_by_names(self, names):
        if not names: return []
        allergen_map = self.get_allergen_map()
        return [allergen_map[n.lower()] for n in names if n.lower() in allergen_map]

    def update_stock(self, product_id: int, amount: int):
        sql = "UPDATE products SET stock = stock + %s WHERE id = %s"
        try:
            with self._get_cursor() as cur:
                cur.execute(sql, (amount, product_id))
                self.db.commit()
                return self.get_one(product_id)
        except Exception as e:
            self.db.rollback()
            raise e