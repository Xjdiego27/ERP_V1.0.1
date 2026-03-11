import React from 'react';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
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
            <button className="dropdown-btn" onClick={cerrarSesion}>

                <IconoFa icono={faRightFromBracket} />
                <span>Cerrar sesión</span>
            </button>
        </div>
    );
}