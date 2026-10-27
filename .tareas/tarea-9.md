# Tarea 9: Bonguri, fabricar Balls, captura en combate y sin Tera/Dinamax en Sinnoh

## Objetivo
En Leyendas de Sinnoh: (1) desactivar la Teracristalización y el Dinamax en sus combates; (2) al derrotar o capturar al salvaje de un árbol o arrecife, recibir **Bonguri** para fabricar Balls con las recetas del mod; (3) empezar la aventura con **3 Poké Balls**; (4) poder **lanzar Balls durante el combate** y capturar con la fórmula de los juegos.

## Decisiones del dueño
- Captura **durante el combate**, como en los juegos: si falla, **pierdes el turno y el salvaje ataca**.
- Recetas **del mod**: Poké Ball = 1 Bonguri rojo; Super Ball = 1 azul + 1 verde + 1 rojo; Ultra Ball = 1 negro + 1 amarillo.
- Empezar con 3 Poké Balls.
- El resto del juego sigue igual (EXP, niveles, evolución, búsqueda, movimiento, turnos, curación).

## Contexto
- Rama `sinnoh`, solo local. No ejecutes comandos `git` que escriban.
- Lee `AGENTS.md`, `docs/sinnoh.md` y el `sinnoh.js` actual (tareas 6–8: oferta en `run.offer`, `sinFight`, `run.battle = {wild, indices}`, `sinResult`, `sinGainExp`, `run.progress`, `sinProgressHTML`).
- **Bonguri en el mod:** los árboles se llaman `"<Color> Apricorn Tree"` (Red, Yellow, Blue, Pink, Green, White, Black); los arrecifes son `"… Apricorn Reef"`. Un árbol da **3 Bonguri de su color**; un arrecife, **3 de colores al azar** (usa rojo, amarillo, azul, rosa, verde y blanco; el negro solo sale de árboles negros). Nombres en español: Bonguri Rojo, Amarillo, Azul, Rosa, Verde, Blanco y Negro.
- **Ratio de captura:** `data.js` `D.P[i].cr` (usa `sinSpeciesData`).
- **Pasar el turno tras fallar la captura (ya probado con el motor):** con el stream omnisciente:
  ```
  >eval const sd=battle.sides[0]; sd.clearChoice(); sd.choice.actions=[{choice:"pass",pokemon:sd.active[0],index:0}]; sd.choice.forcedPassesLeft=0; if (battle.allChoicesDone()) battle.commitChoices();
  ```
  Probado en los dos órdenes (la CPU ya eligió / la CPU elige después): el salvaje ataca y empieza el turno siguiente. En el cliente, antes de escribirlo, deja el estado como lo deja `choose()` en `batalla.js` (revisa esa función: `me.lastReq = me.req; me.req = null; me.shown = false; …`) para que no se pueda elegir otra acción en ese turno.
- **Mensajes en combate:** `say(me, texto, segundos)` de `batalla.js` muestra texto en el cuadro de diálogo.
- **PS del salvaje en el cliente:** `me.mons` del lado `p2` (`me.act.p2`) tiene `hp`/`max`/`status`; para el rival la PS llega en porcentaje (`max` 100). La fórmula solo usa la proporción, así que basta.

## Archivos que se pueden tocar
- Editar: `sinnoh.js`.
- Editar **con cambios mínimos** `batalla.js`, solo estas 3 cosas:
  1. En `newBattle`: `globalThis.ALLOW_DMAX = ST.dmax !== "off" && !opts.fmt && !opts.sin;`
  2. En los controles de ataque (donde está `const tera = a.canTerastallize, …`): no mostrar Teracristalizar ni Dinamax/Gigamax cuando `me.sin` (por ejemplo `const tera = !me.sin && a.canTerastallize, … dmax = !me.sin && a.canDynamax;`).
  3. En el bloque `<div class="act">` de esos controles: `${me.sin && typeof sinBallsHTML === "function" ? sinBallsHTML(me) : ""}` para los botones de Balls.
- Editar: `docs/sinnoh.md` (sección de la decisión: Bonguri, recetas, fórmula de captura, pase de turno) y `AGENTS.md` (solo el punto de Sinnoh en "Pendiente").

## NO tocar
- `ps.js`, `data.js`, `sinnoh_datos.js`, `spr/*`, `sw.js`, `competitivo.js`, `escalada.js`, ni ningún otro archivo.
- No cambies los demás modos de batalla: con `me.sin` falso, `batalla.js` debe comportarse exactamente igual.
- No cambies `STORE_KEY` ni nada guardado fuera de `ST.sin`.
- No uses el atributo `data-pick` (lo usa `competitivo.js`); usa nombres propios como `data-ball`.

## Qué hacer
1. **Inventario** en `ST.sin.run`: `bag` (Bonguri por color: `red, yellow, blue, pink, green, white, black`) y `balls` (`poke, great, ultra`).
   - Partida nueva: `balls = {poke: 3, great: 0, ultra: 0}`, `bag` en 0.
   - Partida antigua sin inventario: inicialízalo igual (con las 3 Poké Balls), en la misma migración de la tarea 7/8.
