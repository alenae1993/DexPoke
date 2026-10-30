"use strict";
/* ---------- Leyendas de Sinnoh · Modo Cartas ----------
   Réplica del combate del juego de mesa (reglamento p. 4–11): cada Pokémon es su carta (vida, iniciativa, tipos,
   tipos aprendibles y movimiento característico). Se ataca tirando tantos dados como la fuerza del movimiento:
   cada dado es 1 símbolo de estado (0 de daño), 4 golpes normales (1) o 1 golpe crítico (2). La efectividad suma
   +2 / −2 / −4. Los estados, la fatiga, la iniciativa y la captura con dados siguen el reglamento. Los efectos de
   los movimientos se interpretan desde el texto de la carta (CARD_RULES); los que no se reconocen no hacen nada extra.
   Se usa solo en partidas creadas en "Modo Cartas" (run.mode === "cards"); el resto del juego (mapa, recompensas,
   campañas) es el mismo de sinnoh.js, que recibe el resultado en sinResult como si fuera un combate del motor. */

const CARD_DIE = ["status", "hit", "hit", "hit", "hit", "crit"];
const CARD_STATUS = {conf: {name: "Confuso", immune: "Psychic"}, par: {name: "Paralizado", immune: "Electric"},
  psn: {name: "Envenenado", immune: "Poison"}, brn: {name: "Quemado", immune: "Fire"},
  frz: {name: "Congelado", immune: "Ice"}, drw: {name: "Somnoliento", immune: "Dark"}};
const CARD_STATUS_WORDS = {confuso: "conf", paralizado: "par", envenenado: "psn", quemado: "brn", congelado: "frz", somnoliento: "drw"};
SIN_STATUS.conf = "CNF"; SIN_STATUS.drw = "SOM";
const CARD_BALL_DICE = {poke: 3, great: 4, ultra: 5, spirit: 6};
const CARD_CATCH = {W: 3, M: 4, S: 5, L: 6};
const CARD_FATIGUE = 5;
const cardNorm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Datos de juego de una carta Pokémon del mod.
function cardStats(card, extra = {}) {
  const d = card.d;
  return {cid: card.cid, img: card.img, name: card.n, species: d.sp, hp: d.health + (extra.alpha ? 4 : 0), init: d.initiative,
    types: d.types, learn: d.moves, cost: d.evolve_cost || 0, evo: d.evo || [], tier: card.tier,
    sig: {name: d.move_name, type: d.move_type, str: +d.move_attack_strength || 0, effect: d.move_effect || ""}};
}
const cardByImg = img => SIN_CARDS.find(c => c.img === img && c.d);
const cardBySpecies = sp => SIN_CARDS.find(c => c.d?.sp && toID(c.d.sp) === toID(sp) && c.tier !== "Grunt") || SIN_CARDS.find(c => c.d?.sp && toID(c.d.sp) === toID(sp));
// Convierte un set del juego en uno del modo cartas (conserva especie, sexo, objeto y PS si ya era carta).
function cardSet(set, card, extra = {}) {
  const c = cardStats(card, extra);
  return {...set, card: c, cmoves: set.cmoves || [], hpMax: c.hp, ...(set.card ? {} : {hpNow: undefined, status: ""}), level: set.level || 1};
}
const cardTypeName = t => t === "Typeless" ? "Sin tipo" : (TY[toID(t).toUpperCase()] || [t])[0];
const cardMoves = s => [s.card.sig, ...(s.cmoves || [])];
const cardHp = s => s.hpNow == null ? s.card.hp : s.hpNow;

