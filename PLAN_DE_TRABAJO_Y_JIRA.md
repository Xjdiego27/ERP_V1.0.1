# 📋 1.4 PLAN DE TRABAJO — Prácticas Pre-Profesionales

**Proyecto:** Sistema Intranet/ERP Corporativo  
**Practicante:** Jorge Diego Fernández Villegas  
**Periodo:** Marzo 2026 – Junio 2026 (4 meses)  
**Stack Tecnológico:** FastAPI · React 19 · MariaDB · MongoDB · Socket.IO · Nginx · ZKTeco  

---

## TABLA — PLAN DE TRABAJO

| N° | Objetivos | Actividades | Metas | Responsable | Periodo |
|----|-----------|-------------|-------|-------------|---------|
| **FASE 1 — ANÁLISIS DE REQUERIMIENTOS** |||||
| 1.1 | Diagnosticar los procesos operativos actuales de la empresa e identificar oportunidades de transformación digital. | Reuniones con las áreas de Administración, RRHH, Comercial, Operaciones y Control de Calidad para relevar procesos manuales existentes (planillas, control de asistencia, gestión de tickets, comunicación interna). | Documento de Especificación de Requerimientos de Software (ERS) con al menos 8 módulos funcionales identificados. | Jorge Diego Fernández Villegas | Semana 1 – Semana 2 (Marzo 2026) |
| 1.2 | Definir la arquitectura del sistema y seleccionar las tecnologías adecuadas para la solución. | Evaluación comparativa de frameworks backend (FastAPI vs Django vs Flask), frontend (React vs Vue vs Angular) y motores de base de datos (MariaDB para datos relacionales, MongoDB para datos no estructurados). Diseño de la arquitectura cliente-servidor con Reverse Proxy (Nginx). | Documento de Arquitectura de Software (DAS) que defina la topología: Frontend SPA → Nginx (puerto 80) → Backend API REST (puerto 4000) + Chat WebSocket (puerto 4001) → MariaDB + MongoDB. | Jorge Diego Fernández Villegas | Semana 2 – Semana 3 (Marzo 2026) |
| 1.3 | Diseñar la matriz de roles, permisos y políticas de seguridad del sistema. | Análisis de los perfiles de usuario: Superadministrador, Administrador, Jefe de Área, RRHH y Empleado. Definición de la matriz RBAC (Role-Based Access Control) y políticas de autenticación (JWT con HS256, hash Argon2id, bloqueo por intentos fallidos). | Matriz de roles y permisos documentada con 5 roles diferenciados y al menos 15 permisos granulares asignados a rutas protegidas. | Jorge Diego Fernández Villegas | Semana 3 (Marzo 2026) |
| **FASE 2 — DISEÑO DE BASE DE DATOS Y PROTOTIPADO** |||||
| 2.1 | Diseñar e implementar el modelo relacional de la base de datos principal (MariaDB). | Modelado entidad-relación de las tablas: `acceso`, `personal`, `empresa`, `contrato`, `contacto`, `area`, `cargo`, `documento`, `afp`, `equipo`, `chip`, `ticket`, `anexos`, `asignacion_emp`, `rol_accs`, `permiso`, `estado_accs`, entre otras. Creación de índices, llaves foráneas y constraints de integridad referencial. | Esquema relacional con más de 20 tablas normalizadas (3FN) desplegadas en MariaDB 10.4 con script SQL versionado (`erp.sql`). | Jorge Diego Fernández Villegas | Semana 3 – Semana 4 (Marzo 2026) |
| 2.2 | Diseñar e implementar el esquema NoSQL en MongoDB para datos de alta escritura y lectura flexible. | Definición de colecciones: `asistencia`, `menus`, `eventos`, `justificaciones`, `auditoria`, `notificaciones_tickets`, `saludos_cumpleanos`, `eventos2`, `evento_mujeres`. Creación de índices compuestos para consultas por fecha y tipo de registro. | 9 colecciones operativas en MongoDB (`erp_nosql`) + 1 base de archivo (`erp_sql`) con índices optimizados y script de inicialización (`crear_indices_mongo.py`). | Jorge Diego Fernández Villegas | Semana 4 (Marzo 2026) |
| 2.3 | Diseñar los prototipos de interfaz de usuario y la estructura de navegación. | Creación de wireframes para los módulos principales: Login multi-empresa, Dashboard informativo, Panel RRHH, Chat en tiempo real, Sistema de Tickets, Control de Asistencias. Diseño del sistema de componentes reutilizables. | Prototipado de al menos 12 vistas principales con flujos de navegación validados por las áreas involucradas. | Jorge Diego Fernández Villegas | Semana 4 – Semana 5 (Marzo – Abril 2026) |
| **FASE 3 — DESARROLLO BACKEND (Python + FastAPI)** |||||
| 3.1 | Implementar el módulo de autenticación y autorización con seguridad empresarial. | Desarrollo de endpoints `/auth/login`, `/auth/seleccionar-empresa`, `/auth/verificar` con validación de credenciales via SQLAlchemy ORM, hash de contraseñas con Argon2id, generación de tokens JWT (HS256), middleware de verificación de token, bloqueo automático tras 3 intentos fallidos y soporte multi-empresa. | API de autenticación funcional con tokens JWT, hash Argon2id, bloqueo por intentos y selección dinámica de empresa. Archivos: `br_auth.py`, `auth_token.py`, `helpers.py`, schemas Pydantic. | Jorge Diego Fernández Villegas | Semana 5 – Semana 6 (Abril 2026) |
| 3.2 | Desarrollar la API REST del módulo de Recursos Humanos (RRHH). | Implementación de CRUD completo de personal, contratos, contactos, áreas, cargos, documentos y anexos. Endpoints de catálogos (`rutas_catalogos.py`), historial laboral (`rutas_historial.py`), gestión de passwords (`rutas_password.py`) y auditoría de cambios en MongoDB (`auditoria.py`). | 6 archivos de rutas para RRHH (`rutas_personal.py`, `rutas_catalogos.py`, `rutas_historial.py`, `rutas_documentos.py`, `rutas_password.py`, `rutas_horario.py`) con más de 30 endpoints operativos. | Jorge Diego Fernández Villegas | Semana 6 – Semana 8 (Abril 2026) |
| 3.3 | Implementar los módulos del Panel Informativo y Cumpleaños. | Desarrollo de endpoints para gestión de menú semanal, eventos corporativos y cumpleaños del mes con persistencia en MongoDB (Motor async). Sistema de saludos de cumpleaños con recopilación, archivo y limpieza automática periódica en background (`tarea_limpieza_periodica`). | 3 módulos backend operativos: `rutas_menu.py`, `rutas_evento.py`, `rutas_cumpleanos.py` + `rutas_saludos_cumpleanos.py` con tarea async de limpieza automática. | Jorge Diego Fernández Villegas | Semana 8 – Semana 9 (Abril – Mayo 2026) |
| 3.4 | Desarrollar el módulo de Tickets de soporte interno. | Implementación de sistema de tickets con estados (abierto, en proceso, cerrado, reapertura), asignación a responsables, notificaciones en MongoDB, sistema de valoración y generación de plantillas documentales (`rutas_plantillas.py` con python-docx y ReportLab). | Módulo de tickets con flujo completo de estados, notificaciones persistentes y generación de reportes en Word/PDF. Archivos: `rutas_tickets.py`, `rutas_notificaciones.py`, `rutas_plantillas.py`. | Jorge Diego Fernández Villegas | Semana 9 – Semana 10 (Mayo 2026) |
| 3.5 | Desarrollar los módulos de Inventario de Equipos y Líneas Corporativas (Chips). | Implementación de CRUD de equipos tecnológicos con especificaciones de almacenamiento, y gestción de líneas celulares corporativas con asignación a personal. | 2 módulos operativos: `rutas_equipo.py` (inventario con relación a `almacenamiento` y `tipo_disco`) y `rutas_chip.py` (líneas corporativas con asignación). | Jorge Diego Fernández Villegas | Semana 10 – Semana 11 (Mayo 2026) |
| 3.6 | Implementar el módulo de Asistencias con integración de dispositivo biométrico ZKTeco. | Desarrollo de servicio de sincronización de marcajes desde reloj biométrico ZKTeco vía protocolo ZK (librería pyzk) hacia MongoDB. Implementación de endpoint de consulta de asistencias, generación de reportes, gestión de justificaciones y gestión de horarios por área. | Script de sincronización (`HUELLERO/Asistencias.py`) con operaciones bulk `UpdateOne` hacia MongoDB, endpoints de consulta y justificación (`rutas_asistencia.py`) y gestión de horarios (`rutas_horario.py`). | Jorge Diego Fernández Villegas | Semana 11 – Semana 12 (Mayo 2026) |
| 3.7 | Desarrollar el módulo de Permisos laborales. | Implementación de flujo de solicitud, aprobación y rechazo de permisos con lógica de negocio en capa de servicios (`servicios/permiso_service.py`), separación de rutas y servicio siguiendo principio de responsabilidad única. | Módulo completo: `rutas_permisos.py` + `servicios/permiso_service.py` con flujo de aprobación multi-nivel y registro de auditoría. | Jorge Diego Fernández Villegas | Semana 12 (Mayo 2026) |
| **FASE 4 — DESARROLLO BACKEND CHAT (Servidor Independiente)** |||||
| 4.1 | Diseñar e implementar el servidor de Chat en tiempo real como microservicio independiente. | Desarrollo de servidor FastAPI + Socket.IO en puerto 4001 con arquitectura modular: `chat_config.py` (configuración), `chat_db.py` (conexiones), `chat_auth.py` (autenticación JWT compartida), `chat_socket_events.py` (eventos WebSocket), `chat_routes.py` (endpoints REST). Implementación de sala general, mensajes privados, grupos, envío de stickers, zumbidos, indicador "escribiendo" y gestión de usuarios conectados. | Microservicio de chat operativo con WebSocket bidireccional, soporte para mensajes 1-a-1, sala general y grupos, persistencia en MongoDB con 4 colecciones (`mensajes`, `msg_general`, `msg_grupo`, `grupos`). | Jorge Diego Fernández Villegas | Semana 13 – Semana 14 (Mayo – Junio 2026) |
| **FASE 5 — DESARROLLO FRONTEND (React 19 + Vite)** |||||
| 5.1 | Configurar el proyecto frontend con arquitectura escalable basada en componentes. | Inicialización del proyecto con Vite 7, React 19, React Router DOM 7 y TanStack React Query 5. Configuración de estructura modular: `/components` (reutilizables), `/modules` (vistas principales), `/servicios` (API calls), `/hooks` (lógica compartida), `/styles` (CSS modular), `/data` (catálogos estáticos), `/utils` (utilidades). | Proyecto frontend configurado con más de 20 componentes, 15+ módulos de vista, servicios API centralizados y hooks personalizados. | Jorge Diego Fernández Villegas | Semana 14 – Semana 15 (Junio 2026) |
| 5.2 | Implementar el módulo de Login y gestión de sesión en el frontend. | Desarrollo de pantalla de Login con selección de empresa, manejo de tokens JWT en memoria, interceptor de peticiones con autenticación automática, flujo de cambio de contraseña obligatorio al primer inicio, y verificación de sesión persistente (`auth.js`). | Módulo de Login responsivo con soporte multi-empresa, manejo seguro de JWT, redirección automática y UX de error con mensajes contextuales. | Jorge Diego Fernández Villegas | Semana 15 (Junio 2026) |
| 5.3 | Desarrollar el Dashboard informativo, módulos de RRHH, Tickets, Equipos, Chips y Asistencias en el frontend. | Implementación de vistas: `Dashboard.jsx`, `DashboardHome.jsx`, `RRHH.jsx`, `PersonalDetalle.jsx`, `IngresarTicket.jsx`, `EquiposCrear.jsx`, `EquiposAsignar.jsx`, `Chips.jsx`, `AsistenciasGeneral.jsx`, `HorariosRRHH.jsx`, `GestionPermisos.jsx`, `MiPerfil.jsx`, `CambioPassword.jsx`. Componentes: `Header.jsx`, `Sidebar.jsx`, `AsideContainer.jsx`, `PageContent.jsx`, `CompanyPanel.jsx`, `UserMenu.jsx`, `ErrorBoundary.jsx`. | Más de 15 módulos de vista funcionales con navegación protegida por roles, componentes reutilizables y estado global manejado con React Query. | Jorge Diego Fernández Villegas | Semana 15 – Semana 16 (Junio 2026) |
| 5.4 | Implementar la interfaz del Chat en tiempo real con Socket.IO Client. | Desarrollo de componentes: `ChatPanel.jsx` (lista de contactos y conversaciones), `ChatVentana.jsx` (ventana de mensaje flotante), `ChatSala.jsx` (sala general), `StickerPicker.jsx` (selector de stickers), `CrearGrupoModal.jsx`, `ModalImagen.jsx`. Integración con `socket.io-client` para eventos en tiempo real. | Interfaz de chat completamente funcional con múltiples ventanas simultáneas, indicador de escritura, stickers, vista previa de imágenes y notificaciones sonoras. | Jorge Diego Fernández Villegas | Semana 16 – Semana 17 (Junio 2026) |
| **FASE 6 — PRUEBAS, DESPLIEGUE E INTEGRACIÓN** |||||
| 6.1 | Configurar la infraestructura de despliegue con Nginx como Reverse Proxy. | Configuración de Nginx como punto de entrada unificado: servicio de archivos estáticos (Vite build), proxy inverso para API REST (`/api/` → puerto 4000), proxy para Chat REST (`/chat/` → puerto 4001), upgrade WebSocket (`/socket.io/` → puerto 4001). Configuración de compresión gzip, headers de seguridad (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy), caché de assets y timeouts optimizados. | Archivo `nginx.conf` operativo con proxy reverso unificado, headers de seguridad, caché de assets estáticos (1 año), soporte WebSocket y log de acceso/error. Script de arranque automatizado (`start.ps1`). | Jorge Diego Fernández Villegas | Semana 17 (Junio 2026) |
| 6.2 | Ejecutar pruebas funcionales, de integración y de rendimiento del sistema completo. | Pruebas de los 8 módulos principales: Login (autenticación, bloqueo, multi-empresa), RRHH (CRUD completo), Tickets (flujo de estados), Chat (mensajería en tiempo real), Panel Informativo (carga de contenido), Asistencias (sincronización biométrica), Equipos (inventario), Chips (líneas corporativas). Validación de middleware de rendimiento (medición de tiempos de respuesta con clasificación OK/LENTO/CRITICO). | 100% de módulos validados funcionalmente. Middleware de diagnóstico con métricas de rendimiento (`X-Process-Time-Ms`). Corrección de bugs críticos detectados. | Jorge Diego Fernández Villegas | Semana 17 – Semana 18 (Junio 2026) |
| 6.3 | Documentar técnicamente el sistema y entregar el proyecto en producción. | Elaboración de documentación técnica completa (`DOCUMENTACION_ERP.md`) con guías paso a paso de Backend y Frontend, diagramas de arquitectura, instrucciones de despliegue y configuración. Capacitación a usuarios finales y entrega formal del sistema. | Documentación técnica superior a 1500 líneas, sistema desplegado en red corporativa LAN con acceso desde cualquier dispositivo (CORS con regex para redes privadas 192.168.x.x / 10.x.x.x / 172.16-31.x.x). | Jorge Diego Fernández Villegas | Semana 18 (Junio 2026) |

