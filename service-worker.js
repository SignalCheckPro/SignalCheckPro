const CACHE_NAME = 'signalcheck-pro-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/calibrationEngine.js',
    '/pdfGenerator.js',
    '/stateManager.js',
    '/uiManager.js',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js'
];

self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => {
            console.log('Service Worker: Cacheando archivos');
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
        .then((response) => {
            // Devuelve el archivo en caché si lo encuentra
            if (response) {
                return response;
            }
            // Si no lo encuentra, realiza la solicitud de red
            return fetch(event.request);
        })
    );
});
