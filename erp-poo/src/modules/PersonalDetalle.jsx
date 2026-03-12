import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { faPerson, faPersonDress, faPen, faFloppyDisk, faXmark, faBan, faArrowLeft, faCheck, faPlus, faTrash, faCamera, faCalendarCheck, faCalendarDays, faExclamationTriangle, faClock, faFileContract, faFileLines, faFileSignature, faHandshake, faFileInvoiceDollar, faFolder, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import IconoFa from '../components/IconoFa';
import AsistenciaTab from '../components/AsistenciaTab';
import DocumentosTab from '../components/DocumentosTab';
import { obtenerToken, headersConToken, headersAuth, API_URL } from '../auth';
import '../styles/PersonalDetalle.css';

// Página de detalle de un empleado
// Tabs: INFORMACIÓN | CONTRATOS | SEGUROS Y APORTACIONES | CUENTAS BANCARIAS | DOCUMENTOS | VACACIONES | ASISTENCIA
// Tab Información = tarjeta con foto + TODOS los campos de la BD
// Cargo se filtra dinámicamente según el departamento seleccionado
export default function PersonalDetalle() {
  var { id } = useParams();
  var navigate = useNavigate();
  var esNuevo = (id === 'nuevo');

  var [empleado, setEmpleado] = useState(null);
  var [editando, setEditando] = useState(esNuevo);
  var [tabActiva, setTabActiva] = useState('informacion');
  var [areas, setAreas] = useState([]);
  var [cargos, setCargos] = useState([]);
  var [departamentos, setDepartamentos] = useState([]);
  var [tiposContrato, setTiposContrato] = useState([]);
  var [modalidad, setModalidad] = useState([]);
  var [estadosCiviles, setEstadosCiviles] = useState([]);
  var [grados, setGrados] = useState([]);
  var [distritos, setDistritos] = useState([]);
  var [tiposDocumento, setTiposDocumento] = useState([]);
  var [tiposFamiliar, setTiposFamiliar] = useState([]);
  var [afps, setAfps] = useState([]);
  var [bancos, setBancos] = useState([]);
  var [monedas, setMonedas] = useState([]);
  var [tiposCuenta, setTiposCuenta] = useState([]);
  var [cargando, setCargando] = useState(true);
  var [contactos, setContactos] = useState([]);
  var [seguros, setSeguros] = useState(null);
  var [editandoSeguros, setEditandoSeguros] = useState(false);
  var [datosSeguros, setDatosSeguros] = useState({ id_afp: '', cod_afp: '', comision_afp: 0, aportacion: 0 });
  var [cuentas, setCuentas] = useState([]);
  var [editandoCuentas, setEditandoCuentas] = useState(false);
  var cargosAbortRef = useRef(null);
  var fotoInputRef = useRef(null);

  // Estado para tab ASISTENCIA
  var [asistenciaData, setAsistenciaData] = useState(null);
  var [asistCargando, setAsistCargando] = useState(false);
  var [asistFiltro, setAsistFiltro] = useState({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear()
  });
  var [categoriasAsist, setCategoriasAsist] = useState([]);
  var [justificando, setJustificando] = useState(null);
  var [datosJustif, setDatosJustif] = useState({ id_catga: '', obsv: '', hora_e: '', hora_s: '' });

  // Datos temporales del formulario — TODOS los campos de la BD
  var [datos, setDatos] = useState({
    nombres: '', ape_paterno: '', ape_materno: '', genero: 'M',
    id_doc: 1, num_doc: '', fech_nac: '', email: '', celular: '',
    direccion: '', id_area: '', id_cargo: '', id_depart: '',
    id_tipocontr: '1', id_modalidad: '', sueldo: '', asig_fam: 0,
    fech_ingr: '', fech_cese: '',
    id_estcivil: '', id_acadm: '', id_distr: '',
  });

  // Cargar catálogos + empleado (Promise.all para llamadas independientes)
  useEffect(function () {
    var abortCtrl = new AbortController();
    var signal = abortCtrl.signal;
    var h = headersAuth();

    // Catálogos independientes — se cargan en paralelo
    Promise.all([
      fetch(API_URL + '/areas', { headers: h, signal: signal }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/departamentos', { headers: h, signal: signal }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/cargos', { headers: h, signal: signal }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/tipos-contrato', { headers: h, signal: signal }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/modalidad', { headers: h, signal: signal }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/estados-civiles', { headers: h, signal: signal }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/grados', { headers: h, signal: signal }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/distritos', { headers: h, signal: signal }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/tipos-documento', { headers: h, signal: signal }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/tipos-familiar', { headers: h, signal: signal }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/afps', { headers: h, signal: signal }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/bancos', { headers: h, signal: signal }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/monedas', { headers: h, signal: signal }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/tipos-cuenta', { headers: h, signal: signal }).then(function (r) { return r.json(); }),
    ]).then(function (res) {
      if (signal.aborted) return;
      setAreas(res[0]);
      setDepartamentos(res[1]);
      setCargos(res[2]);
      setTiposContrato(res[3]);
      setModalidad(res[4]);
      setEstadosCiviles(res[5]);
      setGrados(res[6]);
      setDistritos(res[7]);
      setTiposDocumento(res[8]);
      setTiposFamiliar(res[9]);
      setAfps(res[10]);
      setBancos(res[11]);
      setMonedas(res[12]);
      setTiposCuenta(res[13]);
    }).catch(function () {});

    if (esNuevo) { setCargando(false); return function () { abortCtrl.abort(); }; }

    // Datos del empleado + seguros + cuentas — independientes entre sí, paralelo
    Promise.all([
      fetch(API_URL + '/personal', { headers: h, signal: signal }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/personal/' + id + '/seguros-aportaciones', { headers: h, signal: signal }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/personal/' + id + '/cuentas-bancarias', { headers: h, signal: signal }).then(function (r) { return r.json(); }),
    ]).then(function (res) {
      if (signal.aborted) return;
      var data = res[0];
      var encontrado = data.find(function (p) { return p.id === Number(id); });
      if (encontrado) { setEmpleado(encontrado); }
      else { alert('Empleado no encontrado'); navigate('/dashboard/personal'); }
      setSeguros(res[1]);
      setCuentas(res[2] || []);
      setCargando(false);
    }).catch(function (err) {
      if (!signal.aborted) { alert('Error al cargar datos'); navigate('/dashboard/personal'); }
    });

    return function () { abortCtrl.abort(); };
  }, [id]);

  // Cuando cambia el departamento en el formulario, filtrar cargos
  function cargarCargosPorDepart(idDepart) {
    // Abortar la petición anterior si existe
    if (cargosAbortRef.current) cargosAbortRef.current.abort();
    var ctrl = new AbortController();
    cargosAbortRef.current = ctrl;

    var url = idDepart
      ? API_URL + '/cargos?id_depart=' + idDepart
      : API_URL + '/cargos';

    fetch(url, { headers: headersAuth(), signal: ctrl.signal })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (!ctrl.signal.aborted) setCargos(d); })
      .catch(function () {});
  }

  function claseEstado(estado) {
    if (estado === 'ACTIVO') return 'estado-activo';
    return 'estado-inactivo';
  }

  function cambiarCampo(campo, valor) {
    var copia = Object.assign({}, datos);
    copia[campo] = valor;
    // Si cambia departamento, limpiar cargo y recargar la lista
    if (campo === 'id_depart') {
      copia.id_cargo = '';
      cargarCargosPorDepart(valor);
    }
    setDatos(copia);
  }

  // Botón EDITAR: cargar TODOS los datos al formulario
  function iniciarEdicion() {
    var depId = empleado.id_depart || '';
    setDatos({
      nombres: empleado.nombres, ape_paterno: empleado.ape_paterno,
      ape_materno: empleado.ape_materno, genero: empleado.genero,
      id_doc: empleado.id_doc || 1, num_doc: empleado.num_doc,
      fech_nac: empleado.fech_nac || '',
      email: empleado.email || '', celular: empleado.celular || '',
      direccion: empleado.direccion || '',
      id_area: empleado.id_area || '', id_cargo: empleado.id_cargo || '',
      id_depart: depId,
      id_tipocontr: empleado.id_tipocontr || '1',
      id_modalidad: empleado.id_modalidad || '',
      sueldo: empleado.sueldo || '', asig_fam: empleado.asig_fam || 0,
      fech_ingr: empleado.fech_ingreso || '', fech_cese: empleado.fech_cese || '',
      id_estcivil: empleado.id_estcivil || '', id_acadm: empleado.id_acadm || '',
      id_distr: empleado.id_distr || '',
    });
    // Cargar contactos al estado editable
    var ctsList = empleado.contactos ? empleado.contactos.map(function (c) {
      return { nombre: c.nombre, celular: c.celular, id_tipfam: c.id_tipfam || '' };
    }) : [];
    setContactos(ctsList);
    if (depId) cargarCargosPorDepart(depId);
    setEditando(true);
  }

  function cancelarEdicion() {
    if (esNuevo) { navigate('/dashboard/personal'); }
    else { setEditando(false); }
  }

  // Botón GUARDAR — envía TODOS los campos al backend + contactos
  function guardarDatos() {
    var token = obtenerToken();
    if (!token) { alert('Tu sesión ha expirado.'); navigate('/'); return; }

    var idActual = id; // Capturar id actual para evitar stale closure
    var url = esNuevo ? API_URL + '/personal' : API_URL + '/personal/' + idActual;
    var metodo = esNuevo ? 'POST' : 'PUT';

    var datosLimpios = Object.assign({}, datos);
    datosLimpios.id_doc = Number(datosLimpios.id_doc) || 1;
    datosLimpios.id_area = Number(datosLimpios.id_area) || 1;
    datosLimpios.id_cargo = Number(datosLimpios.id_cargo) || 1;
    datosLimpios.id_tipocontr = Number(datosLimpios.id_tipocontr) || 1;
    datosLimpios.id_modalidad = datosLimpios.id_modalidad ? Number(datosLimpios.id_modalidad) : null;
    datosLimpios.asig_fam = Number(datosLimpios.asig_fam) || 0;
    datosLimpios.id_estcivil = datosLimpios.id_estcivil ? Number(datosLimpios.id_estcivil) : null;
    datosLimpios.id_acadm = datosLimpios.id_acadm ? Number(datosLimpios.id_acadm) : null;
    datosLimpios.id_distr = datosLimpios.id_distr ? Number(datosLimpios.id_distr) : null;
    if (!datosLimpios.fech_nac) datosLimpios.fech_nac = null;
    if (!datosLimpios.email) datosLimpios.email = null;
    if (!datosLimpios.celular) datosLimpios.celular = null;
    if (!datosLimpios.direccion) datosLimpios.direccion = null;
    if (!datosLimpios.sueldo) datosLimpios.sueldo = null;
    if (!datosLimpios.fech_ingr) datosLimpios.fech_ingr = null;
    if (!datosLimpios.fech_cese) datosLimpios.fech_cese = null;
    // No enviar id_depart (no es campo del contrato, viene del cargo)
    delete datosLimpios.id_depart;

    var camposFaltantes = [];
    if (!datosLimpios.nombres || !datosLimpios.nombres.trim()) camposFaltantes.push('Nombres');
    if (!datosLimpios.ape_paterno || !datosLimpios.ape_paterno.trim()) camposFaltantes.push('Apellido Paterno');
    if (!datosLimpios.ape_materno || !datosLimpios.ape_materno.trim()) camposFaltantes.push('Apellido Materno');
    if (!datosLimpios.num_doc || !datosLimpios.num_doc.trim()) camposFaltantes.push('N° Documento');
    if (!datosLimpios.id_area) camposFaltantes.push('Área');
    if (!datosLimpios.id_cargo) camposFaltantes.push('Cargo');
    if (camposFaltantes.length > 0) {
      alert('Campos obligatorios faltantes:\n\n• ' + camposFaltantes.join('\n• '));
      return;
    }

    fetch(url, { method: metodo, headers: headersConToken(), body: JSON.stringify(datosLimpios) })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (err) {
            var detalle = err.detail;
            if (typeof detalle === 'object') detalle = JSON.stringify(detalle);
            throw new Error(detalle || err.mensaje || 'Error (' + res.status + ')');
          });
        }
        return res.json();
      })
      .then(function (resp) {
        var personalId = esNuevo ? resp.id : Number(idActual);
        // Guardar contactos de emergencia
        return fetch(API_URL + '/personal/' + personalId + '/contactos', {
          method: 'PUT', headers: headersConToken(),
          body: JSON.stringify({ contactos: contactos.map(function (c) {
            return { nombre: c.nombre, celular: c.celular, id_tipfam: c.id_tipfam ? Number(c.id_tipfam) : null };
          }) })
        }).then(function () { return resp; });
      })
      .then(function (resp) {
        alert(resp.mensaje || 'Operación exitosa');
        if (esNuevo && resp.id) { navigate('/dashboard/personal/' + resp.id); }
        else {
          fetch(API_URL + '/personal', { headers: headersAuth() })
            .then(function (r) { return r.json(); })
            .then(function (data) {
              var act = data.find(function (p) { return p.id === Number(idActual); });
              setEmpleado(act); setEditando(false);
            });
        }
      })
      .catch(function (error) {
        if (error.message === 'Failed to fetch') alert('No se pudo conectar con el servidor.');
        else alert('Error al guardar: ' + error.message);
      });
  }

  function desactivarEmpleado() {
    var idActual = id; // Capturar para evitar stale closure
    var accion = empleado.estado === 'ACTIVO' ? 'desactivar' : 'reactivar';
    if (!confirm('¿Seguro que deseas ' + accion + ' a ' + empleado.nombres + '?')) return;
    fetch(API_URL + '/personal/' + idActual + '/desactivar', { method: 'PUT', headers: headersAuth() })
      .then(function (res) { return res.json(); })
      .then(function (resp) {
        alert(resp.mensaje);
        fetch(API_URL + '/personal', { headers: headersAuth() })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            var act = data.find(function (p) { return p.id === Number(idActual); });
            setEmpleado(act);
          });
      })
      .catch(function () { alert('Error al desactivar'); });
  }

  // Subir foto de perfil
  function subirFoto(e) {
    var archivo = e.target.files[0];
    if (!archivo) return;
    var permitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (permitidos.indexOf(archivo.type) === -1) {
      alert('Solo se permiten imágenes JPG, PNG o WEBP'); return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar 5 MB'); return;
    }
    var formData = new FormData();
    formData.append('archivo', archivo);
    var token = obtenerToken();
    fetch(API_URL + '/personal/' + id + '/foto', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    })
      .then(function (res) {
        if (!res.ok) return res.json().then(function (err) { throw new Error(err.detail || 'Error'); });
        return res.json();
      })
      .then(function (resp) {
        setEmpleado(Object.assign({}, empleado, { foto: resp.foto }));
        // Actualizar foto en localStorage para que el Header la use sin re-login
        try {
          var session = JSON.parse(localStorage.getItem('session'));
          if (session && session.usuario && String(session.usuario.id_personal) === String(id)) {
            session.usuario.foto = resp.foto;
            localStorage.setItem('session', JSON.stringify(session));
            window.dispatchEvent(new Event('session-updated'));
          }
        } catch (e) {}
      })
      .catch(function (err) { alert('Error al subir foto: ' + err.message); });
    e.target.value = '';
  }

  var generoActual = editando ? datos.genero : (empleado ? empleado.genero : 'M');
  var tabs = [
    { id: 'informacion', nombre: 'INFORMACIÓN' },
    { id: 'seguros', nombre: 'SEGUROS Y APORTACIONES' },
    { id: 'cuentas', nombre: 'CUENTAS BANCARIAS' },
    { id: 'documentos', nombre: 'DOCUMENTOS' },
    { id: 'vacaciones', nombre: 'VACACIONES' },
    { id: 'asistencia', nombre: 'ASISTENCIA' },
  ];

  if (cargando) return <div className="detalle-cargando">Cargando...</div>;

  return (
    <div className="detalle-pagina">
      <button className="detalle-volver" onClick={function () { navigate('/dashboard/personal'); }}>
        <IconoFa icono={faArrowLeft} /> Volver a Personal
      </button>

      {!esNuevo && empleado && (
        <div className="detalle-tabs">
          {tabs.map(function (tab) {
            return (
              <button key={tab.id} className={'det-tab ' + (tabActiva === tab.id ? 'activa' : '')}
                onClick={function () { setTabActiva(tab.id); }}>
                {tab.nombre}
              </button>
            );
          })}
        </div>
      )}

      {/* ===== TAB INFORMACIÓN ===== */}
      {(tabActiva === 'informacion' || esNuevo) && (
        <div className="detalle-tarjeta">

          {/* Cabecera: botones + área + género */}
          <div className="detalle-cabecera">
            <div className="detalle-botones">
              {!editando ? (
                <>
                  <button className="det-btn det-btn-editar" onClick={iniciarEdicion}>
                    <IconoFa icono={faPen} /> Editar
                  </button>
                  {empleado && empleado.estado === 'ACTIVO' ? (
                    <button className="det-btn det-btn-desactivar" onClick={desactivarEmpleado}>
                      <IconoFa icono={faBan} /> Desactivar
                    </button>
                  ) : (
                    <button className="det-btn det-btn-reactivar" onClick={desactivarEmpleado}>
                      <IconoFa icono={faCheck} /> Reactivar
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button className="det-btn det-btn-guardar" onClick={guardarDatos}>
                    <IconoFa icono={faFloppyDisk} /> Guardar
                  </button>
                  <button className="det-btn det-btn-cancelar" onClick={cancelarEdicion}>
                    <IconoFa icono={faXmark} /> Cancelar
                  </button>
                </>
              )}
            </div>

            <div className="detalle-area-campo">
              <label className="det-label det-label-area">Área</label>
              {!editando ? (
                <span className="detalle-area-texto">{empleado ? (empleado.area || 'Sin área') : ''}</span>
              ) : (
                <select className="det-select" value={datos.id_area}
                  onChange={function (e) { cambiarCampo('id_area', Number(e.target.value)); }}>
                  <option value="">-- Área --</option>
                  {areas.map(function (a) { return <option key={a.id} value={a.id}>{a.nombre}</option>; })}
                </select>
              )}
            </div>

            <div className="detalle-genero">
              <IconoFa icono={generoActual === 'M' ? faPerson : faPersonDress} tamaño="lg"
                clase={generoActual === 'M' ? 'genero-hombre' : 'genero-mujer'} />
            </div>

            {!esNuevo && empleado && empleado.horario_nombre && (
              <div className="detalle-horario-badge">
                <IconoFa icono={faClock} /> {empleado.horario_nombre}{empleado.horario_rango ? ' · ' + empleado.horario_rango : ''}
              </div>
            )}
          </div>

          {/* Cuerpo: foto izq + campos der */}
          <div className="detalle-cuerpo">
            <div className="detalle-col-foto">
              <div className="detalle-foto-wrapper">
                <div className={'detalle-foto ' + (empleado ? claseEstado(empleado.estado) : '')}>
                  {empleado && empleado.foto ? (
                    <img src={'/assets/perfiles/' + empleado.foto} alt={empleado.nombres} />
                  ) : (
                    <div className="detalle-foto-vacia">
                      {esNuevo ? '?' : (empleado ? empleado.nombres.charAt(0) + empleado.ape_paterno.charAt(0) : '')}
                    </div>
                  )}
                </div>
                {!esNuevo && (
                  <button className="detalle-foto-subir" onClick={function () { fotoInputRef.current.click(); }}
                    title="Cambiar foto">
                    <IconoFa icono={faCamera} />
                  </button>
                )}
                <input ref={fotoInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                  className="seccion-input-oculto" onChange={subirFoto} />
              </div>
              {empleado && (
                <span className={'detalle-estado-badge ' + claseEstado(empleado.estado)}>
                  {empleado.estado || 'Sin estado'}
                </span>
              )}
            </div>

            <div className="detalle-col-campos">

              {/* ====== MODO VER — TODOS LOS CAMPOS ====== */}
              {!editando && empleado && (
                <>
                  {/* Nombre + Apellidos */}
                  <div className="det-fila">
                    <div className="det-campo">
                      <label className="det-label">Nombre</label>
                      <span className="det-valor">{empleado.nombres}</span>
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Apellidos</label>
                      <span className="det-valor">{empleado.ape_paterno + ' ' + empleado.ape_materno}</span>
                    </div>
                  </div>

                  {/* DNI + Fecha Nac + Celular */}
                  <div className="det-fila det-fila-3">
                    <div className="det-campo">
                      <label className="det-label">Tipo Doc.</label>
                      <span className="det-valor">{empleado.tipo_doc || '—'}</span>
                    </div>
                    <div className="det-campo">
                      <label className="det-label">N° Documento</label>
                      <span className="det-valor">{empleado.num_doc}</span>
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Fecha Nac.</label>
                      <span className="det-valor">{empleado.fech_nac || '—'}</span>
                    </div>
                  </div>

                  {/* Celular */}
                  <div className="det-fila">
                    <div className="det-campo">
                      <label className="det-label">Celular</label>
                      <span className="det-valor">{empleado.celular || '—'}</span>
                    </div>
                  </div>

                  {/* Correo */}
                  <div className="det-fila">
                    <div className="det-campo det-campo-full">
                      <label className="det-label">Correo Pers.</label>
                      <span className="det-valor">{empleado.email || '—'}</span>
                    </div>
                  </div>

                  {/* Estado Civil + Grado Académico */}
                  <div className="det-fila">
                    <div className="det-campo">
                      <label className="det-label">Estado Civil</label>
                      <span className="det-valor">{empleado.estado_civil || '—'}</span>
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Grado Académico</label>
                      <span className="det-valor">{empleado.grado_academico || '—'}</span>
                    </div>
                  </div>

                  {/* Departamento + Cargo */}
                  <div className="det-fila">
                    <div className="det-campo">
                      <label className="det-label">Departamento</label>
                      <span className="det-valor">{empleado.departamento || '—'}</span>
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Cargo</label>
                      <span className="det-valor">{empleado.cargo || '—'}</span>
                    </div>
                  </div>

                  {/* Tipo Contrato + Sueldo + Asig. Familiar */}
                  <div className="det-fila det-fila-3">
                    <div className="det-campo">
                      <label className="det-label">Tipo Contrato</label>
                      <span className="det-valor">{empleado.tipo_contrato || '—'}</span>
                    </div>
                    <div className='det-campo'>
                      <label className="det-label">Modalidad</label>
                      <span className="det-valor">{empleado.modalidad || '—'}</span>
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Sueldo</label>
                      <span className="det-valor">{empleado.sueldo || '—'}</span>
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Asig. Familiar</label>
                      <span className="det-valor">{empleado.asig_fam ? 'Sí' : 'No'}</span>
                    </div>
                  </div>

                  {/* F. Ingreso + F. Cese */}
                  <div className="det-fila">
                    <div className="det-campo">
                      <label className="det-label">Fech. Ingreso</label>
                      <span className="det-valor">{empleado.fech_ingreso || '—'}</span>
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Cese / Fin de Contrato</label>
                      <span className="det-valor">{empleado.fech_cese || '—'}</span>
                    </div>
                  </div>

                  {/* Distrito + Dirección */}
                  <div className="det-fila">
                    <div className="det-campo">
                      <label className="det-label">Distrito</label>
                      <span className="det-valor">{empleado.distrito || '—'}</span>
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Dirección</label>
                      <span className="det-valor">{empleado.direccion || '—'}</span>
                    </div>
                  </div>

                  {/* Contactos de emergencia */}
                  <div className="det-contactos">
                    <label className="det-label">Contactos de Emergencia</label>
                    {empleado.contactos && empleado.contactos.length > 0 ? (
                      <ul className="det-contactos-lista">
                        {empleado.contactos.map(function (c, i) {
                          return <li key={i}><strong>{c.tipo_familiar || 'OTRO'}</strong> — {c.nombre} — {c.celular}</li>;
                        })}
                      </ul>
                    ) : (
                      <p className="det-sin-datos">Sin contactos registrados</p>
                    )}
                  </div>
                </>
              )}

              {/* ====== MODO EDITAR / CREAR — TODOS LOS CAMPOS ====== */}
              {editando && (
                <>
                  {/* Género + Tipo Contrato + Modalidad */}
                  <div className="det-fila det-fila-3">
                    <div className="det-campo">
                      <label className="det-label">Género</label>
                      <select className="det-select" value={datos.genero}
                        onChange={function (e) { cambiarCampo('genero', e.target.value); }}>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                      </select>
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Tipo Contrato</label>
                      <select className="det-select" value={datos.id_tipocontr}
                        onChange={function (e) { cambiarCampo('id_tipocontr', e.target.value); }}>
                        <option value="">-- Seleccionar --</option>
                        {tiposContrato.map(function (t) {
                          return <option key={t.id} value={t.id}>{t.nombre}</option>;
                        })}
                      </select>
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Modalidad</label>
                      <select className="det-select" value={datos.id_modalidad}
                        onChange={function (e) { cambiarCampo('id_modalidad', e.target.value); }}>
                        <option value="">-- Seleccionar --</option>
                        {modalidad.map(function (m) {
                          return <option key={m.id} value={m.id}>{m.nombre}</option>;
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Nombres + Apellido Paterno */}
                  <div className="det-fila">
                    <div className="det-campo">
                      <label className="det-label">Nombres</label>
                      <input className="det-input" value={datos.nombres}
                        onChange={function (e) { cambiarCampo('nombres', e.target.value); }} />
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Apellido Paterno</label>
                      <input className="det-input" value={datos.ape_paterno}
                        onChange={function (e) { cambiarCampo('ape_paterno', e.target.value); }} />
                    </div>
                  </div>

                  {/* Apellido Materno */}
                  <div className="det-fila">
                    <div className="det-campo">
                      <label className="det-label">Apellido Materno</label>
                      <input className="det-input" value={datos.ape_materno}
                        onChange={function (e) { cambiarCampo('ape_materno', e.target.value); }} />
                    </div>
                  </div>

                  {/* Tipo Doc + N° Documento */}
                  <div className="det-fila">
                    <div className="det-campo">
                      <label className="det-label">Tipo Doc.</label>
                      <select className="det-select" value={datos.id_doc}
                        onChange={function (e) { cambiarCampo('id_doc', Number(e.target.value)); }}>
                        {tiposDocumento.map(function (td) {
                          return <option key={td.id} value={td.id}>{td.codigo}</option>;
                        })}
                      </select>
                    </div>
                    <div className="det-campo">
                      <label className="det-label">N° Documento</label>
                      <input className="det-input" value={datos.num_doc}
                        onChange={function (e) { cambiarCampo('num_doc', e.target.value); }} />
                    </div>
                  </div>

                  {/* Fecha Nac + Celular */}
                  <div className="det-fila">
                    <div className="det-campo">
                      <label className="det-label">Fecha Nac.</label>
                      <input className="det-input" type="date" value={datos.fech_nac}
                        onChange={function (e) { cambiarCampo('fech_nac', e.target.value); }} />
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Celular</label>
                      <input className="det-input" value={datos.celular}
                        onChange={function (e) { cambiarCampo('celular', e.target.value); }} />
                    </div>
                  </div>

                  {/* Correo */}
                  <div className="det-fila">
                    <div className="det-campo det-campo-full">
                      <label className="det-label">Correo Pers.</label>
                      <input className="det-input" value={datos.email}
                        onChange={function (e) { cambiarCampo('email', e.target.value); }} />
                    </div>
                  </div>

                  {/* Estado Civil + Grado Académico */}
                  <div className="det-fila">
                    <div className="det-campo">
                      <label className="det-label">Estado Civil</label>
                      <select className="det-select" value={datos.id_estcivil}
                        onChange={function (e) { cambiarCampo('id_estcivil', e.target.value); }}>
                        <option value="">-- Seleccionar --</option>
                        {estadosCiviles.map(function (e) {
                          return <option key={e.id} value={e.id}>{e.nombre}</option>;
                        })}
                      </select>
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Grado Académico</label>
                      <select className="det-select" value={datos.id_acadm}
                        onChange={function (e) { cambiarCampo('id_acadm', e.target.value); }}>
                        <option value="">-- Seleccionar --</option>
                        {grados.map(function (g) {
                          return <option key={g.id} value={g.id}>{g.nombre}</option>;
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Departamento + Cargo (cargo filtrado por depto) */}
                  <div className="det-fila">
                    <div className="det-campo">
                      <label className="det-label">Departamento</label>
                      <select className="det-select" value={datos.id_depart}
                        onChange={function (e) { cambiarCampo('id_depart', Number(e.target.value)); }}>
                        <option value="">-- Seleccionar --</option>
                        {departamentos.map(function (d) {
                          return <option key={d.id} value={d.id}>{d.nombre}</option>;
                        })}
                      </select>
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Cargo</label>
                      <select className="det-select" value={datos.id_cargo}
                        onChange={function (e) { cambiarCampo('id_cargo', Number(e.target.value)); }}>
                        <option value="">-- Seleccionar --</option>
                        {cargos.map(function (c) {
                          return <option key={c.id} value={c.id}>{c.nombre}</option>;
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Sueldo + Asig. Familiar */}
                  <div className="det-fila">
                    <div className="det-campo">
                      <label className="det-label">Sueldo</label>
                      <input className="det-input" type="number" step="0.01" value={datos.sueldo}
                        onChange={function (e) { cambiarCampo('sueldo', e.target.value); }} />
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Asig. Familiar</label>
                      <select className="det-select" value={datos.asig_fam}
                        onChange={function (e) { cambiarCampo('asig_fam', Number(e.target.value)); }}>
                        <option value={0}>No</option>
                        <option value={1}>Sí</option>
                      </select>
                    </div>
                  </div>

                  {/* F. Ingreso + F. Cese */}
                  <div className="det-fila">
                    <div className="det-campo">
                      <label className="det-label">Fecha Ingreso</label>
                      <input className="det-input" type="date" value={datos.fech_ingr}
                        onChange={function (e) { cambiarCampo('fech_ingr', e.target.value); }} />
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Cese / Fin de Contrato</label>
                      <input className="det-input" type="date" value={datos.fech_cese}
                        onChange={function (e) { cambiarCampo('fech_cese', e.target.value); }} />
                    </div>
                  </div>

                  {/* Distrito + Dirección */}
                  <div className="det-fila">
                    <div className="det-campo">
                      <label className="det-label">Distrito</label>
                      <select className="det-select" value={datos.id_distr}
                        onChange={function (e) { cambiarCampo('id_distr', e.target.value); }}>
                        <option value="">-- Seleccionar --</option>
                        {distritos.map(function (d) {
                          return <option key={d.id} value={d.id}>{d.nombre}</option>;
                        })}
                      </select>
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Dirección</label>
                      <input className="det-input" value={datos.direccion}
                        onChange={function (e) { cambiarCampo('direccion', e.target.value); }} />
                    </div>
                  </div>

                  {/* Contactos de emergencia — EDITABLES */}
                  <div className="det-contactos">
                    <label className="det-label">Contactos de Emergencia</label>
                    {contactos.map(function (c, i) {
                      return (
                        <div className="det-contacto-fila" key={i}>
                          <select className="det-select det-contacto-tipo" value={c.id_tipfam || ''}
                            onChange={function (e) {
                              var copia = contactos.slice();
                              copia[i] = Object.assign({}, copia[i], { id_tipfam: e.target.value });
                              setContactos(copia);
                            }}>
                            <option value="">-- Parentesco --</option>
                            {tiposFamiliar.map(function (t) {
                              return <option key={t.id} value={t.id}>{t.nombre}</option>;
                            })}
                          </select>
                          <input className="det-input det-contacto-nombre" placeholder="Nombre"
                            value={c.nombre}
                            onChange={function (e) {
                              var copia = contactos.slice();
                              copia[i] = Object.assign({}, copia[i], { nombre: e.target.value });
                              setContactos(copia);
                            }} />
                          <input className="det-input det-contacto-cel" placeholder="Celular"
                            value={c.celular}
                            onChange={function (e) {
                              var copia = contactos.slice();
                              copia[i] = Object.assign({}, copia[i], { celular: e.target.value });
                              setContactos(copia);
                            }} />
                          <button className="det-btn det-btn-quitar" type="button"
                            onClick={function () {
                              var copia = contactos.slice();
                              copia.splice(i, 1);
                              setContactos(copia);
                            }}>
                            <IconoFa icono={faTrash} />
                          </button>
                        </div>
                      );
                    })}
                    <button className="det-btn det-btn-agregar-contacto" type="button"
                      onClick={function () { setContactos(contactos.concat([{ nombre: '', celular: '', id_tipfam: '' }])); }}>
                      <IconoFa icono={faPlus} /> Agregar contacto
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB SEGUROS Y APORTACIONES ===== */}
      {tabActiva === 'seguros' && !esNuevo && (
        <div className="detalle-tab-contenido">
          <h3>Seguros y Aportaciones</h3>
          {!editandoSeguros ? (
            <div className="det-seguros-view">
              <div className="det-seguros-actions">
                <button className="det-btn det-btn-editar" onClick={function () {
                  setDatosSeguros({
                    id_afp: seguros ? seguros.id_afp : '',
                    cod_afp: seguros ? seguros.cod_afp : '',
                    comision_afp: seguros ? seguros.comision_afp : 0,
                    aportacion: seguros ? seguros.aportacion : 0
                  });
                  setEditandoSeguros(true);
                }}>
                  <IconoFa icono={faPen} /> Editar
                </button>
              </div>
              {seguros ? (
                <div className="det-seguros-datos">
                  <div className="det-fila">
                    <div className="det-campo">
                      <label className="det-label">AFP / ONP</label>
                      <span className="det-valor">{seguros.afp || '—'}</span>
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Código AFP</label>
                      <span className="det-valor">{seguros.cod_afp || '—'}</span>
                    </div>
                  </div>
                  <div className="det-fila">
                    <div className="det-campo">
                      <label className="det-label">Comisión AFP</label>
                      <span className="det-valor">{seguros.comision_afp ? 'Sí' : 'No'}</span>
                    </div>
                    <div className="det-campo">
                      <label className="det-label">Aportación</label>
                      <span className="det-valor">{seguros.aportacion ? 'Sí' : 'No'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="det-sin-datos">Sin datos de seguros registrados</p>
              )}
            </div>
          ) : (
            <div className="det-seguros-edit">
              <div className="det-fila">
                <div className="det-campo">
                  <label className="det-label">AFP / ONP</label>
                  <select className="det-select" value={datosSeguros.id_afp}
                    onChange={function (e) { setDatosSeguros(Object.assign({}, datosSeguros, { id_afp: e.target.value })); }}>
                    <option value="">-- Seleccionar --</option>
                    {afps.map(function (a) { return <option key={a.id} value={a.id}>{a.nombre}</option>; })}
                  </select>
                </div>
                <div className="det-campo">
                  <label className="det-label">Código AFP</label>
                  <input className="det-input" value={datosSeguros.cod_afp}
                    onChange={function (e) { setDatosSeguros(Object.assign({}, datosSeguros, { cod_afp: e.target.value })); }} />
                </div>
              </div>
              <div className="det-fila">
                <div className="det-campo">
                  <label className="det-label">Comisión AFP</label>
                  <select className="det-select" value={datosSeguros.comision_afp}
                    onChange={function (e) { setDatosSeguros(Object.assign({}, datosSeguros, { comision_afp: Number(e.target.value) })); }}>
                    <option value={0}>No</option>
                    <option value={1}>Sí</option>
                  </select>
                </div>
                <div className="det-campo">
                  <label className="det-label">Aportación</label>
                  <select className="det-select" value={datosSeguros.aportacion}
                    onChange={function (e) { setDatosSeguros(Object.assign({}, datosSeguros, { aportacion: Number(e.target.value) })); }}>
                    <option value={0}>No</option>
                    <option value={1}>Sí</option>
                  </select>
                </div>
              </div>
              <div className="det-seguros-actions">
                <button className="det-btn det-btn-guardar" onClick={function () {
                  if (!datosSeguros.id_afp) { alert('Selecciona una AFP'); return; }
                  fetch(API_URL + '/personal/' + id + '/seguros-aportaciones', {
                    method: 'PUT', headers: headersConToken(),
                    body: JSON.stringify({
                      id_afp: Number(datosSeguros.id_afp),
                      cod_afp: datosSeguros.cod_afp,
                      comision_afp: datosSeguros.comision_afp,
                      aportacion: datosSeguros.aportacion
                    })
                  })
                    .then(function (r) { return r.json(); })
                    .then(function () {
                      return fetch(API_URL + '/personal/' + id + '/seguros-aportaciones', { headers: headersAuth() })
                        .then(function (r) { return r.json(); })
                        .then(function (d) { setSeguros(d); setEditandoSeguros(false); });
                    })
                    .catch(function (err) { alert('Error: ' + err.message); });
                }}>
                  <IconoFa icono={faFloppyDisk} /> Guardar
                </button>
                <button className="det-btn det-btn-cancelar" onClick={function () { setEditandoSeguros(false); }}>
                  <IconoFa icono={faXmark} /> Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB CUENTAS BANCARIAS ===== */}
      {tabActiva === 'cuentas' && !esNuevo && (
        <div className="detalle-tab-contenido">
          <h3>Cuentas Bancarias</h3>
          {!editandoCuentas ? (
            <div className="det-cuentas-view">
              <div className="det-cuentas-actions">
                <button className="det-btn det-btn-editar" onClick={function () { setEditandoCuentas(true); }}>
                  <IconoFa icono={faPen} /> Editar
                </button>
              </div>
              {cuentas && cuentas.length > 0 ? (
                <table className="det-cuentas-tabla">
                  <thead>
                    <tr>
                      <th>Tipo Cuenta</th>
                      <th>Banco</th>
                      <th>N° Cuenta</th>
                      <th>Moneda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuentas.map(function (c, i) {
                      return (
                        <tr key={i}>
                          <td>{c.tipo_cuenta || '—'}</td>
                          <td>{c.banco || '—'}</td>
                          <td>{c.cuenta_banc || '—'}</td>
                          <td>{c.moneda || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="det-sin-datos">Sin cuentas bancarias registradas</p>
              )}
            </div>
          ) : (
            <div className="det-cuentas-edit">
              {cuentas.map(function (c, i) {
                return (
                  <div className="det-cuenta-fila" key={i}>
                    <div className="det-fila det-fila-4">
                      <div className="det-campo">
                        <label className="det-label">Tipo Cuenta</label>
                        <select className="det-select" value={c.id_tipo_cuenta || ''}
                          onChange={function (e) {
                            var copia = cuentas.slice();
                            copia[i] = Object.assign({}, copia[i], { id_tipo_cuenta: Number(e.target.value) });
                            setCuentas(copia);
                          }}>
                          <option value="">-- Seleccionar --</option>
                          {tiposCuenta.map(function (t) { return <option key={t.id} value={t.id}>{t.nombre}</option>; })}
                        </select>
                      </div>
                      <div className="det-campo">
                        <label className="det-label">Banco</label>
                        <select className="det-select" value={c.id_banco || ''}
                          onChange={function (e) {
                            var copia = cuentas.slice();
                            copia[i] = Object.assign({}, copia[i], { id_banco: Number(e.target.value) });
                            setCuentas(copia);
                          }}>
                          <option value="">-- Seleccionar --</option>
                          {bancos.map(function (b) { return <option key={b.id} value={b.id}>{b.nombre}</option>; })}
                        </select>
                      </div>
                      <div className="det-campo">
                        <label className="det-label">N° Cuenta</label>
                        <input className="det-input" value={c.cuenta_banc || ''}
                          onChange={function (e) {
                            var copia = cuentas.slice();
                            copia[i] = Object.assign({}, copia[i], { cuenta_banc: e.target.value });
                            setCuentas(copia);
                          }} />
                      </div>
                      <div className="det-campo">
                        <label className="det-label">Moneda</label>
                        <select className="det-select" value={c.id_moneda || ''}
                          onChange={function (e) {
                            var copia = cuentas.slice();
                            copia[i] = Object.assign({}, copia[i], { id_moneda: Number(e.target.value) });
                            setCuentas(copia);
                          }}>
                          <option value="">-- Seleccionar --</option>
                          {monedas.map(function (m) { return <option key={m.id} value={m.id}>{m.nombre}</option>; })}
                        </select>
                      </div>
                    </div>
                    <button className="det-btn det-btn-quitar" type="button"
                      onClick={function () {
                        var copia = cuentas.slice();
                        copia.splice(i, 1);
                        setCuentas(copia);
                      }}>
                      <IconoFa icono={faTrash} />
                    </button>
                  </div>
                );
              })}
              <button className="det-btn det-btn-agregar-contacto" type="button"
                onClick={function () { setCuentas(cuentas.concat([{ id_tipo_cuenta: '', id_banco: '', cuenta_banc: '', id_moneda: '' }])); }}>
                <IconoFa icono={faPlus} /> Agregar cuenta
              </button>
              <div className="det-cuentas-actions">
                <button className="det-btn det-btn-guardar" onClick={function () {
                  var cuentasValidas = cuentas.filter(function (c) { return c.id_banco && c.id_tipo_cuenta && c.id_moneda; });
                  fetch(API_URL + '/personal/' + id + '/cuentas-bancarias', {
                    method: 'PUT', headers: headersConToken(),
                    body: JSON.stringify({ cuentas: cuentasValidas.map(function (c) {
                      return { id_tipo_cuenta: Number(c.id_tipo_cuenta), id_banco: Number(c.id_banco), cuenta_banc: c.cuenta_banc || '', id_moneda: Number(c.id_moneda) };
                    }) })
                  })
                    .then(function (r) { return r.json(); })
                    .then(function () {
                      return fetch(API_URL + '/personal/' + id + '/cuentas-bancarias', { headers: headersAuth() })
                        .then(function (r) { return r.json(); })
                        .then(function (d) { setCuentas(d || []); setEditandoCuentas(false); });
                    })
                    .catch(function (err) { alert('Error: ' + err.message); });
                }}>
                  <IconoFa icono={faFloppyDisk} /> Guardar
                </button>
                <button className="det-btn det-btn-cancelar" onClick={function () {
                  // Recargar cuentas originales
                  fetch(API_URL + '/personal/' + id + '/cuentas-bancarias', { headers: headersAuth() })
                    .then(function (r) { return r.json(); })
                    .then(function (d) { setCuentas(d || []); });
                  setEditandoCuentas(false);
                }}>
                  <IconoFa icono={faXmark} /> Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tabActiva === 'documentos' && !esNuevo && (
        <DocumentosTab idPersonal={id} empleado={empleado} areas={areas} cargos={cargos} departamentos={departamentos} />
      )}
      {tabActiva === 'vacaciones' && !esNuevo && (
        <div className="detalle-tab-contenido"><h3>Vacaciones</h3><p className="det-sin-datos">Próximamente...</p></div>
      )}
      {tabActiva === 'asistencia' && !esNuevo && (
        <AsistenciaTab
          idPersonal={id}
          empleado={empleado}
          asistenciaData={asistenciaData}
          setAsistenciaData={setAsistenciaData}
          asistCargando={asistCargando}
          setAsistCargando={setAsistCargando}
          asistFiltro={asistFiltro}
          setAsistFiltro={setAsistFiltro}
          categoriasAsist={categoriasAsist}
          setCategoriasAsist={setCategoriasAsist}
          justificando={justificando}
          setJustificando={setJustificando}
          datosJustif={datosJustif}
          setDatosJustif={setDatosJustif}
        />
      )}
    </div>
  );
}
