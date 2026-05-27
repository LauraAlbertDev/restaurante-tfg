import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import api_router 

PROJECT_NAME = "Restaurante TFG API"
VERSION = "1.0.0"
CORS_ORIGINS = ["http://localhost:4200", "http://localhost"]
ASSETS_PATH = "/app/assets" 
def setup_middleware(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )

def setup_static_files(app: FastAPI) -> None:
    ASSETS_FOLDER = "/app/assets"

    if os.path.exists(ASSETS_FOLDER):
        app.mount("/assets", StaticFiles(directory="/app/assets"), name="assets")
    else:
        print(f"ERROR: {ASSETS_FOLDER} no existe.")

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