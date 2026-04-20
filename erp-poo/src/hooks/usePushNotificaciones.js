// usePushNotificaciones.js
// Hook para registrar el Service Worker y suscribirse a Web Push Notifications.
// Llama al backend para guardar la suscripción por usuario.

import { useEffect, useRef } from 'react';
import { API_URL, headersConToken } from '../auth';

// Clave pública VAPID — debe coincidir con VAPID_PUBLIC_KEY del backend
const VAPID_PUBLIC_KEY = 'BP1irtdR4fFitQItazHcArSW7GSCBr2hyh99MJH7eEfJTQnck3JT0OLTLcVFYT-4_N0kZBxSTpfKfoRmspIxCAQ';

function urlBase64ToUint8Array(base64String) {
    // Padding
    var padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var rawData = atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotificaciones() {
    var suscripcionEnviada = useRef(false);

    useEffect(function () {
        // Verificar soporte del browser
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return;
        }

        var swRegistration = null;

        async function registrarYSuscribir() {
            try {
                // 1. Registrar (o reutilizar) el Service Worker
                swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

                // 2. Esperar a que esté activo
                await navigator.serviceWorker.ready;

                // 3. Pedir permiso al usuario (solo si no lo ha dado ya)
                var permiso = Notification.permission;
                if (permiso === 'denied') return;
                if (permiso !== 'granted') {
                    permiso = await Notification.requestPermission();
                    if (permiso !== 'granted') return;
                }

                // 4. Ver si ya hay suscripción existente
                var suscripcionExistente = await swRegistration.pushManager.getSubscription();
                if (suscripcionExistente && suscripcionEnviada.current) return;

                // 5. Suscribirse al servidor push
                var suscripcion = suscripcionExistente || await swRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                });

                // 6. Enviar suscripción al backend
                if (!suscripcionEnviada.current) {
                    await fetch(API_URL + '/push/suscribir', {
                        method: 'POST',
                        headers: {
                            ...headersConToken(),
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            endpoint: suscripcion.endpoint,
                            keys: {
                                p256dh: suscripcion.toJSON().keys?.p256dh || '',
                                auth: suscripcion.toJSON().keys?.auth || '',
                            },
                            user_agent: navigator.userAgent,
                        }),
                    });
                    suscripcionEnviada.current = true;
                }

                // 7. Manejar mensajes del SW (para navegar cuando se hace clic en notif)
                navigator.serviceWorker.addEventListener('message', function (event) {
                    if (event.data && event.data.type === 'PUSH_NAVIGATE') {
                        var url = event.data.url || '/';
                        // Navegar sin recargar si es posible
                        window.dispatchEvent(new CustomEvent('push-navigate', { detail: { url: url } }));
                    }
                });

            } catch (err) {
                // Silencioso: push es funcionalidad adicional, no crítica
                console.warn('[Push] No se pudo suscribir:', err);
            }
        }

        // Pequeño delay para no bloquear el renderizado inicial
        var timer = setTimeout(registrarYSuscribir, 3000);
        return function () { clearTimeout(timer); };
    }, []);
}
