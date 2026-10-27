# Tarea 5: nueva partida, ficha del jugador, movimiento y turnos en Sinnoh

## Objetivo
Que al entrar a Leyendas de Sinnoh se pueda empezar una partida según las reglas del mod (elegir pueblo natal e inicial), ver tu ficha en tu pueblo, moverte por el mapa respetando la elevación y pasar turnos, con todo guardado.

## Contexto
- Rama `sinnoh`, solo local. No ejecutes comandos `git` que escriban.
- Lee `AGENTS.md`, `docs/sinnoh.md` y el `sinnoh.js` actual (tarea 4: mapa en canvas, cámara, `sinPick`, ficha de casilla, `ST.sin`).
- **Reglas del mod (reglamento, página 3):**
  - Preparación: cada entrenador elige una **carta de Pueblo natal**, elige **uno de los dos Pokémon iniciales** de esa carta y pone su ficha **en su aldea**. Luego se lee la carta **"Prólogo"** del mazo de actos.
  - Turno: puedes mover **hasta 3 casillas** por turno (+1 por cada Fragmento; todavía no hay Fragmentos, pero deja el cálculo preparado). **No puedes moverte a una casilla que esté 2 o más niveles de elevación por encima o por debajo de tu casilla actual** (es decir, cada paso exige `|l_destino − l_actual| ≤ 1`). Esa es la única restricción: el agua se puede recorrer.
  - Puedes moverte en varios tramos dentro del mismo turno hasta gastar los movimientos.
- **Un solo jugador** (decisión del dueño). Nada de hot-seat por ahora.
- **Datos ya disponibles en `SIN`:**
  - Mazo `"Home Village Cards"` (`SIN.decks`, campo `n`): 9 cartas; el color está en `gm` (Pink, Yellow, Purple, Teal, Orange, Red, White, Green, Blue). Su imagen de frente es `img`.
  - Mazo de iniciales: las cartas con la etiqueta `"Starter Card"`; especie de Showdown en `d.sp`, imagen en `img`.
  - Mazo de actos: etiqueta `"Act Card"`; el Prólogo ("La Incursión") es la carta cuyo `cid` termina en `00` (comprueba mirando las imágenes; el reverso común dice "PRÓLOGO").
  - Tokens de pueblo en `SIN.tokens` con la etiqueta `"Village Token"`, nombre `"<Pueblo> Village"` y su celda `cell`.
- **Pueblo → color → iniciales** (leído de las cartas; escríbelo como una tabla constante en `sinnoh.js`):

| Pueblo (token) | Color (`gm`) | Iniciales |
|---|---|---|
| Sinnome Village | Pink | Togepi, Budew |
| Sunyshore Village | Yellow | Shinx, Pichu |
| Eterna Village | Purple | Duskull, Litwick |
| Nesburgh Village | Orange | Starly, Machop |
| Stark Village | Red | Chimchar, Cyndaquil |
| Snowpoint Village | White | Swinub, Spheal |
| Celestic Village | Green | Turtwig, Rowlet |
| Canalave Village | Blue | Piplup, Oshawott |

  Ultra Megalopolis (Teal: Porygon, Poipole) es **solo de la campaña Ultra Explosión**: no la ofrezcas todavía.
  Nombres en pantalla en español donde existan (Pueblo Sinnome, Pueblo Marina para Sunyshore, Ciudad Vetusta para Eterna, Pueblo Nesburgh, Pueblo Stark, Ciudad Puntaneva para Snowpoint, Pueblo Caelestis para Celestic, Ciudad Canal para Canalave). Los Pokémon con `esSp()`.

## Archivos que se pueden tocar
- Editar: `sinnoh.js`.
- Si hace falta, `batalla.html` solo para estilos nuevos del modo (o pon los estilos en `sinnoh.js` como ya se hizo).

## NO tocar
- `batalla.js`, `sinnoh_datos.js`, `spr/*`, `sw.js`, ni ningún otro archivo.
- No cambies `STORE_KEY` ni la forma de lo que ya guarda `ST` fuera de `ST.sin`.

## Qué hacer
1. **Pantalla de inicio del modo:**
   - Si no hay partida (`ST.sin.run` vacío): pantalla "Nueva partida".
   - Si hay partida: entra directo al mapa, con un botón en la barra o en un menú para "Abandonar partida" (con confirmación) que borra `ST.sin.run`.
2. **Nueva partida (3 pasos, en pantalla tipo tarjetas, cómoda a 390 px):**
   1. Elegir pueblo natal: muestra las 8 cartas de Pueblo natal (imagen del mod) con el nombre en español debajo.
   2. Elegir inicial: muestra las 2 cartas de inicial de ese pueblo (imagen del mod) y el nombre en español; botón para volver al paso 1.
   3. Prólogo: muestra la carta del Prólogo (imagen) y un botón "Comenzar".
   - Al comenzar, crea `ST.sin.run = {v: 1, village, color, pos: [c, r], team: [set del inicial], turn: 1, moved: 0, frag: 0}` y `save()`.
   - El set del inicial: `blankSet(especie)` de `batalla.js` con **nivel 5**, y como movimientos los **últimos 4 aprendidos por nivel hasta el nivel 5** (de `Dex.learnsets.get(id)`: entradas tipo `"9L5"`; usa la generación más reciente que tenga datos de nivel para esa especie). Si tiene menos de 4, los que haya. Sin EVs; IVs como deja `blankSet`; naturaleza al azar.
