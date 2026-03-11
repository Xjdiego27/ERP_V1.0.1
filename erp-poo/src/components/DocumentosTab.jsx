import { useState, useEffect } from 'react';
import { faPen, faFloppyDisk, faXmark, faPlus, faTrash, faFileContract, faFileLines, faFileSignature, faHandshake, faFileInvoiceDollar, faFolder } from '@fortawesome/free-solid-svg-icons';
import IconoFa from './IconoFa';
import { headersConToken, headersAuth, API_URL } from '../auth';

// ═══════════════════════════════════════════════════════
// Componente DOCUMENTOS TAB — Responsabilidad única
// Muestra y gestiona los documentos de un empleado
// ═══════════════════════════════════════════════════════
export default function DocumentosTab(props) {
  var idPersonal = props.idPersonal;
  var empleado = props.empleado;
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
        <button className="det-btn det-btn-nuevo" onClick={abrirCrear}>
          <IconoFa icono={faPlus} /> Nuevo Documento
        </button>
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
                  <button className="doc-btn-accion" title="Editar" onClick={function () { abrirEditar(doc); }}>
                    <IconoFa icono={faPen} />
                  </button>
                  <button className="doc-btn-accion doc-btn-eliminar" title="Eliminar" onClick={function () { eliminar(doc.id); }}>
                    <IconoFa icono={faTrash} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
