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

**Criterios de Aceptación:**
- ✅ Python 3.10+ instalado con virtualenv funcional en `HUELLERO/.venv`
- ✅ Todas las dependencias de `requirements.txt` (FastAPI, SQLAlchemy, Motor, Argon2, python-jose, pyzk, python-docx, ReportLab) instaladas sin errores
- ✅ Node.js instalado y `npm install` exitoso en `erp-poo/` (React 19, Vite 7, React Router DOM 7, TanStack Query 5, Socket.IO Client 4)
- ✅ MariaDB 10.4 operativa en XAMPP con BD `erp` creada y esquema importado desde `erp.sql`
- ✅ MongoDB operativa con BD `erp_nosql` y `erp_sql` accesibles
- ✅ Archivos `.env` configurados con variables: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `JWT_SECRET`, `MONGO_URI`
- ✅ Backend arranca en puerto 4000 (`uvicorn main:app`) sin errores de conexión
- ✅ Chat backend arranca en puerto 4001 (`uvicorn chat_server:app`) sin errores
- ✅ Frontend Vite arranca en puerto 3000 con HMR funcional

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-001-1 | Instalar Python 3.10+, crear virtualenv (`python -m venv .venv`) y activar entorno | ✅ Done |
| ERP-001-2 | Ejecutar `pip install -r requirements.txt` (backend) y `pip install -r chat_backend/requirements.txt` | ✅ Done |
| ERP-001-3 | Instalar Node.js LTS, ejecutar `npm install` en `erp-poo/` — verificar 0 vulnerabilidades críticas | ✅ Done |
| ERP-001-4 | Instalar XAMPP con MariaDB 10.4, configurar `my.ini`, crear BD `erp` con charset `utf8mb4` | ✅ Done |
| ERP-001-5 | Importar esquema completo desde `erp.sql` (71 tablas) y verificar integridad referencial | ✅ Done |
| ERP-001-6 | Instalar MongoDB Community, crear BD `erp_nosql` y verificar conexión con Motor async | ✅ Done |
| ERP-001-7 | Crear `.env` para backend (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `JWT_SECRET`, `MONGO_URI`) | ✅ Done |
| ERP-001-8 | Crear `.env` para chat_backend con variables de conexión MySQL + MongoDB + JWT compartido | ✅ Done |
| ERP-001-9 | Verificar arranque completo: backend (4000) + chat (4001) + frontend (3000) sin errores | ✅ Done |

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

**Criterios de Aceptación:**
- ✅ Esquema con 71 tablas en 3FN desplegadas en MariaDB 10.4 con charset `utf8mb4`
- ✅ Tablas núcleo: `acceso`, `personal`, `contrato`, `empresa` con relaciones FK correctas
- ✅ Tablas de catálogos: `area`, `departamento`, `cargo`, `distrito`, `afp`, `banco`, `moneda`, `tipo_cuenta`, `modalidad`, `grado_academico`, `estado_civil`, `tipo_contrato`, `tipo_familiar`
- ✅ Tablas de inventario TI: `equipo`, `tipo_equipo`, `marca`, `modelo`, `procesador`, `ram`, `tipo_ram`, `disco`, `tipo_disco`, `capacidad_disco`, `gama`, `red`, `especificaciones_tec`, `almacenamiento`, `asignacion_equipo`, `estado_equipo`
- ✅ Tablas de chips/telefonía: `chips`, `asignacion_chip`, `operador_chips`, `plan_chips`, `descuento_chips`
- ✅ Tablas de tickets/SAP: `ticket`, `categoria_ticket`, `subcategoria_ticket`, `sap_articulo`, `sap_servicio`, `sap_socio_negocio` + catálogos SAP
- ✅ Tablas de RRHH: `contacto`, `cuenta_banca`, `seguros_aportaciones`, `anexos`, `horario`, `horario_detalle`, `catg_asistencia`
- ✅ Tablas de seguridad: `rol_accs`, `permiso_accs`, `asignacion_accs`, `asignacion_emp`, `estado_accs`
- ✅ Todas las FK con `ON DELETE` y `ON UPDATE` correctos, índices en columnas de búsqueda frecuente
- ✅ Script `erp.sql` versionado y reproducible (DROP IF EXISTS + CREATE)
- ✅ SQLAlchemy automap (`Base.prepare(autoload_with=engine)`) refleja todas las tablas sin error

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-002-1 | Diseñar modelo E-R: tablas núcleo `acceso`, `personal`, `empresa`, `contrato`, `contacto` con relaciones 1:N y N:M | ✅ Done |
| ERP-002-2 | Crear tablas de catálogos: `area`, `departamento`, `cargo`, `distrito`, `afp`, `banco`, `moneda`, `tipo_cuenta`, `modalidad`, `grado_academico`, `estado_civil`, `tipo_contrato`, `tipo_familiar` | ✅ Done |
| ERP-002-3 | Crear tablas de seguridad: `estado_accs`, `rol_accs`, `permiso_accs`, `asignacion_accs`, `asignacion_emp` | ✅ Done |
| ERP-002-4 | Crear tablas de RRHH: `contacto`, `cuenta_banca`, `seguros_aportaciones`, `anexos`, `horario`, `horario_detalle`, `catg_asistencia` | ✅ Done |
| ERP-002-5 | Crear tablas de inventario TI: `equipo`, `tipo_equipo`, `marca`, `modelo`, `procesador`, `ram`, `tipo_ram`, `disco`, `tipo_disco`, `capacidad_disco`, `gama`, `red`, `especificaciones_tec`, `almacenamiento`, `asignacion_equipo`, `estado_equipo` | ✅ Done |
| ERP-002-6 | Crear tablas de telefonía: `chips`, `asignacion_chip`, `operador_chips`, `plan_chips`, `descuento_chips` | ✅ Done |
| ERP-002-7 | Crear tablas de tickets: `ticket`, `categoria_ticket`, `subcategoria_ticket` + tablas SAP (`sap_articulo`, `sap_servicio`, `sap_socio_negocio`, `familia_sap`, `subfamilia_sap`, `marca_sap`, `modelo_sap`, `grupo_articulos`, `tipo_unidad`, `tipo_socio_negocio`) | ✅ Done |
| ERP-002-8 | Establecer todas las FK con constraints de integridad referencial y cascada | ✅ Done |
| ERP-002-9 | Crear índices en columnas de búsqueda frecuente (id_emp, id_personal, estado, fecha) | ✅ Done |
| ERP-002-10 | Exportar script `erp.sql` completo y verificar importación limpia en BD nueva | ✅ Done |
| ERP-002-11 | Validar que SQLAlchemy automap refleja las 71 tablas correctamente | ✅ Done |

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

