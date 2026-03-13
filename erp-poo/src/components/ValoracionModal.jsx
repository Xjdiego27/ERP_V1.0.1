import { useState, useEffect, useCallback } from 'react';
import IconoFa from './IconoFa';
import { faStar, faRotate } from '@fortawesome/free-solid-svg-icons';
import { headersConToken, API_URL } from '../auth';
import '../styles/IngresarTicket.css';

// ═══════════════════════════════════════════════════════════════════
// ValoracionModal — Componente global de valoración de tickets.
//
// Se monta en Dashboard.jsx para que aparezca en CUALQUIER módulo.
// Hace polling de /tickets para detectar tickets cerrados sin valorar
// del usuario actual. Muestra el modal bloqueante hasta que valore
// o reabra el ticket (con motivo obligatorio).
// ═══════════════════════════════════════════════════════════════════
export default function ValoracionModal() {
    var [modalVisible, setModalVisible] = useState(false);
    var [ticketPendiente, setTicketPendiente] = useState(null);
    var [motivoReabrir, setMotivoReabrir] = useState('');
    var [mostrarMotivo, setMostrarMotivo] = useState(false);

    var sessionData = JSON.parse(localStorage.getItem('session'));
    var miIdPersonal = sessionData && sessionData.usuario ? sessionData.usuario.id_personal : null;

    var verificarPendientes = useCallback(function () {
        if (!miIdPersonal) return;
        fetch(API_URL + '/tickets', { headers: headersConToken() })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!Array.isArray(data)) return;
                var pendiente = data.find(function (t) {
                    return t.id_personal === miIdPersonal
                        && t.estado === 'CERRADO'
                        && (t.valoracion === null || t.valoracion === undefined);
                });
                if (pendiente) {
                    setTicketPendiente(pendiente);
                    setModalVisible(true);
                } else {
                    setModalVisible(false);
                    setTicketPendiente(null);
                    setMostrarMotivo(false);
                    setMotivoReabrir('');
                }
            })
            .catch(function () {});
    }, [miIdPersonal]);

    // Verificar al montar y cada 5 segundos
    useEffect(function () {
        verificarPendientes();
        var intervalo = setInterval(verificarPendientes, 5000);
        return function () { clearInterval(intervalo); };
    }, [verificarPendientes]);

    async function enviarValoracion(valor) {
        if (!ticketPendiente) return;
        try {
            var resp = await fetch(API_URL + '/tickets/' + ticketPendiente.id_ticket + '/valorar?valoracion=' + valor, {
                method: 'PUT', headers: headersConToken(),
            });
            if (!resp.ok) throw new Error('Error al valorar');
            setModalVisible(false);
            setTicketPendiente(null);
            verificarPendientes();
        } catch (e) { alert(e.message); }
    }

    async function reabrirTicket() {
        if (!ticketPendiente) return;
        if (!motivoReabrir.trim()) {
            alert('Escribe un motivo para reabrir el ticket');
            return;
        }
        try {
            var resp = await fetch(
                API_URL + '/tickets/' + ticketPendiente.id_ticket + '/reabrir?motivo=' + encodeURIComponent(motivoReabrir.trim()),
                { method: 'PUT', headers: headersConToken() }
            );
            if (!resp.ok) throw new Error('Error al reabrir');
            setModalVisible(false);
            setTicketPendiente(null);
            setMotivoReabrir('');
            setMostrarMotivo(false);
            verificarPendientes();
        } catch (e) { alert(e.message); }
    }

    if (!modalVisible || !ticketPendiente) return null;

    return (
        <div className="valoracion-overlay">
            <div className="valoracion-modal">
                {!mostrarMotivo ? (
                    <>
                        <div className="valoracion-icono"><IconoFa icono={faStar} /></div>
                        <h3 className="valoracion-titulo">Valora la atención</h3>
                        <p className="valoracion-desc">Ticket #{ticketPendiente.id_ticket}: {ticketPendiente.asunto}</p>
                        {ticketPendiente.mensaje_ti && (
                            <div className="valoracion-mensaje-ti">
                                <span className="valoracion-msg-label">Mensaje del técnico:</span>
                                <p className="valoracion-msg-texto">{ticketPendiente.mensaje_ti}</p>
                            </div>
                        )}
                        <p className="valoracion-desc">¿Cómo fue la velocidad de atención?</p>
                        <div className="valoracion-opciones">
                            <button className="valoracion-btn val-lento" onClick={function () { enviarValoracion(1); }}>
                                <span className="val-estrellas"><IconoFa icono={faStar} /></span>
                                <span className="val-texto">LENTO</span>
                            </button>
                            <button className="valoracion-btn val-normal" onClick={function () { enviarValoracion(2); }}>
                                <span className="val-estrellas"><IconoFa icono={faStar} /> <IconoFa icono={faStar} /></span>
                                <span className="val-texto">NORMAL</span>
                            </button>
                            <button className="valoracion-btn val-rapido" onClick={function () { enviarValoracion(3); }}>
                                <span className="val-estrellas"><IconoFa icono={faStar} /> <IconoFa icono={faStar} /> <IconoFa icono={faStar} /></span>
                                <span className="val-texto">RÁPIDO</span>
                            </button>
                        </div>

                        {/* Reabrir ticket */}
                        <div className="reabrir-seccion">
                            <div className="reabrir-separador"></div>
                            <h4 className="reabrir-titulo">¿SE RESOLVIÓ TU PROBLEMA?</h4>
                            <p className="reabrir-desc">Si el problema persiste, puedes reabrir el ticket para que sea atendido nuevamente.</p>
                            <button className="btn-reabrir-ticket" onClick={function () { setMostrarMotivo(true); }}>
                                REABRIR TICKET
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="valoracion-icono"><IconoFa icono={faRotate} /></div>
                        <h3 className="valoracion-titulo">Reabrir Ticket #{ticketPendiente.id_ticket}</h3>
                        <p className="valoracion-desc">Describe por qué necesitas reabrir este ticket:</p>
                        <textarea
                            className="reabrir-motivo-input"
                            placeholder="Escribe el motivo de la reapertura..."
                            value={motivoReabrir}
                            onChange={function (e) { setMotivoReabrir(e.target.value); }}
                            rows={4}
                            maxLength={500}
                        ></textarea>
                        <div className="reabrir-motivo-actions">
                            <button className="btn-reabrir-ticket" onClick={reabrirTicket} disabled={!motivoReabrir.trim()}>
                                CONFIRMAR REAPERTURA
                            </button>
                            <button className="btn-reabrir-volver" onClick={function () { setMostrarMotivo(false); setMotivoReabrir(''); }}>
                                VOLVER
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
