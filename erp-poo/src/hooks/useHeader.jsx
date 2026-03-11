import { useState, useEffect, useCallback } from 'react';

export function useHeader() {
    const [usuario, setUsuario] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const cargarUsuario = useCallback(() => {
        try {
            const session = JSON.parse(localStorage.getItem('session'));
            if (session && session.usuario) {
                const u = session.usuario;
                const nombre = u.nombre || '';
                const apellido = u.apellido || '';
                const isDark = localStorage.getItem('erp-dark-mode') === 'true';
                const logoClaro = u.logo_empresa ? '/assets/' + u.logo_empresa : '/default-logo.png';
                const logoOscuro = u.logo_dark_empresa ? '/assets/' + u.logo_dark_empresa : logoClaro;
                setUsuario({
                    nombreCompleto: (nombre + ' ' + apellido).trim() || 'Usuario',
                    cargo: u.cargo || u.rol || 'Sin cargo',
                    foto: u.foto ? '/assets/perfiles/' + u.foto : '/default-avatar.png',
                    logo: isDark ? logoOscuro : logoClaro,
                    logoClaro: logoClaro,
                    logoOscuro: logoOscuro
                });
            }
        } catch (e) {
            console.error('Error al leer sesión:', e);
        }
    }, []);

    useEffect(() => {
        cargarUsuario();
        window.addEventListener('focus', cargarUsuario);
        window.addEventListener('session-updated', cargarUsuario);
        return () => {
            window.removeEventListener('focus', cargarUsuario);
            window.removeEventListener('session-updated', cargarUsuario);
        };
    }, [cargarUsuario]);

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const closeMenu = () => setMenuOpen(false);

    return { usuario, menuOpen, toggleMenu, closeMenu };
}