import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { faPerson, faPersonDress, faCamera, faClock } from '@fortawesome/free-solid-svg-icons';
import IconoFa from '../components/IconoFa';
import AsistenciaTab from '../components/AsistenciaTab';
import DocumentosTab from '../components/DocumentosTab';
import { headersAuth, API_URL } from '../auth';
import '../styles/PersonalDetalle.css';

// ═══════════════════════════════════════════════════════════════════
// MiPerfil — Módulo independiente para ver tu propio perfil.
//
// Responsabilidad ÚNICA: mostrar los datos del usuario autenticado
// en modo solo-lectura. NO depende de catálogos de RRHH, NO comparte
// lógica con PersonalDetalle (que es de gestión RRHH).
//
// Accesible para TODOS los roles, siempre visible en el sidebar.
// ═══════════════════════════════════════════════════════════════════
export default function MiPerfil() {
  var navigate = useNavigate();
  var [empleado, setEmpleado] = useState(null);
  var [seguros, setSeguros] = useState(null);
  var [cuentas, setCuentas] = useState([]);
  var [cargando, setCargando] = useState(true);
  var [tabActiva, setTabActiva] = useState('informacion');
  var fotoInputRef = useRef(null);

  // Estado para tab ASISTENCIA (levantado aquí para preservar entre cambios de tab)
  var [asistenciaData, setAsistenciaData] = useState(null);
  var [asistCargando, setAsistCargando] = useState(false);
  var [asistFiltro, setAsistFiltro] = useState({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear()
  });
  var [categoriasAsist, setCategoriasAsist] = useState([]);
  var [justificando, setJustificando] = useState(null);
  var [datosJustif, setDatosJustif] = useState({ id_catga: '', obsv: '', hora_e: '', hora_s: '' });

  // ── Carga de datos ──────────────────────────────────
  useEffect(function () {
    var abortCtrl = new AbortController();
    var signal = abortCtrl.signal;
    var h = headersAuth();

    // Solo necesitamos /mi-perfil — retorna datos con labels ya resueltos
    fetch(API_URL + '/mi-perfil', { headers: h, signal: signal })
      .then(function (r) {
        if (!r.ok) throw new Error('Error ' + r.status);
        return r.json();
      })
      .then(function (miData) {
        if (signal.aborted) return;
        setEmpleado(miData);

        // Cargar seguros y cuentas del empleado
        var miId = miData.id;
        return Promise.all([
          fetch(API_URL + '/personal/' + miId + '/seguros-aportaciones', { headers: h, signal: signal })
            .then(function (r) { return r.json(); }),
          fetch(API_URL + '/personal/' + miId + '/cuentas-bancarias', { headers: h, signal: signal })
            .then(function (r) { return r.json(); }),
        ]).then(function (res) {
          if (signal.aborted) return;
          setSeguros(res[0]);
          setCuentas(res[1] || []);
          setCargando(false);
        });
      })
      .catch(function () {
        if (!signal.aborted) {
          alert('Error al cargar tu perfil');
          navigate('/dashboard');
        }
      });

    return function () { abortCtrl.abort(); };
  }, [navigate]);

  // ── Subir foto de perfil ────────────────────────────
  function subirFoto(e) {
    var archivo = e.target.files[0];
    if (!archivo || !empleado) return;
    var formData = new FormData();
    formData.append('foto', archivo);

    var session = JSON.parse(localStorage.getItem('session'));
    fetch(API_URL + '/personal/' + empleado.id + '/foto', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + session.access_token },
      body: formData
    })
      .then(function (r) {
        if (!r.ok) throw new Error('Error ' + r.status);
        return r.json();
      })
      .then(function (resp) {
        setEmpleado(Object.assign({}, empleado, { foto: resp.foto }));
        // Actualizar foto en localStorage para Header
        try {
          var s = JSON.parse(localStorage.getItem('session'));
          if (s && s.usuario && String(s.usuario.id_personal) === String(empleado.id)) {
            s.usuario.foto = resp.foto;
            localStorage.setItem('session', JSON.stringify(s));
            window.dispatchEvent(new Event('session-updated'));
          }
        } catch (ex) { /* ignorar */ }
      })
      .catch(function (err) { alert('Error al subir foto: ' + err.message); });
    e.target.value = '';
  }

  // ── Helpers ─────────────────────────────────────────
  function claseEstado(estado) {
    if (!estado) return '';
    var e = estado.toUpperCase();
    if (e === 'ACTIVO') return 'estado-activo';
    if (e === 'INACTIVO' || e === 'CESADO') return 'estado-inactivo';
    return '';
  }

  var idEmpleado = empleado ? String(empleado.id) : null;

  var tabs = [
    { id: 'informacion', nombre: 'INFORMACIÓN' },
    { id: 'seguros', nombre: 'SEGUROS Y APORTACIONES' },
    { id: 'cuentas', nombre: 'CUENTAS BANCARIAS' },
    { id: 'documentos', nombre: 'DOCUMENTOS' },
    { id: 'asistencia', nombre: 'ASISTENCIA' },
  ];

  if (cargando) return <div className="detalle-cargando">Cargando...</div>;

  return (
    <div className="detalle-pagina">

      {empleado && (
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

      {/* ===== TAB INFORMACIÓN (solo lectura) ===== */}
      {tabActiva === 'informacion' && (
        <div className="detalle-tarjeta">
          <div className="detalle-cabecera">
            <div className="detalle-botones">{/* Sin botones de edición */}</div>

            <div className="detalle-area-campo">
              <label className="det-label det-label-area">Área</label>
              <span className="detalle-area-texto">{empleado ? (empleado.area || 'Sin área') : ''}</span>
            </div>

            <div className="detalle-genero">
              <IconoFa icono={empleado && empleado.genero === 'F' ? faPersonDress : faPerson} tamaño="lg"
                clase={empleado && empleado.genero === 'F' ? 'genero-mujer' : 'genero-hombre'} />
            </div>

            {empleado && empleado.horario_nombre && (
              <div className="detalle-horario-badge">
                <IconoFa icono={faClock} /> {empleado.horario_nombre}{empleado.horario_rango ? ' · ' + empleado.horario_rango : ''}
              </div>
            )}
          </div>

          {/* Cuerpo: foto + campos en lectura */}
          <div className="detalle-cuerpo">
            <div className="detalle-col-foto">
              <div className="detalle-foto-wrapper">
                <div className={'detalle-foto ' + (empleado ? claseEstado(empleado.estado) : '')}>
                  {empleado && empleado.foto ? (
                    <img src={'/assets/perfiles/' + empleado.foto} alt={empleado.nombres} />
                  ) : (
                    <div className="detalle-foto-vacia">
                      {empleado ? empleado.nombres.charAt(0) + empleado.ape_paterno.charAt(0) : '?'}
                    </div>
                  )}
                </div>
                <button className="detalle-foto-subir" onClick={function () { fotoInputRef.current.click(); }}
                  title="Cambiar foto">
                  <IconoFa icono={faCamera} />
                </button>
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
              {empleado && (
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

                  {/* DNI + Fecha Nac */}
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

                  {/* Tipo Contrato + Modalidad + Sueldo + Asig. Familiar */}
                  <div className="det-fila det-fila-3">
                    <div className="det-campo">
                      <label className="det-label">Tipo Contrato</label>
                      <span className="det-valor">{empleado.tipo_contrato || '—'}</span>
                    </div>
                    <div className="det-campo">
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
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB SEGUROS Y APORTACIONES (solo lectura) ===== */}
      {tabActiva === 'seguros' && (
        <div className="detalle-tab-contenido">
          <h3>Seguros y Aportaciones</h3>
          <div className="det-seguros-view">
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
        </div>
      )}

      {/* ===== TAB CUENTAS BANCARIAS (solo lectura) ===== */}
      {tabActiva === 'cuentas' && (
        <div className="detalle-tab-contenido">
          <h3>Cuentas Bancarias</h3>
          <div className="det-cuentas-view">
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
        </div>
      )}

      {/* ===== TAB DOCUMENTOS ===== */}
      {tabActiva === 'documentos' && (
        <DocumentosTab idPersonal={idEmpleado} empleado={empleado} areas={[]} cargos={[]} departamentos={[]} esMiPerfil={true} />
      )}

      {/* ===== TAB ASISTENCIA ===== */}
      {tabActiva === 'asistencia' && (
        <AsistenciaTab
          idPersonal={idEmpleado}
          esMiPerfil={true}
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
