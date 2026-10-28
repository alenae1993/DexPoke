# Tarea 14: Actos II y III y Final de Corazón de Sinnoh (Comandantes, Fragmentos, Corazón de Sinnoh, Helio)

## Objetivo
Completar la campaña **Corazón de Sinnoh** desde el Acto II hasta el Final, usando la base de combates de entrenador de la tarea 13.

## Contexto
- Rama `sinnoh`, solo local. No ejecutes comandos `git` que escriban.
- Lee primero `.tareas/plan-sinnoh-completo.md`, `AGENTS.md`, `docs/sinnoh.md` y `sinnoh.js` (sobre todo la tarea 13: `run.campaign`, `run.act`, `run.moveBonus`, combates de entrenador con `run.battle.trainer`, EXP ×1,5, opciones `foeName`/`intro`/`bgm` de `newBattle`, panel "Campaña", cartas de Acto). También: `run.frag` (ya suma movimientos y espacios de equipo), objetos propios en `Dex.data.Items` y equipables (tarea 11).
- **Reglas del mod (reglamento p. 21–22 y cartas de Acto):**
  - **Acto II – Los Fragmentos:** en cada lago hay un Comandante del Equipo Galaxia. Se recogen los 3 Fragmentos en cualquier orden:
    - Fragmento de la Emoción: Comandante **Venus** en el **Lago Veraz** (token `"Lake Verity Battle"`, celda `[-7, -7]`).
    - Fragmento del Conocimiento: Comandante **Ceres** en el **Lago Agudeza** (`"Lake Acuity Battle"`, `[0, 14]`).
    - Fragmento de la Voluntad: Comandante **Saturno** en el **Lago Valor** (`"Lake Valor Battle"`, `[7, -7]`).
    - Al combatir, el Comandante usa **2 / 3 / 4** de sus 5 Pokémon según cuántos Fragmentos tengas ya (0 / 1 / 2). Si derrotas a todos: obtienes el Fragmento; **cada Fragmento suma 1 al tamaño máximo del equipo** (y, como ya hace `run.frag`, 1 movimiento por turno).
    - Con los 3 Fragmentos: robas la carta del **Acto III**.
  - **Acto III – El Corazón:** ve al **Santuario Origin** (token `"Origin Shrine"`, `[0, 2]`) y haz una **Ofrenda de Santuario** (descartar 1 Bonguri) para restaurar el **Corazón de Sinnoh** (los Fragmentos no se descartan). Si hay un Dios de Sinnoh en el Santuario Origin, no puedes hacer la ofrenda hasta derrotarlo o capturarlo (eso llega en la tarea 17: deja la comprobación preparada con `run.originGod`, vacío por ahora). El **Corazón de Sinnoh**, equipado, **aumenta en 1 la fuerza de ataque de los movimientos del mismo tipo que el usuario**. Luego ve al **Templo de Sinnoh** (`"Temple of Sinnoh Battle"`, `[0, 0]`): **Helio** usa **6 de sus 8 Pokémon**. Si derrotas a los 6: robas la carta **Final**.
  - **Final – La Elección:** Héroe de Sinnoh (ganas la partida) o Traidor de Sinnoh (desafías a todos los demás entrenadores; en solitario no hay otros entrenadores).
- **Datos:** cartas con `d.encounter_tier === "Commander"` (5 por comandante; el comandante está en el nombre: "(Comandante Venus)", "(Comandante Ceres)", "(Comandante Saturno)") y `"Boss"` (8 de Helio). Tokens de batalla de campaña: los 4 de arriba (`kind: "Custom_Tile"`, etiqueta `"Campaign Token"`), con imagen en `img`.

## Adaptación a los juegos
- **Niveles:** Comandante con 2 Pokémon: 16–18; con 3: 20–22; con 4: 24–26. Helio: 36–40 (su Arceus, 42). Constantes fáciles de cambiar.
- **IA:** `"hard"` para Comandantes y Helio.
- **EXP ×1,5** por cada rival derrotado (como los Reclutas). Sin captura, sin huida, sin Bonguri ni PV.
- **Música:** `bgm_boss` para Comandantes; `bgm_final` para Helio.
- **Corazón de Sinnoh:** objeto propio en `Dex.data.Items` (`heartofsinnoh`, nombre "Corazón de Sinnoh") que da **+20 % de potencia a los movimientos del mismo tipo que el usuario** (`user.hasType(move.type)`). Va a `run.items` y se equipa con el sistema de la tarea 11.
- **Final en solitario:** se ofrece solo **Héroe de Sinnoh**; el botón de Traidor aparece deshabilitado con el texto "Requiere otros entrenadores".

