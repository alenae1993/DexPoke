"use strict";
/* ---------- Modo Escalada (Mi Dex) ----------
   Empiezas con 1 Pokémon contra 1 de la CPU. Cada vez que ganas, eliges 1 Pokémon del equipo rival
   y se une al tuyo (con su set: movimientos, objeto, habilidad, naturaleza). El rival siempre trae
   tantos Pokémon como tú. Con 6 en el equipo, puedes reemplazar a uno o dejar pasar la recompensa.
   Si pierdes, la escalada termina y queda tu récord. Se guarda solo: puedes salir y seguir después. */
if (!ST.esc) ST.esc = {run: null, best: 0, runs: 0};
const ESC = () => ST.esc;
const copySet = s => JSON.parse(JSON.stringify(s));
let ESC_REPL = null; // índice del Pokémon rival elegido cuando hay que reemplazar

function escLevelOf(r) { return r.lvl === "rand" ? 0 : +r.lvl; }
function escGenTeam(n, lvl) {
  const t = randomTeam(lvl).slice(0, n);
  t.forEach(s => { s.name = ""; });
  return t;
}
/* la CPU se pone más dura a medida que subes */
function escAi(r) {
  const base = r.diff || "normal";
  if (r.round >= 10) return "hard";
  if (r.round >= 5 && base === "easy") return "normal";
  return base;
}
function escNew() {
  const lvl = ST.lvl || "50";
  ESC().run = {round: 1, wins: 0, lvl, diff: ST.diff, team: [], start: escGenTeam(3, escLevelOf({lvl})), foe: null, offer: null, log: []};
  ESC().runs++; save();
}
function escFoe(r) {
  if (!r.foe) { r.foe = escGenTeam(Math.min(6, Math.max(1, r.team.length)), escLevelOf(r)); save(); }
  return r.foe;
}
function escEnd(r, why) {
  ESC().best = Math.max(ESC().best || 0, r.wins);
  ESC().last = {wins: r.wins, team: r.team.map(s => s.species), why};
  ESC().run = null; save();
}
function setLine(s) {
  const mv = (s.moves || []).map(id => { const m = Dex.moves.get(id), x = TY[toID(m.type).toUpperCase()] || TY.NORMAL;
    return `<span class="pmv" data-info="${esc(id)}" style="--c:${x[1]};--ct:${x[2]}">${esc(esMove(id))}</span>`; }).join("");
  const sp = Dex.species.get(s.species);
  return `${pimg(s.species, 'alt="" loading="lazy"')}<span><b>${esc(esSp(s.species))}</b> <span style="display:inline-flex;gap:3px">${sp.types.map(tchip).join("")}</span>
    <small>Nv. ${s.level || 100} · ${esc(esAb(s.ability))}${s.item ? " · " + esc(esItem(s.item)) : ""}${s.nature ? " · " + esc(esNat(s.nature)) : ""}</small></span>
    ${mv ? `<span class="pmvs">${mv}</span>` : ""}`;
}