---
---

# 🏗️ ESTRUCTURA JIRA — Proyecto ERP Intranet Corporativo

## Información del Proyecto

| Campo | Valor |
|-------|-------|
| **Clave del Proyecto** | ERP-INTRANET |
| **Nombre** | Sistema Intranet/ERP Corporativo |
| **Tipo de Proyecto** | Software (Scrum) |
| **Líder del Proyecto** | Jorge Diego Fernández Villegas |
| **Fecha de Inicio** | 02/03/2026 |
| **Fecha de Fin** | 19/06/2026 |
| **Repositorio** | Git — Sistema login V1.0.1 |

---

## Stack Tecnológico Registrado

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| **Frontend** | React | 19.2.0 | SPA — Interfaz de usuario reactiva |
| **Bundler** | Vite | 7.2.4 | Build tool y servidor de desarrollo HMR |
| **Routing** | React Router DOM | 7.13.0 | Navegación SPA con rutas protegidas |
| **State Management** | TanStack React Query | 5.90.21 | Caché de servidor, fetching y sincronización |
| **Icons** | FontAwesome | 7.2.0 | Iconografía corporativa SVG |
| **WebSocket Client** | Socket.IO Client | 4.8.3 | Comunicación bidireccional en tiempo real |
| **Backend API** | FastAPI | 0.128.2 | API REST asíncrona de alto rendimiento |
| **Runtime** | Python | 3.10+ | Lenguaje de programación del backend |
| **ASGI Server** | Uvicorn | 0.40.0 | Servidor ASGI para FastAPI |
| **ORM** | SQLAlchemy | 2.0.46 | Mapeo objeto-relacional con automap |
| **Validation** | Pydantic | 2.12.5 | Validación de datos y serialización |
| **Auth** | python-jose | 3.5.0 | Firma y verificación de tokens JWT (HS256) |
| **Hashing** | Argon2-cffi | 25.1.0 | Hash de contraseñas (Argon2id) |
| **MongoDB Driver (async)** | Motor | 3.7.1 | Driver asíncrono MongoDB para FastAPI |
| **MongoDB Driver (sync)** | PyMongo | 4.16.0 | Driver síncrono para scripts de sincronización |
| **Document Gen** | python-docx + ReportLab | 1.1.2 / 4.4.10 | Generación de documentos Word y PDF |
| **WebSocket Server** | python-socketio | — | Servidor Socket.IO para chat en tiempo real |
| **Biometrics** | pyzk | — | Protocolo ZK para reloj biométrico ZKTeco |
| **DB Relacional** | MariaDB | 10.4.32 | Base de datos principal (datos estructurados) |
| **DB NoSQL** | MongoDB | — | Datos de alta escritura (asistencias, chat, auditoría) |
| **Reverse Proxy** | Nginx | — | Proxy inverso, servicio estático, seguridad HTTP |
| **Linting** | ESLint | 9.39.1 | Análisis estático de código JavaScript/React |

