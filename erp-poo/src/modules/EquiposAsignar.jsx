import { useState, useEffect } from 'react';
import { API_URL, headersConToken } from '../auth';
import IconoFa from '../components/IconoFa';
import PageContent from '../components/PageContent';
import {
    faLaptop, faSearch, faUserPlus, faRotateLeft, faCheckCircle,
    faDesktop, faServer, faMobileScreen, faTabletScreenButton,
    faHardDrive, faMemory, faMicrochip, faBarcode,
    faUser, faXmark, faPen, faFloppyDisk, faPlus, faTrash,
    faCalendarDays, faShieldHalved, faKey
} from '@fortawesome/free-solid-svg-icons';
import '../styles/EquiposAsignar.css';

var ICONOS_TIPO = {
    'LAPTOP': faLaptop,
    'COMPUTADORA': faDesktop,
    'SERVIDOR': faServer,
    'CELULAR': faMobileScreen,
    'TABLET': faTabletScreenButton,
};

var ESTADO_ESTILOS = {
    'DISPONIBLE': { bg: '#dcfce7', color: '#15803d', label: 'DISPONIBLE' },
    'ASIGNADO': { bg: '#dbeafe', color: '#2563eb', label: 'ASIGNADO' },
    'EN MANTENIMIENTO': { bg: '#fef3c7', color: '#92400e', label: 'MANTENIMIENTO' },
    'DE BAJA': { bg: '#fee2e2', color: '#b91c1c', label: 'DE BAJA' },
};

