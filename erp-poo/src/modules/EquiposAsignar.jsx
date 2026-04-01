import { useState, useEffect } from 'react';
import { API_URL, headersConToken } from '../auth';
import IconoFa from '../components/IconoFa';
import PageContent from '../components/PageContent';
import {
    faLaptop, faSearch, faUserPlus, faRotateLeft, faCheckCircle,
    faDesktop, faServer, faMobileScreen, faTabletScreenButton,
    faHardDrive, faMemory, faMicrochip, faBarcode,
    faUser, faXmark
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
    var [filtro, setFiltro] = useState('');
    var [filtroEstado, setFiltroEstado] = useState('');
    var [filtroTipo, setFiltroTipo] = useState('');
    var [mensaje, setMensaje] = useState('');
    var [exito, setExito] = useState(false);
    var [cargando, setCargando] = useState(true);
    var [asignandoId, setAsignandoId] = useState(null);
    var [personalSeleccionado, setPersonalSeleccionado] = useState('');

    function cargarDatos() {
        setCargando(true);
        Promise.all([
            fetch(API_URL + '/equipos', { headers: headersConToken() }).then(function (r) {
                if (r.status === 401) { localStorage.removeItem('session'); window.location.href = '/'; return []; }
                return r.json();
            }),
            fetch(API_URL + '/equipos/asignaciones', { headers: headersConToken() }).then(function (r) { return r.json(); }),
            fetch(API_URL + '/equipos/empleados-activos', { headers: headersConToken() }).then(function (r) { return r.json(); }),
        ]).then(function (data) {
            setEquipos(Array.isArray(data[0]) ? data[0] : []);
            setAsignaciones(Array.isArray(data[1]) ? data[1] : []);
            setEmpleados(Array.isArray(data[2]) ? data[2] : []);
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

        return coincideTexto && coincideEstado && coincideTipo;
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
                </div>

                {/* Filtros activos */}
                {(filtroEstado || filtroTipo) && (
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

                        return (
                            <div key={eq.id_equipo} className={'eqa-card' + (asig ? ' asignado' : '') + (abrirAsignar ? ' asignando' : '')}>
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
                                    {eq.almacenamiento && eq.almacenamiento.length > 0 && (
                                        <div className="eqa-spec"><IconoFa icono={faHardDrive} /><span>{eq.almacenamiento.map(function (a) { return a.tipo_disco + ' ' + a.capacidad; }).join(', ')}</span></div>
                                    )}
                                    {eq.gama && (
                                        <div className="eqa-spec"><span className="eqa-gama-badge">{eq.gama}</span></div>
                                    )}
                                </div>

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
                                    {!asig && estadoKey === 'DISPONIBLE' && !abrirAsignar && (
                                        <button className="eqa-btn-card asignar" onClick={function () { setAsignandoId(eq.id_equipo); setPersonalSeleccionado(''); }}>
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
                            </div>
                        );
                    })}
                </div>
            </div>
        </PageContent>
    );
}
