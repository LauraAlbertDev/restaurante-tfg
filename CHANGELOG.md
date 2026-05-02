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

## [1.0.0] - 06/03/2026
### ✨ Seguridad – Autenticación y Autorización (JWT)

### 🖥️ Backend
- **Core Security**: Implementación de autenticación basada en **JWT (JSON Web Tokens)** y hashing de contraseñas mediante **Bcrypt**.
- **Middleware**:
    - Implementación de `get_current_user` y dependencias de seguridad para la validación de tokens en cabeceras de petición.
    - Creación de lógica de **Control de Acceso (RBAC)** mediante funciones inyectables para restringir endpoints según el rol del usuario.
- **Esquemas Pydantic**: Definición de modelos `UserLogin`, `UserRegister` y `LoginResponse` para la validación estricta del cuerpo de las peticiones y respuestas.
- **Clean Code**: Centralización de la lógica de autenticación en un **AuthRepository**, eliminando el uso de "strings mágicos" y asegurando la integridad atómica en las consultas de usuario.

### 🌐 Frontend
- **Protección de Rutas (Guards)**: Implementación de un `AuthGuard` funcional encargado de validar la sesión y el rol del usuario antes de permitir el acceso a rutas sensibles.
- **Navegación Administrativa**:
    - Reestructuración de rutas críticas mediante **Child Routes** bajo el prefijo `/admin`.
    - Restricción de acceso exclusivo para el rol **Admin** en los módulos de `comment-list` y `comment-detail`, garantizando la privacidad de las comunicaciones de los usuarios.
- **Servicios**: Implementación de **Angular Signals** en `AuthService` para una gestión de estado reactiva, eliminando la necesidad de refrescar la página para actualizar la interfaz post-login.
- **Robustez**:
    - Implementación de lógica de control de menús unificada en la **Navbar** para prevenir estados inconsistentes en la navegación SPA.
    - Gestión avanzada de persistencia de sesión y manejo defensivo de errores HTTP mediante interceptores (401 Unauthorized).
- **TypeScript**: Refactorización de componentes bajo principios **SOLID**, desacoplando la lógica de visibilidad de los elementos del DOM y centralizando el estado en el controlador del componente.

---
## [1.1.0] - 08/03/2026
### ✨ Añadido – Gestión Integral de Categorías (CRUD)

### 🖥️ Backend
- **Arquitectura SOLID**:
    - Implementación del **Patrón Repositorio** (`CategoryRepository`) con **Inyección de Dependencias** real a través del constructor.
    - Desacoplamiento total de la gestión de conexiones: el repositorio utiliza la conexión inyectada desde el pool, delegando el ciclo de vida (apertura/cierre) al generador de FastAPI (`yield`).
- **Modelado de Datos**:
    - Definición de esquemas **Pydantic** (`CategoryCreate`, `Categories`) para la validación estricta de tipos y generación automática de contratos de API.
- **Endpoints**:
    - `GET /categories`: Obtención de listado completo con mapeo automático a modelo de respuesta.
    - `POST /categories`: Lógica de creación con validación preventiva de duplicados.
    - `PUT /categories/{id}`: Edición con validación de unicidad de nombre (excluyendo el ID actual).
    - `DELETE /categories/{id}`: Implementación de control de integridad referencial para impedir el borrado de categorías con productos vinculados.
- **Automatización (DevOps)**:
    - Creación de script de arranque `run_backend.ps1` para automatizar la activación del entorno virtual (`.venv`), instalación de dependencias y lanzamiento del servidor Uvicorn con *hot-reload*.

### 🌐 Frontend
- **Angular Signals**:
    - Implementación de arquitectura reactiva moderna mediante **Signals** (`signal`, `update`) para la gestión de estados locales y globales.
    - Gestión de inmutabilidad: Actualización de la interfaz mediante proyecciones de estado, evitando la mutación directa de arrays.
