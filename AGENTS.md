# AGENTS.md — Mi Dex (DexPoke)

Responde siempre en español: los mensajes, los resúmenes, los commits y los comentarios nuevos en el código.

## Proyecto

**Mi Dex** es una Pokédex personal en español, instalable en el celular como app web (PWA) y publicada en GitHub Pages (`alenae1993/DexPoke`). Nació del informe de Power BI `Pokemon_BI.pbix` del dueño. También trae un simulador de batallas con el motor de Pokémon Showdown y los gráficos, sonidos y animaciones de su fangame de Pokémon Essentials.

Hay además un juego en preparación: **Leyendas de Sinnoh**, una adaptación del mod de Tabletop Simulator que usa las batallas de Mi Dex (ver `docs/sinnoh.md`).

Sitio publicado: https://alenae1993.github.io/DexPoke/

## Estructura

Todo es estático: no hay servidor, compilación ni dependencias npm en tiempo de ejecución. Cada página carga sus scripts con `<script src>`, en orden, y los scripts comparten variables globales.

### Páginas y código de la app

| Archivo | Para qué sirve |
|---|---|
| `index.html` | **La Pokédex completa**: HTML, CSS y JS en un solo archivo. Contiene las pestañas Pokédex, Movimientos, Habilidades y Comparar, la ficha de cada Pokémon, el simulador de IVs/EVs, la tabla de tipos, los filtros por tier, las tarjetas "Competitivo" (`compCard`) y "Pokémon Champions" (`champCard`), y los efectos de habilidades escritos a mano (`const AFX=`). Guarda sus filtros en `localStorage["pkdx"]`. |
| `batalla.html` | Página de batalla: estilos y orden de carga de los scripts. |
| `batalla.js` | Capa de batalla sobre Showdown: menú, editor de equipos, dibujo de la escena, traducción al español de los mensajes del motor, IA de la CPU (`aiDecide`), sonido, fondos, sprites y modo Desafío. Guarda todo en `localStorage["midex-batalla-v1"]`, en el objeto `ST`. |
| `escalada.js` | Modo Escalada: empieza 1 vs 1 y tras cada victoria recluta un Pokémon del rival, hasta 6 vs 6. Se engancha a `batalla.js` mediante `renderEsc`, `escResult` y `escEndHTML`, y guarda en `ST.esc`. |
| `competitivo.js` | Modo Competitivo: formatos de Smogon y BSS, validador, sets de ejemplo y aplicación de sets en el editor (incluidos los de Champions, con la conversión de SP a EVs). |
| `anim.js` | Reproductor de las animaciones de ataques de Essentials sobre canvas. |
| `sw.js` | Service worker. Primero intenta la red; si tarda más de 4 s, usa la copia guardada. Las imágenes se guardan la primera vez que se ven y los paquetes `spr/` los guarda la propia página. **Sube el número de `APP` (`midex-app-vN`) cada vez que cambies archivos de la app.** |
| `manifest.webmanifest`, `icons/`, `fonts/pkmndp.ttf`, `.nojekyll` | Datos de instalación de la PWA, íconos y la fuente del cuadro de texto de batalla. |

### Datos generados: no editar a mano

