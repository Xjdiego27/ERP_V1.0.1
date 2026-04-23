import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '../hooks/useHeader';
import { useClickAfuera } from '../hooks/useClickAfuera';
import { usePushNotificaciones } from '../hooks/usePushNotificaciones';
import { showDesktopNotification } from '../utils/desktopNotifications';
import Img from './Img';
import IconoFa from './IconoFa';
import { faBell, faMoon, faSun, faFileContract, faCakeCandles, faUtensils, faCalendarDay, faCircleExclamation, faUserXmark, faTicket, faWrench, faCalendarCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { headersAuth, headersConToken, API_URL } from '../auth';
import UserDropdown from './UserMenu';
import '../styles/Header.css';

// ── Sonido para notificaciones ──
const sonidoNotificacion = new Audio('/sounds/msn_notificacion.mp3');
sonidoNotificacion.volume = 0.5;

// Claves de notificaciones descartadas localmente (para notifs sin id_notif)
function leerDescartadas() {
    try { return new Set(JSON.parse(localStorage.getItem('erp-noti-descartadas') || '[]')); } catch { return new Set(); }
}
function guardarDescartadas(set) {
    localStorage.setItem('erp-noti-descartadas', JSON.stringify([...set]));
}

export default function Header({ onToggleMenu, onToggleEmpresa, onCambiarPassword }) {
    const { usuario, menuOpen, toggleMenu, closeMenu } = useHeader();
    const [notiOpen, setNotiOpen] = useState(false);
    const [notificaciones, setNotificaciones] = useState([]);
    const [notiTotal, setNotiTotal] = useState(0);
    const [descartadas, setDescartadas] = useState(leerDescartadas);
    const [darkMode, setDarkMode] = useState(function () {
        return localStorage.getItem('erp-dark-mode') === 'true';
    });
    const menuRef = useRef(null);
    const notiRef = useRef(null);
    const prevNotiTotal = useRef(0);
    const navigate = useNavigate();

    // Registrar Service Worker y suscribir a Web Push
    usePushNotificaciones();

    // Navegar cuando el usuario hace clic en una push notification
    useEffect(function () {
        function onPushNavigate(e) {
            var url = e.detail && e.detail.url;
            if (url) navigate(url);
        }
        window.addEventListener('push-navigate', onPushNavigate);
        return function () { window.removeEventListener('push-navigate', onPushNavigate); };
    }, [navigate]);

    useClickAfuera(menuRef, closeMenu);
    useClickAfuera(notiRef, () => setNotiOpen(false));

    // Genera una clave única para cada notificación
    function claveNoti(n) { return (n.id_notif || '') + '|' + n.tipo + '|' + n.texto; }

    // Lee las claves ya vistas desde localStorage
    function leerVistas() {
        try { return JSON.parse(localStorage.getItem('erp-noti-vistas') || '[]'); } catch { return []; }
    }
    function guardarVistas(claves) {
        localStorage.setItem('erp-noti-vistas', JSON.stringify(claves));
    }

    // Cargar notificaciones
    const cargarNotificaciones = useCallback(function () {
        fetch(API_URL + '/notificaciones', { headers: headersAuth() })
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (data) {
                if (!data) return;
                var items = data.items || [];
                // Filtrar localmente descartadas
                var desc = leerDescartadas();
                var visibles = items.filter(function (n) { return !desc.has(claveNoti(n)); });
                setNotificaciones(visibles);
                // Comparar contra las ya vistas para el badge
                var vistas = leerVistas();
                var nuevas = visibles.filter(function (n) { return vistas.indexOf(claveNoti(n)) === -1; });
                setNotiTotal(nuevas.length);
                if (nuevas.length > prevNotiTotal.current && nuevas.length > 0) {
                    sonidoNotificacion.currentTime = 0;
                    sonidoNotificacion.play().catch(function () {});
                    nuevas.slice(0, 3).forEach(function (n) {
                        showDesktopNotification({
                            title: 'INTRANET EQ',
                            body: n.texto,
                            tag: 'noti-' + claveNoti(n),
                            url: '/dashboard',
                            silent: true,
                        });
                    });
                }
                prevNotiTotal.current = nuevas.length;
            })
            .catch(function () {});
    }, []);

    // Descartar una notificación (la quita de la lista)
    function descartarNoti(e, noti) {
        e.stopPropagation();
        var clave = claveNoti(noti);
        // Si tiene id_notif de MongoDB → borrar en el servidor
        if (noti.id_notif) {
            fetch(API_URL + '/notificaciones/' + noti.id_notif, {
                method: 'DELETE',
                headers: headersConToken(),
            }).catch(function () {});
        }
        // Guardar en localStorage para notifs computadas
        var nuevasDesc = new Set(leerDescartadas());
        nuevasDesc.add(clave);
        guardarDescartadas(nuevasDesc);
        setDescartadas(nuevasDesc);
        setNotificaciones(function (prev) { return prev.filter(function (n) { return claveNoti(n) !== clave; }); });
        setNotiTotal(function (t) { return Math.max(0, t - 1); });
    }

    // Click en notificación → navegar a la ubicación relevante
    function handleClickNoti(noti) {
        var esCumple = noti.tipo === 'cumpleanos' || noti.tipo === 'cumpleanos_proximo' || noti.tipo === 'saludo_pendiente';
        var esTicket = noti.tipo === 'ticket' || noti.tipo === 'ticket_nuevo' || noti.tipo === 'ticket_creado' || noti.tipo === 'ticket_estado' || noti.tipo === 'ticket_reabierto';
        if (esCumple && noti.id_personal) {
            window.dispatchEvent(new CustomEvent('abrir-saludo-cumple', {
                detail: {
                    id_personal: noti.id_personal,
                    nombre: noti.nombre_cumple || '',
                    foto: noti.foto_cumple || noti.foto || null,
                    dias_para: noti.dias_para != null ? noti.dias_para : 0,
                }
            }));
            setNotiOpen(false);
        } else if (esTicket) {
            navigate('/dashboard/tickets' + (noti.id_ticket ? '?ticket=' + noti.id_ticket : ''));
            setNotiOpen(false);
        }
    }

    useEffect(function () {
        cargarNotificaciones();
        // Refrescar cada 5 segundos para notificaciones en tiempo real
        var intervalo = setInterval(cargarNotificaciones, 30 * 1000);
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
        if (tipo === 'cumpleanos' || tipo === 'cumpleanos_proximo' || tipo === 'saludo_pendiente') return faCakeCandles;
        if (tipo === 'menu') return faUtensils;
        if (tipo === 'evento') return faCalendarDay;
        if (tipo === 'falta') return faUserXmark;
        if (tipo === 'ticket' || tipo === 'ticket_nuevo' || tipo === 'ticket_creado' || tipo === 'ticket_estado' || tipo === 'ticket_reabierto') return faTicket;
        if (tipo === 'mantenimiento') return faWrench;
        if (tipo === 'tarea') return faCalendarCheck;
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
                                        var esCumple = noti.tipo === 'cumpleanos' || noti.tipo === 'cumpleanos_proximo' || noti.tipo === 'saludo_pendiente';
                                        var esTicket = noti.tipo === 'ticket' || noti.tipo === 'ticket_nuevo' || noti.tipo === 'ticket_creado' || noti.tipo === 'ticket_estado' || noti.tipo === 'ticket_reabierto';
                                        var esClickable = esCumple || esTicket;
                                        return (
                                            <div
                                                key={noti.id_notif || idx}
                                                className={'noti-item' + (noti.urgente ? ' noti-urgente' : '') + ' noti-tipo-' + noti.tipo + (esClickable ? ' noti-clickable' : '')}
                                                onClick={function () { handleClickNoti(noti); }}
                                            >
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
                                                <button
                                                    className="noti-descartar-btn"
                                                    title="Descartar"
                                                    onClick={function (e) { descartarNoti(e, noti); }}
                                                >
                                                    <IconoFa icono={faTimes} />
                                                </button>
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
                    {menuOpen && <UserDropdown datos={usuario} onCambiarPassword={onCambiarPassword} />}
                </div>
                {/* Toggle Modo Nocturno — extremo derecho */}
                <span className="header-icon dark-toggle" onClick={toggleDarkMode} title={darkMode ? 'Modo claro' : 'Modo nocturno'}>
                    <IconoFa icono={darkMode ? faSun : faMoon} />
                </span>
            </div>
        </header>
    );
}