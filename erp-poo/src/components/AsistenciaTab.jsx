import { useState, useEffect, useRef, useCallback } from 'react';
import { faPen, faFloppyDisk, faXmark, faCalendarCheck, faCalendarDays, faClock } from '@fortawesome/free-solid-svg-icons';
import IconoFa from './IconoFa';
import { headersConToken, headersAuth, API_URL } from '../auth';

// ═══════════════════════════════════════════════════════
// Componente ASISTENCIA TAB — Responsabilidad única
// Muestra y gestiona la asistencia de un empleado
// ═══════════════════════════════════════════════════════
export default function AsistenciaTab(props) {
  var idPersonal = props.idPersonal;
  var empleado = props.empleado;
  var esMiPerfil = props.esMiPerfil;
  var asistenciaData = props.asistenciaData;
  var setAsistenciaData = props.setAsistenciaData;
  var asistCargando = props.asistCargando;
  var setAsistCargando = props.setAsistCargando;
  var asistFiltro = props.asistFiltro;
  var setAsistFiltro = props.setAsistFiltro;
  var categoriasAsist = props.categoriasAsist;
  var setCategoriasAsist = props.setCategoriasAsist;
  var justificando = props.justificando;
  var setJustificando = props.setJustificando;
  var datosJustif = props.datosJustif;
  var setDatosJustif = props.setDatosJustif;

  // Polling en tiempo real
  var [ultimaAct, setUltimaAct] = useState(null);
  var pollingRef = useRef(null);
  var POLLING_INTERVAL = 15000; // 15 segundos

  var nombreEmpleado = empleado
    ? (empleado.ape_paterno + ' ' + empleado.ape_materno + ', ' + empleado.nombres)
    : '';

  // Estado para modal de justificación con modo rango
  var [modoJustif, setModoJustif] = useState('unico'); // 'unico' | 'rango'
  var [rangoFechas, setRangoFechas] = useState({ fecha_inicio: '', fecha_fin: '' });

  var MESES = [
    { v: 1, n: 'Enero' }, { v: 2, n: 'Febrero' }, { v: 3, n: 'Marzo' },
    { v: 4, n: 'Abril' }, { v: 5, n: 'Mayo' }, { v: 6, n: 'Junio' },
    { v: 7, n: 'Julio' }, { v: 8, n: 'Agosto' }, { v: 9, n: 'Septiembre' },
    { v: 10, n: 'Octubre' }, { v: 11, n: 'Noviembre' }, { v: 12, n: 'Diciembre' }
  ];

  function cargarAsistencia() {
    setAsistCargando(true);
    var url = API_URL + '/asistencia/personal/' + idPersonal
      + '?mes=' + asistFiltro.mes + '&anio=' + asistFiltro.anio;
    fetch(url, { headers: headersAuth() })
      .then(function (r) { return r.json(); })
      .then(function (d) { setAsistenciaData(d); })
      .catch(function () { })
      .finally(function () { setAsistCargando(false); });
  }

  function cargarCategorias() {
    fetch(API_URL + '/asistencia/categorias', { headers: headersAuth() })
      .then(function (r) { return r.json(); })
      .then(function (d) { setCategoriasAsist(d); })
      .catch(function () { });
  }

  function guardarJustificacion() {
    if (!datosJustif.id_catga) { alert('Selecciona un motivo'); return; }

    if (modoJustif === 'rango') {
      // Modo rango de fechas
      if (!rangoFechas.fecha_inicio || !rangoFechas.fecha_fin) {
        alert('Selecciona fecha de inicio y fin'); return;
      }
      if (rangoFechas.fecha_inicio > rangoFechas.fecha_fin) {
        alert('La fecha de inicio no puede ser mayor a la fecha fin'); return;
      }
      fetch(API_URL + '/asistencia/justificar-rango', {
        method: 'POST', headers: headersConToken(),
        body: JSON.stringify({
          id_personal: Number(idPersonal),
          id_catga: Number(datosJustif.id_catga),
          fecha_inicio: rangoFechas.fecha_inicio,
          fecha_fin: rangoFechas.fecha_fin,
          hora_e: datosJustif.hora_e || null,
          hora_s: datosJustif.hora_s || null,
          obsv: datosJustif.obsv
        })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          alert('Justificación aplicada a ' + (data.dias || 0) + ' día(s)');
          setJustificando(null);
          setModoJustif('unico');
          setRangoFechas({ fecha_inicio: '', fecha_fin: '' });
          cargarAsistencia();
        })
        .catch(function (err) { alert('Error: ' + err.message); });
    } else {
      // Modo día único
      fetch(API_URL + '/asistencia/justificar', {
        method: 'PUT', headers: headersConToken(),
        body: JSON.stringify({
          id_personal: Number(idPersonal),
          fecha: justificando.fecha,
          id_catga: Number(datosJustif.id_catga),
          hora_e: datosJustif.hora_e || null,
          hora_s: datosJustif.hora_s || null,
          obsv: datosJustif.obsv
        })
      })
        .then(function (r) { return r.json(); })
        .then(function () { setJustificando(null); cargarAsistencia(); })
        .catch(function (err) { alert('Error: ' + err.message); });
    }
  }

  useEffect(function () {
    cargarAsistencia();
    cargarCategorias();
  }, []);

  function formatMin(min) {
    var h = Math.floor(min / 60);
    var m = min % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function formatFecha(f) {
    if (!f) return '';
    var partes = f.split('-');
    return partes[2] + '/' + partes[1] + '/' + partes[0];
  }

  var resumen = asistenciaData ? asistenciaData.resumen : null;
  var lista = asistenciaData ? asistenciaData.asistencias : [];

  return (
    <div className="detalle-tab-contenido asist-contenedor">
      <div className="asist-header">
        <div className="asist-header-info">
          <h3>Asistencia
            <span className="asist-live-badge" title="Actualizando cada 15 segundos">
              <span className="live-dot"></span> EN VIVO
            </span>
          </h3>
          {nombreEmpleado && <span className="asist-nombre-empleado">{nombreEmpleado}</span>}
        </div>
        {ultimaAct && (
          <span className="asist-ultima-act">
            Actualizado: {ultimaAct.toLocaleTimeString('es-PE')}
          </span>
        )}
        {empleado && empleado.horario_nombre && (
          <div className="asist-horario-badge">
            <IconoFa icono={faClock} /> {empleado.horario_descrip || empleado.horario_rango || empleado.horario_nombre}
          </div>
        )}

      </div>

      {/* Filtros */}
      <div className="asist-filtros">
        <div className="asist-filtro-grupo">
          <label className="det-label">Mes</label>
          <select className="det-select asist-select"
            value={asistFiltro.mes}
            onChange={function (e) { setAsistFiltro(Object.assign({}, asistFiltro, { mes: Number(e.target.value) })); }}>
            {MESES.map(function (m) { return <option key={m.v} value={m.v}>{m.n}</option>; })}
          </select>
        </div>
        <div className="asist-filtro-grupo">
          <label className="det-label">Año</label>
          <input className="det-input asist-input-anio" type="number" min="2020" max="2100"
            value={asistFiltro.anio}
            onChange={function (e) { setAsistFiltro(Object.assign({}, asistFiltro, { anio: Number(e.target.value) })); }} />
        </div>
        <button className="det-btn det-btn-filtrar" onClick={cargarAsistencia} disabled={asistCargando}>
          <IconoFa icono={faCalendarCheck} /> Filtrar
        </button>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="asist-resumen">
          <div className="asist-resumen-item asist-res-asist">
            <span className="asist-resumen-num">{resumen.total_asistencias}</span>
            <span className="asist-resumen-label">Asistencias</span>
          </div>
          <div className="asist-resumen-item asist-res-tard">
            <span className="asist-resumen-num">{resumen.total_tardanzas}</span>
            <span className="asist-resumen-label">Tardanzas</span>
          </div>
          <div className="asist-resumen-item asist-res-min">
            <span className="asist-resumen-num">{formatMin(resumen.total_min_tardanza)}</span>
            <span className="asist-resumen-label">Min. Tardanza</span>
          </div>
          <div className="asist-resumen-item asist-res-falt">
            <span className="asist-resumen-num">{resumen.total_faltas}</span>
            <span className="asist-resumen-label">Faltas</span>
          </div>
        </div>
      )}

      {/* Tabla */}
      {asistCargando ? (
        <p className="det-sin-datos">Cargando asistencias...</p>
      ) : lista.length === 0 ? (
        <p className="det-sin-datos">No hay registros en el período seleccionado</p>
      ) : (
        <div className="asist-tabla-scroll">
          <table className="asist-tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Día</th>
                <th>Entrada</th>
                <th>Tardanza</th>
                <th>Salida</th>
                <th>Categoría</th>
                <th>Observación</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(function (a, i) {
                var clasesFila = 'asist-fila';
                if (a.es_descanso) clasesFila += ' asist-fila-descanso';
                else if (a.es_falta) clasesFila += ' asist-fila-falta';
                else if (a.min_tardanza > 0) clasesFila += ' asist-fila-tardanza';

                return (
                  <tr key={i} className={clasesFila}>
                    <td>{formatFecha(a.fecha)}</td>
                    <td>{a.dia}</td>
                    <td>{a.hora_e && a.hora_e !== '00:00:00' ? a.hora_e : '—'}</td>
                    <td className={a.min_tardanza > 0 ? 'asist-td-tardanza' : ''}>
                      {a.min_tardanza > 0 ? formatMin(a.min_tardanza) : '—'}
                    </td>
                    <td>{a.hora_s || '—'}</td>
                    <td>
                      <span className={'asist-cat asist-cat-' + (a.categoria || 'none').toLowerCase().replace(/\s/g, '')}>
                        {a.categoria || '—'}
                      </span>
                    </td>
                    <td>{a.obsv || ''}</td>
                    <td>
                      {!a.es_descanso && !esMiPerfil && (
                        <button className="det-btn det-btn-justificar" onClick={function () {
                          setJustificando(a);
                          setDatosJustif({
                            id_catga: a.id_catga || '',
                            obsv: a.obsv || '',
                            hora_e: a.hora_e && a.hora_e !== '00:00:00' ? a.hora_e : '',
                            hora_s: a.hora_s || ''
                          });
                        }}>
                          <IconoFa icono={faPen} /> Editar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Justificación */}
      {justificando && (
        <div className="asist-modal-overlay" onClick={function () { setJustificando(null); setModoJustif('unico'); }}>
          <div className="asist-modal" onClick={function (e) { e.stopPropagation(); }}>
            <h4>Editar Asistencia — {formatFecha(justificando.fecha)}</h4>

            {/* Toggle modo: Día único / Rango de fechas */}
            <div className="asist-modo-toggle">
              <button className={'asist-modo-btn' + (modoJustif === 'unico' ? ' activo' : '')}
                onClick={function () { setModoJustif('unico'); }}>
                Día único
              </button>
              <button className={'asist-modo-btn' + (modoJustif === 'rango' ? ' activo' : '')}
                onClick={function () { setModoJustif('rango'); }}>
                <IconoFa icono={faCalendarDays} /> Rango de fechas
              </button>
            </div>

            {/* Campos de rango (solo si modo rango) */}
            {modoJustif === 'rango' && (
              <div className="asist-modal-fila">
                <div className="asist-modal-campo">
                  <label className="det-label">Fecha Inicio</label>
                  <input className="det-input" type="date" value={rangoFechas.fecha_inicio}
                    onChange={function (e) { setRangoFechas(Object.assign({}, rangoFechas, { fecha_inicio: e.target.value })); }} />
                </div>
                <div className="asist-modal-campo">
                  <label className="det-label">Fecha Fin</label>
                  <input className="det-input" type="date" value={rangoFechas.fecha_fin}
                    onChange={function (e) { setRangoFechas(Object.assign({}, rangoFechas, { fecha_fin: e.target.value })); }} />
                </div>
              </div>
            )}
            {modoJustif === 'rango' && rangoFechas.fecha_inicio && rangoFechas.fecha_fin && rangoFechas.fecha_inicio <= rangoFechas.fecha_fin && (
              <p className="asist-rango-info">
                Total: <strong>{Math.round((new Date(rangoFechas.fecha_fin) - new Date(rangoFechas.fecha_inicio)) / 86400000) + 1}</strong> día(s)
              </p>
            )}

            <div className="asist-modal-campo">
              <label className="det-label">Motivo</label>
              <select className="det-select" value={datosJustif.id_catga}
                onChange={function (e) { setDatosJustif(Object.assign({}, datosJustif, { id_catga: e.target.value })); }}>
                <option value="">-- Seleccione --</option>
                {categoriasAsist.map(function (c) { return <option key={c.id} value={c.id}>{c.descrip}</option>; })}
              </select>
            </div>
            <div className="asist-modal-fila">
              <div className="asist-modal-campo">
                <label className="det-label">Hora Entrada</label>
                <input className="det-input" type="time" value={datosJustif.hora_e}
                  onChange={function (e) { setDatosJustif(Object.assign({}, datosJustif, { hora_e: e.target.value })); }} />
              </div>
              <div className="asist-modal-campo">
                <label className="det-label">Hora Salida</label>
                <input className="det-input" type="time" value={datosJustif.hora_s}
                  onChange={function (e) { setDatosJustif(Object.assign({}, datosJustif, { hora_s: e.target.value })); }} />
              </div>
            </div>
            <div className="asist-modal-campo">
              <label className="det-label">Observación</label>
              <textarea className="det-input asist-textarea" value={datosJustif.obsv}
                onChange={function (e) { setDatosJustif(Object.assign({}, datosJustif, { obsv: e.target.value })); }} />
            </div>
            <div className="asist-modal-botones">
              <button className="det-btn det-btn-guardar" onClick={guardarJustificacion}>
                <IconoFa icono={faFloppyDisk} /> Guardar
              </button>
              <button className="det-btn det-btn-cancelar" onClick={function () { setJustificando(null); setModoJustif('unico'); }}>
                <IconoFa icono={faXmark} /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
