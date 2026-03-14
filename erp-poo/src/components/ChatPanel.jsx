import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import IconoFa from './IconoFa';
import ChatVentana from './ChatVentana';
import { faComments, faSearch, faTimes, faCircle, faMinus } from '@fortawesome/free-solid-svg-icons';
import { CHAT_URL, obtenerToken } from '../auth';
import '../styles/Chat.css';

/**
 * ChatPanel — Panel lateral de contactos + ventanas de chat flotantes.
 * Se monta en Dashboard.jsx de forma global.
 * Conecta al backend de chat (puerto 8001) vía Socket.IO.
 */
export default function ChatPanel() {
    const [abierto, setAbierto] = useState(false);
    const [contactos, setContactos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [chatsAbiertos, setChatsAbiertos] = useState([]);  // [{id_personal, nombre, foto, cargo}]
    const [noLeidos, setNoLeidos] = useState({});             // {id_personal: count}
    const [conectados, setConectados] = useState(new Set());
    const socketRef = useRef(null);
    const panelRef = useRef(null);
    const totalNoLeidos = Object.values(noLeidos).reduce((s, v) => s + v, 0);

    // ── Conectar Socket.IO ──
    useEffect(() => {
        const token = obtenerToken();
        console.log('[Chat] Init — token:', token ? 'OK(' + token.substring(0, 20) + '...)' : 'NULL');
        console.log('[Chat] Init — CHAT_URL:', CHAT_URL);
        if (!token) return;

        let socket;
        try {
            socket = io(CHAT_URL, {
                auth: { token },
                transports: ['polling', 'websocket'],
                reconnection: true,
                reconnectionDelay: 3000,
                reconnectionAttempts: 10,
            });
            console.log('[Chat] io() llamado OK, socket.id:', socket.id);
        } catch (err) {
            console.error('[Chat] Error creando socket:', err);
            return;
        }

        socket.on('connect', () => {
            console.log('[Chat] Socket CONECTADO, id:', socket.id);
            cargarContactos();
        });

        socket.on('connect_error', (err) => {
            console.error('[Chat] Error conexión:', err.message, err);
        });

        socket.on('usuario_conectado', (data) => {
            setConectados(prev => new Set([...prev, data.id_personal]));
        });

        socket.on('usuario_desconectado', (data) => {
            setConectados(prev => {
                const next = new Set(prev);
                next.delete(data.id_personal);
                return next;
            });
        });

        socket.on('mensaje_nuevo', (msg) => {
            // Si la ventana de ese contacto NO está abierta, incrementar no leídos
            setChatsAbiertos(prev => {
                const estaAbierto = prev.some(c => c.id_personal === msg.remitente_id);
                if (!estaAbierto) {
                    setNoLeidos(old => ({
                        ...old,
                        [msg.remitente_id]: (old[msg.remitente_id] || 0) + 1,
                    }));
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
                setNoLeidos(data.por_contacto || {});
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        cargarContactos();
        cargarNoLeidos();
        // Refrescar cada 30 segundos
        const interval = setInterval(() => {
            cargarContactos();
            cargarNoLeidos();
        }, 30000);
        return () => clearInterval(interval);
    }, [cargarContactos, cargarNoLeidos]);

    // ── Abrir ventana de chat con un contacto ──
    function abrirChat(contacto) {
        setChatsAbiertos(prev => {
            if (prev.some(c => c.id_personal === contacto.id_personal)) return prev;
            // Máximo 3 ventanas simultáneas
            const nuevos = [...prev, contacto];
            if (nuevos.length > 3) nuevos.shift();
            return nuevos;
        });
        // Limpiar no leídos de este contacto
        setNoLeidos(old => {
            const copia = { ...old };
            delete copia[contacto.id_personal];
            return copia;
        });
    }

    // ── Cerrar ventana de chat ──
    function cerrarChat(id_personal) {
        setChatsAbiertos(prev => prev.filter(c => c.id_personal !== id_personal));
    }

    // ── Filtrar contactos ──
    const session = JSON.parse(localStorage.getItem('session'));
    const miIdPersonal = session?.usuario?.id_personal;
    const contactosFiltrados = contactos.filter(c => {
        if (c.id_personal === miIdPersonal) return false;
        if (!busqueda) return true;
        return c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
               (c.cargo || '').toLowerCase().includes(busqueda.toLowerCase());
    });

    // Separar en línea / desconectados
    const enLinea = contactosFiltrados.filter(c => conectados.has(c.id_personal));
    const desconectados = contactosFiltrados.filter(c => !conectados.has(c.id_personal));

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
                                        <img src={c.foto} alt="" />
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
                                        <img src={c.foto} alt="" />
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
                </div>
            )}

            {/* ── Ventanas de chat flotantes ── */}
            {chatsAbiertos.map((chat, idx) => (
                <ChatVentana
                    key={chat.id_personal}
                    contacto={chat}
                    socket={socketRef.current}
                    onCerrar={() => cerrarChat(chat.id_personal)}
                    posicion={idx}
                    enLinea={conectados.has(chat.id_personal)}
                />
            ))}
        </>
    );
}