---

## EPICS (Épicas)

### 🔵 EPIC-01: Infraestructura y Arquitectura Base
> Configurar el entorno de desarrollo, las bases de datos y la arquitectura del sistema.

### 🟢 EPIC-02: Autenticación y Seguridad
> Implementar el sistema de login multi-empresa con JWT, Argon2id y RBAC.

### 🟣 EPIC-03: Módulo RRHH
> Desarrollar la gestión completa de personal, contratos, documentos y catálogos.

### 🟠 EPIC-04: Panel Informativo
> Implementar el dashboard con menú semanal, eventos y cumpleaños.

### 🔴 EPIC-05: Sistema de Tickets
> Desarrollar el flujo completo de soporte interno con tickets.

### 🟡 EPIC-06: Chat en Tiempo Real
> Implementar el microservicio de chat con Socket.IO y MongoDB.

### 🟤 EPIC-07: Control de Asistencias
> Integrar el dispositivo biométrico ZKTeco con MongoDB y el sistema web.

### ⚪ EPIC-08: Inventario de Equipos y Chips
> Gestionar equipos tecnológicos y líneas celulares corporativas.

### 🔵 EPIC-09: Permisos Laborales
> Implementar solicitud y aprobación de permisos con servicio de negocio.

### ⚫ EPIC-10: Despliegue y Documentación
> Configurar Nginx, pruebas finales y documentación técnica.

