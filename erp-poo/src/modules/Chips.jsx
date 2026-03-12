import React, { useState, useEffect } from 'react';
import { API_URL, headersConToken } from '../auth';
import IconoFa from '../components/IconoFa';
import PageContent from '../components/PageContent';
import {
    faSimCard, faPlus, faSearch, faPen, faRotateLeft, faUserPlus,
    faArrowsRotate, faTrash, faClockRotateLeft, faXmark, faFloppyDisk,
    faPhone, faBuilding
} from '@fortawesome/free-solid-svg-icons';
import '../styles/Chips.css';

export default function Chips() {
    var [chips, setChips] = useState([]);
    var [catalogos, setCatalogos] = useState({ operadores: [], planes: [], descuentos: [] });
    var [personal, setPersonal] = useState([]);
    var [cargando, setCargando] = useState(true);
    var [filtro, setFiltro] = useState('');
    var [filtroEstado, setFiltroEstado] = useState('todos'); // todos | asignado | disponible
    var [filtroOperador, setFiltroOperador] = useState('');
    var [mensaje, setMensaje] = useState('');
    var [exito, setExito] = useState(false);

    // Formulario nueva línea
    var [verFormNuevo, setVerFormNuevo] = useState(false);
    var [formNuevo, setFormNuevo] = useState({
        numero: '', precio: '', id_operador: '', id_plan: '', id_descuento: '', fech_asignacion: ''
    });

    // Edición inline
    var [editandoId, setEditandoId] = useState(null);
    var [formEditar, setFormEditar] = useState({});

    // Modal asignar/reasignar
    var [modalAsignar, setModalAsignar] = useState(null); // chip obj
    var [asignarPersonal, setAsignarPersonal] = useState('');

    // Modal historial
    var [modalHistorial, setModalHistorial] = useState(null);
    var [historial, setHistorial] = useState([]);

    // ── Carga inicial (Promise.all) ──
    useEffect(function () {
        cargarDatos();
    }, []);

    function cargarDatos() {
        setCargando(true);
        Promise.all([
            fetch(API_URL + '/chips', { headers: headersConToken() }).then(function (r) { return r.json(); }),
            fetch(API_URL + '/chips/catalogos', { headers: headersConToken() }).then(function (r) { return r.json(); }),
            fetch(API_URL + '/chips/personal', { headers: headersConToken() }).then(function (r) { return r.json(); }),
        ]).then(function (res) {
            setChips(Array.isArray(res[0]) ? res[0] : []);
            setCatalogos(res[1] || { operadores: [], planes: [], descuentos: [] });
            setPersonal(Array.isArray(res[2]) ? res[2] : []);
        }).catch(function () {
            mostrarMensaje('Error cargando datos', false);
        }).finally(function () {
            setCargando(false);
        });
    }

    function mostrarMensaje(msg, ok) {
        setMensaje(msg);
        setExito(ok);
        if (ok) setTimeout(function () { setMensaje(''); }, 2500);
    }

    // ── Estadísticas ──
    var totalChips = chips.length;
    var asignados = chips.filter(function (c) { return c.asignacion; }).length;
    var disponibles = totalChips - asignados;
    var costoTotal = chips.reduce(function (s, c) { return s + (c.precio || 0); }, 0);

    // ── Filtros ──
    var chipsFiltrados = chips.filter(function (c) {
        var texto = filtro.toLowerCase();
        var coincideTexto = !texto ||
            (c.numero || '').toLowerCase().indexOf(texto) >= 0 ||
            (c.operador || '').toLowerCase().indexOf(texto) >= 0 ||
            (c.plan || '').toLowerCase().indexOf(texto) >= 0 ||
            (c.asignacion && c.asignacion.empleado.toLowerCase().indexOf(texto) >= 0);
        var coincideEstado = filtroEstado === 'todos' ||
            (filtroEstado === 'asignado' && c.asignacion) ||
            (filtroEstado === 'disponible' && !c.asignacion);
        var coincideOp = !filtroOperador || String(c.id_operador) === String(filtroOperador);
        return coincideTexto && coincideEstado && coincideOp;
    });

    // ══════════════════════════════
    //  CREAR LÍNEA
    // ══════════════════════════════
    function handleCrear(e) {
        e.preventDefault();
        if (!formNuevo.numero.trim()) { mostrarMensaje('Número requerido', false); return; }
        fetch(API_URL + '/chips', {
            method: 'POST',
            headers: headersConToken(),
            body: JSON.stringify(formNuevo)
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) throw new Error(res.data.detail || 'Error');
            mostrarMensaje('¡Línea creada correctamente!', true);
            setFormNuevo({ numero: '', precio: '', id_operador: '', id_plan: '', id_descuento: '', fech_asignacion: '' });
            setVerFormNuevo(false);
            cargarDatos();
        })
        .catch(function (err) { mostrarMensaje(err.message, false); });
    }

    // ══════════════════════════════
    //  EDITAR LÍNEA
    // ══════════════════════════════
    function iniciarEdicion(chip) {
        setEditandoId(chip.id);
        setFormEditar({
            numero: chip.numero,
            precio: chip.precio,
            id_operador: chip.id_operador || '',
            id_plan: chip.id_plan || '',
            id_descuento: chip.id_descuento || '',
            fech_asignacion: chip.fech_asignacion || ''
        });
    }

    function guardarEdicion() {
        fetch(API_URL + '/chips/' + editandoId, {
            method: 'PUT',
            headers: headersConToken(),
            body: JSON.stringify(formEditar)
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) throw new Error(res.data.detail || 'Error');
            mostrarMensaje('Línea actualizada', true);
            setEditandoId(null);
            cargarDatos();
        })
        .catch(function (err) { mostrarMensaje(err.message, false); });
    }

    // ══════════════════════════════
    //  ASIGNAR / REASIGNAR
    // ══════════════════════════════
    function abrirAsignar(chip) {
        setModalAsignar(chip);
        setAsignarPersonal('');
    }

    function confirmarAsignar() {
        if (!asignarPersonal) { mostrarMensaje('Selecciona un empleado', false); return; }
        var url = modalAsignar.asignacion
            ? API_URL + '/chips/' + modalAsignar.id + '/reasignar'
            : API_URL + '/chips/' + modalAsignar.id + '/asignar';
        var method = modalAsignar.asignacion ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: headersConToken(),
            body: JSON.stringify({ id_personal: Number(asignarPersonal) })
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) throw new Error(res.data.detail || 'Error');
            mostrarMensaje(modalAsignar.asignacion ? 'Chip reasignado' : 'Chip asignado', true);
            setModalAsignar(null);
            cargarDatos();
        })
        .catch(function (err) { mostrarMensaje(err.message, false); });
    }

    // ══════════════════════════════
    //  DEVOLVER
    // ══════════════════════════════
    function handleDevolver(chip) {
        if (!confirm('¿Confirmas la devolución del chip ' + chip.numero + '?')) return;
        fetch(API_URL + '/chips/' + chip.id + '/devolver', {
            method: 'PUT',
            headers: headersConToken()
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) throw new Error(res.data.detail || 'Error');
            mostrarMensaje('Chip devuelto correctamente', true);
            cargarDatos();
        })
        .catch(function (err) { mostrarMensaje(err.message, false); });
    }

    // ══════════════════════════════
    //  ELIMINAR
    // ══════════════════════════════
    function handleEliminar(chip) {
        if (!confirm('¿Eliminar la línea ' + chip.numero + '? Esta acción no se puede deshacer.')) return;
        fetch(API_URL + '/chips/' + chip.id, {
            method: 'DELETE',
            headers: headersConToken()
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) throw new Error(res.data.detail || 'Error');
            mostrarMensaje('Línea eliminada', true);
            cargarDatos();
        })
        .catch(function (err) { mostrarMensaje(err.message, false); });
    }

    // ══════════════════════════════
    //  HISTORIAL
    // ══════════════════════════════
    function verHistorial(chip) {
        setModalHistorial(chip);
        fetch(API_URL + '/chips/' + chip.id + '/historial', { headers: headersConToken() })
            .then(function (r) { return r.json(); })
            .then(function (data) { setHistorial(Array.isArray(data) ? data : []); })
            .catch(function () { setHistorial([]); });
    }

    if (cargando) return <PageContent><p>Cargando chips...</p></PageContent>;

    return (
        <div className="chip-container">
            <h2 className="chip-titulo"><IconoFa icono={faSimCard} /> TELEFONÍA</h2>
            <p className="chip-subtitulo">GESTIÓN DE LÍNEAS CORPORATIVAS</p>

            {mensaje && <p className={'chip-mensaje ' + (exito ? 'exito' : 'error')}>{mensaje}</p>}

            {/* ── Estadísticas ── */}
            <div className="chip-stats">
                <div className="chip-stat" onClick={function () { setFiltroEstado('todos'); }}>
                    <span className="chip-stat-num">{totalChips}</span>
                    <span className="chip-stat-label">Total líneas</span>
                </div>
                <div className="chip-stat asignado" onClick={function () { setFiltroEstado('asignado'); }}>
                    <span className="chip-stat-num">{asignados}</span>
                    <span className="chip-stat-label">Asignados</span>
                </div>
                <div className="chip-stat disponible" onClick={function () { setFiltroEstado('disponible'); }}>
                    <span className="chip-stat-num">{disponibles}</span>
                    <span className="chip-stat-label">Disponibles</span>
                </div>
                <div className="chip-stat costo">
                    <span className="chip-stat-num">S/ {costoTotal.toFixed(2)}</span>
                    <span className="chip-stat-label">Costo mensual</span>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="chip-toolbar">
                <div className="chip-busqueda">
                    <IconoFa icono={faSearch} />
                    <input
                        type="text"
                        placeholder="Buscar número, empleado, operador..."
                        value={filtro}
                        onChange={function (e) { setFiltro(e.target.value); }}
                    />
                </div>
                <select
                    className="chip-filtro-select"
                    value={filtroOperador}
                    onChange={function (e) { setFiltroOperador(e.target.value); }}
                >
                    <option value="">Todos los operadores</option>
                    {catalogos.operadores.map(function (op) {
                        return <option key={op.id} value={op.id}>{op.nombre}</option>;
                    })}
                </select>
                <button className="chip-btn-nueva" onClick={function () { setVerFormNuevo(!verFormNuevo); }}>
                    <IconoFa icono={faPlus} /> Nueva línea
                </button>
            </div>

            {/* ── Filtro badges ── */}
            {filtroEstado !== 'todos' && (
                <div className="chip-filtro-badge">
                    Mostrando: <strong>{filtroEstado === 'asignado' ? 'Asignados' : 'Disponibles'}</strong>
                    <button className="chip-filtro-clear" onClick={function () { setFiltroEstado('todos'); }}>
                        <IconoFa icono={faXmark} />
                    </button>
                </div>
            )}

            {/* ── Form nueva línea ── */}
            {verFormNuevo && (
                <form className="chip-form" onSubmit={handleCrear}>
                    <div className="chip-form-campos">
                        <div className="chip-campo">
                            <label>Número</label>
                            <input type="text" value={formNuevo.numero} onChange={function (e) { setFormNuevo(Object.assign({}, formNuevo, { numero: e.target.value })); }} maxLength={12} />
                        </div>
                        <div className="chip-campo">
                            <label>Precio (S/)</label>
                            <input type="number" step="0.01" value={formNuevo.precio} onChange={function (e) { setFormNuevo(Object.assign({}, formNuevo, { precio: e.target.value })); }} />
                        </div>
                        <div className="chip-campo">
                            <label>Operador</label>
                            <select value={formNuevo.id_operador} onChange={function (e) { setFormNuevo(Object.assign({}, formNuevo, { id_operador: e.target.value })); }}>
                                <option value="">-- Seleccionar --</option>
                                {catalogos.operadores.map(function (op) { return <option key={op.id} value={op.id}>{op.nombre}</option>; })}
                            </select>
                        </div>
                        <div className="chip-campo">
                            <label>Plan</label>
                            <select value={formNuevo.id_plan} onChange={function (e) { setFormNuevo(Object.assign({}, formNuevo, { id_plan: e.target.value })); }}>
                                <option value="">-- Seleccionar --</option>
                                {catalogos.planes.map(function (pl) { return <option key={pl.id} value={pl.id}>{pl.nombre}</option>; })}
                            </select>
                        </div>
                        <div className="chip-campo">
                            <label>Descuento</label>
                            <select value={formNuevo.id_descuento} onChange={function (e) { setFormNuevo(Object.assign({}, formNuevo, { id_descuento: e.target.value })); }}>
                                <option value="">-- Sin descuento --</option>
                                {catalogos.descuentos.map(function (d) { return <option key={d.id} value={d.id}>{d.nombre} ({d.descuento}%)</option>; })}
                            </select>
                        </div>
                        <div className="chip-campo">
                            <label>Fecha asignación</label>
                            <input type="date" value={formNuevo.fech_asignacion} onChange={function (e) { setFormNuevo(Object.assign({}, formNuevo, { fech_asignacion: e.target.value })); }} />
                        </div>
                    </div>
                    <button type="submit" className="chip-btn-crear"><IconoFa icono={faPlus} /> Crear línea</button>
                </form>
            )}

            {/* ── Tabla de chips ── */}
            <div className="chip-tabla-wrap">
                <table className="chip-tabla">
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Operador</th>
                            <th>Plan</th>
                            <th>Precio</th>
                            <th>Descuento</th>
                            <th>Asignado a</th>
                            <th>Fecha asig.</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chipsFiltrados.length === 0 && (
                            <tr><td colSpan="9" className="chip-vacio">No se encontraron líneas</td></tr>
                        )}
                        {chipsFiltrados.map(function (chip) {
                            var esEdicion = editandoId === chip.id;

                            if (esEdicion) {
                                return (
                                    <tr key={chip.id} className="chip-fila-edit">
                                        <td><input type="text" value={formEditar.numero} onChange={function (e) { setFormEditar(Object.assign({}, formEditar, { numero: e.target.value })); }} /></td>
                                        <td>
                                            <select value={formEditar.id_operador} onChange={function (e) { setFormEditar(Object.assign({}, formEditar, { id_operador: e.target.value })); }}>
                                                <option value="">--</option>
                                                {catalogos.operadores.map(function (op) { return <option key={op.id} value={op.id}>{op.nombre}</option>; })}
                                            </select>
                                        </td>
                                        <td>
                                            <select value={formEditar.id_plan} onChange={function (e) { setFormEditar(Object.assign({}, formEditar, { id_plan: e.target.value })); }}>
                                                <option value="">--</option>
                                                {catalogos.planes.map(function (pl) { return <option key={pl.id} value={pl.id}>{pl.nombre}</option>; })}
                                            </select>
                                        </td>
                                        <td><input type="number" step="0.01" value={formEditar.precio} onChange={function (e) { setFormEditar(Object.assign({}, formEditar, { precio: e.target.value })); }} /></td>
                                        <td>
                                            <select value={formEditar.id_descuento} onChange={function (e) { setFormEditar(Object.assign({}, formEditar, { id_descuento: e.target.value })); }}>
                                                <option value="">--</option>
                                                {catalogos.descuentos.map(function (d) { return <option key={d.id} value={d.id}>{d.nombre}</option>; })}
                                            </select>
                                        </td>
                                        <td colSpan="2">{chip.asignacion ? chip.asignacion.empleado : '—'}</td>
                                        <td colSpan="2" className="chip-acciones">
                                            <button className="chip-btn chip-btn-guardar" onClick={guardarEdicion} title="Guardar"><IconoFa icono={faFloppyDisk} /></button>
                                            <button className="chip-btn chip-btn-cancelar" onClick={function () { setEditandoId(null); }} title="Cancelar"><IconoFa icono={faXmark} /></button>
                                        </td>
                                    </tr>
                                );
                            }

                            return (
                                <tr key={chip.id}>
                                    <td className="chip-numero"><IconoFa icono={faPhone} /> {chip.numero}</td>
                                    <td>{chip.operador || '—'}</td>
                                    <td>{chip.plan || '—'}</td>
                                    <td>S/ {(chip.precio || 0).toFixed(2)}</td>
                                    <td>{chip.descuento ? chip.descuento + ' (' + chip.descuento_pct + '%)' : '—'}</td>
                                    <td>{chip.asignacion ? chip.asignacion.empleado : <span className="chip-disponible-tag">Disponible</span>}</td>
                                    <td>{chip.asignacion ? chip.asignacion.fecha_asig : '—'}</td>
                                    <td>
                                        <span className={'chip-estado-badge ' + (chip.asignacion ? 'asignado' : 'disponible')}>
                                            {chip.asignacion ? 'ASIGNADO' : 'DISPONIBLE'}
                                        </span>
                                    </td>
                                    <td className="chip-acciones">
                                        {chip.asignacion ? (
                                            <>
                                                <button className="chip-btn chip-btn-reasignar" onClick={function () { abrirAsignar(chip); }} title="Reasignar"><IconoFa icono={faArrowsRotate} /></button>
                                                <button className="chip-btn chip-btn-devolver" onClick={function () { handleDevolver(chip); }} title="Devolver"><IconoFa icono={faRotateLeft} /></button>
                                            </>
                                        ) : (
                                            <button className="chip-btn chip-btn-asignar" onClick={function () { abrirAsignar(chip); }} title="Asignar"><IconoFa icono={faUserPlus} /></button>
                                        )}
                                        <button className="chip-btn chip-btn-editar" onClick={function () { iniciarEdicion(chip); }} title="Editar"><IconoFa icono={faPen} /></button>
                                        <button className="chip-btn chip-btn-historial" onClick={function () { verHistorial(chip); }} title="Historial"><IconoFa icono={faClockRotateLeft} /></button>
                                        {!chip.asignacion && (
                                            <button className="chip-btn chip-btn-eliminar" onClick={function () { handleEliminar(chip); }} title="Eliminar"><IconoFa icono={faTrash} /></button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── Modal Asignar / Reasignar ── */}
            {modalAsignar && (
                <div className="chip-modal-overlay" onClick={function () { setModalAsignar(null); }}>
                    <div className="chip-modal" onClick={function (e) { e.stopPropagation(); }}>
                        <h3>{modalAsignar.asignacion ? 'Reasignar' : 'Asignar'} línea {modalAsignar.numero}</h3>
                        {modalAsignar.asignacion && (
                            <p className="chip-modal-info">Actualmente asignado a: <strong>{modalAsignar.asignacion.empleado}</strong></p>
                        )}
                        <div className="chip-campo">
                            <label>Seleccionar empleado</label>
                            <select value={asignarPersonal} onChange={function (e) { setAsignarPersonal(e.target.value); }}>
                                <option value="">-- Seleccionar --</option>
                                {personal.map(function (p) {
                                    return <option key={p.id} value={p.id}>{p.nombre} — {p.num_doc}</option>;
                                })}
                            </select>
                        </div>
                        <div className="chip-modal-btns">
                            <button className="chip-btn-confirmar" onClick={confirmarAsignar}>
                                <IconoFa icono={faUserPlus} /> {modalAsignar.asignacion ? 'Reasignar' : 'Asignar'}
                            </button>
                            <button className="chip-btn-cancelar-modal" onClick={function () { setModalAsignar(null); }}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Historial ── */}
            {modalHistorial && (
                <div className="chip-modal-overlay" onClick={function () { setModalHistorial(null); }}>
                    <div className="chip-modal chip-modal-historial" onClick={function (e) { e.stopPropagation(); }}>
                        <h3><IconoFa icono={faClockRotateLeft} /> Historial — {modalHistorial.numero}</h3>
                        {historial.length === 0 ? (
                            <p className="chip-vacio">Sin historial de asignaciones</p>
                        ) : (
                            <table className="chip-tabla chip-tabla-historial">
                                <thead>
                                    <tr>
                                        <th>Empleado</th>
                                        <th>Fecha asignación</th>
                                        <th>Fecha devolución</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historial.map(function (h) {
                                        return (
                                            <tr key={h.id}>
                                                <td>{h.empleado}</td>
                                                <td>{h.fecha_asig || '—'}</td>
                                                <td>{h.fecha_devol || '—'}</td>
                                                <td>
                                                    <span className={'chip-estado-badge ' + (h.activa ? 'asignado' : 'devuelto')}>
                                                        {h.activa ? 'ACTIVO' : 'DEVUELTO'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                        <button className="chip-btn-cancelar-modal" onClick={function () { setModalHistorial(null); }}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
}
