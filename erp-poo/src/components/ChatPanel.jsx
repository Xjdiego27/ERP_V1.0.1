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
import '../styles/Chat.css';

// Sonido de notificación MSN para mensajes cuando chat no está abierto
const sonidoNotificacion = new Audio('/sounds/msn_messenger.mp3');
sonidoNotificacion.volume = 0.5;

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
    const socketRef = useRef(null);
    const panelRef = useRef(null);
    const totalNoLeidos = Object.values(noLeidos).reduce((s, v) => s + v, 0);

    // ── Detectar mobile/tablet ──
    useEffect(() => {
        function handleResize() {
            setEsMobile(window.innerWidth <= 1024);
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ── Conectar Socket.IO ──
    useEffect(() => {
        const token = obtenerToken();
        if (!token) return;

        const socket = io(CHAT_SOCKET_URL, {
            auth: { token },
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionDelay: 3000,
            reconnectionAttempts: 10,
        });

        socket.on('connect', () => {
            cargarContactos();
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
                return prev;
            });
        });

        // ── Zumbido: mover chat al inicio de la lista (estilo MSN) ──
        socket.on('zumbido', (data) => {
            setChatsAbiertos(prev => {
                const idx = prev.findIndex(c => c.id_personal === data.remitente_id);
                if (idx > 0) {
                    // Mover al inicio
                    const copia = [...prev];
                    const [chat] = copia.splice(idx, 1);
                    return [chat, ...copia];
                }
                return prev;
            });
        });

        socket.on('disconnect', () => {
            console.log('[Chat] Socket desconectado');
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
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

    // ── Abrir/cerrar grupo ──
    function abrirGrupo(grupo) {
        setGruposAbiertos(prev => {
            if (prev.some(g => g.id === grupo.id)) return prev;
            return [...prev, grupo];
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
                        onClick={() => setChatGeneralAbierto(true)}
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
                                            {c.foto ? (
                                                <img src={'/assets/perfiles/' + c.foto} alt="" />
                                            ) : (
                                                <div className="chat-avatar-placeholder">
                                                    {c.nombre.charAt(0)}
                                                </div>
                                            )}
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
                                            {c.foto ? (
                                                <img src={'/assets/perfiles/' + c.foto} alt="" />
                                            ) : (
                                                <div className="chat-avatar-placeholder">
                                                    {c.nombre.charAt(0)}
                                                </div>
                                            )}
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

            {/* ── Chat General flotante ── */}
            {chatGeneralAbierto && (
                <ChatSala
                    tipo="general"
                    socket={socketRef.current}
                    onCerrar={() => setChatGeneralAbierto(false)}
                    panelAbierto={abierto}
                    posicion={0}
                />
            )}

            {/* ── Mi Espacio flotante ── */}
            {miEspacioAbierto && (
                <MiEspacio
                    onCerrar={() => setMiEspacioAbierto(false)}
                    panelAbierto={abierto}
                    posicion={(chatGeneralAbierto ? 1 : 0)}
                />
            )}

            {/* ── Ventanas de chat individual flotantes ── */}
            {esMobile ? (
                <>
                    {/* Burbujas tipo Messenger */}
                    <div className="chat-heads-container">
                        {chatsAbiertos.map((chat, idx) => {
                            const esActivo = chatActivoMobile === chat.id_personal;
                            return (
                                <div
                                    key={chat.id_personal}
                                    className={'chat-head' + (esActivo ? ' chat-head-activo' : '') + (noLeidos[chat.id_personal] ? ' chat-head-noleido' : '')}
                                    onClick={() => setChatActivoMobile(esActivo ? null : chat.id_personal)}
                                    title={chat.nombre}
                                >
                                    {chat.foto ? (
                                        <img src={'/assets/perfiles/' + chat.foto} alt="" />
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
                        />
                    )}
                </>
            ) : (
                chatsAbiertos.map((chat, idx) => {
                    const baseOffset = (chatGeneralAbierto ? 1 : 0) + (miEspacioAbierto ? 1 : 0);
                    return (
                    <ChatVentana
                        key={chat.id_personal}
                        contacto={chat}
                        socket={socketRef.current}
                        onCerrar={() => cerrarChat(chat.id_personal)}
                        posicion={baseOffset + idx}
                        enLinea={conectados.has(chat.id_personal)}
                        panelAbierto={abierto}
                    />
                    );
                })
            )}

            {/* ── Ventanas de chat de grupo flotantes ── */}
            {gruposAbiertos.map((grupo, idx) => {
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
