import { useState, useEffect, useRef, useCallback } from 'react';
import IconoFa from './IconoFa';
import StickerPicker from './StickerPicker';
import { faTimes, faPaperPlane, faCircle, faMinus, faExpand, faFaceSmile, faBolt, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { CHAT_URL, obtenerToken } from '../auth';
import { getSession } from '../utils/session';
import { formatHora as formatHoraUtil, subirArchivo as subirArchivoUtil, renderContenidoMensaje } from '../utils/chatUtils';
import { buildStickerToken, parseStickerToken } from '../data/stickerCatalog';

// ── Sonidos MSN ──
const sonidoMensaje = new Audio('/sounds/msn_messenger.mp3');
const sonidoZumbido = new Audio('/sounds/msn_zumbido.mp3');
sonidoMensaje.volume = 0.5;
sonidoZumbido.volume = 0.7;

// ── Notificación en pestaña del navegador ──
const TITULO_ORIGINAL = document.title;
let tituloInterval = null;

function parpadearTitulo(texto) {
    if (tituloInterval) return; // ya parpadeando
    let visible = true;
    tituloInterval = setInterval(() => {
        document.title = visible ? texto : TITULO_ORIGINAL;
        visible = !visible;
    }, 800);
    // Detener al volver a la pestaña
    const detener = () => {
        clearInterval(tituloInterval);
        tituloInterval = null;
        document.title = TITULO_ORIGINAL;
        window.removeEventListener('focus', detener);
    };
    window.addEventListener('focus', detener);
}

/**
 * ChatVentana — Ventana de chat individual flotante.
 * Se comunica vía Socket.IO (recibido desde ChatPanel).
 */
export default function ChatVentana({ contacto, socket, onCerrar, posicion, enLinea, panelAbierto, modeMobile, onMinimizar }) {
    const [mensajes, setMensajes] = useState([]);
    const [texto, setTexto] = useState('');
    const [cargando, setCargando] = useState(true);
    const [escribiendo, setEscribiendo] = useState(false);
    const [minimizada, setMinimizada] = useState(false);
    const [pickerAbierto, setPickerAbierto] = useState(false);
    const [sacudiendo, setSacudiendo] = useState(false);
    const [arrastrando, setArrastrando] = useState(false);
    const chatBodyRef = useRef(null);
    const inputRef = useRef(null);
    const escribiendoTimer = useRef(null);
    const ventanaRef = useRef(null);
    const fileInputRef = useRef(null);

    // Mi ID_PERSONAL
    const session = getSession();
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
                // Sonido de mensaje entrante si es del otro usuario
                if (msg.remitente_id === contacto.id_personal) {
                    sonidoMensaje.currentTime = 0;
                    sonidoMensaje.play().catch(() => {});
                    if (document.hidden) {
                        parpadearTitulo(`💬 ${contacto.nombre.split(' ')[0]} te envió un mensaje`);
                    }
                    // Marcar como leído en el servidor (la ventana está abierta)
                    const token = obtenerToken();
                    if (token) {
                        fetch(CHAT_URL + '/marcar-leidos/' + contacto.id_personal, {
                            method: 'POST',
                            headers: { 'Authorization': 'Bearer ' + token },
                        }).catch(() => {});
                    }
                }
            }
        }

        function onEscribiendo(data) {
            if (data.remitente_id === contacto.id_personal) {
                setEscribiendo(true);
                clearTimeout(escribiendoTimer.current);
                escribiendoTimer.current = setTimeout(() => setEscribiendo(false), 2000);
            }
        }

        function onZumbido(data) {
            if (data.remitente_id === contacto.id_personal) {
                // Reproducir sonido de zumbido
                sonidoZumbido.currentTime = 0;
                sonidoZumbido.play().catch(() => {});
                // Activar animación de sacudida
                setSacudiendo(true);
                setTimeout(() => setSacudiendo(false), 600);
                // Expandir si estaba minimizada
                setMinimizada(false);
                // Notificar en pestaña
                parpadearTitulo(`¡${data.nombre_remitente} te envió un zumbido!`);
                // Agregar mensaje de sistema
                setMensajes(prev => [...prev, {
                    _tipo: 'zumbido',
                    remitente_id: data.remitente_id,
                    contenido: `${data.nombre_remitente.split(' ')[0]} te envió un zumbido`,
                    fecha: new Date().toISOString(),
                }]);
            }
        }

        socket.on('mensaje_nuevo', onMensajeNuevo);
        socket.on('escribiendo', onEscribiendo);
        socket.on('zumbido', onZumbido);

        return () => {
            socket.off('mensaje_nuevo', onMensajeNuevo);
            socket.off('escribiendo', onEscribiendo);
            socket.off('zumbido', onZumbido);
        };
    }, [socket, contacto.id_personal]);

    // ── Auto-scroll al final ──
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [mensajes, escribiendo]);

    // ── Enviar mensaje ──
    function enviarContenido(contenido, onSuccess) {
        if (!contenido || !socket) return;

        socket.emit('enviar_mensaje', {
            destinatario_id: contacto.id_personal,
            contenido: contenido,
        }, (resp) => {
            if (resp && resp.ok && resp.mensaje) {
                setMensajes(prev => [...prev, resp.mensaje]);
                if (onSuccess) onSuccess();
            }
        });
    }

    function enviarMensaje(e) {
        e.preventDefault();
        const contenido = texto.trim();
        enviarContenido(contenido, () => {
            setTexto('');
            inputRef.current?.focus();
        });
    }

    function insertarEmoji(emoji) {
        setTexto(prev => prev + emoji);
        setPickerAbierto(false);
        inputRef.current?.focus();
    }

    function enviarSticker(sticker) {
        enviarContenido(buildStickerToken(sticker.id), () => {
            setPickerAbierto(false);
        });
    }

    // ── Enviar zumbido ──
    function enviarZumbido() {
        if (!socket) return;
        socket.emit('zumbido', { destinatario_id: contacto.id_personal });
        // Efecto local también
        sonidoZumbido.currentTime = 0;
        sonidoZumbido.play().catch(() => {});
        setSacudiendo(true);
        setTimeout(() => setSacudiendo(false), 600);
        setMensajes(prev => [...prev, {
            _tipo: 'zumbido',
            remitente_id: miIdPersonal,
            contenido: 'Has enviado un zumbido',
            fecha: new Date().toISOString(),
        }]);
    }

    // ── Subir archivo (reutilizable para input y drag & drop) ──
    async function handleSubirArchivo(file) {
        if (!file || !socket) return;
        try {
            const data = await subirArchivoUtil(file);
            if (data.ok) {
                const esImagen = file.type.startsWith('image/');
                socket.emit('enviar_mensaje', {
                    destinatario_id: contacto.id_personal,
                    contenido: esImagen ? `📷 ${data.nombre_original}` : `📎 ${data.nombre_original}`,
                    tipo: 'archivo',
                    archivo_url: data.url,
                    archivo_nombre: data.nombre_original,
                }, (resp2) => {
                    if (resp2 && resp2.ok && resp2.mensaje) {
                        setMensajes(prev => [...prev, resp2.mensaje]);
                    }
                });
            }
        } catch (err) {
            console.error('Error al subir archivo:', err);
        }
    }

    // ── Adjuntar archivo (input file) ──
    async function handleFileUpload(e) {
        const file = e.target.files?.[0];
        await handleSubirArchivo(file);
        e.target.value = '';
    }

    // ── Drag & Drop ──
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        setArrastrando(true);
    }
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        setArrastrando(false);
    }
    async function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        setArrastrando(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) await handleSubirArchivo(file);
    }

    // ── Notificar que estoy escribiendo ──
    function handleInput(e) {
        setTexto(e.target.value);
        if (socket) {
            socket.emit('escribiendo', { destinatario_id: contacto.id_personal });
        }
    }

    // ── Formato hora (usa util compartido) ──
    const formatHora = formatHoraUtil;

    // Posición de la ventana
    const offsetRight = modeMobile ? 0 : (panelAbierto ? 400 : 80) + posicion * 330;

    // Clase mobile
    const clasesMobile = modeMobile ? ' chat-ventana-mobile' : '';

    return (
        <div
            ref={ventanaRef}
            className={'chat-ventana' + clasesMobile + (minimizada ? ' chat-ventana-minimizada' : '') + (sacudiendo ? ' chat-ventana-zumbido' : '')}
            style={modeMobile ? {} : { right: offsetRight + 'px' }}
        >
            {/* ── Header de la ventana ── */}
            <div 
                className="chat-ventana-header"
                onClick={(e) => {
                    if (minimizada && !e.target.closest('button')) {
                        setMinimizada(false);
                    }
                }}
                style={{ cursor: minimizada ? 'pointer' : 'default' }}
            >
                <div className="chat-ventana-header-info">
                    <div className="chat-ventana-avatar-mini">
                        {contacto.foto ? (
                            <img src={'/assets/perfiles/' + contacto.foto} alt="" />
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
                <div className="chat-ventana-acciones" onClick={(e) => e.stopPropagation()}>
                    <button onClick={enviarZumbido} title="Enviar zumbido" className="chat-btn-zumbido-header">
                        <IconoFa icono={faBolt} />
                    </button>
                    <button onClick={() => modeMobile && onMinimizar ? onMinimizar() : setMinimizada(!minimizada)} title={minimizada ? 'Expandir' : 'Minimizar'}>
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
                    <div
                        className={'chat-ventana-body' + (arrastrando ? ' chat-drop-active' : '')}
                        ref={chatBodyRef}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {arrastrando && (
                            <div className="chat-drop-overlay">
                                <span>📁 Suelta el archivo aquí</span>
                            </div>
                        )}
                        {cargando ? (
                            <p className="chat-cargando">Cargando mensajes...</p>
                        ) : mensajes.length === 0 ? (
                            <p className="chat-sin-mensajes">No hay mensajes aún. ¡Saluda!</p>
                        ) : (
                            mensajes.map((m, idx) => {
                                // Mensaje de sistema (zumbido)
                                if (m._tipo === 'zumbido') {
                                    return (
                                        <div key={idx} className="chat-msg-sistema chat-msg-zumbido">
                                            <span><IconoFa icono={faBolt} /> {m.contenido}</span>
                                        </div>
                                    );
                                }
                                const esMio = m.remitente_id === miIdPersonal;
                                const esSticker = !!parseStickerToken(m.contenido);
                                return (
                                    <div key={idx} className={'chat-msg ' + (esMio ? 'mio' : 'suyo')}>
                                        {!esMio && (
                                            <div className="chat-ventana-avatar-mini">
                                                {contacto.foto ? (
                                                    <img src={'/assets/perfiles/' + contacto.foto} alt="" />
                                                ) : (
                                                    <span>{contacto.nombre.charAt(0)}</span>
                                                )}
                                            </div>
                                        )}
                                        <div className="chat-msg-contenido">
                                            {!esMio && <strong className="chat-msg-nombre">{contacto.nombre.split(' ')[0]}</strong>}
                                            <div className={'chat-msg-burbuja' + (esSticker ? ' chat-msg-burbuja-sticker' : '')}>
                                                {renderContenidoMensaje(m, true)}
                                                <span className="chat-msg-hora">{formatHora(m.fecha || m.fecha_creacion)}</span>
                                            </div>
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
                        <div className="chat-ventana-tools">
                            <button
                                type="button"
                                className={'chat-tool-button' + (pickerAbierto ? ' active' : '')}
                                title="Stickers y emojis"
                                onClick={() => setPickerAbierto(prev => !prev)}
                            >
                                <IconoFa icono={faFaceSmile} />
                            </button>
                            <button
                                type="button"
                                className="chat-tool-button"
                                title="Adjuntar archivo"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <IconoFa icono={faPaperclip} />
                            </button>
                            <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                            {pickerAbierto && (
                                <StickerPicker
                                    onSelectEmoji={insertarEmoji}
                                    onSelectSticker={enviarSticker}
                                    onClose={() => setPickerAbierto(false)}
                                />
                            )}
                        </div>
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