| Archivo | Contenido | Cómo se genera |
|---|---|---|
| `data.js` (2,2 MB) | `const D={P,M,A,...}`: Pokémon, movimientos, habilidades, evoluciones y textos en español. | `python herramientas/actualizar_datos.py Pokemon_BI.pbix` (usa pbixray, pandas y PokeAPI). |
| `ps.js` (7,7 MB) | Bundle de `@pkmn/sim` 0.10.11, el motor de Pokémon Showdown (licencia MIT, ver `LICENCIA-motor-batalla.txt`). Expone `PS`. | Bundle del paquete npm. El script que lo armó no se conservó. |
| `esx.js` | Traducciones extra al español de movimientos, objetos, naturalezas y descripciones (`ESX`). | Generado; el script no se conservó. |
| `comp.js`, `tiers.js` | Sets de Battle Factory/BSS (`COMP`) y tiers de Smogon (`TIER`) sacados del motor. | Generado; el script no se conservó. |
| `champions.js` | Tiers y 253 sets de Pokémon Champions sacados de la Strategy Pokédex de Smogon (`CHAMP`). | Lo generaba `build_champ.js`, que no se conservó. |
| `reto.js` | Entrenadores del modo Desafío (Kanto: 8 líderes, Alto Mando, el campeón Azul y Rojo) con sets de la EstrategiaDEX de pokemaster.es (`RETO`). | Generado; el script no se conservó. |
| `sprites.js` | Índice de sprites animados (`SPR`) dentro de `spr/Front_*`, `Back_*`, `FrontShiny_*` y `BackShiny_*`. | Empaquetado desde la carpeta `Graphics/Battlers` del juego del dueño. |
| `assets.js` | Índice (`ASSET`) de fondos (BG), gritos (Cry), íconos (Ico), objetos (Itm), animaciones (Anim), gráficos de animación (AG) y sus sonidos (ASE) en `spr/a*.bin`. | Empaquetado desde su carpeta `JUEGO` (Essentials). |
| `animidx.js` | Qué animación usa cada ataque y las animaciones de respaldo por tipo y categoría (`ANIMIDX`). | Generado desde `PkmnAnimations.rxdata`. |
| `spr/*.bin` (104 MB) | Paquetes de recursos. | Cada uno empieza con el encabezado de 16 bytes `MIDEXPAK` (8 bytes de texto más 8 en cero), y luego vienen los archivos pegados. El índice da `[paquete, inicio, bytes, …]`; `inicio` ya cuenta el encabezado. |
| `audio/*.mp3` | Música y efectos de combate. | Convertidos desde `Audio/BGM`, `Audio/ME` y `Audio/SE` del juego. |

### Herramientas y documentación

| Archivo | Para qué sirve |
|---|---|
| `herramientas/actualizar_datos.py` | Regenera `data.js` desde el `.pbix`. Las correcciones que aplica están descritas en `LEEME.md`. |
| `herramientas/sinnoh/extraer_mod.py` | Extrae del mod de Leyendas de Sinnoh el mapa, los tokens, las cartas y los nombres de sus imágenes. |
| `herramientas/sinnoh/vista_mapa.py` | Dibuja un PNG del mapa hexagonal para revisarlo. |
| `docs/sinnoh.md` | Reglas del juego de mesa, lo que ya se extrajo del mod y el plan del juego. |
| `LEEME.md` | Manual de usuario: publicar, instalar y explicar cada modo. Mantenlo al día cuando agregues funciones. |
| `.tareas/` | Tareas para el Modo 1 (`tarea-N.md`). |

## Estado actual (todo publicado y funcionando)

- **Pokédex**
  - 1.025 Pokémon con megas, Gigamax y formas regionales.
  - Movimientos con el % de sus efectos y habilidades con sus efectos numéricos.
  - Comparador, simulador de IVs/EVs/naturaleza y debilidades.
  - Filtros por tipo, generación, forma y tier (Smogon y Champions).
  - Funciona sin internet.
- **Batalla**, con el motor Showdown Gen 9:
  - Batalla rápida y Mi equipo vs CPU.
  - Editor de equipos completo, con importar/exportar en formato Showdown y "Sugerir movimientos".
  - Megaevolución, teracristalización y Dinamax (este último opcional).
  - Fichas en batalla.
  - CPU en fácil, normal o difícil.
  - Velocidad del texto ajustable.
