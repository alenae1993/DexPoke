"use strict";
/* Competitivo y ficha de equipo — Mi Dex
   - Formatos de Smogon / Showdown (tiers) y el formato oficial de los juegos (Combate Clasificatorio / BSS).
   - Validación de equipos con el validador de Pokémon Showdown.
   - Equipos de la CPU con sets de Battle Factory / BSS Factory (comp.js) o de Random Battle.
   - Ficha completa de cada Pokémon de tu equipo durante la batalla. */
const {TeamValidator} = PS;

const FORMATS = [
  {id: "bss", fid: "gen9bssregi", n: "Combate Clasificatorio", tag: "BSS", lvl: 50, pick: 3, src: "BSS",
    d: "El formato individual oficial de Escarlata/Púrpura (Batalla Clasificatoria): nivel 50, llevas 6 Pokémon y eliges 3 después de ver al rival. Máximo 2 legendarios restringidos y ningún objeto repetido."},
  {id: "ubers", fid: "gen9ubers", n: "Ubers", tag: "Ubers", lvl: 100, src: "Uber", tier: "Uber",
    d: "Casi todo está permitido, incluidos los legendarios más poderosos. Solo se prohíbe lo que rompe el juego incluso aquí."},
  {id: "ou", fid: "gen9ou", n: "OverUsed", tag: "OU", lvl: 100, src: "OU", tier: "OU",
    d: "El formato estándar de Smogon y el más jugado en Pokémon Showdown. Sin legendarios de portada ni movimientos de sueño."},
  {id: "uu", fid: "gen9uu", n: "UnderUsed", tag: "UU", lvl: 100, src: "UU", tier: "UU", d: "Solo Pokémon de UU o inferior: los que se usan poco en OU."},
  {id: "ru", fid: "gen9ru", n: "RarelyUsed", tag: "RU", lvl: 100, src: "RU", tier: "RU", d: "Solo Pokémon de RU o inferior."},
  {id: "nu", fid: "gen9nu", n: "NeverUsed", tag: "NU", lvl: 100, src: "NU", tier: "NU", d: "Solo Pokémon de NU o inferior."},
  {id: "pu", fid: "gen9pu", n: "PU", tag: "PU", lvl: 100, src: "PU", tier: "PU", d: "Solo Pokémon de PU o inferior."},
  {id: "zu", fid: "gen9zu", n: "ZeroUsed", tag: "ZU", lvl: 100, src: "rand", tier: "ZU", d: "El tier más bajo de los totalmente evolucionados. La CPU usa sets de Random Battle de Pokémon ZU."},
  {id: "natdex", fid: "gen9nationaldex", n: "National Dex OU", tag: "ND OU", lvl: 100, src: "randnd", tier: "OU", nd: true,
    d: "Permite Pokémon de todas las generaciones, aunque no estén en Escarlata/Púrpura, y las Megaevoluciones. No se permite teracristalizar."},
];
const FMT = id => FORMATS.find(f => f.id === id) || FORMATS[2];
const TORDER = ["AG", "Uber", "OU", "UUBL", "UU", "RUBL", "RU", "NUBL", "NU", "PUBL", "PU", "ZUBL", "ZU", "NFE", "LC"];
const TCOLOR = {AG: ["#1B1B1B", "#fff"], Uber: ["#6B3FC4", "#fff"], OU: ["#D6264F", "#fff"], UUBL: ["#E0674A", "#fff"], UU: ["#E8872C", "#111"], RUBL: ["#E3A92E", "#111"], RU: ["#E8C53A", "#111"], NUBL: ["#9CC23A", "#111"], NU: ["#4FAE4A", "#fff"], PUBL: ["#3BA88F", "#fff"], PU: ["#2E9AA6", "#fff"], ZUBL: ["#3F86C9", "#fff"], ZU: ["#4F6FD1", "#fff"], NFE: ["#8A8F8C", "#fff"], LC: ["#E46FB0", "#111"]};
const TIER_TXT = [
  ["Uber", "Ubers", "Los más poderosos, sobre todo legendarios de portada. Prohibidos en OU."],
  ["OU", "OverUsed", "El formato estándar y más jugado."],
  ["UUBL", "Límite UU", "“BL” = borderline: demasiado fuertes para UU, pero poco usados en OU. Se pueden usar en OU."],
  ["UU", "UnderUsed", "Buenos, pero se usan poco en OU."],
  ["RU", "RarelyUsed", "Se usan poco en UU."],
  ["NU", "NeverUsed", "Se usan poco en RU."],
  ["PU", "PU", "Se usan poco en NU."],
  ["ZU", "ZeroUsed", "El tier más bajo de los totalmente evolucionados."],
  ["NFE", "No totalmente evolucionado", "Pueden evolucionar todavía. Son legales en cualquier tier de arriba."],
  ["LC", "Little Cup", "Primeras etapas evolutivas, a nivel 5."],
];
function tierFor(species, fmt) {
  const sp = Dex.species.get(species);
  if (!sp.exists) return "";
  const t = fmt && fmt.nd ? sp.natDexTier : sp.tier;
  return t || "";
}
function tierBadge(t, pre) {
  if (!t || t === "Illegal") return `<span class="tier out">${pre || ""}No legal</span>`;
  const k = t.replace(/[()]/g, ""), c = TCOLOR[k] || ["#888", "#fff"];
  return `<span class="tier" style="--c:${c[0]};--ct:${c[1]}">${pre || ""}${esc(k === "Uber" ? "Ubers" : k)}</span>`;
}

