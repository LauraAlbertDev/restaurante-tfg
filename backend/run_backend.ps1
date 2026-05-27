if (!(Test-Path ".venv")) {
    Write-Host "--- Creando entorno virtual... ---" -ForegroundColor Cyan
    python -m venv .venv
}

Write-Host "--- Activando entorno... ---" -ForegroundColor Cyan
.\.venv\Scripts\Activate.ps1

Write-Host "--- Verificando dependencias... ---" -ForegroundColor Cyan
python -m pip install --upgrade pip
pip install -r requirements.txt

Write-Host "--- Iniciando FastAPI... ---" -ForegroundColor Green
uvicorn main:app --reload