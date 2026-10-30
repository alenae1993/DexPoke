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
const SIN_GRUNTS = SIN_CARDS.filter(c => c.d?.encounter_tier === "Grunt");
const SIN_GRUNT_LEVELS = [9, 12];
const SIN_COMMANDER_LEVELS = [[16, 18], [20, 22], [24, 26]];
const SIN_BOSS_LEVELS = [36, 40];
const SIN_ARCEUS_LEVEL = 42;
const SIN_COMMANDERS = [
  {id: "emotion", name: "Comandante Venus", article: "la", fragment: "Fragmento de la Emoción", lake: "Lago Veraz", token: "Lake Verity Battle"},
  {id: "knowledge", name: "Comandante Ceres", article: "la", fragment: "Fragmento del Conocimiento", lake: "Lago Agudeza", token: "Lake Acuity Battle"},
  {id: "willpower", name: "Comandante Saturno", article: "el", fragment: "Fragmento de la Voluntad", lake: "Lago Valor", token: "Lake Valor Battle"}
];
// El orden se comprobó mirando los frentes de las cinco cartas del mod.
const SIN_ACTS = [
  {img: "c373600", name: "Prólogo · La Incursión", objective: "Elige tu pueblo natal y tu inicial para comenzar el viaje."},
  {img: "c373601", name: "Acto I · El Viaje", objective: "Derrota a los 2 Reclutas del Equipo Galaxia de tu pueblo natal."},
  {img: "c373602", name: "Acto II · Los Fragmentos", objective: "Derrota a los Comandantes del Equipo Galaxia en los tres lagos para recoger los fragmentos."},
  {img: "c373603", name: "Acto III · El Corazón", objective: "Restaura el Corazón en el Santuario Origin y derrota a Helio en el Templo de Sinnoh."},
  {img: "c373604", name: "Final · La Elección", objective: "Elige el destino del Corazón de Sinnoh."}
];
const SIN_GRUNT_IMAGE = SIN.tokens.find(t => /galact|galaxi|grunt/i.test(t.n) && SIN.img[t.img])?.img;
const SIN_FATE = SIN_CARDS.filter(c => (c.tags || []).includes("Change of Fate Card"));
const SIN_FATE_GODS = {dialga: "c373300", palkia: "c373301", giratina: "c373302", arceus: "c373303"};
const SIN_GODS = {
  dialga: {species: "Dialga", artifact: "adamantorb"},
  palkia: {species: "Palkia", artifact: "lustrousorb"},
  giratina: {species: "Giratina", artifact: "griseousorb"}
};
const SIN_GOD_LEVEL = 50;
// Tabla contrastada con los 15 frentes: las copias conservan su índice físico (35 cartas).
const SIN_SHRINE_EFFECTS = {
  c373200: {name: "Una Canción de Hielo", kind: "legend", species: "Articuno", shrine: "Frostsong Shrine", color: "blue", amount: 3},
  c373201: {name: "Una Canción de Trueno", kind: "legend", species: "Zapdos", shrine: "Thundersong Shrine", color: "yellow", amount: 3},
  c373202: {name: "Una Canción de Fuego", kind: "legend", species: "Moltres", shrine: "Firesong Shrine", color: "red", amount: 3},
  c373203: {name: "Un Visitante de Lejos", kind: "legend", species: "Celebi", shrine: "Timeless Shrine", color: "green", amount: 2},
  c373204: {name: "Una Sombra Emerge", kind: "legend", species: "Darkrai", shrine: "Moonglade Shrine", color: "black", amount: 1},
  c373205: {name: "Un Faro de Luz", kind: "legend", species: "Cresselia", shrine: "Moonglade Shrine", color: "pink", amount: 2},
  c373206: {name: "Un Gigante Despierta", kind: "legend", species: "Regigigas", shrine: "Colossus Shrine", color: "white", amount: 2},
  c373207: {name: "Fractura Celestial", kind: "fracture"},
  c382800: {name: "Experiencia Predestinada", kind: "fate"},
  c382801: {name: "Tesoro Oculto · Bonguri", kind: "bonguri"},
  c382802: {name: "Intercambio Equivalente", kind: "exchange"},
  c382803: {name: "Sabiduría Antigua", kind: "wisdom"},
  c382804: {name: "Banquete Espléndido", kind: "feast"},
  c382805: {name: "Tesoro Oculto · Balls", kind: "ball"},
  c382806: {name: "Momento Relajante", kind: "pv"}
};
const SIN_SHRINE_CARDS = SIN_CARDS.filter(c => c.tags?.includes("Shrine Card"));
const SIN_LEGEND_CARDS = SIN_CARDS.filter(c => c.d?.encounter_tier === "Legendary");
const SIN_LEGEND_LEVEL = 40;
const SIN_LEGEND_LEVELS = {regigigas: 45, mesprit: 35, uxie: 35, azelf: 35, silvally: 45};
const SIN_LEGEND_REQUIREMENTS = {
  manaphy: {artifacts: ["Seafarer Egg"]}, heatran: {artifacts: ["Magma Stone"]},
  spiritomb: {artifacts: ["Odd Keystone"]}, rotom: {artifacts: ["Secret Key"]}, shaymin: {artifacts: ["Gracidea Flower"]},
  regirock: {artifacts: ["Rockice Core", "Steelrock Core"]}, regice: {artifacts: ["Rockice Core", "Icesteel Core"]},
  registeel: {artifacts: ["Icesteel Core", "Steelrock Core"]},
  mesprit: {fragment: "emotion"}, uxie: {fragment: "knowledge"}, azelf: {fragment: "willpower"}, silvally: {boss: true}
};
const sinBonguriGrade = color => color === "black" ? 3 : ["pink", "green", "white"].includes(color) ? 2 : ["red", "yellow", "blue"].includes(color) ? 1 : 0;
const sinLegendCard = species => SIN_LEGEND_CARDS.find(c => toID(c.d.sp) === toID(species));
const SIN_GINKGO = SIN.decks.find(d => d.cards.length === 9 && d.cards.every(c => !c.n && !c.tags?.length)).cards;
const SIN_TRADES = [
  [[{yellow: 1, red: 1}, {pink: 1}], [{green: 1, white: 1}, {black: 1}]],
  [[{blue: 1, yellow: 1}, {green: 1}], [{white: 1, pink: 1}, {black: 1}]],
  [[{red: 1, blue: 1}, {white: 1}], [{pink: 1, green: 1}, {black: 1}]],
  [[{pink: 1}, {red: 1, blue: 1, yellow: 1}], [{black: 1}, {pink: 1, green: 1, white: 1}]],
  [[{green: 1}, {red: 1, blue: 1, yellow: 1}], [{black: 1}, {pink: 1, green: 1, white: 1}]],
  [[{white: 1}, {red: 1, blue: 1, yellow: 1}], [{black: 1}, {pink: 1, green: 1, white: 1}]],
  [[{red: 2}, {blue: 1, yellow: 1}], [{pink: 2}, {green: 1, white: 1}]],
  [[{blue: 2}, {yellow: 1, red: 1}], [{green: 2}, {white: 1, pink: 1}]],
  [[{yellow: 2}, {red: 1, blue: 1}], [{white: 2}, {pink: 1, green: 1}]]
];
const sinNextGinkgo = previous => {
  const choices = SIN_GINKGO.map((_, i) => i).filter(i => i !== previous);
  return choices[Math.floor(Math.random() * choices.length)] ?? previous;
};
const SIN_ARTIFACTS = {
  "Seafarer Egg": {name: "Huevo Marino", types: ["Psychic", "Water"]},
  "Odd Keystone": {name: "Piedra Espíritu", types: ["Dark", "Ghost"]},
  "Magma Stone": {name: "Piedra Magma", types: ["Fire", "Ground"]},
  "Secret Key": {name: "Llave Secreta", types: ["Ghost", "Electric"]},
  "Gracidea Flower": {name: "Gracídea", types: ["Grass", "Flying"], id: Dex.data.Items.gracidea ? "gracidea" : null},
  "Rockice Core": {name: "Núcleo Rockice", types: ["Rock", "Ice"]},
  "Icesteel Core": {name: "Núcleo Icesteel", types: ["Ice", "Steel"]},
  "Steelrock Core": {name: "Núcleo Steelrock", types: ["Steel", "Rock"]},
  "Adamant Artifact": {name: "Diamansfera", id: "adamantorb"},
  "Lustrous Artifact": {name: "Lustresfera", id: "lustrousorb"},
  "Griseous Artifact": {name: "Griseosfera", id: "griseousorb"}
};
Object.values(SIN_ARTIFACTS).forEach((item, i) => {
  if (item.id) return;
  // El nombre y su ID coinciden con la normalización del motor, incluso con tildes.
  item.id = toID(item.name);
  Dex.data.Items[item.id] = {name: item.name, num: -9001 - i, gen: 9, onBasePowerPriority: 15,
    onBasePower(bp, user, target, move) {
      if (item.types.includes(move.type)) return this.chainModify([4915, 4096]);
    }};
});
Dex.data.Items.heartofsinnoh = {name: "Corazón de Sinnoh", num: -9020, gen: 9, onBasePowerPriority: 15,
  onBasePower(bp, user, target, move) {
    if (user.hasType(move.type)) return this.chainModify([4915, 4096]);
  }};
// El motor deriva el ID del nombre: se conserva el ID inglés del guardado.
Dex.items.get("heartofsinnoh").id = "heartofsinnoh";
Dex.data.Items[toID("Corazón de Sinnoh")] = Dex.data.Items.heartofsinnoh;
Dex.items.itemCache.set(toID("Corazón de Sinnoh"), Dex.items.get("heartofsinnoh"));
const sinItemName = id => toID(id) === "heartofsinnoh" ? "Corazón de Sinnoh" : Object.values(SIN_ARTIFACTS).find(item => item.id === toID(id))?.name || esItem(id);
const SIN_HIDDEN = SIN.tokens.map((t, i) => t.kind === "CardCustom" && t.cell ? i : -1).filter(i => i >= 0);
const sinHiddenSpecial = t => (t.tags || []).includes("Artifact Token");
function sinShuffleHidden() {
  const hidden = {}, amounts = {};
  [false, true].forEach(special => {
    const positions = SIN_HIDDEN.filter(i => sinHiddenSpecial(SIN.tokens[i]) === special);
    const contents = shuffle(positions.slice()).map(token => {
      const t = SIN.tokens[token], stash = /^(\w+) Apricorn Stash$/.exec(t.n);
      if (stash && !amounts[stash[1]]) amounts[stash[1]] = shuffle([1, 2, 3]);
      return {token, revealed: false, present: true, ...(stash ? {amount: amounts[stash[1]].pop()} : {})};
    });
    positions.forEach((i, j) => { hidden[SIN.tokens[i].cell.join(",")] = contents[j]; });
  });
  return hidden;
}
function sinDrawFate(run, count) {
  let drawn = 0, lost = 0, empty = 0;
  for (let i = 0; i < count; i++) {
    if (!run.fateDeck.length && run.fateDiscard.length) run.fateDeck = shuffle(run.fateDiscard.splice(0));
    const key = run.fateDeck.pop();
    if (!key) { empty++; continue; }
    if (run.fate.length < 5) { run.fate.push(key); drawn++; }
    else { run.fateDiscard.push(key); lost++; }
  }
  return [drawn ? `Robaste ${drawn} ${drawn === 1 ? "carta" : "cartas"} de Destino.` : "",
    lost ? `La mano está llena (5 cartas): se ${lost === 1 ? "descartó 1 carta sobrante" : `descartaron ${lost} cartas sobrantes`}.` : "",
    empty ? "El mazo de Destino está agotado." : ""].filter(Boolean).join(" ");
}
// La ficha no se descarta; para Juega 3 sustituye una sola carta de su Dios.
function sinFatePayment(run, god, count) {
  if (!run || run.fatePlayed || !SIN_FATE_GODS[god] || ![1, 3].includes(count) || (god === "arceus" && count === 1)) return null;
  const needed = count === 3 && run.follower === god ? 2 : count;
  const native = run.fate.map((key, i) => key === SIN_FATE_GODS[god] ? i : -1).filter(i => i >= 0);
  const wild = count === 3 && god !== "arceus" ? run.fate.map((key, i) => key === SIN_FATE_GODS.arceus ? i : -1).filter(i => i >= 0) : [];
  const indices = [...native, ...wild].slice(0, needed);
  return indices.length === needed ? indices : null;
}
function sinSpendFate(run, god, count) {
  const payment = sinFatePayment(run, god, count); if (!payment) return false;
  payment.sort((a, b) => b - a).forEach(i => run.fateDiscard.push(...run.fate.splice(i, 1)));
  run.fatePlayed = true; return true;
}
function sinChooseFollower(god) {
  const run = ST.sin.run, e = run?.shrineEvent;
  if (!SIN_GODS[god] || !e?.followerPending || e.done) return;
  run.follower = god; run.originGod = god; e.followerPending = false; e.done = true;
  e.message += ` Sigues a ${SIN_GODS[god].species}, que ocupa el Santuario Origin. Ganas +1 movimiento por turno mientras esté allí.`;
  sinSave(); sinShrineScreen();
}
const sinGodAura = (run, god) => !!SIN_GODS[god] &&
  ![...run.items, ...run.team.map(s => s.item), ...run.box.map(s => s.item)].some(id => toID(id) === SIN_GODS[god].artifact);
function sinSeekGod() {
  const run = ST.sin.run, god = run?.originGod;
  if (!sinMapAction(run) || !SIN_GODS[god] || !sinAtToken(run, "Origin Shrine") || run.fought || run.searched || !run.team.some(sinAlive)) return;
  const species = SIN_GODS[god].species, card = sinLegendCard(species);
  run.searched = true;
  run.offer = {cards: [{species, img: card?.img || SIN_FATE_GODS[god], level: SIN_GOD_LEVEL}],
    legend: {species, god, phase: 1, aura: sinGodAura(run, god)}, place: "Santuario Origin", meta: "Dios de Sinnoh", closed: false};
  sinSave(); renderSin();
}
function sinFateHTML(run) {
  return `<h2>Seguidor</h2><p>${run.follower ? `Sigues a ${esc(SIN_GODS[run.follower].species)}. Tu ficha cuenta como una carta de ese Dios para Juega 3 y se conserva.` : "Ficha boca abajo. Elegirás tu Dios en la primera Fractura Celestial."}</p>
    ${run.follower ? `<div class="sin-fate">${sinCardImage(SIN_FATE_GODS[run.follower], "Seguidor de " + SIN_GODS[run.follower].species)}</div>` : ""}
    ${run.originGod ? `<p>${esc(SIN_GODS[run.originGod].species)} ocupa el Santuario Origin${run.follower === run.originGod ? ": +1 movimiento por turno" : ""}.</p>` : ""}
    <h2>Destino (${esc(run.fate.length)}/5) · Estrellas: ${esc(run.stars)}</h2>
    <p>Un efecto por turno${run.fatePlayed ? " (ya usado)" : ""}. Arceus es comodín para Juega 3. Por cada 4 estrellas robas una carta al terminar el turno.</p>
    <div class="sin-fate">${run.fate.map(key => sinCardImage(key, Object.keys(SIN_FATE_GODS).find(g => SIN_FATE_GODS[g] === key))).join("") || "<p>No tienes cartas de Destino.</p>"}</div>
    <p>Dialga ×1: repite una captura fallida. Dialga Juega 3: repite una derrota. Giratina ×1/Juega 3: sacrifica PS por aumentos de estadísticas en combate.</p>
    <div class="btns">${[1, 3].map(count => `<button class="btn" data-act="sinfate" data-god="palkia" data-count="${count}" ${sinMapAction(run) && sinFatePayment(run, "palkia", count) ? "" : "disabled"}>Palkia ${count === 1 ? "×1: hasta 3 casillas" : "Juega 3: todo el mapa"}</button>`).join("")}
    <button class="btn" data-act="sinfate" data-god="arceus" data-count="3" ${sinCanMapFate(run, "arceus") && run.campaign === "heart" && sinFatePayment(run, "arceus", 3) ? "" : "disabled"}>Arceus Juega 3: curar y revivir equipo</button></div>`;
}
const sinCanMapFate = (run, god) => sinMapAction(run) || !!(god === "arceus" && VIEW === "sin" && SIN_VIEW && run &&
  !run.battle && !run.progress && !run.shrineEvent && !run.fateTeleport && !(run.offer && !run.offer.closed));
function sinPlayMapFate(god, count) {
  const run = ST.sin.run;
  if (!sinCanMapFate(run, god) || !sinFatePayment(run, god, count)) return;
  if (god === "palkia") {
    run.fateTeleport = {count}; run.notice = "Palkia: toca una casilla resaltada para teletransportarte. Las cartas se descartan al elegir el destino.";
  } else if (god === "arceus" && count === 3 && run.campaign === "heart") {
    sinSpendFate(run, god, count); run.team.forEach(s => { delete s.hpNow; delete s.status; });
    run.revive = false;
    run.notice = "¡Bendición de Arceus! Todo tu equipo está curado y revivido.";
  } else return;
  sinSave(); sinUpdateTurn();
}
function sinTeleportCells(run) {
  const selection = run.fateTeleport; if (!selection) return new Map();
  return new Map(SIN_CELLS.filter(h => {
    const dc = Math.abs(h.c - run.pos[0]), dr = Math.abs(h.r - run.pos[1]);
    return (dc || dr) && (selection.count === 3 ? !h.dw : Math.max(dc, (dc + dr) / 2) <= 3);
  }).map(h => [h.c + "," + h.r, 1]));
}
function sinTeleportTo(key) {
  const run = ST.sin.run;
  if (!run?.fateTeleport || !SIN_VIEW || run.battle || run.progress || run.shrineEvent || run.revive || !sinTeleportCells(run).has(key)) return;
  if (!sinSpendFate(run, "palkia", run.fateTeleport.count)) return;
  const h = SIN_BY_CELL.get(key), messages = ["¡Palkia te teletransportó sin gastar movimientos!"];
  delete run.fateTeleport; run.pos = [h.c, h.r]; sinRevealHidden(run, key, messages);
  run.notice = messages.join(" "); ST.sin.cam = null; sinSave(); renderSin();
}
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
  ultra: {name: "Ultra Ball", bonus: 2, recipe: {black: 1, yellow: 1}},
  spirit: {name: "Spirit Ball", bonus: 2.5, recipe: {black: 2, pink: 1, white: 1}}
};
const SIN_STEWS = {
  restoring: {name: "Estofado Restaurador", recipe: {yellow: 1, blue: 1}, effect: "Cura por completo a todo tu equipo."},
  captivating: {name: "Estofado Cautivador", recipe: {green: 1, red: 1}, effect: "El primer intento de captura del próximo combate salvaje recibe bono de estado ×1,5 si no tiene estado."},
  tasty: {name: "Estofado Sabroso", recipe: {white: 1, yellow: 1}, effect: "+3 movimientos este turno. Los Alfa revelados este turno no obligan a combatir."},
  infused: {name: "Estofado Infundido", recipe: {pink: 1, white: 1}, effect: "Un Pokémon del equipo sube 1 nivel y puede aprender ataques y evolucionar."}
};
SIN_BALLS.glory = {name: "Gloria Ball", bonus: 1e6, recipe: null};
SIN_STEWS.master = {name: "Estofado Maestro", recipe: {red: 1, yellow: 1, blue: 1, pink: 1, green: 1, white: 1, black: 1}, effect: "En el próximo combate, los movimientos del mismo tipo que el usuario son un 20 % más fuertes."};
const SIN_CRAFT_ITEMS = {
  rockyhelmet: {name: "Cristal Explosivo", recipe: {red: 3, yellow: 2, black: 1}},
  focussash: {name: "Escudo Estrella", recipe: {blue: 3, pink: 2, black: 1}},
  luckyegg: {name: "Huevo Suerte", recipe: {yellow: 3, green: 2, black: 1}},
  eviolite: {name: "Mineral Evol", recipe: {pink: 3, white: 2, black: 1}},
  quickclaw: {name: "Cinta Veloz", recipe: {green: 3, blue: 2, black: 1}},
  choiceband: {name: "Cinta Elección", recipe: {white: 3, red: 2, black: 1}}
};
// Showdown omite este objeto sin efecto en combate; la EXP se calcula en Sinnoh.
if (!Dex.data.Items.luckyegg) Dex.data.Items.luckyegg = {name: "Lucky Egg", num: 231, gen: 2};
const sinEmptyBag = () => Object.fromEntries(Object.keys(SIN_BONGURI).map(k => [k, 0]));
const sinStartingBalls = () => ({poke: 3, great: 0, ultra: 0, spirit: 0});
const SIN_EXP_SHARE = .5;
// Regla del juego de mesa: enseñar el movimiento de la carta del salvaje debilitado. Se activa al replicar el juego original.
const SIN_SIGNATURE_TEACH = false;
const SIN_STAMPS = [
  "Fallar la captura de un Pokémon salvaje en 2 turnos seguidos del mismo combate.",
  "Ganar contra otro entrenador o un Ultraente (Reclutas, Comandantes o Helio en solitario).",
  "Tener al menos 1 Bonguri de cada color en la Bolsa.",
  "Haber capturado un Pokémon Legendario.",
  "Tener 3 o más objetos equipados en el equipo.",
  "Ganar una Batalla Enjambre.",
  "Tener 3 cartas de Cambio de Destino diferentes en la mano."
];
const SIN_STAMP_REWARDS = ["1 Rojo + 1 Azul + 1 Amarillo", "5 cartas Débiles (MT reutilizables)",
  "1 Rosa + 1 Verde + 1 Blanco", "5 cartas Moderadas (MT reutilizables)", "3 Bonguri Negros",
  "5 cartas Fuertes (MT reutilizables)", "Pergamino de Nobleza (un solo Pokémon)"];
/* ---------- Tarjetas de Entrenador ----------
   El reglamento no las explica (interpretación de Claude, confirmada por el dueño): al empezar se roban 3 y se elige 1.
   La habilidad azul se desbloquea al derrotar u obtener un Pokémon Moderado; la roja, con un Fuerte, Alfa o legendario.
   Cada habilidad guarda su texto original (t) y su adaptación (a). "fx" son efectos fuera de combate y "perks" efectos
   de combate que se aplican como una condición de lado propia del motor ("sinperks"). Sin fx ni perks = sin efecto. */