**Criterios de Aceptación:**
- ✅ BD `erp_nosql` creada con 9 colecciones operativas para el sistema principal
- ✅ BD `erp_sql` creada como base de archivo/auditoría
- ✅ Colecciones de asistencia: `asistencia` (marcajes biométricos), `justificaciones` (justificaciones manuales)
- ✅ Colecciones de chat: `chat_mensajes` (privados), `chat_general` (sala general), `msg_grupo` (grupos), `grupos` (metadata de grupos)
- ✅ Colecciones de contenido: `menus`, `eventos`, `eventos2`, `evento_mujeres`
- ✅ Colecciones de soporte: `notificaciones_tickets`, `saludos_cumpleanos`, `archivo_saludos`, `auditoria`
- ✅ Índices compuestos creados en 10 colecciones para optimizar consultas frecuentes
- ✅ Índice `idx_dia_emppin` y `idx_emppin_dia` en `asistencia` para búsqueda bidireccional
- ✅ Índice `idx_personal_leido_fecha` en `notificaciones_tickets` para consultas de notificaciones no leídas
- ✅ Índices de chat (`idx_par_fecha`, `idx_fecha`) para paginación eficiente de mensajes
- ✅ Script `crear_indices_mongo.py` ejecutable y reproducible

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-003-1 | Crear BD `erp_nosql` y colecciones de asistencia: `asistencia`, `justificaciones` | ✅ Done |
| ERP-003-2 | Crear colecciones de contenido: `menus`, `eventos`, `eventos2`, `evento_mujeres` | ✅ Done |
| ERP-003-3 | Crear colecciones de chat: `chat_mensajes`, `chat_general`, `msg_grupo`, `grupos`, `chat_notas_personales` | ✅ Done |
| ERP-003-4 | Crear colecciones de soporte: `notificaciones_tickets`, `saludos_cumpleanos`, `archivo_saludos` | ✅ Done |
| ERP-003-5 | Crear BD `erp_sql` con colección `auditoria` para registro de cambios | ✅ Done |
| ERP-003-6 | Implementar `crear_indices_mongo.py` — índices compuestos: `asistencia` (dia+emp_pin), `justificaciones` (fecha), `notificaciones_tickets` (personal+leido+fecha, ticket+personal+leido) | ✅ Done |
| ERP-003-7 | Crear índices de chat: `chat_mensajes` (par+fecha), `chat_general` (fecha), `chat_notas_personales` (personal+fecha) | ✅ Done |
| ERP-003-8 | Crear índices de contenido: `menus` (fecha_subida), `eventos` (fecha_subida) | ✅ Done |
| ERP-003-9 | Crear índices de auditoría: `auditoria` (fecha, modulo+fecha) y `saludos_cumpleanos` (personal_cumple+anio) | ✅ Done |
| ERP-003-10 | Verificar rendimiento de consultas con `explain()` en las colecciones más usadas | ✅ Done |

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
| ERP-004-1 | Backend: `br_auth.py` — validación de credenciales: consulta usuario por `USUARIO`, verificación de hash Argon2id, control de `INTENT_LOGIN` (bloqueo tras 3 intentos) | ✅ Done |
| ERP-004-2 | Backend: `auth_token.py` — generación de token JWT (HS256) con payload: `sub`, `id_accs`, `id_emp`, `rol`, `id_personal`, `nombre`; verificación y decodificación | ✅ Done |
| ERP-004-3 | Backend: schemas Pydantic — `LoginRequest` (usuario, password), `SeleccionEmpresaRequest` (id_emp, token), `EmpresaSchema` (id, razon_social) | ✅ Done |
| ERP-004-4 | Backend: endpoint `POST /auth/login` — autenticación inicial, retorna lista de empresas del usuario o error contextual | ✅ Done |
| ERP-004-5 | Backend: endpoint `POST /auth/seleccionar-empresa` — genera token JWT definitivo con `id_emp` de la empresa seleccionada | ✅ Done |
| ERP-004-6 | Backend: endpoint `GET /auth/verificar` — valida token activo, retorna datos del usuario o 401 | ✅ Done |
| ERP-004-7 | Backend: `helpers.py` — `construir_respuesta_usuario()` consolida datos de acceso + personal + empresa + rol en un solo objeto | ✅ Done |
| ERP-004-8 | Backend: configurar CORS con regex para redes LAN privadas (192.168.x.x, 10.x.x.x, 172.16-31.x.x) | ✅ Done |
| ERP-004-9 | Backend: middleware unificado de rendimiento (`X-Process-Time-Ms`) + captura global de errores 500 con clasificación OK/LENTO/CRITICO | ✅ Done |
| ERP-004-10 | Backend: detección de flag `RESET_PASS` en respuesta de login para forzar cambio de contraseña en frontend | ✅ Done |

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

