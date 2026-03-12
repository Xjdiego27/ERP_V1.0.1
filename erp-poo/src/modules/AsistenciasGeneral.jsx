import { useState, useEffect, useRef, useCallback } from 'react';
import { faMagnifyingGlass, faFilter, faCalendarDays, faClockRotateLeft, faUserClock, faUserXmark, faUserCheck } from '@fortawesome/free-solid-svg-icons';
import IconoFa from '../components/IconoFa';
import { headersAuth, API_URL } from '../auth';
import '../styles/AsistenciasGeneral.css';

// Módulo ASISTENCIAS — Vista general de asistencia de todos los empleados
// Filtros: rango de fechas, fecha fija, nombre/DNI, área, departamento, cargo
export default function AsistenciasGeneral() {
  var [empleados, setEmpleados] = useState([]);
  var [resumenGlobal, setResumenGlobal] = useState({ asistencias: 0, tardanzas: 0, faltas: 0, min_tardanza: 0 });
  var [totalEmpleados, setTotalEmpleados] = useState(0);
  var [rango, setRango] = useState({ inicio: '', fin: '' });
  var [cargando, setCargando] = useState(false);

  // Filtros
  var hoy = new Date().toISOString().split('T')[0];
  var mesInicio = hoy.substring(0, 8) + '01';
  var [fechaInicio, setFechaInicio] = useState(mesInicio);
  var [fechaFin, setFechaFin] = useState(hoy);
  var [fechaFija, setFechaFija] = useState('');
  var [busqueda, setBusqueda] = useState('');
  var [filtroArea, setFiltroArea] = useState('');
  var [filtroDepart, setFiltroDepart] = useState('');
  var [filtroCargo, setFiltroCargo] = useState('');
  var [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'asistencia' | 'tardanza' | 'falta'
  var [modoFecha, setModoFecha] = useState('rango'); // 'rango' | 'fija'

  // Expandir detalle por empleado
  var [expandido, setExpandido] = useState(null);

  // Polling en tiempo real
  var [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  var pollingRef = useRef(null);
  var POLLING_INTERVAL = 15000; // 15 segundos

  // Catálogos
  var [areas, setAreas] = useState([]);
  var [departamentos, setDepartamentos] = useState([]);
  var [cargos, setCargos] = useState([]);

  // Obtener id_empresa del localStorage
  function getIdEmpresa() {
    try {
      var session = JSON.parse(localStorage.getItem('session'));
      return session && session.usuario ? (session.usuario.id_empresa || session.usuario.id_emp || 1) : 1;
    } catch (e) { return 1; }
  }

  // Cargar catálogos al montar (Promise.all — llamadas independientes)
  useEffect(function () {
    var abortCtrl = new AbortController();
    var signal = abortCtrl.signal;

    Promise.all([
      fetch(API_URL + '/areas', { headers: headersAuth(), signal: signal }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/departamentos', { headers: headersAuth(), signal: signal }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/cargos', { headers: headersAuth(), signal: signal }).then(function (r) { return r.json(); }),
    ]).then(function (res) {
      if (signal.aborted) return;
      setAreas(res[0]);
      setDepartamentos(res[1]);
      setCargos(res[2]);
    }).catch(function () {});

    return function () { abortCtrl.abort(); };
  }, []);

  // Función de carga — useCallback para estabilizar la referencia
  var cargarAsistencias = useCallback(function (silencioso) {
    if (!silencioso) setCargando(true);
    var params = 'id_empresa=' + getIdEmpresa();

    if (modoFecha === 'fija' && fechaFija) {
      params += '&fecha_fija=' + fechaFija;
    } else {
      if (fechaInicio) params += '&fecha_inicio=' + fechaInicio;
      if (fechaFin) params += '&fecha_fin=' + fechaFin;
    }
    if (busqueda) params += '&nombre=' + encodeURIComponent(busqueda);
    if (filtroArea) params += '&id_area=' + filtroArea;
    if (filtroDepart) params += '&id_depart=' + filtroDepart;
    if (filtroCargo) params += '&id_cargo=' + filtroCargo;

    fetch(API_URL + '/asistencia/general?' + params, { headers: headersAuth() })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        setEmpleados(data.empleados || []);
        setResumenGlobal(data.resumen_global || {});
        setTotalEmpleados(data.total_empleados || 0);
        setRango(data.rango || {});
        setCargando(false);
        setUltimaActualizacion(new Date());
      })
      .catch(function () {
        setEmpleados([]);
        setCargando(false);
      });
  }, [modoFecha, fechaFija, fechaInicio, fechaFin, busqueda, filtroArea, filtroDepart, filtroCargo]);

  // Cargar al montar + polling cada 15s
  useEffect(function () {
    cargarAsistencias();
    // Iniciar polling — refresca silenciosamente sin mostrar "Cargando..."
    pollingRef.current = setInterval(function () {
      cargarAsistencias(true);
    }, POLLING_INTERVAL);
    return function () {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [cargarAsistencias]);

  function toggleExpandir(id) {
    setExpandido(expandido === id ? null : id);
  }

  // Formato hora legible
  function formatHora(h) {
    if (!h || h === '00:00:00') return '—';
    return h.substring(0, 5);
  }

  return (
    <div className="asistg-pagina">
      {/* CABECERA */}
      <div className="asistg-cabecera">
        <h2 className="asistg-titulo">
          <IconoFa icono={faCalendarDays} /> Asistencias
          <span className="asistg-live-badge" title="Actualizando cada 15 segundos">
            <span className="live-dot"></span> EN VIVO
          </span>
        </h2>
        {ultimaActualizacion && (
          <span className="asistg-ultima-act">
            Última actualización: {ultimaActualizacion.toLocaleTimeString('es-PE')}
          </span>
        )}
        <div className="asistg-resumen-cards">
          <div className="asistg-stat-card stat-total">
            <IconoFa icono={faUserCheck} />
            <div>
              <span className="stat-num">{resumenGlobal.asistencias}</span>
              <span className="stat-label">Asistencias</span>
            </div>
          </div>
          <div className="asistg-stat-card stat-tardanzas">
            <IconoFa icono={faUserClock} />
            <div>
              <span className="stat-num">{resumenGlobal.tardanzas}</span>
              <span className="stat-label">Tardanzas</span>
            </div>
          </div>
          <div className="asistg-stat-card stat-faltas">
            <IconoFa icono={faUserXmark} />
            <div>
              <span className="stat-num">{resumenGlobal.faltas}</span>
              <span className="stat-label">Faltas</span>
            </div>
          </div>
          <div className="asistg-stat-card stat-empleados">
            <IconoFa icono={faClockRotateLeft} />
            <div>
              <span className="stat-num">{totalEmpleados}</span>
              <span className="stat-label">Empleados</span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="asistg-filtros-barra">
        {/* Modo de fecha */}
        <div className="asistg-modo-fecha">
          <button
            className={'modo-btn ' + (modoFecha === 'rango' ? 'activo' : '')}
            onClick={function () { setModoFecha('rango'); }}
          >Rango</button>
          <button
            className={'modo-btn ' + (modoFecha === 'fija' ? 'activo' : '')}
            onClick={function () { setModoFecha('fija'); }}
          >Fecha Fija</button>
        </div>

        {modoFecha === 'rango' ? (
          <div className="asistg-fechas">
            <input type="date" value={fechaInicio} onChange={function (e) { setFechaInicio(e.target.value); }} className="filtro-date" />
            <span className="fecha-sep">a</span>
            <input type="date" value={fechaFin} onChange={function (e) { setFechaFin(e.target.value); }} className="filtro-date" />
          </div>
        ) : (
          <div className="asistg-fechas">
            <input type="date" value={fechaFija} onChange={function (e) { setFechaFija(e.target.value); }} className="filtro-date" />
          </div>
        )}

        {/* Búsqueda por nombre */}
        <div className="asistg-buscador">
          <IconoFa icono={faMagnifyingGlass} clase="buscador-icono" />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={busqueda}
            onChange={function (e) { setBusqueda(e.target.value); }}
            className="buscador-input"
          />
        </div>

        {/* Filtros selectores */}
        <div className="asistg-selects">
          <IconoFa icono={faFilter} clase="filtros-icono" />
          <select className="filtro-select" value={filtroArea} onChange={function (e) { setFiltroArea(e.target.value); }}>
            <option value="">Todas las áreas</option>
            {areas.map(function (a) {
              return <option key={a.id} value={a.id}>{a.nombre}</option>;
            })}
          </select>
          <select className="filtro-select" value={filtroDepart} onChange={function (e) { setFiltroDepart(e.target.value); }}>
            <option value="">Todos los deptos.</option>
            {departamentos.map(function (d) {
              return <option key={d.id} value={d.id}>{d.nombre}</option>;
            })}
          </select>
          <select className="filtro-select" value={filtroCargo} onChange={function (e) { setFiltroCargo(e.target.value); }}>
            <option value="">Todos los cargos</option>
            {cargos.map(function (c) {
              return <option key={c.id} value={c.id}>{c.nombre}</option>;
            })}
          </select>
        </div>

        {/* Filtros por estado */}
        <div className="asistg-filtros-estado">
          <button className={'filtro-estado-btn' + (filtroEstado === 'todos' ? ' activo' : '')} onClick={function () { setFiltroEstado('todos'); }}>
            Todos
          </button>
          <button className={'filtro-estado-btn fest-asist' + (filtroEstado === 'asistencia' ? ' activo' : '')} onClick={function () { setFiltroEstado('asistencia'); }}>
            <IconoFa icono={faUserCheck} /> Asistencias
          </button>
          <button className={'filtro-estado-btn fest-tard' + (filtroEstado === 'tardanza' ? ' activo' : '')} onClick={function () { setFiltroEstado('tardanza'); }}>
            <IconoFa icono={faUserClock} /> Tardanzas
          </button>
          <button className={'filtro-estado-btn fest-falta' + (filtroEstado === 'falta' ? ' activo' : '')} onClick={function () { setFiltroEstado('falta'); }}>
            <IconoFa icono={faUserXmark} /> Faltas
          </button>
        </div>

        <button className="asistg-btn-buscar" onClick={cargarAsistencias}>
          Consultar
        </button>
      </div>

      {/* RANGO MOSTRADO */}
      {rango.inicio && (
        <p className="asistg-rango-info">
          Mostrando del <strong>{rango.inicio}</strong> al <strong>{rango.fin}</strong>
        </p>
      )}

      {/* LOADING */}
      {cargando && <p className="asistg-cargando">Cargando asistencias...</p>}

      {/* TABLA DE EMPLEADOS */}
      {!cargando && empleados.length === 0 && (
        <p className="asistg-vacio">No se encontraron registros con los filtros seleccionados.</p>
      )}

      {!cargando && empleados.length > 0 && (function () {
        // Filtrado local en tiempo real por nombre o DNI
        var texto = (busqueda || '').trim().toLowerCase();
        var empleadosFiltrados = empleados;
        // Filtro por estado
        if (filtroEstado === 'asistencia') {
          empleadosFiltrados = empleadosFiltrados.filter(function (emp) { return emp.asistencias > 0 && emp.tardanzas === 0 && emp.faltas === 0; });
        } else if (filtroEstado === 'tardanza') {
          empleadosFiltrados = empleadosFiltrados.filter(function (emp) { return emp.tardanzas > 0; });
        } else if (filtroEstado === 'falta') {
          empleadosFiltrados = empleadosFiltrados.filter(function (emp) { return emp.faltas > 0; });
        }
        // Filtro por texto
        if (texto) {
          empleadosFiltrados = empleadosFiltrados.filter(function (emp) {
            return emp.nombre.toLowerCase().indexOf(texto) !== -1
              || (emp.dni || '').toLowerCase().indexOf(texto) !== -1;
          });
        }

        return empleadosFiltrados.length === 0
          ? <p className="asistg-vacio">No se encontraron empleados con "{busqueda}".</p>
          : (
        <div className="asistg-tabla-wrapper">
          {/* Cabecera de columnas */}
          <div className="asistg-header-row">
            <span className="asistg-hcol hcol-foto"></span>
            <span className="asistg-hcol hcol-nombre">Empleado</span>
            <span className="asistg-hcol hcol-dato hide-mobile">Área</span>
            <span className="asistg-hcol hcol-dato hide-mobile">Departamento</span>
            <span className="asistg-hcol hcol-dato hide-mobile">Cargo</span>
            <span className="asistg-hcol hcol-horario hide-mobile">Horario</span>
            <span className="asistg-hcol hcol-num">Asist.</span>
            <span className="asistg-hcol hcol-num">Tard.</span>
            <span className="asistg-hcol hcol-num">Faltas</span>
            <span className="asistg-hcol hcol-num">Min.</span>
          </div>

          {/* Filas de empleados */}
          {empleadosFiltrados.map(function (emp) {
                var isOpen = expandido === emp.id_personal;
                // Clase de color según estado dominante
                var claseEstado = '';
                if (emp.faltas > 0 && emp.faltas >= emp.asistencias) claseEstado = 'fila-emp-falta';
                else if (emp.tardanzas > 0 && emp.tardanzas > emp.faltas) claseEstado = 'fila-emp-tardanza';
                else if (emp.asistencias > 0) claseEstado = 'fila-emp-asistio';
                return (
                  <div key={emp.id_personal} className={'asistg-fila-grupo ' + claseEstado}>
                      {/* Fila principal del empleado */}
                      <div className={'asistg-fila-emp ' + (isOpen ? 'abierto' : '')} onClick={function () { toggleExpandir(emp.id_personal); }}>
                        <div className="asistg-emp-foto">
                          {emp.foto ? (
                            <img src={'/assets/perfiles/' + emp.foto} alt="" />
                          ) : (
                            <span className="foto-placeholder">👤</span>
                          )}
                        </div>
                        <span className="asistg-emp-nombre">{emp.nombre}</span>
                        <span className="asistg-emp-dato hide-mobile">{emp.area}</span>
                        <span className="asistg-emp-dato hide-mobile">{emp.departamento}</span>
                        <span className="asistg-emp-dato hide-mobile">{emp.cargo}</span>
                        <span className="asistg-emp-horario hide-mobile">{emp.horario_descrip || emp.horario_rango || emp.horario_nombre || 'Sin horario'}</span>
                        <span className="asistg-emp-num num-asist">{emp.asistencias}</span>
                        <span className="asistg-emp-num num-tard">{emp.tardanzas}</span>
                        <span className="asistg-emp-num num-faltas">{emp.faltas}</span>
                        <span className="asistg-emp-num num-min">{emp.min_tardanza}</span>
                      </div>

                      {/* Detalle expandido — días */}
                      {isOpen && emp.dias && emp.dias.length > 0 && (
                        <div className="asistg-detalle">
                          <table className="asistg-detalle-tabla">
                            <thead>
                              <tr>
                                <th>Fecha</th>
                                <th>Día</th>
                                <th>Entrada</th>
                                <th>Salida</th>
                                <th>Tardanza</th>
                                <th>Categoría</th>
                              </tr>
                            </thead>
                            <tbody>
                              {emp.dias.map(function (dia) {
                                var clase = '';
                                if (dia.es_descanso) clase = 'fila-descanso';
                                else if (dia.es_falta) clase = 'fila-falta';
                                else if (dia.min_tardanza > 0) clase = 'fila-tardanza';
                                else if (!dia.hora_e && !dia.es_falta) clase = 'fila-pendiente';
                                else if (dia.hora_e) clase = 'fila-asistio';
                                return (
                                  <tr key={dia.fecha} className={clase}>
                                    <td>{dia.fecha}</td>
                                    <td>{dia.dia}</td>
                                    <td>{formatHora(dia.hora_e)}</td>
                                    <td>{formatHora(dia.hora_s)}</td>
                                    <td>{dia.min_tardanza > 0 ? dia.min_tardanza + ' min' : '—'}</td>
                                    <td>
                                      <span className={'catga-badge catga-' + (dia.categoria || 'vacio').toLowerCase().replace(/\s/g, '')}>
                                        {dia.categoria || (dia.es_descanso ? 'DESCANSO' : '—')}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                  </div>
                );
              })}
        </div>
          );
      })()}
    </div>
  );
}
