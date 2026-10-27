# Tarea 13: Combates contra entrenadores (Equipo Galaxia) y Acto I de la campaña Corazón de Sinnoh

## Objetivo
Crear la base de **combates contra entrenadores** en Sinnoh (reutilizable para comandantes y Helio en las tareas 14–15) y la **campaña Corazón de Sinnoh hasta el final del Acto I**: Reclutas Galaxia ocupan tu pueblo natal, 3 Bonguri rojos al empezar el Acto I, combate contra 2 reclutas y recompensa de +2 movimientos por turno.

## Contexto
- Rama `sinnoh`, solo local. No ejecutes comandos `git` que escriban.
- Lee primero `.tareas/plan-sinnoh-completo.md`, `AGENTS.md`, `docs/sinnoh.md` y `sinnoh.js` (tareas 5–12). Hoy todos los combates de Sinnoh son contra **un salvaje** (`run.battle = {wild, indices, …}`, `newBattle(mine, [wild], {sin: true, aiDiff: "easy", pre})`), con captura, huida (`sinOnFaint`), PV, Bonguri, EXP (`sinGainExp`) y `run.progress`. `run.grunts` ya existe (lista de pueblos ocupados; bloquea el vuelo) y está vacía.
- **Reglas del mod (reglamento p. 20–21 y cartas de Acto):**
  - **Prólogo:** se coloca una ficha de "Reclutas del Equipo Galaxia" en el pueblo natal de cada entrenador (en solitario: solo el tuyo). No se puede volar hacia/desde un pueblo con Reclutas.
  - **Acto I – El Viaje:** al comenzar, ganas **3 Bonguri Rojos**. Objetivo: derrotar a los **2 Reclutas** de tu pueblo. Cuando estés listo, vuelves a tu pueblo: se baraja el mazo de Reclutas y se sacan **2 al azar**; si derrotas a ambos Pokémon (mientras puedas seguir luchando): **+2 de movimiento por turno durante el resto de la partida** y se retira la ficha de Reclutas de tu pueblo. Luego robas la carta del Acto II (el Acto II es la tarea 14: aquí solo se marca `run.act = 2` y se muestra su carta).
  - En el pueblo con Reclutas puedes curar y comerciar.
  - **Combatir termina tu turno** (como siempre).
  - Las tácticas especiales del Equipo Galaxia (Plan B y Retribución Galáctica) dependen de dados: **se omiten** (anótalo en la documentación como omitido).
- **Datos:** mazo de Reclutas = cartas con `d.encounter_tier === "Grunt"` (8: Zubat, Glameow, Croagunk, Stunky, Murkrow, Houndour, Skorupi, Bronzor; el nombre `n` dice "(Recluta del Equipo Galaxia)"). Cartas de Acto: etiqueta `"Act Card"` (5: Prólogo, Acto I, II, III y Final; identifícalas por imagen como en la tarea 5).

## Adaptación a los juegos
- **Niveles de los Reclutas:** al azar entre 9 y 12 (constante fácil de cambiar). Sets con el método de los salvajes (ataques por nivel de `data.js`, IVs al azar, naturaleza, sexo).
- **IA:** dificultad `"normal"`.
- **EXP de entrenador:** ×1,5 (bono de entrenador de los juegos), por cada Pokémon rival derrotado (calcula con su nivel; participantes completos, resto 50 % como hoy).
- **Sin captura** (no aparecen los botones de Balls), **sin huida**, **sin Bonguri ni movimiento característico**. PV: no dan.
- **Música y fondo:** `bgm_trainer` y el fondo que elija `pickBg`.

## Archivos que se pueden tocar
- Editar: `sinnoh.js`, `docs/sinnoh.md` (sección de la decisión: combates de entrenador, campaña, Acto I, tácticas omitidas) y `AGENTS.md` (solo el punto de Sinnoh en "Pendiente").
- Editar **con cambios mínimos** `batalla.js`, solo:
  1. En `newBattle`, después de `const me = B;`: si `opts.foeName`, `me.foeName = opts.foeName`; si `opts.intro`, encolar `"|-intro|" + opts.intro` y `pump(me)` igual que con los entrenadores del Desafío (sin usar `me.trainer`, para no activar `retoWin`).
  2. En `newBattle`: `me.bg = opts.bg || pickBg(me); setBg(me.bg); bgm(opts.bgm || pickBgm(me));`.
  Con esas opciones vacías, el comportamiento es idéntico al actual.

## NO tocar
- `ps.js`, `data.js`, `sinnoh_datos.js`, `spr/*`, `sw.js`, `competitivo.js`, `escalada.js`, ni ningún otro archivo. No uses `data-pick`. No cambies nada fuera de `ST.sin`.

