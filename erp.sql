-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 24-03-2026 a las 17:47:01
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `erp`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `acceso`
--

CREATE TABLE `acceso` (
  `ID_ACCS` int(11) NOT NULL,
  `FECH` datetime DEFAULT current_timestamp(),
  `ID_USERC` int(11) DEFAULT NULL,
  `USUARIO` varchar(100) NOT NULL,
  `PASSWORD` varchar(255) NOT NULL,
  `RESET_PASS` tinyint(1) DEFAULT 0,
  `INTENT_LOGIN` int(11) DEFAULT 0,
  `ID_ESTADO` int(11) NOT NULL,
  `ID_ROL` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `acceso`
--

INSERT INTO `acceso` (`ID_ACCS`, `FECH`, `ID_USERC`, `USUARIO`, `PASSWORD`, `RESET_PASS`, `INTENT_LOGIN`, `ID_ESTADO`, `ID_ROL`) VALUES
(1, '2026-03-10 17:07:13', NULL, 'ABLONDET', '1234', 0, 0, 1, 3),
(2, '2026-03-10 17:07:13', NULL, 'AHINOJOSA', '1234', 0, 0, 1, 3),
(3, '2026-03-10 17:07:13', NULL, 'ASINCHE', '1234', 0, 0, 1, 3),
(4, '2026-03-10 17:07:13', NULL, 'BBACA', '$argon2id$v=19$m=65536,t=3,p=4$zF6jKm4lm63MhE7PgdJYGg$5LKPynILcKxo8P2FXWswWGVLU+SC7KRGg0VJUT+mehU', 0, 0, 1, 3),
(5, '2026-03-10 17:07:13', NULL, 'BCONDESO', '$argon2id$v=19$m=65536,t=3,p=4$0mvwpfJ1fm2/D+QtScQaOw$wdKNdzHwqxUhlGlQnYUDnUv6rCpggK4Q1BVcNp1hdqQ', 0, 0, 1, 3),
(6, '2026-03-10 17:07:13', NULL, 'CILLESCA', '1234', 0, 0, 1, 5),
(7, '2026-03-10 17:07:13', NULL, 'CVASQUEZ', '1234', 0, 0, 1, 3),
(8, '2026-03-10 17:07:13', NULL, 'CVIDAURRE', '1234', 0, 0, 1, 3),
(9, '2026-03-10 17:07:13', NULL, 'EDIAZ', '1234', 0, 0, 1, 5),
(10, '2026-03-10 17:07:13', NULL, 'EGUTIERREZ', '1234', 0, 1, 1, 3),
(11, '2026-03-10 17:07:13', NULL, 'EOCHOA', '1234', 0, 0, 1, 3),
(12, '2026-03-10 17:07:13', NULL, 'FCHILON', '1234', 0, 0, 1, 3),
(13, '2026-03-10 17:07:13', NULL, 'GRAMIREZ', '$argon2id$v=19$m=65536,t=3,p=4$K284cgJ/ckJG6kG3m8S7qA$xsCplZbFPXH275oyts4o8a7awYxPgwAGxj9MrvqZxLQ', 0, 0, 1, 2),
(14, '2026-03-10 17:07:13', NULL, 'GZUNIGA', '$argon2id$v=19$m=65536,t=3,p=4$iNDICu2bjCe8wi38QecigA$uY0yWi9gVrBGRNyKUUBSyrvUI0AawudRZzwx/cWxvQk', 0, 0, 1, 3),
(15, '2026-03-10 17:07:13', NULL, 'HMARIN', '1234', 0, 0, 1, 5),
(16, '2026-03-10 17:07:13', NULL, 'KCALLA', '1234', 0, 0, 1, 3),
(17, '2026-03-10 17:07:13', NULL, 'LVICENTE', '1234', 0, 0, 1, 3),
(18, '2026-03-10 17:07:13', NULL, 'MALDAY', '$argon2id$v=19$m=65536,t=3,p=4$w2FKT8OYKGbIruSIZy0bEw$mragCcCF7TMGHyBYxBWTOy7MbEWyQS0GsNVE8unB3Io', 0, 0, 1, 3),
(19, '2026-03-10 17:07:13', NULL, 'MJULCA', '$argon2id$v=19$m=65536,t=3,p=4$9tiP5HZitvf/+Fym4V9cKw$m8gIGPKJTBoMOjuKz3XtalT+liPgsb4BfeSp7vKCjdk', 0, 0, 1, 3),
(20, '2026-03-10 17:07:13', NULL, 'MORTIZ', '$argon2id$v=19$m=65536,t=3,p=4$/KEpNpKru3vM5sojkTnoRg$e/1yXe4GxZrc2Urmpur8uZlROXD5HA2I0FYeunMzjlo', 0, 0, 1, 3),
(21, '2026-03-10 17:07:13', NULL, 'MRUIZ', '1234', 0, 0, 1, 3),
(22, '2026-03-10 17:07:13', NULL, 'NCHAUCA', '1234', 0, 0, 1, 5),
(23, '2026-03-10 17:07:13', NULL, 'PROMERO', '1234', 0, 0, 1, 3),
(24, '2026-03-10 17:07:13', NULL, 'RMANAYAY', '1234', 0, 0, 1, 3),
(25, '2026-03-10 17:07:13', NULL, 'SJAUREGUI', '1234', 0, 0, 1, 3),
(26, '2026-03-10 17:07:13', NULL, 'SVARGAS', '$argon2id$v=19$m=65536,t=3,p=4$VN3beBNzghkLJEV6Ho+37w$IktCDIdQbWQGRx2MEmdYMz6i3iAROJ+IDiFabFLrhbQ', 0, 0, 1, 3),
(27, '2026-03-10 17:07:13', NULL, 'TTORRES', '$argon2id$v=19$m=65536,t=3,p=4$AF/GlKJbhTDb/2USMQwDJw$OpxdVuMBC9udH1iBmyGHEq4Hnjr3FurXF8HJYEFW95o', 0, 1, 1, 3),
(28, '2026-03-10 17:07:13', NULL, 'AHUAMANI', '1234', 0, 0, 1, 3),
(29, '2026-03-10 17:07:13', NULL, 'CSECLEN', '1234', 0, 0, 1, 3),
(30, '2026-03-10 17:07:13', NULL, 'EALVINO', '$argon2id$v=19$m=65536,t=3,p=4$G4PP/zmnXR36yygRp7qHfA$qseijoIHJoyi1UdqDkKSqk92O6Ez1mPNtsjN797+Zng', 0, 0, 1, 3),
(31, '2026-03-10 17:07:13', NULL, 'EMARINI', '1234', 0, 0, 1, 5),
(32, '2026-03-10 17:07:13', NULL, 'FANDIA', '1234', 0, 0, 1, 3),
(33, '2026-03-10 17:07:13', NULL, 'FDURAN', '1234', 0, 0, 1, 3),
(34, '2026-03-10 17:07:13', NULL, 'HMARINI', '1234', 0, 0, 1, 5),
(35, '2026-03-10 17:07:13', NULL, 'JMAYTA', '1234', 0, 0, 1, 3),
(36, '2026-03-10 17:07:13', NULL, 'LMENA', '1234', 0, 0, 1, 3),
(37, '2026-03-10 17:07:13', NULL, 'SBENITES', '1234', 0, 0, 1, 3),
(38, '2026-03-10 17:07:13', NULL, 'VVILCA', '1234', 0, 0, 1, 3),
(39, '2026-03-10 17:07:13', NULL, 'ZCAMARGO', '$argon2id$v=19$m=65536,t=3,p=4$78DHw6EMzEEa23mHtK8FGA$sYhtofRe8sjp6jV9o7lQm8ww5AVpwHJlpWu/ku7B6oA', 0, 0, 1, 3),
(40, '2026-03-10 17:07:13', NULL, 'FDELGADO', '$argon2id$v=19$m=65536,t=3,p=4$44eq7vCUWaKFdxV/fU1slw$um0UYpTSVTe1PDG8CjqZpuAXALd6RI1ckVOm+BoYKz0', 0, 0, 1, 3),
(41, '2026-03-10 17:07:13', NULL, 'HPEREZ', '1234', 0, 0, 1, 3),
(42, '2026-03-10 17:07:13', NULL, 'JCARRASCO', '$argon2id$v=19$m=65536,t=3,p=4$dNP9GI5k3ziufFmuIJlZ/g$57EmqcvsirAdDeCRCkUKms7h39k+i4SelkqnDXDCnSs', 0, 0, 1, 3),
(43, '2026-03-10 17:07:13', NULL, 'JFERNANDEZ', '$argon2id$v=19$m=65536,t=3,p=4$VFvcI9Hnn4wfHCrYfQfHIw$taPxNfCer4cNv8L5y/iUail37Txcn72rQNrPcF5vO2E', 0, 0, 1, 1),
(44, '2026-03-10 17:07:13', NULL, 'LHUAMANI', '$argon2id$v=19$m=65536,t=3,p=4$nn8BUfpUAn1Qg6qx4uflfg$OdGzG+0QYNYQhguEpRGCOeA7yifSSqZDFUD0c8gR08o', 0, 0, 1, 4),
(45, '2026-03-10 17:07:13', NULL, 'NBUTILER', '$argon2id$v=19$m=65536,t=3,p=4$ddI6J6W3VqB0ir0G/3AWXA$dGwvG46lOPPadbZuMz2W/541ujTdWaLNJFgclyaQLcY', 0, 0, 1, 4),
(46, '2026-03-11 14:27:36', NULL, 'GRAMIREZ1', '$argon2id$v=19$m=65536,t=3,p=4$FM2QNGDlhDkqPAAs/NTwRw$1i5q07Rpb37SZu0i9uGL/PC5WueBz+fiXtr7VHoyLxk', 0, 0, 1, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `afp`
--

CREATE TABLE `afp` (
  `ID_AFP` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `afp`
--

INSERT INTO `afp` (`ID_AFP`, `DESCRIP`) VALUES
(1, 'AFP PRIMA'),
(2, 'AFP INTEGRA'),
(3, 'AFP HORIZONTE'),
(4, 'AFP PROFUTURO'),
(5, 'AFP HABITAT'),
(6, 'ONP');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `almacenamiento`
--

CREATE TABLE `almacenamiento` (
  `ID_ALMC` int(11) NOT NULL,
  `ID_EQUIPO` int(11) NOT NULL,
  `ID_DISCO` int(11) NOT NULL,
  `DESCRIP` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `almacenamiento`
--

INSERT INTO `almacenamiento` (`ID_ALMC`, `ID_EQUIPO`, `ID_DISCO`, `DESCRIP`) VALUES
(1, 1, 1, 'Windows');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `anexos`
--

CREATE TABLE `anexos` (
  `ID_DOCUMENT` int(11) NOT NULL,
  `ID_CONTR` int(11) DEFAULT NULL,
  `ID_TDOCUMENT` int(11) DEFAULT NULL,
  `ID_TMOTIVO` int(11) DEFAULT NULL,
  `FECHA_INICIO` date DEFAULT NULL,
  `FECHA_FIN` date DEFAULT NULL,
  `SUELDO` varchar(50) DEFAULT NULL,
  `ID_AREA` int(11) NOT NULL,
  `ID_CARGO` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `anexos`
--

INSERT INTO `anexos` (`ID_DOCUMENT`, `ID_CONTR`, `ID_TDOCUMENT`, `ID_TMOTIVO`, `FECHA_INICIO`, `FECHA_FIN`, `SUELDO`, `ID_AREA`, `ID_CARGO`) VALUES
(1, 2, 2, NULL, '2026-03-19', '2026-06-19', '15000', 2, 13);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `area`
--

CREATE TABLE `area` (
  `ID_AREA` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `area`
--

INSERT INTO `area` (`ID_AREA`, `DESCRIP`) VALUES
(2, 'ADMINISTRACION'),
(3, 'COMERCIAL'),
(4, 'CONTROL DE CALIDAD'),
(1, 'GERENCIA'),
(5, 'OPERACIONES');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asignacion_accs`
--

CREATE TABLE `asignacion_accs` (
  `ID_ROL` int(11) NOT NULL,
  `ID_PERM` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `asignacion_accs`
--

INSERT INTO `asignacion_accs` (`ID_ROL`, `ID_PERM`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(1, 10),
(1, 11),
(1, 12),
(2, 1),
(2, 2),
(2, 4),
(2, 5),
(2, 6),
(2, 7),
(2, 8),
(2, 9),
(2, 12),
(3, 6),
(3, 8),
(4, 1),
(4, 2),
(4, 3),
(4, 8),
(4, 10),
(5, 1),
(5, 2),
(5, 3),
(5, 4),
(5, 5),
(5, 6),
(5, 7),
(5, 8),
(5, 9),
(5, 10),
(5, 11),
(5, 12);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asignacion_chip`
--

CREATE TABLE `asignacion_chip` (
  `ID_CHIP_ASIG` int(11) NOT NULL,
  `FECH_ASIG` datetime DEFAULT NULL,
  `FECHA_DEVOL` datetime DEFAULT NULL,
  `ID_PERSONAL` int(11) NOT NULL,
  `ID_CHIPS` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `asignacion_chip`
--

INSERT INTO `asignacion_chip` (`ID_CHIP_ASIG`, `FECH_ASIG`, `FECHA_DEVOL`, `ID_PERSONAL`, `ID_CHIPS`) VALUES
(1, '2026-03-05 00:00:00', NULL, 8, 1),
(2, '2026-03-05 00:00:00', NULL, 23, 2),
(3, '2026-03-05 00:00:00', NULL, 24, 3),
(4, '2026-03-05 00:00:00', NULL, 44, 4),
(5, '2026-03-05 00:00:00', NULL, 4, 5),
(6, '2026-03-05 00:00:00', NULL, 11, 6),
(7, '2026-03-05 00:00:00', NULL, 45, 7),
(8, '2026-03-05 00:00:00', NULL, 10, 8),
(9, '2026-03-05 00:00:00', NULL, 20, 9),
(10, '2026-03-05 00:00:00', NULL, 14, 10),
(11, '2026-03-05 00:00:00', NULL, 28, 11),
(12, '2026-03-05 00:00:00', NULL, 16, 12),
(13, '2026-03-05 00:00:00', NULL, 27, 13),
(14, '2026-03-05 00:00:00', NULL, 5, 14),
(15, '2026-03-05 00:00:00', NULL, 39, 15),
(16, '2026-03-05 00:00:00', NULL, 18, 16),
(17, '2026-03-05 00:00:00', NULL, 19, 17),
(18, '2026-03-05 00:00:00', NULL, 17, 18),
(19, '2026-03-05 00:00:00', NULL, 9, 19),
(20, '2026-03-05 00:00:00', NULL, 22, 20),
(21, '2026-03-05 00:00:00', NULL, 42, 21),
(22, '2026-03-05 00:00:00', NULL, 7, 22),
(23, '2026-03-05 00:00:00', NULL, 12, 23),
(24, '2026-03-05 00:00:00', NULL, 30, 24),
(25, '2026-03-05 00:00:00', NULL, 1, 26),
(26, '2026-03-05 00:00:00', NULL, 37, 27);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asignacion_emp`
--

CREATE TABLE `asignacion_emp` (
  `ID_ACCS` int(11) NOT NULL,
  `ID_EMP` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `asignacion_emp`
--

INSERT INTO `asignacion_emp` (`ID_ACCS`, `ID_EMP`) VALUES
(1, 1),
(2, 1),
(3, 1),
(4, 1),
(5, 1),
(6, 1),
(6, 2),
(6, 3),
(7, 1),
(8, 1),
(9, 1),
(10, 1),
(11, 1),
(12, 1),
(13, 1),
(13, 2),
(13, 3),
(14, 1),
(15, 1),
(15, 2),
(15, 3),
(16, 1),
(17, 1),
(18, 1),
(19, 1),
(20, 1),
(21, 1),
(22, 1),
(23, 1),
(24, 1),
(25, 1),
(26, 1),
(27, 1),
(28, 2),
(29, 2),
(30, 2),
(31, 1),
(31, 2),
(31, 3),
(32, 2),
(33, 2),
(34, 2),
(35, 2),
(36, 2),
(37, 2),
(38, 2),
(39, 2),
(40, 2),
(41, 2),
(42, 2),
(43, 1),
(43, 2),
(43, 3),
(44, 1),
(44, 2),
(44, 3),
(45, 1),
(45, 2),
(45, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asignacion_equipo`
--

CREATE TABLE `asignacion_equipo` (
  `ID_ASIG` int(11) NOT NULL,
  `FECH_ASIG` datetime DEFAULT NULL,
  `FECHA_DEVOL` datetime DEFAULT NULL,
  `ID_PERSONAL` int(11) NOT NULL,
  `ID_EQUIPO` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `asignacion_equipo`
--

INSERT INTO `asignacion_equipo` (`ID_ASIG`, `FECH_ASIG`, `FECHA_DEVOL`, `ID_PERSONAL`, `ID_EQUIPO`) VALUES
(1, '2026-03-11 00:00:00', '2026-03-11 00:00:00', 13, 1),
(2, '2026-03-11 00:00:00', '2026-03-11 00:00:00', 13, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asignacion_licencia`
--

CREATE TABLE `asignacion_licencia` (
  `ID_ASIGLICENC` int(11) NOT NULL,
  `ID_EQUIPO` int(11) NOT NULL,
  `ID_LICENCIA` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `banco`
--

CREATE TABLE `banco` (
  `ID_BANCO` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `banco`
--

INSERT INTO `banco` (`ID_BANCO`, `DESCRIP`) VALUES
(1, 'BANCO DE CREDITO'),
(2, 'BANCO CONTINENTAL'),
(3, 'BANCO FINANCIERO'),
(4, 'BANCO DE LA NACION'),
(5, 'BANCO PICHINCHA'),
(6, 'INTERBANK'),
(7, 'SCOTIABANK'),
(8, 'BIF');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `capacidad_disco`
--

CREATE TABLE `capacidad_disco` (
  `ID_CAPDISCO` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `capacidad_disco`
--

INSERT INTO `capacidad_disco` (`ID_CAPDISCO`, `DESCRIP`) VALUES
(1, '125 GB'),
(2, '240 GB'),
(3, '256 GB'),
(4, '480 GB'),
(5, '500 GB'),
(6, '980 GB'),
(7, '1 TR'),
(8, '2 TR'),
(9, '8 TR');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cargo`
--

CREATE TABLE `cargo` (
  `ID_CARGO` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL,
  `ID_EMP` int(11) DEFAULT NULL,
  `ID_DEPART` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cargo`
--

INSERT INTO `cargo` (`ID_CARGO`, `DESCRIP`, `ID_EMP`, `ID_DEPART`) VALUES
(1, 'JEFE DE INGENIERIA', 1, 1),
(2, 'GESTOR DE VENTAS', 1, 1),
(3, 'OPERARIO DE ENSAMBLE', 1, 1),
(4, 'ASISTENTE DE FACTURACIÓN', 1, 1),
(5, 'GERENTE COMERCIAL', 1, 1),
(6, 'ASISTENTE DE SERVICIOS', 1, 1),
(7, 'COORDINADOR DE CONTABILIDAD', 1, 1),
(8, 'GERENTE DE OPERACIONES', 1, 1),
(9, 'ASISTENTE DE LOGISTICA', 1, 1),
(10, 'ASISTENTE DE COMERCIO EXTERIOR', 1, 1),
(11, 'COORDINADOR DE CALIDAD', 1, 1),
(12, 'ASISTENTE DE TI', 1, 1),
(13, 'JEFE COMERCIAL', 1, 1),
(14, 'JEFE DE FINANZAS', 1, 1),
(15, 'ASISTENTE DE VENTAS', 1, 1),
(16, 'TESORERIA', 1, 1),
(17, 'ASESOR DE VENTAS', 1, 1),
(18, 'GERENTE DE ADMINISTRACIÓN', 1, 1),
(19, 'COORDINADOR DE LICITACIONES', 1, 1),
(20, 'ASISTENTE DE CONTABILIDAD', 1, 1),
(21, 'COORDINADOR DE OPERACIONES', 1, 1),
(22, 'AUXILIAR DE VENTAS', 2, 1),
(23, 'AUXILIAR DE SOLDADURA', 2, 1),
(24, 'ASISTENTE DE TRANSPORTE Y DESPACHO', 2, 1),
(25, 'SUPERVISOR DE SAP', 2, 1),
(26, 'AUXILIAR DE PLANTA', 2, 1),
(27, 'AUXILIAR INSTRUMENTISTA', 2, 1),
(28, 'GERENTE GENERAL', 2, 1),
(29, 'AUXILIAR CONTABLE', 2, 1),
(30, 'AUXILIAR DE PINTURA', 2, 1),
(31, 'AUXILIAR DE DESPACHO', 2, 1),
(32, 'ASISTENTE DE MARKETING', 2, 1),
(33, 'AUXILIAR DE MARKETING', 3, 1),
(34, 'AUXILIAR DE SOPORTE DE SERVICIOS', 3, 1),
(35, 'AUXILIAR DE CALIDAD', 3, 1),
(36, 'AUXILIAR DE TI', 3, 1),
(37, 'AUXILIAR DE RRHH', 3, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categoria_ticket`
--

CREATE TABLE `categoria_ticket` (
  `ID_CATEGORIA` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categoria_ticket`
--

INSERT INTO `categoria_ticket` (`ID_CATEGORIA`, `DESCRIP`) VALUES
(1, 'INCIDENCIA'),
(2, 'SOLICITUD'),
(3, 'REQUERIMIENTO'),
(4, 'SAP');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `catg_asistencia`
--

CREATE TABLE `catg_asistencia` (
  `ID_CATGA` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `catg_asistencia`
--

INSERT INTO `catg_asistencia` (`ID_CATGA`, `DESCRIP`) VALUES
(1, 'PUNTUAL'),
(2, 'TARDANZA'),
(3, 'FALTA'),
(4, 'PERMISO'),
(5, 'VACACIONES'),
(6, 'PERMISO PERSONAL'),
(7, 'COMPENSACION HORAS'),
(8, 'COMISION'),
(9, 'LICENCIA'),
(10, 'VIAJE LABORAL'),
(11, 'DESCANSO'),
(12, 'DIA LIBRE'),
(13, 'INCONSISTENCIA');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `chips`
--

CREATE TABLE `chips` (
  `ID_CHIPS` int(11) NOT NULL,
  `NUMERO` varchar(12) NOT NULL,
  `PRECIO` decimal(10,2) NOT NULL,
  `ID_OPERADOR` int(11) DEFAULT NULL,
  `FECH_ASIGNACION` date DEFAULT NULL,
  `ID_PLAN` int(11) DEFAULT NULL,
  `ID_DESCUENTO` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `chips`
--

INSERT INTO `chips` (`ID_CHIPS`, `NUMERO`, `PRECIO`, `ID_OPERADOR`, `FECH_ASIGNACION`, `ID_PLAN`, `ID_DESCUENTO`) VALUES
(1, '968622902', 42.90, 1, NULL, 1, 1),
(2, '968255906', 42.90, 1, NULL, 1, 1),
(3, '969601490', 42.90, 1, NULL, 1, 1),
(4, '961001933', 42.90, 1, NULL, 1, 1),
(5, '952991400', 42.90, 1, NULL, 1, 1),
(6, '999088159', 42.90, 1, NULL, 1, 1),
(7, '920718733', 42.90, 1, NULL, 1, 1),
(8, '951858947', 42.90, 1, NULL, 1, 1),
(9, '954929452', 42.90, 1, NULL, 1, 1),
(10, '990158441', 42.90, 1, NULL, 1, 1),
(11, '969601816', 42.90, 1, NULL, 1, 1),
(12, '984673358', 69.90, 1, NULL, 2, 1),
(13, '948681461', 42.90, 1, NULL, 1, 1),
(14, '972993676', 69.90, 1, NULL, 2, 1),
(15, '948010234', 42.90, 1, NULL, 1, 1),
(16, '942604388', 69.90, 1, NULL, 2, 1),
(17, '972858947', 69.90, 1, NULL, 2, 1),
(18, '969336438', 42.90, 1, NULL, 1, 1),
(19, '990203550', 159.90, 1, NULL, 4, 1),
(20, '995957013', 69.90, 1, NULL, 2, 1),
(21, '996283053', 42.90, 1, NULL, 1, 1),
(22, '972628716', 42.90, 1, NULL, 1, 1),
(23, '972626426', 42.90, 1, NULL, 1, 1),
(24, '998023709', 42.90, 1, NULL, 1, 1),
(25, '969601520', 69.90, 1, NULL, 2, 1),
(26, '969336439', 42.90, 1, NULL, 1, 1),
(27, '920187896', 42.90, 1, NULL, 1, 1),
(28, '944636648', 42.90, 1, NULL, 1, 1),
(29, '990158573', 42.90, 1, NULL, 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contacto`
--

CREATE TABLE `contacto` (
  `ID_CONTAC` int(11) NOT NULL,
  `ID_PERSONAL` int(11) NOT NULL,
  `ID_TIPFAM` int(11) NOT NULL,
  `NOMBRES` varchar(100) NOT NULL,
  `CELULAR` varchar(12) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `contacto`
--

INSERT INTO `contacto` (`ID_CONTAC`, `ID_PERSONAL`, `ID_TIPFAM`, `NOMBRES`, `CELULAR`) VALUES
(1, 40, 1, 'Guillermo Delgado', '954762456');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contrato`
--

CREATE TABLE `contrato` (
  `ID_CONTR` int(11) NOT NULL,
  `ID_PERSONAL` int(11) NOT NULL,
  `ID_ESTADO_CONTRATO` int(11) NOT NULL,
  `ID_TIPOCONTR` int(11) NOT NULL,
  `SUELDO` varchar(50) DEFAULT NULL,
  `ASIG_FAM` tinyint(1) DEFAULT 0,
  `FECH_INGR` date DEFAULT NULL,
  `FECH_CESE` date DEFAULT NULL,
  `ID_AREA` int(11) NOT NULL,
  `ID_CARGO` int(11) NOT NULL,
  `ID_MODALID` int(11) DEFAULT NULL,
  `ID_EMP` int(11) DEFAULT NULL,
  `ID_HORARIO` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `contrato`
--

INSERT INTO `contrato` (`ID_CONTR`, `ID_PERSONAL`, `ID_ESTADO_CONTRATO`, `ID_TIPOCONTR`, `SUELDO`, `ASIG_FAM`, `FECH_INGR`, `FECH_CESE`, `ID_AREA`, `ID_CARGO`, `ID_MODALID`, `ID_EMP`, `ID_HORARIO`) VALUES
(1, 1, 1, 1, NULL, 0, '2016-02-01', NULL, 5, 1, 1, 1, 3),
(2, 2, 1, 1, NULL, 0, '2023-05-05', NULL, 3, 2, 1, 1, 1),
(3, 3, 1, 1, NULL, 0, '2013-02-01', NULL, 5, 3, 1, 1, 1),
(4, 4, 1, 1, NULL, 0, '2021-09-01', NULL, 3, 4, 1, 1, 1),
(5, 5, 1, 1, NULL, 0, '2025-08-20', NULL, 3, 2, 1, 1, 1),
(6, 6, 1, 1, NULL, 0, '2007-09-01', NULL, 1, 5, 1, 1, 1),
(7, 7, 1, 1, NULL, 0, '2021-10-15', NULL, 5, 6, 1, 1, 1),
(8, 8, 1, 1, NULL, 0, '2025-03-26', NULL, 2, 7, 1, 1, 1),
(9, 9, 1, 1, NULL, 0, '2017-10-02', NULL, 1, 8, 1, 1, 3),
(10, 10, 1, 1, NULL, 0, '2022-10-06', NULL, 2, 9, 1, 1, 1),
(11, 11, 1, 1, NULL, 0, '2023-05-23', NULL, 2, 10, 1, 1, 1),
(12, 12, 1, 1, NULL, 0, '2020-01-25', NULL, 4, 11, 1, 1, 1),
(13, 13, 1, 1, NULL, 0, '2022-11-22', NULL, 2, 12, 1, 1, 1),
(14, 14, 1, 1, NULL, 0, '2016-07-11', NULL, 3, 13, 1, 1, 1),
(15, 15, 1, 1, NULL, 0, '2019-11-01', NULL, 1, 14, 1, 1, 3),
(16, 16, 1, 1, NULL, 0, '2023-02-01', NULL, 3, 2, 1, 1, 1),
(17, 17, 1, 1, NULL, 0, '2022-02-01', NULL, 3, 2, 1, 1, 1),
(18, 18, 1, 1, NULL, 0, '2026-02-03', NULL, 3, 15, 1, 1, 1),
(19, 19, 1, 1, NULL, 0, '2026-02-05', NULL, 3, 2, 1, 1, 1),
(20, 20, 1, 1, NULL, 0, '2010-11-01', NULL, 2, 16, 1, 1, 1),
(21, 21, 1, 1, NULL, 0, '2026-01-01', NULL, 3, 17, 1, 1, 3),
(22, 22, 1, 1, NULL, 0, '2005-01-01', NULL, 1, 18, 1, 1, 3),
(23, 23, 1, 1, NULL, 0, '2024-07-10', NULL, 2, 19, 1, 1, 2),
(24, 24, 1, 1, NULL, 0, '2025-03-01', NULL, 2, 20, 1, 1, 1),
(25, 25, 1, 1, NULL, 0, '2023-12-31', NULL, 2, 10, 1, 1, 1),
(26, 26, 1, 1, NULL, 0, '2020-02-05', NULL, 5, 21, 1, 1, 1),
(27, 27, 1, 1, NULL, 0, '2019-02-18', NULL, 3, 17, 1, 1, 1),
(28, 28, 1, 1, NULL, 0, '2026-01-01', NULL, 3, 22, 1, 2, 4),
(29, 29, 1, 1, NULL, 0, '2025-08-11', NULL, 5, 23, 1, 2, 4),
(30, 30, 1, 1, NULL, 0, '2026-02-28', NULL, 5, 24, 1, 2, 4),
(31, 31, 1, 1, NULL, 0, '2019-11-01', NULL, 1, 25, 1, 2, 4),
(32, 32, 1, 1, NULL, 0, '2026-01-01', NULL, 5, 26, 1, 2, 4),
(33, 33, 1, 1, NULL, 0, '2026-01-01', NULL, 5, 27, 1, 2, 4),
(34, 34, 1, 1, NULL, 0, '2019-11-01', NULL, 1, 28, 1, 2, 4),
(35, 35, 1, 1, NULL, 0, '2026-01-01', NULL, 5, 29, 1, 2, 4),
(36, 36, 1, 1, NULL, 0, '2025-03-14', NULL, 5, 30, 1, 2, 4),
(37, 37, 1, 1, NULL, 0, '2025-09-01', NULL, 5, 31, 1, 2, 4),
(38, 38, 1, 1, NULL, 0, '2026-01-01', NULL, 5, 27, 1, 2, 4),
(39, 39, 1, 1, NULL, 0, '2026-01-01', NULL, 3, 32, 1, 2, 4),
(40, 40, 1, 1, NULL, 0, '2025-08-07', NULL, 3, 33, 1, 3, 5),
(41, 41, 1, 1, NULL, 0, '2025-09-01', NULL, 5, 34, 1, 3, 5),
(42, 42, 1, 1, NULL, 0, '2026-01-01', NULL, 4, 35, 1, 3, 5),
(43, 43, 1, 1, NULL, 0, '2026-01-01', NULL, 2, 36, 1, 3, 5),
(44, 44, 1, 1, NULL, 0, '2026-01-01', NULL, 2, 37, 1, 3, 5),
(45, 45, 1, 1, NULL, 0, '2026-01-01', NULL, 2, 37, 1, 3, 5),
(46, 46, 1, 1, NULL, 0, '2026-03-11', NULL, 2, 12, 1, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cuenta_banca`
--

CREATE TABLE `cuenta_banca` (
  `ID_CBANCA` int(11) NOT NULL,
  `ID_PERSONAL` int(11) NOT NULL,
  `ID_TIPO_CUENTA` int(11) NOT NULL,
  `ID_BANCO` int(11) NOT NULL,
  `CUENTA_BANC` varchar(50) DEFAULT NULL,
  `ID_MONEDA` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `departamento`
--

CREATE TABLE `departamento` (
  `ID_DEPART` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `departamento`
--

INSERT INTO `departamento` (`ID_DEPART`, `DESCRIP`) VALUES
(1, 'ADMINISTRACIÓN'),
(2, 'ALMACEN Y DESPACHO'),
(3, 'COMERCIAL'),
(4, 'COMPRAS'),
(5, 'CONTABILIDAD Y FINANZAS'),
(6, 'CONTROL DE CALIDAD'),
(7, 'GESTION HUMANA Y ADMINISTRATIVA'),
(8, 'LICITACIONES'),
(9, 'OPERACIONES'),
(10, 'POSTVENTA Y SERVICIOS'),
(11, 'PROCESOS INDUSTRIALES'),
(12, 'TI'),
(13, 'VENTAS');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `depart_y_provinc`
--

CREATE TABLE `depart_y_provinc` (
  `ID_DEPARTAMENTO` int(11) NOT NULL,
  `NOMBR_DEP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `depart_y_provinc`
--

INSERT INTO `depart_y_provinc` (`ID_DEPARTAMENTO`, `NOMBR_DEP`) VALUES
(1, 'Amazonas'),
(2, 'Áncash'),
(3, 'Apurímac'),
(4, 'Arequipa'),
(5, 'Ayacucho'),
(6, 'Cajamarca'),
(7, 'Callao'),
(8, 'Cusco'),
(9, 'Huancavelica'),
(10, 'Huánuco'),
(11, 'Ica'),
(12, 'Junín'),
(13, 'La Libertad'),
(14, 'Lambayeque'),
(15, 'Lima'),
(16, 'Loreto'),
(17, 'Madre de Dios'),
(18, 'Moquegua'),
(19, 'Pasco'),
(20, 'Piura'),
(21, 'Puno'),
(22, 'San Martín'),
(23, 'Tacna'),
(24, 'Tumbes'),
(25, 'Ucayali');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `descuento_chips`
--

CREATE TABLE `descuento_chips` (
  `ID_DESCUENTO` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL,
  `DESCUENTO` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `descuento_chips`
--

INSERT INTO `descuento_chips` (`ID_DESCUENTO`, `DESCRIP`, `DESCUENTO`) VALUES
(1, '50% x 18 Meses Renovable', 50);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `disco`
--

CREATE TABLE `disco` (
  `ID_DISCO` int(11) NOT NULL,
  `ID_TDISCO` int(11) NOT NULL,
  `ID_CAPDISCO` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `disco`
--

INSERT INTO `disco` (`ID_DISCO`, `ID_TDISCO`, `ID_CAPDISCO`) VALUES
(1, 4, 7);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `distrito`
--

CREATE TABLE `distrito` (
  `ID_DISTR` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `distrito`
--

INSERT INTO `distrito` (`ID_DISTR`, `DESCRIP`) VALUES
(1, 'Ancon'),
(2, 'Ate'),
(3, 'Barranco'),
(4, 'Breña'),
(5, 'Carabayllo'),
(6, 'Chaclacayo'),
(7, 'Chorrillos'),
(8, 'Cieneguilla'),
(9, 'Comas'),
(10, 'El Agustino'),
(11, 'Independencia'),
(12, 'Jesús María'),
(13, 'La Molina'),
(14, 'La Victoria'),
(15, 'Lima'),
(16, 'Lince'),
(17, 'Los Olivos'),
(18, 'Lurigancho'),
(19, 'Lurín'),
(20, 'Magdalena del Mar'),
(21, 'Miraflores'),
(22, 'Pachacamac'),
(23, 'Pucusana'),
(24, 'Pueblo Libre'),
(25, 'Puente Piedra'),
(26, 'Punta Hermosa'),
(27, 'Punta Negra'),
(28, 'Rimac'),
(29, 'San Bartolo'),
(30, 'San Borja'),
(31, 'San Isidro'),
(32, 'San Juan de Lurigancho'),
(33, 'San Juan de Miraflores'),
(34, 'San Luis'),
(35, 'San Martín de Porres'),
(36, 'San Miguel'),
(37, 'Santa Anita'),
(38, 'Santa María del Mar'),
(39, 'Santa Rosa'),
(40, 'Santiago de Surco'),
(41, 'Surquillo'),
(42, 'Villa El Salvador'),
(43, 'Villa María del Triunfo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `documento`
--

CREATE TABLE `documento` (
  `ID_DOC` int(11) NOT NULL,
  `CODIGO` varchar(10) NOT NULL,
  `DESCRIP` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `documento`
--

INSERT INTO `documento` (`ID_DOC`, `CODIGO`, `DESCRIP`) VALUES
(1, 'DNI', 'Documento Nacional de Identidad'),
(2, 'CE', 'Carnet de Extranjería'),
(3, 'PAS', 'Pasaporte');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empresa`
--

CREATE TABLE `empresa` (
  `ID_EMP` int(11) NOT NULL,
  `NOMBRE` varchar(150) NOT NULL,
  `RUC` varchar(50) DEFAULT NULL,
  `DIREC` varchar(255) DEFAULT NULL,
  `LOGO` varchar(255) DEFAULT NULL,
  `LOGO_DARK` varchar(255) DEFAULT NULL,
  `ESTADO` tinyint(1) DEFAULT 1,
  `SELECCION` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `empresa`
--

INSERT INTO `empresa` (`ID_EMP`, `NOMBRE`, `RUC`, `DIREC`, `LOGO`, `LOGO_DARK`, `ESTADO`, `SELECCION`) VALUES
(1, 'ENERQUIMICA', '20208473523', 'CAL.CARLOS PEDEMONTE NRO. 142 URB. EL MERCURIO (FRENTE AL MCDO DE FRUTAS- MAESTRO ARRIOL) LIMA - LIMA - SAN LUIS', 'Enerquimica_logo_blanco.webp', 'Enerquimica_logo_negro.webp', 1, 1),
(2, 'EQCORPORACION', '20517072495', 'CAL.LEONIDAS LA SERRE NRO. 322 URB. EL PINO (ALT CDRA 29 NICOLAS ARRIOLA) LIMA - LIMA - SAN LUIS', 'eq.webp', 'eq_negro.webp', 1, 0),
(3, 'SIDSYS', '20538461815', 'CAL.LEONIDAS LA SERRE NRO. 322 URB. EL PINO (ALT CDRA 29 NICOLAS ARRIOLA) LIMA - LIMA - SAN LUIS', 'sidsys.webp', 'sidsys_negro.webp', 1, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `equipo`
--

CREATE TABLE `equipo` (
  `ID_EQUIPO` int(11) NOT NULL,
  `SERIE_EQUIPO` varchar(200) NOT NULL,
  `ID_TEQUIPO` int(11) NOT NULL,
  `ID_EST_EQUIPO` int(11) NOT NULL,
  `ID_ESPEC` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `equipo`
--

INSERT INTO `equipo` (`ID_EQUIPO`, `SERIE_EQUIPO`, `ID_TEQUIPO`, `ID_EST_EQUIPO`, `ID_ESPEC`) VALUES
(1, '23132132132', 2, 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `especificaciones_tec`
--

CREATE TABLE `especificaciones_tec` (
  `ID_ESPEC` int(11) NOT NULL,
  `FECH_COMPRA` date DEFAULT NULL,
  `GARANTIA` tinyint(1) DEFAULT 1,
  `CODIGOE` varchar(100) DEFAULT NULL,
  `ID_GAMA` int(11) DEFAULT NULL,
  `ID_MARCA` int(11) DEFAULT NULL,
  `ID_MODELO` int(11) DEFAULT NULL,
  `ID_PROCESADOR` int(11) DEFAULT NULL,
  `ID_TIPO_RAM` int(11) DEFAULT NULL,
  `ID_RAM` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `especificaciones_tec`
--

INSERT INTO `especificaciones_tec` (`ID_ESPEC`, `FECH_COMPRA`, `GARANTIA`, `CODIGOE`, `ID_GAMA`, `ID_MARCA`, `ID_MODELO`, `ID_PROCESADOR`, `ID_TIPO_RAM`, `ID_RAM`) VALUES
(1, '2026-03-11', 1, 'ENERQ142024', 1, 1, 1, 3, 2, 5);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_accs`
--

CREATE TABLE `estado_accs` (
  `ID_ESTADO` int(11) NOT NULL,
  `DESCRIP` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estado_accs`
--

INSERT INTO `estado_accs` (`ID_ESTADO`, `DESCRIP`) VALUES
(1, 'ACTIVO'),
(2, 'BLOQUEADO'),
(3, 'DESACTIVADO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_civil`
--

CREATE TABLE `estado_civil` (
  `ID_ESTCIVIL` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estado_civil`
--

INSERT INTO `estado_civil` (`ID_ESTCIVIL`, `DESCRIP`) VALUES
(1, 'SOLTERO'),
(2, 'CASADO'),
(3, 'DIVORCIADO'),
(4, 'VIUDO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_contrato`
--

CREATE TABLE `estado_contrato` (
  `ID_ESTADO_CONTRATO` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estado_contrato`
--

INSERT INTO `estado_contrato` (`ID_ESTADO_CONTRATO`, `DESCRIP`) VALUES
(1, 'VIGENTE'),
(2, 'MIGRADO'),
(3, 'CESADO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_equipo`
--

CREATE TABLE `estado_equipo` (
  `ID_EST_EQUIPO` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estado_equipo`
--

INSERT INTO `estado_equipo` (`ID_EST_EQUIPO`, `DESCRIP`) VALUES
(1, 'DISPONIBLE'),
(2, 'ASIGNADO'),
(3, 'BAJA');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `familia_sap`
--

CREATE TABLE `familia_sap` (
  `ID_FAMSAP` int(11) NOT NULL,
  `DESCRIP` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `familia_sap`
--

INSERT INTO `familia_sap` (`ID_FAMSAP`, `DESCRIP`) VALUES
(1, 'CARGADORES - 10001'),
(2, 'CELDAS - 10002'),
(3, 'BATERIAS - 10003'),
(4, 'BATERIAS AUTOMOTRICES - 10004'),
(5, 'PROYECTOS - 10005'),
(6, 'BATERIA INDUSTRIAL - 10006'),
(7, 'RECTIFICADORES - 10007'),
(8, 'METAL MECANICA - 10008'),
(9, 'SOLAR - 10009'),
(10, 'BESS - 10010'),
(11, 'CARGA Y DESCARGA - 10101'),
(12, 'SERVICIO - 10102'),
(13, 'CERVEZA - 10201'),
(14, 'REPUESTOS - 10202'),
(15, 'CONSUMIBLES - 10203'),
(16, 'FILTROS - 10204'),
(17, 'FERROVIARIA - 10205'),
(18, 'COMPONENTES - 10206'),
(19, 'BEBIDAS - 10207'),
(20, 'AGUA - 10208'),
(21, 'COLOR - 10209'),
(22, 'AGUA - 10301'),
(23, 'BEBIDAS - 10302'),
(24, 'CERVEZA - 10303'),
(25, 'COLOR - 10304'),
(26, 'MOLINOS - 10401'),
(27, 'CHANCADORAS - 10402'),
(28, 'REPUESTOS - 10403'),
(29, 'QH - 10501'),
(30, 'CYMI - 10502'),
(31, 'OLC - 10503'),
(32, 'GRUPO QE - 10504'),
(33, 'COMPRAS ÚNICAS - 10601'),
(34, 'MERCADERIA VARIA - 10701');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gama`
--

CREATE TABLE `gama` (
  `ID_GAMA` int(11) NOT NULL,
  `DESCRIP` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `gama`
--

INSERT INTO `gama` (`ID_GAMA`, `DESCRIP`) VALUES
(1, 'ALTA'),
(2, 'MEDIA'),
(3, 'BAJA');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `grado_academico`
--

CREATE TABLE `grado_academico` (
  `ID_ACADM` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `grado_academico`
--

INSERT INTO `grado_academico` (`ID_ACADM`, `DESCRIP`) VALUES
(1, 'SECUNDARIA COMPLETA'),
(2, 'TEC. INCOMPLETO'),
(3, 'TEC EN CURSO'),
(4, 'TECNICO COMPLETO'),
(5, 'UNIV. INCOMPLETO'),
(6, 'UNIV. EN CURSO'),
(7, 'EGRESADO'),
(8, 'BACHILLER'),
(9, 'TITULADO'),
(10, 'UNIVERSITARIO'),
(11, 'MAESTRIA'),
(12, 'DOCTORADO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `grupo_articulos`
--

CREATE TABLE `grupo_articulos` (
  `ID_GRP_ART` int(11) NOT NULL,
  `COD_SERV_ART` tinyint(1) DEFAULT 1,
  `DESCRIP` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `grupo_articulos`
--

INSERT INTO `grupo_articulos` (`ID_GRP_ART`, `COD_SERV_ART`, `DESCRIP`) VALUES
(1, 1, 'ENERGIA - SUMINISTRO'),
(2, 0, 'ENERGIA - SERVICIO'),
(3, 1, 'INSTRUMENTACION - SUMINISTRO NACIONAL'),
(4, 0, 'INSTRUMENTACION - SERVICIO'),
(5, 1, 'MINERIA'),
(6, 1, 'PROYECTOS ESTRATEGICOS Y LICITACIONES'),
(7, 1, 'ENERGIA - PRODUCTOS TERMINADOS'),
(8, 1, 'INSTRUMENTACION - SUMINISTRO IMPORTADO'),
(9, 1, 'UTILES VARIOS - ECONOMATOS'),
(10, 1, 'ENERGIA - SOLAR');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `horario`
--

CREATE TABLE `horario` (
  `ID_HORARIO` int(11) NOT NULL,
  `NOMBRE` varchar(100) NOT NULL,
  `DESCRIP` varchar(100) DEFAULT NULL,
  `ESTADO` tinyint(4) DEFAULT 1,
  `ID_EMP` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `horario`
--

INSERT INTO `horario` (`ID_HORARIO`, `NOMBRE`, `DESCRIP`, `ESTADO`, `ID_EMP`) VALUES
(1, 'Horario General', 'Lun-Vie 08:00-17:30, Sab 08:00-12:15', 1, 1),
(2, 'Horario Secundario', 'Lun-Vie 08:00-17:30, Sab 08:00-12:15', 1, 1),
(3, 'Exonerado', 'Gerencia', 1, 1),
(4, 'EQ - Horario General', 'Lun-Vie 08:00-17:30, Sab 08:00-12:15', 1, 2),
(5, 'SID - Horario General', 'Lun-Vie 08:00-17:30, Sab 08:00-12:15', 1, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `horario_detalle`
--

CREATE TABLE `horario_detalle` (
  `ID_HDET` int(11) NOT NULL,
  `ID_HORARIO` int(11) NOT NULL,
  `DIA` tinyint(4) NOT NULL,
  `HORA_E` time DEFAULT NULL,
  `HORA_S` time DEFAULT NULL,
  `DIA_DESC` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `horario_detalle`
--

INSERT INTO `horario_detalle` (`ID_HDET`, `ID_HORARIO`, `DIA`, `HORA_E`, `HORA_S`, `DIA_DESC`) VALUES
(50, 5, 1, '08:00:00', '17:30:00', 0),
(51, 5, 2, '08:00:00', '17:30:00', 0),
(52, 5, 3, '08:00:00', '17:30:00', 0),
(53, 5, 4, '08:00:00', '17:30:00', 0),
(54, 5, 5, '08:00:00', '17:30:00', 0),
(55, 5, 6, '08:00:00', '12:15:00', 0),
(56, 5, 7, NULL, NULL, 1),
(57, 3, 1, NULL, NULL, 1),
(58, 3, 2, NULL, NULL, 1),
(59, 3, 3, NULL, NULL, 1),
(60, 3, 4, NULL, NULL, 1),
(61, 3, 5, NULL, NULL, 1),
(62, 3, 6, NULL, NULL, 1),
(63, 3, 7, NULL, NULL, 1),
(64, 1, 1, '08:00:00', '17:30:00', 0),
(65, 1, 2, '08:00:00', '17:30:00', 0),
(66, 1, 3, '08:00:00', '17:30:00', 0),
(67, 1, 4, '08:00:00', '17:30:00', 0),
(68, 1, 5, '08:00:00', '17:30:00', 0),
(69, 1, 6, '08:00:00', '12:15:00', 0),
(70, 1, 7, NULL, NULL, 1),
(71, 2, 1, '07:00:00', '17:30:00', 0),
(72, 2, 2, '07:45:00', '17:30:00', 0),
(73, 2, 3, '07:45:00', '17:30:00', 0),
(74, 2, 4, '07:45:00', '17:30:00', 0),
(75, 2, 5, '07:45:00', '17:30:00', 0),
(76, 2, 6, NULL, NULL, 1),
(77, 2, 7, NULL, NULL, 1),
(78, 4, 1, '08:00:00', '17:30:00', 0),
(79, 4, 2, '08:00:00', '17:30:00', 0),
(80, 4, 3, '08:00:00', '17:30:00', 0),
(81, 4, 4, '08:00:00', '17:30:00', 0),
(82, 4, 5, '08:00:00', '17:30:00', 0),
(83, 4, 6, '08:00:00', '12:15:00', 0),
(84, 4, 7, NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `licencia`
--

CREATE TABLE `licencia` (
  `ID_LICENCIA` int(11) NOT NULL,
  `DESCRIP` varchar(255) NOT NULL,
  `CANTIDAD` int(11) NOT NULL,
  `SERIE_KEYS` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mantenimiento`
--

CREATE TABLE `mantenimiento` (
  `ID_MANTENIMIENTO` int(11) NOT NULL,
  `ID_TECNICO` int(11) DEFAULT NULL,
  `ID_EQUIPO` int(11) NOT NULL,
  `FECHA_MANT` datetime NOT NULL,
  `TIPO_MANTENIMIENTO` enum('PREVENTIVO','PROGRAMADO','REPARACION') NOT NULL,
  `ESTADO` enum('PENDIENTE','EN_PROCESO','COMPLETADO','CANCELADO') NOT NULL,
  `TIPO_PERIODO` enum('TRIMESTRAL','SEMESTRAL','ANUAL') NOT NULL,
  `FECHA_PROG` datetime NOT NULL,
  `DETALLE_MANT` varchar(255) NOT NULL,
  `FOTO1` varchar(255) DEFAULT NULL,
  `FOTO2` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `marca`
--

CREATE TABLE `marca` (
  `ID_MARCA` int(11) NOT NULL,
  `DESCRIP` varchar(255) NOT NULL,
  `ID_TEQUIPO` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `marca`
--

INSERT INTO `marca` (`ID_MARCA`, `DESCRIP`, `ID_TEQUIPO`) VALUES
(1, 'HP', 2),
(2, 'Dell', 2),
(3, 'Lenovo', 2),
(4, 'Asus', 2),
(5, 'Acer', 2),
(6, 'Apple', 2),
(7, 'MSI', 2),
(8, 'Xiaomi', 4),
(9, 'Honor', 4),
(10, 'Samsung', 4),
(11, 'Epson', 5);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `marca_sap`
--

CREATE TABLE `marca_sap` (
  `ID_MARCASAP` int(11) NOT NULL,
  `DESCRIP` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `modalidad`
--

CREATE TABLE `modalidad` (
  `ID_MODALID` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `modalidad`
--

INSERT INTO `modalidad` (`ID_MODALID`, `DESCRIP`) VALUES
(1, 'NECESIDAD DE MERCADO'),
(2, 'INTERMEDIACIÓN'),
(3, 'PRACTICAS');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `modelo`
--

CREATE TABLE `modelo` (
  `ID_MODELO` int(11) NOT NULL,
  `DESCRIP` varchar(255) NOT NULL,
  `ID_MARCA` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `modelo`
--

INSERT INTO `modelo` (`ID_MODELO`, `DESCRIP`, `ID_MARCA`) VALUES
(1, '255 G10 Notebook', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `modelo_sap`
--

CREATE TABLE `modelo_sap` (
  `ID_MODELOSAP` int(11) NOT NULL,
  `DESCRIP` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `moneda`
--

CREATE TABLE `moneda` (
  `ID_MONEDA` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `moneda`
--

INSERT INTO `moneda` (`ID_MONEDA`, `DESCRIP`) VALUES
(1, 'SOLES'),
(2, 'DOLARES AMERICANOS'),
(3, 'EUROS');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `motivo`
--

CREATE TABLE `motivo` (
  `ID_TMOTIVO` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `motivo`
--

INSERT INTO `motivo` (`ID_TMOTIVO`, `DESCRIP`) VALUES
(1, 'AUMENTO DE SUELDO'),
(2, 'CAMBIO DE AREA'),
(3, 'CAMBIO DE CARGO'),
(4, 'RENOVACION DE CONTRATO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `operador_chips`
--

CREATE TABLE `operador_chips` (
  `ID_OPERADOR` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `operador_chips`
--

INSERT INTO `operador_chips` (`ID_OPERADOR`, `DESCRIP`) VALUES
(1, 'ENTEL'),
(2, 'MOVISTAR'),
(3, 'CLARO'),
(4, 'BITEL');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permiso_accs`
--

CREATE TABLE `permiso_accs` (
  `ID_PERM` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `permiso_accs`
--

INSERT INTO `permiso_accs` (`ID_PERM`, `DESCRIP`) VALUES
(1, 'ASISTENCIA'),
(12, 'CHIPS'),
(10, 'CLIENTES'),
(5, 'EQUIPOS_ASIGNACION'),
(4, 'EQUIPOS_CREAR'),
(3, 'HORARIOS'),
(8, 'INICIO'),
(9, 'INVENTARIO'),
(11, 'PERMISOS'),
(2, 'PERSONAL'),
(6, 'TICKETS_NUEVO'),
(7, 'TICKETS_PANEL');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `personal`
--

CREATE TABLE `personal` (
  `ID_PERSONAL` int(11) NOT NULL,
  `ID_ACCS` int(11) NOT NULL,
  `ID_DOC` int(11) NOT NULL,
  `NUM_DOC` varchar(50) NOT NULL,
  `APE_PATERNO` varchar(100) NOT NULL,
  `APE_MATERNO` varchar(100) NOT NULL,
  `NOMBRES` varchar(100) NOT NULL,
  `GENERO_PERS` tinyint(1) DEFAULT 1,
  `FECH_NAC` date DEFAULT NULL,
  `EMAIL` varchar(100) DEFAULT NULL,
  `CELULAR` varchar(12) DEFAULT NULL,
  `FOTO` varchar(255) DEFAULT NULL,
  `ID_ESTCIVIL` int(11) DEFAULT NULL,
  `ID_ACADM` int(11) DEFAULT NULL,
  `ID_DISTR` int(11) DEFAULT NULL,
  `DIRECCION` varchar(255) DEFAULT NULL,
  `ID_DEPARTAMENTO` int(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `personal`
--

INSERT INTO `personal` (`ID_PERSONAL`, `ID_ACCS`, `ID_DOC`, `NUM_DOC`, `APE_PATERNO`, `APE_MATERNO`, `NOMBRES`, `GENERO_PERS`, `FECH_NAC`, `EMAIL`, `CELULAR`, `FOTO`, `ID_ESTCIVIL`, `ID_ACADM`, `ID_DISTR`, `DIRECCION`, `ID_DEPARTAMENTO`) VALUES
(1, 1, 1, '8698028', 'BLONDET', 'TABOADA', 'JUAN ARTURO', 1, '1965-03-31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(2, 2, 1, '77422005', 'HINOJOSA', 'RIVAS', 'ANDREA', 0, '1999-05-25', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(3, 3, 1, '43251756', 'SINCHE', 'CCAHUANA', 'ANDRES', 1, '1985-02-07', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(4, 4, 1, '74884503', 'BACA', 'MENDOZA', 'BRIGITTE', 0, '1994-10-10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(5, 5, 1, '74757342', 'CONDESO', 'CARRIZALES', 'BRYAM ALONSO', 1, '1996-06-03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(6, 6, 1, '7613200', 'ILLESCA', 'DHAGA DEL CASTILLO', 'CARMEN', 0, '1967-11-23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(7, 7, 1, '47369260', 'VASQUEZ', 'TAPIA', 'CLEVER', 1, '1992-10-26', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(8, 8, 1, '45419847', 'VIDAURRE', 'SANTAMARIA', 'CARMEN ELENA', 0, '1988-10-24', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(9, 9, 1, '47386836', 'DIAZ', 'LABAJOS', 'ESTEBAN', 1, '1991-10-15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(10, 10, 1, '71979880', 'GUTIERREZ', 'MENDOZA', 'ROSARIO ESTEFANI', 0, '1996-05-18', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(11, 11, 1, '75602262', 'OCHOA', 'CHILCON', 'ERLITA', 0, '1997-08-19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(12, 12, 1, '77203368', 'CHILON', 'HUAMAN', 'FANNY JHOANNA', 0, '1995-06-22', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(13, 13, 1, '46676998', 'RAMIREZ', 'HUAMALIES', 'GARY CARLOS', 1, '1990-12-30', NULL, NULL, 'GARY_RAMIREZ_13.webp', NULL, NULL, NULL, NULL, 1),
(14, 14, 1, '43109783', 'ZUÑIGA', 'DE LA CRUZ', 'GISSELA SUSANA', 0, '1985-03-03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(15, 15, 1, '70616281', 'MARIN', 'ILLESCA', 'HONIRA GIANELLA', 0, '1995-09-02', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(16, 16, 1, '48434107', 'CALLA', 'ACERO', 'KARELY ANABEL', 0, '1994-07-02', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(17, 17, 1, '46680880', 'VICENTE', 'MEZA', 'ROSA LIZET', 0, '1990-03-07', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(18, 18, 1, '60548584', 'ALDAY', 'CHIRE', 'MAYRA DANICKA FIORELLA', 0, '2002-04-26', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(19, 19, 1, '72163850', 'JULCA', 'LALUPU', 'MICHAEL ALONSO', 1, '2001-02-10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(20, 20, 1, '8547322', 'ORTIZ', 'MEDINA', 'MANUELA', 0, '1960-08-24', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(21, 21, 1, '8639199', 'RUIZ', 'DIAZ', 'MANUEL ALBERTO', 1, '1948-12-25', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(22, 22, 1, '9067174', 'CHAUCA', 'PALOMINO', 'NELLY BEATRIZ', 0, '1967-10-13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(23, 23, 1, '70123396', 'ROMERO', 'SANCHEZ', 'PHILL ARNOLD', 1, '1995-12-29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(24, 24, 1, '75231010', 'MANAYAY', 'SANCHEZ', 'ROSALIA', 0, '1998-03-30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(25, 25, 1, '74892568', 'JAUREGUI', 'VELASQUEZ', 'SANDRA ALLISON', 0, '2000-03-07', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(26, 26, 1, '42746880', 'VARGAS', 'SOTO', 'SUSSY KARINA', 0, '1984-09-30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(27, 27, 1, '72953015', 'TORRES', 'MALDONADO', 'TATIANA', 0, '1992-06-10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(28, 28, 1, '76936089', 'HUAMANI', 'VARGAS', 'ANA LUISA', 0, '2003-08-15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(29, 29, 1, '47001860', 'SECLEN', 'CASTILLO', 'CRISTIAN ELOY', 1, '1991-02-06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(30, 30, 1, '70029383', 'ALVINO', 'LLANOS', 'EMANUEL SEBASTIAN', 1, '1999-08-30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(31, 31, 1, '70616279', 'MARIN', 'ILLESCA', 'EDGAR', 1, '2000-08-24', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(32, 32, 1, '72884168', 'ANDIA', 'CANTORIN', 'FORTUNATO', 1, '1991-10-04', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(33, 33, 1, '73098918', 'DURAN', 'ESQUIVEL', 'FRANK', 1, '2001-04-23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(34, 34, 1, '70616280', 'MARIN', 'ILLESCA', 'HARIANNE', 0, '1999-05-14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(35, 35, 1, '74455910', 'MAYTA', 'ORTEGA', 'JHORDAN', 1, '1999-09-03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(36, 36, 1, '78847461', 'MENA', 'MONTAÑEZ', 'LUIS MANUEL', 1, '1999-10-13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(37, 37, 1, '73769458', 'BENITES', 'PEIXOTO', 'SERGIO RODRIGUEZ', 1, '1995-04-20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(38, 38, 1, '74705575', 'VILCA', 'QUISPE', 'VICTOR', 1, '2002-03-22', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(39, 39, 1, '70112905', 'CAMARGO', 'POÈMAPE', 'ZOILA ENCARNACION', 0, '1991-11-25', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(40, 40, 1, '71869165', 'DELGADO', 'ALCANTARA', 'FABIOLA YAMILE', 2, '2000-04-15', 'fabioladelgado1315@gmail.com', '904457708', 'FABIOLA_DELGADO_40.jpg', 1, 7, 25, NULL, 1),
(41, 41, 1, '75926435', 'PEREZ', 'CHICHIPE', 'HERNAN', 1, '1999-06-20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(42, 42, 1, '71723837', 'CARRASCO', 'CHAVEZ', 'JOSEPH', 1, '2003-09-17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(43, 43, 1, '72353181', 'FERNANDEZ', 'VILLEGAS', 'JORGE DIEGO', 1, '1998-04-27', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(44, 44, 1, '75379416', 'HUAMANI', 'MOZOMBITE', 'LILIANA ISABEL', 0, '2000-02-16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(45, 45, 1, '73238796', 'BUTILER', 'LEYVA', 'NAYDELIN LORENA', 0, '2002-12-30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(46, 46, 1, '46676997', 'RAMIREZ', 'TORRES', 'GABRIEL', 1, '2000-01-01', NULL, NULL, NULL, 1, 7, 16, NULL, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `plan_chips`
--

CREATE TABLE `plan_chips` (
  `ID_PLAN` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `plan_chips`
--

INSERT INTO `plan_chips` (`ID_PLAN`, `DESCRIP`) VALUES
(1, 'Empresa Corp 2.0 42.9'),
(2, 'Empresa Corp 2.0 69.9'),
(3, 'Empresa Corp 2.0 79.9'),
(4, 'Empresa Corp 2.0 159.9');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `procesador`
--

CREATE TABLE `procesador` (
  `ID_PROCESADOR` int(11) NOT NULL,
  `DESCRIP` varchar(255) NOT NULL,
  `NUCLEOS` varchar(100) DEFAULT NULL,
  `HILOS` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `procesador`
--

INSERT INTO `procesador` (`ID_PROCESADOR`, `DESCRIP`, `NUCLEOS`, `HILOS`) VALUES
(1, 'AMD Ryzen 5 8645HS', '6 Nucleos', '12 Hilos'),
(2, 'Amd Ryzen 5 5500U', '6 Nucleos', '12 Hilos'),
(3, 'AMD Ryzen 3 7330U', '4 Nucleos', '12 Hilos');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ram`
--

CREATE TABLE `ram` (
  `ID_RAM` int(11) NOT NULL,
  `DESCRIP` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ram`
--

INSERT INTO `ram` (`ID_RAM`, `DESCRIP`) VALUES
(1, '4 GB'),
(2, '8 GB'),
(3, '12 GB'),
(4, '16 GB'),
(5, '32 GB'),
(6, '64 GB'),
(7, '128 GB');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `red`
--

CREATE TABLE `red` (
  `ID_IP` int(11) NOT NULL,
  `IP` varchar(50) NOT NULL,
  `ID_EQUIPO` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rol_accs`
--

CREATE TABLE `rol_accs` (
  `ID_ROL` int(11) NOT NULL,
  `DESCRIP` varchar(50) NOT NULL,
  `ESTADO_ROL` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `rol_accs`
--

INSERT INTO `rol_accs` (`ID_ROL`, `DESCRIP`, `ESTADO_ROL`) VALUES
(1, 'ADMINISTRADOR', 1),
(2, 'SOPORTE', 1),
(3, 'USUARIO', 1),
(4, 'RRHH', 1),
(5, 'SUPERVISOR', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sap_articulo`
--

CREATE TABLE `sap_articulo` (
  `ID_SAP_ARTICULO` int(11) NOT NULL,
  `ID_TICKET` int(11) NOT NULL,
  `ID_GRP_ART` int(11) NOT NULL,
  `ID_LISTA` enum('NINGUNO','SERIE','LOTE') NOT NULL,
  `ARTICULO_SAP` varchar(255) NOT NULL,
  `ID_FAMSAP` int(11) NOT NULL,
  `ID_SBFAMSAP` int(11) NOT NULL,
  `ID_MARCASAP` int(11) DEFAULT NULL,
  `MARCA_DESCRIP` varchar(255) DEFAULT NULL,
  `ID_MODELOSAP` int(11) DEFAULT NULL,
  `MODELO_DESCRIP` varchar(255) DEFAULT NULL,
  `ID_UNIDAD` int(11) NOT NULL,
  `CODIGO_SAP` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sap_servicio`
--

CREATE TABLE `sap_servicio` (
  `ID_SAP_SERVICIO` int(11) NOT NULL,
  `ID_TICKET` int(11) NOT NULL,
  `ID_GRP_ART` int(11) NOT NULL,
  `SERVICIO_SAP` varchar(255) NOT NULL,
  `ID_UNIDAD` int(11) NOT NULL,
  `CODIGO_SAP` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sap_servicio`
--

INSERT INTO `sap_servicio` (`ID_SAP_SERVICIO`, `ID_TICKET`, `ID_GRP_ART`, `SERVICIO_SAP`, `ID_UNIDAD`, `CODIGO_SAP`) VALUES
(1, 3, 2, ' prueba ', 24, 'pas6d54a3f5');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sap_socio_negocio`
--

CREATE TABLE `sap_socio_negocio` (
  `ID_SAP_SOCIO` int(11) NOT NULL,
  `ID_TICKET` int(11) NOT NULL,
  `ID_TSOCIO` int(11) NOT NULL,
  `RAZON_SOCIAL` varchar(255) NOT NULL,
  `RUC` varchar(255) DEFAULT NULL,
  `DIRECCION` varchar(255) DEFAULT NULL,
  `CODIGO_SAP` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `seguros_aportaciones`
--

CREATE TABLE `seguros_aportaciones` (
  `ID_SEGAPORT` int(11) NOT NULL,
  `ID_PERSONAL` int(11) NOT NULL,
  `ID_AFP` int(11) NOT NULL,
  `COD_AFP` varchar(20) NOT NULL,
  `COMISION_AFP` tinyint(1) DEFAULT 0,
  `APORTACION` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subcategoria_ticket`
--

CREATE TABLE `subcategoria_ticket` (
  `ID_SUBCATEGORIA` int(11) NOT NULL,
  `ID_CATEGORIA` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `subcategoria_ticket`
--

INSERT INTO `subcategoria_ticket` (`ID_SUBCATEGORIA`, `ID_CATEGORIA`, `DESCRIP`) VALUES
(1, 1, 'CORREO'),
(2, 2, 'INSTALACION SAP'),
(3, 3, 'LAPTOP'),
(4, 4, 'CREAR SOCIO DE NEGOCIO'),
(5, 4, 'CREAR ARTICULO'),
(6, 4, 'CREAR SERVICIO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subfamilia_sap`
--

CREATE TABLE `subfamilia_sap` (
  `ID_SBFAMSAP` int(11) NOT NULL,
  `DESCRIP` varchar(255) NOT NULL,
  `ID_FAMSAP` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `subfamilia_sap`
--

INSERT INTO `subfamilia_sap` (`ID_SBFAMSAP`, `DESCRIP`, `ID_FAMSAP`) VALUES
(1, 'CARGADORES DE BATERÍAS - 1000101', 1),
(2, 'ESTACIONARIA - 1000201', 2),
(3, 'TRACCION - FUERZA - 1000202', 2),
(4, 'ESTACIONARIA - 1000301', 3),
(5, 'REPUESTOS - 1000302', 3),
(6, 'CONECTOR - 1000303', 3),
(7, 'ACCESORIOS - 1000304', 3),
(8, 'RACK - 1000305', 3),
(9, 'EQUIPOS DE CONTROL - 1000306', 3),
(10, 'GABINETE - 1000307', 3),
(11, 'TRACCION - FUERZA - 1000401', 4),
(12, 'BATERIAS DE ARRANQUE - 1000402', 4),
(13, 'TABLEROS ELECTRICOS - 1000501', 5),
(14, 'SOLAR - 1000502', 5),
(15, 'GABINETE - 1000503', 5),
(16, 'REPUESTOS - 1000601', 6),
(17, 'CONECTOR - 1000602', 6),
(18, 'TRACCION - FUERZA - 1000603', 6),
(19, 'KIT DE LLENADO - 1000604', 6),
(20, 'ACCESORIOS - 1000605', 6),
(21, 'MODULOS RECTIFICADORES - 1000701', 7),
(22, 'RACK - 1000801', 8),
(23, 'GABINETE - 1000802', 8),
(24, 'CONTROLADORES - 1000901', 9),
(25, 'PANELES SOLARES - 1000902', 9),
(26, 'LUMINARIAS - 1000903', 9),
(27, 'ACCESORIOS - 1000904', 9),
(28, 'BESS - 1001001', 10),
(29, 'SERVICIO DE CARGA - 1010101', 11),
(30, 'SERVICIO DE DESCARGA - 1010102', 11),
(31, 'SERVICIOS DE MANTENIMIENTO - 1010201', 12),
(32, 'SERVICIO CORRECTIVO - 1010202', 12),
(33, 'SERVICIO DE DIAGNOSTICO - 1010203', 12),
(34, 'SERVICIO PREVENTIVO - 1010204', 12),
(35, 'SERVICIOS DE ACABADO / ACONDICIONAMIENTO - 1010205', 12),
(36, 'SERVICIO DE CAMPO - 1010206', 12),
(37, 'REPUESTOS - 1020101', 13),
(38, 'EQUIPO FIJO - LABORATORIO - 1020102', 13),
(39, 'EQUIPO PORTATIL - 1020103', 13),
(40, 'INSTRUMENTO - 1020104', 13),
(41, 'ACCESORIO - 1020105', 13),
(42, 'EQUIPO EN LINEA - 1020106', 13),
(43, 'REACTIVOS - 1020107', 13),
(44, 'PATRONES - 1020108', 13),
(45, 'ESTANDARES - 1020109', 13),
(46, 'COMPRESORES - 1020201', 14),
(47, 'BOMBAS - 1020202', 14),
(48, 'KIT DE REPUESTOS - 1020203', 14),
(49, 'TORRE SECADORA - 1020204', 14),
(50, 'TORRE DEODORIZADOR - 1020205', 14),
(51, 'ELECTRONICA - 1020206', 14),
(52, 'INSTRUMENTACION - 1020207', 14),
(53, 'FILTROS - 1020208', 14),
(54, 'TORRE SECADORA - 1020301', 15),
(55, 'FILTROS - 1020302', 15),
(56, 'TORRE DEODORIZADOR - 1020303', 15),
(57, 'REFRIGERACIÓN - 1020304', 15),
(58, 'BOMBAS - 1020305', 15),
(59, 'COMPRESORES - 1020306', 15),
(60, 'FILTRO ESTERIL PSF - 1020401', 16),
(61, 'PRE-FILTRO PVF - 1020402', 16),
(62, 'REPUESTOS - 1020403', 16),
(63, 'FILTRO COALESCENTE PSMF Y PAK - 1020404', 16),
(64, 'FILTRO DE VENTEO BA - 1020405', 16),
(65, 'GAZIJECTOR - 1020406', 16),
(66, 'MODULO - 1020501', 17),
(67, 'SOFTWARE - 1020502', 17),
(68, 'ACCESORIOS - 1020503', 17),
(69, 'BOMBAS - 1020601', 18),
(70, 'COMPRESORES - 1020602', 18),
(71, 'EVAPORADOR - 1020603', 18),
(72, 'REPUESTOS - 1020701', 19),
(73, 'EQUIPO PORTATIL - 1020702', 19),
(74, 'INSTRUMENTO - 1020703', 19),
(75, 'REACTIVOS - 1020704', 19),
(76, 'ACCESORIO - 1020705', 19),
(77, 'SOLUCIONES - 1020706', 19),
(78, 'CERTIFICADOS - 1020707', 19),
(79, 'SOFTWARE - 1020708', 19),
(80, 'REACTIVOS - 1020801', 20),
(81, 'REPUESTOS - 1020802', 20),
(82, 'ACCESORIO - 1020803', 20),
(83, 'INSTRUMENTO - 1020804', 20),
(84, 'EQUIPO PORTATIL - 1020805', 20),
(85, 'EQUIPO FIJO - LABORATORIO - 1020806', 20),
(86, 'ESTANDARES - 1020807', 20),
(87, 'MATERIALES DE LABORATORIO - 1020808', 20),
(88, 'ESTANDAR - 1020901', 21),
(89, 'ACCESORIO - 1020902', 21),
(90, 'REPUESTO - 1020903', 21),
(91, 'EQUIPO - 1020904', 21),
(92, 'SERVICIO DE DIAGNOSTICO - 1030101', 22),
(93, 'SERVICIO PREVENTIVO - 1030102', 22),
(94, 'SERVICIO CORRECTIVO - 1030103', 22),
(95, 'SERVICIO PREVENTIVO INTEGRAL - 1030104', 22),
(96, 'SERVICIOS DE CALIBRACION - 1030105', 22),
(97, 'SERVICIO CORRECTIVO - 1030201', 23),
(98, 'SERVICIO PREVENTIVO - 1030202', 23),
(99, 'SERVICIOS DE CALIBRACION - 1030203', 23),
(100, 'SERVICIO DE DIAGNOSTICO - 1030204', 23),
(101, 'SERVICIO PREVENTIVO INTEGRAL - 1030205', 23),
(102, 'SERVICIO DE DIAGNOSTICO - 1030301', 24),
(103, 'SERVICIO DE PUESTA EN MARCHA - 1030302', 24),
(104, 'SERVICIOS DE CALIBRACION - 1030303', 24),
(105, 'SERVICIO CORRECTIVO - 1030304', 24),
(106, 'SERVICIO PREVENTIVO - 1030305', 24),
(107, 'SERVICIO PREVENTIVO INTEGRAL - 1030306', 24),
(108, 'SERVICIO DE VERIFICACION - 1030307', 24),
(109, 'SERVICIO DE CAPACITACION - 1030308', 24),
(110, 'SERVICIO PREVENTIVO - 1030401', 25),
(111, 'SERVICIO DE DIAGNOSTICO - 1030402', 25),
(112, 'SERVICIO PREVENTIVO INTEGRAL - 1030403', 25),
(113, 'SERVICIOS DE CALIBRACION - 1030404', 25),
(114, 'SERVICIO CORRECTIVO - 1030405', 25),
(115, 'MOLINOS - 1040101', 26),
(116, 'CHANCADORAS - 1040201', 27),
(117, 'REPUESTOS - 1040301', 28),
(118, 'QH - 1050101', 29),
(119, 'CYMI - 1050201', 30),
(120, 'OLC - 1050301', 31),
(121, 'GRUPO QE - 1050401', 32),
(122, 'COMPRAS ÚNICAS - 1060101', 33),
(123, 'MERCADERIA VARIA - 1070101', 34);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ticket`
--

CREATE TABLE `ticket` (
  `ID_TICKET` int(11) NOT NULL,
  `ESTADO` enum('ABIERTO','ASIGNADO','RESUELTO','CERRADO') NOT NULL,
  `ID_PERSONAL` int(11) NOT NULL,
  `PRIORIDAD` enum('BAJA','MEDIA','ALTA','CRITICA','URGENTE') DEFAULT NULL,
  `ID_CATEGORIA` int(11) NOT NULL,
  `ID_SUBCATEGORIA` int(11) NOT NULL,
  `ASUNTO` varchar(255) NOT NULL,
  `DESCRIP` varchar(255) DEFAULT NULL,
  `ID_TI` int(11) DEFAULT NULL,
  `FECH_CREACION` datetime DEFAULT NULL,
  `FECH_CIERRE` datetime DEFAULT NULL,
  `MENSAJE_TI` varchar(250) DEFAULT NULL,
  `VALORACION` int(11) DEFAULT NULL,
  `FOTO` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ticket`
--

INSERT INTO `ticket` (`ID_TICKET`, `ESTADO`, `ID_PERSONAL`, `PRIORIDAD`, `ID_CATEGORIA`, `ID_SUBCATEGORIA`, `ASUNTO`, `DESCRIP`, `ID_TI`, `FECH_CREACION`, `FECH_CIERRE`, `MENSAJE_TI`, `VALORACION`, `FOTO`) VALUES
(1, 'CERRADO', 13, 'URGENTE', 1, 1, 'Problemas con Correo ', 'no abre correo', 13, '2026-03-11 09:59:22', '2026-03-11 10:01:35', 'se realizo el seguimiento remoto se soluciono ', 3, 'ticket_13_20260311095922.png'),
(2, 'CERRADO', 43, 'ALTA', 1, 1, 'problemas SAP', NULL, 43, '2026-03-11 10:43:10', '2026-03-11 10:45:04', 'correo arreglado ', 2, NULL),
(3, 'CERRADO', 13, 'URGENTE', 4, 6, 'creacion de codigo', 'servicio de sap', 13, '2026-03-11 17:24:03', '2026-03-11 17:26:53', 'cerrado ticket', 3, NULL),
(4, 'CERRADO', 43, 'BAJA', 1, 1, 'FALLA ERP', 'el erp no deja entrar al modulo de perfil ', 43, '2026-03-12 16:59:22', '2026-03-13 14:38:21', NULL, 2, NULL),
(5, 'CERRADO', 43, 'MEDIA', 1, 1, 'faLLA SAP', 'no puedo abrir sap', 13, '2026-03-13 14:38:06', '2026-03-13 16:07:31', 'problema resuelto\n', 3, 'ticket_43_20260313143806.webp'),
(6, 'CERRADO', 13, 'MEDIA', 1, 1, 'Correo Outlook', 'no abre mi correo nueva incidencia', 13, '2026-03-13 14:44:59', '2026-03-13 14:45:31', 'se reinicio el servidor', 3, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_contrato`
--

CREATE TABLE `tipo_contrato` (
  `ID_TIPOCONTR` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_contrato`
--

INSERT INTO `tipo_contrato` (`ID_TIPOCONTR`, `DESCRIP`) VALUES
(1, 'PLAZO FIJO'),
(2, 'INDETERMINADO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_cuenta`
--

CREATE TABLE `tipo_cuenta` (
  `ID_TIPO_CUENTA` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_cuenta`
--

INSERT INTO `tipo_cuenta` (`ID_TIPO_CUENTA`, `DESCRIP`) VALUES
(1, 'PAGO HABERES'),
(2, 'CTS');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_disco`
--

CREATE TABLE `tipo_disco` (
  `ID_TDISCO` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_disco`
--

INSERT INTO `tipo_disco` (`ID_TDISCO`, `DESCRIP`) VALUES
(1, 'HDD'),
(2, 'SSD'),
(3, 'SATA M2'),
(4, 'NVMe M2');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_documento`
--

CREATE TABLE `tipo_documento` (
  `ID_TDOCUMENT` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_documento`
--

INSERT INTO `tipo_documento` (`ID_TDOCUMENT`, `DESCRIP`) VALUES
(1, 'ADENDA'),
(2, 'CONTRATO INICIAL'),
(3, 'RENOVACION'),
(4, 'MEMO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_equipo`
--

CREATE TABLE `tipo_equipo` (
  `ID_TEQUIPO` int(11) NOT NULL,
  `DESCRIP` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_equipo`
--

INSERT INTO `tipo_equipo` (`ID_TEQUIPO`, `DESCRIP`) VALUES
(1, 'PC'),
(2, 'LAPTOP'),
(3, 'SERVIDOR'),
(4, 'MOVIL'),
(5, 'IMPRESORA');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_familiar`
--

CREATE TABLE `tipo_familiar` (
  `ID_TIPFAM` int(11) NOT NULL,
  `DESCRIP` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_familiar`
--

INSERT INTO `tipo_familiar` (`ID_TIPFAM`, `DESCRIP`) VALUES
(1, 'PADRE'),
(2, 'MADRE'),
(3, 'CONYUGE'),
(4, 'HIJO/A'),
(5, 'HERMANO/A');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_ram`
--

CREATE TABLE `tipo_ram` (
  `ID_TIPO_RAM` int(11) NOT NULL,
  `DESCRIP` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_ram`
--

INSERT INTO `tipo_ram` (`ID_TIPO_RAM`, `DESCRIP`) VALUES
(1, 'DDR3'),
(2, 'DDR4'),
(3, 'DDR5');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_socio_negocio`
--

CREATE TABLE `tipo_socio_negocio` (
  `ID_TSOCIO` int(11) NOT NULL,
  `DESCRIP` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_socio_negocio`
--

INSERT INTO `tipo_socio_negocio` (`ID_TSOCIO`, `DESCRIP`) VALUES
(1, 'CLIENTE NACIONAL'),
(2, 'CLIENTE EXTRANJERO'),
(3, 'PROVEEDOR NACIONAL'),
(4, 'PROVEEDOR EXTRANJERO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_unidad`
--

CREATE TABLE `tipo_unidad` (
  `ID_UNIDAD` int(11) NOT NULL,
  `DESCRIP` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_unidad`
--

INSERT INTO `tipo_unidad` (`ID_UNIDAD`, `DESCRIP`) VALUES
(1, 'BOLSA'),
(2, 'BOTELLAS'),
(3, 'CAJA'),
(4, 'CHISGUETE'),
(5, 'CIENTO'),
(6, 'CILINDRO'),
(7, 'JUEGO'),
(8, 'GALONES'),
(9, 'FRASCO'),
(10, 'KILOS'),
(11, 'KIT'),
(12, 'LITRO'),
(13, 'MILLAR'),
(14, 'METRO'),
(15, 'PAR'),
(16, 'PAQUETE'),
(17, 'PIEZA'),
(18, 'ROLLO'),
(19, 'SACOS'),
(20, 'SET'),
(21, 'TUBO'),
(22, 'TONELADAS'),
(23, 'UNIDAD'),
(24, 'UNIDAD (SERVICIO)'),
(25, 'METRO CUBICO');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `acceso`
--
ALTER TABLE `acceso`
  ADD PRIMARY KEY (`ID_ACCS`),
  ADD UNIQUE KEY `USUARIO` (`USUARIO`),
  ADD KEY `FK_ACCESO_ESTADO_ACCS` (`ID_ESTADO`),
  ADD KEY `FK_ACCESO_ROL` (`ID_ROL`);

--
-- Indices de la tabla `afp`
--
ALTER TABLE `afp`
  ADD PRIMARY KEY (`ID_AFP`);

--
-- Indices de la tabla `almacenamiento`
--
ALTER TABLE `almacenamiento`
  ADD PRIMARY KEY (`ID_ALMC`),
  ADD KEY `FK_ALMACENAMIENTO_EQUIPO` (`ID_EQUIPO`),
  ADD KEY `FK_ALMACENAMIENTO_DISCO` (`ID_DISCO`);

--
-- Indices de la tabla `anexos`
--
ALTER TABLE `anexos`
  ADD PRIMARY KEY (`ID_DOCUMENT`),
  ADD KEY `FK_ANEXOS_CONTRATO` (`ID_CONTR`),
  ADD KEY `FK_ANEXOS_TIPO_DOCUMENTO` (`ID_TDOCUMENT`),
  ADD KEY `FK_ANEXOS_MOTIVO` (`ID_TMOTIVO`);

--
-- Indices de la tabla `area`
--
ALTER TABLE `area`
  ADD PRIMARY KEY (`ID_AREA`),
  ADD UNIQUE KEY `DESCRIP` (`DESCRIP`);

--
-- Indices de la tabla `asignacion_accs`
--
ALTER TABLE `asignacion_accs`
  ADD KEY `FK_ASIGNACION_ACCS_ROL_ACCS` (`ID_ROL`),
  ADD KEY `FK_ASIGNACION_ACCS_PERMISO_ACCS` (`ID_PERM`);

--
-- Indices de la tabla `asignacion_chip`
--
ALTER TABLE `asignacion_chip`
  ADD PRIMARY KEY (`ID_CHIP_ASIG`),
  ADD KEY `FK_ASIGNACION_CHIP_PERSONAL` (`ID_PERSONAL`),
  ADD KEY `FK_ASIGNACION_CHIP_CHIPS` (`ID_CHIPS`);

--
-- Indices de la tabla `asignacion_emp`
--
ALTER TABLE `asignacion_emp`
  ADD KEY `FK_ASIGNACION_EMP_EMPRESA` (`ID_EMP`),
  ADD KEY `FK_ASIGNACION_EMP_ACCESO` (`ID_ACCS`);

--
-- Indices de la tabla `asignacion_equipo`
--
ALTER TABLE `asignacion_equipo`
  ADD PRIMARY KEY (`ID_ASIG`),
  ADD KEY `FK_ASIGNACION_EQUIPO_PERSONAL` (`ID_PERSONAL`),
  ADD KEY `FK_ASIGNACION_EQUIPO_EQUIPO` (`ID_EQUIPO`);

--
-- Indices de la tabla `asignacion_licencia`
--
ALTER TABLE `asignacion_licencia`
  ADD PRIMARY KEY (`ID_ASIGLICENC`),
  ADD KEY `FK_ASIGNACION_LICENCIA_EQUIPO` (`ID_EQUIPO`),
  ADD KEY `FK_ASIGNACION_LICENCIA_LICENCIA` (`ID_LICENCIA`);

--
-- Indices de la tabla `banco`
--
ALTER TABLE `banco`
  ADD PRIMARY KEY (`ID_BANCO`);

--
-- Indices de la tabla `capacidad_disco`
--
ALTER TABLE `capacidad_disco`
  ADD PRIMARY KEY (`ID_CAPDISCO`);

--
-- Indices de la tabla `cargo`
--
ALTER TABLE `cargo`
  ADD PRIMARY KEY (`ID_CARGO`),
  ADD UNIQUE KEY `DESCRIP` (`DESCRIP`),
  ADD KEY `FK_CARGO_EMPRESA` (`ID_EMP`),
  ADD KEY `FK_CARGO_DEPARTAMENTO` (`ID_DEPART`);

--
-- Indices de la tabla `categoria_ticket`
--
ALTER TABLE `categoria_ticket`
  ADD PRIMARY KEY (`ID_CATEGORIA`);

--
-- Indices de la tabla `catg_asistencia`
--
ALTER TABLE `catg_asistencia`
  ADD PRIMARY KEY (`ID_CATGA`);

--
-- Indices de la tabla `chips`
--
ALTER TABLE `chips`
  ADD PRIMARY KEY (`ID_CHIPS`),
  ADD UNIQUE KEY `NUMERO` (`NUMERO`),
  ADD KEY `FK_CHIPS_OPERADOR_CHIPS` (`ID_OPERADOR`),
  ADD KEY `FK_CHIPS_PLAN_CHIPS` (`ID_PLAN`),
  ADD KEY `FK_CHIPS_DESCUENTO_CHIPS` (`ID_DESCUENTO`);

--
-- Indices de la tabla `contacto`
--
ALTER TABLE `contacto`
  ADD PRIMARY KEY (`ID_CONTAC`),
  ADD KEY `FK_CONTACTO_PERSONAL` (`ID_PERSONAL`),
  ADD KEY `FK_CONTACTO_TIPO_FAMILIAR` (`ID_TIPFAM`);

--
-- Indices de la tabla `contrato`
--
ALTER TABLE `contrato`
  ADD PRIMARY KEY (`ID_CONTR`),
  ADD KEY `FK_CONTRATO_EMPRESA` (`ID_EMP`),
  ADD KEY `FK_CONTRATO_PERSONAL` (`ID_PERSONAL`),
  ADD KEY `FK_CONTRATO_ESTADO_CONTRATO` (`ID_ESTADO_CONTRATO`),
  ADD KEY `FK_CONTRATO_TIPO_CONTRATO` (`ID_TIPOCONTR`),
  ADD KEY `FK_CONTRATO_MODALIDAD` (`ID_MODALID`),
  ADD KEY `FK_CONTRATO_AREA` (`ID_AREA`),
  ADD KEY `FK_CONTRATO_CARGO` (`ID_CARGO`),
  ADD KEY `FK_CONTRATO_HORARIO` (`ID_HORARIO`);

--
-- Indices de la tabla `cuenta_banca`
--
ALTER TABLE `cuenta_banca`
  ADD PRIMARY KEY (`ID_CBANCA`),
  ADD KEY `FK_CUENTA_BANCA_PERSONAL` (`ID_PERSONAL`),
  ADD KEY `FK_CUENTA_BANCA_TIPO_CUENTA` (`ID_TIPO_CUENTA`),
  ADD KEY `FK_CUENTA_BANCA_BANCO` (`ID_BANCO`),
  ADD KEY `FK_CUENTA_BANCA_MONEDA` (`ID_MONEDA`);

--
-- Indices de la tabla `departamento`
--
ALTER TABLE `departamento`
  ADD PRIMARY KEY (`ID_DEPART`),
  ADD UNIQUE KEY `DESCRIP` (`DESCRIP`);

--
-- Indices de la tabla `depart_y_provinc`
--
ALTER TABLE `depart_y_provinc`
  ADD PRIMARY KEY (`ID_DEPARTAMENTO`);

--
-- Indices de la tabla `descuento_chips`
--
ALTER TABLE `descuento_chips`
  ADD PRIMARY KEY (`ID_DESCUENTO`);

--
-- Indices de la tabla `disco`
--
ALTER TABLE `disco`
  ADD PRIMARY KEY (`ID_DISCO`),
  ADD KEY `FK_DISCO_TDISCO` (`ID_TDISCO`),
  ADD KEY `FK_DISCO_CAPACIDAD_DISCO` (`ID_CAPDISCO`);

--
-- Indices de la tabla `distrito`
--
ALTER TABLE `distrito`
  ADD PRIMARY KEY (`ID_DISTR`);

--
-- Indices de la tabla `documento`
--
ALTER TABLE `documento`
  ADD PRIMARY KEY (`ID_DOC`);

--
-- Indices de la tabla `empresa`
--
ALTER TABLE `empresa`
  ADD PRIMARY KEY (`ID_EMP`);

--
-- Indices de la tabla `equipo`
--
ALTER TABLE `equipo`
  ADD PRIMARY KEY (`ID_EQUIPO`),
  ADD KEY `FK_EQUIPO_ESTADO_EQUIPO` (`ID_EST_EQUIPO`),
  ADD KEY `FK_EQUIPO_TIPO_EQUIPO` (`ID_TEQUIPO`),
  ADD KEY `FK_EQUIPO_ESPECIFICACIONES_TEC` (`ID_ESPEC`);

--
-- Indices de la tabla `especificaciones_tec`
--
ALTER TABLE `especificaciones_tec`
  ADD PRIMARY KEY (`ID_ESPEC`),
  ADD KEY `FK_ESPECIFICACIONES_TEC_GAMA` (`ID_GAMA`),
  ADD KEY `FK_ESPECIFICACIONES_TEC_MARCA` (`ID_MARCA`),
  ADD KEY `FK_ESPECIFICACIONES_TEC_MODELO` (`ID_MODELO`),
  ADD KEY `FK_ESPECIFICACIONES_TEC_PROCESADOR` (`ID_PROCESADOR`),
  ADD KEY `FK_ESPECIFICACIONES_TEC_TIPO_RAM` (`ID_TIPO_RAM`),
  ADD KEY `FK_ESPECIFICACIONES_TEC_RAM` (`ID_RAM`);

--
-- Indices de la tabla `estado_accs`
--
ALTER TABLE `estado_accs`
  ADD PRIMARY KEY (`ID_ESTADO`),
  ADD UNIQUE KEY `DESCRIP` (`DESCRIP`);

--
-- Indices de la tabla `estado_civil`
--
ALTER TABLE `estado_civil`
  ADD PRIMARY KEY (`ID_ESTCIVIL`);

--
-- Indices de la tabla `estado_contrato`
--
ALTER TABLE `estado_contrato`
  ADD PRIMARY KEY (`ID_ESTADO_CONTRATO`);

--
-- Indices de la tabla `estado_equipo`
--
ALTER TABLE `estado_equipo`
  ADD PRIMARY KEY (`ID_EST_EQUIPO`);

--
-- Indices de la tabla `familia_sap`
--
ALTER TABLE `familia_sap`
  ADD PRIMARY KEY (`ID_FAMSAP`);

--
-- Indices de la tabla `gama`
--
ALTER TABLE `gama`
  ADD PRIMARY KEY (`ID_GAMA`);

--
-- Indices de la tabla `grado_academico`
--
ALTER TABLE `grado_academico`
  ADD PRIMARY KEY (`ID_ACADM`);

--
-- Indices de la tabla `grupo_articulos`
--
ALTER TABLE `grupo_articulos`
  ADD PRIMARY KEY (`ID_GRP_ART`);

--
-- Indices de la tabla `horario`
--
ALTER TABLE `horario`
  ADD PRIMARY KEY (`ID_HORARIO`),
  ADD KEY `FK_HORARIO_EMPRESA` (`ID_EMP`);

--
-- Indices de la tabla `horario_detalle`
--
ALTER TABLE `horario_detalle`
  ADD PRIMARY KEY (`ID_HDET`),
  ADD KEY `FK_HORARIO_DETALLE_HORARIO` (`ID_HORARIO`);

--
-- Indices de la tabla `licencia`
--
ALTER TABLE `licencia`
  ADD PRIMARY KEY (`ID_LICENCIA`);

--
-- Indices de la tabla `mantenimiento`
--
ALTER TABLE `mantenimiento`
  ADD PRIMARY KEY (`ID_MANTENIMIENTO`),
  ADD KEY `FK_MANTENIMIENTO_PERSONAL` (`ID_TECNICO`),
  ADD KEY `FK_MANTENIMIENTO_EQUIPO` (`ID_EQUIPO`);

--
-- Indices de la tabla `marca`
--
ALTER TABLE `marca`
  ADD PRIMARY KEY (`ID_MARCA`),
  ADD KEY `FK_MARCA_TIPO_EQUIPO` (`ID_TEQUIPO`);

--
-- Indices de la tabla `marca_sap`
--
ALTER TABLE `marca_sap`
  ADD PRIMARY KEY (`ID_MARCASAP`);

--
-- Indices de la tabla `modalidad`
--
ALTER TABLE `modalidad`
  ADD PRIMARY KEY (`ID_MODALID`);

--
-- Indices de la tabla `modelo`
--
ALTER TABLE `modelo`
  ADD PRIMARY KEY (`ID_MODELO`),
  ADD KEY `FK_MODELO_MARCA` (`ID_MARCA`);

--
-- Indices de la tabla `modelo_sap`
--
ALTER TABLE `modelo_sap`
  ADD PRIMARY KEY (`ID_MODELOSAP`);

--
-- Indices de la tabla `moneda`
--
ALTER TABLE `moneda`
  ADD PRIMARY KEY (`ID_MONEDA`);

--
-- Indices de la tabla `motivo`
--
ALTER TABLE `motivo`
  ADD PRIMARY KEY (`ID_TMOTIVO`);

--
-- Indices de la tabla `operador_chips`
--
ALTER TABLE `operador_chips`
  ADD PRIMARY KEY (`ID_OPERADOR`);

--
-- Indices de la tabla `permiso_accs`
--
ALTER TABLE `permiso_accs`
  ADD PRIMARY KEY (`ID_PERM`),
  ADD UNIQUE KEY `DESCRIP` (`DESCRIP`);

--
-- Indices de la tabla `personal`
--
ALTER TABLE `personal`
  ADD PRIMARY KEY (`ID_PERSONAL`),
  ADD KEY `FK_PERSONAL_ACCESO` (`ID_ACCS`),
  ADD KEY `FK_PERSONAL_DOCUMENTO` (`ID_DOC`),
  ADD KEY `FK_PERSONAL_ESTADO_CIVIL` (`ID_ESTCIVIL`),
  ADD KEY `FK_PERSONAL_GRADO_ACADEMICO` (`ID_ACADM`),
  ADD KEY `FK_PERSONAL_DISTRITO` (`ID_DISTR`),
  ADD KEY `ID_DEPARTAMENTO` (`ID_DEPARTAMENTO`);

--
-- Indices de la tabla `plan_chips`
--
ALTER TABLE `plan_chips`
  ADD PRIMARY KEY (`ID_PLAN`);

--
-- Indices de la tabla `procesador`
--
ALTER TABLE `procesador`
  ADD PRIMARY KEY (`ID_PROCESADOR`);

--
-- Indices de la tabla `ram`
--
ALTER TABLE `ram`
  ADD PRIMARY KEY (`ID_RAM`);

--
-- Indices de la tabla `red`
--
ALTER TABLE `red`
  ADD PRIMARY KEY (`ID_IP`),
  ADD UNIQUE KEY `IP` (`IP`),
  ADD KEY `FK_EQUIPO_RED` (`ID_EQUIPO`);

--
-- Indices de la tabla `rol_accs`
--
ALTER TABLE `rol_accs`
  ADD PRIMARY KEY (`ID_ROL`),
  ADD UNIQUE KEY `DESCRIP` (`DESCRIP`);

--
-- Indices de la tabla `sap_articulo`
--
ALTER TABLE `sap_articulo`
  ADD PRIMARY KEY (`ID_SAP_ARTICULO`),
  ADD KEY `FK_SAP_ARTICULO_TICKET` (`ID_TICKET`),
  ADD KEY `FK_SAP_ARTICULO_GRUPO_ARTICULOS` (`ID_GRP_ART`),
  ADD KEY `FK_SAP_ARTICULO_FAMILIA_SAP` (`ID_FAMSAP`),
  ADD KEY `FK_SAP_ARTICULO_SUBFAMILIA_SAP` (`ID_SBFAMSAP`),
  ADD KEY `FK_SAP_ARTICULO_MARCA_SAP` (`ID_MARCASAP`),
  ADD KEY `FK_SAP_ARTICULO_MODELO_SAP` (`ID_MODELOSAP`),
  ADD KEY `FK_SAP_ARTICULO_TIPO_UNIDAD` (`ID_UNIDAD`);

--
-- Indices de la tabla `sap_servicio`
--
ALTER TABLE `sap_servicio`
  ADD PRIMARY KEY (`ID_SAP_SERVICIO`),
  ADD KEY `FK_SAP_SERVICIO_TICKET` (`ID_TICKET`),
  ADD KEY `FK_SAP_SERVICIO_GRUPO_ARTICULOS` (`ID_GRP_ART`),
  ADD KEY `FK_SAP_SERVICIO_TIPO_UNIDAD` (`ID_UNIDAD`);

--
-- Indices de la tabla `sap_socio_negocio`
--
ALTER TABLE `sap_socio_negocio`
  ADD PRIMARY KEY (`ID_SAP_SOCIO`),
  ADD KEY `FK_SAP_SOCIO_NEGOCIO_TICKET` (`ID_TICKET`),
  ADD KEY `FK_SAP_SOCIO_NEGOCIO_TIPO_SOCIO_NEGOCIO` (`ID_TSOCIO`);

--
-- Indices de la tabla `seguros_aportaciones`
--
ALTER TABLE `seguros_aportaciones`
  ADD PRIMARY KEY (`ID_SEGAPORT`),
  ADD KEY `FK_SEGUROS_APORTACIONES_PERSONAL` (`ID_PERSONAL`),
  ADD KEY `FK_SEGUROS_APORTACIONES_AFP` (`ID_AFP`);

--
-- Indices de la tabla `subcategoria_ticket`
--
ALTER TABLE `subcategoria_ticket`
  ADD PRIMARY KEY (`ID_SUBCATEGORIA`),
  ADD KEY `FK_SUBCATEGORIA_TICKET_CATEGORIA_TICKET` (`ID_CATEGORIA`);

--
-- Indices de la tabla `subfamilia_sap`
--
ALTER TABLE `subfamilia_sap`
  ADD PRIMARY KEY (`ID_SBFAMSAP`),
  ADD KEY `FK_SUBFAMILIA_SAP_FAMILIA_SAP` (`ID_FAMSAP`);

--
-- Indices de la tabla `ticket`
--
ALTER TABLE `ticket`
  ADD PRIMARY KEY (`ID_TICKET`),
  ADD KEY `FK_TICKET_PERSONAL` (`ID_PERSONAL`),
  ADD KEY `FK_TICKET_CATEGORIA_TICKET` (`ID_CATEGORIA`),
  ADD KEY `FK_TICKET_SUBCATEGORIA_TICKET` (`ID_SUBCATEGORIA`);

--
-- Indices de la tabla `tipo_contrato`
--
ALTER TABLE `tipo_contrato`
  ADD PRIMARY KEY (`ID_TIPOCONTR`);

--
-- Indices de la tabla `tipo_cuenta`
--
ALTER TABLE `tipo_cuenta`
  ADD PRIMARY KEY (`ID_TIPO_CUENTA`);

--
-- Indices de la tabla `tipo_disco`
--
ALTER TABLE `tipo_disco`
  ADD PRIMARY KEY (`ID_TDISCO`);

--
-- Indices de la tabla `tipo_documento`
--
ALTER TABLE `tipo_documento`
  ADD PRIMARY KEY (`ID_TDOCUMENT`);

--
-- Indices de la tabla `tipo_equipo`
--
ALTER TABLE `tipo_equipo`
  ADD PRIMARY KEY (`ID_TEQUIPO`);

--
-- Indices de la tabla `tipo_familiar`
--
ALTER TABLE `tipo_familiar`
  ADD PRIMARY KEY (`ID_TIPFAM`);

--
-- Indices de la tabla `tipo_ram`
--
ALTER TABLE `tipo_ram`
  ADD PRIMARY KEY (`ID_TIPO_RAM`);

--
-- Indices de la tabla `tipo_socio_negocio`
--
ALTER TABLE `tipo_socio_negocio`
  ADD PRIMARY KEY (`ID_TSOCIO`);

--
-- Indices de la tabla `tipo_unidad`
--
ALTER TABLE `tipo_unidad`
  ADD PRIMARY KEY (`ID_UNIDAD`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `acceso`
--
ALTER TABLE `acceso`
  MODIFY `ID_ACCS` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT de la tabla `afp`
--
ALTER TABLE `afp`
  MODIFY `ID_AFP` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `almacenamiento`
--
ALTER TABLE `almacenamiento`
  MODIFY `ID_ALMC` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `anexos`
--
ALTER TABLE `anexos`
  MODIFY `ID_DOCUMENT` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `area`
--
ALTER TABLE `area`
  MODIFY `ID_AREA` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `asignacion_chip`
--
ALTER TABLE `asignacion_chip`
  MODIFY `ID_CHIP_ASIG` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `asignacion_equipo`
--
ALTER TABLE `asignacion_equipo`
  MODIFY `ID_ASIG` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `asignacion_licencia`
--
ALTER TABLE `asignacion_licencia`
  MODIFY `ID_ASIGLICENC` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `banco`
--
ALTER TABLE `banco`
  MODIFY `ID_BANCO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `capacidad_disco`
--
ALTER TABLE `capacidad_disco`
  MODIFY `ID_CAPDISCO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `cargo`
--
ALTER TABLE `cargo`
  MODIFY `ID_CARGO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT de la tabla `categoria_ticket`
--
ALTER TABLE `categoria_ticket`
  MODIFY `ID_CATEGORIA` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `catg_asistencia`
--
ALTER TABLE `catg_asistencia`
  MODIFY `ID_CATGA` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `chips`
--
ALTER TABLE `chips`
  MODIFY `ID_CHIPS` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT de la tabla `contacto`
--
ALTER TABLE `contacto`
  MODIFY `ID_CONTAC` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `contrato`
--
ALTER TABLE `contrato`
  MODIFY `ID_CONTR` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT de la tabla `cuenta_banca`
--
ALTER TABLE `cuenta_banca`
  MODIFY `ID_CBANCA` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `departamento`
--
ALTER TABLE `departamento`
  MODIFY `ID_DEPART` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `depart_y_provinc`
--
ALTER TABLE `depart_y_provinc`
  MODIFY `ID_DEPARTAMENTO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de la tabla `descuento_chips`
--
ALTER TABLE `descuento_chips`
  MODIFY `ID_DESCUENTO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `disco`
--
ALTER TABLE `disco`
  MODIFY `ID_DISCO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `distrito`
--
ALTER TABLE `distrito`
  MODIFY `ID_DISTR` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT de la tabla `documento`
--
ALTER TABLE `documento`
  MODIFY `ID_DOC` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `empresa`
--
ALTER TABLE `empresa`
  MODIFY `ID_EMP` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `equipo`
--
ALTER TABLE `equipo`
  MODIFY `ID_EQUIPO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `especificaciones_tec`
--
ALTER TABLE `especificaciones_tec`
  MODIFY `ID_ESPEC` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `estado_accs`
--
ALTER TABLE `estado_accs`
  MODIFY `ID_ESTADO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `estado_civil`
--
ALTER TABLE `estado_civil`
  MODIFY `ID_ESTCIVIL` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `estado_contrato`
--
ALTER TABLE `estado_contrato`
  MODIFY `ID_ESTADO_CONTRATO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `estado_equipo`
--
ALTER TABLE `estado_equipo`
  MODIFY `ID_EST_EQUIPO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `familia_sap`
--
ALTER TABLE `familia_sap`
  MODIFY `ID_FAMSAP` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT de la tabla `gama`
--
ALTER TABLE `gama`
  MODIFY `ID_GAMA` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `grado_academico`
--
ALTER TABLE `grado_academico`
  MODIFY `ID_ACADM` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `grupo_articulos`
--
ALTER TABLE `grupo_articulos`
  MODIFY `ID_GRP_ART` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `horario`
--
ALTER TABLE `horario`
  MODIFY `ID_HORARIO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `horario_detalle`
--
ALTER TABLE `horario_detalle`
  MODIFY `ID_HDET` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT de la tabla `licencia`
--
ALTER TABLE `licencia`
  MODIFY `ID_LICENCIA` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `mantenimiento`
--
ALTER TABLE `mantenimiento`
  MODIFY `ID_MANTENIMIENTO` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `marca`
--
ALTER TABLE `marca`
  MODIFY `ID_MARCA` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `marca_sap`
--
ALTER TABLE `marca_sap`
  MODIFY `ID_MARCASAP` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `modalidad`
--
ALTER TABLE `modalidad`
  MODIFY `ID_MODALID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `modelo`
--
ALTER TABLE `modelo`
  MODIFY `ID_MODELO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `modelo_sap`
--
ALTER TABLE `modelo_sap`
  MODIFY `ID_MODELOSAP` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `moneda`
--
ALTER TABLE `moneda`
  MODIFY `ID_MONEDA` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `motivo`
--
ALTER TABLE `motivo`
  MODIFY `ID_TMOTIVO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `operador_chips`
--
ALTER TABLE `operador_chips`
  MODIFY `ID_OPERADOR` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `permiso_accs`
--
ALTER TABLE `permiso_accs`
  MODIFY `ID_PERM` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `personal`
--
ALTER TABLE `personal`
  MODIFY `ID_PERSONAL` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT de la tabla `plan_chips`
--
ALTER TABLE `plan_chips`
  MODIFY `ID_PLAN` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `procesador`
--
ALTER TABLE `procesador`
  MODIFY `ID_PROCESADOR` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `ram`
--
ALTER TABLE `ram`
  MODIFY `ID_RAM` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `red`
--
ALTER TABLE `red`
  MODIFY `ID_IP` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `rol_accs`
--
ALTER TABLE `rol_accs`
  MODIFY `ID_ROL` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `sap_articulo`
--
ALTER TABLE `sap_articulo`
  MODIFY `ID_SAP_ARTICULO` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `sap_servicio`
--
ALTER TABLE `sap_servicio`
  MODIFY `ID_SAP_SERVICIO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `sap_socio_negocio`
--
ALTER TABLE `sap_socio_negocio`
  MODIFY `ID_SAP_SOCIO` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `seguros_aportaciones`
--
ALTER TABLE `seguros_aportaciones`
  MODIFY `ID_SEGAPORT` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `subcategoria_ticket`
--
ALTER TABLE `subcategoria_ticket`
  MODIFY `ID_SUBCATEGORIA` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `subfamilia_sap`
--
ALTER TABLE `subfamilia_sap`
  MODIFY `ID_SBFAMSAP` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=124;

--
-- AUTO_INCREMENT de la tabla `ticket`
--
ALTER TABLE `ticket`
  MODIFY `ID_TICKET` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `tipo_contrato`
--
ALTER TABLE `tipo_contrato`
  MODIFY `ID_TIPOCONTR` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tipo_cuenta`
--
ALTER TABLE `tipo_cuenta`
  MODIFY `ID_TIPO_CUENTA` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tipo_disco`
--
ALTER TABLE `tipo_disco`
  MODIFY `ID_TDISCO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `tipo_documento`
--
ALTER TABLE `tipo_documento`
  MODIFY `ID_TDOCUMENT` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `tipo_equipo`
--
ALTER TABLE `tipo_equipo`
  MODIFY `ID_TEQUIPO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `tipo_familiar`
--
ALTER TABLE `tipo_familiar`
  MODIFY `ID_TIPFAM` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `tipo_ram`
--
ALTER TABLE `tipo_ram`
  MODIFY `ID_TIPO_RAM` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `tipo_socio_negocio`
--
ALTER TABLE `tipo_socio_negocio`
  MODIFY `ID_TSOCIO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `tipo_unidad`
--
ALTER TABLE `tipo_unidad`
  MODIFY `ID_UNIDAD` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `acceso`
--
ALTER TABLE `acceso`
  ADD CONSTRAINT `FK_ACCESO_ESTADO_ACCS` FOREIGN KEY (`ID_ESTADO`) REFERENCES `estado_accs` (`ID_ESTADO`),
  ADD CONSTRAINT `FK_ACCESO_ROL` FOREIGN KEY (`ID_ROL`) REFERENCES `rol_accs` (`ID_ROL`);

--
-- Filtros para la tabla `almacenamiento`
--
ALTER TABLE `almacenamiento`
  ADD CONSTRAINT `FK_ALMACENAMIENTO_DISCO` FOREIGN KEY (`ID_DISCO`) REFERENCES `disco` (`ID_DISCO`),
  ADD CONSTRAINT `FK_ALMACENAMIENTO_EQUIPO` FOREIGN KEY (`ID_EQUIPO`) REFERENCES `equipo` (`ID_EQUIPO`);

--
-- Filtros para la tabla `anexos`
--
ALTER TABLE `anexos`
  ADD CONSTRAINT `FK_ANEXOS_CONTRATO` FOREIGN KEY (`ID_CONTR`) REFERENCES `contrato` (`ID_CONTR`),
  ADD CONSTRAINT `FK_ANEXOS_MOTIVO` FOREIGN KEY (`ID_TMOTIVO`) REFERENCES `motivo` (`ID_TMOTIVO`),
  ADD CONSTRAINT `FK_ANEXOS_TIPO_DOCUMENTO` FOREIGN KEY (`ID_TDOCUMENT`) REFERENCES `tipo_documento` (`ID_TDOCUMENT`);

--
-- Filtros para la tabla `asignacion_accs`
--
ALTER TABLE `asignacion_accs`
  ADD CONSTRAINT `FK_ASIGNACION_ACCS_PERMISO_ACCS` FOREIGN KEY (`ID_PERM`) REFERENCES `permiso_accs` (`ID_PERM`),
  ADD CONSTRAINT `FK_ASIGNACION_ACCS_ROL_ACCS` FOREIGN KEY (`ID_ROL`) REFERENCES `rol_accs` (`ID_ROL`);

--
-- Filtros para la tabla `asignacion_chip`
--
ALTER TABLE `asignacion_chip`
  ADD CONSTRAINT `FK_ASIGNACION_CHIP_CHIPS` FOREIGN KEY (`ID_CHIPS`) REFERENCES `chips` (`ID_CHIPS`),
  ADD CONSTRAINT `FK_ASIGNACION_CHIP_PERSONAL` FOREIGN KEY (`ID_PERSONAL`) REFERENCES `personal` (`ID_PERSONAL`);

--
-- Filtros para la tabla `asignacion_emp`
--
ALTER TABLE `asignacion_emp`
  ADD CONSTRAINT `FK_ASIGNACION_EMP_ACCESO` FOREIGN KEY (`ID_ACCS`) REFERENCES `acceso` (`ID_ACCS`),
  ADD CONSTRAINT `FK_ASIGNACION_EMP_EMPRESA` FOREIGN KEY (`ID_EMP`) REFERENCES `empresa` (`ID_EMP`);

--
-- Filtros para la tabla `asignacion_equipo`
--
ALTER TABLE `asignacion_equipo`
  ADD CONSTRAINT `FK_ASIGNACION_EQUIPO_EQUIPO` FOREIGN KEY (`ID_EQUIPO`) REFERENCES `equipo` (`ID_EQUIPO`),
  ADD CONSTRAINT `FK_ASIGNACION_EQUIPO_PERSONAL` FOREIGN KEY (`ID_PERSONAL`) REFERENCES `personal` (`ID_PERSONAL`);

--
-- Filtros para la tabla `asignacion_licencia`
--
ALTER TABLE `asignacion_licencia`
  ADD CONSTRAINT `FK_ASIGNACION_LICENCIA_EQUIPO` FOREIGN KEY (`ID_EQUIPO`) REFERENCES `equipo` (`ID_EQUIPO`),
  ADD CONSTRAINT `FK_ASIGNACION_LICENCIA_LICENCIA` FOREIGN KEY (`ID_LICENCIA`) REFERENCES `licencia` (`ID_LICENCIA`);

--
-- Filtros para la tabla `cargo`
--
ALTER TABLE `cargo`
  ADD CONSTRAINT `FK_CARGO_DEPARTAMENTO` FOREIGN KEY (`ID_DEPART`) REFERENCES `departamento` (`ID_DEPART`),
  ADD CONSTRAINT `FK_CARGO_EMPRESA` FOREIGN KEY (`ID_EMP`) REFERENCES `empresa` (`ID_EMP`);

--
-- Filtros para la tabla `chips`
--
ALTER TABLE `chips`
  ADD CONSTRAINT `FK_CHIPS_DESCUENTO_CHIPS` FOREIGN KEY (`ID_DESCUENTO`) REFERENCES `descuento_chips` (`ID_DESCUENTO`),
  ADD CONSTRAINT `FK_CHIPS_OPERADOR_CHIPS` FOREIGN KEY (`ID_OPERADOR`) REFERENCES `operador_chips` (`ID_OPERADOR`),
  ADD CONSTRAINT `FK_CHIPS_PLAN_CHIPS` FOREIGN KEY (`ID_PLAN`) REFERENCES `plan_chips` (`ID_PLAN`);

--
-- Filtros para la tabla `contacto`
--
ALTER TABLE `contacto`
  ADD CONSTRAINT `FK_CONTACTO_PERSONAL` FOREIGN KEY (`ID_PERSONAL`) REFERENCES `personal` (`ID_PERSONAL`),
  ADD CONSTRAINT `FK_CONTACTO_TIPO_FAMILIAR` FOREIGN KEY (`ID_TIPFAM`) REFERENCES `tipo_familiar` (`ID_TIPFAM`);

--
-- Filtros para la tabla `contrato`
--
ALTER TABLE `contrato`
  ADD CONSTRAINT `FK_CONTRATO_AREA` FOREIGN KEY (`ID_AREA`) REFERENCES `area` (`ID_AREA`),
  ADD CONSTRAINT `FK_CONTRATO_CARGO` FOREIGN KEY (`ID_CARGO`) REFERENCES `cargo` (`ID_CARGO`),
  ADD CONSTRAINT `FK_CONTRATO_EMPRESA` FOREIGN KEY (`ID_EMP`) REFERENCES `empresa` (`ID_EMP`),
  ADD CONSTRAINT `FK_CONTRATO_ESTADO_CONTRATO` FOREIGN KEY (`ID_ESTADO_CONTRATO`) REFERENCES `estado_contrato` (`ID_ESTADO_CONTRATO`),
  ADD CONSTRAINT `FK_CONTRATO_HORARIO` FOREIGN KEY (`ID_HORARIO`) REFERENCES `horario` (`ID_HORARIO`),
  ADD CONSTRAINT `FK_CONTRATO_MODALIDAD` FOREIGN KEY (`ID_MODALID`) REFERENCES `modalidad` (`ID_MODALID`),
  ADD CONSTRAINT `FK_CONTRATO_PERSONAL` FOREIGN KEY (`ID_PERSONAL`) REFERENCES `personal` (`ID_PERSONAL`),
  ADD CONSTRAINT `FK_CONTRATO_TIPO_CONTRATO` FOREIGN KEY (`ID_TIPOCONTR`) REFERENCES `tipo_contrato` (`ID_TIPOCONTR`);

--
-- Filtros para la tabla `cuenta_banca`
--
ALTER TABLE `cuenta_banca`
  ADD CONSTRAINT `FK_CUENTA_BANCA_BANCO` FOREIGN KEY (`ID_BANCO`) REFERENCES `banco` (`ID_BANCO`),
  ADD CONSTRAINT `FK_CUENTA_BANCA_MONEDA` FOREIGN KEY (`ID_MONEDA`) REFERENCES `moneda` (`ID_MONEDA`),
  ADD CONSTRAINT `FK_CUENTA_BANCA_PERSONAL` FOREIGN KEY (`ID_PERSONAL`) REFERENCES `personal` (`ID_PERSONAL`),
  ADD CONSTRAINT `FK_CUENTA_BANCA_TIPO_CUENTA` FOREIGN KEY (`ID_TIPO_CUENTA`) REFERENCES `tipo_cuenta` (`ID_TIPO_CUENTA`);

--
-- Filtros para la tabla `disco`
--
ALTER TABLE `disco`
  ADD CONSTRAINT `FK_DISCO_CAPACIDAD_DISCO` FOREIGN KEY (`ID_CAPDISCO`) REFERENCES `capacidad_disco` (`ID_CAPDISCO`),
  ADD CONSTRAINT `FK_DISCO_TDISCO` FOREIGN KEY (`ID_TDISCO`) REFERENCES `tipo_disco` (`ID_TDISCO`);

--
-- Filtros para la tabla `equipo`
--
ALTER TABLE `equipo`
  ADD CONSTRAINT `FK_EQUIPO_ESPECIFICACIONES_TEC` FOREIGN KEY (`ID_ESPEC`) REFERENCES `especificaciones_tec` (`ID_ESPEC`),
  ADD CONSTRAINT `FK_EQUIPO_ESTADO_EQUIPO` FOREIGN KEY (`ID_EST_EQUIPO`) REFERENCES `estado_equipo` (`ID_EST_EQUIPO`),
  ADD CONSTRAINT `FK_EQUIPO_TIPO_EQUIPO` FOREIGN KEY (`ID_TEQUIPO`) REFERENCES `tipo_equipo` (`ID_TEQUIPO`);

--
-- Filtros para la tabla `especificaciones_tec`
--
ALTER TABLE `especificaciones_tec`
  ADD CONSTRAINT `FK_ESPECIFICACIONES_TEC_GAMA` FOREIGN KEY (`ID_GAMA`) REFERENCES `gama` (`ID_GAMA`),
  ADD CONSTRAINT `FK_ESPECIFICACIONES_TEC_MARCA` FOREIGN KEY (`ID_MARCA`) REFERENCES `marca` (`ID_MARCA`),
  ADD CONSTRAINT `FK_ESPECIFICACIONES_TEC_MODELO` FOREIGN KEY (`ID_MODELO`) REFERENCES `modelo` (`ID_MODELO`),
  ADD CONSTRAINT `FK_ESPECIFICACIONES_TEC_PROCESADOR` FOREIGN KEY (`ID_PROCESADOR`) REFERENCES `procesador` (`ID_PROCESADOR`),
  ADD CONSTRAINT `FK_ESPECIFICACIONES_TEC_RAM` FOREIGN KEY (`ID_RAM`) REFERENCES `ram` (`ID_RAM`),
  ADD CONSTRAINT `FK_ESPECIFICACIONES_TEC_TIPO_RAM` FOREIGN KEY (`ID_TIPO_RAM`) REFERENCES `tipo_ram` (`ID_TIPO_RAM`);

--
-- Filtros para la tabla `horario`
--
ALTER TABLE `horario`
  ADD CONSTRAINT `FK_HORARIO_EMPRESA` FOREIGN KEY (`ID_EMP`) REFERENCES `empresa` (`ID_EMP`);

--
-- Filtros para la tabla `horario_detalle`
--
ALTER TABLE `horario_detalle`
  ADD CONSTRAINT `FK_HORARIO_DETALLE_HORARIO` FOREIGN KEY (`ID_HORARIO`) REFERENCES `horario` (`ID_HORARIO`);

--
-- Filtros para la tabla `mantenimiento`
--
ALTER TABLE `mantenimiento`
  ADD CONSTRAINT `FK_MANTENIMIENTO_EQUIPO` FOREIGN KEY (`ID_EQUIPO`) REFERENCES `equipo` (`ID_EQUIPO`),
  ADD CONSTRAINT `FK_MANTENIMIENTO_PERSONAL` FOREIGN KEY (`ID_TECNICO`) REFERENCES `personal` (`ID_PERSONAL`);

--
-- Filtros para la tabla `marca`
--
ALTER TABLE `marca`
  ADD CONSTRAINT `FK_MARCA_TIPO_EQUIPO` FOREIGN KEY (`ID_TEQUIPO`) REFERENCES `tipo_equipo` (`ID_TEQUIPO`);

--
-- Filtros para la tabla `modelo`
--
ALTER TABLE `modelo`
  ADD CONSTRAINT `FK_MODELO_MARCA` FOREIGN KEY (`ID_MARCA`) REFERENCES `marca` (`ID_MARCA`);

--
-- Filtros para la tabla `personal`
--
ALTER TABLE `personal`
  ADD CONSTRAINT `FK_PERSONAL_ACCESO` FOREIGN KEY (`ID_ACCS`) REFERENCES `acceso` (`ID_ACCS`),
  ADD CONSTRAINT `FK_PERSONAL_DISTRITO` FOREIGN KEY (`ID_DISTR`) REFERENCES `distrito` (`ID_DISTR`),
  ADD CONSTRAINT `FK_PERSONAL_DOCUMENTO` FOREIGN KEY (`ID_DOC`) REFERENCES `documento` (`ID_DOC`),
  ADD CONSTRAINT `FK_PERSONAL_ESTADO_CIVIL` FOREIGN KEY (`ID_ESTCIVIL`) REFERENCES `estado_civil` (`ID_ESTCIVIL`),
  ADD CONSTRAINT `FK_PERSONAL_GRADO_ACADEMICO` FOREIGN KEY (`ID_ACADM`) REFERENCES `grado_academico` (`ID_ACADM`),
  ADD CONSTRAINT `personal_ibfk_1` FOREIGN KEY (`ID_DEPARTAMENTO`) REFERENCES `depart_y_provinc` (`ID_DEPARTAMENTO`);

--
-- Filtros para la tabla `red`
--
ALTER TABLE `red`
  ADD CONSTRAINT `FK_EQUIPO_RED` FOREIGN KEY (`ID_EQUIPO`) REFERENCES `equipo` (`ID_EQUIPO`);

--
-- Filtros para la tabla `sap_articulo`
--
ALTER TABLE `sap_articulo`
  ADD CONSTRAINT `FK_SAP_ARTICULO_FAMILIA_SAP` FOREIGN KEY (`ID_FAMSAP`) REFERENCES `familia_sap` (`ID_FAMSAP`),
  ADD CONSTRAINT `FK_SAP_ARTICULO_GRUPO_ARTICULOS` FOREIGN KEY (`ID_GRP_ART`) REFERENCES `grupo_articulos` (`ID_GRP_ART`),
  ADD CONSTRAINT `FK_SAP_ARTICULO_MARCA_SAP` FOREIGN KEY (`ID_MARCASAP`) REFERENCES `marca_sap` (`ID_MARCASAP`),
  ADD CONSTRAINT `FK_SAP_ARTICULO_MODELO_SAP` FOREIGN KEY (`ID_MODELOSAP`) REFERENCES `modelo_sap` (`ID_MODELOSAP`),
  ADD CONSTRAINT `FK_SAP_ARTICULO_SUBFAMILIA_SAP` FOREIGN KEY (`ID_SBFAMSAP`) REFERENCES `subfamilia_sap` (`ID_SBFAMSAP`),
  ADD CONSTRAINT `FK_SAP_ARTICULO_TICKET` FOREIGN KEY (`ID_TICKET`) REFERENCES `ticket` (`ID_TICKET`),
  ADD CONSTRAINT `FK_SAP_ARTICULO_TIPO_UNIDAD` FOREIGN KEY (`ID_UNIDAD`) REFERENCES `tipo_unidad` (`ID_UNIDAD`);

--
-- Filtros para la tabla `sap_servicio`
--
ALTER TABLE `sap_servicio`
  ADD CONSTRAINT `FK_SAP_SERVICIO_GRUPO_ARTICULOS` FOREIGN KEY (`ID_GRP_ART`) REFERENCES `grupo_articulos` (`ID_GRP_ART`),
  ADD CONSTRAINT `FK_SAP_SERVICIO_TICKET` FOREIGN KEY (`ID_TICKET`) REFERENCES `ticket` (`ID_TICKET`),
  ADD CONSTRAINT `FK_SAP_SERVICIO_TIPO_UNIDAD` FOREIGN KEY (`ID_UNIDAD`) REFERENCES `tipo_unidad` (`ID_UNIDAD`);

--
-- Filtros para la tabla `sap_socio_negocio`
--
ALTER TABLE `sap_socio_negocio`
  ADD CONSTRAINT `FK_SAP_SOCIO_NEGOCIO_TICKET` FOREIGN KEY (`ID_TICKET`) REFERENCES `ticket` (`ID_TICKET`),
  ADD CONSTRAINT `FK_SAP_SOCIO_NEGOCIO_TIPO_SOCIO_NEGOCIO` FOREIGN KEY (`ID_TSOCIO`) REFERENCES `tipo_socio_negocio` (`ID_TSOCIO`);

--
-- Filtros para la tabla `seguros_aportaciones`
--
ALTER TABLE `seguros_aportaciones`
  ADD CONSTRAINT `FK_SEGUROS_APORTACIONES_AFP` FOREIGN KEY (`ID_AFP`) REFERENCES `afp` (`ID_AFP`),
  ADD CONSTRAINT `FK_SEGUROS_APORTACIONES_PERSONAL` FOREIGN KEY (`ID_PERSONAL`) REFERENCES `personal` (`ID_PERSONAL`);

--
-- Filtros para la tabla `subcategoria_ticket`
--
ALTER TABLE `subcategoria_ticket`
  ADD CONSTRAINT `FK_SUBCATEGORIA_TICKET_CATEGORIA_TICKET` FOREIGN KEY (`ID_CATEGORIA`) REFERENCES `categoria_ticket` (`ID_CATEGORIA`);

--
-- Filtros para la tabla `subfamilia_sap`
--
ALTER TABLE `subfamilia_sap`
  ADD CONSTRAINT `FK_SUBFAMILIA_SAP_FAMILIA_SAP` FOREIGN KEY (`ID_FAMSAP`) REFERENCES `familia_sap` (`ID_FAMSAP`);

--
-- Filtros para la tabla `ticket`
--
ALTER TABLE `ticket`
  ADD CONSTRAINT `FK_TICKET_CATEGORIA_TICKET` FOREIGN KEY (`ID_CATEGORIA`) REFERENCES `categoria_ticket` (`ID_CATEGORIA`),
  ADD CONSTRAINT `FK_TICKET_PERSONAL` FOREIGN KEY (`ID_PERSONAL`) REFERENCES `personal` (`ID_PERSONAL`),
  ADD CONSTRAINT `FK_TICKET_SUBCATEGORIA_TICKET` FOREIGN KEY (`ID_SUBCATEGORIA`) REFERENCES `subcategoria_ticket` (`ID_SUBCATEGORIA`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
