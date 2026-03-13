import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import IconoFa from './IconoFa'; 
import PermisoService from '../servicios/PermisoService';
import { faBars, faHouse, faFileLines, faBoxArchive, faUsers, faRightFromBracket, faChevronDown, faChevronRight, faPeopleGroup, faUserTie, faCalendarCheck, faClock, faLaptop, faPlus, faArrowsRotate, faTicket, faListCheck, faShieldHalved, faSimCard, faUserCircle, faCakeCandles } from '@fortawesome/free-solid-svg-icons';
import '../styles/Sidebar.css';

export default function Sidebar({ isOpen, onToggleMenu }) {
    const location = useLocation();
    const navigate = useNavigate();

    // Estado para saber si el submenú de RRHH está abierto
    const [rrhhAbierto, setRrhhAbierto] = useState(false);
    // Popup flotante para modo colapsado
    const [popupRRHH, setPopupRRHH] = useState(false);
    const rrhhBtnRef = useRef(null);
    const popupRef = useRef(null);

    // Estado para submenú de Equipos
    const [equiposAbierto, setEquiposAbierto] = useState(false);
    const [popupEquipos, setPopupEquipos] = useState(false);
    const equiposBtnRef = useRef(null);
    const popupEquiposRef = useRef(null);

    // Estado para submenú de Tickets
    const [ticketsAbierto, setTicketsAbierto] = useState(false);
    const [popupTickets, setPopupTickets] = useState(false);
    const ticketsBtnRef = useRef(null);
    const popupTicketsRef = useRef(null);

    // Cerrar sidebar en mobile al navegar
    const isMobile = () => window.innerWidth <= 768;
    function handleNavClick() {
        if (isMobile() && isOpen) onToggleMenu();
    }

    // Cerrar popup al hacer click fuera
    useEffect(function () {
        function handleClick(e) {
            if (popupRRHH && popupRef.current && !popupRef.current.contains(e.target) &&
                rrhhBtnRef.current && !rrhhBtnRef.current.contains(e.target)) {
                setPopupRRHH(false);
            }
            if (popupEquipos && popupEquiposRef.current && !popupEquiposRef.current.contains(e.target) &&
                equiposBtnRef.current && !equiposBtnRef.current.contains(e.target)) {
                setPopupEquipos(false);
            }
            if (popupTickets && popupTicketsRef.current && !popupTicketsRef.current.contains(e.target) &&
                ticketsBtnRef.current && !ticketsBtnRef.current.contains(e.target)) {
                setPopupTickets(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return function () { document.removeEventListener('mousedown', handleClick); };
    }, [popupRRHH, popupEquipos, popupTickets]);

    const cerrarSesion = () => {
        localStorage.removeItem('session');
        navigate('/');
    };

    // Items simples (sin hijos) — cada uno con su clave de permiso
    const menuSimple = [
        { nombre: 'Inicio',     ruta: '/dashboard',              icono: faHouse,      modulo: 'INICIO' },
        { nombre: 'Inventario', ruta: '/dashboard/inventario',   icono: faBoxArchive, modulo: 'INVENTARIO' },
        { nombre: 'Clientes',   ruta: '/dashboard/clientes',     icono: faUsers,      modulo: 'CLIENTES' },
    ];

    // ── Permisos de módulos (POO) ──
    // Lógica SEPARADA del acceso a empresas (AsignacionEmp).
    const sessionData = JSON.parse(localStorage.getItem('session'));
    const permisos = new PermisoService(sessionData);
    const esRolTI = permisos.esRolTI;

    // ── Cargo del usuario (para módulos específicos por cargo) ──
    var cargoUsuario = (sessionData && sessionData.usuario && sessionData.usuario.cargo) ? sessionData.usuario.cargo.toUpperCase() : '';
    var esMarketing = cargoUsuario.indexOf('MARKETING') >= 0;

    // Wrapper para mantener compatibilidad con el resto del JSX
    function tieneAcceso(clave) { return permisos.tieneAcceso(clave); }

    // Sub-opciones de RRHH (filtradas por permisos)
    const subMenuRRHHBase = [
        { nombre: 'Personal',     ruta: '/dashboard/personal',    icono: faUserTie,       modulo: 'PERSONAL' },
        { nombre: 'Asistencias',  ruta: '/dashboard/asistencias', icono: faCalendarCheck, modulo: 'ASISTENCIA' },
        { nombre: 'Horarios',     ruta: '/dashboard/horarios',    icono: faClock,         modulo: 'HORARIOS' },
    ];
    const subMenuRRHH = subMenuRRHHBase.filter(function (s) { return tieneAcceso(s.modulo); });

    // Sub-opciones de Equipos (filtradas)
    const subMenuEquiposBase = [
        { nombre: 'Crear Equipo',  ruta: '/dashboard/equipos/crear',      icono: faPlus,           modulo: 'EQUIPOS_CREAR' },
        { nombre: 'Asignación',    ruta: '/dashboard/equipos/asignacion', icono: faArrowsRotate,   modulo: 'EQUIPOS_ASIGNACION' },
    ];
    const subMenuEquipos = subMenuEquiposBase.filter(function (s) { return tieneAcceso(s.modulo); });

    // Sub-opciones de Tickets (filtradas)
    const subMenuTicketsBase = [
        { nombre: 'Nuevo Ticket',  ruta: '/dashboard/tickets/nuevo',  icono: faPlus,      modulo: 'TICKETS_NUEVO' },
    ].concat(esRolTI ? [{ nombre: 'Tickets', ruta: '/dashboard/tickets', icono: faListCheck, modulo: 'TICKETS_PANEL' }] : []);
    const subMenuTickets = subMenuTicketsBase.filter(function (s) { return tieneAcceso(s.modulo); });

    // ¿Alguna sub-ruta de RRHH está activa?
    var rrhhActivo = location.pathname.indexOf('/dashboard/personal') === 0 || location.pathname.indexOf('/dashboard/asistencias') === 0 || location.pathname.indexOf('/dashboard/horarios') === 0;

    // ¿Alguna sub-ruta de Equipos está activa?
    var equiposActivo = location.pathname.indexOf('/dashboard/equipos') === 0;

    // ¿Alguna sub-ruta de Tickets está activa?
    var ticketsActivo = location.pathname.indexOf('/dashboard/tickets') === 0;

    // Función para abrir/cerrar el submenú de RRHH
    function toggleRRHH() {
        if (isOpen) {
            setRrhhAbierto(!rrhhAbierto);
            setPopupRRHH(false);
        } else {
            setPopupRRHH(!popupRRHH);
            setRrhhAbierto(false);
        }
    }

    function toggleEquipos() {
        if (isOpen) {
            setEquiposAbierto(!equiposAbierto);
            setPopupEquipos(false);
        } else {
            setPopupEquipos(!popupEquipos);
            setEquiposAbierto(false);
        }
    }

    function toggleTickets() {
        if (isOpen) {
            setTicketsAbierto(!ticketsAbierto);
            setPopupTickets(false);
        } else {
            setPopupTickets(!popupTickets);
            setTicketsAbierto(false);
        }
    }

    return (
        <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>

            <button className="toggle-btn" onClick={onToggleMenu}>
                <IconoFa icono={faBars} />
            </button>

            <nav className="sidebar-nav">
                {/* Inicio */}
                {tieneAcceso(menuSimple[0].modulo) && (
                <Link 
                    to={menuSimple[0].ruta} 
                    className={`menu-link ${location.pathname === menuSimple[0].ruta ? 'active' : ''}`}
                    title={!isOpen ? menuSimple[0].nombre : undefined}
                    onClick={handleNavClick}
                >
                    <IconoFa icono={menuSimple[0].icono} />
                    {isOpen && <span className="menu-text">{menuSimple[0].nombre}</span>}
                </Link>
                )}

                {/* Mi Perfil — visible para todos */}
                <Link 
                    to="/dashboard/mi-perfil" 
                    className={`menu-link ${location.pathname === '/dashboard/mi-perfil' ? 'active' : ''}`}
                    title={!isOpen ? 'Mi Perfil' : undefined}
                    onClick={handleNavClick}
                >
                    <IconoFa icono={faUserCircle} />
                    {isOpen && <span className="menu-text">Mi Perfil</span>}
                </Link>

                {/* === RRHH con submenú (oculto si no tiene hijos visibles) === */}
                {subMenuRRHH.length > 0 && (
                <div className={'menu-grupo ' + (rrhhActivo ? 'grupo-activo' : '')}>
                    {/* Botón padre: click abre/cierra submenú */}
                    <button ref={rrhhBtnRef} className={'menu-link menu-padre ' + (rrhhActivo ? 'active' : '')} onClick={toggleRRHH} title={!isOpen ? 'RRHH' : undefined}>
                        <IconoFa icono={faPeopleGroup} />
                        {isOpen && (
                            <>
                                <span className="menu-text">RRHH</span>
                                <IconoFa icono={rrhhAbierto ? faChevronDown : faChevronRight} clase="menu-flecha" />
                            </>
                        )}
                    </button>

                    {/* Sub-opciones EXPANDIDO (sidebar abierto) */}
                    {rrhhAbierto && isOpen && (
                        <div className="submenu">
                            {subMenuRRHH.map(function (sub) {
                                return (
                                    <Link
                                        key={sub.ruta}
                                        to={sub.ruta}
                                        className={'menu-link submenu-link ' + (location.pathname.indexOf(sub.ruta) === 0 ? 'active' : '')}
                                        onClick={handleNavClick}
                                    >
                                        <IconoFa icono={sub.icono} />
                                        <span className="menu-text">{sub.nombre}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Popup flotante COLAPSADO (sidebar cerrado) */}
                    {popupRRHH && !isOpen && (
                        <div className="submenu-popup" ref={popupRef}>
                            <div className="submenu-popup-titulo">RRHH</div>
                            {subMenuRRHH.map(function (sub) {
                                return (
                                    <Link
                                        key={sub.ruta}
                                        to={sub.ruta}
                                        className={'submenu-popup-link ' + (location.pathname.indexOf(sub.ruta) === 0 ? 'active' : '')}
                                        onClick={function () { setPopupRRHH(false); handleNavClick(); }}
                                    >
                                        <IconoFa icono={sub.icono} />
                                        <span>{sub.nombre}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
                )}

                {/* === Equipos con submenú === */}
                {subMenuEquipos.length > 0 && (
                <div className={'menu-grupo ' + (equiposActivo ? 'grupo-activo' : '')}>
                    <button ref={equiposBtnRef} className={'menu-link menu-padre ' + (equiposActivo ? 'active' : '')} onClick={toggleEquipos} title={!isOpen ? 'Equipos' : undefined}>
                        <IconoFa icono={faLaptop} />
                        {isOpen && (
                            <>
                                <span className="menu-text">Equipos</span>
                                <IconoFa icono={equiposAbierto ? faChevronDown : faChevronRight} clase="menu-flecha" />
                            </>
                        )}
                    </button>

                    {equiposAbierto && isOpen && (
                        <div className="submenu">
                            {subMenuEquipos.map(function (sub) {
                                return (
                                    <Link
                                        key={sub.ruta}
                                        to={sub.ruta}
                                        className={'menu-link submenu-link ' + (location.pathname.indexOf(sub.ruta) === 0 ? 'active' : '')}
                                        onClick={handleNavClick}
                                    >
                                        <IconoFa icono={sub.icono} />
                                        <span className="menu-text">{sub.nombre}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {popupEquipos && !isOpen && (
                        <div className="submenu-popup" ref={popupEquiposRef}>
                            <div className="submenu-popup-titulo">Equipos</div>
                            {subMenuEquipos.map(function (sub) {
                                return (
                                    <Link
                                        key={sub.ruta}
                                        to={sub.ruta}
                                        className={'submenu-popup-link ' + (location.pathname.indexOf(sub.ruta) === 0 ? 'active' : '')}
                                        onClick={function () { setPopupEquipos(false); handleNavClick(); }}
                                    >
                                        <IconoFa icono={sub.icono} />
                                        <span>{sub.nombre}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
                )}

                {/* === Tickets con submenú === */}
                {subMenuTickets.length > 0 && (
                <div className={'menu-grupo ' + (ticketsActivo ? 'grupo-activo' : '')}>
                    <button ref={ticketsBtnRef} className={'menu-link menu-padre ' + (ticketsActivo ? 'active' : '')} onClick={toggleTickets} title={!isOpen ? 'Tickets' : undefined}>
                        <IconoFa icono={faTicket} />
                        {isOpen && (
                            <>
                                <span className="menu-text">Tickets</span>
                                <IconoFa icono={ticketsAbierto ? faChevronDown : faChevronRight} clase="menu-flecha" />
                            </>
                        )}
                    </button>

                    {ticketsAbierto && isOpen && (
                        <div className="submenu">
                            {subMenuTickets.map(function (sub) {
                                return (
                                    <Link
                                        key={sub.ruta}
                                        to={sub.ruta}
                                        className={'menu-link submenu-link ' + (location.pathname === sub.ruta ? 'active' : '')}
                                        onClick={handleNavClick}
                                    >
                                        <IconoFa icono={sub.icono} />
                                        <span className="menu-text">{sub.nombre}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {popupTickets && !isOpen && (
                        <div className="submenu-popup" ref={popupTicketsRef}>
                            <div className="submenu-popup-titulo">Tickets</div>
                            {subMenuTickets.map(function (sub) {
                                return (
                                    <Link
                                        key={sub.ruta}
                                        to={sub.ruta}
                                        className={'submenu-popup-link ' + (location.pathname === sub.ruta ? 'active' : '')}
                                        onClick={function () { setPopupTickets(false); handleNavClick(); }}
                                    >
                                        <IconoFa icono={sub.icono} />
                                        <span>{sub.nombre}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
                )}

                {/* === Permisos (ADMIN + tiene permiso PERMISOS) === */}
                {permisos.esAdmin && tieneAcceso('PERMISOS') && (
                    <Link
                        to="/dashboard/permisos"
                        className={'menu-link ' + (location.pathname === '/dashboard/permisos' ? 'active' : '')}
                        title={!isOpen ? 'Permisos' : undefined}
                        onClick={handleNavClick}
                    >
                        <IconoFa icono={faShieldHalved} />
                        {isOpen && <span className="menu-text">Permisos</span>}
                    </Link>
                )}

                {/* === Chips / Telefonía === */}
                {tieneAcceso('CHIPS') && (
                    <Link
                        to="/dashboard/chips"
                        className={'menu-link ' + (location.pathname === '/dashboard/chips' ? 'active' : '')}
                        title={!isOpen ? 'Telefonía' : undefined}
                        onClick={handleNavClick}
                    >
                        <IconoFa icono={faSimCard} />
                        {isOpen && <span className="menu-text">Telefonía</span>}
                    </Link>
                )}

                {/* === Saludos de Cumpleaños (solo Marketing) === */}
                {esMarketing && (
                    <Link
                        to="/dashboard/saludos-cumpleanos"
                        className={'menu-link ' + (location.pathname === '/dashboard/saludos-cumpleanos' ? 'active' : '')}
                        title={!isOpen ? 'Saludos Cumpleaños' : undefined}
                        onClick={handleNavClick}
                    >
                        <IconoFa icono={faCakeCandles} />
                        {isOpen && <span className="menu-text">Saludos Cumpleaños</span>}
                    </Link>
                )}

                {/* Inventario, Clientes (filtrados por permisos) */}
                {menuSimple.slice(1).filter(function (item) { return tieneAcceso(item.modulo); }).map(function (item) {
                    return (
                        <Link 
                            key={item.ruta} 
                            to={item.ruta} 
                            className={`menu-link ${location.pathname === item.ruta ? 'active' : ''}`}
                            title={!isOpen ? item.nombre : undefined}
                            onClick={handleNavClick}
                        >
                            <IconoFa icono={item.icono} />
                            {isOpen && <span className="menu-text">{item.nombre}</span>}
                        </Link>
                    );
                })}
            </nav>

            <button className="sidebar-logout" onClick={cerrarSesion} title={!isOpen ? 'Cerrar sesión' : undefined}>
                <IconoFa icono={faRightFromBracket} />
                {isOpen && <span className="menu-text">Cerrar sesión</span>}
            </button>
        </aside>
    );
}