- **Modo Desafío Kanto:** 14 entrenadores (8 líderes, 4 del Alto Mando, el campeón Azul y Rojo en el Monte Plateado), elegibles libremente (`retoUnlocked` devuelve `true` a propósito), con medallas, megas de los líderes y música y fondos propios.
- **Competitivo:** BSS, Ubers, OU, UU, RU, NU, PU, ZU y National Dex OU, con validador y sets de ejemplo.
- **Pokémon Champions:** tier de 349 Pokémon y 253 sets en 5 formatos, visibles en la Pokédex y cargables en el editor.
- **Recursos del juego del dueño:**
  - Sprites animados de frente y espalda, normales y variocolor.
  - Fondos de combate según el rival y la hora del día.
  - Gritos, música y efectos de sonido.
  - Íconos de Pokémon y de objetos.
  - 1.072 animaciones de ataques.
- **Modo Escalada** (lo último que se agregó).
- **Service worker:** la versión `midex-app-v14` va primero a la red y recarga la página sola cuando hay versión nueva.

## Pendiente (en orden de prioridad)

1. **Confirmar con el dueño que en su celular ya aparece el Modo Escalada** después de la actualización del service worker (v14). Si no aparece, revisa `sw.js` antes de tocar otra cosa.
2. **Escalada más equilibrada**, pendiente de que el dueño elija una opción:
   - (a) Sin legendarios ni míticos hasta cierta ronda.
   - (b) Rivales por tiers progresivos: RU/UU al principio y luego OU y Ubers.
   - Hoy los Pokémon salen de `gen9randombattle`, que incluye legendarios desde la ronda 1.
