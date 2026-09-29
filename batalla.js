"use strict";
/* Batalla Pokémon — Mi Dex
   Motor: Pokémon Showdown (@pkmn/sim, licencia MIT), mismas reglas y fórmulas que los juegos (Gen 9).
   Esta capa solo dibuja la batalla, traduce los mensajes al español y maneja a la CPU. */
const {BattleStreams, Teams, Dex, TeamGenerators, Side} = PS;
/* Dinamax en Gen 9: el motor solo lo permite en Gen 8; lo habilitamos cuando la opción está activa. */
Side.prototype.canDynamaxNow = function () {
  if (!this._dmaxInit) { this._dmaxInit = true; if (globalThis.ALLOW_DMAX && this.battle.gen !== 8) this.dynamaxUsed = false; }
  if (this.battle.gen !== 8 && !globalThis.ALLOW_DMAX) return false;
  return !this.dynamaxUsed;
};
Teams.setGeneratorFactory(TeamGenerators);

const $ = id => document.getElementById(id);
const toID = s => ("" + (s ?? "")).toLowerCase().replace(/[^a-z0-9]/g, "");
const esc = s => ("" + (s ?? "")).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ART = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
const TY = {NORMAL:["Normal","#9FA19F","#111"],FIRE:["Fuego","#E62829","#fff"],WATER:["Agua","#2980EF","#fff"],GRASS:["Planta","#3FA129","#fff"],ELECTRIC:["Eléctrico","#FAC000","#111"],ICE:["Hielo","#3DCEF3","#111"],FIGHTING:["Lucha","#FF8000","#111"],POISON:["Veneno","#9141CB","#fff"],GROUND:["Tierra","#915121","#fff"],FLYING:["Volador","#81B9EF","#111"],PSYCHIC:["Psíquico","#EF4179","#fff"],BUG:["Bicho","#91A119","#fff"],ROCK:["Roca","#AFA981","#111"],GHOST:["Fantasma","#704170","#fff"],DRAGON:["Dragón","#5060E1","#fff"],DARK:["Siniestro","#624D4E","#fff"],STEEL:["Acero","#60A1B8","#fff"],FAIRY:["Hada","#EF70EF","#111"],STELLAR:["Astral","#40B5A5","#fff"]};
const TYPES = Object.keys(TY).filter(t => t !== "STELLAR");
const STAT = {hp:"PS",atk:"Ataque",def:"Defensa",spa:"Ataque Especial",spd:"Defensa Especial",spe:"Velocidad",accuracy:"Precisión",evasion:"Evasión"};
const STS = {hp:"PS",atk:"Atq",def:"Def",spa:"AtE",spd:"DfE",spe:"Vel"};
const SK = ["hp","atk","def","spa","spd","spe"];

/* ---------- nombres en español e imágenes (desde Mi Dex) ---------- */
const MD = {}; D.P.forEach(p => { MD[p.c] = p; });
function mdOf(name) {
  const sp = Dex.species.get(name);
  const key = toID(sp.exists ? sp.name : name).toUpperCase();
  return MD[key] || (sp.exists ? MD[toID(sp.baseSpecies).toUpperCase()] : null);
}
function exactMd(name) { const sp = Dex.species.get(name); return MD[toID(sp.exists ? sp.name : name).toUpperCase()]; }
function img(name) { const p = mdOf(name); const sp = Dex.species.get(name); return p ? ART + (exactMd(name) ? (p.im || p.id) : (p.im || p.id)) + ".png" : (sp.num > 0 ? ART + sp.num + ".png" : ""); }
function esSp(name) { const p = exactMd(name); if (p) return p.n; const sp = Dex.species.get(name); return sp.exists ? sp.name : name; }
function esMove(id) { const k = toID(id), m = D.M[k.toUpperCase()]; if (m && !(m[0] === m[10] && ESX.M && ESX.M[k] && ESX.M[k] !== m[0])) return m[0]; if (k.startsWith("hiddenpower")) return "Poder Oculto"; if (ESX.M && ESX.M[k]) return ESX.M[k];
  const mv = Dex.moves.get(id);
  if (k.startsWith("gmax") && mv.exists) { const base = Dex.moves.all().find(x => x.isMax === true && x.type === mv.type && x.category !== "Status"); return (base ? esMove(base.id) : "Maximovimiento") + " (Gigamax)"; }
  return mv.name || id; }
function esAb(id) { const a = D.A[toID(id).toUpperCase()]; return a ? a[0] : (Dex.abilities.get(id).name || id); }
function esItem(id) { if (!id) return ""; return ESX.I[toID(id)] || Dex.items.get(id).name || id; }
function esMoveDesc(id) { const m = D.M[toID(id).toUpperCase()]; if (m && m[6]) return m[6]; if (ESX.MD && ESX.MD[toID(id)]) return ESX.MD[toID(id)]; { const mv = Dex.moves.get(id); if (mv.exists && mv.isMax) return mv.category === "Status" ? "Protege de todos los ataques, incluidos los Maximovimientos." : `Maximovimiento de tipo ${esType(mv.type)}. Además de dañar, tiene un efecto que depende de su tipo${mv.isMax !== true ? " (efecto especial Gigamax de " + esSp(mv.isMax) + ")" : ""}.`; } if (toID(id) === "struggle") return "Solo se usa cuando no quedan PP. El usuario también recibe daño."; return ""; }
function esAbDesc(id) { const a = D.A[toID(id).toUpperCase()]; return a && a[1] ? a[1] : ((ESX.AD && ESX.AD[toID(id)]) || ""); }
function esItemDesc(id) { if (!id) return ""; const d = ESX.ID && ESX.ID[toID(id)]; if (d) return d; const it = Dex.items.get(id); return it.megaStone ? `Si la lleva ${esSp(it.megaEvolves)}, le permite megaevolucionar durante el combate.` : ""; }
function esNat(n) { return ESX.N[toID(n)] || n; }
function catTxt(mv) { return mv.category === "Physical" ? "Físico" : mv.category === "Special" ? "Especial" : "Estado"; }
function accTxt(mv) { return mv.accuracy === true ? "—" : mv.accuracy + "%"; }
function esType(t) { return (TY[toID(t).toUpperCase()] || [t])[0]; }
function tchip(t) { const x = TY[toID(t).toUpperCase()] || TY.NORMAL; return `<span class="tp" style="--c:${x[1]};--ct:${x[2]}">${x[0]}</span>`; }
function typeMult(atk, defTypes) {
  if (!defTypes || !defTypes.length) return 1;
  if (!Dex.getImmunity(atk, defTypes)) return 0;
  return Math.pow(2, Dex.getEffectiveness(atk, defTypes));
}

/* ---------- lista de Pokémon disponibles ---------- */
const SPLIST = Dex.species.all().filter(s => s.exists && s.num > 0 && !s.battleOnly && !s.isCosmeticForme &&
  !["CAP","Custom","LGPE","Future"].includes(s.isNonstandard) && !/-(Gmax|Totem)$/.test(s.name) && s.name !== "Pokestar" && mdOf(s.name))
  .map(s => ({sp: s.name, es: esSp(s.name)})).sort((a, b) => a.es.localeCompare(b.es, "es"));
const BY_ES = {}; SPLIST.forEach(x => { BY_ES[x.es.toLowerCase()] = x.sp; BY_ES[x.sp.toLowerCase()] = x.sp; });
const ITEMS = Dex.items.all().filter(i => i.exists && !i.isPokeball && !i.zMove && !["CAP","Custom","Future"].includes(i.isNonstandard) && i.gen <= 9)
  .map(i => ({id: i.id, es: esItem(i.id)})).sort((a, b) => a.es.localeCompare(b.es, "es"));
const POPULAR = ["leftovers","lifeorb","choicescarf","choicespecs","choiceband","focussash","assaultvest","heavydutyboots","rockyhelmet","sitrusberry","lumberry","blacksludge","eviolite","airballoon","weaknesspolicy","expertbelt","whiteherb","boosterenergy","loadeddice","covertcloak","clearamulet","lightclay","damprock","heatrock","toxicorb","flameorb","shellbell","mentalherb","powerherb","redcard","ejectbutton","ejectpack","throatspray","mirrorherb","punchingglove","abilityshield","salacberry","liechiberry","chestoberry","focusband","kingsrock","scopelens","widelens","zoomlens","quickclaw","brightpowder","lightball","thickclub"];
function itemOptions(set) {
  const sp = Dex.species.get(set.species), cur = toID(set.item);
  const o = (id) => `<option value="${id}" ${id === cur ? "selected" : ""}>${esc(esItem(id))}</option>`;
  const megas = ITEMS.filter(x => { const it = Dex.items.get(x.id); return (it.megaStone && toID(it.megaEvolves) === sp.id) || (it.itemUser && it.itemUser.some(u => toID(u) === sp.id || toID(Dex.species.get(u).baseSpecies) === sp.id)); });
  const pop = POPULAR.filter(id => Dex.items.get(id).exists);
  const berries = ITEMS.filter(x => Dex.items.get(x.id).isBerry && !pop.includes(x.id));
  const rest = ITEMS.filter(x => !pop.includes(x.id) && !Dex.items.get(x.id).isBerry && !megas.some(m => m.id === x.id) && !Dex.items.get(x.id).megaStone);
  return `<option value="" ${cur ? "" : "selected"}>Sin objeto</option>
    ${megas.length ? `<optgroup label="Para ${esc(esSp(sp.name))}">${megas.map(x => o(x.id)).join("")}</optgroup>` : ""}
    <optgroup label="Más usados">${pop.map(o).join("")}</optgroup>
    <optgroup label="Bayas">${berries.map(x => o(x.id)).join("")}</optgroup>
    <optgroup label="Otros objetos">${rest.map(x => o(x.id)).join("")}</optgroup>`;
}
const BY_ITEM = {}; ITEMS.forEach(x => { BY_ITEM[x.es.toLowerCase()] = x.id; BY_ITEM[toID(x.id)] = x.id; });
const NATURES = Dex.natures.all().map(n => n.name).sort((a, b) => esNat(a).localeCompare(esNat(b), "es"));

const learnCache = {};
async function learnable(name) {
  const key = toID(name); if (learnCache[key]) return learnCache[key];
  const out = new Set(), seen = new Set(), q = [Dex.species.get(name)];
  while (q.length) {
    const s = q.shift(); if (!s || !s.exists || seen.has(s.id)) continue; seen.add(s.id);
    const l = await Dex.learnsets.get(s.id); if (l && l.learnset) Object.keys(l.learnset).forEach(m => out.add(m));
    if (s.prevo) q.push(Dex.species.get(s.prevo));
    if (s.changesFrom) q.push(Dex.species.get(s.changesFrom)); else if (s.baseSpecies !== s.name) q.push(Dex.species.get(s.baseSpecies));
  }
  const list = [...out].map(id => Dex.moves.get(id)).filter(m => m.exists && !m.isZ && !m.isMax && m.isNonstandard !== "CAP")
    .sort((a, b) => esMove(a.id).localeCompare(esMove(b.id), "es"));
  return (learnCache[key] = list);
}
function calcStat(sp, set, k) {
  const b = sp.baseStats[k], iv = set.ivs?.[k] ?? 31, ev = set.evs?.[k] ?? 0, L = set.level || 50;
  if (k === "hp") return sp.name === "Shedinja" ? 1 : Math.floor((2 * b + iv + Math.floor(ev / 4)) * L / 100) + L + 10;
  const n = Dex.natures.get(set.nature || "Serious");
  const mult = n.plus === k ? 1.1 : n.minus === k ? 0.9 : 1;
  return Math.floor((Math.floor((2 * b + iv + Math.floor(ev / 4)) * L / 100) + 5) * mult);
}

