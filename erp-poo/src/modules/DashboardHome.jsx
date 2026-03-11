import React from 'react';
import '../styles/DashboardHome.css';

export default function DashboardHome() {
    return (
        <div className="home-container">
            <div className="home-banner">
                <img src="/oficinas.webp" alt="Oficinas" className="home-banner-img" />
                <div className="home-banner-overlay">
                    <h1 className="home-titulo">Bienvenido</h1>
                    <p className="home-subtitulo">Selecciona una opción del menú para comenzar</p>
                </div>
            </div>
        </div>
    );
}