export default function EquiposAsignar() {
    var [equipos, setEquipos] = useState([]);
    var [asignaciones, setAsignaciones] = useState([]);
    var [empleados, setEmpleados] = useState([]);
    var [catalogos, setCatalogos] = useState(null);
    var [filtro, setFiltro] = useState('');
    var [filtroEstado, setFiltroEstado] = useState('');
    var [filtroTipo, setFiltroTipo] = useState('');
    var [filtroGama, setFiltroGama] = useState('');
    var [mensaje, setMensaje] = useState('');
    var [exito, setExito] = useState(false);
    var [cargando, setCargando] = useState(true);
    var [asignandoId, setAsignandoId] = useState(null);
    var [personalSeleccionado, setPersonalSeleccionado] = useState('');
    var [editandoId, setEditandoId] = useState(null);
    var [formEdit, setFormEdit] = useState({});
    var [licenciasDisp, setLicenciasDisp] = useState([]);

    function cargarDatos() {
        setCargando(true);
        Promise.all([
            fetch(API_URL + '/equipos', { headers: headersConToken() }).then(function (r) {
                if (r.status === 401) { localStorage.removeItem('session'); window.location.href = '/'; return []; }
                return r.json();
            }),
            fetch(API_URL + '/equipos/asignaciones', { headers: headersConToken() }).then(function (r) { return r.json(); }),
            fetch(API_URL + '/equipos/empleados-activos', { headers: headersConToken() }).then(function (r) { return r.json(); }),
            fetch(API_URL + '/equipos/catalogos', { headers: headersConToken() }).then(function (r) { return r.json(); }),
            fetch(API_URL + '/licencias/disponibles', { headers: headersConToken() }).then(function (r) { return r.json(); }),
        ]).then(function (data) {
            setEquipos(Array.isArray(data[0]) ? data[0] : []);
            setAsignaciones(Array.isArray(data[1]) ? data[1] : []);
            setEmpleados(Array.isArray(data[2]) ? data[2] : []);
            setCatalogos(data[3] || null);
            setLicenciasDisp(Array.isArray(data[4]) ? data[4] : []);
        }).catch(function () {
            mostrarMensaje('Error cargando datos', false);
        }).finally(function () {
            setCargando(false);
        });
    }

    useEffect(function () { cargarDatos(); }, []);

    function mostrarMensaje(msg, ok) {
        setMensaje(msg);
        setExito(ok);
        if (ok) setTimeout(function () { setMensaje(''); }, 2500);
    }

    // Mapear asignación activa a cada equipo
    function obtenerAsignacionActiva(id_equipo) {
        return asignaciones.find(function (a) {
            return a.id_equipo === id_equipo && a.activa;
        }) || null;
    }

    // Estadísticas
    var totalEquipos = equipos.length;
    var equiposAsignados = equipos.filter(function (eq) { return obtenerAsignacionActiva(eq.id_equipo); }).length;
    var equiposDisponibles = equipos.filter(function (eq) { return (eq.estado || '').toUpperCase() === 'DISPONIBLE'; }).length;
    var tiposUnicos = [];
    equipos.forEach(function (eq) {
        if (eq.tipo && tiposUnicos.indexOf(eq.tipo) < 0) tiposUnicos.push(eq.tipo);
    });
    var gamasUnicas = [];
    equipos.forEach(function (eq) {
        if (eq.gama && gamasUnicas.indexOf(eq.gama) < 0) gamasUnicas.push(eq.gama);
    });
    // Conteo por gama
    var conteoPorGama = {};
    equipos.forEach(function (eq) {
        var g = eq.gama || 'Sin gama';
        conteoPorGama[g] = (conteoPorGama[g] || 0) + 1;
    });

    // Filtrado
    var equiposFiltrados = equipos.filter(function (eq) {
        var texto = filtro.toLowerCase();
        var asig = obtenerAsignacionActiva(eq.id_equipo);
        var coincideTexto = !texto ||
            (eq.serie || '').toLowerCase().indexOf(texto) >= 0 ||
            (eq.tipo || '').toLowerCase().indexOf(texto) >= 0 ||
            (eq.marca || '').toLowerCase().indexOf(texto) >= 0 ||
            (eq.modelo || '').toLowerCase().indexOf(texto) >= 0 ||
            (eq.codigoe || '').toLowerCase().indexOf(texto) >= 0 ||
            (asig && (asig.empleado || '').toLowerCase().indexOf(texto) >= 0);

        var coincideEstado = !filtroEstado || (eq.estado || '').toUpperCase() === filtroEstado;
        var coincideTipo = !filtroTipo || eq.tipo === filtroTipo;
        var coincideGama = !filtroGama || (eq.gama || '') === filtroGama;

        return coincideTexto && coincideEstado && coincideTipo && coincideGama;
    });

    // Asignar equipo
    function handleAsignar(id_equipo) {
        if (!personalSeleccionado) {
            mostrarMensaje('Selecciona un empleado', false);
            return;
        }
        fetch(API_URL + '/equipos/asignar', {
            method: 'POST',
            headers: headersConToken(),
            body: JSON.stringify({ id_equipo: id_equipo, id_personal: Number(personalSeleccionado) })
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) throw new Error(res.data.detail || 'Error');
            mostrarMensaje('¡Equipo asignado correctamente!', true);
            setAsignandoId(null);
            setPersonalSeleccionado('');
            cargarDatos();
        })
        .catch(function (err) { mostrarMensaje(err.message, false); });
    }

    // Devolver equipo
    function handleDevolver(id_asig) {
        if (!confirm('¿Confirmas la devolución de este equipo?')) return;
        fetch(API_URL + '/equipos/devolver/' + id_asig, {
            method: 'PUT',
            headers: headersConToken()
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) throw new Error(res.data.detail || 'Error');
            mostrarMensaje('Equipo devuelto correctamente', true);
            cargarDatos();
        })
        .catch(function (err) { mostrarMensaje(err.message, false); });
    }

    // Abrir edición de un equipo
    function abrirEditar(eq) {
        setEditandoId(eq.id_equipo);
        setAsignandoId(null);
        // Buscar IDs reales desde catálogos
        var marcaId = '';
        var modeloId = '';
        var procesadorId = '';
        var tipoRamId = '';
        var ramId = '';
        var gamaId = '';
        if (catalogos) {
            var m = (catalogos.marcas || []).find(function (c) { return c.nombre === eq.marca; });
            if (m) marcaId = m.id;
            var mo = (catalogos.modelos || []).find(function (c) { return c.nombre === eq.modelo; });
            if (mo) modeloId = mo.id;
            var pr = (catalogos.procesadores || []).find(function (c) { return c.nombre === eq.procesador; });
            if (pr) procesadorId = pr.id;
            var tr = (catalogos.tipos_ram || []).find(function (c) { return c.nombre === eq.tipo_ram; });
            if (tr) tipoRamId = tr.id;
            var ra = (catalogos.rams || []).find(function (c) { return c.nombre === eq.ram; });
            if (ra) ramId = ra.id;
            var ga = (catalogos.gamas || []).find(function (c) { return c.nombre === eq.gama; });
            if (ga) gamaId = ga.id;
        }
        setFormEdit({
            serie: eq.serie || '',
            codigoe: eq.codigoe || '',
            fech_compra: eq.fech_compra || '',
            garantia: eq.garantia || '',
            id_gama: gamaId,
            id_marca: marcaId,
            id_modelo: modeloId,
            id_procesador: procesadorId,
            id_tipo_ram: tipoRamId,
            id_ram: ramId,
            id_licencia: '',
            almacenamiento: (eq.almacenamiento || []).map(function (a) {
                return { id_disco: a.id_disco || '', descrip: a.descrip || '' };
            })
        });
    }

    function cambiarFormEdit(campo, valor) {
        setFormEdit(function (prev) {
            var nuevo = Object.assign({}, prev);
            nuevo[campo] = valor;
            // Limpiar modelo al cambiar marca
            if (campo === 'id_marca') nuevo.id_modelo = '';
            return nuevo;
        });
    }

    function agregarDisco() {
        setFormEdit(function (prev) {
            var nuevo = Object.assign({}, prev);
            nuevo.almacenamiento = (prev.almacenamiento || []).concat([{ id_disco: '', descrip: '' }]);
            return nuevo;
        });
    }

    function quitarDisco(index) {
        setFormEdit(function (prev) {
            var nuevo = Object.assign({}, prev);
            nuevo.almacenamiento = prev.almacenamiento.filter(function (_, i) { return i !== index; });
            return nuevo;
        });
    }

    function cambiarDisco(index, campo, valor) {
        setFormEdit(function (prev) {
            var nuevo = Object.assign({}, prev);
            nuevo.almacenamiento = prev.almacenamiento.map(function (d, i) {
                if (i === index) {
                    var copia = Object.assign({}, d);
                    copia[campo] = valor;
                    return copia;
                }
                return d;
            });
            return nuevo;
        });
    }

    // Guardar edición
    function guardarEdicion(id_equipo) {
        var body = {
            serie: formEdit.serie,
            codigoe: formEdit.codigoe,
            fech_compra: formEdit.fech_compra || null,
            garantia: formEdit.garantia ? parseInt(formEdit.garantia) : 0,
            id_gama: formEdit.id_gama || null,
            id_marca: formEdit.id_marca || null,
            id_modelo: formEdit.id_modelo || null,
            id_procesador: formEdit.id_procesador || null,
            id_tipo_ram: formEdit.id_tipo_ram || null,
            id_ram: formEdit.id_ram || null,
            almacenamiento: (formEdit.almacenamiento || []).filter(function (a) { return a.id_disco; }).map(function (a) {
                return { id_disco: parseInt(a.id_disco), descrip: a.descrip || '' };
            })
        };

        fetch(API_URL + '/equipos/' + id_equipo, {
            method: 'PUT',
            headers: headersConToken(),
            body: JSON.stringify(body)
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) throw new Error(res.data.detail || 'Error al guardar');
            // Asignar licencia si se seleccionó una nueva
            if (formEdit.id_licencia) {
                return fetch(API_URL + '/licencias/asignar', {
                    method: 'POST',
                    headers: headersConToken(),
                    body: JSON.stringify({ id_licencia: parseInt(formEdit.id_licencia), id_equipo: id_equipo })
                }).then(function (r2) { return r2.json(); }).then(function () {
                    mostrarMensaje('Equipo actualizado y licencia asignada', true);
                });
            }
            mostrarMensaje('Equipo actualizado correctamente', true);
        })
        .then(function () {
            setEditandoId(null);
            cargarDatos();
        })
        .catch(function (err) { mostrarMensaje(err.message, false); });
    }

    // Modelos filtrados por marca seleccionada
    function modelosFiltrados() {
        if (!catalogos || !formEdit.id_marca) return catalogos ? catalogos.modelos || [] : [];
        return (catalogos.modelos || []).filter(function (m) {
            return m.id_marca === parseInt(formEdit.id_marca);
        });
    }

    if (cargando) return <PageContent><p className="eqa-loading">Cargando inventario...</p></PageContent>;

    return (
        <PageContent>
            <div className="eqa-container">
                <h2 className="eqa-titulo"><IconoFa icono={faLaptop} /> EQUIPOS</h2>
                <p className="eqa-subtitulo">ASIGNACIÓN DE EQUIPOS</p>

                {mensaje && <p className={'eqa-mensaje ' + (exito ? 'exito' : 'error')}>{mensaje}</p>}

                {/* Estadísticas */}
                <div className="eqa-stats">
                    <div className={'eqa-stat' + (!filtroEstado ? ' activo' : '')} onClick={function () { setFiltroEstado(''); }}>
                        <span className="eqa-stat-num">{totalEquipos}</span>
                        <span className="eqa-stat-label">Total</span>
                    </div>
                    <div className={'eqa-stat disponible' + (filtroEstado === 'DISPONIBLE' ? ' activo' : '')} onClick={function () { setFiltroEstado(filtroEstado === 'DISPONIBLE' ? '' : 'DISPONIBLE'); }}>
                        <span className="eqa-stat-num">{equiposDisponibles}</span>
                        <span className="eqa-stat-label">Disponibles</span>
                    </div>
                    <div className={'eqa-stat asignado' + (filtroEstado === 'ASIGNADO' ? ' activo' : '')} onClick={function () { setFiltroEstado(filtroEstado === 'ASIGNADO' ? '' : 'ASIGNADO'); }}>
                        <span className="eqa-stat-num">{equiposAsignados}</span>
                        <span className="eqa-stat-label">Asignados</span>
                    </div>
                    <div className="eqa-stats-sep"></div>
                    {gamasUnicas.map(function (g) {
                        return (
                            <div key={g} className={'eqa-stat gama' + (filtroGama === g ? ' activo' : '')} onClick={function () { setFiltroGama(filtroGama === g ? '' : g); }}>
                                <span className="eqa-stat-num">{conteoPorGama[g] || 0}</span>
                                <span className="eqa-stat-label">{g}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Toolbar */}
                <div className="eqa-toolbar">
                    <div className="eqa-busqueda">
                        <IconoFa icono={faSearch} />
                        <input type="text" placeholder="Buscar por serie, marca, modelo, empleado..." value={filtro}
                            onChange={function (e) { setFiltro(e.target.value); }} />
                    </div>
                    <select className="eqa-filtro-tipo" value={filtroTipo} onChange={function (e) { setFiltroTipo(e.target.value); }}>
                        <option value="">Todos los tipos</option>
                        {tiposUnicos.map(function (t) { return <option key={t} value={t}>{t}</option>; })}
                    </select>
                    <select className="eqa-filtro-tipo" value={filtroGama} onChange={function (e) { setFiltroGama(e.target.value); }}>
                        <option value="">Todas las gamas</option>
                        {gamasUnicas.map(function (g) { return <option key={g} value={g}>{g}</option>; })}
                    </select>
                </div>

                {/* Filtros activos */}
                {(filtroEstado || filtroTipo || filtroGama) && (
                    <div className="eqa-filtros-activos">
                        {filtroEstado && (
                            <span className="eqa-filtro-badge">
                                {filtroEstado} <button onClick={function () { setFiltroEstado(''); }}><IconoFa icono={faXmark} /></button>
                            </span>
                        )}
                        {filtroTipo && (
                            <span className="eqa-filtro-badge">
                                {filtroTipo} <button onClick={function () { setFiltroTipo(''); }}><IconoFa icono={faXmark} /></button>
                            </span>
                        )}
                        {filtroGama && (
                            <span className="eqa-filtro-badge">
                                {filtroGama} <button onClick={function () { setFiltroGama(''); }}><IconoFa icono={faXmark} /></button>
                            </span>
                        )}
                    </div>
                )}

                {/* Grid de tarjetas */}
                <div className="eqa-grid">
                    {equiposFiltrados.length === 0 && (
                        <p className="eqa-vacio-grid">No se encontraron equipos</p>
                    )}
                    {equiposFiltrados.map(function (eq) {
                        var asig = obtenerAsignacionActiva(eq.id_equipo);
                        var estadoKey = (eq.estado || '').toUpperCase();
                        var estadoEstilo = ESTADO_ESTILOS[estadoKey] || { bg: '#f1f5f9', color: '#64748b', label: eq.estado || '—' };
                        var iconoTipo = ICONOS_TIPO[(eq.tipo || '').toUpperCase()] || faHardDrive;
                        var abrirAsignar = asignandoId === eq.id_equipo;
                        var editando = editandoId === eq.id_equipo;

                        return (
                            <div key={eq.id_equipo} className={'eqa-card' + (asig ? ' asignado' : '') + (abrirAsignar ? ' asignando' : '') + (editando ? ' editando' : '')}>
                                {/* Header */}
                                <div className="eqa-card-header">
                                    <div className="eqa-card-icono">
                                        <IconoFa icono={iconoTipo} />
                                    </div>
                                    <div className="eqa-card-titulo">
                                        <span className="eqa-card-tipo">{eq.tipo || 'Equipo'}</span>
                                        <span className="eqa-card-marca">{eq.marca}{eq.modelo ? ' ' + eq.modelo : ''}</span>
                                    </div>
                                    <span className="eqa-card-estado" style={{ background: estadoEstilo.bg, color: estadoEstilo.color }}>
                                        {estadoEstilo.label}
                                    </span>
                                </div>

                                {/* Modo edición */}
                                {editando && catalogos ? (
                                    <div className="eqa-edit-form">
                                        <div className="eqa-edit-grid">
                                            <div className="eqa-edit-campo">
                                                <label>Serie</label>
                                                <input type="text" value={formEdit.serie || ''} onChange={function (e) { cambiarFormEdit('serie', e.target.value); }} />
                                            </div>
                                            <div className="eqa-edit-campo">
                                                <label>Código</label>
                                                <input type="text" value={formEdit.codigoe || ''} onChange={function (e) { cambiarFormEdit('codigoe', e.target.value); }} />
                                            </div>
                                            <div className="eqa-edit-campo">
                                                <label>Fecha Compra</label>
                                                <input type="date" value={formEdit.fech_compra || ''} onChange={function (e) { cambiarFormEdit('fech_compra', e.target.value); }} />
                                            </div>
                                            <div className="eqa-edit-campo">
                                                <label>Garantía (meses)</label>
                                                <input type="number" value={formEdit.garantia || ''} onChange={function (e) { cambiarFormEdit('garantia', e.target.value); }} />
                                            </div>
                                            <div className="eqa-edit-campo">
                                                <label>Gama</label>
                                                <select value={formEdit.id_gama || ''} onChange={function (e) { cambiarFormEdit('id_gama', e.target.value); }}>
                                                    <option value="">— Gama —</option>
                                                    {(catalogos.gamas || []).map(function (g) { return <option key={g.id} value={g.id}>{g.nombre}</option>; })}
                                                </select>
                                            </div>
                                            <div className="eqa-edit-campo">
                                                <label>Marca</label>
                                                <select value={formEdit.id_marca || ''} onChange={function (e) { cambiarFormEdit('id_marca', e.target.value); }}>
                                                    <option value="">— Marca —</option>
                                                    {(catalogos.marcas || []).map(function (m) { return <option key={m.id} value={m.id}>{m.nombre}</option>; })}
                                                </select>
                                            </div>
                                            <div className="eqa-edit-campo">
                                                <label>Modelo</label>
                                                <select value={formEdit.id_modelo || ''} onChange={function (e) { cambiarFormEdit('id_modelo', e.target.value); }}>
                                                    <option value="">— Modelo —</option>
                                                    {modelosFiltrados().map(function (m) { return <option key={m.id} value={m.id}>{m.nombre}</option>; })}
                                                </select>
                                            </div>
                                            <div className="eqa-edit-campo">
                                                <label>Procesador</label>
                                                <select value={formEdit.id_procesador || ''} onChange={function (e) { cambiarFormEdit('id_procesador', e.target.value); }}>
                                                    <option value="">— Procesador —</option>
                                                    {(catalogos.procesadores || []).map(function (p) { return <option key={p.id} value={p.id}>{p.nombre}</option>; })}
                                                </select>
                                            </div>
                                            <div className="eqa-edit-campo">
                                                <label>Tipo RAM</label>
                                                <select value={formEdit.id_tipo_ram || ''} onChange={function (e) { cambiarFormEdit('id_tipo_ram', e.target.value); }}>
                                                    <option value="">— Tipo RAM —</option>
                                                    {(catalogos.tipos_ram || []).map(function (t) { return <option key={t.id} value={t.id}>{t.nombre}</option>; })}
                                                </select>
                                            </div>
                                            <div className="eqa-edit-campo">
                                                <label>RAM</label>
                                                <select value={formEdit.id_ram || ''} onChange={function (e) { cambiarFormEdit('id_ram', e.target.value); }}>
                                                    <option value="">— RAM —</option>
                                                    {(catalogos.rams || []).map(function (r) { return <option key={r.id} value={r.id}>{r.nombre}</option>; })}
                                                </select>
                                            </div>
                                            <div className="eqa-edit-campo">
                                                <label><IconoFa icono={faKey} /> Licencia</label>
                                                <select value={formEdit.id_licencia || ''} onChange={function (e) { cambiarFormEdit('id_licencia', e.target.value); }}>
                                                    <option value="">— Asignar licencia —</option>
                                                    {licenciasDisp.filter(function (l) { return l.disponibles > 0; }).map(function (l) {
                                                        return <option key={l.id_licencia} value={l.id_licencia}>{l.descripcion} ({l.disponibles} disp.)</option>;
                                                    })}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Almacenamiento editable */}
                                        <div className="eqa-edit-almc">
                                            <div className="eqa-edit-almc-header">
                                                <label><IconoFa icono={faHardDrive} /> Almacenamiento</label>
                                                <button type="button" className="eqa-btn-mini add" onClick={agregarDisco}><IconoFa icono={faPlus} /></button>
                                            </div>
                                            {(formEdit.almacenamiento || []).map(function (disco, idx) {
                                                return (
                                                    <div key={idx} className="eqa-edit-disco-row">
                                                        <select value={disco.id_disco || ''} onChange={function (e) { cambiarDisco(idx, 'id_disco', e.target.value); }}>
                                                            <option value="">— Disco —</option>
                                                            {(catalogos.discos || []).map(function (d) { return <option key={d.id} value={d.id}>{d.nombre}</option>; })}
                                                        </select>
                                                        <input type="text" placeholder="Nota" value={disco.descrip || ''} onChange={function (e) { cambiarDisco(idx, 'descrip', e.target.value); }} />
                                                        <button type="button" className="eqa-btn-mini del" onClick={function () { quitarDisco(idx); }}><IconoFa icono={faTrash} /></button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="eqa-edit-btns">
                                            <button className="eqa-btn-card confirmar" onClick={function () { guardarEdicion(eq.id_equipo); }}>
                                                <IconoFa icono={faFloppyDisk} /> Guardar
                                            </button>
                                            <button className="eqa-btn-card cancelar" onClick={function () { setEditandoId(null); }}>
                                                <IconoFa icono={faXmark} /> Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Specs */}
                                        <div className="eqa-card-specs">
                                            {eq.serie && (
                                                <div className="eqa-spec"><IconoFa icono={faBarcode} /><span>S/N: {eq.serie}</span></div>
                                            )}
                                            {eq.codigoe && (
                                                <div className="eqa-spec"><IconoFa icono={faBarcode} /><span>Cód: {eq.codigoe}</span></div>
                                            )}
                                            {eq.procesador && (
                                                <div className="eqa-spec"><IconoFa icono={faMicrochip} /><span>{eq.procesador}</span></div>
                                            )}
                                            {eq.ram && (
                                                <div className="eqa-spec"><IconoFa icono={faMemory} /><span>{eq.tipo_ram ? eq.tipo_ram + ' ' : ''}{eq.ram}</span></div>
                                            )}
                                            {eq.fech_compra && (
                                                <div className="eqa-spec"><IconoFa icono={faCalendarDays} /><span>Compra: {eq.fech_compra}</span></div>
                                            )}
                                            {eq.garantia ? (
                                                <div className="eqa-spec"><IconoFa icono={faShieldHalved} /><span>Garantía: {eq.garantia} meses</span></div>
                                            ) : null}
                                            {eq.gama && (
                                                <div className="eqa-spec"><span className="eqa-gama-badge">{eq.gama}</span></div>
                                            )}
                                            {eq.licencias && eq.licencias.length > 0 && eq.licencias.map(function (lic) {
                                                return (
                                                    <div key={lic.id_asiglicenc} className="eqa-spec"><IconoFa icono={faKey} /><span>{lic.descripcion}</span></div>
                                                );
                                            })}
                                        </div>

                                        {/* Almacenamiento detallado */}
                                        {eq.almacenamiento && eq.almacenamiento.length > 0 && (
                                            <div className="eqa-card-storage">
                                                <span className="eqa-storage-label"><IconoFa icono={faHardDrive} /> Almacenamiento</span>
                                                {eq.almacenamiento.map(function (a, i) {
                                                    return (
                                                        <div key={i} className="eqa-storage-item">
                                                            <span className="eqa-storage-tipo">{a.tipo_disco}</span>
                                                            <span className="eqa-storage-cap">{a.capacidad}</span>
                                                            {a.descrip && <span className="eqa-storage-nota">{a.descrip}</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Asignación actual */}
                                        {asig && (
                                            <div className="eqa-card-asignacion">
                                                <div className="eqa-asig-avatar"><IconoFa icono={faUser} /></div>
                                                <div className="eqa-asig-info">
                                                    <span className="eqa-asig-nombre">{asig.empleado}</span>
                                                    <span className="eqa-asig-fecha">Desde: {asig.fecha_asig}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Acciones */}
                                        <div className="eqa-card-acciones">
                                            <button className="eqa-btn-card editar" onClick={function () { abrirEditar(eq); }}>
                                                <IconoFa icono={faPen} /> Editar
                                            </button>
                                            {!asig && estadoKey === 'DISPONIBLE' && !abrirAsignar && (
                                                <button className="eqa-btn-card asignar" onClick={function () { setAsignandoId(eq.id_equipo); setEditandoId(null); setPersonalSeleccionado(''); }}>
                                                    <IconoFa icono={faUserPlus} /> Asignar
                                                </button>
                                            )}
                                            {asig && (
                                                <button className="eqa-btn-card devolver" onClick={function () { handleDevolver(asig.id_asig); }}>
                                                    <IconoFa icono={faRotateLeft} /> Devolver
                                                </button>
                                            )}
                                        </div>

                                        {/* Form inline asignar */}
                                        {abrirAsignar && (
                                            <div className="eqa-card-form">
                                                <select value={personalSeleccionado} onChange={function (e) { setPersonalSeleccionado(e.target.value); }}>
                                                    <option value="">— Seleccionar empleado —</option>
                                                    {empleados.map(function (emp) {
                                                        return <option key={emp.id_personal} value={emp.id_personal}>{emp.nombre}</option>;
                                                    })}
                                                </select>
                                                <div className="eqa-card-form-btns">
                                                    <button className="eqa-btn-card confirmar" onClick={function () { handleAsignar(eq.id_equipo); }}>
                                                        <IconoFa icono={faCheckCircle} /> Confirmar
                                                    </button>
                                                    <button className="eqa-btn-card cancelar" onClick={function () { setAsignandoId(null); }}>
                                                        <IconoFa icono={faXmark} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </PageContent>
    );
}