3. **Leyendas de Sinnoh**, el proyecto grande. Plan detallado en `docs/sinnoh.md`. En resumen:
   - **Solo local: Leyendas de Sinnoh vive solo en la rama `sinnoh` del PC del dueño. No se sube a GitHub y el sitio publicado no la incluye.**
   - **Decisión del dueño:** mantener el juego actual (mapa, movimiento, búsqueda en árboles/arrecifes con cartas del mod, combates, pueblos y turnos) y progresión como en los videojuegos.
   - **Hecho en local:** recursos del mod, mapa táctil, iniciales, turnos, búsqueda y combates con PS y estados persistentes. EXP con las seis curvas, niveles, EVs, sexo fijo y ataques por nivel con decisiones de aprendizaje guardadas. La tarea 8 agrega amistad y evolución por nivel, hora, sexo, amistad (umbral 160) o ataque conocido, con cancelación y aprendizaje de ataques de evolución persistentes. La tarea 9 agrega Bolsa, 3 Poké Balls iniciales (también al migrar partidas antiguas), 3 Bonguri por victoria o captura en árboles/arrecifes y fabricación de Poké/Super/Ultra Balls con las recetas del mod. Captura durante el combate con fórmula VI–VII: fallar pierde el turno; acertar entrega EXP/EVs y conserva el set, PS y estado del salvaje. La tarea 10 agrega PV como moneda (1/2/3/4 por nivel de encuentro y +2 al debilitar), enseñanza opcional y persistente del movimiento de la carta tras debilitar, huida de salvajes no legendarios al debilitar a uno tuyo con 2/1/0 Bonguri y sin EXP/PV, 3 espacios de equipo +1 por Fragmento (máximo 6; Ultra preparado para 6) y Caja en pueblos para dejar, sacar e intercambiar, conservando al menos un Pokémon vivo. Las capturas sin espacio van a la Caja y las partidas antiguas conservan sus integrantes y reciben PV iniciales en 0. Sinnoh no permite Tera ni Dinamax; los otros modos siguen iguales.
   - **Tarea 11 en local:** escondites barajados por grupo (regulares/especiales) y guardados por casilla, con revelación de todo el camino. Alijos de 1/2/3 Bonguri por color; campamentos permanentes con curación una vez por turno y comercio Ginkgo pendiente; estrellas con mano de Destino de máximo 5 y robo adicional por cada 4 estrellas al terminar el turno. Alfa obligatorios: Fuerte +5 niveles, IVs 31, ratio de captura ×0,5, sin huida al debilitar a uno tuyo y 4 PV (+2 al debilitar); la captura conserva la marca Alfa, visible en barra y Caja. Artefactos en la Bolsa, equipables y removibles, con intercambio del objeto anterior al inventario; los propios se registran en el motor al cargar y potencian dos tipos un 20 %, y las tres esferas usan objetos reales. Todo persiste y se migran partidas antiguas. Los datos extraídos contienen 6 Alfa y 11 artefactos.
   - **Pendiente de evolución:** uso de objetos para evolucionar, intercambio y demás métodos especiales (`LevelRain`, `LevelWalk`, `LevelCoins`, etc.).
   - **Tarea 12 en local:** Ginkgo en pueblos y campamentos, una vez por turno, con imagen y dos intercambios de su carta persistente; después sortea otra distinta. Vuelo entre los ocho pueblos por 1 Bonguri elegido, una vez por turno y sin gastar movimientos; preparado el bloqueo por `run.grunts` (vacío hasta la tarea 13). Bolsa con Spirit Ball (2 negros + rosa + blanco, bono 2,5), cuatro estofados de uso instantáneo y una vez por tipo y turno: curación completa, bono de estado en el primer intento de captura del próximo combate salvaje, +3 movimientos y Alfa opcionales al revelarse ese turno, o +1 nivel con aprendizaje/evolución persistentes. Seis objetos fabricables y equipables usan Casco Dentado, Banda Focus, Huevo Suerte (EXP ×1,5 en Sinnoh), Mineral Evolutivo, Garra Rápida y Cinta Elección. Todo persiste y se migran las partidas antiguas; los campamentos no permiten volar.
   - **Tarea 13 en local:** campaña Corazón de Sinnoh con acto y bono permanente de movimientos guardados. Partidas nuevas y antiguas sin campaña empiezan el Acto I con 3 Bonguri Rojos y Reclutas en el pueblo natal, una sola vez; bloquean el vuelo en ambos sentidos y permiten curar/comerciar. Marcador G y panel Campaña con carta, objetivo y estado. Desafío contra dos Reclutas distintos al azar, niveles 9–12, IA normal y música de entrenador, conservados al recargar. EXP ×1,5 por rival, sin captura, huida del salvaje, Bonguri, PV ni movimiento característico. Vencer libera el pueblo y da +2 movimientos por turno, marca Acto II y muestra su carta; perder conserva los Reclutas y permite reintentar con otra pareja tras recuperarse. Plan B y Retribución Galáctica omitidas por depender de dados. Pruebas Node superadas; revisión visual en celular y consola pendiente por falta de acceso autorizado al navegador.
   - **Tarea 14 en local:** campaña Corazón de Sinnoh completa hasta el Final. Venus, Ceres y Saturno en los lagos, en cualquier orden: 2/3/4 de sus 5 Pokémon según Fragmentos, niveles 16–18/20–22/24–26, IA difícil y `bgm_boss`. Cada victoria guarda Emoción/Conocimiento/Voluntad y suma un espacio y un movimiento; con los tres pasa al Acto III. Ofrenda de 1 Bonguri elegido en el Santuario Origin para restaurar el Corazón, sin gastar Fragmentos y preparada para bloquearse con `run.originGod`. Corazón equipable `heartofsinnoh`: +20 % a movimientos del tipo del usuario en el motor real. Helio en el Templo: 6 de 8, niveles 36–40 (Arceus 42), IA difícil y `bgm_final`; vencer muestra el Final. Héroe guarda victoria y resumen de turnos, equipo, PV y capturas; permite seguir explorando o empezar otra partida. Traidor deshabilitado por requerir otros entrenadores. Mapa y panel Campaña muestran objetivos y progreso; combates, recompensas y decisiones persisten. Derrotas permiten otro sorteo en otro turno. Pruebas Node y daño con semilla fija superados; revisión visual en celular y consola pendiente porque el acceso a Google Chrome fue rechazado.
   - **Tarea 15 en local:** ofrendas una vez por turno en los 20 santuarios, grado según Bonguri, mazo persistente de 35 cartas y rebarajado de descartes; ofrenda mayor por 7 PV para elegir 2 de 3. Los 15 frentes se contrastaron con sus imágenes y coinciden con la transcripción. Eventos con elecciones persistentes: Bonguri por color, Balls, PV, Destino, Banquete gratuito sin gastar el uso habitual, Intercambio conservando los atributos y PS proporcionales, y Sabiduría con la cola existente. Fractura suma `run.fractures` y roba Destino; Dioses pendientes de la tarea 16. Legendarios activos sobre los santuarios y doce encuentros de lugar con artefactos conservados, Fragmentos de los lagos o Helio derrotado; niveles 40, Regigigas/Silvally 45 y guardianes 35, al menos tres IVs 31, música `bgm_boss`, sin huida al debilitar a uno tuyo, sin Bonguri y 4/6 PV al capturar/derrotar. Fichas retiradas al vencer/capturar, conservadas al perder; lista en Bolsa. Salvajes derrotados en `run.discard` y nuevas capturas con `set.tier`; migración sin inventar tiers anteriores. Pruebas Node y doce combates con BattleStreams real superados. **Pendientes:** el dueño debe decidir equivalentes oficiales u omisión para los once movimientos legendarios propios del mod sin nombre existente en Showdown; de momento conservan `signature: null`. Revisión visual móvil y consola pendiente: el control de Google Chrome fue rechazado y no hay navegador disponible en el conector de pestañas.
   - **Tarea 16 en local:** Fractura Celestial con elección/cambio persistente de Seguidor y aparición de su Dios en Origin, +1 movimiento mientras lo sigues y bloqueo de ambas ofrendas. Dialga/Palkia/Giratina de nivel 50, música `bgm_final`; su esfera en Bolsa o equipada (también en Caja) evita el Aura. Sin ella, captura ×0,25 y segunda fase automática en Forma Origen con PS completos, conservando los PS/estados del equipo; recompensa final de 4/6 PV al capturar/derrotar, retirada del Dios y turno extra inmediato en Corazón de Sinnoh. Destino: 42 copias (12/12/12/6), mano de 5, descarte/rebarajado y un efecto por turno; Juega 3 cuenta Seguidor y comodines Arceus. Dialga repite captura sin otra Ball o una derrota con los mismos rivales y equipo inicial; Palkia teletransporta hasta 3 casillas ignorando elevación o a todo el mapa salvo Distorsión; Giratina sacrifica PS por aumentos reales de estadísticas; Arceus Juega 3 cura y revive fuera de combate. Persisten selecciones, derrota pendiente, efectos pagados y tiradas interrumpidas sin duplicar costes. Migración conserva la mano y reconstruye copias faltantes del mazo antiguo como descartes. Pruebas Node y `>eval` de Giratina con motor real superados, incluidos costes letales, cambios obligatorios y tres Formas Origen combatiendo. **Pendiente:** revisión visual móvil y consola; Chrome rechazó el control con «Computer Use was not approved to use Google Chrome».
   - **Aparcado:** captura con cartas, Ultra Explosión y demás mecánicas del juego de mesa, salvo los PV, recompensas, huida, espacios, Caja, Bonguri, recetas de Balls, escondites, objetos equipables, campaña Corazón de Sinnoh, ofrendas, legendarios de evento/lugar, Dioses de Sinnoh y efectos de Destino ya incorporados. Se conservan sin cambios `sinnoh_datos.js`, `spr/sinnoh_*.bin` y `herramientas/sinnoh/generar.py` por si después se quiere replicar el mod tal cual.
