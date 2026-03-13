import { useState, useEffect } from 'react';
import { faClock, faMagnifyingGlass, faPlus, faPen, faFloppyDisk, faXmark, faUsers, faCheck, faUser } from '@fortawesome/free-solid-svg-icons';
import IconoFa from '../components/IconoFa';
import { headersAuth, API_URL } from '../auth';
import '../styles/HorariosRRHH.css';

var DIA_NOMBRE = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function HorariosRRHH() {
  var [horarios, setHorarios] = useState([]);
  var [personal, setPersonal] = useState([]);
  var [busqueda, setBusqueda] = useState('');
  var [cargando, setCargando] = useState(true);

  // Modal crear/editar horario
  var [modalHorario, setModalHorario] = useState(false);
  var [editandoHorario, setEditandoHorario] = useState(null);
  var [formNombre, setFormNombre] = useState('');
  var [formDescrip, setFormDescrip] = useState('');
  var [formDias, setFormDias] = useState(diasVacios());

  // Selección múltiple para asignación masiva
  var [seleccionados, setSeleccionados] = useState([]);
  var [horarioMasivo, setHorarioMasivo] = useState('');

  function diasVacios() {
    return [1, 2, 3, 4, 5, 6, 7].map(function (d) {
      return { dia: d, hora_e: '08:00', hora_s: '17:30', descanso: d === 7 };
    });
  }

  function getIdEmpresa() {
    try {
      var session = JSON.parse(localStorage.getItem('session'));
      return session && session.usuario ? (session.usuario.id_empresa || 1) : 1;
    } catch (e) { return 1; }
  }

  // Cargar datos al montar
  useEffect(function () {
    cargarDatos();
  }, []);

  function cargarDatos() {
    setCargando(true);
    Promise.all([
      fetch(API_URL + '/horarios', { headers: headersAuth() }).then(function (r) { return r.json(); }),
      fetch(API_URL + '/horarios/personal', { headers: headersAuth() }).then(function (r) { return r.json(); })
    ]).then(function (res) {
      setHorarios(res[0] || []);
      setPersonal(res[1] || []);
      setCargando(false);
    }).catch(function () { setCargando(false); });
  }

  // Filtro local por texto
  var personalFiltrado = personal.filter(function (p) {
    var texto = busqueda.toLowerCase();
    return p.nombre.toLowerCase().indexOf(texto) !== -1
      || (p.dni || '').toLowerCase().indexOf(texto) !== -1
      || (p.cargo || '').toLowerCase().indexOf(texto) !== -1;
  });

  // Abrir modal para crear
  function abrirCrear() {
    setEditandoHorario(null);
    setFormNombre('');
    setFormDescrip('');
    setFormDias(diasVacios());
    setModalHorario(true);
  }

  // Abrir modal para editar
  function abrirEditar(h) {
    setEditandoHorario(h);
    setFormNombre(h.nombre);
    setFormDescrip(h.descrip || '');
    var dias = [1, 2, 3, 4, 5, 6, 7].map(function (num) {
      var existe = h.dias.find(function (d) { return d.dia === num; });
      if (existe) {
        return {
          dia: num,
          hora_e: existe.hora_e ? existe.hora_e.substring(0, 5) : '08:00',
          hora_s: existe.hora_s ? existe.hora_s.substring(0, 5) : '17:30',
          descanso: existe.descanso
        };
      }
      return { dia: num, hora_e: '08:00', hora_s: '17:30', descanso: false };
    });
    setFormDias(dias);
    setModalHorario(true);
  }

  // Guardar horario (crear o editar)
  function guardarHorario() {
    var diasPayload = formDias.map(function (d) {
      return {
        dia: d.dia,
        hora_e: d.descanso ? null : d.hora_e + ':00',
        hora_s: d.descanso ? null : d.hora_s + ':00',
        descanso: d.descanso
      };
    });

    var url, method, body;
    if (editandoHorario) {
      url = API_URL + '/horarios/' + editandoHorario.id;
      method = 'PUT';
      body = JSON.stringify({ nombre: formNombre, descrip: formDescrip, dias: diasPayload });
    } else {
      url = API_URL + '/horarios';
      method = 'POST';
      body = JSON.stringify({ nombre: formNombre, descrip: formDescrip, id_empresa: getIdEmpresa(), dias: diasPayload });
    }

    fetch(url, { method: method, headers: { ...headersAuth(), 'Content-Type': 'application/json' }, body: body })
      .then(function (r) { return r.json(); })
      .then(function () {
        setModalHorario(false);
        cargarDatos();
      });
  }

  // Asignar horario individual
  function asignarHorario(idPersonal, idHorario) {
    fetch(API_URL + '/horarios/asignar', {
      method: 'PUT',
      headers: { ...headersAuth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_personal: idPersonal, id_horario: parseInt(idHorario) })
    })
      .then(function (r) { return r.json(); })
      .then(function () { cargarDatos(); });
  }

  // Toggle selección
  function toggleSeleccion(id) {
    if (seleccionados.indexOf(id) !== -1) {
      setSeleccionados(seleccionados.filter(function (s) { return s !== id; }));
    } else {
      setSeleccionados(seleccionados.concat([id]));
    }
  }

  function seleccionarTodos() {
    if (seleccionados.length === personalFiltrado.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(personalFiltrado.map(function (p) { return p.id_personal; }));
    }
  }

  // Asignación masiva
  function asignarMasivo() {
    if (!horarioMasivo || seleccionados.length === 0) return;
    fetch(API_URL + '/horarios/asignar-masivo', {
      method: 'PUT',
      headers: { ...headersAuth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids_personal: seleccionados, id_horario: parseInt(horarioMasivo) })
    })
      .then(function (r) { return r.json(); })
      .then(function () {
        setSeleccionados([]);
        setHorarioMasivo('');
        cargarDatos();
      });
  }

  // Cambiar campo de un día en el form
  function cambiarDia(index, campo, valor) {
    var copia = formDias.map(function (d, i) {
      if (i === index) {
        var nuevo = Object.assign({}, d);
        nuevo[campo] = valor;
        return nuevo;
      }
      return d;
    });
    setFormDias(copia);
  }

  function formatHora(h) {
    if (!h) return '—';
    return h.length > 5 ? h.substring(0, 5) : h;
  }

  return (
    <div className="horarios-pagina">

      {/* CABECERA */}
      <div className="horarios-cabecera">
        <h2 className="horarios-titulo">
          <IconoFa icono={faClock} /> HORARIOS
        </h2>
        <button className="horarios-btn-crear" onClick={abrirCrear}>
          <IconoFa icono={faPlus} /> Nuevo Horario
        </button>
      </div>

      {/* HORARIOS EXISTENTES */}
      <div className="horarios-lista">
        {horarios.map(function (h) {
          return (
            <div key={h.id} className="horario-card">
              <div className="horario-card-header">
                <div>
                  <strong>{h.nombre}</strong>
                  <span className="horario-card-desc">{h.descrip}</span>
                </div>
                <button className="horario-btn-edit" onClick={function () { abrirEditar(h); }}>
                  <IconoFa icono={faPen} />
                </button>
              </div>
              <div className="horario-card-dias">
                {h.dias.map(function (d) {
                  return (
                    <div key={d.dia} className={'horario-dia ' + (d.descanso ? 'dia-descanso' : '')}>
                      <span className="dia-label">{DIA_NOMBRE[d.dia].substring(0, 3)}</span>
                      {d.descanso
                        ? <span className="dia-libre">Libre</span>
                        : <span className="dia-horas">{formatHora(d.hora_e)} - {formatHora(d.hora_s)}</span>
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* BARRA DE ASIGNACIÓN */}
      <div className="horarios-asignar-barra">
        <div className="horarios-buscador">
          <IconoFa icono={faMagnifyingGlass} clase="buscador-icono" />
          <input
            type="text"
            placeholder="Buscar trabajador por nombre, DNI o cargo..."
            value={busqueda}
            onChange={function (e) { setBusqueda(e.target.value); }}
            className="buscador-input"
          />
        </div>

        {seleccionados.length > 0 && (
          <div className="horarios-masivo">
            <IconoFa icono={faUsers} />
            <span>{seleccionados.length} seleccionado(s)</span>
            <select value={horarioMasivo} onChange={function (e) { setHorarioMasivo(e.target.value); }} className="masivo-select">
              <option value="">Asignar horario...</option>
              {horarios.map(function (h) {
                return <option key={h.id} value={h.id}>{h.nombre}</option>;
              })}
            </select>
            <button className="masivo-btn" onClick={asignarMasivo} disabled={!horarioMasivo}>
              <IconoFa icono={faCheck} /> Aplicar
            </button>
          </div>
        )}
      </div>

      {/* TABLA DE PERSONAL */}
      {cargando && <p className="horarios-cargando">Cargando...</p>}

      {!cargando && (
        <div className="horarios-tabla-wrapper">
          <table className="horarios-tabla">
            <thead>
              <tr>
                <th className="col-check">
                  <input type="checkbox"
                    checked={seleccionados.length === personalFiltrado.length && personalFiltrado.length > 0}
                    onChange={seleccionarTodos}
                  />
                </th>
                <th className="col-foto"></th>
                <th>Trabajador</th>
                <th>DNI</th>
                <th>Cargo</th>
                <th>Horario Actual</th>
                <th>Cambiar Horario</th>
              </tr>
            </thead>
            <tbody>
              {personalFiltrado.map(function (emp) {
                var checked = seleccionados.indexOf(emp.id_personal) !== -1;
                return (
                  <tr key={emp.id_personal} className={checked ? 'fila-seleccionada' : ''}>
                    <td className="col-check">
                      <input type="checkbox" checked={checked} onChange={function () { toggleSeleccion(emp.id_personal); }} />
                    </td>
                    <td className="col-foto">
                      {emp.foto
                        ? <img src={'/assets/perfiles/' + emp.foto} alt="" className="mini-foto" />
                        : <span className="mini-foto-placeholder"><IconoFa icono={faUser} /></span>
                      }
                    </td>
                    <td className="td-nombre">{emp.nombre}</td>
                    <td>{emp.dni}</td>
                    <td>{emp.cargo || '—'}</td>
                    <td>
                      <span className="badge-horario">{emp.horario_nombre}</span>
                    </td>
                    <td>
                      <select
                        value={emp.id_horario}
                        onChange={function (e) { asignarHorario(emp.id_personal, e.target.value); }}
                        className="select-horario"
                      >
                        {horarios.map(function (h) {
                          return <option key={h.id} value={h.id}>{h.nombre}</option>;
                        })}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL CREAR/EDITAR HORARIO */}
      {modalHorario && (
        <div className="modal-overlay" onClick={function () { setModalHorario(false); }}>
          <div className="modal-horario" onClick={function (e) { e.stopPropagation(); }}>
            <div className="modal-header">
              <h3>{editandoHorario ? 'Editar Horario' : 'Nuevo Horario'}</h3>
              <button className="modal-cerrar" onClick={function () { setModalHorario(false); }}>
                <IconoFa icono={faXmark} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-campo">
                <label>Nombre</label>
                <input type="text" value={formNombre} onChange={function (e) { setFormNombre(e.target.value); }}
                  placeholder="Ej: Horario Gerencia" />
              </div>
              <div className="modal-campo">
                <label>Descripción</label>
                <input type="text" value={formDescrip} onChange={function (e) { setFormDescrip(e.target.value); }}
                  placeholder="Ej: Lun-Vie 09:00-18:00" />
              </div>

              <table className="modal-tabla-dias">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Descanso</th>
                  </tr>
                </thead>
                <tbody>
                  {formDias.map(function (d, i) {
                    return (
                      <tr key={d.dia} className={d.descanso ? 'fila-descanso' : ''}>
                        <td><strong>{DIA_NOMBRE[d.dia]}</strong></td>
                        <td>
                          <input type="time" value={d.hora_e} disabled={d.descanso}
                            onChange={function (e) { cambiarDia(i, 'hora_e', e.target.value); }} />
                        </td>
                        <td>
                          <input type="time" value={d.hora_s} disabled={d.descanso}
                            onChange={function (e) { cambiarDia(i, 'hora_s', e.target.value); }} />
                        </td>
                        <td>
                          <input type="checkbox" checked={d.descanso}
                            onChange={function (e) { cambiarDia(i, 'descanso', e.target.checked); }} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button className="modal-btn-cancelar" onClick={function () { setModalHorario(false); }}>Cancelar</button>
              <button className="modal-btn-guardar" onClick={guardarHorario} disabled={!formNombre.trim()}>
                <IconoFa icono={faFloppyDisk} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
