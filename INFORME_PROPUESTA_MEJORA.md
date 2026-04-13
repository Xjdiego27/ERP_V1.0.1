# CAPÍTULO II: PROPUESTA DE MEJORA

---

## 2.1 Introducción

El presente capítulo detalla la propuesta de mejora desarrollada para la empresa, consistente en la implementación de un **Sistema Intranet/ERP Corporativo** que centraliza y digitaliza los procesos internos de gestión de recursos humanos, soporte técnico, comunicación interna, control de asistencias, inventario de activos tecnológicos y administración de permisos del sistema. La solución se fundamenta en una arquitectura web moderna de tres capas (frontend, backend API, base de datos) desplegada en la red LAN corporativa, accesible desde cualquier dispositivo conectado a la red interna sin necesidad de instalación adicional en los equipos cliente.

La propuesta responde a la necesidad de eliminar procesos manuales basados en hojas de cálculo, correos electrónicos y comunicación verbal que generaban pérdida de información, duplicidad de datos, lentitud en la toma de decisiones y falta de trazabilidad en las operaciones administrativas. El sistema desarrollado automatiza estos flujos mediante una plataforma unificada que integra 10 módulos funcionales, más de 148 endpoints REST, comunicación en tiempo real vía WebSocket y sincronización biométrica con dispositivos ZKTeco para el control de asistencias.

---

## 2.2 Descripción General

El Sistema Intranet/ERP Corporativo es una aplicación web de uso interno que permite a los empleados, supervisores y administradores de la organización gestionar de manera integrada los siguientes procesos:

- **Gestión de Recursos Humanos:** Registro, edición y consulta del personal con datos personales, contractuales, contactos de emergencia, seguros/AFP y cuentas bancarias. Incluye gestión documental de contratos, adendas y memorandums.
- **Control de Asistencias:** Sincronización automática de marcaciones biométricas desde relojes ZKTeco, cálculo de puntualidad/tardanza/falta comparando contra horarios asignados, y sistema de justificaciones.
- **Sistema de Tickets de Soporte:** Flujo completo de creación, asignación, resolución y cierre de tickets con prioridades, categorías, notificaciones y valoración del servicio.
- **Chat Corporativo en Tiempo Real:** Mensajería instantánea con sala general, conversaciones privadas, grupos, stickers, envío de archivos y zumbidos, implementado como microservicio independiente con Socket.IO.
- **Panel Informativo (Dashboard):** Visualización del menú del comedor, eventos corporativos y cumpleaños del mes con sistema de saludos entre compañeros.
- **Inventario de Equipos Tecnológicos:** Registro y asignación de PCs, laptops y monitores con especificaciones técnicas detalladas.
- **Gestión de Líneas Corporativas (Chips):** Control de líneas celulares con operadores, planes, descuentos y asignación a empleados.
- **Gestión de Correos Corporativos:** Administración de cuentas de correo con cifrado AES para contraseñas.
- **Administración de Permisos del Sistema:** Control de acceso basado en roles (RBAC) con asignación dinámica de submódulos por rol.
- **Autenticación Multi-empresa:** Login con selección de empresa, tokens JWT, bloqueo por intentos fallidos y cambio de contraseña obligatorio.

El sistema opera bajo una arquitectura **multi-empresa**, permitiendo que un mismo usuario acceda a distintas empresas del grupo corporativo con un único conjunto de credenciales, manteniendo la segregación de datos por empresa en todas las consultas.

---

## 2.3 Objetivo General

Desarrollar e implementar un Sistema Intranet/ERP Corporativo basado en tecnologías web modernas (FastAPI, React, MariaDB, MongoDB, Socket.IO) que centralice, automatice y optimice los procesos internos de gestión administrativa, recursos humanos, soporte técnico y comunicación de la empresa, eliminando la dependencia de procesos manuales y proporcionando una plataforma unificada accesible desde la red LAN corporativa.

---

## 2.4 Objetivos Específicos

1. Implementar un módulo de autenticación seguro con tokens JWT (HS256), contraseñas hasheadas con Argon2id, bloqueo automático tras intentos fallidos y soporte multi-empresa.

2. Desarrollar un módulo de Recursos Humanos (RRHH) que permita el CRUD completo de empleados con datos personales, contractuales, contactos de emergencia, seguros/AFP y cuentas bancarias, incluyendo gestión documental vinculada.

3. Integrar dispositivos biométricos ZKTeco para la captura automática de marcaciones y desarrollar un motor de cálculo de asistencias que compare marcajes contra horarios asignados, determinando puntualidad, tardanzas y faltas.

4. Diseñar e implementar un sistema de tickets de soporte con flujo de estados controlado (ABIERTO → ASIGNADO → RESUELTO → CERRADO), asignación a técnicos, reapertura con motivo y valoración del servicio.

5. Construir un microservicio de chat corporativo en tiempo real utilizando Socket.IO con soporte para sala general, mensajes privados, grupos, stickers, archivos adjuntos y notificaciones sonoras.

6. Crear un panel informativo (Dashboard) que presente el menú del comedor, eventos corporativos y cumpleaños del mes, con un sistema interactivo de saludos de cumpleaños entre compañeros.

7. Desarrollar módulos de inventario para la gestión de equipos tecnológicos (con especificaciones de hardware) y líneas celulares corporativas (con control de costos y descuentos).

8. Implementar un sistema de permisos basado en roles (RBAC) que permita la asignación dinámica de módulos accesibles por cada rol del sistema.

9. Establecer un sistema de auditoría automática que registre todos los cambios críticos en MongoDB, incluyendo módulo, acción, datos anteriores/nuevos y usuario responsable.

10. Desplegar la aplicación en la red corporativa utilizando Nginx como proxy inverso unificado con headers de seguridad, compresión gzip y caché de assets estáticos.

---

## 2.5 Alcance de la Solución

La siguiente tabla describe el alcance funcional del sistema por módulo:

| N° | Módulo | Alcance | Limitaciones |
|----|--------|---------|--------------|
| 1 | **Autenticación** | Login multi-empresa, JWT (HS256), Argon2id, bloqueo por intentos, reset de contraseña, selector de empresa | No incluye autenticación de dos factores (2FA) ni SSO externo |
| 2 | **RRHH — Personal** | CRUD completo de empleados (datos personales, contrato, contactos, seguros/AFP, cuentas bancarias, foto de perfil), gestión documental (contratos, adendas, memorandums), historial de cambios | No incluye módulo de nómina ni cálculo de planilla de remuneraciones |
| 3 | **RRHH — Horarios** | CRUD de horarios con detalle semanal (7 días), asignación individual y masiva a empleados, desactivación lógica | No soporta horarios rotativos automáticos ni turnos nocturnos con cruce de día |
| 4 | **Dashboard** | Menú del comedor (imagen WebP), 3 slots de eventos corporativos (CRUD de imagen), cumpleaños del mes con saludos interactivos (mensaje + sticker) | Limitado a imágenes estáticas; no incluye calendario de eventos ni recordatorios |
| 5 | **Tickets** | Flujo completo: crear, asignar, resolver, cerrar, reabrir. Prioridades (Baja/Media/Alta/Urgente), categorías/subcategorías, valoración 1-3, reporte PDF mensual, integración SAP, generación de plantillas DOCX/PDF | No incluye SLA (Service Level Agreement) automático ni escalamiento por tiempo |
| 6 | **Chat Corporativo** | Sala general, mensajes privados 1-a-1, grupos, stickers (catálogo), zumbidos, indicador "escribiendo...", subida de archivos, lista de usuarios online/offline | No incluye videollamadas, mensajes de voz ni cifrado end-to-end |
| 7 | **Asistencias** | Sincronización automática ZKTeco → MongoDB, consulta individual y general, cálculo puntual/tardanza/falta, justificaciones por día y por rango, categorías configurables | Requiere conectividad de red con el reloj biométrico; no procesa horas extras |
| 8 | **Equipos TI** | CRUD de equipos con specs (procesador, RAM, disco, gama), asignación/devolución a empleados, foto, catálogos dinámicos, estadísticas | No incluye seguimiento de mantenimiento preventivo ni depreciación de activos |
| 9 | **Chips (Líneas)** | CRUD de líneas celulares, operadores/planes/descuentos, asignación/devolución/reasignación, historial, estadísticas de costo | No incluye integración directa con operadores telefónicos |
| 10 | **Correos Corp.** | CRUD de correos corporativos, cifrado AES de contraseñas, desbloqueo masivo con clave AES | No incluye gestión de buzones de correo ni sincronización con Exchange/Gmail |
| 11 | **Permisos** | RBAC con submódulos, asignación de permisos por rol, cambio de rol por admin, renderizado dinámico de Sidebar | No incluye permisos a nivel de registro individual (row-level security) |
| 12 | **Notificaciones** | Centro unificado con 9+ tipos (contratos por vencer, cumpleaños, menú nuevo, evento, faltas, tickets), interacción desde notificación | Solo notificaciones in-app; no incluye push notifications ni email |
| 13 | **Auditoría** | Registro automático de cambios en MongoDB (módulo, acción, datos previos/nuevos, usuario, timestamp) | Solo audita operaciones de escritura en módulo Personal |
| 14 | **Despliegue** | Nginx como proxy inverso, headers de seguridad, gzip, caché de assets, script automatizado de arranque, acceso LAN | Despliegue en red local; no incluye HTTPS ni despliegue en cloud |

---

## 2.6 Beneficios Esperados

### Beneficios Tangibles

| N° | Beneficio | Descripción | Indicador |
|----|-----------|-------------|-----------|
| 1 | Reducción de tiempo en gestión de personal | Eliminación de registros manuales en Excel; consultas instantáneas con filtros por área, estado, cargo | Reducción estimada del 70% del tiempo de búsqueda de información de empleados |
| 2 | Control automatizado de asistencias | Sincronización biométrica elimina el registro manual y la manipulación de datos de asistencia | 100% de marcaciones capturadas automáticamente sin intervención humana |
| 3 | Reducción de tiempos de respuesta en soporte | Flujo de tickets con asignación, priorización y seguimiento elimina solicitudes verbales y por correo | Tiempo promedio de respuesta medible y trazable por ticket |
| 4 | Ahorro en costos de comunicación | Chat corporativo en tiempo real reduce dependencia de herramientas externas de mensajería | Comunicación interna centralizada sin costo adicional de licencias |
| 5 | Control de inventario de activos TI | Registro centralizado de equipos y líneas con asignación trazable reduce pérdida y duplicidad | 100% de activos TI registrados con historial de asignación |
| 6 | Visibilidad de costos de telefonía | Dashboard de chips con cálculo automático de costo total, descuentos y ahorro mensual | Control preciso del gasto en líneas corporativas |

