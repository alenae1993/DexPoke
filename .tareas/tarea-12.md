# Tarea 12: Pueblos completos (Ginkgo y vuelo) y elaboración completa (Spirit Ball, estofados, objetos de batalla)

## Objetivo
Completar las acciones de pueblo y campamento (comercio con Ginkgo, volar entre pueblos) y la elaboración del mod (Spirit Ball, 4 estofados y 6 objetos de batalla), adaptando a los juegos lo que use dados.

## Contexto
- Rama `sinnoh`, solo local. No ejecutes comandos `git` que escriban.
- Lee primero `.tareas/plan-sinnoh-completo.md`, `AGENTS.md`, `docs/sinnoh.md` y `sinnoh.js` (tareas 5–11: `run.bag`, `run.balls`, `SIN_BALLS`, `sinCraft`, Bolsa, `run.items`, objetos propios en `Dex.data.Items`, `sinEquip`, campamentos con el botón "Comerciar con Ginkgo (próximamente)", curación una vez por turno).
- **Reglas del mod (reglamento p. 3 y 14):**
  - En cualquier **pueblo**, una vez por turno cada acción: curar (ya hecho), **comerciar con Ginkgo** según el intercambio actual (después se baraja el mazo de Intercambios Ginkgo) y **volar a otro pueblo descartando 1 Bonguri** (no puede haber Reclutas del Equipo Galaxia en ninguno de los dos pueblos; los Reclutas llegan en la tarea 13: deja la comprobación preparada con `run.grunts`, lista de pueblos ocupados, vacía por ahora).
  - **Campamentos:** curar y comerciar con Ginkgo una vez por turno; **no se puede volar** hacia/desde ellos.
  - **Elaboración** (fuera de combate, en tu turno): Balls, estofados (cada estofado **una vez por turno**, efecto instantáneo) y objetos de batalla (equipables).
- **Mazo de Intercambios Ginkgo:** es el mazo de 9 cartas sin nombre ni etiquetas de `SIN.decks` (el único con 9 cartas sin `n` ni `tags`). Cada carta tiene **2 intercambios** (das lo de la izquierda, recibes lo de la derecha). Transcripción en el orden de `deck.cards` (índices 0–8):

| Carta | Intercambio 1 | Intercambio 2 |
|---|---|---|
| 0 | amarillo + rojo → rosa | verde + blanco → negro |
| 1 | azul + amarillo → verde | blanco + rosa → negro |
| 2 | rojo + azul → blanco | rosa + verde → negro |
| 3 | rosa → rojo + azul + amarillo | negro → rosa + verde + blanco |
| 4 | verde → rojo + azul + amarillo | negro → rosa + verde + blanco |
| 5 | blanco → rojo + azul + amarillo | negro → rosa + verde + blanco |
| 6 | rojo + rojo → azul + amarillo | rosa + rosa → verde + blanco |
| 7 | azul + azul → amarillo + rojo | verde + verde → blanco + rosa |
| 8 | amarillo + amarillo → rojo + azul | blanco + blanco → rosa + verde |

  Comprueba visualmente al menos 3 cartas contra sus imágenes (`img`) antes de darlo por bueno; si alguna no coincide, corrígela y avísalo.

