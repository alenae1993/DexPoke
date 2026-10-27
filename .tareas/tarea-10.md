# Tarea 10: Puntos de Viaje, espacios de equipo, Caja y recompensas del mod

## Objetivo
Agregar a Leyendas de Sinnoh los **Puntos de Viaje (PV)** como moneda, las **recompensas del mod** al derrotar/capturar (PV, enseñar el movimiento característico de la carta) y la **huida del salvaje**, los **espacios de equipo del mod** (3 + 1 por Fragmento) y una **Caja** para intercambiar Pokémon.

## Contexto
- Rama `sinnoh`, solo local. No ejecutes comandos `git` que escriban.
- Lee primero `.tareas/plan-sinnoh-completo.md` (plan y decisiones del dueño), `AGENTS.md`, `docs/sinnoh.md` y el `sinnoh.js` actual. Ya existen: EXP/niveles/evolución reales, `run.progress` con la cola de aprendizaje (`sinLearn`), Bonguri (`run.bag`), Balls (`run.balls`), captura (`sinThrowBall`, `me.sinCaught`), `run.box` (lista sin interfaz), `run.frag`.
- **Reglas del mod (reglamento p. 4, 8):**
  - Recompensa de PV por nivel de encuentro: Débil 1, Moderado 2, Fuerte 3, Legendario 4.
  - **Capturar o debilitar** al salvaje: PV de su nivel + 3 Bonguri (los Bonguri ya están hechos).
  - **Debilitarlo** además: **+2 PV** y puedes **enseñar su movimiento característico** a un Pokémon de tu equipo.
  - **Huida:** los salvajes Débiles, Moderados y Fuertes **huyen después de debilitar a uno de tus Pokémon**. Si huye: 2 / 1 / 0 Bonguri (Débil / Moderado / Fuerte) del tipo del árbol (o al azar si es arrecife), sin PV ni EXP. (Los legendarios huyen solo tras derrotar a todo tu equipo; eso ya es una derrota normal.)
  - **Espacios de equipo:** 3 al empezar el juego base; cada Fragmento suma 1 (máximo 6).
- **Movimiento característico de la carta:** `d.move_name` (nombre en español, p. ej. "Ataque Óseo") y `d.move_type`. Búscalo en Showdown comparando con `esMove(id)` de todos los `Dex.moves.all()` (normaliza mayúsculas y tildes); si no existe un ataque real con ese nombre, no se ofrece (lista en tu resumen cuántas cartas quedan sin equivalente).
- **Terminar el combate por huida (probado en el motor):** `B.s.omniscient.write(">forcetie")` termina el combate en empate, que pasa por el caso `tie` de `batalla.js` y por `showEnd(me, null)` → `sinEndHTML(null)`.

## Archivos que se pueden tocar
- Editar: `sinnoh.js`.
- Editar **con cambios mínimos** `batalla.js`, solo:
  1. En el caso `faint`: si `me.sin` y el debilitado es del lado `p1`, llamar `sinOnFaint(me)` (si existe la función), sin cambiar nada más de ese caso.
  2. En el caso `tie`: si `me.sin && me.sinFled`, el texto es "¡El Pokémon salvaje huyó!" en vez de "¡La batalla terminó en empate!".
- Editar: `docs/sinnoh.md` (sección de la decisión: PV, recompensas, huida, espacios, Caja) y `AGENTS.md` (solo el punto de Sinnoh en "Pendiente").

## NO tocar
- `ps.js`, `data.js`, `sinnoh_datos.js`, `spr/*`, `sw.js`, `competitivo.js`, `escalada.js`, ni ningún otro archivo. Con `me.sin` falso, `batalla.js` se comporta igual que antes.
- No uses `data-pick`. No cambies `STORE_KEY` ni nada fuera de `ST.sin`.

