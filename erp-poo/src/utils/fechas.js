/**
 * Formatea una fecha de cualquier formato a DD/MM/YYYY.
 * Acepta: "YYYY-MM-DD", "YYYY-MM-DD HH:MM:SS", Date, ISO string, etc.
 * Retorna "—" si la fecha es vacía/inválida.
 */
export function formatFechaGlobal(valor) {
  if (!valor || valor === '—' || valor === '-') return '—';
  var str = String(valor);

  // Si ya está en formato DD/MM/YYYY, retornar tal cual
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;

  // Intentar parsear YYYY-MM-DD o YYYY-MM-DD HH:MM:SS
  var match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return match[3] + '/' + match[2] + '/' + match[1];

  // Intentar con new Date
  try {
    var d = new Date(str);
    if (!isNaN(d.getTime())) {
      var dd = String(d.getDate()).padStart(2, '0');
      var mm = String(d.getMonth() + 1).padStart(2, '0');
      var yyyy = d.getFullYear();
      return dd + '/' + mm + '/' + yyyy;
    }
  } catch (e) { /* ignorar */ }

  return str;
}

/**
 * Formatea fecha + hora: DD/MM/YYYY HH:MM
 */
export function formatFechaHora(valor) {
  if (!valor || valor === '—' || valor === '-') return '—';
  var str = String(valor);

  // Intentar parsear YYYY-MM-DD HH:MM:SS
  var match = str.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
  if (match) return match[3] + '/' + match[2] + '/' + match[1] + ' ' + match[4] + ':' + match[5];

  // ISO format
  try {
    var d = new Date(str);
    if (!isNaN(d.getTime())) {
      var dd = String(d.getDate()).padStart(2, '0');
      var mm = String(d.getMonth() + 1).padStart(2, '0');
      var yyyy = d.getFullYear();
      var hh = String(d.getHours()).padStart(2, '0');
      var mi = String(d.getMinutes()).padStart(2, '0');
      return dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + mi;
    }
  } catch (e) { /* ignorar */ }

  return str;
}