## Recetas del mod y adaptación a los juegos
| Elaboración | Receta (Bonguri) | Adaptación |
|---|---|---|
| Spirit Ball | 2 negro + 1 rosa + 1 blanco | Ball con bono de captura **2,5** (Poké 3 dados = 1; Super 4 = 1,5; Ultra 5 = 2; Spirit 6 = 2,5). Crea la Ball como hasta ahora en `SIN_BALLS`. |
| Estofado Restaurador | amarillo + azul | Cura por completo a todo el equipo (como el pueblo). |
| Estofado Cautivador | verde + rojo | El próximo intento de captura en tu próximo combate salvaje cuenta como si el salvaje tuviera un estado (bono 1,5 si no tiene ninguno; si ya tiene, sin cambio). |
| Estofado Sabroso | blanco + amarillo | +3 movimientos este turno y los Pokémon Alfa revelados este turno **no** te obligan a combatir (el escondite queda revelado y se puede combatir buscando en él después). |
| Estofado Infundido | rosa + blanco | (En el mod reduce el coste de evolución en PV; aquí la evolución es por nivel.) Un Pokémon del equipo **sube 1 nivel** al instante como con un Caramelo Raro, con el flujo normal de ataques y evolución. |
| Cristal Explosivo | 3 rojo + 2 amarillo + 1 negro | **Casco Dentado** (`rockyhelmet`). |
| Escudo Estrella | 3 azul + 2 rosa + 1 negro | **Banda Focus** (`focussash`). |
| Huevo Suerte | 3 amarillo + 2 verde + 1 negro | **Huevo Suerte** (`luckyegg`): su portador recibe **×1,5 de EXP** (aplícalo en el cálculo de EXP de Sinnoh). |
| Mineral Evol | 3 rosa + 2 blanco + 1 negro | **Mineral Evolutivo** (`eviolite`). |
| Cinta Veloz | 3 verde + 2 azul + 1 negro | **Garra Rápida** (`quickclaw`). |
| Cinta Elección | 3 blanco + 2 rojo + 1 negro | **Cinta Elección** (`choiceband`). |

Los objetos de batalla fabricados van a `run.items` y se equipan con el sistema de la tarea 11. Nombres en español con `esItem()`.

## Archivos que se pueden tocar
- Editar: `sinnoh.js`, `docs/sinnoh.md` (sección de la decisión: Ginkgo, vuelo, recetas y adaptaciones) y `AGENTS.md` (solo el punto de Sinnoh en "Pendiente").

## NO tocar
- `batalla.js`, `ps.js`, `data.js`, `sinnoh_datos.js`, `spr/*`, `sw.js`, ni ningún otro archivo. No uses `data-pick`. No cambies nada fuera de `ST.sin`.

## Qué hacer
1. **Ginkgo:** `run.ginkgo` = índice de la carta actual (al azar en partida nueva o al migrar). En un pueblo o campamento, la ficha muestra "Comerciar con Ginkgo" (una vez por turno, `run.traded`): panel con la imagen de la carta actual y los 2 intercambios como botones (deshabilitados si faltan Bonguri). Al comerciar: descuenta y suma, roba otra carta al azar (distinta si se puede), guarda. Reemplaza el botón "(próximamente)" del campamento.
2. **Vuelo:** en un pueblo (no campamento), "Volar (1 Bonguri)" (una vez por turno, `run.flown`): elegir pueblo destino (los 8 pueblos de la tabla de la tarea 5, sin el actual; deshabilitados si están en `run.grunts` o si el actual lo está) y qué Bonguri descartar. Mueve la ficha al pueblo destino, centra la cámara y no gasta movimientos. Muestra los nombres de pueblo en español.
3. **Elaboración en la Bolsa:** sección Balls (añade Spirit Ball), sección Estofados (4, cada uno una vez por turno con `run.stews`, con explicación corta de su efecto) y sección Objetos de batalla (6). Botones deshabilitados si faltan Bonguri o ya se usó el estofado este turno. El Infundido pide elegir el Pokémon. La pantalla de lanzamiento de Balls en combate incluye la Spirit Ball.
4. "Terminar turno" reinicia `traded`, `flown` y `stews` (y lo que corresponda del Sabroso).

## Cómo probar
- Node: tabla Ginkgo (9 cartas × 2), recetas y descuentos, efectos de estofados (incluido el nivel extra del Infundido con aprendizaje/evolución), bono del Cautivador en la fórmula de captura, Huevo Suerte ×1,5 de EXP.
- Navegador (`python -m http.server 8000` → `http://localhost:8000/batalla.html` → Leyendas de Sinnoh): comerciar en un pueblo y en un campamento, volar entre pueblos, fabricar cada cosa con Bonguri dados por consola, equipar un objeto de batalla y combatir. Revisa la consola: sin errores.

## Terminado cuando
- Ginkgo y vuelo funcionan con sus límites por turno; los campamentos comercian pero no permiten volar.
- Se fabrican la Spirit Ball, los 4 estofados y los 6 objetos con las recetas del mod y sus adaptaciones.
- Todo persiste al recargar; partidas antiguas se migran.

## Al terminar
Resume en español: cambios, verificación de la tabla Ginkgo contra las imágenes, cómo lo probaste y dudas.
