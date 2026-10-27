# Tarea 7: EXP, niveles, ataques y estadísticas como en los juegos de Pokémon

## Objetivo
Que cada combate ganado en Leyendas de Sinnoh dé **EXP como en los juegos reales**, que los Pokémon **suban de nivel según su ritmo de crecimiento**, **aprendan los mismos ataques por nivel** que en los juegos (datos de `data.js`) y ganen **EVs**; sin cambiar el resto del juego.

## Decisión del dueño (anótala en la documentación)
- Se mantiene la mecánica actual del juego (mapa, movimiento, búsqueda en árboles/arrecifes con las cartas del mod, combates, pueblos, turnos).
- Las mecánicas propias del juego de mesa (Bonguri, Puntos de Viaje, captura con cartas, Destino, santuarios, campaña…) quedan **aparcadas**. Los datos del mod (`sinnoh_datos.js`, `spr/sinnoh_*.bin`, `generar.py`) **se conservan sin cambios** por si más adelante se quiere replicar el juego tal cual.
- La progresión de los Pokémon es **como en los juegos reales** (EXP, niveles, ataques, EVs; la evolución va en la tarea 8).

## Contexto
- Rama `sinnoh`, solo local. No ejecutes comandos `git` que escriban.
- Lee `AGENTS.md`, `docs/sinnoh.md` y el `sinnoh.js` actual (tareas 5 y 6: `ST.sin.run.team`, `sinInitialSet`, `sinResult`, `sinEndHTML`, PS persistentes con `hpNow`/`hpMax`/`status`).
- **Datos en `data.js`** (`D.P`, una entrada por especie; buscar por `c` = id en mayúsculas, p. ej. `"CHIMCHAR"`, que coincide con `toID(especie).toUpperCase()`; formas regionales pueden no estar: en ese caso usa la especie base):
  - `be`: EXP base que da al ser derrotado.
  - `gw`: ritmo de crecimiento, con nombres de Essentials: `Fast` (Rápido), `Medium` (Medio-Rápido), `Parabolic` (Medio-Lento), `Slow` (Lento), `Erratic` (Errático), `Fluctuating` (Fluctuante).
  - `evs`: EVs que da, texto tipo `"SPEED,1"` o varios separados (revisa el formato real; las claves de stat son `HP, ATTACK, DEFENSE, SPECIAL_ATTACK, SPECIAL_DEFENSE, SPEED`).
  - `gr`: proporción de sexo (`Female50Percent`, `FemaleOneEighth`, `AlwaysMale`, `Genderless`…).
  - `lv`: ataques por nivel `[[nivel, "IDMOVIMIENTO"], …]`. El id de Showdown es `toLowerCase()` de ese id. Nivel 0 = ataque al evolucionar (eso lo usa la tarea 8).
- `calcStat(sp, set, k)` de `batalla.js` calcula estadísticas (incluida PS).

## Archivos que se pueden tocar
- Editar: `sinnoh.js`, `docs/sinnoh.md`, `AGENTS.md` (solo la sección de Leyendas de Sinnoh en "Pendiente" y "Estado actual" si corresponde).

## NO tocar
- `batalla.js` (si de verdad necesitas algo, detente y explica por qué en tu resumen en vez de cambiarlo), `sinnoh_datos.js`, `spr/*`, `data.js`, `ps.js`, `sw.js`, ni ningún otro archivo.
- No cambies la búsqueda, los niveles de los salvajes (`SIN_WILD_LEVELS`), el movimiento, los turnos ni la curación.

## Qué hacer
1. **Curvas de EXP:** función `sinExpForLevel(gw, n)` con las 6 fórmulas oficiales (EXP total necesaria para el nivel n; Errático y Fluctuante son por tramos). Nivel máximo 100. Pruébala con valores conocidos (p. ej. nivel 100: Rápido 800.000, Medio-Rápido 1.000.000, Medio-Lento 1.059.860, Lento 1.250.000, Errático 600.000, Fluctuante 1.640.000).
2. **Datos nuevos en cada set del equipo:** `exp` (EXP total) y `gender` fijo. Al cargar una partida antigua sin `exp`, inicialízalo con `sinExpForLevel(gw, nivel)`; si no tiene `gender`, sortéalo una vez según `gr` y guárdalo (así deja de cambiar de sexo entre combates). Los IVs del inicial ya creado se quedan como están.
3. **Sets nuevos (inicial de una partida nueva y salvajes):**
   - Ataques: los **últimos 4 aprendidos por nivel hasta su nivel según `data.js` `lv`** (en orden de nivel, sin repetir). Si la especie no está en `data.js`, usa el método actual con `Dex.learnsets`.
   - IVs al azar 0–31 en cada stat (como en los juegos). EVs en 0. Sexo según `gr`. Naturaleza al azar (como ahora).