### Beneficios Intangibles

| N° | Beneficio | Descripción |
|----|-----------|-------------|
| 1 | Mejora en la cultura organizacional | Panel informativo con eventos, menú y cumpleaños fomenta la integración del equipo |
| 2 | Seguridad de la información | Contraseñas cifradas con Argon2id y AES, tokens JWT, auditoría de cambios, headers de seguridad HTTP |
| 3 | Escalabilidad tecnológica | Arquitectura modular permite agregar nuevos módulos sin afectar los existentes |
| 4 | Trazabilidad y auditoría | Registro automático de todas las operaciones críticas con datos anteriores y nuevos |
| 5 | Mejora en toma de decisiones | Dashboards con estadísticas de tickets, asistencias y equipos proporcionan datos en tiempo real |
| 6 | Reducción de la brecha digital | Interfaz web accesible desde cualquier navegador sin instalación, con soporte responsive y dark mode |

---

## 2.7 Procesos Digitalizados

La siguiente tabla presenta los procesos que fueron digitalizados por el sistema, indicando el estado anterior (AS-IS) y el estado posterior (TO-BE):

| N° | Proceso | AS-IS (Antes) | TO-BE (Después) |
|----|---------|---------------|-----------------|
| 1 | **Registro de personal** | Archivos Excel compartidos por correo; datos dispersos en múltiples hojas de cálculo sin validación | Formulario web con validación en tiempo real, 12 endpoints API, almacenamiento centralizado en BD relacional con catálogos normalizados |
| 2 | **Control de asistencias** | Revisión manual del reloj biométrico; cálculo manual en Excel de tardanzas y faltas | Sincronización automática ZKTeco → MongoDB cada 60 segundos; cálculo automático de estado comparando marcajes vs horario asignado |
| 3 | **Gestión de horarios** | Horarios comunicados verbalmente o en documentos Word; asignación informal | CRUD de horarios con detalle semanal, asignación individual y masiva desde interfaz web |
| 4 | **Solicitudes de soporte TI** | Solicitudes por correo electrónico, teléfono o verbalmente; sin registro ni seguimiento | Sistema de tickets con flujo de estados, priorización, asignación a técnicos, notificaciones y reportes PDF |
| 5 | **Comunicación interna** | Grupos de WhatsApp personales; información mezclada con mensajes personales | Chat corporativo dedicado con sala general, privados, grupos, stickers y archivos; separación total de comunicación personal |
| 6 | **Publicación de menú/eventos** | Fotos del menú enviadas por WhatsApp; eventos anunciados verbalmente o en correo | Dashboard con secciones dedicadas: subida de imagen WebP del menú, 3 slots de eventos, notificaciones automáticas de publicación |
| 7 | **Saludos de cumpleaños** | Dependiente de la memoria individual; muchos compañeros olvidados | Sistema automático de detección de cumpleaños, modal de saludo con stickers, listado de pendientes, notificación de cumpleaños del día/próximo |
| 8 | **Inventario de equipos TI** | Listado en Excel sin fotos ni especificaciones detalladas; asignaciones sin registro formal | CRUD de equipos con specs de hardware (procesador, RAM, disco, gama), foto, asignación/devolución con historial y estadísticas |
| 9 | **Control de líneas celulares** | Hoja de cálculo con números y nombres; sin control de costos ni historial de asignación | CRUD de líneas con operador/plan/descuento, asignación/devolución/reasignación, historial por chip, dashboard de costos |
| 10 | **Gestión de correos corporativos** | Contraseñas almacenadas en texto plano en Excel compartido | Gestión cifrada con AES_ENCRYPT/AES_DECRYPT, desbloqueo masivo controlado, copia al portapapeles |
| 11 | **Administración de permisos** | Permisos configurados directamente en BD por el desarrollador | Interfaz web de administración RBAC: asignación de submódulos por rol, cambio de rol de empleados, renderizado dinámico de Sidebar |
| 12 | **Documentos laborales** | Contratos y adendas en carpetas físicas o compartidas sin clasificación | CRUD de documentos vinculados por contrato → anexos, con tipos y motivos catalogados |
| 13 | **Generación de documentos** | Plantillas Word editadas manualmente para cada empleado | Sistema de plantillas con placeholders auto-rellenados desde BD, generación automática DOCX/PDF |
| 14 | **Monitoreo de contratos** | Revisión manual periódica de fechas de vencimiento | Notificación automática de contratos por vencer (30/15/7 días) en centro de notificaciones |

---

## 2.8 Diagramas de Actividades TO-BE

A continuación se presentan las descripciones de los diagramas de actividades para los principales procesos del sistema en su estado TO-BE (digitalizado). Los diagramas gráficos correspondientes se presentan como figuras adjuntas.

### 2.8.1 Proceso de Autenticación y Acceso

**Actores:** Usuario, Sistema (Backend API), Base de Datos

**Flujo principal:**
1. El usuario accede a la URL del sistema desde su navegador (`http://intraneteq`).
2. El sistema presenta la pantalla de Login con campos: usuario y contraseña.
3. El usuario ingresa sus credenciales y envía el formulario.
4. El backend consulta en la base de datos si el usuario existe.
   - **Si no existe:** retorna error "Credenciales inválidas".
   - **Si está bloqueado (INTENT_LOGIN ≥ 3):** retorna error "Cuenta bloqueada".
5. El backend verifica el hash Argon2id de la contraseña.
   - **Si no coincide:** incrementa INTENT_LOGIN y retorna error.
6. Si las credenciales son válidas, el backend consulta las empresas asociadas al usuario.
7. El sistema presenta al usuario la lista de empresas disponibles.
8. El usuario selecciona una empresa.
9. El backend genera un token JWT (HS256) con payload: `sub`, `id_accs`, `id_emp`, `rol`, `id_personal`, `nombre`.
10. **Si RESET_PASS = 1:** el sistema redirige al módulo de cambio de contraseña obligatorio.
11. **Si RESET_PASS = 0:** el sistema redirige al Dashboard.
12. El token se almacena en memoria (no localStorage) para prevenir ataques XSS.

> **[FIGURA: Diagrama de Actividades — Proceso de Autenticación y Acceso]**

---

### 2.8.2 Proceso de Gestión de Personal (RRHH)

**Actores:** Jefe de RRHH, Sistema, Base de Datos

**Flujo principal — Registrar nuevo empleado:**
1. El Jefe de RRHH accede al módulo RRHH desde el Sidebar.
2. El sistema carga el listado de personal filtrado por la empresa del token.
3. El Jefe de RRHH hace clic en "Nuevo Empleado".
4. El sistema presenta el formulario de registro con catálogos precargados (áreas, departamentos, cargos, grados, tipos de contrato, etc.).
5. El Jefe de RRHH completa los datos personales, contractuales y laborales.
6. El Jefe de RRHH sube la foto de perfil (JPG/PNG/WEBP, máx. 5MB).
7. El sistema valida los campos obligatorios y crea el registro en la base de datos.
8. El sistema genera automáticamente las credenciales de acceso (usuario = código de empleado, password = NUM_DOC, RESET_PASS = 1).
9. El sistema registra la operación en la colección de auditoría de MongoDB.
10. El sistema retorna al listado actualizado con el nuevo empleado.

**Flujo alternativo — Consultar perfil propio:**
1. Cualquier empleado accede a "Mi Espacio" desde el Sidebar.
2. El sistema consulta el endpoint `/mi-perfil` usando el token JWT.
3. El sistema presenta los datos personales, contractuales y de asistencia del empleado.

> **[FIGURA: Diagrama de Actividades — Gestión de Personal]**

---

### 2.8.3 Proceso de Control de Asistencias

**Actores:** Empleado, Reloj Biométrico ZKTeco, Script HUELLERO, Backend API, MongoDB, Base de Datos MySQL

**Flujo principal:**
1. El empleado registra su huella dactilar en el reloj biométrico ZKTeco al ingresar/salir.
2. El script `HUELLERO/Asistencias.py` se conecta al reloj vía protocolo ZK (UDP) cada 60 segundos.
3. El script lee todas las marcaciones y las agrupa por DNI (`emp_pin`) y día.
4. El script ejecuta operaciones bulk `UpdateOne` (upsert) hacia la colección `asistencia` de MongoDB.
5. Cuando un usuario o jefe de RRHH consulta las asistencias desde el frontend:
   a. El backend consulta los marcajes del período desde MongoDB.
   b. El backend consulta el horario asignado al empleado desde MySQL.
   c. El backend compara cada marcaje contra el horario y determina el estado: PUNTUAL, TARDANZA o FALTA.
   d. El backend retorna el detalle diario con estado calculado y resumen del período.
6. Para justificar una falta o tardanza:
   a. El Jefe de RRHH selecciona al empleado y la fecha (o rango).
   b. El sistema presenta las categorías de justificación configurables.
   c. El Jefe de RRHH registra la justificación con categoría y observación.
   d. El sistema almacena la justificación en la colección `justificaciones` de MongoDB.

> **[FIGURA: Diagrama de Actividades — Control de Asistencias]**

---

### 2.8.4 Proceso de Gestión de Tickets de Soporte

**Actores:** Empleado (solicitante), Técnico de Soporte, Administrador, Sistema

**Flujo principal:**
1. El empleado accede al módulo "Ingresar Ticket" y completa el formulario: tipo, categoría, subcategoría, prioridad, descripción y foto adjunta (opcional).
2. El sistema crea el ticket con estado `ABIERTO` y genera una notificación en MongoDB.
3. El administrador o técnico visualiza el ticket en el panel de administración.
4. El administrador asigna el ticket a un técnico del equipo SOPORTE → estado cambia a `ASIGNADO`.
5. El técnico trabaja en la resolución y marca el ticket como `RESUELTO`.
6. El empleado revisa la resolución:
   - **Si conforme:** valora el servicio (escala 1-3: malo, regular, bueno) y el ticket pasa a `CERRADO`.
   - **Si no conforme:** solicita reapertura con motivo obligatorio → ticket vuelve a `ABIERTO`.
