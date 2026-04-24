/**
 * Retorna la URL completa de la foto de perfil dado el campo FOTO del backend.
 * Si está vacío o es null, retorna null.
 * El frontend ya prefija /assets/perfiles/ — esta función es para normalizar.
 */
export function fotoPerfilUrl(foto) {
    if (!foto) return null;
    // Evitar doble prefijo si ya viene con la ruta completa
    if (foto.startsWith('/assets/') || foto.startsWith('http')) return foto;
    return '/assets/perfiles/' + foto;
}

/**
 * onError handler para <img> de avatares.
 * Oculta la imagen rota y muestra el elemento siguiente (placeholder).
 */
export function onFotoError(e) {
    e.target.style.display = 'none';
    const sib = e.target.nextElementSibling;
    if (sib) sib.style.display = 'flex';
}
