# 📦 Changelog – Restaurante Web App
### Backend & Frontend – Laura Albert (Solvam)

Historial de cambios del proyecto basado en los estándares de [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [0.1.0] - 24/02/2026
### 🎉 Inicio del proyecto
Configuración de la arquitectura base y entornos de ejecución.

### 🖥️ Backend
- **Core**: Inicialización de la API mediante el framework **FastAPI**.
- **Infraestructura**: Configuración de entorno virtual Python y drivers de conexión para **MySQL**.
- **Arquitectura**: Definición de la estructura de directorios siguiendo un patrón modular (`models/`, `routes/`, `services/`).
- **Servidor**: Configuración de **Uvicorn** para el despliegue en el entorno de desarrollo.

### 🌐 Frontend
- **Core**: Inicialización del proyecto con **Angular** utilizando **Standalone Components**.
- **Estructura**: Implementación de componentes globales de navegación (`Navbar`, `Footer`) y tipado mediante interfaces.
- **Entorno**: Configuración de `environments/` para la gestión centralizada de las URLs de la API.

---

## [0.2.0] - 27/02/2026
### ✨ Añadido – Home Page & Routing

### 🖥️ Backend
- **Routing**: Refactorización del sistema de rutas para permitir escalabilidad en futuros módulos.

### 🌐 Frontend
- **Componente Home**: Creación y maquetación de la landing page principal.
- **UI/UX**: Implementación de sección *Hero* con diseño responsivo y optimización de recursos visuales.
- **Navegación**: Configuración de `AppRoutes` para la gestión de la navegación Single Page Application (SPA).

---

## [0.3.0] - 01/03/2026
### ✨ Añadido – Filosofía Corporativa (About Us)

### 🖥️ Backend
- **Base de Datos**: Creación y persistencia de la tabla `philosophies` en MariaDB para el almacenamiento de valores de marca.
- **Endpoints**:
    - `GET /philosophies`: Implementación de lógica de obtención de datos ordenados.
- **Reglas de Negocio**: Aplicación de validaciones de integridad para asegurar la consistencia de los registros corporativos.

### 🌐 Frontend
- **Servicios**: Implementación de `PhilosophyService` para el consumo de datos asíncronos mediante `HttpClient`.
- **Modelos**: Definición de la interfaz `Philosophy` para asegurar un tipado estricto de los datos recibidos.
- **Componente AboutUs**: Integración dinámica de datos mediante directivas estructurales y renderizado condicional.

---

## [0.4.0] - 05/03/2026
### ✨ Añadido – Gestión de Contacto y Comentarios

### 🖥️ Backend
- **Arquitectura**: Implementación del **Patrón Repositorio** (`CommentRepository`) para desacoplar la lógica de persistencia de la lógica de negocio (SOLID).
- **Modelos**: Definición de esquemas de validación y serialización mediante **Pydantic** (`UserComment`).
- **Endpoints**:
    - `POST /comments`: Creación de nuevos registros de contacto.
    - `GET /comments`: Listado con soporte para filtrado dinámico de estado (archivados/activos).
    - `PUT /comments/archive/{id}`: Implementación de lógica de conmutación de estado (toggle).
- **Seguridad**: Configuración de **Middleware CORS** para habilitar la comunicación segura con el dominio del Frontend.

### 🌐 Frontend
- **Servicios**: Creación de `ContactService` centralizando las peticiones HTTP relativas a la mensajería del usuario.
- **Componente CommentsList**:
    - Visualización administrativa mediante **Cards dinámicas** de Bootstrap.
    - Implementación de lógica de archivado en tiempo real con actualización reactiva del estado local.
    - Sistema de filtrado toggle para la gestión eficiente de comentarios.
- **Clean Code**: Refactorización de interfaces para prevenir colisiones de tipos y manejo defensivo de flujos observables (`RxJS`).

---

## [0.5.0] - 05/03/2026
### ✨ Añadido – Edición de Comentarios y Vista Previa

### 🖥️ Backend
- **Patrón Repositorio**: Optimización de los métodos `update()` y `get_by_id()` garantizando la integridad referencial en las consultas SQL.
- **Conectividad**: Implementación de **Pooling de conexiones** para optimizar el rendimiento y la reutilización de recursos de la base de datos.
- **Clean Code**: Unificación de métodos en el repositorio siguiendo el principio **DRY (Don't Repeat Yourself)** y uso de parámetros nombrados para prevenir inyecciones SQL.

### 🌐 Frontend
- **Componente CommentsEdit**:
    - Implementación de **Formularios Reactivos** (`ReactiveFormsModule`) con validaciones de estado y longitud.
    - Creación de una funcionalidad de **Vista Previa dinámica** vinculada en tiempo real a los controles del formulario.
    - Gestión avanzada de estados de carga mediante `patchValue` e inyección de datos contextuales vía `@Input`.
- **UI/UX**: Refinamiento estético mediante **Floating Labels** y feedback visual instantáneo para mejorar la usabilidad en tareas de edición.

--- 

## [0.6.0] - 05/03/2026
### ✨ Añadido – Refactorización SOLID y Edición de Filosofía

### 🖥️ Backend
- **Dependency Injection**: Implementación de un generador de sesiones (`get_db`) con `yield` para garantizar el cierre automático de conexiones y optimizar el pool.
- **Patrón Repositorio**:
    - Refactorización del `PhilosophyRepository` eliminando parámetros de control ("strings mágicos") en favor de métodos explícitos (`fetchall`, `fetchone`).
    - Implementación de **Manejo de Transacciones** con `commit()` y `rollback()` para asegurar la integridad atómica de los datos.
- **Esquemas Pydantic**: Creación de `PhilosophyUpdate` para la validación estricta del cuerpo de las peticiones (Body) en el endpoint `PUT`.
- **Clean Code**: Uso de parámetros nombrados en SQL (`%(key)s`) para mejorar la legibilidad y seguridad contra inyecciones.

### 🌐 Frontend
- **Servicios**: Refactorización de `PhilosophyService` para realizar un "limpiado" de datos (payload mapping) antes del envío, evitando errores 422 por envío de campos excedentes.
- **Tipado**: Uso de tipos de utilidad de TypeScript (`Omit`, `Pick`) para definir `PhilosophyUpdate` a partir de la interfaz base, garantizando coherencia en el flujo de datos.
- **Robustez**: Implementación de manejo de errores HTTP y validación de URLs dinámicas para prevenir fallos por barras diagonales duplicadas o faltantes.
- **TypeScript**: Corrección de errores de asignación de tipos mediante operadores de afirmación no nula (`!`) y opcionalidad controlada en las plantillas.

---