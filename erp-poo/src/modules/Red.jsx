import { useState, useEffect } from 'react';
import { API_URL, headersConToken } from '../auth';
import IconoFa from '../components/IconoFa';
import PageContent from '../components/PageContent';
import {
    faNetworkWired, faSearch, faChevronDown, faChevronRight,
    faPen, faFloppyDisk, faXmark, faCheckDouble, faServer,
    faTowerBroadcast, faVideo, faPrint, faBriefcase, faStore,
    faClipboardList, faCogs, faCircle, faTag
} from '@fortawesome/free-solid-svg-icons';
import '../styles/Red.css';

var ICONO_ETIQUETA = {
    SERVIDORES: faServer,
    REPETIDORES: faTowerBroadcast,
    NVR: faVideo,
    CAMARAS: faVideo,
    IMPRESORAS: faPrint,
    GERENCIA: faBriefcase,
    COMERCIAL: faStore,
    ADMINISTRACION: faClipboardList,
    OPERACIONES: faCogs,
    LIBRE: faCircle,
};

var COLOR_ETIQUETA = {
    SERVIDORES: '#2563eb',
    REPETIDORES: '#7c3aed',
    NVR: '#dc2626',
    CAMARAS: '#ea580c',
    IMPRESORAS: '#0891b2',
    GERENCIA: '#4f46e5',
    COMERCIAL: '#16a34a',
    ADMINISTRACION: '#d97706',
    OPERACIONES: '#0d9488',
    LIBRE: '#6b7280',
    SIN_ASIGNAR: '#9ca3af',
};

