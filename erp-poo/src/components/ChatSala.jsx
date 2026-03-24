import { useState, useEffect, useRef, useCallback } from 'react';
import IconoFa from './IconoFa';
import StickerPicker from './StickerPicker';
import { faTimes, faPaperPlane, faMinus, faExpand, faFaceSmile, faGlobe, faUsers, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { CHAT_URL, obtenerToken } from '../auth';
import { getSession } from '../utils/session';
import { formatHora, subirArchivo, renderContenidoMensaje } from '../utils/chatUtils';
import { buildStickerToken, parseStickerToken } from '../data/stickerCatalog';

const sonidoMensaje = new Audio('/sounds/msn_messenger.mp3');
sonidoMensaje.volume = 0.5;

/**
 * ChatSala — Componente unificado para Chat General y Chat de Grupo.
 *
 * Props:
 *   tipo        'general' | 'grupo'
 *   grupo       { id, nombre }          (solo para tipo='grupo')
 *   socket      Socket.IO instance
 *   onCerrar    callback al cerrar
 *   posicion    offset numérico          (solo para tipo='grupo')
 *   panelAbierto  boolean
 */
export default function ChatSala({ tipo = 'general', grupo, socket, onCerrar, posicion = 0, panelAbierto }) {
    const [mensajes, setMensajes] = useState([]);
    const [texto, setTexto] = useState('');
    const [cargando, setCargando] = useState(true);
    const [minimizada, setMinimizada] = useState(false);
    const [pickerAbierto, setPickerAbierto] = useState(false);
    const chatBodyRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    const session = getSession();
    const miIdPersonal = session?.usuario?.id_personal;

    // ── Config por tipo ──
    const esGeneral = tipo === 'general';
    const salaId = esGeneral ? null : grupo?.id;
    const nombreSala = esGeneral ? '💬 Chat General' : `👥 ${grupo?.nombre || 'Grupo'}`;
    const icono = esGeneral ? faGlobe : faUsers;
    const claseHeader = esGeneral ? 'chat-ventana-header-general' : 'chat-ventana-header-grupo';
    const claseVentana = esGeneral ? 'chat-ventana-general' : 'chat-ventana-grupo';
    const claseIcono = esGeneral ? 'chat-general-icono' : 'chat-grupo-icono';
    const placeholder = esGeneral ? 'Escribe al chat general...' : `Escribe en ${grupo?.nombre || 'grupo'}...`;
    const mensajeVacio = esGeneral
        ? 'No hay mensajes en el chat general. ¡Sé el primero!'
        : 'No hay mensajes en este grupo. ¡Comienza la conversación!';

    // Socket event names
    const eventoEmit = esGeneral ? 'msg_general' : 'msg_grupo';
    const eventoListen = esGeneral ? 'msg_general' : 'msg_grupo';

    // ── Cargar historial ──
    const cargarHistorial = useCallback(() => {
        const token = obtenerToken();
        if (!token) return;
        const url = esGeneral
            ? CHAT_URL + '/mensajes/general?limite=80'
            : CHAT_URL + `/grupos/${salaId}/mensajes?limite=80`;
        fetch(url, { headers: { 'Authorization': 'Bearer ' + token } })
            .then(r => r.ok ? r.json() : [])
            .then(data => { setMensajes(data); setCargando(false); })
            .catch(() => setCargando(false));
    }, [esGeneral, salaId]);

    useEffect(() => { cargarHistorial(); }, [cargarHistorial]);

    // ── Unirse a la sala ──
    useEffect(() => {
        if (!socket) return;
        if (esGeneral) {
            socket.emit('join_general');
        } else {
            socket.emit('join_grupo', { grupo_id: salaId });
        }
    }, [socket, esGeneral, salaId]);

    // ── Escuchar mensajes ──
    useEffect(() => {
        if (!socket) return;
        function onMsg(msg) {
            // Para grupo, filtrar solo mensajes de esta sala
            if (!esGeneral && msg.grupo_id !== salaId) return;
            setMensajes(prev => [...prev, msg]);
            // Sonido (en general siempre, en grupo solo si no es mío)
            if (esGeneral || msg.remitente_id !== miIdPersonal) {
                sonidoMensaje.currentTime = 0;
                sonidoMensaje.play().catch(() => {});
            }
        }
        socket.on(eventoListen, onMsg);
        return () => { socket.off(eventoListen, onMsg); };
    }, [socket, esGeneral, salaId, miIdPersonal, eventoListen]);

    // ── Auto-scroll ──
    useEffect(() => {
        if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }, [mensajes]);

    // ── Enviar mensaje ──
    function enviarContenido(contenido) {
        if (!contenido || !socket) return;
        const payload = esGeneral
            ? { contenido }
            : { grupo_id: salaId, contenido };
        socket.emit(eventoEmit, payload, (resp) => {
            if (resp?.ok && resp.mensaje) {
                setMensajes(prev => [...prev, resp.mensaje]);
            }
        });
    }

    function enviarMensaje(e) {
        e.preventDefault();
        const contenido = texto.trim();
        if (!contenido) return;
        enviarContenido(contenido);
        setTexto('');
        inputRef.current?.focus();
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
        try {
            const data = await subirArchivo(file);
            if (data.ok) {
                const esImg = file.type.startsWith('image/');
                const payload = esGeneral
                    ? {
                        contenido: esImg ? `📷 ${data.nombre_original}` : `📎 ${data.nombre_original}`,
                        tipo: 'archivo',
                        archivo_url: data.url,
                        archivo_nombre: data.nombre_original,
                    }
                    : {
                        grupo_id: salaId,
                        contenido: esImg ? `📷 ${data.nombre_original}` : `📎 ${data.nombre_original}`,
                        tipo: 'archivo',
                        archivo_url: data.url,
                        archivo_nombre: data.nombre_original,
                    };
                socket.emit(eventoEmit, payload, (resp2) => {
                    if (resp2?.ok && resp2.mensaje) {
                        setMensajes(prev => [...prev, resp2.mensaje]);
                    }
                });
            }
        } catch (err) {
            console.error('Error al subir archivo:', err);
        }
        e.target.value = '';
    }

    const offsetRight = (panelAbierto ? 400 : 80) + posicion * 330;

    return (
        <div className={'chat-ventana ' + claseVentana + (minimizada ? ' chat-ventana-minimizada' : '')} style={{ right: offsetRight + 'px' }}>
            {/* ── Header ── */}
            <div
                className={'chat-ventana-header ' + claseHeader}
                onClick={(e) => { if (minimizada && !e.target.closest('button')) setMinimizada(false); }}
                style={{ cursor: minimizada ? 'pointer' : 'default' }}
            >
                <div className="chat-ventana-header-info">
                    <div className={'chat-ventana-avatar-mini ' + claseIcono}>
                        <IconoFa icono={icono} />
                    </div>
                    <div className="chat-ventana-nombre">
                        <strong>{nombreSala}</strong>
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
                            <p className="chat-sin-mensajes">{mensajeVacio}</p>
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
                        <input ref={inputRef} type="text" placeholder={placeholder} value={texto} onChange={e => setTexto(e.target.value)} autoFocus />
                        <button type="submit" disabled={!texto.trim()}>
                            <IconoFa icono={faPaperPlane} />
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}
