// ⭐⭐⭐ Service Worker - Auto Update Version ⭐⭐⭐
const CACHE_NAME = 'alhasan-pwa-v3'; // ⭐ ارفع الرقم عند كل تعديل كبير
const ASSETS = ['./', './index.html'];

self.addEventListener('install', (event) => {
    console.log('🔧 SW: Installing...');
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.all(
                ASSETS.map((url) => cache.add(url).catch(() => null))
            );
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('🔧 SW: Activating...');
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => {
                    console.log('🗑️ حذف كاش قديم:', k);
                    return caches.delete(k);
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin && url.origin !== location.origin) return;
    
    // Network-First لـ index.html (الأهم للتحديثات)
    if (event.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname === '/') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone).catch(() => null));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request).then((cached) => {
                        return cached || caches.match('./index.html');
                    });
                })
        );
        return;
    }
    
    // Cache-First لبقية الملفات
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone).catch(() => null));
                }
                return response;
            });
        })
    );
});