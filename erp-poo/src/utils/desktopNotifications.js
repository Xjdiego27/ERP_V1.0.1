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

  try {
    if ('serviceWorker' in navigator) {
      const registro = await navigator.serviceWorker.ready.catch(function () { return null; });
      if (registro && typeof registro.showNotification === 'function') {
        await registro.showNotification(title || 'INTRANET EQ', opciones);
        return true;
      }
    }
  } catch (_error) {
  }

  try {
    const notification = new Notification(title || 'INTRANET EQ', opciones);
    notification.onclick = function () {
      try {
        window.focus();
        window.dispatchEvent(new CustomEvent('push-navigate', { detail: { url: urlDestino } }));
      } catch (_error) {
      }
      notification.close();
    };
    return true;
  } catch (_error) {
    return false;
  }
}