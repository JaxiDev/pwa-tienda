// Firebase Cloud Messaging Service Worker
// Este archivo DEBE estar en la raíz del proyecto web

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Configuración de Firebase - Proyecto: tiendas-ucq
const firebaseConfig = {
    apiKey: "AIzaSyC0siNHh4rZxuvFOZZuAF91WJJKzrWwoWw",
    authDomain: "tiendas-ucq.firebaseapp.com",
    projectId: "tiendas-ucq",
    storageBucket: "tiendas-ucq.firebasestorage.app",
    messagingSenderId: "217784030468",
    appId: "1:217784030468:web:5a386b292668d0bb28ac51"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Obtener instancia de Messaging
const messaging = firebase.messaging();

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification?.title || 'Nueva notificación';
    // Construir URLs de recursos a partir del scope del SW
    const origin = self.location.origin;
    const scopePath = new URL(self.registration.scope).pathname;
    const iconUrl = origin + scopePath + 'img/192.png';

    const notificationOptions = {
        body: payload.notification?.body || 'Tienes una nueva notificación',
        icon: iconUrl,
        badge: iconUrl,
        tag: payload.data?.tipo || 'general',
        data: payload.data || {},
        requireInteraction: true, // Permanece visible hasta que el usuario la cierre
        vibrate: [200, 100, 200],
        actions: [
            {
                action: 'open',
                title: 'Abrir'
            },
            {
                action: 'close',
                title: 'Cerrar'
            }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click received.');

    event.notification.close();

    if (event.action === 'open' || !event.action) {
        // Abrir la PWA usando el scope del service worker
        const origin = self.location.origin;
        const scopePath = new URL(self.registration.scope).pathname;
        const openUrl = origin + scopePath + 'index.html';
        event.waitUntil(clients.openWindow(openUrl));
    }
});
