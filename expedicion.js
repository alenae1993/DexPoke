"use strict";
/* ---------- Modo Expedición (Mi Dex) ----------
   Roguelite propio. Armas un equipo inicial con 10 puntos (cada Pokémon cuesta según su fuerza) y avanzas paso a paso
   eligiendo el camino: Pokémon salvajes (se pueden capturar), entrenadores, tiendas, Centros Pokémon y sucesos.
   Cada 10 pasos hay un Guardián de zona. Los PS y estados se mantienen entre combates; se gana EXP con la fórmula
   de los juegos, se aprenden los movimientos por nivel y se evoluciona. Si todo el equipo cae, la expedición termina.
   Lo que capturas queda desbloqueado (su primera etapa) para armar el equipo de las siguientes expediciones. */
if (!ST.exp) ST.exp = {run: null, best: 0, runs: 0, unlocked: []};
const EXPD = () => ST.exp;
const EXP_BUDGET = 10, EXP_START_LEVEL = 5, EXP_SHARE = .5;
const EXP_STARTERS = ["Bulbasaur", "Charmander", "Squirtle", "Chikorita", "Cyndaquil", "Totodile", "Treecko", "Torchic", "Mudkip",
  "Turtwig", "Chimchar", "Piplup", "Snivy", "Tepig", "Oshawott", "Chespin", "Fennekin", "Froakie", "Rowlet", "Litten", "Popplio",
  "Grookey", "Scorbunny", "Sobble", "Sprigatito", "Fuecoco", "Quaxly", "Pichu", "Eevee", "Pidgey", "Rattata", "Caterpie",
  "Zigzagoon", "Starly", "Bidoof", "Machop", "Geodude", "Abra", "Gastly", "Magikarp", "Ralts", "Riolu"];
const EXP_ZONES = [
  {n: "Pradera Soleada", t: ["Normal", "Grass", "Bug", "Flying"], boss: "Guardiana Brezo"},
  {n: "Costa Brumosa", t: ["Water", "Flying", "Electric"], boss: "Guardián Marejada"},
  {n: "Cueva Honda", t: ["Rock", "Ground", "Dark", "Steel"], boss: "Guardiana Estalactita"},
  {n: "Bosque Umbrío", t: ["Bug", "Grass", "Poison", "Fairy", "Ghost"], boss: "Guardián Musgo"},
  {n: "Volcán Ceniza", t: ["Fire", "Rock", "Fighting"], boss: "Guardiana Brasa"},
  {n: "Cumbre Helada", t: ["Ice", "Steel", "Flying"], boss: "Guardián Escarcha"},
  {n: "Ciudad Neón", t: ["Normal", "Electric", "Steel", "Psychic"], boss: "Guardiana Voltio"},
  {n: "Pantano Sombrío", t: ["Poison", "Water", "Ghost", "Dark"], boss: "Guardián Ciénaga"},
  {n: "Ruinas Antiguas", t: ["Psychic", "Ghost", "Rock", "Fairy"], boss: "Guardiana Runa"},
  {n: "Cielo Dragón", t: ["Dragon", "Flying", "Fairy"], boss: "Guardián Zafiro"}
];
const EXP_TRAINERS = ["Excursionista Tomás", "Campista Lía", "Ornitólogo Rubén", "Nadadora Marina", "Cazabichos Leo", "Karateka Iván",
  "Científica Noa", "Dama Inés", "Motorista Brais", "Montañera Elsa", "Pescador Saúl", "Bailarina Coral", "Médium Olga", "Experta Dalia", "Entrenador Guay Bruno"];
const EXP_KINDS = {
  wild: {n: "Pokémon salvaje", d: "Combate contra un Pokémon salvaje. Puedes capturarlo."},
  trainer: {n: "Entrenador", d: "Combate con más EXP y dinero."},
  shop: {n: "Tienda", d: "Compra Poké Balls, medicinas y objetos."},
  center: {n: "Centro Pokémon", d: "Recupera los PS y los estados de todo el equipo."},
  mystery: {n: "Suceso", d: "Algo inesperado te espera en el camino."},
  boss: {n: "Guardián de la zona", d: "Un combate difícil. Al ganar eliges un objeto de regalo."}
};
const EXP_WEIGHTS = [["wild", 45], ["trainer", 25], ["shop", 12], ["mystery", 10], ["center", 8]];
const EXP_BALLS = {pokeball: 1, greatball: 1.5, ultraball: 2};
const EXP_MEDS = {potion: 20, superpotion: 60, hyperpotion: 120, maxpotion: 9999};
// [objeto, precio, paso desde el que se vende]
const EXP_SHOP = [["pokeball", 200, 1], ["greatball", 600, 8], ["ultraball", 1200, 22], ["potion", 300, 1], ["superpotion", 700, 10],
  ["hyperpotion", 1200, 25], ["maxpotion", 2500, 40], ["fullheal", 500, 1], ["revive", 1500, 1], ["rarecandy", 3000, 1]];
const EXP_HELD = ["leftovers", "choiceband", "choicespecs", "choicescarf", "lifeorb", "sitrusberry", "luckyegg", "focussash",
  "expertbelt", "assaultvest", "rockyhelmet", "quickclaw", "scopelens", "shellbell"];
const EXP_EVO_METHODS = ["Item", "ItemNight", "DayHoldItem", "NightHoldItem", "CableLinkItem"];
const EXP_EVO_ITEMS = [...new Set(D.P.flatMap(p => (p.ev || []).filter(e => EXP_EVO_METHODS.includes(e[1])).map(e => toID(e[2]))))]
  .filter(id => ESX.I[id]).concat("linkingcord");
const EXP_STATUS = ["brn", "par", "psn", "tox", "slp", "frz"];
const EXP_STATUS_ES = {brn: "Quemado", par: "Paralizado", psn: "Envenenado", tox: "Gravemente envenenado", slp: "Dormido", frz: "Congelado"};
const EXP_EV_STATS = {HP: "hp", ATTACK: "atk", DEFENSE: "def", SPECIAL_ATTACK: "spa", SPECIAL_DEFENSE: "spd", SPEED: "spe"};
let EXP_NEW = {open: false, picks: []}, EXP_VIEW = null, EXP_USE = null;

/* ---------- datos de especies (data.js) ---------- */
const EXP_DATA = new Map(D.P.map(p => [p.c, p]));
const expData = sp => { const s = Dex.species.get(sp); return EXP_DATA.get(toID(s.name).toUpperCase()) || EXP_DATA.get(toID(s.baseSpecies).toUpperCase()); };
const EXP_POOL = [], EXP_RARE = [];
D.P.forEach(p => {
  const s = Dex.species.get(toID(p.c));
  if (!s.exists || s.num <= 0 || s.battleOnly || /Mega|Gmax|Primal|Totem/.test(s.forme) || !(p.lv || []).length) return;
  ((p.fl || []).some(f => /Legendary|Mythical|UltraBeast/.test(f)) ? EXP_RARE : EXP_POOL).push(s);
});
const expRand = a => a[Math.floor(Math.random() * a.length)];
const expZone = w => EXP_ZONES[Math.floor((w - 1) / 10) % EXP_ZONES.length];
const expLevel = w => Math.min(100, Math.round(EXP_START_LEVEL + (w - 1) * 1.1));
function expCost(sp) { const b = Dex.species.get(sp).bst; return b <= 250 ? 1 : b <= 330 ? 2 : b <= 420 ? 3 : b <= 480 ? 4 : b <= 540 ? 5 : b <= 600 ? 7 : 9; }
function expRoot(sp) { let s = Dex.species.get(sp); while (s.prevo) s = Dex.species.get(s.prevo); return s.name; }
const expUnlocked = () => [...new Set([...EXP_STARTERS, ...EXPD().unlocked])].filter(sp => Dex.species.get(sp).exists)
  .sort((a, b) => expCost(a) - expCost(b) || Dex.species.get(a).num - Dex.species.get(b).num);