const SIN_TRAINER_CARDS = SIN.decks.find(d => (d.tags || []).includes("Trainer Card"))?.cards || [];
const SIN_SOLO = "Sin efecto: requiere otros entrenadores.";
const SIN_DICE = "Sin efecto: depende de los dados del juego de mesa.";
const SIN_TRAINERS = [
  {n: "Criador Pokémon", blue: {name: "Movimiento Huevo", t: "Al evolucionar un Pokémon Débil, puedes enseñarle el movimiento de su preevolución como Movimiento Huevo. Ya no puede evolucionar.", a: "Sin efecto: los movimientos ya se aprenden como en los juegos."},
    red: {name: "IVs Casi Perfectos", t: "Tus Pokémon con Movimiento Huevo ganan +5 de vida y +5 de iniciativa.", a: "Tus Pokémon Débiles entran con +1 Defensa, +1 Def. Esp. y +1 Velocidad.", perks: [{k: "boost", tier: "W", boosts: {def: 1, spd: 1, spe: 1}}]}},
  {n: "Patinadora", blue: {name: "Patinaje sobre Ruedas", t: "Una vez por turno, hasta 2 casillas de Llanura gratis. Los salvajes no legendarios solo huyen tras derrotar a dos de tus Pokémon.", a: "+2 movimientos en los turnos que empiezas en Llanura. Los salvajes huyen solo tras debilitar a dos de tus Pokémon.", fx: {biome: "Plains", flee2: true}},
    red: {name: "Equipo de Protección", t: "Tus Pokémon pueden recibir como máximo 6 de daño de un solo ataque.", a: "Ningún ataque quita más de la mitad de los PS máximos de golpe.", perks: [{k: "maxHit", frac: .5}]}},
  {n: "Pokéfan", blue: {name: "Gran Encanto", t: "Tus Pokémon Débiles pueden recibir como máximo 3 de daño de un solo ataque.", a: "Ningún ataque quita a tus Pokémon Débiles más del 30 % de sus PS máximos de golpe.", perks: [{k: "maxHit", frac: .3, tier: "W"}]},
    red: {name: "Carta de Fidelidad", t: "Al fabricar un Objeto de Batalla, puedes ganar otro gratis.", a: "Fabricar un objeto de batalla da dos.", fx: {craftTwice: true}}},
  {n: "Dominguera", blue: {name: "Explorador del Bosque", t: "Una vez por turno, hasta 2 casillas de Bosque gratis. Puedes volar a los Campamentos desde cualquier casilla descartando 1 Bonguri.", a: "+2 movimientos en los turnos que empiezas en Bosque. (El vuelo a Campamentos no se incluye.)", fx: {biome: "Forest"}},
    red: {name: "Cesta de Pícnic", t: "Al elaborar un estofado de Bonguri, puedes obtener el efecto de otro estofado gratis.", a: "Al elaborar un estofado, recibes un estofado gratis para usar este turno.", fx: {picnic: true}}},
  {n: "Nadador", blue: {name: "Nadar Rápido", t: "Una vez por turno, hasta 2 casillas de Océano gratis. Tus Pokémon de tipo Agua ganan +1 de iniciativa.", a: "+2 movimientos en los turnos que empiezas en Océano. Tus Pokémon Agua entran con +1 Velocidad.", fx: {biome: "Ocean"}, perks: [{k: "boost", types: ["Water"], boosts: {spe: 1}}]},
    red: {name: "Técnica de la Mariposa", t: "Al atacar con un movimiento de tipo Agua, puedes cambiarlo a tipo Bicho o Volador.", a: "Tus movimientos Agua son un 20 % más fuertes contra Pokémon Planta (adaptación).", perks: [{k: "typePow", types: ["Water"], m: 1.2, vsType: "Grass"}]}},
  {n: "Soldado Equipo Rocket", blue: {name: "Ladrón de Pokémon", t: "En combate con otro entrenador, puedes intentar capturar su Pokémon con −2 a tus tiradas de captura.", a: "Sin efecto: no se capturan Pokémon de entrenadores."},
    red: {name: "Retribución", t: "Cuando uno de tus Pokémon se desmaya, inflige 2 de daño al rival. Si te quedas sin Pokémon, puedes viajar a cualquier casilla.", a: "Cuando uno de tus Pokémon se debilita, el rival activo pierde 1/8 de sus PS.", perks: [{k: "retribution"}]}},
  {n: "Triatleta", blue: {name: "Nadar, Pedalear y Correr", t: "Una vez por turno, hasta 2 casillas no montañosas gratis.", a: "+2 movimientos en los turnos que no empiezas en Montaña.", fx: {biome: "!Mountain"}},
    red: {name: "Triple Amenaza", t: "Si tu Pokémon conoce movimientos de 3 tipos, puede cambiar el tipo de su ataque a cualquiera de ellos.", a: SIN_DICE}},
  {n: "Señorita Aroma", blue: {name: "Dulce Aroma", t: "En las capturas en Árboles de Bonguri, 1 símbolo de estado cuenta como golpe normal.", a: "Las capturas de salvajes de Árboles de Bonguri tienen ratio ×1,5.", fx: {catchTree: 1.5}},
    red: {name: "Remedio Natural", t: "Con un movimiento Planta o Hada, el usuario se cura la mitad del daño infligido.", a: "Igual: tus movimientos Planta y Hada curan la mitad del daño causado.", perks: [{k: "drain", types: ["Grass", "Fairy"]}]}},
  {n: "Modelo", blue: {name: "Dama Afortunada", t: "Los golpes críticos hacen +2 de daño y los símbolos de estado −1.", a: "Tus Pokémon tienen +1 nivel de golpe crítico.", perks: [{k: "crit"}]},
    red: {name: "Carisma Natural", t: "Con movimientos Normal o Siniestro, los símbolos de estado infligen +1 de daño.", a: "Tus movimientos Normal y Siniestro son un 20 % más fuertes.", perks: [{k: "typePow", types: ["Normal", "Dark"], m: 1.2}]}},
  {n: "Pokéabu", blue: {name: "Guardián del Santuario", t: "Al hacer una Ofrenda de Santuario, roba 1 carta de Evento extra.", a: "Cada ofrenda da además 2 PV (adaptación).", fx: {shrinePV: 2}},
    red: {name: "Protector Legendario", t: "Cuando se activa Ultraimpulso, tus legendarios se curan 3 y su siguiente ataque gana +2.", a: "Tus Pokémon legendarios entran con +1 Ataque y +1 Ataque Especial.", perks: [{k: "boost", tier: "L", boosts: {atk: 1, spa: 1}}]}},
  {n: "Domadragón", blue: {name: "Cría Suprema", t: "Al desbloquear, añade un Pokémon Débil de tipo Dragón del mazo con el objeto Dragón Supremo (no se desequipa).", a: "Al desbloquear, recibes un Pokémon Débil de tipo Dragón marcado como Dragón Supremo.", fx: {dragon: true}},
    red: {name: "Fuerza Máxima", t: "Tu Dragón Supremo gana +6 de vida, +2 de iniciativa y +1 de fuerza en todos sus movimientos.", a: "Tu Dragón Supremo entra con +1 Defensa, +1 Def. Esp. y +2 Velocidad y pega un 20 % más fuerte.", perks: [{k: "boost", dragon: true, boosts: {def: 1, spd: 1, spe: 2}}, {k: "typePow", dragon: true, types: "all", m: 1.2}]}},
  {n: "Bruja", blue: {name: "Magia Inestable", t: "Al infligir un estado, puedes tirar el dado de estado para infligir otro en su lugar.", a: SIN_DICE},
    red: {name: "Lanzador de Hechizos", t: "Puedes infligir estados adicionales. Tus movimientos Fantasma +1 de fuerza.", a: "Tus movimientos Fantasma son un 20 % más fuertes.", perks: [{k: "typePow", types: ["Ghost"], m: 1.2}]}},
  {n: "Periodistas", blue: {name: "Gran Primicia", t: "Cuando otro entrenador obtiene un Sello de Viaje, puedes desafiarlo y ganarlo.", a: SIN_SOLO},
    red: {name: "Análisis del Equipo", t: "Fuera de combate, intercambia movimientos enseñados entre tus Pokémon.", a: "Sin efecto: los movimientos se aprenden como en los juegos."}},
  {n: "Médium", blue: {name: "Alcance Telequinético", t: "Una vez por turno, interactúa con algo a hasta 2 casillas.", a: "Sin efecto en esta versión."},
    red: {name: "Manipulación Sutil", t: "Con un movimiento Psíquico o Fantasma, cambia el resultado de 1 dado.", a: "Tus movimientos Psíquico y Fantasma son un 20 % más fuertes.", perks: [{k: "typePow", types: ["Psychic", "Ghost"], m: 1.2}]}},
  {n: "Veterana", blue: {name: "Experto Silvestre", t: "Al encontrar un Depósito de Bonguri, ganas 2 Bonguri adicionales del mismo tipo y 1 movimiento más este turno.", a: "Igual.", fx: {stash: true}},
    red: {name: "Fuerza Vendaval", t: "Con un movimiento Hielo o Dragón, añade hasta 2 símbolos de estado.", a: "Tus movimientos Hielo y Dragón son un 20 % más fuertes.", perks: [{k: "typePow", types: ["Ice", "Dragon"], m: 1.2}]}},
  {n: "Artista", blue: {name: "Esquema Detallado", t: "Tras derrotar a un salvaje, enseña su movimiento a cualquier Pokémon del equipo.", a: "Sin efecto: el dueño desactivó aprender el movimiento del Pokémon derrotado."},
    red: {name: "Obra Maestra", t: "Si tu grupo tiene un movimiento de cada tipo, todos tus movimientos +2 de fuerza.", a: "Si tu equipo conoce movimientos de 12 tipos o más, todos tus movimientos son un 30 % más fuertes.", perks: [{k: "masterpiece"}]}},
  {n: "Jardinero", blue: {name: "Elección de Bonguri", t: "Una vez por turno, obtén un Bonguri del Árbol de Bonguri en el que estés.", a: "Igual.", fx: {pick: true}},
    red: {name: "Forma Recortada", t: "Tus Pokémon Planta y Roca ganan +3 de iniciativa y −2 de salud.", a: "Tus Pokémon Planta y Roca entran con +2 Velocidad y −1 Defensa.", perks: [{k: "boost", types: ["Grass", "Rock"], boosts: {spe: 2, def: -1}}]}},
  {n: "Guitarrista", blue: {name: "Mejora de Potencia", t: "Recibes un dado de Amplificador que crece con los símbolos de estado.", a: SIN_DICE},
    red: {name: "Exceso de Amplificador", t: "Con un movimiento Eléctrico, duplica tus dados de Amplificador.", a: "Tus movimientos Eléctricos son un 20 % más fuertes.", perks: [{k: "typePow", types: ["Electric"], m: 1.2}]}},
  {n: "Cazabichos", blue: {name: "Frenesí de Captura", t: "Tras capturar un Pokémon Bicho, gana 2 PV y un turno extra (no repetible en el turno extra).", a: "Igual.", fx: {bugFrenzy: true}},
    red: {name: "Experto en Bichos", t: "Tus movimientos Bicho +2 de iniciativa y +1 de fuerza.", a: "Tus movimientos Bicho son un 20 % más fuertes y tus Pokémon Bicho entran con +1 Velocidad.", perks: [{k: "typePow", types: ["Bug"], m: 1.2}, {k: "boost", types: ["Bug"], boosts: {spe: 1}}]}},
  {n: "Karateka", blue: {name: "Superentrenamiento", t: "Al derrotar a un Pokémon salvaje, obtén 2 Puntos de Viaje adicionales.", a: "Igual.", fx: {pvDefeat: 2}},
    red: {name: "Espíritu de Lucha", t: "Puedes quemar a tu Pokémon; en tipos Lucha la quemadura aumenta su daño.", a: "Tus movimientos Lucha son un 20 % más fuertes.", perks: [{k: "typePow", types: ["Fighting"], m: 1.2}]}},
  {n: "Entrenador Guay", blue: {name: "Creador de Equipo", t: "Reintenta una búsqueda una vez por encuentro. Los objetos de batalla cuestan 1 de cada Bonguri de su receta.", a: "Igual: puedes buscar de nuevo una vez por turno y los objetos de batalla cuestan 1 Bonguri de cada color de su receta.", fx: {research: true, cheapItems: true}},
    red: {name: "Ventaja Competitiva", t: "Tus Pokémon Fuertes ganan +1 de iniciativa.", a: "Tus Pokémon Fuertes entran con +1 Velocidad.", perks: [{k: "boost", tier: "S", boosts: {spe: 1}}]}},
  {n: "Macarra", blue: {name: "Ladrón de Ofrendas", t: "Cuando otro entrenador hace una Ofrenda, ganas el Bonguri que descartó.", a: SIN_SOLO},
    red: {name: "Postura Intimidante", t: "Tus Pokémon Siniestro y Veneno reciben −2 de daño.", a: "Tus Pokémon Siniestro y Veneno reciben un 25 % menos de daño.", perks: [{k: "taken", defTypes: ["Dark", "Poison"], m: .75}]}},
  {n: "Ornitólogo", blue: {name: "Silbido de Pájaro", t: "Puedes volar a una aldea desde cualquier casilla descartando 1 Bonguri, si no hay Reclutas en ella.", a: "Igual.", fx: {flyAnywhere: true}},
    red: {name: "Maniobras Evasivas", t: "Tus Pokémon Volador no reciben daño de ataques de 2 o menos.", a: "Tus Pokémon Volador reciben un 50 % menos de daño de movimientos de potencia 60 o menos.", perks: [{k: "taken", defTypes: ["Flying"], m: .5, maxBP: 60}]}},
  {n: "Niña Soñadora", blue: {name: "Estrella del Deseo", t: "Tus Pokémon se curan 1 de vida extra cada vez que son curados.", a: "Al terminar cada turno en el mapa, tu equipo recupera el 10 % de sus PS.", fx: {wish: true}},
    red: {name: "Soñador Diurno", t: "Puedes dormir a tu Pokémon; en tipos Hada, el sueño cura 1 al final de cada turno.", a: "Tus Pokémon Hada recuperan 1/16 de sus PS al final de cada turno de combate.", perks: [{k: "residualHeal", types: ["Fairy"]}]}},
  {n: "Acólita de Diamante", blue: {name: "Devoción Temporal", t: "Te conviertes en Seguidor de Dialga para siempre; tu ficha cuenta como 2 cartas para Juega 3 de Dialga.", a: "Te conviertes en Seguidor de Dialga para siempre.", fx: {follower: "dialga"}},
    red: {name: "Elegido de Dialga", t: "Busca a Dialga en el mazo de Legendarios y añádelo a tu equipo.", a: "Dialga se une a tu equipo (o a la Caja).", fx: {legend: "Dialga"}}},
  {n: "Pokécolector", blue: {name: "Colección de Sellos", t: "Al reclamar cualquier recompensa de sellos, puedes reclamarla dos veces.", a: "Igual.", fx: {stampsTwice: true}},
    red: {name: "Coleccionista Pokémon", t: "Los movimientos de las recompensas de sellos sirven para todo el equipo; los descartes se añaden a tu reserva.", a: "Sin efecto: las MT de los sellos ya sirven para todo el equipo."}},
  {n: "Pescador", blue: {name: "Súper Caña", t: "En los Arrecifes, 1 símbolo de estado cuenta como golpe normal.", a: "Las capturas de salvajes de Arrecifes tienen ratio ×1,5.", fx: {catchReef: 1.5}},
    red: {name: "Captura del Día", t: "Tus Pokémon ganan salud según su Tamaño de Captura.", a: SIN_DICE}},
  {n: "Chef", blue: {name: "Experto en la Materia", t: "Puedes intercambiar los Bonguri de tu bolsa por otros del mismo nivel.", a: "Igual, desde la Bolsa.", fx: {exchange: true}},
    red: {name: "Estofado Maestro", t: "Cuesta 1 de cada Bonguri: tus Pokémon ganan +1 de fuerza en sus movimientos del mismo tipo hasta el final de la batalla.", a: "Nuevo estofado (1 Bonguri de cada color): en el próximo combate, los movimientos del mismo tipo que el usuario son un 20 % más fuertes.", fx: {masterStew: true}}},
  {n: "Mochilero", blue: {name: "Tienda Portable", t: "Restaura al completo 1 Pokémon después de cada encuentro salvaje.", a: "Igual: se cura el Pokémon más herido.", fx: {portable: true}},
    red: {name: "Capacidad de Carga", t: "Tus Pokémon pueden equiparse hasta 2 objetos distintos.", a: "Sin efecto: el motor permite un objeto por Pokémon."}},
  {n: "Damisela", blue: {name: "Herencia Noble", t: "Al desbloquearla, ganas 7 Puntos de Viaje. Los costes de evolución cuestan 2 PV menos.", a: "Al desbloquearla, ganas 7 PV.", fx: {pvUnlock: 7}},
    red: {name: "Hiperpoción", t: "Una vez por combate, restaura la vida y los estados de un Pokémon no debilitado.", a: "Igual, con el Pokémon activo (botón en el combate).", fx: {hyper: true}}},
  {n: "Joven", blue: {name: "Amigos de la Infancia", t: "Tus Pokémon Débiles ganan +1 de salud y +1 de iniciativa.", a: "Tus Pokémon Débiles entran con +1 Defensa y +1 Velocidad.", perks: [{k: "boost", tier: "W", boosts: {def: 1, spe: 1}}]},
    red: {name: "Carrera Futura", t: "Al desbloquearla, roba 5 tarjetas de entrenador y cambia esta por una de ellas, activando sus efectos.", a: "Igual: eliges una de 5 tarjetas nuevas con sus dos habilidades desbloqueadas.", fx: {future: true}}},
  {n: "Aristócrata", blue: {name: "Moneda Amuleto", t: "Tras capturar o derrotar a un Pokémon salvaje, obtienes el doble de Bonguri.", a: "Igual.", fx: {doubleBonguri: true}},
    red: {name: "Gloria Ball", t: "Al desbloquearla, recibes una Gloria Ball que captura automáticamente.", a: "Igual: una Gloria Ball de un solo uso que nunca falla.", fx: {glory: true}}},
  {n: "Mercader Ginkgo", blue: {name: "Monopolio Comercial", t: "Cuando otro entrenador usa el Comercio Ginkgo, ganas los Bonguri que descarta.", a: SIN_SOLO},
    red: {name: "Recursos Descartables", t: "Descarta 1 Bonguri para fijar la fuerza de un movimiento en 4/5/6.", a: SIN_DICE}},
  {n: "Esprit", blue: {name: "Planificación Anticipada", t: "Después de un combate, puedes usar los movimientos que te queden sin interactuar con nada más.", a: "Igual: tras combatir conservas los movimientos que te quedaban, pero no puedes buscar, ofrendar ni combatir.", fx: {planning: true}},
    red: {name: "Golpe Oportuno", t: "Si empiezas un combate salvaje sin haberte movido este turno, tu primer ataque hace el doble de daño.", a: "Igual.", fx: {opportune: true}}},
  {n: "Montañero", blue: {name: "Equipo de Montaña", t: "Una vez por turno, hasta 2 casillas de Montaña gratis. Te mueves sin importar la elevación.", a: "+2 movimientos en los turnos que empiezas en Montaña y puedes ignorar la regla de elevación.", fx: {biome: "Mountain", climb: true}},
    red: {name: "Pies Firmes", t: "Tus Pokémon Roca y Tierra ganan +4 de salud y −1 de iniciativa.", a: "Tus Pokémon Roca y Tierra entran con +1 Defensa, +1 Def. Esp. y −1 Velocidad.", perks: [{k: "boost", types: ["Rock", "Ground"], boosts: {def: 1, spd: 1, spe: -1}}]}},
  {n: "Prendefuegos", blue: {name: "Reunir Leña", t: "Retira un Árbol de Bonguri para añadir 3 de Leña a tu bolsa.", a: "Sin efecto en esta versión."},
    red: {name: "Ignición Ardiente", t: "Con un movimiento Fuego, gasta 1 Leña para quemar al rival.", a: "Tus movimientos Fuego son un 20 % más fuertes.", perks: [{k: "typePow", types: ["Fire"], m: 1.2}]}},
  {n: "Acólita de Perla", blue: {name: "Devoción Espacial", t: "Te conviertes en Seguidor de Palkia para siempre.", a: "Igual.", fx: {follower: "palkia"}},
    red: {name: "Elegido de Palkia", t: "Busca a Palkia y añádela a tu equipo.", a: "Palkia se une a tu equipo (o a la Caja).", fx: {legend: "Palkia"}}},
  {n: "Entrenador Aéreo", blue: {name: "Traje de Vuelo", t: "Puedes moverte a casillas 2 o más niveles por debajo; después, 4 casillas más mientras no subas.", a: "Puedes bajar cualquier cantidad de niveles de elevación de un paso.", fx: {glide: true}},
    red: {name: "Superioridad Aérea", t: "Tus movimientos Volador +1 de fuerza si el rival no es Volador.", a: "Igual: +20 %.", perks: [{k: "typePow", types: ["Flying"], m: 1.2, notVs: "Flying"}]}},
  {n: "Operario", blue: {name: "Ingeniero Civil", t: "Por 2 PV, construye Carreteras.", a: "Sin efecto en esta versión."},
    red: {name: "Obras Viales", t: "Cuando tus Pokémon Acero entran en combate, el rival no puede cambiar ni huir.", a: "Tus Pokémon Acero entran con +1 Defensa y +1 Def. Esp.", perks: [{k: "boost", types: ["Steel"], boosts: {def: 1, spd: 1}}]}},
  {n: "Turista", blue: {name: "Recorrido Histórico", t: "Marca las Localizaciones Legendarias de Artefactos para obtener Instantáneas Legendarias.", a: "Sin efecto en esta versión."},
    red: {name: "Álbum de Vacaciones", t: "Enseña las Instantáneas Legendarias como movimientos; si completas el recorrido, +30 PV.", a: "Sin efecto en esta versión."}},
  {n: "Acólita Imparcial", blue: {name: "Devoción Eterna", t: "Te conviertes en Seguidor de Arceus: cuentas como seguidor de los 3 Dioses de Sinnoh.", a: "Ganas +1 movimiento por turno con cualquier Dios en el Santuario Origin.", fx: {follower: "arceus"}},
    red: {name: "Sentencia de Arceus", t: "Después de atacar, el rival se debilita si le quedan 2 o menos de vida.", a: "Después de atacar, el rival se debilita si le queda un 10 % de PS o menos.", perks: [{k: "sentence"}]}},
  {n: "Buceador", blue: {name: "Tesoro Hundido", t: "En Océano, saca un Punto Oculto descartado y colócalo en tu casilla.", a: "Sin efecto en esta versión."},
    red: {name: "Buceo", t: "Después de atacar con un movimiento Agua, el usuario puede cambiar y curarse los estados.", a: "Después de usar un movimiento Agua, el usuario se cura los estados.", perks: [{k: "cleanse", types: ["Water"]}]}},
  {n: "Dama Parasol", blue: {name: "Previsión del Tiempo", t: "Elige un clima; los movimientos de ese clima +2 de fuerza.", a: "Tus movimientos Agua y Fuego son un 20 % más fuertes (lluvia y sol).", perks: [{k: "typePow", types: ["Water", "Fire"], m: 1.2}]},
    red: {name: "Paraguas Útil", t: "Tus Pokémon reciben 2 menos de daño de los movimientos del clima actual.", a: "Tus Pokémon reciben un 15 % menos de daño de movimientos Agua y Fuego.", perks: [{k: "taken", moveTypes: ["Water", "Fire"], m: .85}]}},
  {n: "Chico Ninja", blue: {name: "Ataque Sorpresa", t: "Con Ventaja de Iniciativa, vas primero siempre.", a: "Tus Pokémon entran con +1 Velocidad.", perks: [{k: "boost", boosts: {spe: 1}}]},
    red: {name: "Dardo Tóxico", t: "Con la Ventaja de Iniciativa, envenena, confunde o adormece al rival.", a: SIN_DICE}},
  {n: "Soldado Equipo Magma", blue: {name: "Túneles de Magma", t: "Al final de tu turno en Montaña, muévete a cualquier otra casilla de Montaña.", a: "Sin efecto en esta versión."},
    red: {name: "Tierra Desolada", t: "Fuego +1 de fuerza y tus Pokémon Fuego reciben 1 menos de daño.", a: "Fuego +20 % y tus Pokémon Fuego reciben un 15 % menos de daño.", perks: [{k: "typePow", types: ["Fire"], m: 1.2}, {k: "taken", defTypes: ["Fire"], m: .85}]}},
  {n: "Científica", blue: {name: "Observación de Campo", t: "Busca en un Árbol, Arrecife o Puerta sin combatir y enseña los movimientos vistos.", a: "Sin efecto: el dueño desactivó aprender movimientos de las cartas al buscar."},
    red: {name: "Análisis de Debilidades", t: "Tu daño por ventaja de tipo aumenta en 1.", a: "Tus ataques súper eficaces hacen un 20 % más de daño.", perks: [{k: "weakness"}]}},
  {n: "Soldado Equipo Aqua", blue: {name: "Inmersión Submarina", t: "Al final de tu turno en Océano, muévete a cualquier otra casilla de Océano.", a: "Sin efecto en esta versión."},
    red: {name: "Mar Primordial", t: "Agua +1 de fuerza y tus Pokémon Agua reciben 1 menos de daño.", a: "Agua +20 % y tus Pokémon Agua reciben un 15 % menos de daño.", perks: [{k: "typePow", types: ["Water"], m: 1.2}, {k: "taken", defTypes: ["Water"], m: .85}]}},
  {n: "Ruinamaníaco", blue: {name: "Cazador de Artefactos", t: "Revela 1 Punto Oculto Especial; si es un Artefacto, muévete hasta él y equípalo.", a: "Sin efecto en esta versión."},
    red: {name: "Experto en Artefactos", t: "Tus Artefactos ganan +1 de fuerza a sus bonificaciones.", a: "Los movimientos potenciados por un artefacto equipado ganan un 10 % más.", perks: [{k: "artifact"}]}},
  {n: "Pokémaníaco", blue: {name: "Disfraz Pokémon", t: "Contra un salvaje, puedes usar su movimiento característico.", a: SIN_DICE},
    red: {name: "Sustituto Inesperado", t: "Recibes el objeto Sustituto: el portador puede cambiarse antes de recibir un ataque.", a: "Recibes una Banda Focus.", fx: {gift: "focussash"}}},
  {n: "Acólita de Platino", blue: {name: "Devoción Renegada", t: "Te conviertes en Seguidor de Giratina para siempre.", a: "Igual.", fx: {follower: "giratina"}},
    red: {name: "Elegido de Giratina", t: "Busca a Giratina y añádela a tu equipo.", a: "Giratina se une a tu equipo (o a la Caja).", fx: {legend: "Giratina"}}},
  {n: "Pokémon Ranger", blue: {name: "Rancho Pokémon", t: "Puedes usar los espacios bloqueados del equipo para almacenar Pokémon.", a: "Sin efecto: la Caja ya guarda los Pokémon sobrantes."},
    red: {name: "Compañeros Leales", t: "Tus Pokémon Moderados ganan +1 de vida y +1 de iniciativa por cada espacio desbloqueado.", a: "Tus Pokémon Moderados entran con +1 Defensa y +1 Velocidad por cada Fragmento (máximo +3).", perks: [{k: "boost", tier: "M", perFrag: true, boosts: {def: 1, spe: 1}}]}}
];
const sinTrainer = run => run?.trainer ? SIN_TRAINERS[run.trainer.index] : null;
// Habilidades activas (desbloqueadas) de la tarjeta.
const sinAbilities = run => { const t = sinTrainer(run); return t ? ["blue", "red"].filter(c => run.trainer[c]).map(c => t[c]) : []; };
const sinFx = (run, key) => sinAbilities(run).map(a => a.fx?.[key]).find(v => v !== undefined && v !== false);
// Bioma aproximado de una casilla: el token de bioma más cercano (agua = Océano).
function sinCellBiome(h) {
  if (!h) return null;
  if (h.w) return "Ocean";
  let best = null, dist = Infinity;
  SIN.tokens.forEach(t => {
    if (!t.b || !t.cell || t.b === "Ruins" || t.b === "Space") return;
    const d = Math.abs(t.cell[0] - h.c) + Math.abs(t.cell[1] - h.r) / 2;
    if (d < dist) { dist = d; best = t.b; }
  });
  return dist <= 3 ? best : null;
}
function sinBiomeBonus(run) {
  const biome = sinFx(run, "biome"), here = sinCellBiome(SIN_BY_CELL.get(run.pos.join(",")));
  if (!biome) return 0;
  return (biome.startsWith("!") ? here !== biome.slice(1) : here === biome) ? 2 : 0;
}
function sinTrainerOffer(count, exclude = []) {
  // No se ofrecen tarjetas cuyas dos habilidades quedaron sin efecto en esta versión.
  return shuffle(SIN_TRAINERS.map((_, i) => i).filter(i => !exclude.includes(i) && ["blue", "red"].some(c => SIN_TRAINERS[i][c].fx || SIN_TRAINERS[i][c].perks))).slice(0, count);
}
// Texto para mostrar: la adaptación, o el texto original cuando la adaptación es "Igual".
const sinAbilityText = a => a.a.startsWith("Igual") ? a.t + (a.a.length > 6 ? " " + a.a.replace(/^Igual[.:]?\s*/, "") : "") : a.a;
function sinTrainerScreen() {
  const run = ST.sin.run, offer = run.trainerOffer, future = run.trainerFuture;
  $("app").innerHTML = `<div class="sin-new"><div class="sin-new-inner"><h1>${future ? "Carrera Futura" : "Tarjeta de Entrenador"}</h1>
    <p>${future ? "Elige tu nueva tarjeta. Sus dos habilidades quedan desbloqueadas." : "Elige tu clase de entrenador. La habilidad azul se desbloquea al derrotar u obtener un Pokémon Moderado; la roja, con un Fuerte, Alfa o legendario."}</p>
    <div class="sin-trainers">${offer.map(i => `<div class="sin-choice">${sinCardImage(SIN_TRAINER_CARDS[i]?.img, SIN_TRAINERS[i].n)}<b class="sin-class">${sinAnilImg(sinClassSprite(SIN_TRAINERS[i].n), "", SIN_TRAINERS[i].n)}${esc(SIN_TRAINERS[i].n)}</b>
      ${["blue", "red"].map(c => `<p><b>${c === "blue" ? "Azul" : "Roja"} · ${esc(SIN_TRAINERS[i][c].name)}:</b> ${esc(sinAbilityText(SIN_TRAINERS[i][c]))}</p>`).join("")}
      <button class="btn primary" data-act="sintrainer" data-trainer="${i}">Elegir</button></div>`).join("")}</div></div></div>`;
  sinFillImages();
}
async function sinChooseTrainer(index) {
  const run = ST.sin.run;
  if (!run?.trainerOffer?.includes(index)) return;
  const future = run.trainerFuture;
  run.trainer = {index, blue: false, red: false};
  delete run.trainerOffer; delete run.trainerFuture;
  run.notice = `Eres ${SIN_TRAINERS[index].n}.`;
  if (future) { await sinUnlock(run, "blue"); await sinUnlock(run, "red"); }
  sinSave(); renderSin();
}
async function sinAddLegend(run, species, extra = {}) {
  const level = Math.max(30, ...run.team.map(s => s.level));
  const set = await sinInitialSet(species, level);
  Object.assign(set, extra, {tier: extra.tier || "L"});
  const boxed = run.team.length >= sinTeamSlots(run);
  (boxed ? run.box : run.team).push(set);
  return `${esSp(species)} (Nv. ${level}) ${boxed ? "fue enviado a la Caja" : "se unió a tu equipo"}.`;
}
// Aplica el desbloqueo de una habilidad y sus efectos de "cuando se desbloquea".
async function sinUnlock(run, color) {
  const t = sinTrainer(run); if (!t || run.trainer[color]) return "";
  run.trainer[color] = true;
  const fx = t[color].fx || {}, msg = [`¡Habilidad desbloqueada: ${t[color].name}!`];
  if (fx.pvUnlock) { run.pv += fx.pvUnlock; msg.push(`Ganaste ${fx.pvUnlock} PV.`); }
  if (fx.follower) { run.follower = fx.follower === "arceus" ? run.follower : fx.follower; run.followerAll = fx.follower === "arceus"; msg.push(`Ahora eres Seguidor de ${fx.follower === "arceus" ? "Arceus" : SIN_GODS[fx.follower].species}.`); }
  if (fx.legend) msg.push(await sinAddLegend(run, fx.legend));
  if (fx.dragon) {
    const card = shuffle(SIN_CARDS.filter(c => c.tier === "W" && c.d?.sp && Dex.species.get(c.d.sp).types.includes("Dragon")))[0];
    if (card) msg.push(await sinAddLegend(run, card.d.sp, {tier: "W", dragon: true}).then(m => "Dragón Supremo: " + m));
  }
  if (fx.glory) { run.balls.glory = (run.balls.glory || 0) + 1; msg.push("Recibiste una Gloria Ball."); }
  if (fx.gift) { run.items.push(fx.gift); msg.push(`Recibiste ${esItem(fx.gift)}.`); }
  if (fx.future) { run.trainerOffer = sinTrainerOffer(5, [run.trainer.index]); run.trainerFuture = true; msg.push("Elige tu nueva tarjeta."); }
  return msg.join(" ");
}
// Desbloqueos tras derrotar u obtener un Pokémon salvaje (tiers: W, M, S, L; Alfa cuenta como Fuerte).
async function sinTrainerProgress(run, tiers) {
  if (!run.trainer) return;
  const msgs = [];
  if (tiers.includes("M") && !run.trainer.blue) msgs.push(await sinUnlock(run, "blue"));
  if (tiers.some(t => t === "S" || t === "L") && !run.trainer.red) msgs.push(await sinUnlock(run, "red"));
  if (msgs.length) { run.notice = [run.notice, ...msgs].filter(Boolean).join(" "); sinSave(); if (VIEW === "sin") renderSin(); else if (run.progress) sinRefreshProgress(); }
}
// Efectos de combate: datos que se envían al motor junto a la condición "sinperks".
function sinPerkData(run, team) {
  const perks = sinAbilities(run).flatMap(a => a.perks || []).map(p => p.perFrag ? {...p, boosts: Object.fromEntries(Object.entries(p.boosts).map(([k, v]) => [k, v * Math.min(3, run.frag)]))} : p)
    .filter(p => !p.perFrag || run.frag > 0);
  if (run.battle && !run.battle.trainer && !run.battle.swarm && sinFx(run, "opportune") && run.battle.start?.moved === 0) perks.push({k: "first"});
  if (run.battle?.masterStew) perks.push({k: "typePow", types: "stab", m: 1.2});
  // Armadura Prismática: cada 2 fichas reducen un 8 % el daño que haces al Ultraente o a Necrozma.
  const armor = run.battle?.legend?.ub ? run.ubsDefeated : run.battle?.legend?.necro ? 9 - run.ubsDefeated : 0;
  if (Math.floor(armor / 2)) perks.push({k: "armor", m: 1 - Math.floor(armor / 2) * .08});
  if (team.some(s => s.breach)) perks.push({k: "breach"});
  if (perks.some(p => p.k === "masterpiece")) {
    const types = new Set(team.flatMap(s => s.moves.map(m => Dex.moves.get(m).type)));
    if (types.size >= 12) perks.push({k: "typePow", types: "all", m: 1.3});
  }
  if (perks.some(p => p.k === "artifact")) perks.push({k: "artifactTypes", map: Object.fromEntries(Object.values(SIN_ARTIFACTS).filter(a => a.types).map(a => [a.id, a.types]))});
  return perks;
}
Dex.data.Conditions.sinperks = {
  name: "sinperks",
  onSwitchIn(pokemon) {
    (this.effectState.perks || []).forEach(p => {
      if (p.k !== "boost" || !sinPerkFits(p, pokemon)) return;
      this.boost(p.boosts, pokemon, pokemon);
    });
    // Cartas de Brecha al entrar.
    if (pokemon.sinBreach === "gravity") this.boost({spe: -1, def: 1, spd: 1}, pokemon, pokemon);
    if (pokemon.sinBreach === "agile") this.boost({spe: 1}, pokemon, pokemon);
    if (pokemon.sinBreach === "overload") {
      const st = ["brn", "par", "psn"][this.random(3)], foe = pokemon.side.foe.active[0];
      pokemon.trySetStatus(st, pokemon); if (foe && foe.hp > 0) foe.trySetStatus(st, pokemon);
    }
  },
  onModifyPriority(priority, pokemon) { return pokemon.sinBreach === "quick" ? priority + 1 : priority; },
  onModifyType(move, pokemon) { if (pokemon.sinBreach === "chromatic" && move.category !== "Status") move.type = "???"; },
  onBasePowerPriority: 15,
  onBasePower(bp, user, target, move) {
    let m = 1;
    (this.effectState.perks || []).forEach(p => {
      if (p.k === "typePow" && sinPerkFits(p, user) && (p.types === "all" || (p.types === "stab" ? user.hasType(move.type) : p.types.includes(move.type))) &&
        (!p.notVs || !target?.hasType(p.notVs)) && (!p.vsType || target?.hasType(p.vsType))) m *= p.m;
      if (p.k === "artifactTypes" && (p.map[user.item] || []).includes(move.type)) m *= 1.1;
      if (p.k === "first" && !this.effectState.firstUsed) { m *= 2; this.effectState.firstUsed = true; }
    });
    if (user.sinBreach === "chromatic") m *= 1.2;
    if (m !== 1) this.chainModify(m);
    if (user.sinBreach === "quick" && bp > 60) return 60;
  },
  onModifyCritRatio(ratio) { return (this.effectState.perks || []).some(p => p.k === "crit") ? ratio + 1 : ratio; },
  onModifyDamage(damage, source, target, move) {
    let m = 1;
    const se = target.getMoveHitData(move).typeMod > 0;
    (this.effectState.perks || []).forEach(p => {
      if (p.k === "weakness" && se) m *= 1.2;
      if (p.k === "armor") m *= p.m;
    });
    if (source.sinBreach === "reckless" && se) m *= 1.2;
    if (m !== 1) return this.chainModify(m);
  },
  onSourceModifyDamage(damage, source, target, move) {
    let m = 1;
    (this.effectState.perks || []).forEach(p => {
      if (p.k !== "taken") return;
      if (p.defTypes && !p.defTypes.some(t => target.hasType(t))) return;
      if (p.moveTypes && !p.moveTypes.includes(move.type)) return;
      if (p.maxBP && move.basePower > p.maxBP) return;
      m *= p.m;
    });
    if (target.sinBreach === "reckless" && target.getMoveHitData(move).typeMod > 0) m *= 1.2;
    if (m !== 1) return this.chainModify(m);
  },
  onDamage(damage, target, source, effect) {
    if (effect?.effectType !== "Move") return;
    let cap = Infinity;
    (this.effectState.perks || []).forEach(p => { if (p.k === "maxHit" && sinPerkFits(p, target)) cap = Math.min(cap, Math.max(1, Math.floor(target.maxhp * p.frac))); });
    if (damage > cap) return cap;
  },
  onAfterMoveSecondarySelf(source, target, move) {
    (this.effectState.perks || []).forEach(p => {
      if (p.k === "drain" && p.types.includes(move.type) && move.totalDamage) this.heal(Math.ceil(move.totalDamage / 2), source, source);
      if (p.k === "cleanse" && p.types.includes(move.type) && source.status) source.cureStatus();
      if (p.k === "sentence" && target && target !== source && target.hp > 0 && target.hp <= target.maxhp * .1 && move.category !== "Status") target.faint();
    });
    if (source.sinBreach === "agile" && move.category !== "Status" && source.hp > 0) this.damage(Math.max(1, Math.floor(source.baseMaxhp / 16)), source, source);
  },
  onFaint(target) {
    if (!(this.effectState.perks || []).some(p => p.k === "retribution")) return;
    const foe = target.side.foe.active[0];
    if (foe && foe.hp > 0) this.damage(Math.max(1, Math.floor(foe.baseMaxhp / 8)), foe, target);
  },
  onResidualOrder: 6,
  onResidual(target) {
    (this.effectState.perks || []).forEach(p => {
      if (p.k === "residualHeal" && p.types.some(t => target.hasType(t)) && target.hp > 0) this.heal(Math.max(1, Math.floor(target.baseMaxhp / 16)), target, target);
    });
  }
};
// Filtros por tipo, nivel de encuentro (sinTier) o Dragón Supremo (sinDragon); el motor los recibe en el >eval inicial.
function sinPerkFits(p, pokemon) {
  if (p.tier && pokemon.sinTier !== p.tier) return false;
  if (p.dragon && !pokemon.sinDragon) return false;
  if (p.types && Array.isArray(p.types) && p.k === "boost" && !p.types.some(t => pokemon.hasType(t))) return false;
  return true;
}
// Código que se agrega al >eval inicial del combate: niveles de encuentro y condición de efectos.
function sinPerkEval(run, team) {
  const perks = sinPerkData(run, team);
  const tiers = team.map((s, i) => `${s.tier ? `a[${i}].sinTier=${JSON.stringify(s.tier)};` : ""}${s.dragon ? `a[${i}].sinDragon=true;` : ""}${s.breach ? `a[${i}].sinBreach=${JSON.stringify(s.breach)};` : ""}`).join("");
  return perks.length ? `{const a=battle.sides[0].pokemon;${tiers}const sd=battle.sides[0];sd.sideConditions.sinperks=battle.initEffectState({id:"sinperks",target:sd});sd.sideConditions.sinperks.perks=${JSON.stringify(perks)};}` : "";
}
function sinTrainerPanel() {
  const run = ST.sin.run, t = sinTrainer(run); if (!t || !SIN_VIEW) return;
  SIN_VIEW.panel = "trainer"; SIN_VIEW.bag = false; SIN_VIEW.box = false; SIN_VIEW.selected = null;
  const ability = (color, label, how) => `<div class="sin-progress"><b>${run.trainer[color] ? "🔓" : "🔒"} ${esc(t[color].name)}</b> <small>(${label} · ${run.trainer[color] ? "desbloqueada" : how})</small>
    <p>${esc(t[color].t)}</p><p><b>En este juego:</b> ${esc(t[color].a)}</p></div>`;
  $("sin-card").innerHTML = `<div class="sin-card-head"><h2 class="sin-class">${sinAnilImg(sinClassSprite(t.n), "", t.n)}Entrenador · ${esc(t.n)}</h2><button class="btn" data-act="sinclose">Cerrar</button></div>
    ${sinCardImage(SIN_TRAINER_CARDS[run.trainer.index]?.img, t.n, "sin-ginkgo")}
    ${ability("blue", "azul", "se desbloquea al derrotar u obtener un Pokémon Moderado")}${ability("red", "roja", "se desbloquea con un Fuerte, Alfa o legendario")}
    ${sinFx(run, "pick") ? `<button class="btn" data-act="sinpick" ${run.picked || !sinTreeHere(run) || !sinMapAction(run) ? "disabled" : ""}>Recoger 1 Bonguri del árbol${run.picked ? " (usado este turno)" : ""}</button>` : ""}
    ${sinFx(run, "exchange") ? `<h2>Cambiar Bonguri del mismo nivel</h2><div class="btns">${SIN_EXCHANGES.map(([a, b]) => `<button class="btn" data-act="sinswap" data-from="${a}" data-to="${b}" ${run.bag[a] > 0 && sinMapAction(run) ? "" : "disabled"}>1 ${esc(SIN_BONGURI[a][0])} → 1 ${esc(SIN_BONGURI[b][0])}</button>`).join("")}</div>` : ""}`;
  $("sin-card").hidden = false; sinFillImages(); sinRequestDraw();
}
const SIN_EXCHANGES = [["red", "yellow"], ["red", "blue"], ["yellow", "red"], ["yellow", "blue"], ["blue", "red"], ["blue", "yellow"],
  ["pink", "green"], ["pink", "white"], ["green", "pink"], ["green", "white"], ["white", "pink"], ["white", "green"]];
