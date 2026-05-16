from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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
    ASSETS_FOLDER = IMAGES_DIR.parent

    if ASSETS_FOLDER.exists():
        app.mount("/assets", StaticFiles(directory=str(ASSETS_FOLDER)), name="assets")
    else:
        print(f"ERROR: No se encuentra la carpeta en: {ASSETS_FOLDER}")

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