**Criterios de Aceptación:**
- ✅ Pantalla de login responsiva con campos: empresa (selector dinámico), usuario y contraseña
- ✅ Selector de empresa carga opciones desde `/auth/login` (lista de empresas asociadas al usuario)
- ✅ Mensajes de error contextuales: credenciales inválidas, cuenta bloqueada, sin empresa asignada
- ✅ Token JWT almacenado en memoria (no localStorage) para seguridad XSS
- ✅ Módulo `auth.js` expone funciones: `guardarToken()`, `obtenerToken()`, `cerrarSesion()`, `obtenerUsuario()`
- ✅ Rutas protegidas redirigen a `/login` si no hay token válido
- ✅ Respuestas 401 en cualquier endpoint redirigen automáticamente a `/login`
- ✅ Detección de `RESET_PASS` → redirige a `CambioPassword.jsx` antes de acceder al Dashboard
- ✅ `CambioPassword.jsx` valida: contraseña actual, nueva contraseña (mín. 6 caracteres), confirmación coincidente
- ✅ Botón de cerrar (X) en `CambioPassword` para cancelar el cambio voluntario

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-005-1 | Crear `Login.jsx` — formulario con selector de empresa dinámico y validación de campos | ✅ Done |
| ERP-005-2 | Implementar `auth.js` — almacenamiento de token JWT en memoria, funciones `guardarToken()`, `obtenerToken()`, `cerrarSesion()`, `obtenerUsuario()` | ✅ Done |
| ERP-005-3 | Configurar React Router DOM con rutas protegidas — validación de token en cada navegación | ✅ Done |
| ERP-005-4 | Implementar `CambioPassword.jsx` — formulario de cambio con validación de contraseña actual + nueva + confirmación | ✅ Done |
| ERP-005-5 | Implementar flujo `RESET_PASS` — detección del flag y redirección obligatoria antes de acceder al Dashboard | ✅ Done |
| ERP-005-6 | Implementar manejo global de 401 — interceptar respuestas y redirigir a `/login` con limpieza de sesión | ✅ Done |
| ERP-005-7 | Estilizar `Login.css` y `CambioPassword.css` — diseño responsivo con soporte dark mode | ✅ Done |

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

**Criterios de Aceptación:**
- ✅ CRUD completo de empleados con 12 endpoints en `rutas_personal.py` (crear, editar, activar/desactivar, reset password, foto, contactos, AFP, cuentas bancarias)
- ✅ Listado de personal filtrado por empresa del token (`id_emp`), solo contratos activos
- ✅ Precarga de 15+ mapas de catálogos para evitar N+1 queries en el listado
- ✅ Endpoint `/mi-perfil` para que cualquier usuario consulte su propia información completa
- ✅ Gestión de sub-recursos: contactos de emergencia, seguros/AFP, cuentas bancarias (reemplazo completo: delete all + insert)
- ✅ Subida de foto de perfil con validación de formato (JPG/PNG/WEBP) y tamaño máximo 5MB
- ✅ Reset de contraseña por admin: establece password = NUM_DOC, activa flag `RESET_PASS=1`, desbloquea si está bloqueado
- ✅ 15 endpoints GET de catálogos en `rutas_catalogos.py` (áreas, departamentos, cargos, AFP, bancos, monedas, distritos, etc.)
- ✅ CRUD de documentos laborales (contratos, adendas, memorandums) vinculados por contrato → anexos
- ✅ Historial combinado de subidas (menús + eventos) desde MongoDB con resolución de nombres desde MySQL
- ✅ Registro automático de auditoría en MongoDB para todos los cambios en datos de personal
- ✅ Frontend: listado con búsqueda por nombre/DNI, filtros por área y estado, paginación
- ✅ Frontend: vista detallada con pestañas (datos personales, contrato, contactos, documentos, asistencia)

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-006-1 | Backend: `rutas_personal.py` — endpoint GET `/` listado de empleados con precarga de catálogos y filtro por empresa | ✅ Done |
| ERP-006-2 | Backend: `rutas_personal.py` — endpoints POST `/` (crear) y PUT `/{id}` (editar) con validación de campos obligatorios | ✅ Done |
| ERP-006-3 | Backend: `rutas_personal.py` — endpoint PUT `/{id}/estado` (activar/desactivar), POST `/{id}/reset-password` | ✅ Done |
| ERP-006-4 | Backend: `rutas_personal.py` — endpoints de sub-recursos: PUT `/{id}/contactos`, GET/PUT `/{id}/seguros`, GET/PUT `/{id}/cuentas`, PUT `/{id}/foto` | ✅ Done |
| ERP-006-5 | Backend: `rutas_personal.py` — endpoint GET `/mi-perfil` para consulta del perfil propio | ✅ Done |
| ERP-006-6 | Backend: `rutas_catalogos.py` — 15 endpoints GET de catálogos (áreas, departamentos, cargos, AFP, bancos, monedas, distritos, estados civiles, grados, tipos contrato, tipos familiar, modalidades, tipos cuenta, depart-provincias, documentos) | ✅ Done |
| ERP-006-7 | Backend: `rutas_historial.py` — endpoints GET `/historial`, `/historial/menus`, `/historial/eventos` con paginación y resolución de nombres | ✅ Done |
| ERP-006-8 | Backend: `rutas_documentos.py` — CRUD completo: GET `/documentos/tipos`, GET `/documentos/motivos`, GET/POST/PUT/DELETE de documentos vinculados por contrato | ✅ Done |
| ERP-006-9 | Backend: `auditoria.py` — registro automático de cambios en MongoDB `auditoria` con módulo, acción, datos anteriores/nuevos y usuario | ✅ Done |
| ERP-006-10 | Frontend: `RRHH.jsx` — listado de personal con búsqueda por texto, filtros por área/estado y tabla responsiva | ✅ Done |
| ERP-006-11 | Frontend: `PersonalDetalle.jsx` — vista detallada con pestañas: datos personales, contrato, contactos, documentos, AFP/seguros, cuentas bancarias, asistencia | ✅ Done |
| ERP-006-12 | Frontend: estilos responsivos `RRHH.css` y `PersonalDetalle.css` con soporte dark mode | ✅ Done |

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

