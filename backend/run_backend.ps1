# 1. Comprobar si existe el entorno virtual, si no, crearlo
if (!(Test-Path ".venv")) {
    Write-Host "--- Creando entorno virtual... ---" -ForegroundColor Cyan
    python -m venv .venv
}

# 2. Activar el entorno
Write-Host "--- Activando entorno... ---" -ForegroundColor Cyan
.\.venv\Scripts\Activate.ps1

# 3. Actualizar pip e instalar dependencias
Write-Host "--- Verificando dependencias... ---" -ForegroundColor Cyan
python -m pip install --upgrade pip
pip install -r requirements.txt

# 4. Iniciar el servidor
Write-Host "--- Iniciando FastAPI... ---" -ForegroundColor Green
uvicorn main:app --reload