4. **Recuperar los generadores perdidos**, solo cuando haga falta actualizar esos datos: `champions.js` (desde Smogon), `comp.js` y `tiers.js` (desde una versión nueva de `@pkmn/sim`) y el empaquetador de `spr/`. Los formatos están descritos arriba.

## Decisiones de diseño

- **Archivos sueltos y estáticos, sin compilación.** El dueño sube los cambios por la web de GitHub (Add file → Upload files, máximo unos 18 MB por subida). Todo tiene que funcionar copiando los archivos tal cual. No introduzcas bundlers, npm ni pasos de build en la app.
- **`index.html` se edita directamente.** Antes salía de una plantilla (`template.html` + `build_pwa.py`), pero esa herramienta no se conservó. Hoy `index.html` es la fuente.
- **Paquetes `.bin` en vez de miles de imágenes sueltas.** Así no se sobrepasan los límites de la subida web. La página pide por HTTP Range solo los bytes de cada recurso y los guarda en la caché `midex-spr`; si el servidor no acepta rangos, baja el paquete una vez.
  - El encabezado `MIDEXPAK` existe por una razón: al copiar desde el PC del dueño, las PNG y MP3 sueltas reciben metadatos C2PA que alteran los archivos, y dentro de un paquete eso no pasa.
  - Si un recurso falta, se usa la ilustración oficial de PokeAPI.
