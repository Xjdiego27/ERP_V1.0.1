import React, { useState, useEffect, useRef } from 'react';
import { API_URL, headersConToken } from '../auth';
import IconoFa from '../components/IconoFa';
import ModalImagen from '../components/ModalImagen';
import PageContent from '../components/PageContent';
import {
    faTicket, faFolderOpen, faUserCheck, faSpinner as faProgress,
    faTimes, faCheckCircle, faSearch, faFileExport, faChevronLeft, faStar
} from '@fortawesome/free-solid-svg-icons';
import '../styles/Tickets.css';

var ESTADOS_COLOR = {
    ABIERTO:  { bg: '#fef3c7', color: '#d97706', label: 'ABIERTO' },
    ASIGNADO: { bg: '#dbeafe', color: '#2563eb', label: 'ASIGNADO' },
    RESUELTO: { bg: '#e0e7ff', color: '#6366f1', label: 'EN PROGRESO' },
    CERRADO:  { bg: '#dcfce7', color: '#16a34a', label: 'CERRADO' },
};

var PRIORIDAD_COLOR = {
    BAJA:     { bg: '#dcfce7', color: '#15803d' },
    MEDIA:    { bg: '#fef3c7', color: '#92400e' },
    ALTA:     { bg: '#ffedd5', color: '#c2410c' },
    URGENTE:  { bg: '#fee2e2', color: '#b91c1c' },
};

var ESTADOS_FLUJO = ['ABIERTO', 'ASIGNADO', 'RESUELTO', 'CERRADO'];
var ETIQUETAS_FLUJO = ['SIN ASIGNAR', 'ASIGNADO', 'EN PROGRESO', 'CERRADO'];

