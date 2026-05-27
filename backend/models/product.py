import json
from fastapi import UploadFile, File, Form
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from .allergen import AllergenResponse
from .audit import AuditBase

class StockUpdate(BaseModel):
    amount: int

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    price: float
    category_id: int
    stock: int = 0
    vegan: int = 0
    vegetarian: int = 0

class ProductCreate(ProductBase):
    allergen_ids: List[int] = []

class ProductResponse(ProductBase, AuditBase):
    id: int
    category_name: Optional[str] = None
    archived: int = 0
    allergens: List[AllergenResponse] = []
    model_config = ConfigDict(from_attributes=True)


class ProductForm:
    def __init__(
            self,
            name: str = Form(...),
            price: float = Form(...),
            category_id: int = Form(...),
            description: Optional[str] = Form(None),
            stock: int = Form(0),
            vegan: str = Form("0"),
            vegetarian: str = Form("0"),
            allergen_ids: str = Form("[]"),
            image_file: Optional[UploadFile] = File(None)
    ):
        self.name = name
        self.price = price
        self.category_id = category_id
        self.description = description
        self.stock = stock
        self.allergen_ids = allergen_ids
        self.image_file = image_file

        self.vegan = 1 if vegan in ["1", "true", "True"] else 0
        self.vegetarian = 1 if vegetarian in ["1", "true", "True"] else 0

    def to_product_create(self, filename: Optional[str] = None) -> ProductCreate:
        final_image = filename if filename is not None else "placeholder.jpg"

        return ProductCreate(
            name=self.name,
            description=self.description,
            price=self.price,
            category_id=self.category_id,
            stock=self.stock,
            image=final_image,
            vegan=self.vegan,
            vegetarian=self.vegetarian,
            allergen_ids=json.loads(self.allergen_ids) if isinstance(self.allergen_ids, str) else self.allergen_ids
        )

ProductResponse.model_rebuild()
StockUpdate.model_rebuild()