- **Componente AdminCategories**:
    - Interfaz de administración con sistema de "Edición en línea" (In-place editing) y flujo de control nativo de Angular (`@for`, `@if`).
    - Implementación de estados de carga (`loading`) para el bloqueo de UI durante peticiones asíncronas, mejorando la UX y evitando colisiones de datos.
- **Servicios**:
    - Centralización de la lógica de sincronización en `CategoryService` mediante métodos de actualización local (`addLocal`, `removeLocal`, `updateLocal`).
- **Clean Code**:
    - Tipado estricto mediante interfaces para eliminar el uso de `any`.
    - Refactorización de métodos de controlador para una gestión de errores defensiva basada en los códigos de estado HTTP del backend.
---
## [1.1.2] - 03/04/2026

### ✨ Nueva Funcionalidad – Gestión de Categorías, Alérgenos y Admin Dashboard

### 🖥️ Backend
- **Modelos y Base de Datos**:
    - Creación de los modelos `Category` y `Allergen` con sus respectivas tablas en MySQL.
- **Arquitectura (Repositories)**:
    - Implementación de `BaseRepository` para centralizar la lógica de conexión y gestión de cursores.
    - Desarrollo de `CategoryRepository` y `AllergenRepository` con soporte completo para operaciones CRUD.
- **API (Routers)**:
    - Nuevos routers `/categories` y `/allergens` con endpoints protegidos.
    - Registro y activación de rutas en el punto de entrada principal (`main.py`).

### 🌐 Frontend
- **Admin Dashboard**:
    - Diseño e implementación de una interfaz centralizada con tarjetas visuales (Bootstrap 5) para acceso rápido a todas las secciones administrativas.
    - Efectos de hover mejorados y descripciones de funcionalidad para cada módulo.
- **Servicios y Gestión de Estado**:
    - Creación de `CategoryService` y `AllergenService` utilizando **Angular Signals**.
    - Implementación de **Estado Local**: Métodos `addLocal`, `removeLocal` y `updateLocal` para garantizar una respuesta instantánea de la UI sin recargas de red.
- **Componentes Administrativos**:
    - Desarrollo de los componentes `AdminCategories` y `AdminAllergens`.
    - Implementación de lógica de edición "en línea" y modales de confirmación para borrado.
- **UX/UI**:
    - Gestión de estados de carga (`loading signals`) para deshabilitar botones durante peticiones asíncronas.
    - Estilización de formularios con validaciones visuales y feedback de errores.

---

## [1.1.2] - 03/04/2026

### ✨ Nueva Funcionalidad – Gestión de Categorías, Alérgenos y Admin Dashboard

### 🖥️ Backend
- **Modelos y Base de Datos**:
    - Creación de los modelos `Category` y `Allergen` con sus respectivas tablas en MySQL.
- **Arquitectura (Repositories)**:
    - Implementación de `BaseRepository` para centralizar la lógica de conexión y gestión de cursores.
    - Desarrollo de `CategoryRepository` y `AllergenRepository` con soporte completo para operaciones CRUD.
- **API (Routers)**:
    - Nuevos routers `/categories` y `/allergens` con endpoints protegidos.
    - Registro y activación de rutas en el punto de entrada principal (`main.py`).

### 🌐 Frontend
- **Admin Dashboard**:
    - Diseño e implementación de una interfaz centralizada con tarjetas visuales (Bootstrap 5) para acceso rápido a todas las secciones administrativas.
    - Efectos de hover mejorados y descripciones de funcionalidad para cada módulo.
- **Servicios y Gestión de Estado**:
    - Creación de `CategoryService` y `AllergenService` utilizando **Angular Signals**.
    - Implementación de **Estado Local**: Métodos `addLocal`, `removeLocal` y `updateLocal` para garantizar una respuesta instantánea de la UI sin recargas de red.
- **Componentes Administrativos**:
    - Desarrollo de los componentes `AdminCategories` y `AdminAllergens`.
    - Implementación de lógica de edición "en línea" y modales de confirmación para borrado.
- **UX/UI**:
    - Gestión de estados de carga (`loading signals`) para deshabilitar botones durante peticiones asíncronas.
    - Estilización de formularios con validaciones visuales y feedback de errores.

