import { useState } from 'react';
import IconoFa from './IconoFa';
import { faTimes, faCheck, faSearch, faUsers } from '@fortawesome/free-solid-svg-icons';
import '../styles/Chat.css';

/**
 * CrearGrupoModal — Modal para crear un grupo de chat seleccionando contactos.
 */
export default function CrearGrupoModal({ contactos, onCrear, onCerrar }) {
    const [nombre, setNombre] = useState('');
    const [seleccionados, setSeleccionados] = useState(new Set());
    const [busqueda, setBusqueda] = useState('');

    function toggleContacto(id) {
        setSeleccionados(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function handleCrear() {
        const nombreTrim = nombre.trim();
        if (!nombreTrim || seleccionados.size === 0) return;
        onCrear(nombreTrim, [...seleccionados]);
    }

    const filtrados = contactos.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.cargo || '').toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="chat-modal-overlay" onClick={onCerrar}>
            <div className="chat-modal-crear-grupo" onClick={e => e.stopPropagation()}>
                <div className="chat-modal-header">
                    <h3><IconoFa icono={faUsers} /> Crear Grupo</h3>
                    <button onClick={onCerrar}><IconoFa icono={faTimes} /></button>
                </div>

                <div className="chat-modal-body">
                    <input
                        type="text"
                        className="chat-grupo-nombre-input"
                        placeholder="Nombre del grupo..."
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        autoFocus
                    />

                    <div className="chat-grupo-busqueda">
                        <IconoFa icono={faSearch} />
                        <input
                            type="text"
                            placeholder="Buscar contacto..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                        />
                    </div>

                    <div className="chat-grupo-seleccion-info">
                        {seleccionados.size > 0 ? `${seleccionados.size} contacto(s) seleccionado(s)` : 'Selecciona contactos para el grupo'}
                    </div>

                    <div className="chat-grupo-contactos-lista">
                        {filtrados.map(c => (
                            <div
                                key={c.id_personal}
                                className={'chat-grupo-contacto-item' + (seleccionados.has(c.id_personal) ? ' seleccionado' : '')}
                                onClick={() => toggleContacto(c.id_personal)}
                            >
                                <div className="chat-contacto-avatar">
                                    {c.foto ? (
                                        <img src={'/assets/perfiles/' + c.foto} alt="" />
                                    ) : (
                                        <div className="chat-avatar-placeholder">
                                            {c.nombre.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="chat-contacto-info">
                                    <span className="chat-contacto-nombre">{c.nombre}</span>
                                    <span className="chat-contacto-cargo">{c.cargo}</span>
                                </div>
                                <div className="chat-grupo-check">
                                    {seleccionados.has(c.id_personal) && <IconoFa icono={faCheck} />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="chat-modal-footer">
                    <button className="chat-btn-cancelar" onClick={onCerrar}>Cancelar</button>
                    <button
                        className="chat-btn-crear"
                        onClick={handleCrear}
                        disabled={!nombre.trim() || seleccionados.size === 0}
                    >
                        Crear Grupo
                    </button>
                </div>
            </div>
        </div>
    );
}
