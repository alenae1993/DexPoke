# Tarea 15: Santuarios, cartas de Evento de Santuario y Pokémon legendarios

(Corresponde a la tarea 16 del plan.)

## Objetivo
Implementar las **ofrendas de santuario** con su mazo de **35 cartas de Evento de Santuario** (texto ya transcrito abajo), los **legendarios que aparecen en sus santuarios**, los **legendarios de artefacto y de lugar**, y las reglas de combate contra legendarios.

## Contexto
- Rama `sinnoh`, solo local. No ejecutes comandos `git` que escriban.
- Lee primero `.tareas/plan-sinnoh-completo.md`, `AGENTS.md`, `docs/sinnoh.md` y `sinnoh.js` (tareas 5–14). Ya existen: búsqueda y combates salvajes (`run.offer`, `run.battle`), huida (`sinOnFaint`), captura, PV (`run.pv`), Bonguri, Balls (incl. Spirit), estofados (`run.stews`, efectos), cartas de Destino en `run.fate` (máx. 5, robar con la función existente), artefactos en `run.items`/equipados, movimiento característico (`sinTeachSignature` / cola de aprendizaje), campaña (`run.act`, ofrenda del Corazón en el Santuario Origin en el Acto III), `run.originGod` (vacío; lo usa la tarea 16).
- **Reglas del mod (reglamento p. 4, 6, 17–18):**
  - **Ofrenda de Santuario:** una vez por turno, en cualquier santuario, descartas **1 Bonguri** y robas **1 carta de Evento de Santuario**; resuelves su efecto. Ofrecer un Bonguri de grado superior aumenta la fuerza del evento (los valores "1/2/3" de la carta corresponden a Bonguri de **grado 1** = rojo/amarillo/azul, **grado 2** = rosa/verde/blanco, **grado 3** = negro). Si el mazo se acaba, se baraja la pila de descartes. Descartando además **7 PV**, robas **3** cartas y eliges **2** (la otra se descarta).
  - **No puedes hacer una ofrenda en un santuario mientras haya un legendario en él.**
  - **Evento Legendario:** ganas los Bonguri indicados y la ficha del legendario se coloca en su santuario. La ficha se retira cuando el legendario es **derrotado o capturado**.
  - **Legendarios en combate:** **no huyen** tras debilitar a uno tuyo (solo "huyen" si derrotan a todo tu equipo, que es una derrota normal; la ficha se queda). Recompensa: **4 PV** (+2 si se debilita) y, si se debilita, enseñar su movimiento característico. Sin Bonguri.
  - **Artefactos:** permiten encontrar a su legendario en su lugar de origen (buscando ahí); **no se pierde el artefacto**.
- **Lugares de legendarios en `SIN.tokens`** (etiqueta `"Legendary Encounter Card"`, el legendario está en `gm`): The Temple of the Sea `[-7,1]` Manaphy, The Magma Chamber `[6,14]` Heatran, The Hallowed Tower `[4,-4]` Spiritomb, The Grand Chateau `[-3,9]` Rotom, The Garden of Gratitude `[12,6]` Shaymin, Valley Ruins `[-2,0]` Regirock, Westbreeze Ruins `[-11,-3]` Regice, Firelilly Ruins `[9,7]` Registeel, Lake Verity/Acuity/Valor Cavern Mesprit/Uxie/Azelf, The Temple of Sinnoh `[0,0]` Silvally.
- **Santuarios en `SIN.tokens`:** todos los tokens cuyo nombre termina en `" Shrine"` (Twinleaf, Magma, Coronet, Meadow, Sendoff, Overlook, Marsh, Wetlands, Jubilee, Savanna, Eterna, Gratitude, Prairie, Colossus, Moonglade, Timeless, Frostsong, Firesong, Thundersong y Origin).
- **Cartas de legendarios:** cartas con `d.encounter_tier === "Legendary"` (`d.sp` = especie; tienen movimiento característico).
- **Mazo de Evento de Santuario:** cartas con la etiqueta `"Shrine Card"` (35). Las imágenes están en `img`. **Transcripción (léela contra las imágenes para asociar cada carta a su efecto; identifica cada una por su imagen o por su posición en el mazo y deja la tabla en el código):**

