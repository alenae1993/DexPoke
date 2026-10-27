# Tarea 6: buscar Pokémon en árboles y arrecifes, y combatir con el motor de Mi Dex

## Objetivo
Que en una casilla con árbol de Bonguri o arrecife puedas **buscar**, elegir uno de los Pokémon salvajes que ofrece el mazo del mod según el lugar, **combatir** con `newBattle` de `batalla.js`, y volver al mapa con los PS y estados de tu equipo **persistentes**; más curarte en los pueblos y la derrota.

## Contexto
- Rama `sinnoh`, solo local. No ejecutes comandos `git` que escriban.
- Lee `AGENTS.md` (sección "Agregar un modo de batalla": se engancha con cambios mínimos — bandera en `opts` de `newBattle`, casos `win` y `showEnd`), `docs/sinnoh.md` y el `sinnoh.js` actual (tarea 5: `ST.sin.run` con `team`, `pos`, `turn`, `moved`…).
- **Reglas del mod que aplican:**
  - Búsqueda en un árbol o arrecife: se ofrecen **3 Pokémon Débiles, 2 Moderados o 1 Fuerte**, según el nivel del token, de cartas cuyo **bioma y clima coincidan** con los del token.
  - **Combatir termina tu turno.** Puedes moverte antes de buscar, pero no después de combatir.
  - En los pueblos: **te curas por completo** (una vez por turno).
  - Si pierdes todo tu equipo: **vuelves a tu pueblo natal** y tu equipo se restaura al empezar el turno siguiente.
  - Los estados y el daño **persisten** después del combate hasta que te cures.
- **Datos:**
  - Tokens de búsqueda: en `SIN.tokens`, los que tienen `tier` W, M o S y `b`/`k` (árboles "… Apricorn Tree" y arrecifes). Ignora por ahora los de `tier` L (legendario) y D (Puerta de Distorsión).
  - Cartas: en `SIN.decks`, las cartas con `d` (datos Lua) cuyo `tier` sea W/M/S, con sus `b` y `k`. Especie de Showdown en `d.sp`, imagen del frente en `img`.
  - Si para un token hay menos cartas que las que debe ofrecer, ofrece las que haya; si no hay ninguna, muestra un mensaje claro. Al terminar, informa en tu resumen qué combinaciones bioma/clima/nivel tienen 0 cartas.
- **Niveles de los salvajes (decisión de diseño, déjala como constante fácil de cambiar):** Débil 3–6, Moderado 8–12, Fuerte 15–20, al azar dentro del rango.
- **Set de los salvajes:** reutiliza la función que ya escribiste en la tarea 5 para el inicial (últimos 4 movimientos por nivel hasta su nivel), con su habilidad de `blankSet`, naturaleza al azar, sin EVs.
- **Cómo hacer que tu equipo entre al combate con PS y estado guardados** (ya probado con el motor, sin modificar `ps.js`): el stream omnisciente acepta `>eval`. Si se escribe **entre** `>player p1` y `>player p2`, los cambios ya salen en los primeros mensajes del combate. Ejemplo probado:
  ```
  >start {"formatid":"gen9customgame"}
  >player p1 {...}
  >eval const a=battle.sides[0].pokemon; a[0].sethp(7); a[0].setStatus("par");
  >player p2 {...}
  ```
  El primer `request` de p1 mostró `"condition":"7/21 par"`.
  - Para esto, agrega a `newBattle` una opción mínima (por ejemplo `opts.pre`, un texto que se inserta como `>eval …` entre los dos `>player`). Sin `opts.pre`, `newBattle` debe escribir exactamente lo mismo que hoy.
  - **Los Pokémon debilitados (PS 0) no se envían al combate.** Envía solo los que tienen PS > 0 y guarda el índice de cada uno en `run.team` para devolver los resultados.
- **Leer el resultado:** `batalla.js` va guardando el estado de cada Pokémon en `me.mons` (campos `hp`, `max`, `status`, `side`, `species`), con PS exactos para el lado `p1`. Al terminar (`win`), copia `hp`/`status` de los Pokémon de `p1` a `run.team` (guarda en cada set del equipo `hpNow`, `hpMax` y `status`; un set sin `hpNow` está sano). Los que no salieron a combatir quedan igual. Comprueba cómo se asocian (por especie/orden) y documenta tu elección.

