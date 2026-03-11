-- =============================================
-- Script: Agregar submódulos a permiso_accs
-- y asignar permisos por defecto en asignacion_accs
-- NO crea tablas nuevas — usa las existentes.
-- REVISAR ANTES DE EJECUTAR
-- =============================================

-- Lista COMPLETA de submódulos en permiso_accs
-- IDs 1=ASISTENCIA y 2=PERSONAL ya existen en la BD
--
-- ID | DESCRIP               | Ubicación en Sidebar
-- ---+-----------------------+----------------------------------
--  1 | ASISTENCIA            | RRHH > Asistencias
--  2 | PERSONAL              | RRHH > Personal
--  3 | HORARIOS              | RRHH > Horarios
--  4 | EQUIPOS_CREAR         | Equipos > Crear Equipo
--  5 | EQUIPOS_ASIGNACION    | Equipos > Asignación
--  6 | TICKETS_NUEVO         | Tickets > Nuevo Ticket
--  7 | TICKETS_PANEL         | Tickets > Panel Tickets
--  8 | INICIO                | Inicio (Dashboard Home)
--  9 | INVENTARIO            | Inventario
-- 10 | CLIENTES              | Clientes
-- 11 | PERMISOS              | Permisos (gestión de accesos)

INSERT IGNORE INTO `permiso_accs` (`ID_PERM`, `DESCRIP`) VALUES
(3,  'HORARIOS'),
(4,  'EQUIPOS_CREAR'),
(5,  'EQUIPOS_ASIGNACION'),
(6,  'TICKETS_NUEVO'),
(7,  'TICKETS_PANEL'),
(8,  'INICIO'),
(9,  'INVENTARIO'),
(10, 'CLIENTES'),
(11, 'PERMISOS');

-- Asignaciones por defecto (rol → permiso)
-- Roles: 1=ADMINISTRADOR, 2=SOPORTE, 3=USUARIO, 4=RECURSOS_HUMANOS
-- (1,1) (1,2) (2,1) (2,2) (4,1) (4,2) ya existen en la BD

INSERT IGNORE INTO `asignacion_accs` (`ID_ROL`, `ID_PERM`) VALUES
-- ADMINISTRADOR (1): TODOS los submódulos nuevos (3-11)
(1,3), (1,4), (1,5), (1,6), (1,7), (1,8), (1,9), (1,10), (1,11),
-- SOPORTE (2): inicio + equipos + tickets + inventario
(2,4), (2,5), (2,6), (2,7), (2,8), (2,9),
-- USUARIO (3): inicio + nuevo ticket
(3,6), (3,8),
-- RECURSOS_HUMANOS (4): inicio + horarios + clientes
(4,3), (4,8), (4,10);
