from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.philosophies import router as philosophies_router
from routers.comments import router as comments_router


app = FastAPI(
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)


origins = [
    "http://localhost:4200",  # Angular
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(philosophies_router)
app.include_router(comments_router)



@app.get("/")
def root():
    return {"message": "Servicio funcionando"}