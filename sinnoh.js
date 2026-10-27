"use strict";
/* ---------- Leyendas de Sinnoh: visor del mapa, sin reglas de juego ---------- */
if (!ST.sin) { ST.sin = {cam: null}; save(); }
const SIN_S = 48, SIN_H = Math.sqrt(3) / 2 * SIN_S, SIN_LIFT = 6;
const SIN_ES = {
  Plains: "Llanura", Forest: "Bosque", Mountain: "Montaña", Ocean: "Océano", Ruins: "Ruinas", Space: "Espacio",
  Cold: "Frío", Temperate: "Templado", Warm: "Cálido",
  W: "Débil", M: "Moderado", S: "Fuerte", L: "Legendario", D: "Distorsión"
};
const SIN_COLORS = {Red: "rojo", Blue: "azul", Yellow: "amarillo", Pink: "rosa", White: "blanco", Green: "verde", Black: "negro"};
const SIN_NAMES = {
  "Apricorn Reef": "Arrecife de Bonguri", "Warped Apricorn Tree": "Árbol de Bonguri deformado",
  Campsite: "Campamento", "Alpha Pokémon": "Pokémon Alfa", "Fallen Star": "Estrella caída",
  "Odd Keystone": "Piedra Espíritu", "Gracidea Flower": "Flor Gracídea", "Seafarer Egg": "Huevo del navegante",
  "Magma Stone": "Piedra Magma", "Secret Key": "Llave Secreta", "Steelrock Core": "Núcleo Steelrock",
  "Icesteel Core": "Núcleo Icesteel", "Rockice Core": "Núcleo Rockice", "Adamant Artifact": "Diamansfera",
  "Lustrous Artifact": "Lustresfera", "Griseous Artifact": "Griseosfera", "The Distortion World": "Mundo Distorsión"
};
const SIN_CELLS = SIN.hexes.map(h => ({...h, x: h.c * 1.5 * SIN_S, y: -h.r * SIN_H - h.l * SIN_LIFT, tokens: []}))
  .sort((a, b) => a.l - b.l || b.r - a.r || a.c - b.c);
const SIN_BY_CELL = new Map(SIN_CELLS.map(h => [h.c + "," + h.r, h]));
SIN.tokens.forEach(t => { const h = t.cell && SIN_BY_CELL.get(t.cell.join(",")); if (h) h.tokens.push(t); });
const SIN_BOUNDS = {
  x: Math.min(...SIN_CELLS.map(h => h.x - SIN_S)) - 10,
  y: Math.min(...SIN_CELLS.map(h => h.y - SIN_H)) - 10,
  right: Math.max(...SIN_CELLS.map(h => h.x + SIN_S)) + 10,
  bottom: Math.max(...SIN_CELLS.map(h => h.y + SIN_H + h.l * SIN_LIFT + 5)) + 10
};
const SIN_IMAGES = new Map(), SIN_QUEUE = [];
let SIN_LOADING = false, SIN_TERRAIN = null, SIN_DIRTY = true, SIN_VIEW = null;

const sinStyle = document.createElement("style");
sinStyle.textContent = `
  body.sin-view{overflow:hidden;overscroll-behavior:none}
  .sin-view .wrap{max-width:none;padding:0}
  .sin-layout{height:calc(100vh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px));height:calc(100dvh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px));display:grid;grid-template-rows:auto minmax(0,1fr) auto}
  .sin-top{display:flex;align-items:center;gap:12px;padding:10px 16px;background:var(--surface);border-bottom:1px solid var(--line)}
  .sin-top h1{font:600 22px var(--display);margin:0;flex:1}
  .sin-tools{display:flex;gap:5px;align-items:center}
  .sin-tools .btn{padding:7px 12px;min-height:40px}
  .sin-stage{position:relative;min-height:0;background:#131d20;overflow:hidden}
  #sin-map{display:block;width:100%;height:100%;touch-action:none;cursor:grab;outline-offset:-3px}
  #sin-map.sin-drag{cursor:grabbing}
  .sin-hint{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);max-width:calc(100% - 24px);width:max-content;padding:6px 12px;border-radius:20px;color:#d3dfda;background:#101a20d9;font-size:12px;text-align:center;pointer-events:none}
  .sin-card{padding:12px 16px;background:var(--surface);border-top:1px solid var(--line);max-height:34vh;overflow:auto;overscroll-behavior:contain}
  .sin-card[hidden]{display:none}
  .sin-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
  .sin-card h2{font:600 19px var(--display);margin:0}
  .sin-card p{margin:5px 0 10px;color:var(--ink2)}
  .sin-tokens{display:flex;gap:8px;flex-wrap:wrap;margin:0;padding:0;list-style:none}
  .sin-tokens li{flex:1 1 220px;border:1px solid var(--line);border-radius:10px;padding:9px 12px;background:var(--surface2)}
  .sin-tokens small{display:block;color:var(--ink2);margin-top:3px}
  @media(max-width:540px){.sin-top{flex-wrap:wrap;gap:8px;padding:8px 12px}.sin-top h1{font-size:19px}.sin-tools{width:100%;justify-content:flex-end}.sin-tools .btn{min-width:44px}.sin-card{padding:10px 12px}.sin-hint{font-size:11px}}
`;
document.head.appendChild(sinStyle);

