import { useState, useEffect, useRef, useCallback } from 'react';
import IconoFa from './IconoFa';
import StickerPicker from './StickerPicker';
import { faTimes, faPaperPlane, faMinus, faExpand, faFaceSmile, faHandPointUp, faGlobe, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { CHAT_URL, obtenerToken } from '../auth';
import { buildStickerToken, parseStickerToken } from '../data/stickerCatalog';

const sonidoMensaje = new Audio('/sounds/msn_messenger.mp3');
sonidoMensaje.volume = 0.5;

/**
 * ChatGeneral — Ventana de chat global donde todos los usuarios participan.
 */
export default function ChatGeneral({ socket, onCerrar, panelAbierto }) {
    const [mensajes, setMensajes] = useState([]);
    const [texto, setTexto] = useState('');
    const [cargando, setCargando] = useState(true);
    const [minimizada, setMinimizada] = useState(false);
    const [pickerAbierto, setPickerAbierto] = useState(false);
    const chatBodyRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    const session = JSON.parse(localStorage.getItem('session'));
    const miIdPersonal = session?.usuario?.id_personal;

    // ── Cargar historial ──
    const cargarHistorial = useCallback(() => {
        const token = obtenerToken();
        if (!token) return;
        fetch(CHAT_URL + '/mensajes/general?limite=80', {
            headers: { 'Authorization': 'Bearer ' + token },
        })
            .then(r => r.ok ? r.json() : [])
            .then(data => { setMensajes(data); setCargando(false); })
            .catch(() => setCargando(false));
    }, []);

    useEffect(() => { cargarHistorial(); }, [cargarHistorial]);

    // ── Unirse a la sala general ──
    useEffect(() => {
        if (!socket) return;
        socket.emit('join_general');
    }, [socket]);

    // ── Escuchar mensajes ──
    useEffect(() => {
        if (!socket) return;
        function onMsgGeneral(msg) {
            setMensajes(prev => [...prev, msg]);
            sonidoMensaje.currentTime = 0;
            sonidoMensaje.play().catch(() => {});
        }
        socket.on('msg_general', onMsgGeneral);
        return () => { socket.off('msg_general', onMsgGeneral); };
    }, [socket]);

    // ── Auto-scroll ──
    useEffect(() => {
        if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }, [mensajes]);

    // ── Enviar mensaje ──
    function enviarMensaje(e) {
        e.preventDefault();
        const contenido = texto.trim();
        if (!contenido || !socket) return;
        socket.emit('msg_general', { contenido }, (resp) => {
            if (resp && resp.ok && resp.mensaje) {
                setMensajes(prev => [...prev, resp.mensaje]);
            }
        });
        setTexto('');
        inputRef.current?.focus();
    }

    function enviarContenido(contenido) {
        if (!contenido || !socket) return;
        socket.emit('msg_general', { contenido }, (resp) => {
            if (resp && resp.ok && resp.mensaje) {
                setMensajes(prev => [...prev, resp.mensaje]);
            }
        });
    }

    function insertarEmoji(emoji) {
        setTexto(prev => prev + emoji);
        setPickerAbierto(false);
        inputRef.current?.focus();
    }

    function enviarSticker(sticker) {
        enviarContenido(buildStickerToken(sticker.id));
        setPickerAbierto(false);
    }

    // ── Adjuntar archivo ──
    async function handleFileUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const token = obtenerToken();
        const formData = new FormData();
        formData.append('file', file);
        try {
            const resp = await fetch(CHAT_URL + '/upload', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                body: formData,
            });
            const data = await resp.json();
            if (data.ok) {
                const esImagen = file.type.startsWith('image/');
                socket.emit('msg_general', {
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
        e.target.value = '';
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

    function renderContenidoMensaje(m) {
        // Archivo adjunto
        if (m.tipo === 'archivo' && m.archivo_url) {
            const esImagen = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(m.archivo_url);
            if (esImagen) {
                return (
                    <div className="chat-msg-archivo">
                        <a href={CHAT_URL + m.archivo_url} target="_blank" rel="noopener noreferrer">
                            <img src={CHAT_URL + m.archivo_url} alt={m.archivo_nombre} className="chat-msg-img-preview" />
                        </a>
                        <span className="chat-msg-archivo-nombre">{m.archivo_nombre}</span>
                    </div>
                );
            }
            return (
                <div className="chat-msg-archivo">
                    <a href={CHAT_URL + m.archivo_url} target="_blank" rel="noopener noreferrer" className="chat-msg-file-link">
                        📎 {m.archivo_nombre}
                    </a>
                </div>
            );
        }
        const sticker = parseStickerToken(m.contenido);
        if (sticker) {
            return <img src={sticker.img} alt={sticker.label} className="chat-msg-sticker" />;
        }
        return <span className="chat-msg-texto">{m.contenido}</span>;
    }

    const offsetRight = panelAbierto ? 400 : 80;

    return (
        <div className={'chat-ventana chat-ventana-general' + (minimizada ? ' chat-ventana-minimizada' : '')} style={{ right: offsetRight + 'px' }}>
            {/* ── Header ── */}
            <div
                className="chat-ventana-header chat-ventana-header-general"
                onClick={(e) => { if (minimizada && !e.target.closest('button')) setMinimizada(false); }}
                style={{ cursor: minimizada ? 'pointer' : 'default' }}
            >
                <div className="chat-ventana-header-info">
                    <div className="chat-ventana-avatar-mini chat-general-icono">
                        <IconoFa icono={faGlobe} />
                    </div>
                    <div className="chat-ventana-nombre">
                        <strong>💬 Chat General</strong>
                    </div>
                </div>
                <div className="chat-ventana-acciones" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setMinimizada(!minimizada)} title={minimizada ? 'Expandir' : 'Minimizar'}>
                        <IconoFa icono={minimizada ? faExpand : faMinus} />
                    </button>
                    <button onClick={onCerrar} title="Cerrar">
                        <IconoFa icono={faTimes} />
                    </button>
                </div>
            </div>

            {/* ── Cuerpo ── */}
            {!minimizada && (
                <>
                    <div className="chat-ventana-body" ref={chatBodyRef}>
                        {cargando ? (
                            <p className="chat-cargando">Cargando mensajes...</p>
                        ) : mensajes.length === 0 ? (
                            <p className="chat-sin-mensajes">No hay mensajes en el chat general. ¡Sé el primero!</p>
                        ) : (
                            mensajes.map((m, idx) => {
                                const esMio = m.remitente_id === miIdPersonal;
                                const esSticker = !!parseStickerToken(m.contenido);
                                return (
                                    <div key={m.id || idx} className={'chat-msg ' + (esMio ? 'mio' : 'suyo')}>
                                        {!esMio && (
                                            <div className="chat-ventana-avatar-mini">
                                                <span>{(m.nombre_remitente || '?').charAt(0)}</span>
                                            </div>
                                        )}
                                        <div className="chat-msg-contenido">
                                            {!esMio && <strong className="chat-msg-nombre">{(m.nombre_remitente || '').split(' ')[0]}</strong>}
                                            <div className={'chat-msg-burbuja' + (esSticker ? ' chat-msg-burbuja-sticker' : '')}>
                                                {renderContenidoMensaje(m)}
                                                <span className="chat-msg-hora">{formatHora(m.fecha)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* ── Input ── */}
                    <form className="chat-ventana-input" onSubmit={enviarMensaje}>
                        <div className="chat-ventana-tools">
                            <button type="button" className={'chat-tool-button' + (pickerAbierto ? ' active' : '')} title="Stickers y emojis" onClick={() => setPickerAbierto(prev => !prev)}>
                                <IconoFa icono={faFaceSmile} />
                            </button>
                            <button type="button" className="chat-tool-button" title="Adjuntar archivo" onClick={() => fileInputRef.current?.click()}>
                                <IconoFa icono={faPaperclip} />
                            </button>
                            <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                            {pickerAbierto && (
                                <StickerPicker onSelectEmoji={insertarEmoji} onSelectSticker={enviarSticker} onClose={() => setPickerAbierto(false)} />
                            )}
                        </div>
                        <input ref={inputRef} type="text" placeholder="Escribe al chat general..." value={texto} onChange={e => setTexto(e.target.value)} autoFocus />
                        <button type="submit" disabled={!texto.trim()}>
                            <IconoFa icono={faPaperPlane} />
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}