7. En cada cambio de estado se genera una notificación persistente.
8. El administrador puede generar reportes PDF mensuales con estadísticas de tickets.

**Flujo alternativo — Integración SAP:**
1. Para tickets que requieren adquisición de artículos o servicios, el técnico registra información SAP (artículos, servicios, socios de negocio) vinculada al ticket.

> **[FIGURA: Diagrama de Actividades — Gestión de Tickets de Soporte]**

---

### 2.8.5 Proceso de Chat Corporativo

**Actores:** Empleado A, Empleado B, Servidor WebSocket (Socket.IO), MongoDB

**Flujo principal — Mensajería privada:**
1. El Empleado A abre el panel de chat lateral.
2. El sistema muestra la lista de contactos con indicador online/offline y badge de mensajes no leídos.
3. El Empleado A selecciona al Empleado B.
4. El sistema carga el historial de mensajes paginado desde MongoDB.
5. El Empleado A escribe un mensaje y lo envía.
6. El cliente emite evento WebSocket `mensaje` al servidor Socket.IO (puerto 4001).
7. El servidor persiste el mensaje en MongoDB colección `mensajes`.
8. El servidor emite el mensaje al Empleado B si está conectado.
9. Si el Empleado B no tiene la ventana de chat abierta, se reproduce un sonido de notificación y se incrementa el badge.

**Flujo alternativo — Sala general:**
1. Cualquier empleado accede a la sala general del chat.
2. Los mensajes se emiten vía evento `msg_general` a todos los usuarios conectados.

**Flujo alternativo — Grupos:**
1. Un empleado crea un grupo seleccionando participantes y asignando un nombre.
2. Los mensajes del grupo se emiten vía evento `msg_grupo` a todos los miembros.

> **[FIGURA: Diagrama de Actividades — Chat Corporativo]**

---

### 2.8.6 Proceso de Dashboard Informativo

**Actores:** Administrador (publicador), Empleado (consumidor), Sistema

**Flujo principal — Publicar menú del comedor:**
1. El administrador accede a la sección de menú en el Dashboard.
2. Selecciona una imagen WebP del menú y la sube.
3. El sistema almacena la referencia en MongoDB colección `menus` y la imagen en disco (`public/assets/menus/`).
4. El sistema genera una notificación de "Menú nuevo publicado" para todos los empleados.
5. Al acceder al Dashboard, cualquier empleado visualiza el menú más reciente con opción de expandir la imagen.

**Flujo principal — Saludos de cumpleaños:**
1. Al cargar el Dashboard, el sistema detecta automáticamente cumpleañeros del día.
2. Si hay cumpleaños pendientes de saludo, se muestra el modal de felicitación.
3. El empleado redacta un mensaje (máx. 500 caracteres) y opcionalmente selecciona un sticker.
4. El sistema registra el saludo en MongoDB colección `saludos_cumple`.
5. Los empleados que aún no han saludado pueden acceder al modal desde el centro de notificaciones (clic en la notificación de cumpleaños).

> **[FIGURA: Diagrama de Actividades — Dashboard Informativo]**

---

### 2.8.7 Proceso de Gestión de Equipos TI

**Actores:** Administrador de TI, Sistema, Base de Datos

**Flujo principal:**
1. El Administrador de TI accede al módulo de Equipos.
2. Visualiza las estadísticas: Total equipos, Disponibles, Asignados (clickeables para filtrar).
3. Para registrar un nuevo equipo:
   a. Completa el formulario con: tipo, marca, modelo, serie, código, gama, procesador, RAM.
   b. Agrega discos de almacenamiento (capacidad y tipo).
   c. Sube una foto del equipo (opcional).
   d. El sistema crea el equipo con estado DISPONIBLE.
4. Para asignar un equipo:
   a. Selecciona un equipo disponible y un empleado activo.
   b. El sistema registra la asignación con fecha y actualiza el estado a ASIGNADO.
5. Para devolver un equipo:
   a. El Administrador registra la devolución.
   b. El sistema registra la fecha de devolución sin borrar el historial.
   c. El equipo vuelve a estado DISPONIBLE.

> **[FIGURA: Diagrama de Actividades — Gestión de Equipos TI]**

---

### 2.8.8 Proceso de Administración de Permisos RBAC

**Actores:** Administrador del Sistema, Sistema, Base de Datos

**Flujo principal:**
1. El Administrador accede al módulo de Gestión de Permisos.
2. El sistema muestra la tabla de roles con los submódulos asignados a cada uno.
3. Para modificar permisos:
   a. El Administrador selecciona un rol.
   b. Marca o desmarca los submódulos accesibles mediante checkboxes.
   c. El sistema actualiza la tabla `rol_accs` con los nuevos permisos.
4. Para cambiar el rol de un empleado:
   a. El Administrador selecciona al empleado.
   b. Asigna el nuevo rol desde un selector.
   c. El sistema actualiza `asignacion_accs` y el empleado obtiene los permisos del nuevo rol.
5. Los cambios surten efecto inmediatamente: el Sidebar del empleado se reconstruye dinámicamente según `/mis-permisos`.

> **[FIGURA: Diagrama de Actividades — Administración de Permisos RBAC]**

---

## 2.9 Matriz de Requerimientos de Software

### 2.9.1 Requerimientos Funcionales

| ID | Requerimiento | Módulo | Prioridad | Estado |
|----|---------------|--------|-----------|--------|
| RF-001 | El sistema debe permitir la autenticación mediante usuario y contraseña con selección de empresa | Autenticación | Alta | Implementado |
| RF-002 | El sistema debe generar tokens JWT con expiración configurable para mantener la sesión | Autenticación | Alta | Implementado |
| RF-003 | El sistema debe bloquear automáticamente la cuenta después de 3 intentos fallidos de login | Autenticación | Alta | Implementado |
| RF-004 | El sistema debe forzar el cambio de contraseña cuando el flag RESET_PASS esté activo | Autenticación | Alta | Implementado |
| RF-005 | El sistema debe permitir el CRUD completo de empleados con datos personales, contractuales y laborales | RRHH | Alta | Implementado |
| RF-006 | El sistema debe permitir la subida de foto de perfil con validación de formato (JPG/PNG/WEBP) y tamaño (máx. 5MB) | RRHH | Media | Implementado |
| RF-007 | El sistema debe gestionar sub-recursos del empleado: contactos de emergencia, seguros/AFP y cuentas bancarias | RRHH | Media | Implementado |
| RF-008 | El sistema debe permitir la consulta del perfil propio por cualquier empleado autenticado | RRHH | Alta | Implementado |
| RF-009 | El sistema debe ofrecer 15+ catálogos para normalización de datos (áreas, departamentos, cargos, AFP, bancos, etc.) | RRHH | Media | Implementado |
| RF-010 | El sistema debe permitir el CRUD de horarios con detalle semanal (7 días) y asignación individual/masiva | Horarios | Media | Implementado |
| RF-011 | El sistema debe sincronizar automáticamente las marcaciones del reloj ZKTeco hacia MongoDB | Asistencias | Alta | Implementado |
| RF-012 | El sistema debe calcular el estado de asistencia (puntual/tardanza/falta) comparando marcajes con horario asignado | Asistencias | Alta | Implementado |
| RF-013 | El sistema debe permitir justificaciones de asistencia por día individual y por rango de fechas | Asistencias | Media | Implementado |
| RF-014 | El sistema debe permitir la consulta general de asistencias con filtros por fecha, área, cargo, turno y estado | Asistencias | Media | Implementado |
| RF-015 | El sistema debe permitir la creación de tickets con tipo, categoría, subcategoría, prioridad, descripción y foto | Tickets | Alta | Implementado |
| RF-016 | El sistema debe implementar el flujo de estados: ABIERTO → ASIGNADO → RESUELTO → CERRADO | Tickets | Alta | Implementado |
| RF-017 | El sistema debe permitir la reapertura de tickets cerrados con motivo obligatorio | Tickets | Media | Implementado |
| RF-018 | El sistema debe permitir la valoración del servicio (escala 1-3) al cerrar un ticket | Tickets | Media | Implementado |
| RF-019 | El sistema debe generar reportes PDF de tickets por mes/año | Tickets | Baja | Implementado |
| RF-020 | El sistema debe permitir la generación de plantillas DOCX/PDF con placeholders auto-rellenados | Tickets | Baja | Implementado |
| RF-021 | El sistema debe proporcionar chat en tiempo real con sala general, mensajes privados y grupos | Chat | Alta | Implementado |
| RF-022 | El sistema debe soportar envío de stickers desde un catálogo organizado por categorías | Chat | Baja | Implementado |
| RF-023 | El sistema debe mostrar indicador de "escribiendo..." en tiempo real | Chat | Baja | Implementado |
| RF-024 | El sistema debe permitir envío de archivos adjuntos en el chat | Chat | Media | Implementado |
| RF-025 | El sistema debe emitir zumbidos (sonido + vibración visual) entre usuarios | Chat | Baja | Implementado |
| RF-026 | El sistema debe mostrar el menú del comedor, eventos corporativos y cumpleaños del mes en el Dashboard | Dashboard | Media | Implementado |
| RF-027 | El sistema debe detectar cumpleaños del día y presentar modal de saludo con mensaje + sticker | Dashboard | Media | Implementado |
| RF-028 | El sistema debe permitir reabrir el modal de cumpleaños desde las notificaciones | Dashboard | Baja | Implementado |
| RF-029 | El sistema debe implementar CRUD de equipos tecnológicos con especificaciones de hardware | Equipos | Media | Implementado |
| RF-030 | El sistema debe permitir asignación/devolución de equipos a empleados con historial | Equipos | Media | Implementado |
| RF-031 | El sistema debe implementar CRUD de líneas celulares con operador, plan y descuento | Chips | Media | Implementado |
| RF-032 | El sistema debe calcular y mostrar estadísticas de costos de líneas (total, descuento, ahorro) | Chips | Baja | Implementado |
| RF-033 | El sistema debe implementar gestión de correos corporativos con cifrado AES de contraseñas | Correos | Media | Implementado |
| RF-034 | El sistema debe permitir desbloqueo masivo de contraseñas con una sola clave AES | Correos | Media | Implementado |
| RF-035 | El sistema debe implementar control de acceso basado en roles (RBAC) con asignación dinámica de submódulos | Permisos | Alta | Implementado |
| RF-036 | El sistema debe generar notificaciones persistentes para 9+ tipos de evento (contratos, cumpleaños, tickets, etc.) | Notificaciones | Media | Implementado |
| RF-037 | El sistema debe registrar automáticamente los cambios críticos en auditoría (MongoDB) | Auditoría | Alta | Implementado |
| RF-038 | El sistema debe gestionar documentos laborales (contratos, adendas, memorandums) vinculados por contrato | Documentos | Media | Implementado |