**Criterios de Aceptación:**
- ✅ CRUD completo de horarios con 7 endpoints en `rutas_horario.py`
- ✅ Cada horario incluye detalle semanal: 7 registros (DIA, HORA_E, HORA_S, DIA_DESC) en tabla `horario_detalle`
- ✅ Crear horario genera automáticamente los 7 días de detalle
- ✅ Editar horario recrea los detalles (delete + insert) para mantener consistencia
- ✅ Eliminar horario solo es posible si no hay empleados asignados (validación de integridad)
- ✅ Desactivación lógica (ESTADO=0) en lugar de borrado físico
- ✅ Asignación individual: asignar un horario a un empleado específico
- ✅ Asignación masiva: asignar el mismo horario a múltiples empleados en batch
- ✅ Listado de empleados con su horario asignado para visualización general
- ✅ Frontend muestra tabla de horarios con detalle semanal expandible

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-007-1 | Backend: `rutas_horario.py` — endpoint GET `/` listado de horarios con detalle semanal batch-loaded | ✅ Done |
| ERP-007-2 | Backend: `rutas_horario.py` — endpoint POST `/` crear horario con 7 días de detalle (hora_e, hora_s, descanso) | ✅ Done |
| ERP-007-3 | Backend: `rutas_horario.py` — endpoint PUT `/{id}` editar horario (delete + recreate details) | ✅ Done |
| ERP-007-4 | Backend: `rutas_horario.py` — endpoint DELETE `/{id}` desactivar horario con validación de empleados asignados | ✅ Done |
| ERP-007-5 | Backend: `rutas_horario.py` — endpoint GET `/empleados` listado de empleados con horario asignado | ✅ Done |
| ERP-007-6 | Backend: `rutas_horario.py` — endpoints PUT `/empleado/{id}` (asignación individual) y PUT `/empleados/masivo` (asignación batch) | ✅ Done |
| ERP-007-7 | Frontend: `HorariosRRHH.jsx` — interfaz de gestión con tabla de horarios, formulario de creación/edición y asignación a empleados | ✅ Done |
| ERP-007-8 | Frontend: estilos `HorariosRRHH.css` con diseño responsivo y soporte dark mode | ✅ Done |

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