---

## HISTORIAS DE USUARIO Y TAREAS (User Stories & Tasks)

---

### 🔵 EPIC-01: Infraestructura y Arquitectura Base

#### `ERP-001` — Configuración del entorno de desarrollo
| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Prioridad** | 🔴 Highest |
| **Sprint** | Sprint 1 |
| **Story Points** | 5 |
| **Etiquetas** | `infra`, `setup`, `devops` |
| **Descripción** | Como desarrollador, necesito configurar el entorno de desarrollo con Python 3.10+, Node.js, MariaDB, MongoDB y las dependencias del proyecto para comenzar el desarrollo. |

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-001-1 | Instalar Python 3.10+, crear virtualenv y ejecutar `pip install -r requirements.txt` | ✅ Done |
| ERP-001-2 | Instalar Node.js, ejecutar `npm install` en `erp-poo/` | ✅ Done |
| ERP-001-3 | Configurar MariaDB 10.4 en XAMPP, crear BD `erp` | ✅ Done |
| ERP-001-4 | Instalar MongoDB, crear BD `erp_nosql` | ✅ Done |
| ERP-001-5 | Crear archivos `.env` para backend y chat_backend | ✅ Done |

---

#### `ERP-002` — Diseño del modelo de base de datos relacional
| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Prioridad** | 🔴 Highest |
| **Sprint** | Sprint 1 |
| **Story Points** | 8 |
| **Etiquetas** | `database`, `mariadb`, `modeling` |
| **Descripción** | Como arquitecto de datos, necesito diseñar y crear el esquema relacional normalizado (3FN) con más de 20 tablas para soportar todos los módulos del ERP. |

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-002-1 | Diseñar modelo E-R con tablas: `acceso`, `personal`, `empresa`, `contrato`, `contacto`, `area`, `cargo` | ✅ Done |
| ERP-002-2 | Crear tablas de soporte: `afp`, `documento`, `anexos`, `estado_accs`, `rol_accs`, `permiso` | ✅ Done |
| ERP-002-3 | Crear tablas de inventario: `equipo`, `almacenamiento`, `tipo_disco`, `chip` | ✅ Done |
| ERP-002-4 | Crear tablas de tickets: `ticket`, `estado_ticket`, `tipo_ticket` | ✅ Done |
| ERP-002-5 | Establecer FK, índices y constraints. Exportar script `erp.sql` | ✅ Done |