/* ---------- guardado ---------- */
const STORE_KEY = "midex-batalla-v1";
let ST = {teams: [{name: "Mi equipo", sets: []}], cur: 0, lvl: "50", diff: "normal", speed: "normal"};
let canStore = true;
try { const x = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); if (x && x.teams) ST = Object.assign(ST, x); } catch (e) { canStore = false; }
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(ST)); } catch (e) { canStore = false; } }
const team = () => ST.teams[ST.cur] || ST.teams[0];
function blankSet(sp) {
  const s = Dex.species.get(sp);
  return {name: "", species: s.name, item: "", ability: s.abilities["0"], moves: [], nature: "Hardy",
    evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0}, ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
    level: 50, teraType: s.types[0], gender: ""};
}
const RGEN = TeamGenerators.getTeamGenerator("gen9randombattle");
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
async function autoMoves(set, formeName) {
  const fsp = Dex.species.get(formeName || set.species);
  const data = (formeName && RGEN.randomMegaSets && RGEN.randomMegaSets[fsp.id]) || RGEN.randomSets[Dex.species.get(set.species).id];
  if (data && data.sets && data.sets.length) {
    const rs = data.sets[Math.floor(Math.random() * data.sets.length)];
    const pool = shuffle(rs.movepool.map(toID));
    const setup = pool.filter(m => { const mv = Dex.moves.get(m); return mv.category === "Status"; });
    const atk = pool.filter(m => !setup.includes(m));
    set.moves = [...atk.slice(0, 3), ...setup.slice(0, 1), ...atk.slice(3), ...setup.slice(1)].slice(0, 4);
    if (!formeName) set.ability = rs.abilities[0] || set.ability;
    const tt = rs.teraTypes.filter(x => x !== "Stellar"); if (tt.length) set.teraType = tt[0];
    const phys = set.moves.some(m => Dex.moves.get(m).category === "Physical") && !set.moves.every(m => Dex.moves.get(m).category !== "Physical") ? fsp.baseStats.atk >= fsp.baseStats.spa : set.moves.some(m => Dex.moves.get(m).category === "Physical");
    const bulky = /Bulky|Support|Wall|Tera Blast user/.test(rs.role) && !/Fast/.test(rs.role);
    set.evs = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
    if (bulky) { set.evs.hp = 252; set.evs[phys ? "atk" : "spa"] = 252; set.evs.spd = 4; set.nature = phys ? "Adamant" : "Modest"; }
    else { set.evs[phys ? "atk" : "spa"] = 252; set.evs.spe = 252; set.evs.hp = 4; set.nature = phys ? "Jolly" : "Timid"; }
    if (!formeName) set.item = /Setup|Sweeper|Attacker/.test(rs.role) ? (bulky ? "leftovers" : "lifeorb") : /Support|Wall/.test(rs.role) ? "leftovers" : "choicescarf";
    if (set.item === "choicescarf" && set.moves.some(m => Dex.moves.get(m).category === "Status")) set.item = "leftovers";
    return set;
  }
  const sp = fsp, ms = await learnable(set.species);
  const phys = sp.baseStats.atk >= sp.baseStats.spa;
  const dmg = ms.filter(m => m.category !== "Status" && m.basePower >= 60 && !m.flags.charge && !m.self?.volatileStatus && !["Explosion","Self-Destruct","Final Gambit","Memento","Dream Eater","Focus Punch","Synchronoise","Last Resort","Belch"].includes(m.name));
  const score = m => m.basePower * Math.min(1, (m.accuracy === true ? 100 : m.accuracy) / 100) * (sp.types.includes(m.type) ? 1.5 : 1) * ((m.category === "Physical") === phys ? 1.3 : 0.8) * (m.recoil || m.self?.boosts ? 0.85 : 1);
  dmg.sort((a, b) => score(b) - score(a));
  const pick = [], typesUsed = new Set();
  for (const m of dmg) { if (pick.length >= 4) break; if (typesUsed.has(m.type) && pick.length < 3) continue; pick.push(m.id); typesUsed.add(m.type); }
  for (const m of dmg) { if (pick.length >= 4) break; if (!pick.includes(m.id)) pick.push(m.id); }
  set.moves = pick.slice(0, 4);
  const total = [phys ? "atk" : "spa", "spe"]; set.evs = {hp: 4, atk: 0, def: 0, spa: 0, spd: 0, spe: 0}; total.forEach(k => set.evs[k] = 252);
  set.nature = phys ? (sp.baseStats.spe >= 80 ? "Jolly" : "Adamant") : (sp.baseStats.spe >= 80 ? "Timid" : "Modest");
  return set;
}

/* ---------- vistas ---------- */
let VIEW = "menu", SEL = 0, B = null;
function go(v) { VIEW = v; render(); window.scrollTo(0, 0); }
function render() {
  if (VIEW === "menu") return renderMenu();
  if (VIEW === "team") return renderTeam();
  if (VIEW === "battle") return renderBattleShell();
  if (VIEW === "reto") return renderReto();
}
const iconSword = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/></svg>';
const iconDice = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/></svg>';
const iconEdit = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z"/></svg>';
function strip(sets) { return `<div class="teamstrip">${sets.map(s => `<img src="${esc(img(s.species))}" alt="${esc(esSp(s.species))}" title="${esc(esSp(s.species))}" loading="lazy">`).join("")}</div>`; }
function seg(id, val, opts) { return `<div class="seg" data-seg="${id}">${opts.map(([v, l]) => `<button data-v="${v}" aria-pressed="${val === v}">${l}</button>`).join("")}</div>`; }

function renderMenu() {
  const t = team();
  $("app").innerHTML = `<div class="top"><a class="back" href="index.html">‹ Mi Dex</a><h1>Batalla</h1><span></span></div>
  <div class="stack">
    <div class="modes">
      <button class="mode" data-act="quick"><span class="ic">${iconDice}</span><span><b>Batalla rápida</b><span>Tú y la CPU reciben 6 Pokémon al azar con sets competitivos.</span></span></button>
      <button class="mode" data-act="mine" ${t.sets.length ? "" : "disabled"}><span class="ic">${iconSword}</span><span><b>${esc(t.name)} vs CPU</b><span>${t.sets.length ? `Tu equipo de ${t.sets.length} contra un equipo al azar.` : "Primero arma tu equipo."}</span></span></button>
      <button class="mode" data-act="reto"><span class="ic">${iconBadge}</span><span><b>Modo Desafío · Kanto</b><span>Vence a los 8 Líderes de Gimnasio, al Alto Mando y al Campeón con tu equipo. ${retoCount()}/${RETO.trainers.length} superados.</span></span></button>
      <button class="mode" data-act="team"><span class="ic">${iconEdit}</span><span><b>Armar mi equipo</b><span>Elige Pokémon, movimientos, habilidad, objeto, naturaleza, EVs, IVs y teratipo.</span></span></button>
    </div>
    ${t.sets.length ? `<div class="card"><h3>${esc(t.name)}</h3>${strip(t.sets)}</div>` : ""}
    <div class="card"><h3>Opciones</h3>
      <div class="stack">
        <div class="field"><label>Nivel</label>${seg("lvl", ST.lvl, [["50","Nivel 50"],["100","Nivel 100"],["rand","Equilibrado"]])}
          <p class="note">“Equilibrado” usa niveles distintos por Pokémon para que los débiles puedan competir (como Random Battle). En “${esc(t.name)} vs CPU” tu equipo mantiene su nivel.</p></div>
        <div class="field"><label>Dinamax / Gigamax</label>${seg("dmax", ST.dmax || "on", [["on","Permitido"],["off","Desactivado"]])}<p class="note">Un Dinamax por combate para cada lado; dura 3 turnos. La megaevolución siempre está disponible si el Pokémon lleva su megapiedra.</p></div>
        <div class="field"><label>CPU</label>${seg("diff", ST.diff, [["easy","Fácil"],["normal","Normal"],["hard","Difícil"]])}</div>
        <div class="field"><label>Velocidad del texto</label>${seg("speed", ST.speed, [["slow","Lenta"],["normal","Normal"],["fast","Rápida"]])}</div>
      </div>
    </div>
    <p class="note">Reglas y cálculos del motor de Pokémon Showdown (Gen 9): daño, críticos, precisión, prioridad, estados, climas, habilidades, objetos, teracristalización y megaevolución (con su megapiedra). ${canStore ? "" : "Este navegador no permite guardar equipos."}</p>
  </div>`;
}

