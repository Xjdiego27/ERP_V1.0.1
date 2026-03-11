import React, { useReducer, useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Img from '../components/Img';
import IconoFa from '../components/IconoFa';
import { faSun, faMoon, faEye, faEyeSlash, faBuilding, faUser, faLock, faArrowRightToBracket } from '@fortawesome/free-solid-svg-icons';
import { API_URL } from '../auth';
import logoERP from '../logo.svg';
import '/src/styles/Login.css';

const estadoInicial = {
    usuario: '',
    clave: '',
    empresaElegida: '',
    mensaje: '',
    bloqueado: false,
    darkMode: localStorage.getItem('erp-dark-mode') === 'true',
};

function loginReducer(state, action) {
    switch (action.type) {
        case 'SET_CAMPO':
            return { ...state, [action.campo]: action.valor, mensaje: '' };
        case 'CAMBIAR_EMPRESA':
            return { ...state, empresaElegida: action.valor, usuario: '', clave: '', mensaje: '', bloqueado: false };
        case 'LOGIN_ERROR':
            return { ...state, clave: '', mensaje: action.mensaje, bloqueado: action.bloqueado || false };
        case 'TOGGLE_DARK':
            return { ...state, darkMode: !state.darkMode };
        default:
            return state;
    }
}

async function fetchEmpresas() {
    const res = await fetch(`${API_URL}/empresa`);
    if (!res.ok) throw new Error('Error en respuesta');
    const data = await res.json();
    return data.map(e => ({ id: e.ID_EMP, nombre: e.NOMBRE, logo: e.LOGO, logo_dark: e.LOGO_DARK }));
}

export default function Login() {
    const [state, dispatch] = useReducer(loginReducer, estadoInicial);
    const { usuario, clave, empresaElegida, mensaje, bloqueado, darkMode } = state;
    const [verClave, setVerClave] = useState(false);
    const [cargando, setCargando] = useState(false);
    const navigate = useNavigate();

    const { data: listaEmpresas = [], isError } = useQuery({
        queryKey: ['empresas'],
        queryFn: fetchEmpresas,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    useEffect(() => {
        if (isError) {
            dispatch({ type: 'SET_CAMPO', campo: 'mensaje', valor: 'Error de red: No se pudieron cargar las empresas' });
        }
    }, [isError]);

    useEffect(() => {
        if (listaEmpresas.length > 0 && !empresaElegida) {
            dispatch({ type: 'SET_CAMPO', campo: 'empresaElegida', valor: listaEmpresas[0].id.toString() });
        }
    }, [listaEmpresas, empresaElegida]);

    useEffect(() => {
        document.body.classList.toggle('dark-mode', darkMode);
        localStorage.setItem('erp-dark-mode', darkMode);
    }, [darkMode]);

    useEffect(() => {
        const session = JSON.parse(localStorage.getItem('session'));
        if (session && session.usuario && session.access_token) {
            const idEmp = session.usuario.id_empresa;
            if (idEmp) {
                document.body.className = document.body.className.replace(/empresa-\d+/g, '').trim();
                document.body.classList.add('empresa-' + idEmp);
            }
            navigate('/dashboard');
        } else if (session && !session.access_token) {
            localStorage.removeItem('session');
        }
    }, [navigate]);

    useEffect(() => {
        if (!empresaElegida) return;
        document.body.className = document.body.className.replace(/empresa-\d+/g, '').trim();
        document.body.classList.add('empresa-' + empresaElegida);
    }, [empresaElegida]);

    const toggleDarkMode = useCallback(() => { dispatch({ type: 'TOGGLE_DARK' }); }, []);

    const iniciarSesion = async (e) => {
        if (e) e.preventDefault();
        if (!empresaElegida || !usuario || !clave) {
            dispatch({ type: 'LOGIN_ERROR', mensaje: 'Campos incompletos' });
            return;
        }
        setCargando(true);
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, password: clave, id_empresa: parseInt(empresaElegida) })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('session', JSON.stringify(data));
                navigate('/dashboard');
            } else {
                const infoError = data.detail;
                dispatch({
                    type: 'LOGIN_ERROR',
                    mensaje: infoError.mensaje || 'Error de acceso',
                    bloqueado: infoError.id_estado === 2,
                });
            }
        } catch (error) {
            dispatch({ type: 'LOGIN_ERROR', mensaje: 'Sin respuesta del servidor' });
        } finally {
            setCargando(false);
        }
    };

    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            iniciarSesion();
        }
    }

    const empresaActual = listaEmpresas.find(emp => emp.id.toString() === empresaElegida);

    function logoEmpresa() {
        if (!empresaActual) return logoERP;
        if (darkMode && empresaActual.logo_dark) return '/assets/' + empresaActual.logo_dark;
        if (empresaActual.logo) return '/assets/' + empresaActual.logo;
        return logoERP;
    }

    return (
    <div className="login-container">
        <span className="login-dark-toggle" role="button" tabIndex={0}
            onClick={toggleDarkMode}
            onKeyDown={function (e) { if (e.key === 'Enter') toggleDarkMode(); }}
            title={darkMode ? 'Modo claro' : 'Modo nocturno'}>
            <IconoFa icono={darkMode ? faSun : faMoon} />
        </span>

        {/* Lado izquierdo — foto/banner */}
        <div className="login-imagen">
            <div className="login-imagen-contenido">
                <Img ruta={'/public/banner.webp'} className="banner" />
            </div>
        </div>

        {/* Lado derecho — formulario */}
        <div className="login-form-container">
            <div className="login-card">
                <img src={logoEmpresa()} alt="Logo Empresa" className="logo-login" />
                <h2 className="login-titulo">Bienvenido</h2>
                <p className="login-desc">Inicia sesión para continuar</p>

                <form onSubmit={iniciarSesion} autoComplete="off">
                    {/* Empresa */}
                    <div className="login-field">
                        <label><IconoFa icono={faBuilding} /> Empresa</label>
                        <select
                            value={empresaElegida}
                            onChange={function (e) { dispatch({ type: 'CAMBIAR_EMPRESA', valor: e.target.value }); }}>
                            {listaEmpresas.map(function (emp) {
                                return <option key={emp.id} value={emp.id}>{emp.nombre}</option>;
                            })}
                        </select>
                    </div>

                    {/* Usuario */}
                    <div className="login-field">
                        <label><IconoFa icono={faUser} /> Usuario</label>
                        <input
                            type="text"
                            id="Input_Usuario"
                            value={usuario}
                            onChange={function (e) { dispatch({ type: 'SET_CAMPO', campo: 'usuario', valor: e.target.value.toUpperCase() }); }}
                            onKeyDown={handleKeyDown}
                            placeholder="Ingresa tu usuario"
                            autoComplete="off"
                        />
                    </div>

                    {/* Contraseña */}
                    <div className="login-field">
                        <label><IconoFa icono={faLock} /> Contraseña</label>
                        <div className="login-pw-wrap">
                            <input
                                type={verClave ? 'text' : 'password'}
                                value={clave}
                                onChange={function (e) { dispatch({ type: 'SET_CAMPO', campo: 'clave', valor: e.target.value }); }}
                                onKeyDown={handleKeyDown}
                                placeholder="••••••••"
                                autoComplete="off"
                            />
                            <button type="button" className="login-eye-btn"
                                onClick={function () { setVerClave(!verClave); }} tabIndex={-1}>
                                <IconoFa icono={verClave ? faEyeSlash : faEye} />
                            </button>
                        </div>
                    </div>

                    {/* Mensaje de error */}
                    {mensaje && <p className="error-mensaje">{mensaje}</p>}

                    {/* Botón */}
                    {!bloqueado ? (
                        <button type="submit" className="login-btn" disabled={cargando}>
                            {cargando ? (
                                <span className="login-spinner"></span>
                            ) : (
                                <><IconoFa icono={faArrowRightToBracket} /> Iniciar Sesión</>
                            )}
                        </button>
                    ) : (
                        <span className="denied-msg">ACCESO DENEGADO</span>
                    )}
                </form>
            </div>
        </div>
    </div>
    );
}