---

#### `ERP-003` — Diseño del esquema NoSQL (MongoDB)
| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Prioridad** | 🟠 High |
| **Sprint** | Sprint 1 |
| **Story Points** | 5 |
| **Etiquetas** | `database`, `mongodb`, `nosql` |
| **Descripción** | Como arquitecto de datos, necesito crear las colecciones MongoDB para datos de alta escritura: asistencias, chat, auditoría, eventos y notificaciones. |

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-003-1 | Crear colecciones: `asistencia`, `justificaciones`, `auditoria` | ✅ Done |
| ERP-003-2 | Crear colecciones: `menus`, `eventos`, `eventos2`, `evento_mujeres` | ✅ Done |
| ERP-003-3 | Crear colecciones de chat: `mensajes`, `msg_general`, `msg_grupo`, `grupos` | ✅ Done |
| ERP-003-4 | Crear colecciones: `notificaciones_tickets`, `saludos_cumpleanos` | ✅ Done |
| ERP-003-5 | Ejecutar `crear_indices_mongo.py` para índices compuestos | ✅ Done |

---

### 🟢 EPIC-02: Autenticación y Seguridad

#### `ERP-004` — Implementar Login multi-empresa con JWT
| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Prioridad** | 🔴 Highest |
| **Sprint** | Sprint 2 |
| **Story Points** | 13 |
| **Etiquetas** | `auth`, `jwt`, `security`, `backend` |
| **Descripción** | Como usuario del sistema, necesito autenticarme con mis credenciales, seleccionar la empresa a la que pertenezco y obtener un token JWT para acceder a los recursos protegidos. |

**Criterios de Aceptación:**
- ✅ Login con usuario + password + empresa
- ✅ Contraseñas hasheadas con Argon2id (`$argon2id$v=19$m=65536,t=3,p=4`)
- ✅ Bloqueo automático tras 3 intentos fallidos (`INTENT_LOGIN`)
- ✅ Token JWT firmado con HS256, expiración configurable
- ✅ Payload incluye: `sub`, `id_accs`, `id_emp`, `rol`, `id_personal`, `nombre`
- ✅ Endpoint `/auth/verificar` para validar sesión activa
- ✅ Detección de `RESET_PASS` para forzar cambio de contraseña

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-004-1 | Implementar `br_auth.py` — validación de credenciales con Argon2 | ✅ Done |
| ERP-004-2 | Implementar `auth_token.py` — generación y verificación JWT | ✅ Done |
| ERP-004-3 | Crear schemas Pydantic: `LoginRequest`, `SeleccionEmpresaRequest` | ✅ Done |
| ERP-004-4 | Implementar endpoints: `POST /auth/login`, `POST /auth/seleccionar-empresa`, `GET /auth/verificar` | ✅ Done |
| ERP-004-5 | Implementar `helpers.py` — `construir_respuesta_usuario()` | ✅ Done |
| ERP-004-6 | Configurar CORS con regex para redes LAN privadas | ✅ Done |
| ERP-004-7 | Middleware unificado de rendimiento + captura de errores 500 | ✅ Done |

---

