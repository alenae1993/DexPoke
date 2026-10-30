/* Estilo Pokémon Añil para Mi Dex: sonidos de menú del juego, tema claro/oscuro, sprite animado y grito en la ficha,
   y efectos de entrada. Usa los globales de index.html (P, stack) y, al abrir la primera ficha, carga sprites.js y
   assets.js (los mismos paquetes de sprites y gritos que usa la batalla). */
const ANIL_KEY = {snd: "pkdx-anil-snd", theme: "pkdx-anil-theme"};
const anilGet = k => { try { return localStorage.getItem(ANIL_KEY[k]); } catch (e) { return null; } };
const anilSet = (k, v) => { try { localStorage.setItem(ANIL_KEY[k], v); } catch (e) {} };
document.documentElement.dataset.theme = anilGet("theme") === "light" ? "light" : "dark";

/* ---------- sonidos ---------- */
const anilSndOn = () => anilGet("snd") !== "0";
const ANIL_SFX = {};
function anilSfx(name, vol = .55) {
  if (!anilSndOn()) return;
  const base = ANIL_SFX[name] || (ANIL_SFX[name] = new Audio(`audio/${name}.${name.startsWith("ui_") ? "wav" : "mp3"}`));
  const a = base.paused ? base : base.cloneNode(); a.volume = vol; a.currentTime = 0; a.play().catch(() => {});
}

/* ---------- paquetes de sprites y gritos (copia mínima del cargador de batalla.js) ---------- */
const ANIL_FULL = {}, ANIL_BLOB = {};
async function anilSlice(file, off, len) {
  if (ANIL_FULL[file]) return (await ANIL_FULL[file]).slice(off, off + len);
  const res = await fetch("spr/" + file, {headers: {Range: `bytes=${off}-${off + len - 1}`}});
  if (!res.ok) throw new Error("sin paquete");
  if (res.status === 206) return res.arrayBuffer();
  const all = res.arrayBuffer(); ANIL_FULL[file] = all; return (await all).slice(off, off + len);
}
function anilPack(ck, file, off, len, mime) {
  return ANIL_BLOB[ck] || (ANIL_BLOB[ck] = (async () => {
    let blob = null;
    try { const c = await caches.open("midex-spr"); const r = await c.match(ck); if (r) blob = await r.blob(); } catch (e) {}
    if (!blob) {
      blob = new Blob([await anilSlice(file, off, len)], {type: mime});
      try { const c = await caches.open("midex-spr"); await c.put(ck, new Response(blob)); } catch (e) {}
    }
    return URL.createObjectURL(blob);
  })().catch(() => null));
}
let anilLibs = null;
function anilLoadLibs() {
  if (anilLibs) return anilLibs;
  const one = src => new Promise(r => { const s = document.createElement("script"); s.src = src; s.onload = s.onerror = r; document.head.appendChild(s); });
  return (anilLibs = Promise.all([typeof SPR === "undefined" ? one("sprites.js") : 0, typeof ASSET === "undefined" ? one("assets.js") : 0]));
}
// Clave de sprite/grito: solo especies base hasta la Gen 8 (las formas usan la ilustración).
const anilKey = p => !p.fk && p.id >= 1 && p.id <= 905 ? String(p.id).padStart(3, "0") : "";
async function anilCry(p) {
  const k = anilKey(p); if (!k || !anilSndOn()) return;
  await anilLoadLibs(); const e = typeof ASSET !== "undefined" && ASSET.idx.Cry[k]; if (!e) return;
  const u = await anilPack(`spr/a${ASSET.v}/Cry/${k}`, ASSET.packs[e[0]], e[1], e[2], "audio/mpeg");
  if (u && anilSndOn()) { const a = new Audio(u); a.volume = .7; a.play().catch(() => {}); }
}
let anilShiny = false;
async function anilSprite(disc, p) {
  const k = anilKey(p); if (!k) return;
  await anilLoadLibs(); if (typeof SPR === "undefined") return;
  const dir = anilShiny && SPR.idx.FrontShiny?.[k] ? "FrontShiny" : "Front", e = SPR.idx[dir]?.[k]; if (!e) return;
  const u = await anilPack(`spr/s${SPR.v}/${dir}/${k}`, SPR.packs[e[0]], e[1], e[2], "image/png");
  if (!u || !disc.isConnected) return;
  const px = Math.min(104, e[5] * 2.5), el = disc.querySelector(".anil-spr") || disc.appendChild(document.createElement("span"));
  el.className = "anil-spr";
  el.style.cssText = `--s:${px}px;--w:${(px * e[4] / e[5]).toFixed(2)}px;--n:${e[3]};--d:${Math.max(.4, e[3] / 26).toFixed(2)}s;background-image:url("${u}")`;
  disc.classList.add("anil-sp");
}

