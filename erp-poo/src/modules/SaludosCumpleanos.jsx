import { useState, useEffect, useCallback, useRef, memo } from 'react';
import IconoFa from '../components/IconoFa';
import { faCakeCandles, faEnvelopeOpenText, faUserClock, faChevronDown, faChevronUp, faGift, faCalendarDay, faHourglassHalf, faCircleCheck, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import { headersConToken, API_URL } from '../auth';
import '../styles/SaludosCumpleanos.css';

// ─── Sub-componente memoizado: Tarjeta de saludo ─────────────
var SaludoCard = memo(function SaludoCard(props) {
    var s = props.saludo;
    var i = props.indice;
    var copiado = props.copiado;
    var onCopiar = props.onCopiar;

    var esImagenSticker = s.sticker && typeof s.sticker === 'string' && s.sticker.startsWith('/');

    // Texto para copiar: el mensaje ya contiene los emojis inline
    var textoParaCopiar = s.nombre + ':\n' + s.mensaje;

    return (
        <div className="saludo-card">
            <div className="saludo-card-header">
                <span className="saludo-card-nombre">{s.nombre}</span>
                <button
                    className={'saludo-copiar-btn' + (copiado === i ? ' copiado' : '')}
                    title="Copiar mensaje"
                    onClick={function () { onCopiar(textoParaCopiar, i); }}
                >
                    <IconoFa icono={copiado === i ? faCheck : faCopy} />
                    <span>{copiado === i ? '¡Copiado!' : 'Copiar'}</span>
                </button>
            </div>
            <p className="saludo-card-mensaje">{s.mensaje}</p>
            {esImagenSticker && (
                <div className="saludo-card-sticker">
                    <img src={typeof s.sticker === 'object' ? s.sticker.img : s.sticker} alt="sticker" className="saludo-card-sticker-img" />
                </div>
            )}
        </div>
    );
});

// ─── Sub-componente memoizado: Lista de faltantes ────────────
var FaltantesLista = memo(function FaltantesLista(props) {
    var faltantes = props.faltantes;
    if (faltantes.length === 0) {
        return (
            <div className="saludos-faltantes-lista">
                <div className="saludos-grid-vacio">
                    <p><IconoFa icono={faCircleCheck} /> ¡Todos ya enviaron su saludo!</p>
                </div>
            </div>
        );
    }
    return (
        <div className="saludos-faltantes-lista">
            {faltantes.map(function (f, i) {
                return (
                    <div key={i} className="faltante-item">
                        <div className="faltante-icono"><IconoFa icono={faHourglassHalf} /></div>
                        <span className="faltante-nombre">{f.nombre}</span>
                    </div>
                );
            })}
        </div>
    );
});

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
    var [copiado, setCopiado] = useState(null); // id del saludo copiado temporalmente

    // Refs para evitar actualizaciones innecesarias de estado
    var prevActivosRef = useRef(null);
    var prevSaludosRef = useRef(null);
    var prevFaltantesRef = useRef(null);
    var cargaInicialRef = useRef(true);

    function copiarSaludo(texto, idx) {
        function marcarCopiado() {
            setCopiado(idx);
            setTimeout(function () { setCopiado(null); }, 1500);
        }
        // Intentar con Clipboard API (requiere HTTPS o localhost)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto).then(marcarCopiado).catch(function () {
                // Fallback para contextos inseguros (HTTP)
                copiarFallback(texto, marcarCopiado);
            });
        } else {
            copiarFallback(texto, marcarCopiado);
        }
    }

    function copiarFallback(texto, onExito) {
        try {
            var ta = document.createElement('textarea');
            ta.value = texto;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            ta.style.top = '-9999px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            var ok = document.execCommand('copy');
            document.body.removeChild(ta);
            if (ok) { onExito(); }
        } catch (e) {
            console.error('Error al copiar:', e);
        }
    }

    // Cargar cumpleaños activos
    var cargarActivos = useCallback(function () {
        // Solo mostrar "cargando" en la primera carga
        if (cargaInicialRef.current) setCargando(true);
        fetch(API_URL + '/saludos-cumpleanos/activos', { headers: headersConToken() })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (Array.isArray(data)) {
                    var nuevoJSON = JSON.stringify(data);
                    if (nuevoJSON !== prevActivosRef.current) {
                        prevActivosRef.current = nuevoJSON;
                        setCumpleActivos(data);
                        if (data.length > 0 && !seleccionado) {
                            setSeleccionado(data[0]);
                        }
                    }
                }
            })
            .catch(function () {})
            .finally(function () {
                if (cargaInicialRef.current) {
                    setCargando(false);
                    cargaInicialRef.current = false;
                }
            });
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

            var saludosJSON = JSON.stringify(recopilado.saludos || []);
            if (saludosJSON !== prevSaludosRef.current) {
                prevSaludosRef.current = saludosJSON;
                setSaludos(recopilado.saludos || []);
            }

            var faltantesJSON = JSON.stringify(faltantesData.faltantes || []);
            if (faltantesJSON !== prevFaltantesRef.current) {
                prevFaltantesRef.current = faltantesJSON;
                setFaltantes(faltantesData.faltantes || []);
                setTotalFaltantes(faltantesData.total || 0);
            }
        }).catch(function () {});
    }, [seleccionado]);

    useEffect(function () { cargarActivos(); }, [cargarActivos]);
    useEffect(function () { cargarDetalle(); }, [cargarDetalle]);

    // Auto-refresh cada 45 segundos (silencioso, sin flicker)
    useEffect(function () {
        var intervalo = setInterval(function () {
            cargarActivos();
            cargarDetalle();
        }, 45000);
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
                        <FaltantesLista faltantes={faltantes} />
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
                                        <SaludoCard
                                            key={i}
                                            saludo={s}
                                            indice={i}
                                            copiado={copiado}
                                            onCopiar={copiarSaludo}
                                        />
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
