# Tarea 17: Batallas Enjambre (Puertas de Distorsión) y Sellos de Viaje

(Corresponde a la tarea 19 del plan.)

## Objetivo
Agregar las **Batallas Enjambre** en las 4 Puertas de Distorsión (3 salvajes seguidos) y la **planilla de 7 Sellos de Viaje** con sus recompensas por hito, adaptadas a los juegos.

## Contexto
- Rama `sinnoh`, solo local. No ejecutes comandos `git` que escriban.
- Lee primero `.tareas/plan-sinnoh-completo.md`, `AGENTS.md`, `docs/sinnoh.md` y `sinnoh.js` (tareas 5–16). Ya existen: combates salvajes de **un** rival (`run.battle.wild`), combates de entrenador de varios rivales (`run.battle.trainer`, EXP por rival), captura en combate (`sinThrowBall`, hoy contra `run.battle.wild`), huida (`sinOnFaint`), PV, Bonguri, objetos (`run.items`, `set.item`), mano de Destino (`run.fate`, imágenes `c373300` Dialga / `c373301` Palkia / `c373302` Giratina / `c373303` Arceus), legendarios capturados (`set.tier === "L"`), `run.discard`, cola de aprendizaje y `sinTeachSignature`, cartas Pokémon con `d.sp`, `tier`, `b`, `k` y su movimiento característico (función de la tarea 10).
- **Reglas del mod (reglamento p. 12 y 15):**
  - **Batalla Enjambre:** en una **Puerta de Distorsión** (4 en la región, en el continente): Snowdrift (Pokémon de bioma **Llanura**), Lilly (**Montaña**), Westbreeze (**Océano**), Deepmarsh (**Bosque**). Se activa con "Buscar" en la puerta. Pelea contra **1 Débil, 1 Moderado y 1 Fuerte** del bioma de la puerta, que entran **en ese orden** y forman su propio equipo; **no huyen** tras debilitar a uno tuyo. Si derrotas o capturas a los 3: **7 PV** en total (no hay PV por cada uno). Si pierdes, no ganas PV.
  - Tokens: en `SIN.tokens`, `kind: "Custom_Tile"` con la etiqueta `"Distortion Gate"` y **sin** la etiqueta `"Distortion World"` (las del Mundo Distorsión son de Ultra Explosión): Westbreeze `[-11,-5]`, Deepmarsh `[4,-8]`, Snowdrift `[-2,12]`, Lilly `[10,4]`; bioma en `b`.
  - **Sellos de Viaje** (se consiguen en cualquier orden, una vez cada uno, y se conservan):
    1. Fallar la captura de un Pokémon salvaje **2 turnos seguidos** en un combate.
    2. Ganar una batalla contra **otro entrenador** o un **Ultraente**.
    3. Tener al menos **1 Bonguri de cada tipo** en la bolsa.
    4. Haber **capturado un Pokémon Legendario**.
    5. Tener **3 o más objetos equipados** en tu equipo.
    6. Salir victorioso de una **Batalla Enjambre**.
    7. Tener **3 cartas de Cambio de Destino diferentes** en la mano.
  - **Recompensas por hito** (según cuántos sellos tengas, se reclaman al alcanzarlo): 1) 1 Bonguri Rojo + 1 Azul + 1 Amarillo; 2) robar al azar **5 cartas de Pokémon Débiles**, guardarlas y poder enseñar sus movimientos a tus Pokémon; 3) 1 Rosa + 1 Verde + 1 Blanco; 4) 5 cartas de **Moderados** (igual); 5) **3 Bonguri Negros**; 6) 5 cartas de **Fuertes** (igual); 7) **Pergamino de Nobleza**: permite usar la **Forma Noble** (Estado 2) de cualquier Pokémon inicial completamente evolucionado.