const sinTreeHere = run => sinCellTokens(SIN_BY_CELL.get(run.pos.join(","))).find(t => /^(Red|Yellow|Blue|Pink|Green|White|Black) Apricorn Tree$/.test(t.n));
function sinPickBonguri() {
  const run = ST.sin.run, tree = sinTreeHere(run);
  if (!sinMapAction(run) || !sinFx(run, "pick") || run.picked || !tree) return;
  const color = tree.n.split(" ")[0].toLowerCase(); run.bag[color]++; run.picked = true;
  run.notice = `Recogiste 1 Bonguri ${SIN_BONGURI[color][0]}.`; sinSave(); sinUpdateTurn();
}
function sinSwapBonguri(from, to) {
  const run = ST.sin.run;
  if (!sinMapAction(run) || !sinFx(run, "exchange") || !SIN_EXCHANGES.some(([a, b]) => a === from && b === to) || !(run.bag[from] > 0)) return;
  run.bag[from]--; run.bag[to]++; run.notice = `Cambiaste 1 Bonguri ${SIN_BONGURI[from][0]} por 1 ${SIN_BONGURI[to][0]}.`; sinSave(); sinUpdateTurn();
}
/* ---------- Recursos de Pokémon Añil (solo local): sprites de entrenadores y animación de captura ----------
   Los genera herramientas/sinnoh/generar_anil.py en spr/anil_0.bin con el índice ANIL (anil_datos.js). */
const sinAnilURL = key => {
  const e = typeof ANIL !== "undefined" && (ANIL.img[key] || ANIL.snd[key]);
  if (!e) return Promise.resolve(null);
  return packURL(`spr/anil${ANIL.v}/${key}`, ANIL.packs[e[0]], e[1], e[2], ANIL.snd[key] ? "audio/ogg" : "image/png");
};
const sinAnilImg = (key, cls = "", alt = "") => typeof ANIL !== "undefined" && ANIL.img[key] ? `<img class="${esc(cls)}" data-anil="${esc(key)}" alt="${esc(alt)}">` : "";
function sinFillAnil() {
  document.querySelectorAll("img[data-anil]:not([data-anil-done])").forEach(el => {
    el.dataset.anilDone = 1; sinAnilURL(el.dataset.anil).then(u => { if (u && el.isConnected) el.src = u; });
  });
}
function sinAnilSound(key, vol = .7) {
  if (typeof sndOn === "function" && !sndOn("sfx")) return;
  sinAnilURL(key).then(u => { if (!u) return; const a = new Audio(u); a.volume = vol; a.play().catch(() => {}); });
}
// Sprite de Añil para cada clase de Tarjeta de Entrenador (las que no tienen uno propio usan uno parecido).
const SIN_CLASS_SPRITES = {
  "Criador Pokémon": "CAMPISTA", "Patinadora": "CHICA", "Pokéfan": "POKEMANIACO", "Dominguera": "CAMPISTA", "Nadador": "NADADOR",
  "Soldado Equipo Rocket": "ROCKETO", "Triatleta": "MOTORISTA", "Señorita Aroma": "JOVENRICA", "Modelo": "MODELO", "Pokéabu": "VETERANA",
  "Domadragón": "TB28", "Bruja": "BRUJITA", "Periodistas": "FOTOGRAFA", "Médium": "MEDIUM", "Veterana": "VETERANA", "Artista": "MALABARISTA",
  "Jardinero": "VETERANO", "Guitarrista": "TB21", "Cazabichos": "CAZABICHOS", "Karateka": "KARATEKA", "Entrenador Guay": "GUAY",
  "Macarra": "MACARRA", "Ornitólogo": "ORNITOLOGO", "Niña Soñadora": "ESTUDIANTA", "Acólita de Diamante": "EXORCISTA", "Pokécolector": "CEREBRITO",
  "Pescador": "PESCADOR", "Chef": "MARINERO", "Mochilero": "CAMPISTO", "Damisela": "DAMISELA", "Joven": "CHICO", "Aristócrata": "CABALLERO",
  "Mercader Ginkgo": "JUGON", "Esprit": "NINJAA", "Montañero": "MONTANERO", "Prendefuegos": "TB29", "Acólita de Perla": "CABALLERA",
  "Entrenador Aéreo": "TB35", "Operario": "MECANICO", "Turista": "FOTOGRAFA", "Acólita Imparcial": "EXORCISTA", "Buceador": "NADADORA",
  "Dama Parasol": "JOVENRICA", "Chico Ninja": "NINJA", "Soldado Equipo Magma": "TB14", "Científica": "CIENTIFICA", "Soldado Equipo Aqua": "MARINERO",
  "Ruinamaníaco": "CIENTIFICO", "Pokémaníaco": "POKEMANIACO", "Acólita de Platino": "BRUJITA", "Pokémon Ranger": "TB36"
};
const sinClassSprite = name => "tr/" + (SIN_CLASS_SPRITES[name] || "CHICO");
// Rivales de entrenador: Añil no trae al Equipo Galaxia, se usan sus equivalentes del Equipo Rocket.
const SIN_FOE_SPRITES = {grunt: ["tr/ROCKETO", "tr/ROCKETA"], "Comandante Venus": "tr/ATENEA1", "Comandante Ceres": "tr/ATENEA2",
  "Comandante Saturno": "tr/ATLAS1", "Helio": "tr/GIOVANNI1"};
// Intro de los demás modos de batalla (Desafío, Batalla rápida, Mi equipo, Escalada, Competitivo):
// el rival (líder de Kanto o un entrenador al azar) y tu entrenador de espalda aparecen un momento.
const ANIL_RETO = {brock: "LIDER1", misty: "LIDER2", surge: "LIDER3", erika: "LIDER4", koga: "LIDER5", sabrina: "LIDER6", blaine: "LIDER7",
  giovanni: "GIOVANNI1", lorelei: "ALTOMANDO1", bruno: "ALTOMANDO2", agatha: "ALTOMANDO3", lance: "ALTOMANDO4", blue: "AZUL6", red: "ROJO1"};
const ANIL_RIVALS = [...Array.from({length: 36}, (_, i) => "TB" + (i + 1)), "CHICO", "CHICA", "GUAY", "GUAYA", "CAMPISTA", "CAMPISTO", "MOTORISTA",
  "KARATEKA", "NADADORA", "CIENTIFICO", "MALABARISTA", "MATON", "JUGON", "VETERANO", "VETERANA", "MODELO", "DAMISELA"];
// Los sprites de espalda de Añil están vacíos: se usa el protagonista de frente, reflejado.
const ANIL_PLAYER = "tr/POKEMONTRAINER_RojoNeutro";
function anilBattleIntro(me) {
  if (typeof ANIL === "undefined" || me.sin) return;
  const id = me.trainer?.id;
  me.anilFoe ||= "tr/" + (id ? ANIL_RETO[id] || "CAMPEON" : ANIL_RIVALS[Math.floor(Math.random() * ANIL_RIVALS.length)]);
  sinShowIntro(me.anilFoe, ANIL_PLAYER);
}
function sinShowIntro(foe, mine, back = false) {
  const scene = $("scene"); if (!scene) return;
  const box = document.createElement("div"); box.className = "sin-intro";
  box.innerHTML = (foe ? sinAnilImg(foe, "sin-intro-foe") : "") + (mine ? sinAnilImg(mine, "sin-intro-me" + (back ? " back" : "")) : "");
  scene.appendChild(box); sinFillAnil();
  setTimeout(() => box.classList.add("out"), 2200); setTimeout(() => box.remove(), 3000);
}
// Al empezar un combate de Sinnoh, el entrenador rival y tu clase aparecen un momento en la escena.
function sinBattleIntro(battle) {
  const scene = $("scene"); if (!scene || typeof ANIL === "undefined") return;
  const t = battle.trainer, run = ST.sin.run;
  const foe = !t ? null : t.kind === "grunt" || !t.name ? SIN_FOE_SPRITES.grunt[Math.floor(Math.random() * 2)] : SIN_FOE_SPRITES[t.name];
  const mine = run?.trainer ? sinClassSprite(SIN_TRAINERS[run.trainer.index].n) : null;
  sinShowIntro(foe, mine);
}
const SIN_BALL_SPRITES = {poke: "POKEBALL", great: "GREATBALL", ultra: "ULTRABALL", spirit: "DUSKBALL", glory: "CHERISHBALL"};
const sinWait = ms => new Promise(r => setTimeout(r, ms));
// Animación de captura: fases "throw" (lanzar y absorber), "shake" (una sacudida), "caught" y "escape".
async function sinBallFx(me, key, phase) {
  const scene = $("scene"); if (!scene || me.dead || typeof ANIL === "undefined") return;
  let ball = scene.querySelector(".sin-ball");
  const foe = $("mon-p2"), sheet = "ball/" + (SIN_BALL_SPRITES[key] || "POKEBALL");
  if (phase === "throw") {
    ball?.remove();
    ball = document.createElement("div"); ball.className = "sin-ball spin";
    scene.appendChild(ball);
    const url = await sinAnilURL(sheet); if (url) ball.style.backgroundImage = `url("${url}")`;
    sinAnilSound("throw");
    await sinWait(30); ball.classList.add("fly"); await sinWait(550);
    sinAnilSound("hit"); ball.classList.remove("spin"); foe?.classList.add("sin-absorbed");
    await sinWait(350); sinAnilSound("drop"); ball.classList.add("land"); await sinWait(400);
  } else if (phase === "shake" && ball) {
    sinAnilSound("shake"); ball.classList.remove("wobble"); void ball.offsetWidth; ball.classList.add("wobble"); await sinWait(650);
  } else if (phase === "caught" && ball) {
    sinAnilSound("click"); ball.classList.add("done");
    const star = await sinAnilURL("fx/ballBurst_star");
    if (star) for (let i = 0; i < 3; i++) {
      const s = document.createElement("span"); s.className = "sin-star s" + i; s.style.backgroundImage = `url("${star}")`; ball.appendChild(s);
    }
    await sinWait(900);
  } else if (phase === "escape") {
    const open = await sinAnilURL(sheet + "_open");
    if (ball && open) { ball.style.backgroundImage = `url("${open}")`; ball.classList.add("open"); }
    sinAnilSound("recall"); foe?.classList.remove("sin-absorbed"); await sinWait(450); ball?.remove();
  }
}
const sinAnyCard = species => SIN_CARDS.find(c => c.d?.sp && toID(c.d.sp) === toID(species));
/* ---------- Campaña Ultra Explosión (reglamento p. 23–25, adaptada a un jugador) ----------
   Los 9 Ultraentes recorren Sinnoh y destruyen árboles, arrecifes y santuarios; cada destrucción sube la brecha.
   Cada 10 % de brecha, un Pokémon recibe una carta de Brecha. Con la brecha en el 70 % se pierde la partida.
   Se gana derrotando las 3 fases de Necrozma en el Ultra Estallido (Mundo Distorsión). */
const SIN_UB = ["Nihilego", "Buzzwole", "Pheromosa", "Xurkitree", "Celesteela", "Kartana", "Guzzlord", "Stakataka", "Blacephalon"];
const SIN_DIFFICULTY = {new: {name: "Nuevo Entrenador", bless: 3}, veteran: {name: "Entrenador Veterano", bless: 1}, master: {name: "Entrenador Maestro", bless: 0}};
const SIN_UB_LEVEL = 45, SIN_NECRO_LEVELS = [55, 60, 65], SIN_BREACH_LOSS = 70;
// Brecha que suma cada objetivo destruido (decisión de diseño: el mod lo calcula con su tablero).
const SIN_BREACH_HIT = {tree: .4, shrine: .8};
const SIN_BREACH_CARDS = [
  {id: "reckless", name: "Ataque Imprudente", t: "Cuando el usuario ataca o es atacado, el daño por efectividad aumenta en 2.", a: "Sus ataques súper eficaces y los súper eficaces que recibe hacen un 20 % más de daño."},
  {id: "quick", name: "Golpes Rápidos", t: "El usuario siempre va primero, pero sus movimientos de más de 3 de fuerza bajan a 3.", a: "Sus movimientos tienen +1 de prioridad, pero su potencia máxima es 60."},
  {id: "gravity", name: "Arrastre Gravitacional", t: "Reduce la iniciativa del usuario en 3, pero aumenta su salud base en 3.", a: "Entra con −1 Velocidad, +1 Defensa y +1 Def. Esp."},
  {id: "agile", name: "Estructura Ágil", t: "Cuando el usuario ataca, recibe 1 de daño, pero puede cambiarse después.", a: "Entra con +1 Velocidad, pero pierde 1/16 de sus PS después de atacar."},
  {id: "chromatic", name: "Unión Cromática", t: "Los movimientos del usuario son Sin Tipo, pero su fuerza aumenta en 1.", a: "Sus movimientos no tienen tipo (sin efectividad), pero son un 20 % más fuertes."},
  {id: "overload", name: "Estado Sobrecargado", t: "Al entrar en combate, tira un dado de estado e inflige el resultado al usuario y al objetivo.", a: "Al entrar, él y el rival sufren un estado al azar (quemadura, parálisis o veneno)."}
];
const sinBreachCard = id => SIN_BREACH_CARDS.find(c => c.id === id);
const SIN_ULTRA_BURST = SIN.tokens.findIndex(t => t.n === "The Ultra Burst");
const sinGateTwin = t => SIN.tokens.find(o => o !== t && o.n === t.n && o.tags?.includes("Distortion Gate"));
const sinUltraTargetToken = t => /Apricorn (Tree|Reef)$/.test(t.n) || / Shrine$/.test(t.n);
const sinUltraForbidden = h => h.dw || sinCellTokens(h).some(t => t.tags?.includes("Village Token") || t.tags?.includes("Legendary Encounter Card") || t.tags?.includes("Distortion Gate"));
function sinUltraSetup(run, difficulty) {
  const d = SIN_DIFFICULTY[difficulty] || SIN_DIFFICULTY.new;
  Object.assign(run, {campaign: "ultra", difficulty, act: 0, grunts: [], blessings: d.bless, breach: 0, breachGiven: 0,
    breachDeck: shuffle(SIN_BREACH_CARDS.flatMap(c => Array(6).fill(c.id))), destroyed: {}, ubsDefeated: 0, necroPhase: 1, necroForm: null});
  run.bag.red = 3; run.bag.blue = 3; run.bag.yellow = 3;
  const free = shuffle(SIN_CELLS.filter(h => !sinUltraForbidden(h) && Math.abs(h.c - run.pos[0]) + Math.abs(h.r - run.pos[1]) / 2 > 4));
  run.ubs = SIN_UB.map((species, i) => ({species, pos: [free[i].c, free[i].r]}));
  run.notice = `Ultra Explosión · ${d.name}: los Ultraentes aparecieron en Sinnoh. Recibiste 3 Bonguri rojos, azules y amarillos.`;
}
const sinUltra = run => run?.campaign === "ultra";
const sinDestroyed = (run, h) => !!run?.destroyed?.[h.c + "," + h.r];
function sinUltraDestroy(run, h, who, messages) {
  const key = h.c + "," + h.r; if (run.destroyed[key]) return;
  const shrine = sinCellTokens(h).some(t => / Shrine$/.test(t.n));
  run.destroyed[key] = true; run.breach = Math.min(100, Math.round((run.breach + (shrine ? SIN_BREACH_HIT.shrine : SIN_BREACH_HIT.tree)) * 10) / 10);
  messages.push(`${who} destruyó ${shrine ? "un santuario" : "un árbol de Bonguri"}.`);
}
// Paso hacia el objetivo más cercano (búsqueda por anchura sin elevación; los Ultraentes vuelan).
function sinUltraStep(run, ub) {
  const start = ub.pos.join(","), seen = new Map([[start, null]]), queue = [SIN_BY_CELL.get(start)];
  const busy = new Set(run.ubs.filter(o => o !== ub).map(o => o.pos.join(",")));
  for (let i = 0; i < queue.length && i < 400; i++) {
    const h = queue[i], key = h.c + "," + h.r;
    if (key !== start && sinCellTokens(h).some(sinUltraTargetToken) && !run.destroyed[key]) {
      let step = key; while (seen.get(step) !== start) step = seen.get(step);
      return SIN_BY_CELL.get(step);
    }
    [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 2], [0, -2]].forEach(([dc, dr]) => {
      const k = (h.c + dc) + "," + (h.r + dr), n = SIN_BY_CELL.get(k);
      if (!n || seen.has(k) || busy.has(k) || n.dw || sinCellTokens(n).some(t => t.tags?.includes("Village Token"))) return;
      seen.set(k, key); queue.push(n);
    });
  }
  return null;
}
// Turno de los Ultraentes y de Necrozma al terminar el turno del jugador.
function sinUltraRound(run) {
  if (!sinUltra(run) || run.ultraWon || run.lost) return "";
  const messages = [];
  if (run.blessSkip) { delete run.blessSkip; messages.push("Bendición de Arceus: los Ultraentes no se mueven esta ronda."); }
  else {
    // Moverse cuesta casillas compartidas; con menos Ultraentes en pie, menos movimientos.
    const moves = Math.min(run.ubs.length, 4 + Math.floor(run.breach / 10));
    for (let m = 0; m < moves && run.ubs.length; m++) {
      const ub = run.ubs[Math.floor(Math.random() * run.ubs.length)], next = sinUltraStep(run, ub);
      if (!next) continue;
      ub.pos = [next.c, next.r];
      const key = next.c + "," + next.r, hidden = run.hidden?.[key];
      if (hidden?.present && !hidden.revealed && !sinCellTokens(next).some(t => t.n === "Campsite")) hidden.present = false;
      if (sinCellTokens(next).some(sinUltraTargetToken)) sinUltraDestroy(run, next, esSp(ub.species), messages);
    }
  }
  const targets = SIN_CELLS.filter(h => !h.dw && !run.destroyed[h.c + "," + h.r] && sinCellTokens(h).some(sinUltraTargetToken));
  if (targets.length) sinUltraDestroy(run, targets[Math.floor(Math.random() * targets.length)], "Necrozma", messages);
  else { run.breach = Math.min(100, run.breach + 2); messages.push("Sin nada más que destruir, Necrozma ensancha la brecha."); }
  while (Math.floor(run.breach / 10) > run.breachGiven) {
    run.breachGiven++;
    if (!run.breachDeck.length) run.breachDeck = shuffle(SIN_BREACH_CARDS.flatMap(c => Array(6).fill(c.id)));
    const id = run.breachDeck.pop(), free = run.team.filter(s => !s.breach);
    const s = (free.length ? free : run.team)[Math.floor(Math.random() * (free.length || run.team.length))];
    if (s) { s.breach = id; messages.push(`¡Brecha al ${run.breachGiven * 10} %! ${esSp(s.species)} recibe ${sinBreachCard(id).name}.`); }
  }
  if (run.breach >= SIN_BREACH_LOSS) run.lost = {reason: "La brecha alcanzó el 70 %: la luz de Sinnoh se apagó."};
  return messages.join(" ");
}
function sinSeekUltra(kind) {
  const run = ST.sin.run;
  if (!sinUltra(run) || !sinMapAction(run) || run.searched || run.fought || !run.team.some(sinAlive)) return;
  if (kind === "ub") {
    const ub = run.ubs.find(u => u.pos.join(",") === run.pos.join(",")); if (!ub) return;
    run.offer = {cards: [{species: ub.species, img: sinAnyCard(ub.species)?.img, level: SIN_UB_LEVEL}], legend: {species: ub.species, ub: true},
      place: "Ultraente", meta: `Armadura Prismática del Ultraente: ${run.ubsDefeated}`, closed: false};
  } else {
    if (run.pos.join(",") !== SIN.tokens[SIN_ULTRA_BURST].cell.join(",")) return;
    if (run.necroPhase === 2 && !run.necroForm) run.necroForm = Math.random() < .5 ? "Necrozma-Dusk-Mane" : "Necrozma-Dawn-Wings";
    const species = run.necroPhase === 1 ? "Necrozma" : run.necroPhase === 2 ? run.necroForm : "Necrozma-Ultra";
    run.offer = {cards: [{species, img: sinAnyCard("Necrozma")?.img, level: SIN_NECRO_LEVELS[run.necroPhase - 1]}], legend: {species, necro: run.necroPhase},
      place: "Ultra Estallido", meta: `Necrozma · Fase ${run.necroPhase} · Armadura Prismática: ${9 - run.ubsDefeated}`, closed: false};
  }
  run.searched = true; sinSave(); renderSin();
}
function sinUltraGate() {
  const run = ST.sin.run, gate = sinCellTokens(SIN_BY_CELL.get(run.pos.join(","))).find(t => t.tags?.includes("Distortion Gate"));
  const twin = gate && sinGateTwin(gate);
  if (!sinUltra(run) || !sinMapAction(run) || !twin) return;
  run.pos = [...twin.cell]; run.moved = sinMaxMoves(run);
  run.notice = twin.tags.includes("Distortion World") ? "Entraste al Mundo Distorsión." : "Volviste a Sinnoh.";
  sinSave(); sinCenter(); sinShowCell(SIN_BY_CELL.get(run.pos.join(","))); sinUpdateTurn();
}
// Resultado de los combates contra Ultraentes y Necrozma (se llama desde sinResult).
function sinUltraResult(run, encounter, won) {
  const legend = encounter.legend;
  if (won === true && legend.ub) {
    run.ubs = run.ubs.filter(u => u.species !== legend.species); run.ubsDefeated++;
    const s = [...run.team].reverse().find(m => m.breach);
    if (s) { delete s.breach; run.notice += ` Al caer el Ultraente, ${esSp(s.species)} se libera de su carta de Brecha.`; }
    run.notice += ` La Armadura Prismática de Necrozma baja a ${9 - run.ubsDefeated}.`;
  } else if (won === true && legend.necro) {
    run.necroPhase++;
    if (run.necroPhase > 3) { run.ultraWon = true; run.victory = {turns: run.turn, team: run.team.map(s => ({species: s.species, level: s.level})), pv: run.pv, caught: run.caught}; }
    else run.notice = `¡Necrozma cae y pasa a su fase ${run.necroPhase}!`;
  } else if (won === false && legend.necro) {
    if (run.blessings > 0) { run.blessings--; run.notice = "Necrozma te derrotó, pero una Bendición de Arceus te devuelve a la aventura."; }
    else run.lost = {reason: "Necrozma derrotó a tu equipo y quedaste eliminado."};
  }
}
function sinUltraHTML(run) {
  const d = SIN_DIFFICULTY[run.difficulty] || SIN_DIFFICULTY.new;
  const marked = run.team.filter(s => s.breach);
  return `<p>${esc(d.name)} · Bendiciones de Arceus: ${esc(run.blessings)}</p>
    <p><b>Brecha: ${esc(Math.floor(run.breach))} %</b> (se pierde al llegar al ${SIN_BREACH_LOSS} %). Destruidos: ${esc(Object.keys(run.destroyed).length)}.</p>
    <p>Ultraentes restantes: ${esc(run.ubs.length)}/9 · Armadura Prismática de Necrozma: ${esc(9 - run.ubsDefeated)} (−${esc(Math.floor((9 - run.ubsDefeated) / 2) * 8)} % de daño).</p>
    <p>Necrozma: fase ${esc(Math.min(3, run.necroPhase))} de 3, en el Ultra Estallido del Mundo Distorsión. Entra por cualquier Puerta de Distorsión.</p>
    <h2>Cartas de Brecha</h2>${marked.length ? `<ul>${marked.map(s => `<li><b>${esc(esSp(s.species))}:</b> ${esc(sinBreachCard(s.breach).name)} — ${esc(sinBreachCard(s.breach).a)}</li>`).join("")}</ul>` : "<p>Ninguna por ahora.</p>"}
    <p>Al final de cada turno los Ultraentes se mueven ${esc(Math.min(run.ubs.length, 4 + Math.floor(run.breach / 10)))} casillas en total y Necrozma destruye un objetivo. Derrotar a un Ultraente quita una carta de Brecha y debilita la armadura de Necrozma.</p>`;
}
function sinUltraCellHTML(run, h, here) {
  if (!sinUltra(run)) return "";
  const ub = run.ubs.find(u => u.pos.join(",") === h.c + "," + h.r), gate = sinCellTokens(h).find(t => t.tags?.includes("Distortion Gate"));
  const can = here && !run.searched && !run.fought && !run.revive && run.team.some(sinAlive);
  return `${sinDestroyed(run, h) ? "<p>Destruido por los Ultraentes.</p>" : ""}
    ${ub ? `<p><b>${esc(esSp(ub.species))}</b> (Ultraente). No se puede capturar.</p>${here ? `<button class="btn primary sin-move" data-act="sinub" ${can ? "" : "disabled"}>Combatir contra ${esc(esSp(ub.species))}</button>` : ""}` : ""}
    ${gate && here && sinGateTwin(gate) ? `<button class="btn sin-move" data-act="singate">${h.dw ? "Volver a Sinnoh" : "Entrar al Mundo Distorsión"}</button>` : ""}
    ${here && SIN.tokens[SIN_ULTRA_BURST]?.cell.join(",") === h.c + "," + h.r && run.necroPhase <= 3 ? `<button class="btn primary sin-move" data-act="sinnecro" ${can ? "" : "disabled"}>Combatir contra Necrozma (fase ${esc(run.necroPhase)})</button>` : ""}`;
}
function sinDrawUltra(ctx, run, z) {
  if (!sinUltra(run)) return;
  SIN_CELLS.forEach(h => {
    if (!run.destroyed[h.c + "," + h.r]) return;
    sinHex(ctx, h.x, h.y); ctx.fillStyle = "#1b0d2bb0"; ctx.fill();
  });
  run.ubs.forEach(u => {
    const h = SIN_BY_CELL.get(u.pos.join(",")); if (!h) return;
    const picture = sinPlayerImage(u.species), r = SIN_H * .62;
    ctx.save(); ctx.beginPath(); ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#2b1145"; ctx.fill(); ctx.strokeStyle = "#ff5ad2"; ctx.lineWidth = 4 / z; ctx.stroke(); ctx.clip();
    if (picture) { const w = picture.strip ? picture.im.width / 2 : picture.im.width; ctx.drawImage(picture.im, 0, 0, w, picture.im.height, h.x - r, h.y - r, r * 2, r * 2); }
    ctx.restore();
  });
}
function sinUltraEndScreen() {
  const run = ST.sin.run, won = run.ultraWon, v = run.victory;
  $("app").innerHTML = `<div class="sin-new"><div class="sin-new-inner"><h1>${won ? "¡Sinnoh está a salvo!" : "Fin de la Ultra Explosión"}</h1>
    <p>${won ? "Derrotaste las tres fases de Necrozma y cerraste la brecha. ¡Ganaste la campaña Ultra Explosión!" : esc(run.lost.reason)}</p>
    ${won && v ? `<p>Turnos jugados: ${esc(v.turns)} · PV: ${esc(v.pv)} · Pokémon capturados: ${esc(v.caught)}.</p>
    <h2>Equipo final</h2><ul>${v.team.map(s => `<li>${esc(esSp(s.species))} · Nv. ${esc(s.level)}</li>`).join("")}</ul>` : ""}
    <div class="btns">${won ? '<button class="btn primary" data-act="sinexplore">Seguir explorando</button>' : ""}<button class="btn" data-act="sinabandon">Nueva partida</button></div></div></div>`;
}
/* ---------- Evoluciones por objeto o intercambio ----------
   En Sinnoh no hay tienda ni intercambios: la piedra u objeto se consigue con 2 Bonguri de su color + 1 negro,
   y el intercambio se reemplaza por un Cordón Unión (2 Bonguri negros). Cancelar la evolución devuelve los Bonguri. */
const SIN_EVO_ITEMS = {THUNDERSTONE: "yellow", MOONSTONE: "pink", FIRESTONE: "red", LEAFSTONE: "green", WATERSTONE: "blue", SHINYSTONE: "white",
  SUNSTONE: "yellow", DUSKSTONE: "black", ICESTONE: "blue", CRACKEDPOT: "white", UNREMARKABLETEACUP: "white", METALALLOY: "white",
  PEATBLOCK: "green", OVALSTONE: "pink", RAZORFANG: "black", RAZORCLAW: "black"};
