/**
 * 🔥 FIREBASE PUSH NOTIFICATIONS
 * Inicializa Firebase Messaging y solicita permisos
 */

// Importar Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging.js';

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
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// VAPID Key (Web Push Certificate) - Proyecto: tiendas-ucq
const VAPID_KEY = 'BC6RaEtdJEqWwxvEbmT6f8mkCF9zzkxQRgWKdP-q4ouGXHlOInXEFjT5rB85WvhV6tRExFUcusDTKY9bZ0qiXTk';

// Calcular base dinámica para el repo (ej: "/pwa-tienda" si está en https://user.github.io/pwa-tienda/)
const REPO_BASE = (function () {
    const parts = location.pathname.split('/').filter(Boolean);
    return parts.length ? `/${parts[0]}` : '';
})();

/**
 * Solicitar permiso y obtener token FCM
 */
async function requestNotificationPermission() {
    try {
        // Verificar soporte
        if (!('Notification' in window)) {
            console.warn('Este navegador no soporta notificaciones');
            return null;
        }

        // Verificar si ya tiene permiso
        if (Notification.permission === 'granted') {
            console.log('✅ Permisos de notificación ya otorgados');
            return await obtenerTokenFCM();
        }

        // Solicitar permiso
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                console.log('✅ Permiso de notificaciones otorgado');
                return await obtenerTokenFCM();
            } else {
                console.log('⚠️ Permiso de notificaciones denegado');
                return null;
            }
        } else {
            console.log('❌ Permisos bloqueados por el usuario');
            return null;
        }
    } catch (error) {
        console.error('Error solicitando permisos:', error);
        return null;
    }
}

/**
 * Obtener token FCM
 */
async function obtenerTokenFCM() {
    try {
        // Registrar service worker primero (usa base dinámica)
        let registration = null;
        if ('serviceWorker' in navigator) {
            try {
                registration = await navigator.serviceWorker.register(`${REPO_BASE}/firebase-messaging-sw.js`);
                console.log('Service Worker registrado:', registration);
            } catch (regErr) {
                console.error('Error registrando Service Worker:', regErr);
            }
        }

        // Obtener token (preferir la registration retornada)
        const currentToken = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration || await navigator.serviceWorker.ready
        });

        if (currentToken) {
            console.log('🔑 Token FCM obtenido:', currentToken);
            return currentToken;
        } else {
            console.log('⚠️ No se pudo obtener el token FCM');
            return null;
        }
    } catch (error) {
        console.error('Error obteniendo token FCM:', error);
        return null;
    }
}

/**
 * Escuchar notificaciones en primer plano
 */
function escucharNotificacionesForeground() {
    onMessage(messaging, (payload) => {
        console.log('📬 Notificación recibida en primer plano:', payload);

        const notificationTitle = payload.notification?.title || 'Nueva notificación';
        const notificationOptions = {
            body: payload.notification?.body || '',
            icon: `${REPO_BASE}/img/192.png`,
            badge: `${REPO_BASE}/img/192.png`,
            tag: payload.data?.tipo || 'general',
            data: payload.data || {},
            requireInteraction: true
        };

        // Mostrar notificación usando la API del navegador
        if (Notification.permission === 'granted') {
            new Notification(notificationTitle, notificationOptions);
        }

        // También mostrar alerta visual en la app
        mostrarAlertaNotificacion(notificationTitle, notificationOptions.body);
    });
}

/**
 * Mostrar alerta visual en la app
 */
function mostrarAlertaNotificacion(titulo, mensaje) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
    position: fixed;
    top: 70px;
    right: 20px;
    background: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 350px;
    animation: slideIn 0.3s ease;
  `;
    notification.innerHTML = `
    <div style="display: flex; align-items: start; gap: 10px;">
      <div style="font-size: 24px;">🔔</div>
      <div style="flex: 1;">
        <strong style="display: block; margin-bottom: 5px;">${titulo}</strong>
        <p style="margin: 0; font-size: 14px; color: #666;">${mensaje}</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="border: none; background: none; font-size: 20px; cursor: pointer; color: #999;">×</button>
    </div>
  `;

    document.body.appendChild(notification);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Agregar animaciones CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Inicializar automáticamente
async function inicializarNotificaciones() {
    const token = await requestNotificationPermission();

    if (token) {
        // Guardar token en el servidor
        const userId = localStorage.getItem('user_id');
        if (userId) {
            try {
                await UserAPI.saveFcmToken(userId, token);
                console.log('✅ Token FCM guardado en el servidor');
            } catch (error) {
                console.error('Error guardando token FCM:', error);
            }
        }

        // Escuchar notificaciones en primer plano
        escucharNotificacionesForeground();
    }
}

// Exportar funciones
window.FirebaseNotifications = {
    inicializar: inicializarNotificaciones,
    requestPermission: requestNotificationPermission,
    getToken: obtenerTokenFCM
};

console.log('🔥 Firebase Notifications módulo cargado');
