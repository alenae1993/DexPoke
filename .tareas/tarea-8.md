# Tarea 8: evolución y amistad como en los juegos de Pokémon

## Objetivo
Que los Pokémon del equipo en Leyendas de Sinnoh **evolucionen como en los juegos** (por nivel, por amistad, por hora del día, por sexo o por conocer un ataque), usando los datos de evolución de `data.js`, con la opción de **cancelar** la evolución, y que **aprendan los ataques de evolución**; sin cambiar el resto del juego.

## Contexto
- Rama `sinnoh`, solo local. No ejecutes comandos `git` que escriban.
- Lee `AGENTS.md`, `docs/sinnoh.md` (sección "Decisión: juego actual + progresión real") y el `sinnoh.js` actual. La tarea 7 ya hizo: `sinSpeciesData`, `sinExpForLevel`, `sinGainExp` (EXP, niveles, EVs), `sinLevelMoves`, la cola `run.progress.pending` de ataques con la pregunta de cuál olvidar (`sinLearn`), y la pantalla `sinProgressHTML` / `sinProgressScreen`, que persiste al recargar.
- **Datos de evolución en `data.js`:** `D.P[i].ev = [[ESPECIE_DESTINO, MÉTODO, PARÁMETRO], …]` (ids en mayúsculas, p. ej. `["MONFERNO","Level","14"]`). Amistad base en `D.P[i].hp` (p. ej. 50; Duskull 35). Ataques de evolución: entradas de `lv` con nivel **0** (p. ej. Machoke `[0,"MACHPUNCH"]`).
- Ejemplos de cadenas de los iniciales: Chimchar → Monferno (Level 14) → Infernape (Level 36); Togepi → Togetic (Happiness); Budew → Roselia (HappinessDay); Pichu → Pikachu (Happiness); Swinub → Piloswine (Level 33) → Mamoswine (HasMove ANCIENTPOWER); Dusclops/Togekiss/Roserade/Raichu/Chandelure/Machamp usan objetos o intercambio.

## Métodos que se implementan ahora
| Método (`data.js`) | Condición (se revisa al **subir de nivel**, como en los juegos) |
|---|---|
| `Level` | nivel ≥ parámetro |
| `LevelDay` / `LevelNight` | nivel ≥ parámetro y es de día / de noche |
| `LevelFemale` / `LevelMale` (si existe) | nivel ≥ parámetro y el sexo coincide |
| `Happiness` | amistad ≥ 160 |
| `HappinessDay` / `HappinessNight` | amistad ≥ 160 y es de día / de noche |
| `HasMove` | conoce el ataque del parámetro |

- **Día/noche:** hora local del dispositivo; día de 6:00 a 19:59, noche el resto (como Essentials).
- Los demás métodos (`Item`, `CableLinkItem`/intercambio, `TradeSpecies`, objetos equipados, `LevelRain`, `LevelWalk`, `LevelCoins`, etc.) quedan **para cuando haya objetos**; no se implementan. Anótalos como pendientes en la documentación.
- Si el destino no existe en Showdown (`Dex.species.get(...).exists` falso), no evoluciona; ignóralo sin error.

## Amistad
- Cada set guarda `friendship`. Sets nuevos (inicial de partida nueva y salvajes): el valor base `hp` de `data.js` (70 si falta). Partidas antiguas sin `friendship`: inicialízalo con el valor base (como la migración de `exp`/`gender` de la tarea 7).
- **Al subir de nivel** (por cada nivel), como en los juegos: +5 si la amistad está en 0–99, +3 si está en 100–199, +2 si está en 200–255. Tope 255.
- **Al ganar un combate:** +1 a cada Pokémon vivo del equipo (aproxima caminar y combatir juntos; déjalo como constante `SIN_FRIEND_WIN`).
- Muestra la amistad en la ficha del Pokémon si ya existe una vista de detalle; si no, basta con guardarla (no hace falta UI nueva solo para eso).

## Archivos que se pueden tocar
- Editar: `sinnoh.js`, `docs/sinnoh.md` (sección de la decisión: métodos implementados, umbral 160, ganancias de amistad y pendientes), `AGENTS.md` (solo el punto de Leyendas de Sinnoh en "Pendiente").

## NO tocar
- `batalla.js`, `sinnoh_datos.js`, `spr/*`, `data.js`, `ps.js`, `sw.js`, ni ningún otro archivo.
- No cambies la EXP, los niveles de los salvajes, la búsqueda, el movimiento, los turnos ni la curación.