function sinName(t) {
  const m = /^(Red|Blue|Yellow|Pink|White|Green|Black) Apricorn (Tree|Stash)$/.exec(t.n);
  if (m) return (m[2] === "Tree" ? "Árbol de Bonguri " : "Alijo de Bonguri ") + SIN_COLORS[m[1]];
  return SIN_NAMES[t.n] || t.n || "Token sin nombre";
}
function sinMeta(t) {
  const tags = t.tags || [], b = t.b || tags.find(s => ["Plains", "Forest", "Mountain", "Ocean", "Ruins", "Space"].includes(s));
  const k = t.k || tags.find(s => ["Cold", "Temperate", "Warm"].includes(s));
  const tier = t.tier || ({"Weak Encounter Card": "W", "Moderate Encounter Card": "M", "Strong Encounter Card": "S", "Legendary Encounter Card": "L", "Distortion Encounter Card": "D"})[tags.find(s => /Encounter Card$/.test(s))];
  return ["Bioma: " + (SIN_ES[b] || "Sin especificar"), "Clima: " + (SIN_ES[k] || "Sin especificar"), "Encuentro: " + (SIN_ES[tier] || "Sin especificar")].join(" · ");
}
function sinImage(key) {
  if (!key || !SIN.img[key]) return null;
  if (!SIN_IMAGES.has(key)) { SIN_IMAGES.set(key, null); SIN_QUEUE.push(key); sinLoadNext(); }
  return SIN_IMAGES.get(key);
}
async function sinLoadNext() {
  if (SIN_LOADING || !SIN_QUEUE.length) return;
  SIN_LOADING = true;
  const key = SIN_QUEUE.shift(), e = SIN.img[key];
  try {
    const url = await packURL(`spr/sin${SIN.v}/${key}`, SIN.packs[e[0]], e[1], e[2], "image/webp");
    if (url) {
      const im = new Image(); im.src = url; await im.decode(); SIN_IMAGES.set(key, im);
      if (key.startsWith("tex")) SIN_DIRTY = true;
      sinRequestDraw();
    }
  } catch (err) { /* Un recurso ausente deja el color o el marcador de respaldo. */ }
  finally { SIN_LOADING = false; sinLoadNext(); }
}
function sinHex(ctx, x, y) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, px = x + SIN_S * Math.cos(a), py = y + SIN_S * Math.sin(a);
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath();
}
function sinSide(ctx, h) {
  const depth = h.l * SIN_LIFT + 5;
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI / 3, b = (i + 1) * Math.PI / 3;
    const x1 = h.x + SIN_S * Math.cos(a), y1 = h.y + SIN_S * Math.sin(a);
    const x2 = h.x + SIN_S * Math.cos(b), y2 = h.y + SIN_S * Math.sin(b);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x2, y2 + depth); ctx.lineTo(x1, y1 + depth); ctx.closePath();
    ctx.fillStyle = h.col2 || h.col; ctx.fill(); ctx.fillStyle = i === 0 ? "#0006" : "#0008"; ctx.fill();
    ctx.strokeStyle = "#101b2070"; ctx.lineWidth = .7; ctx.stroke();
  }
}
function sinTerrain() {
  if (!SIN_TERRAIN) SIN_TERRAIN = document.createElement("canvas");
  const c = SIN_TERRAIN;
  c.width = Math.ceil(SIN_BOUNDS.right - SIN_BOUNDS.x); c.height = Math.ceil(SIN_BOUNDS.bottom - SIN_BOUNDS.y);
  const ctx = c.getContext("2d"); ctx.translate(-SIN_BOUNDS.x, -SIN_BOUNDS.y);
  // Las piezas bajas se pintan primero; las altas dejan visibles los costados de sus escalones.
  SIN_CELLS.forEach(h => {
    sinSide(ctx, h); ctx.save(); sinHex(ctx, h.x, h.y); ctx.clip();
    ctx.fillStyle = h.w ? (h.col2 || "#567876") : h.col;
    ctx.fillRect(h.x - SIN_S, h.y - SIN_H, SIN_S * 2, SIN_H * 2);
    if (h.w) { ctx.globalAlpha = .5; ctx.fillStyle = h.col; ctx.fillRect(h.x - SIN_S, h.y - SIN_H, SIN_S * 2, SIN_H * 2); ctx.globalAlpha = 1; }
    const im = sinImage("tex" + h.t);
    if (im) { ctx.globalCompositeOperation = "multiply"; ctx.drawImage(im, h.x - SIN_S, h.y - SIN_H, SIN_S * 2, SIN_H * 2); }
    ctx.restore(); sinHex(ctx, h.x, h.y); ctx.strokeStyle = "#16262299"; ctx.lineWidth = .8; ctx.stroke();
  });
  SIN_DIRTY = false;
}
function sinRequestDraw() {
  const v = SIN_VIEW;
  if (!v || v.frame) return;
  v.frame = requestAnimationFrame(() => { v.frame = 0; if (v === SIN_VIEW && v.canvas.isConnected) sinDraw(); });
}
function sinDraw() {
  const v = SIN_VIEW; if (!v || !v.cam) return;
  if (SIN_DIRTY) sinTerrain();
  const ctx = v.canvas.getContext("2d"), dpr = v.dpr, {x, y, z} = v.cam;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, v.w, v.h);
  ctx.translate(v.w / 2, v.h / 2); ctx.scale(z, z); ctx.translate(-x, -y);
  ctx.drawImage(SIN_TERRAIN, SIN_BOUNDS.x, SIN_BOUNDS.y);
  SIN_CELLS.forEach(h => {
    if (Math.abs(h.x - x) > v.w / (2 * z) + SIN_S || Math.abs(h.y - y) > v.h / (2 * z) + SIN_S) return;
    if (h === v.selected) {
      sinHex(ctx, h.x, h.y); ctx.fillStyle = "#fff4"; ctx.fill(); ctx.strokeStyle = "#ffde75"; ctx.lineWidth = 3 / z; ctx.stroke();
    }
    h.tokens.forEach((t, i) => {
      // El generador reserva img para el frente y img2 para el reverso de CardCustom.
      const key = t.kind === "CardCustom" ? t.img2 : t.img, im = sinImage(key);
      const n = h.tokens.length, size = n === 1 ? 56 : Math.min(40, 64 / Math.sqrt(n));
      const angle = i * Math.PI * 2 / n, offset = n === 1 ? 0 : 19;
      const tx = h.x + Math.cos(angle) * offset, ty = h.y + Math.sin(angle) * offset;
      if (im) {
        const k = size / Math.max(im.naturalWidth, im.naturalHeight), w = im.naturalWidth * k, ht = im.naturalHeight * k;
        ctx.drawImage(im, tx - w / 2, ty - ht / 2, w, ht);
      } else { ctx.beginPath(); ctx.arc(tx, ty, size / 3, 0, Math.PI * 2); ctx.fillStyle = "#eaf4e229"; ctx.fill(); }
    });
  });
}
function sinLimits(v) {
  const fit = Math.min(v.w / (SIN_BOUNDS.right - SIN_BOUNDS.x + 40), v.h / (SIN_BOUNDS.bottom - SIN_BOUNDS.y + 40));
  return [Math.max(.03, fit * .5), Math.max(3, fit * 12)];
}
function sinClamp(v) {
  const [min, max] = sinLimits(v);
  v.cam.z = Math.max(min, Math.min(max, v.cam.z));
  v.cam.x = Math.max(SIN_BOUNDS.x - v.w / (4 * v.cam.z), Math.min(SIN_BOUNDS.right + v.w / (4 * v.cam.z), v.cam.x));
  v.cam.y = Math.max(SIN_BOUNDS.y - v.h / (4 * v.cam.z), Math.min(SIN_BOUNDS.bottom + v.h / (4 * v.cam.z), v.cam.y));
}
function sinSaveCam() {
  if (!SIN_VIEW || !SIN_VIEW.cam) return;
  ST.sin.cam = {...SIN_VIEW.cam}; save();
}
function sinCenter() {
  const v = SIN_VIEW; if (!v) return;
  v.cam = {x: (SIN_BOUNDS.x + SIN_BOUNDS.right) / 2, y: (SIN_BOUNDS.y + SIN_BOUNDS.bottom) / 2,
    z: Math.min(v.w / (SIN_BOUNDS.right - SIN_BOUNDS.x + 40), v.h / (SIN_BOUNDS.bottom - SIN_BOUNDS.y + 40))};
  sinSaveCam(); sinRequestDraw();
}
function sinResize() {
  const v = SIN_VIEW; if (!v || !v.canvas.isConnected) return;
  const r = v.canvas.getBoundingClientRect(); if (!r.width || !r.height) return;
  v.w = r.width; v.h = r.height; v.dpr = Math.min(window.devicePixelRatio || 1, 2);
  v.canvas.width = Math.round(v.w * v.dpr); v.canvas.height = Math.round(v.h * v.dpr);
  if (!v.cam) sinCenter(); else { sinClamp(v); sinRequestDraw(); }
}
function sinZoom(factor, px, py) {
  const v = SIN_VIEW, old = v.cam.z, [min, max] = sinLimits(v), z = Math.max(min, Math.min(max, old * factor));
  v.cam.x += (px - v.w / 2) * (1 / old - 1 / z); v.cam.y += (py - v.h / 2) * (1 / old - 1 / z);
  v.cam.z = z; sinClamp(v); sinRequestDraw();
}
function sinPick(px, py) {
  const v = SIN_VIEW, x = v.cam.x + (px - v.w / 2) / v.cam.z, y = v.cam.y + (py - v.h / 2) / v.cam.z;
  // Se busca en orden inverso al dibujo para tocar la cara que queda encima.
  const h = [...SIN_CELLS].reverse().find(h => {
    const dx = Math.abs(x - h.x), dy = Math.abs(y - h.y);
    return dx <= SIN_S && dy <= SIN_H && Math.sqrt(3) * dx + dy <= Math.sqrt(3) * SIN_S;
  });
  if (!h) return;
  v.selected = h;
  $("sin-card").innerHTML = `<div class="sin-card-head"><h2>Casilla (${esc(h.c)}, ${esc(h.r)})</h2><button class="btn" data-act="sinclose" aria-label="Cerrar ficha">Cerrar</button></div>
    <p>Nivel de elevación: ${esc(h.l)} · ${esc(h.w ? "Agua" : "Tierra")}${h.dw ? " · Mundo Distorsión" : ""}</p>
    ${h.tokens.length ? `<ul class="sin-tokens">${h.tokens.map(t => `<li><b>${esc(sinName(t))}</b><small>${esc(sinMeta(t))}</small>${t.kind === "CardCustom" ? "<small>Escondite · Boca abajo</small>" : ""}</li>`).join("")}</ul>` : '<p>No hay tokens en esta casilla.</p>'}`;
  $("sin-card").hidden = false; sinRequestDraw();
}
function sinLocal(e) {
  const r = SIN_VIEW.canvas.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top};
}
function sinGesture(points) {
  const p = [...points.values()];
  return p.length > 1 ? {x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2, d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)} : {...p[0], d: 0};
}
function sinDown(e) {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  const v = SIN_VIEW, p = sinLocal(e); e.preventDefault(); v.canvas.setPointerCapture(e.pointerId);
  v.points.set(e.pointerId, p); v.gesture = sinGesture(v.points);
  if (v.points.size === 1) { v.start = p; v.moved = false; } else v.moved = true;
  v.canvas.classList.add("sin-drag");
}
function sinMove(e) {
  const v = SIN_VIEW; if (!v.points.has(e.pointerId)) return;
  e.preventDefault(); const p = sinLocal(e), before = v.gesture;
  v.points.set(e.pointerId, p); const after = sinGesture(v.points);
  if (Math.hypot(p.x - v.start.x, p.y - v.start.y) > 7) v.moved = true;
  if (v.moved) {
    if (v.points.size > 1 && before.d > 0 && after.d > 0) sinZoom(after.d / before.d, before.x, before.y);
    v.cam.x -= (after.x - before.x) / v.cam.z; v.cam.y -= (after.y - before.y) / v.cam.z;
    sinClamp(v); sinRequestDraw();
  }
  v.gesture = after;
}
function sinUp(e) {
  const v = SIN_VIEW; if (!v.points.has(e.pointerId)) return;
  const p = sinLocal(e), tap = e.type === "pointerup" && !v.moved && v.points.size === 1;
  v.points.delete(e.pointerId);
  if (v.canvas.hasPointerCapture(e.pointerId)) v.canvas.releasePointerCapture(e.pointerId);
  if (v.points.size) { v.gesture = sinGesture(v.points); v.moved = true; }
  else { v.canvas.classList.remove("sin-drag"); sinSaveCam(); }
  if (tap) sinPick(p.x, p.y);
}
function sinLeave() {
  const v = SIN_VIEW; if (!v) return;
  sinSaveCam(); v.events.abort(); v.resize.disconnect(); v.removal.disconnect();
  if (v.frame) cancelAnimationFrame(v.frame);
  clearTimeout(v.saveTimer); SIN_VIEW = null;
}
function renderSin() {
  sinLeave();
  $("app").innerHTML = `<div class="sin-layout"><header class="sin-top"><button class="back" data-act="sinback">‹ Batalla</button><h1>Leyendas de Sinnoh</h1>
    <div class="sin-tools"><button class="btn" data-act="sinout" aria-label="Alejar mapa">−</button><button class="btn" data-act="sinin" aria-label="Acercar mapa">+</button><button class="btn" data-act="sincenter">Centrar</button></div></header>
    <div class="sin-stage"><canvas id="sin-map" tabindex="0" aria-label="Mapa de Sinnoh. Arrastra para mover, pellizca o usa más y menos para acercar. Toca una casilla para ver su ficha."></canvas><div class="sin-hint">Arrastra para mover · Pellizca o usa + / − para acercar · Toca una casilla</div></div>
    <section class="sin-card" id="sin-card" aria-live="polite" hidden></section></div>`;
  const saved = ST.sin.cam, cam = saved && [saved.x, saved.y, saved.z].every(Number.isFinite) && saved.z > 0 ? {...saved} : null;
  const v = SIN_VIEW = {canvas: $("sin-map"), cam, w: 0, h: 0, frame: 0, points: new Map(), events: new AbortController()};
  const opt = {signal: v.events.signal};
  v.canvas.addEventListener("pointerdown", sinDown, opt); v.canvas.addEventListener("pointermove", sinMove, opt);
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(name => v.canvas.addEventListener(name, sinUp, opt));
  v.canvas.addEventListener("wheel", e => {
    e.preventDefault(); const p = sinLocal(e), delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? v.h : 1);
    sinZoom(Math.exp(-Math.max(-400, Math.min(400, delta)) * .002), p.x, p.y);
    clearTimeout(v.saveTimer); v.saveTimer = setTimeout(sinSaveCam, 180);
  }, {...opt, passive: false});
  window.addEventListener("pagehide", sinSaveCam, opt);
  v.resize = new ResizeObserver(sinResize); v.resize.observe(v.canvas);
  v.removal = new MutationObserver(() => { if (!v.canvas.isConnected) sinLeave(); });
  v.removal.observe($("app"), {childList: true});
  sinResize();
}
document.addEventListener("click", e => {
  if (e.target.closest("[data-info]")) return;
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const act = b.dataset.act;
  if (act === "sin") return go("sin");
  if (VIEW !== "sin") return;
  if (act === "sinback") { sinLeave(); return go("menu"); }
  if (act === "sincenter") return sinCenter();
  if (act === "sinclose") { $("sin-card").hidden = true; SIN_VIEW.selected = null; return sinRequestDraw(); }
  if (act === "sinin" || act === "sinout") { sinZoom(act === "sinin" ? 1.4 : 1 / 1.4, SIN_VIEW.w / 2, SIN_VIEW.h / 2); sinSaveCam(); }
});
