// auth.js
// Responsabilidad: Gestión del token JWT y configuración de headers HTTP.
// Se usa en todos los fetch() que necesitan autenticación.

// URL base de la API — dinámica para acceso LAN
function getApiUrl() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `${window.location.protocol}//${host}:8000`;
    }
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
}

// URL del servidor de chat — puerto 8001
function getChatUrl() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `${window.location.protocol}//${host}:8001`;
    }
  }
  return import.meta.env.VITE_CHAT_URL || 'http://localhost:8001';
}

const API_URL = getApiUrl();
const CHAT_URL = getChatUrl();

// Obtener el token del localStorage
function obtenerToken() {
  const session = JSON.parse(localStorage.getItem('session'));
  return session?.access_token ?? null;
}

// Headers con el token para peticiones JSON
function headersConToken() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${obtenerToken()}`,
  };
}

// Headers solo con Authorization (para FormData, sin Content-Type)
function headersAuth() {
  return {
    'Authorization': `Bearer ${obtenerToken()}`,
  };
}

export { obtenerToken, headersConToken, headersAuth, API_URL, CHAT_URL };