**Criterios de Aceptación:**
- ✅ Dashboard muestra 3 secciones informativas: Menú del día, Eventos corporativos y Cumpleaños del mes
- ✅ Menú: subida de imagen WebP, visualización del menú más reciente, eliminación por admin
- ✅ Eventos: 3 slots independientes (evento principal, evento 2, evento mujeres) cada uno con CRUD de imagen
- ✅ Cumpleaños: listado del mes actual con nombre, día y foto, ordenado cronológicamente
- ✅ Saludos de cumpleaños: detección de pendientes, envío con mensaje + sticker opcional
- ✅ Vista de saludos recibidos por cada cumpleañero y listado de empleados que no han saludado
- ✅ Tarea de limpieza automática (`tarea_limpieza_periodica`) que archiva saludos vencidos en background
- ✅ Persistencia de menús y eventos en MongoDB con imagen en disco (`public/assets/`)
- ✅ Sistema de notificaciones integrado: alerta de menú nuevo, evento publicado, cumpleaños hoy/próximo

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-008-1 | Backend: `rutas_menu.py` — endpoints POST `/menus` (subida WebP), GET `/menus` (menú actual), DELETE `/menus` — persistencia en MongoDB + archivo en disco | ✅ Done |
| ERP-008-2 | Backend: `rutas_evento.py` — 3 sets de CRUD (POST/GET/DELETE) para evento principal, evento2, evento_mujeres — colecciones MongoDB independientes | ✅ Done |
| ERP-008-3 | Backend: `rutas_cumpleanos.py` — endpoint GET `/cumpleanos` consulta cross-empresa del mes actual desde MySQL, ordenado por día | ✅ Done |
| ERP-008-4 | Backend: `rutas_saludos_cumpleanos.py` — 6 endpoints: GET `/pendiente`, POST `/enviar`, GET `/activos`, GET `/{id}/saludos`, GET `/{id}/faltantes`, GET `/limpiar` | ✅ Done |
| ERP-008-5 | Backend: `rutas_saludos_cumpleanos.py` — tarea async `tarea_limpieza_periodica` para archivar saludos vencidos a colección `archivo_saludos` | ✅ Done |
| ERP-008-6 | Frontend: `DashboardHome.jsx` — vista principal con secciones: menú (imagen expandible), eventos (carrusel/grid), cumpleaños (lista con avatares) | ✅ Done |
| ERP-008-7 | Frontend: `SeccionCumpleanos.jsx` — componente de lista de cumpleaños con indicador de "hoy" | ✅ Done |
| ERP-008-8 | Frontend: `CumpleanosModal.jsx` — modal para enviar saludo con mensaje de texto + sticker opcional | ✅ Done |
| ERP-008-9 | Frontend: `SeccionImagen.jsx` — componente reutilizable para visualizar/subir imágenes de menú y eventos | ✅ Done |
| ERP-008-10 | Frontend: estilos `DashboardHome.css` con grid responsivo y soporte dark mode | ✅ Done |

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
- ✅ Crear ticket con tipo, categoría, subcategoría, prioridad, descripción y foto adjunta (multipart)
- ✅ Flujo de estados: `ABIERTO → ASIGNADO → RESUELTO → CERRADO` (transiciones controladas por backend)
- ✅ Prioridades: `BAJA`, `MEDIA`, `ALTA`, `URGENTE` — modificable por ADMIN/SOPORTE
- ✅ Asignación de ticket a técnico del equipo SOPORTE
- ✅ Reapertura de tickets cerrados con motivo obligatorio
- ✅ Valoración del servicio al cerrar: escala 1-3 (malo, regular, bueno)
- ✅ Notificaciones persistentes en MongoDB: creación, asignación, cambio de estado, cierre, reapertura
- ✅ Dashboard de estadísticas: conteos por estado + gráfico mensual (solo ADMIN/SOPORTE)
- ✅ Generación de reporte PDF por mes/año con ReportLab
- ✅ Integración SAP: registro de artículos, servicios y socios de negocio vinculados al ticket
- ✅ Generación de plantillas Word/PDF con placeholders auto-rellenados desde BD
- ✅ Paginación de listados (parámetros `page` y `limit`)
- ✅ Control de acceso: ADMIN/SOPORTE ven todos los tickets; USUARIO solo los propios
- ✅ Pestañas frontend: "En Atención" e "Historial" para separar tickets activos de cerrados

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-009-1 | Backend: `rutas_tickets.py` — endpoints POST `/` (crear con multipart), GET `/` (listado paginado), GET `/{id}` (detalle) | ✅ Done |
| ERP-009-2 | Backend: `rutas_tickets.py` — endpoints de flujo: PUT `/{id}/asignar`, PUT `/{id}/estado`, PUT `/{id}/cerrar`, PUT `/{id}/valorar`, PUT `/{id}/reabrir` | ✅ Done |
| ERP-009-3 | Backend: `rutas_tickets.py` — endpoint PUT `/{id}/prioridad` cambio de prioridad (solo ADMIN/SOPORTE) con auditoría y notificación | ✅ Done |
| ERP-009-4 | Backend: `rutas_tickets.py` — endpoints GET `/categorias`, GET `/subcategorias`, GET `/tecnicos`, GET `/estadisticas`, GET `/reporte-pdf` | ✅ Done |
| ERP-009-5 | Backend: `rutas_tickets.py` — endpoints SAP: POST `/{id}/sap`, PUT `/{id}/codigo-sap`, GET `/catalogos-sap` | ✅ Done |
| ERP-009-6 | Backend: `rutas_tickets.py` — endpoints de notificación: GET `/{id}/reapertura-notif`, PUT `/{id}/reapertura-notif/leer` | ✅ Done |
| ERP-009-7 | Backend: `rutas_notificaciones.py` — endpoint GET `/notificaciones` con 9 tipos de notificación agregada (contratos, cumpleaños, menú, evento, faltas, tickets) | ✅ Done |
| ERP-009-8 | Backend: `rutas_plantillas.py` — endpoints GET `/plantillas` (listar), GET `/{nombre}/campos` (analizar placeholders), POST `/{nombre}/generar` (generar DOCX/PDF con auto-fill) | ✅ Done |
| ERP-009-9 | Frontend: `IngresarTicket.jsx` — formulario de creación con selector de categoría/subcategoría, prioridad, descripción y adjunto | ✅ Done |
| ERP-009-10 | Frontend: `IngresarTicket.jsx` — pestañas "En Atención" e "Historial" para separar tickets activos de cerrados/resueltos | ✅ Done |
| ERP-009-11 | Frontend: `Tickets.jsx` — panel de administración con detalle lateral, dropdown de prioridad, cambio de estado y asignación | ✅ Done |
| ERP-009-12 | Frontend: `ReaperturaModal.jsx` — modal de reapertura con campo de motivo obligatorio | ✅ Done |
| ERP-009-13 | Frontend: `ValoracionModal.jsx` — modal de valoración con escala visual 1-3 | ✅ Done |
| ERP-009-14 | Frontend: manejo global de 401 → redirección a login en `Tickets.jsx` e `IngresarTicket.jsx` | ✅ Done |

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
| ERP-010-1 | Backend: `chat_config.py` — configuración de entorno (MONGO_URI, JWT_SECRET, CORS origins, puerto 4001) | ✅ Done |
| ERP-010-2 | Backend: `chat_db.py` — conexión dual MySQL (PyMySQL) + MongoDB (Motor async) con pool de conexiones | ✅ Done |
| ERP-010-3 | Backend: `chat_auth.py` — resolución de identidad desde JWT compartido con backend principal, extracción de `id_personal`, `nombre`, `id_emp` | ✅ Done |
| ERP-010-4 | Backend: `chat_socket_events.py` — eventos WebSocket: `connect` (auth), `disconnect` (cleanup), `mensaje` (1-a-1), `msg_general`, `msg_grupo`, `typing`, `zumbido` | ✅ Done |
| ERP-010-5 | Backend: `chat_socket_events.py` — gestión de usuarios conectados en memoria, broadcast de estado online/offline | ✅ Done |
| ERP-010-6 | Backend: `chat_routes.py` — endpoints REST: GET contactos, GET historial de mensajes (paginado), CRUD de grupos, POST subir archivo | ✅ Done |
| ERP-010-7 | Backend: `chat_server.py` — orquestador ASGI: monta Socket.IO + FastAPI en mismo servidor, configuración CORS para WebSocket | ✅ Done |
| ERP-010-8 | Frontend: `ChatPanel.jsx` — panel lateral con lista de contactos, indicador online/offline, badge de mensajes no leídos, buscador | ✅ Done |
| ERP-010-9 | Frontend: `ChatVentana.jsx` — ventana flotante de conversación con scroll infinito, indicador "escribiendo...", envío de texto/sticker/archivo | ✅ Done |
| ERP-010-10 | Frontend: `ChatSala.jsx` — sala de chat general con mensajes en tiempo real y scroll automático | ✅ Done |
| ERP-010-11 | Frontend: `StickerPicker.jsx` — selector de stickers con catálogo organizado por categorías (`stickerCatalog.js`) | ✅ Done |
| ERP-010-12 | Frontend: `CrearGrupoModal.jsx` — modal de creación de grupo con selección múltiple de participantes y nombre | ✅ Done |
| ERP-010-13 | Frontend: `ModalImagen.jsx` — visor de imágenes ampliadas enviadas por chat | ✅ Done |
| ERP-010-14 | Frontend: sonidos de notificación (`public/sounds/`) para mensajes nuevos y zumbidos | ✅ Done |

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