## Archivos que se pueden tocar
- Editar: `sinnoh.js`.
- Editar **con cambios mínimos**: `batalla.js` — solo: la opción `pre` en `newBattle`, la bandera `sin` en `opts`/`B`, el caso `win` (`else if (me.sin) { …; sinResult(won, me); }`) y `showEnd` (`if (me.sin) { ctl.innerHTML = sinEndHTML(won); return; }`), siguiendo el patrón de `esc`. Si necesitas una frase de "¡Un X salvaje apareció!", usa el mecanismo `-intro` que ya existe para entrenadores o algo igual de pequeño.

## NO tocar
- `ps.js`, `sinnoh_datos.js`, `spr/*`, `sw.js`, `escalada.js`, ni ningún otro archivo.
- No cambies cómo funcionan los demás modos (Batalla rápida, Mi equipo, Desafío, Escalada, Competitivo).
- No cambies `STORE_KEY` ni nada guardado fuera de `ST.sin`.
- Fuera de alcance (tareas futuras): captura, Balls, Bonguri, EXP, niveles, evolución, recompensas. Al ganar, por ahora solo vuelves al mapa con un mensaje.

## Qué hacer
1. **Buscar:** si estás en una casilla con token de búsqueda (W/M/S), la ficha de casilla muestra un botón "Buscar Pokémon". Solo se puede buscar **una vez por turno** y no si ya combatiste este turno (`run.fought`), ni si todo tu equipo está debilitado.
2. **Oferta:** pantalla con las cartas ofrecidas (imagen del mod, nombre con `esSp`, nivel que tendrá) y botones "Combatir" en cada una y "No combatir". La oferta se guarda en `run.offer` para que recargar no permita volver a sacar otras cartas en el mismo turno.
3. **Combate:** `newBattle(equipoVivo, [salvaje], {sin: true, aiDiff: "easy", pre: …})`. Al terminar:
   - Actualiza PS/estado del equipo, marca `run.fought = true` y deja `run.moved` en el máximo (el turno ya no permite moverse).
   - Pantalla final (`sinEndHTML`) con "Volver al mapa".
   - Si perdiste (todo tu equipo debilitado): `pos` vuelve a tu pueblo natal y `run.revive = true`; al "Terminar turno", si `run.revive`, cura todo el equipo.
4. **Pueblos:** si estás en una casilla con token de pueblo (etiqueta `"Village Token"`), la ficha muestra "Curar equipo" (una vez por turno, `run.healed`), que borra `hpNow`/`status` de todos.
5. **Barra de turno:** muestra la vida de cada Pokémon del equipo (barra pequeña de PS y estado, p. ej. "PAR") y "Debilitado" si tiene 0 PS.
6. "Terminar turno" reinicia `fought`, `healed`, `offer` y lo que corresponda.

## Cómo probar
- `python -m http.server 8000` → `http://localhost:8000/batalla.html` → Leyendas de Sinnoh.
- Muévete a un árbol, busca, elige una carta, combate. Para forzar el resultado: `B.s.omniscient.write(">forcewin p1")` (o `p2` para perder).
- Comprueba que el daño recibido se mantiene en el siguiente combate (en la barra y en el HUD del combate), que el pueblo cura, y que al perder vuelves al pueblo y al terminar turno el equipo se recupera.
- Con Node: prueba la selección de cartas por bioma/clima/nivel, y que `newBattle` sin `pre` escribe exactamente la misma cadena que antes.
- Comprueba que Batalla rápida y Escalada siguen funcionando.

## Terminado cuando
- Se puede buscar en árboles y arrecifes con la oferta correcta, combatir y volver al mapa.
- PS y estados persisten entre combates; los debilitados no entran; el pueblo cura; perder te devuelve a casa.
- Combatir termina el turno; recargar no rompe nada ni permite repetir la búsqueda.
- En `batalla.js` solo hay los enganches mínimos.

## Al terminar
Resume en español: cambios en cada archivo (en `batalla.js`, las líneas exactas), cómo asociaste los resultados de `me.mons` con `run.team`, combinaciones sin cartas, cómo lo probaste y dudas.
