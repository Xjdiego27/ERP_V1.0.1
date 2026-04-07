import { useState, useEffect } from 'react';
import { API_URL, headersAuth } from '../auth';
import IconoFa from '../components/IconoFa';
import { faLaptop, faPhone, faDesktop, faTablet, faPrint, faKeyboard, faKey, faTicket, faChevronLeft, faChevronRight, faCalendarDays, faMicrochip, faMemory, faHardDrive, faBarcode, faStar } from '@fortawesome/free-solid-svg-icons';
import '../styles/DashboardHome.css';

var ICONOS_EQUIPO = {
  'LAPTOP': faLaptop,
  'COMPUTADORA': faDesktop,
  'DESKTOP': faDesktop,
  'TABLET': faTablet,
  'IMPRESORA': faPrint,
  'TECLADO': faKeyboard,
};

function iconoEquipo(tipo) {
  if (!tipo) return faLaptop;
  var t = tipo.toUpperCase();
  for (var clave in ICONOS_EQUIPO) {
    if (t.indexOf(clave) >= 0) return ICONOS_EQUIPO[clave];
  }
  return faLaptop;
}

var MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
var DIAS_SEM = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function colorCategoria(cat, esFalta, esDescanso) {
  if (!cat && !esFalta && !esDescanso) return '';
  if (esDescanso) return 'descanso';
  if (esFalta) return 'falta';
  var c = (cat || '').toUpperCase();
  if (c === 'PUNTUAL') return 'puntual';
  if (c === 'TARDANZA') return 'tardanza';
  if (c === 'FERIADO') return 'feriado';
  if (c === 'LICENCIA' || c === 'PERMISO' || c === 'VACACIONES') return 'licencia-dia';
  if (c === 'AUSENTISMO') return 'falta';
  if (c === 'INCONSISTENCIA') return 'tardanza';
  if (c === 'DESCANSO') return 'descanso';
  return '';
}

