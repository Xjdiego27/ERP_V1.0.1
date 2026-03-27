import { useState, useEffect, useRef, useCallback } from 'react';
import IconoFa from './IconoFa';
import { faTimes, faMinus, faExpand, faPlus, faPen, faTrash, faCheck, faStickyNote, faXmark } from '@fortawesome/free-solid-svg-icons';
import { CHAT_URL, obtenerToken } from '../auth';

const COLORES = [
    '#fef9c3', // amarillo
    '#dbeafe', // azul
    '#dcfce7', // verde
    '#fce7f3', // rosa
    '#f3e8ff', // morado
    '#ffedd5', // naranja
];

/**
 * MiEspacio — Ventana flotante de notas personales.
 * Permite al usuario guardar notas/recordatorios para sí mismo.
 */
export default function MiEspacio({ onCerrar, panelAbierto, posicion }) {
    const [notas, setNotas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [minimizada, setMinimizada] = useState(false);
    const [nuevaNota, setNuevaNota] = useState('');
    const [colorNueva, setColorNueva] = useState(COLORES[0]);
    const [editandoId, setEditandoId] = useState(null);
    const [textoEdicion, setTextoEdicion] = useState('');
    const [creando, setCreando] = useState(false);
    const inputRef = useRef(null);
    const ventanaRef = useRef(null);

    // Posición: a la derecha del panel (320px panel + 24px margen + 10px gap)
    const offsetRight = (panelAbierto ? 354 : 80) + (posicion || 0) * 320;

    // ── Cargar notas ──
    const cargarNotas = useCallback(async () => {
        const token = obtenerToken();
        if (!token) return;
        try {
            const resp = await fetch(CHAT_URL + '/notas', {
                headers: { 'Authorization': 'Bearer ' + token },
            });
            if (resp.ok) {
                const data = await resp.json();
                setNotas(data);
            }
        } catch (err) {
            console.error('Error cargando notas:', err);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarNotas();
    }, [cargarNotas]);

    // ── Crear nota ──
    async function handleCrear(e) {
        e.preventDefault();
        if (!nuevaNota.trim()) return;
        const token = obtenerToken();
        try {
            const resp = await fetch(CHAT_URL + '/notas', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ contenido: nuevaNota, color: colorNueva }),
            });
            const data = await resp.json();
            if (data.ok) {
                setNotas(prev => [data.nota, ...prev]);
                setNuevaNota('');
                setCreando(false);
            }
        } catch (err) {
            console.error('Error creando nota:', err);
        }
    }

    // ── Editar nota ──
    async function handleEditar(notaId) {
        if (!textoEdicion.trim()) return;
        const token = obtenerToken();
        const notaOriginal = notas.find(n => n.id === notaId);
        try {
            const resp = await fetch(CHAT_URL + '/notas/' + notaId, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contenido: textoEdicion,
                    color: notaOriginal?.color || COLORES[0],
                }),
            });
            const data = await resp.json();
            if (data.ok) {
                setNotas(prev => prev.map(n =>
                    n.id === notaId ? { ...n, contenido: textoEdicion, editado: true } : n
                ));
                setEditandoId(null);
                setTextoEdicion('');
            }
        } catch (err) {
            console.error('Error editando nota:', err);
        }
    }

    // ── Eliminar nota ──
    async function handleEliminar(notaId) {
        const token = obtenerToken();
        try {
            const resp = await fetch(CHAT_URL + '/notas/' + notaId, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token },
            });
            const data = await resp.json();
            if (data.ok) {
                setNotas(prev => prev.filter(n => n.id !== notaId));
            }
        } catch (err) {
            console.error('Error eliminando nota:', err);
        }
    }

    // ── Formatear fecha ──
    function formatFecha(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        const hoy = new Date();
        const ayer = new Date(hoy);
        ayer.setDate(ayer.getDate() - 1);

        const hora = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

        if (d.toDateString() === hoy.toDateString()) return 'Hoy ' + hora;
        if (d.toDateString() === ayer.toDateString()) return 'Ayer ' + hora;
        return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) + ' ' + hora;
    }

    return (
        <div
            ref={ventanaRef}
            className={'chat-ventana mi-espacio-ventana' + (minimizada ? ' chat-ventana-minimizada' : '')}
            style={{ right: offsetRight + 'px' }}
        >
            {/* ── Header ── */}
            <div
                className="chat-ventana-header mi-espacio-header"
                onClick={() => { if (minimizada) setMinimizada(false); }}
                style={{ cursor: minimizada ? 'pointer' : 'default' }}
            >
                <div className="chat-ventana-header-info">
                    <div className="chat-ventana-avatar-mini mi-espacio-avatar">
                        <IconoFa icono={faStickyNote} />
                    </div>
                    <div className="chat-ventana-nombre">
                        <strong>Mi Espacio</strong>
                        <span className="chat-contacto-cargo">Notas personales</span>
                    </div>
                </div>
                <div className="chat-ventana-acciones" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setMinimizada(!minimizada)} title={minimizada ? 'Expandir' : 'Minimizar'}>
                        <IconoFa icono={minimizada ? faExpand : faMinus} />
                    </button>
                    <button onClick={onCerrar} title="Cerrar">
                        <IconoFa icono={faTimes} />
                    </button>
                </div>
            </div>

            {/* ── Cuerpo ── */}
            {!minimizada && (
                <>
                    <div className="mi-espacio-body">
                        {cargando ? (
                            <p className="chat-cargando">Cargando notas...</p>
                        ) : notas.length === 0 && !creando ? (
                            <div className="mi-espacio-vacio">
                                <IconoFa icono={faStickyNote} />
                                <p>No tienes notas aún</p>
                                <span>Crea tu primera nota para recordatorios o ideas</span>
                            </div>
                        ) : (
                            <div className="mi-espacio-notas">
                                {notas.map(nota => (
                                    <div
                                        key={nota.id}
                                        className="mi-espacio-nota"
                                        style={{ backgroundColor: nota.color || COLORES[0] }}
                                    >
                                        {editandoId === nota.id ? (
                                            <div className="mi-espacio-nota-editar">
                                                <textarea
                                                    value={textoEdicion}
                                                    onChange={e => setTextoEdicion(e.target.value)}
                                                    autoFocus
                                                    rows={3}
                                                />
                                                <div className="mi-espacio-nota-editar-btns">
                                                    <button
                                                        className="mi-espacio-btn-guardar"
                                                        onClick={() => handleEditar(nota.id)}
                                                        title="Guardar"
                                                    >
                                                        <IconoFa icono={faCheck} />
                                                    </button>
                                                    <button
                                                        className="mi-espacio-btn-cancelar"
                                                        onClick={() => { setEditandoId(null); setTextoEdicion(''); }}
                                                        title="Cancelar"
                                                    >
                                                        <IconoFa icono={faXmark} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="mi-espacio-nota-texto">{nota.contenido}</p>
                                                <div className="mi-espacio-nota-footer">
                                                    <span className="mi-espacio-nota-fecha">
                                                        {formatFecha(nota.fecha)}
                                                        {nota.editado && ' · editada'}
                                                    </span>
                                                    <div className="mi-espacio-nota-acciones">
                                                        <button
                                                            title="Editar"
                                                            onClick={() => {
                                                                setEditandoId(nota.id);
                                                                setTextoEdicion(nota.contenido);
                                                            }}
                                                        >
                                                            <IconoFa icono={faPen} />
                                                        </button>
                                                        <button
                                                            title="Eliminar"
                                                            onClick={() => handleEliminar(nota.id)}
                                                        >
                                                            <IconoFa icono={faTrash} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Crear nota ── */}
                    {creando ? (
                        <form className="mi-espacio-crear" onSubmit={handleCrear}>
                            <div className="mi-espacio-colores">
                                {COLORES.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={'mi-espacio-color-btn' + (colorNueva === c ? ' activo' : '')}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setColorNueva(c)}
                                        title="Color de nota"
                                    />
                                ))}
                            </div>
                            <textarea
                                ref={inputRef}
                                placeholder="Escribe tu nota..."
                                value={nuevaNota}
                                onChange={e => setNuevaNota(e.target.value)}
                                autoFocus
                                rows={3}
                            />
                            <div className="mi-espacio-crear-btns">
                                <button type="submit" className="mi-espacio-btn-guardar" disabled={!nuevaNota.trim()}>
                                    <IconoFa icono={faCheck} /> Guardar
                                </button>
                                <button type="button" className="mi-espacio-btn-cancelar" onClick={() => { setCreando(false); setNuevaNota(''); }}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="mi-espacio-footer">
                            <button className="mi-espacio-btn-nueva" onClick={() => setCreando(true)}>
                                <IconoFa icono={faPlus} /> Nueva nota
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