/* ---------- validación ---------- */
function prepTeam(sets, fmt) {
  return sets.map(cleanSet).filter(s => s.moves.length).map(s => {
    const x = JSON.parse(JSON.stringify(s)); x.level = fmt.lvl; delete x._role; delete x.gigantamax;
    // el validador pide EVs; si el set no tiene ninguno, le ponemos 1 (no cambia los stats)
    if (!SK.some(k => x.evs && x.evs[k])) { x.evs = Object.assign({}, x.evs, {hp: 1}); }
    if (fmt.nd) x.teraType = undefined;
    return x;
  });
}
const valCache = {};
function validate(sets, fmt) {
  try {
    const v = valCache[fmt.fid] || (valCache[fmt.fid] = new TeamValidator(fmt.fid));
    const res = v.validateTeam(prepTeam(sets, fmt)) || [];
    return trValidation(res);
  } catch (e) { console.error(e); return ["No se pudo validar el equipo: " + e.message]; }
}
function trName(s) {
  s = (s || "").trim();
  const sp = Dex.species.get(s); if (sp.exists && sp.name.toLowerCase() === s.toLowerCase()) return esSp(sp.name);
  const mv = Dex.moves.get(s); if (mv.exists) return esMove(mv.id);
  const it = Dex.items.get(s); if (it.exists) return esItem(it.id);
  const ab = Dex.abilities.get(s); if (ab.exists) return esAb(ab.id);
  return s;
}
function trValidation(list) {
  const out = []; let skipEvent = false;
  for (const raw of list) {
    const m = raw.trim(); let r;
    if (/has exactly 0 EVs/.test(m) || /this format allows level/.test(m)) continue;
    if (/^\(/.test(m)) continue; // aclaraciones entre paréntesis
    if ((r = m.match(/^(.+?) is only obtainable from (?:an )?events?/))) { out.push(`${trName(r[1])} solo se obtiene en eventos y este set no cumple sus requisitos.`); skipEvent = true; continue; }
    if (skipEvent && (/must (be|have)/.test(m) || /from its event/.test(m))) continue;
    skipEvent = false;
    if ((r = m.match(/^(.+?) is tagged (.+?), which is banned/))) { out.push(`${trName(r[1])} es de la categoría ${r[2].replace("Uber", "Ubers")}, que no se permite en este formato.`); continue; }
    if ((r = m.match(/^(.+?)'s (move|ability|item) (.+?) is banned/))) { out.push(`${trName(r[1])}: no se permite ${({move: "el movimiento", ability: "la habilidad", item: "el objeto"})[r[2]]} ${trName(r[3])} en este formato.`); continue; }
    if ((r = m.match(/^(.+?) is banned\.?$/))) { out.push(`${trName(r[1])} no se permite en este formato.`); continue; }
    if ((r = m.match(/^(.+?) is banned by (.+?)\.?$/))) { const cl = {"Sleep Moves Clause": "la Cláusula de sueño", "Evasion Moves Clause": "la Cláusula de evasión", "OHKO Clause": "la Cláusula de golpe fulminante", "Evasion Abilities Clause": "la Cláusula de habilidades de evasión", "Evasion Items Clause": "la Cláusula de objetos de evasión", "Baton Pass Clause": "la Cláusula de Relevo", "Terastal Clause": "la Cláusula de teracristalización"}[r[2]] || r[2];
      out.push(`${trName(r[1])} está prohibido por ${cl}.`); continue; }
    if ((r = m.match(/^(.+?)'s move (.+?) can't be transferred from Gen (\d+)/))) { out.push(`${trName(r[1])}: ${trName(r[2])} solo se aprende en la Gen ${r[3]} y no se puede traer a Escarlata/Púrpura.`); continue; }
    if ((r = m.match(/^(.+?) can't learn (.+?)\.?$/))) { out.push(`${trName(r[1])} no puede aprender ${trName(r[2])} en este formato (puede ser un movimiento de otra generación).`); continue; }
    if ((r = m.match(/^(.+?)'s item (.+?) does not exist in Gen 9/))) { out.push(`${trName(r[1])}: el objeto ${trName(r[2])} no existe en Escarlata/Púrpura.`); continue; }
    if ((r = m.match(/^(.+?)'s move (.+?) does not exist in Gen 9/))) { out.push(`${trName(r[1])}: el movimiento ${trName(r[2])} no existe en Escarlata/Púrpura.`); continue; }
    if ((r = m.match(/^(.+?) does not exist in Gen 9/))) { out.push(`${trName(r[1])} no existe en Escarlata/Púrpura (Gen 9). Prueba National Dex.`); continue; }
    if ((r = m.match(/^(.+?) does not exist/))) { out.push(`${trName(r[1])} no existe en este formato.`); continue; }
    if (/limited to one of each Pokémon by Species Clause/.test(m)) { out.push("Solo puedes llevar uno de cada Pokémon (Cláusula de especie)."); continue; }
    if ((r = m.match(/limited to one of each item/i)) || /Item Clause/.test(m)) { out.push("No puedes repetir objetos (Cláusula de objeto)."); continue; }
    if ((r = m.match(/^(.+?) isn't the first in its evolution family/))) { out.push(`${trName(r[1])} no es la primera etapa de su línea evolutiva.`); continue; }
    if ((r = m.match(/You are limited to (\d+) restricted/i)) || /Restricted/i.test(m)) { out.push("Solo puedes llevar hasta 2 legendarios restringidos."); continue; }
    if ((r = m.match(/^(.+?) can only be obtained/))) { out.push(`${trName(r[1])} no se puede obtener legalmente con ese set.`); continue; }
    if ((r = m.match(/^(.+?)'s ability (.+?) is unreleased|^(.+?) has an illegal ability/))) { out.push(`${trName(r[1] || r[3])}: habilidad no permitida.`); continue; }
    if ((r = m.match(/^(.+?) has (\d+) EVs/))) { out.push(`${trName(r[1])} tiene más EVs de los permitidos.`); continue; }
    if (/Your team has more than/.test(m)) { out.push("Tu equipo tiene más de 6 Pokémon."); continue; }
    out.push(m);
  }
  return [...new Set(out)];
}

/* ---------- equipos de la CPU ---------- */
function setOk(fmt, set) { // cada set de la CPU debe ser legal en el formato (tiers, movimientos, habilidades)
  try { const v = valCache[fmt.fid] || (valCache[fmt.fid] = new TeamValidator(fmt.fid)); const x = prepTeam([set], fmt)[0]; if (!x) return false; return !v.validateSet(x, {}); }
  catch (e) { return true; }
}
function wpick(arr, w) { const tot = arr.reduce((a, x) => a + w(x), 0); let r = Math.random() * tot; for (const x of arr) { r -= w(x); if (r <= 0) return x; } return arr[arr.length - 1]; }
function factorySet(entry, fmt, usedItems) {
  const st = wpick(entry.sets, s => s.w || 1), sp = Dex.species.get(st.s);
  const moves = [];
  for (const slot of st.m) { const opts = shuffle(slot.map(toID).filter(m => !moves.includes(m))); if (opts.length) moves.push(opts[0]); }
  let items = st.i.map(toID); if (usedItems) { const free = items.filter(i => !usedItems.has(i)); if (free.length) items = free; }
  const item = items[Math.floor(Math.random() * items.length)] || "";
  const evs = Object.assign({hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0}, st.e);
  return {name: "", species: sp.name, item, ability: st.a[Math.floor(Math.random() * st.a.length)] || sp.abilities["0"], moves: moves.slice(0, 4),
    nature: st.n[Math.floor(Math.random() * st.n.length)] || "Serious", evs, ivs: Object.assign({hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31}, st.iv || {}),
    level: fmt.lvl, gender: "", teraType: st.t[Math.floor(Math.random() * st.t.length)] || sp.types[0]};
}
async function compTeam(fmt) {
  const team = [], used = new Set(), items = new Set(), typeCount = {};
  const okTypes = sp => sp.types.every(t => (typeCount[t] || 0) < 2);
  const add = s => { const sp = Dex.species.get(s.species); team.push(s); used.add(toID(sp.baseSpecies)); if (s.item) items.add(toID(s.item)); sp.types.forEach(t => typeCount[t] = (typeCount[t] || 0) + 1); };
  if (COMP.sets[fmt.src]) {
    const pool = COMP.sets[fmt.src], bad = new Set();
    const keys = Object.keys(pool);
    for (let guard = 0; team.length < 6 && guard < 400; guard++) {
      const k = wpick(keys, x => pool[x].w || 1), sp = Dex.species.get(pool[k].sets[0].s);
      if (used.has(toID(sp.baseSpecies)) || !okTypes(sp)) continue;
      if (fmt.id === "bss" && sp.tags && sp.tags.includes("Restricted Legendary") && team.filter(s => Dex.species.get(s.species).tags.includes("Restricted Legendary")).length >= 2) continue;
      const s = factorySet(pool[k], fmt, fmt.id === "bss" ? items : null);
      if (fmt.id === "bss" && s.item && items.has(toID(s.item))) continue;
      if (!setOk(fmt, s)) { if (bad.add(k) && bad.size >= keys.length) break; continue; }
      add(s);
    }
    return team;
  }
  // Random Battle filtrado por tier
  const allowed = fmt.id === "zu" ? ["ZU"] : ["OU", "UUBL", "UU"];
  const cands = Object.keys(RGEN.randomSets).filter(id => { const sp = Dex.species.get(id); return sp.exists && allowed.includes(fmt.nd ? sp.natDexTier : sp.tier); });
  const megas = fmt.nd ? Object.keys(RGEN.randomMegaSets || {}).filter(id => { const sp = Dex.species.get(id); return sp.exists && ["OU", "UUBL"].includes(sp.natDexTier) && sp.requiredItem; }) : [];
  let megaUsed = false;
  for (let guard = 0; team.length < 6 && guard < 400; guard++) {
    const useMega = megas.length && !megaUsed && Math.random() < 0.35;
    const id = useMega ? megas[Math.floor(Math.random() * megas.length)] : cands[Math.floor(Math.random() * cands.length)];
    const sp = Dex.species.get(id), base = Dex.species.get(sp.baseSpecies);
    if (used.has(toID(base.name)) || !okTypes(sp)) continue;
    const set = blankSet(base.name); set.level = fmt.lvl;
    if (useMega) { set.item = toID(sp.requiredItem); await autoMoves(set, sp.name); megaUsed = true; } else await autoMoves(set);
    if (fmt.nd && Dex.items.get(set.item).isNonstandard === "Past" && !Dex.items.get(set.item).megaStone) set.item = "leftovers";
    if (!setOk(fmt, set)) continue;
    add(set);
  }
  return team;
}

/* ---------- vista Competitivo ---------- */
let CSEL = null, CVAL = null;
function renderComp() {
  if (!CSEL) CSEL = ST.cfmt || "ou";
  const fmt = FMT(CSEL), t = team(), sets = t.sets.filter(s => (s.moves || []).some(Boolean));
  const errs = sets.length ? validate(t.sets, fmt) : [];
  CVAL = {fmt: fmt.id, errs};
  const rows = t.sets.map(s => `<div class="rs"><img src="${esc(img(s.species))}" alt="" loading="lazy"><span><b>${esc(esSp(s.species))}</b> ${tierBadge(tierFor(s.species, fmt), fmt.nd ? "ND " : "")}
      <small>${esc((s.moves || []).filter(Boolean).map(esMove).join(" · ") || "Sin movimientos")}</small></span></div>`).join("");
  $("app").innerHTML = `<div class="top"><button class="back" data-act="menu">‹ Menú</button><h1>Competitivo</h1><span></span></div>
  <div class="stack">
    <div class="fmts">${FORMATS.map(f => `<button class="fmt ${f.id === fmt.id ? "sel" : ""}" data-fmt="${f.id}"><b>${esc(f.tag)}</b><small>${esc(f.id === "bss" ? "Como los juegos" : f.n)}</small></button>`).join("")}</div>
    <div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><h3 style="margin:0">${esc(fmt.n)}${fmt.tag !== fmt.n ? ` <span style="color:var(--ink3);font-weight:500">· ${esc(fmt.tag)}</span>` : ""}</h3><span class="note" style="margin:0">Nivel ${fmt.lvl}${fmt.pick ? " · 3 de 6" : ""}</span></div>
      <p style="margin:8px 0 0;font-size:14px">${esc(fmt.d)}</p>
      <p class="note">Reglas del motor de Showdown para este formato: cláusula de especie (sin Pokémon repetidos), sin movimientos que suben la evasión ni golpes fulminantes${fmt.id === "bss" ? ", sin objetos repetidos" : ", cláusula de sueño"}. Sin Dinamax${fmt.nd ? "" : " ni Megaevolución (no existen en Gen 9)"}.</p>
      <div class="btns" style="margin-top:10px"><button class="btn pri" data-act="cquick">Batalla rápida ${esc(fmt.tag)}</button><button class="btn" data-act="csample">Crear un equipo de ejemplo</button></div>
      <p class="note">“Batalla rápida”: tú y la CPU reciben equipos ${fmt.src === "rand" || fmt.src === "randnd" ? "de Random Battle con Pokémon" : "con sets competitivos reales"} de este formato. “Equipo de ejemplo” lo guarda como un equipo nuevo tuyo para que lo estudies y lo modifiques.</p>
    </div>
    <div class="card"><h3>${esc(t.name)} en ${esc(fmt.tag)}</h3>
      ${t.sets.length ? `<div class="rsl">${rows}</div>` : '<p class="note">Todavía no tienes Pokémon en este equipo.</p>'}
      ${sets.length ? (errs.length ? `<div class="verr"><b>No es legal en ${esc(fmt.tag)}:</b><ul>${errs.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : `<p class="vok">✓ Tu equipo es legal en ${esc(fmt.tag)}.</p>`) : ""}
      <p class="note">Al empezar, todos los Pokémon se ajustan al nivel ${fmt.lvl}.</p>
      <div class="btns" style="margin-top:10px"><button class="btn ${errs.length ? "" : "pri"}" data-act="cmine" ${sets.length ? "" : "disabled"}>${errs.length ? "Jugar igual (sin validar)" : "Jugar con mi equipo"}</button><button class="btn" data-act="team">Editar equipo</button>${ST.teams.length > 1 ? `<select id="cteam" class="btn" style="height:40px">${ST.teams.map((x, i) => `<option value="${i}" ${i === ST.cur ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>` : ""}</div>
    </div>
    <details class="card"><summary style="cursor:pointer;font-weight:600">¿Qué son los tiers?</summary>
      <p class="note" style="font-size:13px">En el competitivo de Smogon (el que se juega en Pokémon Showdown) cada Pokémon está en un <b>tier</b> según cuánto se usa y qué tan fuerte es. En un tier puedes usar los Pokémon de ese tier <b>y de todos los que están por debajo</b>: en OU vale un Pokémon de UU, pero en UU no vale uno de OU. Los “BL” (borderline) son demasiado fuertes para el tier de abajo y se juegan en el de arriba. Los tiers cambian cada pocos meses según las estadísticas de uso.</p>
      <table class="tiers"><tbody>${TIER_TXT.map(([k, n, d]) => `<tr><td>${tierBadge(k)}</td><td><b>${n}</b> — ${d}</td></tr>`).join("")}</tbody></table>
      <p class="note" style="font-size:13px"><b>Formatos oficiales (Nintendo):</b> el Combate Clasificatorio individual (BSS) y los combates dobles VGC se juegan a nivel 50, se llevan 6 y se eligen 3 (o 4 en dobles), con reglas de legendarios restringidos según la “regulación” vigente. Este simulador es de combates individuales, así que VGC (dobles) no está disponible.</p>
      <p class="note">Tiers según el motor de Showdown incluido (versión ${esc(COMP.v)}); pueden haber cambiado desde entonces.</p></details>
  </div>`;
}
async function startComp(mode) {
  const fmt = FMT(CSEL || "ou");
  const foe = await compTeam(fmt);
  let mine;
  if (mode === "quick") mine = await compTeam(fmt);
  else {
    mine = prepTeam(team().sets, fmt);
    if (!mine.length) { alert("Tu equipo necesita al menos un Pokémon con movimientos."); return; }
    if (fmt.pick && mine.length < 3) { alert("En este formato necesitas al menos 3 Pokémon."); return; }
  }
  newBattle(mine, foe, {fmt, aiDiff: "hard"}); B.compMode = mode;
}
async function sampleTeam() {
  const fmt = FMT(CSEL || "ou");
  const sets = await compTeam(fmt);
  ST.teams.push({name: `Ejemplo ${fmt.tag}`, sets}); ST.cur = ST.teams.length - 1; save();
  renderComp();
  const el = document.querySelector(".verr,.vok"); if (el) el.scrollIntoView({behavior: "smooth", block: "center"});
}

/* ---------- sets competitivos en el editor ---------- */
function compSetsFor(species) {
  const sp = Dex.species.get(species), out = [];
  const keys = [sp.id, toID(sp.baseSpecies)];
  for (const src of ["Uber", "OU", "UU", "RU", "NU", "PU", "BSS"]) {
    const pool = COMP.sets[src]; if (!pool) continue;
    for (const k of Object.keys(pool)) {
      pool[k].sets.forEach((s, j) => { const ssp = Dex.species.get(s.s); if (ssp.id === sp.id || (ssp.battleOnly && toID(ssp.baseSpecies) === sp.id)) out.push({src, k, j, s}); });
    }
  }
  return out;
}
function compSetOptions(set) {
  const list = compSetsFor(set.species); if (!list.length) return "";
  const lab = x => `${x.src === "BSS" ? "BSS (nv 50)" : x.src === "Uber" ? "Ubers" : x.src} · ${x.s.m.map(sl => esMove(toID(sl[0]))).join(" / ")}${x.s.i[0] ? " · " + esItem(toID(x.s.i[0])) : ""}`;
  return `<div class="field" style="margin-top:10px"><label>Cargar un set competitivo (${list.length})</label><select id="f-cset"><option value="">Elige un set usado en competitivo…</option>${list.map(x => `<option value="${x.src}|${x.k}|${x.j}">${esc(lab(x))}</option>`).join("")}</select>
    <p class="note" style="margin-top:3px">Sets de Battle Factory de Pokémon Showdown. Reemplaza movimientos, objeto, habilidad, naturaleza, EVs y teratipo.</p></div>`;
}
function applyCompSet(set, val) {
  const [src, k, j] = val.split("|"), s = COMP.sets[src][k].sets[+j];
  const sp = Dex.species.get(s.s);
  set.moves = s.m.map(sl => toID(sl[0])).slice(0, 4);
  set.item = toID(s.i[0] || ""); set.ability = s.a[0] || set.ability; set.nature = s.n[0] || set.nature;
  set.evs = Object.assign({hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0}, s.e); set.ivs = Object.assign({hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31}, s.iv || {});
  if (s.t[0]) set.teraType = s.t[0];
  if (sp.battleOnly && sp.requiredItem) set.item = toID(sp.requiredItem);
  if (src === "BSS") set.level = 50;
}

/* ---------- ficha de un Pokémon del equipo (en batalla) ---------- */
function setFor(me, p) {
  const nm = p.ident.replace(/^p\d[a-z]?:\s*/, ""), sp = Dex.species.get(p.details.split(",")[0]);
  const ids = [toID(nm), sp.id, toID(sp.baseSpecies)];
  return me.t1.find(s => { const x = Dex.species.get(s.species); return ids.includes(x.id) || ids.includes(toID(x.baseSpecies)) || (s.name && ids.includes(toID(s.name))); });
}
function boostMult(k, v) { if (!v) return 1; const b = ["accuracy", "evasion"].includes(k) ? 3 : 2; return v > 0 ? (b + v) / b : b / (b - v); }
function monSheet(me, idx) {
  const r = me.req || me.lastReq; if (!r || !r.side) return;
  const party = r.side.pokemon; idx = Math.max(0, Math.min(party.length - 1, idx | 0));
  const p = party[idx], spName = p.details.split(",")[0], sp = Dex.species.get(spName), set = setFor(me, p) || {};
  const hp = parseHP(p.condition), lv = +((p.details.match(/L(\d+)/) || [0, 100])[1]);
  const act = p.active ? me.mons[me.act.p1] : null, boosts = (act && act.boosts) || {};
  const nat = Dex.natures.get(set.nature || "Serious");
  const types = p.terastallized ? [p.terastallized] : sp.types;
  const statRows = SK.map(k => {
    const real = k === "hp" ? (hp.max || "—") : (p.stats ? p.stats[k] : calcStat(sp, set, k));
    const b = boosts[k] || 0, eff = b && typeof real === "number" ? Math.floor(real * boostMult(k, b)) : null;
    const cls = nat.plus === k ? "nat-up" : nat.minus === k ? "nat-dn" : "";
    const pct = Math.min(100, sp.baseStats[k] / 255 * 100);
    return `<tr><th class="${cls}">${STS[k]}${nat.plus === k ? " ▲" : nat.minus === k ? " ▼" : ""}</th><td><span class="sbar"><i style="width:${pct}%"></i></span>${sp.baseStats[k]}</td><td>${set.ivs ? set.ivs[k] ?? 31 : "—"}</td><td>${set.evs ? set.evs[k] || 0 : "—"}</td><td><b>${real}</b>${eff != null ? ` <span style="color:${b > 0 ? "var(--good)" : "var(--bad)"}">→ ${eff} (${b > 0 ? "+" : ""}${b})</span>` : ""}</td></tr>`;
  }).join("");
  const other = Object.entries(boosts).filter(([k, v]) => v && ["accuracy", "evasion"].includes(k)).map(([k, v]) => `${STAT[k]} ${v > 0 ? "+" : ""}${v}`).join(" · ");
  const actMoves = p.active && r.active && r.active[0] ? r.active[0].moves : null;
  const moves = (p.moves || []).map((id, i) => {
    const mv = Dex.moves.get(id), t = TY[toID(mv.type).toUpperCase()] || TY.NORMAL;
    const am = actMoves && actMoves.find(x => toID(x.id) === toID(id));
    const maxpp = am ? am.maxpp : (mv.noPPBoosts ? mv.pp : Math.floor(mv.pp * 8 / 5));
    return `<button class="smv" data-info="${esc(id)}" style="--c:${t[1]};--ct:${t[2]}"><span class="smh"><b>${esc(esMove(id))}</b><span>PP ${am ? am.pp : maxpp}/${maxpp}</span></span>
      <small>${t[0]} · ${catTxt(mv)}${mv.category !== "Status" ? " · Pot. " + (mv.basePower || "—") : ""} · Prec. ${accTxt(mv)}${mv.priority ? ` · Prioridad ${mv.priority > 0 ? "+" : ""}${mv.priority}` : ""}${sp.types.includes(mv.type) && mv.category !== "Status" ? " · STAB" : ""}</small>
      <span class="smd">${esc(esMoveDesc(id)) || ""}</span></button>`;
  }).join("");
  const ab = p.ability || p.baseAbility, item = p.item, lostItem = !item && set.item ? set.item : "";
  const st = hp.status && hp.status !== "fnt" ? ({brn: "Quemado", par: "Paralizado", psn: "Envenenado", tox: "Gravemente envenenado", slp: "Dormido", frz: "Congelado"}[hp.status] || hp.status) : "";
  let el = $("msheet"); if (!el) { el = document.createElement("div"); el.id = "msheet"; document.body.appendChild(el); }
  el.innerHTML = `<div class="shbox" role="dialog" aria-modal="true" aria-label="Ficha de ${esc(esSp(spName))}">
    <div class="shtabs">${party.map((q, i) => { const n = q.details.split(",")[0], h = parseHP(q.condition); return `<button data-sheet="${i}" aria-pressed="${i === idx}" class="${h.hp <= 0 ? "fnt" : ""}" title="${esc(esSp(n))}"><img src="${esc(img(n))}" alt="${esc(esSp(n))}"></button>`; }).join("")}</div>
    <div class="shhead"><img src="${esc(img(spName))}" alt=""><div><h3>${esc(esSp(spName))}${p.details.includes(", M") ? " ♂" : p.details.includes(", F") ? " ♀" : ""} <span class="lv">Nv. ${lv}</span></h3>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin:4px 0">${types.map(tchip).join("")}${p.terastallized ? '<span class="tp" style="--c:var(--surface2);--ct:var(--ink2)">Tera</span>' : ""}</div>
      <span class="hpt" style="display:block;max-width:220px"><span class="hpf ${hp.max && hp.hp / hp.max <= .2 ? "low" : hp.max && hp.hp / hp.max <= .5 ? "mid" : ""}" style="width:${hp.max ? hp.hp / hp.max * 100 : 0}%;display:block"></span></span>
      <small class="note">${hp.hp <= 0 ? "Debilitado" : `PS ${hp.hp}/${hp.max}`}${st ? " · " + st : ""}${p.active ? " · En combate" : ""}</small></div></div>
    <div class="mrows" style="margin-top:10px">
      <span>Habilidad</span><b>${esc(esAb(ab))}<small class="shd">${esc(esAbDesc(ab))}</small></b>
      <span>Objeto</span><b>${item ? esc(esItem(item)) + `<small class="shd">${esc(esItemDesc(item))}</small>` : lostItem ? `Ninguno <small class="shd">Tenía ${esc(esItem(lostItem))}; lo usó o lo perdió.</small>` : "Ninguno"}</b>
      <span>Naturaleza</span><b>${esc(esNat(nat.name))}${nat.plus ? ` <small class="shd" style="display:inline">(+${STS[nat.plus]} −${STS[nat.minus]})</small>` : ' <small class="shd" style="display:inline">(neutra)</small>'}</b>
      ${p.teraType && !(me.fmt && me.fmt.nd) ? `<span>Teratipo</span><b>${tchip(p.teraType)}${p.terastallized ? ' <small class="shd" style="display:inline">(activo)</small>' : ""}</b>` : ""}
    </div>
    <h4>Estadísticas</h4>
    <table class="stt"><thead><tr><th></th><th>Base</th><th>IV</th><th>EV</th><th>Real${Object.values(boosts).some(Boolean) ? " → con cambios" : ""}</th></tr></thead><tbody>${statRows}</tbody></table>
    ${other ? `<p class="note">${other}</p>` : ""}
    <p class="note">Total base: ${Object.values(sp.baseStats).reduce((a, b) => a + b, 0)}. ▲/▼ = stat que sube o baja su naturaleza.</p>
    <h4>Movimientos</h4><div class="smvs">${moves}</div>
    <p class="note">Toca un movimiento para ver todos sus datos.</p>
    <button class="btn pri" data-closesheet style="width:100%;margin-top:10px">Cerrar</button></div>`;
  el.hidden = false;
}

/* ---------- elegir 3 de 6 (Combate Clasificatorio) ---------- */
function showPick(me) {
  const ctl = $("ctl"), n = me.req.maxChosenTeamSize || 3, mine = me.t1, foes = me.preview ? me.preview.p2 : me.t2.map(s => s.species);
  me.picked = me.picked || [];
  $("tb").textContent = `Elige ${n} Pokémon (en orden: el primero sale primero).`;
  ctl.innerHTML = `<div class="card"><div class="preview">
    <div><h3>Tu equipo</h3><div class="teamstrip">${mine.map((s, i) => { const k = me.picked.indexOf(i + 1); return `<button class="pick" data-pick="${i + 1}" aria-pressed="${k >= 0}" title="${esc(esSp(s.species))}"><img src="${esc(img(s.species))}" alt="${esc(esSp(s.species))}">${k >= 0 ? `<span class="pn">${k + 1}</span>` : ""}</button>`; }).join("")}</div></div>
    <div><h3>Rival</h3>${strip(foes.map(s => ({species: s})))}</div></div>
    <div class="btns" style="margin-top:10px"><button class="btn pri" data-act="pickgo" ${me.picked.length === Math.min(n, mine.length) ? "" : "disabled"}>Confirmar (${me.picked.length}/${Math.min(n, mine.length)})</button><button class="btn" data-act="sheet">Ver fichas</button></div></div>`;
}

/* ---------- eventos ---------- */
document.addEventListener("click", async e => {
  const sh = e.target.closest("[data-sheet]");
  if (sh && B) { e.preventDefault(); e.stopPropagation(); return monSheet(B, +sh.dataset.sheet); }
  if (e.target.closest("[data-closesheet]") || e.target.id === "msheet") { $("msheet").hidden = true; return; }
  const t = e.target.closest("button"); if (!t) return;
  const act = t.dataset.act;
  if (act === "comp") { if (B) { B.dead = true; B = null; } return go("comp"); }
  if (t.dataset.fmt) { CSEL = ST.cfmt = t.dataset.fmt; save(); return renderComp(); }
  if (act === "cquick") return startComp("quick");
  if (act === "cmine") return startComp("mine");
  if (act === "csample") return sampleTeam();
  if (act === "sheet" && B) { const r = B.req || B.lastReq; const i = r && r.side ? Math.max(0, r.side.pokemon.findIndex(x => x.active)) : 0; return monSheet(B, i); }
  if (t.dataset.pick && B) { const n = +t.dataset.pick, max = Math.min(B.req.maxChosenTeamSize || 3, B.t1.length); const k = B.picked.indexOf(n); if (k >= 0) B.picked.splice(k, 1); else if (B.picked.length < max) B.picked.push(n); return showPick(B); }
  if (act === "pickgo" && B) { const order = [...B.picked, ...B.t1.map((_, i) => i + 1).filter(i => !B.picked.includes(i))]; B.picked = null; return choose(B, "team " + order.join("")); }
}, true);
document.addEventListener("change", e => {
  const el = e.target;
  if (el.id === "cteam") { ST.cur = +el.value; save(); return renderComp(); }
  if (el.id === "f-cset" && el.value) { const s = team().sets[SEL]; if (!s) return; applyCompSet(s, el.value); save(); return renderTeam(); }
});
(() => { const c = new URLSearchParams(location.search).get("comp"); if (c && FORMATS.some(f => f.id === c)) { CSEL = ST.cfmt = c; save(); history.replaceState(null, "", location.pathname); go("comp"); } })();
