import React from 'react';
import { faRightFromBracket, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import IconoFa from './IconoFa';
import '../styles/UserMenu.css';

export default function UserMenu({ datos }) {
    const navigate = useNavigate();

    const cerrarSesion = () => {
        localStorage.removeItem('session');
        navigate('/');
    };

    return (
        <div className="user-dropdown">
            <button className="dropdown-btn dropdown-btn-perfil" onClick={function () { navigate('/dashboard/mi-perfil'); }}>
                <IconoFa icono={faUserCircle} />
                <span>Mi Perfil</span>
            </button>
            <hr />
            <button className="dropdown-btn" onClick={cerrarSesion}>
                <IconoFa icono={faRightFromBracket} />
                <span>Cerrar sesión</span>
            </button>
        </div>
    );
}