### 2.9.2 Requerimientos No Funcionales

| ID | Requerimiento | Categoría | Prioridad | Estado |
|----|---------------|-----------|-----------|--------|
| RNF-001 | El sistema debe responder a cualquier solicitud API en menos de 2 segundos en condiciones normales | Rendimiento | Alta | Implementado |
| RNF-002 | El sistema debe clasificar el tiempo de respuesta como OK (<500ms), LENTO (500-2000ms) o CRÍTICO (>2000ms) mediante middleware | Rendimiento | Media | Implementado |
| RNF-003 | El sistema debe soportar acceso concurrente desde múltiples dispositivos en la red LAN | Escalabilidad | Alta | Implementado |
| RNF-004 | Las contraseñas de usuario deben almacenarse con hash Argon2id ($argon2id$v=19$m=65536,t=3,p=4) | Seguridad | Alta | Implementado |
| RNF-005 | Las contraseñas de correos corporativos deben almacenarse con AES_ENCRYPT de MySQL | Seguridad | Alta | Implementado |
| RNF-006 | Los tokens JWT deben firmarse con HS256 y almacenarse en memoria del navegador (no localStorage) | Seguridad | Alta | Implementado |
| RNF-007 | El sistema debe incluir headers de seguridad HTTP: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy | Seguridad | Media | Implementado |
| RNF-008 | Las variables sensibles (JWT_SECRET, AES_KEY, DB credentials) deben almacenarse en archivos .env excluidos de Git | Seguridad | Alta | Implementado |
| RNF-009 | El frontend debe ser responsive, adaptándose a dispositivos desktop, tablet y móvil | Usabilidad | Alta | Implementado |
| RNF-010 | El sistema debe soportar modo oscuro (dark mode) en todas las vistas | Usabilidad | Media | Implementado |
| RNF-011 | Nginx debe servir assets estáticos con caché de 1 año y header Cache-Control: public, immutable | Rendimiento | Media | Implementado |
| RNF-012 | Nginx debe comprimir respuestas con gzip para tipos: text, CSS, JSON, JS, XML, SVG | Rendimiento | Media | Implementado |
| RNF-013 | El WebSocket debe mantener conexiones persistentes con timeout de 24 horas (86400s) | Disponibilidad | Media | Implementado |
| RNF-014 | El CORS debe configurarse con regex para permitir acceso desde redes LAN privadas (192.168.x.x, 10.x.x.x, 172.16-31.x.x) | Seguridad | Alta | Implementado |
| RNF-015 | El sistema debe funcionar con MariaDB 10.4+ como motor relacional y MongoDB como motor documental | Compatibilidad | Alta | Implementado |
| RNF-016 | El límite de subida de archivos debe ser de 25MB configurado en Nginx | Rendimiento | Baja | Implementado |

---

## 2.10 Metodología de Desarrollo

### 2.10.1 Marco de Trabajo: Scrum

Para el desarrollo del Sistema Intranet/ERP Corporativo se adoptó la metodología ágil **Scrum**, que permite la entrega iterativa e incremental de funcionalidades a través de sprints de duración fija. Esta metodología se seleccionó por las siguientes razones:

- **Requisitos evolutivos:** Los procesos corporativos se definieron progresivamente durante el desarrollo, requiriendo flexibilidad para incorporar cambios.
- **Entregas frecuentes:** Cada sprint entrega funcionalidad completa y probada, permitiendo retroalimentación temprana de los usuarios finales.
- **Visibilidad del progreso:** Los artefactos de Scrum (Product Backlog, Sprint Backlog, tablero JIRA) proporcionan transparencia sobre el avance del proyecto.

### 2.10.2 Roles del Equipo Scrum

| Rol | Responsable | Responsabilidades |
|-----|-------------|-------------------|
| **Product Owner** | Gerencia de la empresa | Definición de prioridades, validación de entregables, aprobación de criterios de aceptación |
| **Scrum Master / Desarrollador** | Jorge Diego Fernández Villegas | Planificación de sprints, desarrollo full-stack (backend + frontend + despliegue), documentación técnica, capacitación de usuarios |
| **Stakeholders** | Jefes de área (RRHH, TI, Administración) | Validación funcional de cada módulo, retroalimentación sobre flujos de trabajo |

### 2.10.3 Sprints y Cronograma

El proyecto se ejecutó en **6 sprints** distribuidos en **18 semanas** (Marzo — Junio 2026):

| Sprint | Período | Duración | Épicas Abordadas | Story Points |
|--------|---------|----------|-------------------|:------------:|
| Sprint 1 | Semana 1-4 (Marzo) | 4 semanas | EPIC-01: Infraestructura y Entorno, EPIC-01: Base de Datos | 18 |
| Sprint 2 | Semana 5-7 (Abril) | 3 semanas | EPIC-02: Autenticación y Login | 21 |
| Sprint 3 | Semana 7-9 (Abril) | 3 semanas | EPIC-03: Módulo RRHH (Personal + Horarios) | 18 |
| Sprint 4 | Semana 9-12 (Abril-Mayo) | 4 semanas | EPIC-04: Panel Informativo, EPIC-05: Tickets | 21 |
| Sprint 5 | Semana 12-15 (Mayo-Junio) | 4 semanas | EPIC-06: Chat, EPIC-07: Asistencias, EPIC-08: Equipos/Chips | 47 |
| Sprint 6 | Semana 15-18 (Junio) | 4 semanas | EPIC-09: Permisos, EPIC-10: Despliegue y Documentación | 21 |
| | | **18 semanas** | **10 Épicas** | **146 SP** |

### 2.10.4 Artefactos Scrum Utilizados

- **Product Backlog:** 16 historias de usuario priorizadas con criterios de aceptación detallados, descompuestas en 143 tareas técnicas.
- **Sprint Backlog:** Selección de historias por sprint según prioridad y capacidad, con estimación en Story Points (escala Fibonacci).
- **Incremento:** Al final de cada sprint, un incremento funcional desplegable y probado en la red LAN corporativa.
- **Herramienta de gestión:** Estructura JIRA simulada documentada en `PLAN_DE_TRABAJO_Y_JIRA.md` con tablero Kanban (To Do, In Progress, Done).

---

## 2.11 Product Backlog

### 2.11.1 Épicas del Proyecto

| ID | Épica | Descripción | Stories | Tareas | Story Points |
|----|-------|-------------|:-------:|:------:|:------------:|
| EPIC-01 | Infraestructura y BD | Setup del entorno de desarrollo + diseño y creación del esquema de base de datos relacional (71 tablas, 3NF) y NoSQL (15 colecciones MongoDB) | 3 | 31 | 18 |
| EPIC-02 | Autenticación | Login multi-empresa con JWT, Argon2id, bloqueo por intentos, cambio de contraseña obligatorio | 2 | 17 | 21 |
| EPIC-03 | Módulo RRHH | CRUD completo de personal (12 endpoints), gestión documental, catálogos, horarios, auditoría | 2 | 20 | 18 |
| EPIC-04 | Panel Informativo | Dashboard con menú del comedor, eventos corporativos, cumpleaños y saludos interactivos | 1 | 10 | 8 |
| EPIC-05 | Sistema de Tickets | Flujo completo de soporte (crear→asignar→resolver→cerrar), prioridades, reportes PDF, plantillas, SAP | 1 | 14 | 13 |
| EPIC-06 | Chat en Tiempo Real | Microservicio Socket.IO con sala general, privados, grupos, stickers, zumbidos, archivos | 1 | 14 | 21 |
| EPIC-07 | Control de Asistencias | Integración ZKTeco, cálculo de estados, justificaciones, consultas con filtros | 1 | 11 | 13 |
| EPIC-08 | Inventario TI | Gestión de equipos (specs, asignación) y líneas celulares (costos, descuentos) | 2 | 19 | 13 |
| EPIC-09 | Permisos RBAC | Administración de permisos por rol, asignación dinámica de submódulos, Sidebar dinámico | 1 | 8 | 8 |
| EPIC-10 | Despliegue y Docs | Nginx, proxy inverso, headers de seguridad, script de arranque, documentación técnica | 2 | 18 | 13 |
| | | **TOTAL** | **16** | **162** | **146** |

### 2.11.2 Historias de Usuario Priorizadas

| ID | Historia de Usuario | Épica | Sprint | Prioridad | SP |
|----|---------------------|-------|--------|-----------|:--:|
| ERP-001 | Setup del entorno de desarrollo (Python 3.12, Node.js 22, MariaDB, MongoDB, virtualenv) | EPIC-01 | 1 | 🔴 Highest | 5 |
| ERP-002 | Diseño y creación del esquema de BD relacional (71 tablas, 3NF) | EPIC-01 | 1 | 🔴 Highest | 8 |
| ERP-003 | Diseño del esquema MongoDB (15 colecciones, 2 bases de datos) | EPIC-01 | 1 | 🔴 Highest | 5 |
| ERP-004 | Implementar autenticación backend (JWT, Argon2id, bloqueo, multi-empresa) | EPIC-02 | 2 | 🔴 Highest | 13 |
| ERP-005 | Implementar login frontend React (selector empresa, token en memoria, RESET_PASS) | EPIC-02 | 2 | 🔴 Highest | 8 |
| ERP-006 | CRUD completo de personal (12 endpoints, sub-recursos, auditoría, catálogos) | EPIC-03 | 3 | 🟠 High | 13 |
| ERP-007 | Gestión de horarios (CRUD con detalle semanal, asignación individual/masiva) | EPIC-03 | 3 | 🟡 Medium | 5 |
| ERP-008 | Dashboard con menú, eventos y cumpleaños (MongoDB, saludos, notificaciones) | EPIC-04 | 4 | 🟠 High | 8 |
| ERP-009 | Flujo completo de tickets de soporte (estados, prioridades, PDF, SAP, plantillas) | EPIC-05 | 4 | 🟠 High | 13 |
| ERP-010 | Microservicio de chat con Socket.IO (sala general, privados, grupos, stickers) | EPIC-06 | 5 | 🟠 High | 21 |
| ERP-011 | Integración biométrica ZKTeco + cálculo de asistencias + justificaciones | EPIC-07 | 5 | 🟠 High | 13 |
| ERP-012 | Gestión de equipos tecnológicos (specs, asignación/devolución, estadísticas) | EPIC-08 | 5 | 🟡 Medium | 8 |
| ERP-013 | Gestión de líneas corporativas/chips (CRUD, asignación, costos, historial) | EPIC-08 | 5 | 🟡 Medium | 5 |
| ERP-014 | Flujo de permisos RBAC (submódulos por rol, cambio de rol, Sidebar dinámico) | EPIC-09 | 6 | 🟡 Medium | 8 |
| ERP-015 | Configuración Nginx y despliegue en red LAN (proxy inverso, seguridad, script) | EPIC-10 | 6 | 🔴 Highest | 8 |
| ERP-016 | Documentación técnica completa y capacitación de usuarios | EPIC-10 | 6 | 🟠 High | 5 |

