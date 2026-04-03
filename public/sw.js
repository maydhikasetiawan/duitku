const CACHE_NAME = 'duitku-v2'
const ASSETS = [
  '/',
  '/index.html',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  )
  // Langsung aktif tanpa nunggu tab lama ditutup
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  // Ambil kontrol semua tab yang terbuka
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  // Network first — selalu coba ambil dari internet dulu
  // Baru fallback ke cache kalau offline
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Simpan ke cache kalau berhasil
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, responseClone)
        })
        return response
      })
      .catch(() => {
        // Offline — ambil dari cache
        return caches.match(e.request)
      })
  )
})