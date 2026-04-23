import { faRightFromBracket, faUserCircle, faKey, faDroplet, faCommentDots } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IconoFa from './IconoFa';
import '../styles/UserMenu.css';

function toggleGlass() {
    var activo = document.body.classList.toggle('glass-off');
    localStorage.setItem('erp-glass-off', activo ? '1' : '0');
    return !activo;
}

export default function UserMenu({ datos, onCambiarPassword }) {
    const navigate = useNavigate();
    var [glassActivo, setGlassActivo] = useState(function () {
        return localStorage.getItem('erp-glass-off') !== '1';
    });
    var [burbujaActivo, setBurbujaActivo] = useState(function () {
        return localStorage.getItem('chat_modo') === 'burbujas';
    });

    const cerrarSesion = () => {
        localStorage.removeItem('session');
        navigate('/');
    };

    function toggleBurbuja() {
        var nuevoModo = burbujaActivo ? 'barra' : 'burbujas';
        localStorage.setItem('chat_modo', nuevoModo);
        setBurbujaActivo(!burbujaActivo);
        window.dispatchEvent(new CustomEvent('chat-modo-change', { detail: { modo: nuevoModo } }));
    }

    return (
        <div className="user-dropdown">
            <button className="dropdown-btn dropdown-btn-perfil" onClick={function () { navigate('/dashboard/mi-perfil'); }}>
                <IconoFa icono={faUserCircle} />
                <span>Mi Perfil</span>
            </button>
            <button className="dropdown-btn dropdown-btn-perfil" onClick={function () { if (onCambiarPassword) onCambiarPassword(); }}>
                <IconoFa icono={faKey} />
                <span>Cambiar Contraseña</span>
            </button>
            <hr />

            {/* Toggle efecto vidrio */}
            <button
                className={'tema-glass-toggle' + (glassActivo ? ' activo' : '')}
                onClick={function () { var nuevo = toggleGlass(); setGlassActivo(nuevo); }}
            >
                <IconoFa icono={faDroplet} />
                <span>Efecto Vidrio</span>
                <span className={'glass-indicator' + (glassActivo ? ' on' : '')}>{glassActivo ? 'ON' : 'OFF'}</span>
            </button>

            {/* Toggle modo burbuja (Messenger) */}
            <button
                className={'tema-glass-toggle' + (burbujaActivo ? ' activo' : '')}
                onClick={toggleBurbuja}
            >
                <IconoFa icono={faCommentDots} />
                <span>Modo Burbuja</span>
                <span className={'glass-indicator' + (burbujaActivo ? ' on' : '')}>{burbujaActivo ? 'ON' : 'OFF'}</span>
            </button>

            <hr />
            <button className="dropdown-btn" onClick={cerrarSesion}>
                <IconoFa icono={faRightFromBracket} />
                <span>Cerrar sesión</span>
            </button>
        </div>
    );
}