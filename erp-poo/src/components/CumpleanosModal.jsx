import { useState, useEffect, useCallback } from 'react';
import IconoFa from './IconoFa';
import { faCakeCandles, faCalendarDay, faPaperPlane, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { headersConToken, API_URL } from '../auth';
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

    var sessionData = JSON.parse(localStorage.getItem('session'));
    var miIdPersonal = sessionData && sessionData.usuario ? sessionData.usuario.id_personal : null;

    var verificarPendiente = useCallback(function () {
        if (!miIdPersonal) return;
        fetch(API_URL + '/saludos-cumpleanos/pendiente', { headers: headersConToken() })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.pendiente && data.cumpleanero) {
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

    async function enviarSaludo() {
        if (!cumpleanero || !mensaje.trim()) return;
        setEnviando(true);
        try {
            var resp = await fetch(API_URL + '/saludos-cumpleanos/enviar', {
                method: 'POST',
                headers: headersConToken(),
                body: JSON.stringify({
                    id_personal_cumple: cumpleanero.id_personal,
                    mensaje: mensaje.trim(),
                }),
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
                            className="cumple-modal-textarea"
                            placeholder="Escribe tu saludo de cumpleaños..."
                            value={mensaje}
                            onChange={function (e) { setMensaje(e.target.value); }}
                            rows={4}
                            maxLength={500}
                        ></textarea>
                        <div className="cumple-modal-chars">{mensaje.length}/500</div>
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
