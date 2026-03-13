import { useState, useEffect, useCallback } from 'react';
import IconoFa from '../components/IconoFa';
import { faCakeCandles, faEnvelopeOpenText, faUserClock, faChevronDown, faChevronUp, faGift, faCalendarDay, faHourglassHalf, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { headersConToken, API_URL } from '../auth';
import '../styles/SaludosCumpleanos.css';

// ═══════════════════════════════════════════════════════════════════
// SaludosCumpleanos — Módulo para Marketing
//
// Muestra:
// 1. Cumpleaños activos de hoy
// 2. Saludos recibidos (nombre + mensaje) en 2 columnas
// 3. Lista de quiénes aún no han enviado saludo
// ═══════════════════════════════════════════════════════════════════
export default function SaludosCumpleanos() {
    var [cumpleActivos, setCumpleActivos] = useState([]);
    var [seleccionado, setSeleccionado] = useState(null);
    var [saludos, setSaludos] = useState([]);
    var [faltantes, setFaltantes] = useState([]);
    var [totalFaltantes, setTotalFaltantes] = useState(0);
    var [cargando, setCargando] = useState(true);
    var [tab, setTab] = useState('faltantes'); // 'faltantes' | 'saludos'

    // Cargar cumpleaños activos
    var cargarActivos = useCallback(function () {
        setCargando(true);
        fetch(API_URL + '/saludos-cumpleanos/activos', { headers: headersConToken() })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (Array.isArray(data)) {
                    setCumpleActivos(data);
                    if (data.length > 0 && !seleccionado) {
                        setSeleccionado(data[0]);
                    }
                }
            })
            .catch(function () {})
            .finally(function () { setCargando(false); });
    }, []);

    // Cargar saludos y faltantes del seleccionado
    var cargarDetalle = useCallback(function () {
        if (!seleccionado) return;
        var id = seleccionado.id_personal;

        Promise.all([
            fetch(API_URL + '/saludos-cumpleanos/' + id + '/recopilado', { headers: headersConToken() }).then(function (r) { return r.json(); }),
            fetch(API_URL + '/saludos-cumpleanos/' + id + '/faltantes', { headers: headersConToken() }).then(function (r) { return r.json(); }),
        ]).then(function (resultados) {
            var recopilado = resultados[0];
            var faltantesData = resultados[1];
            setSaludos(recopilado.saludos || []);
            setFaltantes(faltantesData.faltantes || []);
            setTotalFaltantes(faltantesData.total || 0);
        }).catch(function () {});
    }, [seleccionado]);

    useEffect(function () { cargarActivos(); }, [cargarActivos]);
    useEffect(function () { cargarDetalle(); }, [cargarDetalle]);

    // Auto-refresh cada 15 segundos
    useEffect(function () {
        var intervalo = setInterval(function () {
            cargarActivos();
            cargarDetalle();
        }, 15000);
        return function () { clearInterval(intervalo); };
    }, [cargarActivos, cargarDetalle]);

    function seleccionarCumple(cumple) {
        setSeleccionado(cumple);
        setTab('faltantes');
    }

    if (cargando) {
        return (
            <div className="saludos-contenedor">
                <div className="saludos-cargando">Cargando cumpleaños del día...</div>
            </div>
        );
    }

    if (cumpleActivos.length === 0) {
        return (
            <div className="saludos-contenedor">
                <div className="saludos-header">
                    <IconoFa icono={faCakeCandles} clase="saludos-header-icono" />
                    <h2 className="saludos-titulo">Saludos de Cumpleaños</h2>
                </div>
                <div className="saludos-vacio">
                    <div className="saludos-vacio-icono"><IconoFa icono={faCakeCandles} /></div>
                    <p>No hay cumpleaños hoy.</p>
                    <p className="saludos-vacio-sub">Cuando haya un cumpleañero, aquí verás los saludos recopilados.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="saludos-contenedor">
            <div className="saludos-header">
                <IconoFa icono={faCakeCandles} clase="saludos-header-icono" />
                <h2 className="saludos-titulo">Saludos de Cumpleaños</h2>
            </div>

            {/* Lista de cumpleañeros de hoy */}
            <div className="saludos-cumples-lista">
                {cumpleActivos.map(function (c) {
                    var activo = seleccionado && seleccionado.id_personal === c.id_personal;
                    return (
                        <button
                            key={c.id_personal}
                            className={'saludos-cumple-card' + (activo ? ' activo' : '')}
                            onClick={function () { seleccionarCumple(c); }}
                        >
                            <div className="saludos-cumple-emoji">{c.dias_para === 0 ? <IconoFa icono={faCakeCandles} /> : <IconoFa icono={faCalendarDay} />}</div>
                            <div className="saludos-cumple-info">
                                <span className="saludos-cumple-nombre">{c.nombre}</span>
                                <span className="saludos-cumple-etiqueta">{c.etiqueta}</span>
                                <span className="saludos-cumple-progreso">
                                    {c.total_saludos}/{c.total_personal} saludos
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {seleccionado && (
                <div className="saludos-detalle">
                    {/* Tabs */}
                    <div className="saludos-tabs">
                        <button
                            className={'saludos-tab' + (tab === 'faltantes' ? ' activo' : '')}
                            onClick={function () { setTab('faltantes'); }}
                        >
                            <IconoFa icono={faUserClock} />
                            <span>Pendientes ({totalFaltantes})</span>
                        </button>
                        <button
                            className={'saludos-tab' + (tab === 'saludos' ? ' activo' : '')}
                            onClick={function () { setTab('saludos'); }}
                        >
                            <IconoFa icono={faEnvelopeOpenText} />
                            <span>Saludos Recibidos ({saludos.length})</span>
                        </button>
                    </div>

                    {/* Contenido de faltantes (tab principal) */}
                    {tab === 'faltantes' && (
                        <div className="saludos-faltantes-lista">
                            {faltantes.length === 0 ? (
                                <div className="saludos-grid-vacio">
                                    <p><IconoFa icono={faCircleCheck} /> ¡Todos ya enviaron su saludo!</p>
                                </div>
                            ) : (
                                faltantes.map(function (f, i) {
                                    return (
                                        <div key={i} className="faltante-item">
                                            <div className="faltante-icono"><IconoFa icono={faHourglassHalf} /></div>
                                            <span className="faltante-nombre">{f.nombre}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Contenido de saludos recibidos */}
                    {tab === 'saludos' && (
                        <div className="saludos-grid">
                            {saludos.length === 0 ? (
                                <div className="saludos-grid-vacio">
                                    <IconoFa icono={faGift} clase="saludos-grid-vacio-icono" />
                                    <p>Aún no se han recibido saludos.</p>
                                </div>
                            ) : (
                                saludos.map(function (s, i) {
                                    return (
                                        <div key={i} className="saludo-card">
                                            <div className="saludo-card-header">
                                                <span className="saludo-card-nombre">{s.nombre}</span>
                                            </div>
                                            <p className="saludo-card-mensaje">{s.mensaje}</p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