#### `ERP-005` — Implementar Login en Frontend (React)
| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Prioridad** | 🔴 Highest |
| **Sprint** | Sprint 2 |
| **Story Points** | 8 |
| **Etiquetas** | `auth`, `frontend`, `react`, `ux` |
| **Descripción** | Como usuario, necesito una pantalla de Login intuitiva que me permita seleccionar mi empresa, ingresar credenciales y ser redirigido al Dashboard. |

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-005-1 | Crear `Login.jsx` — formulario con selector de empresa | ✅ Done |
| ERP-005-2 | Implementar `auth.js` — manejo de token JWT en memoria | ✅ Done |
| ERP-005-3 | Configurar rutas protegidas con React Router DOM | ✅ Done |
| ERP-005-4 | Implementar flujo de cambio de contraseña obligatorio (`CambioPassword.jsx`) | ✅ Done |

---

### 🟣 EPIC-03: Módulo RRHH

#### `ERP-006` — CRUD completo de Personal
| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Prioridad** | 🟠 High |
| **Sprint** | Sprint 3 |
| **Story Points** | 13 |
| **Etiquetas** | `rrhh`, `crud`, `backend`, `frontend` |
| **Descripción** | Como jefe de RRHH, necesito gestionar la información completa de los empleados: datos personales, contratos, contactos, documentos y anexos laborales. |

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-006-1 | Backend: `rutas_personal.py` — CRUD de empleados con filtros por empresa/área | ✅ Done |
| ERP-006-2 | Backend: `rutas_catalogos.py` — endpoints de áreas, cargos, AFP, estados | ✅ Done |
| ERP-006-3 | Backend: `rutas_historial.py` — consulta de historial laboral | ✅ Done |
| ERP-006-4 | Backend: `rutas_documentos.py` — gestión de documentos y anexos | ✅ Done |
| ERP-006-5 | Frontend: `RRHH.jsx` — listado de personal con búsqueda y filtros | ✅ Done |
| ERP-006-6 | Frontend: `PersonalDetalle.jsx` — vista detallada del empleado | ✅ Done |
| ERP-006-7 | Backend: `auditoria.py` — registro de cambios en MongoDB | ✅ Done |

---

#### `ERP-007` — Gestión de Horarios
| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Prioridad** | 🟡 Medium |
| **Sprint** | Sprint 3 |
| **Story Points** | 5 |
| **Etiquetas** | `rrhh`, `horarios`, `backend`, `frontend` |
| **Descripción** | Como jefe de RRHH, necesito configurar y asignar horarios laborales a los empleados por área. |

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-007-1 | Backend: `rutas_horario.py` — CRUD de horarios | ✅ Done |
| ERP-007-2 | Frontend: `HorariosRRHH.jsx` — interfaz de gestión de horarios | ✅ Done |

---

### 🟠 EPIC-04: Panel Informativo

#### `ERP-008` — Dashboard con Menú, Eventos y Cumpleaños
| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Prioridad** | 🟠 High |
| **Sprint** | Sprint 4 |
| **Story Points** | 8 |
| **Etiquetas** | `dashboard`, `mongodb`, `backend`, `frontend` |
| **Descripción** | Como empleado, necesito ver en el Dashboard: el menú semanal del comedor, los próximos eventos corporativos y los cumpleaños del mes, para estar informado. |

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-008-1 | Backend: `rutas_menu.py` — CRUD de menú semanal (MongoDB) | ✅ Done |
| ERP-008-2 | Backend: `rutas_evento.py` — CRUD de eventos (MongoDB) | ✅ Done |
| ERP-008-3 | Backend: `rutas_cumpleanos.py` — consulta de cumpleaños del mes | ✅ Done |
| ERP-008-4 | Backend: `rutas_saludos_cumpleanos.py` — recopilación de saludos + limpieza automática | ✅ Done |
| ERP-008-5 | Frontend: `DashboardHome.jsx` — vista principal con secciones informativas | ✅ Done |
| ERP-008-6 | Frontend: `SeccionCumpleanos.jsx`, `CumpleanosModal.jsx` — interacción de cumpleaños | ✅ Done |

---

### 🔴 EPIC-05: Sistema de Tickets

#### `ERP-009` — Flujo completo de Tickets de soporte
| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Prioridad** | 🟠 High |
| **Sprint** | Sprint 4 |
| **Story Points** | 13 |
| **Etiquetas** | `tickets`, `workflow`, `backend`, `frontend` |
| **Descripción** | Como empleado, necesito crear tickets de soporte y seguir su estado. Como administrador, necesito gestionar, responder y cerrar tickets con valoración final. |

**Criterios de Aceptación:**
- ✅ Crear ticket con tipo, descripción y archivos adjuntos
- ✅ Flujo de estados: Abierto → En Proceso → Cerrado
- ✅ Reapertura de tickets cerrados (`ReaperturaModal.jsx`)
- ✅ Valoración del servicio al cerrar (`ValoracionModal.jsx`)
- ✅ Notificaciones persistentes en MongoDB
- ✅ Generación de plantillas Word/PDF (`rutas_plantillas.py`)

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-009-1 | Backend: `rutas_tickets.py` — CRUD + cambio de estados | ✅ Done |
| ERP-009-2 | Backend: `rutas_notificaciones.py` — sistema de notificaciones | ✅ Done |
| ERP-009-3 | Backend: `rutas_plantillas.py` — generación de documentos Word/PDF | ✅ Done |
| ERP-009-4 | Frontend: `IngresarTicket.jsx` — formulario de creación | ✅ Done |
| ERP-009-5 | Frontend: `ReaperturaModal.jsx`, `ValoracionModal.jsx` — modales de flujo | ✅ Done |

