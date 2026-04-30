import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import IconoFa from './IconoFa';
import ChatVentana from './ChatVentana';
import ChatSala from './ChatSala';
import CrearGrupoModal from './CrearGrupoModal';
import MiEspacio from './MiEspacio';
import { faComments, faSearch, faTimes, faCircle, faMinus, faGlobe, faUsers, faPlus, faStickyNote, faTrash } from '@fortawesome/free-solid-svg-icons';
import { CHAT_URL, CHAT_SOCKET_URL, obtenerToken } from '../auth';
import { getSession } from '../utils/session';
import { showDesktopNotification } from '../utils/desktopNotifications';
import '../styles/Chat.css';

// Singleton de socket — evita doble conexión por React StrictMode en desarrollo
let _socketSingleton = null;

// Sonido de notificación MSN para mensajes cuando chat no está abierto
const sonidoNotificacion = new Audio('/sounds/msn_messenger.mp3');
sonidoNotificacion.volume = 0.5;

function resumirMensaje(msg) {
    if (msg.tipo === 'archivo') {
        return msg.archivo_nombre ? ('Archivo: ' + msg.archivo_nombre) : 'Te enviaron un archivo';
    }
    return msg.contenido || 'Nuevo mensaje';
}

/**
 * ChatPanel — Panel lateral de contactos + ventanas de chat flotantes.
 * Se monta en Dashboard.jsx de forma global.
 * Conecta al backend de chat (puerto 4001) vía Socket.IO.
 */