function renderEsc() {
  const E = ESC(), r = E.run;
  const top = `<div class="top"><button class="back" data-act="menu">‹ Menú</button><h1>Modo Escalada</h1><span class="lv" style="font-family:var(--mono);font-size:12px;color:var(--ink3)">Récord ${E.best || 0}</span></div>`;
  if (!r) {
    const last = E.last ? `<div class="card"><h3>Última escalada</h3><p class="note" style="margin:0 0 8px">${E.last.wins} victoria${E.last.wins === 1 ? "" : "s"}${E.last.why ? " · " + esc(E.last.why) : ""}</p>${strip(E.last.team.map(sp => ({species: sp})))}</div>` : "";
    $("app").innerHTML = `${top}<div class="stack">
      <div class="card"><h3>Cómo se juega</h3>
        <p class="note" style="margin:0">Empiezas con <b>1 Pokémon</b> contra 1 de la CPU. Cada vez que ganas, eliges <b>1 Pokémon del equipo rival</b> y se une al tuyo con su set completo. El rival siempre trae tantos Pokémon como tú (1 vs 1, 2 vs 2… hasta 6 vs 6). Con 6 puedes <b>reemplazar</b> a uno o dejar pasar la recompensa. Si pierdes, la escalada termina.</p>
        <p class="note">Tus Pokémon se curan entre combates. Desde la ronda 5 la CPU deja de ser fácil y desde la 10 juega en difícil. Nivel actual: ${ST.lvl === "rand" ? "Equilibrado" : "Nivel " + esc(ST.lvl)} (cámbialo en Opciones del menú antes de empezar).</p>
        <div class="btns" style="margin-top:10px"><button class="btn pri" data-act="escnew">Empezar escalada</button></div></div>
      ${last}</div>`;
    return;
  }
  if (!r.team.length) {
    $("app").innerHTML = `${top}<div class="stack"><div class="card"><h3>Elige tu primer Pokémon</h3>
      <div class="party">${r.start.map((s, i) => `<button class="pm" data-escstart="${i}">${setLine(s)}</button>`).join("")}</div>
      <p class="note">Toca el que quieras llevar. Toca un movimiento para ver qué hace.</p></div>
      <div class="btns"><button class="btn warn" data-act="escquit">Abandonar escalada</button></div></div>`;
    return;
  }
  if (r.offer) { // recompensa tras ganar
    const full = r.team.length >= 6;
    if (full && ESC_REPL != null) {
      const s = r.offer[ESC_REPL];
      $("app").innerHTML = `${top}<div class="stack"><div class="card"><h3>¿A quién reemplaza ${esc(esSp(s.species))}?</h3>
        <div class="party">${r.team.map((m, i) => `<button class="pm" data-escrep="${i}">${setLine(m)}</button>`).join("")}</div>
        <div class="btns" style="margin-top:10px"><button class="btn" data-act="escback">‹ Elegir otro</button><button class="btn" data-act="escskip">No reemplazar a nadie</button></div></div></div>`;
      return;
    }
    $("app").innerHTML = `${top}<div class="stack"><div class="card"><h3>¡Victoria ${r.wins}! Elige tu recompensa</h3>
      <p class="note" style="margin:0 0 8px">${full ? "Tu equipo está completo: si eliges uno, después decides a quién reemplaza." : "El Pokémon que elijas se une a tu equipo."}</p>
      <div class="party">${r.offer.map((s, i) => { const dup = r.team.some(m => Dex.species.get(m.species).baseSpecies === Dex.species.get(s.species).baseSpecies);
        return `<button class="pm" data-escpick="${i}" ${dup ? 'aria-disabled="true" title="Ya lo tienes en tu equipo"' : ""}>${setLine(s)}${dup ? '<small style="grid-column:1/-1;color:var(--ink3)">Ya está en tu equipo</small>' : ""}</button>`; }).join("")}</div>
      <div class="btns" style="margin-top:10px"><button class="btn" data-act="escskip">No tomar ninguno</button></div></div>
      <div class="card"><h3>Tu equipo (${r.team.length}/6)</h3>${strip(r.team)}</div></div>`;
    return;
  }
  const n = Math.min(6, r.team.length), foe = escFoe(r);
  $("app").innerHTML = `${top}<div class="stack">
    <div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><h3 style="margin:0">Ronda ${r.round}</h3><span class="note" style="margin:0">${n} vs ${n} · CPU ${({easy: "fácil", normal: "normal", hard: "difícil"})[escAi(r)]}</span></div>
      <p class="note" style="margin:4px 0 10px">Victorias seguidas: <b>${r.wins}</b> · Récord: ${E.best || 0}</p>
      <h3>Rival</h3>${strip(foe)}
      <div class="btns" style="margin-top:12px"><button class="btn pri" data-act="escfight">¡Combatir!</button></div></div>
    <div class="card"><h3>Tu equipo (${r.team.length}/6)</h3><div class="party">${r.team.map((m, i) => `<div class="pm" style="cursor:default">${setLine(m)}${i ? `<button class="btn" data-esclead="${i}" style="grid-column:1/-1;justify-self:start;padding:5px 12px;font-size:12px;margin-top:2px">Poner primero</button>` : `<small style="grid-column:1/-1;color:var(--accent);font-weight:600">Sale primero</small>`}</div>`).join("")}</div>
      <p class="note">Al empezar el combate también puedes elegir quién sale primero.</p></div>
    <div class="btns"><button class="btn warn" data-act="escquit">Abandonar escalada</button></div></div>`;
}