## Qué hacer
1. **PV:** `run.pv` (0 en partida nueva y en partidas antiguas). Mostrar "PV: N" en la barra de turno.
2. **Recompensas al ganar** (en `sinResult` / pantalla de resultado), según el nivel del token buscado (W/M/S; guarda el nivel en `run.battle` si aún no está):
   - Capturado: +PV del nivel.
   - Debilitado: +PV del nivel +2.
   - Mostrar "Ganaste N Puntos de Viaje." en la pantalla de resultado.
3. **Enseñar el movimiento característico** (solo si se debilitó, no si se capturó ni si huyó): en la pantalla de resultado, después de EXP/ataques/evolución, ofrecer "Enseñar <Movimiento> a…" con un botón por Pokémon vivo del equipo que no lo conozca, más "No enseñar". Al elegir, se agrega a la cola de aprendizaje existente (si tiene 4 ataques, se pregunta cuál olvidar con el flujo de `sinLearn`). Persistente al recargar.
4. **Huida:** `sinOnFaint(me)`: si el combate es de Sinnoh contra un salvaje no legendario y el combate no terminó, marca `me.sinFled = true` y escribe `>forcetie` (una sola vez, aunque se debiliten varios en el mismo turno). En `sinResult` con huida: Bonguri 2/1/0 según el nivel, sin PV ni EXP ni captura; los PS y estados del equipo se guardan como en cualquier combate; el turno termina (`fought`). Pantalla: "¡El Pokémon salvaje huyó!" y los Bonguri recibidos. Si con ese debilitamiento ya no te quedan Pokémon, es derrota normal (vuelves a casa), no huida.
5. **Espacios de equipo:** `sinTeamSlots(run) = min(6, 3 + run.frag)` (deja preparado `run.campaign === "ultra"` → 6, que se usará en la tarea 21). Al capturar con el equipo lleno según los espacios, el Pokémon va a `run.box` (como ya pasa con 6). **Partidas antiguas** con más Pokémon que espacios: no se los quites; solo impide sumar más hasta que haya espacio.
6. **Caja:** en un pueblo (casilla con `"Village Token"`), la ficha muestra "Caja (N)". Abre un panel con el equipo y la Caja: se puede **dejar** un Pokémon del equipo en la Caja (siempre que quede al menos 1 vivo en el equipo), **sacar** uno de la Caja si hay espacio, e **intercambiar** uno por otro. Muestra especie (`esSp`), nivel, sexo y PS. Guarda al instante.
7. Muestra los espacios en la barra de turno ("Equipo 2/3").

## Cómo probar
- Node: recompensas por nivel y resultado (capturado/debilitado/huida), espacios con 0–3 Fragmentos, búsqueda del movimiento característico de varias cartas (incluida "Ataque Óseo" de Cubone → Bonemerang) y cuántas no tienen equivalente.
- Navegador (`python -m http.server 8000` → `http://localhost:8000/batalla.html` → Leyendas de Sinnoh): ganar con `B.s.omniscient.write(">forcewin p1")` y ver PV + oferta de enseñar; huida: con dos Pokémon en el equipo, hacer que el salvaje debilite a uno (puedes bajar los PS antes con la consola) y ver "¡El Pokémon salvaje huyó!" con los Bonguri; capturar con 3 en el equipo → va a la Caja; usar la Caja en un pueblo.
- Comprueba que en Batalla rápida, al debilitarse un Pokémon tuyo, el combate sigue normal (sin huida).

## Terminado cuando
- PV se ganan y se muestran; se puede enseñar el movimiento característico tras debilitar.
- Los salvajes huyen tras debilitar a uno de los tuyos, con sus Bonguri.
- Hay 3 espacios + Fragmentos, y la Caja funciona en los pueblos.
- Todo persiste al recargar; partidas antiguas se migran sin perder Pokémon.
- En `batalla.js` solo están los 2 enganches nuevos.

## Al terminar
Resume en español: cambios por archivo (en `batalla.js`, las líneas exactas), cartas sin movimiento equivalente, cómo lo probaste y dudas.
