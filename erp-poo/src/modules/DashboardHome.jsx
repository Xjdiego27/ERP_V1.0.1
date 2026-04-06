import { useState, useEffect } from 'react';
import { API_URL, headersAuth } from '../auth';
import IconoFa from '../components/IconoFa';
import { faLaptop, faPhone, faDesktop, faTablet, faPrint, faKeyboard } from '@fortawesome/free-solid-svg-icons';
import '../styles/DashboardHome.css';

// Mapa de iconos por tipo de equipo
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

function formatFecha(f) {
  if (!f) return '';
  var p = f.split('-');
  if (p.length !== 3) return f;
  return p[2] + '/' + p[1] + '/' + p[0];
}

export default function DashboardHome() {
  var [equipos, setEquipos] = useState([]);
  var [telefonos, setTelefonos] = useState([]);
  var [cargando, setCargando] = useState(true);

  useEffect(function () {
    fetch(API_URL + '/dashboard/mi-panel', { headers: headersAuth() })
      .then(function (r) { return r.ok ? r.json() : { equipos: [], telefonos: [] }; })
      .then(function (data) {
        setEquipos(data.equipos || []);
        setTelefonos(data.telefonos || []);
      })
      .catch(function () {
        setEquipos([]);
        setTelefonos([]);
      })
      .finally(function () { setCargando(false); });
  }, []);

  var tieneItems = equipos.length > 0 || telefonos.length > 0;

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-welcome-card">
          <h1 className="home-titulo">Bienvenido</h1>
          <p className="home-subtitulo">Selecciona una opción del menú para comenzar</p>
        </div>

        {/* ═══ Mis Equipos Asignados ═══ */}
        {!cargando && tieneItems && (
          <div className="mi-panel-wrapper">
            {equipos.length > 0 && (
              <div className="mi-panel-seccion">
                <div className="mi-panel-titulo">
                  <IconoFa icono={faLaptop} /> Mis Equipos Asignados
                </div>
                <div className="mi-panel-grid">
                  {equipos.map(function (eq) {
                    return (
                      <div className="mi-panel-card" key={'eq-' + eq.id_equipo}>
                        <div className="mi-panel-card-icono equipo">
                          <IconoFa icono={iconoEquipo(eq.tipo)} />
                        </div>
                        <div className="mi-panel-card-body">
                          <div className="mi-panel-card-titulo">
                            {eq.marca ? eq.marca + ' ' + (eq.modelo || '') : eq.tipo || 'Equipo'}
                          </div>
                          <div className="mi-panel-card-detalle">
                            {eq.tipo && <span><strong>Tipo:</strong> {eq.tipo}</span>}
                            {eq.serie && <span><strong>Serie:</strong> {eq.serie}</span>}
                            {eq.fecha_asig && (
                              <span className="mi-panel-card-fecha">
                                Asignado: {formatFecha(eq.fecha_asig)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {telefonos.length > 0 && (
              <div className="mi-panel-seccion">
                <div className="mi-panel-titulo">
                  <IconoFa icono={faPhone} /> Mis Líneas Telefónicas
                </div>
                <div className="mi-panel-grid">
                  {telefonos.map(function (tel) {
                    return (
                      <div className="mi-panel-card" key={'tel-' + tel.id_chip}>
                        <div className="mi-panel-card-icono telefono">
                          <IconoFa icono={faPhone} />
                        </div>
                        <div className="mi-panel-card-body">
                          <div className="mi-panel-card-titulo">{tel.numero}</div>
                          <div className="mi-panel-card-detalle">
                            {tel.operador && <span><strong>Operador:</strong> {tel.operador}</span>}
                            {tel.plan && <span><strong>Plan:</strong> {tel.plan}</span>}
                            {tel.fecha_asig && (
                              <span className="mi-panel-card-fecha">
                                Asignado: {formatFecha(tel.fecha_asig)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