| Cantidad | Carta | Efecto (valores por grado 1/2/3) |
|---|---|---|
| 1 | Una Canción de Hielo (Articuno) | Ganas **3 Bonguri Azules**. Articuno al **Santuario Frostsong**. |
| 1 | Una Canción de Trueno (Zapdos) | **3 Bonguri Amarillos**. Zapdos al **Santuario Thundersong**. |
| 1 | Una Canción de Fuego (Moltres) | **3 Bonguri Rojos**. Moltres al **Santuario Firesong**. |
| 1 | Un Visitante de Lejos (Celebi) | **2 Bonguri Verdes**. Celebi al **Santuario Timeless**. |
| 1 | Una Sombra Emerge (Darkrai) | **1 Bonguri Negro**. Darkrai al **Santuario Moonglade** (reemplaza a Cresselia si está). |
| 1 | Un Faro de Luz (Cresselia) | **2 Bonguri Rosas**. Cresselia al **Santuario Moonglade** (reemplaza a Darkrai si está). |
| 1 | Un Gigante Despierta (Regigigas) | **2 Bonguri Blancos**. Regigigas al **Santuario Colossus**. |
| 7 | Fractura Celestial (Dioses de Sinnoh, Santuario Origin) | Robas **1 carta de Cambio de Destino**. (La parte de Seguidores y del Dios de Sinnoh en el Santuario Origin es la tarea 16: aquí suma `run.fractures` y muestra "Los Dioses de Sinnoh se agitan…".) |
| 3 | Experiencia Predestinada | Robas **1/2/3** cartas de Cambio de Destino. |
| 3 | Tesoro Oculto (Bonguri) | Ganas **1/2/3 Bonguri de tu elección** (eliges el color de cada uno). |
| 3 | Tesoro Oculto (Balls) | Ganas una **Super Ball / Ultra Ball / Spirit Ball**. |
| 3 | Momento Relajante | Ganas **2/4/6 PV**. |
| 3 | Banquete Espléndido | Usas los efectos de **1/2/3 Estofados** distintos gratis este turno. |
| 3 | Intercambio Equivalente | Puedes sustituir un Pokémon **Débil/Moderado/Fuerte** de tu equipo por un Pokémon **descartado** del mismo nivel de encuentro, manteniendo todo lo demás. |
| 3 | Sabiduría Antigua | Puedes aprender un movimiento de un Pokémon **descartado** con nivel de encuentro hasta **Moderado/Fuerte/Legendario**. |

  (La línea "4+ entrenadores" de las bendiciones no aplica en solitario.)

## Adaptación a los juegos
- **Pokémon descartados:** los salvajes **derrotados** (no los capturados ni los que huyeron) van a `run.discard` como `{species, tier, signature}` (guárdalo desde ahora en los combates salvajes, de Alfa y legendarios). Para saber el nivel de encuentro de tus Pokémon, guarda `set.tier` al capturar (W/M/S/L; el inicial no tiene, así que no se puede sustituir).
- **Intercambio Equivalente:** cambia la **especie** del Pokémon elegido por la del descartado (mismo `tier`, según el grado), conservando nivel, EXP, IVs, EVs, naturaleza, sexo, amistad, objeto, ataques (aunque la nueva especie no los aprenda), PS en proporción y estado. La habilidad pasa a la ranura 0 de la nueva especie. El descartado sale de `run.discard`.
- **Sabiduría Antigua:** enseña el **movimiento característico** (`signature`) de un descartado con `tier` permitido a un Pokémon del equipo, con la cola de aprendizaje existente.
- **Banquete Espléndido:** marca hasta 1/2/3 estofados como gratis (sin coste en Bonguri y sin gastar su uso del turno) y deja elegirlos en la Bolsa; no el mismo dos veces.
- **Niveles de los legendarios:** 40 por defecto; Regigigas 45; lagos (Mesprit/Uxie/Azelf) 35; Silvally 45. Constantes fáciles de cambiar. IVs al azar con al menos 3 en 31 (como los legendarios de los juegos modernos).
- **Interpretaciones (anótalas en la documentación):** los guardianes de los lagos se pueden combatir en su caverna **después de ganar el Fragmento de ese lago**; Silvally en el Templo de Sinnoh **después de derrotar a Helio**. Rotom, Shaymin, Manaphy, Heatran y Spiritomb requieren su artefacto (en `run.items` o equipado); los Regis, uno de sus dos núcleos (Rockice: Regirock y Regice; Icesteel: Regice y Registeel; Steelrock: Registeel y Regirock).
- **Música:** `bgm_boss` en los combates contra legendarios.