2. **Bonguri al ganar o capturar** en un árbol/arrecife (no al perder): +3 según el token de la búsqueda (guarda en `run.battle` de qué token vino si hace falta). Muéstralo en la pantalla de resultado: "Recibiste 3 Bonguri Rojos." (o los colores del arrecife).
3. **Bolsa en el mapa:** botón "Bolsa" en la barra de turno que abre un panel con los Bonguri (con su color) y las Balls, y botones "Fabricar" por receta (deshabilitados si faltan Bonguri). Fabricar descuenta y suma la Ball, y guarda. Se puede fabricar en cualquier momento en el mapa.
4. **Lanzar Balls en combate** (`sinBallsHTML(me)` devuelve los botones; el clic lo maneja el listener de `sinnoh.js` con un `data-act` propio):
   - Un botón por tipo con cantidad ("Poké Ball ×3"), deshabilitado si hay 0 o si no es momento de elegir ataque (`me.req` sin `forceSwitch`, combate no terminado).
   - Al lanzar: descuenta la Ball y guarda; mensaje "¡Lanzaste una <Ball>!".
   - **Fórmula (generaciones VI–VII):** `a = floor( ((3·M − 2·H) · ratio · bonoBall) / (3·M) ) · bonoEstado`, con `M`/`H` = PS máxima/actual del salvaje (puede ser en porcentaje), `ratio` = `cr`, bonoBall Poké 1 / Super 1,5 / Ultra 2, bonoEstado 2,5 si dormido o congelado, 1,5 si paralizado, quemado o envenenado, 1 si nada. Si `a ≥ 255`, capturado. Si no, `b = floor(65536 / (255 / a)^0.1875)` y se hacen **4 comprobaciones**: cada una pasa si un entero al azar 0–65535 es menor que `b`. Muestra "La Ball se movió…" por cada comprobación superada (hasta 3).
   - **Éxito:** "¡Ya está! ¡Has atrapado a <X>!", marca que fue captura (p. ej. `me.sinCaught = true`) y termina el combate con `B.s.omniscient.write(">forcewin p1")`. En `sinResult`, si fue captura: el salvaje (el set de `run.battle.wild`, con su sexo, IVs, ataques, `exp`, `friendship`) se une al equipo con su PS actual (`hpNow` = proporción × `hpMax` calculada con `calcStat`, redondeando hacia arriba y mínimo 1) y su estado; si el equipo ya tiene 6, va a `run.box` (lista) y se avisa "<X> fue enviado a la Caja". Capturar da EXP, EVs y Bonguri igual que derrotar (como en los juegos modernos).
   - **Fallo:** "¡Oh, no! ¡El Pokémon se ha escapado!" y se pasa el turno con el `>eval` de arriba; el salvaje ataca.
5. **Barra del equipo** sigue funcionando con más de un Pokémon (ya muestra cada uno). Comprueba que un combate con 2 Pokémon en el equipo funciona (los PS persistentes y la EXP de la tarea 7 ya contemplan varios).

## Cómo probar
- Node: fórmula de captura con casos límite (PS completa vs 1 %, cada estado, cada Ball, `cr` 3 vs 255), recetas de fabricación, Bonguri de árbol y de arrecife, migración de una partida antigua.
- Navegador (`python -m http.server 8000` → `http://localhost:8000/batalla.html` → Leyendas de Sinnoh):
  - Partida nueva: la Bolsa muestra 3 Poké Balls.
  - En un combate de Sinnoh no aparecen Teracristalizar ni Dinamax; sí aparecen los botones de Balls. En Batalla rápida siguen apareciendo Teracristalizar y Dinamax como antes.
  - Lanzar una Ball que falle: el salvaje ataca y empieza el turno siguiente.
  - Capturar (puedes forzar el resultado temporalmente con `Math.random` en la consola, sin dejarlo en el código): el Pokémon aparece en la barra del equipo y en el siguiente combate se puede usar.
  - Ganar en un árbol rojo da 3 Bonguri Rojos; fabricar una Poké Ball los descuenta.
- Revisa la consola: sin errores.

## Terminado cuando
- Tera y Dinamax no aparecen en Sinnoh y siguen igual en los demás modos.
- Se empieza con 3 Poké Balls; ganar o capturar en árboles/arrecifes da Bonguri; se fabrican Balls con las recetas del mod.
- Se lanzan Balls en combate con la fórmula indicada; fallar hace perder el turno; capturar suma el Pokémon al equipo (o a la Caja).
- Todo persiste al recargar.
- En `batalla.js` solo están los 3 cambios indicados.

## Al terminar
Resume en español: cambios por archivo (en `batalla.js`, las líneas exactas), comprobaciones de la fórmula, cómo lo probaste y dudas.

## Corrección 1 (solo la línea del caso `win` de Sinnoh en `batalla.js`)
Al capturar, el cuadro de texto del combate dice "¡Has vencido al Pokémon salvaje!", lo que contradice la pantalla "¡Capturado!". En el caso `win` de `batalla.js`, en la línea `else if (me.sin) { … }`, usa el texto "¡Has atrapado al Pokémon salvaje!" cuando `me.sinCaught` sea verdadero (deja los otros dos textos igual). No cambies nada más.
