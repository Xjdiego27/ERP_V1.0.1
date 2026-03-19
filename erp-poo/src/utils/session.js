// session.js — Acceso seguro al localStorage de sesión.
// Reemplaza JSON.parse(localStorage.getItem('session')) en todo el proyecto.

/**
 * Lee la sesión del localStorage con protección contra JSON corrupto.
 * @returns {object|null} Datos de sesión o null si no existe / es inválido.
 */
export function getSession() {
  try {
    return JSON.parse(localStorage.getItem('session'));
  } catch (_) {
    localStorage.removeItem('session');
    return null;
  }
}

/**
 * Obtiene id_personal del usuario autenticado.
 * @returns {number|null}
 */
export function getIdPersonal() {
  const s = getSession();
  return s?.usuario?.id_personal ?? null;
}

/**
 * Obtiene el nombre completo del usuario.
 * @returns {string}
 */
export function getNombreUsuario() {
  const s = getSession();
  return s?.usuario?.nombre ?? 'Usuario';
}