### 2.11.3 Criterios de Priorización

La priorización del Product Backlog se realizó considerando los siguientes criterios:

1. **Dependencias técnicas:** Las historias de infraestructura (EPIC-01) y autenticación (EPIC-02) son prerequisito para todos los demás módulos.
2. **Valor de negocio:** Los módulos de RRHH, Tickets y Asistencias aportan el mayor valor operativo al automatizar procesos críticos del día a día.
3. **Complejidad técnica:** El Chat (21 SP) fue la historia más compleja por requerir un microservicio independiente con WebSocket, y se programó en el Sprint 5 una vez estabilizada la arquitectura base.
4. **Riesgo técnico:** La integración biométrica ZKTeco se priorizó en Sprint 5 para permitir pruebas tempranas con el hardware disponible.

### 2.11.4 Estimación con Story Points

Se utilizó la escala de Fibonacci modificada (1, 2, 3, 5, 8, 13, 21) para la estimación:

| Story Points | Complejidad | Ejemplo en el proyecto |
|:------------:|-------------|------------------------|
| 5 | Baja | ERP-001: Setup de entorno, ERP-003: Schema MongoDB, ERP-007: Horarios, ERP-013: Chips |
| 8 | Media | ERP-005: Login frontend, ERP-008: Dashboard, ERP-012: Equipos, ERP-014: Permisos, ERP-015: Nginx |
| 13 | Alta | ERP-004: Auth backend, ERP-006: RRHH, ERP-009: Tickets, ERP-011: Asistencias |
| 21 | Muy Alta | ERP-010: Chat con Socket.IO (microservicio completo con WebSocket, MongoDB, archivos) |

---

## 2.12 Casos de Uso de Negocio

### 2.12.1 Identificación de Actores

| Actor | Tipo | Descripción |
|-------|------|-------------|
| **Empleado** | Primario | Usuario regular del sistema. Puede consultar su perfil, ver el dashboard, crear tickets, usar el chat, registrar asistencia vía huellero |
| **Jefe de RRHH** | Primario | Gestiona personal, horarios, asistencias, justificaciones y documentos laborales |
| **Administrador de TI** | Primario | Gestiona equipos tecnológicos, líneas celulares, correos corporativos y soporte técnico |
| **Administrador del Sistema** | Primario | Configura permisos RBAC, gestiona roles y accesos, supervisa auditoría |
| **Técnico de Soporte** | Primario | Atiende tickets asignados, resuelve incidencias y documenta soluciones |
| **Reloj Biométrico ZKTeco** | Secundario (dispositivo) | Dispositivo IoT que captura huellas dactilares y almacena marcaciones en memoria interna |
| **Script HUELLERO** | Secundario (sistema) | Proceso daemon que sincroniza marcaciones del ZKTeco hacia MongoDB cada 60 segundos |
| **Nginx** | Secundario (sistema) | Proxy inverso que enruta peticiones HTTP y WebSocket a los servicios backend |
| **MongoDB** | Secundario (sistema) | Motor documental para datos no relacionales: asistencias, chat, auditoría, menús, eventos |
| **MariaDB** | Secundario (sistema) | Motor relacional para datos estructurados: personal, contratos, equipos, tickets, permisos |

### 2.12.2 Lista de Casos de Uso

| ID | Caso de Uso | Actor(es) Principal(es) | Módulo |
|----|-------------|-------------------------|--------|
| CU-001 | Iniciar sesión con selección de empresa | Empleado | Autenticación |
| CU-002 | Cambiar contraseña (voluntario u obligatorio) | Empleado | Autenticación |
| CU-003 | Registrar nuevo empleado | Jefe de RRHH | RRHH |
| CU-004 | Editar datos de empleado | Jefe de RRHH | RRHH |
| CU-005 | Consultar perfil propio | Empleado | RRHH |
| CU-006 | Activar/Desactivar empleado | Jefe de RRHH | RRHH |
| CU-007 | Resetear contraseña de empleado | Jefe de RRHH | RRHH |
| CU-008 | Gestionar contactos de emergencia | Jefe de RRHH | RRHH |
| CU-009 | Gestionar seguros y AFP | Jefe de RRHH | RRHH |
| CU-010 | Gestionar cuentas bancarias | Jefe de RRHH | RRHH |
| CU-011 | Subir foto de perfil | Jefe de RRHH / Empleado | RRHH |
| CU-012 | Crear horario semanal | Jefe de RRHH | Horarios |
| CU-013 | Asignar horario a empleado(s) | Jefe de RRHH | Horarios |
| CU-014 | Registrar marcación biométrica | Empleado, ZKTeco | Asistencias |
| CU-015 | Consultar asistencia individual | Jefe de RRHH / Empleado | Asistencias |
| CU-016 | Consultar asistencia general con filtros | Jefe de RRHH | Asistencias |
| CU-017 | Justificar falta o tardanza | Jefe de RRHH | Asistencias |
| CU-018 | Crear ticket de soporte | Empleado | Tickets |
| CU-019 | Asignar ticket a técnico | Administrador de TI | Tickets |
| CU-020 | Resolver ticket | Técnico de Soporte | Tickets |
| CU-021 | Cerrar y valorar ticket | Empleado | Tickets |
| CU-022 | Reabrir ticket con motivo | Empleado | Tickets |
| CU-023 | Generar reporte PDF de tickets | Administrador de TI | Tickets |
| CU-024 | Generar documento desde plantilla | Administrador de TI | Tickets |
| CU-025 | Enviar mensaje privado por chat | Empleado | Chat |
| CU-026 | Enviar mensaje en sala general | Empleado | Chat |
| CU-027 | Crear grupo de chat | Empleado | Chat |
| CU-028 | Enviar sticker | Empleado | Chat |
| CU-029 | Enviar archivo por chat | Empleado | Chat |
| CU-030 | Enviar zumbido | Empleado | Chat |
| CU-031 | Publicar menú del comedor | Administrador | Dashboard |
| CU-032 | Publicar evento corporativo | Administrador | Dashboard |
| CU-033 | Enviar saludo de cumpleaños | Empleado | Dashboard |
| CU-034 | Registrar equipo tecnológico | Administrador de TI | Equipos |
| CU-035 | Asignar equipo a empleado | Administrador de TI | Equipos |
| CU-036 | Devolver equipo | Administrador de TI | Equipos |
| CU-037 | Registrar línea celular | Administrador de TI | Chips |
| CU-038 | Asignar/Devolver/Reasignar chip | Administrador de TI | Chips |
| CU-039 | Registrar correo corporativo | Administrador de TI | Correos |
| CU-040 | Desbloquear contraseñas de correos (masivo) | Administrador de TI | Correos |
| CU-041 | Modificar permisos de un rol | Administrador del Sistema | Permisos |
| CU-042 | Cambiar rol de un empleado | Administrador del Sistema | Permisos |
| CU-043 | Consultar notificaciones | Empleado | Notificaciones |
| CU-044 | Gestionar documentos laborales | Jefe de RRHH | Documentos |

> **[FIGURA: Diagrama de Casos de Uso del Sistema]**

---

## 2.13 Arquitectura de la Base de Datos

### 2.13.1 Motor Relacional — MariaDB 10.4

El sistema utiliza **MariaDB 10.4** como motor de base de datos relacional, diseñado en **Tercera Forma Normal (3NF)** para garantizar la integridad referencial y eliminar la redundancia de datos. El esquema comprende **71 tablas** organizadas en los siguientes grupos funcionales:

**Tablas de Acceso y Seguridad:**
- `accs` — Credenciales de acceso (usuario, hash Argon2id, intentos de login, flag de reset)
- `rol_accs` — Roles del sistema con asignación de submódulos
- `permiso_accs` — Catálogo de 16 submódulos del sistema
- `asignacion_accs` — Relación empleado ↔ rol

**Tablas de Personal y RRHH:**
- `personal` — Datos personales del empleado (nombre, DNI, fecha nacimiento, foto, etc.)
- `contrato` — Contratos laborales (tipo, fecha inicio/fin, modalidad, salario)
- `contrato_anexo` — Adendas y memorandums vinculados al contrato
- `area`, `departamento`, `cargo` — Catálogos de estructura organizacional
- `contacto_emergencia` — Contactos del empleado
- `seguro`, `afp` — Seguros y administradoras de pensiones
- `cuenta_bancaria` — Cuentas del empleado con banco y moneda

**Tablas de Horarios:**
- `horario` — Cabecera del horario (nombre, estado)
- `horario_detalle` — Detalle semanal (7 registros por horario: día, hora entrada, hora salida)

**Tablas de Tickets:**
- `ticket` — Cabecera del ticket (tipo, estado, prioridad, creador, asignado)
- `ticket_tipo`, `ticket_categoria`, `ticket_subcategoria` — Catálogos jerárquicos
- `ticket_sap` — Integración SAP vinculada al ticket

**Tablas de Equipos TI:**
- `equipo` — Equipos tecnológicos (serie, tipo, marca, modelo, procesador, RAM, gama)
- `equipo_disco` — Almacenamiento del equipo (capacidad, tipo SSD/HDD)
- `equipo_asignacion` — Asignación de equipo a empleado (fecha asignación/devolución)
- Catálogos: `equipo_tipo`, `equipo_marca`, `equipo_modelo`, `equipo_procesador`, `equipo_ram`, `equipo_gama`