3. **Ficha del jugador en el mapa:** un marcador redondo del color del pueblo (usa un color legible para cada `gm`), con borde blanco y la imagen o ícono del inicial dentro (puedes usar `img()`/`icoKey` de `batalla.js`, o la imagen de la carta). Siempre por encima de los tokens. Al empezar o al volver al modo, la cámara se centra en la ficha (sin perder la cámara guardada si el jugador ya la movió en esta partida; usa tu criterio y explícalo).
4. **Movimiento:**
   - Movimientos del turno: `3 + run.frag`. Restantes: `max − run.moved`.
   - Calcula las casillas alcanzables con una búsqueda por anchura desde `pos`, usando los 6 vecinos en coordenadas dobles `(c±1, r±1)`, `(c, r±2)`, solo celdas que existan en `SIN.hexes`, con la regla de elevación paso a paso, y como máximo los movimientos restantes.
   - Resalta las alcanzables (un tinte claro y borde) mientras haya movimientos.
   - Tocar una casilla alcanzable mueve la ficha ahí (puedes animarla brevemente por el camino), suma los pasos usados a `run.moved` y guarda. Tocar cualquier casilla sigue mostrando su ficha de información (la de la tarea 4); si es alcanzable, la ficha tiene además un botón "Moverme aquí (N)". Elige uno de los dos modos de interacción y explícalo; lo importante es que no se mueva por accidente al tocar para mirar.
4. **Barra de turno** (abajo o arriba, que no tape el mapa en celular): "Turno N · Movimientos: R/M", el equipo (ícono y nivel del inicial) y un botón "Terminar turno" que hace `turn++`, `moved = 0`, guarda y recalcula.
5. **Corrección pendiente de la tarea 4:** en la ficha de casilla, no muestres "Bioma: Sin especificar · Clima: Sin especificar · Encuentro: Sin especificar"; muestra solo los datos que el token tenga.

## Cómo probar
- `python -m http.server 8000` y `http://localhost:8000/batalla.html` → Leyendas de Sinnoh.
- Nueva partida → elegir pueblo → inicial → Prólogo → la ficha aparece en el pueblo correcto (por ejemplo Stark Village está en la celda `[7, 11]`, Canalave en `[-8, -2]`).
- Las casillas alcanzables respetan 3 pasos y la elevación (busca una casilla vecina con 2 niveles de diferencia y comprueba que no se ofrece).
- Recargar la página mantiene la partida, la posición y el turno.
- Comprueba con Node (cargando `ps.js`, `sinnoh_datos.js` y la lógica pura que puedas aislar) el cálculo de alcanzables y los movimientos del inicial a nivel 5 de al menos 3 especies.
- Sin errores en consola (`node --check sinnoh.js` como mínimo).

## Terminado cuando
- Se puede crear una partida siguiendo los 3 pasos, con 8 pueblos y sus 2 iniciales correctos.
- La ficha aparece en su pueblo, se mueve con la regla de 3 casillas y de elevación, y "Terminar turno" funciona.
- Todo persiste al recargar; "Abandonar partida" vuelve a la pantalla de inicio.
- La ficha de casilla ya no muestra campos "Sin especificar".
- Los demás modos de batalla no cambiaron.

## Al terminar
Resume en español: qué cambiaste en `sinnoh.js` (y estilos si tocaste `batalla.html`), qué decidiste en los puntos marcados como "tu criterio", cómo lo probaste (incluye ejemplos de movimientos del inicial a nivel 5) y dudas.

## Reintento 1: correcciones visuales (solo `sinnoh.js`)
La revisión en navegador (capturas a 390 px) mostró que la lógica funciona, pero:
1. **La ficha del jugador se confunde con los tokens del mod**: parece uno más de los círculos. Hazla claramente distinta: más grande (aprox. 75–85 % del hexágono), con un anillo grueso del color del pueblo y borde blanco, una sombra suave y, dentro, el **ícono del Pokémon inicial** (no la imagen de la carta). Para el ícono usa lo que ya existe en `batalla.js`: `assetURL("Ico", icoKey(especie))` da la imagen de íconos de Essentials (es una tira de 2 cuadros; dibuja solo el primer cuadro, la mitad izquierda) y, si no hay, la ilustración de `img(especie)`. Agrega un pequeño "pulso" o anillo animado suave alrededor de la ficha mientras queden movimientos, solo si no complica el redibujado (si lo haces, que no redibuje sin parar cuando la pestaña está oculta).
2. **Las casillas alcanzables casi no se ven.** Resáltalas con claridad: relleno blanco semitransparente (~30 %) y borde de 2–3 px del color de acento (`--accent`), sin tapar los tokens. Las no alcanzables quedan igual.
3. En la barra de turno, muestra también el **ícono del Pokémon** (con `pimg()` de `batalla.js`, que ya lo hidrata solo) en vez del recorte de la carta.
No cambies la lógica de movimiento, turnos ni guardado.
