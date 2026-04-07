import { useState, useEffect, useCallback, useRef } from 'react';
import { API_URL, headersConToken, headersAuth } from '../auth';
import { getSession, clearSession } from '../utils/session';
import { useNavigate } from 'react-router-dom';
import PageContent from '../components/PageContent';
import IconoFa from '../components/IconoFa';
import { faWrench, faPlus, faSearch, faEdit, faTrash, faCalendarAlt, faUser, faLaptop, faCheckCircle, faClock, faBan, faTimes, faTools, faClipboardList, faArrowsRotate, faSave, faCamera, faImage } from '@fortawesome/free-solid-svg-icons';
import '../styles/Mantenimiento.css';

var ESTADOS_ICON = {
    PENDIENTE:   { icono: faClock,               clase: 'mnt-st-pendiente' },
    EN_PROCESO:  { icono: faArrowsRotate,        clase: 'mnt-st-proceso' },
    COMPLETADO:  { icono: faCheckCircle,          clase: 'mnt-st-completado' },
    CANCELADO:   { icono: faBan,                  clase: 'mnt-st-cancelado' },
};

var TIPO_MANT_ICON = {
    PREVENTIVO:  { icono: faTools,      clase: 'mnt-tipo-preventivo' },
    PROGRAMADO:  { icono: faCalendarAlt, clase: 'mnt-tipo-programado' },
    REPARACION:  { icono: faWrench,     clase: 'mnt-tipo-reparacion' },
};