async function renderTeam() {
  const t = team(); if (SEL >= Math.max(1, t.sets.length + (t.sets.length < 6 ? 1 : 0))) SEL = 0;
  const set = t.sets[SEL];
  $("app").innerHTML = `<div class="top"><button class="back" data-act="menu">‹ Volver</button><h1>Mi equipo</h1><span></span></div>
  <div class="stack">
    <div class="card"><div class="grid2">
      <div class="field"><label>Equipo</label><select id="teamSel">${ST.teams.map((x, i) => `<option value="${i}" ${i === ST.cur ? "selected" : ""}>${esc(x.name)} (${x.sets.length})</option>`).join("")}</select></div>
      <div class="field"><label>Nombre</label><input id="teamName" value="${esc(t.name)}" maxlength="30"></div></div>
      <div class="btns" style="margin-top:10px"><button class="btn" data-act="newteam">Nuevo equipo</button><button class="btn" data-act="io">Importar / exportar</button>${ST.teams.length > 1 ? '<button class="btn warn" data-act="delteam">Borrar equipo</button>' : ""}</div>
      <div id="io" hidden style="margin-top:10px"><textarea id="ioText" spellcheck="false" placeholder="Pega aquí un equipo en formato Pokémon Showdown (en inglés)"></textarea>
        <div class="btns" style="margin-top:8px"><button class="btn pri" data-act="import">Importar (reemplaza el equipo)</button><button class="btn" data-act="export">Mostrar mi equipo en texto</button></div>
        <p class="note">Formato Showdown: sirve para copiar equipos desde Smogon o Showdown y para respaldar los tuyos.</p></div>
    </div>
    <div class="slots">${Array.from({length: 6}, (_, i) => { const s = t.sets[i];
      if (!s && i > t.sets.length) return `<div class="slot" style="opacity:.35"></div>`;
      return `<button class="slot" data-slot="${i}" aria-pressed="${i === SEL}">${s ? `<img src="${esc(img(s.species))}" alt=""><small>${esc(esSp(s.species))}</small><em>Nv. ${s.level}${s.item ? " · " + esc(esItem(s.item)) : ""}</em>` : `<small style="font-size:26px;color:var(--ink3)">+</small><em>Agregar</em>`}</button>`; }).join("")}</div>
    <div id="editor">${set ? '<div class="card"><p class="note">Cargando movimientos…</p></div>' : newSlotHTML()}</div>
  </div>`;
  if (set) $("editor").innerHTML = await editorHTML(set);
}
function newSlotHTML() {
  return `<div class="card"><h3>Agregar Pokémon</h3>
    <div class="field"><label>Pokémon</label><input id="spIn" list="spList" placeholder="Escribe un nombre (ej. Garchomp)" autocomplete="off"></div>
    <datalist id="spList">${SPLIST.map(x => `<option value="${esc(x.es)}">`).join("")}</datalist>
    <p class="note">Se agrega con movimientos y EVs sugeridos; después puedes cambiar todo.</p></div>`;
}
async function editorHTML(set) {
  const sp = Dex.species.get(set.species), ms = await learnable(set.species);
  const abil = Object.values(sp.abilities);
  const moveSel = i => `<select data-move="${i}"><option value="">—</option>${ms.map(m => `<option value="${m.id}" ${set.moves[i] === m.id ? "selected" : ""}>${esc(esMove(m.id))} · ${esc(esType(m.type))}${m.category !== "Status" ? " · Pot. " + (m.basePower || "—") : " · Estado"} · Prec. ${accTxt(m)}</option>`).join("")}</select>`;
  const n = Dex.natures.get(set.nature);
  const evTot = SK.reduce((a, k) => a + (set.evs[k] || 0), 0);
  return `<div class="card"><div style="display:grid;grid-template-columns:84px 1fr;gap:12px;align-items:center;margin-bottom:10px">
      <img src="${esc(img(set.species))}" alt="" style="width:84px;height:84px;object-fit:contain">
      <div><b style="font-family:var(--display);font-size:20px">${esc(esSp(set.species))}</b><div style="margin-top:4px;display:flex;gap:4px">${sp.types.map(tchip).join("")}</div></div></div>
    <div class="grid2">
      <div class="field"><label>Nivel</label><input type="number" id="f-level" min="1" max="100" value="${set.level}"></div>
      <div class="field"><label>Teratipo</label><select id="f-tera">${TYPES.map(t => `<option value="${Dex.types.get(t).name}" ${toID(set.teraType) === toID(t) ? "selected" : ""}>${TY[t][0]}</option>`).join("")}</select></div>
      <div class="field"><label>Habilidad</label><select id="f-ability">${abil.map(a => `<option value="${esc(a)}" ${toID(a) === toID(set.ability) ? "selected" : ""}>${esc(esAb(a))}</option>`).join("")}</select></div>
      <div class="field"><label>Objeto</label><select id="f-item">${itemOptions(set)}</select></div>
    </div>
    ${set.ability ? `<p class="note"><b>${esc(esAb(set.ability))}:</b> ${esc(esAbDesc(set.ability))}</p>` : ""}
    ${set.item ? `<p class="note"><b>${esc(esItem(set.item))}:</b> ${esc(esItemDesc(set.item))}</p>` : ""}
    ${Dex.species.get(set.species + "-Gmax").exists ? `<label class="sw" style="margin-top:10px"><input type="checkbox" id="f-gmax" ${set.gigantamax ? "checked" : ""}> Puede Gigamaximizarse (factor Gigamax)</label>` : ""}
    <h3 style="margin-top:14px">Movimientos</h3><div class="grid4">${[0, 1, 2, 3].map(i => `<div class="field">${moveSel(i)}${set.moves[i] ? `<p class="note" style="margin:3px 0 0">${(mv => `<b>${esc(esType(mv.type))} · ${mv.category === "Status" ? "Estado" : (mv.category === "Physical" ? "Físico" : "Especial") + " · Pot. " + (mv.basePower || "—")} · Prec. ${accTxt(mv)} · PP ${mv.pp}</b><br>`)(Dex.moves.get(set.moves[i]))}${esc(esMoveDesc(set.moves[i]))}</p>` : ""}</div>`).join("")}</div>
    <h3 style="margin-top:14px">Naturaleza, EVs e IVs</h3>
    <div class="field"><select id="f-nature">${NATURES.map(x => { const d = Dex.natures.get(x); return `<option value="${x}" ${x === set.nature ? "selected" : ""}>${esc(esNat(x))}${d.plus ? ` (+${STS[d.plus]} −${STS[d.minus]})` : " (neutra)"}</option>`; }).join("")}</select></div>
    <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">
      <div class="evrow" style="font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:.05em"><span>Stat</span><span>EVs</span><span style="text-align:center">IV</span><span style="text-align:right">Total</span></div>
      ${SK.map(k => `<div class="evrow"><span class="${n.plus === k ? "nat-up" : n.minus === k ? "nat-dn" : ""}">${STAT[k].replace("Ataque Especial","At. Esp.").replace("Defensa Especial","Def. Esp.")} <small style="color:var(--ink3)">${sp.baseStats[k]}</small></span>
        <span style="display:flex;gap:6px;align-items:center"><input type="range" min="0" max="252" step="4" data-ev="${k}" value="${set.evs[k] || 0}"><input type="number" min="0" max="252" data-evn="${k}" value="${set.evs[k] || 0}" style="width:50px"></span>
        <input type="number" min="0" max="31" data-iv="${k}" value="${set.ivs[k] ?? 31}"><span class="st" id="st-${k}">${calcStat(sp, set, k)}</span></div>`).join("")}
      <p class="note" id="evtot" style="${evTot > 510 ? "color:var(--bad)" : ""}">EVs usados: ${evTot} / 510</p>
    </div>
    <div class="btns" style="margin-top:12px"><button class="btn" data-act="suggest">Sugerir movimientos y EVs</button><button class="btn warn" data-act="remove">Quitar del equipo</button></div>
  </div>`;
}

/* ---------- batalla ---------- */
const SPEED = {slow: 1500, normal: 950, fast: 450};
let skipWait = null;
function wait(ms) { return new Promise(r => { const t = setTimeout(() => { skipWait = null; r(); }, ms); skipWait = () => { clearTimeout(t); skipWait = null; r(); }; }); }

function renderBattleShell() {
  $("app").innerHTML = `<div class="top"><button class="back" data-act="quit">‹ Salir</button><h1 id="turnLbl">Batalla</h1><span></span></div>
  <div class="scene" id="scene">
    <div class="plat foe"></div><div class="plat me"></div>
    <div class="mon foe out" id="mon-p2"><img alt=""></div>
    <div class="mon me out" id="mon-p1"><img alt=""></div>
    <div class="hud foe" id="hud-p2" hidden></div>
    <div class="hud me" id="hud-p1" hidden></div>
    <div class="balls foe" id="balls-p2"></div><div class="balls me" id="balls-p1"></div>
    <div class="weather" id="wx" hidden></div>
  </div>
  <div class="textbox" id="tb" role="status" aria-live="polite">…</div>
  <div class="controls" id="ctl"></div>
  <details class="card" style="margin-top:12px;padding:10px 14px"><summary style="cursor:pointer;font-weight:600">Registro de la batalla</summary><div class="log" id="log"></div></details>`;
}

function newBattle(t1, t2, opts) {
  opts = opts || {}; globalThis.ALLOW_DMAX = ST.dmax !== "off";
  if (B) B.dead = true;
  const s = BattleStreams.getPlayerStreams(new BattleStreams.BattleStream());
  B = {s, t1, t2, mons: {}, act: {p1: null, p2: null}, weather: null, turn: 0, chunks: [], busy: false, req: null, reqReady: false,
       over: false, dead: false, choice: {tera: false, mega: false}, sideCount: {p1: t1.length, p2: t2.length}, fainted: {p1: 0, p2: 0},
       trainer: opts.trainer || null, foeName: opts.trainer ? opts.trainer.n : null, aiDiff: opts.aiDiff || null};
  const me = B;
  VIEW = "battle"; render();
  (async () => { for await (const c of s.p1) { if (me.dead) return; me.chunks.push(c); pump(me); } })();
  aiLoop(me);
  if (me.trainer) { const r = me.trainer.r, pre = me.trainer.medal ? "El Líder de Gimnasio " : r.startsWith("Alto Mando") ? "El Alto Mando " : r.startsWith("Campeón") ? "El Campeón " : ""; me.chunks.push("|-intro|" + `¡${pre}${me.trainer.n} te desafía!`); pump(me); }
  s.omniscient.write(`>start {"formatid":"gen9customgame"}\n>player p1 ${JSON.stringify({name: "Tú", team: Teams.pack(t1)})}\n>player p2 ${JSON.stringify({name: "CPU", team: Teams.pack(t2)})}`);
}

async function pump(me) {
  if (me.busy) return; me.busy = true;
  while (me.chunks.length && !me.dead) {
    const c = me.chunks.shift();
    if (c.startsWith("|request|")) { const r = JSON.parse(c.slice(9)); if (!r.wait) { me.req = r; setTimeout(() => pump(me), 120); } continue; }
    const lines = c.split("\n");
    for (const ln of lines) { if (me.dead) return; await handle(me, ln); }
  }
  me.busy = false;
  if (me.req && !me.chunks.length && !me.over && !me.dead && !me.shown) { me.shown = true; showControls(me); }
}

function sideOf(ident) { return ident.slice(0, 2); }
function keyOf(ident) { return ident.slice(0, 2) + ":" + ident.replace(/^p\d[a-z]?:\s*/, ""); }
function mon(me, ident) { return me.mons[keyOf(ident)]; }
function nameOf(me, ident, start) {
  const m = mon(me, ident); const n = m ? esSp(m.species) : ident.replace(/^p\d[a-z]?:\s*/, "");
  if (sideOf(ident) === "p2") return me.foeName ? (start ? `El ${n} de ${me.foeName}` : `el ${n} de ${me.foeName}`) : (start ? `El ${n} rival` : `el ${n} rival`);
  return n;
}
function parseHP(cond) {
  const [hp, st] = cond.split(" "); if (hp === "0" || st === "fnt") return {hp: 0, max: null, status: "fnt"};
  const [a, b] = hp.split("/").map(Number); return {hp: a, max: b, status: st || ""};
}
function fromOf(args) { const f = args.find(a => a.startsWith("[from]")); return f ? f.slice(7).trim() : ""; }
function ofOf(args) { const f = args.find(a => a.startsWith("[of]")); return f ? f.slice(5).trim() : ""; }
function effName(eff) {
  eff = eff.replace(/^(move|ability|item):\s*/, "");
  const m = Dex.moves.get(eff); if (m.exists) return esMove(m.id);
  const a = Dex.abilities.get(eff); if (a.exists) return esAb(a.id);
  const i = Dex.items.get(eff); if (i.exists) return esItem(i.id);
  return eff;
}

