import { useState, useEffect, useRef, useCallback } from 'react';
import IconoFa from './IconoFa';
import { faTimes, faPaperPlane, faCircle, faMinus, faExpand, faCompress } from '@fortawesome/free-solid-svg-icons';
import { CHAT_URL, obtenerToken } from '../auth';

/**
 * ChatVentana — Ventana de chat individual flotante.
 * Se comunica vía Socket.IO (recibido desde ChatPanel).
 */
export default function ChatVentana({ contacto, socket, onCerrar, posicion, enLinea }) {
    const [mensajes, setMensajes] = useState([]);
    const [texto, setTexto] = useState('');
    const [cargando, setCargando] = useState(true);
    const [escribiendo, setEscribiendo] = useState(false);
    const [minimizada, setMinimizada] = useState(false);
    const chatBodyRef = useRef(null);
    const inputRef = useRef(null);
    const escribiendoTimer = useRef(null);

    // Mi ID_PERSONAL
    const session = JSON.parse(localStorage.getItem('session'));
    const miIdPersonal = session?.usuario?.id_personal;

    // ── Cargar historial ──
    const cargarHistorial = useCallback(() => {
        const token = obtenerToken();
        if (!token) return;

        fetch(CHAT_URL + '/mensajes/' + contacto.id_personal + '?limite=80', {
            headers: { 'Authorization': 'Bearer ' + token },
        })
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                setMensajes(data);
                setCargando(false);
            })
            .catch(() => setCargando(false));
    }, [contacto.id_personal]);

    useEffect(() => {
        cargarHistorial();
    }, [cargarHistorial]);

    // ── Escuchar mensajes entrantes vía Socket ──
    useEffect(() => {
        if (!socket) return;

        function onMensajeNuevo(msg) {
            // Solo agregar si es de/para este contacto
            if (msg.remitente_id === contacto.id_personal || msg.destinatario_id === contacto.id_personal) {
                setMensajes(prev => [...prev, msg]);
            }
        }

        function onEscribiendo(data) {
            if (data.remitente_id === contacto.id_personal) {
                setEscribiendo(true);
                clearTimeout(escribiendoTimer.current);
                escribiendoTimer.current = setTimeout(() => setEscribiendo(false), 2000);
            }
        }

        socket.on('mensaje_nuevo', onMensajeNuevo);
        socket.on('escribiendo', onEscribiendo);

        return () => {
            socket.off('mensaje_nuevo', onMensajeNuevo);
            socket.off('escribiendo', onEscribiendo);
        };
    }, [socket, contacto.id_personal]);

    // ── Auto-scroll al final ──
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [mensajes, escribiendo]);

    // ── Enviar mensaje ──
    function enviarMensaje(e) {
        e.preventDefault();
        const contenido = texto.trim();
        if (!contenido || !socket) return;

        socket.emit('enviar_mensaje', {
            destinatario_id: contacto.id_personal,
            contenido: contenido,
        }, (resp) => {
            if (resp && resp.ok && resp.mensaje) {
                setMensajes(prev => [...prev, resp.mensaje]);
            }
        });

        setTexto('');
        inputRef.current?.focus();
    }

    // ── Notificar que estoy escribiendo ──
    function handleInput(e) {
        setTexto(e.target.value);
        if (socket) {
            socket.emit('escribiendo', { destinatario_id: contacto.id_personal });
        }
    }

    // ── Formato hora ──
    function formatHora(fecha) {
        if (!fecha) return '';
        const d = new Date(fecha);
        const hoy = new Date();
        const esHoy = d.toDateString() === hoy.toDateString();
        const hora = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        if (esHoy) return hora;
        return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }) + ' ' + hora;
    }

    // Posición de la ventana
    const offsetRight = 380 + posicion * 330;

    return (
        <div
            className={'chat-ventana' + (minimizada ? ' chat-ventana-minimizada' : '')}
            style={{ right: offsetRight + 'px' }}
        >
            {/* ── Header de la ventana ── */}
            <div className="chat-ventana-header" onDoubleClick={() => setMinimizada(!minimizada)}>
                <div className="chat-ventana-header-info">
                    <div className="chat-ventana-avatar-mini">
                        {contacto.foto ? (
                            <img src={contacto.foto} alt="" />
                        ) : (
                            <span>{contacto.nombre.charAt(0)}</span>
                        )}
                        <span className={'chat-status-mini ' + (enLinea ? 'online' : 'offline-dot')}>
                            <IconoFa icono={faCircle} />
                        </span>
                    </div>
                    <div className="chat-ventana-nombre">
                        <strong>{contacto.nombre.split(' ').slice(0, 2).join(' ')}</strong>
                        {escribiendo && <span className="chat-escribiendo">escribiendo...</span>}
                    </div>
                </div>
                <div className="chat-ventana-acciones">
                    <button onClick={() => setMinimizada(!minimizada)} title={minimizada ? 'Expandir' : 'Minimizar'}>
                        <IconoFa icono={minimizada ? faExpand : faMinus} />
                    </button>
                    <button onClick={onCerrar} title="Cerrar">
                        <IconoFa icono={faTimes} />
                    </button>
                </div>
            </div>

            {/* ── Cuerpo del chat ── */}
            {!minimizada && (
                <>
                    <div className="chat-ventana-body" ref={chatBodyRef}>
                        {cargando ? (
                            <p className="chat-cargando">Cargando mensajes...</p>
                        ) : mensajes.length === 0 ? (
                            <p className="chat-sin-mensajes">No hay mensajes aún. ¡Saluda!</p>
                        ) : (
                            mensajes.map((m, idx) => {
                                const esMio = m.remitente_id === miIdPersonal;
                                return (
                                    <div key={m.id || idx} className={'chat-msg ' + (esMio ? 'chat-msg-mio' : 'chat-msg-otro')}>
                                        <div className="chat-msg-burbuja">
                                            <span className="chat-msg-texto">{m.contenido}</span>
                                            <span className="chat-msg-hora">{formatHora(m.fecha)}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {escribiendo && (
                            <div className="chat-msg chat-msg-otro">
                                <div className="chat-msg-burbuja chat-escribiendo-burbuja">
                                    <span className="chat-dots">
                                        <span></span><span></span><span></span>
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Input de mensaje ── */}
                    <form className="chat-ventana-input" onSubmit={enviarMensaje}>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Escribe un mensaje..."
                            value={texto}
                            onChange={handleInput}
                            autoFocus
                        />
                        <button type="submit" disabled={!texto.trim()}>
                            <IconoFa icono={faPaperPlane} />
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}
