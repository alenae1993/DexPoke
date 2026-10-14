"use strict";
/* Animaciones de ataques — reproduce las animaciones de Pokémon Essentials (Data/PkmnAnimations.rxdata de tu juego)
   Cada animación: g = gráfico (celdas de 192×192, 5 por fila), h = tono, fr = cuadros [celdas], t = sonidos/flash/fondos.
   Celda: [patrón, x, y, zoomX, zoomY, ángulo, espejo, mezcla, opacidad, prioridad, foco, visible, (r, g, b, a)]
   patrón -1 = el usuario, -2 = el objetivo; foco 1 = objetivo, 2 = usuario, 3 = línea usuario→objetivo, 4 = pantalla. */
const FX = {imgs: {}, fps: 20};
const FOCUS_U = [128, 224], FOCUS_T = [384, 96];

function animKeyFor(moveId, userIsFoe) {
  if (typeof ANIMIDX === "undefined") return null;
  const id = toID(moveId), m = ANIMIDX.map[id];
  if (m) { if (userIsFoe && m.o) return {key: m.o, flip: false}; return {key: m.m || m.o, flip: userIsFoe && !!m.m}; }
  const mv = Dex.moves.get(id); if (!mv.exists) return null;
  const fb = ANIMIDX.fb[mv.type + "|" + mv.category]; const f = fb && ANIMIDX.map[fb]; if (!f) return null;
  if (userIsFoe && f.o) return {key: f.o, flip: false}; return {key: f.m || f.o, flip: userIsFoe && !!f.m};
}
async function animData(key) {
  if (!FX[key]) FX[key] = (async () => { const u = await assetURL("Anim", key); if (!u) return null; return (await fetch(u)).json(); })().catch(() => null);
  return FX[key];
}
function fxImage(name) {
  const k = (name || "").toLowerCase();
  if (!k || k === "!") return Promise.resolve(null);
  if (!FX.imgs[k]) FX.imgs[k] = assetURL("AG", k).then(u => u && new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = u; }));
  return FX.imgs[k];
}
async function fxSound(name, vol, pitch) {
  if (!sndOn("sfx") || !name) return;
  const u = await assetURL("ASE", name.toLowerCase().replace(/\.(wav|ogg|mp3|mid)$/i, "")); if (!u) return;
  const a = new Audio(u); a.volume = Math.min(1, (vol || 80) / 100 * .8); if (pitch && pitch !== 100) { a.preservesPitch = false; a.playbackRate = Math.max(.5, Math.min(2, pitch / 100)); }
  a.play().catch(() => {});
}
function fxLayers() {
  const sc = $("scene"); if (!sc) return null;
  let back = $("fxB"), front = $("fxF"), bgl = $("fxBG"), fgl = $("fxFG"), fl = $("fxFlash");
  if (!back) {
    sc.insertAdjacentHTML("beforeend", '<div id="fxBG" class="fxl"></div><canvas id="fxB" class="fxc"></canvas><canvas id="fxF" class="fxc"></canvas><div id="fxFG" class="fxl"></div><div id="fxFlash" class="fxl"></div>');
    back = $("fxB"); front = $("fxF"); bgl = $("fxBG"); fgl = $("fxFG"); fl = $("fxFlash");
  }
  const r = sc.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  for (const c of [back, front]) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0); }
  return {sc, r, back, front, bgl, fgl, fl};
}
function centerOf(el, sr) {
  if (!el) return null;
  const vis = el.classList.contains("sp") ? el.querySelector(".spr") : el.querySelector("img");
  const r = (vis || el).getBoundingClientRect();
  return [r.left - sr.left + r.width / 2, r.top - sr.top + r.height / 2];
}
// transformación que lleva la línea (a1→a2) del editor a la línea (b1→b2) de la escena
function lineMap(a1, a2, b1, b2) {
  const ax = a2[0] - a1[0], ay = a2[1] - a1[1], bx = b2[0] - b1[0], by = b2[1] - b1[1], den = ax * ax + ay * ay || 1;
  const re = (bx * ax + by * ay) / den, im = (by * ax - bx * ay) / den;
  return (x, y) => { const dx = x - a1[0], dy = y - a1[1]; return [b1[0] + dx * re - dy * im, b1[1] + dx * im + dy * re]; };
}
async function playAnim(me, key, userIdent, targetIdent, flip) {
  if (ST.anims === "off" || !key) return false;
  const A = await animData(key); if (!A || !A.fr || !A.fr.length) return false;
  const L = fxLayers(); if (!L) return false;
  const uSide = userIdent ? sideOf(userIdent) : null, tSide = targetIdent ? sideOf(targetIdent) : (uSide === "p1" ? "p2" : "p1");
  const uEl = uSide && $("mon-" + uSide), tEl = tSide && $("mon-" + tSide);
  const S = L.r.width / 512, W = L.r.width, H = L.r.height;
  const U = centerOf(uEl, L.r) || [W * .27, H * .7], T = centerOf(tEl, L.r) || [W * .73, H * .27];
  const lm = lineMap(FOCUS_U, FOCUS_T, U, T);
  const pos = (x, y, focus) => {
    if (focus === 1) return [T[0] + (x - FOCUS_T[0]) * S, T[1] + (y - FOCUS_T[1]) * S];
    if (focus === 2) return [U[0] + (x - FOCUS_U[0]) * S, U[1] + (y - FOCUS_U[1]) * S];
    if (focus === 3) return lm(x, y);
    const p = [x * S, y * S * (H / (384 * S))]; return flip ? [W - p[0], H - p[1]] : p;
  };
  const [img] = await Promise.all([fxImage(A.g), ...A.t.filter(t => t.k && t.n).map(t => fxImage(t.n))]);
  const bgImgs = {}; for (const t of A.t) if (t.k && t.n) bgImgs[t.n] = await fxImage(t.n);
  const speed = ST.speed === "fast" ? 1.5 : ST.speed === "slow" ? .8 : 1, frameMs = 1000 / FX.fps / speed;
  const base = {}; // posición base de los Pokémon para mover sus sprites
  const moveBattler = (el, cel, ref) => {
    if (!el) return;
    if (!cel) { el.style.translate = ""; el.style.opacity = ""; el.style.scale = ""; return; }
    const p = pos(cel[1], cel[2], cel[10]), b = pos(ref[0], ref[1], cel[10]);
    el.style.translate = `${(p[0] - b[0]).toFixed(1)}px ${(p[1] - b[1]).toFixed(1)}px`;
    el.style.opacity = cel[11] ? (cel[8] / 255).toFixed(2) : "0";
    el.style.scale = (cel[3] !== 100 || cel[4] !== 100) ? `${cel[3] / 100} ${cel[4] / 100}` : "";
  };
  const layer = (div, t, img, f0) => { // fondos y frentes animados
    if (!img) return;
    div.style.backgroundImage = `url("${img.src}")`; div.style.display = "block"; div.style.backgroundSize = `${512 * S}px ${384 * S}px`;
    const st = {x: t.x || 0, y: t.y || 0, o: t.o != null ? t.o : 255}; div._st = st; div._from = Object.assign({}, st); div._to = null; div._f0 = f0;
    div.style.backgroundPosition = `${st.x * S}px ${st.y * S}px`; div.style.opacity = st.o / 255;
  };
  const tween = (div, t, f0) => { if (!div._st) return; div._from = Object.assign({}, div._st); div._to = {x: t.x != null ? t.x : div._st.x, y: t.y != null ? t.y : div._st.y, o: t.o != null ? t.o : div._st.o}; div._f0 = f0; div._dur = Math.max(1, t.d || 1); };
  const stepLayer = (div, f) => { if (!div._to) return; const k = Math.min(1, (f - div._f0) / div._dur), a = div._from, b = div._to;
    div._st = {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, o: a.o + (b.o - a.o) * k};
    div.style.backgroundPosition = `${div._st.x * S}px ${div._st.y * S}px`; div.style.opacity = div._st.o / 255; if (k >= 1) div._to = null; };
  const flash = (t) => { const c = t.fc || [255, 255, 255, 255], ms = (t.fd || 5) * frameMs;
    if (t.fs === 3 || t.fs === 4) { L.fl.style.background = `rgba(${c[0]},${c[1]},${c[2]},${(c[3] / 255).toFixed(2)})`; L.fl.style.display = "block"; L.fl.style.transition = "none"; L.fl.style.opacity = 1;
      requestAnimationFrame(() => { L.fl.style.transition = `opacity ${ms}ms linear`; L.fl.style.opacity = 0; }); }
    else { const el = t.fs === 2 ? uEl : tEl; if (!el) return; el.style.filter = `brightness(2.2) drop-shadow(0 0 8px rgba(${c[0]},${c[1]},${c[2]},.9))`; setTimeout(() => { el.style.filter = ""; }, ms); }
  };
  const tmp = document.createElement("canvas"), tctx = tmp.getContext("2d");
  const drawCel = (ctx, cel) => {
    if (!img || cel[0] < 0 || !cel[11] || cel[8] <= 0) return;
    const pat = cel[0], sx = (pat % 5) * 192, sy = Math.floor(pat / 5) * 192;
    if (sy >= img.height) return;
    const [x, y] = pos(cel[1], cel[2], cel[10]);
    ctx.save(); ctx.globalAlpha = cel[8] / 255;
    ctx.globalCompositeOperation = cel[7] === 1 ? "lighter" : cel[7] === 2 ? "difference" : "source-over";
    ctx.translate(x, y); if (cel[5]) ctx.rotate(-cel[5] * Math.PI / 180);
    ctx.scale((cel[6] ? -1 : 1) * cel[3] / 100 * S, cel[4] / 100 * S);
    let src = img, ssx = sx, ssy = sy;
    if (A.h || cel[15]) { tmp.width = 192; tmp.height = 192; tctx.clearRect(0, 0, 192, 192); tctx.filter = A.h ? `hue-rotate(${A.h}deg)` : "none"; tctx.drawImage(img, sx, sy, 192, 192, 0, 0, 192, 192); tctx.filter = "none";
      if (cel[15]) { tctx.globalCompositeOperation = "source-atop"; tctx.fillStyle = `rgba(${cel[12]},${cel[13]},${cel[14]},${cel[15] / 255})`; tctx.fillRect(0, 0, 192, 192); tctx.globalCompositeOperation = "source-over"; }
      src = tmp; ssx = 0; ssy = 0; }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, ssx, ssy, 192, 192, -96, -96, 192, 192);
    ctx.restore();
  };
  const bctx = L.back.getContext("2d"), fctx = L.front.getContext("2d");
  const userRef = [FOCUS_U[0], FOCUS_U[1]], targRef = [FOCUS_T[0], FOCUS_T[1]];
  const n = A.fr.length, t0 = performance.now();
  await new Promise(done => {
    let last = -1;
    const tick = () => {
      if (me.dead) { finish(); return; }
      const f = Math.min(n - 1, Math.floor((performance.now() - t0) / frameMs));
      for (let k = last + 1; k <= f; k++) for (const t of A.t) if (t.f === k) {
        if (t.k === 0) fxSound(t.n, t.v, t.p);
        else if (t.k === 1) layer(L.bgl, t, bgImgs[t.n], k); else if (t.k === 2) tween(L.bgl, t, k);
        else if (t.k === 3) layer(L.fgl, t, bgImgs[t.n], k); else if (t.k === 4) tween(L.fgl, t, k);
        if (t.fs) flash(t);
      }
      stepLayer(L.bgl, f); stepLayer(L.fgl, f);
      if (f !== last) {
        last = f; const cels = A.fr[f] || [];
        bctx.clearRect(0, 0, W, H); fctx.clearRect(0, 0, W, H);
        let uc = null, tc = null;
        for (const cel of cels) { if (!cel) continue;
          if (cel[0] === -1) { uc = cel; continue; } if (cel[0] === -2) { tc = cel; continue; }
          drawCel(cel[9] === 0 || cel[9] === 2 ? bctx : fctx, cel); }
        moveBattler(uEl, uc, userRef); if (tEl !== uEl) moveBattler(tEl, tc, targRef);
      }
      if ((performance.now() - t0) >= n * frameMs) finish(); else requestAnimationFrame(tick);
    };
    const finish = () => { bctx.clearRect(0, 0, W, H); fctx.clearRect(0, 0, W, H); for (const d of [L.bgl, L.fgl]) { d.style.display = "none"; d._st = null; d._to = null; }
      moveBattler(uEl, null); moveBattler(tEl, null); done(); };
    requestAnimationFrame(tick);
  });
  return true;
}
async function playMoveAnim(me, userIdent, targetIdent, moveId) {
  const k = animKeyFor(moveId, sideOf(userIdent) === "p2"); if (!k) return false;
  try { return await playAnim(me, k.key, userIdent, targetIdent || null, k.flip); } catch (e) { console.error(e); return false; }
}
async function playCommon(me, name, ident, other) {
  if (typeof ANIMIDX === "undefined" || !ANIMIDX.common.includes(name)) return false;
  try { return await playAnim(me, "Common:" + name, ident, other || null, false); } catch (e) { console.error(e); return false; }
}
