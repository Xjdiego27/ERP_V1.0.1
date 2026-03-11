import React, { useState } from 'react';
import { API_URL, headersConToken } from '../auth';
import IconoFa from '../components/IconoFa';
import { faEye, faEyeSlash, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import '../styles/CambioPassword.css';

export default function CambioPassword({ onCambiado }) {
    var [actual, setActual] = useState('');
    var [nueva, setNueva] = useState('');
    var [confirmar, setConfirmar] = useState('');
    var [mensaje, setMensaje] = useState('');
    var [exito, setExito] = useState(false);
    var [enviando, setEnviando] = useState(false);

    // Visibilidad de cada campo
    var [verActual, setVerActual] = useState(false);
    var [verNueva, setVerNueva] = useState(false);
    var [verConfirmar, setVerConfirmar] = useState(false);

    // Reglas de validación
    var reglas = [
        { id: 'min',     label: 'Mínimo 8 caracteres',     ok: nueva.length >= 8 },
        { id: 'upper',   label: 'Al menos 1 mayúscula',     ok: /[A-Z]/.test(nueva) },
        { id: 'lower',   label: 'Al menos 1 minúscula',     ok: /[a-z]/.test(nueva) },
        { id: 'number',  label: 'Al menos 1 número',        ok: /[0-9]/.test(nueva) },
        { id: 'special', label: 'Al menos 1 carácter especial (!@#$...)', ok: /[^A-Za-z0-9]/.test(nueva) },
        { id: 'match',   label: 'Las contraseñas coinciden', ok: nueva.length > 0 && confirmar.length > 0 && nueva === confirmar },
    ];

    var todasOk = reglas.every(function (r) { return r.ok; });

    function handleSubmit(e) {
        e.preventDefault();
        setMensaje('');

        if (!actual || !nueva || !confirmar) {
            setMensaje('Todos los campos son obligatorios');
            return;
        }
        if (!todasOk) {
            setMensaje('La contraseña no cumple todos los requisitos');
            return;
        }
        if (nueva === actual) {
            setMensaje('La nueva contraseña debe ser diferente a la actual');
            return;
        }

        setEnviando(true);

        fetch(API_URL + '/auth/cambiar-password', {
            method: 'PUT',
            headers: headersConToken(),
            body: JSON.stringify({
                password_actual: actual,
                password_nuevo: nueva,
                password_confirm: confirmar
            })
        })
        .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
        .then(function (result) {
            setEnviando(false);
            if (result.ok) {
                setExito(true);
                setMensaje('¡Contraseña actualizada correctamente!');
                var session = JSON.parse(localStorage.getItem('session'));
                if (session) {
                    delete session.requiere_cambio_password;
                    localStorage.setItem('session', JSON.stringify(session));
                }
                setTimeout(function () {
                    if (onCambiado) onCambiado();
                }, 1500);
            } else {
                setMensaje(result.data.detail || 'Error al cambiar contraseña');
            }
        })
        .catch(function () {
            setEnviando(false);
            setMensaje('Error de conexión');
        });
    }

    function campoPassword(label, valor, setValor, placeholder, visible, setVisible) {
        return (
            <div className="cpw-field-group">
                <label>{label}</label>
                <div className="cpw-input-wrap">
                    <input
                        type={visible ? 'text' : 'password'}
                        value={valor}
                        onChange={function (e) { setValor(e.target.value); }}
                        placeholder={placeholder}
                        disabled={exito}
                    />
                    <button type="button" className="cpw-eye-btn" onClick={function () { setVisible(!visible); }} tabIndex={-1}>
                        <IconoFa icono={visible ? faEyeSlash : faEye} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cambio-pw-overlay">
            <div className="cambio-pw-modal">
                <div className="cambio-pw-icono">🔒</div>
                <h2 className="cambio-pw-titulo">Cambio de Contraseña Obligatorio</h2>
                <p className="cambio-pw-desc">
                    Tu contraseña actual no es segura. Por favor, establece una nueva contraseña.
                </p>

                <form onSubmit={handleSubmit} className="cambio-pw-form">
                    {campoPassword('Contraseña actual', actual, setActual, 'Ingresa tu contraseña actual', verActual, setVerActual)}
                    {campoPassword('Nueva contraseña', nueva, setNueva, 'Mínimo 8 caracteres', verNueva, setVerNueva)}
                    {campoPassword('Confirmar nueva contraseña', confirmar, setConfirmar, 'Repite la nueva contraseña', verConfirmar, setVerConfirmar)}

                    {/* Indicadores de validación */}
                    {(nueva.length > 0 || confirmar.length > 0) && (
                        <ul className="cpw-reglas">
                            {reglas.map(function (r) {
                                return (
                                    <li key={r.id} className={r.ok ? 'cpw-regla-ok' : 'cpw-regla-fail'}>
                                        <IconoFa icono={r.ok ? faCheck : faXmark} />
                                        <span>{r.label}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {mensaje && (
                        <p className={'cambio-pw-msg ' + (exito ? 'exito' : 'error')}>
                            {mensaje}
                        </p>
                    )}

                    {!exito && (
                        <button type="submit" className="cambio-pw-btn" disabled={enviando || !todasOk}>
                            {enviando ? 'Guardando...' : 'Cambiar Contraseña'}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
