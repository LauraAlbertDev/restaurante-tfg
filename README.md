# 🍽️ GastroManager - Restaurant Management System

<div align="center">

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)

</div>

<details>
<summary>🇪🇸 Español</summary>

## 🍽️ GastroManager

Sistema full stack para la gestión integral de un restaurante. Permite administrar productos, categorías, usuarios, pedidos, mesas, reservas y la comunicación con clientes desde una plataforma centralizada.

El objetivo del proyecto es optimizar la gestión interna del restaurante y mejorar la experiencia de empleados y administradores.

---

## 🚀 Tecnologías utilizadas

- **Frontend:** Angular  
- **Backend:** FastAPI  
- **Base de datos:** MariaDB  
- **Orquestación:** Docker + Docker Compose  

---

## 📦 Arquitectura del sistema

- Angular consume la API REST  
- FastAPI gestiona la lógica de negocio  
- MariaDB almacena los datos  
- Docker Compose orquesta los servicios  

---

## 📋 Requisitos

- Docker Desktop o Docker Engine + Docker Compose  
- Puertos libres:
  - 80 (Frontend)
  - 8500 (Backend)
  - 3306 (Database)

---

## ▶️ Instalación y ejecución

```bash
cd restaurante-tfg

docker compose down
docker compose up --build -d
```

Verificar servicios:

```bash
docker compose ps
```

---

## 🌐 Acceso a la aplicación

- Frontend:
```
http://localhost
```

- Backend (Swagger):
```
http://localhost:8500/docs
```

- Base de datos:
```
localhost:3306
```

---

## 🍴 Funcionalidades

### 🧑‍🍳 Frontend (Angular)

- Página de inicio  
- Menú con filtros:
  - Vegano
  - Vegetariano
  - Sin lactosa
  - Sin gluten
- Sidebar con buscador y categorías  
- Página “Nosotros”  
- Página de contacto con formulario conectado a base de datos  
- Sistema de login  
- Gestión de reservas de clientes  
- Gestión de mesas  
- Asignación de mesas a reservas  
- Gestión de pedidos asociados a mesas  

---

## 👨‍💼 Roles

### Empleados
- Editar y archivar productos  

### Administradores
- Gestión de usuarios (CRUD)  
- Gestión de categorías (CRUD)  
- Gestión de comentarios  
- Dashboard con:
  - Productos activos / archivados / sin stock  
  - Estadísticas de productos  
  - Categorías totales  
  - Acciones rápidas  

---

## 📈 Sistema de reservas y mesas

El sistema incluye:

- Registro de reservas de clientes  
- Gestión de disponibilidad de mesas  
- Asignación de mesas según disponibilidad  
- Asociación de pedidos a mesas para gestión interna  

---

## 👨‍🎓 Autor

Laura Albert  
Trabajo de Fin de Grado (TFG)

---

## 🛑 Detener sistema

```bash
docker compose down
```

---

</details>

<details>
<summary>🇬🇧 English</summary>

## 🍽️ GastroManager

Full stack restaurant management system developed as a Final Degree Project. It allows managing products, categories, users, orders, tables, reservations, and customer communication through a centralized platform.

The goal of the project is to improve internal restaurant management and enhance the experience for both staff and administrators.

---

## 🚀 Technologies

- **Frontend:** Angular  
- **Backend:** FastAPI  
- **Database:** MariaDB  
- **Orchestration:** Docker + Docker Compose  

---

## 📦 System Architecture

- Angular consumes REST API  
- FastAPI handles business logic  
- MariaDB stores all data  
- Docker Compose orchestrates services  

---

## 📋 Requirements

- Docker Desktop or Docker Engine + Docker Compose  
- Free ports:
  - 80 (Frontend)
  - 8500 (Backend)
  - 3306 (Database)

---

## ▶️ Setup

```bash
cd restaurante-tfg

docker compose down
docker compose up --build -d
```

Check services:

```bash
docker compose ps
```

---

## 🌐 Access

- Frontend:
```
http://localhost
```

- Backend (Swagger):
```
http://localhost:8500/docs
```

- Database:
```
localhost:3306
```

---

## 🍴 Features

### Frontend (Angular)

- Home page  
- Menu with filters:
  - Vegan
  - Vegetarian
  - Lactose-free
  - Gluten-free
- Sidebar search + categories  
- About page  
- Contact form connected to database  
- Login system  
- Reservation management  
- Table management  
- Table assignment based on availability  
- Orders linked to tables  

---

## 👨‍💼 Roles

### Employees
- Edit and archive products  

### Administrators
- User management (CRUD)  
- Category management (CRUD)  
- Comment management  
- Dashboard with:
  - Active / archived / out-of-stock products  
  - Product statistics  
  - Total categories  
  - Quick actions  

---

## 📈 Reservation & Table System

The system includes:

- Customer reservations  
- Table availability management  
- Table assignment system  
- Order-to-table linking for internal operations  

---

## 👨‍🎓 Author

Laura Albert  
Final Degree Project (FPD)

---

## 🛑 Stop system

```bash
docker compose down
```

---

</details>