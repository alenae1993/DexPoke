"use strict";
/* ---------- Leyendas de Sinnoh: mapa, turnos y encuentros salvajes ---------- */
if (!ST.sin) { ST.sin = {cam: null}; save(); }
const SIN_VILLAGES = [
  {village: "Sinnome Village", name: "Pueblo Sinnome", color: "Pink", starters: ["Togepi", "Budew"]},
  {village: "Sunyshore Village", name: "Pueblo Marina", color: "Yellow", starters: ["Shinx", "Pichu"]},
  {village: "Eterna Village", name: "Ciudad Vetusta", color: "Purple", starters: ["Duskull", "Litwick"]},
  {village: "Nesburgh Village", name: "Pueblo Nesburgh", color: "Orange", starters: ["Starly", "Machop"]},
  {village: "Stark Village", name: "Pueblo Stark", color: "Red", starters: ["Chimchar", "Cyndaquil"]},
  {village: "Snowpoint Village", name: "Ciudad Puntaneva", color: "White", starters: ["Swinub", "Spheal"]},
  {village: "Celestic Village", name: "Pueblo Caelestis", color: "Green", starters: ["Turtwig", "Rowlet"]},
  {village: "Canalave Village", name: "Ciudad Canal", color: "Blue", starters: ["Piplup", "Oshawott"]}
];
const SIN_PLAYER_COLORS = {Pink: "#dc71ac", Yellow: "#e6bf36", Purple: "#9565cf", Teal: "#2dada8", Orange: "#db8532", Red: "#d95252", White: "#dce5ec", Green: "#459c65", Blue: "#447fd2"};
const SIN_CARDS = SIN.decks.flatMap(d => d.cards);
const sinMoveName = name => String(name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
const SIN_CARD_MOVES = new Map(Dex.moves.all().filter(m => m.exists).map(m => [sinMoveName(esMove(m.id)), m.id]));
const sinSignatureMove = card => SIN_CARD_MOVES.get(sinMoveName(card?.d?.move_name)) || null;
const sinTeamSlots = run => run.campaign === "ultra" ? 6 : Math.min(6, 3 + (run.frag || 0));
const SIN_PV = {W: 1, M: 2, S: 3, L: 4};
const SIN_FLEE_BONGURI = {W: 2, M: 1, S: 0};
const SIN_WILD_LEVELS = {W: [3, 6], M: [8, 12], S: [15, 20]};
const SIN_OFFER_COUNT = {W: 3, M: 2, S: 1};
const SIN_STATUS = {par: "PAR", brn: "QUE", psn: "ENV", tox: "ENV", slp: "DOR", frz: "CON"};
const SIN_BONGURI = {
  red: ["Rojo", "Rojos", "#df5555"], yellow: ["Amarillo", "Amarillos", "#e6bf36"],
  blue: ["Azul", "Azules", "#5793ed"], pink: ["Rosa", "Rosas", "#dc71ac"],
  green: ["Verde", "Verdes", "#65bd83"], white: ["Blanco", "Blancos", "#edf2f7"], black: ["Negro", "Negros", "#363b48"]
};
const SIN_BALLS = {
  poke: {name: "Poké Ball", bonus: 1, recipe: {red: 1}},
  great: {name: "Super Ball", bonus: 1.5, recipe: {blue: 1, green: 1, red: 1}},
  ultra: {name: "Ultra Ball", bonus: 2, recipe: {black: 1, yellow: 1}}
};
const sinEmptyBag = () => Object.fromEntries(Object.keys(SIN_BONGURI).map(k => [k, 0]));
const sinStartingBalls = () => ({poke: 3, great: 0, ultra: 0});
const SIN_EXP_SHARE = .5;
const SIN_FRIEND_WIN = 1;
const SIN_EV_STATS = {HP: "hp", ATTACK: "atk", DEFENSE: "def", SPECIAL_ATTACK: "spa", SPECIAL_DEFENSE: "spd", SPEED: "spe"};
const SIN_SPECIES = new Map(D.P.map(p => [p.c, p]));
function sinSpeciesData(species) {
  return SIN_SPECIES.get(toID(species).toUpperCase()) || SIN_SPECIES.get(toID(Dex.species.get(species).baseSpecies).toUpperCase());
}
const sinBaseFriendship = species => sinSpeciesData(species)?.hp ?? 70;
const sinFriendLevel = friendship => Math.min(255, friendship + (friendship < 100 ? 5 : friendship < 200 ? 3 : 2));
function sinEvolutionCondition(set, method, param, hour) {
  const day = hour >= 6 && hour < 20, level = set.level >= +param, happy = set.friendship >= 160;
  switch (method) {
    case "Level": return level;
    case "LevelDay": return level && day;
    case "LevelNight": return level && !day;
    case "LevelFemale": return level && set.gender === "F";
    case "LevelMale": return level && set.gender === "M";
    case "Happiness": return happy;
    case "HappinessDay": return happy && day;
    case "HappinessNight": return happy && !day;
    case "HasMove": return set.moves.some(move => toID(move) === toID(param));
    default: return false;
  }
}
function sinEvolution(set, hour) {
  for (const [target, method, param] of sinSpeciesData(set.species)?.ev || []) {
    const sp = Dex.species.get(toID(target));
    if (sp.exists && sinEvolutionCondition(set, method, param, hour)) return sp.name;
  }
  return null;
}
function sinEvolutionAbility(ability, before, after) {
  const slot = ["0", "1", "H"].find(k => before.abilities[k] && toID(before.abilities[k]) === toID(ability));
  return after.abilities[slot] || after.abilities["0"];
}
function sinExpForLevel(gw, n) {
  n = Math.max(1, Math.min(100, Math.floor(n)));
  if (n === 1) return 0;
  const cube = n ** 3;
  switch (gw) {
    case "Fast": return Math.floor(4 * cube / 5);
    case "Parabolic": return Math.max(0, Math.floor(6 * cube / 5) - 15 * n * n + 100 * n - 140);
    case "Slow": return Math.floor(5 * cube / 4);
    case "Erratic": return Math.floor(n <= 50 ? cube * (100 - n) / 50 : n <= 68 ? cube * (150 - n) / 100 :
      n <= 98 ? cube * Math.floor((1911 - 10 * n) / 3) / 500 : cube * (160 - n) / 100);
    case "Fluctuating": return Math.floor(cube * (n <= 15 ? Math.floor((n + 1) / 3) + 24 : n <= 35 ? n + 14 : Math.floor(n / 2) + 32) / 50);
    default: return cube;
  }
}
function sinGender(species) {
  const gr = sinSpeciesData(species)?.gr;
  if (gr === "Genderless") return "N";
  if (gr === "AlwaysMale") return "M";
  if (gr === "AlwaysFemale") return "F";
  const ratios = {FemaleOneEighth: .125, Female25Percent: .25, Female50Percent: .5, Female75Percent: .75, FemaleSevenEighths: .875};
  const sp = Dex.species.get(species);
  return gr in ratios ? (Math.random() < ratios[gr] ? "F" : "M") : sp.gender || (Math.random() < sp.genderRatio.F ? "F" : "M");
}
function sinMigrateTeam(run) {
  if (!run) return;
  let changed = false;
  if (!run.bag) { run.bag = sinEmptyBag(); changed = true; }
  if (!run.balls) { run.balls = sinStartingBalls(); changed = true; }
  if (!run.box) { run.box = []; changed = true; }
  if (run.pv == null) { run.pv = 0; changed = true; }
  const sets = [...run.team, ...run.box, ...(run.battle ? [run.battle.wild] : [])];
  sets.forEach(s => {
    if (s.exp == null) { s.exp = sinExpForLevel(sinSpeciesData(s.species)?.gw, s.level); changed = true; }
    if (!s.gender) { s.gender = sinGender(s.species); changed = true; }
    if (s.friendship == null) { s.friendship = sinBaseFriendship(s.species); changed = true; }
  });
  if (changed) save();
}
sinMigrateTeam(ST.sin.run);
const sinLevelMoves = species => (sinSpeciesData(species)?.lv || []).filter(([n]) => n > 0).slice().sort((a, b) => a[0] - b[0]);
const sinWildExp = (be, lr, lp) => Math.floor(be * lr / 5 * ((2 * lr + 10) / (lr + lp + 10)) ** 2.5) + 1;
function sinGainEVs(set, yieldText) {
  if (!set.evs) set.evs = {};
  let total = Object.values(SIN_EV_STATS).reduce((sum, k) => sum + (set.evs[k] || 0), 0);
  const parts = (yieldText || "").split(",");
  for (let i = 0; i < parts.length; i += 2) {
    const k = SIN_EV_STATS[parts[i].trim()]; if (!k) continue;
    const gain = Math.max(0, Math.min(+parts[i + 1] || 0, 252 - (set.evs[k] || 0), 510 - total));
    set.evs[k] = (set.evs[k] || 0) + gain; total += gain;
  }
}
function sinAdvanceMoves(run) {
  const p = run.progress;
  while (p.pending.length) {
    const q = p.pending[0], s = run.team[q.index];
    if (q.kind === "evolution") {
      // Se comprueba después de aprender los ataques, incluido el necesario para HasMove.
      if (!q.target) q.target = sinEvolution(s, q.hour);
      if (q.target) break;
      p.pending.shift(); continue;
    }
    if (!s.moves.includes(q.move)) {
      if (s.moves.length >= 4) break;
      s.moves.push(q.move); p.rewards[q.index].events.push({move: q.move});
    }
    p.pending.shift();
  }
}
function sinGainExp(run, wild, me) {
  const rival = sinSpeciesData(wild.species);
  const p = run.progress = {won: true, rewards: [], pending: []};
  run.team.forEach((s, index) => {
    const reward = {index, exp: 0, levels: [], events: []}; p.rewards.push(reward);
    if (!sinAlive(s)) return;
    s.friendship = Math.min(255, s.friendship + SIN_FRIEND_WIN);
    const sp = Dex.species.get(s.species), gw = sinSpeciesData(s.species)?.gw, oldMax = calcStat(sp, s, "hp");
    const m = me.mons["p1:Sinnoh" + (index + 1)], participated = m && m.side === "p1";
    const gain = Math.floor(sinWildExp(rival?.be || 0, wild.level, s.level) * (participated ? 1 : SIN_EXP_SHARE));
    const before = s.exp; s.exp = Math.min(sinExpForLevel(gw, 100), s.exp + gain); reward.exp = s.exp - before;
    sinGainEVs(s, rival?.evs);
    const moves = sinLevelMoves(s.species);
    while (s.level < 100 && s.exp >= sinExpForLevel(gw, s.level + 1)) {
      s.level++; reward.levels.push(s.level);
      s.friendship = sinFriendLevel(s.friendship);
      moves.filter(([n]) => n === s.level).forEach(([, move]) => p.pending.push({index, move: toID(move), level: s.level}));
    }
    s.hpMax = calcStat(sp, s, "hp");
    if (s.hpNow != null) s.hpNow = Math.min(s.hpMax, s.hpNow + s.hpMax - oldMax);
  });
  const hour = new Date().getHours();
  p.rewards.filter(r => r.levels.length).forEach(r => p.pending.push({index: r.index, kind: "evolution", hour}));
  sinAdvanceMoves(run);
}
const sinSearchToken = t => !!(SIN_OFFER_COUNT[t.tier] && t.b && t.k && /Apricorn (Tree|Reef)/.test(t.n));
const sinWildCards = t => SIN_CARDS.filter(c => c.d && c.d.sp && c.tier === t.tier && c.b === t.b && c.k === t.k);
const sinAlive = s => s.hpNow == null || s.hpNow > 0;
let SIN_BUSY = false;
const SIN_HOME = SIN.decks.find(d => d.n === "Home Village Cards").cards;
const SIN_STARTERS = SIN_CARDS.filter(c => (c.tags || []).includes("Starter Card"));
const SIN_PROLOGUE = SIN_CARDS.find(c => (c.tags || []).includes("Act Card") && String(c.cid).endsWith("00"));
const sinStarterCard = sp => SIN_STARTERS.find(c => toID(c.d.sp) === toID(sp));
let SIN_NEW = {village: null, species: null, busy: false};
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
  .sin-layout{height:calc(100vh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px));height:calc(100dvh - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px));display:grid;grid-template-rows:auto minmax(0,1fr) auto auto}
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
  .sin-new{height:100vh;height:100dvh;overflow:auto;overscroll-behavior:contain;padding:14px 16px 28px;box-sizing:border-box}
  .sin-new-inner{max-width:850px;margin:auto}
  .sin-new h1{font:600 26px var(--display);margin:14px 0 6px}
  .sin-new h2{font:600 21px var(--display);margin:8px 0 16px}
  .sin-new p{color:var(--ink2)}
  .sin-choices{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
  .sin-choice{font:inherit;color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:8px;cursor:pointer;min-width:0}
  .sin-choice:hover,.sin-choice:focus-visible{border-color:var(--accent);outline:2px solid var(--accent)}
  .sin-choice img{display:block;width:100%;aspect-ratio:4/7;object-fit:contain;background:var(--surface2);border-radius:7px}
  .sin-choice b{display:block;padding:8px 0 2px}
  .sin-starters{max-width:520px;grid-template-columns:repeat(2,minmax(0,1fr));margin:auto}
  .sin-prologue{display:block;width:min(100%,300px);aspect-ratio:4/7;margin:12px auto;object-fit:contain;background:var(--surface2);border-radius:12px}
  .sin-new-actions{display:flex;gap:12px;justify-content:center;margin:18px 0;flex-wrap:wrap}
  .sin-turn{display:flex;align-items:center;gap:8px 16px;flex-wrap:wrap;padding:10px 16px;background:var(--surface);border-top:1px solid var(--line)}
  .sin-turn-info{flex:1;min-width:185px;font-weight:600}
  .sin-team{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:var(--ink2);font-size:13px}
  .sin-team img{width:40px;height:40px;object-fit:contain}
  .sin-member{display:flex;align-items:center;gap:6px;min-width:0}
  .sin-member small{display:block}
  .sin-hp{display:block;width:100%;height:5px;border-radius:4px;background:var(--line);overflow:hidden;margin:3px 0}
  .sin-hp i{display:block;height:100%;background:var(--good,#65bd83)}
  .sin-exp{height:3px;margin-top:5px}
  .sin-exp i{background:#60aeeb}
  .sin-progress{margin:12px 0;padding:10px 12px;border:1px solid var(--line);border-radius:10px}
  .sin-progress p{margin:6px 0}
  .sin-learn .btn{min-height:44px;white-space:normal}
  .sin-evolution{text-align:center}
  .sin-evolution img{display:block;width:160px;max-width:100%;height:160px;object-fit:contain;margin:12px auto;animation:sin-evolve 1s ease-in-out 2}
  @keyframes sin-evolve{50%{opacity:.3;filter:brightness(2)}}
  @media(prefers-reduced-motion:reduce){.sin-evolution img{animation:none}}
  .sin-offer{grid-template-columns:repeat(3,minmax(0,1fr))}
  .sin-offer .sin-choice{cursor:default;text-align:center}
  .sin-offer .btn{margin-top:8px;min-height:44px}
  .sin-notice{flex-basis:100%;margin:0;color:var(--ink2);font-size:13px}
  .sin-turn .btn{min-height:44px}
  .sin-bag{display:flex;gap:8px 16px;flex-wrap:wrap;padding:0;list-style:none}
  .sin-bag li{display:flex;align-items:center;gap:6px}
  .sin-bonguri{width:15px;height:15px;border-radius:50%;border:1px solid var(--ink2);flex-shrink:0}
  .sin-recipes{display:grid;gap:10px}
  .sin-recipe{display:flex;align-items:center;justify-content:space-between;gap:12px}
  .sin-recipe small{display:block;color:var(--ink2)}
  .sin-move{margin-top:10px;min-height:44px}
  @media(max-width:650px){.sin-choices{grid-template-columns:repeat(2,minmax(0,1fr))}.sin-turn{padding:8px 12px;gap:6px 10px}.sin-turn-info{flex-basis:100%}.sin-team{flex:1}.sin-tools{flex-wrap:wrap}.sin-card{max-height:30dvh}}
  @media(max-width:540px){.sin-top{flex-wrap:wrap;gap:8px;padding:8px 12px}.sin-top h1{font-size:19px}.sin-tools{width:100%;justify-content:flex-end}.sin-tools .btn{min-width:44px}.sin-card{padding:10px 12px}.sin-hint{font-size:11px}}
`;
document.head.appendChild(sinStyle);

function sinName(t) {
  const village = SIN_VILLAGES.find(v => v.village === t.n); if (village) return village.name;
  const m = /^(Red|Blue|Yellow|Pink|White|Green|Black) Apricorn (Tree|Stash)$/.exec(t.n);
  if (m) return (m[2] === "Tree" ? "Árbol de Bonguri " : "Alijo de Bonguri ") + SIN_COLORS[m[1]];
  return SIN_NAMES[t.n] || t.n || "Token sin nombre";
}
function sinMeta(t) {
  const tags = t.tags || [], b = t.b || tags.find(s => ["Plains", "Forest", "Mountain", "Ocean", "Ruins", "Space"].includes(s));
  const k = t.k || tags.find(s => ["Cold", "Temperate", "Warm"].includes(s));
  const tier = t.tier || ({"Weak Encounter Card": "W", "Moderate Encounter Card": "M", "Strong Encounter Card": "S", "Legendary Encounter Card": "L", "Distortion Encounter Card": "D"})[tags.find(s => /Encounter Card$/.test(s))];
  return [["Bioma", b], ["Clima", k], ["Encuentro", tier]].filter(([, value]) => value)
    .map(([label, value]) => label + ": " + (SIN_ES[value] || value)).join(" · ");
}
function sinFillImages() {
  document.querySelectorAll("img[data-sin-img]").forEach(el => {
    const im = sinImage(el.dataset.sinImg); if (im && el.getAttribute("src") !== im.src) el.src = im.src;
  });
}
function sinCardImage(key, name, cls = "") {
  return `<img class="${esc(cls)}" data-sin-img="${esc(key)}" alt="${esc(name)}">`;
}
function sinNewScreen() {
  const v = SIN_NEW.village, sp = SIN_NEW.species, step = sp ? 3 : v ? 2 : 1;
  $("app").innerHTML = `<div class="sin-new"><div class="sin-new-inner"><button class="back" data-act="sinback">‹ Batalla</button>
    <h1>Nueva partida</h1><p>Leyendas de Sinnoh · Paso ${step} de 3</p>
    ${step === 1 ? `<h2>Elige tu pueblo natal</h2><div class="sin-choices">${SIN_VILLAGES.map(v => {
      const card = SIN_HOME.find(c => c.gm === v.color);
      return `<button class="sin-choice" data-act="sinvillage" data-village="${esc(v.village)}">${sinCardImage(card.img, "Carta de " + v.name)}<b>${esc(v.name)}</b></button>`;
    }).join("")}</div>` : step === 2 ? `<h2>${esc(v.name)} · Elige tu inicial</h2><div class="sin-choices sin-starters">${v.starters.map(s =>
      `<button class="sin-choice" data-act="sinstarter" data-species="${esc(s)}">${sinCardImage(sinStarterCard(s).img, "Carta de " + esSp(s))}<b>${esc(esSp(s))}</b></button>`).join("")}</div>
      <div class="sin-new-actions"><button class="btn" data-act="sinnewback">Volver a los pueblos</button></div>` :
      `<h2>Prólogo · La Incursión</h2><p>${esc(v.name)} · ${esc(esSp(sp))} · Nivel 5</p>${sinCardImage(SIN_PROLOGUE.img, "Prólogo: La Incursión", "sin-prologue")}
      <div class="sin-new-actions"><button class="btn" data-act="sinnewback">Volver a los iniciales</button><button class="btn primary" data-act="sinbegin">Comenzar</button></div><p id="sin-new-error" role="alert"></p>`}
    </div></div>`;
  sinFillImages();
}
async function sinInitialSet(species, level = 5) {
  const set = blankSet(species);
  let learned = sinLevelMoves(species).filter(([n]) => n <= level).map(([, move]) => toID(move));
  if (!sinSpeciesData(species)) {
    let data = await Dex.learnsets.get(toID(species));
    // Las especies ausentes de data.js conservan el respaldo del motor.
    if (!data.learnset) data = await Dex.learnsets.get(toID(Dex.species.get(species).baseSpecies));
    const levels = Object.entries(data.learnset || {}).flatMap(([move, sources]) => sources.flatMap(source => {
      const m = /^(\d+)L(\d+)$/.exec(source); return m ? [{move: toID(move), gen: +m[1], level: +m[2]}] : [];
    }));
    const gen = Math.max(...levels.map(m => m.gen));
    learned = levels.filter(m => m.gen === gen && m.level > 0 && m.level <= level).sort((a, b) => a.level - b.level).map(m => m.move);
  }
  set.level = level;
  // Se conserva la aparición más reciente de cada ataque antes de tomar los últimos cuatro.
  set.moves = learned.filter((move, i) => learned.lastIndexOf(move) === i).slice(-4);
  Object.keys(set.ivs).forEach(k => { set.ivs[k] = Math.floor(Math.random() * 32); });
  set.exp = sinExpForLevel(sinSpeciesData(species)?.gw, level); set.gender = sinGender(species);
  set.friendship = sinBaseFriendship(species);
  const natures = Dex.natures.all(); set.nature = natures[Math.floor(Math.random() * natures.length)].name;
  return set;
}
async function sinBegin() {
  if (SIN_NEW.busy || !SIN_NEW.village || !SIN_NEW.species || ST.sin.run) return;
  const v = SIN_NEW.village, species = SIN_NEW.species;
  const token = SIN.tokens.find(t => t.n === v.village && (t.tags || []).includes("Village Token"));
  SIN_NEW.busy = true;
  document.querySelectorAll(".sin-new button").forEach(b => { b.disabled = true; });
  try {
    const set = await sinInitialSet(species);
    ST.sin.run = {v: 1, village: v.village, color: v.color, pos: [...token.cell], team: [set], turn: 1, moved: 0, frag: 0,
      bag: sinEmptyBag(), balls: sinStartingBalls(), box: [], pv: 0};
    // La cámara del antiguo visor no se hereda a una partida nueva.
    ST.sin.cam = null; save(); renderSin();
  } catch (err) {
    if ($("sin-new-error")) $("sin-new-error").textContent = "No se pudo preparar el inicial. Intenta comenzar de nuevo.";
  } finally {
    SIN_NEW.busy = false; document.querySelectorAll(".sin-new button").forEach(b => { b.disabled = false; });
  }
}
function sinReachable(pos, remaining) {
  const start = pos.join(","), dist = new Map([[start, 0]]), queue = [SIN_BY_CELL.get(start)];
  if (!queue[0]) return new Map();
  for (let i = 0; i < queue.length; i++) {
    const h = queue[i], cost = dist.get(h.c + "," + h.r); if (cost >= remaining) continue;
    [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 2], [0, -2]].forEach(([dc, dr]) => {
      const key = (h.c + dc) + "," + (h.r + dr), next = SIN_BY_CELL.get(key);
      if (!next || dist.has(key) || Math.abs(next.l - h.l) > 1) return;
      dist.set(key, cost + 1); queue.push(next);
    });
  }
  dist.delete(start); return dist;
}
const sinMaxMoves = run => 3 + run.frag;
function sinTeamHTML(run) {
  return run.team.map(s => {
    const healthy = s.hpNow == null, pct = healthy ? 100 : s.hpMax ? Math.max(0, Math.min(100, s.hpNow / s.hpMax * 100)) : 0;
    const health = !sinAlive(s) ? "Debilitado" : healthy ? "PS completos" : `${s.hpNow}/${s.hpMax} PS`;
    const gw = sinSpeciesData(s.species)?.gw, start = sinExpForLevel(gw, s.level), next = sinExpForLevel(gw, s.level + 1);
    const expPct = s.level >= 100 ? 100 : Math.max(0, Math.min(100, (s.exp - start) / (next - start) * 100));
    const expLabel = s.level >= 100 ? "Nivel máximo" : `${s.exp - start}/${next - start} EXP hacia el nivel ${s.level + 1}`;
    return `<span class="sin-member">${pimg(s.species)}<span>${esc(esSp(s.species))} · Nv. ${esc(s.level)}${s.gender === "M" ? " ♂" : s.gender === "F" ? " ♀" : ""}
      <span class="sin-hp" role="meter" aria-label="PS de ${esc(esSp(s.species))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></span>
      <span class="sin-hp sin-exp" role="meter" aria-label="${esc(expLabel)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${expPct}"><i style="width:${expPct}%"></i></span>
      <small>${esc(health)}${SIN_STATUS[s.status] && sinAlive(s) ? " · " + esc(SIN_STATUS[s.status]) : ""}</small></span></span>`;
  }).join("");
}
function sinUpdateTurn() {
  const run = ST.sin.run; if (!run || !SIN_VIEW) return;
  const max = sinMaxMoves(run), left = run.fought || run.revive ? 0 : Math.max(0, max - run.moved);
  SIN_VIEW.reachable = sinReachable(run.pos, left);
  $("sin-turn").innerHTML = `<div class="sin-turn-info">Turno ${esc(run.turn)} · Movimientos: ${esc(left)}/${esc(max)} · PV: ${esc(run.pv)} · Equipo ${esc(run.team.length)}/${esc(sinTeamSlots(run))}</div>
    <div class="sin-team">${sinTeamHTML(run)}</div>
    <button class="btn" data-act="sinbag">Bolsa</button>
    <button class="btn primary" data-act="sinendturn">Terminar turno</button>
    ${run.notice ? `<p class="sin-notice">${esc(run.notice)}</p>` : ""}`;
  sinFillImages(); if (SIN_VIEW.box) sinShowBox(); else if (SIN_VIEW.bag) sinShowBag(); else if (SIN_VIEW.selected) sinShowCell(SIN_VIEW.selected); sinRequestDraw();
}
const sinCanCraft = (run, key) => !!SIN_BALLS[key] && Object.entries(SIN_BALLS[key].recipe).every(([k, n]) => run.bag[k] >= n);
function sinCraft(key) {
  const run = ST.sin.run;
  if (VIEW !== "sin" || !SIN_VIEW || !run || run.battle || run.progress || !sinCanCraft(run, key)) return;
  Object.entries(SIN_BALLS[key].recipe).forEach(([k, n]) => { run.bag[k] -= n; });
  run.balls[key]++; save(); sinShowBag();
}
function sinShowBag() {
  const run = ST.sin.run; if (!run || !SIN_VIEW) return;
  SIN_VIEW.bag = true; SIN_VIEW.box = false; SIN_VIEW.selected = null;
  $("sin-card").innerHTML = `<div class="sin-card-head"><h2>Bolsa</h2><button class="btn" data-act="sinclose">Cerrar</button></div>
    <ul class="sin-bag">${Object.entries(SIN_BONGURI).map(([k, [name, , color]]) =>
      `<li><span class="sin-bonguri" style="background:${color}" aria-hidden="true"></span>Bonguri ${esc(name)} ×${esc(run.bag[k])}</li>`).join("")}</ul>
    <div class="sin-recipes">${Object.entries(SIN_BALLS).map(([key, ball]) => `<div class="sin-recipe"><span><b>${esc(ball.name)} ×${esc(run.balls[key])}</b>
      <small>${Object.entries(ball.recipe).map(([k, n]) => `${esc(n)} Bonguri ${esc(SIN_BONGURI[k][0])}`).join(" + ")}</small></span>
      <button class="btn" data-act="sincraft" data-ball="${key}" ${sinCanCraft(run, key) ? "" : "disabled"}>Fabricar</button></div>`).join("")}</div>`;
  $("sin-card").hidden = false; sinRequestDraw();
}
function sinBonguriReward(run, token, count = 3) {
  const reward = {}, colors = ["red", "yellow", "blue", "pink", "green", "white"];
  const tree = /^(Red|Yellow|Blue|Pink|Green|White|Black) Apricorn Tree$/.exec(token?.n || "");
  if (!tree && !/Apricorn Reef$/.test(token?.n || "")) return reward;
  for (let i = 0; i < count; i++) {
    const k = tree ? tree[1].toLowerCase() : colors[Math.floor(Math.random() * colors.length)];
    run.bag[k]++; reward[k] = (reward[k] || 0) + 1;
  }
  return reward;
}
function sinEncounterToken(run) {
  const index = run.battle?.token ?? run.offer?.token;
  if (Number.isInteger(index)) return SIN.tokens[index];
  // Las ofertas y los combates antiguos no guardaban el índice del token.
  return SIN.tokens.find(t => sinSearchToken(t) && t.cell.join(",") === run.pos.join(",") && (!run.offer || sinName(t) === run.offer.place));
}
function sinBattleCard(run) {
  const battle = run.battle, token = sinEncounterToken(run);
  return SIN_CARDS.find(c => c.d?.sp && c.img === battle.card && toID(c.d.sp) === toID(battle.wild.species)) ||
    SIN_CARDS.find(c => c.d?.sp && toID(c.d.sp) === toID(battle.wild.species) && c.tier === (battle.tier || token?.tier) &&
      (!token || (c.b === token.b && c.k === token.k)));
}
function sinOnFaint(me) {
  const run = ST.sin.run;
  if (!me.sin || me.over || me.dead || me.sinFled || !run?.battle) return;
  const tier = run.battle.tier || sinEncounterToken(run)?.tier;
  if (!(tier in SIN_FLEE_BONGURI)) return;
  const alive = run.battle.indices.some(i => {
    const m = me.mons["p1:Sinnoh" + (i + 1)];
    return m && m.side === "p1" ? m.hp > 0 : sinAlive(run.team[i]);
  });
  if (!alive) return;
  me.sinFled = true; me.s.omniscient.write(">forcetie");
}
function sinCaptureRoll(hp, max, ratio, bonus, status) {
  const state = status === "slp" || status === "frz" ? 2.5 : ["par", "brn", "psn", "tox"].includes(status) ? 1.5 : 1;
  const a = Math.floor((3 * max - 2 * hp) * ratio * bonus / (3 * max)) * state;
  if (a >= 255) return {a, b: 65536, checks: 4, caught: true};
  const b = a > 0 ? Math.floor(65536 / (255 / a) ** .1875) : 0;
  let checks = 0;
  while (checks < 4 && Math.floor(Math.random() * 65536) < b) checks++;
  return {a, b, checks, caught: checks === 4};
}
const sinCanThrow = me => !!(me && me.sin && !me.over && !me.dead && !me.sinThrowing && me.req?.active &&
  !me.req.wait && !me.req.forceSwitch && !me.req.teamPreview && ST.sin.run?.battle && me.mons[me.act.p2]?.hp > 0);
function sinBallsHTML(me) {
  const run = ST.sin.run; if (!run) return "";
  return Object.entries(SIN_BALLS).map(([key, ball]) => `<button class="btn" data-act="sinthrow" data-ball="${key}" ${sinCanThrow(me) && run.balls[key] > 0 ? "" : "disabled"}>${esc(ball.name)} ×${esc(run.balls[key])}</button>`).join("");
}
async function sinThrowBall(me, key) {
  const run = ST.sin.run, ball = SIN_BALLS[key];
  if (me !== B || !ball || !sinCanThrow(me) || !(run.balls[key] > 0)) return;
  const wild = me.mons[me.act.p2];
  me.sinThrowing = true; me.lastReq = me.req; me.req = null; me.shown = false; $("ctl").innerHTML = "";
  run.balls[key]--; save();
  const result = sinCaptureRoll(wild.hp, wild.max, sinSpeciesData(run.battle.wild.species)?.cr ?? 3, ball.bonus, wild.status);
  try {
    await say(me, `¡Lanzaste una ${ball.name}!`, 1);
    for (let i = 0; i < Math.min(3, result.checks); i++) {
      if (me.dead || me.over) return;
      await say(me, "La Ball se movió…", .7);
    }
    if (me.dead || me.over) return;
    if (result.caught) {
      me.sinCaught = true;
      await say(me, `¡Ya está! ¡Has atrapado a ${esSp(run.battle.wild.species)}!`, 1.2);
      if (!me.dead && !me.over) me.s.omniscient.write(">forcewin p1");
    } else {
      await say(me, "¡Oh, no! ¡El Pokémon se ha escapado!", 1.2);
      if (!me.dead && !me.over) me.s.omniscient.write('>eval const sd=battle.sides[0]; sd.clearChoice(); sd.choice.actions=[{choice:"pass",pokemon:sd.active[0],index:0}]; sd.choice.forcedPassesLeft=0; if (battle.allChoicesDone()) battle.commitChoices();');
    }
  } finally { me.sinThrowing = false; }
}
function sinMoveTo(key) {
  const run = ST.sin.run; if (!run || !SIN_VIEW || run.fought || run.revive || run.battle) return;
  // Se vuelve a calcular al confirmar para no usar un coste de una ficha antigua.
  const cost = sinReachable(run.pos, Math.max(0, sinMaxMoves(run) - run.moved)).get(key);
  if (!cost) return;
  const h = SIN_BY_CELL.get(key); run.pos = [h.c, h.r]; run.moved += cost;
  save(); sinUpdateTurn();
}
function sinSearch(index) {
  const run = ST.sin.run, t = SIN.tokens[index];
  if (!run || run.searched || run.fought || run.battle || run.revive || !run.team.some(sinAlive) || !t || !sinSearchToken(t) || t.cell.join(",") !== run.pos.join(",")) return;
  const [lo, hi] = SIN_WILD_LEVELS[t.tier];
  const cards = shuffle(sinWildCards(t).slice()).slice(0, SIN_OFFER_COUNT[t.tier]).map(c =>
    ({species: c.d.sp, img: c.img, level: lo + Math.floor(Math.random() * (hi - lo + 1))}));
  run.searched = true; run.offer = {cards, token: index, place: sinName(t), meta: sinMeta(t), closed: false};
  save(); renderSin();
}
function sinOfferScreen() {
  const run = ST.sin.run, offer = run.offer;
  $("app").innerHTML = `<div class="sin-new"><div class="sin-new-inner"><h1>Pokémon salvajes</h1>
    <p>${esc(offer.place)} · ${esc(offer.meta)}</p>
    ${offer.cards.length ? `<div class="sin-choices sin-offer">${offer.cards.map((s, i) => `<div class="sin-choice">
      ${sinCardImage(s.img, "Carta de " + esSp(s.species))}<b>${esc(esSp(s.species))}</b><span>Nv. ${esc(s.level)}</span>
      <div><button class="btn primary" data-act="sinfight" data-offer="${i}">Combatir</button></div></div>`).join("")}</div>` :
      '<p role="status">No hay cartas de Pokémon para este bioma, clima y nivel. La búsqueda de este turno ya fue usada.</p>'}
    <div class="sin-new-actions"><button class="btn" data-act="sinskip">No combatir</button></div>
    <div class="sin-team">${sinTeamHTML(run)}</div><p id="sin-offer-error" role="alert"></p></div></div>`;
  sinFillImages();
}
function sinPre(team) {
  // Solo se insertan números y estados conocidos en el código enviado al motor.
  const pre = team.map((s, i) => {
    const hp = s.hpNow == null ? "" : `a[${i}].sethp(${Math.max(1, Math.floor(s.hpNow))});`;
    return hp + (SIN_STATUS[s.status] ? `a[${i}].setStatus(${JSON.stringify(s.status)});` : "");
  }).join("");
  return pre ? "const a=battle.sides[0].pokemon;" + pre : "";
}
async function sinFight(index) {
  const run = ST.sin.run;
  if (!run || SIN_BUSY || run.fought || run.revive || !run.team.some(sinAlive)) return;
  if (!run.battle && (!run.offer || run.offer.closed || !run.offer.cards[index])) return;
  SIN_BUSY = true;
  document.querySelectorAll(".sin-new button").forEach(b => { b.disabled = true; });
  try {
    if (!run.battle) {
      const s = run.offer.cards[index], wild = await sinInitialSet(s.species, s.level);
      // El índice original y un apodo único mantienen la asociación aunque cambie el orden o la forma.
      const indices = run.team.map((s, i) => sinAlive(s) ? i : -1).filter(i => i >= 0);
      const token = SIN.tokens.indexOf(sinEncounterToken(run));
      run.battle = {wild, indices, token, tier: SIN.tokens[token]?.tier, card: s.img}; run.offer.closed = true; save();
    }
    if (!run.battle.tier) { run.battle.tier = sinEncounterToken(run)?.tier; save(); }
    const mine = run.battle.indices.map(i => ({...run.team[i], name: "Sinnoh" + (i + 1)}));
    sinLeave(); newBattle(mine, [{...run.battle.wild}], {sin: true, aiDiff: "easy", pre: sinPre(mine)});
  } catch (err) {
    const el = $("sin-offer-error"); if (el) el.textContent = "No se pudo preparar el combate. Intenta nuevamente.";
  } finally {
    SIN_BUSY = false; document.querySelectorAll(".sin-new button").forEach(b => { b.disabled = false; });
  }
}
function sinPendingScreen() {
  const wild = ST.sin.run.battle.wild;
  $("app").innerHTML = `<div class="sin-new"><div class="sin-new-inner"><h1>Combate pendiente</h1>
    <p>${esc(esSp(wild.species))} · Nv. ${esc(wild.level)}. Al salir o recargar se repite este mismo encuentro desde su inicio.</p>
    <button class="btn primary" data-act="sinresume">Reanudar combate</button><p id="sin-offer-error" role="alert"></p></div></div>`;
}
function sinResult(won, me) {
  const run = ST.sin.run; if (!run || !run.battle) return;
  sinMigrateTeam(run);
  const wild = run.battle.wild, token = sinEncounterToken(run), tier = run.battle.tier || token?.tier;
  const move = sinSignatureMove(sinBattleCard(run)), fled = won === null && !!me.sinFled;
  run.battle.indices.forEach(i => {
    const s = run.team[i], m = me.mons["p1:Sinnoh" + (i + 1)];
    // me.mons solo contiene los que salieron al campo; los de la banca conservan su estado.
    if (m && m.side === "p1") {
      s.hpMax = m.dmax ? Math.floor(m.max / 2) : m.max;
      s.hpNow = Math.min(s.hpMax, m.dmax ? Math.ceil(m.hp / 2) : m.hp);
      s.status = SIN_STATUS[m.status] ? m.status : "";
    }
    // También permite comprobar la derrota mediante >forcewin p2.
    if (won === false) { s.hpNow = 0; s.status = ""; }
  });
  if (won === true) {
    sinGainExp(run, wild, me);
    run.progress.bonguri = sinBonguriReward(run, token);
    run.progress.pv = (SIN_PV[tier] || 0) + (me.sinCaught ? 0 : 2);
    run.pv += run.progress.pv;
    if (!me.sinCaught && move) run.progress.signature = {move};
    if (me.sinCaught) {
      const m = me.mons[me.act.p2];
      wild.hpMax = calcStat(Dex.species.get(wild.species), wild, "hp");
      wild.hpNow = Math.max(1, Math.min(wild.hpMax, Math.ceil(m.hp / m.max * wild.hpMax)));
      wild.status = SIN_STATUS[m.status] ? m.status : "";
      const boxed = run.team.length >= sinTeamSlots(run);
      (boxed ? run.box : run.team).push(wild);
      run.progress.caught = {species: wild.species, boxed};
    }
  }
  else {
    run.progress = {won, rewards: [], pending: [], fled};
    if (fled) run.progress.bonguri = sinBonguriReward(run, token, SIN_FLEE_BONGURI[tier] ?? 0);
  }
  run.fought = true; run.moved = sinMaxMoves(run); run.battle = null;
  if (!run.team.some(sinAlive)) {
    const home = SIN.tokens.find(t => t.n === run.village && (t.tags || []).includes("Village Token"));
    run.pos = [...home.cell]; run.revive = true; ST.sin.cam = null;
    run.notice = "Tu equipo fue derrotado. Volviste a tu pueblo natal; termina el turno para recuperarlo.";
  } else run.notice = fled ? "¡El Pokémon salvaje huyó! Los PS y estados de tu equipo se mantienen." : won === null ? "El combate terminó en empate. Los PS y estados se mantienen." :
    me.sinCaught ? "¡Atrapaste al Pokémon salvaje! Los PS y estados se mantienen." : "¡Venciste al Pokémon salvaje! Los PS y estados de tu equipo se mantienen.";
  save();
}
function sinEndHTML(won) {
  // Los empates pasan directamente por showEnd en batalla.js.
  if (won === null && B && B.sin) sinResult(null, B);
  return sinProgressHTML(won);
}
function sinProgressHTML(won) {
  const run = ST.sin.run, p = run && run.progress, q = p && p.pending[0];
  if (p) won = p.won;
  return `<div class="card"><p class="result">${p?.fled ? "¡El Pokémon salvaje huyó!" : won === null ? "Empate" : p?.caught ? "¡Capturado!" : won ? "¡Victoria!" : "Derrota"}</p>
    <p class="note">${esc(run ? run.notice : "El combate terminó.")}</p>
    ${p?.caught ? `<p>${esc(esSp(p.caught.species))} ${p.caught.boxed ? "fue enviado a la Caja" : "se unió a tu equipo"}.</p>` : ""}
    ${p?.pv != null ? `<p>Ganaste ${esc(p.pv)} Puntos de Viaje.</p>` : ""}
    ${p?.fled && !Object.keys(p.bonguri || {}).length ? "<p>Recibiste 0 Bonguri.</p>" : ""}
    ${p?.bonguri && Object.keys(p.bonguri).length ? `<p>Recibiste ${Object.entries(p.bonguri).map(([k, n]) => `${esc(n)} Bonguri ${esc(SIN_BONGURI[k][n === 1 ? 0 : 1])}`).join(", ")}.</p>` : ""}
    ${p ? p.rewards.map(r => {
      const name = esc(esSp(run.team[r.index].species));
      return `<div class="sin-progress"><b>${name}: +${esc(r.exp)} EXP</b>
        ${r.levels.map(n => `<p>¡${name} subió al nivel ${esc(n)}!</p>`).join("")}
        ${r.events.map(e => `<p>${e.evolved ? `¡Felicidades! Tu ${esc(esSp(e.from))} evolucionó en ${esc(esSp(e.evolved))}.` : e.skip ? `${name} no aprendió ${esc(esMove(e.move))}.` : e.forgot ?
          `${name} olvidó ${esc(esMove(e.forgot))} y aprendió ${esc(esMove(e.move))}.` : `${name} aprendió ${esc(esMove(e.move))}.`}</p>`).join("")}</div>`;
    }).join("") : ""}
    ${q && q.kind === "evolution" ? `<div class="sin-learn sin-evolution"><p><b>¿Qué? ¡${esc(esSp(run.team[q.index].species))} está evolucionando!</b></p>
      <img src="${esc(img(run.team[q.index].species))}" alt="${esc(esSp(run.team[q.index].species))}">
      <div class="btns"><button class="btn primary" data-act="sinevolve">Evolucionar</button><button class="btn" data-act="sincancelevolution">Cancelar</button></div></div>` :
    q ? `<div class="sin-learn"><p><b>${esc(esSp(run.team[q.index].species))}</b> quiere aprender <b>${esc(esMove(q.move))}</b> (${q.kind === "signature" ? "movimiento de la carta" : q.level === 0 ? "al evolucionar" : "Nv. " + esc(q.level)}). Elige un ataque para olvidar.</p>
      <div class="btns">${run.team[q.index].moves.map((move, i) => `<button class="btn" data-act="sinlearn" data-slot="${i}">Olvidar ${esc(esMove(move))}</button>`).join("")}
      <button class="btn" data-act="sinlearn" data-slot="-1">No aprender</button></div></div>` :
    p?.signature && !p.signature.done ? `<div class="sin-learn"><p>Enseñar <b>${esc(esMove(p.signature.move))}</b> a…</p><div class="btns">
      ${run.team.map((s, i) => sinAlive(s) && !s.moves.some(m => toID(m) === p.signature.move) ? `<button class="btn" data-act="sinsignature" data-member="${i}">${esc(esSp(s.species))} · Nv. ${esc(s.level)}</button>` : "").join("")}
      <button class="btn" data-act="sinsignature" data-member="-1">No enseñar</button></div></div>` :
      '<div class="btns"><button class="btn primary" data-act="sinmap">Volver al mapa</button></div>'}</div>`;
}
function sinTeachSignature(index) {
  const run = ST.sin.run, p = run?.progress, offer = p?.signature;
  if (!offer || offer.done || p.pending.length || !Number.isInteger(index)) return;
  if (index !== -1) {
    const s = run.team[index];
    if (!s || !sinAlive(s) || s.moves.some(m => toID(m) === offer.move)) return;
    p.pending.push({index, move: offer.move, kind: "signature"});
  }
  offer.done = true; sinAdvanceMoves(run); save(); sinRefreshProgress();
}
function sinProgressScreen() {
  $("app").innerHTML = `<div class="sin-new"><div class="sin-new-inner"><h1>Resultado del combate</h1>${sinProgressHTML()}</div></div>`;
}
function sinLearn(slot) {
  const run = ST.sin.run, p = run && run.progress, q = p && p.pending[0];
  if (!q || q.kind === "evolution" || !Number.isInteger(slot) || slot < -1 || slot >= run.team[q.index].moves.length) return;
  const s = run.team[q.index], event = {move: q.move};
  if (slot === -1) event.skip = true;
  else { event.forgot = s.moves[slot]; s.moves[slot] = q.move; }
  p.rewards[q.index].events.push(event); p.pending.shift(); sinAdvanceMoves(run); save();
  sinRefreshProgress();
}
function sinEvolve(accept) {
  const run = ST.sin.run, p = run && run.progress, q = p && p.pending[0];
  if (!q || q.kind !== "evolution" || !q.target) return;
  const s = run.team[q.index], before = Dex.species.get(s.species), after = Dex.species.get(toID(q.target));
  p.pending.shift();
  if (accept && after.exists) {
    const oldMax = calcStat(before, s, "hp"), from = s.species;
    s.ability = sinEvolutionAbility(s.ability, before, after); s.species = after.name;
    s.hpMax = calcStat(after, s, "hp");
    if (s.hpNow != null) s.hpNow = Math.max(0, Math.min(s.hpMax, s.hpNow + s.hpMax - oldMax));
    p.rewards[q.index].events.push({from, evolved: s.species});
    const moves = (sinSpeciesData(s.species)?.lv || []).filter(([n]) => n === 0 || n === s.level)
      .map(([level, move]) => ({index: q.index, move: toID(move), level}))
      .filter((q, i, all) => all.findIndex(m => m.move === q.move) === i);
    p.pending.unshift(...moves);
  }
  sinAdvanceMoves(run); save(); sinRefreshProgress();
}
function sinRefreshProgress() {
  if (VIEW === "battle" && $("ctl")) $("ctl").innerHTML = sinProgressHTML();
  else sinProgressScreen();
}
function sinAtVillage(run) {
  return !!SIN_BY_CELL.get(run.pos.join(","))?.tokens.some(t => (t.tags || []).includes("Village Token"));
}
function sinCanDeposit(run, index, replacement) {
  return run.team.some((s, i) => i !== index && sinAlive(s)) || !!(replacement && sinAlive(replacement));
}
function sinBoxAction(action, index, other) {
  const run = ST.sin.run;
  if (!run || run.battle || run.progress || !sinAtVillage(run) || !Number.isInteger(index)) return;
  if (action === "sindeposit") {
    if (!run.team[index] || !sinCanDeposit(run, index)) return;
    run.box.push(run.team.splice(index, 1)[0]);
  } else if (action === "sinwithdraw") {
    if (!run.box[index] || run.team.length >= sinTeamSlots(run)) return;
    run.team.push(run.box.splice(index, 1)[0]);
  } else if (action === "sinexchange") {
    if (!Number.isInteger(other) || !run.team[index] || !run.box[other] || !sinCanDeposit(run, index, run.box[other])) return;
    [run.team[index], run.box[other]] = [run.box[other], run.team[index]];
  } else return;
  SIN_VIEW.boxMember = null; save(); sinUpdateTurn();
}
function sinBoxMember(s) {
  const max = s.hpMax ?? calcStat(Dex.species.get(s.species), s, "hp"), hp = s.hpNow ?? max;
  return `<b>${esc(esSp(s.species))}</b> · Nv. ${esc(s.level)} · ${s.gender === "M" ? "♂" : s.gender === "F" ? "♀" : "Sin sexo"} · ${esc(hp)}/${esc(max)} PS`;
}
function sinShowBox() {
  const run = ST.sin.run;
  if (!run || !SIN_VIEW || run.battle || run.progress || !sinAtVillage(run)) return;
  const selected = SIN_VIEW.boxMember;
  SIN_VIEW.box = true; SIN_VIEW.bag = false; SIN_VIEW.selected = null;
  $("sin-card").innerHTML = `<div class="sin-card-head"><h2>Caja (${esc(run.box.length)})</h2><button class="btn" data-act="sinclose">Cerrar</button></div>
    <p>Equipo ${esc(run.team.length)}/${esc(sinTeamSlots(run))}. Debe quedar al menos un Pokémon vivo en el equipo.</p>
    <ul class="sin-tokens">${run.team.map((s, i) => `<li>${sinBoxMember(s)}<div class="btns">
      <button class="btn sin-move" data-act="sindeposit" data-member="${i}" ${sinCanDeposit(run, i) ? "" : "disabled"}>Dejar</button>
      <button class="btn sin-move" data-act="sinboxselect" data-member="${i}" ${run.box.length ? "" : "disabled"}>${selected === i ? "Elegido para intercambiar" : "Intercambiar"}</button></div></li>`).join("")}</ul>
    <h2>Caja</h2>${Number.isInteger(selected) ? `<p>Elige por cuál intercambiar a ${esc(esSp(run.team[selected].species))}.</p>` : ""}
    ${run.box.length ? `<ul class="sin-tokens">${run.box.map((s, i) => `<li>${sinBoxMember(s)}<div class="btns">
      <button class="btn sin-move" data-act="sinwithdraw" data-member="${i}" ${run.team.length < sinTeamSlots(run) ? "" : "disabled"}>Sacar</button>
      ${Number.isInteger(selected) ? `<button class="btn sin-move" data-act="sinexchange" data-member="${selected}" data-box="${i}" ${sinCanDeposit(run, selected, s) ? "" : "disabled"}>Intercambiar</button>` : ""}</div></li>`).join("")}</ul>` : "<p>La Caja está vacía.</p>"}`;
  $("sin-card").hidden = false; sinRequestDraw();
}
function sinHeal() {
  const run = ST.sin.run, h = run && SIN_BY_CELL.get(run.pos.join(","));
  if (!h || run.healed || run.revive || run.battle || !h.tokens.some(t => (t.tags || []).includes("Village Token"))) return;
  run.team.forEach(s => { delete s.hpNow; delete s.status; });
  run.healed = true; run.notice = "Tu equipo está completamente recuperado."; save(); sinUpdateTurn();
}
function sinEndTurn() {
  const run = ST.sin.run; if (!run || run.battle) return;
  if (run.revive) run.team.forEach(s => { delete s.hpNow; delete s.status; });
  run.turn++; run.moved = 0; run.fought = false; run.healed = false; run.searched = false;
  run.offer = null; run.revive = false; run.notice = ""; save(); sinUpdateTurn();
}
function sinImage(key) {
  if (!key || !SIN.img[key]) return null;
  if (!SIN_IMAGES.has(key)) { SIN_IMAGES.set(key, null); SIN_QUEUE.push(key); sinLoadNext(); }
  return SIN_IMAGES.get(key);
}
const SIN_PLAYER_IMAGES = new Map();
function sinPlayerImage(species) {
  const key = toID(species);
  if (!SIN_PLAYER_IMAGES.has(key)) {
    SIN_PLAYER_IMAGES.set(key, null);
    (async () => {
      const icon = icoKey(species), url = icon && await assetURL("Ico", icon);
      for (const [src, strip] of [[url, true], [img(species), false]]) {
        if (!src) continue;
        try {
          const im = new Image(); im.src = src; await im.decode();
          SIN_PLAYER_IMAGES.set(key, {im, strip}); sinRequestDraw(); return;
        } catch (err) { /* Si falta el ícono, se intenta la ilustración oficial. */ }
      }
    })();
  }
  return SIN_PLAYER_IMAGES.get(key);
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
      sinFillImages(); sinRequestDraw();
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
  const accent = getComputedStyle(v.canvas).getPropertyValue("--accent").trim() || "#66d9b3";
  SIN_CELLS.forEach(h => {
    if (Math.abs(h.x - x) > v.w / (2 * z) + SIN_S || Math.abs(h.y - y) > v.h / (2 * z) + SIN_S) return;
    if (v.reachable.has(h.c + "," + h.r)) {
      sinHex(ctx, h.x, h.y); ctx.fillStyle = "rgba(255,255,255,.3)"; ctx.fill(); ctx.strokeStyle = accent; ctx.lineWidth = 2.5 / z; ctx.stroke();
    }
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
  // La ficha se dibuja al final para quedar siempre por encima de todos los tokens.
  const run = ST.sin.run, h = run && SIN_BY_CELL.get(run.pos.join(","));
  if (h) {
    const radius = SIN_H * .8, picture = sinPlayerImage(run.team[0].species);
    ctx.save(); ctx.beginPath(); ctx.arc(h.x, h.y, radius, 0, Math.PI * 2);
    ctx.shadowColor = "#0008"; ctx.shadowBlur = 9; ctx.shadowOffsetY = 3;
    ctx.fillStyle = SIN_PLAYER_COLORS[run.color] || "#447fd2"; ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(h.x, h.y, radius - 7, 0, Math.PI * 2); ctx.fillStyle = "#f4f8fc"; ctx.fill(); ctx.clip();
    if (picture) {
      const {im, strip} = picture, w = im.naturalWidth / (strip ? 2 : 1), ht = im.naturalHeight;
      const scale = (radius - 7) * 2 / Math.max(w, ht);
      ctx.imageSmoothingEnabled = !strip;
      // Los íconos de Essentials tienen dos cuadros: se usa solo la mitad izquierda.
      ctx.drawImage(im, 0, 0, w, ht, h.x - w * scale / 2, h.y - ht * scale / 2, w * scale, ht * scale);
    }
    else { ctx.fillStyle = "#18232b"; ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(esSp(run.team[0].species)[0], h.x, h.y); }
    ctx.restore();
  }
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
function sinSaveCam(manual = false) {
  if (!SIN_VIEW || !SIN_VIEW.cam) return;
  if (manual === true) SIN_VIEW.camMoved = true;
  if (!SIN_VIEW.camMoved) return;
  ST.sin.cam = {...SIN_VIEW.cam}; save();
}
function sinCenter() {
  const v = SIN_VIEW; if (!v) return;
  const run = ST.sin.run, h = run && SIN_BY_CELL.get(run.pos.join(","));
  v.cam = h ? {x: h.x, y: h.y, z: .9} :
    {x: (SIN_BOUNDS.x + SIN_BOUNDS.right) / 2, y: (SIN_BOUNDS.y + SIN_BOUNDS.bottom) / 2,
      z: Math.min(v.w / (SIN_BOUNDS.right - SIN_BOUNDS.x + 40), v.h / (SIN_BOUNDS.bottom - SIN_BOUNDS.y + 40))};
  v.camMoved = false; ST.sin.cam = null; save(); sinClamp(v); sinRequestDraw();
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
  sinShowCell(h);
}
function sinShowCell(h) {
  const v = SIN_VIEW, cost = v.reachable.get(h.c + "," + h.r); v.selected = h; v.bag = false; v.box = false; v.boxMember = null;
  const run = ST.sin.run, here = run.pos.join(",") === h.c + "," + h.r;
  const canSearch = !run.searched && !run.fought && !run.revive && run.team.some(sinAlive);
  $("sin-card").innerHTML = `<div class="sin-card-head"><h2>Casilla (${esc(h.c)}, ${esc(h.r)})</h2><button class="btn" data-act="sinclose" aria-label="Cerrar ficha">Cerrar</button></div>
    <p>Nivel de elevación: ${esc(h.l)} · ${esc(h.w ? "Agua" : "Tierra")}${h.dw ? " · Mundo Distorsión" : ""}</p>
    ${cost ? `<button class="btn primary sin-move" data-act="sinmove" data-cell="${esc(h.c + "," + h.r)}">Moverme aquí (${esc(cost)})</button>` : ""}
    ${h.tokens.length ? `<ul class="sin-tokens">${h.tokens.map(t => {
      const meta = sinMeta(t);
      return `<li><b>${esc(sinName(t))}</b>${meta ? `<small>${esc(meta)}</small>` : ""}${t.kind === "CardCustom" ? "<small>Escondite · Boca abajo</small>" : ""}
        ${here && sinSearchToken(t) ? `<button class="btn primary sin-move" data-act="sinsearch" data-token="${SIN.tokens.indexOf(t)}" ${canSearch ? "" : "disabled"}>Buscar Pokémon</button>` : ""}
        ${here && (t.tags || []).includes("Village Token") ? `<button class="btn primary sin-move" data-act="sinheal" ${run.healed || run.revive ? "disabled" : ""}>Curar equipo</button><button class="btn sin-move" data-act="sinbox">Caja (${esc(run.box.length)})</button>` : ""}</li>`;
    }).join("")}</ul>` : '<p>No hay tokens en esta casilla.</p>'}`;
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
    v.camMoved = true;
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
  else { v.canvas.classList.remove("sin-drag"); if (v.moved) sinSaveCam(true); }
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
  if (!ST.sin.run) return sinNewScreen();
  sinMigrateTeam(ST.sin.run);
  if (ST.sin.run.progress) return sinProgressScreen();
  if (ST.sin.run.battle) return sinPendingScreen();
  if (ST.sin.run.offer && !ST.sin.run.offer.closed) return sinOfferScreen();
  $("app").innerHTML = `<div class="sin-layout"><header class="sin-top"><button class="back" data-act="sinback">‹ Batalla</button><h1>Leyendas de Sinnoh</h1>
    <div class="sin-tools"><button class="btn" data-act="sinout" aria-label="Alejar mapa">−</button><button class="btn" data-act="sinin" aria-label="Acercar mapa">+</button><button class="btn" data-act="sincenter">Centrar ficha</button><button class="btn" data-act="sinabandon">Abandonar partida</button></div></header>
    <div class="sin-stage"><canvas id="sin-map" tabindex="0" aria-label="Mapa de Sinnoh. Arrastra para mover, pellizca o usa más y menos para acercar. Toca una casilla para ver su ficha."></canvas><div class="sin-hint">Arrastra para mover · Pellizca o usa + / − para acercar · Toca una casilla</div></div>
    <section class="sin-card" id="sin-card" aria-live="polite" hidden></section><footer class="sin-turn" id="sin-turn" aria-live="polite"></footer></div>`;
  const saved = ST.sin.cam, cam = saved && [saved.x, saved.y, saved.z].every(Number.isFinite) && saved.z > 0 ? {...saved} : null;
  const v = SIN_VIEW = {canvas: $("sin-map"), cam, camMoved: !!cam, reachable: new Map(), w: 0, h: 0, frame: 0, points: new Map(), events: new AbortController()};
  const opt = {signal: v.events.signal};
  v.canvas.addEventListener("pointerdown", sinDown, opt); v.canvas.addEventListener("pointermove", sinMove, opt);
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(name => v.canvas.addEventListener(name, sinUp, opt));
  v.canvas.addEventListener("wheel", e => {
    e.preventDefault(); const p = sinLocal(e), delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? v.h : 1);
    sinZoom(Math.exp(-Math.max(-400, Math.min(400, delta)) * .002), p.x, p.y);
    v.camMoved = true;
    clearTimeout(v.saveTimer); v.saveTimer = setTimeout(() => sinSaveCam(true), 180);
  }, {...opt, passive: false});
  window.addEventListener("pagehide", sinSaveCam, opt);
  v.resize = new ResizeObserver(sinResize); v.resize.observe(v.canvas);
  v.removal = new MutationObserver(() => { if (!v.canvas.isConnected) sinLeave(); });
  v.removal.observe($("app"), {childList: true});
  sinUpdateTurn(); sinResize();
}
document.addEventListener("click", e => {
  if (e.target.closest("[data-info]")) return;
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const act = b.dataset.act;
  if (act === "sinthrow" && VIEW === "battle" && B && B.sin) return sinThrowBall(B, b.dataset.ball);
  if (act === "sinlearn" && (VIEW === "sin" || (VIEW === "battle" && B && B.sin))) return sinLearn(+b.dataset.slot);
  if (act === "sinsignature" && (VIEW === "sin" || (VIEW === "battle" && B && B.sin))) return sinTeachSignature(+b.dataset.member);
  if ((act === "sinevolve" || act === "sincancelevolution") && (VIEW === "sin" || (VIEW === "battle" && B && B.sin))) return sinEvolve(act === "sinevolve");
  if (act === "sinmap") {
    const run = ST.sin.run; if (!run || !run.progress || run.progress.pending.length || (run.progress.signature && !run.progress.signature.done)) return;
    delete run.progress; save(); if (B) B.dead = true; B = null; return go("sin");
  }
  if (act === "sin") { if (B) B.dead = true; B = null; return go("sin"); }
  if (VIEW !== "sin") return;
  if (SIN_NEW.busy || SIN_BUSY) return;
  if (act === "sinback") { sinLeave(); SIN_NEW = {village: null, species: null, busy: false}; return go("menu"); }
  if (act === "sinvillage") {
    SIN_NEW.village = SIN_VILLAGES.find(v => v.village === b.dataset.village); SIN_NEW.species = null; return sinNewScreen();
  }
  if (act === "sinstarter" && SIN_NEW.village && SIN_NEW.village.starters.includes(b.dataset.species)) {
    SIN_NEW.species = b.dataset.species; return sinNewScreen();
  }
  if (act === "sinnewback") {
    if (SIN_NEW.species) SIN_NEW.species = null; else SIN_NEW.village = null; return sinNewScreen();
  }
  if (act === "sinbegin") return sinBegin();
  if (act === "sinabandon") {
    if (!confirm("¿Abandonar esta partida de Leyendas de Sinnoh? Se perderá su progreso.")) return;
    sinLeave(); ST.sin.run = null; ST.sin.cam = null; SIN_NEW = {village: null, species: null, busy: false}; save(); return renderSin();
  }
  if (act === "sinfight") return sinFight(+b.dataset.offer);
  if (act === "sinresume") return sinFight();
  if (act === "sinskip" && ST.sin.run && ST.sin.run.offer && !ST.sin.run.battle) {
    ST.sin.run.offer.closed = true; ST.sin.run.notice = "Decidiste no combatir. Ya usaste la búsqueda de este turno."; save(); return renderSin();
  }
  if (!SIN_VIEW || !ST.sin.run) return;
  if (act === "sinbag") return sinShowBag();
  if (act === "sinbox") { SIN_VIEW.boxMember = null; return sinShowBox(); }
  if (act === "sinboxselect") {
    const index = +b.dataset.member;
    if (!sinAtVillage(ST.sin.run) || !ST.sin.run.team[index]) return;
    SIN_VIEW.boxMember = index; return sinShowBox();
  }
  if (["sindeposit", "sinwithdraw", "sinexchange"].includes(act)) return sinBoxAction(act, +b.dataset.member, +b.dataset.box);
  if (act === "sincraft") return sinCraft(b.dataset.ball);
  if (act === "sinmove") return sinMoveTo(b.dataset.cell);
  if (act === "sinsearch") return sinSearch(+b.dataset.token);
  if (act === "sinheal") return sinHeal();
  if (act === "sinendturn") return sinEndTurn();
  if (act === "sincenter") return sinCenter();
  if (act === "sinclose") { $("sin-card").hidden = true; SIN_VIEW.selected = null; SIN_VIEW.bag = false; SIN_VIEW.box = false; SIN_VIEW.boxMember = null; return sinRequestDraw(); }
  if (act === "sinin" || act === "sinout") { sinZoom(act === "sinin" ? 1.4 : 1 / 1.4, SIN_VIEW.w / 2, SIN_VIEW.h / 2); sinSaveCam(true); }
});