/* ---------- Efectos de los movimientos ---------- */
// Cada regla recibe la frase normalizada; devuelve un objeto con lo que aplica en el ataque o en el futuro.
const CARD_RULES = [
  [/golpes criticos infligen \+(\d)/, m => ({critBonus: +m[1]})],
  [/simbolos de estado infligen ([+-]\d)/, m => ({statusBonus: +m[1]})],
  [/golpes normales infligen \+(\d)/, m => ({hitBonus: +m[1]})],
  [/por cada golpe critico obtenido: el usuario recibe (\d)/, m => ({recoilCrit: +m[1]})],
  [/por cada golpe critico obtenido: el usuario se cura (\d)/, m => ({healCrit: +m[1]})],
  [/por cada simbolo de estado obtenido: el usuario recibe (\d)/, m => ({recoilStatus: +m[1]})],
  [/si se obtienen (\d) o mas simbolos de estado: inflige el estado (\w+) al (objetivo|usuario)/, m => ({statusIf: [+m[1], CARD_STATUS_WORDS[m[2]], m[3]]})],
  [/si se obtienen (\d) o mas simbolos de estado: inflige (\d) de dano a un pokemon en el equipo/, m => ({benchIf: [+m[1], +m[2]]})],
  [/^inflige el estado (?:de )?(\w+) (?:en el|en|al|a el) (objetivo|usuario)/, m => ({statusAlways: [CARD_STATUS_WORDS[m[1]], m[2]]})],
  [/^inflige los estados (\w+) y (\w+) al objetivo/, m => ({statusBoth: [CARD_STATUS_WORDS[m[1]], CARD_STATUS_WORDS[m[2]]]})],
  [/se cura la mitad del dano (?:hecho|infligido)|^cura la mitad del dano infligido/, () => ({drain: true})],
  [/hasta que el usuario cambie: el usuario ahora se cura (\d) de dano al final de sus turnos/, m => ({regen: +m[1]})],
  [/aumenta la fatiga de batalla del usuario y del objetivo a (\d)/, m => ({fatigueBoth: +m[1]})],
  [/la fuerza de ataque es igual a la vida actual del usuario\. maximo (\d)/, m => ({curHpStr: +m[1]})],
  [/la fuerza de ataque es igual a la mitad de la vida base del objetivo, redondeado para abajo\. maximo (\d)/, m => ({foeHalfStr: +m[1]})],
  [/la fuerza de ataque se incrementa igual a la cantidad de dano recibido en el ultimo turno/, () => ({revenge: true})],
  [/si este movimiento se uso el turno anterior, la fuerza de ataque se reduce a (\d)/, m => ({repeatStr: +m[1]})],
  [/si este ya estaba (\w+), la fuerza de ataque se incrementa a (\d)/, m => ({ifStatusStr: [CARD_STATUS_WORDS[m[1]], +m[2]]})],
  [/por cada pokemon derrotado en el equipo: la fuerza de ataque incrementa en 1/, () => ({faintedStr: true})],
  [/elige cualquier tipo que pueda aprender el usuario como tipo de este ataque/, () => ({anyType: true})],
  [/tira un dado de estado e inflige el resultado al objetivo/, () => ({statusRandom: true})],
  [/cuando el objetivo sea atacado nuevamente, anade (\d) golpe (normal|critico)/, m => ({markTarget: {defAdd: {[m[2] === "normal" ? "hit" : "crit"]: +m[1]}}})],
  [/cuando el objetivo ataque nuevamente, elimina (\d) golpes? normal/, m => ({markTarget: {atkRemoveHit: +m[1]}})],
  [/cuando el objetivo vuelva a atacar, elimina (\d) golpes? normal/, m => ({markTarget: {atkRemoveHit: +m[1]}})],
  [/cuando el objetivo ataque nuevamente, los simbolos de estado infligen ([+-]\d)/, m => ({markTarget: {atkStatus: +m[1]}})],
  [/durante este ataque y cuando el usuario sea atacado nuevamente, los simbolos de estado infligen ([+-]\d)/, m => ({statusBonus: +m[1], markUser: {defStatus: +m[1]}})],
  [/cuando el usuario sea atacado nuevamente, elimina (\d) golpes? (critico|regular|normal)/, m => ({markUser: {defRemove: {[m[2] === "critico" ? "crit" : "hit"]: +m[1]}}})],
  [/cuando el usuario ataque nuevamente, anade (\d) simbolos? de estado/, m => ({markUser: {atkAdd: {status: +m[1]}}})],
  [/hasta que el usuario cambie: anade 1 golpe critico y 1 simbolo de estado/, () => ({markUser: {persistAdd: {crit: 1, status: 1}}})],
  [/si el objetivo tiene 1 o mas efectos de estado, este movimiento inflige el doble/, () => ({doubleIfStatus: true})],
  [/si este movimiento fue utilizado el turno anterior, la fuerza de ataque es reducida a (\d)/, m => ({repeatStr: +m[1]})],
  [/inflige (\d) de dano extra a los pokemon tipo (\w+)/, m => ({extraVsType: [+m[1], m[2]]})],
  [/el objetivo se debilita si le queda (\d) o menos/, m => ({execute: +m[1]})],
  [/aumenta la fatiga de batalla del objetivo en (\d)/, m => ({fatigueTarget: +m[1]})],
  [/la fuerza de ataque es igual a la mitad de la vida base del usuario/, () => ({halfHpStr: true})],
  [/por cada pokemon no derrotado en tu equipo con el movimiento (.+?): la fuerza de ataque aumenta en 1/, m => ({teamMoveStr: m[1]})],
  [/si el usuario conoce otro movimiento tipo (\w+), inflige (\d) de dano extra/, m => ({knowsType: [m[1], +m[2]]})],
  [/si este ya estaba paralizado, la fuerza de ataque se incrementa a (\d)/, m => ({parStr: +m[1]})],
  [/utiliza un segundo movimiento en este turno/, () => ({extraAction: true})],
  [/baraja el mazo de evolucion pokemon y luego ataca al objetivo con el movimiento superior del mazo/, () => ({metronome: true})]
];
const CARD_TYPE_ES = {acero: "Steel", agua: "Water", bicho: "Bug", dragon: "Dragon", electrico: "Electric", fantasma: "Ghost", fuego: "Fire", hada: "Fairy",
  hielo: "Ice", lucha: "Fighting", normal: "Normal", planta: "Grass", psiquico: "Psychic", roca: "Rock", siniestro: "Dark", tierra: "Ground", veneno: "Poison", volador: "Flying"};
const cardEffectCache = new Map();
function cardEffect(text) {
  if (cardEffectCache.has(text)) return cardEffectCache.get(text);
  const fx = {known: false};
  cardNorm(text).split(/(?<=\.)\s+/).forEach(sentence => {
    CARD_RULES.forEach(([re, f]) => {
      const m = re.exec(sentence); if (!m) return;
      const r = f(m); fx.known = true;
      for (const [k, v] of Object.entries(r)) fx[k] = v && typeof v === "object" && !Array.isArray(v) && fx[k] ? {...fx[k], ...v} : v;
    });
  });
  if (fx.extraVsType) fx.extraVsType[1] = CARD_TYPE_ES[fx.extraVsType[1].replace(/s$/, "")] || fx.extraVsType[1];
  if (fx.knowsType) fx.knowsType[0] = CARD_TYPE_ES[fx.knowsType[0]] || fx.knowsType[0];
  cardEffectCache.set(text, fx); return fx;
}