function escFight() {
  const r = ESC().run; if (!r || !r.team.length) return;
  const mine = r.team.map(copySet), foe = escFoe(r).map(copySet);
  newBattle(mine, foe, {esc: true, aiDiff: escAi(r)});
}
/* lo llama batalla.js al terminar un combate de escalada */
function escResult(won) {
  const r = ESC().run; if (!r) return;
  if (won) { r.wins++; r.round++; r.offer = r.foe; r.foe = null; ESC().best = Math.max(ESC().best || 0, r.wins); save(); }
  else escEnd(r, "Derrota en la ronda " + r.round);
}
function escEndHTML(won) {
  const r = ESC().run;
  if (won) return `<div class="card"><p class="result">¡Victoria!</p><p class="note" style="text-align:center">${r && r.wins === 1 ? "Primera victoria." : `Llevas ${r ? r.wins : 0} victorias seguidas.`}</p>
    <div class="btns" style="justify-content:center"><button class="btn pri" data-act="esc">Elegir recompensa</button></div></div>`;
  if (won === null) return `<div class="card"><p class="result">Empate</p><p class="note" style="text-align:center">Nadie gana: repite el combate.</p>
    <div class="btns" style="justify-content:center"><button class="btn pri" data-act="esc">Volver a la escalada</button></div></div>`;
  const E = ESC();
  return `<div class="card"><p class="result">Fin de la escalada</p><p class="note" style="text-align:center">${E.last ? E.last.wins : 0} victorias · Récord ${E.best || 0}</p>
    <div class="btns" style="justify-content:center"><button class="btn pri" data-act="escnew">Nueva escalada</button><button class="btn" data-act="menu">Menú</button></div></div>`;
}

document.addEventListener("click", e => {
  if (e.target.closest("[data-info]")) return;
  const t = e.target.closest("button,[data-esclead]"); if (!t) return;
  const r = ESC().run, act = t.dataset.act;
  if (act === "esc") { if (B) B.dead = true; B = null; ESC_REPL = null; return go("esc"); }
  if (act === "escnew") { if (B) B.dead = true; B = null; escNew(); return go("esc"); }
  if (act === "escquit") { if (!confirm("¿Abandonar esta escalada? Se guarda como terminada.")) return; if (r) escEnd(r, "Abandonada en la ronda " + r.round); return renderEsc(); }
  if (act === "escfight") return escFight();
  if (!r) return;
  if (t.dataset.escstart != null) { r.team = [copySet(r.start[+t.dataset.escstart])]; r.start = null; save(); return renderEsc(); }
  if (t.dataset.esclead != null) { const i = +t.dataset.esclead; r.team.unshift(r.team.splice(i, 1)[0]); save(); return renderEsc(); }
  if (t.dataset.escpick != null) {
    if (t.getAttribute("aria-disabled") === "true") return;
    const i = +t.dataset.escpick;
    if (r.team.length < 6) { r.team.push(copySet(r.offer[i])); r.offer = null; save(); return renderEsc(); }
    ESC_REPL = i; return renderEsc();
  }
  if (t.dataset.escrep != null && ESC_REPL != null) { r.team[+t.dataset.escrep] = copySet(r.offer[ESC_REPL]); r.offer = null; ESC_REPL = null; save(); return renderEsc(); }
  if (act === "escback") { ESC_REPL = null; return renderEsc(); }
  if (act === "escskip") { r.offer = null; ESC_REPL = null; save(); return renderEsc(); }
});