4. **EXP al ganar** (solo al derrotar al salvaje; perder o empatar no da EXP), fórmula escalada de las generaciones V, VII, VIII y IX, combate salvaje:
   `EXP = floor( (be · Lr / 5) · ((2·Lr + 10) / (Lr + Lp + 10))^2.5 ) + 1`, donde `Lr` es el nivel del rival y `Lp` el del Pokémon que recibe.
   - **Participantes** (los que salieron a combatir, según `me.mons` del lado `p1`, como ya se asocian en la tarea 6): EXP completa.
   - **No participantes vivos** (Repartir Experiencia, como en los juegos modernos): 50 % (déjalo en una constante).
   - Debilitados (PS 0) no reciben EXP.
5. **EVs al ganar:** cada Pokémon que recibe EXP suma los EVs de `evs` del rival, con tope de 252 por stat y 510 en total.
6. **Subir de nivel:** mientras `exp` alcance el siguiente nivel, sube (puede subir varios). Al subir, la PS actual aumenta lo mismo que aumentó la PS máxima (como en los juegos): recalcula con `calcStat` antes y después.
7. **Ataques nuevos:** por cada nivel alcanzado, los ataques de `lv` de ese nivel (nivel > 0). Si tiene menos de 4, lo aprende solo. Si ya tiene 4, pregunta: elegir cuál olvidar o "No aprender". Las preguntas se hacen una por una en una pantalla después del combate.
8. **Pantalla después del combate** (antes de volver al mapa; reemplaza o amplía `sinEndHTML`/el flujo de "Volver al mapa"): para cada Pokémon, "+N EXP", "¡X subió al nivel N!" y los ataques aprendidos u olvidados, con los nombres en español (`esSp`, `esMove`). Si hay una pregunta de ataque pendiente, no se puede volver al mapa sin responderla. Lo pendiente se guarda en `ST.sin.run` para que recargar no lo pierda.
9. **Barra del equipo en el mapa:** nivel, sexo (♂/♀) y una barra fina de EXP hacia el siguiente nivel, además de la de PS que ya existe.
10. **Documentación:** en `docs/sinnoh.md`, una sección corta "Decisión: juego actual + progresión real" con lo de arriba (qué se mantiene, qué se aparca y que los datos del mod se conservan), y las fórmulas y constantes usadas. En `AGENTS.md`, actualiza el punto de Leyendas de Sinnoh en "Pendiente" para que refleje lo mismo.

## Cómo probar
- Node (cargando `ps.js`, `data.js`, `sinnoh_datos.js` y las funciones puras de `sinnoh.js` que puedas aislar): curvas con los valores de nivel 100 de arriba y algunos intermedios; EXP de un caso concreto (por ejemplo Chimchar Nv. 5 derrotando a Bidoof Nv. 4) calculada a mano; tope de EVs; aprendizaje con menos de 4 ataques y con 4.
- Navegador (`python -m http.server 8000`, `http://localhost:8000/batalla.html` → Leyendas de Sinnoh): partida nueva, buscar, combatir, ganar (`B.s.omniscient.write(">forcewin p1")`), ver la pantalla de EXP, subir de nivel y aprender un ataque. Con una partida creada antes de esta tarea, comprobar que se inicializan `exp` y `gender` sin romper nada.
- Comprueba que perder sigue devolviendo al pueblo y no da EXP.

## Terminado cuando
- Ganar da la EXP de la fórmula a quien corresponde, con EVs; los Pokémon suben de nivel con su curva; aprenden los ataques de `data.js` y se pregunta al tener 4.
- La PS sube al subir de nivel; el sexo ya no cambia entre combates.
- Recargar en medio de la pantalla de EXP o de una pregunta no pierde nada.
- La documentación refleja la decisión.
- No se tocó `batalla.js` ni nada fuera de lo permitido.

## Al terminar
Resume en español: qué cambiaste, las comprobaciones numéricas (curvas, un cálculo de EXP), cómo lo probaste y dudas.
