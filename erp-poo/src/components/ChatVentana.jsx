import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import IconoFa from './IconoFa';
import StickerPicker from './StickerPicker';
import ModalImagen from './ModalImagen';
import { faTimes, faPaperPlane, faCircle, faMinus, faExpand, faFaceSmile, faBolt, faPaperclip, faCheck, faCheckDouble, faEnvelope, faPhone, faBriefcase, faBuilding, faCopy, faMobileAlt } from '@fortawesome/free-solid-svg-icons';
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
let tituloListenerCount = 0;

function parpadearTitulo(texto) {
    if (tituloInterval) return; // ya parpadeando
    let visible = true;
    tituloListenerCount++;
    tituloInterval = setInterval(() => {
        document.title = visible ? texto : TITULO_ORIGINAL;
        visible = !visible;
    }, 800);
    // Detener al volver a la pestaña
    const detener = () => {
        if (tituloInterval) {
            clearInterval(tituloInterval);
            tituloInterval = null;
        }
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
    const [imagenExpandida, setImagenExpandida] = useState(null);
    const [perfilAbierto, setPerfilAbierto] = useState(false);
    const [datosPerfil, setDatosPerfil] = useState(null);
    const [cargandoPerfil, setCargandoPerfil] = useState(false);
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
                // Notificar al remitente que leimos sus mensajes
                if (socket) {
                    socket.emit('marcar_visto', { contacto_id: contacto.id_personal });
                }
            })
            .catch(() => setCargando(false));
    }, [contacto.id_personal, socket]);

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
                        parpadearTitulo(`${contacto.nombre.split(' ')[0]} te envio un mensaje`);
                    }
                    // Marcar como leído via socket (la ventana está abierta)
                    socket.emit('marcar_visto', { contacto_id: contacto.id_personal });
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

        function onMensajeVisto(data) {
            // El otro usuario leyó nuestros mensajes
            if (data.lector_id === contacto.id_personal) {
                setMensajes(prev => prev.map(m => {
                    if (m.remitente_id === miIdPersonal && m.destinatario_id === contacto.id_personal) {
                        return { ...m, leido: true };
                    }
                    return m;
                }));
            }
        }

        socket.on('mensaje_nuevo', onMensajeNuevo);
        socket.on('escribiendo', onEscribiendo);
        socket.on('zumbido', onZumbido);
        socket.on('mensaje_visto', onMensajeVisto);

        return () => {
            socket.off('mensaje_nuevo', onMensajeNuevo);
            socket.off('escribiendo', onEscribiendo);
            socket.off('zumbido', onZumbido);
            socket.off('mensaje_visto', onMensajeVisto);
        };
    }, [socket, contacto.id_personal]);

    // ── Marcar visto inmediatamente al volver a la pestaña / foco ──
    useEffect(() => {
        if (!socket || !contacto.id_personal) return;
        function marcarAlVolver() {
            if (!document.hidden) {
                socket.emit('marcar_visto', { contacto_id: contacto.id_personal });
            }
        }
        document.addEventListener('visibilitychange', marcarAlVolver);
        window.addEventListener('focus', marcarAlVolver);
        return () => {
            document.removeEventListener('visibilitychange', marcarAlVolver);
            window.removeEventListener('focus', marcarAlVolver);
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
                    contenido: esImagen ? `[Imagen] ${data.nombre_original}` : `[Archivo] ${data.nombre_original}`,
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
            alert('No se pudo subir el archivo. Verifica el tipo y tamaño (máx 10 MB).');
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

    // ── Ctrl+V pegar imagen/archivo ──
    async function handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                e.preventDefault();
                const file = items[i].getAsFile();
                if (file) await handleSubirArchivo(file);
                return;
            }
        }
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

    // ── Perfil del contacto ──
    function abrirPerfil() {
        setPerfilAbierto(true);
        setCargandoPerfil(true);
        const token = obtenerToken();
        fetch(CHAT_URL + '/contactos/' + contacto.id_personal + '/perfil', {
            headers: { 'Authorization': 'Bearer ' + token },
        })
            .then(r => r.ok ? r.json() : null)
            .then(data => { setDatosPerfil(data); setCargandoPerfil(false); })
            .catch(() => setCargandoPerfil(false));
    }

    function copiarTexto(txt) {
        navigator.clipboard.writeText(txt).catch(() => {});
    }

    // Posición de la ventana
    const offsetRight = modeMobile ? 0 : (panelAbierto ? 354 : 80) + posicion * 320;

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
                    <div className="chat-ventana-avatar-mini chat-avatar-clickable" onClick={(e) => { e.stopPropagation(); abrirPerfil(); }}>
                        {contacto.foto ? (
                            <img src={'/assets/perfiles/' + contacto.foto} alt="" />
                        ) : (
                            <span>{contacto.nombre.charAt(0)}</span>
                        )}
                        <span className={'chat-status-mini ' + (enLinea ? 'online' : 'offline-dot')}>
                            <IconoFa icono={faCircle} />
                        </span>
                    </div>
                    <div className="chat-ventana-nombre chat-nombre-clickable" onClick={(e) => { e.stopPropagation(); abrirPerfil(); }}>
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
                                <span>Suelta el archivo aqui</span>
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
                                            <div className="chat-ventana-avatar-mini chat-avatar-clickable" onClick={abrirPerfil}>
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
                                                {renderContenidoMensaje(m, true, (url) => setImagenExpandida(url))}
                                                <span className="chat-msg-hora">
                                                    {formatHora(m.fecha || m.fecha_creacion)}
                                                    {esMio && (
                                                        <span className={'chat-visto' + (m.leido ? ' chat-visto-leido' : '')}>
                                                            <IconoFa icono={m.leido ? faCheckDouble : faCheck} />
                                                        </span>
                                                    )}
                                                </span>
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
                            onPaste={handlePaste}
                            autoFocus
                        />
                        <button type="submit" disabled={!texto.trim()}>
                            <IconoFa icono={faPaperPlane} />
                        </button>
                    </form>
                    {imagenExpandida && (
                        <ModalImagen url={imagenExpandida} onCerrar={() => setImagenExpandida(null)} />
                    )}
                </>
            )}

            {/* ── Modal de perfil del contacto ── */}
            {perfilAbierto && createPortal(
                <div className="chat-perfil-overlay" onClick={() => setPerfilAbierto(false)}>
                    <div className="chat-perfil-card" onClick={(e) => e.stopPropagation()}>
                        <button className="chat-perfil-cerrar" onClick={() => setPerfilAbierto(false)}>
                            <IconoFa icono={faTimes} />
                        </button>

                        {cargandoPerfil ? (
                            <div className="chat-perfil-cargando">
                                <span className="chat-dots"><span></span><span></span><span></span></span>
                                <p>Cargando perfil...</p>
                            </div>
                        ) : datosPerfil ? (
                            <>
                                {/* Cabecera con foto */}
                                <div className="chat-perfil-header">
                                    <div className="chat-perfil-avatar">
                                        {datosPerfil.foto ? (
                                            <img src={'/assets/perfiles/' + datosPerfil.foto} alt="" />
                                        ) : (
                                            <span className="chat-perfil-avatar-letra">{datosPerfil.nombres?.charAt(0)}</span>
                                        )}
                                        <span className={'chat-perfil-status ' + (datosPerfil.en_linea ? 'online' : 'offline-dot')}>
                                            <IconoFa icono={faCircle} />
                                        </span>
                                    </div>
                                    <h3 className="chat-perfil-nombre">{datosPerfil.nombre_completo}</h3>
                                    <span className="chat-perfil-estado">{datosPerfil.en_linea ? 'En línea' : 'Desconectado'}</span>
                                </div>

                                {/* Info laboral */}
                                <div className="chat-perfil-seccion">
                                    {datosPerfil.cargo && (
                                        <div className="chat-perfil-item">
                                            <IconoFa icono={faBriefcase} />
                                            <div>
                                                <label>Cargo</label>
                                                <span>{datosPerfil.cargo}</span>
                                            </div>
                                        </div>
                                    )}
                                    {datosPerfil.area && (
                                        <div className="chat-perfil-item">
                                            <IconoFa icono={faBuilding} />
                                            <div>
                                                <label>Área</label>
                                                <span>{datosPerfil.area}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Contacto */}
                                <div className="chat-perfil-seccion">
                                    <h4>Contacto</h4>
                                    {datosPerfil.celular && (
                                        <div className="chat-perfil-item chat-perfil-copiable" onClick={() => copiarTexto(datosPerfil.celular)}>
                                            <IconoFa icono={faPhone} />
                                            <div>
                                                <label>Celular</label>
                                                <span>{datosPerfil.celular}</span>
                                            </div>
                                            <button className="chat-perfil-btn-copiar" title="Copiar"><IconoFa icono={faCopy} /></button>
                                        </div>
                                    )}
                                    {datosPerfil.chips?.length > 0 && datosPerfil.chips.map((ch, i) => (
                                        <div key={i} className="chat-perfil-item chat-perfil-copiable" onClick={() => copiarTexto(ch.numero)}>
                                            <IconoFa icono={faMobileAlt} />
                                            <div>
                                                <label>Chip corporativo</label>
                                                <span>{ch.numero}</span>
                                            </div>
                                            <button className="chat-perfil-btn-copiar" title="Copiar"><IconoFa icono={faCopy} /></button>
                                        </div>
                                    ))}
                                </div>

                                {/* Correos corporativos (solo direcciones, sin contraseñas) */}
                                {datosPerfil.correos_corp?.length > 0 && (
                                    <div className="chat-perfil-seccion">
                                        <h4>Correos corporativos</h4>
                                        {datosPerfil.correos_corp.map((c, i) => (
                                            <div key={i} className="chat-perfil-item chat-perfil-copiable" onClick={() => copiarTexto(c.correo)}>
                                                <IconoFa icono={faEnvelope} />
                                                <div>
                                                    <label>Correo corporativo</label>
                                                    <span>{c.correo}</span>
                                                </div>
                                                <button className="chat-perfil-btn-copiar" title="Copiar"><IconoFa icono={faCopy} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="chat-perfil-cargando">
                                <p>No se pudo cargar el perfil</p>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