async function say(me, text, slow) {
  if (!text) return;
  $("tb").textContent = text; $("tb").classList.add("more");
  const log = $("log"); if (log) { const p = document.createElement("p"); p.textContent = text; log.appendChild(p); }
  await wait((SPEED[ST.speed] || 950) * (slow || 1));
  $("tb").classList.remove("more");
}

function drawSide(me, side) {
  const key = me.act[side], m = key && me.mons[key];
  const el = $("mon-" + side), hud = $("hud-" + side);
  if (!el) return;
  if (!m) { hud.hidden = true; return; }
  const im = el.querySelector("img"); const gsp = m.gmax && Dex.species.get(m.species + "-Gmax"); const src = gsp && gsp.exists && exactMd(gsp.name) ? img(gsp.name) : img(m.species); if (im.getAttribute("src") !== src) im.src = src;
  el.classList.toggle("dmax", !!m.dmax);
  el.classList.toggle("tera", !!m.tera); if (m.tera) el.style.setProperty("--tc", (TY[toID(m.tera).toUpperCase()] || TY.NORMAL)[1]);
  hud.hidden = false;
  const pct = m.max ? Math.max(0, m.hp / m.max * 100) : 0;
  const bst = Object.entries(m.boosts || {}).filter(([, v]) => v).map(([k, v]) => `<span style="color:${v > 0 ? "var(--good)" : "var(--bad)"}">${STS[k] || (k === "accuracy" ? "Prec" : k === "evasion" ? "Eva" : k)} ${v > 0 ? "+" : ""}${v}</span>`).join("");
  hud.innerHTML = `<div class="nm"><span>${esc(esSp(m.species))}${m.gender === "M" ? " ♂" : m.gender === "F" ? " ♀" : ""}</span><span class="lv">Nv. ${m.level}</span></div>
    <div class="hts">${(m.tera ? [m.tera] : Dex.species.get(m.species).types).map(tchip).join("")}${m.tera ? '<span class="tp" style="--c:var(--surface2);--ct:var(--ink2)">Tera</span>' : ""}${m.dmax ? `<span class="tp" style="--c:#D6264F;--ct:#fff">${m.gmax ? "Gigamax" : "Dinamax"}</span>` : ""}</div>
    <div class="hpb"><i>PS</i><span class="hpt"><span class="hpf ${pct <= 20 ? "low" : pct <= 50 ? "mid" : ""}" style="width:${pct}%;display:block"></span></span></div>
    <div class="hpn"><span>${m.status && m.status !== "fnt" ? `<span class="sts ${m.status}">${{brn: "QUE", par: "PAR", psn: "ENV", tox: "ENV", slp: "DOR", frz: "CON"}[m.status] || m.status.toUpperCase()}</span>` : ""}</span><span>${side === "p1" ? `${Math.max(0, m.hp)}/${m.max}` : `${Math.round(pct)}%`}</span></div>
    ${bst ? `<div class="boosts">${bst}</div>` : ""}`;
  const total = me.sideCount[side], fainted = Object.values(me.mons).filter(x => x.side === side && x.hp <= 0).length;
  $("balls-" + side).innerHTML = Array.from({length: total}, (_, i) => `<i class="${i < fainted ? "f" : ""}"></i>`).join("");
}
function drawAll(me) { drawSide(me, "p1"); drawSide(me, "p2"); }
async function anim(side, cls, ms) { const el = $("mon-" + side); if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); await sleep(ms); el.classList.remove(cls); }

const WX = {RainDance: ["¡Empezó a llover!", "Sigue lloviendo.", "Dejó de llover.", "Lluvia"], PrimordialSea: ["¡Empezó a diluviar!", "Sigue diluviando.", "El diluvio cesó.", "Diluvio"],
  SunnyDay: ["¡El sol pega fuerte!", "El sol sigue pegando fuerte.", "El sol vuelve a brillar como siempre.", "Sol"], DesolateLand: ["¡El sol es abrasador!", "El sol sigue abrasando.", "El sol abrasador se calmó.", "Sol abrasador"],
  Sandstorm: ["¡Se desató una tormenta de arena!", "La tormenta de arena arrecia.", "La tormenta de arena amainó.", "Tormenta de arena"], Snowscape: ["¡Empezó a nevar!", "Sigue nevando.", "Dejó de nevar.", "Nieve"],
  Snow: ["¡Empezó a nevar!", "Sigue nevando.", "Dejó de nevar.", "Nieve"], Hail: ["¡Empezó a granizar!", "Sigue granizando.", "Dejó de granizar.", "Granizo"], DeltaStream: ["¡Unas turbulencias misteriosas protegen a los Pokémon de tipo Volador!", "", "Las turbulencias cesaron.", "Turbulencias"]};
const STATUS_ON = {brn: "¡{X} se ha quemado!", par: "¡{X} está paralizado! Quizá no pueda moverse.", slp: "¡{X} se ha dormido!", frz: "¡{X} se ha congelado!", psn: "¡{X} ha sido envenenado!", tox: "¡{X} ha sido gravemente envenenado!"};
const STATUS_OFF = {brn: "¡{X} ya no está quemado!", par: "¡{X} ya no está paralizado!", slp: "¡{X} se ha despertado!", frz: "¡{X} se ha descongelado!", psn: "¡{X} ya no está envenenado!", tox: "¡{X} ya no está envenenado!"};