**Tablas de Líneas Celulares:**
- `chip` — Líneas celulares (número, operador, plan, precio, descuento, empresa)
- `chip_asignacion` — Asignación de chip a empleado
- Catálogos: `chip_operador`, `chip_plan`, `chip_descuento`

**Tablas de Correos Corporativos:**
- `correo_corporativo` — Cuentas de correo con contraseña cifrada AES

**Tablas de Catálogos Generales:**
- `empresa` — Empresas del grupo corporativo
- `estado_civil`, `grado_instruccion`, `tipo_documento` — Datos personales
- `banco`, `moneda`, `tipo_cuenta` — Datos financieros
- `departamento_geo`, `provincia`, `distrito` — Ubicación geográfica (UBIGEO)

> **[FIGURA: Diagrama Entidad-Relación de la Base de Datos]**

### 2.13.2 Motor Documental — MongoDB

El sistema utiliza **MongoDB** como motor de base de datos documental para almacenar datos no estructurados o de alta frecuencia de escritura. Se utilizan **2 bases de datos** con **15 colecciones**:

**Base de datos: `erp_nosql`**

| Colección | Propósito | Campos principales |
|-----------|-----------|-------------------|
| `menus` | Menú del comedor | imagen, fecha, subido_por |
| `evento_principal` | Evento corporativo slot 1 | imagen, titulo, fecha |
| `evento2` | Evento corporativo slot 2 | imagen, titulo, fecha |
| `evento_mujeres` | Evento especial mujeres | imagen, titulo, fecha |
| `saludos_cumple` | Saludos de cumpleaños enviados | de, para, mensaje, sticker, fecha |
| `archivo_saludos` | Saludos archivados (vencidos) | mismos que saludos_cumple + fecha_archivo |
| `asistencia` | Marcaciones biométricas | emp_pin, dia, marcajes[], timestamp |
| `justificaciones` | Justificaciones de faltas | id_personal, fecha, categoria, observacion |
| `auditoria` | Registro de cambios | modulo, accion, datos_ant, datos_new, usuario, timestamp |
| `notificaciones_persistentes` | Notificaciones de tickets | tipo, ticket_id, mensaje, leido, destinatario |

**Base de datos: `erp_chat`**

| Colección | Propósito | Campos principales |
|-----------|-----------|-------------------|
| `mensajes` | Mensajes de chat (privados y sala) | de, para, texto, tipo, archivo, timestamp |
| `grupos` | Grupos de chat | nombre, creador, miembros[], fecha |
| `msg_grupo` | Mensajes de grupos | grupo_id, de, texto, sticker, timestamp |
| `usuarios_online` | Estado de conexión | id_personal, sid, nombre, conectado_en |
| `archivos_chat` | Metadatos de archivos subidos | nombre, ruta, tipo_mime, tamaño, subido_por |

> **[FIGURA: Diagrama de Colecciones MongoDB]**

---

## 2.14 Tecnologías y Arquitectura de la Aplicación

### 2.14.1 Diagrama de Arquitectura

