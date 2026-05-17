from mysql.connector import pooling

connection_pool = pooling.MySQLConnectionPool(
    pool_name="mypool",
    pool_size=10,
    host="localhost",
    user="root",
    password="",
    database="restaurante"
)

def get_connection():
    return connection_pool.get_connection()

def get_db():
    db = get_connection()
    try:
        yield db
    finally:
        if db.is_connected():
            db.close()