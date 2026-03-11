import React, { useState, useEffect, useRef } from 'react';
import { API_URL, headersConToken, headersAuth } from '../auth';
import IconoFa from '../components/IconoFa';
import PageContent from '../components/PageContent';
import { faTicket, faCamera, faPaperPlane, faCheckCircle, faCircle, faSpinner, faStar } from '@fortawesome/free-solid-svg-icons';
import '../styles/IngresarTicket.css';

var PRIORIDADES = [
    { valor: 'BAJA', color: '#22c55e' },
    { valor: 'MEDIA', color: '#f59e0b' },
    { valor: 'ALTA', color: '#f97316' },
    { valor: 'URGENTE', color: '#dc2626' },
];

var ESTADOS_FLUJO = ['ABIERTO', 'ASIGNADO', 'RESUELTO', 'CERRADO'];
var ETIQUETAS_FLUJO = ['SIN ASIGNAR', 'ASIGNADO', 'EN PROGRESO', 'CERRADO'];

// IDs de subcategorías SAP (de la BD)
var SUB_SOCIO = 4;   // CREAR SOCIO DE NEGOCIO
var SUB_ARTICULO = 5; // CREAR ARTICULO
var SUB_SERVICIO = 6; // CREAR SERVICIO

export default function IngresarTicket() {
    var [categorias, setCategorias] = useState([]);
    var [subcategorias, setSubcategorias] = useState([]);
    var [form, setForm] = useState({
        asunto: '',
        id_categoria: '',
        id_subcategoria: '',
        prioridad: 'MEDIA',
        descripcion: '',
    });
    var [foto, setFoto] = useState(null);
    var [fotoPreview, setFotoPreview] = useState(null);
    var [enviando, setEnviando] = useState(false);
    var [mensaje, setMensaje] = useState('');
    var [exito, setExito] = useState(false);
    var [ticketCreado, setTicketCreado] = useState(null);
    var [misTickets, setMisTickets] = useState([]);
    var fotoInput = useRef(null);

    // SAP catalogs
    var [sapCatalogos, setSapCatalogos] = useState(null);
    var [sapForm, setSapForm] = useState({});

    // Valoración
    var [modalValoracion, setModalValoracion] = useState(false);
    var [ticketPendienteVal, setTicketPendienteVal] = useState(null);

    // Obtener id_personal del usuario logueado
    var sessionData = JSON.parse(localStorage.getItem('session'));
    var miIdPersonal = sessionData && sessionData.usuario ? sessionData.usuario.id_personal : null;

    // Cargar catálogos y tickets del usuario
    useEffect(function () {
        fetch(API_URL + '/tickets/categorias', { headers: headersConToken() })
            .then(function (r) { return r.json(); })
            .then(function (data) { setCategorias(data); });

        fetch(API_URL + '/tickets/subcategorias', { headers: headersConToken() })
            .then(function (r) { return r.json(); })
            .then(function (data) { setSubcategorias(data); });

        cargarMisTickets();

        // Polling cada 3s para detectar cambios (valoración, estado, mensajes)
        var intervalo = setInterval(function () {
            cargarMisTickets();
        }, 3000);
        return function () { clearInterval(intervalo); };
    }, []);

    // Detectar si la categoría seleccionada es SAP
    var categoriaSAP = categorias.find(function (c) { return String(c.id) === String(form.id_categoria); });
    var esSAP = categoriaSAP && categoriaSAP.nombre.toUpperCase() === 'SAP';

    // Cargar catálogos SAP cuando se selecciona SAP
    useEffect(function () {
        if (esSAP && !sapCatalogos) {
            fetch(API_URL + '/tickets/sap/catalogos', { headers: headersConToken() })
                .then(function (r) { return r.json(); })
                .then(function (data) { setSapCatalogos(data); });
        }
    }, [esSAP]);

    // Verificar si hay tickets cerrados sin valoración (solo los que YO creé)
    useEffect(function () {
        if (misTickets.length > 0 && miIdPersonal) {
            var pendiente = misTickets.find(function (t) {
                return t.id_personal === miIdPersonal
                    && t.estado === 'CERRADO'
                    && (t.valoracion === null || t.valoracion === undefined);
            });
            if (pendiente) {
                setTicketPendienteVal(pendiente);
                setModalValoracion(true);
            } else {
                setModalValoracion(false);
                setTicketPendienteVal(null);
            }
        }
    }, [misTickets, miIdPersonal]);

    function cargarMisTickets() {
        fetch(API_URL + '/tickets', { headers: headersConToken() })
            .then(function (r) { return r.json(); })
            .then(function (data) { setMisTickets(Array.isArray(data) ? data : []); });
    }

    function handleChange(campo, valor) {
        setForm(function (prev) {
            var nuevo = Object.assign({}, prev, { [campo]: valor });
            if (campo === 'id_categoria') {
                nuevo.id_subcategoria = '';
                setSapForm({});
            }
            if (campo === 'id_subcategoria') {
                setSapForm({});
            }
            return nuevo;
        });
    }

    function handleSapChange(campo, valor) {
        setSapForm(function (prev) { return Object.assign({}, prev, { [campo]: valor }); });
    }

    function handleFoto(e) {
        var archivo = e.target.files[0];
        if (archivo) {
            setFoto(archivo);
            setFotoPreview(URL.createObjectURL(archivo));
        }
    }

    // Subcategorías filtradas por categoría seleccionada
    var subsFiltradas = form.id_categoria
        ? subcategorias.filter(function (s) { return String(s.id_categoria) === String(form.id_categoria); })
        : [];

    // Subfamilias filtradas por familia seleccionada (para SAP artículos)
    var subfsFiltradas = sapCatalogos && sapForm.id_famsap
        ? sapCatalogos.subfamilias.filter(function (sf) { return String(sf.id_familia) === String(sapForm.id_famsap); })
        : [];

    // Determinar tipo SAP por subcategoría
    var subId = parseInt(form.id_subcategoria);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.asunto.trim()) { setMensaje('El asunto es obligatorio'); return; }
        if (!form.id_categoria) { setMensaje('Selecciona una categoría'); return; }

        setEnviando(true);
        setMensaje('');
        try {
            var formData = new FormData();
            formData.append('asunto', form.asunto);
            formData.append('id_categoria', form.id_categoria);
            if (form.id_subcategoria) formData.append('id_subcategoria', form.id_subcategoria);
            formData.append('prioridad', form.prioridad);
            if (form.descripcion) formData.append('descripcion', form.descripcion);
            if (!esSAP && foto) formData.append('foto', foto);

            var resp = await fetch(API_URL + '/tickets', {
                method: 'POST',
                headers: headersAuth(),
                body: formData,
            });
            var data = await resp.json();
            if (!resp.ok) throw new Error(data.detail || 'Error al crear ticket');

            // Si es SAP, guardar datos extra vinculados al ticket
            if (esSAP && form.id_subcategoria) {
                var sapData = Object.assign({}, sapForm);
                if (subId === SUB_ARTICULO) sapData.tipo = 'articulo';
                else if (subId === SUB_SERVICIO) sapData.tipo = 'servicio';
                else if (subId === SUB_SOCIO) sapData.tipo = 'socio';

                if (sapData.tipo) {
                    await fetch(API_URL + '/tickets/' + data.id_ticket + '/sap', {
                        method: 'POST',
                        headers: headersConToken(),
                        body: JSON.stringify(sapData),
                    });
                }
            }

            setExito(true);
            setTicketCreado(data);
            setMensaje('¡Ticket creado exitosamente!');
            setForm({ asunto: '', id_categoria: '', id_subcategoria: '', prioridad: 'MEDIA', descripcion: '' });
            setSapForm({});
            setFoto(null);
            setFotoPreview(null);
            cargarMisTickets();

            setTimeout(function () { setExito(false); setMensaje(''); }, 4000);
        } catch (err) {
            setMensaje(err.message);
        } finally {
            setEnviando(false);
        }
    }

    // Tiempo relativo
    function tiempoRelativo(fechaStr) {
        if (!fechaStr) return '';
        var fecha = new Date(fechaStr);
        var ahora = new Date();
        var diff = Math.floor((ahora - fecha) / 1000);
        if (diff < 60) return 'hace un momento';
        if (diff < 3600) return 'hace ' + Math.floor(diff / 60) + ' min';
        if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + ' h';
        return 'hace ' + Math.floor(diff / 86400) + ' día(s)';
    }

    function colorPrioridad(p) {
        var pr = PRIORIDADES.find(function (x) { return x.valor === p; });
        return pr ? pr.color : '#94a3b8';
    }

    function indiceFlujo(estado) {
        var idx = ESTADOS_FLUJO.indexOf(estado);
        return idx >= 0 ? idx : 0;
    }

    async function enviarValoracion(valor) {
        if (!ticketPendienteVal) return;
        try {
            var resp = await fetch(API_URL + '/tickets/' + ticketPendienteVal.id_ticket + '/valorar?valoracion=' + valor, {
                method: 'PUT', headers: headersConToken(),
            });
            if (!resp.ok) throw new Error('Error al valorar');
            setModalValoracion(false);
            setTicketPendienteVal(null);
            cargarMisTickets();
        } catch (e) { alert(e.message); }
    }

    // ── Render campos SAP dinámicos ──
    function renderCamposSAP() {
        if (!esSAP || !form.id_subcategoria || !sapCatalogos) return null;
        var cats = sapCatalogos;

        // CREAR ARTICULO
        if (subId === SUB_ARTICULO) {
            return (
                <div className="sap-campos-extra">
                    <div className="sap-seccion-titulo">Datos del Artículo SAP</div>
                    <div className="form-fila">
                        <div className="form-grupo">
                            <label>Grupo de artículos *</label>
                            <select value={sapForm.id_grp_art || ''} onChange={function (e) { handleSapChange('id_grp_art', e.target.value); }}>
                                <option value="">Seleccionar grupo</option>
                                {cats.grupos_articulos.map(function (g) { return <option key={g.id} value={g.id}>{g.nombre}</option>; })}
                            </select>
                        </div>
                        <div className="form-grupo">
                            <label>Lista de precios</label>
                            <select value={sapForm.id_lista || 'NINGUNO'} onChange={function (e) { handleSapChange('id_lista', e.target.value); }}>
                                <option value="NINGUNO">NINGUNO</option>
                                <option value="SERIE">SERIE</option>
                                <option value="LOTE">LOTE</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-grupo">
                        <label>Nombre del artículo *</label>
                        <input type="text" value={sapForm.articulo_sap || ''} placeholder="Nombre del artículo SAP"
                            onChange={function (e) { handleSapChange('articulo_sap', e.target.value); }} />
                    </div>
                    <div className="form-fila">
                        <div className="form-grupo">
                            <label>Familia</label>
                            <select value={sapForm.id_famsap || ''} onChange={function (e) { handleSapChange('id_famsap', e.target.value); handleSapChange('id_sbfamsap', ''); }}>
                                <option value="">Seleccionar familia</option>
                                {cats.familias.map(function (f) { return <option key={f.id} value={f.id}>{f.nombre}</option>; })}
                            </select>
                        </div>
                        <div className="form-grupo">
                            <label>Subfamilia</label>
                            <select value={sapForm.id_sbfamsap || ''} onChange={function (e) { handleSapChange('id_sbfamsap', e.target.value); }}
                                disabled={subfsFiltradas.length === 0}>
                                <option value="">Seleccionar subfamilia</option>
                                {subfsFiltradas.map(function (sf) { return <option key={sf.id} value={sf.id}>{sf.nombre}</option>; })}
                            </select>
                        </div>
                    </div>
                    <div className="form-fila">
                        <div className="form-grupo">
                            <label>Marca</label>
                            <select value={sapForm.id_marcasap || ''} onChange={function (e) { handleSapChange('id_marcasap', e.target.value); }}>
                                <option value="">Seleccionar marca</option>
                                {cats.marcas.map(function (m) { return <option key={m.id} value={m.id}>{m.nombre}</option>; })}
                            </select>
                        </div>
                        <div className="form-grupo">
                            <label>O escribir marca</label>
                            <input type="text" value={sapForm.marca_descrip || ''} placeholder="Marca (si no está en lista)"
                                onChange={function (e) { handleSapChange('marca_descrip', e.target.value); }} />
                        </div>
                    </div>
                    <div className="form-fila">
                        <div className="form-grupo">
                            <label>Modelo</label>
                            <select value={sapForm.id_modelosap || ''} onChange={function (e) { handleSapChange('id_modelosap', e.target.value); }}>
                                <option value="">Seleccionar modelo</option>
                                {cats.modelos.map(function (m) { return <option key={m.id} value={m.id}>{m.nombre}</option>; })}
                            </select>
                        </div>
                        <div className="form-grupo">
                            <label>O escribir modelo</label>
                            <input type="text" value={sapForm.modelo_descrip || ''} placeholder="Modelo (si no está en lista)"
                                onChange={function (e) { handleSapChange('modelo_descrip', e.target.value); }} />
                        </div>
                    </div>
                    <div className="form-grupo">
                        <label>Unidad de medida *</label>
                        <select value={sapForm.id_unidad || ''} onChange={function (e) { handleSapChange('id_unidad', e.target.value); }}>
                            <option value="">Seleccionar unidad</option>
                            {cats.tipos_unidad.map(function (u) { return <option key={u.id} value={u.id}>{u.nombre}</option>; })}
                        </select>
                    </div>
                </div>
            );
        }

        // CREAR SERVICIO
        if (subId === SUB_SERVICIO) {
            return (
                <div className="sap-campos-extra">
                    <div className="sap-seccion-titulo">Datos del Servicio SAP</div>
                    <div className="form-grupo">
                        <label>Grupo de artículos *</label>
                        <select value={sapForm.id_grp_art || ''} onChange={function (e) { handleSapChange('id_grp_art', e.target.value); }}>
                            <option value="">Seleccionar grupo</option>
                            {cats.grupos_articulos.map(function (g) { return <option key={g.id} value={g.id}>{g.nombre}</option>; })}
                        </select>
                    </div>
                    <div className="form-grupo">
                        <label>Nombre del servicio *</label>
                        <input type="text" value={sapForm.servicio_sap || ''} placeholder="Nombre del servicio SAP"
                            onChange={function (e) { handleSapChange('servicio_sap', e.target.value); }} />
                    </div>
                    <div className="form-grupo">
                        <label>Unidad de medida *</label>
                        <select value={sapForm.id_unidad || ''} onChange={function (e) { handleSapChange('id_unidad', e.target.value); }}>
                            <option value="">Seleccionar unidad</option>
                            {cats.tipos_unidad.map(function (u) { return <option key={u.id} value={u.id}>{u.nombre}</option>; })}
                        </select>
                    </div>
                </div>
            );
        }

        // CREAR SOCIO DE NEGOCIO
        if (subId === SUB_SOCIO) {
            return (
                <div className="sap-campos-extra">
                    <div className="sap-seccion-titulo">Datos del Socio de Negocio</div>
                    <div className="form-grupo">
                        <label>Tipo de socio *</label>
                        <select value={sapForm.id_tsocio || ''} onChange={function (e) { handleSapChange('id_tsocio', e.target.value); }}>
                            <option value="">Seleccionar tipo</option>
                            {cats.tipos_socio.map(function (ts) { return <option key={ts.id} value={ts.id}>{ts.nombre}</option>; })}
                        </select>
                    </div>
                    <div className="form-grupo">
                        <label>Razón social *</label>
                        <input type="text" value={sapForm.razon_social || ''} placeholder="Nombre o razón social"
                            onChange={function (e) { handleSapChange('razon_social', e.target.value); }} />
                    </div>
                    <div className="form-grupo">
                        <label>RUC</label>
                        <input type="text" value={sapForm.ruc || ''} placeholder="Número de RUC"
                            onChange={function (e) { handleSapChange('ruc', e.target.value); }} />
                    </div>
                    <div className="form-grupo">
                        <label>Dirección</label>
                        <input type="text" value={sapForm.direccion || ''} placeholder="Dirección del socio"
                            onChange={function (e) { handleSapChange('direccion', e.target.value); }} />
                    </div>
                </div>
            );
        }

        return null;
    }

    return (
        <PageContent>
            <div className="ingresar-ticket-page">
                {/* ── Cabecera ── */}
                <div className="ticket-header">
                    <IconoFa icono={faTicket} clase="ticket-header-icon" />
                    <h2>Ingresar Ticket</h2>
                </div>

                <div className="ticket-layout">
                    {/* ── Mis Tickets recientes (arriba) ── */}
                    <div className="mis-tickets-panel">
                        <h3>Tickets</h3>
                        {misTickets.filter(function (t) { return t.estado !== 'ABIERTO' && t.estado !== 'CERRADO'; }).length === 0 && <p className="sin-tickets">No tienes tickets en atención</p>}
                        <div className="tickets-lista">
                            {misTickets.filter(function (t) { return t.estado !== 'ABIERTO' && t.estado !== 'CERRADO'; }).slice(0, 8).map(function (tk) {
                                var paso = indiceFlujo(tk.estado);
                                return (
                                    <div key={tk.id_ticket} className="ticket-card-mini" style={{ borderLeftColor: colorPrioridad(tk.prioridad) }}>
                                        <div className="ticket-card-top">
                                            <span className="ticket-codigo">TICKET: <b>#{tk.id_ticket}</b></span>
                                            <span className="ticket-card-asunto">{tk.asunto}</span>
                                        </div>

                                        {/* Progress stepper */}
                                        <div className="stepper-mini">
                                            {ETIQUETAS_FLUJO.map(function (et, i) {
                                                var completado = i <= paso;
                                                return (
                                                    <div key={et} className={'step-mini' + (completado ? ' activo' : '')}>
                                                        <div className="step-dot"></div>
                                                        {i < ETIQUETAS_FLUJO.length - 1 && <div className="step-line"></div>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="stepper-labels">
                                            {ETIQUETAS_FLUJO.map(function (et, i) {
                                                return <span key={et} className={'step-label' + (i <= paso ? ' activo' : '')}>{et}</span>;
                                            })}
                                        </div>

                                        {tk.mensaje_ti && (
                                            <div className="ticket-card-mensaje">
                                                <span className="ticket-msg-label">Respuesta TI:</span>
                                                <p className="ticket-msg-text">{tk.mensaje_ti}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Formulario (abajo) ── */}
                    <form className="ticket-form" onSubmit={handleSubmit}>
                        <div className="form-grupo">
                            <label>Asunto *</label>
                            <input type="text" value={form.asunto} placeholder="Describe brevemente el problema"
                                onChange={function (e) { handleChange('asunto', e.target.value); }} />
                        </div>

                        <div className="form-fila">
                            <div className="form-grupo">
                                <label>Solicitud *</label>
                                <select value={form.id_categoria} onChange={function (e) { handleChange('id_categoria', e.target.value); handleChange('id_subcategoria', ''); }}>
                                    <option value="">Seleccionar categoría</option>
                                    {categorias.map(function (c) {
                                        return <option key={c.id} value={c.id}>{c.nombre}</option>;
                                    })}
                                </select>
                            </div>

                            <div className="form-grupo">
                                <label>Tipo de Incidencia</label>
                                <select value={form.id_subcategoria} onChange={function (e) { handleChange('id_subcategoria', e.target.value); }}
                                    disabled={subsFiltradas.length === 0}>
                                    <option value="">Seleccionar subcategoría</option>
                                    {subsFiltradas.map(function (s) {
                                        return <option key={s.id} value={s.id}>{s.nombre}</option>;
                                    })}
                                </select>
                            </div>
                        </div>

                        {/* Campos SAP dinámicos */}
                        {renderCamposSAP()}

                        <div className="form-grupo">
                            <label>Prioridad</label>
                            <div className="prioridad-selector">
                                {PRIORIDADES.map(function (p) {
                                    return (
                                        <button type="button" key={p.valor}
                                            className={'prioridad-badge' + (form.prioridad === p.valor ? ' seleccionado' : '')}
                                            style={{ '--badge-color': p.color }}
                                            onClick={function () { handleChange('prioridad', p.valor); }}>
                                            {p.valor}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="form-grupo">
                            <label>Descripción</label>
                            <textarea rows="4" value={form.descripcion} placeholder="Describe el problema con detalle..."
                                onChange={function (e) { handleChange('descripcion', e.target.value); }} />
                        </div>

                        {/* Adjuntar imagen — oculto cuando es SAP */}
                        {!esSAP && (
                        <div className="form-grupo">
                            <label>Adjuntar imagen</label>
                            <div className="foto-upload" onClick={function () { fotoInput.current.click(); }}>
                                {fotoPreview
                                    ? <img src={fotoPreview} alt="preview" className="foto-preview" />
                                    : <div className="foto-placeholder"><IconoFa icono={faCamera} /><span>Click para subir imagen</span></div>
                                }
                            </div>
                            <input ref={fotoInput} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFoto} />
                        </div>
                        )}

                        {mensaje && (
                            <div className={'ticket-mensaje' + (exito ? ' exito' : ' error')}>
                                {exito && <IconoFa icono={faCheckCircle} />} {mensaje}
                            </div>
                        )}

                        <button type="submit" className="btn-crear-ticket" disabled={enviando}>
                            <IconoFa icono={enviando ? faSpinner : faPaperPlane} clase={enviando ? 'spin' : ''} />
                            {enviando ? 'Enviando...' : 'CREAR TICKET'}
                        </button>
                    </form>

                </div>

                {/* Modal de valoración — persiste hasta que el creador valore */}
                {modalValoracion && ticketPendienteVal && (
                    <div className="valoracion-overlay">
                        <div className="valoracion-modal">
                            <div className="valoracion-icono">⭐</div>
                            <h3 className="valoracion-titulo">Valora la atención</h3>
                            <p className="valoracion-desc">Ticket #{ticketPendienteVal.id_ticket}: {ticketPendienteVal.asunto}</p>
                            {ticketPendienteVal.mensaje_ti && (
                                <div className="valoracion-mensaje-ti">
                                    <span className="valoracion-msg-label">Mensaje del técnico:</span>
                                    <p className="valoracion-msg-texto">{ticketPendienteVal.mensaje_ti}</p>
                                </div>
                            )}
                            <p className="valoracion-desc">¿Cómo fue la velocidad de atención?</p>
                            <div className="valoracion-opciones">
                                <button className="valoracion-btn val-lento" onClick={function () { enviarValoracion(1); }}>
                                    <span className="val-estrellas"><IconoFa icono={faStar} /></span>
                                    <span className="val-texto">LENTO</span>
                                </button>
                                <button className="valoracion-btn val-normal" onClick={function () { enviarValoracion(2); }}>
                                    <span className="val-estrellas"><IconoFa icono={faStar} /> <IconoFa icono={faStar} /></span>
                                    <span className="val-texto">NORMAL</span>
                                </button>
                                <button className="valoracion-btn val-rapido" onClick={function () { enviarValoracion(3); }}>
                                    <span className="val-estrellas"><IconoFa icono={faStar} /> <IconoFa icono={faStar} /> <IconoFa icono={faStar} /></span>
                                    <span className="val-texto">RÁPIDO</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageContent>
    );
}