## Archivos que se pueden tocar
- Editar: `sinnoh.js`, `docs/sinnoh.md` (santuarios, eventos, legendarios, interpretaciones y adaptaciones) y `AGENTS.md` (solo el punto de Sinnoh en "Pendiente").

## NO tocar
- `batalla.js` (si de verdad falta un enganche, detente y explícalo), `ps.js`, `data.js`, `sinnoh_datos.js`, `spr/*`, `sw.js`, ni ningún otro archivo. No uses `data-pick`. No cambies nada fuera de `ST.sin`.

## Qué hacer
1. **Ofrenda:** en cualquier santuario sin legendario, la ficha muestra "Ofrenda de santuario" (una vez por turno, `run.offered`): elegir qué Bonguri ofrecer (el grado define 1/2/3) y, si tienes ≥ 7 PV, la opción "Ofrenda mayor (7 PV): robar 3 y elegir 2". Roba del mazo (`run.shrineDeck`/`run.shrineDiscard`, barajado al empezar o al migrar), muestra la(s) carta(s) con su imagen y aplica el efecto. Los efectos que piden elegir (color de Bonguri, Pokémon, movimiento, estofados) se resuelven en el mismo panel y persisten al recargar. En el Santuario Origin durante el Acto III, el botón del Corazón sigue funcionando como hoy (es otra acción).
2. **Legendarios en santuarios:** `run.shrineLegends` (santuario → especie). Dibuja la ficha del legendario sobre su santuario (imagen de su carta o su ícono). En esa casilla, "Combatir contra <Legendario>" (combate salvaje con sus reglas). Al derrotarlo o capturarlo, se retira.
3. **Legendarios de lugar:** en cada lugar de la lista, si cumples la condición (artefacto, Fragmento o Helio), "Buscar a <Legendario>" abre el combate. Al derrotarlo o capturarlo, queda marcado en `run.legendsDone` y ya no aparece.
4. **Reglas de combate legendario** en `sinOnFaint`/`sinResult`: sin huida, 4 PV (+2 si se debilita), movimiento característico al debilitar, sin Bonguri, va a `run.discard` si se debilita.
5. Registra `run.discard` en todos los combates salvajes derrotados y `set.tier` en las capturas.
6. Panel de la Bolsa o de Campaña: lista de legendarios activos en santuarios y de los ya derrotados/capturados.

## Cómo probar
- Node: tabla de 35 cartas (conteos por tipo), grados 1/2/3 según el Bonguri, ofrenda mayor (3→2), barajado y rebarajado del mazo, Intercambio Equivalente conservando todo, Sabiduría Antigua con la cola de aprendizaje, condiciones de cada legendario de lugar.
- Navegador (`python -m http.server 8000` → `http://localhost:8000/batalla.html` → Leyendas de Sinnoh): ofrenda con Bonguri de cada grado; forzar un Evento Legendario y combatir al legendario en su santuario; ir a la Torre Sagrada con la Piedra Espíritu y combatir a Spiritomb; capturar o derrotar y ver que desaparece. Revisa la consola: sin errores.

## Terminado cuando
- Las ofrendas funcionan con las 35 cartas y sus efectos adaptados, incluida la ofrenda mayor.
- Los legendarios aparecen en sus santuarios y lugares según sus condiciones, se combaten con sus reglas y se retiran al ser derrotados o capturados.
- Todo persiste al recargar; partidas antiguas se migran.
- No se tocó `batalla.js` ni nada fuera de lo permitido.

## Al terminar
Resume en español: cambios, cómo asociaste las 35 cartas con sus efectos (y si alguna no coincidió con la tabla), cómo lo probaste y dudas.
