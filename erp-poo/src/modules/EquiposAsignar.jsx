import React, { useState, useEffect } from 'react';
import { API_URL, headersConToken } from '../auth';
import IconoFa from '../components/IconoFa';
import { faPlus, faRotateLeft, faSearch } from '@fortawesome/free-solid-svg-icons';
import '../styles/EquiposAsignar.css';

export default function EquiposAsignar() {
    var [asignaciones, setAsignaciones] = useState([]);
    var [disponibles, setDisponibles] = useState([]);
    var [empleados, setEmpleados] = useState([]);
    var [filtro, setFiltro] = useState('');
    var [verForm, setVerForm] = useState(false);
    var [form, setForm] = useState({ id_equipo: '', id_personal: '' });
    var [mensaje, setMensaje] = useState('');
    var [exito, setExito] = useState(false);
    var [cargando, setCargando] = useState(true);

    function cargarDatos() {
        setCargando(true);
        Promise.all([
            fetch(API_URL + '/equipos/asignaciones', { headers: headersConToken() }).then(function (r) { return r.json(); }),
            fetch(API_URL + '/equipos/disponibles', { headers: headersConToken() }).then(function (r) { return r.json(); }),
            fetch(API_URL + '/equipos/empleados-activos', { headers: headersConToken() }).then(function (r) { return r.json(); }),
        ]).then(function (data) {
            setAsignaciones(data[0]);
            setDisponibles(data[1]);
            setEmpleados(data[2]);
        }).catch(function () {
            setMensaje('Error cargando datos');
        }).finally(function () {
            setCargando(false);
        });
    }

    useEffect(function () { cargarDatos(); }, []);

    function handleAsignar(e) {
        e.preventDefault();
        setMensaje('');
        if (!form.id_equipo || !form.id_personal) {
            setMensaje('Selecciona equipo y empleado');
            return;
        }
        fetch(API_URL + '/equipos/asignar', {
            method: 'POST',
            headers: headersConToken(),
            body: JSON.stringify(form)
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) throw new Error(res.data.detail || 'Error');
            setExito(true);
            setMensaje('¡Equipo asignado correctamente!');
            setForm({ id_equipo: '', id_personal: '' });
            setVerForm(false);
            cargarDatos();
            setTimeout(function () { setExito(false); setMensaje(''); }, 2000);
        })
        .catch(function (err) { setMensaje(err.message); });
    }

    function handleDevolver(id_asig) {
        if (!confirm('¿Confirmas la devolución de este equipo?')) return;
        setMensaje('');
        fetch(API_URL + '/equipos/devolver/' + id_asig, {
            method: 'PUT',
            headers: headersConToken()
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
            if (!res.ok) throw new Error(res.data.detail || 'Error');
            setExito(true);
            setMensaje('Equipo devuelto correctamente');
            cargarDatos();
            setTimeout(function () { setExito(false); setMensaje(''); }, 2000);
        })
        .catch(function (err) { setMensaje(err.message); });
    }

    var activas = asignaciones.filter(function (a) { return a.activa; });
    var historial = asignaciones.filter(function (a) { return !a.activa; });

    // Filtro por texto
    var activasFiltradas = activas.filter(function (a) {
        if (!filtro) return true;
        var texto = (a.serie + ' ' + a.tipo_equipo + ' ' + a.empleado).toLowerCase();
        return texto.indexOf(filtro.toLowerCase()) >= 0;
    });

    if (cargando) return <div className="eq-loading">Cargando asignaciones...</div>;

    return (
        <div className="eqa-container">
            <h2 className="eqa-titulo">EQUIPOS</h2>
            <p className="eqa-subtitulo">ASIGNACIÓN DE EQUIPOS</p>

            {mensaje && <p className={'eqa-mensaje ' + (exito ? 'exito' : 'error')}>{mensaje}</p>}

            {/* Barra de herramientas */}
            <div className="eqa-toolbar">
                <div className="eqa-busqueda">
                    <IconoFa icono={faSearch} />
                    <input type="text" placeholder="Buscar asignación..." value={filtro}
                        onChange={function (e) { setFiltro(e.target.value); }} />
                </div>
                <button className="eqa-btn-nueva" onClick={function () { setVerForm(!verForm); }}>
                    <IconoFa icono={faPlus} /> Nueva asignación
                </button>
            </div>

            {/* Form nueva asignación */}
            {verForm && (
                <form className="eqa-form" onSubmit={handleAsignar}>
                    <div className="eqa-form-campos">
                        <div className="eqa-campo">
                            <label>Equipo disponible:</label>
                            <select value={form.id_equipo} onChange={function (e) { setForm(Object.assign({}, form, { id_equipo: e.target.value })); }} required>
                                <option value="">— Seleccionar equipo —</option>
                                {disponibles.map(function (eq) {
                                    return <option key={eq.id_equipo} value={eq.id_equipo}>
                                        {eq.tipo} — {eq.serie} {eq.marca ? '(' + eq.marca + ')' : ''}
                                    </option>;
                                })}
                            </select>
                        </div>
                        <div className="eqa-campo">
                            <label>Empleado:</label>
                            <select value={form.id_personal} onChange={function (e) { setForm(Object.assign({}, form, { id_personal: e.target.value })); }} required>
                                <option value="">— Seleccionar empleado —</option>
                                {empleados.map(function (emp) {
                                    return <option key={emp.id_personal} value={emp.id_personal}>{emp.nombre}</option>;
                                })}
                            </select>
                        </div>

                    </div>
                    <button type="submit" className="eqa-btn-asignar">Asignar equipo</button>
                </form>
            )}

            {/* Tabla asignaciones activas */}
            <div className="eqa-seccion">
                <h3>Asignaciones activas ({activasFiltradas.length})</h3>
                <div className="eqa-tabla-wrap">
                    <table className="eqa-tabla">
                        <thead>
                            <tr>
                                <th>Equipo</th>
                                <th>Serie</th>
                                <th>Empleado</th>
                                <th>Fecha asignación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activasFiltradas.length === 0 ? (
                                <tr><td colSpan="5" className="eqa-vacio">No hay asignaciones activas</td></tr>
                            ) : activasFiltradas.map(function (a) {
                                return (
                                    <tr key={a.id_asig}>
                                        <td>{a.tipo_equipo}</td>
                                        <td>{a.serie}</td>
                                        <td>{a.empleado}</td>
                                        <td>{a.fecha_asig}</td>
                                        <td>
                                            <button className="eqa-btn-devolver" onClick={function () { handleDevolver(a.id_asig); }}
                                                title="Devolver equipo">
                                                <IconoFa icono={faRotateLeft} /> Devolver
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Historial */}
            {historial.length > 0 && (
                <div className="eqa-seccion eqa-historial">
                    <h3>Historial de devoluciones</h3>
                    <div className="eqa-tabla-wrap">
                        <table className="eqa-tabla">
                            <thead>
                                <tr>
                                    <th>Equipo</th>
                                    <th>Serie</th>
                                    <th>Empleado</th>
                                    <th>Asignado</th>
                                    <th>Devuelto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historial.map(function (a) {
                                    return (
                                        <tr key={a.id_asig}>
                                            <td>{a.tipo_equipo}</td>
                                            <td>{a.serie}</td>
                                            <td>{a.empleado}</td>
                                            <td>{a.fecha_asig}</td>
                                            <td>{a.fecha_devol}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
