from sqlalchemy import Column, Integer, String, JSON
from .database import Base

class SalonMapa(Base):
    __tablename__ = "mapas_salon"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, default="Principal")
    esquema = Column(JSON)