- **Motor Showdown sin modificar** (`ps.js`). Las reglas y los cálculos no se reimplementan: todo pasa por `BattleStreams`.
  - La única extensión es `Side.prototype.canDynamaxNow`, que habilita el Dinamax en Gen 9.
  - `batalla.js` solo traduce el protocolo (`handle`), dibuja y decide por la CPU.
- **IA de la CPU por puntaje** (poder × efectividad × STAB × precisión), con cambios defensivos en difícil.
  - Los líderes usan mega/tera/Dinamax solo con su último Pokémon (`aceOnly`).
- **Champions:** sus 66 SP (máximo 32 por stat) se convierten a EVs con `ev = floor(sp·8·k/4)·4`, donde `k = min(1, 508/total)`.
  - Las megas nuevas de Champions solo se muestran en la Pokédex, porque el motor no las conoce.
  - El resumen en español de cada set lo arma la app a partir de los movimientos y objetos; no es una traducción del análisis de Smogon.
- **Animaciones:** las imágenes RGB con color transparente (tRNS) se pasan a RGBA al empaquetar; si no, aparecen cuadros negros.
  - Los ataques sin animación propia usan una de su mismo tipo y categoría.
- **Desafío Kanto, elección libre:** el dueño quiere elegir a cualquier entrenador sin desbloqueo progresivo. El código de desbloqueo quedó escrito pero desactivado con `return true`.
- **Escalada:**
  - El rival siempre trae tantos Pokémon como tú.
  - Tu equipo se cura entre combates.
  - No se repiten especies.
  - Si sales a mitad de un combate, al volver se repite el mismo rival, porque `r.foe` queda guardado; así salir no sirve para cambiar de rival.
  - Perder termina la escalada.
  - La CPU sube de dificultad: mínimo "normal" desde la ronda 5 y "difícil" desde la 10.
- **Service worker con la red primero y recarga automática.** Antes se usaba la copia guardada y se actualizaba en segundo plano, y el celular del dueño seguía mostrando versiones viejas. No vuelvas a poner la copia guardada primero.
- **Textos en español de Chile.** Nombres oficiales en español de Pokémon, movimientos, habilidades y objetos (`esSp`, `esMove`, `esAb`, `esItem`). La interfaz también va en español.

## Problemas conocidos

- No se conservaron los generadores de `ps.js`, `esx.js`, `comp.js`, `tiers.js`, `champions.js`, `reto.js`, `sprites.js`, `assets.js`, `animidx.js` ni de los paquetes `spr/`. Para cambiar esos datos hay que rehacer el script correspondiente.
- Los tiers de Smogon están congelados en `@pkmn/sim` 0.10.11 y Smogon los cambia cada pocos meses.
- En Escalada te pueden tocar legendarios, como Mewtwo o Miraidon, desde la primera ronda (ver Pendiente 2).
- Los Pokémon de Paldea y algunas formas no tienen sprite animado en el juego del dueño, así que muestran la ilustración oficial.
- Las ilustraciones oficiales y los íconos se cargan desde `raw.githubusercontent.com` (PokeAPI). Sin internet solo se ven las que ya se vieron antes.
- `localStorage` es por navegador y por dispositivo: los equipos y el progreso no se sincronizan entre el PC y el celular.

