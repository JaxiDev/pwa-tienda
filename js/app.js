// Fix aria-hidden issue with modals - executed immediately when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('show.bs.modal', function () {
      this.removeAttribute('aria-hidden');
    });
    modal.addEventListener('hide.bs.modal', function () {
      setTimeout(() => this.setAttribute('aria-hidden', 'true'), 150);
    });
  });
});

// Registrar el Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./js/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado exitosamente:', registration);
        // Verificar actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('Nueva versión del Service Worker disponible');
              showUpdateNotification();
            }
          });
        });
      })
      .catch(error => {
        console.log('Error al registrar Service Worker:', error);
      });

    // Escuchar cambios del Service Worker
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Controlador de Service Worker cambió');
    });
  });
}

// Detectar conexión online/offline
window.addEventListener('online', () => {
  console.log('Conexión en línea restaurada');
  showNotification('Conectado', 'success');
  syncPendingData();
});

window.addEventListener('offline', () => {
  console.log('Conexión perdida - Modo offline');
  showNotification('Sin conexión - Modo offline', 'warning');
});

// Notificar sobre disponibilidad de actualización
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <p>Una nueva versión está disponible</p>
    <button onclick="location.reload()">Actualizar</button>
  `;
  document.body.appendChild(notification);
}

// Función genérica para mostrar notificaciones
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 4px;
    z-index: 9999;
    animation: slideIn 0.3s ease-in-out;
  `;

  if (type === 'success') {
    notification.style.backgroundColor = '#10b981';
  } else if (type === 'warning') {
    notification.style.backgroundColor = '#f59e0b';
  } else {
    notification.style.backgroundColor = '#3b82f6';
  }
  notification.style.color = 'white';

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Solicitar permiso para notificaciones y configurar FCM
async function setupPushNotifications() {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    try {
      // 1. Solicitar permiso
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Permiso de notificaciones concedido');

        // 2. Obtener Token
        const token = await messaging.getToken({ vapidKey: 'YOUR_PUBLIC_VAPID_KEY' }); // Optional VAPID
        if (token) {
          console.log('FCM Token:', token);

          // 3. Enviar al backend si hay usuario logueado
          const user = JSON.parse(localStorage.getItem('user'));
          if (user && user.id) {
            try {
              await UserAPI.saveFcmToken(user.id, token);
              console.log('Token enviado al backend');
            } catch (e) {
              console.error('Error enviando token al backend:', e);
            }
          }
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }

        // 4. Manejar mensajes en primer plano
        messaging.onMessage((payload) => {
          console.log('Message received. ', payload);
          const { title, body } = payload.notification || payload.data; // data payload or notification payload
          showNotification(`${title}: ${body}`, 'info');
        });

      } else {
        console.log('Permiso de notificaciones denegado');
      }
    } catch (err) {
      console.log('Error al configurar notificaciones:', err);
    }
  }
}

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
  checkPWAInstallation();
  setupPushNotifications(); // Llamar a la nueva función integrada

  // Cargar estilos para notificaciones
  addNotificationStyles();
});

function addNotificationStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .notification {
      animation: slideIn 0.3s ease-in-out;
    }
    
    .update-notification {
      position: fixed;
      bottom: 20px;
      left: 20px;
      padding: 15px 20px;
      background-color: #3b82f6;
      color: white;
      border-radius: 4px;
      z-index: 9999;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .update-notification button {
      margin-left: 10px;
      padding: 5px 15px;
      background-color: white;
      color: #3b82f6;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-weight: bold;
    }
    
    .update-notification button:hover {
      background-color: #f0f9ff;
    }
  `;
  document.head.appendChild(style);
}
