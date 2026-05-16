from fastapi import APIRouter
from .philosophies import router as philosophies
from .comments import router as comments
from .users import router as users
from .auth import router as auth
from .categories import router as categories
from .products import router as products
from .allergens import router as allergens
from .reservations import router as reservations
from .floor_plan import router as floor_plan_router

api_router = APIRouter()

ALL_ROUTERS = [
    philosophies, comments, users, 
    auth, categories, products, allergens, reservations, floor_plan_router
]

for router in ALL_ROUTERS:
    api_router.include_router(router)