export default function Red() {
    var [ips, setIps] = useState([]);
    var [etiquetas, setEtiquetas] = useState([]);
    var [resumen, setResumen] = useState({});
    var [catalogos, setCatalogos] = useState({ etiquetas: [], equipos: [] });
    var [cargando, setCargando] = useState(true);
    var [filtro, setFiltro] = useState('');
    var [mensaje, setMensaje] = useState('');
    var [exito, setExito] = useState(false);

    // Grupo expandido
    var [expandido, setExpandido] = useState(null);

    // Edición inline
    var [editandoId, setEditandoId] = useState(null);
    var [formEditar, setFormEditar] = useState({ etiqueta: '', descripcion: '', id_equipo: '' });

    // Selección múltiple
    var [seleccionados, setSeleccionados] = useState([]);
    var [etiquetaMasiva, setEtiquetaMasiva] = useState('');

    useEffect(function () { cargarDatos(); }, []);

    function cargarDatos() {
        setCargando(true);
        Promise.all([
            fetch(API_URL + '/red', { headers: headersConToken() }).then(function (r) { return r.json(); }),
            fetch(API_URL + '/red/catalogos', { headers: headersConToken() }).then(function (r) { return r.json(); }),
        ]).then(function (res) {
            var data = res[0] || {};
            setIps(Array.isArray(data.ips) ? data.ips : []);
            setEtiquetas(Array.isArray(data.etiquetas) ? data.etiquetas : []);
            setResumen(data.resumen || {});
            setCatalogos(res[1] || { etiquetas: [], equipos: [] });
        }).catch(function () {
            mostrarMensaje('Error cargando datos de red', false);
        }).finally(function () {
            setCargando(false);
        });
    }

    function mostrarMensaje(msg, ok) {
        setMensaje(msg);
        setExito(ok);
        if (ok) setTimeout(function () { setMensaje(''); }, 2500);
    }

    // Estadísticas
    var totalIps = ips.length;
    var asignadas = ips.filter(function (i) { return i.etiqueta; }).length;
    var sinAsignar = totalIps - asignadas;

    // Filtrar IPs
    function ipsFiltradas() {
        var lista = ips;
        if (filtro.trim()) {
            var q = filtro.toLowerCase();
            lista = lista.filter(function (i) {
                return (i.ip && i.ip.toLowerCase().indexOf(q) >= 0) ||
                    (i.descripcion && i.descripcion.toLowerCase().indexOf(q) >= 0) ||
                    (i.etiqueta && i.etiqueta.toLowerCase().indexOf(q) >= 0);
            });
        }
        return lista;
    }

    // Agrupar IPs por etiqueta
    function gruposIps() {
        var lista = ipsFiltradas();
        var grupos = {};

        // Inicializar todos los grupos del enum
        etiquetas.forEach(function (et) { grupos[et] = []; });
        grupos['SIN_ASIGNAR'] = [];

        lista.forEach(function (ip) {
            var key = ip.etiqueta || 'SIN_ASIGNAR';
            if (!grupos[key]) grupos[key] = [];
            grupos[key].push(ip);
        });

        return grupos;
    }

    function toggleGrupo(grupo) {
        setExpandido(expandido === grupo ? null : grupo);
        setEditandoId(null);
        setSeleccionados([]);
    }

    // ── Edición inline ──
    function iniciarEdicion(ip) {
        setEditandoId(ip.id_ip);
        setFormEditar({
            etiqueta: ip.etiqueta || '',
            descripcion: ip.descripcion || '',
            id_equipo: ip.id_equipo || '',
        });
    }

    function cancelarEdicion() {
        setEditandoId(null);
        setFormEditar({ etiqueta: '', descripcion: '', id_equipo: '' });
    }

    function guardarEdicion(id_ip) {
        fetch(API_URL + '/red/' + id_ip, {
            method: 'PUT',
            headers: headersConToken(),
            body: JSON.stringify({
                etiqueta: formEditar.etiqueta,
                descripcion: formEditar.descripcion,
                id_equipo: formEditar.id_equipo ? Number(formEditar.id_equipo) : 0,
            }),
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res.ok) {
                    mostrarMensaje('IP actualizada', true);
                    cancelarEdicion();
                    cargarDatos();
                } else {
                    mostrarMensaje(res.detail || 'Error al actualizar', false);
                }
            })
            .catch(function () { mostrarMensaje('Error de conexión', false); });
    }

    // ── Selección múltiple ──
    function toggleSeleccion(id_ip) {
        if (seleccionados.indexOf(id_ip) >= 0) {
            setSeleccionados(seleccionados.filter(function (s) { return s !== id_ip; }));
        } else {
            setSeleccionados(seleccionados.concat([id_ip]));
        }
    }

    function seleccionarTodos(grupo) {
        var ids = grupo.map(function (ip) { return ip.id_ip; });
        var todosSeleccionados = ids.every(function (id) { return seleccionados.indexOf(id) >= 0; });
        if (todosSeleccionados) {
            setSeleccionados(seleccionados.filter(function (s) { return ids.indexOf(s) < 0; }));
        } else {
            var nuevos = ids.filter(function (id) { return seleccionados.indexOf(id) < 0; });
            setSeleccionados(seleccionados.concat(nuevos));
        }
    }

    function aplicarEtiquetaMasiva() {
        if (seleccionados.length === 0) return;
        fetch(API_URL + '/red/masivo/etiqueta', {
            method: 'PUT',
            headers: headersConToken(),
            body: JSON.stringify({ ids: seleccionados, etiqueta: etiquetaMasiva }),
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res.ok) {
                    mostrarMensaje(res.actualizados + ' IPs actualizadas', true);
                    setSeleccionados([]);
                    setEtiquetaMasiva('');
                    cargarDatos();
                } else {
                    mostrarMensaje(res.detail || 'Error', false);
                }
            })
            .catch(function () { mostrarMensaje('Error de conexión', false); });
    }

    var grupos = gruposIps();
    // Orden: etiquetas del enum, luego SIN_ASIGNAR al final
    var ordenGrupos = etiquetas.concat(['SIN_ASIGNAR']);

    return (
        <PageContent>
            <div className="red-container">
                <h2 className="red-titulo">
                    <IconoFa icono={faNetworkWired} /> Administración de Red
                </h2>
                <p className="red-subtitulo">Gestión de direcciones IP por segmento</p>

                {mensaje && (
                    <div className={'red-mensaje ' + (exito ? 'exito' : 'error')}>
                        {mensaje}
                        {!exito && <button className="red-msg-cerrar" onClick={function () { setMensaje(''); }}><IconoFa icono={faXmark} /></button>}
                    </div>
                )}

                {/* Estadísticas */}
                <div className="red-stats">
                    <div className="red-stat total">
                        <span className="red-stat-num">{totalIps}</span>
                        <span className="red-stat-label">Total IPs</span>
                    </div>
                    <div className="red-stat asignadas">
                        <span className="red-stat-num">{asignadas}</span>
                        <span className="red-stat-label">Asignadas</span>
                    </div>
                    <div className="red-stat libres">
                        <span className="red-stat-num">{sinAsignar}</span>
                        <span className="red-stat-label">Sin Asignar</span>
                    </div>
                </div>

                {/* Buscador */}
                <div className="red-filtros">
                    <div className="red-search">
                        <IconoFa icono={faSearch} clase="red-search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por IP, descripción o etiqueta..."
                            value={filtro}
                            onChange={function (e) { setFiltro(e.target.value); }}
                            className="red-search-input"
                        />
                    </div>
                </div>

                {/* Asignación masiva */}
                {seleccionados.length > 0 && (
                    <div className="red-masivo">
                        <span className="red-masivo-count">{seleccionados.length} seleccionada(s)</span>
                        <select
                            value={etiquetaMasiva}
                            onChange={function (e) { setEtiquetaMasiva(e.target.value); }}
                            className="red-masivo-select"
                        >
                            <option value="">— Quitar etiqueta —</option>
                            {etiquetas.map(function (et) {
                                return <option key={et} value={et}>{et}</option>;
                            })}
                        </select>
                        <button className="red-masivo-btn" onClick={aplicarEtiquetaMasiva}>
                            <IconoFa icono={faCheckDouble} /> Aplicar
                        </button>
                        <button className="red-masivo-btn cancelar" onClick={function () { setSeleccionados([]); }}>
                            <IconoFa icono={faXmark} /> Cancelar
                        </button>
                    </div>
                )}

                {cargando ? (
                    <p className="red-cargando">Cargando datos de red...</p>
                ) : (
                    <div className="red-grupos">
                        {ordenGrupos.map(function (grupo) {
                            var ipsGrupo = grupos[grupo] || [];
                            if (ipsGrupo.length === 0 && filtro.trim()) return null;
                            var abierto = expandido === grupo;
                            var color = COLOR_ETIQUETA[grupo] || '#6b7280';
                            var icono = ICONO_ETIQUETA[grupo] || faTag;
                            var cantidadReal = resumen[grupo] || 0;
                            var cantidadFiltrada = ipsGrupo.length;

                            return (
                                <div key={grupo} className={'red-grupo' + (abierto ? ' abierto' : '')}>
                                    <button
                                        className="red-grupo-header"
                                        onClick={function () { toggleGrupo(grupo); }}
                                        style={{ borderLeftColor: color }}
                                    >
                                        <div className="red-grupo-info">
                                            <IconoFa icono={icono} clase="red-grupo-icono" style={{ color: color }} />
                                            <span className="red-grupo-nombre">{grupo === 'SIN_ASIGNAR' ? 'SIN ASIGNAR' : grupo}</span>
                                            <span className="red-grupo-count" style={{ background: color }}>
                                                {filtro.trim() ? cantidadFiltrada + '/' + cantidadReal : cantidadReal}
                                            </span>
                                        </div>
                                        <IconoFa icono={abierto ? faChevronDown : faChevronRight} clase="red-grupo-flecha" />
                                    </button>

                                    {abierto && (
                                        <div className="red-grupo-body">
                                            {ipsGrupo.length === 0 ? (
                                                <p className="red-vacio">No hay IPs en este grupo</p>
                                            ) : (
                                                <table className="red-tabla">
                                                    <thead>
                                                        <tr>
                                                            <th className="red-th-check">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={ipsGrupo.length > 0 && ipsGrupo.every(function (ip) { return seleccionados.indexOf(ip.id_ip) >= 0; })}
                                                                    onChange={function () { seleccionarTodos(ipsGrupo); }}
                                                                />
                                                            </th>
                                                            <th>IP</th>
                                                            <th>Etiqueta</th>
                                                            <th>Descripción</th>
                                                            <th>Equipo</th>
                                                            <th className="red-th-acc">Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {ipsGrupo.map(function (ip) {
                                                            var esEditando = editandoId === ip.id_ip;
                                                            return (
                                                                <tr key={ip.id_ip} className={seleccionados.indexOf(ip.id_ip) >= 0 ? 'red-fila-sel' : ''}>
                                                                    <td className="red-td-check">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={seleccionados.indexOf(ip.id_ip) >= 0}
                                                                            onChange={function () { toggleSeleccion(ip.id_ip); }}
                                                                        />
                                                                    </td>
                                                                    <td className="red-td-ip">{ip.ip}</td>
                                                                    <td>
                                                                        {esEditando ? (
                                                                            <select
                                                                                value={formEditar.etiqueta}
                                                                                onChange={function (e) { setFormEditar(Object.assign({}, formEditar, { etiqueta: e.target.value })); }}
                                                                                className="red-edit-select"
                                                                            >
                                                                                <option value="">Sin etiqueta</option>
                                                                                {etiquetas.map(function (et) {
                                                                                    return <option key={et} value={et}>{et}</option>;
                                                                                })}
                                                                            </select>
                                                                        ) : (
                                                                            <span className="red-etiqueta-badge" style={{ background: COLOR_ETIQUETA[ip.etiqueta] || '#e5e7eb', color: ip.etiqueta ? '#fff' : '#666' }}>
                                                                                {ip.etiqueta || '—'}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        {esEditando ? (
                                                                            <input
                                                                                type="text"
                                                                                value={formEditar.descripcion}
                                                                                onChange={function (e) { setFormEditar(Object.assign({}, formEditar, { descripcion: e.target.value })); }}
                                                                                className="red-edit-input"
                                                                                placeholder="Descripción"
                                                                            />
                                                                        ) : (
                                                                            <span className="red-td-desc">{ip.descripcion || '—'}</span>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        {esEditando ? (
                                                                            <select
                                                                                value={formEditar.id_equipo}
                                                                                onChange={function (e) { setFormEditar(Object.assign({}, formEditar, { id_equipo: e.target.value })); }}
                                                                                className="red-edit-select"
                                                                            >
                                                                                <option value="">Sin equipo</option>
                                                                                {catalogos.equipos.map(function (eq) {
                                                                                    return <option key={eq.id} value={eq.id}>{eq.serie || eq.nombre || 'Equipo #' + eq.id}</option>;
                                                                                })}
                                                                            </select>
                                                                        ) : (
                                                                            <span>{ip.equipo ? (ip.equipo.serie || ip.equipo.nombre || '#' + ip.equipo.id) : '—'}</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="red-td-acc">
                                                                        {esEditando ? (
                                                                            <>
                                                                                <button className="red-btn-acc guardar" onClick={function () { guardarEdicion(ip.id_ip); }} title="Guardar">
                                                                                    <IconoFa icono={faFloppyDisk} />
                                                                                </button>
                                                                                <button className="red-btn-acc cancelar" onClick={cancelarEdicion} title="Cancelar">
                                                                                    <IconoFa icono={faXmark} />
                                                                                </button>
                                                                            </>
                                                                        ) : (
                                                                            <button className="red-btn-acc editar" onClick={function () { iniciarEdicion(ip); }} title="Editar">
                                                                                <IconoFa icono={faPen} />
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </PageContent>
    );
}
