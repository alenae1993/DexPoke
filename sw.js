// Mi Dex — funciona sin internet.
// Con internet, la app siempre pide la versión más reciente (si la red tarda más de 4 s, usa la copia guardada).
// Sin internet, usa la copia guardada. Así, al subir archivos nuevos, se ven en cuanto se abre la app.
const APP = "midex-app-v18";
const IMG = "midex-img-v1";
const FONTS = "midex-fonts-v1";
const SHELL = ["./", "index.html", "data.js", "manifest.webmanifest", "batalla.html", "batalla.js", "ps.js", "esx.js", "reto.js", "comp.js", "tiers.js", "champions.js", "competitivo.js", "escalada.js", "sprites.js", "assets.js", "animidx.js", "anim.js", "fonts/pkmndp.ttf",
  "sinnoh.js", "sinnoh_datos.js", "anil_datos.js", "sinnoh_cartas.js", "sinnoh_estados.js", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png"];

self.addEventListener("install", e => {
  // cache: "reload" evita que se guarde una copia vieja que el navegador tuviera en su caché HTTP
  e.waitUntil(caches.open(APP).then(c => c.addAll(SHELL.map(u => new Request(u, {cache: "reload"})))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  const keep = [APP, IMG, FONTS, "midex-spr"];
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => !keep.includes(k)).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Paquetes de sprites: los pide la página por rangos de bytes y los guarda ella misma.
  if (req.headers.has("range") || url.pathname.includes("/spr/")) return;

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
  // La app (mismo sitio): primero la red (versión nueva), si no hay red, la copia guardada.
  if (url.origin === location.origin) {
    e.respondWith(networkFirst(req));
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

async function networkFirst(req) {
  const cache = await caches.open(APP);
  const net = fetch(req, {cache: "no-cache"}).then(res => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  const timeout = new Promise(r => setTimeout(() => r(null), 4000));
  const res = await Promise.race([net, timeout]);
  if (res && res.ok) return res;
  const hit = await cache.match(req, { ignoreSearch: true });
  return hit || (await net) || (await cache.match("index.html")) || new Response("Sin conexión", { status: 503 });
}
