import { useState, useEffect } from 'react';
import { faPen, faFloppyDisk, faXmark, faPlus, faTrash, faFileContract, faFileLines, faFileSignature, faHandshake, faFileInvoiceDollar, faFolder, faFilePdf, faFileWord, faWandMagicSparkles, faDownload, faSpinner } from '@fortawesome/free-solid-svg-icons';
import IconoFa from './IconoFa';
import { headersConToken, headersAuth, API_URL } from '../auth';

// ═══════════════════════════════════════════════════════
// Componente DOCUMENTOS TAB — Responsabilidad única
// Muestra y gestiona los documentos de un empleado
// ═══════════════════════════════════════════════════════
export default function DocumentosTab(props) {
  var idPersonal = props.idPersonal;
  var empleado = props.empleado;
  var esMiPerfil = props.esMiPerfil;
  var areas = props.areas || [];
  var allCargos = props.cargos || [];
  var departamentos = props.departamentos || [];

  var [documentos, setDocumentos] = useState([]);
  var [tiposDoc, setTiposDoc] = useState([]);
  var [motivos, setMotivos] = useState([]);
  var [cargando, setCargando] = useState(true);
  var [creando, setCreando] = useState(false);
  var [editandoId, setEditandoId] = useState(null);
  var [form, setForm] = useState({
    id_tdocument: '', id_tmotivo: '', fecha_inicio: '', fecha_fin: '',
    sueldo: '', id_area: '', id_cargo: ''
  });

  // ── Plantillas ──
  var [plantillas, setPlantillas] = useState([]);
  var [plantillaSeleccionada, setPlantillaSeleccionada] = useState('');
  var [camposPlantilla, setCamposPlantilla] = useState([]);
  var [camposManuales, setCamposManuales] = useState({});
  var [generando, setGenerando] = useState(false);
  var [cargandoCampos, setCargandoCampos] = useState(false);

  // Iconos según tipo de documento
  var ICONOS_TIPO = {
    'CONTRATO': faFileContract,
    'ADENDAS': faFileSignature,
    'MEMORANDUM': faFileLines,
    'CARTA DE COMPROMISO': faHandshake,
    'LIQUIDACION': faFileInvoiceDollar,
  };

  // Colores según tipo
  var COLORES_TIPO = {
    'CONTRATO': '#3498db',
    'ADENDAS': '#2ecc71',
    'MEMORANDUM': '#e67e22',
    'CARTA DE COMPROMISO': '#9b59b6',
    'LIQUIDACION': '#e74c3c',
  };

  function cargarDocumentos() {
    setCargando(true);
    fetch(API_URL + '/personal/' + idPersonal + '/documentos', { headers: headersAuth() })
      .then(function (r) { return r.json(); })
      .then(function (d) { setDocumentos(d || []); })
      .catch(function () { setDocumentos([]); })
      .finally(function () { setCargando(false); });
  }

  useEffect(function () {
    cargarDocumentos();
    fetch(API_URL + '/documentos/tipos', { headers: headersAuth() })
      .then(function (r) { return r.json(); })
      .then(function (d) { setTiposDoc(d || []); })
      .catch(function () {});
    fetch(API_URL + '/documentos/motivos', { headers: headersAuth() })
      .then(function (r) { return r.json(); })
      .then(function (d) { setMotivos(d || []); })
      .catch(function () {});
    // Cargar plantillas disponibles (filtradas por departamento del empleado)
    var depParam = empleado && empleado.id_depart ? '?id_depart=' + empleado.id_depart : '';
    fetch(API_URL + '/plantillas' + depParam, { headers: headersAuth() })
      .then(function (r) { return r.json(); })
      .then(function (d) { setPlantillas(d || []); })
      .catch(function () {});
  }, []);

  function abrirCrear() {
    setForm({
      id_tdocument: '', id_tmotivo: '', fecha_inicio: '', fecha_fin: '',
      sueldo: '', id_area: empleado ? (empleado.id_area || '') : '',
      id_cargo: empleado ? (empleado.id_cargo || '') : ''
    });
    setCreando(true);
    setEditandoId(null);
  }

  function abrirEditar(doc) {
    setForm({
      id_tdocument: doc.id_tdocument || '',
      id_tmotivo: doc.id_tmotivo || '',
      fecha_inicio: doc.fecha_inicio || '',
      fecha_fin: doc.fecha_fin || '',
      sueldo: doc.sueldo || '',
      id_area: doc.id_area || '',
      id_cargo: doc.id_cargo || ''
    });
    setEditandoId(doc.id);
    setCreando(false);
  }

  function cancelar() {
    setCreando(false);
    setEditandoId(null);
  }

  function guardar() {
    if (!form.id_tdocument) { alert('Selecciona un tipo de documento'); return; }
    if (!form.id_area) { alert('Selecciona un área'); return; }
    if (!form.id_cargo) { alert('Selecciona un cargo'); return; }

    var esEdicion = editandoId !== null;
    var url = esEdicion
      ? API_URL + '/documentos/' + editandoId
      : API_URL + '/personal/' + idPersonal + '/documentos';
    var metodo = esEdicion ? 'PUT' : 'POST';

    fetch(url, {
      method: metodo, headers: headersConToken(),
      body: JSON.stringify({
        id_tdocument: Number(form.id_tdocument),
        id_tmotivo: form.id_tmotivo ? Number(form.id_tmotivo) : null,
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin: form.fecha_fin || null,
        sueldo: form.sueldo || null,
        id_area: Number(form.id_area),
        id_cargo: Number(form.id_cargo),
      })
    })
      .then(function (r) { return r.json(); })
      .then(function () { cancelar(); cargarDocumentos(); })
      .catch(function (err) { alert('Error: ' + err.message); });
  }

  function eliminar(idDoc) {
    if (!confirm('¿Eliminar este documento?')) return;
    fetch(API_URL + '/documentos/' + idDoc, { method: 'DELETE', headers: headersAuth() })
      .then(function () { cargarDocumentos(); })
      .catch(function (err) { alert('Error: ' + err.message); });
  }

  // ── Plantillas: cargar campos ──
  function seleccionarPlantilla(archivo) {
    setPlantillaSeleccionada(archivo);
    setCamposPlantilla([]);
    setCamposManuales({});
    if (!archivo) return;

    setCargandoCampos(true);
    var depQ = empleado && empleado.id_depart ? '&id_depart=' + empleado.id_depart : '';
    fetch(API_URL + '/plantillas/' + encodeURIComponent(archivo) + '/campos?id_personal=' + idPersonal + depQ, {
      headers: headersAuth()
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var campos = data.campos || [];
        setCamposPlantilla(campos);
        // Inicializar campos manuales con valor sugerido de BD o vacío
        var manuales = {};
        campos.forEach(function (c) {
          if (c.tipo === 'manual') manuales[c.campo] = c.valor_sugerido || '';
        });
        setCamposManuales(manuales);
      })
      .catch(function () { setCamposPlantilla([]); })
      .finally(function () { setCargandoCampos(false); });
  }

  function cambiarCampoManual(campo, valor) {
    setCamposManuales(function (prev) {
      var copia = Object.assign({}, prev);
      copia[campo] = valor;
      return copia;
    });
  }

  function generarDocumento(formato) {
    if (!plantillaSeleccionada) return;
    setGenerando(true);

    var depQ2 = empleado && empleado.id_depart ? '&id_depart=' + empleado.id_depart : '';
    var url = API_URL + '/plantillas/' + encodeURIComponent(plantillaSeleccionada)
      + '/generar?id_personal=' + idPersonal + '&formato=' + formato + depQ2;

    fetch(url, {
      method: 'POST',
      headers: headersConToken(),
      body: JSON.stringify({ campos_manuales: camposManuales })
    })
      .then(function (r) {
        if (!r.ok) {
          return r.json().then(function (err) {
            throw new Error(err.detail || 'Error al generar');
          }).catch(function () { throw new Error('Error al generar (código ' + r.status + ')'); });
        }
        return r.blob();
      })
      .then(function (blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        var nombreBase = plantillaSeleccionada.replace(/\.docx$/i, '');
        a.download = nombreBase + '.' + formato;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      })
      .catch(function (err) { alert('Error: ' + err.message); })
      .finally(function () { setGenerando(false); });
  }

  // Etiqueta legible para campos manuales
  var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

  function etiquetaCampo(campo) {
    var mapa = {
      // Campos automáticos
      'nombres': 'Nombres',
      'ape_paterno': 'Apellido Paterno',
      'ape_materno': 'Apellido Materno',
      'num_doc': 'N° Documento',
      'direccion': 'Dirección',
      'distrito': 'Distrito',
      'depart_y_provinc': 'Depto. y Provincia',
      'provincia_y_departamento': 'Provincia y Depto.',
      'cargo': 'Cargo',
      'sueldo (en numeros)': 'Sueldo',
      'fecha_fin_contrato': 'Día Fin Contrato',
      'mes_fin_contrato': 'Mes Fin Contrato',
      'año_fin_contrato': 'Año Fin Contrato',
      // Campos manuales
      'fecha a eleccion1': 'Fecha (día)',
      'mes a elección1': 'Mes',
      'año a selección1': 'Año',
      'mes seleccionado2': 'Mes (segundo)',
      'año seleccionado2': 'Año (segundo)',
      'mes de NS': 'Mes de NS',
      'año de NS': 'Año de NS',
      'inicio_dia_mes_año_contrato_anterior': 'Inicio Contrato Anterior',
      'final_dia_mes_año_contrato_anterior': 'Fin Contrato Anterior',
      'inicio_dia_mes_año_contrato_nuevo': 'Inicio Nuevo Contrato',
      'inicio_dia_mes_año_contrato': 'Inicio de Contrato',
      'final_dia_mes_año_contrato': 'Fin de Contrato',
      'nuevo_cargo': 'Nuevo Cargo',
    };
    return mapa[campo] || mapa[campo.toLowerCase()] || campo;
  }

  // Detecta el tipo de selector a usar según el nombre del campo
  function tipoCampoManual(campo) {
    var cl = campo.toLowerCase();
    // Fechas compuestas ("dia_mes_año" en una sola cadena → date picker)
    if (cl.indexOf('dia_mes') !== -1 && cl.indexOf('año') !== -1) return 'fecha_completa';
    if (cl === 'nuevo_cargo') return 'cargo';
    if (cl.indexOf('mes') !== -1) return 'mes';
    if (cl.indexOf('año') !== -1) return 'anio';
    if (cl.indexOf('fecha') !== -1 || cl.indexOf('dia') !== -1 || cl.indexOf('día') !== -1) return 'dia';
    return 'texto';
  }

  // Renderiza el input adecuado para cada campo manual
  function renderCampoManual(c) {
    var tipo = tipoCampoManual(c.campo);
    var valor = camposManuales[c.campo] || '';

    if (tipo === 'mes') {
      return (
        <select className="det-select" value={valor}
          onChange={function (e) { cambiarCampoManual(c.campo, e.target.value); }}
          disabled={esMiPerfil}>
          <option value="">-- Seleccionar mes --</option>
          {MESES.map(function (m) {
            return <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>;
          })}
        </select>
      );
    }

    if (tipo === 'anio') {
      var anioActual = new Date().getFullYear();
      var anios = [];
      for (var i = anioActual - 2; i <= anioActual + 5; i++) anios.push(i);
      return (
        <select className="det-select" value={valor}
          onChange={function (e) { cambiarCampoManual(c.campo, e.target.value); }}
          disabled={esMiPerfil}>
          <option value="">-- Seleccionar año --</option>
          {anios.map(function (a) { return <option key={a} value={String(a)}>{a}</option>; })}
        </select>
      );
    }

    if (tipo === 'dia') {
      var dias = [];
      for (var d = 1; d <= 31; d++) dias.push(d);
      return (
        <select className="det-select" value={valor}
          onChange={function (e) { cambiarCampoManual(c.campo, e.target.value); }}
          disabled={esMiPerfil}>
          <option value="">-- Seleccionar día --</option>
          {dias.map(function (d) { return <option key={d} value={String(d)}>{d}</option>; })}
        </select>
      );
    }

    if (tipo === 'fecha_completa') {
      return (
        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          <input type="date" className="det-input" style={{maxWidth: '170px'}}
            onChange={function (e) {
              if (!e.target.value) { cambiarCampoManual(c.campo, ''); return; }
              var p = e.target.value.split('-');
              var texto = parseInt(p[2]) + ' de ' + MESES[parseInt(p[1]) - 1] + ' de ' + p[0];
              cambiarCampoManual(c.campo, texto);
            }}
            disabled={esMiPerfil} />
          <span style={{color: '#64748b', fontSize: '13px', fontStyle: 'italic', minWidth: '140px'}}>
            {valor || 'Seleccione una fecha'}
          </span>
        </div>
      );
    }

    if (tipo === 'cargo') {
      return (
        <select className="det-select" value={valor}
          onChange={function (e) { cambiarCampoManual(c.campo, e.target.value); }}
          disabled={esMiPerfil}>
          <option value="">-- Seleccionar cargo --</option>
          {allCargos.map(function (cargo) {
            return <option key={cargo.id} value={cargo.nombre}>{cargo.nombre}</option>;
          })}
        </select>
      );
    }

    // Texto libre por defecto
    return (
      <input className="det-input" type="text"
        placeholder={'Ingrese ' + etiquetaCampo(c.campo).toLowerCase()}
        value={valor}
        onChange={function (e) { cambiarCampoManual(c.campo, e.target.value); }}
        readOnly={esMiPerfil}
      />
    );
  }

  function formatFecha(f) {
    if (!f) return '—';
    var p = f.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function cambioForm(campo, valor) {
    var copia = Object.assign({}, form);
    copia[campo] = valor;
    setForm(copia);
  }

  // Nombre descriptivo del tipo
  function nombreTipo(idTipo) {
    var t = tiposDoc.find(function (x) { return x.id === idTipo; });
    return t ? t.descrip : 'DOCUMENTO';
  }

  return (
    <div className="detalle-tab-contenido doc-contenedor">
      <div className="doc-header">
        <h3>Documentos</h3>
        {!esMiPerfil && (
        <button className="det-btn det-btn-nuevo" onClick={abrirCrear}>
          <IconoFa icono={faPlus} /> Nuevo Documento
        </button>
        )}
      </div>

      {/* Formulario crear/editar */}
      {(creando || editandoId !== null) && (
        <div className="doc-form-panel">
          <h4>{editandoId ? 'Editar Documento' : 'Nuevo Documento'}</h4>
          <div className="doc-form-grid">
            <div className="det-campo">
              <label className="det-label">Tipo de Documento *</label>
              <select className="det-select" value={form.id_tdocument}
                onChange={function (e) { cambioForm('id_tdocument', e.target.value); }}>
                <option value="">-- Seleccionar --</option>
                {tiposDoc.map(function (t) { return <option key={t.id} value={t.id}>{t.descrip}</option>; })}
              </select>
            </div>
            <div className="det-campo">
              <label className="det-label">Motivo</label>
              <select className="det-select" value={form.id_tmotivo}
                onChange={function (e) { cambioForm('id_tmotivo', e.target.value); }}>
                <option value="">-- Ninguno --</option>
                {motivos.map(function (m) { return <option key={m.id} value={m.id}>{m.descrip}</option>; })}
              </select>
            </div>
            <div className="det-campo">
              <label className="det-label">Fecha Inicio</label>
              <input className="det-input" type="date" value={form.fecha_inicio}
                onChange={function (e) { cambioForm('fecha_inicio', e.target.value); }} />
            </div>
            <div className="det-campo">
              <label className="det-label">Fecha Fin</label>
              <input className="det-input" type="date" value={form.fecha_fin}
                onChange={function (e) { cambioForm('fecha_fin', e.target.value); }} />
            </div>
            <div className="det-campo">
              <label className="det-label">Sueldo</label>
              <input className="det-input" type="text" placeholder="Ej: 1500.00" value={form.sueldo}
                onChange={function (e) { cambioForm('sueldo', e.target.value); }} />
            </div>
            <div className="det-campo">
              <label className="det-label">Área *</label>
              <select className="det-select" value={form.id_area}
                onChange={function (e) { cambioForm('id_area', e.target.value); }}>
                <option value="">-- Seleccionar --</option>
                {areas.map(function (a) { return <option key={a.id} value={a.id}>{a.nombre}</option>; })}
              </select>
            </div>
            <div className="det-campo">
              <label className="det-label">Cargo *</label>
              <select className="det-select" value={form.id_cargo}
                onChange={function (e) { cambioForm('id_cargo', e.target.value); }}>
                <option value="">-- Seleccionar --</option>
                {allCargos.map(function (c) { return <option key={c.id} value={c.id}>{c.nombre}</option>; })}
              </select>
            </div>
          </div>
          <div className="doc-form-acciones">
            <button className="det-btn det-btn-guardar" onClick={guardar}>
              <IconoFa icono={faFloppyDisk} /> Guardar
            </button>
            <button className="det-btn det-btn-cancelar" onClick={cancelar}>
              <IconoFa icono={faXmark} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Paneles de documentos */}
      {cargando ? (
        <p className="det-sin-datos">Cargando documentos...</p>
      ) : documentos.length === 0 && !creando ? (
        <div className="doc-vacio">
          <IconoFa icono={faFolder} />
          <p>No hay documentos registrados</p>
          <span>Agrega contratos, adendas, memorandos y más</span>
        </div>
      ) : (
        <div className="doc-grid">
          {documentos.map(function (doc) {
            var tipoNombre = (doc.tipo_documento || 'DOCUMENTO').toUpperCase();
            var icono = ICONOS_TIPO[tipoNombre] || faFileLines;
            var color = COLORES_TIPO[tipoNombre] || '#7f8c8d';
            var vigente = doc.fecha_fin ? new Date(doc.fecha_fin) >= new Date() : true;

            return (
              <div className={'doc-card' + (vigente ? '' : ' doc-card-vencido')} key={doc.id}
                style={{ borderLeftColor: color }}>
                <div className="doc-card-icono" style={{ color: color }}>
                  <IconoFa icono={icono} />
                </div>
                <div className="doc-card-body">
                  <div className="doc-card-tipo">{doc.tipo_documento || 'Documento'}</div>
                  {doc.motivo && <span className="doc-card-motivo">{doc.motivo}</span>}
                  <div className="doc-card-detalles">
                    {doc.area && <span className="doc-card-detalle"><strong>Área:</strong> {doc.area}</span>}
                    {doc.cargo && <span className="doc-card-detalle"><strong>Cargo:</strong> {doc.cargo}</span>}
                    {doc.sueldo && <span className="doc-card-detalle"><strong>Sueldo:</strong> S/ {doc.sueldo}</span>}
                  </div>
                  <div className="doc-card-fechas">
                    {doc.fecha_inicio && <span>Desde: {formatFecha(doc.fecha_inicio)}</span>}
                    {doc.fecha_fin && <span>Hasta: {formatFecha(doc.fecha_fin)}</span>}
                  </div>
                  {!vigente && <span className="doc-badge-vencido">Vencido</span>}
                  {vigente && doc.fecha_fin && <span className="doc-badge-vigente">Vigente</span>}
                </div>
                <div className="doc-card-acciones">
                  {!esMiPerfil && (
                  <>
                  <button className="doc-btn-accion" title="Editar" onClick={function () { abrirEditar(doc); }}>
                    <IconoFa icono={faPen} />
                  </button>
                  <button className="doc-btn-accion doc-btn-eliminar" title="Eliminar" onClick={function () { eliminar(doc.id); }}>
                    <IconoFa icono={faTrash} />
                  </button>
                  </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Sección: Generar Documento desde Plantilla ═══ */}
      {plantillas.length > 0 && (
        <div className="doc-plantilla-seccion">
          <div className="doc-header" style={{ marginTop: 24 }}>
            <h3><IconoFa icono={faWandMagicSparkles} /> Generar Documento</h3>
          </div>

          <div className="doc-form-panel">
            <div className="det-campo">
              <label className="det-label">Plantilla</label>
              <select className="det-select" value={plantillaSeleccionada}
                onChange={function (e) { seleccionarPlantilla(e.target.value); }}>
                <option value="">-- Seleccionar plantilla --</option>
                {plantillas.map(function (p) {
                  return <option key={p.archivo} value={p.archivo}>{p.nombre}</option>;
                })}
              </select>
            </div>

            {cargandoCampos && (
              <p className="det-sin-datos"><IconoFa icono={faSpinner} /> Analizando plantilla...</p>
            )}

            {camposPlantilla.length > 0 && !cargandoCampos && (
              <>
                {/* Campos automáticos visibles (solo los que NO son de fecha generación ni sueldo en texto) */}
                {camposPlantilla.filter(function (c) {
                  if (c.tipo !== 'auto') return false;
                  var cl = c.campo.toLowerCase();
                  if (cl.indexOf('genera') !== -1) return false;
                  if (cl === 'sueldo en texto') return false;
                  return true;
                }).length > 0 && (
                  <div className="doc-campos-auto">
                    <h4 className="doc-campos-titulo">Datos del Empleado</h4>
                    <div className="doc-form-grid">
                      {camposPlantilla.filter(function (c) {
                        if (c.tipo !== 'auto') return false;
                        var cl = c.campo.toLowerCase();
                        if (cl.indexOf('genera') !== -1) return false;
                        if (cl === 'sueldo en texto') return false;
                        return true;
                      }).map(function (c) {
                        return (
                          <div className="det-campo" key={c.campo}>
                            <label className="det-label">{etiquetaCampo(c.campo)}</label>
                            <input className="det-input det-input-readonly" type="text" value={c.valor || '—'} readOnly />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Campos manuales (editables con selectores inteligentes) */}
                {camposPlantilla.filter(function (c) { return c.tipo === 'manual'; }).length > 0 && (
                  <div className="doc-campos-manual">
                    <h4 className="doc-campos-titulo">Campos a Completar</h4>
                    <div className="doc-form-grid">
                      {camposPlantilla.filter(function (c) { return c.tipo === 'manual'; }).map(function (c) {
                        return (
                          <div className="det-campo" key={c.campo}>
                            <label className="det-label">{etiquetaCampo(c.campo)}</label>
                            {renderCampoManual(c)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Botones de descarga */}
                <div className="doc-form-acciones" style={{ marginTop: 14 }}>
                  {!esMiPerfil && (
                    <>
                      <button className="det-btn det-btn-guardar" onClick={function () { generarDocumento('docx'); }}
                        disabled={generando}>
                        <IconoFa icono={generando ? faSpinner : faFileWord} />
                        {generando ? ' Generando...' : ' Descargar Word'}
                      </button>
                      <button className="det-btn det-btn-nuevo" onClick={function () { generarDocumento('pdf'); }}
                        disabled={generando}>
                        <IconoFa icono={generando ? faSpinner : faFilePdf} />
                        {generando ? ' Generando...' : ' Descargar PDF'}
                      </button>
                    </>
                  )}
                  {esMiPerfil && (
                    <>
                      <button className="det-btn det-btn-guardar" onClick={function () { generarDocumento('docx'); }}
                        disabled={generando}>
                        <IconoFa icono={generando ? faSpinner : faDownload} />
                        {generando ? ' Descargando...' : ' Descargar Word'}
                      </button>
                      <button className="det-btn det-btn-nuevo" onClick={function () { generarDocumento('pdf'); }}
                        disabled={generando}>
                        <IconoFa icono={generando ? faSpinner : faDownload} />
                        {generando ? ' Descargando...' : ' Descargar PDF'}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