La aplicación sigue una arquitectura de **3 capas** con un **microservicio de chat** independiente:

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                     │
│               (Frontend — React 19 + Vite 7)                │
│                     Puerto: 3000 (dev)                      │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│   │  Login   │ │Dashboard │ │  RRHH    │ │   Tickets    │  │
│   ├──────────┤ ├──────────┤ ├──────────┤ ├──────────────┤  │
│   │  Chat    │ │Asistencia│ │ Equipos  │ │    Chips     │  │
│   ├──────────┤ ├──────────┤ ├──────────┤ ├──────────────┤  │
│   │ Correos  │ │ Permisos │ │Mi Espacio│ │CambioPassword│  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                     NGINX (Puerto 80)                       │
│              Proxy Inverso + Archivos Estáticos              │
│   /api/*  →  :4000   │   /chat/*  →  :4001                 │
│   /socket.io/*  →  :4001 (WebSocket Upgrade)                │
│   /*  →  /index.html (SPA Routing)                          │
└────────┬────────────────────────────┬───────────────────────┘
         │                            │
┌────────▼──────────┐    ┌────────────▼────────────┐
│  CAPA DE NEGOCIO  │    │  MICROSERVICIO CHAT     │
│ Backend ERP       │    │  Backend Chat           │
│ FastAPI :4000     │    │  FastAPI + Socket.IO    │
│                   │    │  Puerto: 4001           │
│ 22 archivos de    │    │                         │
│ rutas             │    │ 6 módulos:              │
│ 148+ endpoints    │    │ chat_server.py          │
│ JWT + Argon2id    │    │ chat_socket_events.py   │
│ SQLAlchemy ORM    │    │ chat_routes.py          │
│ Motor async       │    │ chat_auth.py            │
│ (MongoDB)         │    │ chat_db.py              │
│                   │    │ chat_config.py          │
└────────┬──────────┘    └────────────┬────────────┘
         │                            │
┌────────▼────────────────────────────▼───────────────────────┐
│                    CAPA DE DATOS                            │
│                                                             │
│   ┌─────────────────────┐    ┌────────────────────────┐     │
│   │   MariaDB 10.4      │    │     MongoDB             │     │
│   │   71 tablas (3NF)   │    │   erp_nosql (10 col.)  │     │
│   │   Personal, Tickets,│    │   erp_chat (5 col.)    │     │
│   │   Equipos, Permisos │    │   Asistencias, Chat,   │     │
│   │                     │    │   Auditoría, Eventos   │     │
│   └─────────────────────┘    └────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 COMPONENTE IoT EXTERNO                      │
│   ┌──────────────┐    ┌──────────────────────────────┐      │
│   │ Reloj ZKTeco │◄──►│ HUELLERO/Asistencias.py      │      │
│   │ (Biométrico) │ ZK │ Script daemon — cada 60s     │      │
│   │   UDP/ZK     │UDP │ pyzk → MongoDB (bulk upsert) │      │
│   └──────────────┘    └──────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

> **[FIGURA: Diagrama de Arquitectura del Sistema]**

### 2.14.2 Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|------------|---------|-----------|
| **Frontend** | React | 19.x | Biblioteca para construcción de interfaces de usuario con componentes |
| **Frontend** | Vite | 7.3.2 | Bundler de nueva generación con HMR instantáneo y build optimizado |
| **Frontend** | React Router DOM | 7.13.0 | Enrutamiento SPA con rutas protegidas |
| **Frontend** | TanStack React Query | 5.x | Gestión de estado del servidor, caché y refetch automático |
| **Frontend** | Socket.IO Client | 4.x | Cliente WebSocket para comunicación en tiempo real |
| **Frontend** | FontAwesome | 6.x | Iconografía vectorial escalable |
| **Frontend** | CSS Modules | — | Estilos con alcance por componente y soporte dark mode |
| **Backend ERP** | FastAPI | 0.115+ | Framework web async de alto rendimiento con documentación automática |
| **Backend ERP** | SQLAlchemy | 2.x | ORM con automap_base() para mapeo automático de tablas existentes |
| **Backend ERP** | PyJWT | 2.x | Generación y verificación de tokens JWT (HS256) |
| **Backend ERP** | Argon2-cffi | 23.x | Hash de contraseñas con algoritmo ganador del PHC |
| **Backend ERP** | Motor (async) | 3.x | Driver async de MongoDB para Python |
| **Backend ERP** | ReportLab | 4.x | Generación de documentos PDF |
| **Backend ERP** | python-docx | 1.x | Manipulación de documentos DOCX con placeholders |
| **Backend Chat** | FastAPI | 0.115+ | Framework web para endpoints REST del chat |
| **Backend Chat** | python-socketio | 5.x | Servidor WebSocket con soporte de rooms y eventos |
| **Backend Chat** | PyMySQL | 1.x | Conector MySQL para consultas síncronas (contactos, personal) |
| **Backend Chat** | Motor (async) | 3.x | Driver async MongoDB para mensajes y grupos |
| **BD Relacional** | MariaDB | 10.4+ | Motor relacional con soporte AES_ENCRYPT/AES_DECRYPT nativo |
| **BD Documental** | MongoDB | 7.x | Motor documental para datos de alta frecuencia y no estructurados |
| **Proxy/Web** | Nginx | 1.27+ | Proxy inverso, servicio de estáticos, compresión, caché, seguridad |
| **IoT** | pyzk | 0.9+ | Librería Python para comunicación con relojes ZKTeco vía protocolo ZK (UDP) |
| **Lenguajes** | Python | 3.12 | Backend (FastAPI + scripts) |
| **Lenguajes** | JavaScript (ES2024) | — | Frontend (React + Vite) |
| **Herramientas** | Git | 2.x | Control de versiones |
| **Herramientas** | VS Code | 1.96+ | IDE de desarrollo |
| **SO Servidor** | Windows Server / 10 | — | Sistema operativo de despliegue en red LAN |

### 2.14.3 Patrones de Diseño Aplicados

| Patrón | Aplicación en el proyecto |
|--------|--------------------------|
| **MVC (Model-View-Controller)** | Separación en 3 capas: React (View), FastAPI routes (Controller), SQLAlchemy models (Model) |
| **Repository Pattern** | `database.py` centraliza la creación de sesiones y el acceso a modelos mapeados automáticamente |
| **Service Layer** | `servicios/permiso_service.py` encapsula lógica de negocio separada de las rutas HTTP |
| **DTO (Data Transfer Object)** | Schemas Pydantic en `schemas/` para validación de entrada/salida |
| **Observer Pattern** | Sistema de eventos Socket.IO para notificaciones en tiempo real del chat |
| **Microservice Architecture** | Chat como servicio independiente (puerto 4001) con su propia base de datos |
| **API Gateway** | Nginx actúa como punto de entrada unificado enrutando a los distintos servicios |
| **RBAC (Role-Based Access Control)** | Sistema de permisos con tablas `permiso_accs`, `rol_accs`, `asignacion_accs` |
| **Token-based Authentication** | JWT con storage en memoria para prevención de XSS |
| **Bulk Operations** | Sincronización ZKTeco con `UpdateOne` (upsert) para escritura masiva eficiente |

---

## 2.15 Contenido del Software

A continuación se describe el contenido funcional de cada módulo del sistema:

### 2.15.1 Módulo de Autenticación (`br_auth.py`, `auth_token.py`, `Login.jsx`)

| Funcionalidad | Descripción |
|---------------|-------------|
| Login multi-empresa | El usuario ingresa credenciales y selecciona la empresa a la que desea acceder de entre las empresas asociadas a su cuenta |
| Generación de JWT | Token firmado con HS256 conteniendo: subject, id de acceso, id de empresa, rol, id de personal y nombre |
| Bloqueo por intentos | Tras 3 intentos fallidos consecutivos, la cuenta se bloquea automáticamente (campo INTENT_LOGIN) |
| Cambio obligatorio | Si el flag RESET_PASS está activo, el usuario es redirigido a la pantalla de cambio de contraseña antes de acceder al sistema |
| Verificación de sesión | Endpoint para validar si el token actual es válido y obtener datos del usuario autenticado |
| Almacenamiento seguro | El token JWT se almacena en memoria del navegador (variable JavaScript), no en localStorage ni cookies |

### 2.15.2 Módulo RRHH — Personal (`rutas_personal.py`, `RRHH.jsx`, `PersonalDetalle.jsx`)

| Funcionalidad | Descripción |
|---------------|-------------|
| Listado de personal | Tabla con búsqueda por nombre/DNI, filtros por área y estado, paginación, precarga de 15+ catálogos para evitar N+1 queries |
| Ficha del empleado | Vista detallada con pestañas: datos personales, contrato vigente, contactos de emergencia, seguros/AFP, cuentas bancarias, documentos y asistencia |
| Crear empleado | Formulario con validación de campos obligatorios, generación automática de credenciales (usuario = código, password = DNI, RESET_PASS = 1) |
| Editar empleado | Actualización de datos personales y contractuales con registro de auditoría automático |
| Gestión de sub-recursos | CRUD de contactos de emergencia, seguros/AFP y cuentas bancarias con estrategia de reemplazo completo (delete all + insert) |
| Foto de perfil | Subida con validación de formato (JPG/PNG/WEBP) y tamaño máximo de 5MB |
| Reset de contraseña | Administrador restablece password al número de documento, activa RESET_PASS y desbloquea si estaba bloqueada |

### 2.15.3 Módulo RRHH — Horarios (`rutas_horario.py`, `HorariosRRHH.jsx`)

| Funcionalidad | Descripción |
|---------------|-------------|
| CRUD de horarios | Crear, editar, desactivar horarios con 7 registros de detalle semanal (hora entrada, hora salida, descanso por día) |
| Asignación individual | Asignar un horario específico a un empleado |
| Asignación masiva | Asignar el mismo horario a múltiples empleados en una sola operación batch |
| Validación de integridad | No se permite eliminar un horario si tiene empleados asignados |

### 2.15.4 Módulo Dashboard (`rutas_menu.py`, `rutas_evento.py`, `rutas_cumpleanos.py`, `DashboardHome.jsx`)

| Funcionalidad | Descripción |
|---------------|-------------|
| Menú del comedor | Subida de imagen WebP del menú diario, visualización del menú más reciente con imagen expandible |
| Eventos corporativos | 3 slots independientes (evento principal, evento 2, evento mujeres) con CRUD de imagen |
| Cumpleaños del mes | Listado de cumpleañeros del mes con nombre, día y foto, ordenado cronológicamente, con indicador de "hoy" |
| Saludos de cumpleaños | Modal interactivo para enviar saludo con mensaje de texto (máx. 500 caracteres) + sticker opcional |
| Detección de pendientes | El sistema detecta automáticamente cumpleaños sin saludar y muestra el modal al cargar el Dashboard |
| Notificaciones | Alertas automáticas de menú nuevo, evento publicado, cumpleaños hoy/próximo |
| Reapertura desde notificaciones | Click en notificación de cumpleaños abre directamente el modal de saludo para esa persona |

### 2.15.5 Módulo de Tickets (`rutas_tickets.py`, `Tickets.jsx`, `IngresarTicket.jsx`)

| Funcionalidad | Descripción |
|---------------|-------------|
| Crear ticket | Formulario con tipo, categoría, subcategoría, prioridad (Baja/Media/Alta/Urgente), descripción y foto adjunta |
| Flujo de estados | ABIERTO → ASIGNADO → RESUELTO → CERRADO con transiciones controladas por el backend |
| Asignación a técnico | El administrador asigna el ticket a un técnico del equipo SOPORTE |
| Cambio de prioridad | Solo ADMIN/SOPORTE pueden modificar la prioridad con registro de auditoría |
| Reapertura | El solicitante puede reabrir un ticket cerrado proporcionando un motivo obligatorio |
| Valoración | Escala 1-3 (malo, regular, bueno) al cerrar el ticket |
| Reporte PDF | Generación de reporte mensual con estadísticas de tickets por estado, prioridad y técnico |
| Integración SAP | Registro de artículos, servicios y socios de negocio vinculados al ticket |
| Plantillas | Generación de DOCX/PDF con placeholders auto-rellenados desde la base de datos |
| Pestañas | Separación de tickets "En Atención" (activos) e "Historial" (cerrados/resueltos) |
| Control de acceso | ADMIN/SOPORTE ven todos los tickets; USUARIO solo ve los propios |

### 2.15.6 Módulo de Chat (`chat_server.py`, `ChatPanel.jsx`, `ChatVentana.jsx`, `ChatSala.jsx`)

| Funcionalidad | Descripción |
|---------------|-------------|
| Sala general | Chat abierto para todos los empleados con mensajes en tiempo real y scroll automático |
| Mensajes privados | Conversaciones 1-a-1 con persistencia en MongoDB y scroll infinito paginado |
| Grupos | Creación de grupos con selección múltiple de participantes, mensajería grupal |
| Stickers | Catálogo organizado por categorías con selector visual |
| Zumbidos | Notificación con sonido y vibración visual entre usuarios |
| Indicador de escritura | Indicador "escribiendo..." en tiempo real vía eventos WebSocket |
| Estado online/offline | Lista de contactos con indicador de conexión y badge de mensajes no leídos |
| Archivos adjuntos | Subida de archivos con almacenamiento en carpeta `uploads/` |
| Perfil de contacto | Modal con datos corporativos del contacto (chips asignados, correos corporativos) |

### 2.15.7 Módulo de Asistencias (`rutas_asistencia.py`, `AsistenciasGeneral.jsx`, `AsistenciaTab.jsx`)

| Funcionalidad | Descripción |
|---------------|-------------|
| Sincronización biométrica | Script daemon que conecta al ZKTeco vía protocolo ZK (UDP) y sincroniza marcajes cada 60 segundos |
| Consulta individual | Asistencia de un empleado por rango de fechas con desglose diario, estado calculado y resumen |
| Consulta general | Tabla de asistencias de todos los empleados con filtros por fecha (requerido), área, cargo, turno, estado y nombre |
| Cálculo de estado | Motor que compara marcajes vs horario asignado para determinar: PUNTUAL, TARDANZA o FALTA |
| Justificación por día | Registro de justificación para una fecha específica con categoría y observación |
| Justificación por rango | Registro de justificación para un rango de fechas completo |
| Categorías configurables | CRUD de categorías de justificación personalizables |
| Pestaña en perfil | Integración de la vista de asistencia en el detalle del empleado como pestaña |

### 2.15.8 Módulo de Equipos TI (`rutas_equipo.py`, `EquiposCrear.jsx`, `EquiposAsignar.jsx`)

| Funcionalidad | Descripción |
|---------------|-------------|
| Registro de equipo | Formulario con tipo, marca, modelo, serie, código, gama, procesador, RAM, discos y foto |
| Catálogos dinámicos | Agregar nuevos ítems a cualquier tabla catálogo (tipos, marcas, modelos, procesadores, RAM, gama) sin intervención del desarrollador |
| Vista de tarjetas | Grid de cards con especificaciones, estado, foto y acciones de asignación inline |
| Estadísticas interactivas | Cards con Total, Disponibles, Asignados — clickeables para filtrar la vista |
| Asignación/Devolución | Asignar equipo a empleado activo con registro de fecha; devolución preserva historial |

### 2.15.9 Módulo de Chips (`rutas_chip.py`, `Chips.jsx`)

| Funcionalidad | Descripción |
|---------------|-------------|
| Registro de línea | Crear línea con número, operador, plan, precio, descuento y empresa |
| Asignación/Devolución/Reasignación | Gestión del ciclo de vida de la línea con historial por chip |
| Dashboard de costos | Estadísticas: Total líneas, Asignados, Disponibles, Costo original, Total con descuento, Ahorro |
| Filtros avanzados | Búsqueda por texto (número, empleado, operador), estado (todos/asignado/disponible), operador |
| Historial por chip | Consulta del historial de asignaciones de cada línea |

### 2.15.10 Módulo de Correos Corporativos (`rutas_correos.py`, `CorreosCorporativos.jsx`)

| Funcionalidad | Descripción |
|---------------|-------------|
| CRUD de correos | Crear, editar y eliminar cuentas de correo corporativo |
| Cifrado AES | Contraseñas almacenadas con AES_ENCRYPT de MySQL; descifrado con AES_DECRYPT |
| Desbloqueo masivo | Modal AES que solicita la clave una vez y desbloquea todas las contraseñas visibles |
| Botón global | Toggle lock/unlock que controla la visibilidad de todas las contraseñas |
| Clipboard | Copiar contraseña al portapapeles con fallback para contextos HTTP (textarea + execCommand) |

### 2.15.11 Módulo de Permisos (`rutas_permisos.py`, `GestionPermisos.jsx`)

| Funcionalidad | Descripción |
|---------------|-------------|
| Listado de submódulos | 16 submódulos del sistema registrados en tabla `permiso_accs` |
| Roles con permisos | Vista de roles con sus submódulos asignados (solo ADMIN y SUPERVISOR pueden consultar) |
| Modificar permisos | Checkboxes para marcar/desmarcar submódulos accesibles por rol (solo ADMIN) |
| Cambiar rol | Selector para cambiar el rol de un empleado (solo ADMIN) |
| Sidebar dinámico | Endpoint `/mis-permisos` alimenta la renderización dinámica del menú lateral |

### 2.15.12 Módulo de Notificaciones (`rutas_notificaciones.py`, `Header.jsx`)

| Funcionalidad | Descripción |
|---------------|-------------|
| Centro unificado | Campana en el Header que agrega 9+ tipos de notificación en una sola consulta |
| Tipos soportados | Contratos por vencer (30/15/7 días), cumpleaños hoy, cumpleaños próximo, saludo pendiente, menú nuevo, evento publicado, falta registrada, ticket asignado/actualizado |
| Interacción | Clic en notificación de cumpleaños abre directamente el modal de saludo (CustomEvent) |
| Persistencia | Notificaciones de tickets almacenadas en MongoDB con estado de lectura |

---

## 2.16 Diseño de Interfaces de Usuario

A continuación se presenta la descripción de las principales interfaces del sistema. Las capturas de pantalla correspondientes se adjuntan como figuras.

| N° | Vista | Ruta | Descripción | Características |
|----|-------|------|-------------|-----------------|
| 1 | **Login** | `/login` | Pantalla de autenticación | Campos: usuario, contraseña. Selector dinámico de empresa. Mensajes de error contextuales. Diseño centrado responsivo. |
| 2 | **Cambio de Contraseña** | `/cambio-password` | Cambio obligatorio o voluntario | Campos: contraseña actual, nueva (mín. 6 caracteres), confirmación. Botón X para cancelar cambio voluntario. |
| 3 | **Dashboard** | `/` | Página principal post-login | 3 secciones: Menú del comedor (imagen expandible), Eventos corporativos (3 slots), Cumpleaños del mes (lista con avatares). Grid responsivo. |
| 4 | **RRHH — Listado** | `/rrhh` | Listado de personal | Tabla con búsqueda por texto, filtros por área y estado, columnas: foto, nombre, DNI, área, cargo, estado. |
| 5 | **RRHH — Detalle** | `/rrhh/:id` | Ficha del empleado | Pestañas: Datos Personales, Contrato, Contactos, Documentos, AFP/Seguros, Cuentas Bancarias, Asistencia. |
| 6 | **Mi Espacio** | `/mi-espacio` | Perfil propio del empleado | Vista de solo lectura con datos personales, contractuales y resumen de asistencia. |
| 7 | **Horarios** | `/horarios` | Gestión de horarios | Tabla de horarios con detalle semanal expandible. Formulario de creación/edición. Asignación individual/masiva. |
| 8 | **Ingresar Ticket** | `/ingresar-ticket` | Crear y ver mis tickets | Formulario de creación + pestañas "En Atención" / "Historial". Cards de ticket con estado, prioridad, categoría. |
| 9 | **Tickets (Admin)** | `/tickets` | Panel de administración | Tabla de tickets con detalle lateral. Dropdown de prioridad, asignación de técnico, cambio de estado. Dashboard de estadísticas. |
| 10 | **Chat** | Panel lateral | Chat corporativo | Panel lateral con contactos (online/offline, badges). Ventana flotante de conversación. Sala general en modal. Selector de stickers. |
| 11 | **Asistencias** | `/asistencias` | Control de asistencias | Filtros: fecha (requerido), área, cargo, turno, estado, nombre. Tabla con indicadores de color (verde=puntual, amarillo=tardanza, rojo=falta). |
| 12 | **Equipos — Crear** | `/equipos/crear` | Registro de equipo TI | Formulario con selectores de catálogos dinámicos, campos de specs (procesador, RAM, disco), subida de foto. |
| 13 | **Equipos — Asignar** | `/equipos` | Vista de equipos | Grid de tarjetas con specs, foto, estado (badge), asignación inline, estadísticas clickeables (Total, Disponibles, Asignados). |
| 14 | **Chips** | `/chips` | Gestión de líneas | Stats (Total, Asignados, Disponibles, Costo, Descuento, Ahorro). Tabla filtrable. Modal de creación/edición. |
| 15 | **Correos Corp.** | `/correos` | Correos corporativos | Tabla con nombre, correo, contraseña (oculta). Botón global lock/unlock. Modal AES para desbloqueo masivo. Ojo por fila para toggle. |
| 16 | **Permisos** | `/permisos` | Gestión RBAC | Tabla de roles con checkboxes de submódulos. Selector de rol por empleado. Solo visible para ADMIN. |
| 17 | **Header** | Global | Barra superior | Logo, nombre de usuario, empresa activa, campana de notificaciones (badge), toggle dark mode, botón de cerrar sesión. |
| 18 | **Sidebar** | Global | Menú lateral | Navegación dinámica basada en permisos del rol. Colapsable. Indicadores activos. Soporte responsive. |

> **[FIGURAS: Capturas de pantalla de cada vista del sistema]**

---

## 2.17 Plan de Pruebas

### 2.17.1 Pruebas Funcionales

| N° | Módulo | Caso de Prueba | Resultado Esperado | Estado |
|----|--------|----------------|-------------------|--------|
| 1 | Login | Ingresar credenciales válidas y seleccionar empresa | Acceso al Dashboard con token JWT válido | ✅ Aprobado |
| 2 | Login | Ingresar credenciales inválidas 3 veces | Cuenta bloqueada, mensaje de error contextual | ✅ Aprobado |
| 3 | Login | Acceder con RESET_PASS activo | Redirección obligatoria a cambio de contraseña | ✅ Aprobado |
| 4 | RRHH | Crear empleado con todos los campos obligatorios | Registro creado, credenciales generadas, auditoría registrada | ✅ Aprobado |
| 5 | RRHH | Buscar empleado por nombre o DNI | Filtrado en tiempo real del listado | ✅ Aprobado |
| 6 | RRHH | Subir foto > 5MB | Rechazo con mensaje de tamaño excedido | ✅ Aprobado |
| 7 | Horarios | Crear horario y asignar a 10 empleados (masivo) | Horario creado con 7 detalles, 10 asignaciones registradas | ✅ Aprobado |
| 8 | Asistencias | Consultar asistencia de empleado con horario asignado | Desglose diario con estados calculados (puntual/tardanza/falta) | ✅ Aprobado |
| 9 | Tickets | Crear ticket → Asignar → Resolver → Cerrar con valoración | Flujo completo de estados con notificaciones en cada transición | ✅ Aprobado |
| 10 | Tickets | Reabrir ticket cerrado sin motivo | Rechazo, motivo es obligatorio | ✅ Aprobado |
| 11 | Chat | Enviar mensaje privado a usuario online | Mensaje recibido en tiempo real, sonido de notificación | ✅ Aprobado |
| 12 | Chat | Enviar sticker en grupo | Sticker visible para todos los miembros del grupo | ✅ Aprobado |
| 13 | Dashboard | Publicar menú del comedor | Imagen visible en Dashboard, notificación generada para todos | ✅ Aprobado |
| 14 | Dashboard | Enviar saludo de cumpleaños con sticker | Saludo registrado, modal no reaparece para ese cumpleañero | ✅ Aprobado |
| 15 | Equipos | Crear equipo y asignar a empleado | Equipo con specs completas, asignación con fecha registrada | ✅ Aprobado |
| 16 | Chips | Asignar chip, devolver y reasignar a otro empleado | Historial preservado con 3 registros de asignación | ✅ Aprobado |
| 17 | Correos | Desbloqueo masivo con clave AES correcta | Todas las contraseñas descifradas y visibles | ✅ Aprobado |
| 18 | Correos | Desbloqueo masivo con clave AES incorrecta | Error de descifrado, contraseñas permanecen ocultas | ✅ Aprobado |
| 19 | Permisos | Modificar submódulos de un rol | Sidebar del usuario con ese rol se actualiza dinámicamente | ✅ Aprobado |
| 20 | Permisos | Acceder a módulo sin permiso | Error 403, redirección al Dashboard | ✅ Aprobado |

### 2.17.2 Pruebas No Funcionales

| N° | Tipo | Caso de Prueba | Resultado Esperado | Estado |
|----|------|----------------|-------------------|--------|
| 1 | Rendimiento | Tiempo de respuesta de endpoints bajo carga normal | < 500ms clasificado como OK por middleware | ✅ Aprobado |
| 2 | Seguridad | Acceso a API sin token JWT | Respuesta 401 Unauthorized | ✅ Aprobado |
| 3 | Seguridad | Token JWT expirado | Respuesta 401, redirección automática a Login | ✅ Aprobado |
| 4 | Seguridad | Inyección SQL en campos de texto | Parámetros tratados por SQLAlchemy ORM (parameterized queries) | ✅ Aprobado |
| 5 | Responsive | Acceso desde dispositivo móvil (320px) | Interfaz adaptada con menú colapsable y tablas scrolleables | ✅ Aprobado |
| 6 | Responsive | Acceso desde tablet (768px) | Grid adaptado a 2 columnas, sidebar colapsable | ✅ Aprobado |
| 7 | Compatibilidad | Acceso desde Chrome, Firefox y Edge | Funcionalidad completa en los 3 navegadores | ✅ Aprobado |
| 8 | Dark Mode | Activar dark mode en todas las vistas | Todos los componentes respetan la paleta oscura | ✅ Aprobado |
| 9 | WebSocket | Mantener conexión de chat activa por 8+ horas | Conexión estable con timeout de 24h en Nginx | ✅ Aprobado |
| 10 | Concurrencia | 20 usuarios simultáneos en la red LAN | Sistema estable sin degradación perceptible | ✅ Aprobado |

---

## 2.18 Conclusiones del Capítulo

La propuesta de mejora descrita en este capítulo aborda de manera integral la digitalización de los procesos internos de la empresa mediante un Sistema Intranet/ERP Corporativo que comprende:

- **10 módulos funcionales** que cubren desde la autenticación segura hasta la comunicación en tiempo real.
- **148+ endpoints REST** organizados en 22 archivos de rutas backend.
- **71 tablas relacionales** en MariaDB (3NF) y **15 colecciones** en MongoDB.
- **20+ componentes frontend** con diseño responsivo y soporte dark mode.
- **Integración IoT** con dispositivos biométricos ZKTeco para control de asistencia sin intervención humana.
- **Microservicio de chat** independiente con Socket.IO para comunicación corporativa en tiempo real.
- **Sistema de seguridad** multicapa: Argon2id, JWT, AES, RBAC, headers HTTP, auditoría automática.

El sistema fue desarrollado siguiendo la metodología Scrum en 6 sprints (18 semanas), con un total de 146 Story Points distribuidos en 16 historias de usuario y 143 tareas técnicas completadas al 100%. La arquitectura modular y las tecnologías seleccionadas (FastAPI, React, MariaDB, MongoDB) garantizan la escalabilidad y mantenibilidad del sistema a largo plazo.

---

> **Nota:** Las figuras, diagramas gráficos y capturas de pantalla referenciadas con la etiqueta **[FIGURA: ...]** a lo largo de este capítulo serán elaborados e incluidos por el autor del informe.