async function handle(me, ln) {
  if (!ln.startsWith("|")) return;
  const a = ln.slice(1).split("|"), cmd = a[0], args = a.slice(1);
  const X = (i = 0, s) => nameOf(me, args[i], s);
  switch (cmd) {
    case "poke": { if (!me.preview) me.preview = {p1: [], p2: []}; me.preview[args[0]].push(args[1].split(",")[0]); return; }
    case "teampreview": return;
    case "turn": { me.turn = +args[0]; const l = $("turnLbl"); if (l) l.textContent = "Turno " + me.turn; const lg = $("log"); if (lg) { const p = document.createElement("p"); p.className = "turn"; p.textContent = "Turno " + me.turn; lg.appendChild(p); } return; }
    case "switch": case "drag": case "replace": {
      const side = sideOf(args[0]), key = keyOf(args[0]), det = args[1].split(", ");
      const hp = parseHP(args[2] || "100/100");
      const old = me.mons[key] || {};
      const m = me.mons[key] = Object.assign(old, {side, species: det[0], level: +((det.find(d => /^L\d+/.test(d)) || "L100").slice(1)), gender: det.includes("M") ? "M" : det.includes("F") ? "F" : "", hp: hp.hp, max: hp.max || 100, status: hp.status, boosts: {}, dmax: false, gmax: false, tera: det.find(d => d.startsWith("tera:"))?.slice(5) || old.tera || ""});
      const prev = me.act[side];
      if (prev && prev !== key && cmd !== "replace") {
        if (me.mons[prev] && me.mons[prev].hp > 0) { if (side === "p1") await say(me, `¡${esSp(me.mons[prev].species)}, vuelve!`, 0.6); else if (cmd === "switch") await say(me, `${me.foeName || "El rival"} retiró a ${esSp(me.mons[prev].species)}.`, 0.6); }
        $("mon-" + side).classList.add("out"); await sleep(250);
      }
      me.act[side] = key; drawSide(me, side);
      const el = $("mon-" + side); el.classList.remove("faint"); el.classList.add("out"); void el.offsetWidth; el.classList.remove("out");
      if (cmd === "drag") await say(me, `¡${cap(X(0))} fue arrastrado al combate!`);
      else await say(me, side === "p1" ? `¡Adelante, ${esSp(m.species)}!` : `¡${me.foeName || "El rival"} sacó a ${esSp(m.species)}!`);
      return;
    }
    case "detailschange": case "-formechange": {
      const m = mon(me, args[0]); if (!m) return; m.species = args[1].split(",")[0]; drawSide(me, sideOf(args[0])); return;
    }
    case "-mega": await say(me, `¡${X(0, 1)} ha megaevolucionado en ${esSp(mon(me, args[0])?.species || args[1])}!`); drawAll(me); return;
    case "-terastallize": { const m = mon(me, args[0]); if (m) m.tera = args[1]; drawSide(me, sideOf(args[0])); await anim(sideOf(args[0]), "hit", 400); await say(me, `¡${X(0, 1)} se ha teracristalizado en tipo ${esType(args[1])}!`); return; }
    case "move": {
      const side = sideOf(args[0]);
      const miss = args.some(x => x === "[miss]"), still = args.some(x => x === "[still]");
      await say(me, `¡${X(0, 1)} usó ${esMove(args[1])}!`, 0.8);
      if (!still && !miss) anim(side, "lunge", 350);
      return;
    }
    case "cant": {
      const r = args[1] || "", map = {par: "¡{X} está paralizado! No se puede mover.", slp: "{X} está dormido como un tronco.", frz: "¡{X} está congelado!", flinch: "¡{X} retrocedió y no pudo moverse!", recharge: "{X} necesita recuperarse de su ataque.", nopp: "¡{X} no tiene PP para ese movimiento!"};
      const t = map[r] || (r.startsWith("move:") || args[2] ? `¡${X(0, 1)} no puede usar ${esMove(args[2] || r.replace("move: ", ""))}!` : `¡${X(0, 1)} no se puede mover!`);
      await say(me, cap(t.replace("{X}", X(0)))); return;
    }
    case "-damage": case "-heal": case "-sethp": {
      const m = mon(me, args[0]); if (!m) return;
      const before = m.hp, hp = parseHP(args[1]); m.hp = hp.hp; if (hp.max) m.max = hp.max; if (hp.status && hp.status !== "fnt") m.status = hp.status;
      const side = sideOf(args[0]); drawSide(me, side);
      const from = fromOf(args), of = ofOf(args);
      if (cmd === "-damage") {
        if (!from) { await anim(side, "hit", 500); return; }
        const f = from.replace(/^(item|ability|move):\s*/, "");
        const t = {brn: "¡{X} se resiente de las quemaduras!", psn: "¡El veneno resta PS a {x}!", tox: "¡El veneno resta PS a {x}!", Recoil: "¡{X} también se ha hecho daño!", "Stealth Rock": "¡Las piedras puntiagudas dañan a {x}!",
          Spikes: "¡Las púas dañan a {x}!", sandstorm: "¡La tormenta de arena zarandea a {x}!", Sandstorm: "¡La tormenta de arena zarandea a {x}!", hail: "¡El granizo golpea a {x}!", confusion: "¡Está tan confuso que se hirió a sí mismo!",
          "Life Orb": "¡{X} ha perdido PS por la Vidasfera!", "Leech Seed": "¡Las drenadoras restan salud a {x}!", "Rough Skin": "¡{X} se ha hecho daño con la Piel Tosca del rival!", "Iron Barbs": "¡{X} se ha hecho daño con las Punta Acero del rival!",
          "Rocky Helmet": "¡{X} se ha hecho daño con el Casco Dentado!", "Salt Cure": "¡La Salazón hace daño a {x}!", Curse: "¡{X} es víctima de una maldición!", "Bind": "¡{X} sufre el daño de Atadura!", "Whirlpool": "¡{X} sufre el daño de Torbellino!", "Fire Spin": "¡{X} sufre el daño de Giro Fuego!"}[f];
        await anim(side, "hit", 350);
        await say(me, cap((t || `¡${X(0, 1)} perdió PS por ${effName(from)}!`).replace("{X}", X(0, 1)).replace("{x}", X(0))), 0.8);
      } else if (cmd === "-heal") {
        if (from) { const f = from.replace(/^(item|ability|move):\s*/, "");
          if (from.startsWith("item:")) await say(me, `¡${X(0, 1)} recuperó PS gracias a su ${esItem(f)}!`, 0.8);
          else if (from === "drain") await say(me, `¡${X(0, 1)} absorbió energía!`, 0.7);
          else if (from.startsWith("ability:")) await say(me, `¡${X(0, 1)} recuperó PS gracias a ${esAb(f)}!`, 0.8);
          else await say(me, `¡${X(0, 1)} recuperó PS!`, 0.7);
        } else if (m.hp > before) await say(me, `¡${X(0, 1)} recuperó PS!`, 0.7);
      }
      return;
    }
    case "faint": { const m = mon(me, args[0]); if (m) { m.hp = 0; m.status = "fnt"; } const side = sideOf(args[0]); $("mon-" + side).classList.add("faint"); drawSide(me, side); await say(me, `¡${X(0, 1)} se ha debilitado!`); return; }
    case "-supereffective": return say(me, "¡Es muy eficaz!", 0.7);
    case "-resisted": return say(me, "No es muy eficaz…", 0.7);
    case "-immune": return say(me, `No afecta a ${X(0)}…`, 0.8);
    case "-crit": return say(me, "¡Un golpe crítico!", 0.7);
    case "-miss": return say(me, args[1] ? `¡${X(1, 1)} evitó el ataque!` : `¡El ataque de ${X(0)} falló!`, 0.8);
    case "-fail": return say(me, "¡Pero falló!", 0.7);
    case "-hitcount": return say(me, `¡Recibió ${args[1]} golpe${args[1] === "1" ? "" : "s"}!`, 0.7);
    case "-ohko": return say(me, "¡Fulminado de un golpe!");
    case "-status": { const m = mon(me, args[0]); if (m) m.status = args[1]; drawSide(me, sideOf(args[0])); const t = STATUS_ON[args[1]]; return say(me, t ? cap(t.replace("{X}", X(0))) : ""); }
    case "-curestatus": { const m = mon(me, args[0]); if (m) m.status = ""; drawSide(me, me.act[sideOf(args[0])] === keyOf(args[0]) ? sideOf(args[0]) : sideOf(args[0])); const t = STATUS_OFF[args[1]]; return say(me, t ? cap(t.replace("{X}", X(0))) : "", 0.7); }
    case "-cureteam": return say(me, "¡El equipo se curó de todos los problemas de estado!");
    case "-boost": case "-unboost": {
      const m = mon(me, args[0]), n = +args[2], st = args[1];
      if (m) { m.boosts[st] = Math.max(-6, Math.min(6, (m.boosts[st] || 0) + (cmd === "-boost" ? n : -n))); drawSide(me, sideOf(args[0])); }
      const lvl = n === 0 ? (cmd === "-boost" ? " no puede subir más" : " no puede bajar más") : cmd === "-boost" ? (n >= 3 ? " subió muchísimo" : n === 2 ? " subió mucho" : " subió") : (n >= 3 ? " bajó muchísimo" : n === 2 ? " bajó mucho" : " bajó");
      const art = ["accuracy", "evasion"].includes(st) ? "La" : "El";
      return say(me, `¡${art} ${STAT[st] || st} de ${X(0)}${lvl}!`, 0.8);
    }
    case "-setboost": { const m = mon(me, args[0]); if (m) { m.boosts[args[1]] = +args[2]; drawSide(me, sideOf(args[0])); } return say(me, `¡${X(0, 1)} maximizó su ${STAT[args[1]] || args[1]}!`, 0.8); }
    case "-clearboost": case "-clearallboost": case "-clearnegativeboost": {
      if (cmd === "-clearallboost") Object.values(me.mons).forEach(m => { m.boosts = {}; });
      else { const m = mon(me, args[0]); if (m) m.boosts = {}; }
      drawAll(me); return say(me, cmd === "-clearallboost" ? "¡Se anularon todos los cambios de características!" : `¡Se anularon los cambios de características de ${X(0)}!`, 0.8);
    }
    case "-weather": {
      const w = args[0], up = args.includes("[upkeep]");
      const wx = $("wx");
      if (w === "none") { const old = WX[me.weather]; me.weather = null; if (wx) wx.hidden = true; return say(me, old ? old[2] : "El clima volvió a la normalidad.", 0.8); }
      me.weather = w; const t = WX[w] || ["¡El tiempo cambió!", "", "", "Clima"]; if (wx) { wx.hidden = false; wx.textContent = t[3]; }
      return up ? (ST.speed === "fast" ? null : say(me, t[1], 0.5)) : say(me, t[0]);
    }
    case "-fieldstart": return say(me, `¡Se activó ${effName(args[0])}!`, 0.8);
    case "-fieldend": return say(me, `${effName(args[0])} terminó.`, 0.7);
    case "-sidestart": { const own = args[0].startsWith("p1") ? "tu equipo" : "el equipo rival", e = effName(args[1]);
      const t = {"Piedras Puntiagudas": `¡${cap(own)} está rodeado de piedras puntiagudas!`, "Púas": `¡${cap(own)} está rodeado de púas!`, "Púas Tóxicas": `¡${cap(own)} está rodeado de púas tóxicas!`}[e];
      return say(me, t || `¡${e} protege a ${own}!`, 0.9); }
    case "-sideend": { const own = args[0].startsWith("p1") ? "tu equipo" : "el equipo rival"; return say(me, `${effName(args[1])} ya no afecta a ${own}.`, 0.7); }
    case "-ability": {
      if (args[1] === "Intimidate" || args[2] === "boost") return say(me, `[${esAb(args[1])} de ${X(0)}]`, 0.6);
      return say(me, `[${esAb(args[1])} de ${X(0)}]`, 0.6);
    }
    case "-item": { const f = fromOf(args);
      if (f.includes("Frisk")) return say(me, `¡${cap(X(0))} lleva ${esItem(args[1])}!`, 0.7);
      return say(me, `¡${X(0, 1)} obtuvo ${esItem(args[1])}!`, 0.7); }
    case "-enditem": { const it = esItem(args[1]);
      if (args.includes("[eat]")) return say(me, `¡${X(0, 1)} se comió su ${it}!`, 0.7);
      if (fromOf(args).includes("Knock Off") || fromOf(args).includes("stealeat")) return say(me, `¡${X(0, 1)} perdió su ${it}!`, 0.7);
      return say(me, `¡${X(0, 1)} usó su ${it}!`, 0.7); }
    case "-start": if (args[1] === "Dynamax") { const m = mon(me, args[0]); if (m) { m.dmax = true; m.gmax = args.includes("Gmax"); } drawSide(me, sideOf(args[0])); await anim(sideOf(args[0]), "hit", 300); return say(me, `¡${X(0, 1)} se ha ${args.includes("Gmax") ? "gigamaximizado" : "dinamaximizado"}!`, 1.2); }
    { const e = args[1].replace(/^(move|ability|item):\s*/, ""), f = fromOf(args);
      const t = {confusion: "¡{X} se encuentra confuso!", Substitute: "¡{X} creó un sustituto!", "Leech Seed": "¡{X} ha sido infectado!", Encore: "¡{X} ha sido obligado a repetir su movimiento!", Taunt: "¡{X} ha caído en la provocación!",
        "Focus Energy": "¡{X} se está preparando para dar lo mejor de sí!", perish3: "La cuenta atrás de {x} ha empezado.", typechange: "¡{X} ahora es de tipo " + (args[2] ? args[2].split("/").map(esType).join("/") : "") + "!", Yawn: "¡{X} empieza a tener sueño!", Disable: "¡El movimiento de {x} fue anulado!", "Salt Cure": "¡{X} fue salado!", "Protosynthesis": "¡{X} potenció su poder con Paleosíntesis!", "Quark Drive": "¡{X} potenció su poder con Carga Cuark!"}[e];
      if (e === "confusion" && f) return say(me, cap(t.replace("{X}", X(0))), 0.8);
      return say(me, t ? cap(t.replace("{X}", X(0)).replace("{x}", X(0))) : "", 0.8); }
    case "-end": if (args[1] === "Dynamax") { const m = mon(me, args[0]); if (m) { m.dmax = false; m.gmax = false; } drawSide(me, sideOf(args[0])); return say(me, `¡${X(0, 1)} ha vuelto a su tamaño normal!`, 0.9); }
    { const e = args[1].replace(/^(move|ability|item):\s*/, "");
      const t = {confusion: "¡{X} ya no está confuso!", Substitute: "¡El sustituto de {x} se desvaneció!", Taunt: "{X} ya no está bajo los efectos de la provocación.", Encore: "El efecto de Otra Vez de {x} terminó."}[e];
      return say(me, t ? cap(t.replace("{X}", X(0)).replace("{x}", X(0))) : "", 0.7); }
    case "-activate": { const e = (args[1] || "").replace(/^(move|ability|item):\s*/, "");
      const t = {Protect: "¡{X} se protegió!", Detect: "¡{X} se protegió!", "King's Shield": "¡{X} se protegió!", "Spiky Shield": "¡{X} se protegió!", "Baneful Bunker": "¡{X} se protegió!", "Silk Trap": "¡{X} se protegió!", Substitute: "¡El sustituto recibió el daño en lugar de {x}!", confusion: "¡{X} está confuso!", "Focus Sash": "¡{X} aguantó el golpe gracias a la Banda Focus!", Sturdy: "¡{X} aguantó el golpe gracias a Robustez!", Endure: "¡{X} aguantó el golpe!", "Destiny Bond": "¡{X} se llevó a su rival consigo!", trapped: "¡{X} no puede escapar!"}[e];
      return say(me, t ? cap(t.replace("{X}", X(0)).replace("{x}", X(0))) : "", 0.7); }
    case "-singleturn": { const e = (args[1] || "").replace(/^move:\s*/, ""); if (e === "Protect" || e === "Detect") return say(me, `¡${X(0, 1)} se está protegiendo!`, 0.7); return; }
    case "-prepare": return say(me, `¡${X(0, 1)} se prepara para usar ${esMove(args[1])}!`, 0.8);
    case "-mustrecharge": return;
    case "-transform": { const m = mon(me, args[0]), t = mon(me, args[1]); if (m && t) { m.species = t.species; drawSide(me, sideOf(args[0])); } return say(me, `¡${X(0, 1)} se transformó en ${t ? esSp(t.species) : "otro Pokémon"}!`); }
    case "-notarget": return say(me, "¡Pero no había objetivo!", 0.7);
    case "-nothing": return say(me, "¡Pero no pasó nada!", 0.7);
    case "-message": return;
    case "-intro": return say(me, args[0], 1.4);
    case "win": { me.over = true; const won = args[0] === "Tú";
      if (me.trainer) {
        if (won) { await say(me, `¡Has derrotado a ${me.trainer.n}!`, 1.2); if (me.trainer.medal) await say(me, `¡Has obtenido la ${me.trainer.medal}!`, 1.4); retoWin(me.trainer.id); }
        else await say(me, `${me.trainer.n} te ha derrotado… ¡Ajusta tu equipo e inténtalo otra vez!`, 1.2);
      } else await say(me, won ? "¡Has ganado la batalla!" : "Has perdido la batalla…", 1.2);
      showEnd(me, won); return; }
    case "tie": { me.over = true; await say(me, "¡La batalla terminó en empate!"); showEnd(me, null); return; }
    case "error": { await say(me, "Esa acción no es válida: " + (args[0] || "").replace(/^\[.*?\]\s*/, "")); if (!me.req && me.lastReq) { me.req = me.lastReq; me.shown = false; } return; }
    default: return;
  }
}