const SIN_EVO_METHODS = ["Item", "ItemNight", "NightHoldItem", "DayHoldItem", "CableLinkItem", "TradeSpecies", "Trade"];
function sinItemEvolutions(s) {
  return (sinSpeciesData(s.species)?.ev || []).filter(([target, method]) => SIN_EVO_METHODS.includes(method) && Dex.species.get(toID(target)).exists)
    .map(([target, method, param]) => {
      const trade = /Cable|Trade/.test(method), color = SIN_EVO_ITEMS[param] || "white";
      const cost = trade ? {black: 2} : color === "black" ? {black: 3} : {[color]: 2, black: 1};
      const item = param && Dex.items.get(toID(param)).exists ? esItem(toID(param)) : "";
      return {target: Dex.species.get(toID(target)).name, cost,
        name: trade ? "Cordón Unión" + (item ? " + " + item : "") : item || esSp(Dex.species.get(toID(param)).name)};
    });
}
function sinEvoItemsHTML(run) {
  const rows = run.team.flatMap((s, i) => sinItemEvolutions(s).map((e, j) => `<li><b>${esc(esSp(s.species))} → ${esc(esSp(e.target))}</b><small>${esc(e.name)} · ${esc(sinRecipeText(e.cost))}</small>
    <button class="btn" data-act="sinevoitem" data-member="${i}" data-evo="${j}" ${sinMapAction(run) && sinCanPay(run, e.cost) ? "" : "disabled"}>Usar</button></li>`));
  return rows.length ? `<h2>Evolución por objeto o intercambio</h2><p>Cancelar la evolución devuelve los Bonguri.</p><ul class="sin-objects">${rows.join("")}</ul>` : "";
}
function sinEvoByItem(member, index) {
  const run = ST.sin.run, s = run?.team[member], e = s && sinItemEvolutions(s)[index];
  if (!sinMapAction(run) || !e || !sinCanPay(run, e.cost)) return;
  sinPay(run, e.cost);
  run.progress = {kind: "item", won: null, rewards: run.team.map((m, i) => ({index: i, species: m.species, exp: 0, levels: [], events: []})),
    pending: [{index: member, kind: "evolution", target: e.target, refund: e.cost, hour: new Date().getHours()}]};
  run.notice = `Usaste ${e.name} con ${esSp(s.species)}.`;
  sinSave(); renderSin();
}
function sinCheckStamps(run, event = {}) {
  if (!run?.bag || !run.team || !run.box || !run.fate) return false;
  let changed = false;
  for (const key of ["stamps", "stampRewards", "stampNotices", "tms"]) {
    if (!run[key]) { run[key] = []; changed = true; }
  }
  const conditions = [event.failedCapture, event.trainer || run.act >= 2,
    Object.keys(SIN_BONGURI).every(k => run.bag[k] > 0),
    [...run.team, ...run.box].some(s => s.tier === "L") || Object.values(run.legendsDone || {}).includes("caught"),
    run.team.filter(s => s.item).length >= 3, event.swarm,
    new Set(run.fate.filter(k => Object.values(SIN_FATE_GODS).includes(k))).size >= 3];
  conditions.forEach((ok, i) => {
    if (!ok || run.stamps.some(s => s.id === i + 1)) return;
    run.stamps.push({id: i + 1, turn: run.turn, date: new Date().toISOString()}); changed = true;
    run.stampNotices.push(`¡Sello ${i + 1} conseguido! ${SIN_STAMPS[i]}`);
  });
  while (run.stampRewards.length < run.stamps.length) {
    const n = run.stampRewards.length + 1, tier = {2: "W", 4: "M", 6: "S"}[n];
    for (let rep = 0; rep < (sinFx(run, "stampsTwice") && n !== 7 ? 2 : 1); rep++)
    if (tier) {
      const pool = SIN_CARDS.filter(c => c.tier === tier && c.d?.sp && sinSignatureMove(c));
      shuffle(pool.slice()).slice(0, 5).forEach(c => run.tms.push({img: c.img, species: c.d.sp, move: sinSignatureMove(c), tier}));
    } else if (n === 7) run.noble = {used: false};
    else Object.entries(({1: {red: 1, blue: 1, yellow: 1}, 3: {pink: 1, green: 1, white: 1}, 5: {black: 3}})[n]).forEach(([k, amount]) => { run.bag[k] += amount; });
    run.stampRewards.push({milestone: n, turn: run.turn, date: new Date().toISOString()});
    run.stampNotices.push(`Hito ${n}: recibiste ${SIN_STAMP_REWARDS[n - 1]}.`); changed = true;
  }
  if (changed) sinCheckStamps(run);
  return changed;
}
function sinSave() { sinCheckStamps(ST.sin.run); save(); }
function sinStampNotices(run) {
  return run.stampNotices?.length ? `<div role="status">${run.stampNotices.map(n => `<p>${esc(n)}</p>`).join("")}<button class="btn" data-act="sinstampseen">Entendido</button></div>` : "";
}
function sinShowStamps() {
  const run = ST.sin.run; if (!run || !SIN_VIEW) return;
  SIN_VIEW.panel = "stamps"; SIN_VIEW.bag = false; SIN_VIEW.box = false; SIN_VIEW.selected = null;
  $("sin-card").innerHTML = `<div class="sin-card-head"><h2>Sellos de Viaje · ${run.stamps.length}/7</h2><button class="btn" data-act="sinclose">Cerrar</button></div>
    <ol>${SIN_STAMPS.map((text, i) => { const s = run.stamps.find(s => s.id === i + 1); return `<li>${esc(text)} <b>${s ? `Conseguido · Turno ${esc(s.turn)} · ${esc(s.date.slice(0, 10))}` : "Pendiente"}</b></li>`; }).join("")}</ol>
    <h2>Recompensas por cantidad de sellos</h2><ul class="sin-objects">${SIN_STAMP_REWARDS.map((text, i) => `<li>Hito ${i + 1}: ${esc(text)} · <b>${run.stampRewards.some(r => r.milestone === i + 1) ? "Reclamado" : "Pendiente"}</b></li>`).join("")}</ul>`;
  $("sin-card").hidden = false;
}
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
  if (!SIN_SIGNATURE_TEACH && run.progress?.signature) { delete run.progress.signature; changed = true; }
  if (!run.trainer && !run.trainerOffer) { run.trainerOffer = sinTrainerOffer(3); changed = true; }
  if (!run.bag) { run.bag = sinEmptyBag(); changed = true; }
  if (!run.campaign) {
    run.campaign = "heart"; run.act = 1; run.moveBonus = 0; run.grunts = [run.village]; run.bag.red += 3;
    run.notice = "Acto I · El Viaje: recibiste 3 Bonguri Rojos. Los Reclutas del Equipo Galaxia ocupan tu pueblo natal.";
    changed = true;
  }
  if (!run.balls) { run.balls = sinStartingBalls(); changed = true; }
  if (run.balls.spirit == null) { run.balls.spirit = 0; changed = true; }
  if (!Number.isInteger(run.ginkgo) || !SIN_GINKGO[run.ginkgo]) { run.ginkgo = sinNextGinkgo(); changed = true; }
  for (const key of ["traded", "flown", "captivating"]) {
    if (run[key] == null) { run[key] = false; changed = true; }
  }
  if (!run.stews) { run.stews = {}; changed = true; }
  if (!run.feast) { run.feast = {remaining: 0, used: []}; changed = true; }
  if (!run.discard) { run.discard = []; changed = true; }
  if (!run.shrineLegends) { run.shrineLegends = {}; changed = true; }
  if (!run.legendsDone) { run.legendsDone = {}; changed = true; }
  if (!run.shrineDiscard) { run.shrineDiscard = []; changed = true; }
  if (!run.shrineDeck) { run.shrineDeck = shuffle(SIN_SHRINE_CARDS.map((_, i) => i)); changed = true; }
  if (run.offered == null) { run.offered = false; changed = true; }
  if (run.fractures == null) { run.fractures = 0; changed = true; }
  if (!run.grunts) { run.grunts = []; changed = true; }
  if (!run.fragments) { run.fragments = []; changed = true; }
  for (const key of ["heart", "won"]) {
    if (run[key] == null) { run[key] = false; changed = true; }
  }
  if (run.originGod === undefined) { run.originGod = null; changed = true; }
  if (run.caught == null) { run.caught = Math.max(0, run.team.length + (run.box?.length || 0) - 1); changed = true; }
  if (!run.box) { run.box = []; changed = true; }
  if (run.pv == null) { run.pv = 0; changed = true; }
  if (!run.hidden) { run.hidden = sinShuffleHidden(); changed = true; }
  if (!run.items) { run.items = []; changed = true; }
  if (!run.fate) { run.fate = []; changed = true; }
  if (run.stars == null) { run.stars = 0; changed = true; }
  if (run.follower === undefined) { run.follower = null; changed = true; }
  if (run.fatePlayed == null) { run.fatePlayed = false; changed = true; }
  if (!run.fateDeck || !run.fateDiscard) {
    // Se restan copias, no frentes: una mano puede tener varias cartas iguales.
    const remaining = SIN_FATE.map(c => c.img);
    [...run.fate, ...(run.fateDeck || []), ...(run.fateDiscard || [])].forEach(key => {
      const i = remaining.indexOf(key); if (i >= 0) remaining.splice(i, 1);
    });
    if (!run.fateDeck) { run.fateDeck = shuffle(remaining.splice(0)); }
    run.fateDiscard = [...(run.fateDiscard || []), ...remaining]; changed = true;
  }
  const sets = [...run.team, ...run.box, ...(run.battle ? run.battle.foes || [run.battle.wild] : [])];
  sets.forEach(s => {
    if (s.exp == null) { s.exp = sinExpForLevel(sinSpeciesData(s.species)?.gw, s.level); changed = true; }
    if (!s.gender) { s.gender = sinGender(s.species); changed = true; }
    if (s.friendship == null) { s.friendship = sinBaseFriendship(s.species); changed = true; }
  });
  if (sinCheckStamps(run)) changed = true;
  if (changed) sinSave();
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
function sinGainExp(run, rivals, me, trainer = false) {
  if (!Array.isArray(rivals)) rivals = [rivals];
  const p = run.progress = {won: true, rewards: [], pending: []};
  if (run.mode === "cards") return;
  run.team.forEach((s, index) => {
    const reward = {index, species: s.species, exp: 0, levels: [], events: []}; p.rewards.push(reward);
    if (!sinAlive(s)) return;
    s.friendship = Math.min(255, s.friendship + SIN_FRIEND_WIN);
    const sp = Dex.species.get(s.species), gw = sinSpeciesData(s.species)?.gw, oldMax = calcStat(sp, s, "hp");
    const m = me.mons["p1:Sinnoh" + (index + 1)], participated = m && m.side === "p1";
    const moves = sinLevelMoves(s.species);
    rivals.forEach(foe => {
      const rival = sinSpeciesData(foe.species);
      const gain = Math.floor(sinWildExp(rival?.be || 0, foe.level, s.level) * (trainer ? 1.5 : 1) *
        (participated ? 1 : SIN_EXP_SHARE) * (toID(s.item) === "luckyegg" ? 1.5 : 1));
      const before = s.exp; s.exp = Math.min(sinExpForLevel(gw, 100), s.exp + gain); reward.exp += s.exp - before;
      sinGainEVs(s, rival?.evs);
      while (s.level < 100 && s.exp >= sinExpForLevel(gw, s.level + 1)) {
        s.level++; reward.levels.push(s.level);
        s.friendship = sinFriendLevel(s.friendship);
        moves.filter(([n]) => n === s.level).forEach(([, move]) => p.pending.push({index, move: toID(move), level: s.level}));
      }
    });
    s.hpMax = calcStat(sp, s, "hp");
    if (s.hpNow != null) s.hpNow = Math.min(s.hpMax, s.hpNow + s.hpMax - oldMax);
  });
  const hour = new Date().getHours();
  p.rewards.filter(r => r.levels.length).forEach(r => p.pending.push({index: r.index, kind: "evolution", hour}));
  sinAdvanceMoves(run);
}
const sinSearchToken = t => !!(SIN_OFFER_COUNT[t.tier] && t.b && t.k && /Apricorn (Tree|Reef)/.test(t.n) && !ST.sin.run?.destroyed?.[t.cell?.join(",")]);
const sinWildCards = t => SIN_CARDS.filter(c => c.d && c.d.sp && c.tier === t.tier && c.b === t.b && c.k === t.k);
const sinAlive = s => s.hpNow == null || s.hpNow > 0;
let SIN_BUSY = false;
const SIN_HOME = SIN.decks.find(d => d.n === "Home Village Cards").cards;
const SIN_STARTERS = SIN_CARDS.filter(c => (c.tags || []).includes("Starter Card"));
const SIN_PROLOGUE = SIN_CARDS.find(c => (c.tags || []).includes("Act Card") && String(c.cid).endsWith("00"));
const sinStarterCard = sp => SIN_STARTERS.find(c => toID(c.d.sp) === toID(sp));
let SIN_NEW = {village: null, species: null, busy: false, mode: "pokemon"};
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
  "Odd Keystone": "Piedra Espíritu", "Gracidea Flower": "Gracídea", "Seafarer Egg": "Huevo Marino",
  "Magma Stone": "Piedra Magma", "Secret Key": "Llave Secreta", "Steelrock Core": "Núcleo Steelrock",
  "Icesteel Core": "Núcleo Icesteel", "Rockice Core": "Núcleo Rockice", "Adamant Artifact": "Diamansfera",
  "Lustrous Artifact": "Lustresfera", "Griseous Artifact": "Griseosfera", "The Distortion World": "Mundo Distorsión",
  "Lake Verity Battle": "Lago Veraz · Equipo Galaxia", "Lake Acuity Battle": "Lago Agudeza · Equipo Galaxia",
  "Lake Valor Battle": "Lago Valor · Equipo Galaxia", "Origin Shrine": "Santuario Origin", "Temple of Sinnoh Battle": "Templo de Sinnoh · Equipo Galaxia"
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
  #sin-map{transition:transform .35s ease}.sin-stage{perspective-origin:50% 40%}
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
  .sin-new .btn{white-space:normal;min-height:44px}
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
  .sin-class{display:flex;align-items:center;gap:8px}.sin-class img,.sin-trainers .sin-class img{width:56px;height:56px;aspect-ratio:auto;object-fit:contain;image-rendering:pixelated;flex:none;background:none}
  .sin-intro{position:absolute;inset:0;z-index:7;pointer-events:none;transition:opacity .7s}.sin-intro.out{opacity:0}
  .sin-intro img{position:absolute;image-rendering:pixelated;animation:sinIn .5s ease-out}
  .sin-intro-foe{right:8%;top:2%;height:48%}.sin-intro-me{left:4%;bottom:0;height:52%;transform:scaleX(-1)}.sin-intro-me.back{transform:none;height:62%}
  @keyframes sinIn{from{opacity:0;translate:0 12px}}
  .sin-ball{position:absolute;z-index:5;width:48px;height:48px;left:14%;top:70%;transform:translate(-50%,-50%);background-repeat:no-repeat;background-size:384px 96px;background-position:0 0;image-rendering:pixelated;transition:left .55s cubic-bezier(.3,.6,.6,1),top .55s cubic-bezier(.2,-.6,.6,1)}
  .sin-ball.fly{left:73%;top:20%}.sin-ball.land{top:35%;transition:top .3s ease-in}
  .sin-ball.spin{animation:sinSpin .3s steps(8) infinite}@keyframes sinSpin{to{background-position-x:-384px}}
  .sin-ball.wobble{animation:sinWobble .6s ease-in-out}@keyframes sinWobble{25%{transform:translate(-50%,-50%) rotate(-25deg)}75%{transform:translate(-50%,-50%) rotate(25deg)}}
  .sin-ball.done{filter:brightness(.75)}.sin-ball.open{background-size:48px 96px}
  .sin-star{position:absolute;left:12px;top:12px;width:24px;height:24px;background-size:contain;background-repeat:no-repeat;animation:sinStar .8s ease-out forwards}
  .sin-star.s0{--x:-34px;--y:-30px}.sin-star.s1{--x:0px;--y:-42px}.sin-star.s2{--x:34px;--y:-30px}
  @keyframes sinStar{to{transform:translate(var(--x),var(--y));opacity:0}}
  .mon.sin-absorbed{opacity:0;transform:scale(.2)}
  .sin-trainers{display:grid;gap:12px}.sin-trainers .sin-choice{cursor:default;text-align:left}.sin-trainers img{width:100%;height:auto;aspect-ratio:auto;background:none;object-fit:contain;border-radius:8px}.sin-trainers p{margin:6px 0}
  .sin-mon{display:flex;justify-content:center;align-items:flex-end;height:104px;overflow:hidden}
  .sin-mon img{width:96px;height:96px;object-fit:contain}
  .sin-mon .spr{display:none;width:var(--w);height:var(--s);flex:none;background-repeat:no-repeat;background-size:auto 100%;image-rendering:pixelated;animation:sprA var(--d) steps(var(--n)) infinite}
  .sin-mon.sp .spr{display:block}.sin-mon.sp img{display:none}
  .sin-types{display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin:4px 0}
  .sin-offer .btn{margin-top:8px;min-height:44px}
  .sin-notice{flex-basis:100%;margin:0;color:var(--ink2);font-size:13px}
  .sin-turn .btn{min-height:44px}
  .sin-bag{display:flex;gap:8px 16px;flex-wrap:wrap;padding:0;list-style:none}
  .sin-bag li{display:flex;align-items:center;gap:6px}
  .sin-bonguri{width:15px;height:15px;border-radius:50%;border:1px solid var(--ink2);flex-shrink:0}
  .sin-recipes{display:grid;gap:10px}
  .sin-recipe{display:flex;align-items:center;justify-content:space-between;gap:12px}
  .sin-recipe small{display:block;color:var(--ink2)}
  .sin-recipe .btn,.sin-recipes>.btn{min-height:44px;white-space:normal}
  .sin-ginkgo{display:block;width:min(100%,300px);height:auto;margin:10px auto}
  .sin-objects{display:grid;gap:10px;padding:0;list-style:none}
  .sin-objects li{border:1px solid var(--line);border-radius:8px;padding:8px}
  .sin-objects .btn{min-height:44px;white-space:normal}
  .sin-fate{display:flex;gap:8px;flex-wrap:wrap}
  .sin-fate img{width:100px;max-width:100%;aspect-ratio:4/7;object-fit:contain}
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
  sinFillSprites(); sinFillAnil();
}
// Retrato del Pokémon al elegirlo: sprite animado de frente (Essentials) con la ilustración oficial de respaldo.
// Las imágenes de las cartas Pokémon siguen en sinnoh_datos.js; sinCardImage puede dibujarlas al replicar el juego original.
function sinMonPic(species) {
  const id = typeof sprUrl === "function" ? sprUrl(species, false, false) : null;
  return `<span class="sin-mon"${id ? ` data-sin-spr="${esc(id)}"` : ""}><img src="${esc(img(species))}" alt="${esc(esSp(species))}" loading="lazy"><span class="spr" aria-hidden="true"></span></span>`;
}
function sinMonInfo(species, extra = "") {
  return `${sinMonPic(species)}<b>${esc(esSp(species))}</b><span class="sin-types">${Dex.species.get(species).types.map(tchip).join("")}</span>${extra}`;
}
function sinFillSprites() {
  document.querySelectorAll(".sin-mon[data-sin-spr]:not([data-loaded])").forEach(el => {
    el.dataset.loaded = 1;
    const id = el.dataset.sinSpr, e = sprEntry(id), box = el.querySelector(".spr");
    sprLoad(id).then(u => {
      if (!u || !el.isConnected) return;
      const h = 96, w = h * e[4] / e[5];
      box.style.cssText = `--s:${h}px;--w:${w.toFixed(2)}px;--n:${e[3]};--d:${Math.max(.4, e[3] / 26).toFixed(2)}s;background-image:url("${u}")`;
      el.classList.add("sp");
    });
  });
}
function sinCardImage(key, name, cls = "") {
  return `<img class="${esc(cls)}" data-sin-img="${esc(key)}" alt="${esc(name)}">`;
}
function sinNewScreen() {
  const v = SIN_NEW.village, sp = SIN_NEW.species, step = sp ? 3 : v ? 2 : 1;
  $("app").innerHTML = `<div class="sin-new"><div class="sin-new-inner"><button class="back" data-act="sinback">‹ Batalla</button>
    <h1>Nueva partida</h1><p>Leyendas de Sinnoh · Paso ${step} de 3</p>
    <div class="sin-new-actions"><button class="btn ${SIN_NEW.mode === "cards" ? "" : "primary"}" data-act="sinmode" data-mode="pokemon">Batalla Pokémon</button><button class="btn ${SIN_NEW.mode === "cards" ? "primary" : ""}" data-act="sinmode" data-mode="cards">Modo Cartas</button></div>
    <p>${SIN_NEW.mode === "cards" ? "Modo Cartas: el juego de mesa tal cual. Combates con las cartas y dados del mod, captura con dados, evolución pagando Puntos de Viaje y movimientos aprendidos de los Pokémon derrotados." : "Batalla Pokémon: combates como en los juegos, con EXP, niveles, ataques y evolución reales."}</p>
    ${step === 1 ? `<h2>Elige tu pueblo natal</h2><div class="sin-choices">${SIN_VILLAGES.map(v => {
      const card = SIN_HOME.find(c => c.gm === v.color);
      return `<button class="sin-choice" data-act="sinvillage" data-village="${esc(v.village)}">${sinCardImage(card.img, "Carta de " + v.name)}<b>${esc(v.name)}</b></button>`;
    }).join("")}</div>` : step === 2 ? `<h2>${esc(v.name)} · Elige tu inicial</h2><div class="sin-choices sin-starters">${v.starters.map(s =>
      `<button class="sin-choice" data-act="sinstarter" data-species="${esc(s)}">${(SIN_NEW.mode === "cards" ? sinCardImage(sinStarterCard(s).img, esSp(s)) + `<b>${esc(esSp(s))}</b>` : sinMonInfo(s, "<span>Nv. 5</span>"))}</button>`).join("")}</div>
      <div class="sin-new-actions"><button class="btn" data-act="sinnewback">Volver a los pueblos</button></div>` :
      `<h2>Prólogo · La Incursión</h2><p>${esc(v.name)} · ${esc(esSp(sp))} · Nivel 5</p>${sinCardImage(SIN_PROLOGUE.img, "Prólogo: La Incursión", "sin-prologue")}
      <div class="sin-new-actions"><button class="btn" data-act="sinnewback">Volver a los iniciales</button><button class="btn primary" data-act="sinbegin">Corazón de Sinnoh</button></div>
      <h2>Ultra Explosión</h2><p>Campaña alternativa: detén a los Ultraentes y derrota a Necrozma antes de que la brecha llegue al 70 %. Elige la dificultad (Bendiciones de Arceus):</p>
      <div class="sin-new-actions">${Object.entries(SIN_DIFFICULTY).map(([k, d]) => `<button class="btn" data-act="sinbeginultra" data-diff="${k}">${esc(d.name)} (${d.bless})</button>`).join("")}</div><p id="sin-new-error" role="alert"></p>`}
    </div></div>`;
  sinFillImages();
}
async function sinInitialSet(species, level = 5, alpha = false) {
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
  Object.keys(set.ivs).forEach(k => { set.ivs[k] = alpha ? 31 : Math.floor(Math.random() * 32); });
  if (alpha) set.alpha = true;
  set.exp = sinExpForLevel(sinSpeciesData(species)?.gw, level); set.gender = sinGender(species);
  set.friendship = sinBaseFriendship(species);
  const natures = Dex.natures.all(); set.nature = natures[Math.floor(Math.random() * natures.length)].name;
  return set;
}
async function sinBegin(difficulty = null) {
  if (SIN_NEW.busy || !SIN_NEW.village || !SIN_NEW.species || ST.sin.run) return;
  const v = SIN_NEW.village, species = SIN_NEW.species;
  const token = SIN.tokens.find(t => t.n === v.village && (t.tags || []).includes("Village Token"));
  SIN_NEW.busy = true;
  document.querySelectorAll(".sin-new button").forEach(b => { b.disabled = true; });
  try {
    const set = await sinInitialSet(species);
    ST.sin.run = {v: 1, village: v.village, color: v.color, pos: [...token.cell], team: [set], turn: 1, moved: 0, frag: 0,
      bag: sinEmptyBag(), balls: sinStartingBalls(), box: [], pv: 0, hidden: sinShuffleHidden(),
      items: [], stars: 0, fate: [], fateDeck: shuffle(SIN_FATE.map(c => c.img)), fateDiscard: [], fatePlayed: false, follower: null,
      ginkgo: sinNextGinkgo(), traded: false, flown: false, stews: {}, captivating: false,
      campaign: "heart", act: 1, moveBonus: 0, grunts: [v.village], fragments: [], heart: false, originGod: null, won: false, caught: 0,
      notice: "Acto I · El Viaje: recibiste 3 Bonguri Rojos. Los Reclutas del Equipo Galaxia ocupan tu pueblo natal."};
    ST.sin.run.bag.red = 3;
    if (SIN_NEW.mode === "cards") { ST.sin.run.mode = "cards"; ST.sin.run.team = [cardSet(set, sinStarterCard(species))]; }
    if (difficulty) sinUltraSetup(ST.sin.run, difficulty);
    // La cámara del antiguo visor no se hereda a una partida nueva.
    ST.sin.cam = null; sinSave(); renderSin();
  } catch (err) {
    if ($("sin-new-error")) $("sin-new-error").textContent = "No se pudo preparar el inicial. Intenta comenzar de nuevo.";
  } finally {
    SIN_NEW.busy = false; document.querySelectorAll(".sin-new button").forEach(b => { b.disabled = false; });
  }
}
function sinReachable(pos, remaining, parents = null) {
  const start = pos.join(","), dist = new Map([[start, 0]]), queue = [SIN_BY_CELL.get(start)];
  if (!queue[0]) return new Map();
  for (let i = 0; i < queue.length; i++) {
    const h = queue[i], cost = dist.get(h.c + "," + h.r); if (cost >= remaining) continue;
    [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 2], [0, -2]].forEach(([dc, dr]) => {
      const key = (h.c + dc) + "," + (h.r + dr), next = SIN_BY_CELL.get(key);
      if (!next || dist.has(key) || (Math.abs(next.l - h.l) > 1 && !sinFx(ST.sin.run, "climb") && !(sinFx(ST.sin.run, "glide") && next.l < h.l))) return;
      dist.set(key, cost + 1); if (parents) parents.set(key, h.c + "," + h.r); queue.push(next);
    });
  }
  dist.delete(start); return dist;
}
const sinTasty = run => run.stews?.tasty || run.feast?.used.includes("tasty");
const sinMaxMoves = run => 3 + run.frag + (run.moveBonus || 0) + (sinTasty(run) ? 3 : 0) + (run.originGod && (run.follower === run.originGod || run.followerAll) ? 1 : 0) + (run.biomeBonus || 0) + (run.stashMoves || 0);
function sinTeamHTML(run) {
  return run.team.map(s => {
    const healthy = s.hpNow == null, pct = healthy ? 100 : s.hpMax ? Math.max(0, Math.min(100, s.hpNow / s.hpMax * 100)) : 0;
    const health = !sinAlive(s) ? "Debilitado" : healthy ? "PS completos" : `${s.hpNow}/${s.hpMax} PS`;
    const gw = sinSpeciesData(s.species)?.gw, start = sinExpForLevel(gw, s.level), next = sinExpForLevel(gw, s.level + 1);
    const expPct = s.level >= 100 ? 100 : Math.max(0, Math.min(100, (s.exp - start) / (next - start) * 100));
    const expLabel = s.level >= 100 ? "Nivel máximo" : `${s.exp - start}/${next - start} EXP hacia el nivel ${s.level + 1}`;
    return `<span class="sin-member">${pimg(s.species)}<span>${esc(esSp(s.species))}${s.alpha ? " · Alfa" : ""}${s.card ? " · " + esc(cardMoves(s).length) + " mov." : " · Nv. " + esc(s.level)}${s.gender === "M" ? " ♂" : s.gender === "F" ? " ♀" : ""}
      <span class="sin-hp" role="meter" aria-label="PS de ${esc(esSp(s.species))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></span>
      ${s.card ? "" : `<span class="sin-hp sin-exp" role="meter" aria-label="${esc(expLabel)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${expPct}"><i style="width:${expPct}%"></i></span>`}
      <small>${esc(health)}${SIN_STATUS[s.status] && sinAlive(s) ? " · " + esc(SIN_STATUS[s.status]) : ""}${s.item ? " · " + esc(sinItemName(s.item)) : ""}</small></span></span>`;
  }).join("");
}
function sinUpdateTurn() {
  const run = ST.sin.run; if (!run || !SIN_VIEW) return;
  const max = sinMaxMoves(run), left = run.fought || run.revive ? 0 : Math.max(0, max - run.moved);
  SIN_VIEW.reachable = run.fateTeleport ? sinTeleportCells(run) : sinReachable(run.pos, left);
  $("sin-turn").innerHTML = `<div class="sin-turn-info">Turno ${esc(run.turn)} · Movimientos: ${esc(left)}/${esc(max)} · PV: ${esc(run.pv)} · Equipo ${esc(run.team.length)}/${esc(sinTeamSlots(run))}${sinUltra(run) ? ` · <b>Brecha ${esc(Math.floor(run.breach))} %</b>` : ""}</div>
    <div class="sin-team">${sinTeamHTML(run)}</div>
    <button class="btn" data-act="sinbag">Bolsa</button>
    <button class="btn" data-act="sincampaign">Campaña</button>
    <button class="btn" data-act="sinstamps">Sellos (${run.stamps.length}/7)</button>
    ${run.trainer ? '<button class="btn" data-act="sintrainerpanel">Entrenador</button>' : ""}
    ${sinUltra(run) && run.blessings > 0 ? `<button class="btn" data-act="sinbless" ${run.blessSkip ? "disabled" : ""}>Bendición de Arceus (${esc(run.blessings)})${run.blessSkip ? ": activa" : ""}</button>` : ""}
    ${sinFx(run, "flyAnywhere") && !sinVillage(run) ? `<button class="btn" data-act="sinflyopen" ${run.flown || run.fought ? "disabled" : ""}>Volar</button>` : ""}
    <button class="btn primary" data-act="sinendturn">Terminar turno</button>
    ${run.fateTeleport ? '<p>Palkia: toca una casilla resaltada. <button class="btn" data-act="sinfatecancel">Cancelar teletransporte</button></p>' : ""}
    ${run.notice ? `<p class="sin-notice">${esc(run.notice)}</p>` : ""}${sinStampNotices(run)}`;
  sinFillImages(); if (SIN_VIEW.panel === "ginkgo") sinShowGinkgo(); else if (SIN_VIEW.panel === "fly") sinShowFlight();
  else if (SIN_VIEW.panel === "campaign") sinShowCampaign();
  else if (SIN_VIEW.panel === "shrine") sinShowShrine();
  else if (SIN_VIEW.panel === "stamps") sinShowStamps();
  else if (SIN_VIEW.panel === "trainer") sinTrainerPanel();
  else if (SIN_VIEW.box) sinShowBox(); else if (SIN_VIEW.bag) sinShowBag(); else if (SIN_VIEW.selected) sinShowCell(SIN_VIEW.selected); sinRequestDraw();
}
function sinCampaignHTML(run) {
  const act = SIN_ACTS[run.act], home = SIN_VILLAGES.find(v => v.village === run.village)?.name || run.village;
  return `<h2>${esc(act.name)}</h2>${sinCardImage(act.img, act.name, "sin-ginkgo")}
    <p>Objetivo: ${esc(act.objective)}</p>
    <p>Reclutas en ${esc(home)}: ${run.grunts.includes(run.village) ? "pendiente" : "derrotados"}.</p>
    <p>Movimientos extra permanentes: +${esc(run.moveBonus)}.</p>
    <p>Fragmentos: ${esc(run.fragments.length)}/3 · Espacios de equipo: ${esc(sinTeamSlots(run))}/6.</p>
    ${run.act >= 2 ? `<ul>${SIN_COMMANDERS.map(c => `<li>${esc(c.fragment)} · ${esc(c.lake)} · ${run.fragments.includes(c.id) ? "obtenido" : "pendiente"}</li>`).join("")}</ul>` : ""}
    ${run.act >= 3 ? `<p>Corazón de Sinnoh: ${run.heart ? "obtenido" : "pendiente: ofrenda de 1 Bonguri en el Santuario Origin"}.</p><p>Helio: ${run.act >= 4 ? "derrotado" : run.heart ? "pendiente en el Templo de Sinnoh" : "restaura primero el Corazón"}.</p>` : ""}
    ${run.won ? "<p>¡Eres Héroe de Sinnoh! Puedes seguir explorando.</p>" : ""}`;
}
const sinFinalChoicesHTML = () => `<div class="btns"><button class="btn primary" data-act="sinhero">Héroe de Sinnoh</button><button class="btn" disabled>Traidor de Sinnoh · Requiere otros entrenadores</button></div>`;
function sinFinalScreen() {
  const run = ST.sin.run;
  $("app").innerHTML = `<div class="sin-new"><div class="sin-new-inner"><h1>Final · La Elección</h1>${sinCampaignHTML(run)}${sinFinalChoicesHTML()}</div></div>`;
  sinFillImages();
}
function sinHero() {
  const run = ST.sin.run;
  if (!run || run.act !== 4 || run.won || run.battle || run.progress?.pending.length) return;
  run.won = true;
  run.victory = {turns: run.turn, team: run.team.map(s => ({species: s.species, level: s.level})), pv: run.pv, caught: run.caught};
  delete run.progress; sinSave(); if (B) B.dead = true; B = null; go("sin");
}
function sinVictoryScreen() {
  const v = ST.sin.run.victory;
  $("app").innerHTML = `<div class="sin-new"><div class="sin-new-inner"><h1>¡Felicidades, Héroe de Sinnoh!</h1>
    <p>Restauraste el Corazón de Sinnoh y derrotaste al Equipo Galaxia. ¡Ganaste la partida!</p>
    <p>Turnos jugados: ${esc(v.turns)} · PV: ${esc(v.pv)} · Pokémon capturados: ${esc(v.caught)}.</p>
    <h2>Equipo final</h2><ul>${v.team.map(s => `<li>${esc(esSp(s.species))} · Nv. ${esc(s.level)}</li>`).join("")}</ul>
    <div class="btns"><button class="btn primary" data-act="sinexplore">Seguir explorando</button><button class="btn" data-act="sinabandon">Nueva partida</button></div></div></div>`;
}
function sinShowCampaign() {
  const run = ST.sin.run; if (!run || !SIN_VIEW) return;
  SIN_VIEW.panel = "campaign"; SIN_VIEW.bag = false; SIN_VIEW.box = false; SIN_VIEW.selected = null;
  $("sin-card").innerHTML = `<div class="sin-card-head"><h2>Campaña · ${sinUltra(run) ? "Ultra Explosión" : "Corazón de Sinnoh"}</h2><button class="btn" data-act="sinclose">Cerrar</button></div>${sinUltra(run) ? sinUltraHTML(run) : sinCampaignHTML(run)}`;
  $("sin-card").hidden = false; sinFillImages(); sinRequestDraw();
}
const sinCanPay = (run, recipe) => Object.entries(recipe).every(([k, n]) => run.bag[k] >= n);
const sinPay = (run, recipe) => Object.entries(recipe).forEach(([k, n]) => { run.bag[k] -= n; });
const sinRecipeText = recipe => Object.entries(recipe).map(([k, n]) => `${n} Bonguri ${SIN_BONGURI[k][0]}`).join(" + ");
const sinMapAction = run => !!(VIEW === "sin" && SIN_VIEW && run && !run.battle && !run.progress && !run.shrineEvent && !run.fateTeleport && !run.revive && !(run.offer && !run.offer.closed));
const sinRecipe = (key, kind) => {
  const r = (kind === "stew" ? SIN_STEWS : kind === "item" ? SIN_CRAFT_ITEMS : kind === "ball" ? SIN_BALLS : {})[key];
  if (!r?.recipe || (kind === "stew" && key === "master" && !sinFx(ST.sin.run, "masterStew"))) return null;
  // Creador de Equipo: los objetos de batalla cuestan 1 Bonguri de cada color de su receta.
  return kind === "item" && sinFx(ST.sin.run, "cheapItems") ? {...r, recipe: Object.fromEntries(Object.keys(r.recipe).map(k => [k, 1]))} : r;
};
const sinCanCraft = (run, key, kind = "ball") => {
  const recipe = sinRecipe(key, kind);
  const free = kind === "stew" && sinFreeStew(run, key);
  return !!recipe && (free || sinCanPay(run, recipe.recipe)) && (kind !== "stew" || ((free || !run.stews[key]) && (key !== "infused" || run.team.some(s => s.level < 100))));
};
const sinFreeStew = (run, key) => run.feast.remaining > 0 && !run.feast.used.includes(key);
function sinCraft(key, kind = "ball", member = null) {
  const run = ST.sin.run;
  const event = run?.shrineEvent;
  const feast = event?.queue && event.started && SIN_SHRINE_EFFECTS[SIN_SHRINE_CARDS[event.queue[event.cursor]].img].kind === "feast";
  if ((!sinMapAction(run) && !(VIEW === "sin" && feast && !run.progress && kind === "stew" && sinFreeStew(run, key))) || !sinCanCraft(run, key, kind)) return;
  if (kind === "stew" && key === "infused" && run?.mode !== "cards") {
    if (member === null) {
      if (feast) { event.infuse = true; sinSave(); return sinShrineScreen(); }
      SIN_VIEW.bagStew = true; return sinShowBag();
    }
    if (!Number.isInteger(member) || !run.team[member] || run.team[member].level >= 100) return;
  }
  const free = kind === "stew" && sinFreeStew(run, key);
  if (free) { run.feast.remaining--; run.feast.used.push(key); }
  else sinPay(run, sinRecipe(key, kind).recipe);
  if (kind === "ball") run.balls[key]++;
  else if (kind === "item") { run.items.push(toID(key)); if (sinFx(run, "craftTwice")) run.items.push(toID(key)); }
  else {
    if (!free) run.stews[key] = true;
    if (key === "restoring") run.team.forEach(s => { delete s.hpNow; delete s.status; });
    if (key === "captivating") run.captivating = true;
    if (key === "master") run.masterStew = true;
    if (!free && sinFx(run, "picnic")) run.feast.remaining++;
    if (key === "infused" && run.mode === "cards") run.halfEvo = true;
    else if (key === "infused") { sinInfuse(run, member); sinSave(); return renderSin(); }
  }
  run.notice = kind === "stew" ? `${SIN_STEWS[key].name}: ${SIN_STEWS[key].effect}` : `Fabricaste ${kind === "item" ? esItem(key) : SIN_BALLS[key].name}.`;
  sinSave(); if (feast) return sinShrineScreen(); sinUpdateTurn();
}
function sinInfuse(run, index) {
  const s = run.team[index], sp = Dex.species.get(s.species), oldMax = calcStat(sp, s, "hp"), before = s.exp;
  s.level++; s.exp = sinExpForLevel(sinSpeciesData(s.species)?.gw, s.level); s.friendship = sinFriendLevel(s.friendship);
  s.hpMax = calcStat(sp, s, "hp");
  if (s.hpNow != null && s.hpNow > 0) s.hpNow = Math.min(s.hpMax, s.hpNow + s.hpMax - oldMax);
  run.progress = {kind: "stew", won: null, rewards: run.team.map((_, i) => ({index: i, exp: i === index ? s.exp - before : 0, levels: i === index ? [s.level] : [], events: []})),
    pending: sinLevelMoves(s.species).filter(([n]) => n === s.level).map(([, move]) => ({index, move: toID(move), level: s.level}))};
  run.progress.pending.push({index, kind: "evolution", hour: new Date().getHours()});
  run.notice = `¡${esSp(s.species)} subió un nivel con el Estofado Infundido!`;
  sinAdvanceMoves(run);
}
function sinShowBag() {
  const run = ST.sin.run; if (!run || !SIN_VIEW) return;
  SIN_VIEW.bag = true; SIN_VIEW.box = false; SIN_VIEW.selected = null; SIN_VIEW.panel = null;
  $("sin-card").innerHTML = `<div class="sin-card-head"><h2>Bolsa</h2><button class="btn" data-act="sinclose">Cerrar</button></div>
    <ul class="sin-bag">${Object.entries(SIN_BONGURI).map(([k, [name, , color]]) =>
      `<li><span class="sin-bonguri" style="background:${color}" aria-hidden="true"></span>Bonguri ${esc(name)} ×${esc(run.bag[k])}</li>`).join("")}</ul>
    <h2>Balls</h2><div class="sin-recipes">${Object.entries(SIN_BALLS).filter(([, b]) => b.recipe).map(([key, ball]) => `<div class="sin-recipe"><span><b>${esc(ball.name)} ×${esc(run.balls[key])}</b>
      <small>${Object.entries(ball.recipe).map(([k, n]) => `${esc(n)} Bonguri ${esc(SIN_BONGURI[k][0])}`).join(" + ")}</small></span>
      <button class="btn" data-act="sincraft" data-ball="${key}" ${sinCanCraft(run, key) ? "" : "disabled"}>Fabricar</button></div>`).join("")}</div>
    <h2>Estofados</h2><p>Cada estofado se puede elaborar una vez por turno y se consume al instante.</p>
    ${run.feast.remaining ? `<p>Banquete: hasta ${esc(run.feast.remaining)} estofados distintos gratis este turno, sin gastar su uso habitual.</p>` : ""}
    ${run.balls.glory ? `<p>Gloria Ball ×${esc(run.balls.glory)}: captura asegurada.</p>` : ""}
    <div class="sin-recipes">${Object.entries(SIN_STEWS).filter(([k]) => k !== "master" || sinFx(run, "masterStew")).map(([key, stew]) => `<div><div class="sin-recipe"><span><b>${esc(stew.name)}</b><small>${esc(sinRecipeText(stew.recipe))}</small><small>${esc(stew.effect)}</small></span>
      <button class="btn" data-act="sinstew" data-stew="${key}" ${sinCanCraft(run, key, "stew") ? "" : "disabled"}>${sinFreeStew(run, key) ? "Usar gratis" : run.stews[key] ? "Usado" : "Elaborar"}</button></div>
      ${key === "infused" && SIN_VIEW.bagStew && sinCanCraft(run, key, "stew") ? `<p>Elige el Pokémon que subirá de nivel:</p><div class="btns">${run.team.map((s, i) => `<button class="btn" data-act="sininfuse" data-member="${i}" ${s.level < 100 ? "" : "disabled"}>${esc(esSp(s.species))} · Nv. ${esc(s.level)}</button>`).join("")}</div>` : ""}</div>`).join("")}</div>
    ${run.captivating ? "<p>Estofado Cautivador preparado para el primer intento de captura del próximo combate salvaje.</p>" : ""}
    <h2>Objetos de batalla</h2><div class="sin-recipes">${Object.entries(SIN_CRAFT_ITEMS).map(([key, item]) => `<div class="sin-recipe"><span><b>${esc(esItem(key))}</b><small>${esc(item.name)} · ${esc(sinRecipeText(item.recipe))}</small>${key === "luckyegg" ? "<small>Su portador recibe ×1,5 de EXP.</small>" : ""}</span>
      <button class="btn" data-act="sincraftitem" data-item="${key}" ${sinCanCraft(run, key, "item") ? "" : "disabled"}>Fabricar</button></div>`).join("")}</div>
    <h2>Objetos</h2>${run.items.length ? `<ul class="sin-objects">${run.items.map((id, i) => `<li><b>${esc(sinItemName(id))}</b>
      <button class="btn" data-act="sinitemselect" data-item="${i}">Equipar</button>
      ${SIN_VIEW.bagItem === i ? `<p>Equipar a…</p><div class="btns">${run.team.map((s, j) => `<button class="btn" data-act="sinequip" data-item="${i}" data-member="${j}">${esc(esSp(s.species))} · Nv. ${esc(s.level)}${s.item ? " · Devolver " + esc(sinItemName(s.item)) : ""}</button>`).join("")}</div>` : ""}</li>`).join("")}</ul>` : "<p>No tienes objetos en el inventario.</p>"}
    <ul class="sin-objects">${run.team.map((s, i) => s.item ? `<li>${esc(esSp(s.species))}: <b>${esc(sinItemName(s.item))}</b>
      <button class="btn" data-act="sinunequip" data-member="${i}">Quitar</button></li>` : "").join("")}</ul>
    ${run.mode === "cards" ? cardEvoHTML(run) : sinEvoItemsHTML(run)}${sinTMsHTML(run)}${run.mode === "cards" ? "" : sinNobleHTML(run)}${sinLegendsHTML(run)}
    ${sinFateHTML(run)}`;
  $("sin-card").hidden = false; sinFillImages(); sinRequestDraw();
}
function sinTMsHTML(run) {
  return `<h2>Movimientos de cartas</h2><p>MT del mod: puedes usarlas sin límite fuera de combate.</p><ul class="sin-objects">${run.tms.map((tm, i) => `<li><div class="sin-fate">${sinCardImage(tm.img, esSp(tm.species))}</div><b>${esc(esSp(tm.species))} · ${esc(esMove(tm.move))}</b>
    <button class="btn" data-act="sintmselect" data-tm="${i}">Enseñar a…</button>${SIN_VIEW.bagTM === i ? `<div class="btns">${run.team.map((s, j) => `<button class="btn" data-act="sintmteach" data-tm="${i}" data-member="${j}" ${s.moves.includes(tm.move) ? "disabled" : ""}>${esc(esSp(s.species))} · Nv. ${esc(s.level)}</button>`).join("")}</div>` : ""}</li>`).join("") || "<li>No tienes MT de cartas.</li>"}</ul>`;
}
function sinTeachTM(tmIndex, member) {
  const run = ST.sin.run, tm = run?.tms[tmIndex], set = run?.team[member];
  if (run?.mode === "cards") {
    const c = cardByImg(tm?.img); if (!sinMapAction(run) || !c || !set?.card) return;
    const mv = cardStats(c).sig; if (!(mv.type === "Typeless" || set.card.learn.includes(mv.type)) || cardMoves(set).some(m => m.name === mv.name)) return;
    set.cmoves ||= []; if (set.cmoves.length >= 2) set.cmoves.shift(); set.cmoves.push(mv);
    run.notice = `${esSp(set.species)} aprendió ${mv.name}.`; sinSave(); return sinUpdateTurn();
  }
  if (!sinMapAction(run) || !tm || !set || !Dex.moves.get(tm.move).exists || set.moves.includes(tm.move)) return;
  run.progress = {kind: "tm", won: null, rewards: run.team.map((_, index) => ({index, exp: 0, levels: [], events: []})),
    pending: [{index: member, move: tm.move, kind: "signature"}]};
  run.notice = `MT de ${esSp(tm.species)}: ${esMove(tm.move)}. La carta se conserva.`;
  sinAdvanceMoves(run); sinSave(); renderSin();
}
function sinNobleOptions(set) {
  const sp = Dex.species.get(set.species);
  if (!sp.exists || sp.evos.length) return null;
  let root = sp;
  while (root.prevo) root = Dex.species.get(root.prevo);
  if (!SIN_VILLAGES.some(v => v.starters.some(s => toID(s) === root.id))) return null;
  const base = Dex.species.get(sp.baseSpecies);
  const forms = (base.otherFormes || []).map(s => Dex.species.get(s)).filter(s => s.exists && !s.battleOnly && !s.isMega && !s.isPrimal && !/Gmax|Totem/.test(s.forme));
  const alternate = forms.find(s => s.forme === "Hisui") || forms[0];
  return alternate ? {base: base.name, alternate: alternate.name} : {perfect: true};
}
function sinNobleHTML(run) {
  if (!run.noble) return "";
  return `<h2>Pergamino de Nobleza</h2><p>${run.noble.used ? "Pergamino usado definitivamente. El Pokémon elegido conserva su mejora, también en la Caja." : "Un solo uso definitivo en un inicial completamente evolucionado. Conserva su progreso, ataques, objeto, estado y proporción de PS."}</p><ul class="sin-objects">${run.team.map((s, i) => {
    const option = s.noble || (!run.noble.used && sinNobleOptions(s));
    if (!option) return "";
    return `<li>${esc(esSp(s.species))} · Nv. ${esc(s.level)} ${option.perfect && s.noble ? "· IVs perfectos" : `<button class="btn" data-act="sinnoble" data-member="${i}">${option.perfect ? "Usar: IVs 31 en todo" : s.noble ? "Cambiar a " + esc(esSp(s.species === option.base ? option.alternate : option.base)) : "Usar: habilitar cambio de forma"}</button>`}</li>`;
  }).join("") || "<li>No hay iniciales completamente evolucionados elegibles en el equipo.</li>"}</ul>`;
}
function sinUseNoble(member) {
  const run = ST.sin.run, s = run?.team[member];
  if (!sinMapAction(run) || !run.noble || !s) return;
  const option = s.noble || (!run.noble.used && sinNobleOptions(s));
  if (!option || (s.noble?.perfect) || (s.noble && ![option.base, option.alternate].includes(s.species))) return;
  const oldMax = calcStat(Dex.species.get(s.species), s, "hp"), ratio = s.hpNow == null ? 1 : s.hpNow / oldMax;
  if (option.perfect) s.ivs = Object.fromEntries(["hp", "atk", "def", "spa", "spd", "spe"].map(k => [k, 31]));
  else {
    s.species = s.species === option.base ? option.alternate : option.base;
    s.ability = Dex.species.get(s.species).abilities["0"];
  }
  s.noble = {...option}; run.noble.used = true;
  s.hpMax = calcStat(Dex.species.get(s.species), s, "hp");
  if (s.hpNow != null) s.hpNow = ratio > 0 ? Math.max(1, Math.min(s.hpMax, Math.ceil(ratio * s.hpMax))) : 0;
  run.notice = option.perfect ? `¡${esSp(s.species)} tiene IVs 31 en todas sus estadísticas!` : `¡Forma de ${esSp(s.species)}! Puedes alternarla desde la Bolsa.`;
  sinSave(); sinUpdateTurn();
}
const sinVillage = run => SIN_BY_CELL.get(run.pos.join(","))?.tokens.find(t => SIN_VILLAGES.some(v => v.village === t.n));
const sinAtGinkgo = run => sinCellTokens(SIN_BY_CELL.get(run.pos.join(","))).some(t =>
  (t.tags || []).includes("Village Token") || (t.n === "Campsite" && t.hidden?.revealed));