/* ---------- ficha: sprite animado, grito y variocolor ---------- */
let anilView = null;
function anilSheet() {
  const sin = document.getElementById("sheetIn"), v = typeof stack !== "undefined" && stack[stack.length - 1];
  if (!sin || !v) { anilView = null; return; }
  const fresh = v !== anilView; anilView = v;
  if (fresh) { sin.classList.add("anil-enter"); clearTimeout(anilSheet.t); anilSheet.t = setTimeout(() => sin.classList.remove("anil-enter"), 900); }
  if (v.k !== "p") return;
  const p = P[v.i], hero = sin.querySelector(".hero"), disc = hero?.querySelector(".disc");
  if (!disc || hero.dataset.anil) return; hero.dataset.anil = 1;
  if (anilKey(p)) {
    hero.children[1]?.insertAdjacentHTML("beforeend", `<div class="anil-hbtn"><button data-anil-cry>♪ Grito</button><button data-anil-shiny aria-pressed="${anilShiny}">✦ Variocolor</button></div>`);
    anilSprite(disc, p);
    if (fresh) setTimeout(() => anilCry(p), 280);
  }
}
function anilEnter(id) {
  const el = document.getElementById(id); if (!el) return;
  el.classList.remove("anil-enter"); void el.offsetWidth; el.classList.add("anil-enter");
  clearTimeout(anilEnter[id]); anilEnter[id] = setTimeout(() => el.classList.remove("anil-enter"), 900);
}

/* ---------- botones de sonido y tema en la cabecera ---------- */
const ANIL_ICON = {
  on: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/></svg>',
  off: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9 5 6m0-6-5 6"/></svg>',
  dark: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>',
  light: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
};
function anilTools() {
  document.querySelectorAll(".brand:not([data-anil])").forEach(b => {
    b.dataset.anil = 1; const on = anilSndOn(), th = document.documentElement.dataset.theme;
    b.querySelector("h1")?.insertAdjacentHTML("afterend", `<div class="anil-tools">
      <button data-anil-snd aria-pressed="${on}" title="${on ? "Silenciar sonidos" : "Activar sonidos"}">${ANIL_ICON[on ? "on" : "off"]}</button>
      <button data-anil-theme title="${th === "light" ? "Pantalla oscura" : "Pantalla clara"}">${ANIL_ICON[th === "light" ? "light" : "dark"]}</button></div>`);
  });
}
function anilRefreshTools() { document.querySelectorAll(".brand[data-anil]").forEach(b => { b.querySelector(".anil-tools")?.remove(); delete b.dataset.anil; }); anilTools(); }

/* ---------- clics ---------- */
document.addEventListener("click", e => {
  const b = e.target.closest?.("button"); if (!b) return;
  if (b.hasAttribute("data-anil-snd")) { anilSet("snd", anilSndOn() ? "0" : "1"); anilRefreshTools(); anilSfx("ui_cursor"); return; }
  if (b.hasAttribute("data-anil-theme")) { const t = document.documentElement.dataset.theme === "light" ? "dark" : "light"; document.documentElement.dataset.theme = t; anilSet("theme", t); anilRefreshTools(); anilSfx("ui_cursor"); return; }
  if (b.hasAttribute("data-anil-cry")) { const v = stack[stack.length - 1]; if (v?.k === "p") anilCry(P[v.i]); return; }
  if (b.hasAttribute("data-anil-shiny")) {
    const v = stack[stack.length - 1], disc = document.querySelector("#sheetIn .hero .disc"); if (v?.k !== "p" || !disc) return;
    anilShiny = !anilShiny; b.setAttribute("aria-pressed", anilShiny);
    anilSprite(disc, P[v.i]).then(() => { disc.classList.remove("anil-shine"); void disc.offsetWidth; disc.classList.add("anil-shine"); });
    if (anilShiny) anilSfx("se_shiny", .5); else anilSfx("ui_cursor");
    return;
  }
  if (b.dataset.back != null) return anilSfx("ui_back");
  if (b.dataset.p != null) return anilSfx("ui_dex", .45);
  if (b.dataset.tab) { anilSfx("ui_page"); return setTimeout(() => anilEnter("main")); }
  if (b.closest("[data-chips]")) { anilSfx("ui_cursor"); return setTimeout(() => anilEnter("main")); }
  if (b.dataset.m || b.dataset.ab) return anilSfx("ui_dex", .45);
  if (b.dataset.mt || b.dataset.lt || b.dataset.at || b.dataset.sim || b.dataset.cmp) return anilSfx("ui_cursor");
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape" && typeof stack !== "undefined" && stack.length) anilSfx("ui_back"); }, true);

new MutationObserver(() => { anilTools(); anilSheet(); }).observe(document.documentElement, {childList: true, subtree: true});
addEventListener("DOMContentLoaded", () => anilEnter("main"));
