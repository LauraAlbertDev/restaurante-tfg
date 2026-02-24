import mysql.connector
from mysql.connector import pooling

# pool de conexiones (MUY recomendable)
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