## Adaptación a los juegos
- **Enjambre:** un solo combate `newBattle(equipoVivo, [débil, moderado, fuerte], {sin: true, aiDiff: "normal", pre, foeName: "Enjambre", intro: "¡Un enjambre de Pokémon salvajes sale de la Puerta de Distorsión!", bgm: "bgm_boss"})` (en el modo de un salvaje la IA ya cambia al siguiente cuando cae uno). Cartas: Débil/Moderado/Fuerte con `b` igual al bioma de la puerta (cualquier clima). Niveles de `SIN_WILD_LEVELS`. EXP por cada rival derrotado (sin bono de entrenador). **Captura permitida** contra el rival activo (generaliza la captura: el capturado sale del equipo rival con `>eval` o, si es más simple, se cuenta como derrotado para el combate y se une a tu equipo al final; elige lo más robusto y explícalo). Sin Bonguri. Los derrotados van a `run.discard`. Ganar: 7 PV + Sello 6. Una vez por turno y termina el turno, como cualquier combate.
- **Sello 2 en solitario:** cuenta ganar contra Reclutas, Comandantes o Helio (y contra Ultraentes cuando existan, tarea 22).
- **Recompensas 2/4/6 (cartas de Pokémon):** robar 5 cartas al azar del nivel indicado (solo cartas con movimiento característico existente en Showdown) y guardarlas en `run.tms` como **"MT" del mod**: fuera de combate, en la Bolsa, sección "Movimientos de cartas", se puede enseñar su movimiento a cualquier Pokémon del equipo (usa la cola de aprendizaje existente). Cada carta se puede usar sin límite (como las MT modernas).
- **Pergamino de Nobleza:** si un inicial completamente evolucionado tiene una forma alternativa en Showdown (p. ej. `Typhlosion-Hisui`, `Samurott-Hisui`, `Decidueye-Hisui`), en la Bolsa se puede **cambiar entre ambas formas** fuera de combate (conservando todo como en el Intercambio Equivalente, con su habilidad de ranura 0). Si no tiene forma alternativa (Infernape, Empoleon, Torterra…), el pergamino le da **IVs 31 en todo** (como el Entrenamiento Extremo). Usar el pergamino en un Pokémon es definitivo; hay un solo pergamino.

## Archivos que se pueden tocar
- Editar: `sinnoh.js`, `docs/sinnoh.md` (Enjambre, Sellos y adaptaciones) y `AGENTS.md` (solo el punto de Sinnoh en "Pendiente").

## NO tocar
- `batalla.js` (si de verdad falta un enganche para capturar en un combate de varios salvajes, detente y explícalo), `ps.js`, `data.js`, `sinnoh_datos.js`, `spr/*`, `sw.js`, ni ningún otro archivo. No uses `data-pick`. No cambies nada fuera de `ST.sin`.

## Qué hacer
1. **Puertas:** dibuja/resalta las 4 puertas del continente; en su casilla, "Batalla Enjambre" (mismas condiciones que buscar: una vez por turno, equipo vivo). Al combatir, guarda las 3 cartas en `run.battle` (recargar no las cambia). Resultado: 7 PV si derrotas/capturas a los 3; Sello 6.
2. **Sellos:** `run.stamps` (lista de los 7, con fecha/turno). Comprueba cada condición en el momento en que ocurre (tras un combate, al cambiar la bolsa, al equipar, al robar Destino, al capturar). Para el Sello 1, cuenta los fallos de captura por turno dentro del combate actual.
3. **Planilla:** botón "Sellos" en la barra (o dentro de Campaña): los 7 sellos con su condición en español y si están conseguidos, y la fila de recompensas 1–7 indicando cuáles se reclamaron. Al conseguir un sello, se reclama automáticamente la recompensa del hito alcanzado y se muestra un aviso.
4. **"MT" de cartas:** sección en la Bolsa con las cartas guardadas (imagen, especie y movimiento) y "Enseñar a…".
5. **Pergamino de Nobleza:** sección en la Bolsa cuando lo tengas, con los iniciales completamente evolucionados del equipo y la acción que corresponda.
6. Partidas antiguas: inicializa `stamps`, `tms`; comprueba de inmediato los sellos que ya se cumplan (p. ej. Bonguri de cada tipo, legendario capturado).

## Cómo probar
- Node: elección de las 3 cartas por bioma, 7 PV solo con victoria completa, cada condición de sello, orden de recompensas, "MT" con la cola de aprendizaje, Pergamino (forma Hisui y caso IVs 31).
- Navegador (`python -m http.server 8000` → `http://localhost:8000/batalla.html` → Leyendas de Sinnoh): Batalla Enjambre en una puerta (gana con `B.s.omniscient.write(">forcewin p1")`), capturar a uno del enjambre (forzando `Math.random` en la consola), ver los Sellos y recompensas, enseñar una "MT". Revisa la consola: sin errores.

## Terminado cuando
- Las 4 puertas ofrecen Batalla Enjambre con sus reglas; se puede capturar en ella.
- Los 7 sellos se detectan y dan sus recompensas en orden; las "MT" y el Pergamino funcionan.
- Todo persiste al recargar; partidas antiguas se migran.
- No se tocó `batalla.js` ni nada fuera de lo permitido.

## Al terminar
Resume en español: cambios, cómo resolviste la captura con varios salvajes, cómo lo probaste y dudas.
