// usePushNotificaciones.js
// Hook para registrar el Service Worker y suscribirse a Web Push Notifications.
// Llama al backend para guardar la suscripción por usuario.

import { useEffect, useRef } from 'react';
import { API_URL, headersConToken } from '../auth';
import { ensureDesktopNotificationPermission } from '../utils/desktopNotifications';

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
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return;
        }

        var listenerRegistrado = false;

        async function registrarYSuscribir() {
            try {
                var permiso = await ensureDesktopNotificationPermission();
                if (permiso !== 'granted') {
                    return;
                }

                if ('serviceWorker' in navigator && !listenerRegistrado) {
                    navigator.serviceWorker.addEventListener('message', function (event) {
                        if (event.data && event.data.type === 'PUSH_NAVIGATE') {
                            var url = event.data.url || '/dashboard';
                            window.dispatchEvent(new CustomEvent('push-navigate', { detail: { url: url } }));
                        }
                    });
                    listenerRegistrado = true;
                }

                if (!('serviceWorker' in navigator) || !('PushManager' in window) || window.location.protocol === 'file:') {
                    return;
                }

                var swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
                await navigator.serviceWorker.ready;

                var suscripcionExistente = await swRegistration.pushManager.getSubscription();
                if (suscripcionExistente && suscripcionEnviada.current) {
                    return;
                }

                var vapidPublicKey = VAPID_PUBLIC_KEY;
                try {
                    var respClave = await fetch(API_URL + '/push/vapid-public-key', {
                        headers: headersConToken(),
                    });
                    if (respClave.ok) {
                        var dataClave = await respClave.json();
                        vapidPublicKey = dataClave.public_key || vapidPublicKey;
                    }
                } catch (_error) {
                }

                var suscripcion = suscripcionExistente || await swRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                });

                if (!suscripcionEnviada.current) {
                    var respSuscripcion = await fetch(API_URL + '/push/suscribir', {
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
                    if (respSuscripcion.ok) {
                        suscripcionEnviada.current = true;
                    }
                }
            } catch (err) {
                console.warn('[Push] No se pudo suscribir:', err);
            }
        }

        // Pequeño delay para no bloquear el renderizado inicial
        var timer = setTimeout(registrarYSuscribir, 3000);
        return function () { clearTimeout(timer); };
    }, []);
}
