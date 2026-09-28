// Mi Dex — funciona sin internet.
// La app y los datos se muestran desde la copia guardada y se actualizan en segundo plano:
// al subir un data.js nuevo, los teléfonos lo ven la siguiente vez que abren la app.
const APP = "midex-app-v6";
const IMG = "midex-img-v1";
const FONTS = "midex-fonts-v1";
const SHELL = ["./", "index.html", "data.js", "manifest.webmanifest", "batalla.html", "batalla.js", "ps.js", "esx.js",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  const keep = [APP, IMG, FONTS];
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => !keep.includes(k)).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Imágenes de Pokémon: se guardan la primera vez que se ven.
  if (url.hostname === "raw.githubusercontent.com") {
    e.respondWith(cacheFirst(req, IMG));
    return;
  }
  // Tipografías
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(cacheFirst(req, FONTS));
    return;
  }
  // La app (mismo sitio): copia guardada al instante + actualización en segundo plano.
  if (url.origin === location.origin) {
    e.respondWith(staleWhileRevalidate(req));
  }
});

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok || res.type === "opaque") cache.put(req, res.clone());
    return res;
  } catch (err) {
    return new Response("", { status: 504 });
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(APP);
  const hit = await cache.match(req, { ignoreSearch: true });
  const net = fetch(req).then(res => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  return hit || (await net) || (await cache.match("index.html")) || new Response("Sin conexión", { status: 503 });
}