export default function ChatPanel() {
    const [abierto, setAbierto] = useState(false);
    const [contactos, setContactos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [chatsAbiertos, setChatsAbiertos] = useState([]);  // [{id_personal, nombre, foto, cargo}]
    const [noLeidos, setNoLeidos] = useState({});             // {id_personal: count}
    const [noLeidosGeneral, setNoLeidosGeneral] = useState(0); // count msgs general sin ver
    const [noLeidosGrupos, setNoLeidosGrupos] = useState({}); // {grupo_id: count}
    const [conectados, setConectados] = useState(new Set());
    const [chatGeneralAbierto, setChatGeneralAbierto] = useState(false);
    const [miEspacioAbierto, setMiEspacioAbierto] = useState(false);
    const [grupos, setGrupos] = useState([]);                  // [{id, nombre, miembros, creador_id}]
    const [gruposAbiertos, setGruposAbiertos] = useState([]);  // [{id, nombre, ...}]
    const [modalGrupo, setModalGrupo] = useState(false);
    const [tabActiva, setTabActiva] = useState('contactos');   // 'contactos' | 'grupos'
    const [chatActivoMobile, setChatActivoMobile] = useState(null); // id_personal del chat expandido en mobile
    const [esMobile, setEsMobile] = useState(window.innerWidth <= 1024);
    const [ultimoMsg, setUltimoMsg] = useState({});            // {id_personal: timestamp} para ordenar contactos
    const [modoBurbuja, setModoBurbuja] = useState(() => localStorage.getItem('chat_modo') || 'barra');
    const [burbujaPreviews, setBurbujaPreviews] = useState({});  // {id_personal: {texto, ts}}
    const [burbujaActivaId, setBurbujaActivaId] = useState(null); // qué ventana de chat está expandida en modo burbuja
    const [burbujaPosiciones, setBurbujaPosiciones] = useState({}); // {id_personal|'general'|'notas': {x, y}}
    const [generalBurbujaActiva, setGeneralBurbujaActiva] = useState(false);
    const [notasBurbujaActiva, setNotasBurbujaActiva] = useState(false);
    const previewTimers = useRef({});
    const dragRef = useRef(null);
    const socketRef = useRef(null);
    const panelRef = useRef(null);
    const contactosRef = useRef([]);
    const totalNoLeidosGrupos = Object.values(noLeidosGrupos).reduce((s, v) => s + v, 0);
    const totalNoLeidos = Object.values(noLeidos).reduce((s, v) => s + v, 0) + noLeidosGeneral + totalNoLeidosGrupos;
    const gruposRef = useRef([]);

    // Mantener ref sincronizada para acceder dentro de socket listeners
    useEffect(() => { contactosRef.current = contactos; }, [contactos]);
    useEffect(() => { gruposRef.current = grupos; }, [grupos]);

    // ── Detectar mobile/tablet ──
    useEffect(() => {
        function handleResize() {
            setEsMobile(window.innerWidth <= 1024);
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ── Escuchar cambio de modo burbuja desde UserMenu ──
    useEffect(() => {
        function onModoChange(e) {
            setModoBurbuja(e.detail.modo);
        }
        window.addEventListener('chat-modo-change', onModoChange);
        return () => window.removeEventListener('chat-modo-change', onModoChange);
    }, []);

    // ── Posición inicial de burbuja (si no fue movida) ──
    // FAB está en bottom:24 right:24 tamaño 42x42 → ocupa x:[W-66,W-24] y:[H-66,H-24]
    // Empezar las burbujas 140px desde la derecha y 160px desde abajo para evitar solapamiento
    function getBurbujaPos(id, idx) {
        if (burbujaPosiciones[id]) return burbujaPosiciones[id];
        return {
            x: window.innerWidth - 140 - idx * 64,
            y: window.innerHeight - 160,
        };
    }

    // ── Drag libre de burbujas ──
    function handleBurbujaMouseDown(e, id, idx, onClickCb) {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const pos = getBurbujaPos(id, idx);
        let moved = false;
        dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };

        function onMove(ev) {
            ev.preventDefault(); // evitar drag nativo sobre inputs u otros elementos
            if (!dragRef.current) return;
            const dx = ev.clientX - dragRef.current.startX;
            const dy = ev.clientY - dragRef.current.startY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
            if (!moved) return;
            const nx = Math.max(0, Math.min(window.innerWidth - 60, dragRef.current.origX + dx));
            const ny = Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.origY + dy));
            // Usar 'id' del closure, no dragRef.current.id (puede ser null en el callback async)
            setBurbujaPosiciones(prev => ({ ...prev, [id]: { x: nx, y: ny } }));
        }

        function onUp() {
            const wasMoved = moved;
            dragRef.current = null;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            if (!wasMoved) onClickCb();
        }

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }

    // ── Conectar Socket.IO ──
    useEffect(() => {
        const token = obtenerToken();
        if (!token) return;

        // Reutilizar socket existente — evita duplicados por React StrictMode en dev,
        // que monta → desmonta → monta el componente, creando dos sockets simultáneos
        // con el primer socket aún a medio handshake cuando el segundo intenta conectar.
        if (_socketSingleton) {
            socketRef.current = _socketSingleton;
            if (_socketSingleton.connected) {
                cargarContactos();
                cargarNoLeidos();
                cargarGrupos();
            }
            return () => { socketRef.current = null; };
        }

        const socket = io(CHAT_SOCKET_URL, {
            auth: { token },
            transports: ['polling', 'websocket'],
            upgrade: true,
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionAttempts: Infinity,
        });
        _socketSingleton = socket;

        socket.on('connect', () => {
            console.log('[Chat] Socket conectado/reconectado');
            cargarContactos();
            cargarNoLeidos();
            cargarGrupos();
        });

        socket.on('connect_error', (err) => {
            console.warn('[Chat] Error conexión:', err.message);
        });

        socket.on('usuario_conectado', (data) => {
            setConectados(prev => new Set([...prev, data.id_personal]));
        });

        // Lista completa de conectados (recibida al conectarse)
        socket.on('lista_conectados', (data) => {
            if (data && data.ids) {
                setConectados(new Set(data.ids));
            }
        });

        socket.on('usuario_desconectado', (data) => {
            setConectados(prev => {
                const next = new Set(prev);
                next.delete(data.id_personal);
                return next;
            });
        });

        socket.on('mensaje_nuevo', (msg) => {
            // Registrar timestamp del último mensaje recibido para ordenar contactos
            setUltimoMsg(prev => ({ ...prev, [msg.remitente_id]: Date.now() }));

            // Mostrar preview en burbuja (modo burbuja)
            const textoPreview = msg.nombre_remitente
                ? msg.nombre_remitente.split(' ')[0] + ': ' + resumirMensaje(msg)
                : resumirMensaje(msg);
            setBurbujaPreviews(prev => ({ ...prev, [msg.remitente_id]: { texto: textoPreview, ts: Date.now() } }));
            if (previewTimers.current[msg.remitente_id]) clearTimeout(previewTimers.current[msg.remitente_id]);
            previewTimers.current[msg.remitente_id] = setTimeout(() => {
                setBurbujaPreviews(prev => { const c = { ...prev }; delete c[msg.remitente_id]; return c; });
            }, 4000);

            // Si la ventana de ese contacto NO está abierta, incrementar no leídos y sonar
            setChatsAbiertos(prev => {
                const estaAbierto = prev.some(c => c.id_personal === msg.remitente_id);
                if (!estaAbierto) {
                    setNoLeidos(old => ({
                        ...old,
                        [msg.remitente_id]: (old[msg.remitente_id] || 0) + 1,
                    }));
                    sonidoNotificacion.currentTime = 0;
                    sonidoNotificacion.play().catch(() => {});
                }
                if (!estaAbierto || document.hidden) {
                    showDesktopNotification({
                        title: 'Mensaje de ' + (msg.nombre_remitente || 'Contacto'),
                        body: resumirMensaje(msg),
                        tag: 'chat-directo-' + msg.remitente_id,
                        url: '/dashboard',
                        silent: true,
                    });
                }
                // En modo burbuja: si ya está en la lista, expandir automáticamente
                const modoActual = localStorage.getItem('chat_modo') || 'barra';
                if (modoActual === 'burbujas' && estaAbierto) {
                    setBurbujaActivaId(msg.remitente_id);
                }
                return prev;
            });
        });

        // ── Mensajes del chat general: PRIORIDAD ALTA — abrir automáticamente ──
        socket.on('msg_general', (msg) => {
            setChatGeneralAbierto(prev => {
                if (!prev) {
                    // Auto-abrir panel + chat general
                    setAbierto(true);
                    sonidoNotificacion.currentTime = 0;
                    sonidoNotificacion.play().catch(() => {});
                    showDesktopNotification({
                        title: 'Chat General',
                        body: (msg.nombre_remitente || 'Usuario') + ': ' + resumirMensaje(msg),
                        tag: 'chat-general',
                        url: '/dashboard',
                        silent: true,
                    });
                    return true; // abre chatGeneralAbierto
                }
                if (document.hidden) {
                    showDesktopNotification({
                        title: 'Chat General',
                        body: (msg.nombre_remitente || 'Usuario') + ': ' + resumirMensaje(msg),
                        tag: 'chat-general',
                        url: '/dashboard',
                        silent: true,
                    });
                }
                return prev;
            });
        });

        // ── Mensajes de grupo: notificar si ventana de ese grupo no está abierta ──
        socket.on('msg_grupo', (msg) => {
            setGruposAbiertos(prev => {
                const estaAbierto = prev.some(g => g.id === msg.grupo_id);
                if (!estaAbierto) {
                    setNoLeidosGrupos(old => ({
                        ...old,
                        [msg.grupo_id]: (old[msg.grupo_id] || 0) + 1,
                    }));
                    sonidoNotificacion.currentTime = 0;
                    sonidoNotificacion.play().catch(() => {});
                }
                if (!estaAbierto || document.hidden) {
                    const grupo = gruposRef.current.find(g => g.id === msg.grupo_id);
                    showDesktopNotification({
                        title: 'Grupo: ' + (msg.grupo_nombre || grupo?.nombre || 'Chat de grupo'),
                        body: (msg.nombre_remitente || 'Usuario') + ': ' + resumirMensaje(msg),
                        tag: 'chat-grupo-' + msg.grupo_id,
                        url: '/dashboard',
                        silent: true,
                    });
                }
                return prev;
            });
        });

        // ── Zumbido: abrir chat del remitente automáticamente (estilo MSN) ──
        socket.on('zumbido', (data) => {
            setChatsAbiertos(prev => {
                const idx = prev.findIndex(c => c.id_personal === data.remitente_id);
                if (idx >= 0) {
                    // Ya abierto: moverlo al inicio
                    if (idx > 0) {
                        const copia = [...prev];
                        const [chat] = copia.splice(idx, 1);
                        return [chat, ...copia];
                    }
                    return prev;
                }
                // No abierto: buscar contacto y abrir ventana
                const contacto = contactosRef.current.find(c => c.id_personal === data.remitente_id);
                if (contacto) {
                    setAbierto(true);
                    sonidoNotificacion.currentTime = 0;
                    sonidoNotificacion.play().catch(() => {});
                    return [contacto, ...prev];
                }
                // Contacto no encontrado en lista: crear entrada mínima
                setAbierto(true);
                sonidoNotificacion.currentTime = 0;
                sonidoNotificacion.play().catch(() => {});
                showDesktopNotification({
                    title: 'Zumbido de ' + (data.nombre_remitente || 'Contacto'),
                    body: 'Te enviaron un zumbido en el chat',
                    tag: 'chat-zumbido-' + data.remitente_id,
                    url: '/dashboard',
                    silent: true,
                    requireInteraction: true,
                });
                return [{ id_personal: data.remitente_id, nombre: data.nombre_remitente, foto: null, cargo: '' }, ...prev];
            });
        });

        socket.on('disconnect', () => {
            console.log('[Chat] Socket desconectado');
        });

        socketRef.current = socket;

        return () => {
            // No desconectar el singleton aquí — lo gestiona el propio módulo
            // para evitar que StrictMode destruya la conexión en el primer desmontaje
            socketRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Cargar contactos ──
    const cargarContactos = useCallback(() => {
        const token = obtenerToken();
        if (!token) return;

        fetch(CHAT_URL + '/contactos', {
            headers: { 'Authorization': 'Bearer ' + token },
        })
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                setContactos(data);
                // Actualizar set de conectados
                const ids = new Set();
                data.forEach(c => { if (c.en_linea) ids.add(c.id_personal); });
                setConectados(ids);
            })
            .catch(() => {});
    }, []);

    // ── Cargar no leídos ──
    const cargarNoLeidos = useCallback(() => {
        const token = obtenerToken();
        if (!token) return;

        fetch(CHAT_URL + '/no-leidos', {
            headers: { 'Authorization': 'Bearer ' + token },
        })
            .then(r => r.ok ? r.json() : { por_contacto: {} })
            .then(data => {
                const serverData = data.por_contacto || {};
                // Filtrar contactos cuya ventana está abierta (ya los leyó)
                setChatsAbiertos(prev => {
                    const idsAbiertos = new Set(prev.map(c => c.id_personal));
                    const filtrado = {};
                    for (const [id, count] of Object.entries(serverData)) {
                        const idNum = Number(id);
                        if (!idsAbiertos.has(idNum)) {
                            filtrado[idNum] = count;
                        }
                    }
                    setNoLeidos(filtrado);
                    return prev;
                });
            })
            .catch(() => {});
    }, []);

    // ── Sincronizar conectados periódicamente (cada 30s) ──
    useEffect(() => {
        const intervalo = setInterval(() => {
            const token = obtenerToken();
            if (!token) return;
            fetch(CHAT_URL + '/conectados', {
                headers: { 'Authorization': 'Bearer ' + token },
            })
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (data && data.ids) {
                        setConectados(new Set(data.ids));
                    }
                })
                .catch(() => {});
        }, 30000);
        return () => clearInterval(intervalo);
    }, []);

    // ── Cargar grupos ──
    const cargarGrupos = useCallback(() => {
        const token = obtenerToken();
        if (!token) return;
        fetch(CHAT_URL + '/grupos', {
            headers: { 'Authorization': 'Bearer ' + token },
        })
            .then(r => r.ok ? r.json() : [])
            .then(data => setGrupos(data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        cargarContactos();
        cargarNoLeidos();
        cargarGrupos();
        // Refrescar cada 30 segundos
        const interval = setInterval(() => {
            cargarContactos();
            cargarNoLeidos();
            cargarGrupos();
        }, 30000);
        return () => clearInterval(interval);
    }, [cargarContactos, cargarNoLeidos, cargarGrupos]);

    // ── Abrir ventana de chat con un contacto ──
    function abrirChat(contacto) {
        setChatsAbiertos(prev => {
            if (prev.some(c => c.id_personal === contacto.id_personal)) return prev;
            return [...prev, contacto];
        });
        // Limpiar no leídos de este contacto
        setNoLeidos(old => {
            const copia = { ...old };
            delete copia[contacto.id_personal];
            return copia;
        });
        // En mobile: expandir este chat y cerrar panel
        if (esMobile) {
            setChatActivoMobile(contacto.id_personal);
            setAbierto(false);
        }
    }

    // ── Cerrar ventana de chat ──
    function cerrarChat(id_personal) {
        setChatsAbiertos(prev => prev.filter(c => c.id_personal !== id_personal));
    }

    // ── Toggle modo burbuja / barra ──
    function cambiarModo(modo) {
        setModoBurbuja(modo);
        localStorage.setItem('chat_modo', modo);
    }

    // ── Abrir/cerrar grupo ──
    function abrirGrupo(grupo) {
        setGruposAbiertos(prev => {
            if (prev.some(g => g.id === grupo.id)) return prev;
            return [...prev, grupo];
        });
        // Limpiar no leidos de este grupo
        setNoLeidosGrupos(old => {
            const copia = { ...old };
            delete copia[grupo.id];
            return copia;
        });
    }

    function cerrarGrupo(grupoId) {
        setGruposAbiertos(prev => prev.filter(g => g.id !== grupoId));
    }

    // ── Eliminar grupo ──
    async function eliminarGrupo(grupoId, e) {
        e.stopPropagation();
        if (!window.confirm('¿Estás seguro de eliminar este grupo? Se perderán todos los mensajes.')) return;
        const token = obtenerToken();
        if (!token) return;
        try {
            const resp = await fetch(CHAT_URL + '/grupos/' + grupoId, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token },
            });
            if (resp.ok) {
                cerrarGrupo(grupoId);
                cargarGrupos();
            }
        } catch (err) {
            console.error('Error al eliminar grupo:', err);
        }
    }

    // ── Crear grupo ──
    async function handleCrearGrupo(nombre, miembros) {
        const token = obtenerToken();
        if (!token) return;
        try {
            const resp = await fetch(CHAT_URL + '/grupos', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nombre, miembros }),
            });
            const data = await resp.json();
            if (data.ok) {
                setModalGrupo(false);
                cargarGrupos();
                // Abrir el grupo recién creado
                abrirGrupo({ id: data.grupo_id, nombre: data.nombre, miembros: data.miembros });
            }
        } catch (err) {
            console.error('Error al crear grupo:', err);
        }
    }

    // ── Filtrar contactos ──
    const session = getSession();
    const miIdPersonal = session?.usuario?.id_personal;
    const contactosFiltrados = contactos.filter(c => {
        if (c.id_personal === miIdPersonal) return false;
        if (!busqueda) return true;
        return c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
               (c.cargo || '').toLowerCase().includes(busqueda.toLowerCase());
    });

    // Ordenar: contactos con mensajes no leídos o recientes van primero
    function ordenarPorActividad(lista) {
        return [...lista].sort((a, b) => {
            const noLeidoA = noLeidos[a.id_personal] || 0;
            const noLeidoB = noLeidos[b.id_personal] || 0;
            // Primero: los que tienen mensajes no leídos
            if (noLeidoA > 0 && noLeidoB === 0) return -1;
            if (noLeidoB > 0 && noLeidoA === 0) return 1;
            // Luego: por timestamp del último mensaje recibido
            const tsA = ultimoMsg[a.id_personal] || 0;
            const tsB = ultimoMsg[b.id_personal] || 0;
            return tsB - tsA;
        });
    }

    // Separar en línea / desconectados y ordenar por actividad
    const enLinea = ordenarPorActividad(contactosFiltrados.filter(c => conectados.has(c.id_personal)));
    const desconectados = ordenarPorActividad(contactosFiltrados.filter(c => !conectados.has(c.id_personal)));

    return (
        <>
            {/* ── Botón flotante para abrir/cerrar ── */}
            <button
                className={'chat-fab' + (totalNoLeidos > 0 ? ' tiene-mensajes' : '')}
                onClick={() => setAbierto(!abierto)}
                title="Chat"
            >
                <IconoFa icono={abierto ? faTimes : faComments} />
                {totalNoLeidos > 0 && (
                    <span className="chat-fab-badge">{totalNoLeidos > 99 ? '99+' : totalNoLeidos}</span>
                )}
            </button>

            {/* ── Panel de contactos ── */}
            {abierto && (
                <div className="chat-panel" ref={panelRef}>
                    <div className="chat-panel-header">
                        <h3>
                            <IconoFa icono={faComments} /> Chat
                        </h3>
                        <button className="chat-panel-cerrar" onClick={() => setAbierto(false)}>
                            <IconoFa icono={faMinus} />
                        </button>
                    </div>

                    {/* ── Botón Chat General ── */}
                    <div
                        className="chat-general-boton"
                        onClick={() => { setChatGeneralAbierto(true); setNoLeidosGeneral(0); }}
                    >
                        <div className="chat-contacto-avatar">
                            <div className="chat-avatar-placeholder chat-general-avatar">
                                <IconoFa icono={faGlobe} />
                            </div>
                        </div>
                        <div className="chat-contacto-info">
                            <span className="chat-contacto-nombre">Chat General</span>
                            <span className="chat-contacto-cargo">Todos los contactos</span>
                        </div>
                        {noLeidosGeneral > 0 && (
                            <span className="chat-badge-noleido">{noLeidosGeneral}</span>
                        )}
                    </div>

                    {/* ── Botón Mi Espacio ── */}
                    <div
                        className="chat-general-boton mi-espacio-boton"
                        onClick={() => setMiEspacioAbierto(true)}
                    >
                        <div className="chat-contacto-avatar">
                            <div className="chat-avatar-placeholder mi-espacio-boton-avatar">
                                <IconoFa icono={faStickyNote} />
                            </div>
                        </div>
                        <div className="chat-contacto-info">
                            <span className="chat-contacto-nombre">Mi Espacio</span>
                            <span className="chat-contacto-cargo">Notas y recordatorios</span>
                        </div>
                    </div>

                    {/* ── Tabs: Contactos | Grupos ── */}
                    <div className="chat-panel-tabs">
                        <button
                            className={'chat-panel-tab' + (tabActiva === 'contactos' ? ' activa' : '')}
                            onClick={() => setTabActiva('contactos')}
                        >
                            Contactos
                        </button>
                        <button
                            className={'chat-panel-tab' + (tabActiva === 'grupos' ? ' activa' : '')}
                            onClick={() => setTabActiva('grupos')}
                        >
                            <IconoFa icono={faUsers} /> Grupos
                        </button>
                    </div>

                    {tabActiva === 'contactos' && (
                        <>
                            <div className="chat-busqueda">
                                <IconoFa icono={faSearch} />
                                <input
                                    type="text"
                                    placeholder="Buscar contacto..."
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                />
                            </div>

                            <div className="chat-contactos-lista">
                                {enLinea.length > 0 && (
                                    <div className="chat-grupo-titulo">
                                        En línea ({enLinea.length})
                                    </div>
                                )}
                                {enLinea.map(c => (
                                    <div
                                        key={c.id_personal}
                                        className="chat-contacto-item"
                                        onClick={() => abrirChat(c)}
                                    >
                                        <div className="chat-contacto-avatar">
                                            <div className="chat-avatar-placeholder">
                                                {c.nombre.charAt(0)}
                                            </div>
                                            <span className="chat-status online">
                                                <IconoFa icono={faCircle} />
                                            </span>
                                        </div>
                                        <div className="chat-contacto-info">
                                            <span className="chat-contacto-nombre">{c.nombre}</span>
                                            <span className="chat-contacto-cargo">{c.cargo}</span>
                                        </div>
                                        {noLeidos[c.id_personal] > 0 && (
                                            <span className="chat-badge-noleido">{noLeidos[c.id_personal]}</span>
                                        )}
                                    </div>
                                ))}

                                {desconectados.length > 0 && (
                                    <div className="chat-grupo-titulo">
                                        Desconectados ({desconectados.length})
                                    </div>
                                )}
                                {desconectados.map(c => (
                                    <div
                                        key={c.id_personal}
                                        className="chat-contacto-item offline"
                                        onClick={() => abrirChat(c)}
                                    >
                                        <div className="chat-contacto-avatar">
                                            <div className="chat-avatar-placeholder">
                                                {c.nombre.charAt(0)}
                                            </div>
                                            <span className="chat-status offline-dot">
                                                <IconoFa icono={faCircle} />
                                            </span>
                                        </div>
                                        <div className="chat-contacto-info">
                                            <span className="chat-contacto-nombre">{c.nombre}</span>
                                            <span className="chat-contacto-cargo">{c.cargo}</span>
                                        </div>
                                        {noLeidos[c.id_personal] > 0 && (
                                            <span className="chat-badge-noleido">{noLeidos[c.id_personal]}</span>
                                        )}
                                    </div>
                                ))}

                                {contactosFiltrados.length === 0 && (
                                    <p className="chat-sin-contactos">No se encontraron contactos</p>
                                )}
                            </div>
                        </>
                    )}

                    {tabActiva === 'grupos' && (
                        <div className="chat-contactos-lista">
                            <button className="chat-crear-grupo-btn" onClick={() => setModalGrupo(true)}>
                                <IconoFa icono={faPlus} /> Crear grupo
                            </button>
                            {grupos.length === 0 ? (
                                <p className="chat-sin-contactos">No hay grupos. ¡Crea uno!</p>
                            ) : (
                                grupos.map(g => (
                                    <div
                                        key={g.id}
                                        className="chat-contacto-item"
                                        onClick={() => abrirGrupo(g)}
                                    >
                                        <div className="chat-contacto-avatar">
                                            <div className="chat-avatar-placeholder chat-grupo-avatar">
                                                <IconoFa icono={faUsers} />
                                            </div>
                                        </div>
                                        <div className="chat-contacto-info">
                                            <span className="chat-contacto-nombre">{g.nombre}</span>
                                            <span className="chat-contacto-cargo">{g.miembros.length} miembros</span>
                                        </div>
                                        {noLeidosGrupos[g.id] > 0 && (
                                            <span className="chat-badge-noleido">{noLeidosGrupos[g.id]}</span>
                                        )}
                                        {g.creador_id === miIdPersonal && (
                                            <button
                                                className="chat-grupo-eliminar-btn"
                                                title="Eliminar grupo"
                                                onClick={(e) => eliminarGrupo(g.id, e)}
                                            >
                                                <IconoFa icono={faTrash} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Chat General flotante (solo mobile — barra usa tray, burbujas usa burbuja) ── */}
            {chatGeneralAbierto && esMobile && (
                <ChatSala
                    tipo="general"
                    socket={socketRef.current}
                    onCerrar={() => setChatGeneralAbierto(false)}
                    panelAbierto={abierto}
                    posicion={0}
                />
            )}

            {/* ── Mi Espacio flotante (solo mobile) ── */}
            {miEspacioAbierto && esMobile && (
                <MiEspacio
                    onCerrar={() => setMiEspacioAbierto(false)}
                    panelAbierto={abierto}
                    posicion={(chatGeneralAbierto ? 1 : 0)}
                />
            )}

            {/* ── Ventanas de chat individual flotantes ── */}
            {esMobile ? (
                <>
                    {/* Burbujas tipo Messenger (mobile) */}
                    <div className="chat-heads-container">
                        {chatsAbiertos.map((chat) => {
                            const esActivo = chatActivoMobile === chat.id_personal;
                            return (
                                <div
                                    key={chat.id_personal}
                                    className={'chat-head' + (esActivo ? ' chat-head-activo' : '') + (noLeidos[chat.id_personal] ? ' chat-head-noleido' : '')}
                                    onClick={() => setChatActivoMobile(esActivo ? null : chat.id_personal)}
                                    title={chat.nombre}
                                >
                                    {chat.foto ? (
                                        <>
                                            <img src={'/assets/perfiles/' + chat.foto} alt=""
                                                onError={(e) => { e.target.style.display='none'; e.target.nextElementSibling.style.display='inline'; }} />
                                            <span className="chat-head-letra" style={{display:'none'}}>{chat.nombre.charAt(0)}</span>
                                        </>
                                    ) : (
                                        <span className="chat-head-letra">{chat.nombre.charAt(0)}</span>
                                    )}
                                    {conectados.has(chat.id_personal) && (
                                        <span className="chat-head-online"></span>
                                    )}
                                    {noLeidos[chat.id_personal] > 0 && (
                                        <span className="chat-head-badge">{noLeidos[chat.id_personal]}</span>
                                    )}
                                    <button
                                        className="chat-head-cerrar"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            cerrarChat(chat.id_personal);
                                            if (esActivo) setChatActivoMobile(null);
                                        }}
                                    >
                                        &times;
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    {/* Ventana expandida del chat activo */}
                    {chatActivoMobile && chatsAbiertos.find(c => c.id_personal === chatActivoMobile) && (
                        <ChatVentana
                            key={chatActivoMobile}
                            contacto={chatsAbiertos.find(c => c.id_personal === chatActivoMobile)}
                            socket={socketRef.current}
                            onCerrar={() => {
                                cerrarChat(chatActivoMobile);
                                setChatActivoMobile(null);
                            }}
                            posicion={0}
                            enLinea={conectados.has(chatActivoMobile)}
                            panelAbierto={false}
                            modeMobile={true}
                            onMinimizar={() => setChatActivoMobile(null)}
                            noLeidosCount={noLeidos[chatActivoMobile] || 0}
                        />
                    )}
                </>
            ) : modoBurbuja === 'barra' ? (
                /* ── Modo Barra: todas las ventanas en un tray con scroll horizontal ── */
                <div
                    className="chat-ventanas-tray"
                    style={{ right: (abierto ? 326 : 82) + 'px' }}
                >
                    {/* Chat General — primero en DOM = extremo derecho (direction:rtl) */}
                    {chatGeneralAbierto && (
                        <ChatSala
                            tipo="general"
                            socket={socketRef.current}
                            onCerrar={() => setChatGeneralAbierto(false)}
                            panelAbierto={abierto}
                            posicion={0}
                            modeTray={true}
                        />
                    )}
                    {/* Mi Espacio */}
                    {miEspacioAbierto && (
                        <MiEspacio
                            onCerrar={() => setMiEspacioAbierto(false)}
                            panelAbierto={abierto}
                            posicion={0}
                            modeTray={true}
                        />
                    )}
                    {/* Chats individuales */}
                    {chatsAbiertos.map((chat) => (
                        <ChatVentana
                            key={chat.id_personal}
                            contacto={chat}
                            socket={socketRef.current}
                            onCerrar={() => cerrarChat(chat.id_personal)}
                            posicion={0}
                            enLinea={conectados.has(chat.id_personal)}
                            panelAbierto={abierto}
                            modeTray={true}
                            noLeidosCount={noLeidos[chat.id_personal] || 0}
                        />
                    ))}
                    {/* Grupos — extremo izquierdo */}
                    {gruposAbiertos.map((grupo) => (
                        <ChatSala
                            key={grupo.id}
                            tipo="grupo"
                            grupo={grupo}
                            socket={socketRef.current}
                            onCerrar={() => cerrarGrupo(grupo.id)}
                            posicion={0}
                            panelAbierto={abierto}
                            modeTray={true}
                        />
                    ))}
                </div>
            ) : (
                /* ── Modo Burbuja: círculos flotantes draggables estilo Messenger ── */
                <>
                    {chatsAbiertos.map((chat, idx) => {
                        const preview = burbujaPreviews[chat.id_personal];
                        const noLeido = noLeidos[chat.id_personal] || 0;
                        const esActiva = burbujaActivaId === chat.id_personal;
                        const pos = getBurbujaPos(chat.id_personal, idx);
                        return (
                            <div
                                key={chat.id_personal}
                                className={'chat-burbuja-item' + (esActiva ? ' activa' : '')}
                                title={chat.nombre}
                                style={{ position: 'fixed', left: pos.x + 'px', top: pos.y + 'px', cursor: 'grab', zIndex: 9010 }}
                                onMouseDown={(e) => handleBurbujaMouseDown(e, chat.id_personal, idx, () => {
                                    setBurbujaActivaId(esActiva ? null : chat.id_personal);
                                    setNoLeidos(old => { const c = { ...old }; delete c[chat.id_personal]; return c; });
                                })}
                            >
                                {preview && (
                                    <div className="chat-burbuja-preview">{preview.texto}</div>
                                )}
                                <div className="chat-burbuja-avatar">
                                    {chat.foto ? (
                                        <>
                                            <img src={'/assets/perfiles/' + chat.foto} alt=""
                                                onError={(e) => { e.target.style.display='none'; e.target.nextElementSibling.style.display='inline'; }} />
                                            <span style={{display:'none'}}>{chat.nombre.charAt(0)}</span>
                                        </>
                                    ) : (
                                        <span>{chat.nombre.charAt(0)}</span>
                                    )}
                                </div>
                                {conectados.has(chat.id_personal) && (
                                    <span className="chat-burbuja-online"></span>
                                )}
                                {noLeido > 0 && (
                                    <span className="chat-burbuja-badge">{noLeido}</span>
                                )}
                                <button
                                    className="chat-burbuja-cerrar"
                                    title="Cerrar"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        cerrarChat(chat.id_personal);
                                        if (esActiva) setBurbujaActivaId(null);
                                    }}
                                >&times;</button>
                            </div>
                        );
                    })}
                    {/* Ventana de chat activa en modo burbuja */}
                    {burbujaActivaId && chatsAbiertos.find(c => c.id_personal === burbujaActivaId) && (
                        <ChatVentana
                            key={burbujaActivaId}
                            contacto={chatsAbiertos.find(c => c.id_personal === burbujaActivaId)}
                            socket={socketRef.current}
                            onCerrar={() => { cerrarChat(burbujaActivaId); setBurbujaActivaId(null); }}
                            posicion={0}
                            enLinea={conectados.has(burbujaActivaId)}
                            panelAbierto={abierto}
                            modeBurbuja={true}
                            burbujaPos={getBurbujaPos(burbujaActivaId, chatsAbiertos.findIndex(c => c.id_personal === burbujaActivaId))}
                            onMinimizar={() => setBurbujaActivaId(null)}
                            noLeidosCount={noLeidos[burbujaActivaId] || 0}
                        />
                    )}
                    {/* Burbuja de Chat General */}
                    {chatGeneralAbierto && (() => {
                        const gIdx = chatsAbiertos.length;
                        const pos = getBurbujaPos('general', gIdx);
                        return (
                            <div
                                key="burbuja-general"
                                className={'chat-burbuja-item chat-burbuja-general' + (generalBurbujaActiva ? ' activa' : '')}
                                title="Chat General"
                                style={{ position: 'fixed', left: pos.x + 'px', top: pos.y + 'px', cursor: 'grab', zIndex: 9010 }}
                                onMouseDown={(e) => handleBurbujaMouseDown(e, 'general', gIdx, () => {
                                    setGeneralBurbujaActiva(prev => !prev);
                                })}
                            >
                                <div className="chat-burbuja-avatar chat-burbuja-avatar-general">
                                    <IconoFa icono={faGlobe} />
                                </div>
                                <button className="chat-burbuja-cerrar" title="Cerrar"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); setChatGeneralAbierto(false); setGeneralBurbujaActiva(false); }}
                                >&times;</button>
                            </div>
                        );
                    })()}
                    {/* Burbuja de Mi Espacio */}
                    {miEspacioAbierto && (() => {
                        const nIdx = chatsAbiertos.length + (chatGeneralAbierto ? 1 : 0);
                        const pos = getBurbujaPos('notas', nIdx);
                        return (
                            <div
                                key="burbuja-notas"
                                className={'chat-burbuja-item chat-burbuja-notas' + (notasBurbujaActiva ? ' activa' : '')}
                                title="Mi Espacio"
                                style={{ position: 'fixed', left: pos.x + 'px', top: pos.y + 'px', cursor: 'grab', zIndex: 9010 }}
                                onMouseDown={(e) => handleBurbujaMouseDown(e, 'notas', nIdx, () => {
                                    setNotasBurbujaActiva(prev => !prev);
                                })}
                            >
                                <div className="chat-burbuja-avatar chat-burbuja-avatar-notas">
                                    <IconoFa icono={faStickyNote} />
                                </div>
                                <button className="chat-burbuja-cerrar" title="Cerrar"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); setMiEspacioAbierto(false); setNotasBurbujaActiva(false); }}
                                >&times;</button>
                            </div>
                        );
                    })()}
                    {/* Ventana Chat General activa en modo burbuja */}
                    {chatGeneralAbierto && generalBurbujaActiva && (
                        <ChatSala
                            tipo="general"
                            socket={socketRef.current}
                            onCerrar={() => { setChatGeneralAbierto(false); setGeneralBurbujaActiva(false); }}
                            panelAbierto={abierto}
                            posicion={0}
                            modeBurbuja={true}
                            burbujaPos={getBurbujaPos('general', chatsAbiertos.length)}
                            onMinimizar={() => setGeneralBurbujaActiva(false)}
                        />
                    )}
                    {/* Ventana Mi Espacio activa en modo burbuja */}
                    {miEspacioAbierto && notasBurbujaActiva && (
                        <MiEspacio
                            onCerrar={() => { setMiEspacioAbierto(false); setNotasBurbujaActiva(false); }}
                            panelAbierto={abierto}
                            posicion={0}
                            modeBurbuja={true}
                            burbujaPos={getBurbujaPos('notas', chatsAbiertos.length + (chatGeneralAbierto ? 1 : 0))}
                            onMinimizar={() => setNotasBurbujaActiva(false)}
                        />
                    )}
                </>
            )}

            {/* ── Ventanas de chat de grupo flotantes (solo modo burbuja/mobile) ── */}
            {(esMobile || modoBurbuja !== 'barra') && gruposAbiertos.map((grupo, idx) => {
                const baseOffset = (chatGeneralAbierto ? 1 : 0) + (miEspacioAbierto ? 1 : 0) + chatsAbiertos.length;
                return (
                <ChatSala
                    key={grupo.id}
                    tipo="grupo"
                    grupo={grupo}
                    socket={socketRef.current}
                    onCerrar={() => cerrarGrupo(grupo.id)}
                    posicion={baseOffset + idx}
                    panelAbierto={abierto}
                />
                );
            })}

            {/* ── Modal crear grupo ── */}
            {modalGrupo && (
                <CrearGrupoModal
                    contactos={contactos.filter(c => c.id_personal !== miIdPersonal)}
                    onCrear={handleCrearGrupo}
                    onCerrar={() => setModalGrupo(false)}
                />
            )}
        </>
    );
}
