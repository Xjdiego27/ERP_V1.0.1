import { useState, useEffect } from 'react';
import { API_URL, headersConToken } from '../auth';
import IconoFa from '../components/IconoFa';
import PageContent from '../components/PageContent';
import {
    faEnvelope, faSearch, faPlus, faPen, faFloppyDisk, faXmark,
    faTrash, faEye, faEyeSlash, faUser, faChevronDown, faChevronRight,
    faCopy, faCheck, faKey, faLock, faUnlock
} from '@fortawesome/free-solid-svg-icons';
import '../styles/CorreosCorporativos.css';

export default function CorreosCorporativos() {
    var [personal, setPersonal] = useState([]);
    var [cargando, setCargando] = useState(true);
    var [filtro, setFiltro] = useState('');
    var [mensaje, setMensaje] = useState('');
    var [exito, setExito] = useState(false);

    // Expandido (qué persona está abierta)
    var [expandido, setExpandido] = useState(null);

    // Formulario nuevo correo
    var [formNuevo, setFormNuevo] = useState({ correo: '', password: '' });
    var [agregandoA, setAgregandoA] = useState(null); // id_personal al que se agrega

    // Edición inline
    var [editandoId, setEditandoId] = useState(null);
    var [formEditar, setFormEditar] = useState({ correo: '', password: '' });

    // Contraseñas descifradas { id_correo: "password_texto" }
    var [passDescifrada, setPassDescifrada] = useState({});
    var [desbloqueado, setDesbloqueado] = useState(false); // si ya se ingresó la clave AES
    // Prompt de clave AES
    var [pideClave, setPideClave] = useState(false);
    var [claveAes, setClaveAes] = useState('');
    var [descifrando, setDescifrando] = useState(false);

    // Copiar feedback
    var [copiado, setCopiado] = useState(null);

    useEffect(function () { cargarDatos(); }, []);

    function cargarDatos() {
        setCargando(true);
        fetch(API_URL + '/correos', { headers: headersConToken() })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                setPersonal(Array.isArray(data) ? data : []);
            })
            .catch(function () {
                mostrarMensaje('Error cargando datos', false);
            })
            .finally(function () {
                setCargando(false);
            });
    }

    function mostrarMensaje(msg, ok) {
        setMensaje(msg);
        setExito(ok);
        if (ok) setTimeout(function () { setMensaje(''); }, 2500);
    }

    // Filtrar personal
    function personalFiltrado() {
        if (!filtro.trim()) return personal;
        var q = filtro.toLowerCase();
        return personal.filter(function (p) {
            var enNombre = p.nombre_completo && p.nombre_completo.toLowerCase().indexOf(q) >= 0;
            var enArea = p.area && p.area.toLowerCase().indexOf(q) >= 0;
            var enCorreo = p.correos && p.correos.some(function (c) {
                return c.correo.toLowerCase().indexOf(q) >= 0;
            });
            return enNombre || enArea || enCorreo;
        });
    }

    // Estadísticas
    var totalPersonal = personal.length;
    var conCorreo = personal.filter(function (p) { return p.correos.length > 0; }).length;
    var sinCorreo = totalPersonal - conCorreo;
    var totalCorreos = personal.reduce(function (acc, p) { return acc + p.correos.length; }, 0);

    // ── CRUD ──
    function agregarCorreo(id_personal) {
        if (!formNuevo.correo.trim() || !formNuevo.password.trim()) {
            mostrarMensaje('Correo y contraseña son obligatorios', false);
            return;
        }
        fetch(API_URL + '/correos', {
            method: 'POST',
            headers: headersConToken(),
            body: JSON.stringify({
                id_personal: id_personal,
                correo: formNuevo.correo,
                password: formNuevo.password,
            }),
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res.ok) {
                    mostrarMensaje('Correo agregado', true);
                    setFormNuevo({ correo: '', password: '' });
                    setAgregandoA(null);
                    cargarDatos();
                } else {
                    mostrarMensaje(res.detail || 'Error', false);
                }
            })
            .catch(function () { mostrarMensaje('Error de conexión', false); });
    }

    function guardarEdicion(id_correo) {
        fetch(API_URL + '/correos/' + id_correo, {
            method: 'PUT',
            headers: headersConToken(),
            body: JSON.stringify({
                correo: formEditar.correo || null,
                password: formEditar.password || null,
            }),
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res.ok) {
                    mostrarMensaje('Correo actualizado', true);
                    setEditandoId(null);
                    cargarDatos();
                } else {
                    mostrarMensaje(res.detail || 'Error', false);
                }
            })
            .catch(function () { mostrarMensaje('Error de conexión', false); });
    }

    function eliminarCorreo(id_correo) {
        if (!confirm('¿Eliminar este correo corporativo?')) return;
        fetch(API_URL + '/correos/' + id_correo, {
            method: 'DELETE',
            headers: headersConToken(),
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res.ok) {
                    mostrarMensaje('Correo eliminado', true);
                    cargarDatos();
                } else {
                    mostrarMensaje(res.detail || 'Error', false);
                }
            })
            .catch(function () { mostrarMensaje('Error de conexión', false); });
    }

    function iniciarEdicion(c) {
        setEditandoId(c.id_correo);
        setFormEditar({ correo: c.correo, password: '' });
    }

    function verPassword(id_correo) {
        // Si ya está descifrada, solo ocultar/mostrar
        if (passDescifrada[id_correo]) {
            var nuevo = Object.assign({}, passDescifrada);
            delete nuevo[id_correo];
            setPassDescifrada(nuevo);
            return;
        }
        // Si ya se desbloqueó con la clave, mostrar la que ya tenemos en cache
        if (desbloqueado) {
            // La password no está en cache (correo nuevo añadido después del desbloqueo)
            mostrarMensaje('Contraseña no disponible — vuelve a desbloquear', false);
            return;
        }
        // Pedir la clave AES una sola vez
        setPideClave(true);
        setClaveAes('');
    }

    function descifrarTodas() {
        if (!claveAes.trim()) {
            mostrarMensaje('Ingresa la clave AES', false);
            return;
        }
        setDescifrando(true);
        fetch(API_URL + '/correos/ver-passwords', {
            method: 'POST',
            headers: headersConToken(),
            body: JSON.stringify({ clave_aes: claveAes }),
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res.ok) {
                    setPassDescifrada(res.passwords || {});
                    setDesbloqueado(true);
                    setPideClave(false);
                    setClaveAes('');
                    mostrarMensaje('Contraseñas desbloqueadas', true);
                } else {
                    mostrarMensaje(res.detail || 'Clave AES incorrecta', false);
                }
            })
            .catch(function () { mostrarMensaje('Error de conexión', false); })
            .finally(function () { setDescifrando(false); });
    }

    function bloquearTodas() {
        setPassDescifrada({});
        setDesbloqueado(false);
    }

    function copiarTexto(texto, id) {
        function marcar() {
            setCopiado(id);
            setTimeout(function () { setCopiado(null); }, 1500);
        }
        // navigator.clipboard solo funciona en HTTPS o localhost
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto).then(marcar).catch(function () {
                copiarFallback(texto);
                marcar();
            });
        } else {
            copiarFallback(texto);
            marcar();
        }
    }

    function copiarFallback(texto) {
        var ta = document.createElement('textarea');
        ta.value = texto;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }

    var lista = personalFiltrado();

    return (
        <PageContent>
            <div className="correos-container">
                <h2 className="correos-titulo">
                    <IconoFa icono={faEnvelope} /> Correos Corporativos
                </h2>
                <p className="correos-subtitulo">Administración de correos corporativos del personal</p>

                {mensaje && (
                    <div className={'correos-mensaje ' + (exito ? 'exito' : 'error')}>
                        {mensaje}
                        {!exito && <button className="correos-msg-cerrar" onClick={function () { setMensaje(''); }}><IconoFa icono={faXmark} /></button>}
                    </div>
                )}

                {/* Estadísticas */}
                <div className="correos-stats">
                    <div className="correos-stat total">
                        <span className="correos-stat-num">{totalCorreos}</span>
                        <span className="correos-stat-label">Total Correos</span>
                    </div>
                    <div className="correos-stat con">
                        <span className="correos-stat-num">{conCorreo}</span>
                        <span className="correos-stat-label">Con Correo</span>
                    </div>
                    <div className="correos-stat sin">
                        <span className="correos-stat-num">{sinCorreo}</span>
                        <span className="correos-stat-label">Sin Correo</span>
                    </div>
                </div>

                {/* Buscador + botón desbloquear */}
                <div className="correos-filtros">
                    <div className="correos-search">
                        <IconoFa icono={faSearch} clase="correos-search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, área o correo..."
                            value={filtro}
                            onChange={function (e) { setFiltro(e.target.value); }}
                            className="correos-search-input"
                        />
                    </div>
                    <button
                        className={'correos-btn-global ' + (desbloqueado ? 'desbloqueado' : '')}
                        onClick={function () {
                            if (desbloqueado) {
                                bloquearTodas();
                            } else {
                                setPideClave(true);
                                setClaveAes('');
                            }
                        }}
                        title={desbloqueado ? 'Bloquear todas las contraseñas' : 'Desbloquear todas las contraseñas'}
                    >
                        <IconoFa icono={desbloqueado ? faUnlock : faLock} />
                        {desbloqueado ? ' Bloquear' : ' Desbloquear'}
                    </button>
                </div>

                {cargando ? (
                    <p className="correos-cargando">Cargando datos...</p>
                ) : (
                    <div className="correos-lista">
                        {lista.length === 0 ? (
                            <p className="correos-vacio">No se encontró personal</p>
                        ) : (
                            lista.map(function (p) {
                                var abierto = expandido === p.id_personal;
                                return (
                                    <div key={p.id_personal} className={'correos-persona' + (abierto ? ' abierto' : '')}>
                                        {/* Header persona */}
                                        <button
                                            className="correos-persona-header"
                                            onClick={function () {
                                                setExpandido(abierto ? null : p.id_personal);
                                                setAgregandoA(null);
                                                setEditandoId(null);
                                            }}
                                        >
                                            <div className="correos-persona-info">
                                                <div className="correos-persona-avatar">
                                                    {p.foto ? (
                                                        <img src={'/assets/perfiles/' + p.foto} alt="" />
                                                    ) : (
                                                        <span><IconoFa icono={faUser} /></span>
                                                    )}
                                                </div>
                                                <div className="correos-persona-datos">
                                                    <strong>{p.nombre_completo}</strong>
                                                    <span>{p.area} — {p.cargo}</span>
                                                </div>
                                                <span className="correos-persona-count" style={{ background: p.correos.length > 0 ? '#2563eb' : '#9ca3af' }}>
                                                    {p.correos.length}
                                                </span>
                                            </div>
                                            <IconoFa icono={abierto ? faChevronDown : faChevronRight} clase="correos-persona-flecha" />
                                        </button>

                                        {/* Body persona expandida */}
                                        {abierto && (
                                            <div className="correos-persona-body">
                                                {p.correos.length === 0 && agregandoA !== p.id_personal && (
                                                    <p className="correos-sin-datos">Sin correos corporativos registrados</p>
                                                )}

                                                {/* Lista de correos */}
                                                {p.correos.map(function (c) {
                                                    var esEditando = editandoId === c.id_correo;
                                                    var passTexto = passDescifrada[c.id_correo];
                                                    return (
                                                        <div key={c.id_correo} className="correos-item">
                                                            {esEditando ? (
                                                                <div className="correos-item-edit">
                                                                    <div className="correos-edit-campo">
                                                                        <label><IconoFa icono={faEnvelope} /> Correo</label>
                                                                        <input
                                                                            type="text"
                                                                            value={formEditar.correo}
                                                                            onChange={function (e) { setFormEditar(Object.assign({}, formEditar, { correo: e.target.value })); }}
                                                                            className="correos-edit-input"
                                                                        />
                                                                    </div>
                                                                    <div className="correos-edit-campo">
                                                                        <label><IconoFa icono={faKey} /> Nueva Contraseña</label>
                                                                        <input
                                                                            type="text"
                                                                            value={formEditar.password}
                                                                            onChange={function (e) { setFormEditar(Object.assign({}, formEditar, { password: e.target.value })); }}
                                                                            className="correos-edit-input"
                                                                            placeholder="Dejar vacío para no cambiar"
                                                                        />
                                                                    </div>
                                                                    <div className="correos-edit-acciones">
                                                                        <button className="correos-btn guardar" onClick={function () { guardarEdicion(c.id_correo); }}>
                                                                            <IconoFa icono={faFloppyDisk} /> Guardar
                                                                        </button>
                                                                        <button className="correos-btn cancelar" onClick={function () { setEditandoId(null); }}>
                                                                            <IconoFa icono={faXmark} /> Cancelar
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="correos-item-view">
                                                                    <div className="correos-item-correo">
                                                                        <IconoFa icono={faEnvelope} clase="correos-item-icono" />
                                                                        <span>{c.correo}</span>
                                                                        <button
                                                                            className="correos-btn-copiar"
                                                                            onClick={function () { copiarTexto(c.correo, 'c-' + c.id_correo); }}
                                                                            title="Copiar correo"
                                                                        >
                                                                            <IconoFa icono={copiado === 'c-' + c.id_correo ? faCheck : faCopy} />
                                                                        </button>
                                                                    </div>
                                                                    <div className="correos-item-pass">
                                                                        <IconoFa icono={passTexto ? faUnlock : faLock} clase="correos-item-icono" />
                                                                        <span className={passTexto ? '' : 'correos-pass-oculta'}>
                                                                            {passTexto || '••••••••'}
                                                                        </span>
                                                                        <button
                                                                            className="correos-btn-ver"
                                                                            onClick={function () { verPassword(c.id_correo); }}
                                                                            title={passTexto ? 'Ocultar' : 'Descifrar contraseña'}
                                                                        >
                                                                            <IconoFa icono={passTexto ? faEyeSlash : faEye} />
                                                                        </button>
                                                                        {passTexto && (
                                                                            <button
                                                                                className="correos-btn-copiar"
                                                                                onClick={function () { copiarTexto(passTexto, 'p-' + c.id_correo); }}
                                                                                title="Copiar contraseña"
                                                                            >
                                                                                <IconoFa icono={copiado === 'p-' + c.id_correo ? faCheck : faCopy} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <div className="correos-item-acciones">
                                                                        <button className="correos-btn-acc editar" onClick={function () { iniciarEdicion(c); }} title="Editar">
                                                                            <IconoFa icono={faPen} />
                                                                        </button>
                                                                        <button className="correos-btn-acc eliminar" onClick={function () { eliminarCorreo(c.id_correo); }} title="Eliminar">
                                                                            <IconoFa icono={faTrash} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {/* Formulario agregar */}
                                                {agregandoA === p.id_personal ? (
                                                    <div className="correos-agregar-form">
                                                        <div className="correos-edit-campo">
                                                            <label><IconoFa icono={faEnvelope} /> Correo</label>
                                                            <input
                                                                type="text"
                                                                value={formNuevo.correo}
                                                                onChange={function (e) { setFormNuevo(Object.assign({}, formNuevo, { correo: e.target.value })); }}
                                                                className="correos-edit-input"
                                                                placeholder="usuario@empresa.com"
                                                            />
                                                        </div>
                                                        <div className="correos-edit-campo">
                                                            <label><IconoFa icono={faKey} /> Contraseña</label>
                                                            <input
                                                                type="text"
                                                                value={formNuevo.password}
                                                                onChange={function (e) { setFormNuevo(Object.assign({}, formNuevo, { password: e.target.value })); }}
                                                                className="correos-edit-input"
                                                                placeholder="Contraseña del correo"
                                                            />
                                                        </div>
                                                        <div className="correos-edit-acciones">
                                                            <button className="correos-btn guardar" onClick={function () { agregarCorreo(p.id_personal); }}>
                                                                <IconoFa icono={faFloppyDisk} /> Guardar
                                                            </button>
                                                            <button className="correos-btn cancelar" onClick={function () { setAgregandoA(null); setFormNuevo({ correo: '', password: '' }); }}>
                                                                <IconoFa icono={faXmark} /> Cancelar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="correos-btn-agregar"
                                                        onClick={function () {
                                                            setAgregandoA(p.id_personal);
                                                            setFormNuevo({ correo: '', password: '' });
                                                        }}
                                                    >
                                                        <IconoFa icono={faPlus} /> Agregar correo
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Modal para pedir clave AES — desbloquea TODAS las contraseñas */}
            {pideClave && (
                <div className="correos-aes-overlay" onClick={function () { setPideClave(false); setClaveAes(''); }}>
                    <div className="correos-aes-modal" onClick={function (e) { e.stopPropagation(); }}>
                        <h3><IconoFa icono={faKey} /> Clave de descifrado</h3>
                        <p>Ingresa la clave AES para desbloquear <strong>todas</strong> las contraseñas</p>
                        <input
                            type="password"
                            value={claveAes}
                            onChange={function (e) { setClaveAes(e.target.value); }}
                            onKeyDown={function (e) { if (e.key === 'Enter') descifrarTodas(); }}
                            placeholder="Clave AES..."
                            className="correos-aes-input"
                            autoFocus
                        />
                        <div className="correos-aes-acciones">
                            <button className="correos-btn guardar" onClick={descifrarTodas} disabled={descifrando}>
                                <IconoFa icono={faUnlock} /> {descifrando ? 'Descifrando...' : 'Desbloquear todo'}
                            </button>
                            <button className="correos-btn cancelar" onClick={function () { setPideClave(false); setClaveAes(''); }}>
                                <IconoFa icono={faXmark} /> Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </PageContent>
    );
}
