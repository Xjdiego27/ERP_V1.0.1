import { useState, useEffect } from 'react';
import { API_URL, headersConToken } from '../auth';
import IconoFa from '../components/IconoFa';
import PageContent from '../components/PageContent';
import {
    faShieldHalved, faSearch, faCheck, faTimes, faSpinner, faSave,
    faUserShield, faUsers, faExchangeAlt, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import '../styles/GestionPermisos.css';

export default function GestionPermisos() {
    var [datos, setDatos] = useState(null);         // {roles, submodulos}
    var [usuarios, setUsuarios] = useState([]);
    var [busqueda, setBusqueda] = useState('');
    var [guardando, setGuardando] = useState(null);  // id_rol del que se guarda
    var [guardandoUser, setGuardandoUser] = useState(null); // id_accs del usuario
    var [mensaje, setMensaje] = useState('');
    var [cambiosPendientes, setCambiosPendientes] = useState({});    // {id_rol: [id_perm, ...]}
    var [cambiosRol, setCambiosRol] = useState({});                  // {id_accs: nuevo_id_rol}

    useEffect(function () {
        cargarDatos();
    }, []);

    function cargarDatos() {
        Promise.all([
            fetch(API_URL + '/permisos/roles', { headers: headersConToken() }).then(function (r) { return r.json(); }),
            fetch(API_URL + '/permisos/usuarios', { headers: headersConToken() }).then(function (r) { return r.json(); }),
        ]).then(function (res) {
            setDatos(res[0]);
            setUsuarios(Array.isArray(res[1]) ? res[1] : []);
        }).catch(function () {});
    }

    if (!datos) return <PageContent><p>Cargando permisos...</p></PageContent>;

    var roles = datos.roles || [];
    var submodulos = datos.submodulos || [];

    // ══════════════════════════════════════
    //  LÓGICA SECCIÓN 1: ROLES × MÓDULOS
    // ══════════════════════════════════════

    function permisosDelRol(rol) {
        if (cambiosPendientes[rol.id_rol]) return cambiosPendientes[rol.id_rol];
        return rol.permisos || [];
    }

    function tienePermiso(rol, idPerm) {
        return permisosDelRol(rol).indexOf(idPerm) >= 0;
    }

    function togglePermiso(rol, idPerm) {
        var actuales = permisosDelRol(rol).slice();
        var idx = actuales.indexOf(idPerm);
        if (idx >= 0) { actuales.splice(idx, 1); } else { actuales.push(idPerm); }
        setCambiosPendientes(function (prev) {
            var n = Object.assign({}, prev);
            n[rol.id_rol] = actuales;
            return n;
        });
    }

    function marcarTodos(rol) {
        var todos = submodulos.map(function (s) { return s.id; });
        setCambiosPendientes(function (prev) {
            var n = Object.assign({}, prev);
            n[rol.id_rol] = todos;
            return n;
        });
    }

    function desmarcarTodos(rol) {
        setCambiosPendientes(function (prev) {
            var n = Object.assign({}, prev);
            n[rol.id_rol] = [];
            return n;
        });
    }

    function tieneCambios(rol) {
        if (!cambiosPendientes[rol.id_rol]) return false;
        var ori = (rol.permisos || []).slice().sort().join(',');
        var act = cambiosPendientes[rol.id_rol].slice().sort().join(',');
        return ori !== act;
    }

    async function guardarRol(rol) {
        var permisos = cambiosPendientes[rol.id_rol] || rol.permisos || [];
        setGuardando(rol.id_rol);
        setMensaje('');
        try {
            var resp = await fetch(API_URL + '/permisos/roles/' + rol.id_rol, {
                method: 'PUT',
                headers: headersConToken(),
                body: JSON.stringify({ permisos: permisos }),
            });
            var data = await resp.json();
            if (!resp.ok) throw new Error(data.detail || 'Error al guardar');

            setDatos(function (prev) {
                var nuevosRoles = prev.roles.map(function (r) {
                    if (r.id_rol === rol.id_rol) return Object.assign({}, r, { permisos: permisos });
                    return r;
                });
                return Object.assign({}, prev, { roles: nuevosRoles });
            });
            setCambiosPendientes(function (prev) {
                var n = Object.assign({}, prev);
                delete n[rol.id_rol];
                return n;
            });

            setMensaje('Permisos de ' + rol.nombre + ' actualizados ✓');

            // Refrescar personal (sus permisos derivados cambiaron)
            fetch(API_URL + '/permisos/usuarios', { headers: headersConToken() })
                .then(function (r) { return r.json(); })
                .then(function (data) { setUsuarios(Array.isArray(data) ? data : []); });

            setTimeout(function () { setMensaje(''); }, 3500);
        } catch (err) {
            setMensaje('Error: ' + err.message);
        } finally {
            setGuardando(null);
        }
    }

    // ══════════════════════════════════════
    //  LÓGICA SECCIÓN 2: PERSONAL + ROL
    // ══════════════════════════════════════

    function rolActualUsuario(u) {
        if (cambiosRol[u.id_accs] !== undefined) return cambiosRol[u.id_accs];
        return u.id_rol;
    }

    function tieneRolCambiado(u) {
        return cambiosRol[u.id_accs] !== undefined && cambiosRol[u.id_accs] !== u.id_rol;
    }

    function onCambioRol(u, nuevoIdRol) {
        var nuevoId = parseInt(nuevoIdRol, 10);
        setCambiosRol(function (prev) {
            var n = Object.assign({}, prev);
            if (nuevoId === u.id_rol) {
                delete n[u.id_accs];
            } else {
                n[u.id_accs] = nuevoId;
            }
            return n;
        });
    }

    async function guardarRolUsuario(u) {
        var nuevoRol = cambiosRol[u.id_accs];
        if (nuevoRol === undefined || nuevoRol === u.id_rol) return;

        setGuardandoUser(u.id_accs);
        setMensaje('');
        try {
            var resp = await fetch(API_URL + '/permisos/usuarios/' + u.id_accs + '/rol', {
                method: 'PUT',
                headers: headersConToken(),
                body: JSON.stringify({ id_rol: nuevoRol }),
            });
            var data = await resp.json();
            if (!resp.ok) throw new Error(data.detail || 'Error al cambiar rol');

            // Actualizar estado local
            setUsuarios(function (prev) {
                return prev.map(function (usr) {
                    if (usr.id_accs === u.id_accs) {
                        return Object.assign({}, usr, {
                            id_rol: nuevoRol,
                            rol: data.nombre_rol || roles.find(function (r) { return r.id_rol === nuevoRol; })?.nombre || '',
                            modulos: data.modulos || [],
                        });
                    }
                    return usr;
                });
            });
            setCambiosRol(function (prev) {
                var n = Object.assign({}, prev);
                delete n[u.id_accs];
                return n;
            });

            setMensaje('Rol de ' + u.nombre_completo + ' cambiado a ' + (data.nombre_rol || '') + ' ✓');
            setTimeout(function () { setMensaje(''); }, 3500);
        } catch (err) {
            setMensaje('Error: ' + err.message);
        } finally {
            setGuardandoUser(null);
        }
    }

    // Módulos que tendría el usuario según el rol seleccionado (para preview)
    function modulosPreview(u) {
        var idRol = rolActualUsuario(u);
        var rolObj = roles.find(function (r) { return r.id_rol === idRol; });
        if (!rolObj) return [];
        var permIds = rolObj.permisos || [];
        return submodulos
            .filter(function (s) { return permIds.indexOf(s.id) >= 0; })
            .map(function (s) { return s.nombre; });
    }

    // ── Filtro de personal ──
    var usuariosFiltrados = usuarios.filter(function (u) {
        var texto = (u.nombre_completo + ' ' + u.usuario + ' ' + u.area + ' ' + u.rol).toLowerCase();
        return texto.indexOf(busqueda.toLowerCase()) >= 0;
    });

    return (
        <PageContent>
            <div className="gestion-permisos-page">
                {/* ── Cabecera ── */}
                <div className="permisos-header">
                    <IconoFa icono={faShieldHalved} clase="permisos-header-icon" />
                    <h2>Gestión de Permisos</h2>
                </div>

                {mensaje && (
                    <div className={'permisos-mensaje' + (mensaje.indexOf('Error') >= 0 ? ' error' : ' exito')}>
                        {mensaje}
                    </div>
                )}

                {/* ══════════════════════════════════════
                    SECCIÓN 1: Matriz Roles × Submódulos
                   ══════════════════════════════════════ */}
                <div className="seccion-titulo">
                    <IconoFa icono={faShieldHalved} />
                    <span>Submódulos por Rol</span>
                    <span className="seccion-subtitulo">Define qué módulos puede ver cada rol</span>
                </div>

                <div className="permisos-tabla-wrapper">
                    <table className="permisos-tabla">
                        <thead>
                            <tr>
                                <th className="col-rol-nombre">Rol</th>
                                {submodulos.map(function (s) {
                                    return <th key={s.id} className="col-modulo" title={s.nombre}>{s.nombre}</th>;
                                })}
                                <th className="col-acciones">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map(function (rol) {
                                var conCambios = tieneCambios(rol);
                                return (
                                    <tr key={rol.id_rol} className={conCambios ? 'fila-con-cambios' : ''}>
                                        <td className="col-rol-nombre">
                                            <span className={'badge-rol badge-' + (rol.nombre || '').toLowerCase().replace(/_/g, '')}>
                                                {rol.nombre}
                                            </span>
                                        </td>
                                        {submodulos.map(function (s) {
                                            var activo = tienePermiso(rol, s.id);
                                            return (
                                                <td key={s.id} className="col-modulo">
                                                    <button
                                                        className={'check-btn' + (activo ? ' activo' : '')}
                                                        title={activo ? 'Quitar ' + s.nombre : 'Dar ' + s.nombre}
                                                        onClick={function () { togglePermiso(rol, s.id); }}
                                                    >
                                                        <IconoFa icono={activo ? faCheck : faTimes} />
                                                    </button>
                                                </td>
                                            );
                                        })}
                                        <td className="col-acciones">
                                            <div className="acciones-grupo">
                                                <button className="btn-mini btn-todos" onClick={function () { marcarTodos(rol); }}>Todos</button>
                                                <button className="btn-mini btn-ninguno" onClick={function () { desmarcarTodos(rol); }}>Ninguno</button>
                                                {conCambios && (
                                                    <button
                                                        className="btn-mini btn-guardar"
                                                        onClick={function () { guardarRol(rol); }}
                                                        disabled={guardando === rol.id_rol}
                                                    >
                                                        <IconoFa icono={guardando === rol.id_rol ? faSpinner : faSave} clase={guardando === rol.id_rol ? 'spin' : ''} />
                                                        Guardar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* ══════════════════════════════════════════════
                    SECCIÓN 2: Personal — Asignar Rol Individual
                   ══════════════════════════════════════════════ */}
                <div className="seccion-titulo seccion-personal">
                    <IconoFa icono={faUsers} />
                    <span>Asignación de Accesos por Persona</span>
                    <span className="seccion-subtitulo">Cambia el rol de cada empleado para personalizar su acceso</span>
                </div>

                <div className="permisos-info-banner">
                    <IconoFa icono={faInfoCircle} />
                    <span>Al cambiar el rol de un empleado, sus módulos se actualizan automáticamente según lo definido en la sección superior.</span>
                </div>

                <div className="permisos-buscador">
                    <IconoFa icono={faSearch} clase="buscador-icono" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, usuario, área o rol..."
                        value={busqueda}
                        onChange={function (e) { setBusqueda(e.target.value); }}
                    />
                    <span className="permisos-contador">{usuariosFiltrados.length} empleado(s)</span>
                </div>

                <div className="permisos-tabla-wrapper">
                    <table className="permisos-tabla tabla-personal">
                        <thead>
                            <tr>
                                <th className="col-usuario">Usuario</th>
                                <th className="col-info">Nombre / Área</th>
                                <th className="col-rol-asignar">Rol Asignado</th>
                                {submodulos.map(function (s) {
                                    return <th key={s.id} className="col-modulo" title={s.nombre}>{s.nombre}</th>;
                                })}
                                <th className="col-acciones">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuariosFiltrados.map(function (u) {
                                var cambiado = tieneRolCambiado(u);
                                var modsPreview = cambiado ? modulosPreview(u) : u.modulos || [];
                                return (
                                    <tr key={u.id_accs} className={cambiado ? 'fila-con-cambios' : ''}>
                                        <td className="col-usuario">
                                            <div className="usuario-celda">
                                                {u.foto
                                                    ? <img src={'/assets/perfiles/' + u.foto} alt="" className="avatar-mini" />
                                                    : <div className="avatar-mini avatar-placeholder"><IconoFa icono={faUserShield} /></div>
                                                }
                                                <span className="usuario-code">{u.usuario}</span>
                                            </div>
                                        </td>
                                        <td className="col-info">
                                            <div className="info-nombre">{u.nombre_completo}</div>
                                            <div className="info-area">{u.area}</div>
                                        </td>
                                        <td className="col-rol-asignar">
                                            <select
                                                className={'rol-select' + (cambiado ? ' cambiado' : '')}
                                                value={rolActualUsuario(u)}
                                                onChange={function (e) { onCambioRol(u, e.target.value); }}
                                            >
                                                {roles.map(function (r) {
                                                    return <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>;
                                                })}
                                            </select>
                                        </td>
                                        {submodulos.map(function (s) {
                                            var activo = modsPreview.indexOf(s.nombre) >= 0;
                                            return (
                                                <td key={s.id} className="col-modulo">
                                                    <span className={'estado-indicador' + (activo ? ' si' : ' no')} title={activo ? 'Tiene acceso' : 'Sin acceso'}>
                                                        <IconoFa icono={activo ? faCheck : faTimes} />
                                                    </span>
                                                </td>
                                            );
                                        })}
                                        <td className="col-acciones">
                                            {cambiado ? (
                                                <button
                                                    className="btn-mini btn-guardar"
                                                    onClick={function () { guardarRolUsuario(u); }}
                                                    disabled={guardandoUser === u.id_accs}
                                                >
                                                    <IconoFa icono={guardandoUser === u.id_accs ? faSpinner : faExchangeAlt} clase={guardandoUser === u.id_accs ? 'spin' : ''} />
                                                    Cambiar
                                                </button>
                                            ) : (
                                                <span className="sin-cambios">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {usuariosFiltrados.length === 0 && (
                    <p className="sin-resultados">No se encontraron usuarios con ese criterio.</p>
                )}
            </div>
        </PageContent>
    );
}