/* ---------- Combate ---------- */
let CB = null; // combate en curso
const cardTypeBonus = (moveType, types) => {
  if (!moveType || moveType === "Typeless" || moveType === "???") return 0;
  return types.reduce((sum, t) => sum + (!Dex.getImmunity(moveType, t) ? -4 : Dex.getEffectiveness(moveType, t) * 2), 0);
};
function cardFighter(set, index, side) {
  return {set, index, side, hp: cardHp(set), max: set.card.hp, status: set.status || "", fatigue: 0, last: null, lastTurn: -2, marks: {}, persist: null, usedExtra: false};
}
function cardStart(run) {
  const b = run.battle, cards = [];
  // Las formas sin carta propia (Forma Origen, fases de Necrozma) usan la carta de su especie base, con más vida por fase.
  const cardFor = (set, img) => (img && cardByImg(img)) || cardBySpecies(set.species) || cardBySpecies(Dex.species.get(set.species).baseSpecies);
  const phase = (b.legend?.necro || b.legend?.phase || 1) - 1;
  const foeSets = b.trainer ? b.foes.map((s, i) => cardSet(s, cardFor(s, b.cards?.[i])))
    : b.swarm ? b.foes.map((s, i) => cardSet(s, cardFor(s, b.swarmCards[i].img)))
    : [cardSet(b.wild, cardFor(b.wild, b.card), {alpha: b.wild.alpha})];
  if (phase > 0) foeSets.forEach(s => { s.card.hp += 4 * phase; s.hpMax = s.card.hp; });
  foeSets.forEach((s, i) => { if (b.wild?.hpNowCard != null && !b.trainer && !b.swarm) s.hpNow = b.wild.hpNowCard; cards.push(s); });
  const mine = b.indices.map(i => cardFighter(run.team[i], i, "p1"));
  const foes = cards.map((s, i) => cardFighter(s, i, "p2")).filter((f, i) => !b.swarm || (!b.captures?.[i] && !b.defeated?.includes(i)));
  CB = {run, mine, foes, me: mine.find(f => f.hp > 0), foe: foes[0], turn: 1, log: [], token: "p1", over: false, busy: false,
    foeName: b.trainer?.name || (b.trainer ? "Reclutas del Equipo Galaxia" : b.swarm ? "Enjambre" : null), wildFaints: 0, ballFails: 0, phase: "choose"};
  VIEW = "sincards"; if (typeof bgm === "function") bgm(b.legend?.god ? "bgm_final" : b.legend || b.swarm ? "bgm_boss" : b.trainer ? "bgm_trainer" : "bgm_wild");
  cardLog(CB.foeName ? `¡${CB.foeName} te desafía!` : `¡Apareció ${esSp(CB.foe.set.species)} salvaje!`);
  cardNextRound();
}
const cardLog = text => { CB.log.unshift(text); };
// Orden de la ronda: mayor iniciativa primero; el empate lo gana quien tiene la ficha de Ventaja (y la cede).
function cardInit(f) { return f.set.card.init - (f.status === "par" ? 3 : 0); }
function cardNextRound() {
  if (CB.over) return;
  const a = cardInit(CB.me), b = cardInit(CB.foe);
  let first = a > b ? "p1" : b > a ? "p2" : CB.token;
  if (a === b) CB.token = CB.token === "p1" ? "p2" : "p1";
  CB.order = first === "p1" ? ["p1", "p2"] : ["p2", "p1"];
  CB.step = 0; cardContinue();
}
function cardContinue() {
  if (CB.over) return cardRender();
  if (CB.step >= 2) { CB.turn++; return cardNextRound(); }
  const side = CB.order[CB.step];
  if (side === "p1") { CB.phase = "choose"; return cardRender(); }
  CB.phase = "foe"; cardRender();
  setTimeout(() => { if (CB && !CB.over) cardAct(() => cardAttack(CB.foe, CB.me, cardAiMove(CB.foe, CB.me)), () => { CB.step++; cardAfterAction(); }); }, 900);
}
// Ejecuta una acción con tiradas, muestra los dados y espera a que el jugador pulse "Continuar".
function cardAct(action, after) {
  CB.rolls = []; const next = action() || after;
  if (!CB.rolls.length) return next();
  CB.phase = "result"; CB.after = next; cardRender(); cardAnimateDice();
}
const CARD_FACE = {hit: ["1", "Golpe"], crit: ["2", "Crítico"], status: ["◎", "Estado"]};
function cardDiceHTML() {
  return CB.rolls.map(r => `<div class="cb-roll"><p><b>${esc(r.who)}</b> · ${esc(r.what)}</p>
    <div class="cb-dice">${r.dice.map(d => `<span class="cb-die" data-face="${d}" title="${CARD_FACE[d][1]}">${CARD_FACE[d][0]}</span>`).join("") || "<small>Sin dados (fuerza 0).</small>"}</div>
    <p class="cb-res" hidden>${esc(r.text)}</p></div>`).join("");
}
function cardAnimateDice() {
  const dice = [...document.querySelectorAll(".cb-die")], btn = document.querySelector('[data-act="cbnext"]');
  const faces = Object.keys(CARD_FACE); let t = 0;
  dice.forEach(d => d.classList.add("rolling"));
  const timer = setInterval(() => {
    t++;
    dice.forEach((d, i) => {
      if (t < 8 + i * 2) { const f = faces[Math.floor(Math.random() * 3)]; d.dataset.show = f; d.textContent = CARD_FACE[f][0]; }
      else if (d.classList.contains("rolling")) { d.classList.remove("rolling"); delete d.dataset.show; d.textContent = CARD_FACE[d.dataset.face][0]; }
    });
    if (t >= 8 + dice.length * 2) {
      clearInterval(timer); document.querySelectorAll(".cb-res").forEach(r => { r.hidden = false; });
      if (btn) btn.disabled = false;
    }
  }, 90);
  if (typeof sinAnilSound === "function") sinAnilSound("shake", .4);
}
function cardAiMove(att, def) {
  const exp = mv => { const fx = cardEffect(mv.effect); const str = cardStrength(att, def, mv, fx);
    return str * (4 / 6 + (2 + (fx.critBonus || 0)) / 6 + (fx.statusBonus || 0) / 6) + cardTypeBonus(mv.type, def.set.card.types); };
  return cardMoves(att.set).reduce((best, mv) => exp(mv) > exp(best) ? mv : best);
}
function cardStrength(att, def, mv, fx) {
  let str = mv.str;
  if (fx.halfHpStr) str = Math.min(5, Math.floor(att.set.card.hp / 2));
  if (fx.repeatStr && att.last === mv.name && att.lastTurn === CB.turn - 1) str = fx.repeatStr;
  if (fx.parStr && def.status === "par") str = fx.parStr;
  if (fx.ifStatusStr && def.status === fx.ifStatusStr[0]) str = fx.ifStatusStr[1];
  if (fx.curHpStr) str = Math.min(fx.curHpStr, att.hp);
  if (fx.foeHalfStr) str = Math.min(fx.foeHalfStr, Math.floor(def.set.card.hp / 2));
  if (fx.revenge) str += att.lastHit || 0;
  if (fx.faintedStr) str += (att.side === "p1" ? CB.mine : CB.foes).filter(f => f.hp <= 0).length;
  if (fx.teamMoveStr) str += (att.side === "p1" ? CB.mine : CB.foes).filter(f => f.hp > 0 && cardMoves(f.set).some(m => cardNorm(m.name) === fx.teamMoveStr.replace(/\.$/, ""))).length;
  if (def.status === "frz") str += 2;
  const item = toID(att.set.item || ""), art = Object.values(SIN_ARTIFACTS).find(a => a.id === item);
  if (art?.types?.includes(mv.type)) str += 1;
  if (item === "heartofsinnoh" && att.set.card.types.includes(mv.type)) str += 1;
  return Math.max(0, str);
}
function cardRoll(n) { return Array.from({length: n}, () => CARD_DIE[Math.floor(Math.random() * 6)]); }
function cardSetStatus(target, st, source) {
  if (!st || target.hp <= 0 || target.status || target.set.card.types.includes(CARD_STATUS[st].immune)) return false;
  target.status = st; cardLog(`¡${esSp(target.set.species)} ahora está ${CARD_STATUS[st].name}!`); return true;
}
function cardDamage(f, n, why) {
  if (n <= 0 || f.hp <= 0) return;
  f.hp = Math.max(0, f.hp - n); cardLog(`${esSp(f.set.species)} recibe ${n} de daño${why ? " " + why : ""}.`);
}
function cardAttack(att, def, mv) {
  if (att.hp <= 0 || def.hp <= 0) return;
  const fx = cardEffect(mv.effect), name = esSp(att.set.species);
  if (fx.metronome) {
    const deck = SIN.decks.find(d => d.cards.length > 150 && d.cards.every(c => c.d && !c.tier))?.cards || [];
    const pick = deck[Math.floor(Math.random() * deck.length)];
    if (pick) { cardLog(`${esSp(att.set.species)} usa Metrónomo…`); return cardAttack(att, def, cardStats(pick).sig); }
  }
  if (fx.anyType) mv = {...mv, type: att.set.card.learn.reduce((a, t) => cardTypeBonus(t, def.set.card.types) > cardTypeBonus(a, def.set.card.types) ? t : a, mv.type)};
  cardLog(`${name} usa ${mv.name}.`);
  if (att.status === "conf" && att.last === mv.name) cardDamage(att, 3, "por la confusión");
  if (att.hp <= 0) return;
  // Fatiga: desde la sexta tirada seguida, 3 de daño por tirada.
  att.fatigue++; if (att.fatigue > CARD_FATIGUE) cardDamage(att, 3, "por la fatiga de batalla");
  if (att.hp <= 0) return;
  const str = cardStrength(att, def, mv, fx), dice = cardRoll(str);
  const count = k => dice.filter(d => d === k).length;
  const adjust = (add, sign = 1) => Object.entries(add || {}).forEach(([k, v]) => {
    for (let i = 0; i < v; i++) {
      if (sign > 0) dice.push(k);
      else { const j = dice.indexOf(k); if (j >= 0) dice.splice(j, 1); }
    }
  });
  adjust(att.persist); adjust(att.marks.atkAdd); delete att.marks.atkAdd;
  if (att.marks.atkRemoveHit) { adjust({hit: att.marks.atkRemoveHit}, -1); delete att.marks.atkRemoveHit; }
  adjust(def.marks.defAdd); delete def.marks.defAdd;
  adjust(def.marks.defRemove, -1); delete def.marks.defRemove;
  if (att.status === "par" && !att.parUsed) { while (dice.includes("hit")) dice.splice(dice.indexOf("hit"), 1); att.parUsed = true; }
  if (att.status === "drw" && dice.includes("hit")) dice[dice.indexOf("hit")] = "status";
  if (def.status === "drw" && dice.includes("hit")) dice[dice.indexOf("hit")] = "crit";
  const st = count("status"), hits = count("hit"), crits = count("crit");
  const statusDmg = Math.max(0, (fx.statusBonus || 0) + (att.marks.atkStatus || 0) + (def.marks.defStatus || 0));
  delete att.marks.atkStatus; delete def.marks.defStatus;
  const eff = cardTypeBonus(mv.type, def.set.card.types);
  let dmg = hits * (1 + (fx.hitBonus || 0)) + crits * (2 + (fx.critBonus || 0)) + st * statusDmg;
  if (dice.length) dmg += cardTypeBonus(mv.type, def.set.card.types);
  if (fx.extraVsType && def.set.card.types.includes(fx.extraVsType[1])) dmg += fx.extraVsType[0];
  if (fx.knowsType && cardMoves(att.set).some(m => m !== mv && m.type === fx.knowsType[0])) dmg += fx.knowsType[1];
  if (fx.doubleIfStatus && def.status) dmg *= 2;
  if (att.status === "brn") dmg -= 2;
  dmg = Math.max(0, dmg);
  cardLog(`Dados: ${hits} golpe${hits === 1 ? "" : "s"}, ${crits} crítico${crits === 1 ? "" : "s"}, ${st} estado${st === 1 ? "" : "s"}.`);
  const roll = {who: name + (att.side === "p2" ? " (rival)" : ""), what: `${mv.name} · ${str} dado${str === 1 ? "" : "s"}`, dice: [...dice], text: ""};
  CB.rolls?.push(roll);
  if (eff > 0) cardLog("¡Es súper eficaz!"); else if (eff < 0 && eff > -4 * def.set.card.types.length) cardLog("No es muy eficaz…"); else if (eff <= -4 && dmg === 0) cardLog("No afecta…");
  const before = def.hp; cardDamage(def, dmg); def.lastHit = before - def.hp;
  roll.text = `${hits} golpe${hits === 1 ? "" : "s"}, ${crits} crítico${crits === 1 ? "" : "s"}, ${st} estado${st === 1 ? "" : "s"} → ${dmg} de daño a ${esSp(def.set.species)}${eff > 0 ? " (súper eficaz)" : eff < 0 ? " (poco eficaz)" : ""}${att.status === "brn" ? " (Quemado: −2)" : ""}${fx.doubleIfStatus && def.status ? " (doble por su estado)" : ""}. Le quedan ${def.hp}/${def.max}.`;
  if (fx.drain && before > def.hp && att.hp > 0) { att.hp = Math.min(att.max, att.hp + Math.floor((before - def.hp) / 2)); cardLog(`${name} recupera vida.`); }
  if (fx.execute && def.hp > 0 && def.hp <= fx.execute) { def.hp = 0; cardLog(`¡${esSp(def.set.species)} se debilita!`); }
  cardDamage(att, (fx.recoilCrit || 0) * crits, "de retroceso");
  cardDamage(att, (fx.recoilStatus || 0) * st, "de retroceso");
  if (fx.healCrit && crits && att.hp > 0) { att.hp = Math.min(att.max, att.hp + fx.healCrit * crits); cardLog(`${name} recupera vida.`); }
  if (fx.statusAlways) cardSetStatus(fx.statusAlways[1] === "usuario" ? att : def, fx.statusAlways[0]);
  if (fx.statusIf && st >= fx.statusIf[0]) cardSetStatus(fx.statusIf[2] === "usuario" ? att : def, fx.statusIf[1]);
  if (fx.statusBoth) { cardSetStatus(def, fx.statusBoth[0]); const keep = def.status; def.status = ""; cardSetStatus(def, fx.statusBoth[1]); if (!def.status) def.status = keep; }
  if (fx.regen) att.regen = fx.regen;
  if (fx.fatigueBoth) { att.fatigue = Math.max(att.fatigue, fx.fatigueBoth); def.fatigue = Math.max(def.fatigue, fx.fatigueBoth); }
  if (fx.statusRandom) cardSetStatus(def, Object.keys(CARD_STATUS)[Math.floor(Math.random() * 6)]);
  if (fx.benchIf && st >= fx.benchIf[0]) {
    const bench = (def.side === "p1" ? CB.mine : CB.foes).find(f => f !== def && f.hp > 0); if (bench) cardDamage(bench, fx.benchIf[1], "por el ataque");
  }
  if (fx.fatigueTarget) def.fatigue += fx.fatigueTarget;
  if (fx.markTarget) Object.assign(def.marks, fx.markTarget);
  if (fx.markUser) { const {persistAdd, ...rest} = fx.markUser; Object.assign(att.marks, rest); if (persistAdd) att.persist = persistAdd; }
  att.last = mv.name; att.lastTurn = CB.turn;
  if (fx.extraAction && !att.usedExtra && att.hp > 0 && def.hp > 0) {
    att.usedExtra = true; const other = cardMoves(att.set).find(m => m !== mv);
    if (other) cardAttack(att, def, other);
  }
}
// Fin de cada acción: veneno, debilitados, huidas y cambios.
function cardAfterAction() {
  const actor = CB.order[CB.step - 1] === "p1" ? CB.me : CB.foe;
  if (actor.status === "psn" && actor.hp > 0) cardDamage(actor, 2, "por el veneno");
  if (actor.regen && actor.hp > 0 && actor.hp < actor.max) { actor.hp = Math.min(actor.max, actor.hp + actor.regen); cardLog(`${esSp(actor.set.species)} se cura ${actor.regen}.`); }
  if (CB.foe.hp <= 0) {
    cardLog(`¡${esSp(CB.foe.set.species)} se debilitó!`);
    const next = CB.foes.find(f => f.hp > 0);
    if (!next) return cardEnd(true);
    CB.foe = next; CB.me.fatigue = 0; cardLog(CB.foeName ? `${CB.foeName} envía a ${esSp(next.set.species)}.` : `¡Aparece ${esSp(next.set.species)}!`);
    if (CB.me.hp > 0) { CB.phase = "switch"; CB.optional = true; return cardRender(); }
    CB.step = 2;
  }
  if (CB.me.hp <= 0) {
    cardLog(`¡${esSp(CB.me.set.species)} se debilitó!`);
    const b = CB.run.battle, wild = !b.trainer && !b.swarm, legend = b.legend || b.wild?.alpha;
    CB.wildFaints++;
    const fleeAfter = sinFx?.(CB.run, "flee2") ? 2 : 1;
    if (!CB.mine.some(f => f.hp > 0)) return cardEnd(false);
    if (wild && !legend && CB.wildFaints >= fleeAfter) { cardLog(`¡${esSp(CB.foe.set.species)} huyó!`); CB.fled = true; return cardEnd(null); }
    CB.phase = "switch"; CB.optional = false; return cardRender();
  }
  cardContinue();
}
function cardSwitch(index) {
  const f = CB.mine.find(x => x.index === index);
  if (!f || f.hp <= 0) return;
  if (f !== CB.me) { CB.me.fatigue = 0; CB.me.persist = null; CB.me.usedExtra = false; CB.me.regen = 0; CB.me = f; cardLog(`¡Adelante, ${esSp(f.set.species)}!`); }
  CB.phase = "choose"; CB.turn++; cardNextRound();
}
// Captura (p. 5): dados según la Ball; el total (golpe 1, crítico 2) debe alcanzar el índice de captura.
function cardThrow(key) {
  const run = CB.run, b = run.battle;
  if (CB.phase !== "choose" || b.trainer || b.legend?.ub || b.legend?.necro || !(run.balls[key] > 0)) return;
  cardAct(() => cardThrowRoll(key), null);
}
function cardThrowRoll(key) {
  const run = CB.run, b = run.battle;
  run.balls[key]--;
  const tier = b.wild?.alpha || b.legend ? "L" : b.swarm ? b.swarmCards[CB.foe.index].tier : b.tier;
  const need = CARD_CATCH[tier] || 4, dice = cardRoll(CARD_BALL_DICE[key] || 3);
  if ((CB.foe.status || b.captivating) && dice.includes("status")) dice[dice.indexOf("status")] = "hit";
  b.captivating = false;
  const total = dice.filter(d => d === "hit").length + 2 * dice.filter(d => d === "crit").length;
  const ok = key === "glory" || total >= need;
  if (typeof sinBallFx === "function") sinBallFx({dead: false}, key, "throw");
  cardLog(`Lanzaste una ${SIN_BALLS[key].name}: ${total} de ${need} necesarios.`);
  CB.rolls.push({who: "Tú", what: `${SIN_BALLS[key].name} · ${key === "glory" ? "captura segura" : dice.length + " dados"}`, dice: key === "glory" ? [] : dice,
    text: ok ? `${total} de ${need} necesarios. ¡Ya está! ¡Atrapaste a ${esSp(CB.foe.set.species)}!` : `${total} de ${need} necesarios. ¡Oh, no! ¡El Pokémon se ha escapado!`});
  if (key === "glory") CB.rolls[CB.rolls.length - 1].dice = ["crit", "crit", "crit"];
  if (ok) {
    cardLog(`¡Ya está! ¡Atrapaste a ${esSp(CB.foe.set.species)}!`);
    if (b.swarm) return () => { CB.foe.caught = true; b.captures[CB.foe.index] = cardKeep(CB.foe); CB.foe.hp = 0; CB.step = CB.order.indexOf("p1") + 1; cardAfterAction(); };
    return () => { CB.caught = true; cardEnd(true); };
  }
  CB.ballFails++; cardLog("¡Oh, no! ¡El Pokémon se ha escapado!");
  if (typeof sinCaptureFailure === "function") sinCaptureFailure(run, CB.turn);
  return () => { CB.step++; cardAfterAction(); };
}
const cardKeep = f => ({...f.set, hpNow: f.hp >= f.max ? undefined : f.hp, hpMax: f.max, status: f.status});
// Termina el combate y entrega el resultado a sinResult con el formato de un combate del motor.
function cardEnd(won) {
  if (CB.over) return; CB.over = true;
  const run = CB.run, b = run.battle, me = {mons: {}, act: {}, sinCaught: !!CB.caught, sinFled: !!CB.fled, dead: false};
  CB.mine.forEach(f => { me.mons["p1:Sinnoh" + (f.index + 1)] = {side: "p1", hp: f.hp, max: f.max, status: f.status}; });
  CB.foes.forEach((f, i) => { me.mons["p2:" + (b.swarm ? "Enjambre" + (f.index + 1) : "F" + i)] = {side: "p2", hp: f.hp, max: f.max, status: f.status}; });
  me.act.p2 = b.swarm ? "p2:Enjambre" + (CB.foe.index + 1) : "p2:F" + CB.foes.indexOf(CB.foe);
  if (CB.caught && b.wild) b.wild = {...cardKeep(CB.foe)};
  if (won === true && CB.ballFails >= 2 && typeof sinCheckStamps === "function") sinCheckStamps(run, {failedCapture: true});
  cardRender();
  setTimeout(() => {
    sinResult(won, me);
    if (run.battle && !run.retry) return cardStart(run); // segunda fase (Aura Celestial)
    CB = null; go("sin");
  }, 1600);
}