function sinShowGinkgo() {
  const run = ST.sin.run;
  if (!sinMapAction(run) || !sinAtGinkgo(run)) return;
  SIN_VIEW.panel = "ginkgo"; SIN_VIEW.bag = false; SIN_VIEW.box = false; SIN_VIEW.selected = null;
  $("sin-card").innerHTML = `<div class="sin-card-head"><h2>Comerciar con Ginkgo</h2><button class="btn" data-act="sinclose">Cerrar</button></div>
    <p>Un intercambio por turno, compartido entre pueblos y campamentos. Después cambia la carta.</p>
    ${sinCardImage(SIN_GINKGO[run.ginkgo].img, "Intercambios Ginkgo: carta " + (run.ginkgo + 1), "sin-ginkgo")}
    <div class="sin-recipes">${SIN_TRADES[run.ginkgo].map(([give, receive], i) => `<button class="btn" data-act="sintrade" data-trade="${i}" data-card="${run.ginkgo}" ${!run.traded && sinCanPay(run, give) ? "" : "disabled"}>Dar ${esc(sinRecipeText(give))} → Recibir ${esc(sinRecipeText(receive))}</button>`).join("")}</div>
    ${run.traded ? "<p>Ya comerciaste este turno.</p>" : ""}`;
  $("sin-card").hidden = false; sinFillImages(); sinRequestDraw();
}
function sinTrade(index, card) {
  const run = ST.sin.run;
  if (!sinMapAction(run) || !sinAtGinkgo(run) || run.traded || card !== run.ginkgo || !Number.isInteger(index)) return;
  const trade = SIN_TRADES[run.ginkgo][index]; if (!trade || !sinCanPay(run, trade[0])) return;
  sinPay(run, trade[0]); Object.entries(trade[1]).forEach(([k, n]) => { run.bag[k] += n; });
  run.traded = true; run.ginkgo = sinNextGinkgo(run.ginkgo);
  run.notice = `Comerciaste con Ginkgo: recibiste ${sinRecipeText(trade[1])}.`; sinSave(); sinUpdateTurn();
}
const sinFlightBlocked = (run, village) => run.grunts.includes(village);
function sinShowFlight() {
  const run = ST.sin.run, origin = run && (sinVillage(run) || (sinFx(run, "flyAnywhere") ? {n: null} : null));
  if (!sinMapAction(run) || !origin) return;
  SIN_VIEW.panel = "fly"; SIN_VIEW.bag = false; SIN_VIEW.box = false; SIN_VIEW.selected = null;
  const blocked = sinFlightBlocked(run, origin.n), dest = SIN_VIEW.flyTo;
  $("sin-card").innerHTML = `<div class="sin-card-head"><h2>Volar (1 Bonguri)</h2><button class="btn" data-act="sinclose">Cerrar</button></div>
    <p>Una vez por turno. No gasta movimientos. Elige destino y el Bonguri que descartarás.</p>
    ${blocked ? "<p>Los Reclutas del Equipo Galaxia bloquean el vuelo desde este pueblo.</p>" : ""}${run.flown ? "<p>Ya volaste este turno.</p>" : ""}
    <div class="btns">${SIN_VILLAGES.filter(v => v.village !== origin.n).map(v => `<button class="btn" data-act="sinflyselect" data-village="${esc(v.village)}" ${run.flown || blocked || sinFlightBlocked(run, v.village) ? "disabled" : ""}>${esc(v.name)}${dest === v.village ? " · Elegido" : ""}${sinFlightBlocked(run, v.village) ? " · Ocupado por Galaxia" : ""}</button>`).join("")}</div>
    ${dest ? `<p>Descartar para volar a ${esc(SIN_VILLAGES.find(v => v.village === dest)?.name)}:</p><div class="btns">${Object.entries(SIN_BONGURI).map(([key, [name]]) => `<button class="btn" data-act="sinfly" data-village="${esc(dest)}" data-color="${key}" ${run.flown || blocked || sinFlightBlocked(run, dest) || run.bag[key] < 1 ? "disabled" : ""}>Bonguri ${esc(name)} ×${esc(run.bag[key])}</button>`).join("")}</div>` : ""}`;
  $("sin-card").hidden = false; sinRequestDraw();
}
function sinFly(village, color) {
  const run = ST.sin.run, origin = run && (sinVillage(run) || (sinFx(run, "flyAnywhere") ? {n: null} : null));
  const dest = SIN.tokens.find(t => t.n === village && (t.tags || []).includes("Village Token"));
  if (!sinMapAction(run) || !origin || run.flown || !dest || origin.n === village || !SIN_VILLAGES.some(v => v.village === village) ||
    sinFlightBlocked(run, origin.n) || sinFlightBlocked(run, village) || !SIN_BONGURI[color] || !(run.bag[color] > 0)) return;
  run.bag[color]--; run.flown = true; run.pos = [...dest.cell];
  run.notice = `Volaste a ${sinName(dest)} descartando 1 Bonguri ${SIN_BONGURI[color][0]}.`;
  SIN_VIEW.panel = null; SIN_VIEW.flyTo = null; sinSave(); sinCenter(); sinShowCell(SIN_BY_CELL.get(run.pos.join(","))); sinUpdateTurn();
}
function sinEquip(index, member, remove = false) {
  const run = ST.sin.run, set = run?.team[member];
  if (VIEW !== "sin" || !SIN_VIEW || !set || run.battle || run.progress || (run.offer && !run.offer.closed)) return;
  if (remove) {
    if (!set.item) return;
    run.items.push(toID(set.item)); set.item = "";
  } else {
    if (!Number.isInteger(index) || !run.items[index] || !Dex.items.get(run.items[index]).exists) return;
    const id = run.items.splice(index, 1)[0];
    if (set.item) run.items.push(toID(set.item));
    set.item = id;
  }
  SIN_VIEW.bagItem = null; sinSave(); sinUpdateTurn();
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
function sinSwarmIndex(battle, me) {
  return battle.foes.findIndex((s, i) => me.act.p2 === "p2:Enjambre" + (i + 1));
}
function sinSwarmDefeated(battle, me) {
  battle.defeated ||= [];
  battle.foes.forEach((s, i) => {
    if (!battle.captures[i] && me.mons["p2:Enjambre" + (i + 1)]?.hp === 0 && !battle.defeated.includes(i)) battle.defeated.push(i);
  });
}
function sinSwarmRewards(run, battle, won, me) {
  if (me) sinSwarmDefeated(battle, me);
  // forcewin se interpreta como la derrota de todos los rivales que quedaban.
  if (won) battle.foes.forEach((s, i) => { if (!battle.captures[i] && !battle.defeated.includes(i)) battle.defeated.push(i); });
  const resolved = [...new Set([...battle.defeated, ...Object.keys(battle.captures).map(Number)])];
  if (me && resolved.length) {
    sinGainExp(run, resolved.map(i => battle.foes[i]), me);
    run.progress.won = won;
  }
  run.progress.kind = "swarm"; run.progress.pv = won && resolved.length === 3 ? 7 : 0;
  run.pv += run.progress.pv;
  battle.defeated.forEach(i => { const c = battle.swarmCards[i]; run.discard.push({species: c.species, tier: c.tier, signature: c.move}); });
  run.progress.captures = Object.values(battle.captures).map(s => {
    const boxed = run.team.length >= sinTeamSlots(run);
    (boxed ? run.box : run.team).push(s); run.caught++;
    return {species: s.species, boxed};
  });
  if (run.progress.pv === 7) sinCheckStamps(run, {swarm: true});
  run.progress.unlockTiers = resolved.map(i => battle.swarmCards[i].tier);
}
function sinOnFaint(me) {
  const run = ST.sin.run;
  if (!me.sin || me.over || me.dead || me.sinFled || !run?.battle || run.battle.trainer || run.battle.swarm) return;
  const tier = run.battle.tier || sinEncounterToken(run)?.tier;
  if (run.battle.legend || run.battle.wild.alpha || !(tier in SIN_FLEE_BONGURI)) return;
  const alive = run.battle.indices.some(i => {
    const m = me.mons["p1:Sinnoh" + (i + 1)];
    return m && m.side === "p1" ? m.hp > 0 : sinAlive(run.team[i]);
  });
  if (!alive) return;
  me.sinFaints = (me.sinFaints || 0) + 1;
  if (sinFx(run, "flee2") && me.sinFaints < 2) return;
  me.sinFled = true; me.s.omniscient.write(">forcetie");
}
function sinCaptureRoll(hp, max, ratio, bonus, status, captivating = false) {
  const state = status === "slp" || status === "frz" ? 2.5 : ["par", "brn", "psn", "tox"].includes(status) || captivating ? 1.5 : 1;
  const a = Math.floor((3 * max - 2 * hp) * ratio * bonus / (3 * max)) * state;
  if (a >= 255) return {a, b: 65536, checks: 4, caught: true};
  const b = a > 0 ? Math.floor(65536 / (255 / a) ** .1875) : 0;
  let checks = 0;
  while (checks < 4 && Math.floor(Math.random() * 65536) < b) checks++;
  return {a, b, checks, caught: checks === 4};
}
const sinCanBattleFate = me => !!(me && me === B && me.sin && !me.over && !me.dead && !me.sinThrowing && !me.sinFateBusy &&
  me.req?.active && !me.req.wait && !me.req.forceSwitch && !me.req.teamPreview && ST.sin.run?.battle && !ST.sin.run.battle.failedBall && !ST.sin.run.battle.ballAttempt);
const sinNoCapture = battle => !!(battle.trainer || battle.legend?.ub || battle.legend?.necro);
const sinCanThrow = me => sinCanBattleFate(me) && !sinNoCapture(ST.sin.run.battle) && me.mons[me.act.p2]?.hp > 0;
const sinCaptureRatio = (battle, target = battle.wild) => (sinSpeciesData(target.species)?.cr ?? 3) * (target.alpha ? .5 : 1) * (battle.legend?.aura ? .25 : 1) *
  (/Apricorn Tree$/.test(SIN.tokens[battle.token]?.n || "") ? sinFx(ST.sin.run, "catchTree") || 1 : /Apricorn Reef$/.test(SIN.tokens[battle.token]?.n || "") ? sinFx(ST.sin.run, "catchReef") || 1 : 1);
function sinCaptureFailure(run, turn) {
  const battle = run.battle;
  if (battle.captureFailureTurn === turn) return;
  battle.captureFailureStreak = battle.captureFailureTurn === turn - 1 ? (battle.captureFailureStreak || 0) + 1 : 1;
  battle.captureFailureTurn = turn;
  if (battle.captureFailureStreak >= 2) sinCheckStamps(run, {failedCapture: true});
}
function sinFailedBallHTML(run) {
  return `<p>La captura falló. Elige antes de perder el turno:</p><button class="btn" data-act="sindialgaretry" ${sinFatePayment(run, "dialga", 1) ? "" : "disabled"}>Dialga ×1: repetir con la misma Ball</button>
    <button class="btn" data-act="sindialgapass">Continuar sin repetir</button>`;
}
function sinBallsHTML(me) {
  const run = ST.sin.run; if (!run?.battle) return "";
  if (run.battle.ballAttempt) {
    const attempt = run.battle.ballAttempt;
    requestAnimationFrame(() => {
      if (B === me && !me.dead && !me.over && !me.sinThrowing && run.battle?.ballAttempt === attempt) sinThrowBall(me, attempt.key, attempt, attempt);
    });
    return "<p>Resolviendo el lanzamiento guardado…</p>";
  }
  if (run.battle.failedBall) {
    // showControls también se usa al reanudar: la decisión precede a cualquier ataque.
    requestAnimationFrame(() => { if (B === me && run.battle?.failedBall && $("ctl")) $("ctl").innerHTML = sinFailedBallHTML(run); });
    return sinFailedBallHTML(run);
  }
  return (sinNoCapture(run.battle) ? "" : Object.entries(SIN_BALLS).filter(([key, b]) => b.recipe || run.balls[key] > 0).map(([key, ball]) => `<button class="btn" data-act="sinthrow" data-ball="${key}" ${sinCanThrow(me) && run.balls[key] > 0 ? "" : "disabled"}>${esc(ball.name)} ×${esc(run.balls[key])}</button>`).join("")) +
    [1, 3].map(count => `<button class="btn" data-act="singiratina" data-count="${count}" ${sinCanBattleFate(me) && sinFatePayment(run, "giratina", count) ? "" : "disabled"}>Giratina ${count === 1 ? "×1: −1/8 PS, +1 Atq./At. Esp." : "Juega 3: 1 PS, +2 Atq./At. Esp., +1 Vel."}</button>`).join("") +
    (sinFx(run, "hyper") ? `<button class="btn" data-act="sinhyper" ${sinCanBattleFate(me) && !run.battle.hyperUsed ? "" : "disabled"}>Hiperpoción${run.battle.hyperUsed ? " (usada)" : ""}</button>` : "");
}
// Hiperpoción (Damisela): una vez por combate restaura PS y estados del Pokémon activo, sin gastar el turno.
async function sinHyper(me) {
  const run = ST.sin.run;
  if (!sinCanBattleFate(me) || !sinFx(run, "hyper") || run.battle.hyperUsed) return;
  run.battle.hyperUsed = true; sinSave(); me.sinFateBusy = true; $("ctl").innerHTML = "";
  try {
    await say(me, "¡Usaste la Hiperpoción! Tu Pokémon recuperó sus PS y sus estados.", 1);
    if (me.dead || me.over) return;
    me.s.omniscient.write(">eval const p=battle.sides[0].active[0]; p.sethp(p.maxhp); p.cureStatus(); battle.add('-heal',p,p.getHealth);");
    const m = me.mons[me.act.p1]; if (m) { m.hp = m.max; m.status = ""; drawSide(me, "p1"); }
    me.shown = false; showControls(me);
  } finally { me.sinFateBusy = false; }
}
async function sinGiratina(me, count) {
  const run = ST.sin.run, active = me?.mons[me.act.p1];
  if (!sinCanBattleFate(me) || !active || active.hp <= 0 || !sinFatePayment(run, "giratina", count)) return;
  // El coste de ×1 puede debilitar: se deja al motor resolverlo y pedir el cambio.
  me.sinFateBusy = true; $("ctl").innerHTML = "";
  const index = run.battle.indices.find(i => "p1:Sinnoh" + (i + 1) === me.act.p1);
  if (index == null) { me.sinFateBusy = false; return showControls(me); }
  sinSpendFate(run, "giratina", count);
  (run.battle.fateEffects ||= []).push({index, count}); sinSave();
  try {
    await say(me, count === 1 ? "¡Giratina: Sacrifica! Pierdes 1/8 de tus PS máximos y ganas +1 Ataque y +1 Ataque Especial." : "¡Giratina: Sacrifica todo! Quedas con 1 PS y ganas +2 Ataque, +2 Ataque Especial y +1 Velocidad.", 1.2);
    if (me.dead || me.over) return;
    me.s.omniscient.write(`>eval const p=battle.sides[0].active[0]; ${sinGiratinaEval(count)} battle.add('-damage',p,()=>p.getHealth()); battle.add('-boost',p,'atk',${count === 3 ? 2 : 1}); battle.add('-boost',p,'spa',${count === 3 ? 2 : 1}); ${count === 3 ? "battle.add('-boost',p,'spe',1);" : ""} if(!p.hp){battle.faintMessages();if(!battle.ended){battle.checkFainted();battle.makeRequest('switch');}}else battle.makeRequest('move');`);
    me.shown = false;
  } finally { me.sinFateBusy = false; }
}
const sinGiratinaEval = count => count === 3 ? "p.sethp(1); p.boostBy({atk:2,spa:2,spe:1});" : "p.damage(Math.max(1,Math.floor(p.maxhp/8))); p.boostBy({atk:1,spa:1});";
function sinPassCapture(me) {
  if (me !== B || me.dead || me.over || !ST.sin.run?.battle) return;
  delete ST.sin.run.battle.failedBall; sinSave();
  me.req = null; me.shown = false; $("ctl").innerHTML = "";
  me.s.omniscient.write('>eval const sd=battle.sides[0]; sd.clearChoice(); sd.choice.actions=[{choice:"pass",pokemon:sd.active[0],index:0}]; sd.choice.forcedPassesLeft=0; if (battle.allChoicesDone()) battle.commitChoices();');
}
async function sinRepeatCapture(me) {
  const run = ST.sin.run, failed = run?.battle?.failedBall;
  if (me !== B || !me.sin || me.dead || me.over || me.sinThrowing || !failed || !sinSpendFate(run, "dialga", 1)) return;
  delete run.battle.failedBall; sinSave();
  return sinThrowBall(me, failed.key, failed);
}
async function sinThrowBall(me, key, repeat = null, pending = null) {
  const run = ST.sin.run, ball = SIN_BALLS[key];
  if (me !== B || !ball || (!repeat && (!sinCanThrow(me) || !(run.balls[key] > 0)))) return;
  const wild = me.mons[me.act.p2];
  const encounter = run.battle, foeIndex = encounter.swarm ? sinSwarmIndex(encounter, me) : null;
  const set = encounter.swarm ? encounter.foes[foeIndex] : encounter.wild;
  if (!set || (encounter.swarm && encounter.captures[foeIndex])) return;
  me.sinThrowing = true; me.lastReq = me.req; me.req = null; me.shown = false; $("ctl").innerHTML = "";
  const captivating = repeat ? repeat.captivating : !!run.battle.captivating;
  if (!repeat) run.balls[key]--;
  run.battle.captivating = false;
  const target = repeat?.target || {hp: wild.hp, max: wild.max, status: wild.status};
  const result = pending?.result || sinCaptureRoll(target.hp, target.max, sinCaptureRatio(encounter, set), ball.bonus, target.status, captivating);
  run.battle.ballAttempt = {key, captivating, target, result, foeIndex}; sinSave();
  try {
    if (repeat) {
      // Reanudar conserva el objetivo del intento guardado, incluidos sus PS y estado.
      const status = SIN_STATUS[target.status] ? target.status : "";
      me.s.omniscient.write(`>eval const p=battle.sides[1].active[0]; p.sethp(${Math.max(1, Math.floor(target.hp))}); ${status ? `p.setStatus(${JSON.stringify(status)});` : "p.cureStatus();"} battle.add('-damage',p,()=>p.getHealth());`);
      wild.hp = target.hp; wild.max = target.max; wild.status = status;
    }
    const thrown = sinBallFx(me, key, "throw");
    await say(me, `¡Lanzaste una ${ball.name}!`, 1); await thrown;
    for (let i = 0; i < Math.min(3, result.checks); i++) {
      if (me.dead || me.over) return;
      await Promise.all([say(me, "La Ball se movió…", .7), sinBallFx(me, key, "shake")]);
    }
    if (me.dead || me.over) return;
    if (result.caught) {
      await Promise.all([say(me, `¡Ya está! ¡Has atrapado a ${esSp(set.species)}!`, 1.2), sinBallFx(me, key, "caught")]);
      if (!me.dead && !me.over) {
        delete encounter.captureFailureTurn; encounter.captureFailureStreak = 0;
        if (encounter.swarm) {
          sinSwarmDefeated(encounter, me);
          const captured = JSON.parse(JSON.stringify(set));
          captured.hpMax = calcStat(Dex.species.get(set.species), set, "hp");
          captured.hpNow = Math.max(1, Math.min(captured.hpMax, Math.ceil(target.hp / target.max * captured.hpMax)));
          captured.status = SIN_STATUS[target.status] ? target.status : ""; captured.tier = encounter.swarmCards[foeIndex].tier;
          encounter.captures[foeIndex] = captured; delete encounter.ballAttempt; sinSave();
          // El capturado cuenta como caído solo en el motor; conserva sus PS y estado para incorporarse al final.
          $("scene")?.querySelector(".sin-ball")?.remove(); $("mon-p2")?.classList.remove("sin-absorbed");
          me.s.omniscient.write('>eval const p=battle.sides[1].active[0]; battle.sides.forEach(s=>s.clearChoice()); p.faint(); battle.faintMessages(); if(!battle.ended){battle.checkFainted();battle.makeRequest("switch");}');
        } else { me.sinCaught = true; sinSave(); me.s.omniscient.write(">forcewin p1"); }
      }
    } else {
      await Promise.all([sinBallFx(me, key, "escape"), say(me, "¡Oh, no! ¡El Pokémon se ha escapado!", 1.2)]);
      if (!me.dead && !me.over) {
        if (!repeat || pending) sinCaptureFailure(run, me.turn);
        delete run.battle.ballAttempt;
        if (sinFatePayment(run, "dialga", 1)) {
          run.battle.failedBall = {key, captivating, target}; sinSave();
          $("ctl").innerHTML = sinFailedBallHTML(run);
        } else sinPassCapture(me);
      }
    }
  } finally { me.sinThrowing = false; }
}
function sinMoveTo(key) {
  const run = ST.sin.run; if (!sinMapAction(run) || run.fought) return;
  // Se vuelve a calcular al confirmar para no usar un coste de una ficha antigua.
  const parents = new Map(), cost = sinReachable(run.pos, Math.max(0, sinMaxMoves(run) - run.moved), parents).get(key);
  if (!cost) return;
  const path = [], messages = [];
  for (let step = key; step !== run.pos.join(","); step = parents.get(step)) path.unshift(step);
  for (const step of path) {
    const h = SIN_BY_CELL.get(step); run.pos = [h.c, h.r]; run.moved++;
    if (sinRevealHidden(run, step, messages)) break;
  }
  run.notice = messages.join(" "); sinSave();
  if (run.offer && !run.offer.closed) renderSin(); else sinUpdateTurn();
}
function sinRevealHidden(run, key, messages) {
  const hidden = run.hidden[key]; if (!hidden || hidden.revealed || !hidden.present) return false;
  const t = SIN.tokens[hidden.token], stash = /^(\w+) Apricorn Stash$/.exec(t.n);
  hidden.revealed = true;
  if (stash) {
    const color = stash[1].toLowerCase(); run.bag[color] += hidden.amount; hidden.present = false;
    if (sinFx(run, "stash")) { run.bag[color] += 2; run.stashMoves = (run.stashMoves || 0) + 1; messages.push(`Experto Silvestre: +2 Bonguri ${SIN_BONGURI[color][1]} y +1 movimiento.`); }
    messages.push(`¡Encontraste ${hidden.amount} Bonguri ${SIN_BONGURI[color][hidden.amount === 1 ? 0 : 1]}!`);
  } else if (t.n === "Campsite") messages.push("¡Encontraste un campamento! Aquí puedes curar a tu equipo una vez por turno.");
  else if (t.n === "Fallen Star") {
    run.stars++; hidden.present = false;
    messages.push(`¡Encontraste una estrella caída! Estrellas: ${run.stars}. ${sinDrawFate(run, 2)}`);
  } else if (t.n === "Alpha Pokémon") {
    if (sinTasty(run)) {
      messages.push("¡Revelaste un Pokémon Alfa! El Estofado Sabroso te permite seguir; puedes buscarlo aquí después."); return false;
    }
    sinAlphaOffer(run, hidden, key);
    messages.push("¡Un Pokémon Alfa te corta el paso! Debes combatir.");
    return true;
  } else if (SIN_ARTIFACTS[t.n]) {
    const item = SIN_ARTIFACTS[t.n]; run.items.push(item.id); hidden.present = false;
    messages.push(`¡Encontraste ${item.name}! Puedes equiparlo desde la Bolsa.`);
  }
  return false;
}
function sinAlphaOffer(run, hidden, key) {
  const t = SIN.tokens[hidden.token], c = shuffle(sinWildCards({...t, tier: "S"}).slice())[0], [lo, hi] = SIN_WILD_LEVELS.S;
  run.searched = true;
  run.offer = {cards: c ? [{species: c.d.sp, img: c.img, level: lo + Math.floor(Math.random() * (hi - lo + 1)) + 5, alpha: true}] : [],
    token: hidden.token, hidden: key, alpha: true, place: "Pokémon Alfa", meta: sinMeta(t), closed: false};
}
function sinCellTokens(h) {
  const run = ST.sin.run;
  return h.tokens.flatMap(t => {
    if (t.kind !== "CardCustom") return [t];
    const hidden = run?.hidden[t.cell.join(",")];
    return hidden?.present ? [{...SIN.tokens[hidden.token], cell: t.cell, hidden}] : [];
  });
}
function sinSearch(index) {
  const run = ST.sin.run, t = SIN.tokens[index];
  if (!run || run.searched || run.fought || run.battle || run.progress || (run.offer && !run.offer.closed) || run.revive || !run.team.some(sinAlive) || !t) return;
  const key = run.pos.join(","), hidden = run.hidden[key];
  if (t.n === "Alpha Pokémon" && hidden?.token === index && hidden.revealed && hidden.present) {
    sinAlphaOffer(run, hidden, key); sinSave(); return renderSin();
  }
  if (!sinSearchToken(t) || t.cell.join(",") !== key) return;
  const [lo, hi] = SIN_WILD_LEVELS[t.tier];
  const cards = shuffle(sinWildCards(t).slice()).slice(0, SIN_OFFER_COUNT[t.tier]).map(c =>
    ({species: c.d.sp, img: c.img, level: lo + Math.floor(Math.random() * (hi - lo + 1))}));
  run.searched = true; run.offer = {cards, token: index, place: sinName(t), meta: sinMeta(t), closed: false};
  sinSave(); renderSin();
}
const sinSwarmGate = t => t?.kind === "Custom_Tile" && t.tags?.includes("Distortion Gate") && !t.tags.includes("Distortion World");
function sinSwarmCards(token) {
  return ["W", "M", "S"].map(tier => {
    const c = shuffle(SIN_CARDS.filter(c => c.d?.sp && c.tier === tier && c.b === token.b))[0];
    const [lo, hi] = SIN_WILD_LEVELS[tier];
    return c && {species: c.d.sp, img: c.img, tier, move: sinSignatureMove(c), level: lo + Math.floor(Math.random() * (hi - lo + 1))};
  });
}
async function sinSeekSwarm(index) {
  const run = ST.sin.run, token = SIN.tokens[index];
  if (!sinMapAction(run) || run.searched || run.fought || !run.team.some(sinAlive) || !sinSwarmGate(token) || token.cell.join(",") !== run.pos.join(",")) return;
  SIN_BUSY = true;
  try {
    const cards = sinSwarmCards(token);
    if (cards.some(c => !c)) { run.notice = "No hay cartas de los tres niveles para esta puerta."; return sinUpdateTurn(); }
    const foes = await Promise.all(cards.map(c => sinInitialSet(c.species, c.level)));
    run.searched = true;
    run.battle = {swarm: true, foes, swarmCards: cards, captures: {}, defeated: [], token: index, captivating: !!run.captivating,
      indices: run.team.map((s, i) => sinAlive(s) ? i : -1).filter(i => i >= 0),
      start: {team: JSON.parse(JSON.stringify(run.team)), pos: [...run.pos], moved: run.moved, searched: true}};
    run.captivating = false; sinSave();
  } finally { SIN_BUSY = false; }
  return sinFight();
}
function sinOfferScreen() {
  const run = ST.sin.run, offer = run.offer;
  $("app").innerHTML = `<div class="sin-new"><div class="sin-new-inner"><h1>Pokémon salvajes</h1>
    <p>${esc(offer.place)} · ${esc(offer.meta)}</p>
    ${offer.alpha ? "<p>¡Alfa! Combate obligatorio: nivel Fuerte +5, IVs perfectos, ratio de captura a la mitad y recompensa de 4 PV (+2 al debilitar). No huye al debilitar a uno de los tuyos.</p>" : ""}
    ${offer.legend?.ub || offer.legend?.necro ? `<p>${offer.legend.necro ? "Necrozma" : "Ultraente"}: no se puede capturar ni huye. Derrotarlo da 6 PV${offer.legend.ub ? ", quita una carta de Brecha de tu equipo y debilita la Armadura Prismática de Necrozma" : offer.legend.necro < 3 ? " y lo hace pasar a su siguiente fase" : " y gana la campaña"}. Si Necrozma te derrota sin Bendiciones de Arceus, la partida termina.</p>` : offer.legend ? "<p>Legendario: no huye al debilitar a uno de los tuyos. Capturarlo da 4 PV; derrotarlo da 6 PV. No da Bonguri. Su ficha permanece si pierdes.</p>" : ""}
    ${offer.legend?.god ? `<p>${offer.legend.aura ? "Aura Celestial: captura ×0,25. Al derrotar su primera forma combatirás inmediatamente contra su Forma Origen, totalmente restaurada, conservando tus PS y estados." : "Tu artefacto celestial anula el Aura: captura normal y un solo combate. El artefacto se conserva."} Vencer o capturar concede otro turno inmediato en Corazón de Sinnoh.</p>` : ""}
    ${offer.cards.length ? `<div class="sin-choices sin-offer">${offer.cards.map((s, i) => `<div class="sin-choice">
      ${run.mode === "cards" ? sinCardImage(s.img, esSp(s.species)) + `<b>${esc(esSp(s.species))}</b>` : sinMonInfo(s.species, `<span>Nv. ${esc(s.level)}</span>`)}
      <div><button class="btn primary" data-act="sinfight" data-offer="${i}">Combatir</button></div></div>`).join("")}</div>` :
      '<p role="status">No hay cartas de Pokémon para este bioma, clima y nivel. La búsqueda de este turno ya fue usada.</p>'}
    ${offer.alpha ? "" : `<div class="sin-new-actions"><button class="btn" data-act="sinskip">No combatir</button>${sinFx(run, "research") && !run.researched && !offer.legend && Number.isInteger(offer.token) ? '<button class="btn" data-act="sinresearch">Buscar de nuevo</button>' : ""}</div>`}
    ${run.notice ? `<p role="status">${esc(run.notice)}</p>` : ""}
    <div class="sin-team">${sinTeamHTML(run)}</div><p id="sin-offer-error" role="alert"></p></div></div>`;
  sinFillImages();
}
function sinPre(team) {
  // Solo se insertan números y estados conocidos en el código enviado al motor.
  const pre = team.map((s, i) => {
    const hp = s.hpNow == null ? "" : `a[${i}].sethp(${Math.max(1, Math.floor(s.hpNow))});`;
    return hp + (SIN_STATUS[s.status] ? `a[${i}].setStatus(${JSON.stringify(s.status)});` : "");
  }).join("");
  const effects = (ST.sin.run?.battle?.fateEffects || []).map(effect => {
    const i = team.findIndex(s => s.name === "Sinnoh" + (effect.index + 1));
    return i < 0 ? "" : `{const p=a[${i}];${sinGiratinaEval(effect.count)}}`;
  }).join("");
  // Solo el enjambre restringe la solicitud rival al siguiente salvaje vivo, manteniendo la IA normal.
  const order = ST.sin.run?.battle?.swarm ? `const request=battle.makeRequest; battle.makeRequest=function(type){const side=this.sides[1];if(side&&!side.sinOrder){const get=side.getRequestData;side.getRequestData=function(...args){const data=get.apply(this,args),next=this.pokemon.find(p=>!p.fainted&&!p.isActive);data.pokemon.forEach((p,i)=>{if(!p.active&&this.pokemon[i]!==next)p.condition="0 fnt";});return data;};side.sinOrder=true;}return request.call(this,type);};` : "";
  return (pre || effects ? "const a=battle.sides[0].pokemon;" + pre + effects : "") + order + (ST.sin.run ? sinPerkEval(ST.sin.run, team) : "");
}
const sinCanChallengeGrunts = run => run.act === 1 && run.grunts.includes(run.village) &&
  sinVillage(run)?.n === run.village && !run.fought && !run.revive && run.team.some(sinAlive);
const sinAtToken = (run, name) => SIN.tokens.some(t => t.n === name && t.cell?.join(",") === run.pos.join(","));
function sinTrainerSpec(run, key) {
  if (key === true || key === "grunt") return {kind: "grunt", name: "Recluta del Equipo Galaxia", intro: "¡Los Reclutas del Equipo Galaxia te desafían!",
    bgm: "bgm_trainer", aiDiff: "normal", cards: SIN_GRUNTS, count: 2, levels: SIN_GRUNT_LEVELS};
  const commander = SIN_COMMANDERS.find(c => c.id === key);
  if (commander) return {kind: "commander", id: commander.id, name: commander.name,
    intro: `¡${commander.article === "la" ? "La" : "El"} ${commander.name} del Equipo Galaxia te desafía!`,
    bgm: "bgm_boss", aiDiff: "hard", cards: SIN_CARDS.filter(c => c.d?.encounter_tier === "Commander" && c.n.includes(`(${commander.name})`)),
    count: 2 + run.fragments.length, levels: SIN_COMMANDER_LEVELS[run.fragments.length]};
  if (key === "boss") return {kind: "boss", name: "Helio", intro: "¡Helio, jefe del Equipo Galaxia, te desafía!", bgm: "bgm_final", aiDiff: "hard",
    cards: SIN_CARDS.filter(c => c.d?.encounter_tier === "Boss"), count: 6, levels: SIN_BOSS_LEVELS};
  return null;
}
function sinCanChallengeTrainer(run, key) {
  if (key === true || key === "grunt") return sinCanChallengeGrunts(run);
  if (run.fought || run.revive || !run.team.some(sinAlive)) return false;
  if (key === "boss") return run.act === 3 && run.heart && sinAtToken(run, "Temple of Sinnoh Battle");
  const c = SIN_COMMANDERS.find(c => c.id === key);
  return !!c && run.act === 2 && !run.fragments.includes(c.id) && sinAtToken(run, c.token);
}
function sinCampaignTarget(run, token) {
  const c = SIN_COMMANDERS.find(c => c.token === token.n);
  return run.act === 2 ? !!c && !run.fragments.includes(c.id) : run.act === 3 &&
    (token.n === "Origin Shrine" && !run.heart || token.n === "Temple of Sinnoh Battle");
}
function sinShowOffering() {
  const run = ST.sin.run;
  if (!sinMapAction(run) || run.act !== 3 || run.heart || !sinAtToken(run, "Origin Shrine")) return;
  SIN_VIEW.panel = "offering"; SIN_VIEW.selected = null;
  $("sin-card").innerHTML = `<div class="sin-card-head"><h2>Restaurar el Corazón de Sinnoh</h2><button class="btn" data-act="sinclose">Cerrar</button></div>
    <p>Descarta 1 Bonguri del color que elijas. Conservas los tres Fragmentos.</p>
    ${run.originGod ? "<p>Debes derrotar o capturar al Dios de Sinnoh del Santuario Origin antes de hacer la ofrenda.</p>" : ""}
    <div class="btns">${Object.entries(SIN_BONGURI).map(([color, names]) => `<button class="btn" data-act="sinofferheart" data-color="${esc(color)}" ${run.originGod || !run.bag[color] ? "disabled" : ""}>Bonguri ${esc(names[0])} (${esc(run.bag[color])})</button>`).join("")}</div>`;
  $("sin-card").hidden = false;
}
function sinOfferHeart(color) {
  const run = ST.sin.run;
  if (!sinMapAction(run) || run.act !== 3 || run.heart || run.originGod || !sinAtToken(run, "Origin Shrine") || !SIN_BONGURI[color] || !(run.bag[color] > 0)) return;
  run.bag[color]--; run.heart = true; run.items.push("heartofsinnoh");
  run.notice = "¡Restauraste el Corazón de Sinnoh! Está en la Bolsa: equipado potencia un 20 % los movimientos del mismo tipo que su portador. Desafía a Helio en el Templo de Sinnoh.";
  sinSave(); SIN_VIEW.panel = null; SIN_VIEW.selected = SIN_BY_CELL.get(run.pos.join(",")); sinUpdateTurn();
}
const sinShrineName = name => "Santuario " + name.replace(/ Shrine$/, "");
const sinShrineOccupied = (run, name) => run.shrineLegends[name] || (name === "Origin Shrine" && run.originGod) ||
  !!run.destroyed?.[SIN.tokens.find(t => t.n === name)?.cell?.join(",")];
const sinHereShrine = run => SIN.tokens.find(t => / Shrine$/.test(t.n) && t.cell?.join(",") === run.pos.join(","));
function sinDrawShrine(run, count) {
  const cards = [];
  for (let i = 0; i < count; i++) {
    if (!run.shrineDeck.length) run.shrineDeck = shuffle(run.shrineDiscard.splice(0));
    if (!run.shrineDeck.length) break;
    cards.push(run.shrineDeck.pop());
  }
  return cards;
}
function sinShowShrine() {
  const run = ST.sin.run, shrine = run && sinHereShrine(run);
  if (!sinMapAction(run) || !shrine || run.offered || sinShrineOccupied(run, shrine.n)) return;
  SIN_VIEW.panel = "shrine"; SIN_VIEW.selected = null; SIN_VIEW.bag = false; SIN_VIEW.box = false;
  $("sin-card").innerHTML = `<div class="sin-card-head"><h2>Ofrenda de santuario</h2><button class="btn" data-act="sinclose">Cerrar</button></div>
    <p>Una vez por turno. Elige 1 Bonguri: su grado determina la fuerza del evento.</p>
    ${Object.entries(SIN_BONGURI).map(([color, names]) => `<div class="sin-recipe"><span>Bonguri ${esc(names[0])} ×${esc(run.bag[color])} · Grado ${sinBonguriGrade(color)}</span>
      <div class="btns"><button class="btn" data-act="sinshrinedraw" data-color="${color}" ${run.bag[color] ? "" : "disabled"}>Ofrecer</button>
      ${run.pv >= 7 ? `<button class="btn" data-act="sinshrinedraw" data-color="${color}" data-major="1" ${run.bag[color] ? "" : "disabled"}>Ofrenda mayor (7 PV): robar 3 y elegir 2</button>` : ""}</div></div>`).join("")}`;
  $("sin-card").hidden = false;
}
function sinOfferShrine(color, major = false) {
  const run = ST.sin.run, shrine = run && sinHereShrine(run), grade = sinBonguriGrade(color);
  if (!sinMapAction(run) || !shrine || run.offered || sinShrineOccupied(run, shrine.n) || !grade || !(run.bag[color] > 0) || (major && run.pv < 7)) return;
  const drawn = sinDrawShrine(run, major ? 3 : 1);
  if (drawn.length !== (major ? 3 : 1)) return;
  run.bag[color]--; if (major) run.pv -= 7;
  run.offered = true;
  if (sinFx(run, "shrinePV")) run.pv += 2;
  run.shrineEvent = {drawn, grade, selected: [], queue: major ? null : drawn.slice(), cursor: 0};
  sinSave(); renderSin();
}
function sinChooseShrine(index) {
  const run = ST.sin.run, e = run?.shrineEvent;
  if (!e || e.queue || !e.drawn.includes(index) || e.selected.includes(index)) return;
  e.selected.push(index);
  if (e.selected.length === 2) {
    e.queue = e.selected.slice(); run.shrineDiscard.push(...e.drawn.filter(i => !e.selected.includes(i)));
  }
  sinSave(); sinShrineScreen();
}
function sinApplyShrine(run) {
  const e = run.shrineEvent;
  if (!e?.queue || e.started) return;
  const effect = SIN_SHRINE_EFFECTS[SIN_SHRINE_CARDS[e.queue[e.cursor]].img];
  e.started = true; e.done = true; e.message = "";
  if (effect.kind === "legend") {
    run.bag[effect.color] += effect.amount; run.shrineLegends[effect.shrine] = effect.species;
    e.message = `Recibiste ${effect.amount} Bonguri ${SIN_BONGURI[effect.color][1]}. ${esSp(effect.species)} apareció en el ${sinShrineName(effect.shrine)}.`;
  } else if (effect.kind === "fracture" || effect.kind === "fate") {
    if (effect.kind === "fracture") { run.fractures++; e.followerPending = true; e.done = false; }
    e.message = (effect.kind === "fracture" ? "Los Dioses de Sinnoh se agitan… " : "") + sinDrawFate(run, effect.kind === "fracture" ? 1 : e.grade);
  } else if (effect.kind === "pv") {
    run.pv += 2 * e.grade; e.message = `Ganaste ${2 * e.grade} PV.`;
  } else if (effect.kind === "ball") {
    const ball = ["great", "ultra", "spirit"][e.grade - 1]; run.balls[ball]++; e.message = `Recibiste una ${SIN_BALLS[ball].name}.`;
  } else if (effect.kind === "feast") {
    run.feast.remaining = Math.min(4 - run.feast.used.length, run.feast.remaining + e.grade);
    e.message = `Puedes elegir hasta ${e.grade} estofados distintos gratis en la Bolsa durante este turno. No gastan Bonguri ni su uso habitual.`;
  } else { e.done = false; e.remaining = e.grade; }
  sinSave();
}
function sinShrineDiscards(run, kind, grade) {
  const tiers = kind === "exchange" ? [["W"], ["M"], ["S"]][grade - 1] : [["W", "M"], ["W", "M", "S"], ["W", "M", "S", "L"]][grade - 1];
  return run.discard.map((s, i) => ({...s, index: i})).filter(s => tiers.includes(s.tier) &&
    (kind === "exchange" ? run.team.some(p => p.tier === s.tier) : s.signature && Dex.moves.get(s.signature).exists));
}
function sinExchangeSpecies(run, member, discarded) {
  const s = run.team[member], d = run.discard[discarded];
  if (!s || !d || !s.tier || s.tier !== d.tier) return false;
  const sp = Dex.species.get(d.species); if (!sp.exists) return false;
  const max = calcStat(Dex.species.get(s.species), s, "hp"), ratio = s.hpNow == null ? 1 : s.hpNow / max;
  s.species = sp.name; s.ability = sp.abilities["0"]; s.hpMax = calcStat(sp, s, "hp");
  if (s.hpNow != null) s.hpNow = ratio > 0 ? Math.max(1, Math.min(s.hpMax, Math.ceil(ratio * s.hpMax))) : 0;
  run.discard.splice(discarded, 1); return true;
}
function sinShrineChoice(action, value) {
  const run = ST.sin.run, e = run?.shrineEvent;
  if (!e?.queue || e.done || run.progress) return;
  const effect = SIN_SHRINE_EFFECTS[SIN_SHRINE_CARDS[e.queue[e.cursor]].img];
  if (action === "color" && effect.kind === "bonguri" && SIN_BONGURI[value] && e.remaining > 0) {
    run.bag[value]++; e.remaining--; e.message = (e.message || "") + ` Recibiste 1 Bonguri ${SIN_BONGURI[value][0]}.`;
    e.done = e.remaining === 0;
  } else if (action === "discard" && ["exchange", "wisdom"].includes(effect.kind) && sinShrineDiscards(run, effect.kind, e.grade).some(s => s.index === +value)) {
    e.discarded = +value;
  } else if (action === "member" && Number.isInteger(+value) && run.team[+value]) {
    const d = run.discard[e.discarded];
    if (!d || !sinShrineDiscards(run, effect.kind, e.grade).some(s => s.index === e.discarded)) return;
    if (effect.kind === "exchange") {
      if (!sinExchangeSpecies(run, +value, e.discarded)) return;
      e.done = true; e.message = `El Pokémon elegido ahora es ${esSp(d.species)}. Conservó su progreso, ataques, objeto, estado y proporción de PS.`;
    } else if (effect.kind === "wisdom" && !run.team[+value].moves.includes(d.signature)) {
      run.progress = {kind: "shrine", won: null, rewards: run.team.map((_, index) => ({index, exp: 0, levels: [], events: []})),
        pending: [{index: +value, move: d.signature, kind: "signature"}]};
      sinAdvanceMoves(run); e.message = `Sabiduría Antigua: ${esMove(d.signature)}.`;
    }
  } else return;
  sinSave(); sinShrineScreen();
}
function sinNextShrine() {
  const run = ST.sin.run, e = run?.shrineEvent;
  if (!e?.queue || !e.done || run.progress) return;
  run.shrineDiscard.push(e.queue[e.cursor]); e.cursor++;
  if (e.cursor === e.queue.length) { run.notice = e.message || "Ofrenda de santuario resuelta."; delete run.shrineEvent; }
  else { delete e.started; delete e.done; delete e.discarded; delete e.infuse; }
  sinSave(); renderSin();
}
function sinShrineScreen() {
  const run = ST.sin.run, e = run.shrineEvent;
  sinApplyShrine(run);
  const index = e.queue?.[e.cursor], card = SIN_SHRINE_CARDS[index], effect = card && SIN_SHRINE_EFFECTS[card.img];
  const choices = effect && ["exchange", "wisdom"].includes(effect.kind) ? sinShrineDiscards(run, effect.kind, e.grade) : [];
  $("app").innerHTML = `<div class="sin-new"><div class="sin-new-inner"><h1>Ofrenda de santuario · Grado ${esc(e.grade)}</h1>
    ${!e.queue ? `<p>Elige 2 cartas. Sus efectos se resolverán en el orden elegido; la restante se descarta.</p><div class="sin-choices sin-offer">${e.drawn.map(i => {
      const c = SIN_SHRINE_CARDS[i], fx = SIN_SHRINE_EFFECTS[c.img];
      return `<div class="sin-choice">${sinCardImage(c.img, fx.name)}<b>${esc(fx.name)}</b><button class="btn" data-act="sinshrinechoose" data-card="${i}" ${e.selected.includes(i) ? "disabled" : ""}>${e.selected.includes(i) ? "Elegida" : "Elegir"}</button></div>`;
    }).join("")}</div>` : `${sinCardImage(card.img, effect.name, "sin-prologue")}<h2>${esc(effect.name)}</h2><p role="status">${esc(e.message)}</p>
      ${effect.kind === "feast" && !run.progress ? `<p>Estofados gratis pendientes: ${esc(run.feast.remaining)}. También puedes elegirlos luego en la Bolsa, antes de terminar el turno.</p><div class="btns">${Object.entries(SIN_STEWS).map(([key, stew]) => `<button class="btn" data-act="sinstew" data-stew="${key}" ${sinFreeStew(run, key) && sinCanCraft(run, key, "stew") ? "" : "disabled"}>${esc(stew.name)}</button>`).join("")}</div>
        ${e.infuse && sinFreeStew(run, "infused") ? `<p>Elige quién subirá un nivel:</p><div class="btns">${run.team.map((s, i) => `<button class="btn" data-act="sininfuse" data-member="${i}" ${s.level < 100 ? "" : "disabled"}>${esc(esSp(s.species))} · Nv. ${esc(s.level)}</button>`).join("")}</div>` : ""}` : ""}
      ${run.progress ? sinProgressHTML() : e.done ? `<button class="btn primary" data-act="sinshrinenext">${e.cursor + 1 < e.queue.length ? "Siguiente carta" : "Volver al mapa"}</button>` :
      e.followerPending ? `<p>${run.follower ? "Puedes mantener tu Seguidor o cambiarlo." : "Elige obligatoriamente tu primer Dios Seguidor."} El elegido reemplazará al Dios que esté en Origin.</p><div class="sin-choices">${Object.entries(SIN_GODS).map(([god, data]) => `<div class="sin-choice">${sinCardImage(SIN_FATE_GODS[god], data.species)}<button class="btn primary" data-act="sinfollower" data-god="${god}">${run.follower === god ? "Seguir con " : "Seguir a "}${esc(data.species)}</button></div>`).join("")}</div>` :
      effect.kind === "bonguri" ? `<p>Elige ${esc(e.remaining)} Bonguri, uno por uno:</p><div class="btns">${Object.entries(SIN_BONGURI).map(([color, names]) => `<button class="btn" data-act="sinshrinecolor" data-color="${color}">${esc(names[0])}</button>`).join("")}</div>` :
      `<p>${effect.kind === "exchange" ? "Sustituye un Pokémon del equipo por un descartado del mismo nivel de encuentro." : "Elige el movimiento característico de un Pokémon descartado y a quién enseñarlo."}</p>
       ${choices.length ? `<div class="btns">${choices.map(s => `<button class="btn" data-act="sinshrinediscard" data-discard="${s.index}">${esc(esSp(s.species))} · ${esc(SIN_ES[s.tier] || s.tier)}${effect.kind === "wisdom" ? " · " + esc(esMove(s.signature)) : ""}${e.discarded === s.index ? " ✓" : ""}</button>`).join("")}</div>` : "<p>No hay Pokémon descartados compatibles con este efecto.</p>"}
       ${run.discard[e.discarded] ? `<p>Elige un Pokémon del equipo:</p><div class="btns">${run.team.map((s, i) => `<button class="btn" data-act="sinshrinemember" data-member="${i}" ${(effect.kind === "exchange" ? s.tier === run.discard[e.discarded].tier : !s.moves.includes(run.discard[e.discarded].signature)) ? "" : "disabled"}>${esc(esSp(s.species))} · Nv. ${esc(s.level)}</button>`).join("")}</div>` : ""}
       <button class="btn" data-act="sinshrineskip">No usar este efecto</button>`}`}
    </div></div>`;
  sinFillImages();
}
function sinLegendAvailable(run, species) {
  const id = toID(species), req = SIN_LEGEND_REQUIREMENTS[id];
  if (!req || run.legendsDone[id]) return false;
  if (req.fragment) return run.fragments.includes(req.fragment);
  if (req.boss) return run.act >= 4;
  const items = [...run.items, ...run.team.map(s => s.item), ...run.box.map(s => s.item)].map(toID);
  return req.artifacts.some(name => items.includes(SIN_ARTIFACTS[name].id));
}
function sinLegendRequirement(species) {
  const req = SIN_LEGEND_REQUIREMENTS[toID(species)];
  if (req?.fragment) return "Requiere el " + SIN_COMMANDERS.find(c => c.id === req.fragment).fragment + ".";
  if (req?.boss) return "Requiere derrotar a Helio.";
  return req ? "Requiere " + req.artifacts.map(name => SIN_ARTIFACTS[name].name).join(" o ") + " en la Bolsa o equipado. El artefacto se conserva." : "";
}
function sinSeekLegend(index) {
  const run = ST.sin.run, token = SIN.tokens[index];
  if (!sinMapAction(run) || run.searched || run.fought || !run.team.some(sinAlive) || !token || !sinAtToken(run, token.n)) return;
  const shrine = / Shrine$/.test(token.n), species = shrine ? run.shrineLegends[token.n] : token.gm;
  if (!species || (!shrine && (!token.tags?.includes("Legendary Encounter Card") || !sinLegendAvailable(run, species)))) return;
  const card = sinLegendCard(species); if (!card) return;
  run.searched = true;
  run.offer = {cards: [{species, img: card.img, level: SIN_LEGEND_LEVELS[toID(species)] || SIN_LEGEND_LEVEL}],
    token: index, legend: {species, ...(shrine ? {shrine: token.n} : {place: token.n})}, place: sinName(token), meta: "Encuentro legendario", closed: false};
  sinSave(); renderSin();
}
function sinLegendsHTML(run) {
  return `<h2>Legendarios</h2><p>Activos en santuarios:</p>${Object.keys(run.shrineLegends).length ? `<ul>${Object.entries(run.shrineLegends).map(([shrine, species]) => `<li>${esc(esSp(species))} · ${esc(sinShrineName(shrine))}</li>`).join("")}</ul>` : "<p>Ninguno.</p>"}
    <p>Ya derrotados o capturados:</p>${Object.keys(run.legendsDone).length ? `<ul>${Object.entries(run.legendsDone).map(([species, result]) => `<li>${esc(esSp(species))} · ${result === "caught" ? "Capturado" : "Derrotado"}</li>`).join("")}</ul>` : "<p>Ninguno.</p>"}`;
}
async function sinFight(index, trainerKey = false) {
  const run = ST.sin.run;
  if (!run || SIN_BUSY || run.fought || run.revive || !run.team.some(sinAlive)) return;
  if (!run.battle && (trainerKey ? !sinMapAction(run) || !sinCanChallengeTrainer(run, trainerKey) : !run.offer || run.offer.closed || !run.offer.cards[index])) return;
  SIN_BUSY = true;
  document.querySelectorAll(".sin-new button").forEach(b => { b.disabled = true; });
  try {
    if (!run.battle) {
      // El índice original y un apodo único mantienen la asociación aunque cambie el orden o la forma.
      const indices = run.team.map((s, i) => sinAlive(s) ? i : -1).filter(i => i >= 0);
      if (trainerKey) {
        const spec = sinTrainerSpec(run, trainerKey), cards = shuffle(spec.cards.slice()).slice(0, spec.count), [lo, hi] = spec.levels;
        const foes = await Promise.all(cards.map(c => sinInitialSet(c.d.sp, spec.kind === "boss" && toID(c.d.sp) === "arceus" ? SIN_ARCEUS_LEVEL : lo + Math.floor(Math.random() * (hi - lo + 1)))));
        const {kind, id, name, intro, bgm, aiDiff} = spec;
        run.battle = {trainer: {kind, id, name, intro, bgm, aiDiff}, foes, cards: cards.map(c => c.img), indices};
      } else {
        const s = run.offer.cards[index], wild = await sinInitialSet(s.species, s.level, !!s.alpha);
        if (run.offer.legend) shuffle(Object.keys(wild.ivs)).slice(0, 3).forEach(k => { wild.ivs[k] = 31; });
        const token = SIN.tokens.indexOf(sinEncounterToken(run));
        run.battle = {wild, indices, token, tier: wild.alpha || run.offer.legend ? "L" : SIN.tokens[token]?.tier, card: s.img, hidden: run.offer.hidden,
          legend: run.offer.legend, captivating: !!run.captivating};
        run.captivating = false; run.offer.closed = true;
      }
      run.battle.start = {team: JSON.parse(JSON.stringify(run.team)), pos: [...run.pos], moved: run.moved, searched: run.searched};
      sinSave();
    }
    if (!run.battle.start) {
      run.battle.start = {team: JSON.parse(JSON.stringify(run.team)), pos: [...run.pos], moved: run.moved, searched: run.searched}; sinSave();
    }
    if (!run.battle.trainer && !run.battle.swarm && !run.battle.tier) { run.battle.tier = sinEncounterToken(run)?.tier; sinSave(); }
    const mine = run.battle.indices.map(i => ({...run.team[i], name: "Sinnoh" + (i + 1)}));
    const trainer = run.battle.trainer;
    const swarm = run.battle.swarm;
    const foes = (trainer || swarm ? run.battle.foes : [run.battle.wild]).map((s, i) => ({...s, ...(swarm ? {name: "Enjambre" + (i + 1)} : {})}))
      .filter((s, i) => !swarm || (!run.battle.captures[i] && !run.battle.defeated.includes(i)));
    const spec = trainer && (trainer.name ? trainer : sinTrainerSpec(run, "grunt"));
    if (run.mode === "cards") { sinLeave(); return cardStart(run); }
    sinLeave(); newBattle(mine, foes, {sin: true, aiDiff: swarm ? "normal" : spec ? spec.aiDiff : "easy", pre: sinPre(mine),
      ...(swarm ? {foeName: "Enjambre", intro: "¡Un enjambre de Pokémon salvajes sale de la Puerta de Distorsión!", bgm: "bgm_boss"} : {}),
      ...(run.battle.legend ? {bgm: run.battle.legend.god ? "bgm_final" : "bgm_boss"} : {}),
      ...(spec ? {foeName: spec.name, intro: spec.intro, bgm: spec.bgm} : {})});
    sinBattleIntro(run.battle);
  } catch (err) {
    const message = "No se pudo preparar el combate. Intenta nuevamente.";
    const el = $("sin-offer-error"); if (el) el.textContent = message;
    else if (SIN_VIEW) { run.notice = message; sinUpdateTurn(); }
  } finally {
    SIN_BUSY = false; document.querySelectorAll(".sin-new button").forEach(b => { b.disabled = false; });
  }
}
function sinPendingScreen() {
  const battle = ST.sin.run.battle, foes = battle.trainer || battle.swarm ? battle.foes : [battle.wild];
  $("app").innerHTML = `<div class="sin-new"><div class="sin-new-inner"><h1>Combate pendiente</h1>
    ${battle.trainer ? `<p>${esc(battle.trainer.name || "Reclutas del Equipo Galaxia")}</p>` : ""}
    ${battle.swarm ? "<p>Batalla Enjambre: Débil → Moderado → Fuerte. Las capturas y los caídos guardados se conservan; continúas con los restantes. Ganar los tres da 7 PV, sin Bonguri.</p>" : ""}
    <p>${foes.map(s => `${esc(esSp(s.species))} · Nv. ${esc(s.level)}`).join(" / ")}. Al salir o recargar se repite este mismo encuentro desde su inicio.</p>
    <button class="btn primary" data-act="sinresume">Reanudar combate</button><p id="sin-offer-error" role="alert"></p></div></div>`;
}
function sinResult(won, me) {
  const run = ST.sin.run; if (!run || !run.battle) return;
  sinMigrateTeam(run);
  const encounter = run.battle, god = encounter.legend?.god;
  const trainer = encounter.trainer, swarm = encounter.swarm, wild = encounter.wild, token = trainer || swarm ? null : sinEncounterToken(run), tier = encounter.tier || token?.tier;
  const move = trainer || swarm ? null : sinSignatureMove(sinBattleCard(run)), fled = !trainer && !swarm && won === null && !!me.sinFled;
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
  if (won === true && god && encounter.legend.aura && encounter.legend.phase === 1 && !me.sinCaught) {
    const species = SIN_GODS[god].species + "-Origin";
    const origin = {...wild, species, ability: Dex.species.get(species).abilities["0"]};
    delete origin.hpNow; delete origin.status;
    run.battle = {...encounter, wild: origin, legend: {...encounter.legend, phase: 2}, fateEffects: [],
      indices: run.team.map((s, i) => sinAlive(s) ? i : -1).filter(i => i >= 0),
      start: {team: JSON.parse(JSON.stringify(run.team)), pos: [...run.pos], moved: run.moved, searched: run.searched}};
    delete run.battle.failedBall; delete run.battle.ballAttempt;
    me.sinOriginPending = true;
    run.notice = `¡El Aura Celestial restaura a ${SIN_GODS[god].species} en su Forma Origen! Tu equipo conserva sus PS y estados.`;
    sinSave(); return;
  }
  if (won === false && encounter.start && sinFatePayment(run, "dialga", 3)) {
    if (swarm) sinSwarmDefeated(encounter, me);
    run.retry = JSON.parse(JSON.stringify(encounter));
  }
  if (swarm) {
    run.progress = {won, kind: "swarm", rewards: [], pending: []};
    if (!run.retry) sinSwarmRewards(run, encounter, won === true, me);
  } else if (won === true) {
    sinGainExp(run, trainer ? run.battle.foes : wild, me, !!trainer);
    if (trainer) {
      sinCheckStamps(run, {trainer: true});
      run.progress.kind = "trainer";
      if (trainer.kind === "grunt" && run.act === 1) {
        run.act = 2; run.grunts = run.grunts.filter(v => v !== run.village); run.moveBonus += 2;
        run.progress.act = 2;
      } else if (trainer.kind === "commander" && run.act === 2 && !run.fragments.includes(trainer.id)) {
        run.fragments.push(trainer.id); run.frag++;
        run.progress.fragment = trainer.id;
        if (run.fragments.length === 3) { run.act = 3; run.progress.act = 3; }
      } else if (trainer.kind === "boss" && run.act === 3 && run.heart) {
        run.act = 4; run.progress.act = 4;
      }
    } else {
      run.progress.bonguri = run.battle.legend ? {} : sinBonguriReward(run, token, sinFx(run, "doubleBonguri") ? 6 : 3);
      run.progress.pv = (wild.alpha ? 4 : SIN_PV[tier] || 0) + (me.sinCaught ? 0 : 2);
      run.pv += run.progress.pv;
      if (SIN_SIGNATURE_TEACH && !me.sinCaught && move) run.progress.signature = {move};
      if (run.mode === "cards" && !me.sinCaught) { const c = cardByImg(encounter.card) || cardBySpecies(wild.species); if (c) run.progress.cardTeach = {move: cardStats(c).sig}; }
      if (!me.sinCaught && sinFx(run, "pvDefeat")) { run.pv += 2; run.progress.pv += 2; }
      if (!me.sinCaught) run.discard.push({species: wild.species, tier, signature: move});
      run.progress.unlockTiers = [wild.alpha ? "S" : run.battle.legend ? "L" : tier];
      if (me.sinCaught && sinFx(run, "bugFrenzy") && !run.frenzyTurn && Dex.species.get(wild.species).types.includes("Bug")) { run.pv += 2; run.progress.pv += 2; run.frenzy = true; }
      if (run.battle.legend) {
        run.legendsDone[toID(wild.species)] = me.sinCaught ? "caught" : "defeated";
        const shrine = run.battle.legend.shrine;
        if (shrine && toID(run.shrineLegends[shrine]) === toID(wild.species)) delete run.shrineLegends[shrine];
      }
      if (me.sinCaught) {
        wild.tier = tier;
        const m = me.mons[me.act.p2];
        wild.hpMax = wild.card ? wild.card.hp : calcStat(Dex.species.get(wild.species), wild, "hp");
        wild.hpNow = Math.max(1, Math.min(wild.hpMax, Math.ceil(m.hp / m.max * wild.hpMax)));
        wild.status = SIN_STATUS[m.status] ? m.status : "";
        const boxed = run.team.length >= sinTeamSlots(run);
        (boxed ? run.box : run.team).push(wild);
        run.caught++;
        run.progress.caught = {species: wild.species, boxed};
      }
    }
  }
  else {
    run.progress = {won, rewards: [], pending: [], fled, escaped: !trainer && !!me.sinEscaped, ...(trainer ? {kind: "trainer"} : {})};
    if (fled) run.progress.bonguri = sinBonguriReward(run, token, SIN_FLEE_BONGURI[tier] ?? 0);
  }
  if (run.battle.hidden && run.hidden[run.battle.hidden] && !run.retry) run.hidden[run.battle.hidden].present = false;
  if (!trainer && !swarm && won !== false && sinFx(run, "portable")) {
    // Tienda Portable: se cura el Pokémon más herido.
    const hurt = run.team.filter(s => sinAlive(s) && s.hpNow != null).sort((a, b) => a.hpNow / a.hpMax - b.hpNow / b.hpMax)[0];
    if (hurt) { delete hurt.hpNow; delete hurt.status; }
  }
  delete run.masterStew;
  const unlockTiers = run.progress?.unlockTiers || [];
  run.fought = true; if (!sinFx(run, "planning")) run.moved = sinMaxMoves(run); run.battle = null;
  if (run.retry) {
    run.revive = true; run.notice = "Tu equipo fue derrotado. Puedes jugar Dialga Juega 3 antes de volver al pueblo: repetirás los mismos rivales con tu equipo como estaba al empezar.";
  } else if (!run.team.some(sinAlive)) {
    sinReturnHome(run);
  } else run.notice = trainer ? (won ? trainer.kind === "grunt" ? "¡Derrotaste a los Reclutas del Equipo Galaxia! Ganas +2 movimientos por turno." : `¡Derrotaste a ${trainer.name}! ${trainer.kind === "boss" ? "Es hora de elegir el destino del Corazón de Sinnoh." : "Obtuviste un Fragmento de Sinnoh."}` : "El combate terminó en empate. Puedes reintentar el desafío en otro turno; los PS y estados se mantienen.") : me.sinEscaped ? "Huiste del Pokémon Alfa. Su ficha se descartó; los PS y estados de tu equipo se mantienen." : fled ? "¡El Pokémon salvaje huyó! Los PS y estados de tu equipo se mantienen." : won === null ? "El combate terminó en empate. Los PS y estados se mantienen." :
    me.sinCaught ? "¡Atrapaste al Pokémon salvaje! Los PS y estados se mantienen." : "¡Venciste al Pokémon salvaje! Los PS y estados de tu equipo se mantienen.";
  if (won === true && god) {
    run.originGod = null;
    if (run.campaign === "heart") {
      const stars = sinResetTurn(run);
      run.notice = `¡${me.sinCaught ? "Capturaste" : "Venciste"} a ${SIN_GODS[god].species}! Origin queda libre. ¡Juegas otro turno inmediatamente! ${stars}`;
    } else run.notice = `¡Origin queda libre de ${SIN_GODS[god].species}!`;
  }
  if (run.frenzy) { delete run.frenzy; const stars = sinResetTurn(run); run.frenzyTurn = true; run.notice = `¡Frenesí de Captura! +2 PV y juegas otro turno. ${stars}`; }
  if (unlockTiers.length) sinTrainerProgress(run, unlockTiers);
  if (encounter.legend?.ub || encounter.legend?.necro) sinUltraResult(run, encounter, won);
  if (swarm && !run.revive) run.notice = won ? "¡Superaste los tres Pokémon del enjambre! Ganaste 7 PV, sin Bonguri. Tu turno terminó." : "El enjambre terminó sin victoria completa: 0 PV y ningún Bonguri. Tu turno terminó.";
  sinSave();
}
function sinReturnHome(run) {
  const home = SIN.tokens.find(t => t.n === run.village && t.tags?.includes("Village Token"));
  run.pos = [...home.cell]; run.revive = true; ST.sin.cam = null;
  run.notice = "Tu equipo fue derrotado. Volviste a tu pueblo natal; termina el turno para recuperarlo.";
}
async function sinRepeatBattle() {
  const run = ST.sin.run, encounter = run?.retry;
  if (!encounter || run.progress?.won !== false || !sinSpendFate(run, "dialga", 3)) return;
  const start = encounter.start;
  run.team = JSON.parse(JSON.stringify(start.team)); run.pos = [...start.pos]; run.moved = start.moved; run.searched = start.searched;
  run.fought = false; run.revive = false; run.battle = encounter; run.battle.fateEffects = [];
  if (encounter.swarm) { encounter.captures = {}; encounter.defeated = []; }
  delete encounter.captureFailureTurn; delete encounter.captureFailureStreak; delete encounter.captureTurn;
  delete run.battle.failedBall; delete run.battle.ballAttempt; delete run.progress; delete run.retry;
  run.notice = "¡Dialga rebobina el combate! Conservas las Balls gastadas; recuperas el equipo con que empezaste.";
  sinSave(); if (B) B.dead = true; B = null; VIEW = "sin"; return sinFight();
}
function sinAcceptDefeat() {
  const run = ST.sin.run; if (!run?.retry || run.progress?.won !== false) return;
  if (run.retry.hidden && run.hidden[run.retry.hidden]) run.hidden[run.retry.hidden].present = false;
  if (run.retry.swarm) sinSwarmRewards(run, run.retry, false);
  delete run.retry; sinReturnHome(run); sinSave(); sinRefreshProgress();
}
function sinEndHTML(won) {
  // Los empates pasan directamente por showEnd en batalla.js.
  if (won === null && B && B.sin) sinResult(null, B);
  if (B?.sinOriginPending && ST.sin.run?.battle?.legend?.phase === 2) {
    const me = B;
    setTimeout(() => { if (B === me && !me.dead && ST.sin.run?.battle?.legend?.phase === 2) { VIEW = "sin"; sinFight(); } }, 0);
    return `<div class="card"><p>${esc(ST.sin.run.notice)}</p><button class="btn primary" data-act="sinorigin">Continuar contra la Forma Origen</button></div>`;
  }
  return sinProgressHTML(won);
}
function sinProgressHTML(won) {
  const run = ST.sin.run, p = run && run.progress, q = p && p.pending[0];
  if (p) won = p.won;
  if (p?.act != null) requestAnimationFrame(sinFillImages);
  return `<div class="card"><p class="result">${p?.kind === "item" ? "Evolución" : p?.kind === "stew" ? "Estofado Infundido" : p?.escaped ? "Huiste del combate" : p?.fled ? "¡El Pokémon salvaje huyó!" : won === null ? "Empate" : p?.caught ? "¡Capturado!" : won ? "¡Victoria!" : "Derrota"}</p>
    <p class="note">${esc(run ? run.notice : "El combate terminó.")}</p>${run && typeof cardTeachHTML === "function" ? cardTeachHTML(run) : ""}${run ? sinStampNotices(run) : ""}
    ${p?.act != null ? sinCampaignHTML(run) : ""}
    ${p?.fragment ? `<p>¡Obtuviste el ${esc(SIN_COMMANDERS.find(c => c.id === p.fragment).fragment)}!</p><p>+1 espacio en el equipo · +1 movimiento por turno · Equipo: ${esc(sinTeamSlots(run))} espacios.</p>` : ""}
    ${p?.caught ? `<p>${esc(esSp(p.caught.species))} ${p.caught.boxed ? "fue enviado a la Caja" : "se unió a tu equipo"}.</p>` : ""}
    ${(p?.captures || []).map(c => `<p>${esc(esSp(c.species))} ${c.boxed ? "fue enviado a la Caja" : "se unió a tu equipo"}.</p>`).join("")}
    ${p?.pv != null ? `<p>Ganaste ${esc(p.pv)} ${p.pv === 1 ? "Punto" : "Puntos"} de Viaje.</p>` : ""}
    ${p?.fled && !Object.keys(p.bonguri || {}).length ? "<p>Recibiste 0 Bonguri.</p>" : ""}
    ${p?.bonguri && Object.keys(p.bonguri).length ? `<p>Recibiste ${Object.entries(p.bonguri).map(([k, n]) => `${esc(n)} Bonguri ${esc(SIN_BONGURI[k][n === 1 ? 0 : 1])}`).join(", ")}.</p>` : ""}
    ${p ? p.rewards.filter(r => r.exp || r.levels.length || r.events.length).map(r => {
      const name = esc(esSp(r.species || run.team[r.index].species));
      return `<div class="sin-progress"><b>${name}: +${esc(r.exp)} EXP</b>
        ${r.levels.map(n => `<p>¡${name} subió al nivel ${esc(n)}!</p>`).join("")}
        ${r.events.map(e => `<p>${e.evolved ? `¡Felicidades! Tu ${esc(esSp(e.from))} evolucionó en ${esc(esSp(e.evolved))}.` : e.skip ? `${name} no aprendió ${esc(esMove(e.move))}.` : e.forgot ?
          `${name} olvidó ${esc(esMove(e.forgot))} y aprendió ${esc(esMove(e.move))}.` : `${name} aprendió ${esc(esMove(e.move))}.`}</p>`).join("")}</div>`;
    }).join("") : ""}
    ${q && q.kind === "evolution" ? `<div class="sin-learn sin-evolution"><p><b>¿Qué? ¡${esc(esSp(run.team[q.index].species))} está evolucionando!</b></p>
      <img src="${esc(img(run.team[q.index].species))}" alt="${esc(esSp(run.team[q.index].species))}">
      <div class="btns"><button class="btn primary" data-act="sinevolve">Evolucionar</button><button class="btn" data-act="sincancelevolution">Cancelar</button></div></div>` :
    q ? `<div class="sin-learn"><p><b>${esc(esSp(run.team[q.index].species))}</b> quiere aprender <b>${esc(esMove(q.move))}</b> (${q.kind === "signature" ? "movimiento de la carta" : q.level === 0 ? "al evolucionar" : "Nv. " + esc(q.level)}). Elige un ataque para olvidar.</p>
      <div class="btns">${run.team[q.index].moves.map((move, i) => `<button class="btn" data-act="sinlearn" data-sin-slot="${i}">Olvidar ${esc(esMove(move))}</button>`).join("")}
      <button class="btn" data-act="sinlearn" data-sin-slot="-1">No aprender</button></div></div>` :
    p?.signature && !p.signature.done ? `<div class="sin-learn"><p>Enseñar <b>${esc(esMove(p.signature.move))}</b> a…</p><div class="btns">
      ${run.team.map((s, i) => sinAlive(s) && !s.moves.some(m => toID(m) === p.signature.move) ? `<button class="btn" data-act="sinsignature" data-member="${i}">${esc(esSp(s.species))} · Nv. ${esc(s.level)}</button>` : "").join("")}
      <button class="btn" data-act="sinsignature" data-member="-1">No enseñar</button></div></div>` :
      run.retry ? `<div class="btns"><button class="btn primary" data-act="sinretrybattle" ${sinFatePayment(run, "dialga", 3) ? "" : "disabled"}>Dialga Juega 3: Repetir combate</button><button class="btn" data-act="sinacceptdefeat">Volver al pueblo</button></div>` :
      run.shrineEvent ? '<div class="btns"><button class="btn primary" data-act="sinshrineprogress">Continuar evento</button></div>' :
      run.act === 4 && !run.won ? sinFinalChoicesHTML() : '<div class="btns"><button class="btn primary" data-act="sinmap">Volver al mapa</button></div>'}</div>`;
}
function sinTeachSignature(index) {
  const run = ST.sin.run, p = run?.progress, offer = p?.signature;
  if (!offer || offer.done || p.pending.length || !Number.isInteger(index)) return;
  if (index !== -1) {
    const s = run.team[index];
    if (!s || !sinAlive(s) || s.moves.some(m => toID(m) === offer.move)) return;
    p.pending.push({index, move: offer.move, kind: "signature"});
  }
  offer.done = true; sinAdvanceMoves(run); sinSave(); sinRefreshProgress();
}
function sinProgressScreen() {
  $("app").innerHTML = `<div class="sin-new"><div class="sin-new-inner"><h1>${ST.sin.run.progress?.kind === "item" ? "Evolución" : ST.sin.run.progress?.kind === "tm" ? "Movimiento de carta" : ST.sin.run.progress?.kind === "stew" ? "Subida de nivel" : "Resultado del combate"}</h1>${sinProgressHTML()}</div></div>`;
}
function sinLearn(slot) {
  const run = ST.sin.run, p = run && run.progress, q = p && p.pending[0];
  if (!q || q.kind === "evolution" || !Number.isInteger(slot) || slot < -1 || slot >= run.team[q.index].moves.length) return;
  const s = run.team[q.index], event = {move: q.move};
  if (slot === -1) event.skip = true;
  else { event.forgot = s.moves[slot]; s.moves[slot] = q.move; }
  p.rewards[q.index].events.push(event); p.pending.shift(); sinAdvanceMoves(run); sinSave();
  sinRefreshProgress();
}
function sinEvolve(accept) {
  const run = ST.sin.run, p = run && run.progress, q = p && p.pending[0];
  if (!q || q.kind !== "evolution" || !q.target) return;
  const s = run.team[q.index], before = Dex.species.get(s.species), after = Dex.species.get(toID(q.target));
  p.pending.shift();
  if (!accept && q.refund) Object.entries(q.refund).forEach(([k, n]) => { run.bag[k] += n; });
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
  sinAdvanceMoves(run); sinSave(); sinRefreshProgress();
}
function sinRefreshProgress() {
  if (ST.sin.run?.shrineEvent) return sinShrineScreen();
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
  SIN_VIEW.boxMember = null; sinSave(); sinUpdateTurn();
}
function sinBoxMember(s) {
  const max = s.hpMax ?? calcStat(Dex.species.get(s.species), s, "hp"), hp = s.hpNow ?? max;
  return `<b>${esc(esSp(s.species))}</b>${s.alpha ? " · Alfa" : ""} · Nv. ${esc(s.level)} · ${s.gender === "M" ? "♂" : s.gender === "F" ? "♀" : "Sin sexo"} · ${esc(hp)}/${esc(max)} PS${s.item ? " · " + esc(sinItemName(s.item)) : ""}`;
}
function sinShowBox() {
  const run = ST.sin.run;
  if (!run || !SIN_VIEW || run.battle || run.progress || !sinAtVillage(run)) return;
  const selected = SIN_VIEW.boxMember;
  SIN_VIEW.box = true; SIN_VIEW.bag = false; SIN_VIEW.selected = null; SIN_VIEW.panel = null;
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
  if (!h || run.healed || run.revive || run.battle || run.progress || !sinCellTokens(h).some(t =>
    (t.tags || []).includes("Village Token") || (t.n === "Campsite" && t.hidden?.revealed))) return;
  run.team.forEach(s => { delete s.hpNow; delete s.status; });
  run.healed = true; run.notice = "Tu equipo está completamente recuperado."; sinSave(); sinUpdateTurn();
}
function sinEndTurn() {
  const run = ST.sin.run; if (!run || run.battle || run.progress || run.shrineEvent || run.fateTeleport || (run.offer && !run.offer.closed)) return;
  delete run.frenzyTurn;
  if (run.revive) run.team.forEach(s => { delete s.hpNow; delete s.status; });
  run.notice = [sinResetTurn(run), sinUltraRound(run)].filter(Boolean).join(" "); sinSave();
  if (run.lost) return renderSin();
  sinUpdateTurn();
}
function sinResetTurn(run) {
  run.turn++; run.moved = 0; run.fought = false; run.healed = false; run.searched = false;
  run.traded = false; run.flown = false; run.stews = {};
  run.offered = false; run.feast = {remaining: 0, used: []}; run.fatePlayed = false; delete run.fateTeleport;
  if (SIN_VIEW) SIN_VIEW.bagStew = false;
  run.offer = null; run.revive = false; run.picked = false; run.researched = false; run.stashMoves = 0; run.biomeBonus = sinBiomeBonus(run);
  if (sinFx(run, "wish")) run.team.forEach(s => { if (s.hpNow != null && s.hpNow > 0) { s.hpNow = Math.min(s.hpMax, s.hpNow + Math.ceil(s.hpMax / 10)); if (s.hpNow >= s.hpMax) delete s.hpNow; } });
  return run.stars >= 4 ? sinDrawFate(run, Math.floor(run.stars / 4)) : "";
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
/* ---------- Tablero 3D ----------
   Proyección propia en el canvas (sin librerías): cada casilla es un prisma hexagonal con altura según su elevación,
   la cámara gira alrededor del tablero (yaw) y se inclina (pitch), con perspectiva. Las fichas son "billboards":
   quedan de pie mirando a la cámara. Se dibuja de atrás hacia adelante para que lo cercano tape lo lejano. */
const SIN_ZL = 15; // altura de cada nivel de elevación
const sinYaw = () => (ST.sin.yaw || 0) * Math.PI / 180;
function sinCam3d() {
  const v = SIN_VIEW, t = sinTilt() * Math.PI / 180, yaw = sinYaw();
  return {v, cx: v.cam.x, cy: v.cam.y, z: v.cam.z, cos: Math.cos(yaw), sin: Math.sin(yaw), ct: Math.cos(t), st: Math.sin(t), F: 1.7 * Math.max(v.w, v.h)};
}
// Proyecta un punto del tablero (x, y en el plano; zz = altura) a la pantalla. k = escala por perspectiva.
function sinProj(cam, x, y, zz) {
  const dx = x - cam.cx, dy = y - cam.cy;
  const rx = dx * cam.cos - dy * cam.sin, ry = dx * cam.sin + dy * cam.cos;
  const near = (ry * cam.st + zz * cam.ct) * cam.z, k = cam.F / Math.max(cam.F * .25, cam.F - near);
  return {x: cam.v.w / 2 + rx * cam.z * k, y: cam.v.h / 2 + (ry * cam.ct - zz * cam.st) * cam.z * k, k, d: ry * cam.st + zz * cam.ct};
}
const sinFlatY = h => -h.r * SIN_H;
function sinHexPts(cam, h, zz) {
  const y = sinFlatY(h);
  return Array.from({length: 6}, (_, i) => sinProj(cam, h.x + SIN_S * Math.cos(i * Math.PI / 3), y + SIN_S * Math.sin(i * Math.PI / 3), zz));
}
function sinPoly(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); }
function sinBillboard(ctx, im, base, size, opts = {}) {
  if (!im) return;
  const w0 = im.naturalWidth || im.width, h0 = im.naturalHeight || im.height, k = size * base.k * SIN_VIEW.cam.z / Math.max(w0, h0);
  const w = w0 * k, ht = h0 * k;
  ctx.drawImage(im, base.x - w / 2, base.y - ht - (opts.lift || 0) * base.k * SIN_VIEW.cam.z, w, ht);
}
function sinDraw3D() {
  const v = SIN_VIEW, run = ST.sin.run, cam = sinCam3d(), ctx = v.canvas.getContext("2d"), dpr = v.dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, v.w, v.h);
  const accent = getComputedStyle(v.canvas).getPropertyValue("--accent").trim() || "#66d9b3";
  const cells = SIN_CELLS.map(h => ({h, c: sinProj(cam, h.x, sinFlatY(h), h.l * SIN_ZL)}))
    .filter(({c}) => c.x > -160 && c.x < v.w + 160 && c.y > -200 && c.y < v.h + 260)
    .sort((a, b) => a.c.d - b.c.d);
  v.drawn3d = cells;
  const me = run && SIN_BY_CELL.get(run.pos.join(","));
  cells.forEach(({h, c}) => {
    const top = h.l * SIN_ZL, pts = sinHexPts(cam, h, top), low = sinHexPts(cam, h, -SIN_ZL * .6);
    // Paredes: solo las que miran a la cámara.
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6, na = (i + .5) * Math.PI / 3, ny = Math.cos(na) * cam.sin + Math.sin(na) * cam.cos;
      if (ny <= 0) continue;
      sinPoly(ctx, [pts[i], pts[j], low[j], low[i]]);
      ctx.fillStyle = h.col2 || h.col; ctx.fill(); ctx.fillStyle = `rgba(0,0,0,${.35 + .25 * (1 - ny)})`; ctx.fill();
      ctx.strokeStyle = "#101b2060"; ctx.lineWidth = .7; ctx.stroke();
    }
    // Cara superior con su color y la textura del mod (multiplicada).
    ctx.save(); sinPoly(ctx, pts); ctx.clip();
    ctx.fillStyle = h.w ? (h.col2 || "#567876") : h.col; ctx.fill();
    if (h.w) { ctx.globalAlpha = .5; ctx.fillStyle = h.col; ctx.fill(); ctx.globalAlpha = 1; }
    const tex = sinImage("tex" + h.t);
    if (tex && c.k * cam.z > .25) {
      const y = sinFlatY(h), p0 = sinProj(cam, h.x - SIN_S, y - SIN_H, top), p1 = sinProj(cam, h.x + SIN_S, y - SIN_H, top), p2 = sinProj(cam, h.x - SIN_S, y + SIN_H, top);
      const iw = tex.naturalWidth, ih = tex.naturalHeight;
      ctx.setTransform((p1.x - p0.x) / iw * dpr, (p1.y - p0.y) / iw * dpr, (p2.x - p0.x) / ih * dpr, (p2.y - p0.y) / ih * dpr, p0.x * dpr, p0.y * dpr);
      ctx.globalCompositeOperation = "multiply"; ctx.drawImage(tex, 0, 0); ctx.globalCompositeOperation = "source-over";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (sinDestroyed(run, h)) { ctx.fillStyle = "#1b0d2bb0"; ctx.fill(); }
    ctx.restore();
    sinPoly(ctx, pts); ctx.strokeStyle = "#16262299"; ctx.lineWidth = .8; ctx.stroke();
    const tokens = sinCellTokens(h), mark = (fill, stroke, width) => { sinPoly(ctx, pts); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); };
    if (v.reachable.has(h.c + "," + h.r)) mark("rgba(255,255,255,.3)", accent, 2.5);
    if (h === v.selected) mark("#fff4", "#ffde75", 3);
    if (tokens.some(sinSwarmGate)) mark("#bc7cff44", "#ce9cff", 3);
    if (tokens.some(t => sinCampaignTarget(run, t))) mark("#ffe35d55", "#ffe35d", 3);
    // Fichas del mod, de pie sobre la casilla.
    const y = sinFlatY(h);
    tokens.forEach((t, i) => {
      const key = t.kind === "CardCustom" && !t.hidden?.revealed ? t.img2 : t.img, im = sinImage(key);
      const n = tokens.length, size = n === 1 ? 54 : Math.min(40, 64 / Math.sqrt(n)), a = i * Math.PI * 2 / n, off = n === 1 ? 0 : 17;
      const base = sinProj(cam, h.x + Math.cos(a) * off, y + Math.sin(a) * off, top);
      if (im) sinBillboard(ctx, im, base, size);
      else { ctx.beginPath(); ctx.arc(base.x, base.y - 8 * base.k * cam.z, 10 * base.k * cam.z, 0, Math.PI * 2); ctx.fillStyle = "#eaf4e229"; ctx.fill(); }
    });
    const shrine = tokens.find(t => (t.n === "Origin Shrine" && run?.originGod) || run?.shrineLegends[t.n]);
    if (shrine) {
      const species = shrine.n === "Origin Shrine" && run.originGod ? SIN_GODS[run.originGod].species : run.shrineLegends[shrine.n];
      sinBillboard(ctx, sinImage(sinLegendCard(species)?.img), sinProj(cam, h.x + 22, y - 10, top), 46);
    }
    if (h.tokens.some(t => run?.grunts.includes(t.n))) sinBillboard(ctx, sinImage(SIN_GRUNT_IMAGE), sinProj(cam, h.x + 26, y - 14, top), 34);
    const ub = sinUltra(run) && run.ubs.find(u => u.pos.join(",") === h.c + "," + h.r);
    if (ub) sinDrawCoin(ctx, sinProj(cam, h.x, y, top), cam, ub.species, "#2b1145", "#ff5ad2");
    if (h === me) sinDrawCoin(ctx, sinProj(cam, h.x, y, top), cam, run.team[0].species, SIN_PLAYER_COLORS[run.color] || "#447fd2", "#fff");
  });
}
// Ficha redonda de pie (jugador o Ultraente) con el ícono del Pokémon.
function sinDrawCoin(ctx, base, cam, species, fill, ring) {
  const r = SIN_H * .72 * base.k * cam.z, cx = base.x, cy = base.y - r * 1.05, picture = sinPlayerImage(species);
  ctx.save();
  ctx.beginPath(); ctx.ellipse(base.x, base.y, r * .8, r * .25, 0, 0, Math.PI * 2); ctx.fillStyle = "#0005"; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = ring; ctx.lineWidth = Math.max(2, r * .12); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r * .78, 0, Math.PI * 2); ctx.fillStyle = "#f4f8fc"; ctx.fill(); ctx.clip();
  if (picture) {
    const {im, strip} = picture, w = im.naturalWidth / (strip ? 2 : 1), ht = im.naturalHeight, s = r * 1.56 / Math.max(w, ht);
    ctx.imageSmoothingEnabled = !strip; ctx.drawImage(im, 0, 0, w, ht, cx - w * s / 2, cy - ht * s / 2, w * s, ht * s);
  }
  ctx.restore();
}
// Toque en 3D: la casilla más cercana a la cámara cuya cara superior contiene el punto.
function sinPick3D(px, py) {
  const cam = sinCam3d(), cells = SIN_VIEW.drawn3d || [];
  for (let i = cells.length - 1; i >= 0; i--) {
    const h = cells[i].h, pts = sinHexPts(cam, h, h.l * SIN_ZL);
    let inside = false;
    for (let a = 0, b = 5; a < 6; b = a++) {
      if ((pts[a].y > py) !== (pts[b].y > py) && px < (pts[b].x - pts[a].x) * (py - pts[a].y) / (pts[b].y - pts[a].y) + pts[a].x) inside = !inside;
    }
    if (inside) return h;
  }
  return null;
}
// Arrastrar en 3D: el desplazamiento de pantalla se convierte al plano del tablero según el giro y la inclinación.
function sinPan3D(dx, dy) {
  const cam = sinCam3d(), sx = dx / cam.z, sy = dy / (cam.z * Math.max(.35, cam.ct));
  SIN_VIEW.cam.x -= sx * cam.cos + sy * cam.sin; SIN_VIEW.cam.y -= -sx * cam.sin + sy * cam.cos;
}
function sinDraw() {
  const v = SIN_VIEW; if (!v || !v.cam) return;
  const run = ST.sin.run;
  if (sinTilt()) return sinDraw3D();
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
    const tokens = sinCellTokens(h);
    if (tokens.some(sinSwarmGate)) {
      sinHex(ctx, h.x, h.y); ctx.fillStyle = "#bc7cff44"; ctx.fill();
      ctx.strokeStyle = "#ce9cff"; ctx.lineWidth = 4 / z; ctx.stroke();
    }
    if (tokens.some(t => sinCampaignTarget(run, t))) {
      sinHex(ctx, h.x, h.y); ctx.fillStyle = "#ffe35d55"; ctx.fill();
      ctx.strokeStyle = "#ffe35d"; ctx.lineWidth = 4 / z; ctx.stroke();
    }
    tokens.forEach((t, i) => {
      // El generador reserva img para el frente y img2 para el reverso de CardCustom.
      const key = t.kind === "CardCustom" && !t.hidden?.revealed ? t.img2 : t.img, im = sinImage(key);
      const n = tokens.length, size = n === 1 ? 56 : Math.min(40, 64 / Math.sqrt(n));
      const angle = i * Math.PI * 2 / n, offset = n === 1 ? 0 : 19;
      const tx = h.x + Math.cos(angle) * offset, ty = h.y + Math.sin(angle) * offset;
      if (im) {
        const k = size / Math.max(im.naturalWidth, im.naturalHeight), w = im.naturalWidth * k, ht = im.naturalHeight * k;
        ctx.drawImage(im, tx - w / 2, ty - ht / 2, w, ht);
      } else { ctx.beginPath(); ctx.arc(tx, ty, size / 3, 0, Math.PI * 2); ctx.fillStyle = "#eaf4e229"; ctx.fill(); }
    });
    const shrine = tokens.find(t => (t.n === "Origin Shrine" && run?.originGod) || run?.shrineLegends[t.n]);
    if (shrine) {
      const species = shrine.n === "Origin Shrine" && run.originGod ? SIN_GODS[run.originGod].species : run.shrineLegends[shrine.n], im = sinImage(sinLegendCard(species)?.img);
      ctx.save(); ctx.fillStyle = "#ffe35d"; ctx.fillRect(h.x + 12, h.y - 44, 30, 51);
      if (im) ctx.drawImage(im, h.x + 14, h.y - 42, 26, 47);
      else { ctx.fillStyle = "#18232b"; ctx.font = "bold 13px sans-serif"; ctx.fillText(esSp(species)[0], h.x + 20, h.y - 15); }
      ctx.restore();
    }
    if (h.tokens.some(t => run?.grunts.includes(t.n))) {
      const im = sinImage(SIN_GRUNT_IMAGE), tx = h.x + 34, ty = h.y - 30;
      if (im) ctx.drawImage(im, tx - 18, ty - 18, 36, 36);
      else {
        ctx.save(); ctx.beginPath(); ctx.arc(tx, ty, 15, 0, Math.PI * 2);
        ctx.fillStyle = "#334c60"; ctx.fill(); ctx.strokeStyle = "#ffe35d"; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "#ffe35d"; ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("G", tx, ty); ctx.restore();
      }
    }
  });
  sinDrawUltra(ctx, run, z);
  // La ficha se dibuja al final para quedar siempre por encima de todos los tokens.
  const h = run && SIN_BY_CELL.get(run.pos.join(","));
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
  ST.sin.cam = {...SIN_VIEW.cam}; sinSave();
}
function sinCenter() {
  const v = SIN_VIEW; if (!v) return;
  const run = ST.sin.run, h = run && SIN_BY_CELL.get(run.pos.join(","));
  v.cam = h ? {x: h.x, y: h.y, z: .9} :
    {x: (SIN_BOUNDS.x + SIN_BOUNDS.right) / 2, y: (SIN_BOUNDS.y + SIN_BOUNDS.bottom) / 2,
      z: Math.min(v.w / (SIN_BOUNDS.right - SIN_BOUNDS.x + 40), v.h / (SIN_BOUNDS.bottom - SIN_BOUNDS.y + 40))};
  v.camMoved = false; ST.sin.cam = null; sinSave(); sinClamp(v); sinRequestDraw();
}
function sinResize() {
  const v = SIN_VIEW; if (!v || !v.canvas.isConnected) return;
  const r = {width: v.canvas.offsetWidth, height: v.canvas.offsetHeight}; if (!r.width || !r.height) return;
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
  if (sinTilt()) {
    const h = sinPick3D(px, py); if (!h) return;
    if (ST.sin.run?.fateTeleport) return sinTeleportTo(h.c + "," + h.r);
    return sinShowCell(h);
  }
  const v = SIN_VIEW, x = v.cam.x + (px - v.w / 2) / v.cam.z, y = v.cam.y + (py - v.h / 2) / v.cam.z;
  // Se busca en orden inverso al dibujo para tocar la cara que queda encima.
  const h = [...SIN_CELLS].reverse().find(h => {
    const dx = Math.abs(x - h.x), dy = Math.abs(y - h.y);
    return dx <= SIN_S && dy <= SIN_H && Math.sqrt(3) * dx + dy <= Math.sqrt(3) * SIN_S;
  });
  if (!h) return;
  if (ST.sin.run?.fateTeleport) return sinTeleportTo(h.c + "," + h.r);
  sinShowCell(h);
}
function sinShowCell(h) {
  const v = SIN_VIEW, cost = v.reachable.get(h.c + "," + h.r); v.selected = h; v.bag = false; v.box = false; v.boxMember = null; v.panel = null;
  const run = ST.sin.run, here = run.pos.join(",") === h.c + "," + h.r;
  if (run.fateTeleport) {
    $("sin-card").innerHTML = '<p>Palkia: toca directamente una casilla resaltada del mapa o cancela el teletransporte.</p><button class="btn" data-act="sinfatecancel">Cancelar</button>';
    $("sin-card").hidden = false; return sinRequestDraw();
  }
  const tokens = sinCellTokens(h);
  const canSearch = !run.searched && !run.fought && !run.revive && run.team.some(sinAlive);
  $("sin-card").innerHTML = `<div class="sin-card-head"><h2>Casilla (${esc(h.c)}, ${esc(h.r)})</h2><button class="btn" data-act="sinclose" aria-label="Cerrar ficha">Cerrar</button></div>
    <p>Nivel de elevación: ${esc(h.l)} · ${esc(h.w ? "Agua" : "Tierra")}${h.dw ? " · Mundo Distorsión" : ""}</p>
    ${cost ? `<button class="btn primary sin-move" data-act="sinmove" data-cell="${esc(h.c + "," + h.r)}">Moverme aquí (${esc(cost)})</button>` : ""}
    ${sinUltraCellHTML(run, h, here)}
    ${tokens.length ? `<ul class="sin-tokens">${tokens.map(t => {
      if (t.hidden && !t.hidden.revealed) return `<li><b>Escondite ${sinHiddenSpecial(t) ? "especial" : "regular"}</b><small>Boca abajo · Se revela al pasar por aquí.</small></li>`;
      const meta = sinMeta(t);
      const commander = SIN_COMMANDERS.find(c => c.token === t.n);
      return `<li><b>${esc(sinName(t))}</b>${meta ? `<small>${esc(meta)}</small>` : ""}${t.hidden ? "<small>Escondite revelado</small>" : ""}
        ${sinSwarmGate(t) ? `<small>Puerta de Distorsión · Débil → Moderado → Fuerte · 7 PV al superar los tres. Captura permitida, sin Bonguri ni huida del rival.</small>${here ? `<button class="btn primary sin-move" data-act="sinswarm" data-token="${SIN.tokens.indexOf(t)}" ${canSearch ? "" : "disabled"}>Batalla Enjambre</button>` : ""}` : ""}
        ${t.n === "Origin Shrine" && run.originGod ? `<small>${esc(SIN_GODS[run.originGod].species)} ocupa Origin. ${sinGodAura(run, run.originGod) ? "Aura Celestial: captura ×0,25 y segunda fase en Forma Origen." : "Tu artefacto celestial evita el Aura; un solo combate y captura normal."}</small>${here ? `<button class="btn primary sin-move" data-act="singod" ${canSearch ? "" : "disabled"}>Combatir contra ${esc(SIN_GODS[run.originGod].species)}</button>` : ""}` : ""}
        ${/ Shrine$/.test(t.n) ? run.shrineLegends[t.n] ? `<small>${esc(esSp(run.shrineLegends[t.n]))} está en el santuario. No permite ofrendas.</small>${here ? `<button class="btn primary sin-move" data-act="sinlegend" data-token="${SIN.tokens.indexOf(t)}" ${canSearch ? "" : "disabled"}>Combatir contra ${esc(esSp(run.shrineLegends[t.n]))}</button>` : ""}` :
          `${here ? `<button class="btn sin-move" data-act="sinshrine" ${run.offered || run.revive || sinShrineOccupied(run, t.n) || !Object.values(run.bag).some(n => n > 0) ? "disabled" : ""}>Ofrenda de santuario${run.offered ? " (usada este turno)" : ""}</button>` : ""}` : ""}
        ${t.tags?.includes("Legendary Encounter Card") && !run.legendsDone[toID(t.gm)] ? `<small>${esc(sinLegendRequirement(t.gm))}</small>${here ? `<button class="btn primary sin-move" data-act="sinlegend" data-token="${SIN.tokens.indexOf(t)}" ${canSearch && sinLegendAvailable(run, t.gm) ? "" : "disabled"}>Buscar a ${esc(esSp(t.gm))}</button>` : ""}` : ""}
        ${run.grunts.includes(t.n) ? "<small>Ocupado por Reclutas del Equipo Galaxia</small>" : ""}
        ${here && t.n === run.village && run.act === 1 && run.grunts.includes(t.n) ? `<button class="btn primary sin-move" data-act="singrunts" ${sinCanChallengeGrunts(run) ? "" : "disabled"}>Desafiar a los Reclutas</button>` : ""}
        ${commander && run.act === 2 && !run.fragments.includes(commander.id) ? `<small>${esc(commander.fragment)} · ${esc(commander.lake)}</small>${here ? `<button class="btn primary sin-move" data-act="sincommander" data-commander="${esc(commander.id)}" ${sinCanChallengeTrainer(run, commander.id) ? "" : "disabled"}>Desafiar ${commander.article === "la" ? "a la" : "al"} ${esc(commander.name)}</button>` : ""}` : ""}
        ${here && t.n === "Origin Shrine" && run.act === 3 && !run.heart ? `<button class="btn primary sin-move" data-act="sinheart" ${run.originGod || !Object.values(run.bag).some(n => n > 0) || run.revive ? "disabled" : ""}>Ofrenda: restaurar el Corazón de Sinnoh</button>${run.originGod ? "<small>Primero derrota o captura al Dios de Sinnoh del santuario.</small>" : ""}` : ""}
        ${here && t.n === "Temple of Sinnoh Battle" && run.act === 3 ? `<button class="btn primary sin-move" data-act="sinhelio" ${sinCanChallengeTrainer(run, "boss") ? "" : "disabled"}>Desafiar a Helio</button>${!run.heart ? "<small>Primero restaura el Corazón de Sinnoh.</small>" : ""}` : ""}
        ${here && sinSearchToken(t) ? `<button class="btn primary sin-move" data-act="sinsearch" data-token="${SIN.tokens.indexOf(t)}" ${canSearch ? "" : "disabled"}>Buscar Pokémon</button>` : ""}
        ${here && t.n === "Alpha Pokémon" && t.hidden?.revealed ? `<button class="btn primary sin-move" data-act="sinsearch" data-token="${t.hidden.token}" ${canSearch ? "" : "disabled"}>Buscar Pokémon Alfa</button>` : ""}
        ${here && ((t.n === "Campsite" && t.hidden?.revealed) || (t.tags || []).includes("Village Token")) ? `<button class="btn primary sin-move" data-act="sinheal" ${run.healed || run.revive ? "disabled" : ""}>Curar equipo</button><button class="btn sin-move" data-act="singinkgo" ${run.traded || run.revive ? "disabled" : ""}>Comerciar con Ginkgo</button>` : ""}
        ${here && SIN_VILLAGES.some(v => v.village === t.n) ? `<button class="btn sin-move" data-act="sinflyopen" ${run.flown || run.revive || sinFlightBlocked(run, t.n) || !Object.values(run.bag).some(n => n > 0) ? "disabled" : ""}>Volar (1 Bonguri)</button>` : ""}
        ${here && (t.tags || []).includes("Village Token") ? `<button class="btn sin-move" data-act="sinbox">Caja (${esc(run.box.length)})</button>` : ""}</li>`;
    }).join("")}</ul>` : '<p>No hay tokens en esta casilla.</p>'}`;
  $("sin-card").hidden = false; sinRequestDraw();
}
// Cámara 3D: el tablero se inclina con CSS (perspectiva + rotateX). Para tocar casillas se invierte esa
// proyección: se resuelve qué punto del plano del canvas cae bajo el dedo (homografía 2×2).
const SIN_TILTS = [55, 35, 0];
const sinTilt = () => SIN_TILTS.includes(ST.sin.tilt) ? ST.sin.tilt : 55;
// El tablero 3D lo dibuja sinDraw3D; aquí solo se actualiza el botón.
function sinApplyTilt() {
  const c = SIN_VIEW?.canvas; if (!c) return;
  c.style.transform = "";
  const t = sinTilt(), b = document.querySelector('[data-act="sintilt"]');
  if (b) b.textContent = t === 55 ? "Vista 3D" : t ? "3D alta" : "Vista 2D";
  document.querySelectorAll('[data-act="sinyaw"]').forEach(x => { x.hidden = !t; });
  sinRequestDraw();
}
function sinLocal(e) {
  const c = SIN_VIEW.canvas, stage = c.parentElement.getBoundingClientRect();
  const W = c.offsetWidth, H = c.offsetHeight, ox = W * .5, oy = H * .6;
  const sx = e.clientX - stage.left - c.offsetLeft - ox, sy = e.clientY - stage.top - c.offsetTop - oy;
  if (!sinTilt()) return {x: sx + ox, y: sy + oy};
  const m = new DOMMatrix(getComputedStyle(c).transform);
  const a = m.m11 - sx * m.m14, b = m.m21 - sx * m.m24, c1 = sx * m.m44 - m.m41;
  const d = m.m12 - sy * m.m14, f = m.m22 - sy * m.m24, g = sy * m.m44 - m.m42, det = a * f - b * d;
  return det ? {x: (c1 * f - b * g) / det + ox, y: (a * g - c1 * d) / det + oy} : {x: sx + ox, y: sy + oy};
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
    if (sinTilt()) sinPan3D(after.x - before.x, after.y - before.y);
    else { v.cam.x -= (after.x - before.x) / v.cam.z; v.cam.y -= (after.y - before.y) / v.cam.z; }
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
  if (ST.sin.run.trainerOffer && !ST.sin.run.battle && !ST.sin.run.progress) return sinTrainerScreen();
  if (ST.sin.run.shrineEvent) return sinShrineScreen();
  if (ST.sin.run.progress) return sinProgressScreen();
  if (ST.sin.run.lost || (ST.sin.run.ultraWon && !ST.sin.run.victorySeen)) return sinUltraEndScreen();
  if (ST.sin.run.battle) return sinPendingScreen();
  if (ST.sin.run.offer && !ST.sin.run.offer.closed) return sinOfferScreen();
  if (ST.sin.run.act === 4 && !ST.sin.run.won) return sinFinalScreen();
  if (ST.sin.run.won && ST.sin.run.victory && !ST.sin.run.victorySeen) return sinVictoryScreen();
  $("app").innerHTML = `<div class="sin-layout"><header class="sin-top"><button class="back" data-act="sinback">‹ Batalla</button><h1>Leyendas de Sinnoh</h1>
    <div class="sin-tools"><button class="btn" data-act="sinout" aria-label="Alejar mapa">−</button><button class="btn" data-act="sinin" aria-label="Acercar mapa">+</button><button class="btn" data-act="sincenter">Centrar ficha</button><button class="btn" data-act="sintilt">Vista 3D</button><button class="btn" data-act="sinyaw" data-dir="-1" aria-label="Girar a la izquierda">⟲</button><button class="btn" data-act="sinyaw" data-dir="1" aria-label="Girar a la derecha">⟳</button><button class="btn" data-act="sinabandon">Abandonar partida</button></div></header>
    <div class="sin-stage"><canvas id="sin-map" tabindex="0" aria-label="Mapa de Sinnoh. Arrastra para mover, pellizca o usa más y menos para acercar. Toca una casilla para ver su ficha."></canvas><div class="sin-hint">Arrastra para mover · Pellizca o usa + / − para acercar · Toca una casilla</div></div>
    <section class="sin-card" id="sin-card" aria-live="polite" hidden></section><footer class="sin-turn" id="sin-turn" aria-live="polite"></footer></div>`;
  const saved = ST.sin.cam, cam = saved && [saved.x, saved.y, saved.z].every(Number.isFinite) && saved.z > 0 ? {...saved} : null;
  const v = SIN_VIEW = {canvas: $("sin-map"), cam, camMoved: !!cam, reachable: new Map(), w: 0, h: 0, frame: 0, points: new Map(), events: new AbortController()};
  const opt = {signal: v.events.signal}; sinApplyTilt();
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
  if (VIEW === "battle" && B?.sin && e.target.closest("button") &&
      (B.sinThrowing || B.sinFateBusy || ST.sin.run?.battle?.failedBall || ST.sin.run?.battle?.ballAttempt)) {
    const action = e.target.closest("button").dataset.act;
    if (action !== "quit" && !(!B.sinThrowing && !B.sinFateBusy && ["sindialgaretry", "sindialgapass"].includes(action))) {
      e.stopImmediatePropagation(); return;
    }
  }
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const act = b.dataset.act;
  if (act === "sinstampseen" && ST.sin.run && (VIEW === "sin" || B?.sin)) {
    ST.sin.run.stampNotices = []; sinSave();
    if (ST.sin.run.shrineEvent) return sinShrineScreen();
    if (ST.sin.run.progress) return sinRefreshProgress();
    return sinUpdateTurn();
  }
  if (act === "quit" && VIEW === "battle" && B?.sin && !B.over && ST.sin.run?.battle?.wild?.alpha) {
    // Se intercepta antes del listener de batalla.js para descartar el Alfa al huir.
    e.stopImmediatePropagation();
    if (!confirm("¿Huir del Pokémon Alfa? Su ficha se descartará y terminará tu turno.")) return;
    B.sinEscaped = true; sinResult(null, B); B.dead = true; B = null; return go("sin");
  }
  if (act === "sinthrow" && VIEW === "battle" && B && B.sin) return sinThrowBall(B, b.dataset.ball);
  if (act === "singiratina" && VIEW === "battle" && B?.sin) return sinGiratina(B, +b.dataset.count);
  if (act === "sinhyper" && VIEW === "battle" && B?.sin) return sinHyper(B);
  if (act === "sindialgaretry" && VIEW === "battle" && B?.sin) return sinRepeatCapture(B);
  if (act === "sindialgapass" && VIEW === "battle" && B?.sin && ST.sin.run?.battle?.failedBall) return sinPassCapture(B);
  if (act === "sinretrybattle" && (VIEW === "sin" || B?.sin)) return sinRepeatBattle();
  if (act === "sinacceptdefeat" && (VIEW === "sin" || B?.sin)) return sinAcceptDefeat();
  if (act === "sinorigin" && B?.sinOriginPending) { VIEW = "sin"; return sinFight(); }
  if (act === "sinlearn" && (VIEW === "sin" || (VIEW === "battle" && B && B.sin))) return sinLearn(+b.dataset.sinSlot);
  if (act === "sinsignature" && (VIEW === "sin" || (VIEW === "battle" && B && B.sin))) return sinTeachSignature(+b.dataset.member);
  if ((act === "sinevolve" || act === "sincancelevolution") && (VIEW === "sin" || (VIEW === "battle" && B && B.sin))) return sinEvolve(act === "sinevolve");
  if (act === "sinmap") {
    const run = ST.sin.run; if (!run || run.retry || !run.progress || run.progress.pending.length || (run.progress.signature && !run.progress.signature.done) || (run.progress.cardTeach && !run.progress.cardTeach.done)) return;
    delete run.progress; sinSave(); if (B) B.dead = true; B = null; return go("sin");
  }
  if (act === "sinhero" && (VIEW === "sin" || (VIEW === "battle" && B?.sin))) return sinHero();
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
  if (act === "sinmode") { SIN_NEW.mode = b.dataset.mode === "cards" ? "cards" : "pokemon"; return sinNewScreen(); }
  if (act === "sinbeginultra") return sinBegin(b.dataset.diff);
  if (act === "sintrainer") return sinChooseTrainer(+b.dataset.trainer);
  if (act === "sinresearch") { const run = ST.sin.run, t = run?.offer?.token; if (!run || run.researched || !sinFx(run, "research") || !Number.isInteger(t)) return; run.researched = true; run.searched = false; run.offer = null; return sinSearch(t); }
  if (act === "sinexplore" && ST.sin.run?.won) { ST.sin.run.victorySeen = true; sinSave(); return renderSin(); }
  if (act === "sinabandon") {
    if (!confirm("¿Abandonar esta partida de Leyendas de Sinnoh? Se perderá su progreso.")) return;
    sinLeave(); ST.sin.run = null; ST.sin.cam = null; SIN_NEW = {village: null, species: null, busy: false}; sinSave(); return renderSin();
  }
  if (act === "sinfight") return sinFight(+b.dataset.offer);
  if (act === "singrunts") return sinFight(null, true);
  if (act === "sincommander") return sinFight(null, b.dataset.commander);
  if (act === "sinhelio") return sinFight(null, "boss");
  if (act === "sinresume") return sinFight();
  if (act === "sinfollower") return sinChooseFollower(b.dataset.god);
  if (act === "sinshrinechoose") return sinChooseShrine(+b.dataset.card);
  if (act === "sinshrinenext") return sinNextShrine();
  if (act === "sinshrinecolor") return sinShrineChoice("color", b.dataset.color);
  if (act === "sinshrinediscard") return sinShrineChoice("discard", +b.dataset.discard);
  if (act === "sinshrinemember") return sinShrineChoice("member", +b.dataset.member);
  if (act === "sinshrineskip") {
    const run = ST.sin.run, e = run?.shrineEvent;
    if (!e?.queue || e.done || run.progress || !["exchange", "wisdom"].includes(SIN_SHRINE_EFFECTS[SIN_SHRINE_CARDS[e.queue[e.cursor]].img].kind)) return;
    e.done = true; e.message = "Decidiste no usar este efecto."; sinSave(); return sinShrineScreen();
  }
  if (act === "sinshrineprogress") {
    const run = ST.sin.run;
    if (!run?.shrineEvent || !run.progress || run.progress.pending.length) return;
    delete run.progress; run.shrineEvent.done = true; sinSave(); return sinShrineScreen();
  }
  if (act === "sinstew" && ST.sin.run?.shrineEvent) return sinCraft(b.dataset.stew, "stew");
  if (act === "sininfuse" && ST.sin.run?.shrineEvent) return sinCraft("infused", "stew", +b.dataset.member);
  if (act === "sinskip" && ST.sin.run && ST.sin.run.offer && !ST.sin.run.offer.alpha && !ST.sin.run.battle) {
    ST.sin.run.offer.closed = true; ST.sin.run.notice = "Decidiste no combatir. Ya usaste la búsqueda de este turno."; sinSave(); return renderSin();
  }
  if (!SIN_VIEW || !ST.sin.run) return;
  if (act === "sinfatecancel" && ST.sin.run.fateTeleport) { delete ST.sin.run.fateTeleport; ST.sin.run.notice = "Teletransporte cancelado; conservas tus cartas."; sinSave(); return sinUpdateTurn(); }
  if (ST.sin.run.fateTeleport && !["sinbag", "sinclose", "sincenter", "sinin", "sinout"].includes(act)) return;
  if (act === "sinbag") return sinShowBag();
  if (act === "sinstamps") return sinShowStamps();
  if (act === "sinyaw") { ST.sin.yaw = ((ST.sin.yaw || 0) + 30 * +b.dataset.dir + 360) % 360; save(); return sinRequestDraw(); }
  if (act === "sintilt") { const i = SIN_TILTS.indexOf(sinTilt()); ST.sin.tilt = SIN_TILTS[(i + 1) % SIN_TILTS.length]; save(); return sinApplyTilt(); }
  if (act === "sinevoitem") return sinEvoByItem(+b.dataset.member, +b.dataset.evo);
  if (act === "sinub") return sinSeekUltra("ub");
  if (act === "sinnecro") return sinSeekUltra("necro");
  if (act === "singate") return sinUltraGate();
  if (act === "sinbless" && sinUltra(ST.sin.run) && ST.sin.run.blessings > 0 && !ST.sin.run.blessSkip) { ST.sin.run.blessings--; ST.sin.run.blessSkip = true; ST.sin.run.notice = "Bendición de Arceus: los Ultraentes no se moverán al terminar este turno."; sinSave(); return sinUpdateTurn(); }
  if (act === "sintrainerpanel") return sinTrainerPanel();
  if (act === "sinpick") return sinPickBonguri();
  if (act === "sinswap") return sinSwapBonguri(b.dataset.from, b.dataset.to);
  if (act === "sinswarm") return sinSeekSwarm(+b.dataset.token);
  if (act === "sintmselect") { SIN_VIEW.bagTM = +b.dataset.tm; return sinShowBag(); }
  if (act === "sintmteach") return sinTeachTM(+b.dataset.tm, +b.dataset.member);
  if (act === "sinnoble") return sinUseNoble(+b.dataset.member);
  if (act === "sinfate") return sinPlayMapFate(b.dataset.god, +b.dataset.count);
  if (act === "singod") return sinSeekGod();
  if (act === "sinshrine") return sinShowShrine();
  if (act === "sinshrinedraw") return sinOfferShrine(b.dataset.color, b.dataset.major === "1");
  if (act === "sinlegend") return sinSeekLegend(+b.dataset.token);
  if (act === "sincampaign") return sinShowCampaign();
  if (act === "sinheart") return sinShowOffering();
  if (act === "sinofferheart") return sinOfferHeart(b.dataset.color);
  if (act === "sinitemselect") { SIN_VIEW.bagItem = +b.dataset.item; return sinShowBag(); }
  if (act === "sinequip") return sinEquip(+b.dataset.item, +b.dataset.member);
  if (act === "sinunequip") return sinEquip(null, +b.dataset.member, true);
  if (act === "sinbox") { SIN_VIEW.boxMember = null; return sinShowBox(); }
  if (act === "sinboxselect") {
    const index = +b.dataset.member;
    if (!sinAtVillage(ST.sin.run) || !ST.sin.run.team[index]) return;
    SIN_VIEW.boxMember = index; return sinShowBox();
  }
  if (["sindeposit", "sinwithdraw", "sinexchange"].includes(act)) return sinBoxAction(act, +b.dataset.member, +b.dataset.box);
  if (act === "sincraft") return sinCraft(b.dataset.ball);
  if (act === "sinstew") return sinCraft(b.dataset.stew, "stew");
  if (act === "sininfuse") return sinCraft("infused", "stew", +b.dataset.member);
  if (act === "sincraftitem") return sinCraft(b.dataset.item, "item");
  if (act === "singinkgo") return sinShowGinkgo();
  if (act === "sintrade") return sinTrade(+b.dataset.trade, +b.dataset.card);
  if (act === "sinflyopen") { SIN_VIEW.flyTo = null; return sinShowFlight(); }
  if (act === "sinflyselect") { SIN_VIEW.flyTo = b.dataset.village; return sinShowFlight(); }
  if (act === "sinfly") return sinFly(b.dataset.village, b.dataset.color);
  if (act === "sinmove") return sinMoveTo(b.dataset.cell);
  if (act === "sinsearch") return sinSearch(+b.dataset.token);
  if (act === "sinheal") return sinHeal();
  if (act === "sinendturn") return sinEndTurn();
  if (act === "sincenter") return sinCenter();
  if (act === "sinclose") { $("sin-card").hidden = true; SIN_VIEW.selected = null; SIN_VIEW.bag = false; SIN_VIEW.box = false; SIN_VIEW.boxMember = null; SIN_VIEW.panel = null; return sinRequestDraw(); }
  if (act === "sinin" || act === "sinout") { sinZoom(act === "sinin" ? 1.4 : 1 / 1.4, SIN_VIEW.w / 2, SIN_VIEW.h / 2); sinSaveCam(true); }
}, true);
