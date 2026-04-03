from pydantic import BaseModel
from typing import Optional, List
from models.allergen import AllergenCreate, AllergenResponse

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    price: float
    category_id: int
    stock: int = 0
    vegan: int = 0
    vegetarian: int = 0
    lactose_free: int = 0

class ProductCreate(ProductBase):
    allergen_ids: List[int] = []

class ProductResponse(ProductBase):
    id: int
    category_name: Optional[str] = None
    archived: int = 0
    allergens: List[AllergenResponse] = []

    class Config:
        from_attributes = True

ProductResponse.model_rebuild()