/* ---------- Pantalla de combate ---------- */
function cardPanel(f, foe) {
  const pct = Math.max(0, f.hp / f.max * 100);
  return `<div class="cb-side ${foe ? "foe" : "me"}">${sinCardImage(f.set.card.img, f.set.card.name, "cb-card")}
    <div class="cb-info"><b>${esc(esSp(f.set.species))}</b> <span class="cb-types">${f.set.card.types.map(tchip).join("")}</span>
      <span class="sin-hp"><i style="width:${pct}%"></i></span><small>${f.hp}/${f.max} vida · Iniciativa ${cardInit(f)}${f.status ? " · " + CARD_STATUS[f.status].name : ""} · Fatiga ${f.fatigue}</small></div></div>`;
}
function cardRender() {
  if (!CB || VIEW !== "sincards") return;
  const run = CB.run, b = run.battle, canBall = CB.phase === "choose" && !b.trainer && !b.legend?.ub && !b.legend?.necro;
  const controls = CB.over ? "<p>El combate terminó…</p>" :
    CB.phase === "switch" ? `<p>${CB.optional ? "El rival cambió de Pokémon. Puedes cambiar el tuyo:" : "Elige a tu siguiente Pokémon:"}</p><div class="btns">${CB.mine.filter(f => f.hp > 0).map(f =>
      `<button class="btn" data-act="cbswitch" data-member="${f.index}">${esc(esSp(f.set.species))} · ${f.hp}/${f.max}</button>`).join("")}</div>` :
    CB.phase === "foe" ? `<p>Turno de ${esc(esSp(CB.foe.set.species))} (rival)…</p>` :
    CB.phase === "result" ? `${cardDiceHTML()}<button class="btn primary" data-act="cbnext" disabled>Continuar</button>` :
    `<div class="cb-moves">${cardMoves(CB.me.set).map((mv, i) => {
      const fx = cardEffect(mv.effect), str = cardStrength(CB.me, CB.foe, mv, fx), eff = cardTypeBonus(mv.type, CB.foe.set.card.types);
      return `<button class="btn cb-move" data-act="cbmove" data-move="${i}">${tchip(mv.type === "Typeless" ? "Normal" : mv.type)} <b>${esc(mv.name)}</b> · ${str} dado${str === 1 ? "" : "s"}${eff ? ` · ${eff > 0 ? "+" : ""}${eff}` : ""}<small>${esc(mv.effect)}${fx.known || !mv.effect ? "" : " (sin efecto en esta versión)"}</small></button>`;
    }).join("")}</div>
    ${canBall ? `<div class="btns">${Object.entries(SIN_BALLS).filter(([k]) => run.balls[k] > 0).map(([k, ball]) => `<button class="btn" data-act="cbball" data-ball="${k}">${esc(ball.name)} ×${run.balls[k]} (${k === "glory" ? "segura" : CARD_BALL_DICE[k] + " dados"})</button>`).join("")}</div>` : ""}`;
  $("app").innerHTML = `<div class="top"><span></span><h1>${CB.foeName ? esc(CB.foeName) : "Combate salvaje"} · Ronda ${CB.turn}</h1><span></span></div>
    <div class="scene cb-scene" id="scene">${cardPanel(CB.foe, true)}${cardPanel(CB.me, false)}</div>
    <div class="card">${controls}</div>
    <div class="card cb-log">${CB.log.slice(0, 8).map(l => `<p>${esc(l)}</p>`).join("")}</div>`;
  sinFillImages();
}
document.addEventListener("click", e => {
  if (VIEW !== "sincards" || !CB) return;
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const act = b.dataset.act;
  if (act === "cbmove" && CB.phase === "choose") { const mv = cardMoves(CB.me.set)[+b.dataset.move]; if (!mv) return; return cardAct(() => cardAttack(CB.me, CB.foe, mv), () => { CB.step++; cardAfterAction(); }); }
  if (act === "cbnext" && CB.phase === "result") { const next = CB.after; CB.after = null; CB.phase = "busy"; return next(); }
  if (act === "cbball") return cardThrow(b.dataset.ball);
  if (act === "cbswitch" && CB.phase === "switch") return cardSwitch(+b.dataset.member);
});
const cardStyle = document.createElement("style");
cardStyle.textContent = `
  .cb-scene{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;aspect-ratio:auto;height:auto}
  .cb-side{display:flex;flex-direction:column;gap:6px;background:#ffffffcc;border-radius:12px;padding:6px;color:var(--ink)}
  .cb-side.me{order:-1}
  .cb-card{display:block;width:100%;max-width:300px;height:auto;margin:0 auto;border-radius:8px}
  .cb-info{flex:1;min-width:0}.cb-info small{display:block;margin-top:3px}.cb-types{display:inline-flex;gap:3px}
  .cb-moves{display:grid;gap:8px}.cb-move{text-align:left;white-space:normal;display:block}.cb-move small{display:block;color:var(--ink2);margin-top:3px}
  .cb-log p{margin:3px 0;font-size:14px}.cb-log p:first-child{font-weight:600}
  .cb-roll{margin-bottom:10px}.cb-roll p{margin:4px 0}.cb-res{font-weight:600}
  .cb-dice{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
  .cb-die{display:inline-grid;place-items:center;width:40px;height:40px;border-radius:9px;font:700 20px var(--display);box-shadow:0 2px 0 #0003;border:2px solid #0002}
  .cb-die[data-face=hit]{background:#f4f6f8;color:#22303a}.cb-die[data-face=crit]{background:#ffd23f;color:#5b3b00}.cb-die[data-face=status]{background:#a77bf3;color:#fff}
  .cb-die.rolling{animation:cbShake .18s linear infinite;background:#dfe5ea;color:#22303a}
  .cb-die.rolling[data-show=crit]{background:#ffe48a}.cb-die.rolling[data-show=status]{background:#cdb5f8}
  @keyframes cbShake{25%{transform:rotate(-14deg) translateY(-3px)}75%{transform:rotate(14deg) translateY(2px)}}
  .btn.primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}`;