/* ---------- controles del jugador ---------- */
function showControls(me) {
  const r = me.req, ctl = $("ctl"); if (!ctl || !r) return;
  if (r.teamPreview) return showPreview(me);
  const party = r.side.pokemon;
  if (r.forceSwitch) { $("tb").textContent = "¿Qué Pokémon vas a sacar?"; ctl.innerHTML = partyHTML(me, party, true); return; }
  if (!r.active) return;
  const a = r.active[0], cur = party.find(p => p.active);
  const foe = me.mons[me.act.p2]; const foeTypes = foe ? (foe.tera ? [foe.tera] : Dex.species.get(foe.species).types) : [];
  const myTypes = cur ? Dex.species.get(cur.details.split(",")[0]).types : [];
  $("tb").textContent = `¿Qué debería hacer ${esSp(cur ? cur.details.split(",")[0] : "")}?`;
  const isDmax = a.maxMoves && !a.canDynamax, showMax = isDmax || (a.canDynamax && me.choice.dmax);
  const moves = a.moves.map((m0, i) => {
    const mx = showMax && a.maxMoves && a.maxMoves.maxMoves[i]; const m = mx ? Object.assign({}, m0, {id: mx.move, disabled: m0.disabled || mx.disabled}) : m0;
    const mv = Dex.moves.get(m.id); const t = TY[toID(mv.type).toUpperCase()] || TY.NORMAL;
    let eff = "";
    if (mv.category !== "Status" && foeTypes.length) { const x = typeMult(mv.type, foeTypes); eff = x === 0 ? "No afecta" : x > 1 ? "Muy eficaz" : x < 1 ? "Poco eficaz" : "Eficaz"; }
    return `<button class="mv" data-move="${i + 1}" style="--c:${t[1]};--ct:${t[2]}" ${m.disabled || m.pp === 0 ? "disabled" : ""} title="${esc(esMoveDesc(m.id))}"><span class="minfo" data-info="${esc(m.id)}" role="button" aria-label="Ver efecto">i</span><span class="mvh"><b>${esc(esMove(m.id))}</b><span class="pp">${m.pp ?? "—"}/${m.maxpp ?? "—"}</span></span><small><span>${t[0]} · <span class="cat">${catTxt(mv)}</span></span>${myTypes.includes(mv.type) && mv.category !== "Status" ? "<span>STAB</span>" : ""}</small><small><span>${mv.category !== "Status" ? "Pot. " + (mv.basePower || "—") + " · " : ""}Prec. ${accTxt(mv)}</span></small>${eff ? `<small><span class="eff">${eff}</span></small>` : ""}${ST.showFx ? `<span class="fx">${esc(esMoveDesc(m.id))}</span>` : ""}</button>`;
  }).join("");
  const tera = a.canTerastallize, mega = a.canMegaEvo, dmax = a.canDynamax;
  const tt = tera ? TY[toID(tera).toUpperCase()] || TY.NORMAL : null;
  ctl.innerHTML = `<div class="moves">${moves}</div>
    <div class="act">
      ${tera ? `<button class="btn toggle" data-tog="tera" aria-pressed="${me.choice.tera}" style="--c:${tt[1]}">Teracristalizar (${tt[0]})</button>` : ""}
      ${mega ? `<button class="btn toggle" data-tog="mega" aria-pressed="${me.choice.mega}" style="--c:#7A4FCF">Megaevolucionar</button>` : ""}
      ${dmax ? `<button class="btn toggle" data-tog="dmax" aria-pressed="${!!me.choice.dmax}" style="--c:#D6264F">${a.maxMoves && a.maxMoves.gigantamax ? "Gigamax" : "Dinamax"}</button>` : ""}
      <button class="btn toggle" data-act="fx" aria-pressed="${!!ST.showFx}">Efectos</button>
      <button class="btn" data-act="party" ${a.trapped ? "disabled" : ""}>Pokémon</button>
      <button class="btn warn" data-act="forfeit">Rendirse</button>
    </div>
    ${ST.showFx && cur ? `<div class="card fxcard"><p><b>${esc(esAb(cur.ability || cur.baseAbility))}</b> (habilidad): ${esc(esAbDesc(cur.ability || cur.baseAbility))}</p>${cur.item ? `<p><b>${esc(esItem(cur.item))}</b> (objeto): ${esc(esItemDesc(cur.item))}</p>` : ""}</div>` : ""}
    <div id="partyBox" hidden style="margin-top:10px">${partyHTML(me, party, false)}</div>`;
}
function moveInfo(id) {
  const mv = Dex.moves.get(id), t = TY[toID(mv.type).toUpperCase()] || TY.NORMAL;
  const rows = [["Tipo", tchip(mv.type)], ["Categoría", catTxt(mv)], ["Potencia", mv.category === "Status" ? "—" : (mv.basePower || "Variable")], ["Precisión", accTxt(mv)], ["PP", mv.pp || "—"]];
  if (mv.priority) rows.push(["Prioridad", (mv.priority > 0 ? "+" : "") + mv.priority]);
  if (mv.flags && mv.flags.contact) rows.push(["Contacto", "Sí"]);
  let el = $("minfo"); if (!el) { el = document.createElement("div"); el.id = "minfo"; document.body.appendChild(el); }
  el.innerHTML = `<div class="mbox" role="dialog" aria-modal="true" style="--c:${t[1]}"><h3>${esc(esMove(id))}</h3>
    <div class="mrows">${rows.map(([k, v]) => `<span>${k}</span><b>${v}</b>`).join("")}</div>
    <p>${esc(esMoveDesc(id)) || "Sin descripción."}</p><button class="btn pri" data-closeinfo>Cerrar</button></div>`;
  el.hidden = false;
}
function partyHTML(me, party, forced) {
  return `<div class="party">${party.map((p, i) => { const sp = p.details.split(",")[0], hp = parseHP(p.condition), pct = hp.max ? hp.hp / hp.max * 100 : 0;
    const dis = p.active || hp.hp <= 0;
    const types = p.terastallized ? [p.terastallized] : Dex.species.get(sp).types;
    const mvs = (p.moves || []).map(id => { const mv = Dex.moves.get(id), x = TY[toID(mv.type).toUpperCase()] || TY.NORMAL; return `<span class="pmv" data-info="${esc(id)}" style="--c:${x[1]};--ct:${x[2]}" title="${esc(esType(mv.type) + (mv.category !== "Status" ? " · Pot. " + (mv.basePower || "—") : " · Estado") + " · Prec. " + accTxt(mv) + ". " + esMoveDesc(id))}">${esc(esMove(id))}</span>`; }).join("");
    return `<button class="pm ${p.active ? "active" : ""}" data-switch="${i + 1}" ${dis ? "disabled" : ""}><img src="${esc(img(sp))}" alt=""><span><b>${esc(esSp(sp))}</b><span class="pmt">${types.map(tchip).join("")}${p.terastallized ? '<span class="tp" style="--c:var(--surface2);--ct:var(--ink2)">Tera</span>' : ""}</span><span class="hpt" style="display:block;margin:3px 0"><span class="hpf ${pct <= 20 ? "low" : pct <= 50 ? "mid" : ""}" style="width:${pct}%;display:block"></span></span><small>${hp.hp <= 0 ? "Debilitado" : `${hp.hp}/${hp.max}`}${hp.status ? " · " + hp.status.toUpperCase() : ""}${p.active ? " · En combate" : ""}</small></span>${mvs ? `<span class="pmvs">${mvs}</span>` : ""}</button>`; }).join("")}</div>
    ${forced ? "" : '<p class="note">Cambiar de Pokémon usa tu turno.</p>'}`;
}
function showPreview(me) {
  const ctl = $("ctl"); const mine = me.t1, foes = me.preview ? me.preview.p2 : me.t2.map(s => s.species);
  $("tb").textContent = "Elige al Pokémon que saldrá primero.";
  ctl.innerHTML = `<div class="card"><div class="preview">
    <div><h3>Tu equipo</h3><div class="teamstrip">${mine.map((s, i) => `<button class="pick" data-lead="${i + 1}" title="${esc(esSp(s.species))}"><img src="${esc(img(s.species))}" alt="${esc(esSp(s.species))}"></button>`).join("")}</div></div>
    <div><h3>Rival</h3>${strip(foes.map(s => ({species: s})))}</div></div>
    <p class="note">Toca a tu Pokémon inicial.</p></div>`;
}
function choose(me, choice) { me.lastReq = me.req; me.req = null; me.shown = false; $("ctl").innerHTML = ""; me.s.p1.write(choice); }
function showEnd(me, won) {
  const ctl = $("ctl"); if (!ctl) return;
  if (me.trainer) { ctl.innerHTML = `<div class="card"><p class="result">${won ? "¡Victoria!" : "Derrota"}</p>
    <div class="btns" style="justify-content:center">${won ? "" : `<button class="btn pri" data-act="rematch">Reintentar</button>`}<button class="btn ${won ? "pri" : ""}" data-act="reto">Volver al desafío</button><button class="btn" data-act="team">Ajustar mi equipo</button></div></div>`; return; }
  ctl.innerHTML = `<div class="card"><p class="result">${won === null ? "Empate" : won ? "¡Victoria!" : "Derrota"}</p>
    <div class="btns" style="justify-content:center"><button class="btn pri" data-act="rematch">Revancha (mismos equipos)</button><button class="btn" data-act="again">Otra batalla</button><button class="btn" data-act="menu">Menú</button></div></div>`;
}