export default function Tickets() {
    var [tickets, setTickets] = useState([]);
    var [estadisticas, setEstadisticas] = useState(null);
    var [tecnicos, setTecnicos] = useState([]);
    var [seleccionado, setSeleccionado] = useState(null);
    var [filtroEstado, setFiltroEstado] = useState('');
    var [busqueda, setBusqueda] = useState('');
    var [mensajeTI, setMensajeTI] = useState('');
    var [accionando, setAccionando] = useState(false);
    var [msgExito, setMsgExito] = useState('');
    var [codigoSAP, setCodigoSAP] = useState('');
    var [fotoPreview, setFotoPreview] = useState(null);
    var canvasRef = useRef(null);

    // Detectar si el usuario actual es TI
    var sessionData = JSON.parse(localStorage.getItem('session'));
    var rolUsuario = (sessionData && sessionData.usuario && sessionData.usuario.rol || '').toUpperCase();
    var esRolTI = ['ADMINISTRADOR', 'ADMIN', 'SOPORTE'].indexOf(rolUsuario) >= 0;

    useEffect(function () { cargarDatos(); }, []);

    function cargarDatos() {
        Promise.all([
            fetch(API_URL + '/tickets', { headers: headersConToken() }).then(function (r) { return r.json(); }),
            fetch(API_URL + '/tickets/estadisticas', { headers: headersConToken() }).then(function (r) { return r.json(); }),
            fetch(API_URL + '/tickets/tecnicos', { headers: headersConToken() }).then(function (r) { return r.json(); }),
        ]).then(function (res) {
            setTickets(Array.isArray(res[0]) ? res[0] : []);
            setEstadisticas(res[1]);
            setTecnicos(Array.isArray(res[2]) ? res[2] : []);
        }).catch(function () {});
    }

    // ── Donut chart via canvas ──
    useEffect(function () {
        if (!estadisticas || !canvasRef.current) return;
        var ctx = canvasRef.current.getContext('2d');
        var w = canvasRef.current.width;
        var h = canvasRef.current.height;
        var cx = w / 2;
        var cy = h / 2;
        var grosor = 36;
        var radio = Math.min(w, h) / 2 - grosor / 2 - 4;

        ctx.clearRect(0, 0, w, h);

        var estiloComp = getComputedStyle(canvasRef.current);

        var datos = [
            { valor: estadisticas.abiertos, color: '#d97706' },
            { valor: estadisticas.asignados, color: '#2563eb' },
            { valor: estadisticas.en_progreso, color: '#6366f1' },
            { valor: estadisticas.cerrados, color: '#16a34a' },
        ];
        var total = datos.reduce(function (s, d) { return s + d.valor; }, 0);

        if (total === 0) {
            ctx.beginPath();
            ctx.arc(cx, cy, radio, 0, Math.PI * 2);
            ctx.strokeStyle = estiloComp.getPropertyValue('--border-color').trim() || '#e2e8f0';
            ctx.lineWidth = grosor;
            ctx.stroke();
        } else {
            var inicio = -Math.PI / 2;
            datos.forEach(function (d) {
                if (d.valor === 0) return;
                var angulo = (d.valor / total) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(cx, cy, radio, inicio, inicio + angulo);
                ctx.strokeStyle = d.color;
                ctx.lineWidth = grosor;
                ctx.lineCap = 'butt';
                ctx.stroke();
                inicio += angulo;
            });
        }

        // Centro — usar colores del tema
        var colorTexto = estiloComp.getPropertyValue('--text-primary').trim() || '#1e293b';
        var colorSub = estiloComp.getPropertyValue('--text-secondary').trim() || '#94a3b8';
        ctx.fillStyle = colorTexto;
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total, cx, cy - 10);
        ctx.font = '13px sans-serif';
        ctx.fillStyle = colorSub;
        ctx.fillText('TICKETS', cx, cy + 16);
    }, [estadisticas]);

    // ── Filtrado ──
    var ticketsFiltrados = tickets.filter(function (t) {
        if (filtroEstado && t.estado !== filtroEstado) return false;
        if (busqueda) {
            var b = busqueda.toLowerCase();
            var coincide = (t.asunto || '').toLowerCase().indexOf(b) >= 0
                || (t.nombre_creador || '').toLowerCase().indexOf(b) >= 0
                || (t.categoria || '').toLowerCase().indexOf(b) >= 0
                || String(t.id_ticket).indexOf(b) >= 0;
            if (!coincide) return false;
        }
        return true;
    });

    // ── Tiempo relativo ──
    function tiempoRelativo(fechaStr) {
        if (!fechaStr) return '';
        var fecha = new Date(fechaStr);
        var ahora = new Date();
        var diff = Math.floor((ahora - fecha) / 1000);
        if (diff < 60) return 'hace un momento';
        if (diff < 3600) return 'hace ' + Math.floor(diff / 60) + ' min';
        if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + ' h';
        return 'hace ' + Math.floor(diff / 86400) + ' día(s)';
    }

    // ── Acciones ──
    async function asignarTecnico(id_ticket, id_ti) {
        setAccionando(true);
        try {
            var url = API_URL + '/tickets/' + id_ticket + '/asignar?id_ti=' + id_ti;
            var resp = await fetch(url, {
                method: 'PUT', headers: headersConToken(),
            });
            if (!resp.ok) throw new Error('Error al asignar');
            cargarDatos();
            setMsgExito('Técnico asignado');
            setTimeout(function () { setMsgExito(''); }, 3000);
            // Refrescar seleccionado
            var data = await fetch(API_URL + '/tickets/' + id_ticket, { headers: headersConToken() }).then(function (r) { return r.json(); });
            setSeleccionado(data);
        } catch (e) { alert(e.message); }
        finally { setAccionando(false); }
    }

    async function cerrarTicket() {
        if (!seleccionado) return;
        setAccionando(true);
        try {
            // Si es ticket SAP, guardar código SAP antes de cerrar
            if (seleccionado.es_sap && codigoSAP.trim()) {
                var sapResp = await fetch(API_URL + '/tickets/' + seleccionado.id_ticket + '/sap/codigo?codigo_sap=' + encodeURIComponent(codigoSAP), {
                    method: 'PUT', headers: headersConToken(),
                });
                if (!sapResp.ok) {
                    var sapErr = await sapResp.json();
                    throw new Error(sapErr.detail || 'Error al guardar código SAP');
                }
            }
            var url = API_URL + '/tickets/' + seleccionado.id_ticket + '/cerrar';
            if (mensajeTI) url += '?mensaje_ti=' + encodeURIComponent(mensajeTI);
            var resp = await fetch(url, { method: 'PUT', headers: headersConToken() });
            if (!resp.ok) throw new Error('Error al cerrar');
            setMensajeTI('');
            setCodigoSAP('');
            cargarDatos();
            setMsgExito('Ticket cerrado exitosamente');
            setTimeout(function () { setMsgExito(''); }, 3000);
            var data = await fetch(API_URL + '/tickets/' + seleccionado.id_ticket, { headers: headersConToken() }).then(function (r) { return r.json(); });
            setSeleccionado(data);
        } catch (e) { alert(e.message); }
        finally { setAccionando(false); }
    }

    async function cambiarEstado(nuevoEstado) {
        if (!seleccionado) return;
        setAccionando(true);
        try {
            var resp = await fetch(API_URL + '/tickets/' + seleccionado.id_ticket + '/estado?estado=' + nuevoEstado, {
                method: 'PUT', headers: headersConToken(),
            });
            if (!resp.ok) throw new Error('Error al cambiar estado');
            cargarDatos();
            setMsgExito('Estado actualizado');
            setTimeout(function () { setMsgExito(''); }, 3000);
            var data = await fetch(API_URL + '/tickets/' + seleccionado.id_ticket, { headers: headersConToken() }).then(function (r) { return r.json(); });
            setSeleccionado(data);
        } catch (e) { alert(e.message); }
        finally { setAccionando(false); }
    }

    // Exportar CSV
    function exportarCSV() {
        var cabecera = 'ID,NOMBRE,CATEGORIA,ASUNTO,PRIORIDAD,ESTADO,FECHA CREACIÓN\n';
        var filas = ticketsFiltrados.map(function (t) {
            return [t.id_ticket, t.nombre_creador, t.categoria, t.asunto, t.prioridad, t.estado, t.fech_creacion].join(',');
        }).join('\n');
        var blob = new Blob([cabecera + filas], { type: 'text/csv' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = 'tickets.csv'; a.click();
    }

    var stats = estadisticas || { abiertos: 0, asignados: 0, en_progreso: 0, cerrados: 0, total: 0, por_mes: [] };

    return (
        <PageContent>
            <div className="tickets-dashboard">
                {/* ── Cabecera ── */}
                <div className="tickets-dash-header">
                    <div className="tickets-dash-title">
                        <IconoFa icono={faTicket} clase="tickets-dash-icon" />
                        <h2>Tickets de Soporte</h2>
                    </div>
                    <div className="tickets-dash-actions">
                        <button className="btn-exportar" onClick={exportarCSV}>
                            <IconoFa icono={faFileExport} /> Exportar
                        </button>
                    </div>
                </div>

                {msgExito && <div className="tickets-msg-exito"><IconoFa icono={faCheckCircle} /> {msgExito}</div>}

                {/* ── Stats cards (4 en fila) ── */}
                <div className="tickets-stats-row">
                    <div className="stat-card" onClick={function () { setFiltroEstado(filtroEstado === 'ABIERTO' ? '' : 'ABIERTO'); }}>
                        <div className="stat-icon" style={{ background: '#fef3c7' }}><IconoFa icono={faFolderOpen} clase="stat-icono-svg" style={{ color: '#d97706' }} /></div>
                        <div className="stat-info"><span className="stat-num">{stats.abiertos}</span><span className="stat-label">ABIERTOS</span></div>
                    </div>
                    <div className="stat-card" onClick={function () { setFiltroEstado(filtroEstado === 'ASIGNADO' ? '' : 'ASIGNADO'); }}>
                        <div className="stat-icon" style={{ background: '#dbeafe' }}><IconoFa icono={faUserCheck} clase="stat-icono-svg" style={{ color: '#2563eb' }} /></div>
                        <div className="stat-info"><span className="stat-num">{stats.asignados}</span><span className="stat-label">ASIGNADOS</span></div>
                    </div>
                    <div className="stat-card" onClick={function () { setFiltroEstado(filtroEstado === 'RESUELTO' ? '' : 'RESUELTO'); }}>
                        <div className="stat-icon" style={{ background: '#e0e7ff' }}><IconoFa icono={faProgress} clase="stat-icono-svg" style={{ color: '#6366f1' }} /></div>
                        <div className="stat-info"><span className="stat-num">{stats.en_progreso}</span><span className="stat-label">EN PROGRESO</span></div>
                    </div>
                    <div className="stat-card" onClick={function () { setFiltroEstado(filtroEstado === 'CERRADO' ? '' : 'CERRADO'); }}>
                        <div className="stat-icon" style={{ background: '#dcfce7' }}><IconoFa icono={faCheckCircle} clase="stat-icono-svg" style={{ color: '#16a34a' }} /></div>
                        <div className="stat-info"><span className="stat-num">{stats.cerrados}</span><span className="stat-label">CERRADOS</span></div>
                    </div>
                </div>

                {/* ── Donut (izquierda) + Ticket vigente (derecha) ── */}
                <div className="tickets-donut-vigente-row">
                    {/* Donut chart */}
                    <div className="donut-card">
                        <canvas ref={canvasRef} width={220} height={220}></canvas>
                        <div className="donut-legend">
                            {[
                                { label: 'ABIERTOS', valor: stats.abiertos, color: '#d97706' },
                                { label: 'EN PROGRESO', valor: stats.en_progreso, color: '#6366f1' },
                                { label: 'CERRADOS', valor: stats.cerrados, color: '#16a34a' },
                                { label: 'ASIGNADOS', valor: stats.asignados, color: '#2563eb' },
                            ].map(function (item) {
                                var total = stats.abiertos + stats.asignados + stats.en_progreso + stats.cerrados;
                                var pct = total > 0 ? Math.round((item.valor / total) * 100) : 0;
                                return (
                                    <div key={item.label} className="donut-leg-item">
                                        <span className="donut-leg-dot" style={{ background: item.color }}></span>
                                        <span className="donut-leg-label">{item.label}</span>
                                        <span className="donut-leg-pct">{pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Ticket vigente al costado de la donut */}
                    {seleccionado && (function () {
                        var pasoActual = ESTADOS_FLUJO.indexOf(seleccionado.estado);
                        if (pasoActual < 0) pasoActual = 0;
                        return (
                        <div className="ticket-vigente-card">
                            <div className="vigente-top-bar">
                                <button className="btn-cerrar-vigente" onClick={function () { setSeleccionado(null); setCodigoSAP(''); }}>
                                    <IconoFa icono={faTimes} />
                                </button>
                            </div>

                            {/* Layout: texto izquierda, foto derecha */}
                            <div className="vigente-body-row">
                                <div className="vigente-body-left">
                                    <div className="vigente-header">
                                        <span className="detalle-codigo">TICKET: <b>#{seleccionado.id_ticket}</b></span>
                                        <span className="detalle-prioridad" style={{ background: (PRIORIDAD_COLOR[seleccionado.prioridad] || {}).bg || '#f1f5f9', color: (PRIORIDAD_COLOR[seleccionado.prioridad] || {}).color || '#64748b' }}>
                                            {seleccionado.prioridad}
                                        </span>
                                    </div>
                                    <p className="vigente-asunto">{seleccionado.asunto}</p>

                                    {/* Stepper de progreso */}
                                    <div className={'stepper-detalle' + (seleccionado.estado === 'CERRADO' ? ' cerrado' : '')}>
                                        <div className="stepper-det-dots">
                                            {ETIQUETAS_FLUJO.map(function (et, i) {
                                                var completado = i <= pasoActual;
                                                var esActual = i === pasoActual;
                                                var lineaActiva = i < pasoActual;
                                                return (
                                                    <React.Fragment key={et}>
                                                        <div className={'step-det-dot' + (completado ? ' activo' : '') + (esActual ? ' actual' : '')}></div>
                                                        {i < ETIQUETAS_FLUJO.length - 1 && (
                                                            <div className={'step-det-line' + (lineaActiva ? ' activo' : '')}></div>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>
                                        <div className="stepper-det-labels">
                                            {ETIQUETAS_FLUJO.map(function (et, i) {
                                                var completado = i <= pasoActual;
                                                return <span key={et} className={'step-det-label' + (completado ? ' activo' : '')}>{et}</span>;
                                            })}
                                        </div>
                                    </div>

                                    <div className="detalle-info-grid">
                                        <div className="detalle-campo">
                                            <span className="detalle-label">Creador</span>
                                            <span className="detalle-valor">{seleccionado.nombre_creador}</span>
                                        </div>
                                        <div className="detalle-campo">
                                            <span className="detalle-label">Categoría</span>
                                            <span className="detalle-valor">{seleccionado.categoria}</span>
                                        </div>
                                        <div className="detalle-campo">
                                            <span className="detalle-label">Estado</span>
                                            <span className="detalle-valor">
                                                {(ESTADOS_COLOR[seleccionado.estado] || {}).label || seleccionado.estado}
                                            </span>
                                        </div>
                                        <div className="detalle-campo">
                                            <span className="detalle-label">Creado</span>
                                            <span className="detalle-valor">{tiempoRelativo(seleccionado.fech_creacion)}</span>
                                        </div>
                                    </div>

                                    {seleccionado.descripcion && (
                                        <div className="detalle-descripcion">
                                            <span className="detalle-label">Descripción</span>
                                            <p>{seleccionado.descripcion}</p>
                                        </div>
                                    )}
                                </div>

                                {seleccionado.foto && (
                                    <div className="vigente-body-right">
                                        <div className="detalle-foto-square">
                                            <img src={'/assets/tickets/' + seleccionado.foto} alt="adjunto"
                                                onClick={function () { setFotoPreview('/assets/tickets/' + seleccionado.foto); }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Asignar técnico */}
                            {seleccionado.estado !== 'CERRADO' && esRolTI && (
                                <div className="detalle-asignar">
                                    <span className="detalle-label">Técnico asignado</span>
                                    <select value={seleccionado.id_ti || ''} onChange={function (e) {
                                        if (e.target.value) asignarTecnico(seleccionado.id_ticket, e.target.value);
                                    }}>
                                        <option value="">Sin asignar</option>
                                        {tecnicos.map(function (tec) {
                                            return <option key={tec.id_personal} value={tec.id_personal}>{tec.nombre}</option>;
                                        })}
                                    </select>
                                </div>
                            )}

                            {/* Cambiar estado — solo TI */}
                            {seleccionado.estado !== 'CERRADO' && esRolTI && (
                                <div className="detalle-estados-btns">
                                    {['ASIGNADO', 'RESUELTO'].map(function (est) {
                                        if (seleccionado.estado === est) return null;
                                        var info = ESTADOS_COLOR[est];
                                        return (
                                            <button key={est} className="btn-estado-cambio" style={{ background: info.bg, color: info.color }}
                                                onClick={function () { cambiarEstado(est); }} disabled={accionando}>
                                                {info.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Código SAP — solo para tickets SAP y TI */}
                            {seleccionado.es_sap && seleccionado.estado !== 'CERRADO' && esRolTI && (
                                <div className="detalle-sap-code">
                                    <span className="detalle-label">Código SAP (asignar antes de cerrar)</span>
                                    <input type="text" value={codigoSAP} placeholder="Ingrese código SAP..."
                                        onChange={function (e) { setCodigoSAP(e.target.value); }} />
                                </div>
                            )}
                            {seleccionado.es_sap && seleccionado.estado === 'CERRADO' && seleccionado.sap_data && seleccionado.sap_data.codigo_sap && (
                                <div className="detalle-campo" style={{ marginTop: 10 }}>
                                    <span className="detalle-label">Código SAP</span>
                                    <span className="detalle-valor">{seleccionado.sap_data.codigo_sap}</span>
                                </div>
                            )}

                            {/* Cerrar ticket — SOLO TI puede cerrar */}
                            {seleccionado.estado !== 'CERRADO' && esRolTI && (
                                <div className="detalle-cerrar">
                                    <span className="detalle-label">Comentario al cerrar</span>
                                    <textarea rows="3" value={mensajeTI} placeholder="Mensaje para el usuario..."
                                        onChange={function (e) { setMensajeTI(e.target.value); }} />
                                    <button className="btn-cerrar-ticket" onClick={cerrarTicket} disabled={accionando}>
                                        <IconoFa icono={faTimes} /> CERRAR TICKET
                                    </button>
                                </div>
                            )}

                            {seleccionado.estado === 'CERRADO' && seleccionado.mensaje_ti && (
                                <div className="detalle-mensaje-cierre">
                                    <span className="detalle-label">Mensaje de cierre</span>
                                    <p>{seleccionado.mensaje_ti}</p>
                                </div>
                            )}

                            {seleccionado.estado === 'CERRADO' && seleccionado.valoracion && (
                                <div className="detalle-valoracion">
                                    <span className="detalle-label">Valoración del usuario</span>
                                    <div className="val-estrellas-display">
                                        {[1, 2, 3].map(function (n) {
                                            return <IconoFa key={n} icono={faStar} clase={n <= seleccionado.valoracion ? 'val-star-active' : 'val-star-inactive'} />;
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        );
                    })()}
                </div>
                {/* ── Historial: tabla de tickets (ancho completo) ── */}
                <div className="tickets-tabla-panel">
                    <div className="tickets-filtros">
                        <div className="tickets-search-box">
                            <IconoFa icono={faSearch} clase="search-icon" />
                            <input type="text" placeholder="Buscar ticket..." value={busqueda}
                                onChange={function (e) { setBusqueda(e.target.value); }} />
                        </div>
                        {filtroEstado && (
                            <button className="filtro-activo-badge" onClick={function () { setFiltroEstado(''); }}>
                                {ESTADOS_COLOR[filtroEstado]?.label || filtroEstado} <IconoFa icono={faTimes} />
                            </button>
                        )}
                    </div>

                    <div className="tickets-tabla-wrap">
                        <table className="tickets-tabla">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>NOMBRE</th>
                                    <th>CATEGORÍA</th>
                                    <th>PROBLEMA</th>
                                    <th>PRIORIDAD</th>
                                    <th>ASIGNADO</th>
                                    <th>VALORACIÓN</th>
                                    <th>TIEMPO</th>
                                    <th>ESTADO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ticketsFiltrados.length === 0 && (
                                    <tr><td colSpan="9" className="sin-datos">No hay tickets</td></tr>
                                )}
                                {ticketsFiltrados.map(function (t) {
                                    var estilo = ESTADOS_COLOR[t.estado] || { bg: '#f1f5f9', color: '#64748b', label: t.estado };
                                    var activo = seleccionado && seleccionado.id_ticket === t.id_ticket;
                                    return (
                                        <tr key={t.id_ticket}
                                            className={'ticket-fila' + (activo ? ' activa' : '')}
                                            onClick={function () { setSeleccionado(t); setMensajeTI(''); }}>
                                            <td className="td-id">#{t.id_ticket}</td>
                                            <td className="td-nombre">{t.nombre_creador}</td>
                                            <td>{t.categoria}</td>
                                            <td className="td-asunto">{t.asunto}</td>
                                            <td>
                                                <span className="prioridad-badge" style={{ background: (PRIORIDAD_COLOR[t.prioridad] || {}).bg || '#f1f5f9', color: (PRIORIDAD_COLOR[t.prioridad] || {}).color || '#64748b' }}>
                                                    {t.prioridad}
                                                </span>
                                            </td>
                                            <td className="td-asignado">{t.tecnico || '—'}</td>
                                            <td className="td-valoracion">
                                                {t.valoracion ? ('★'.repeat(t.valoracion) + '☆'.repeat(3 - t.valoracion)) : '—'}
                                            </td>
                                            <td className="td-tiempo">{tiempoRelativo(t.fech_creacion)}</td>
                                            <td>
                                                <span className="estado-badge" style={{ background: estilo.bg, color: estilo.color }}>
                                                    {estilo.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {fotoPreview && <ModalImagen url={fotoPreview} onCerrar={function () { setFotoPreview(null); }} />}

            </div>
        </PageContent>
    );
}
