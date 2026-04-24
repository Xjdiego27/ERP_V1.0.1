const DEFAULT_ICON = '/assets/icono.jpg';

let solicitandoPermiso = false;

function normalizarUrl(url) {
  if (!url) return '/dashboard';
  if (url.startsWith('/')) return url;
  return '/dashboard';
}

export async function ensureDesktopNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }

  if (solicitandoPermiso) {
    return Notification.permission;
  }

  solicitandoPermiso = true;
  try {
    return await Notification.requestPermission();
  } catch (_error) {
    return Notification.permission || 'default';
  } finally {
    solicitandoPermiso = false;
  }
}

export async function showDesktopNotification({
  title,
  body,
  icon = DEFAULT_ICON,
  badge = DEFAULT_ICON,
  tag,
  url = '/dashboard',
  silent = false,
  requireInteraction = false,
}) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await ensureDesktopNotificationPermission();

  if (permission !== 'granted') {
    return false;
  }

  const urlDestino = normalizarUrl(url);
  const opciones = {
    body: body || '',
    icon,
    badge,
    tag,
    silent,
    requireInteraction,
    data: { url: urlDestino },
  };

  // ── Ruta 1: Electron vía IPC nativo (más confiable en Windows) ──
  const esElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
  if (esElectron && typeof window.electronAPI?.notify === 'function') {
    try {
      await window.electronAPI.notify(title || 'INTRANET EQ', body || '', tag || '');
      return true;
    } catch (_) {}
  }

  // ── Ruta 2: Service Worker (solo funciona con HTTPS, no Electron) ──
  // navigator.serviceWorker.ready NUNCA resuelve en HTTP ni en Electron.
  // Usamos Promise.race con timeout de 2s para no quedarse colgado.
  if (!esElectron && 'serviceWorker' in navigator) {
    try {
      const registro = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise(resolve => setTimeout(() => resolve(null), 2000)),
      ]).catch(() => null);
      if (registro && typeof registro.showNotification === 'function') {
        await registro.showNotification(title || 'INTRANET EQ', opciones);
        return true;
      }
    } catch (_) {}
  }

  // ── Ruta 3: Notification API directa (fallback universal) ──
  try {
    const notification = new Notification(title || 'INTRANET EQ', opciones);
    notification.onclick = function () {
      try {
        window.focus();
        window.dispatchEvent(new CustomEvent('push-navigate', { detail: { url: urlDestino } }));
      } catch (_) {}
      notification.close();
    };
    return true;
  } catch (_) {
    return false;
  }
}
