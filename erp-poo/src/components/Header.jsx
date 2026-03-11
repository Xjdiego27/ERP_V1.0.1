import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '../hooks/useHeader';
import { useClickAfuera } from '../hooks/useClickAfuera';
import Img from './Img'; 
import IconoFa from './IconoFa';
import { faBell, faMoon, faSun, faFileContract, faCakeCandles, faUtensils, faCalendarDay, faCircleExclamation, faUserXmark, faTicket } from '@fortawesome/free-solid-svg-icons';
import { headersAuth, API_URL } from '../auth';
import UserDropdown from './UserMenu';
import '../styles/Header.css';

export default function Header({ onToggleMenu, onToggleEmpresa }) {
    const { usuario, menuOpen, toggleMenu, closeMenu } = useHeader();
    const [notiOpen, setNotiOpen] = useState(false);
    const [notificaciones, setNotificaciones] = useState([]);
    const [notiTotal, setNotiTotal] = useState(0);
    const [darkMode, setDarkMode] = useState(function () {
        return localStorage.getItem('erp-dark-mode') === 'true';
    });
    const menuRef = useRef(null);
    const notiRef = useRef(null);
    const navigate = useNavigate();

    useClickAfuera(menuRef, closeMenu);
    useClickAfuera(notiRef, () => setNotiOpen(false));

    // Genera una clave única para cada notificación
    function claveNoti(n) { return n.tipo + '|' + n.texto; }

    // Lee las claves ya vistas desde localStorage
    function leerVistas() {
        try {
            var raw = localStorage.getItem('erp-noti-vistas');
            return raw ? JSON.parse(raw) : [];
        } catch (_e) { return []; }
    }

    // Guarda claves vistas en localStorage
    function guardarVistas(claves) {
        localStorage.setItem('erp-noti-vistas', JSON.stringify(claves));
    }

    // Cargar notificaciones
    const cargarNotificaciones = useCallback(function () {
        fetch(API_URL + '/notificaciones', { headers: headersAuth() })
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (data) {
                if (data) {
                    var items = data.items || [];
                    setNotificaciones(items);
                    // Comparar contra las ya vistas
                    var vistas = leerVistas();
                    var nuevas = items.filter(function (n) {
                        return vistas.indexOf(claveNoti(n)) === -1;
                    });
                    setNotiTotal(nuevas.length);
                }
            })
            .catch(function () {});
    }, []);

    useEffect(function () {
        cargarNotificaciones();
        // Refrescar cada 5 segundos para notificaciones en tiempo real
        var intervalo = setInterval(cargarNotificaciones, 5 * 1000);
        return function () { clearInterval(intervalo); };
    }, [cargarNotificaciones]);

    // Aplicar/quitar clase dark-mode en el body
    useEffect(function () {
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        localStorage.setItem('erp-dark-mode', darkMode);
    }, [darkMode]);

    function toggleDarkMode() {
        setDarkMode(!darkMode);
    }

    // Icono según tipo de notificación
    function iconoNoti(tipo) {
        if (tipo === 'contrato') return faFileContract;
        if (tipo === 'cumpleanos') return faCakeCandles;
        if (tipo === 'menu') return faUtensils;
        if (tipo === 'evento') return faCalendarDay;
        if (tipo === 'falta') return faUserXmark;
        if (tipo === 'ticket' || tipo === 'ticket_nuevo') return faTicket;
        return faBell;
    }

    // Texto del badge
    var badgeTexto = notiTotal > 9 ? '+9' : (notiTotal > 0 ? String(notiTotal) : '');

    if (!usuario) return <div className="header-placeholder"></div>;

    return (
        <header className="erp-header">
            {/* HAMBURGER (solo móvil) */}
            <button className="header-hamburger" onClick={onToggleMenu} aria-label="Abrir menú">
                <svg width="28" height="28" viewBox="0 0 24 24"><rect y="4" width="24" height="3" rx="1.5"/><rect y="10.5" width="24" height="3" rx="1.5"/><rect y="17" width="24" height="3" rx="1.5"/></svg>
            </button>
            {/* LOGO CENTRADO */}
            <div className="header-center" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                <Img ruta={darkMode && usuario.logoOscuro ? usuario.logoOscuro : usuario.logoClaro || usuario.logo} descripcion="Logo Empresa" />
            </div>
            {/* LADO DERECHO */}
            <div className="header-right">
                {/* Campana de notificaciones */}
                <div className="noti-wrapper" ref={notiRef}>
                    <span className="header-icon noti-bell" onClick={function () {
                        var abriendo = !notiOpen;
                        setNotiOpen(abriendo);
                        if (abriendo) {
                            // Marcar todas las actuales como vistas
                            var claves = notificaciones.map(claveNoti);
                            guardarVistas(claves);
                            setNotiTotal(0);
                        }
                    }}>
                        <IconoFa icono={faBell} />
                        {notiTotal > 0 && !notiOpen && <span className="noti-badge">{badgeTexto}</span>}
                    </span>
                    {notiOpen && (
                        <div className="noti-dropdown">
                            <div className="noti-dropdown-header">
                                <h4>Notificaciones</h4>
                                {notiTotal > 0 && <span className="noti-count-label">{notiTotal}</span>}
                            </div>
                            {notificaciones.length === 0 ? (
                                <p className="noti-empty">No hay notificaciones</p>
                            ) : (
                                <div className="noti-lista">
                                    {notificaciones.map(function (noti, idx) {
                                        return (
                                            <div key={idx} className={'noti-item' + (noti.urgente ? ' noti-urgente' : '') + ' noti-tipo-' + noti.tipo}>
                                                <div className="noti-item-icono">
                                                    <IconoFa icono={iconoNoti(noti.tipo)} />
                                                </div>
                                                <div className="noti-item-texto">
                                                    <span className="noti-msg">{noti.texto}</span>
                                                    {noti.detalle && noti.detalle.length > 0 && (
                                                        <span className="noti-detalle">
                                                            {noti.detalle.join(', ')}
                                                        </span>
                                                    )}
                                                    {noti.fecha && <span className="noti-fecha">{noti.fecha}</span>}
                                                </div>
                                                {noti.urgente && (
                                                    <div className="noti-urgente-dot">
                                                        <IconoFa icono={faCircleExclamation} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {/* Info de Usuario */}
                <div className="user-info">
                    <span className="user-name">{usuario.nombreCompleto}</span>
                    <span className="user-cargo">{usuario.cargo}</span>
                </div>
                {/* Menú y Foto */}
                <div className="user-menu-wrapper" ref={menuRef}>
                    <div className="user-photo-container" onClick={toggleMenu}>
                        <Img 
                            ruta={usuario.foto} 
                            descripcion="Usuario" 
                        />
                    </div>
                    {menuOpen && <UserDropdown datos={usuario} />}
                </div>
                {/* Toggle Modo Nocturno — extremo derecho */}
                <span className="header-icon dark-toggle" onClick={toggleDarkMode} title={darkMode ? 'Modo claro' : 'Modo nocturno'}>
                    <IconoFa icono={darkMode ? faSun : faMoon} />
                </span>
            </div>
        </header>
    );
}