---

### 🟡 EPIC-06: Chat en Tiempo Real

#### `ERP-010` — Microservicio de Chat con Socket.IO
| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Prioridad** | 🟠 High |
| **Sprint** | Sprint 5 |
| **Story Points** | 21 |
| **Etiquetas** | `chat`, `websocket`, `socketio`, `microservice`, `real-time` |
| **Descripción** | Como empleado, necesito comunicarme en tiempo real con mis compañeros a través de un chat corporativo con mensajes privados, sala general y grupos. |

**Criterios de Aceptación:**
- ✅ Autenticación por token JWT al conectar WebSocket
- ✅ Sala general para todos los empleados
- ✅ Mensajes privados 1-a-1 con persistencia en MongoDB
- ✅ Grupos personalizados con modal de creación
- ✅ Envío de stickers (catálogo con `stickerCatalog.js`)
- ✅ Zumbidos (vibración/sonido de notificación)
- ✅ Indicador "escribiendo..." en tiempo real
- ✅ Lista de usuarios conectados/desconectados
- ✅ Soporte de subida de archivos (`uploads/`)

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-010-1 | Backend: `chat_config.py` — configuración de entorno | ✅ Done |
| ERP-010-2 | Backend: `chat_db.py` — conexiones MySQL + MongoDB | ✅ Done |
| ERP-010-3 | Backend: `chat_auth.py` — resolución de identidad desde JWT | ✅ Done |
| ERP-010-4 | Backend: `chat_socket_events.py` — eventos: connect, disconnect, msg, typing, zumbido | ✅ Done |
| ERP-010-5 | Backend: `chat_routes.py` — endpoints REST (contactos, historial, grupos) | ✅ Done |
| ERP-010-6 | Backend: `chat_server.py` — orquestador ASGI (Socket.IO + FastAPI) | ✅ Done |
| ERP-010-7 | Frontend: `ChatPanel.jsx` — panel lateral de contactos | ✅ Done |
| ERP-010-8 | Frontend: `ChatVentana.jsx` — ventana de conversación flotante | ✅ Done |
| ERP-010-9 | Frontend: `ChatSala.jsx` — sala de chat general | ✅ Done |
| ERP-010-10 | Frontend: `StickerPicker.jsx`, `CrearGrupoModal.jsx`, `ModalImagen.jsx` | ✅ Done |

---

### 🟤 EPIC-07: Control de Asistencias

#### `ERP-011` — Integración biométrica ZKTeco + MongoDB
| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Prioridad** | 🟠 High |
| **Sprint** | Sprint 5 |
| **Story Points** | 13 |
| **Etiquetas** | `biometrics`, `zkteco`, `mongodb`, `iot`, `backend`, `frontend` |
| **Descripción** | Como jefe de RRHH, necesito que las marcaciones del reloj biométrico se sincronicen automáticamente con el sistema para consultar asistencias, tardanzas y generar reportes. |

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-011-1 | Script: `HUELLERO/Asistencias.py` — sincronización ZKTeco → MongoDB vía protocolo ZK (UDP) | ✅ Done |
| ERP-011-2 | Backend: `rutas_asistencia.py` — consulta de asistencias con filtros | ✅ Done |
| ERP-011-3 | Backend: Gestión de justificaciones manuales en MongoDB | ✅ Done |
| ERP-011-4 | Frontend: `AsistenciasGeneral.jsx` — vista de asistencias con tabla y filtros | ✅ Done |
| ERP-011-5 | Frontend: `AsistenciaTab.jsx` — pestaña de asistencia en perfil | ✅ Done |

---

### ⚪ EPIC-08: Inventario de Equipos y Chips

#### `ERP-012` — Gestión de Equipos Tecnológicos
| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Prioridad** | 🟡 Medium |
| **Sprint** | Sprint 5 |
| **Story Points** | 8 |
| **Etiquetas** | `inventory`, `equipos`, `backend`, `frontend` |
| **Descripción** | Como administrador de TI, necesito registrar, asignar y rastrear los equipos tecnológicos de la empresa (PCs, laptops, monitores) con sus especificaciones de almacenamiento. |

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-012-1 | Backend: `rutas_equipo.py` — CRUD de equipos con relaciones a almacenamiento | ✅ Done |
| ERP-012-2 | Frontend: `EquiposCrear.jsx` — formulario de creación de equipos | ✅ Done |
| ERP-012-3 | Frontend: `EquiposAsignar.jsx` — asignación de equipos a personal | ✅ Done |

---