---

## [1.1.2] - 03/04/2026

### ✨ Nueva Funcionalidad – Gestión de Categorías, Alérgenos y Admin Dashboard

### 🖥️ Backend
- **Modelos y Base de Datos**:
    - Creación de los modelos `Category` y `Allergen` con sus respectivas tablas en MySQL.
- **Arquitectura (Repositories)**:
    - Implementación de `BaseRepository` para centralizar la lógica de conexión y gestión de cursores.
    - Desarrollo de `CategoryRepository` y `AllergenRepository` con soporte completo para operaciones CRUD.
- **API (Routers)**:
    - Nuevos routers `/categories` y `/allergens` con endpoints protegidos.
    - Registro y activación de rutas en el punto de entrada principal (`main.py`).

### 🌐 Frontend
- **Admin Dashboard**:
    - Diseño e implementación de una interfaz centralizada con tarjetas visuales (Bootstrap 5) para acceso rápido a todas las secciones administrativas.
    - Efectos de hover mejorados y descripciones de funcionalidad para cada módulo.
- **Servicios y Gestión de Estado**:
    - Creación de `CategoryService` y `AllergenService` utilizando **Angular Signals**.
    - Implementación de **Estado Local**: Métodos `addLocal`, `removeLocal` y `updateLocal` para garantizar una respuesta instantánea de la UI sin recargas de red.
- **Componentes Administrativos**:
    - Desarrollo de los componentes `AdminCategories` y `AdminAllergens`.
    - Implementación de lógica de edición "en línea" y modales de confirmación para borrado.
- **UX/UI**:
    - Gestión de estados de carga (`loading signals`) para deshabilitar botones durante peticiones asíncronas.
    - Estilización de formularios con validaciones visuales y feedback de errores.
---

## [1.1.3] - 03/04/2026

### ✨ Nueva Funcionalidad – Gestión de Comentarios

### 🖥️ Backend
- Optimización de `CommentRepository` para la recuperación eficiente de feedback.
- Ajustes en `comments.py` para permitir la edición y moderación de reseñas.

### 🌐 Frontend
- Mejora visual del componente `CommentsList` para administradores.
- Implementación de lógica de edición en `CommentsEdit` para gestionar la visibilidad de las reseñas.

---

## [1.1.4] - 03/04/2026

### ✨ Nueva Funcionalidad – Gestión de Comentarios

### 🖥️ Backend
- Refactorización de `security.py` para mejorar la validación de tokens JWT.
- Actualización de `AuthRepository` para la gestión de perfiles de usuario.

### 🌐 Frontend
- **Navbar Dinámico**: Simplificación de la lógica de navegación basada en el rol del usuario (`isAdmin`).
- **Gestión de Usuarios**: Implementación del componente `AdminUsers` para el control de cuentas desde el panel de administración.
- **Seguridad**: Optimización de `AuthInterceptor` para adjuntar tokens automáticamente en las peticiones al API.

---

## [1.1.5] - 03/04/2026

### ✨ Nueva Funcionalidad – 🍽️ Catálogo de Productos

### 🖥️ Backend
- Definición del modelo `Product` con soporte para precios, categorías y alérgenos asociados.
- Implementación de `ProductRepository` para la gestión avanzada de la carta.
- Router `/products` habilitado para filtrado y administración de inventario.

### 🌐 Frontend
- **Carta Digital**: Creación del componente de visualización de productos para clientes.
- **File Service**: Sistema de gestión de imágenes para los platos y bebidas.
- **Integración**: Vinculación dinámica de productos con sus respectivas categorías y etiquetas de alérgenos.

---

## [1.1.6] - 03/04/2026

### ✨ Modificación – 📖 Filosofía y About Us

### 🖥️ Backend
- Implementación de `PhilosophyRepository` para la gestión dinámica de textos corporativos.
- Router `/philosophies` habilitado para la consulta de valores y misión del restaurante.

