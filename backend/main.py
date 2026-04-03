import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # Importante
from routers import api_router 

PROJECT_NAME = "Restaurante TFG API"
VERSION = "1.0.0"
CORS_ORIGINS = ["http://localhost:4200"]

BASE_DIR = Path(__file__).resolve().parent
IMAGES_DIR = BASE_DIR.parent / "frontend" / "public" / "assets" / "images"

def setup_middleware(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )

def setup_static_files(app: FastAPI) -> None:
    # Cambiamos "/imagenes" por "/uploads" para que coincida con Angular
    if IMAGES_DIR.exists():
        app.mount("/uploads", StaticFiles(directory=str(IMAGES_DIR)), name="uploads")
        print(f"INFO: Imágenes servidas desde {IMAGES_DIR} en la ruta /uploads")
    else:
        print(f"ERROR: No se encuentra la carpeta de imágenes en: {IMAGES_DIR}")

def create_application() -> FastAPI:
    application = FastAPI(
        title=PROJECT_NAME,
        version=VERSION,
        docs_url="/docs"
    )
    setup_middleware(application)
    setup_static_files(application)
    application.include_router(api_router)

    return application

app = create_application()