**Criterios de Aceptación:**
- ✅ Script `Asistencias.py` se conecta al reloj ZKTeco vía protocolo ZK (UDP) con librería `pyzk`
- ✅ Sincronización bulk con `UpdateOne` (upsert) hacia MongoDB colección `asistencia`
- ✅ Cada registro incluye: `emp_pin` (DNI), `dia`, `marcajes` (lista de horas), `timestamp`
- ✅ 9 endpoints en `rutas_asistencia.py` para consulta y gestión
- ✅ Consulta individual: asistencia de un empleado por rango de fechas con desglose diario + resumen + horario asignado
- ✅ Consulta general: asistencia de todos los empleados con filtros (fecha, área, cargo, turno, estado)
- ✅ Cálculo automático de estado: puntual, tardanza, falta — comparando marcajes vs horario asignado
- ✅ Justificación individual (un día) y por rango de fechas en MongoDB `justificaciones`
- ✅ CRUD de categorías de justificación (catálogo configurable)
- ✅ Consulta de marcajes crudos del huellero por DNI
- ✅ Datos híbridos: MySQL (personal, contrato, horario) + MongoDB (asistencia, justificaciones)
- ✅ Frontend muestra tabla con indicadores visuales de estado (colores por puntual/tardanza/falta)
- ✅ Pestaña de asistencia integrada en el perfil del empleado (`AsistenciaTab.jsx`)

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-011-1 | Script: `HUELLERO/Asistencias.py` — conexión ZKTeco vía protocolo ZK (UDP), lectura de marcajes con `pyzk` | ✅ Done |
| ERP-011-2 | Script: `HUELLERO/Asistencias.py` — operación bulk `UpdateOne` (upsert) hacia MongoDB `asistencia` agrupando marcajes por día y `emp_pin` | ✅ Done |
| ERP-011-3 | Backend: `rutas_asistencia.py` — endpoint GET `/{id}` consulta individual con parámetros `fecha_ini`, `fecha_fin`, `empresa`, cálculo vs horario | ✅ Done |
| ERP-011-4 | Backend: `rutas_asistencia.py` — endpoint GET `/asistencia/general` consulta masiva con filtros: fecha (requerido), area, cargo, turno, estado, nombre | ✅ Done |
| ERP-011-5 | Backend: `rutas_asistencia.py` — endpoint GET `/{dni}/marcajes` marcajes crudos del huellero desde MongoDB | ✅ Done |
| ERP-011-6 | Backend: `rutas_asistencia.py` — endpoints PUT `/asistencia/justificar` (un día) y POST `/asistencia/justificar-rango` (rango de fechas) | ✅ Done |
| ERP-011-7 | Backend: `rutas_asistencia.py` — endpoints CRUD de categorías de justificación: GET `/categorias`, POST `/categorias`, PUT `/categorias/{id}` | ✅ Done |
| ERP-011-8 | Backend: `rutas_asistencia.py` — endpoint GET `/horarios` listado de horarios activos con detalle semanal | ✅ Done |
| ERP-011-9 | Frontend: `AsistenciasGeneral.jsx` — vista general con tabla de asistencias, filtros por fecha/área/estado, indicadores de color por estado | ✅ Done |
| ERP-011-10 | Frontend: `AsistenciaTab.jsx` — pestaña de asistencia en perfil del empleado con calendario y resumen mensual | ✅ Done |
| ERP-011-11 | Frontend: estilos `AsistenciasGeneral.css` con tabla responsiva, badges de estado y soporte dark mode | ✅ Done |

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

**Criterios de Aceptación:**
- ✅ 13 endpoints en `rutas_equipo.py` para CRUD completo de equipos, catálogos, asignaciones y devoluciones
- ✅ Endpoint `/equipos/catalogos` retorna todos los catálogos en una sola llamada (tipos, marcas, modelos, procesadores, RAM, disco, gama, red)
- ✅ Catálogos dinámicos: POST/PUT `/equipos/catalogo/{tabla}` para agregar/editar ítems en cualquier tabla catálogo con manejo de errores (try/except, rollback)
- ✅ Crear equipo con especificaciones técnicas (procesador, RAM, disco) y foto opcional
- ✅ Cada equipo tiene: serie, tipo, estado, código, gama, marca, modelo, especificaciones + almacenamiento
- ✅ Listado de equipos filtrado por empresa con specs completas y foto
- ✅ Asignación de equipo a empleado activo con fecha de asignación
- ✅ Devolución de equipo: registra `fecha_devol` sin borrar la asignación (historial preservado)
- ✅ Listado de equipos disponibles (sin asignación activa) y empleados activos
- ✅ Frontend: vista de tarjetas (cards) con specs, estado, asignación inline y filtros por tipo/estado
- ✅ Frontend: formulario de creación con selectores dinámicos de catálogos y subida de foto
- ✅ Stats interactivos: Total, Disponibles, Asignados — clickeables para filtrar

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-012-1 | Backend: `rutas_equipo.py` — endpoint GET `/equipos/catalogos` retorno unificado de todos los catálogos TI | ✅ Done |
| ERP-012-2 | Backend: `rutas_equipo.py` — endpoints POST/PUT `/equipos/catalogo/{tabla}` gestión dinámica de catálogos con manejo de errores SQLAlchemy | ✅ Done |
| ERP-012-3 | Backend: `rutas_equipo.py` — endpoints GET `/equipos` (listado con specs), POST `/equipos` (crear con specs + disco), POST `/{id}/foto` (subir foto) | ✅ Done |
| ERP-012-4 | Backend: `rutas_equipo.py` — endpoint POST `/equipos/disco` crear registro de almacenamiento, DELETE `/{id}/disco` eliminar | ✅ Done |
| ERP-012-5 | Backend: `rutas_equipo.py` — endpoints GET `/equipos/asignaciones` (historial), GET `/equipos/disponibles`, GET `/equipos/empleados-activos` | ✅ Done |
| ERP-012-6 | Backend: `rutas_equipo.py` — endpoints POST `/equipos/asignar` (asignar a empleado) y PUT `/equipos/devolver/{id}` (registrar devolución) | ✅ Done |
| ERP-012-7 | Frontend: `EquiposCrear.jsx` — formulario de creación con selectores dinámicos de catálogos, specs técnicas y subida de foto | ✅ Done |
| ERP-012-8 | Frontend: `EquiposAsignar.jsx` — vista de tarjetas (card grid) con stats, búsqueda, filtro por tipo/estado, asignación inline y devolución | ✅ Done |
| ERP-012-9 | Frontend: `EquiposAsignar.css` — estilos de tarjetas con grid responsivo, badges de estado, formulario inline y soporte dark mode | ✅ Done |
| ERP-012-10 | Frontend: `EquiposCrear.css` — estilos del formulario de creación con soporte dark mode | ✅ Done |

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

