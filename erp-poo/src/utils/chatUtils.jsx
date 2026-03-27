// chatUtils.js — Utilidades compartidas por ChatVentana y ChatSala.
// Centraliza: formatHora, renderContenidoMensaje, subirArchivo, descargarArchivo.

import { CHAT_URL, obtenerToken } from '../auth';
import { parseStickerToken } from '../data/stickerCatalog';
import IconoFa from '../components/IconoFa';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

/**
 * Formatea una fecha ISO para mostrar hora (si es hoy) o dd/mm + hora.
 */
export function formatHora(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha);
  const hoy = new Date();
  const esHoy = d.toDateString() === hoy.toDateString();
  const hora = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  if (esHoy) return hora;
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }) + ' ' + hora;
}

/**
 * Sube un archivo al servidor de chat y retorna la respuesta.
 * @returns {{ ok, url, nombre_original, content_type }}
 */
export async function subirArchivo(file) {
  const token = obtenerToken();
  const formData = new FormData();
  formData.append('file', file);
  const resp = await fetch(CHAT_URL + '/upload', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: formData,
  });
  if (!resp.ok) throw new Error('Error al subir archivo');
  return resp.json();
}

/**
 * Determina si una URL es una imagen por su extensión.
 */
export function esImagen(url) {
  if (!url) return false;
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(url);
}

/**
 * Descarga un archivo al equipo local.
 */
export function descargarArchivo(url, nombreArchivo) {
  fetch(url)
    .then(resp => resp.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = nombreArchivo || 'archivo';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    })
    .catch(err => console.error('Error al descargar:', err));
}

/**
 * Renderiza el contenido de un mensaje (archivo, sticker o texto).
 * @param {object} m - Objeto mensaje con campos: tipo, archivo_url, archivo_nombre, contenido
 * @param {boolean} mostrarDescargar - Mostrar botón de descarga (true en chat individual)
 */
export function renderContenidoMensaje(m, mostrarDescargar = false) {
  // Archivo adjunto
  if (m.tipo === 'archivo' && m.archivo_url) {
    const esImg = esImagen(m.archivo_url);
    if (esImg) {
      return (
        <div className="chat-msg-archivo">
          <a href={CHAT_URL + m.archivo_url} target="_blank" rel="noopener noreferrer">
            <img src={CHAT_URL + m.archivo_url} alt={m.archivo_nombre} className="chat-msg-img-preview" />
          </a>
          {mostrarDescargar ? (
            <div className="chat-msg-archivo-footer">
              <span className="chat-msg-archivo-nombre">{m.archivo_nombre}</span>
              <button
                className="chat-msg-descargar-btn"
                title="Guardar en tu equipo"
                onClick={() => descargarArchivo(CHAT_URL + m.archivo_url, m.archivo_nombre)}
              >
                <IconoFa icono={faDownload} /> Guardar
              </button>
            </div>
          ) : (
            <span className="chat-msg-archivo-nombre">{m.archivo_nombre}</span>
          )}
        </div>
      );
    }
    return (
      <div className="chat-msg-archivo">
        <a href={CHAT_URL + m.archivo_url} target="_blank" rel="noopener noreferrer" className="chat-msg-file-link">
          <IconoFa icono={faDownload} /> {m.archivo_nombre}
        </a>
        {mostrarDescargar && (
          <button
            className="chat-msg-descargar-btn"
            title="Guardar en tu equipo"
            onClick={() => descargarArchivo(CHAT_URL + m.archivo_url, m.archivo_nombre)}
          >
            <IconoFa icono={faDownload} /> Guardar
          </button>
        )}
      </div>
    );
  }
  const sticker = parseStickerToken(m.contenido);
  if (sticker) {
    return <img src={sticker.img} alt={sticker.label} className="chat-msg-sticker" />;
  }
  return <span className="chat-msg-texto">{m.contenido}</span>;
}