### 🌐 Frontend
- **Página de Empresa**: Creación del componente `AboutUsPage` con diseño adaptativo.
- **Gestión de Contenido**: Integración de `PhilosophyService` para alimentar las secciones de historia y valores desde la base de datos.

---

## [1.1.7] - 03/04/2026

### ✨ Nueva Funcionalidad – 📅 Sistema de Reservas y Gestión Operativa

### 🖥️ Backend
- Implementación de `ReservationRepository` con lógica de disponibilidad por turnos.
- Creación de `SettingsRepository` para la gestión de horarios y días especiales.
- Registro de servicios y routers para la gestión automatizada de reservas.

### 🌐 Frontend
- **Reservations Page**: Nueva interfaz pública para la creación de reservas con validación de fechas.
- **Admin Dashboard & Sidebar**: Rediseño de la navegación interna para administradores.
- **Shifts & Special Days**: Módulos para que el administrador configure turnos y cierres temporales.
- **Core**:
    - Estandarización de repositorios mediante `BaseRepository`.
    - Refactorización de interfaces globales para mejorar la tipado en TypeScript.

## [1.2.0] - 21/04/2026

### ✨ Refactorización – Sistema de Roles y Optimizaciones de Seguridad

### 🖥️ Backend
- **Middleware** (`security.py`): Migración de un sistema de roles plano a una jerarquía multinivel (RBAC). 
- **Roles**: Introducción del rol `leader` con permisos específicos de gestión operativa.
- **Autorización**: Refactorización de las dependencias de seguridad (`admin_required`, `leader_or_admin`, `employee_or_admin`) para garantizar el Principio de Menor Privilegio en el acceso a los endpoints.
- **Modelos**: Introducción de la clase base _AuditBase_ mediante Pydantic para el control de trazabilidad para metadatos de auditoria.
### 🌐 Frontend
- **Auditoría**: Actualización de interfaces y servicios para soportar los nuevos campos de trazabilidad (`AuditBase`), permitiendo mostrar quién y cuándo realizó modificaciones. 
- **Seguridad**: Adaptación del `AuthGuard` y `AuthService` para reconocer el nuevo rol leader y aplicar restricciones de navegación basadas en permisos. 
- **Gestión Operativa**: Refactorización de los módulos de reservas y usuarios para inyectar los metadatos de auditoría en los formularios.
- **UI/UX**: Ajustes de estilo en el sidebar y vistas públicas para mejorar la experiencia móvil y la consistencia visual del sistema.


## [1.3.0] - 02/05/2026

### ✨ Gestión de Tablas, Refactorización de UI y Optimización de Negocio

### 🖥️ Backend
- **Core Refactor**: Refactorización profunda del backend para mejorar la modularidad y el rendimiento de las consultas.
- **Seguridad**: Optimización de los validadores de tokens y gestión de sesiones de usuario.
- **Modelado**: Ajuste en los esquemas de datos para soportar la eliminación de etiquetas de dieta específicas (lactose free).

- **Modelos**: Introducción de la clase base _AuditBase_ mediante Pydantic para el control de trazabilidad para metadatos de auditoria.
### 🌐 Frontend
- **Arquitectura de Componentes (Generics):**: Implementación de un sistema de Tablas Genéricas reutilizables para optimizar el código en todas las vistas administrativas.
- **Módulo de Reservas:**: Rediseño completo de la Vista de Reservas para mejorar la legibilidad y gestión de estados. Optimización del flujo de envío de datos en el formulario de reserva.
- **UI/UX & Estilos**:
  - **Dashboard**: Mejora visual y funcional de los botones de acción rápida en el panel de control.
  - **Multimedia**: Actualización masiva de recursos gráficos y optimización de carga de imágenes.
  - **Carousel**: Reestructuración del componente carrusel para solucionar conflictos de renderizado y mejorar la fluidez de las transiciones.
- **Mantenimiento**:
  - Resolución de conflictos en dependencias de **npm** y limpieza de paquetes obsoletos.
  - Eliminación de la opción **"Lactose Free"** de los filtros y visualizaciones siguiendo las nuevas directrices de la carta.