**Criterios de Aceptación:**
- ✅ 11 endpoints en `rutas_chip.py` para CRUD completo de líneas, catálogos y asignaciones
- ✅ Cada línea incluye: número, operador, plan, precio, descuento, precio con descuento, empresa, estado
- ✅ Catálogos dinámicos de operadores, planes y descuentos con POST `/chips/catalogo/{tabla}`
- ✅ Asignación de chip a empleado activo con fecha de asignación
- ✅ Devolución y reasignación de chip a otro empleado
- ✅ Historial de asignaciones por chip (`/chips/{id}/historial`)
- ✅ Stats informativos: Total líneas, Asignados, Disponibles, Costo mensual (original), Total con descuento, Ahorro
- ✅ Filtros por: texto (número, empleado, operador), estado (todos/asignado/disponible), operador
- ✅ Tabla con columnas: Número, Empresa, Operador, Plan, Precio, Descuento, Precio c/Desc., Asignado a, Fecha, Estado, Acciones
- ✅ Frontend muestra modal de creación/edición de líneas con selectores de catálogos

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-013-1 | Backend: `rutas_chip.py` — endpoint GET `/chips/catalogos` (operadores, planes, descuentos), POST `/chips/catalogo/{tabla}` (agregar catálogo) | ✅ Done |
| ERP-013-2 | Backend: `rutas_chip.py` — endpoints GET `/chips` (listado con asignación), POST `/chips` (crear), PUT `/{id}` (editar), DELETE `/{id}` (eliminar) | ✅ Done |
| ERP-013-3 | Backend: `rutas_chip.py` — endpoint GET `/chips/personal` empleados activos para asignación | ✅ Done |
| ERP-013-4 | Backend: `rutas_chip.py` — endpoints POST `/chips/{id}/asignar`, PUT `/chips/{id}/devolver`, PUT `/chips/{id}/reasignar` | ✅ Done |
| ERP-013-5 | Backend: `rutas_chip.py` — endpoint GET `/chips/{id}/historial` historial de asignaciones del chip | ✅ Done |
| ERP-013-6 | Frontend: `Chips.jsx` — vista con stats (total, asignados, disponibles, costo original, total c/descuento, ahorro), tabla filtrable y acciones | ✅ Done |
| ERP-013-7 | Frontend: `Chips.jsx` — formularios de creación/edición de línea con selectores de operador, plan, descuento, empresa | ✅ Done |
| ERP-013-8 | Frontend: `Chips.jsx` — acciones inline: asignar, devolver, reasignar, ver historial, editar, eliminar | ✅ Done |
| ERP-013-9 | Frontend: `Chips.css` — estilos de tabla, stats, formularios con soporte dark mode y responsive | ✅ Done |

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

**Criterios de Aceptación:**
- ✅ 6 endpoints en `rutas_permisos.py` para gestión RBAC de permisos del sistema
- ✅ Listado de todos los submódulos registrados en `permiso_accs`
- ✅ Vista de roles con sus submódulos asignados (ADMIN + SUPERVISOR pueden leer)
- ✅ Modificación de permisos por rol: actualizar submódulos accesibles (solo ADMIN)
- ✅ Cambio de rol de usuario (solo ADMIN)
- ✅ Consulta de permisos propios para renderizado dinámico del Sidebar
- ✅ Listado de empleados con permisos derivados de su rol (vista de auditoría)
- ✅ Arquitectura de servicio separada: `permiso_service.py` con lógica de negocio (SRP)
- ✅ Control de acceso en capa de ruta: ADMIN full access, SUPERVISOR read-only, otros 403
- ✅ Frontend: interfaz de administración con asignación de submódulos por rol

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-014-1 | Backend: `rutas_permisos.py` — endpoints GET `/submodulos` (listar submódulos) y GET `/roles` (roles con permisos asignados) | ✅ Done |
| ERP-014-2 | Backend: `rutas_permisos.py` — endpoint PUT `/roles/{id}` actualizar permisos de un rol (solo ADMIN) | ✅ Done |
| ERP-014-3 | Backend: `rutas_permisos.py` — endpoint GET `/empleados` empleados con permisos derivados del rol | ✅ Done |
| ERP-014-4 | Backend: `rutas_permisos.py` — endpoint PUT `/empleados/{id}/rol` cambiar rol de un usuario (solo ADMIN) | ✅ Done |
| ERP-014-5 | Backend: `rutas_permisos.py` — endpoint GET `/mis-permisos` submódulos accesibles del usuario actual (para Sidebar dinámico) | ✅ Done |
| ERP-014-6 | Backend: `servicios/permiso_service.py` — lógica de negocio separada siguiendo SRP: validaciones de rol, resolución de permisos, autorización | ✅ Done |
| ERP-014-7 | Frontend: `GestionPermisos.jsx` — interfaz de administración: tabla de roles, checkboxes de submódulos, cambio de rol de empleados | ✅ Done |
| ERP-014-8 | Frontend: `GestionPermisos.css` — estilos con tabla de permisos, checkboxes y soporte dark mode | ✅ Done |

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

