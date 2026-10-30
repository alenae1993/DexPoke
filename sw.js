// Mi Dex — funciona sin internet.
// Con internet, la app siempre pide la versión más reciente (si la red tarda más de 4 s, usa la copia guardada).
// Sin internet, usa la copia guardada. Así, al subir archivos nuevos, se ven en cuanto se abre la app.
const APP = "midex-app-v16";
const IMG = "midex-img-v1";
const FONTS = "midex-fonts-v1";
const SHELL = ["./", "index.html", "data.js", "manifest.webmanifest", "batalla.html", "batalla.js", "ps.js", "esx.js", "reto.js", "comp.js", "tiers.js", "champions.js", "competitivo.js", "escalada.js", "expedicion.js", "sprites.js", "assets.js", "animidx.js", "anim.js", "fonts/pkmndp.ttf",
  "anil.css", "anil.js", "fonts/powerclear.ttf", "fonts/powerclear-bold.ttf", "fonts/powergreen.ttf", "ui/tipos.png",
  "audio/ui_cursor.wav", "audio/ui_back.wav", "audio/ui_dex.wav", "audio/ui_page.wav",
  "anil-batalla.css", "ui/batalla/ball.png", "ui/batalla/ball_ko.png", "ui/batalla/ball_st.png", "ui/batalla/databox_foe.png", "ui/batalla/databox_me.png", "ui/batalla/estados.png", "ui/batalla/mv/bug.png", "ui/batalla/mv/bug_s.png", "ui/batalla/mv/dark.png", "ui/batalla/mv/dark_s.png", "ui/batalla/mv/dragon.png", "ui/batalla/mv/dragon_s.png", "ui/batalla/mv/electric.png", "ui/batalla/mv/electric_s.png", "ui/batalla/mv/fairy.png", "ui/batalla/mv/fairy_s.png", "ui/batalla/mv/fighting.png", "ui/batalla/mv/fighting_s.png", "ui/batalla/mv/fire.png", "ui/batalla/mv/fire_s.png", "ui/batalla/mv/flying.png", "ui/batalla/mv/flying_s.png", "ui/batalla/mv/ghost.png", "ui/batalla/mv/ghost_s.png", "ui/batalla/mv/grass.png", "ui/batalla/mv/grass_s.png", "ui/batalla/mv/ground.png", "ui/batalla/mv/ground_s.png", "ui/batalla/mv/ice.png", "ui/batalla/mv/ice_s.png", "ui/batalla/mv/normal.png", "ui/batalla/mv/normal_s.png", "ui/batalla/mv/poison.png", "ui/batalla/mv/poison_s.png", "ui/batalla/mv/psychic.png", "ui/batalla/mv/psychic_s.png", "ui/batalla/mv/rock.png", "ui/batalla/mv/rock_s.png", "ui/batalla/mv/steel.png", "ui/batalla/mv/steel_s.png", "ui/batalla/mv/water.png", "ui/batalla/mv/water_s.png",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png"];

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