## Reglas de código

- **JavaScript sin librerías nuevas:**
  - Las únicas dependencias son `ps.js` (Showdown, ya incluido) y Google Fonts en `index.html`.
  - Nada de React, frameworks, TypeScript, módulos ES ni CDNs nuevos.
  - Se usan scripts clásicos con variables globales, `"use strict"`, `const`/`let` y funciones flecha.
- **Estilo del código existente:**
  - Funciones cortas y HTML armado con template strings.
  - Escapa siempre el texto con `esc()`.
  - Los IDs de Showdown pasan por `toID()`.
  - Para la interfaz se usa `$()`.
  - Los botones usan `data-act` o atributos `data-*`, y un único `document.addEventListener("click", …)` por archivo.
  - Si un archivo nuevo agrega un listener, debe ignorar los clics en `[data-info]` (información de movimientos).
- **Agregar un modo de batalla:** créalo en un archivo nuevo (como `escalada.js`) que se carga después de `batalla.js`, y engánchalo con cambios mínimos:
  - una entrada en `render()`;
  - un botón en `renderMenu`;
  - una bandera en las `opts` de `newBattle`;
  - los casos `win` y `showEnd`.
  - Las constantes que use `renderMenu` deben estar definidas en `batalla.js`, porque el menú se dibuja antes de que carguen los archivos posteriores.
- **Guardado:** agrega claves dentro de `ST` (con `if (!ST.x) ST.x = …` y `save()`). No cambies `STORE_KEY` ni la forma de lo ya guardado: se perderían los equipos del dueño.
- **Al agregar o cambiar archivos de la app:**
  - súmalos a `SHELL` en `sw.js`;
  - sube `APP` a `midex-app-v(N+1)`;
  - actualiza `LEEME.md`.
- **No tocar:**
  - `ps.js`.
  - Los archivos generados de la tabla anterior: si hay que cambiarlos, rehaz el generador.
  - `spr/*.bin`.
  - `LICENCIA-motor-batalla.txt`.
  - Los créditos a Smogon, Pokémaster y PokeAPI.
- **Pruebas:** antes de dar algo por terminado, ábrelo en un navegador local (`python -m http.server` en la carpeta) con pantalla de celular (unos 390 px) y revisa la consola.
  - Para batallas, se puede forzar el resultado con `B.s.omniscient.write(">forcewin p1")`.
- **Tamaño:** ningún archivo puede pasar de unos 18 MB, por el límite de la subida web a GitHub.

## Modo 1 (con Claude)

Claude organiza y deja la tarea escrita en `.tareas/tarea-N.md`.

- Haz **solo** lo que pide esa tarea, sin ampliar el alcance ni refactorizar lo que no se pide.
- **No hagas commits.**
- Al terminar, resume en español:
  - qué archivos cambiaste y qué cambió en cada uno;
  - cómo lo probaste;
  - qué quedó pendiente o qué dudas surgieron.
- Si la tarea choca con este AGENTS.md o es ambigua, detente y pregunta en vez de adivinar.

## Modo 2 (solo)

- Para cambios grandes (más de un archivo, datos guardados o el service worker), escribe primero un plan corto y espera aprobación.
- Una tarea a la vez, y prueba antes de seguir.
- Un commit por tarea, con mensaje en español que diga qué cambió y por qué. Ejemplo: `Escalada: rivales por tiers progresivos`.
- Al cerrar cada tarea, actualiza las secciones "Estado actual", "Pendiente" y "Problemas conocidos" de este archivo.
