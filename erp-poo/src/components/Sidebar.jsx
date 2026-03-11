import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import IconoFa from './IconoFa'; 
import { faBars, faHouse, faFileLines, faBoxArchive, faUsers, faRightFromBracket, faChevronDown, faChevronRight, faPeopleGroup, faUserTie, faCalendarCheck, faClock, faLaptop, faPlus, faArrowsRotate, faTicket, faListCheck } from '@fortawesome/free-solid-svg-icons';
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

    // Items simples (sin hijos)
    const menuSimple = [
        { nombre: 'Inicio',     ruta: '/dashboard',              icono: faHouse },
        { nombre: 'Inventario', ruta: '/dashboard/inventario',   icono: faBoxArchive },
        { nombre: 'Clientes',   ruta: '/dashboard/clientes',     icono: faUsers },
    ];

    // Sub-opciones de RRHH
    const subMenuRRHH = [
        { nombre: 'Personal',     ruta: '/dashboard/personal',    icono: faUserTie },
        { nombre: 'Asistencias',  ruta: '/dashboard/asistencias', icono: faCalendarCheck },
        { nombre: 'Horarios',     ruta: '/dashboard/horarios',    icono: faClock },
    ];

    // Sub-opciones de Equipos
    const subMenuEquipos = [
        { nombre: 'Crear Equipo',  ruta: '/dashboard/equipos/crear',      icono: faPlus },
        { nombre: 'Asignación',    ruta: '/dashboard/equipos/asignacion', icono: faArrowsRotate },
    ];

    // Detectar rol TI desde la sesión
    const sessionData = JSON.parse(localStorage.getItem('session'));
    const rolUsuario = (sessionData && sessionData.usuario && sessionData.usuario.rol || '').toUpperCase();
    const esRolTI = ['ADMINISTRADOR', 'ADMIN', 'SOPORTE'].indexOf(rolUsuario) >= 0;

    // Sub-opciones de Tickets (Mis Tickets solo para TI)
    const subMenuTickets = [
        { nombre: 'Nuevo Ticket',  ruta: '/dashboard/tickets/nuevo',  icono: faPlus },
    ].concat(esRolTI ? [{ nombre: 'Tickets', ruta: '/dashboard/tickets', icono: faListCheck }] : []);

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
                <Link 
                    to={menuSimple[0].ruta} 
                    className={`menu-link ${location.pathname === menuSimple[0].ruta ? 'active' : ''}`}
                    title={!isOpen ? menuSimple[0].nombre : undefined}
                    onClick={handleNavClick}
                >
                    <IconoFa icono={menuSimple[0].icono} />
                    {isOpen && <span className="menu-text">{menuSimple[0].nombre}</span>}
                </Link>

                {/* === RRHH con submenú === */}
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

                {/* === Equipos con submenú === */}
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

                {/* === Tickets con submenú === */}
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

                {/* Inventario, Clientes */}
                {menuSimple.slice(1).map(function (item) {
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