**Criterios de Aceptación:**
- ✅ Nginx escucha en puerto 80 como punto de entrada unificado
- ✅ Proxy inverso: `/api/` → backend FastAPI (puerto 4000) con timeouts de 120s
- ✅ Proxy inverso: `/chat/` → chat backend FastAPI (puerto 4001)
- ✅ WebSocket upgrade: `/socket.io/` → chat backend (puerto 4001) con timeout de 86400s (24h)
- ✅ Servicio de archivos estáticos: Vite build desde `C:\nginx\html\erp\`
- ✅ SPA routing: `try_files $uri $uri/ /index.html` para React Router
- ✅ Headers de seguridad: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ Compresión gzip habilitada para text/CSS/JSON/JS/XML/SVG
- ✅ Caché de assets: `/assets/` → 1 año, `Cache-Control: public, immutable`
- ✅ Límite de subida: `client_max_body_size 25M`
- ✅ Script `start.ps1` automatiza arranque de 3 servicios: backend (4000), chat (4001), frontend dev (3000)
- ✅ Script mata procesos previos en puertos 4000/4001/3000, valida existencia de venv, cleanup al salir
- ✅ Acceso desde cualquier dispositivo en red LAN (`http://intraneteq`)

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-015-1 | Configurar `nginx.conf` — server block puerto 80 con `server_name intraneteq` y root en `html/erp` | ✅ Done |
| ERP-015-2 | Configurar proxy inverso `/api/` → `localhost:4000` con `proxy_read_timeout 120s`, `proxy_send_timeout 120s` | ✅ Done |
| ERP-015-3 | Configurar proxy inverso `/chat/` → `localhost:4001` para endpoints REST del chat | ✅ Done |
| ERP-015-4 | Configurar WebSocket upgrade `/socket.io/` → `localhost:4001` con headers `Upgrade`, `Connection` y timeout 86400s | ✅ Done |
| ERP-015-5 | Configurar headers de seguridad: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy` | ✅ Done |
| ERP-015-6 | Configurar compresión gzip para tipos: text/plain, text/css, application/json, application/javascript, text/xml, image/svg+xml | ✅ Done |
| ERP-015-7 | Configurar caché de assets estáticos: location `/assets/` con `expires 1y` y `Cache-Control: public, immutable` | ✅ Done |
| ERP-015-8 | Configurar SPA routing: `try_files $uri $uri/ /index.html` y `client_max_body_size 25M` | ✅ Done |
| ERP-015-9 | Crear `start.ps1` — script PowerShell que arranca backend (4000), chat (4001), frontend (3000) con kill de procesos previos | ✅ Done |
| ERP-015-10 | Ejecutar `npm run build` en `erp-poo/` y copiar `dist/*` a `C:\nginx\html\erp\` | ✅ Done |
| ERP-015-11 | Verificar acceso completo desde navegador: login, dashboard, API, chat WebSocket | ✅ Done |

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

**Criterios de Aceptación:**
- ✅ `DOCUMENTACION_ERP.md` con más de 1500 líneas cubriendo arquitectura, backend, frontend y despliegue
- ✅ Documentación de cada módulo backend: endpoints, parámetros, respuestas y dependencias
- ✅ Documentación de cada módulo frontend: componentes, props, hooks y flujos de navegación
- ✅ Diagramas de arquitectura: topología de red, flujo de datos, stack tecnológico
- ✅ `README.md` con instrucciones paso a paso de instalación y despliegue
- ✅ Script SQL (`erp.sql`) versionado y documentado con comentarios
- ✅ `PLAN_DE_TRABAJO_Y_JIRA.md` con plan de trabajo completo y estructura JIRA (épicas, stories, tasks)
- ✅ Capacitación impartida a usuarios finales con guía de uso del sistema

**Tareas:**
| ID | Tarea | Estado |
|----|-------|--------|
| ERP-016-1 | Redactar `DOCUMENTACION_ERP.md` — sección Backend: arquitectura FastAPI, middleware, autenticación, ORM automap, MongoDB async | ✅ Done |
| ERP-016-2 | Redactar `DOCUMENTACION_ERP.md` — sección Frontend: estructura Vite+React, componentes, módulos, hooks, servicios, routing | ✅ Done |
| ERP-016-3 | Redactar `DOCUMENTACION_ERP.md` — sección Despliegue: configuración Nginx, proxy inverso, WebSocket, headers de seguridad | ✅ Done |
| ERP-016-4 | Documentar `README.md` — instrucciones de instalación: requisitos, BD, dependencias, variables de entorno, arranque | ✅ Done |
| ERP-016-5 | Versionado del esquema SQL (`erp.sql`) — 71 tablas documentadas con comentarios, DROP IF EXISTS + CREATE | ✅ Done |
| ERP-016-6 | Redactar `PLAN_DE_TRABAJO_Y_JIRA.md` — plan de trabajo con tabla de actividades + estructura JIRA completa (10 épicas, 16 stories, 140+ tareas) | ✅ Done |
| ERP-016-7 | Capacitación a usuarios finales — sesiones presenciales con guía de uso para cada módulo del sistema | ✅ Done |

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
| Total de Tareas | 143 |
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