// Especie según el paso: el tope de estadísticas base sube con el avance; el piso evita solo Pokémon débiles más adelante.
function expSpecies(w, types, bonus = 0, from = EXP_POOL) {
  const cap = 300 + w * 7 + bonus, lo = Math.min(cap - 200, 480);
  const typed = x => !types || x.types.some(t => types.includes(t));
  let list = from.filter(x => x.bst <= cap && x.bst >= lo && typed(x));
  if (list.length < 5) list = from.filter(x => x.bst <= cap && typed(x));
  if (!list.length) list = from.filter(x => x.bst <= cap);
  return expRand(list.length ? list : from).name;
}
function expForLevel(gw, n) {
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
// EXP de la 5.ª generación: depende de la EXP base del rival y de la diferencia de niveles.
const expWild = (be, lr, lp) => Math.floor(be * lr / 5 * ((2 * lr + 10) / (lr + lp + 10)) ** 2.5) + 1;
const expFriendLevel = f => Math.min(255, f + (f < 100 ? 5 : f < 200 ? 3 : 2));
function expGainEVs(set, text) {
  if (!set.evs) set.evs = {};
  let total = Object.values(EXP_EV_STATS).reduce((sum, k) => sum + (set.evs[k] || 0), 0);
  const parts = (text || "").split(",");
  for (let i = 0; i < parts.length; i += 2) {
    const k = EXP_EV_STATS[parts[i].trim()]; if (!k) continue;
    const gain = Math.max(0, Math.min(+parts[i + 1] || 0, 252 - (set.evs[k] || 0), 510 - total));
    set.evs[k] = (set.evs[k] || 0) + gain; total += gain;
  }
}
function expGender(species) {
  const gr = expData(species)?.gr, sp = Dex.species.get(species);
  if (gr === "Genderless" || sp.gender === "N") return "N";
  if (gr === "AlwaysMale" || sp.gender === "M") return "M";
  if (gr === "AlwaysFemale" || sp.gender === "F") return "F";
  const ratios = {FemaleOneEighth: .125, Female25Percent: .25, Female50Percent: .5, Female75Percent: .75, FemaleSevenEighths: .875};
  return Math.random() < (ratios[gr] ?? sp.genderRatio?.F ?? .5) ? "F" : "M";
}
function expMakeSet(species, level, opts = {}) {
  const set = blankSet(species), sp = Dex.species.get(species), d = expData(species);
  const learned = (d?.lv || []).filter(([n]) => n > 0 && n <= level).map(([, m]) => toID(m)).filter(m => Dex.moves.get(m).exists);
  set.level = level;
  // Los cuatro últimos movimientos aprendidos por nivel, sin repetir.
  set.moves = learned.filter((m, i) => learned.lastIndexOf(m) === i).slice(-4);
  if (!set.moves.length) set.moves = ["tackle"];
  Object.keys(set.ivs).forEach(k => { set.ivs[k] = opts.ivs ?? Math.floor(Math.random() * 32); });
  const abil = Object.entries(sp.abilities).filter(([k]) => k !== "S"), normal = abil.filter(([k]) => k !== "H"), hidden = abil.find(([k]) => k === "H");
  set.ability = (hidden && Math.random() < .05 ? hidden : expRand(normal.length ? normal : abil))[1];
  set.nature = expRand(Dex.natures.all()).name;
  set.gender = expGender(species); set.exp = expForLevel(d?.gw, level); set.friendship = d?.hp ?? 70;
  set.shiny = Math.random() < (opts.shiny || 1 / 256);
  set.teraType = sp.types[0];
  return set;
}
const expMaxHp = s => calcStat(Dex.species.get(s.species), s, "hp");
const expHp = s => s.hpNow ?? expMaxHp(s);
const expAlive = s => expHp(s) > 0;
function expAdd(run, id, n = 1) { run.bag[id] = (run.bag[id] || 0) + n; }

/* ---------- camino ---------- */
const expTypes = zone => shuffle(zone.t.slice()).slice(0, 2);
function expPath(run) {
  const w = run.wave, step = (w - 1) % 10 + 1, zone = expZone(w);
  if (step === 10) return [{k: "boss"}];
  if (w === 1) return [{k: "wild", t: expTypes(zone)}, {k: "wild", t: expTypes(zone)}];
  const out = [], n = Math.random() < .5 ? 3 : 2;
  if (step === 9) out.push({k: "center"});
  while (out.length < n) {
    let r = Math.random() * 100; const k = (EXP_WEIGHTS.find(([, p]) => (r -= p) < 0) || ["wild"])[0];
    if (k !== "wild" && out.some(o => o.k === k)) continue;
    out.push(k === "wild" ? {k, t: expTypes(zone)} : {k});
  }
  return shuffle(out);
}
function expAdvance(run) {
  run.wave++; run.node = null; run.path = expPath(run);
  EXPD().best = Math.max(EXPD().best || 0, run.wave - 1); save();
}
function expStock(w) {
  return [...EXP_SHOP.filter(([, , min]) => w >= min).map(([id, p]) => [id, p]),
    ...shuffle(EXP_HELD.slice()).slice(0, 3).map(id => [id, id === "sitrusberry" ? 800 : 3000]),
    ...shuffle(EXP_EVO_ITEMS.slice()).slice(0, 2).map(id => [id, 2500])];
}
function expTeamOf(n, make) {
  const out = [], seen = new Set();
  for (let tries = 0; out.length < n && tries < 40; tries++) { const s = make(); if (!seen.has(s.species)) { seen.add(s.species); out.push(s); } }
  return out;
}
function expMystery(run) {
  const w = run.wave, r = Math.random();
  if (r < .25) { const m = 200 + w * 40 + Math.floor(Math.random() * 300); run.money += m; return {k: "mystery", text: `Encontraste una bolsa olvidada con ₽${m}.`}; }
  if (r < .42) { const id = expRand(EXP_HELD); expAdd(run, id); return {k: "mystery", text: `Encontraste ${esItem(id)} entre la hierba.`, item: id}; }
  if (r < .55) { const id = expRand(EXP_EVO_ITEMS); expAdd(run, id); return {k: "mystery", text: `Un coleccionista te regala ${esItem(id)}.`, item: id}; }
  if (r < .7) {
    run.team.forEach(s => { if (expAlive(s)) s.hpNow = Math.min(expMaxHp(s), expHp(s) + Math.ceil(expMaxHp(s) / 2)); });
    return {k: "mystery", text: "Una fuente termal: tus Pokémon en pie recuperan la mitad de sus PS."};
  }
  if (r < .8) { expAdd(run, "rarecandy"); return {k: "mystery", text: "Un viajero te regala un Caramelo Raro.", item: "rarecandy"}; }
  if (r < .88) { expAdd(run, "ultraball", 2); return {k: "mystery", text: "Encontraste 2 Ultra Balls en una mochila perdida.", item: "ultraball"}; }
  return {k: "mystery", text: "¡Un Pokémon poco común te sale al paso!", rare: true};
}
function expChoose(i) {
  const run = EXPD().run, node = run?.path?.[i]; if (!node || run.battle || run.node || run.progress) return;
  const w = run.wave, zone = expZone(w), lv = expLevel(w);
  const vary = () => Math.max(2, Math.min(100, lv + Math.floor(Math.random() * 3) - 1));
  if (node.k === "wild") run.battle = {kind: "wild", foes: [expMakeSet(expSpecies(w, node.t), vary())]};
  else if (node.k === "trainer") {
    const n = Math.min(4, 1 + Math.floor(w / 12) + (Math.random() < .4 ? 1 : 0));
    run.battle = {kind: "trainer", name: expRand(EXP_TRAINERS), foes: expTeamOf(n, () => expMakeSet(expSpecies(w, null), Math.min(100, lv + 1)))};
  } else if (node.k === "boss") {
    const n = Math.min(6, 2 + Math.floor(w / 10));
    run.battle = {kind: "boss", name: zone.boss, foes: expTeamOf(n, () => {
      const s = expMakeSet(expSpecies(w, zone.t, 60), Math.min(100, lv + 3), {ivs: 31}); if (w >= 20) s.item = expRand(EXP_HELD); return s;
    })};
  } else if (node.k === "shop") run.node = {k: "shop", stock: expStock(w)};
  else if (node.k === "center") { run.team.forEach(s => { delete s.hpNow; s.status = ""; }); run.node = {k: "center", text: "Tu equipo recuperó todos sus PS y estados."}; }
  else if (node.k === "mystery") run.node = expMystery(run);
  save();
  if (run.battle) return expFight();
  renderExp();
}
function expRareFight() {
  const run = EXPD().run; if (!run?.node?.rare) return;
  const w = run.wave, lv = Math.min(100, expLevel(w) + 2);
  const legend = w >= 30 && Math.random() < .3;
  run.battle = {kind: "wild", rare: true, foes: [expMakeSet(legend ? expSpecies(w, null, 150, EXP_RARE) : expSpecies(w, null, 120), lv, {shiny: 1 / 16})]};
  run.node = null; save(); expFight();
}

/* ---------- combate ---------- */
function expBattleSet(s, name) {
  const {hpNow, status, exp, friendship, ball, ...set} = s;
  return JSON.parse(JSON.stringify({...set, name}));
}
function expPre(team) {
  // Solo números y estados conocidos llegan al código que se envía al motor.
  const code = team.map((s, i) => (s.hpNow == null ? "" : `a[${i}].sethp(${Math.max(1, Math.floor(s.hpNow))});`) +
    (EXP_STATUS.includes(s.status) ? `a[${i}].setStatus(${JSON.stringify(s.status)});` : "")).join("");
  return code ? "const a=battle.sides[0].pokemon;" + code : "";
}
function expFight() {
  const run = EXPD().run, b = run?.battle; if (!b || !run.team.some(expAlive)) return;
  b.indices = run.team.map((s, i) => expAlive(s) ? i : -1).filter(i => i >= 0);
  const w = run.wave, mine = b.indices.map(i => expBattleSet(run.team[i], "Exp" + (i + 1)));
  newBattle(mine, b.foes.map(s => expBattleSet(s, "")), {exp: true, wild: b.kind === "wild", foeName: b.name || null,
    intro: b.name ? `¡${b.name} te desafía!` : null, bgm: b.kind === "boss" ? "bgm_boss" : b.kind === "trainer" ? "bgm_trainer" : "bgm_wild",
    aiDiff: b.kind === "wild" ? "easy" : b.kind === "boss" ? (w >= 20 ? "hard" : "normal") : w >= 40 ? "hard" : w >= 15 ? "normal" : "easy",
    pre: expPre(b.indices.map(i => run.team[i]))});
  save();
}
const expCanAct = me => !!(me && me === B && me.exp && !me.over && !me.dead && !me.expBusy && me.req?.active && !me.req.wait && !me.req.forceSwitch && !me.req.teamPreview);
/* lo llama batalla.js: botones extra en combates salvajes */
function expBattleHTML(me) {
  const run = EXPD().run; if (!run?.battle || run.battle.kind !== "wild") return "";
  const ok = expCanAct(me);
  return Object.keys(EXP_BALLS).filter(k => run.bag[k] > 0 || k === "pokeball").map(k =>
    `<button class="btn exp-ballbtn" data-act="expthrow" data-ball="${k}" ${ok && run.bag[k] > 0 ? "" : "disabled"}>${itemIco(k)}${esc(esItem(k))} ×${esc(run.bag[k] || 0)}</button>`).join("") +
    `<button class="btn" data-act="expflee" ${ok ? "" : "disabled"}>Huir</button>`;
}
function expCaptureRoll(hp, max, rate, bonus, status) {
  const st = status === "slp" || status === "frz" ? 2.5 : ["par", "brn", "psn", "tox"].includes(status) ? 1.5 : 1;
  const a = Math.floor((3 * max - 2 * hp) * rate * bonus / (3 * max)) * st;
  if (a >= 255) return {checks: 4, caught: true};
  const b = a > 0 ? Math.floor(65536 / (255 / a) ** .1875) : 0;
  let checks = 0;
  while (checks < 4 && Math.floor(Math.random() * 65536) < b) checks++;
  return {checks, caught: checks === 4};
}
const expWait = ms => new Promise(r => setTimeout(r, ms));
async function expBallFx(me, key, phase) {
  const sc = $("scene"), foe = $("mon-p2"); if (!sc || me.dead) return;
  let ball = sc.querySelector(".exp-ball");
  if (phase === "throw") {
    ball?.remove();
    ball = document.createElement("span"); ball.className = "itm exp-ball"; ball.dataset.itm = key; sc.appendChild(ball);
    const s = sc.getBoundingClientRect(), f = (foe || sc).getBoundingClientRect();
    const x = f.left - s.left + f.width / 2 - 16, y = f.top - s.top + f.height * .6 - 16, ground = f.top - s.top + f.height - 34;
    Object.assign(ball.style, {left: x + "px", top: y + "px"});
    await ball.animate([{left: s.width * .2 + "px", top: s.height * .8 + "px", transform: "rotate(0)"},
      {left: (x + s.width * .2) / 2 + "px", top: y - s.height * .25 + "px", offset: .5},
      {left: x + "px", top: y + "px", transform: "rotate(900deg)"}], {duration: 650, easing: "ease-out"}).finished.catch(() => {});
    sfx("se_recall", .6); foe?.classList.add("exp-absorbed"); await expWait(380);
    Object.assign(ball.style, {top: ground + "px"});
    await ball.animate([{top: y + "px"}, {top: ground + "px"}], {duration: 380, easing: "cubic-bezier(.5,0,.7,1.4)"}).finished.catch(() => {});
  } else if (phase === "shake" && ball) {
    await ball.animate([{transform: "rotate(0)"}, {transform: "rotate(-28deg)"}, {transform: "rotate(22deg)"}, {transform: "rotate(0)"}],
      {duration: 600, easing: "ease-in-out"}).finished.catch(() => {});
    await expWait(150);
  } else if (phase === "caught" && ball) {
    sfx("se_ok"); ball.classList.add("done"); await expWait(700);
  } else if (phase === "escape") {
    ball?.remove(); sfx("se_out", .6); foe?.classList.remove("exp-absorbed"); await expWait(300);
  }
}
async function expThrow(me, key) {
  const run = EXPD().run, wild = me?.mons[me.act.p2];
  if (!expCanAct(me) || !(run.bag[key] > 0) || !wild || wild.hp <= 0) return;
  const set = run.battle.foes[0];
  me.expBusy = true; me.lastReq = me.req; me.req = null; me.shown = false; $("ctl").innerHTML = "";
  run.bag[key]--; save();
  const r = expCaptureRoll(wild.hp, wild.max, expData(set.species)?.cr ?? 45, EXP_BALLS[key], wild.status);
  try {
    const thrown = expBallFx(me, key, "throw");
    await say(me, `¡Lanzaste una ${esItem(key)}!`, 1); await thrown;
    for (let i = 0; i < Math.min(3, r.checks); i++) {
      if (me.dead || me.over) return;
      await Promise.all([say(me, "La Ball se movió…", .7), expBallFx(me, key, "shake")]);
    }
    if (me.dead || me.over) return;
    if (r.caught) {
      await Promise.all([say(me, `¡Ya está! ¡Has atrapado a ${esSp(wild.species)}!`, 1.2), expBallFx(me, key, "caught")]);
      if (me.dead || me.over) return;
      me.expCaught = {hp: wild.hp, max: wild.max, status: wild.status, ball: key};
      me.s.omniscient.write(">forcewin p1");
    } else {
      await Promise.all([expBallFx(me, key, "escape"), say(me, "¡Oh, no! ¡El Pokémon se ha escapado!", 1.2)]);
      if (me.dead || me.over) return;
      // Lanzar la Ball gasta el turno: el rival ataca igual.
      me.s.omniscient.write('>eval const sd=battle.sides[0]; sd.clearChoice(); sd.choice.actions=[{choice:"pass",pokemon:sd.active[0],index:0}]; sd.choice.forcedPassesLeft=0; if (battle.allChoicesDone()) battle.commitChoices();');
    }
  } finally { me.expBusy = false; }
}
function expFlee(me) {
  if (!expCanAct(me) || EXPD().run?.battle?.kind !== "wild") return;
  me.expFled = true; me.req = null; $("ctl").innerHTML = ""; me.s.omniscient.write(">forcetie");
}
/* lo llama batalla.js al terminar un combate de expedición */
function expResult(won, me) {
  const run = EXPD().run, b = run?.battle; if (!b) return;
  (b.indices || []).forEach(i => {
    const s = run.team[i], m = me.mons["p1:Exp" + (i + 1)];
    // Solo cambian los que salieron al campo; los de la banca quedan igual.
    if (m && m.side === "p1") { s.hpNow = Math.max(0, Math.min(expMaxHp(s), m.hp)); s.status = EXP_STATUS.includes(m.status) && m.hp > 0 ? m.status : ""; }
  });
  if (won === false || !run.team.some(expAlive)) return expGameOver(run, b.name ? `Derrotado por ${b.name}` : "Tu equipo cayó ante un Pokémon salvaje");
  if (won === null) { run.battle = null; run.notice = me.expFled ? "Escapaste sin problemas." : "El combate terminó en empate."; expAdvance(run); return; }
  const lvSum = b.foes.reduce((a, s) => a + s.level, 0);
  const money = b.kind === "boss" ? lvSum * 60 : b.kind === "trainer" ? lvSum * 30 : lvSum * 10;
  run.money += money;
  const p = run.progress = expGainExp(run, b.foes, me, b.kind === "wild" ? 1 : 1.5);
  p.money = money; p.after = "advance";
  if (me.expCaught) {
    const c = me.expCaught, set = JSON.parse(JSON.stringify(b.foes[0])), max = expMaxHp(set);
    set.hpNow = Math.max(1, Math.round(c.hp / c.max * max)); set.status = EXP_STATUS.includes(c.status) ? c.status : ""; set.ball = c.ball;
    const toBox = run.team.length >= 6; (toBox ? run.box : run.team).push(set);
    p.caught = set.species; p.toBox = toBox; (run.caught ||= []).push(set.species);
    const root = expRoot(set.species);
    if (!EXP_STARTERS.includes(root) && !EXPD().unlocked.includes(root)) { EXPD().unlocked.push(root); p.unlocked = root; }
  }
  if (b.kind === "boss") p.bossItems = shuffle(EXP_HELD.filter(id => id !== "sitrusberry")).slice(0, 3);
  run.battle = null;
  expAdvanceMoves(run); save();
}
function expGameOver(run, why) {
  const E = EXPD();
  E.best = Math.max(E.best || 0, run.wave - 1);
  E.last = {wave: run.wave, team: run.team.map(s => s.species), caught: (run.caught || []).length, why};
  E.run = null; EXP_VIEW = null; save();
}
function expEndHTML(won) {
  const E = EXPD();
  if (won === false || !E.run) return `<div class="card"><p class="result">Fin de la expedición</p><p class="note" style="text-align:center">${esc(E.last?.why || "")}. Llegaste al paso ${esc(E.last?.wave || 1)} · Récord: ${esc(E.best || 0)} pasos.</p>
    <div class="btns" style="justify-content:center"><button class="btn pri" data-act="expnew">Nueva expedición</button><button class="btn" data-act="menu">Menú</button></div></div>`;
  return `<div class="card"><p class="result">${won ? "¡Victoria!" : "Combate terminado"}</p>
    <div class="btns" style="justify-content:center"><button class="btn pri" data-act="exp">Continuar la expedición</button></div></div>`;
}

/* ---------- EXP, movimientos y evolución ---------- */
function expGrow(run, index, reward, p) {
  const s = run.team[index], d = expData(s.species), oldMax = expMaxHp(s);
  while (s.level < 100 && s.exp >= expForLevel(d?.gw, s.level + 1)) {
    s.level++; reward.levels.push(s.level); s.friendship = expFriendLevel(s.friendship ?? 70);
    (d?.lv || []).filter(([n]) => n === s.level).forEach(([, m]) => { if (Dex.moves.get(toID(m)).exists) p.pending.push({index, move: toID(m), level: s.level}); });
  }
  if (s.hpNow != null && s.hpNow > 0) s.hpNow = Math.min(expMaxHp(s), s.hpNow + expMaxHp(s) - oldMax);
}
function expGainExp(run, foes, me, mult) {
  const p = {rewards: [], pending: []};
  run.team.forEach((s, index) => {
    const reward = {index, species: s.species, exp: 0, levels: [], events: []}; p.rewards.push(reward);
    if (!expAlive(s)) return;
    s.friendship = Math.min(255, (s.friendship ?? 70) + 1);
    const m = me.mons["p1:Exp" + (index + 1)], fought = m && m.side === "p1", gw = expData(s.species)?.gw;
    foes.forEach(f => {
      const fd = expData(f.species);
      const gain = Math.floor(expWild(fd?.be || 50, f.level, s.level) * mult * (fought ? 1 : EXP_SHARE) * (toID(s.item) === "luckyegg" ? 1.5 : 1));
      const before = s.exp ?? expForLevel(gw, s.level); s.exp = Math.min(expForLevel(gw, 100), before + gain); reward.exp += s.exp - before;
      expGainEVs(s, fd?.evs);
    });
    expGrow(run, index, reward, p);
  });
  const hour = new Date().getHours();
  p.rewards.filter(r => r.levels.length).forEach(r => p.pending.push({index: r.index, kind: "evolution", hour}));
  return p;
}
function expEvoCondition(set, method, param, hour) {
  const day = hour >= 6 && hour < 20, level = set.level >= +param, happy = (set.friendship ?? 0) >= 160;
  switch (method) {
    case "Level": return level;
    case "LevelDay": return level && day;
    case "LevelNight": return level && !day;
    case "LevelFemale": return level && set.gender === "F";
    case "LevelMale": return level && set.gender === "M";
    case "Happiness": return happy;
    case "HappinessDay": return happy && day;
    case "HappinessNight": return happy && !day;
    case "HasMove": return set.moves.some(m => toID(m) === toID(param));
    default: return false;
  }
}
function expEvolution(set, hour) {
  for (const [target, method, param] of expData(set.species)?.ev || []) {
    const sp = Dex.species.get(toID(target));
    if (sp.exists && expEvoCondition(set, method, param, hour)) return sp.name;
  }
  return null;
}
// Evolución con objeto (piedras, objetos de intercambio o el Cordón Unión para los que evolucionan al intercambiarse).
function expItemEvo(set, item) {
  for (const [target, method, param] of expData(set.species)?.ev || []) {
    const sp = Dex.species.get(toID(target)); if (!sp.exists) continue;
    if (EXP_EVO_METHODS.includes(method) && toID(param) === item) return sp.name;
    if (item === "linkingcord" && (method === "TradeSpecies" || method === "Trade" || method === "None")) return sp.name;
  }
  return null;
}
function expEvolve(run, index, target) {
  const s = run.team[index], before = Dex.species.get(s.species), after = Dex.species.get(target), oldMax = expMaxHp(s);
  const slot = ["0", "1", "H"].find(k => before.abilities[k] && toID(before.abilities[k]) === toID(s.ability));
  s.ability = after.abilities[slot] || after.abilities["0"]; s.species = after.name; s.teraType = after.types[0];
  if (s.gender !== "N" && after.gender === "N") s.gender = "N";
  if (s.hpNow != null && s.hpNow > 0) s.hpNow = Math.min(expMaxHp(s), s.hpNow + expMaxHp(s) - oldMax);
  return (expData(after.name)?.lv || []).filter(([n]) => n === 0).map(([, m]) => toID(m)).filter(m => Dex.moves.get(m).exists && !s.moves.includes(m));
}
function expAdvanceMoves(run) {
  const p = run.progress; if (!p) return;
  while (p.pending.length) {
    const q = p.pending[0], s = run.team[q.index];
    if (!s) { p.pending.shift(); continue; }
    if (q.kind === "evolution") {
      // Se comprueba después de aprender los ataques, incluido el necesario para HasMove.
      if (!q.target) q.target = expEvolution(s, q.hour);
      if (q.target) break;
      p.pending.shift(); continue;
    }
    if (!s.moves.includes(q.move)) {
      if (s.moves.length >= 4) break;
      s.moves.push(q.move); p.rewards.find(r => r.index === q.index)?.events.push(`aprendió ${esMove(q.move)}`);
    }
    p.pending.shift();
  }
}
function expFinishProgress(run) {
  const p = run.progress; if (!p || p.pending.length) return;
  if (p.bossItems) return;
  run.progress = null;
  if (p.after === "advance") expAdvance(run); else { EXP_VIEW = "bag"; save(); }
}

/* ---------- objetos ---------- */
const expItemKind = id => id in EXP_BALLS ? "ball" : id in EXP_MEDS ? "med" : id === "fullheal" ? "cure" : id === "revive" ? "revive" :
  id === "rarecandy" ? "candy" : EXP_EVO_ITEMS.includes(id) ? "evo" : "held";
function expCanUse(s, id) {
  switch (expItemKind(id)) {
    case "med": return expAlive(s) && expHp(s) < expMaxHp(s);
    case "cure": return expAlive(s) && !!s.status;
    case "revive": return !expAlive(s);
    case "candy": return expAlive(s) && s.level < 100;
    case "evo": return expAlive(s) && !!expItemEvo(s, id);
    case "held": return true;
    default: return false;
  }
}
function expUse(id, index) {
  const run = EXPD().run, s = run?.team[index];
  if (!s || !(run.bag[id] > 0) || !expCanUse(s, id) || run.progress) return;
  const kind = expItemKind(id), name = esSp(s.species);
  run.bag[id]--;
  if (kind === "med") { s.hpNow = Math.min(expMaxHp(s), expHp(s) + EXP_MEDS[id]); run.notice = `${name} recuperó PS.`; }
  else if (kind === "cure") { s.status = ""; run.notice = `${name} ya no tiene problemas de estado.`; }
  else if (kind === "revive") { s.hpNow = Math.floor(expMaxHp(s) / 2); s.status = ""; run.notice = `${name} se recuperó.`; }
  else if (kind === "held") { if (s.item) expAdd(run, toID(s.item)); s.item = id; run.notice = `${name} ahora lleva ${esItem(id)}.`; }
  else {
    // Caramelo Raro y objetos de evolución pasan por la misma pantalla que la EXP de un combate.
    const p = run.progress = {rewards: [{index, species: s.species, exp: 0, levels: [], events: []}], pending: [], after: "stay"};
    if (kind === "candy") {
      const gw = expData(s.species)?.gw; s.exp = Math.max(s.exp ?? 0, expForLevel(gw, s.level + 1));
      expGrow(run, index, p.rewards[0], p); p.pending.push({index, kind: "evolution", hour: new Date().getHours()});
    } else p.pending.push({index, kind: "evolution", target: expItemEvo(s, id), item: id});
    expAdvanceMoves(run);
  }
  EXP_USE = null; if (!run.progress) EXP_VIEW = "bag"; else EXP_VIEW = null;
  save(); renderExp();
}

/* ---------- pantallas ---------- */
function expHpBar(s) {
  const max = expMaxHp(s), hp = Math.max(0, Math.min(max, expHp(s))), pct = hp / max * 100;
  return `<span class="exp-hpw"><span class="hpt"><span class="hpf ${pct <= 20 ? "low" : pct <= 50 ? "mid" : ""}" style="width:${pct}%;display:block"></span></span>
    <small>${hp ? `${hp}/${max} PS` : "Debilitado"}${s.status ? " · " + esc(EXP_STATUS_ES[s.status] || s.status) : ""}${s.item ? " · " + itemIco(s.item) + esc(esItem(s.item)) : ""}</small></span>`;
}
function expMember(s, extra = "") {
  return `<div class="pm exp-pm${expAlive(s) ? "" : " ko"}" style="cursor:default">${setLine(s)}${expHpBar(s)}${extra}</div>`;
}
const expTop = () => `<div class="top"><button class="back" data-act="menu">‹ Menú</button><h1>Expedición</h1><span class="lv" style="font-family:var(--mono);font-size:12px;color:var(--ink3)">Récord ${esc(EXPD().best || 0)}</span></div>`;
function renderExp() {
  const E = EXPD(), r = E.run, top = expTop();
  if (!r) return EXP_NEW.open ? expBuilder(top) : expIntro(top);
  if (r.progress) return expProgress(top, r);
  if (EXP_VIEW === "bag") return expBag(top, r);
  if (EXP_VIEW === "team") return expTeamView(top, r);
  const w = r.wave, zone = expZone(w), step = (w - 1) % 10 + 1;
  const head = `<div class="card"><div class="exp-head"><h3 style="margin:0">Paso ${esc(w)} · ${esc(zone.n)}</h3><b>₽${esc(r.money)}</b></div>
    <div class="exp-steps">${Array.from({length: 10}, (_, i) => `<i class="${i + 1 < step ? "done" : i + 1 === step ? "now" : ""}${i === 9 ? " boss" : ""}"></i>`).join("")}</div>
    <p class="note" style="margin:6px 0 0">Nivel de la zona: ~${esc(expLevel(w))} · Tipos: ${zone.t.map(tchip).join(" ")}</p>
    ${r.notice ? `<p class="exp-notice" role="status">${esc(r.notice)}</p>` : ""}</div>`;
  const teamCard = `<div class="card"><h3>Tu equipo (${r.team.length}/6)</h3><div class="exp-mini">${r.team.map(s => `<span class="exp-mon${expAlive(s) ? "" : " ko"}">${pimg(s.species, `alt="${esc(esSp(s.species))}"`)}<b>${esc(esSp(s.species))} · Nv. ${esc(s.level)}</b>${expHpBar(s)}</span>`).join("")}</div>
    <div class="btns" style="margin-top:8px"><button class="btn" data-act="expteam">Equipo y caja</button><button class="btn" data-act="expbag">Mochila</button></div></div>`;
  let body;
  if (r.battle) body = `<div class="card"><h3>Combate pendiente</h3><p class="note">${r.battle.name ? esc(r.battle.name) + ": " : ""}${r.battle.foes.map(s => `${esc(esSp(s.species))} Nv. ${esc(s.level)}`).join(" / ")}. Al volver se repite este combate desde el inicio.</p>
    <div class="btns"><button class="btn pri" data-act="expfight">Reanudar combate</button></div></div>`;
  else if (r.node?.k === "shop") body = `<div class="card"><h3>Tienda</h3><p class="note">Tienes ₽${esc(r.money)}.</p><div class="exp-shop">${r.node.stock.map(([id, price]) =>
      `<div class="exp-item">${itemIco(id)}<span><b>${esc(esItem(id))}</b> · ₽${esc(price)}<small>${esc(esItemDesc(id))}</small><small>En la mochila: ${esc(r.bag[id] || 0)}</small></span>
      <button class="btn" data-expbuy="${esc(id)}" data-price="${esc(price)}" ${r.money >= price ? "" : "disabled"}>Comprar</button></div>`).join("")}</div>
    <div class="btns" style="margin-top:10px"><button class="btn pri" data-act="expnext">Seguir el camino</button></div></div>`;
  else if (r.node) body = `<div class="card"><h3>${esc(EXP_KINDS[r.node.k].n)}</h3><p>${r.node.item ? itemIco(r.node.item) : ""}${esc(r.node.text)}</p>
    <div class="btns">${r.node.rare ? `<button class="btn pri" data-act="exprare">Combatir</button>` : `<button class="btn pri" data-act="expnext">Seguir el camino</button>`}</div></div>`;
  else body = `<div class="card"><h3>${step === 10 ? "¡El Guardián de la zona te espera!" : "Elige tu camino"}</h3><div class="exp-path">${r.path.map((n, i) => `<button class="exp-node k-${n.k}" data-expgo="${i}">
      <b>${esc(EXP_KINDS[n.k].n)}</b><small>${esc(n.k === "boss" ? `${zone.boss} · ${EXP_KINDS.boss.d}` : EXP_KINDS[n.k].d)}</small>${n.t ? `<span class="exp-types">${n.t.map(tchip).join("")}</span>` : ""}</button>`).join("")}</div></div>`;
  $("app").innerHTML = `${top}<div class="stack">${head}${body}${teamCard}<div class="btns"><button class="btn warn" data-act="expquit">Abandonar expedición</button></div></div>`;
}
function expIntro(top) {
  const E = EXPD();
  const last = E.last ? `<div class="card"><h3>Última expedición</h3><p class="note" style="margin:0 0 8px">Llegaste al paso ${esc(E.last.wave)} · ${esc(E.last.caught)} capturas${E.last.why ? " · " + esc(E.last.why) : ""}</p>${strip(E.last.team.map(sp => ({species: sp})))}</div>` : "";
  $("app").innerHTML = `${top}<div class="stack"><div class="card"><h3>Cómo se juega</h3>
    <p class="note" style="margin:0">Arma tu equipo con <b>${EXP_BUDGET} puntos</b>: cada Pokémon cuesta según su fuerza. En cada paso <b>eliges el camino</b>: Pokémon salvajes que puedes capturar, entrenadores, tiendas, Centros Pokémon o sucesos. Cada 10 pasos te espera un <b>Guardián de zona</b>.</p>
    <p class="note">Los PS y los estados se mantienen entre combates. Tus Pokémon ganan EXP, aprenden movimientos y evolucionan como en los juegos. Si todo tu equipo cae, la expedición termina. Lo que captures queda desbloqueado para tus próximos equipos.</p>
    <p class="note">Pokémon desbloqueados: <b>${esc(expUnlocked().length)}</b> · Expediciones: ${esc(E.runs || 0)}</p>
    <div class="btns" style="margin-top:10px"><button class="btn pri" data-act="expnew">Nueva expedición</button></div></div>${last}</div>`;
}
const expPicksCost = picks => picks.reduce((a, sp) => a + expCost(sp), 0);
function expBuilder(top) {
  const picks = EXP_NEW.picks, left = EXP_BUDGET - expPicksCost(picks);
  $("app").innerHTML = `${top}<div class="stack"><div class="card"><div class="exp-head"><h3 style="margin:0">Arma tu equipo</h3><b>${esc(left)}/${EXP_BUDGET} puntos</b></div>
    <p class="note">Toca para agregar o quitar (máximo 6). Todos empiezan en el nivel ${EXP_START_LEVEL}.</p>
    ${picks.length ? strip(picks.map(sp => ({species: sp}))) : ""}
    <div class="btns" style="margin-top:8px"><button class="btn pri" data-act="expbegin" ${picks.length ? "" : "disabled"}>Empezar expedición</button><button class="btn" data-act="expcancel">Cancelar</button></div></div>
    <div class="card"><div class="exp-grid">${expUnlocked().map(sp => { const c = expCost(sp), on = picks.includes(sp);
      return `<button class="exp-pick" data-exppick="${esc(sp)}" aria-pressed="${on}" ${!on && (c > left || picks.length >= 6) ? "disabled" : ""}>${pimg(sp, `alt="" loading="lazy"`)}<b>${esc(esSp(sp))}</b><small>${c} pt${c === 1 ? "" : "s"}</small></button>`; }).join("")}</div></div></div>`;
}
function expProgress(top, r) {
  const p = r.progress, q = p.pending[0];
  const lines = p.rewards.filter(x => x.exp || x.levels.length || x.events.length).map(x => { const s = r.team[x.index];
    return `<li>${pimg(s.species, 'alt=""')}<span><b>${esc(esSp(s.species))}</b>${x.exp ? ` +${esc(x.exp)} EXP` : ""}${x.levels.length ? ` · ¡sube al nivel ${esc(x.levels[x.levels.length - 1])}!` : ""}${x.events.length ? `<small>${esc(x.events.join(" · "))}</small>` : ""}</span></li>`; }).join("");
  let ask = "";
  if (q && q.kind === "evolution") {
    const s = r.team[q.index];
    ask = `<div class="card exp-evo"><h3>¿Qué? ¡${esc(esSp(s.species))} está evolucionando!</h3><div class="exp-evopair">${pimg(s.species, 'alt=""')}<span>→</span>${pimg(q.target, 'alt=""')}</div>
      <p class="note">Se convertirá en <b>${esc(esSp(q.target))}</b>${q.item ? ` usando ${esc(esItem(q.item))}` : ""}.</p>
      <div class="btns"><button class="btn pri" data-act="expevo">Evolucionar</button><button class="btn" data-act="expnoevo">Cancelar</button></div></div>`;
  } else if (q) {
    const s = r.team[q.index], mv = Dex.moves.get(q.move);
    ask = `<div class="card"><h3>${esc(esSp(s.species))} quiere aprender ${esc(esMove(q.move))}</h3>
      <p class="note">${tchip(mv.type)} ${mv.category !== "Status" ? `Pot. ${esc(mv.basePower || "—")} · ` : ""}${esc(esMoveDesc(q.move))}</p><p class="note">Ya conoce 4 movimientos. ¿Cuál olvida?</p>
      <div class="exp-forget">${s.moves.map((m, i) => { const x = Dex.moves.get(m); return `<button class="btn" data-expforget="${i}">${tchip(x.type)} ${esc(esMove(m))}</button>`; }).join("")}</div>
      <div class="btns" style="margin-top:8px"><button class="btn" data-expforget="-1">No aprender ${esc(esMove(q.move))}</button></div></div>`;
  } else if (p.bossItems) {
    ask = `<div class="card"><h3>Regalo del Guardián</h3><p class="note">Elige un objeto:</p><div class="exp-shop">${p.bossItems.map(id =>
      `<div class="exp-item">${itemIco(id)}<span><b>${esc(esItem(id))}</b><small>${esc(esItemDesc(id))}</small></span><button class="btn" data-expgift="${esc(id)}">Elegir</button></div>`).join("")}</div></div>`;
  }
  $("app").innerHTML = `${top}<div class="stack"><div class="card"><h3>${p.after === "advance" ? "¡Combate ganado!" : "Mochila"}</h3>
    ${p.money ? `<p class="note">Recibiste ₽${esc(p.money)}.</p>` : ""}
    ${p.caught ? `<p class="note">${esc(esSp(p.caught))} se unió ${p.toBox ? "a la caja (tu equipo está completo)" : "a tu equipo"}.${p.unlocked ? ` ¡${esc(esSp(p.unlocked))} queda desbloqueado para tus próximas expediciones!` : ""}</p>` : ""}
    ${lines ? `<ul class="exp-rewards">${lines}</ul>` : ""}
    ${q || p.bossItems ? "" : `<div class="btns"><button class="btn pri" data-act="expdone">Continuar</button></div>`}</div>${ask}</div>`;
}
function expBag(top, r) {
  const items = Object.entries(r.bag).filter(([, n]) => n > 0);
  const use = EXP_USE && r.bag[EXP_USE] > 0 ? EXP_USE : null;
  $("app").innerHTML = `${top}<div class="stack"><div class="card"><div class="exp-head"><h3 style="margin:0">Mochila</h3><b>₽${esc(r.money)}</b></div>
    ${r.notice ? `<p class="exp-notice" role="status">${esc(r.notice)}</p>` : ""}
    ${use ? `<p>¿En quién usas <b>${esc(esItem(use))}</b>?</p><div class="party">${r.team.map((s, i) => `<button class="pm exp-pm" data-expuse="${i}" ${expCanUse(s, use) ? "" : 'aria-disabled="true" disabled'}>${pimg(s.species, 'alt=""')}<span><b>${esc(esSp(s.species))}</b> Nv. ${esc(s.level)}${expHpBar(s)}</span></button>`).join("")}</div>
      <div class="btns" style="margin-top:8px"><button class="btn" data-act="expbag">‹ Volver</button></div>` :
    items.length ? `<div class="exp-shop">${items.map(([id, n]) => `<div class="exp-item">${itemIco(id)}<span><b>${esc(esItem(id))}</b> ×${esc(n)}<small>${esc(esItemDesc(id))}</small></span>
      ${expItemKind(id) === "ball" ? "<small>Se usa en combate</small>" : `<button class="btn" data-expitem="${esc(id)}">${expItemKind(id) === "held" ? "Equipar" : "Usar"}</button>`}</div>`).join("")}</div>` : "<p class=\"note\">La mochila está vacía.</p>"}
    ${use ? "" : `<div class="btns" style="margin-top:10px"><button class="btn pri" data-act="expmap">Volver al camino</button></div>`}</div></div>`;
}
function expTeamView(top, r) {
  $("app").innerHTML = `${top}<div class="stack"><div class="card"><h3>Equipo (${r.team.length}/6)</h3><p class="note">El primero de la lista es el que se sugiere para salir primero (al empezar cada combate puedes elegir).</p>
    <div class="party">${r.team.map((s, i) => expMember(s, `<span class="exp-acts">${i ? `<button class="btn" data-expup="${i}">Poner primero</button>` : `<small style="color:var(--accent);font-weight:600">Sale primero</small>`}
      ${s.item ? `<button class="btn" data-exptake="${i}">Quitar objeto</button>` : ""}${r.team.length > 1 ? `<button class="btn" data-expbox="${i}">A la caja</button>` : ""}</span>`)).join("")}</div></div>
    <div class="card"><h3>Caja (${r.box.length})</h3>${r.box.length ? `<div class="party">${r.box.map((s, i) => expMember(s, `<span class="exp-acts"><button class="btn" data-expteam="${i}" ${r.team.length >= 6 ? "disabled" : ""}>Al equipo</button><button class="btn warn" data-exprelease="${i}">Liberar</button></span>`)).join("")}</div>` : '<p class="note">Los Pokémon que captures con el equipo completo llegan aquí.</p>'}</div>
    <div class="btns"><button class="btn pri" data-act="expmap">Volver al camino</button></div></div>`;
}

document.addEventListener("click", e => {
  if (e.target.closest("[data-info]")) return;
  const t = e.target.closest("button"); if (!t) return;
  const act = t.dataset.act, E = EXPD(), r = E.run;
  if (act === "exp") { if (B) B.dead = true; B = null; EXP_VIEW = null; return go("exp"); }
  if (act === "expnew") { if (B) B.dead = true; B = null; EXP_NEW = {open: true, picks: []}; return go("exp"); }
  if (act === "expthrow") return expThrow(B, t.dataset.ball);
  if (act === "expflee") return expFlee(B);
  if (VIEW !== "exp") return;
  if (act === "expcancel") { EXP_NEW.open = false; return renderExp(); }
  if (t.dataset.exppick) {
    const sp = t.dataset.exppick, i = EXP_NEW.picks.indexOf(sp);
    if (i >= 0) EXP_NEW.picks.splice(i, 1);
    else if (EXP_NEW.picks.length < 6 && expPicksCost(EXP_NEW.picks) + expCost(sp) <= EXP_BUDGET) EXP_NEW.picks.push(sp);
    return renderExp();
  }
  if (act === "expbegin") {
    const picks = EXP_NEW.picks; if (r || !picks.length || expPicksCost(picks) > EXP_BUDGET) return;
    const run = {wave: 1, team: picks.map(sp => expMakeSet(sp, EXP_START_LEVEL)), box: [], money: 1000, bag: {pokeball: 5, potion: 3},
      path: null, node: null, battle: null, progress: null, caught: [], notice: ""};
    run.path = expPath(run); E.run = run; E.runs = (E.runs || 0) + 1; EXP_NEW = {open: false, picks: []}; EXP_VIEW = null; save(); return renderExp();
  }
  if (!r) return;
  if (act === "expquit") { if (!confirm("¿Abandonar esta expedición? Se guarda como terminada.")) return; expGameOver(r, "Abandonada"); return renderExp(); }
  r.notice = "";
  if (t.dataset.expgo != null) return expChoose(+t.dataset.expgo);
  if (act === "expfight") return expFight();
  if (act === "exprare") return expRareFight();
  if (act === "expnext") { if (r.node) expAdvance(r); return renderExp(); }
  if (t.dataset.expbuy) { const id = t.dataset.expbuy, price = +t.dataset.price;
    if (r.node?.k === "shop" && r.node.stock.some(([x, p]) => x === id && p === price) && r.money >= price) { r.money -= price; expAdd(r, id); save(); }
    return renderExp(); }
  if (act === "expbag") { EXP_VIEW = "bag"; EXP_USE = null; return renderExp(); }
  if (act === "expteam") { EXP_VIEW = "team"; return renderExp(); }
  if (act === "expmap") { EXP_VIEW = null; EXP_USE = null; return renderExp(); }
  if (t.dataset.expitem) { const id = t.dataset.expitem; if (r.bag[id] > 0) EXP_USE = id; return renderExp(); }
  if (t.dataset.expuse != null && EXP_USE) return expUse(EXP_USE, +t.dataset.expuse);
  if (t.dataset.expup != null) { const i = +t.dataset.expup; r.team.unshift(r.team.splice(i, 1)[0]); save(); return renderExp(); }
  if (t.dataset.exptake != null) { const s = r.team[+t.dataset.exptake]; if (s?.item) { expAdd(r, toID(s.item)); s.item = ""; save(); } return renderExp(); }
  if (t.dataset.expbox != null) { if (r.team.length > 1) { r.box.push(r.team.splice(+t.dataset.expbox, 1)[0]); save(); } return renderExp(); }
  if (t.dataset.expteam != null) { if (r.team.length < 6) { r.team.push(r.box.splice(+t.dataset.expteam, 1)[0]); save(); } return renderExp(); }
  if (t.dataset.exprelease != null) { const s = r.box[+t.dataset.exprelease]; if (s && confirm(`¿Liberar a ${esSp(s.species)}?`)) { r.box.splice(+t.dataset.exprelease, 1); save(); } return renderExp(); }
  const p = r.progress; if (!p) return;
  const q = p.pending[0];
  if (t.dataset.expforget != null && q && !q.kind) {
    const slot = +t.dataset.expforget, s = r.team[q.index], ev = p.rewards.find(x => x.index === q.index)?.events;
    if (slot >= 0 && s.moves[slot]) { ev?.push(`olvidó ${esMove(s.moves[slot])} y aprendió ${esMove(q.move)}`); s.moves[slot] = q.move; }
    else ev?.push(`no aprendió ${esMove(q.move)}`);
    p.pending.shift(); expAdvanceMoves(r); save(); return renderExp();
  }
  if ((act === "expevo" || act === "expnoevo") && q?.kind === "evolution") {
    p.pending.shift();
    const ev = p.rewards.find(x => x.index === q.index)?.events, from = r.team[q.index].species;
    if (act === "expevo") {
      const moves = expEvolve(r, q.index, q.target); ev?.push(`evolucionó de ${esSp(from)} a ${esSp(q.target)}`);
      p.pending.unshift(...moves.map(m => ({index: q.index, move: m, level: 0})));
    } else { ev?.push("no evolucionó"); if (q.item) expAdd(r, q.item); } // el objeto se descontó al usarlo: se devuelve si se cancela
    expAdvanceMoves(r); save(); return renderExp();
  }
  if (t.dataset.expgift && p.bossItems?.includes(t.dataset.expgift)) { expAdd(r, t.dataset.expgift); delete p.bossItems; save(); return renderExp(); }
  if (act === "expdone") { expFinishProgress(r); return renderExp(); }
});

const expStyle = document.createElement("style");
expStyle.textContent = `
  .exp-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
  .exp-steps{display:flex;gap:4px;margin-top:8px}.exp-steps i{flex:1;height:8px;border-radius:4px;background:var(--surface2)}
  .exp-steps i.done{background:var(--accent)}.exp-steps i.now{background:var(--accent);opacity:.55}.exp-steps i.boss{outline:2px solid #D6264F;outline-offset:1px}
  .exp-notice{margin:8px 0 0;padding:6px 10px;border-radius:8px;background:var(--surface2);font-size:14px}
  .exp-path{display:grid;gap:8px}
  .exp-node{display:grid;gap:3px;text-align:left;padding:12px 14px;border-radius:12px;border:2px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;cursor:pointer}
  .exp-node:hover{border-color:var(--accent)}.exp-node b{font-family:var(--display);font-size:17px}.exp-node small{color:var(--ink2)}
  .exp-node.k-boss{border-color:#D6264F}.exp-node.k-center{border-color:#E86A8E}.exp-node.k-shop{border-color:#3A7BD5}.exp-node.k-mystery{border-color:#9B59D0}.exp-node.k-trainer{border-color:#E0A800}
  .exp-types{display:flex;gap:4px}
  .exp-mini{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
  .exp-mon{display:grid;grid-template-columns:44px 1fr;gap:2px 6px;align-items:center;font-size:13px}.exp-mon img,.exp-mon .ico{width:44px;height:44px;grid-row:span 2}
  .exp-mon.ko,.exp-pm.ko{opacity:.6}
  .exp-hpw{display:grid;gap:2px;grid-column:1/-1;font-size:12px}.exp-mon .exp-hpw{grid-column:2}.exp-hpw .hpt{display:block;height:6px}
  .exp-hpw .itm{width:18px;height:18px;vertical-align:middle}
  .exp-acts{grid-column:1/-1;display:flex;gap:6px;flex-wrap:wrap;align-items:center}.exp-acts .btn{padding:5px 12px;font-size:12px}
  .exp-shop{display:grid;gap:8px}
  .exp-item{display:grid;grid-template-columns:32px 1fr auto;gap:8px;align-items:center;padding:8px;border:1px solid var(--line);border-radius:10px}
  .exp-item small{display:block;color:var(--ink2);font-size:12px}.exp-item .itm{width:32px;height:32px}
  .exp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px}
  .exp-pick{display:grid;justify-items:center;gap:2px;padding:6px 4px;border:2px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font:inherit;cursor:pointer}
  .exp-pick img,.exp-pick .ico{width:56px;height:56px}.exp-pick b{font-size:12px;text-align:center}.exp-pick small{color:var(--ink2)}
  .exp-pick[aria-pressed="true"]{border-color:var(--accent);background:var(--surface2)}.exp-pick:disabled{opacity:.4;cursor:default}
  .exp-rewards{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}.exp-rewards li{display:flex;gap:8px;align-items:center}
  .exp-rewards img,.exp-rewards .ico{width:40px;height:40px;flex:none}.exp-rewards small{display:block;color:var(--ink2)}
  .exp-evopair{display:flex;align-items:center;justify-content:center;gap:12px;font-size:24px}.exp-evopair img,.exp-evopair .ico{width:80px;height:80px}
  .exp-forget{display:grid;grid-template-columns:1fr 1fr;gap:6px}
  .exp-ballbtn .itm{width:22px;height:22px;vertical-align:middle;margin-right:2px}
  .exp-ball{position:absolute;width:32px;height:32px;z-index:6;pointer-events:none;background-size:contain;background-repeat:no-repeat;image-rendering:pixelated;transform-origin:50% 80%}
  .exp-ball.done{filter:brightness(.75)}
  .mon.exp-absorbed{opacity:0;transform:scale(.15)}
`;
document.head.appendChild(expStyle);