document.head.appendChild(cardStyle);

/* ---------- Fuera de combate ---------- */
// Enseñar el movimiento del Pokémon salvaje debilitado (p. 9): a un Pokémon que pueda aprender su tipo; máximo 3 movimientos.
function cardTeachHTML(run) {
  const t = run.progress?.cardTeach; if (!t || t.done) return "";
  const mv = t.move, can = s => s.card && sinAlive(s) && (mv.type === "Typeless" || s.card.learn.includes(mv.type)) && !cardMoves(s).some(m => m.name === mv.name);
  return `<div class="sin-learn"><p>Puedes enseñar <b>${esc(mv.name)}</b> (${esc(cardTypeName(mv.type))}, fuerza ${mv.str || "variable"}) a…</p><div class="btns">
    ${run.team.map((s, i) => can(s) ? `<button class="btn" data-act="cbteach" data-member="${i}">${esc(esSp(s.species))}${(s.cmoves || []).length >= 2 ? " (reemplaza)" : ""}</button>` : "").join("")}
    <button class="btn" data-act="cbteach" data-member="-1">No enseñar</button></div></div>`;
}
function cardTeach(member, slot = null) {
  const run = ST.sin.run, t = run?.progress?.cardTeach; if (!t || t.done) return;
  if (member >= 0) {
    const s = run.team[member]; if (!s?.card) return;
    s.cmoves ||= [];
    if (s.cmoves.length >= 2) { if (slot === null) return cardTeachReplace(member); s.cmoves[slot] = t.move; } else s.cmoves.push(t.move);
    run.notice = `${esSp(s.species)} aprendió ${t.move.name}.`;
  }
  t.done = true; sinSave(); sinRefreshProgress();
}
function cardTeachReplace(member) {
  const s = ST.sin.run.team[member];
  const box = document.querySelector(".sin-learn");
  if (box) box.innerHTML = `<p>${esc(esSp(s.species))} ya conoce 3 movimientos. ¿Cuál olvidar? (el característico no se puede cambiar)</p><div class="btns">${s.cmoves.map((m, i) =>
    `<button class="btn" data-act="cbteachslot" data-member="${member}" data-slot="${i}">${esc(m.name)}</button>`).join("")}</div>`;
}
// Evolución por Puntos de Viaje (p. 5): restaura al Pokémon y conserva objetos y movimientos enseñados.
function cardEvoHTML(run) {
  const rows = run.team.flatMap((s, i) => !s.card ? [] : s.card.evo.map(sp => {
    const cost = Math.max(0, s.card.cost - (run.halfEvo ? Math.ceil(s.card.cost / 2) : 0) - (sinFx?.(run, "pvUnlock") ? 2 : 0));
    return `<li><b>${esc(esSp(s.species))} → ${esc(esSp(sp))}</b><small>${cost} PV${run.halfEvo ? " (Estofado Infundido)" : ""}</small>
      <button class="btn" data-act="cbevolve" data-member="${i}" data-sp="${esc(sp)}" ${run.pv >= cost && sinMapAction(run) && cardBySpecies(sp) ? "" : "disabled"}>Evolucionar</button></li>`;
  }));
  return rows.length ? `<h2>Evolucionar (Puntos de Viaje)</h2><ul class="sin-objects">${rows.join("")}</ul>` : "";
}
function cardEvolve(member, sp) {
  const run = ST.sin.run, s = run.team[member], card = cardBySpecies(sp);
  if (!s?.card || !card || !s.card.evo.includes(sp) || !sinMapAction(run)) return;
  const cost = Math.max(0, s.card.cost - (run.halfEvo ? Math.ceil(s.card.cost / 2) : 0) - (sinFx?.(run, "pvUnlock") ? 2 : 0));
  if (run.pv < cost) return;
  run.pv -= cost; delete run.halfEvo;
  const old = s.card.sig, from = s.species;
  Object.assign(s, cardSet({...s, species: card.d.sp}, card), {species: card.d.sp, hpNow: undefined, status: ""});
  // El movimiento de la carta anterior se puede conservar como enseñado si hay espacio.
  if ((s.cmoves || []).length < 2 && !s.cmoves.some(m => m.name === old.name)) s.cmoves.push(old);
  run.notice = `¡${esSp(from)} evolucionó en ${esSp(s.species)}! Se restauró por completo.`;
  sinSave(); sinUpdateTurn();
}
document.addEventListener("click", e => {
  const b = e.target.closest("button[data-act]"); if (!b || !ST.sin?.run) return;
  if (b.dataset.act === "cbteach") return cardTeach(+b.dataset.member);
  if (b.dataset.act === "cbteachslot") return cardTeach(+b.dataset.member, +b.dataset.slot);
  if (b.dataset.act === "cbevolve" && VIEW === "sin") return cardEvolve(+b.dataset.member, b.dataset.sp);
});
