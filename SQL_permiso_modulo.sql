-- =============================================
-- Script: Poblar permiso_accs y asignacion_accs
-- NO crea ni altera tablas — solo INSERT datos.
-- SEGURO ejecutar múltiples veces (limpia antes de insertar).
-- =============================================

USE erp;

-- ═══════════════════════════════════════════════
-- 1. LIMPIAR DATOS ANTERIORES (orden FK correcto)
-- ═══════════════════════════════════════════════
DELETE FROM asignacion_accs WHERE ID_ROL >= 1;
DELETE FROM permiso_accs WHERE ID_PERM >= 1;

-- ═══════════════════════════════════════════════
-- 2. SUBMÓDULOS (permiso_accs)
-- ═══════════════════════════════════════════════

INSERT INTO `permiso_accs` (`ID_PERM`, `DESCRIP`) VALUES
(1,  'ASISTENCIA'),
(2,  'PERSONAL'),
(3,  'HORARIOS'),
(4,  'EQUIPOS_CREAR'),
(5,  'EQUIPOS_ASIGNACION'),
(6,  'TICKETS_NUEVO'),
(7,  'TICKETS_PANEL'),
(8,  'INICIO'),
(9,  'INVENTARIO'),
(10, 'CLIENTES'),
(11, 'PERMISOS');

-- ═══════════════════════════════════════════════
-- 3. ASIGNACIONES POR DEFECTO (asignacion_accs)
-- ═══════════════════════════════════════════════
-- Roles en la BD:
--   1=ADMINISTRADOR, 2=SOPORTE, 3=USUARIO, 4=RRHH, 5=SUPERVISOR

INSERT INTO `asignacion_accs` (`ID_ROL`, `ID_PERM`) VALUES
-- ADMINISTRADOR (1): TODOS
(1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),(1,11),
-- SOPORTE (2): inicio, equipos, tickets, inventario, asistencia, personal
(2,1),(2,2),(2,4),(2,5),(2,6),(2,7),(2,8),(2,9),
-- USUARIO (3): inicio, nuevo ticket
(3,6),(3,8),
-- RRHH (4): inicio, asistencia, personal, horarios, clientes
(4,1),(4,2),(4,3),(4,8),(4,10),
-- SUPERVISOR (5): TODOS (modo lectura — el frontend desactiva CRUD)
(5,1),(5,2),(5,3),(5,4),(5,5),(5,6),(5,7),(5,8),(5,9),(5,10),(5,11);