## Qué hacer
1. **Comprobar evolución:** después de `sinGainExp`, para cada Pokémon que **subió al menos un nivel** en ese combate, revisa sus entradas de `ev` en orden; la primera que se cumpla genera una evolución pendiente. Guárdala en la cola de `run.progress` (persistente al recargar), **después** de las preguntas de ataques de ese mismo combate.
2. **Pantalla de evolución** dentro de la pantalla de resultado: "¿Qué? ¡X está evolucionando!" con la imagen del Pokémon (usa `img()` de `batalla.js`; un fundido o destello simple con CSS es suficiente) y dos botones: **"Evolucionar"** y **"Cancelar"** (como pulsar B en los juegos). Si cancela, no evoluciona ahora; se volverá a ofrecer en la próxima subida de nivel en que se cumpla.
3. **Al evolucionar:**
   - Cambia `species` al destino (nombre de Showdown con `Dex.species.get(toID(destino)).name`).
   - Habilidad: conserva la misma ranura (`0`, `1` o `H`) de la especie anterior; si no existe en la nueva, usa la `0`.
   - PS: recalcula con `calcStat`; si tenía `hpNow`, súmale la diferencia de PS máxima (igual que al subir de nivel). Actualiza `hpMax`.
   - Mantén nivel, EXP, EVs, IVs, naturaleza, sexo, amistad y ataques.
   - Ataques: agrega a la cola de aprendizaje los de nivel 0 del destino y los del destino **en su nivel actual** (como en los juegos modernos), con el mismo flujo (aprende solo si hay espacio; si tiene 4, pregunta).
   - Mensaje: "¡Felicidades! Tu X evolucionó en Y." con `esSp`.
   - Si al evolucionar se cumple otra evolución, no encadenes en el mismo momento (en los juegos se revisa en la siguiente subida de nivel).
4. **Barra del equipo y combates** ya usan `species`, así que deben mostrar la nueva especie sin cambios extra; compruébalo.
5. No se puede volver al mapa mientras haya una evolución o una pregunta de ataque pendiente.

## Cómo probar
- Node: con funciones puras aisladas, comprueba las condiciones de cada método (Level, LevelDay/Night con horas simuladas, Happiness con 159/160, HasMove), la ganancia de amistad por nivel en los tres tramos y el tope 255, y la conservación de ranura de habilidad.
- Navegador (`python -m http.server 8000` → `http://localhost:8000/batalla.html` → Leyendas de Sinnoh):
  - Chimchar con EXP justo bajo el nivel 14 → ganar (`B.s.omniscient.write(">forcewin p1")`) → aparece la evolución → "Evolucionar" → Monferno; comprueba que aprende Ultrapuño (Mach Punch) si su `lv` lo tiene en nivel 0 o 14 y que la barra muestra Monferno.
  - Repetir con "Cancelar" y comprobar que sigue siendo Chimchar y se vuelve a ofrecer al subir otro nivel.
  - Togepi con amistad 158 justo antes de subir de nivel → evoluciona a Togetic.
  - Recargar la página con la evolución pendiente: debe seguir ahí.
- Comprueba que perder sigue sin dar EXP ni evolución.

## Terminado cuando
- Las evoluciones por nivel, amistad, hora, sexo y ataque funcionan, con opción de cancelar, y los ataques de evolución se aprenden con el flujo existente.
- La amistad se guarda, sube como se indica y tiene tope.
- Todo persiste al recargar; partidas antiguas se migran sin errores.
- La documentación lista métodos implementados y pendientes.
- No se tocó nada fuera de lo permitido.

## Al terminar
Resume en español: qué cambiaste, las comprobaciones (incluida una evolución real probada en el navegador si pudiste), y dudas.

## Corrección 1 (solo `sinnoh.js`)
En la revisión en navegador apareció en consola: `TypeError: Cannot read properties of undefined (reading 'indexOf')` en `competitivo.js:337`. Causa: los botones de la oferta de Sinnoh (`data-act="sinfight"`) usan el atributo `data-pick`, y `competitivo.js` tiene un listener de clics (en fase de captura) que responde a **cualquier** `data-pick` cuando existe `B` (por ejemplo, después de un combate anterior) y espera `B.picked`.
- Renombra en `sinnoh.js` el atributo `data-pick` de la oferta a `data-offer` (y su lectura `b.dataset.pick` → `b.dataset.offer`). Revisa que no quede ningún otro `data-pick` en `sinnoh.js`.
- No toques `competitivo.js` ni ningún otro archivo. No cambies nada más.