export default function DashboardHome() {
  var [data, setData] = useState(null);
  var [cargando, setCargando] = useState(true);

  useEffect(function () {
    fetch(API_URL + '/dashboard/mi-panel', { headers: headersAuth() })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (d) { setData(d); })
      .catch(function () { setData({}); })
      .finally(function () { setCargando(false); });
  }, []);

  if (cargando) return <div className="dh-container"><p className="dh-loading">Cargando...</p></div>;

  var equipos = (data && data.equipos) || [];
  var telefonos = (data && data.telefonos) || [];
  var licencias = (data && data.licencias) || [];
  var asistencia = (data && data.asistencia) || [];
  var resumen = (data && data.resumen_asistencia) || {};
  var tickets = (data && data.tickets) || [];

  var hayItems = equipos.length > 0 || telefonos.length > 0 || licencias.length > 0;

  return (
    <div className="dh-container">
      <div className="dh-content">

        {/* ═══ ROW 1: Equipos asignados (lo primero que se ve) ═══ */}
        {hayItems && (
          <div className="dh-row-items">
            {equipos.length > 0 && (
              <SeccionItems titulo="Mis Equipos" icono={faLaptop} tipo="equipo">
                {equipos.map(function (eq) {
                  return (
                    <div className="dh-item-card dh-equipo-card" key={'eq-' + eq.id_equipo}>
                      <div className="dh-item-icon equipo"><IconoFa icono={iconoEquipo(eq.tipo)} /></div>
                      <div className="dh-item-body">
                        <div className="dh-item-name">{eq.marca ? eq.marca + ' ' + (eq.modelo || '') : eq.tipo || 'Equipo'}</div>
                        <div className="dh-item-meta">
                          {eq.tipo && <span>Tipo: <strong>{eq.tipo}</strong></span>}
                          {eq.serie && <span>Serie: <strong>{eq.serie}</strong></span>}
                          {eq.codigoe && <span><IconoFa icono={faBarcode} /> <strong>{eq.codigoe}</strong></span>}
                        </div>
                        {(eq.procesador || eq.ram || eq.almacenamiento && eq.almacenamiento.length > 0 || eq.gama) && (
                          <div className="dh-equipo-specs">
                            {eq.procesador && <span className="dh-spec-badge"><IconoFa icono={faMicrochip} /> {eq.procesador}</span>}
                            {eq.ram && <span className="dh-spec-badge"><IconoFa icono={faMemory} /> {eq.tipo_ram ? eq.tipo_ram + ' ' : ''}{eq.ram}</span>}
                            {eq.almacenamiento && eq.almacenamiento.map(function (alm, i) {
                              return <span className="dh-spec-badge" key={i}><IconoFa icono={faHardDrive} /> {alm}</span>;
                            })}
                            {eq.gama && <span className="dh-spec-badge gama"><IconoFa icono={faStar} /> {eq.gama}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </SeccionItems>
            )}

            {telefonos.length > 0 && (
              <SeccionItems titulo="Mis Líneas" icono={faPhone} tipo="telefono">
                {telefonos.map(function (tel) {
                  return (
                    <div className="dh-item-card" key={'tel-' + tel.id_chip}>
                      <div className="dh-item-icon telefono"><IconoFa icono={faPhone} /></div>
                      <div className="dh-item-body">
                        <div className="dh-item-name">{tel.numero}</div>
                        <div className="dh-item-meta">
                          {tel.operador && <span>Operador: <strong>{tel.operador}</strong></span>}
                          {tel.plan && <span>Plan: <strong>{tel.plan}</strong></span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </SeccionItems>
            )}

            {licencias.length > 0 && (
              <SeccionItems titulo="Mis Licencias" icono={faKey} tipo="licencia">
                {licencias.map(function (lic, i) {
                  return (
                    <div className="dh-item-card" key={'lic-' + i}>
                      <div className="dh-item-icon licencia"><IconoFa icono={faKey} /></div>
                      <div className="dh-item-body">
                        <div className="dh-item-name">{lic.nombre}</div>
                        <div className="dh-item-meta">
                          {lic.serie && <span>Key: <strong>{lic.serie}</strong></span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </SeccionItems>
            )}
          </div>
        )}

        {/* ═══ ROW 2: Calendario + Tickets ═══ */}
        <div className="dh-row-top">
          <CalendarioAsistencia asistencia={asistencia} resumen={resumen} />
          <TicketsActivos tickets={tickets} />
        </div>

      </div>
    </div>
  );
}


/* ─── Sección genérica de items ─── */
function SeccionItems(props) {
  return (
    <div className="dh-seccion-items">
      <div className="dh-seccion-header">
        <IconoFa icono={props.icono} /> <span>{props.titulo}</span>
      </div>
      <div className="dh-items-list">
        {props.children}
      </div>
    </div>
  );
}


/* ─── Calendario de asistencia ─── */
function CalendarioAsistencia(props) {
  var asistencia = props.asistencia || [];
  var resumen = props.resumen || {};

  var hoy = new Date();
  var [mes, setMes] = useState(hoy.getMonth() + 1);
  var [anio, setAnio] = useState(hoy.getFullYear());

  // Mapa fecha → info
  var mapaAsist = {};
  asistencia.forEach(function (d) { if (d.fecha) mapaAsist[d.fecha] = d; });

  // Primer día del mes → convertir a lunes=0
  var primerDia = new Date(anio, mes - 1, 1);
  var diaInicio = primerDia.getDay();
  diaInicio = diaInicio === 0 ? 6 : diaInicio - 1;

  var diasEnMes = new Date(anio, mes, 0).getDate();

  var celdas = [];
  for (var i = 0; i < diaInicio; i++) celdas.push(null);
  for (var d = 1; d <= diasEnMes; d++) celdas.push(d);

  var esHoy = function (dia) {
    return dia === hoy.getDate() && mes === hoy.getMonth() + 1 && anio === hoy.getFullYear();
  };

  function cambiarMes(dir) {
    var m = mes + dir;
    var a = anio;
    if (m < 1) { m = 12; a--; }
    if (m > 12) { m = 1; a++; }
    setMes(m); setAnio(a);
  }

  return (
    <div className="dh-calendario">
      <div className="dh-cal-header">
        <IconoFa icono={faCalendarDays} />
        <span className="dh-cal-titulo">Mi Asistencia</span>
      </div>

      <div className="dh-cal-nav">
        <button onClick={function () { cambiarMes(-1); }} className="dh-cal-btn"><IconoFa icono={faChevronLeft} /></button>
        <span className="dh-cal-mes">{MESES[mes]} {anio}</span>
        <button onClick={function () { cambiarMes(1); }} className="dh-cal-btn"><IconoFa icono={faChevronRight} /></button>
      </div>

      <div className="dh-cal-grid">
        {DIAS_SEM.map(function (ds) { return <div className="dh-cal-dow" key={ds}>{ds}</div>; })}
        {celdas.map(function (dia, idx) {
          if (dia === null) return <div className="dh-cal-empty" key={'e' + idx}></div>;

          var fechaStr = anio + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
          var info = mapaAsist[fechaStr];
          var cls = 'dh-cal-day';
          if (info) cls += ' ' + colorCategoria(info.categoria, info.es_falta, info.es_descanso);
          if (esHoy(dia)) cls += ' hoy';

          var tooltip = '';
          if (info) {
            if (info.es_descanso) tooltip = 'Descanso';
            else if (info.es_falta) tooltip = 'Falta';
            else if (info.categoria) tooltip = info.categoria;
            if (info.hora_e) tooltip += '\nEntrada: ' + info.hora_e.substring(0, 5);
            if (info.hora_s) tooltip += '\nSalida: ' + info.hora_s.substring(0, 5);
          }

          return <div className={cls} key={dia} title={tooltip}>{dia}</div>;
        })}
      </div>

      {/* Leyenda */}
      <div className="dh-cal-leyenda">
        <span className="dh-ley"><span className="dh-ley-dot puntual"></span>Puntual</span>
        <span className="dh-ley"><span className="dh-ley-dot tardanza"></span>Tardanza</span>
        <span className="dh-ley"><span className="dh-ley-dot falta"></span>Falta</span>
        <span className="dh-ley"><span className="dh-ley-dot feriado"></span>Feriado</span>
        <span className="dh-ley"><span className="dh-ley-dot descanso"></span>Descanso</span>
      </div>

      {/* Resumen */}
      <div className="dh-cal-resumen">
        <div className="dh-cal-stat">
          <span className="dh-cal-stat-num">{resumen.total_asistencias || 0}</span>
          <span className="dh-cal-stat-label">Asistencias</span>
        </div>
        <div className="dh-cal-stat">
          <span className="dh-cal-stat-num">{resumen.total_tardanzas || 0}</span>
          <span className="dh-cal-stat-label">Tardanzas</span>
        </div>
        <div className="dh-cal-stat">
          <span className="dh-cal-stat-num">{resumen.total_faltas || 0}</span>
          <span className="dh-cal-stat-label">Faltas</span>
        </div>
      </div>
    </div>
  );
}


/* ─── Tickets activos ─── */
function TicketsActivos(props) {
  var tickets = props.tickets || [];

  function badgeEstado(e) {
    if (e === 'ABIERTO') return 'abierto';
    if (e === 'ASIGNADO') return 'asignado';
    return '';
  }

  function badgePrioridad(p) {
    if (!p) return '';
    var pr = p.toUpperCase();
    if (pr === 'ALTA' || pr === 'URGENTE') return 'alta';
    if (pr === 'MEDIA') return 'media';
    return 'baja';
  }

  return (
    <div className="dh-tickets">
      <div className="dh-tk-header">
        <IconoFa icono={faTicket} />
        <span className="dh-tk-titulo">Mis Tickets Activos</span>
        {tickets.length > 0 && <span className="dh-tk-badge">{tickets.length}</span>}
      </div>

      {tickets.length === 0 ? (
        <div className="dh-tk-vacio">
          <p>No tienes tickets activos</p>
        </div>
      ) : (
        <div className="dh-tk-list">
          {tickets.map(function (tk) {
            return (
              <div className="dh-tk-card" key={tk.id_ticket}>
                <div className="dh-tk-top">
                  <span className="dh-tk-id">#{tk.id_ticket}</span>
                  <span className={'dh-tk-estado ' + badgeEstado(tk.estado)}>{tk.estado}</span>
                </div>
                <div className="dh-tk-asunto">{tk.asunto}</div>
                <div className="dh-tk-bottom">
                  {tk.categoria && <span className="dh-tk-cat">{tk.categoria}</span>}
                  {tk.prioridad && <span className={'dh-tk-prio ' + badgePrioridad(tk.prioridad)}>{tk.prioridad}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
