// session.js — Acceso seguro al localStorage de sesión.
// Centraliza lectura, escritura y limpieza del estado de sesión.

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
 * Guarda la sesión en localStorage.
 * @param {object} data — Datos de sesión completos.
 */
export function setSession(data) {
  localStorage.setItem('session', JSON.stringify(data));
}

/**
 * Elimina la sesión del localStorage.
 */
export function clearSession() {
  localStorage.removeItem('session');
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
