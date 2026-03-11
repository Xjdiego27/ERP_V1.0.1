import React, { useState, useEffect, useRef } from 'react';
import { API_URL, headersConToken, headersAuth } from '../auth';
import IconoFa from '../components/IconoFa';
import { faPlus, faTrash, faCamera, faSave, faPen } from '@fortawesome/free-solid-svg-icons';
import '../styles/EquiposCrear.css';

export default function EquiposCrear() {
    var [catalogos, setCatalogos] = useState(null);
    var [form, setForm] = useState({
        serie: '', id_tequipo: '', id_est_equipo: '1',
        codigoe: '', fech_compra: '', garantia: '1',
        id_gama: '', id_marca: '', id_modelo: '',
        id_procesador: '', id_tipo_ram: '', id_ram: '',
    });
    var [almacenamiento, setAlmacenamiento] = useState([]);
    var [foto, setFoto] = useState(null);
    var [fotoPreview, setFotoPreview] = useState(null);
    var [mensaje, setMensaje] = useState('');
    var [exito, setExito] = useState(false);
    var [guardando, setGuardando] = useState(false);
    var fotoInput = useRef(null);

    // Cargar catálogos
    useEffect(function () {
        fetch(API_URL + '/equipos/catalogos', { headers: headersConToken() })
            .then(function (r) { return r.json(); })
            .then(function (data) { setCatalogos(data); })
            .catch(function () { setMensaje('Error cargando catálogos'); });
    }, []);

    function handleChange(campo, valor) {
        setForm(function (prev) { return Object.assign({}, prev, { [campo]: valor }); });
    }

    // Agregar fila de almacenamiento
    function agregarAlmacenamiento() {
        setAlmacenamiento(function (prev) {
            return prev.concat([{ id_disco: '', descrip: '', id_tdisco: '', id_capdisco: '' }]);
        });
    }

    function actualizarAlmacenamiento(idx, campo, valor) {
        setAlmacenamiento(function (prev) {
            var copia = prev.slice();
            copia[idx] = Object.assign({}, copia[idx], { [campo]: valor });

            // Si cambian tipo o capacidad, buscar disco existente
            if ((campo === 'id_tdisco' || campo === 'id_capdisco') && catalogos) {
                var fila = copia[idx];
                if (fila.id_tdisco && fila.id_capdisco) {
                    var disco = catalogos.discos.find(function (d) {
                        return String(d.id_tdisco) === String(fila.id_tdisco) &&
                               String(d.id_capdisco) === String(fila.id_capdisco);
                    });
                    copia[idx].id_disco = disco ? disco.id : '';
                }
            }
            return copia;
        });
    }

    function eliminarAlmacenamiento(idx) {
        setAlmacenamiento(function (prev) { return prev.filter(function (_, i) { return i !== idx; }); });
    }

    function handleFoto(e) {
        var file = e.target.files[0];
        if (file) {
            setFoto(file);
            setFotoPreview(URL.createObjectURL(file));
        }
    }

    // Agregar nuevo item al catálogo
    function agregarCatalogo(tabla, campo, label) {
        var desc = prompt('Ingresa el nombre para ' + label + ':');
        if (!desc || !desc.trim()) return;

        fetch(API_URL + '/equipos/catalogo/' + tabla, {
            method: 'POST',
            headers: headersConToken(),
            body: JSON.stringify({ descripcion: desc.trim() })
        })
        .then(function (r) { return r.json(); })
        .then(function (item) {
            // Recargar catálogos
            fetch(API_URL + '/equipos/catalogos', { headers: headersConToken() })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    setCatalogos(data);
                    handleChange(campo, String(item.id));
                });
        })
        .catch(function () { setMensaje('Error al agregar ' + label); });
    }

    // Editar item existente del catálogo
    function editarCatalogo(tabla, campo, label, opciones) {
        var idActual = form[campo];
        if (!idActual) { alert('Primero selecciona un ' + label + ' para editar'); return; }
        var actual = opciones.find(function (o) { return String(o.id) === String(idActual); });
        var nombreActual = actual ? actual.nombre : '';
        var nuevoNombre = prompt('Editar ' + label + ':\nValor actual: ' + nombreActual + '\n\nNuevo nombre:', nombreActual);
        if (!nuevoNombre || !nuevoNombre.trim() || nuevoNombre.trim() === nombreActual) return;

        fetch(API_URL + '/equipos/catalogo/' + tabla + '/' + idActual, {
            method: 'PUT',
            headers: headersConToken(),
            body: JSON.stringify({ descripcion: nuevoNombre.trim() })
        })
        .then(function (r) { return r.json(); })
        .then(function () {
            fetch(API_URL + '/equipos/catalogos', { headers: headersConToken() })
                .then(function (r) { return r.json(); })
                .then(function (data) { setCatalogos(data); });
            setMensaje('');
        })
        .catch(function () { setMensaje('Error al editar ' + label); });
    }

    // Crear disco si no existe
    function crearDiscoSiNecesario(fila) {
        if (fila.id_disco) return Promise.resolve(fila.id_disco);
        if (!fila.id_tdisco || !fila.id_capdisco) return Promise.resolve(null);

        return fetch(API_URL + '/equipos/disco', {
            method: 'POST',
            headers: headersConToken(),
            body: JSON.stringify({ id_tdisco: parseInt(fila.id_tdisco), id_capdisco: parseInt(fila.id_capdisco) })
        })
        .then(function (r) { return r.json(); })
        .then(function (data) { return data.id; });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setMensaje('');

        if (!form.serie || !form.id_tequipo) {
            setMensaje('Serie y tipo de equipo son obligatorios');
            return;
        }

        setGuardando(true);

        try {
            // Resolver discos que no existan aún
            var almcFinal = [];
            for (var i = 0; i < almacenamiento.length; i++) {
                var fila = almacenamiento[i];
                var idDisco = await crearDiscoSiNecesario(fila);
                if (idDisco) {
                    almcFinal.push({ id_disco: idDisco, descrip: fila.descrip || '' });
                }
            }

            var payload = {
                serie: form.serie,
                id_tequipo: parseInt(form.id_tequipo),
                id_est_equipo: parseInt(form.id_est_equipo) || 1,
                codigoe: form.codigoe,
                fech_compra: form.fech_compra || null,
                garantia: parseInt(form.garantia) || 0,
                id_gama: form.id_gama ? parseInt(form.id_gama) : null,
                id_marca: form.id_marca ? parseInt(form.id_marca) : null,
                id_modelo: form.id_modelo ? parseInt(form.id_modelo) : null,
                id_procesador: form.id_procesador ? parseInt(form.id_procesador) : null,
                id_tipo_ram: form.id_tipo_ram ? parseInt(form.id_tipo_ram) : null,
                id_ram: form.id_ram ? parseInt(form.id_ram) : null,
                almacenamiento: almcFinal,
            };

            var res = await fetch(API_URL + '/equipos', {
                method: 'POST',
                headers: headersConToken(),
                body: JSON.stringify(payload)
            });
            var data = await res.json();

            if (!res.ok) throw new Error(data.detail || 'Error al crear equipo');

            // Subir foto si hay
            if (foto && data.id_equipo) {
                var formData = new FormData();
                formData.append('foto', foto);
                await fetch(API_URL + '/equipos/' + data.id_equipo + '/foto', {
                    method: 'POST',
                    headers: { 'Authorization': headersAuth().Authorization },
                    body: formData
                });
            }

            setExito(true);
            setMensaje('¡Equipo creado correctamente!');
            // Reset
            setTimeout(function () {
                setForm({
                    serie: '', id_tequipo: '', id_est_equipo: '1',
                    codigoe: '', fech_compra: '', garantia: '1',
                    id_gama: '', id_marca: '', id_modelo: '',
                    id_procesador: '', id_tipo_ram: '', id_ram: '',
                });
                setAlmacenamiento([]);
                setFoto(null);
                setFotoPreview(null);
                setExito(false);
                setMensaje('');
            }, 2000);
        } catch (err) {
            setMensaje(err.message || 'Error al crear equipo');
        } finally {
            setGuardando(false);
        }
    }

    if (!catalogos) return <div className="eq-loading">Cargando catálogos...</div>;

    var estadoNombre = '';
    if (form.id_est_equipo && catalogos.estados_equipo) {
        var est = catalogos.estados_equipo.find(function (e) { return String(e.id) === String(form.id_est_equipo); });
        estadoNombre = est ? est.nombre : '';
    }

    function renderSelect(label, campo, opciones, tablaAdd) {
        return (
            <div className="eq-campo">
                <label>{label}</label>
                <div className="eq-campo-row">
                    <select value={form[campo]} onChange={function (e) { handleChange(campo, e.target.value); }}>
                        <option value="">— Seleccionar —</option>
                        {opciones.map(function (o) { return <option key={o.id} value={o.id}>{o.nombre}</option>; })}
                    </select>
                    {tablaAdd && (
                        <button type="button" className="eq-btn-add" title={'Agregar ' + label}
                            onClick={function () { agregarCatalogo(tablaAdd, campo, label); }}>
                            <IconoFa icono={faPlus} />
                        </button>
                    )}
                    {tablaAdd && (
                        <button type="button" className="eq-btn-edit" title={'Editar ' + label}
                            disabled={!form[campo]}
                            onClick={function () { editarCatalogo(tablaAdd, campo, label, opciones); }}>
                            <IconoFa icono={faPen} />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="eq-crear-container">
            <h2 className="eq-titulo">EQUIPOS</h2>
            <p className="eq-subtitulo">INGRESO DE EQUIPOS</p>

            <form onSubmit={handleSubmit} className="eq-form-grid">
                {/* Columna izquierda: Datos */}
                <div className="eq-col-izq">
                    <div className="eq-campo">
                        <label>CODIGO EQUIP:</label>
                        <input type="text" value={form.codigoe} onChange={function (e) { handleChange('codigoe', e.target.value.toUpperCase()); }} placeholder="Autogenerado o manual" />
                    </div>

                    <div className="eq-campo">
                        <label>SERIE:</label>
                        <input type="text" value={form.serie} onChange={function (e) { handleChange('serie', e.target.value.toUpperCase()); }} placeholder="Nº de serie" required />
                    </div>

                    {renderSelect('TIPO:', 'id_tequipo', catalogos.tipos_equipo, 'tipo_equipo')}

                    <div className="eq-campo">
                        <label>FECHA DE COMPRA:</label>
                        <input type="date" value={form.fech_compra} onChange={function (e) { handleChange('fech_compra', e.target.value); }} />
                    </div>

                    <div className="eq-campo">
                        <label>GARANTIA (años):</label>
                        <select value={form.garantia} onChange={function (e) { handleChange('garantia', e.target.value); }}>
                            <option value="0">NO</option>
                            <option value="1">SI (1 año)</option>
                            <option value="2">2 años</option>
                            <option value="3">3 años</option>
                        </select>
                    </div>

                    {renderSelect('GAMMA:', 'id_gama', catalogos.gamas, 'gama')}
                    {renderSelect('MARCA:', 'id_marca', catalogos.marcas, 'marca')}
                    {renderSelect('MODELO:', 'id_modelo', catalogos.modelos, 'modelo')}
                    {renderSelect('PROCESADOR:', 'id_procesador', catalogos.procesadores, 'procesador')}
                    {renderSelect('TIPO RAM:', 'id_tipo_ram', catalogos.tipos_ram, 'tipo_ram')}
                    {renderSelect('RAM:', 'id_ram', catalogos.rams, 'ram')}
                </div>

                {/* Columna derecha: Estado, Foto y Almacenamiento */}
                <div className="eq-col-der">
                    <div className="eq-estado-header">
                        <span className="eq-estado-label">ESTADO:</span>
                        <span className={'eq-estado-badge estado-' + estadoNombre.toLowerCase()}>
                            {estadoNombre || 'DISPONIBLE'}
                        </span>
                        <select value={form.id_est_equipo} onChange={function (e) { handleChange('id_est_equipo', e.target.value); }} className="eq-estado-select">
                            {catalogos.estados_equipo.map(function (e) { return <option key={e.id} value={e.id}>{e.nombre}</option>; })}
                        </select>
                    </div>

                    {/* Foto */}
                    <div className="eq-foto-area" onClick={function () { fotoInput.current.click(); }}>
                        {fotoPreview ? (
                            <img src={fotoPreview} alt="Foto equipo" className="eq-foto-img" />
                        ) : (
                            <div className="eq-foto-placeholder">
                                <IconoFa icono={faCamera} />
                                <span>Click para agregar foto</span>
                            </div>
                        )}
                        <input ref={fotoInput} type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
                    </div>

                    {/* Tabla Almacenamiento */}
                    <div className="eq-almc-section">
                        <div className="eq-almc-header">
                            <span>ALMACENAMIENTO</span>
                            <button type="button" className="eq-btn-add" onClick={agregarAlmacenamiento} title="Agregar disco">
                                <IconoFa icono={faPlus} />
                            </button>
                        </div>
                        <table className="eq-almc-tabla">
                            <thead>
                                <tr>
                                    <th>DESCRIPCION</th>
                                    <th>TIPO</th>
                                    <th>ALMACENAMIENTO</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {almacenamiento.map(function (fila, idx) {
                                    return (
                                        <tr key={idx}>
                                            <td>
                                                <input type="text" value={fila.descrip}
                                                    onChange={function (e) { actualizarAlmacenamiento(idx, 'descrip', e.target.value); }}
                                                    placeholder="Descripción" />
                                            </td>
                                            <td>
                                                <select value={fila.id_tdisco}
                                                    onChange={function (e) { actualizarAlmacenamiento(idx, 'id_tdisco', e.target.value); }}>
                                                    <option value="">—</option>
                                                    {catalogos.tipos_disco.map(function (t) {
                                                        return <option key={t.id} value={t.id}>{t.nombre}</option>;
                                                    })}
                                                </select>
                                            </td>
                                            <td>
                                                <select value={fila.id_capdisco}
                                                    onChange={function (e) { actualizarAlmacenamiento(idx, 'id_capdisco', e.target.value); }}>
                                                    <option value="">—</option>
                                                    {catalogos.capacidades_disco.map(function (c) {
                                                        return <option key={c.id} value={c.id}>{c.nombre}</option>;
                                                    })}
                                                </select>
                                            </td>
                                            <td>
                                                <button type="button" className="eq-btn-del" onClick={function () { eliminarAlmacenamiento(idx); }}>
                                                    <IconoFa icono={faTrash} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {almacenamiento.length === 0 && (
                                    <tr><td colSpan="4" className="eq-almc-vacio">Sin discos — click + para agregar</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Botón crear */}
                <div className="eq-submit-area">
                    {mensaje && <p className={'eq-mensaje ' + (exito ? 'exito' : 'error')}>{mensaje}</p>}
                    <button type="submit" className="eq-btn-crear" disabled={guardando}>
                        <IconoFa icono={faSave} />
                        {guardando ? ' Guardando...' : ' CREAR EQUIPO'}
                    </button>
                </div>
            </form>
        </div>
    );
}
