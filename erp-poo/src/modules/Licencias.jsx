import { useState, useEffect } from 'react';
import { API_URL, headersConToken } from '../auth';
import IconoFa from '../components/IconoFa';
import PageContent from '../components/PageContent';
import {
    faKey, faPlus, faPen, faTrash, faSearch, faLaptop,
    faCheckCircle, faXmark, faFloppyDisk, faChevronDown,
    faChevronRight, faDesktop, faServer, faMobileScreen,
    faTabletScreenButton
} from '@fortawesome/free-solid-svg-icons';
import '../styles/Licencias.css';

var ICONOS_TIPO = {
    'LAPTOP': faLaptop,
    'COMPUTADORA': faDesktop,
    'SERVIDOR': faServer,
    'CELULAR': faMobileScreen,
    'TABLET': faTabletScreenButton,
};

export default function Licencias() {
    var [licencias, setLicencias] = useState([]);
    var [filtro, setFiltro] = useState('');
    var [mensaje, setMensaje] = useState('');
    var [exito, setExito] = useState(false);
    var [cargando, setCargando] = useState(true);
    var [expandido, setExpandido] = useState(null);

    // Crear / Editar
    var [mostrarForm, setMostrarForm] = useState(false);
    var [editandoId, setEditandoId] = useState(null);
    var [form, setForm] = useState({ descripcion: '', serie_keys: '', cantidad: 1 });

    function cargarDatos() {
        fetch(API_URL + '/licencias', { headers: headersConToken() })
            .then(function (r) {
                if (r.status === 401) { localStorage.removeItem('session'); window.location.href = '/'; return []; }
                return r.json();
            })
            .then(function (data) {
                setLicencias(Array.isArray(data) ? data : []);
            })
            .catch(function () { mostrarMsg('Error al cargar licencias', false); })
            .finally(function () { setCargando(false); });
    }

    useEffect(function () { cargarDatos(); }, []);

    function mostrarMsg(msg, ok) {
        setMensaje(msg);
        setExito(ok);
        if (ok) setTimeout(function () { setMensaje(''); }, 3000);
    }

    function handleChange(campo, valor) {
        setForm(function (prev) { return Object.assign({}, prev, { [campo]: valor }); });
    }

    function abrirCrear() {
        setEditandoId(null);
        setForm({ descripcion: '', serie_keys: '', cantidad: 1 });
        setMostrarForm(true);
    }

    function abrirEditar(lic) {
        setEditandoId(lic.id_licencia);
        setForm({
            descripcion: lic.descripcion || '',
            serie_keys: lic.serie_keys || '',
            cantidad: lic.cantidad || 1,
        });
        setMostrarForm(false);
        setExpandido(lic.id_licencia);
    }

    function cancelarForm() {
        setMostrarForm(false);
        setEditandoId(null);
    }

    function guardar() {
        if (!form.descripcion.trim()) { mostrarMsg('La descripción es obligatoria', false); return; }
        if (!form.serie_keys.trim()) { mostrarMsg('El serial/key es obligatorio', false); return; }
        if (!form.cantidad || parseInt(form.cantidad) < 1) { mostrarMsg('La cantidad debe ser al menos 1', false); return; }

        var url = editandoId ? API_URL + '/licencias/' + editandoId : API_URL + '/licencias';
        var method = editandoId ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: headersConToken(),
            body: JSON.stringify({
                descripcion: form.descripcion.trim(),
                serie_keys: form.serie_keys.trim(),
                cantidad: parseInt(form.cantidad),
            })
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) throw new Error(res.data.detail || 'Error');
            mostrarMsg(editandoId ? 'Licencia actualizada' : 'Licencia creada correctamente', true);
            cancelarForm();
            cargarDatos();
        })
        .catch(function (err) { mostrarMsg(err.message, false); });
    }

    function eliminar(id, nombre) {
        if (!confirm('¿Eliminar la licencia "' + nombre + '"?')) return;
        fetch(API_URL + '/licencias/' + id, {
            method: 'DELETE',
            headers: headersConToken()
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) throw new Error(res.data.detail || 'Error');
            mostrarMsg('Licencia eliminada', true);
            cargarDatos();
        })
        .catch(function (err) { mostrarMsg(err.message, false); });
    }

    function desasignar(id_asiglicenc) {
        if (!confirm('¿Desasignar esta licencia del equipo?')) return;
        fetch(API_URL + '/licencias/asignar/' + id_asiglicenc, {
            method: 'DELETE',
            headers: headersConToken()
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) throw new Error(res.data.detail || 'Error');
            mostrarMsg('Licencia desasignada', true);
            cargarDatos();
        })
        .catch(function (err) { mostrarMsg(err.message, false); });
    }

    function toggleExpandir(id) {
        setExpandido(expandido === id ? null : id);
    }

    // Stats
    var totalLicencias = licencias.reduce(function (sum, l) { return sum + l.cantidad; }, 0);
    var totalAsignadas = licencias.reduce(function (sum, l) { return sum + l.asignadas; }, 0);
    var totalDisponibles = licencias.reduce(function (sum, l) { return sum + l.disponibles; }, 0);

    // Filtrar
    var licenciasFiltradas = licencias.filter(function (l) {
        var t = filtro.toLowerCase();
        if (!t) return true;
        return (l.descripcion || '').toLowerCase().indexOf(t) >= 0 ||
               (l.serie_keys || '').toLowerCase().indexOf(t) >= 0;
    });

    if (cargando) return <PageContent><p className="lic-loading">Cargando licencias...</p></PageContent>;

    return (
        <PageContent>
            <div className="lic-container">
                <h2 className="lic-titulo"><IconoFa icono={faKey} /> LICENCIAS</h2>
                <p className="lic-subtitulo">CONTROL DE LICENCIAS DE SOFTWARE</p>

                {mensaje && <p className={'lic-mensaje ' + (exito ? 'exito' : 'error')}>{mensaje}</p>}

                {/* Stats */}
                <div className="lic-stats">
                    <div className="lic-stat">
                        <span className="lic-stat-num">{licencias.length}</span>
                        <span className="lic-stat-label">Tipos</span>
                    </div>
                    <div className="lic-stat total">
                        <span className="lic-stat-num">{totalLicencias}</span>
                        <span className="lic-stat-label">Total</span>
                    </div>
                    <div className="lic-stat asignado">
                        <span className="lic-stat-num">{totalAsignadas}</span>
                        <span className="lic-stat-label">Asignadas</span>
                    </div>
                    <div className="lic-stat disponible">
                        <span className="lic-stat-num">{totalDisponibles}</span>
                        <span className="lic-stat-label">Disponibles</span>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="lic-toolbar">
                    <div className="lic-busqueda">
                        <IconoFa icono={faSearch} />
                        <input type="text" placeholder="Buscar licencia o serial..." value={filtro}
                            onChange={function (e) { setFiltro(e.target.value); }} />
                    </div>
                    <button className="lic-btn-crear" onClick={abrirCrear}>
                        <IconoFa icono={faPlus} /> Nueva licencia
                    </button>
                </div>

                {/* Form crear/editar */}
                {mostrarForm && (
                    <div className="lic-form-panel">
                        <h3 className="lic-form-titulo">{editandoId ? 'Editar Licencia' : 'Nueva Licencia'}</h3>
                        <div className="lic-form-grid">
                            <div className="lic-form-campo">
                                <label>Descripción *</label>
                                <input type="text" placeholder="Ej: Windows 11 Pro, Office 365..."
                                    value={form.descripcion} onChange={function (e) { handleChange('descripcion', e.target.value); }} />
                            </div>
                            <div className="lic-form-campo">
                                <label>Serial / Key *</label>
                                <input type="text" placeholder="Serial o clave de la licencia"
                                    value={form.serie_keys} onChange={function (e) { handleChange('serie_keys', e.target.value); }} />
                            </div>
                            <div className="lic-form-campo">
                                <label>Cantidad *</label>
                                <input type="number" min="1" value={form.cantidad}
                                    onChange={function (e) { handleChange('cantidad', e.target.value); }} />
                            </div>
                        </div>
                        <div className="lic-form-btns">
                            <button className="lic-btn guardar" onClick={guardar}>
                                <IconoFa icono={faFloppyDisk} /> {editandoId ? 'Actualizar' : 'Crear'}
                            </button>
                            <button className="lic-btn cancelar" onClick={cancelarForm}>
                                <IconoFa icono={faXmark} /> Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Lista de licencias */}
                <div className="lic-grid">
                    {licenciasFiltradas.length === 0 && (
                        <p className="lic-vacio">No se encontraron licencias</p>
                    )}
                    {licenciasFiltradas.map(function (lic) {
                        var pct = lic.cantidad > 0 ? Math.round((lic.asignadas / lic.cantidad) * 100) : 0;
                        var abierto = expandido === lic.id_licencia;
                        var barColor = pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#22c55e';
                        var enEdicion = editandoId === lic.id_licencia;

                        return (
                            <div key={lic.id_licencia} className={'lic-card' + (abierto ? ' expandida' : '')}>
                                {/* Header: si está en edición inline, mostrar inputs */}
                                {enEdicion ? (
                                    <div className="lic-card-edit-inline">
                                        <div className="lic-edit-inline-grid">
                                            <div className="lic-form-campo">
                                                <label>Descripción *</label>
                                                <input type="text" value={form.descripcion}
                                                    onChange={function (e) { handleChange('descripcion', e.target.value); }} />
                                            </div>
                                            <div className="lic-form-campo">
                                                <label>Serial / Key *</label>
                                                <input type="text" value={form.serie_keys}
                                                    onChange={function (e) { handleChange('serie_keys', e.target.value); }} />
                                            </div>
                                            <div className="lic-form-campo">
                                                <label>Cantidad *</label>
                                                <input type="number" min="1" value={form.cantidad}
                                                    onChange={function (e) { handleChange('cantidad', e.target.value); }} />
                                            </div>
                                        </div>
                                        <div className="lic-form-btns">
                                            <button className="lic-btn guardar" onClick={guardar}>
                                                <IconoFa icono={faFloppyDisk} /> Actualizar
                                            </button>
                                            <button className="lic-btn cancelar" onClick={cancelarForm}>
                                                <IconoFa icono={faXmark} /> Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="lic-card-header" onClick={function () { toggleExpandir(lic.id_licencia); }}>
                                        <div className="lic-card-icono"><IconoFa icono={faKey} /></div>
                                        <div className="lic-card-info">
                                            <span className="lic-card-nombre">{lic.serie_keys}</span>
                                            <span className="lic-card-serial">{lic.descripcion}</span>
                                        </div>
                                        <div className="lic-card-conteo">
                                            <span className="lic-card-disp" style={{ color: barColor }}>
                                                {lic.disponibles} / {lic.cantidad}
                                            </span>
                                            <span className="lic-card-disp-label">disponibles</span>
                                        </div>
                                        <IconoFa icono={abierto ? faChevronDown : faChevronRight} clase="lic-card-flecha" />
                                    </div>
                                )}

                                {/* Barra de progreso */}
                                <div className="lic-barra-wrap">
                                    <div className="lic-barra" style={{ width: pct + '%', background: barColor }}></div>
                                </div>

                                {/* Detalle expandido */}
                                {abierto && (
                                    <div className="lic-card-detalle">
                                        <div className="lic-detalle-nums">
                                            <div className="lic-detalle-item">
                                                <span className="lic-detalle-num total">{lic.cantidad}</span>
                                                <span>Total</span>
                                            </div>
                                            <div className="lic-detalle-item">
                                                <span className="lic-detalle-num asignado">{lic.asignadas}</span>
                                                <span>Asignadas</span>
                                            </div>
                                            <div className="lic-detalle-item">
                                                <span className="lic-detalle-num disponible">{lic.disponibles}</span>
                                                <span>Disponibles</span>
                                            </div>
                                        </div>

                                        {/* Equipos que tienen esta licencia */}
                                        {lic.equipos && lic.equipos.length > 0 && (
                                            <div className="lic-equipos-lista">
                                                <span className="lic-equipos-titulo">Equipos asignados:</span>
                                                {lic.equipos.map(function (eq) {
                                                    var iconoTipo = ICONOS_TIPO[(eq.tipo || '').toUpperCase()] || faDesktop;
                                                    return (
                                                        <div key={eq.id_asiglicenc} className="lic-equipo-row">
                                                            <IconoFa icono={iconoTipo} clase="lic-equipo-icono" />
                                                            <span className="lic-equipo-tipo">{eq.tipo}</span>
                                                            <span className="lic-equipo-serie">S/N: {eq.serie}</span>
                                                            <button className="lic-btn-desasignar" onClick={function () { desasignar(eq.id_asiglicenc); }}
                                                                title="Desasignar licencia">
                                                                <IconoFa icono={faXmark} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {lic.equipos && lic.equipos.length === 0 && (
                                            <p className="lic-sin-equipos">Sin asignaciones aún</p>
                                        )}

                                        {/* Acciones */}
                                        <div className="lic-card-acciones">
                                            <button className="lic-btn editar" onClick={function () { abrirEditar(lic); }}>
                                                <IconoFa icono={faPen} /> Editar
                                            </button>
                                            <button className="lic-btn eliminar" onClick={function () { eliminar(lic.id_licencia, lic.descripcion); }}>
                                                <IconoFa icono={faTrash} /> Eliminar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </PageContent>
    );
}
