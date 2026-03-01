# 📦 Changelog – Restaurante Web App
### Backend & Frontend – Laura Albert (Solvam)

Historial de cambios del proyecto.  
Formato basado en: https://keepachangelog.com/es-ES/1.0.0/

---

## [0.1.0] - 24/02/2026
### 🎉 Inicio del proyecto
Primera configuración del entorno de desarrollo y estructura base.

### 🖥️ Backend
- Inicialización proyecto FastAPI
- Configuración entorno virtual Python
- Conexión a base de datos MySQL
- Creación estructura inicial:
    - Carpeta `models/`
    - Carpeta `routes/`
    - Archivo `database.py`
- Configuración servidor Uvicorn

### 🌐 Frontend
- Inicialización proyecto Angular
- Creación estructura base:
    - `navbar and footer`
    - `interfaces`
    - `components/`
- Conexión inicial con API backend

---

## [0.2.0] - 27/02/2026
### ✨ Añadido – Página de inicio

### 🖥️ Backend
- Mejora en estructura de rutas

### 🌐 Frontend
- Creación del componente home/
- Diseño y maquetación de la página principal
- Implementación de sección hero con imagen principal
- Ajustes visuales en navbar para adaptarse al inicio

---

## [0.3.0] - 01/03/2026
### ✨ Añadido – Página de sobre nosotros

### 🖥️ Backend

- Creación de tabla `philosophies` en MariaDB para almacenar los valores corporativos.
- Inserción de los 6 registros iniciales (seed de datos).
- Implementación del endpoint:
    - `GET /philosophies` → Obtiene las 6 filosofías ordenadas.
- Aplicación de regla de negocio: solo se permiten IDs del 1 al 6.

---

### 🌐 Frontend
- Creación de `PhilosophyService` para consumir la API.
    - Método `getPhilosophies()`
- Definición de la interfaz `Philosophy`.
- Integración dinámica de las filosofías en la página "About Us".