#### `ERP-013` — Gestión de Líneas Corporativas (Chips)
| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Prioridad** | 🟡 Medium |
| **Sprint** | Sprint 5 |
| **Story Points** | 5 |
| **Etiquetas** | `chips`, `telecom`, `backend`, `frontend` |
| **Descripción** | Como administrador, necesito gestionar las líneas celulares corporativas y su asignación a empleados. |

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-013-1 | Backend: `rutas_chip.py` — CRUD de líneas corporativas | ✅ Done |
| ERP-013-2 | Frontend: `Chips.jsx` — interfaz de gestión de chips | ✅ Done |

---

### 🔵 EPIC-09: Permisos Laborales

#### `ERP-014` — Flujo de solicitud y aprobación de permisos
| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Prioridad** | 🟡 Medium |
| **Sprint** | Sprint 6 |
| **Story Points** | 8 |
| **Etiquetas** | `permisos`, `workflow`, `service-layer`, `backend`, `frontend` |
| **Descripción** | Como empleado, necesito solicitar permisos laborales. Como jefe de área, necesito aprobar o rechazar solicitudes de mis subordinados. |

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-014-1 | Backend: `rutas_permisos.py` — endpoints de solicitud y aprobación | ✅ Done |
| ERP-014-2 | Backend: `servicios/permiso_service.py` — lógica de negocio separada (SRP) | ✅ Done |
| ERP-014-3 | Frontend: `GestionPermisos.jsx` — interfaz de gestión de permisos | ✅ Done |

---

### ⚫ EPIC-10: Despliegue y Documentación

#### `ERP-015` — Configuración de Nginx y despliegue en red LAN
| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Prioridad** | 🔴 Highest |
| **Sprint** | Sprint 6 |
| **Story Points** | 8 |
| **Etiquetas** | `devops`, `nginx`, `deploy`, `security` |
| **Descripción** | Como administrador del sistema, necesito desplegar la aplicación en la red corporativa con Nginx como punto de entrada unificado, con seguridad HTTP y proxy inverso. |

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-015-1 | Configurar `nginx.conf` — Proxy: `/api/` → :4000, `/chat/` → :4001, `/socket.io/` → :4001 WS | ✅ Done |
| ERP-015-2 | Configurar headers de seguridad: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection | ✅ Done |
| ERP-015-3 | Configurar compresión gzip y caché de assets estáticos (1 año, immutable) | ✅ Done |
| ERP-015-4 | Crear `start.ps1` — script de arranque automatizado de servicios | ✅ Done |
| ERP-015-5 | Ejecutar `vite build` y desplegar assets en Nginx (`html/erp/`) | ✅ Done |

---

#### `ERP-016` — Documentación técnica y entrega
| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Prioridad** | 🟠 High |
| **Sprint** | Sprint 6 |
| **Story Points** | 5 |
| **Etiquetas** | `docs`, `delivery`, `knowledge-transfer` |
| **Descripción** | Como responsable del proyecto, necesito documentar técnicamente todo el sistema para garantizar la mantenibilidad y transferencia de conocimiento. |

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-016-1 | Redactar `DOCUMENTACION_ERP.md` — guía completa Backend + Frontend (1500+ líneas) | ✅ Done |
| ERP-016-2 | Documentar `README.md` — instrucciones de instalación y despliegue | ✅ Done |
| ERP-016-3 | Versionado del esquema SQL (`erp.sql`) | ✅ Done |
| ERP-016-4 | Capacitación a usuarios finales | ✅ Done |

---

## BOARD — Resumen de Sprints

| Sprint | Periodo | Épicas | Story Points |
|--------|---------|--------|:------------:|
| **Sprint 1** | Semana 1-4 (Marzo) | EPIC-01: Infraestructura, EPIC-01: BD | **18** |
| **Sprint 2** | Semana 5-7 (Abril) | EPIC-02: Auth + Login | **21** |
| **Sprint 3** | Semana 7-9 (Abril) | EPIC-03: RRHH | **18** |
| **Sprint 4** | Semana 9-12 (Abril-Mayo) | EPIC-04: Panel, EPIC-05: Tickets | **21** |
| **Sprint 5** | Semana 12-15 (Mayo-Junio) | EPIC-06: Chat, EPIC-07: Asistencias, EPIC-08: Equipos/Chips | **47** |
| **Sprint 6** | Semana 15-18 (Junio) | EPIC-09: Permisos, EPIC-10: Deploy/Docs | **21** |
| | | **TOTAL** | **146 SP** |

---

## MÉTRICAS DEL PROYECTO

| Métrica | Valor |
|---------|-------|
| Total de Épicas | 10 |
| Total de User Stories | 16 |
| Total de Tareas | 68 |
| Story Points totales | 146 |
| Archivos Backend (API) | 17 rutas + 5 soporte |
| Archivos Chat Backend | 6 módulos |
| Componentes Frontend | 20+ componentes + 15+ módulos |
| Tablas MariaDB | 20+ |
| Colecciones MongoDB | 13 (2 bases de datos) |
| Endpoints API estimados | 80+ |
| Líneas de documentación | 1,573+ |

---

> **Nota:** Este plan de trabajo y la estructura JIRA reflejan fielmente la arquitectura real del Sistema ERP implementado, basado en el análisis del código fuente, los archivos de configuración y la documentación existente del proyecto.