/* ---------- CPU ---------- */
function aiLoop(me) {
  const seen = {p1: null}; let myTera = false;
  (async () => {
    for await (const c of me.s.p2) {
      if (me.dead) return;
      for (const ln of c.split("\n")) {
        const a = ln.slice(1).split("|");
        if ((a[0] === "switch" || a[0] === "drag" || a[0] === "detailschange") && a[1]?.startsWith("p1")) seen.p1 = {species: a[2].split(",")[0], tera: seen.p1?.tera && a[0] === "detailschange" ? seen.p1.tera : ""};
        if (a[0] === "-terastallize" && a[1]?.startsWith("p1") && seen.p1) seen.p1.tera = a[2];
        if (a[0] === "-terastallize" && a[1]?.startsWith("p2")) myTera = true;
      }
      if (!c.startsWith("|request|")) continue;
      const r = JSON.parse(c.slice(9)); if (r.wait) continue;
      await sleep(10);
      me.s.p2.write(aiDecide(r, seen.p1, myTera, me.aiDiff, !!me.trainer));
    }
  })();
}
function monScore(speciesName, foe) {
  const sp = Dex.species.get(speciesName); if (!foe) return 1;
  const ft = foe.tera ? [foe.tera] : Dex.species.get(foe.species).types;
  const off = Math.max(...sp.types.map(t => typeMult(t, ft)));
  const def = Math.max(...Dex.species.get(foe.species).types.map(t => typeMult(t, sp.types)));
  return off / Math.max(0.25, def);
}
function aiDecide(r, foe, usedTera, forced, aceOnly) {
  const diff = forced || ST.diff;
  if (r.teamPreview) return "team " + r.side.pokemon.map((_, i) => i + 1).join("");
  const party = r.side.pokemon;
  const alive = party.map((p, i) => ({p, i})).filter(x => !x.p.active && parseHP(x.p.condition).hp > 0);
  if (r.forceSwitch) {
    if (!alive.length) return "pass";
    if (diff === "easy") return "switch " + (alive[Math.floor(Math.random() * alive.length)].i + 1);
    alive.sort((x, y) => monScore(y.p.details.split(",")[0], foe) - monScore(x.p.details.split(",")[0], foe));
    return "switch " + (alive[0].i + 1);
  }
  const a = r.active[0], cur = party.find(p => p.active);
  const my = Dex.species.get(cur.details.split(",")[0]);
  const myTypes = cur.terastallized ? [cur.terastallized] : my.types;
  const ft = foe ? (foe.tera ? [foe.tera] : Dex.species.get(foe.species).types) : [];
  const stats = cur.stats || {atk: 100, spa: 100};
  const hp = parseHP(cur.condition), hpPct = hp.max ? hp.hp / hp.max : 1;
  const opts = a.moves.map((m, i) => ({m, i})).filter(x => !x.m.disabled && x.m.pp !== 0);
  if (!opts.length) return "move 1";
  const score = ({m}) => {
    const mv = Dex.moves.get(m.id);
    if (diff === "easy") return Math.random();
    if (mv.category === "Status") {
      let s = 25;
      if (mv.status && foe && !foe.status) s = 55;
      if (mv.boosts || mv.self?.boosts) s = hpPct > 0.7 ? 60 : 10;
      if (mv.heal || mv.id === "recover" || mv.id === "roost") s = hpPct < 0.5 ? 120 : 5;
      if (["protect", "detect"].includes(mv.id)) s = 15;
      if (["stealthrock", "spikes", "toxicspikes"].includes(mv.id)) s = 45;
      return s * (0.8 + Math.random() * 0.4);
    }
    const bp = mv.basePower || 60, acc = mv.accuracy === true ? 1 : mv.accuracy / 100;
    const eff = typeMult(mv.type, ft), stab = myTypes.includes(mv.type) || my.types.includes(mv.type) ? 1.5 : 1;
    const st = mv.category === "Physical" ? stats.atk : stats.spa;
    let s = bp * eff * stab * acc * (st / 100) * (mv.priority > 0 && foe ? 1.1 : 1);
    if (mv.multihit) s *= Array.isArray(mv.multihit) ? 3 : mv.multihit;
    return s * (diff === "hard" ? 1 : 0.85 + Math.random() * 0.3);
  };
  opts.forEach(o => o.s = score(o)); opts.sort((x, y) => y.s - x.s);
  const best = opts[0];
  if (diff === "hard" && foe && !a.trapped && alive.length) {
    const bestEff = best.s, cands = alive.map(x => ({x, sc: monScore(x.p.details.split(",")[0], foe)})).sort((p, q) => q.sc - p.sc);
    if (bestEff < 45 && monScore(cur.details.split(",")[0], foe) < 0.6 && cands[0].sc >= 2 && Math.random() < 0.7) return "switch " + (cands[0].x.i + 1);
  }
  let ch = "move " + (best.i + 1);
  if (a.canMegaEvo) ch += " mega";
  else if (a.canDynamax && diff !== "easy" && (aceOnly ? !alive.length : (hpPct > 0.6 && (alive.length <= 1 || Math.random() < 0.25)))) ch += " dynamax";
  else if (a.canTerastallize && !usedTera && diff !== "easy" && !(aceOnly && alive.length)) {
    const mv = Dex.moves.get(best.m.id);
    if (toID(mv.type) === toID(a.canTerastallize) || (hpPct < 0.5 && Math.random() < 0.5)) ch += " terastallize";
  }
  return ch;
}

/* ---------- equipos para la batalla ---------- */
function randomTeam(level) {
  const t = Teams.generate("gen9randombattle");
  t.forEach(s => { if (level) s.level = level; });
  return t;
}
function cleanSet(s) { return Object.assign({}, s, {moves: (s.moves || []).filter(Boolean)}); }
function startQuick() { const L = ST.lvl === "rand" ? 0 : +ST.lvl; newBattle(randomTeam(L), randomTeam(L)); }
function startMine() {
  const mine = team().sets.map(cleanSet).filter(s => s.moves.length);
  if (!mine.length) { alert("Tu equipo necesita al menos un Pokémon con movimientos."); return; }
  const lv = Math.round(mine.reduce((a, s) => a + (s.level || 50), 0) / mine.length);
  newBattle(mine, randomTeam(ST.lvl === "rand" ? lv : +ST.lvl || lv)); B.fromMine = true;
}

/* ---------- modo desafío ---------- */
const iconBadge = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/></svg>';
let RSEL = null;
if (!ST.reto) ST.reto = {beaten: []};
const retoCount = () => RETO.trainers.filter(x => ST.reto.beaten.includes(x.id)).length;
function retoUnlocked(i) {
  return true;
  const T = RETO.trainers, tr = T[i];
  if (i === 0) return true;
  const gyms = T.filter(x => x.medal), beaten = id => ST.reto.beaten.includes(id);
  if (tr.medal) return beaten(T[i - 1].id);
  if (tr.r.startsWith("Alto Mando")) return gyms.every(x => beaten(x.id)) && (T[i - 1].medal || beaten(T[i - 1].id));
  return beaten(T[i - 1].id);
}
function retoWin(id) { if (!ST.reto.beaten.includes(id)) ST.reto.beaten.push(id); save(); }
function retoAi(i) { const tr = RETO.trainers[i]; if (tr.medal) return i < 4 ? "normal" : "hard"; return "hard"; }
function retoLevel() { return ST.lvl === "100" ? 100 : 50; }
function pickSet(species, level) {
  const d = RETO.sets[Dex.species.get(species).name]; const sp = Dex.species.get(species);
  if (!d || !d.sets.length) { const s = blankSet(sp.name); s.level = level; return s; }
  const rs = d.sets[Math.floor(Math.random() * d.sets.length)];
  const moves = [];
  for (const slot of rs.moves) { const opts = shuffle(slot.filter(m => !moves.includes(m))); if (opts.length) moves.push(opts[0]); }
  return {name: "", species: sp.name, item: rs.items[Math.floor(Math.random() * rs.items.length)] || "", ability: rs.ability, moves: moves.slice(0, 4),
    nature: rs.natures[0] || "Serious", evs: Object.assign({hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0}, rs.evs), ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31}, level, gender: "", teraType: sp.types[0], _role: rs.role};
}
function startReto(id) {
  const i = RETO.trainers.findIndex(x => x.id === id), tr = RETO.trainers[i];
  if (!tr || !retoUnlocked(i)) return;
  const mine = team().sets.map(cleanSet).filter(s => s.moves.length);
  if (!mine.length) { alert("Primero arma tu equipo (botón “Armar mi equipo”)."); return; }
  const L = retoLevel();
  const foe = tr.team.map(sp => pickSet(sp, L));
  const MEGA = {brock: ["Aerodactyl", "aerodactylite"], misty: ["Starmie", "starminite"], erika: ["Victreebel", "victreebelite"], sabrina: ["Alakazam", "alakazite"],
    blaine: ["Houndoom", "houndoominite"], agatha: ["Gengar", "gengarite"], lance: ["Salamence", "salamencite"], blue: ["Pidgeot", "pidgeotite"], red: ["Charizard", "charizarditex"]}[tr.id];
  if (MEGA && Dex.items.get(MEGA[1]).exists) { const s = foe.find(x => x.species === MEGA[0]); if (s) { s.item = MEGA[1]; const ms = Dex.items.get(MEGA[1]).megaStone; const fn = typeof ms === "object" ? Object.values(ms)[0] : ms; if (fn) { const d = RGEN.randomMegaSets && RGEN.randomMegaSets[toID(fn)]; if (d && d.sets.length) { const rs = d.sets[0]; s.moves = shuffle(rs.movepool.map(toID)).slice(0, 4); } } foe.push(foe.splice(foe.indexOf(s), 1)[0]); } }
  newBattle(mine.map(s => Object.assign({}, s, {level: L})), foe, {trainer: tr, aiDiff: retoAi(i)});
}
function renderReto() {
  const T = RETO.trainers; if (!RSEL) RSEL = (T.find((x, i) => retoUnlocked(i) && !ST.reto.beaten.includes(x.id)) || T[0]).id;
  const i = T.findIndex(x => x.id === RSEL), tr = T[i], open = retoUnlocked(i), done = ST.reto.beaten.includes(tr.id);
  const ty = TY[tr.t] || TY.NORMAL, mine = team().sets;
  const badge = (x, j) => { const c = TY[x.t] || TY.NORMAL, ok = ST.reto.beaten.includes(x.id), un = retoUnlocked(j);
    return `<button class="rt ${x.id === RSEL ? "sel" : ""} ${ok ? "ok" : ""}" data-reto="${x.id}" ${un ? "" : 'aria-disabled="true"'} style="--c:${c[1]}">
      <span class="rtb">${un ? `<img src="${esc(img(x.team[x.team.length - 1]))}" alt="" loading="lazy">` : '<span class="lock">🔒</span>'}</span>
      <b>${esc(x.n)}</b><small>${ok ? "✓ Superado" : un ? esc(x.r.split(" · ")[0]) : "Bloqueado"}</small></button>`; };
  const sets = tr.team.map(sp => { const d = RETO.sets[Dex.species.get(sp).name]; const r = d && d.sets[0];
    return `<div class="rs"><img src="${esc(img(sp))}" alt="" loading="lazy"><span><b>${esc(esSp(sp))}</b> <span style="display:inline-flex;gap:3px">${Dex.species.get(sp).types.map(tchip).join("")}</span>
      <small>${d ? `${d.sets.length} estrategia${d.sets.length > 1 ? "s" : ""} posibles${r ? " · p. ej. “" + esc(r.role) + "”" : ""}` : ""}</small></span></div>`; }).join("");
  $("app").innerHTML = `<div class="top"><button class="back" data-act="menu">‹ Menú</button><h1>Desafío Kanto</h1><span class="lv" style="font-family:var(--mono);font-size:12px;color:var(--ink3)">${retoCount()}/${T.length}</span></div>
  <div class="stack">
    <div class="card"><h3>Medallas</h3><div class="medals">${T.filter(x => x.medal).map(x => { const c = TY[x.t]; const ok = ST.reto.beaten.includes(x.id); return `<span class="medal ${ok ? "ok" : ""}" title="${esc(x.medal)}" style="--c:${c[1]}">${ok ? "★" : ""}</span>`; }).join("")}</div></div>
    <div class="rts">${T.map(badge).join("")}</div>
    <div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><h3 style="margin:0">${esc(tr.n)}</h3>${tchip(tr.t)}</div>
      <p class="note" style="margin:2px 0 10px">${esc(tr.r)}${tr.medal ? " · " + esc(tr.medal) : ""} · Nivel ${retoLevel()} · CPU ${retoAi(i) === "hard" ? "difícil" : "normal"}</p>
      <div class="rsl">${sets}</div>
      <p class="note">Cada Pokémon usa al azar uno de sus sets competitivos (movimientos, objeto, naturaleza y EVs) de la EstrategiaDEX de <a href="https://pokemaster.es/estrategiadex/" target="_blank" rel="noopener">Pokémaster</a>, así que cada combate puede ser distinto.</p>
      <div class="btns" style="margin-top:10px">${open ? `<button class="btn pri" data-fight="${tr.id}" ${mine.length ? "" : "disabled"}>${done ? "Volver a combatir" : "¡Desafiar!"}</button>` : `<span class="note">Vence al entrenador anterior para desbloquearlo.</span>`}
        <button class="btn" data-act="team">Mi equipo (${mine.length})</button></div>
      ${mine.length ? "" : '<p class="note">Necesitas armar tu equipo antes de desafiar.</p>'}
    </div>
    <div class="btns"><button class="btn warn" data-act="resetreto">Reiniciar progreso</button></div>
  </div>`;
}