## Archivos que se pueden tocar
- Editar: `sinnoh.js`, `docs/sinnoh.md` (campaña completa y adaptaciones) y `AGENTS.md` (solo el punto de Sinnoh en "Pendiente" y, si corresponde, "Estado actual").

## NO tocar
- `batalla.js` (los enganches de la tarea 13 deberían bastar; si de verdad falta algo, detente y explícalo en tu resumen), `ps.js`, `data.js`, `sinnoh_datos.js`, `spr/*`, `sw.js`, ni ningún otro archivo. No uses `data-pick`. No cambies nada fuera de `ST.sin`.

## Qué hacer
1. **Acto II:** en la casilla de cada lago (solo con `act === 2` y si aún no tienes ese Fragmento), la ficha muestra "Desafiar a la Comandante Venus" / "…a la Comandante Ceres" / "…al Comandante Saturno". Elige al azar 2/3/4 de sus 5 Pokémon (guardados en `run.battle` para que recargar no los cambie) y combate con `foeName` ("Comandante Venus", etc.), `intro` ("¡La Comandante Venus del Equipo Galaxia te desafía!") y `bgm_boss`. Ganar: `run.fragments` (lista con "emotion"/"knowledge"/"willpower"), `run.frag++`, pantalla con el Fragmento ganado (nombre en español) y "+1 espacio en el equipo". Con los 3: `act = 3` y carta del Acto III.
2. **Mapa:** marca los lagos pendientes (resaltado o el token de campaña visible) durante el Acto II, y el Santuario Origin y el Templo durante el Acto III.
3. **Acto III:** en el Santuario Origin, con `act === 3` y sin Corazón: "Ofrenda: restaurar el Corazón de Sinnoh" (elige qué Bonguri descartar; bloqueado si `run.originGod`). Da el objeto Corazón de Sinnoh (`run.heart = true`) y mensaje. En el Templo, con el Corazón obtenido: "Desafiar a Helio" (6 de 8 al azar, `foeName: "Helio"`, intro "¡Helio, jefe del Equipo Galaxia, te desafía!", `bgm_final`). Ganar: `act = 4` y pantalla del **Final** con su carta, el botón "Héroe de Sinnoh" y "Traidor de Sinnoh" deshabilitado.
4. **Victoria:** al elegir Héroe, `run.won = true` y pantalla de felicitación con resumen (turnos jugados, equipo final con niveles, PV, Pokémon capturados). Después se puede **seguir explorando** el mapa (todo lo demás sigue funcionando) o ir a "Nueva partida".
5. **Panel Campaña:** objetivo y progreso de cada acto (Fragmentos 1/3, Corazón sí/no, Helio).
6. Perder contra un Comandante o Helio: derrota normal; se puede reintentar (en otro turno) y vuelve a elegir sus Pokémon al azar.

## Cómo probar
- Node: elección 2/3/4 según Fragmentos, niveles, avance de actos, Corazón de Sinnoh +20 % con seed fijo en un combate real.
- Navegador (`python -m http.server 8000` → `http://localhost:8000/batalla.html` → Leyendas de Sinnoh): con una partida en Acto II (prepárala por consola), desafiar a los 3 Comandantes (gana con `B.s.omniscient.write(">forcewin p1")`), ver los espacios del equipo subir a 4/5/6 y el paso al Acto III; ofrenda en el Santuario Origin; Helio; Final y Héroe; seguir explorando. Revisa la consola: sin errores.

## Terminado cuando
- La campaña Corazón de Sinnoh se puede jugar de principio a fin con sus reglas y adaptaciones.
- Todo persiste al recargar.
- No se tocó `batalla.js` ni nada fuera de lo permitido.

## Al terminar
Resume en español: cambios, cómo lo probaste y dudas.