## Qué hacer
1. **Estado de campaña** en `ST.sin.run`: `campaign: "heart"` (Corazón de Sinnoh; la tarea 21 añadirá `"ultra"`), `act` (0 = Prólogo, 1, 2, 3, 4 = Final), `moveBonus` (movimientos extra permanentes).
   - Partida nueva: tras "Comenzar" en el Prólogo, `act = 1`, `run.grunts = [pueblo natal]`, **+3 Bonguri Rojos** (además de las 3 Poké Balls) y mensaje.
   - Partidas antiguas sin `campaign`: migrar a `campaign: "heart", act: 1`, `run.grunts = [pueblo natal]`, +3 Bonguri Rojos, `moveBonus: 0`.
   - Movimientos por turno: `3 + run.frag + run.moveBonus` (+3 del Estofado Sabroso como hoy).
2. **Mapa:** dibuja una ficha de Reclutas sobre los pueblos de `run.grunts` (usa la imagen del token Galaxia si existe en `SIN.tokens`/`SIN.img`; si no, un marcador con la "G" de Galaxia). La ficha de casilla del pueblo indica "Ocupado por Reclutas del Equipo Galaxia".
3. **Panel "Campaña"** (botón en la barra de turno): imagen de la carta del acto actual, objetivo en una línea en español y estado (p. ej. "Reclutas en Pueblo Stark: pendiente").
4. **Combate contra Reclutas:** en tu pueblo natal ocupado, la ficha muestra "Desafiar a los Reclutas" (solo en `act === 1`, no si ya combatiste este turno ni si todo tu equipo está debilitado). Saca 2 cartas al azar del mazo de Reclutas (guárdalas en `run.battle` para que recargar no las cambie), arma sus sets y llama a `newBattle(equipoVivo, [rival1, rival2], {sin: true, aiDiff: "normal", pre, foeName: "Recluta del Equipo Galaxia", intro: "¡Los Reclutas del Equipo Galaxia te desafían!", bgm: "bgm_trainer"})`. Marca `run.battle.trainer = {kind: "grunt"}`.
5. **Resultado de combates de entrenador** (generaliza `sinResult`/`sinGainExp` sin romper los salvajes):
   - PS y estados de tu equipo se guardan igual que hoy; combatir termina el turno.
   - Ganar: EXP ×1,5 por cada rival derrotado; `act = 2`, `run.grunts` sin tu pueblo, `moveBonus += 2`; pantalla: "¡Derrotaste a los Reclutas del Equipo Galaxia! Ganas +2 movimientos por turno." y la carta del Acto II con su objetivo.
   - Perder: derrota normal (vuelves al pueblo, el equipo se restaura al terminar el turno); los Reclutas siguen ahí y la próxima vez se vuelven a sacar 2 al azar.
   - Sin captura, sin huida, sin Bonguri, sin PV, sin movimiento característico.
6. Asegúrate de que `sinBallsHTML` no muestra Balls en combates de entrenador y que `sinOnFaint` no provoca huida en ellos.

## Cómo probar
- Node: migración de una partida antigua, cálculo de movimientos con `moveBonus`, EXP ×1,5 con 2 rivales, selección de 2 reclutas distintos.
- Navegador (`python -m http.server 8000` → `http://localhost:8000/batalla.html` → Leyendas de Sinnoh): partida nueva → 3 Bonguri Rojos y Reclutas en tu pueblo; el vuelo desde/hacia tu pueblo está bloqueado; panel Campaña; desafiar a los Reclutas, ver la intro y que no hay Balls; ganar (`B.s.omniscient.write(">forcewin p1")`) → +2 movimientos y Acto II; perder → Reclutas siguen. Revisa la consola: sin errores. Comprueba que el Modo Desafío Kanto sigue mostrando su intro y su música como antes.

## Terminado cuando
- Hay campaña con actos; el Acto I funciona completo con sus reglas y recompensas.
- Los combates de entrenador funcionan (2 rivales, sin captura ni huida, EXP ×1,5) y sirven de base para las tareas 14–15.
- En `batalla.js` solo están los 2 cambios indicados.
- Todo persiste al recargar; partidas antiguas se migran.

## Al terminar
Resume en español: cambios por archivo (en `batalla.js`, las líneas exactas), cómo lo probaste y dudas.

## Corrección 1 (solo la línea `else if (me.sin) { … }` del caso `win` de `batalla.js`)
En combates de entrenador de Sinnoh el cuadro de texto dice "¡Has vencido al Pokémon salvaje!". Cuando `me.foeName` exista, usa "¡Has derrotado a <foeName>!" al ganar y "<foeName> te ha derrotado. Vuelves a tu pueblo natal." al perder. Sin `me.foeName`, los textos actuales (salvaje, captura y derrota) quedan exactamente igual. No cambies nada más.
