import { useState, useEffect, useCallback } from 'react';
import IconoFa from './IconoFa';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { headersConToken, API_URL } from '../auth';
import '../styles/ReaperturaModal.css';

// ═══════════════════════════════════════════════════════════════════
// ReaperturaModal — Modal global que avisa al técnico asignado
// cuando un ticket es reabierto, mostrando el motivo.
//
// Se monta en Dashboard.jsx. Hace polling cada 10 segundos
// buscando notificaciones de tipo "ticket_reabierto_modal".
// ═══════════════════════════════════════════════════════════════════
export default function ReaperturaModal() {
    var [modalVisible, setModalVisible] = useState(false);
    var [datos, setDatos] = useState(null);

    var verificarPendiente = useCallback(function () {
        fetch(API_URL + '/tickets/reabierto-pendiente', { headers: headersConToken() })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.pendiente) {
                    setDatos(data);
                    setModalVisible(true);
                }
            })
            .catch(function () {});
    }, []);

    useEffect(function () {
        verificarPendiente();
        var intervalo = setInterval(verificarPendiente, 10000);
        return function () { clearInterval(intervalo); };
    }, [verificarPendiente]);

    function cerrarModal() {
        if (!datos) return;
        // Marcar como visto
        fetch(API_URL + '/tickets/reabierto-visto/' + datos.id_notif, {
            method: 'PUT',
            headers: headersConToken(),
        }).catch(function () {});
        setModalVisible(false);
        setDatos(null);
    }

    if (!modalVisible || !datos) return null;

    return (
        <div className="reapertura-overlay">
            <div className="reapertura-modal">
                <div className="reapertura-icono">
                    <IconoFa icono={faRotate} />
                </div>
                <h3 className="reapertura-titulo">Ticket Reabierto</h3>
                <p className="reapertura-asunto">{datos.asunto}</p>

                <div className="reapertura-info">
                    <div className="reapertura-campo">
                        <span className="reapertura-label">Reabierto por:</span>
                        <span className="reapertura-valor">{datos.nombre_reabrio}</span>
                    </div>
                    {datos.motivo && (
                        <div className="reapertura-campo">
                            <span className="reapertura-label">Motivo:</span>
                            <p className="reapertura-motivo">{datos.motivo}</p>
                        </div>
                    )}
                </div>

                <button className="reapertura-btn" onClick={cerrarModal}>
                    Entendido
                </button>
            </div>
        </div>
    );
}
