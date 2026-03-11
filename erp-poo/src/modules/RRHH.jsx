import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { faPerson, faPersonDress, faPlus, faMagnifyingGlass, faFilter } from '@fortawesome/free-solid-svg-icons';
import IconoFa from '../components/IconoFa';
import { headersAuth, API_URL } from '../auth';
import '../styles/RRHH.css';

// Módulo Personal — Vista de tarjetas tipo ficha
// Tarjetas con: foto, nombre, DNI, Área > Departamento > Cargo, celular, correo, etc.
// Filtros: búsqueda texto, área, departamento, toggle activos/bloqueados
export default function RRHH() {
  var [personal, setPersonal] = useState([]);
  var [busqueda, setBusqueda] = useState('');
  var [soloActivos, setSoloActivos] = useState(true);
  var [filtroArea, setFiltroArea] = useState('');
  var [filtroDepart, setFiltroDepart] = useState('');
  var [areas, setAreas] = useState([]);
  var [departamentos, setDepartamentos] = useState([]);
  var navigate = useNavigate();

  // Cargar lista + catálogos al montar
  useEffect(function () {
    var abortCtrl = new AbortController();
    var signal = abortCtrl.signal;

    fetch(API_URL + '/personal', { headers: headersAuth(), signal: signal })
      .then(function (res) { return res.json(); })
      .then(function (data) { if (!signal.aborted) setPersonal(data); })
      .catch(function (err) { if (!signal.aborted) setPersonal([]); });

    fetch(API_URL + '/areas', { headers: headersAuth(), signal: signal })
      .then(function (res) { return res.json(); })
      .then(function (data) { if (!signal.aborted) setAreas(data); })
      .catch(function () {});

    fetch(API_URL + '/departamentos', { headers: headersAuth(), signal: signal })
      .then(function (res) { return res.json(); })
      .then(function (data) { if (!signal.aborted) setDepartamentos(data); })
      .catch(function () {});

    return function () { abortCtrl.abort(); };
  }, []);

  // Filtrar por texto + área + departamento + estado
  var personalFiltrado = personal.filter(function (p) {
    var texto = busqueda.toLowerCase();
    var nombre = (p.nombres + ' ' + p.ape_paterno + ' ' + p.ape_materno).toLowerCase();
    var dni = (p.num_doc || '').toLowerCase();
    var area = (p.area || '').toLowerCase();
    var coincideTexto = nombre.indexOf(texto) !== -1 || dni.indexOf(texto) !== -1 || area.indexOf(texto) !== -1;

    // Filtro por área seleccionada
    var coincideArea = !filtroArea || String(p.id_area) === String(filtroArea);

    // Filtro por departamento seleccionado
    var coincideDepart = !filtroDepart || String(p.id_depart) === String(filtroDepart);

    // Filtro estado
    if (soloActivos) {
      return coincideTexto && coincideArea && coincideDepart && p.estado === 'ACTIVO';
    }
    return coincideTexto && coincideArea && coincideDepart && p.estado !== 'ACTIVO';
  });

  // Contar totales solo de empleados ACTIVOS
  var activos = personal.filter(function (p) { return p.estado === 'ACTIVO'; });
  var totalH = activos.filter(function (p) { return p.genero === 'M'; }).length;
  var totalM = activos.filter(function (p) { return p.genero === 'F'; }).length;

  function irAlDetalle(id) {
    navigate('/dashboard/personal/' + id);
  }

  function claseEstado(estado) {
    if (estado === 'ACTIVO') return 'estado-activo';
    return 'estado-inactivo';
  }

  return (
    <div className="personal-pagina">

      {/* === FILA 1: Título + Buscador + Stats === */}
      <div className="personal-cabecera">
        <h2 className="personal-titulo">PERSONAL</h2>

        <div className="personal-buscador">
          <IconoFa icono={faMagnifyingGlass} clase="buscador-icono" />
          <input
            className="buscador-input"
            type="text"
            placeholder="Buscar por nombre, DNI o área..."
            value={busqueda}
            onChange={function (e) { setBusqueda(e.target.value); }}
          />
        </div>

        <div className="personal-stats">
          <span className="stat-total">Total: <strong>{activos.length}</strong></span>
          <span className="stat-h">
            <IconoFa icono={faPerson} /> <strong>{totalH}</strong>
          </span>
          <span className="stat-m">
            <IconoFa icono={faPersonDress} /> <strong>{totalM}</strong>
          </span>
        </div>
      </div>

      {/* === FILA 2: Botón Nuevo + Filtros + Toggle === */}
      <div className="personal-barra">
        <button className="personal-btn-nuevo" onClick={function () { navigate('/dashboard/personal/nuevo'); }}>
          <IconoFa icono={faPlus} /> Nuevo
        </button>

        {/* Filtros por Área y Departamento */}
        <div className="personal-filtros">
          <IconoFa icono={faFilter} clase="filtros-icono" />
          <select
            className="filtro-select"
            value={filtroArea}
            onChange={function (e) { setFiltroArea(e.target.value); }}
          >
            <option value="">Todas las Áreas</option>
            {areas.map(function (a) {
              return <option key={a.id} value={a.id}>{a.nombre}</option>;
            })}
          </select>
          <select
            className="filtro-select"
            value={filtroDepart}
            onChange={function (e) { setFiltroDepart(e.target.value); }}
          >
            <option value="">Todos los Deptos</option>
            {departamentos.map(function (d) {
              return <option key={d.id} value={d.id}>{d.nombre}</option>;
            })}
          </select>
        </div>

        <div className="personal-toggle">
          <span className="toggle-label">{soloActivos ? 'ACTIVOS' : 'BLOQUEADOS'}</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={soloActivos}
              onChange={function () { setSoloActivos(!soloActivos); }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* === GRID DE TARJETAS === */}
      <div className="personal-grid">
        {personalFiltrado.length === 0 && (
          <p className="personal-vacio">No se encontraron empleados.</p>
        )}

        {personalFiltrado.map(function (emp) {
          return (
            <div
              key={emp.id}
              className="tarjeta-empleado"
              role="button"
              tabIndex={0}
              onClick={function () { irAlDetalle(emp.id); }}
              onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); irAlDetalle(emp.id); } }}
            >
              {/* Parte superior: foto centrada */}
              <div className="tarjeta-superior">
                <div className={'tarjeta-foto ' + claseEstado(emp.estado)}>
                  {emp.foto ? (
                    <img src={'/assets/perfiles/' + emp.foto} alt={emp.nombres} />
                  ) : (
                    <div className="tarjeta-foto-vacia">
                      {emp.nombres.charAt(0) + emp.ape_paterno.charAt(0)}
                    </div>
                  )}
                </div>

                <div className={'tarjeta-genero ' + (emp.genero === 'M' ? 'genero-hombre' : 'genero-mujer')}>
                  <IconoFa icono={emp.genero === 'M' ? faPerson : faPersonDress} />
                </div>
              </div>

              {/* Parte inferior: datos del empleado */}
              <div className="tarjeta-datos">
                <h4 className="tarjeta-nombre">{emp.nombres}</h4>
                <p className="tarjeta-apellidos">{emp.ape_paterno + ' ' + emp.ape_materno}</p>

                <div className="tarjeta-separador"></div>

                {/* DNI */}
                <div className="tarjeta-fila">
                  <span className="tarjeta-label">{emp.tipo_doc || 'DNI'}</span>
                  <span className="tarjeta-valor">{emp.num_doc}</span>
                </div>

                {/* Bloque Área > Departamento > Cargo juntos */}
                <div className="tarjeta-fila">
                  <span className="tarjeta-label">Área</span>
                  <span className="tarjeta-valor">{emp.area || '—'}</span>
                </div>
                <div className="tarjeta-fila">
                  <span className="tarjeta-label">Depto</span>
                  <span className="tarjeta-valor">{emp.departamento || '—'}</span>
                </div>
                <div className="tarjeta-fila">
                  <span className="tarjeta-label">Cargo</span>
                  <span className="tarjeta-valor">{emp.cargo || '—'}</span>
                </div>

                {/* Contacto */}
                <div className="tarjeta-fila">
                  <span className="tarjeta-label">Celular</span>
                  <span className="tarjeta-valor">{emp.celular || '—'}</span>
                </div>
                <div className="tarjeta-fila">
                  <span className="tarjeta-label">Correo</span>
                  <span className="tarjeta-valor tarjeta-valor-largo">{emp.email || '—'}</span>
                </div>
                <div className="tarjeta-fila">
                  <span className="tarjeta-label">F. Ingreso</span>
                  <span className="tarjeta-valor">{emp.fech_ingreso || '—'}</span>
                </div>

                {/* Estado */}
                <span className={'tarjeta-estado ' + claseEstado(emp.estado)}>
                  {emp.estado || 'Sin estado'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
