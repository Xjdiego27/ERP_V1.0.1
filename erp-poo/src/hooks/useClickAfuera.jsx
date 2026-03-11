import { useEffect } from 'react';

export function useClickAfuera(panel, accion) {
    useEffect(() => {
        const listener = (evento) => {
            if (!panel.current || panel.current.contains(evento.target)) {
                return;
            }
            accion(evento);
        };

        document.addEventListener('mousedown', listener);
        return () => document.removeEventListener('mousedown', listener);
    }, [panel, accion]);
}