/* ---------- eventos ---------- */
document.addEventListener("click", async e => {
  const inf = e.target.closest("[data-info]"); if (inf) { e.preventDefault(); e.stopPropagation(); return moveInfo(inf.dataset.info); }
  if (e.target.closest("[data-closeinfo]") || e.target.id === "minfo") { $("minfo").hidden = true; return; }
  const tb = e.target.closest("#tb"); if (tb) { skipWait && skipWait(); return; }
  const t = e.target.closest("button"); if (!t) return;
  const segEl = t.closest("[data-seg]");
  if (segEl) { ST[segEl.dataset.seg] = t.dataset.v; save(); segEl.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b === t)); return; }
  const act = t.dataset.act;
  if (act === "quick") return startQuick();
  if (act === "mine") return startMine();
  if (act === "team") { if (B) { B.dead = true; B = null; } SEL = 0; return go("team"); }
  if (act === "menu") { if (B) B.dead = true; B = null; return go("menu"); }
  if (act === "quit") { if (B && !B.over && !confirmQuit()) return; if (B) B.dead = true; B = null; return go("menu"); }
  if (act === "again") return B && B.fromMine ? startMine() : startQuick();
  if (act === "rematch" && B) { const tr = B.trainer; if (tr) return startReto(tr.id); return newBattle(B.t1, B.t2); }
  if (act === "reto") { if (B) B.dead = true; B = null; return go("reto"); }
  if (t.dataset.reto) { RSEL = t.dataset.reto; return renderReto(); }
  if (t.dataset.fight) return startReto(t.dataset.fight);
  if (act === "resetreto") { if (!confirm("¿Borrar tu progreso del desafío (medallas)?")) return; ST.reto = {beaten: []}; save(); return renderReto(); }
  if (act === "forfeit" && B) { if (!confirm("¿Seguro que quieres rendirte?")) return; B.s.omniscient.write(">forcelose p1"); $("ctl").innerHTML = ""; return; }
  if (act === "fx") { ST.showFx = !ST.showFx; save(); if (B && B.req) showControls(B); return; }
  if (act === "party") { const p = $("partyBox"); if (p) p.hidden = !p.hidden; return; }
  if (t.dataset.tog && B) { const k = t.dataset.tog, on = !B.choice[k]; B.choice = {tera: false, mega: false, dmax: false}; B.choice[k] = on; if (B.req) { B.shown = true; showControls(B); } return; }
  if (t.dataset.move && B) { let c = "move " + t.dataset.move; if (B.choice.mega) c += " mega"; else if (B.choice.tera) c += " terastallize"; else if (B.choice.dmax) c += " dynamax"; B.choice = {tera: false, mega: false, dmax: false}; return choose(B, c); }
  if (t.dataset.switch && B) return choose(B, "switch " + t.dataset.switch);
  if (t.dataset.lead && B) { const n = +t.dataset.lead, order = [n, ...B.t1.map((_, i) => i + 1).filter(i => i !== n)]; return choose(B, "team " + order.join("")); }
  // editor de equipo
  if (act === "newteam") { ST.teams.push({name: "Equipo " + (ST.teams.length + 1), sets: []}); ST.cur = ST.teams.length - 1; SEL = 0; save(); return renderTeam(); }
  if (act === "delteam") { if (!confirm(`¿Borrar “${team().name}”?`)) return; ST.teams.splice(ST.cur, 1); ST.cur = 0; SEL = 0; save(); return renderTeam(); }
  if (act === "io") { $("io").hidden = !$("io").hidden; return; }
  if (act === "export") { $("ioText").value = Teams.export(team().sets.map(cleanSet)); $("ioText").select(); return; }
  if (act === "import") {
    try { const sets = Teams.import($("ioText").value); if (!sets || !sets.length) throw 0;
      team().sets = sets.slice(0, 6).map(s => Object.assign(blankSet(s.species), s, {evs: Object.assign({hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0}, s.evs), ivs: Object.assign({hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31}, s.ivs), level: s.level || 50, moves: s.moves.map(toID), item: toID(s.item)}));
      SEL = 0; save(); return renderTeam(); } catch (err) { alert("No pude leer ese texto. Debe estar en formato Pokémon Showdown."); return; }
  }
  if (t.dataset.slot != null) { SEL = +t.dataset.slot; return renderTeam(); }
  if (act === "remove") { team().sets.splice(SEL, 1); SEL = Math.max(0, SEL - 1); save(); return renderTeam(); }
  if (act === "suggest") { const s = team().sets[SEL]; if (s) { const it = Dex.items.get(s.item); const ms = it.megaStone ? (typeof it.megaStone === "object" ? Object.values(it.megaStone)[0] : it.megaStone) : undefined; await autoMoves(s, ms); save(); return renderTeam(); } }
});
function confirmQuit() { return confirm("¿Salir de la batalla? Se perderá el progreso."); }

document.addEventListener("change", async e => {
  const el = e.target, t = team(), s = t.sets[SEL];
  if (el.id === "teamSel") { ST.cur = +el.value; SEL = 0; save(); return renderTeam(); }
  if (el.id === "teamName") { t.name = el.value.trim() || "Mi equipo"; save(); return; }
  if (el.id === "spIn") {
    const sp = BY_ES[el.value.trim().toLowerCase()]; if (!sp) { el.setCustomValidity("Elige un Pokémon de la lista"); el.reportValidity(); return; }
    const set = blankSet(sp); set.level = ST.lvl === "100" ? 100 : 50; await autoMoves(set);
    t.sets.push(set); SEL = t.sets.length - 1; save(); return renderTeam();
  }
  if (!s) return;
  if (el.id === "f-level") s.level = Math.max(1, Math.min(100, +el.value || 50));
  else if (el.id === "f-tera") s.teraType = el.value;
  else if (el.id === "f-ability") s.ability = el.value;
  else if (el.id === "f-item") s.item = el.value;
  else if (el.id === "f-gmax") s.gigantamax = el.checked;
  else if (el.id === "f-nature") s.nature = el.value;
  else if (el.dataset.move != null) s.moves[+el.dataset.move] = el.value;
  else if (el.dataset.iv) s.ivs[el.dataset.iv] = Math.max(0, Math.min(31, +el.value || 0));
  else if (el.dataset.evn) s.evs[el.dataset.evn] = Math.max(0, Math.min(252, Math.floor((+el.value || 0) / 4) * 4));
  else return;
  save();
  if (["f-level", "f-nature", "f-ability", "f-item"].includes(el.id) || el.dataset.iv || el.dataset.evn || el.dataset.move != null) return renderTeam();
});
document.addEventListener("input", e => {
  const el = e.target; if (!el.dataset.ev) return;
  const s = team().sets[SEL]; if (!s) return;
  const k = el.dataset.ev, others = SK.reduce((a, x) => a + (x === k ? 0 : s.evs[x] || 0), 0);
  s.evs[k] = Math.min(+el.value, Math.max(0, 510 - others) - (Math.max(0, 510 - others) % 4)); el.value = s.evs[k];
  const n = document.querySelector(`[data-evn="${k}"]`); if (n) n.value = s.evs[k];
  const st = $("st-" + k); if (st) st.textContent = calcStat(Dex.species.get(s.species), s, k);
  const tot = SK.reduce((a, x) => a + (s.evs[x] || 0), 0); const lbl = $("evtot"); if (lbl) lbl.textContent = `EVs usados: ${tot} / 510`;
  save();
});

/* ---------- inicio ---------- */
(async () => {
  const add = new URLSearchParams(location.search).get("add");
  if (add) {
    const p = MD[add.toUpperCase()]; const sp = p && Dex.species.get(p.c.toLowerCase());
    const name = sp && sp.exists ? (sp.battleOnly ? (Array.isArray(sp.battleOnly) ? sp.battleOnly[0] : sp.battleOnly) : sp.name) : null;
    if (name) {
      const t = team();
      if (t.sets.length >= 6) { alert("Tu equipo ya tiene 6 Pokémon. Quita uno para agregar otro."); }
      else { const set = blankSet(name);
        if (sp.battleOnly && sp.requiredItem) { set.item = toID(sp.requiredItem); await autoMoves(set, sp.name); } else await autoMoves(set);
        t.sets.push(set); SEL = t.sets.length - 1; save(); history.replaceState(null, "", location.pathname); return go("team"); }
    }
    history.replaceState(null, "", location.pathname);
  }
  render();
})();
