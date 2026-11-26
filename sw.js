// ./sw.js (2211_R202) - CertiFly PWA Offline Service Worker Engine
// Developed by: Capt. Mohd Sallehuddin Zaidy
// CertiFly PWA - Flight Crew Compliance & Validity Calculator Suite

const CACHE_NAME = 'cf-2.0.4';

// COMPLETE ASSET MANIFEST: Pre-caches app shell, engines, views, modals, and PDF guides for offline cockpit use
const ASSETS_TO_CACHE = [
  'index.html',
  'main.js',
  'manifest.json',
  'css/style.css',

  // Core Utilities & Component Shells
  'js/config.js',
  'js/notifications.js',
  'js/animations.js',
  'js/storage.js',
  'js/caamParser.js',
  'js/attestationParser.js',
  'js/qsParser.js',
  'js/parser.js',
  'js/scanner.js',
  'js/ui.js',
  'js/tools.js',
  'js/festiveEngine.js',

  // Core UI Component Modules
  'js/components/topbar.js',
  'js/components/dock.js',
  'js/components/menu.js',

  // Dedicated View Modules
  'js/views/dashboard.js',
  'js/views/history.js',
  'js/views/profile.js',
  'js/views/results.js',
  'js/views/toolsUI.js',

  // Self-Injecting EFB Component Modals
  'js/modals/datePickerModal.js',
  'js/modals/timePickerModal.js',
  'js/modals/selectOptionModal.js',
  'js/modals/numberPickerModal.js',
  'js/modals/maxFdpModifiersModal.js',
  'js/modals/recurrentCourseModal.js',
  'js/modals/pdfViewerModal.js',

  // Calculator Engines
  'js/engines/standby-fdp-calculator.js',
  'js/engines/max-fdp-calculator.js',
  'js/engines/pre-flight-rest-calculator.js',
  'js/engines/cumulative-hours-calculator.js',
  'js/engines/medical-validity-calculator.js',
  'js/engines/recurrent-training-calculator.js',
  'js/engines/landing-recency-calculator.js',
  'js/engines/ppc-validity-calculator.js',

  // Vendor Dependencies & Web Workers
  'js/vendor/anime.min.js',
  'js/vendor/qr-scanner.umd.min.js',
  'js/vendor/qr-scanner-worker.min.js',
  'js/vendor/qrcode.min.js',
  'js/vendor/heic2any.min.js',

  // Static Assets, Icons & Guides
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/apple-touch-icon.png',
  'assets/icons/favicon-32x32.png',
  'assets/festive-config.json',
  'assets/pdf/user_guide.pdf',
  'assets/pdf/eclipse_guide.pdf'
];

// INSTALL: Pre-cache the App Shell, Modules, and User Guides
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('CertiFly: Pre-caching complete App Shell & modular sub-systems...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch((err) => {
      console.warn('CertiFly SW install cache warning:', err);
    })
  );
  self.skipWaiting();
});

// ACTIVATE: Clean up stale cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('CertiFly: Purging outdated cache store...', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// FETCH: Network-First for festive-config.json, Cache-First with Fallback for rest
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests or Vercel API proxy requests
  if (event.request.method !== 'GET' || event.request.url.includes('/api/proxy')) {
    return;
  }

  // Network-First strategy for festive configuration
  if (event.request.url.includes('festive-config.json')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Standard Cache-First with Network Fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('index.html');
      }
    })
  );
});
