import { useState, useEffect, useCallback, useRef } from 'react';
import IconoFa from './IconoFa';
import StickerPicker from './StickerPicker';
import { faCakeCandles, faCalendarDay, faPaperPlane, faCircleCheck, faFaceSmile, faTimes } from '@fortawesome/free-solid-svg-icons';
import { headersConToken, API_URL } from '../auth';
import { getSession } from '../utils/session';
import '../styles/SaludosCumpleanos.css';

// ═══════════════════════════════════════════════════════════════════
// CumpleanosModal — Componente global de saludos de cumpleaños.
//
// Se monta en Dashboard.jsx para que aparezca en CUALQUIER módulo.
// Hace polling para detectar cumpleaños del día donde el usuario
// aún no ha enviado su saludo. Muestra un modal con textarea
// para escribir el saludo y enviarlo.
// ═══════════════════════════════════════════════════════════════════
export default function CumpleanosModal() {
    var [modalVisible, setModalVisible] = useState(false);
    var [cumpleanero, setCumpleanero] = useState(null);
    var [mensaje, setMensaje] = useState('');
    var [enviando, setEnviando] = useState(false);
    var [enviado, setEnviado] = useState(false);
    var [stickerSeleccionado, setStickerSeleccionado] = useState(null);
    var [mostrarStickers, setMostrarStickers] = useState(false);
    var textareaRef = useRef(null);

    var sessionData = getSession();
    var miIdPersonal = sessionData && sessionData.usuario ? sessionData.usuario.id_personal : null;

    /* ── Control de apariciones: máximo 2 veces por persona/año ── */
    var MAX_APARICIONES = 2;

    function claveDismiss(idPersonal) {
        var anio = new Date().getFullYear();
        return 'cumple_dismiss_' + idPersonal + '_' + anio;
    }

    function contarDismiss(idPersonal) {
        try {
            var val = localStorage.getItem(claveDismiss(idPersonal));
            return val ? parseInt(val, 10) : 0;
        } catch (e) { return 0; }
    }

    function registrarDismiss(idPersonal) {
        try {
            var actual = contarDismiss(idPersonal);
            localStorage.setItem(claveDismiss(idPersonal), String(actual + 1));
        } catch (e) {}
    }

    var verificarPendiente = useCallback(function () {
        if (!miIdPersonal) return;
        fetch(API_URL + '/saludos-cumpleanos/pendiente', { headers: headersConToken() })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.pendiente && data.cumpleanero) {
                    /* Si ya se descartó 2+ veces, no mostrar más */
                    if (contarDismiss(data.cumpleanero.id_personal) >= MAX_APARICIONES) {
                        setModalVisible(false);
                        setCumpleanero(null);
                        return;
                    }
                    setCumpleanero(data.cumpleanero);
                    setModalVisible(true);
                } else {
                    setModalVisible(false);
                    setCumpleanero(null);
                }
            })
            .catch(function () {});
    }, [miIdPersonal]);

    // Verificar al montar y cada 30 segundos
    useEffect(function () {
        verificarPendiente();
        var intervalo = setInterval(verificarPendiente, 30000);
        return function () { clearInterval(intervalo); };
    }, [verificarPendiente]);

    // Escuchar evento personalizado desde las notificaciones del Header
    useEffect(function () {
        function abrirDesdeNoti(e) {
            var d = e.detail;
            if (d && d.id_personal) {
                setCumpleanero({
                    id_personal: d.id_personal,
                    nombre: d.nombre || '',
                    foto: d.foto || null,
                    dias_para: d.dias_para != null ? d.dias_para : 0,
                });
                setMensaje('');
                setStickerSeleccionado(null);
                setMostrarStickers(false);
                setEnviado(false);
                setModalVisible(true);
            }
        }
        window.addEventListener('abrir-saludo-cumple', abrirDesdeNoti);
        return function () { window.removeEventListener('abrir-saludo-cumple', abrirDesdeNoti); };
    }, []);

    async function enviarSaludo() {
        if (!cumpleanero || !mensaje.trim()) return;
        setEnviando(true);
        try {
            var body = {
                id_personal_cumple: cumpleanero.id_personal,
                mensaje: mensaje.trim(),
            };
            if (stickerSeleccionado) {
                // Si es sticker imagen (tiene .img con URL), guardar la URL; si es emoji, guardar el emoji
                body.sticker = typeof stickerSeleccionado === 'string'
                    ? stickerSeleccionado
                    : stickerSeleccionado.img || null;
            }
            var resp = await fetch(API_URL + '/saludos-cumpleanos/enviar', {
                method: 'POST',
                headers: headersConToken(),
                body: JSON.stringify(body),
            });
            if (!resp.ok) {
                var err = await resp.json();
                throw new Error(err.detail || 'Error al enviar saludo');
            }
            setEnviado(true);
            setTimeout(function () {
                setModalVisible(false);
                setCumpleanero(null);
                setMensaje('');
                setStickerSeleccionado(null);
                setMostrarStickers(false);
                setEnviado(false);
                verificarPendiente();
            }, 2000);
        } catch (e) {
            alert(e.message);
        } finally {
            setEnviando(false);
        }
    }

    if (!modalVisible || !cumpleanero) return null;

    var fotoUrl = cumpleanero.foto
        ? API_URL.replace('/api', '') + '/assets/perfiles/' + cumpleanero.foto
        : null;

    return (
        <div className="cumple-modal-overlay">
            <div className="cumple-modal">
                {/* Botón cerrar — el saludo es voluntario */}
                {!enviado && (
                    <button
                        className="cumple-modal-btn-cerrar"
                        onClick={function () {
                            if (cumpleanero) registrarDismiss(cumpleanero.id_personal);
                            setModalVisible(false);
                            setCumpleanero(null);
                            setMensaje('');
                            setStickerSeleccionado(null);
                            setMostrarStickers(false);
                        }}
                        title="Cerrar"
                    >
                        <IconoFa icono={faTimes} />
                    </button>
                )}
                {!enviado ? (
                    <>
                        <div className="cumple-modal-confeti">{cumpleanero.dias_para === 0 ? <IconoFa icono={faCakeCandles} /> : <IconoFa icono={faCalendarDay} />}</div>
                        <h3 className="cumple-modal-titulo">
                            {cumpleanero.dias_para === 0
                                ? '¡Hoy es el cumpleaños de'
                                : cumpleanero.dias_para === 1
                                    ? '¡Mañana es el cumpleaños de'
                                    : '¡En ' + cumpleanero.dias_para + ' días es el cumpleaños de'}
                        </h3>
                        <div className="cumple-modal-persona">
                            {fotoUrl && (
                                <img
                                    className="cumple-modal-foto"
                                    src={fotoUrl}
                                    alt={cumpleanero.nombre}
                                    onError={function (e) { e.target.style.display = 'none'; }}
                                />
                            )}
                            <span className="cumple-modal-nombre">{cumpleanero.nombre}!</span>
                        </div>
                        <p className="cumple-modal-desc">Escribe un saludo especial para esta persona:</p>
                        <textarea
                            ref={textareaRef}
                            className="cumple-modal-textarea"
                            placeholder="Escribe tu saludo de cumpleaños..."
                            value={mensaje}
                            onChange={function (e) { setMensaje(e.target.value); }}
                            rows={4}
                            maxLength={500}
                        ></textarea>
                        <div className="cumple-modal-textarea-tools">
                            <div className="cumple-modal-chars">{mensaje.length}/500</div>
                            <button
                                type="button"
                                className={'cumple-modal-sticker-btn' + (mostrarStickers ? ' activo' : '')}
                                onClick={function () { setMostrarStickers(!mostrarStickers); }}
                                title="Agregar sticker o emoji"
                            >
                                <IconoFa icono={faFaceSmile} />
                                <span>Sticker</span>
                            </button>
                        </div>

                        {/* Sticker seleccionado — preview */}
                        {stickerSeleccionado && (
                            <div className="cumple-modal-sticker-preview">
                                {typeof stickerSeleccionado === 'string' ? (
                                    <span className="cumple-sticker-emoji">{stickerSeleccionado}</span>
                                ) : (
                                    <img src={stickerSeleccionado.img} alt={stickerSeleccionado.label || 'sticker'} />
                                )}
                                <button
                                    type="button"
                                    className="cumple-sticker-quitar"
                                    onClick={function () { setStickerSeleccionado(null); }}
                                    title="Quitar sticker"
                                >
                                    <IconoFa icono={faTimes} />
                                </button>
                            </div>
                        )}

                        {/* StickerPicker flotante */}
                        {mostrarStickers && (
                            <div className="cumple-modal-sticker-picker">
                                <StickerPicker
                                    onSelectSticker={function (stk) {
                                        setStickerSeleccionado(stk);
                                        setMostrarStickers(false);
                                    }}
                                    onSelectEmoji={function (emoji) {
                                        // Insertar emoji directamente en el texto del mensaje
                                        var ta = textareaRef.current;
                                        var pos = ta ? ta.selectionStart || mensaje.length : mensaje.length;
                                        var nuevoMsg = mensaje.slice(0, pos) + emoji + mensaje.slice(pos);
                                        if (nuevoMsg.length <= 500) {
                                            setMensaje(nuevoMsg);
                                            // Restaurar foco y posición del cursor después del emoji
                                            setTimeout(function () {
                                                if (ta) {
                                                    ta.focus();
                                                    var nuevaPos = pos + emoji.length;
                                                    ta.setSelectionRange(nuevaPos, nuevaPos);
                                                }
                                            }, 0);
                                        }
                                    }}
                                    onClose={function () { setMostrarStickers(false); }}
                                />
                            </div>
                        )}

                        <button
                            className="cumple-modal-btn-enviar"
                            onClick={enviarSaludo}
                            disabled={!mensaje.trim() || enviando}
                        >
                            {enviando ? 'Enviando...' : <><IconoFa icono={faPaperPlane} /> Enviar Saludo</>}
                        </button>
                    </>
                ) : (
                    <div className="cumple-modal-exito">
                        <div className="cumple-modal-confeti"><IconoFa icono={faCircleCheck} /></div>
                        <h3 className="cumple-modal-titulo">¡Saludo enviado!</h3>
                        <p className="cumple-modal-desc">Tu saludo fue enviado correctamente.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
