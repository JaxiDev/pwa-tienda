const CACHE_NAME = 'narvaez-cache-v1';
const urlsToCache = [
  './',
  'index.html',
  'pages/homeRepartidor.html',
  'pages/dasboardAdmin.html',
  'pages/loginAdmin.html',
  'pages/loginRepartidor.html',
  'pages/pedidos.html',
  'pages/pedidosPendientes.html',
  'pages/gestionPedidos.html',
  'pages/gestionProductos.html',
  'pages/gestionTiendas.html',
  'pages/gestionRepartidores.html',
  'pages/detalleTienda.html',
  'pages/perfil.html',
  'pages/registroVisita.html',
  'pages/visitasTemporal.html',
  'pages/confirmacionPedido.html',
  'pages/panelNotificaciones.html',
  'css/styles.css',
  'css/responsive.css',
  'js/app.js',
  'js/offline.js'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker instalándose...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache).catch(err => {
          console.log('Error al cachear algunos recursos:', err);
          // Cachear solo los que se puedan cargar
          return Promise.all(
            urlsToCache.map(url =>
              cache.add(url).catch(() => console.log(`No se pudo cachear: ${url}`))
            )
          );
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker activándose...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - Estrategia: Cache First, luego Network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Para navegación, usar Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cachear la respuesta
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // Si no hay red, servir del cache
          return caches.match(request)
            .then(response => response || caches.match('offline.html'));
        })
    );
  } else {
    // Para otros recursos, Cache First
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then(response => {
              // Cachear la respuesta
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }
              const clonedResponse = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, clonedResponse);
              });
              return response;
            })
            .catch(() => {
              // Respuesta offline para imágenes
              if (request.destination === 'image') {
                return new Response(
                  '<svg role="img" aria-label="Imagen no disponible" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>',
                  { headers: { 'Content-Type': 'image/svg+xml' } }
                );
              }
              return null;
            });
        })
    );
  }
});

// Sincronización en segundo plano (opcional)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pedidos') {
    event.waitUntil(
      // Aquí puedes sincronizar datos cuando vuelva la conexión
      Promise.resolve()
    );
  }
});

// Notificaciones push (opcional)
self.addEventListener('push', event => {
    const options = {
    body: event.data ? event.data.text() : 'Nueva notificación',
    icon: 'assets/icons/icon-192x192.png',
    badge: 'assets/icons/icon-192x192.png',
    tag: 'narvaez-notification'
  };

  event.waitUntil(
    self.registration.showNotification('Narvaez', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ((client.url.endsWith('/') || client.url.endsWith('/index.html')) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('index.html');
      }
    })
  );
});
