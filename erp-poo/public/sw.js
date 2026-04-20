// ============================================================
// Service Worker — INTRANET EQ
// Maneja Web Push Notifications del sistema ERP
// ============================================================

const CACHE_NAME = 'intranet-eq-v1';

// Activar inmediatamente sin esperar a que se cierren otras pestañas
self.addEventListener('install', function (event) {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});

// ── Manejar evento PUSH del servidor ──────────────────────
self.addEventListener('push', function (event) {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch (_e) {
        payload = { title: 'INTRANET EQ', body: event.data.text() };
    }

    const titulo = payload.title || 'INTRANET EQ';
    const opciones = {
        body: payload.body || '',
        icon: payload.icon || '/assets/icono.jpg',
        badge: payload.badge || '/assets/icono.jpg',
        tag: payload.tag || 'intranet-eq-noti',      // Agrupa notificaciones del mismo tipo
        renotify: true,                                // Vibra aunque el tag ya exista
        requireInteraction: false,                     // No requiere clic para cerrar
        silent: false,
        data: {
            url: payload.url || '/',
            timestamp: payload.timestamp || Date.now(),
        },
        actions: [
            { action: 'ver', title: 'Ver ahora' },
            { action: 'cerrar', title: 'Cerrar' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(titulo, opciones)
    );
});

// ── Clic en la notificación ───────────────────────────────
self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.action === 'cerrar') return;

    const urlDestino = (event.notification.data && event.notification.data.url) || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // Si ya hay una ventana abierta, enfocarla y navegar
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if ('focus' in client) {
                    client.focus();
                    client.postMessage({ type: 'PUSH_NAVIGATE', url: urlDestino });
                    return;
                }
            }
            // Si no hay ventana abierta, abrir una nueva
            if (clients.openWindow) {
                return clients.openWindow(urlDestino);
            }
        })
    );
});

// ── Cierre de notificación ────────────────────────────────
self.addEventListener('notificationclose', function (_event) {
    // Sin acción adicional necesaria
});