function formatFecha(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatFechaInput(iso) {
    if (!iso) return '';
    return iso.substring(0, 10);
}

function calcularFechaProg(periodo) {
    var hoy = new Date();
    var meses = 3;
    if (periodo === 'SEMESTRAL') meses = 6;
    if (periodo === 'ANUAL') meses = 12;
    hoy.setMonth(hoy.getMonth() + meses);
    var y = hoy.getFullYear();
    var m = String(hoy.getMonth() + 1).padStart(2, '0');
    var d = String(hoy.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}

export default function Mantenimiento() {
    var navigate = useNavigate();
    var session = getSession();
    var [mantenimientos, setMantenimientos] = useState([]);
    var [catalogos, setCatalogos] = useState({ equipos: [], tecnicos: [], tipos_mantenimiento: [], estados: [], periodos: [] });
    var [cargando, setCargando] = useState(true);
    var [busqueda, setBusqueda] = useState('');
    var [filtroEstado, setFiltroEstado] = useState('');
    var [filtroTipo, setFiltroTipo] = useState('');
    var [filtroPeriodo, setFiltroPeriodo] = useState('');
    var [modalAbierto, setModalAbierto] = useState(false);
    var [editando, setEditando] = useState(null);
    var [guardando, setGuardando] = useState(false);
    var [mensaje, setMensaje] = useState(null);

    /* Fotos */
    var [foto1Preview, setFoto1Preview] = useState('');
    var [foto2Preview, setFoto2Preview] = useState('');
    var [foto1File, setFoto1File] = useState(null);
    var [foto2File, setFoto2File] = useState(null);
    var foto1Ref = useRef(null);
    var foto2Ref = useRef(null);

    var formInicial = {
        id_equipo: '',
        id_tecnico: '',
        tipo_mantenimiento: 'PREVENTIVO',
        tipo_periodo: 'TRIMESTRAL',
        estado: 'PENDIENTE',
        fecha_prog: calcularFechaProg('TRIMESTRAL'),
        fecha_mant: '',
        detalle: '',
    };
    var [form, setForm] = useState(formInicial);

    function handleAuth(r) {
        if (r.status === 401) { clearSession(); navigate('/'); return null; }
        return r.ok ? r.json() : Promise.reject();
    }

    var cargarDatos = useCallback(function () {
        setCargando(true);
        Promise.all([
            fetch(API_URL + '/mantenimientos', { headers: headersConToken() }).then(handleAuth),
            fetch(API_URL + '/mantenimientos/catalogos', { headers: headersConToken() }).then(handleAuth),
        ]).then(function (data) {
            if (data[0]) setMantenimientos(data[0]);
            if (data[1]) setCatalogos(data[1]);
            setCargando(false);
        }).catch(function () { setCargando(false); });
    }, []);

    useEffect(function () { cargarDatos(); }, [cargarDatos]);

    function mostrarMsg(texto, tipo) {
        setMensaje({ texto: texto, tipo: tipo || 'ok' });
        setTimeout(function () { setMensaje(null); }, 3500);
    }

    function resetFotos() {
        setFoto1Preview('');
        setFoto2Preview('');
        setFoto1File(null);
        setFoto2File(null);
    }

    function abrirCrear() {
        setEditando(null);
        setForm(Object.assign({}, formInicial, { fecha_prog: calcularFechaProg('TRIMESTRAL') }));
        resetFotos();
        setModalAbierto(true);
    }

    function abrirEditar(m) {
        setEditando(m);
        setForm({
            id_equipo: m.id_equipo || '',
            id_tecnico: m.id_tecnico || '',
            tipo_mantenimiento: m.tipo_mantenimiento || 'PREVENTIVO',
            tipo_periodo: m.tipo_periodo || 'TRIMESTRAL',
            estado: m.estado || 'PENDIENTE',
            fecha_prog: formatFechaInput(m.fecha_prog),
            fecha_mant: formatFechaInput(m.fecha_mant),
            detalle: m.detalle || '',
        });
        setFoto1Preview(m.foto1 || '');
        setFoto2Preview(m.foto2 || '');
        setFoto1File(null);
        setFoto2File(null);
        setModalAbierto(true);
    }

    function cerrarModal() {
        setModalAbierto(false);
        setEditando(null);
        setForm(formInicial);
        resetFotos();
    }

    function handleChange(e) {
        var nombre = e.target.name;
        var valor = e.target.value;
        setForm(function (prev) {
            var nuevo = Object.assign({}, prev);
            nuevo[nombre] = valor;
            /* Auto-calcular fecha programada al cambiar periodo (solo al crear) */
            if (nombre === 'tipo_periodo' && !editando) {
                nuevo.fecha_prog = calcularFechaProg(valor);
            }
            return nuevo;
        });
    }

    function handleFoto(e, num) {
        var archivo = e.target.files[0];
        if (!archivo) return;
        var url = URL.createObjectURL(archivo);
        if (num === 1) { setFoto1File(archivo); setFoto1Preview(url); }
        else { setFoto2File(archivo); setFoto2Preview(url); }
    }

    function subirFoto(idMant, archivo, num) {
        var fd = new FormData();
        fd.append('foto', archivo);
        return fetch(API_URL + '/mantenimientos/' + idMant + '/foto/' + num, {
            method: 'POST',
            headers: headersAuth(),
            body: fd,
        }).then(function (r) { return r.json(); });
    }

    function guardar(e) {
        e.preventDefault();
        if (!form.id_equipo || !form.tipo_mantenimiento || !form.fecha_prog) {
            mostrarMsg('Completa los campos requeridos', 'error');
            return;
        }
        setGuardando(true);

        var url = editando
            ? API_URL + '/mantenimientos/' + editando.id
            : API_URL + '/mantenimientos';
        var method = editando ? 'PUT' : 'POST';

        var body = {
            id_equipo: Number(form.id_equipo),
            id_tecnico: form.id_tecnico ? Number(form.id_tecnico) : null,
            tipo_mantenimiento: form.tipo_mantenimiento,
            tipo_periodo: form.tipo_periodo,
            estado: form.estado,
            fecha_prog: form.fecha_prog,
            fecha_mant: form.fecha_mant || form.fecha_prog,
            detalle: form.detalle,
        };

        fetch(url, {
            method: method,
            headers: Object.assign({ 'Content-Type': 'application/json' }, headersConToken()),
            body: JSON.stringify(body),
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.ok) {
                    var idMant = data.id || (editando && editando.id);
                    /* Subir fotos si hay archivos nuevos */
                    var promesas = [];
                    if (foto1File && idMant) promesas.push(subirFoto(idMant, foto1File, 1));
                    if (foto2File && idMant) promesas.push(subirFoto(idMant, foto2File, 2));
                    if (promesas.length > 0) {
                        Promise.all(promesas).then(function () {
                            setGuardando(false);
                            mostrarMsg(editando ? 'Mantenimiento actualizado' : 'Mantenimiento creado');
                            cerrarModal();
                            cargarDatos();
                        });
                    } else {
                        setGuardando(false);
                        mostrarMsg(editando ? 'Mantenimiento actualizado' : 'Mantenimiento creado');
                        cerrarModal();
                        cargarDatos();
                    }
                } else {
                    setGuardando(false);
                    mostrarMsg(data.detail || 'Error al guardar', 'error');
                }
            })
            .catch(function () {
                setGuardando(false);
                mostrarMsg('Error de conexión', 'error');
            });
    }

    function eliminar(m) {
        if (!window.confirm('¿Eliminar este mantenimiento? Esta acción no se puede deshacer.')) return;
        fetch(API_URL + '/mantenimientos/' + m.id, {
            method: 'DELETE',
            headers: headersConToken(),
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.ok) {
                    mostrarMsg('Mantenimiento eliminado');
                    cargarDatos();
                }
            });
    }

    function cambiarEstado(m, nuevoEstado) {
        fetch(API_URL + '/mantenimientos/' + m.id + '/estado', {
            method: 'PATCH',
            headers: Object.assign({ 'Content-Type': 'application/json' }, headersConToken()),
            body: JSON.stringify({ estado: nuevoEstado }),
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.ok) {
                    mostrarMsg('Estado actualizado a ' + nuevoEstado);
                    cargarDatos();
                }
            });
    }

    // Filtrar
    var filtrados = mantenimientos.filter(function (m) {
        if (filtroEstado && m.estado !== filtroEstado) return false;
        if (filtroTipo && m.tipo_mantenimiento !== filtroTipo) return false;
        if (filtroPeriodo && m.tipo_periodo !== filtroPeriodo) return false;
        if (busqueda) {
            var q = busqueda.toLowerCase();
            var texto = (m.codigoe + ' ' + m.marca + ' ' + m.modelo + ' ' + m.tecnico + ' ' + m.usuario_equipo + ' ' + m.detalle + ' ' + m.serie).toLowerCase();
            if (texto.indexOf(q) < 0) return false;
        }
        return true;
    });

    // Contadores por estado
    var contadores = { PENDIENTE: 0, EN_PROCESO: 0, COMPLETADO: 0, CANCELADO: 0 };
    mantenimientos.forEach(function (m) {
        if (contadores[m.estado] !== undefined) contadores[m.estado]++;
    });

    if (cargando) return <PageContent><p className="mnt-loading">Cargando mantenimientos...</p></PageContent>;

    return (
        <PageContent>
            <div className="mnt-container">
                {/* Header */}
                <div className="mnt-header">
                    <div className="mnt-header-left">
                        <h2 className="mnt-titulo"><IconoFa icono={faWrench} /> Mantenimiento de Equipos</h2>
                        <span className="mnt-total">{mantenimientos.length} registros</span>
                    </div>
                    <button className="mnt-btn-crear" onClick={abrirCrear}>
                        <IconoFa icono={faPlus} /> Nuevo Mantenimiento
                    </button>
                </div>

                {/* Stats */}
                <div className="mnt-stats">
                    {[
                        { key: 'PENDIENTE', label: 'Pendientes', color: '#f59e0b' },
                        { key: 'EN_PROCESO', label: 'En Proceso', color: '#3b82f6' },
                        { key: 'COMPLETADO', label: 'Completados', color: '#10b981' },
                        { key: 'CANCELADO', label: 'Cancelados', color: '#ef4444' },
                    ].map(function (s) {
                        var info = ESTADOS_ICON[s.key];
                        return (
                            <div
                                key={s.key}
                                className={'mnt-stat-card' + (filtroEstado === s.key ? ' mnt-stat-activo' : '')}
                                onClick={function () { setFiltroEstado(filtroEstado === s.key ? '' : s.key); }}
                                style={{ '--stat-color': s.color }}
                            >
                                <div className="mnt-stat-icono"><IconoFa icono={info.icono} /></div>
                                <div className="mnt-stat-info">
                                    <span className="mnt-stat-num">{contadores[s.key]}</span>
                                    <span className="mnt-stat-label">{s.label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Filtros */}
                <div className="mnt-filtros">
                    <div className="mnt-busqueda">
                        <IconoFa icono={faSearch} />
                        <input type="text" placeholder="Buscar equipo, técnico, detalle..." value={busqueda} onChange={function (e) { setBusqueda(e.target.value); }} />
                    </div>
                    <div className="mnt-filtro-group">
                        <select value={filtroTipo} onChange={function (e) { setFiltroTipo(e.target.value); }}>
                            <option value="">Todos los tipos</option>
                            <option value="PREVENTIVO">Preventivo</option>
                            <option value="PROGRAMADO">Programado</option>
                            <option value="REPARACION">Reparación</option>
                        </select>
                        <select value={filtroPeriodo} onChange={function (e) { setFiltroPeriodo(e.target.value); }}>
                            <option value="">Todos los periodos</option>
                            <option value="TRIMESTRAL">Trimestral</option>
                            <option value="SEMESTRAL">Semestral</option>
                            <option value="ANUAL">Anual</option>
                        </select>
                        {(filtroEstado || filtroTipo || filtroPeriodo || busqueda) && (
                            <button className="mnt-btn-limpiar" onClick={function () { setFiltroEstado(''); setFiltroTipo(''); setFiltroPeriodo(''); setBusqueda(''); }}>
                                <IconoFa icono={faTimes} /> Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {/* Mensaje */}
                {mensaje && (
                    <div className={'mnt-mensaje ' + (mensaje.tipo === 'error' ? 'mnt-msg-error' : 'mnt-msg-ok')}>
                        {mensaje.texto}
                    </div>
                )}

                {/* Tabla */}
                <div className="mnt-tabla-wrap">
                    {filtrados.length === 0 ? (
                        <div className="mnt-vacio">
                            <IconoFa icono={faClipboardList} />
                            <p>No hay mantenimientos {filtroEstado || filtroTipo ? 'con estos filtros' : 'registrados'}</p>
                        </div>
                    ) : (
                        <table className="mnt-tabla">
                            <thead>
                                <tr>
                                    <th>Equipo</th>
                                    <th>Usuario</th>
                                    <th>Tipo</th>
                                    <th>Periodo</th>
                                    <th>Fecha Prog.</th>
                                    <th>Fecha Mant.</th>
                                    <th>Técnico</th>
                                    <th>Estado</th>
                                    <th>Fotos</th>
                                    <th>Detalle</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtrados.map(function (m) {
                                    var stInfo = ESTADOS_ICON[m.estado] || ESTADOS_ICON.PENDIENTE;
                                    var tipoInfo = TIPO_MANT_ICON[m.tipo_mantenimiento] || TIPO_MANT_ICON.PREVENTIVO;
                                    return (
                                        <tr key={m.id}>
                                            <td>
                                                <div className="mnt-celda-equipo">
                                                    <strong>{m.codigoe || m.serie}</strong>
                                                    <span className="mnt-sub">{m.marca} {m.modelo}</span>
                                                    <span className="mnt-sub mnt-tipo-eq">{m.tipo_equipo}</span>
                                                </div>
                                            </td>
                                            <td><span className="mnt-usuario"><IconoFa icono={faUser} /> {m.usuario_equipo}</span></td>
                                            <td>
                                                <span className={'mnt-badge ' + tipoInfo.clase}>
                                                    <IconoFa icono={tipoInfo.icono} /> {m.tipo_mantenimiento}
                                                </span>
                                            </td>
                                            <td><span className="mnt-periodo-badge">{m.tipo_periodo}</span></td>
                                            <td>{formatFecha(m.fecha_prog)}</td>
                                            <td>{formatFecha(m.fecha_mant)}</td>
                                            <td><span className="mnt-tecnico">{m.tecnico || '—'}</span></td>
                                            <td>
                                                <div className="mnt-estado-wrap">
                                                    <span className={'mnt-estado-badge ' + stInfo.clase}>
                                                        <IconoFa icono={stInfo.icono} /> {m.estado.replace('_', ' ')}
                                                    </span>
                                                    {m.estado !== 'COMPLETADO' && m.estado !== 'CANCELADO' && (
                                                        <div className="mnt-estado-actions">
                                                            {m.estado === 'PENDIENTE' && (
                                                                <button className="mnt-estado-btn mnt-st-proceso" title="Iniciar" onClick={function () { cambiarEstado(m, 'EN_PROCESO'); }}>
                                                                    <IconoFa icono={faArrowsRotate} />
                                                                </button>
                                                            )}
                                                            {(m.estado === 'PENDIENTE' || m.estado === 'EN_PROCESO') && (
                                                                <button className="mnt-estado-btn mnt-st-completado" title="Completar" onClick={function () { cambiarEstado(m, 'COMPLETADO'); }}>
                                                                    <IconoFa icono={faCheckCircle} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="mnt-fotos-mini">
                                                    {m.foto1 ? <img src={'/' + m.foto1} alt="F1" className="mnt-foto-thumb" /> : <span className="mnt-foto-vacia"><IconoFa icono={faImage} /></span>}
                                                    {m.foto2 ? <img src={'/' + m.foto2} alt="F2" className="mnt-foto-thumb" /> : <span className="mnt-foto-vacia"><IconoFa icono={faImage} /></span>}
                                                </div>
                                            </td>
                                            <td><span className="mnt-detalle-text" title={m.detalle}>{m.detalle || '—'}</span></td>
                                            <td>
                                                <div className="mnt-acciones">
                                                    <button className="mnt-btn-acc mnt-btn-editar" title="Editar" onClick={function () { abrirEditar(m); }}>
                                                        <IconoFa icono={faEdit} />
                                                    </button>
                                                    <button className="mnt-btn-acc mnt-btn-eliminar" title="Eliminar" onClick={function () { eliminar(m); }}>
                                                        <IconoFa icono={faTrash} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Modal Crear/Editar */}
                {modalAbierto && (
                    <div className="mnt-modal-overlay" onClick={cerrarModal}>
                        <div className="mnt-modal" onClick={function (e) { e.stopPropagation(); }}>
                            <div className="mnt-modal-header">
                                <h3><IconoFa icono={editando ? faEdit : faPlus} /> {editando ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}</h3>
                                <button className="mnt-modal-cerrar" onClick={cerrarModal}><IconoFa icono={faTimes} /></button>
                            </div>
                            <form className="mnt-modal-body" onSubmit={guardar}>
                                <div className="mnt-form-grid">
                                    {/* Equipo */}
                                    <div className="mnt-campo mnt-campo-full">
                                        <label><IconoFa icono={faLaptop} /> Equipo asignado *</label>
                                        <select name="id_equipo" value={form.id_equipo} onChange={handleChange} required>
                                            <option value="">— Seleccionar equipo —</option>
                                            {catalogos.equipos.map(function (eq) {
                                                return <option key={eq.id_equipo} value={eq.id_equipo}>{eq.label}</option>;
                                            })}
                                        </select>
                                    </div>

                                    {/* Técnico */}
                                    <div className="mnt-campo">
                                        <label><IconoFa icono={faUser} /> Técnico responsable</label>
                                        <select name="id_tecnico" value={form.id_tecnico} onChange={handleChange}>
                                            <option value="">— Sin asignar —</option>
                                            {catalogos.tecnicos.map(function (t) {
                                                return <option key={t.id} value={t.id}>{t.nombre}</option>;
                                            })}
                                        </select>
                                    </div>

                                    {/* Tipo mantenimiento */}
                                    <div className="mnt-campo">
                                        <label><IconoFa icono={faTools} /> Tipo de mantenimiento *</label>
                                        <select name="tipo_mantenimiento" value={form.tipo_mantenimiento} onChange={handleChange} required>
                                            {catalogos.tipos_mantenimiento.map(function (t) {
                                                return <option key={t} value={t}>{t}</option>;
                                            })}
                                        </select>
                                    </div>

                                    {/* Periodo */}
                                    <div className="mnt-campo">
                                        <label><IconoFa icono={faCalendarAlt} /> Periodo</label>
                                        <select name="tipo_periodo" value={form.tipo_periodo} onChange={handleChange}>
                                            {catalogos.periodos.map(function (p) {
                                                return <option key={p} value={p}>{p}</option>;
                                            })}
                                        </select>
                                    </div>

                                    {/* Estado */}
                                    <div className="mnt-campo">
                                        <label><IconoFa icono={faCheckCircle} /> Estado</label>
                                        <select name="estado" value={form.estado} onChange={handleChange}>
                                            {catalogos.estados.map(function (est) {
                                                return <option key={est} value={est}>{est.replace('_', ' ')}</option>;
                                            })}
                                        </select>
                                    </div>

                                    {/* Fecha programada */}
                                    <div className="mnt-campo">
                                        <label><IconoFa icono={faCalendarAlt} /> Fecha programada *</label>
                                        <input type="date" name="fecha_prog" value={form.fecha_prog} onChange={handleChange} required />
                                    </div>

                                    {/* Fecha mantenimiento */}
                                    <div className="mnt-campo">
                                        <label><IconoFa icono={faCalendarAlt} /> Fecha de ejecución</label>
                                        <input type="date" name="fecha_mant" value={form.fecha_mant} onChange={handleChange} />
                                    </div>

                                    {/* Fotos */}
                                    <div className="mnt-campo">
                                        <label><IconoFa icono={faCamera} /> Foto 1</label>
                                        <input type="file" accept="image/*" ref={foto1Ref} style={{ display: 'none' }} onChange={function (e) { handleFoto(e, 1); }} />
                                        <div className="mnt-foto-upload" onClick={function () { foto1Ref.current.click(); }}>
                                            {foto1Preview ? (
                                                <img src={foto1Preview.startsWith('blob:') ? foto1Preview : '/' + foto1Preview} alt="Foto 1" />
                                            ) : (
                                                <div className="mnt-foto-placeholder"><IconoFa icono={faCamera} /><span>Seleccionar</span></div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mnt-campo">
                                        <label><IconoFa icono={faCamera} /> Foto 2</label>
                                        <input type="file" accept="image/*" ref={foto2Ref} style={{ display: 'none' }} onChange={function (e) { handleFoto(e, 2); }} />
                                        <div className="mnt-foto-upload" onClick={function () { foto2Ref.current.click(); }}>
                                            {foto2Preview ? (
                                                <img src={foto2Preview.startsWith('blob:') ? foto2Preview : '/' + foto2Preview} alt="Foto 2" />
                                            ) : (
                                                <div className="mnt-foto-placeholder"><IconoFa icono={faCamera} /><span>Seleccionar</span></div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Detalle */}
                                    <div className="mnt-campo mnt-campo-full">
                                        <label><IconoFa icono={faClipboardList} /> Detalle del mantenimiento</label>
                                        <textarea name="detalle" value={form.detalle} onChange={handleChange} rows="3" placeholder="Describe las actividades realizadas o por realizar..." />
                                    </div>
                                </div>

                                <div className="mnt-modal-footer">
                                    <button type="button" className="mnt-btn-cancelar" onClick={cerrarModal}>Cancelar</button>
                                    <button type="submit" className="mnt-btn-guardar" disabled={guardando}>
                                        <IconoFa icono={faSave} /> {guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </PageContent>
    );
}
