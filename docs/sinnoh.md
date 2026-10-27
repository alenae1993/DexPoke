# Leyendas de Sinnoh en Mi Dex

Objetivo del dueño, en sus palabras: *"basicamente quiero el juego pero con batallas como lo tenemos en nuestro dex y el estilo tal cual el mod de tabletop"*.

**Solo local: Leyendas de Sinnoh vive solo en la rama `sinnoh` del PC del dueño. No se sube a GitHub y el sitio publicado no la incluye.**

- **Fuente:** el mod de Tabletop Simulator **"[1.4a]Pokémon: Leyendas de Sinnoh"**, Workshop `2880340481`, versión en español. El arte es de su autor, Levatius. El dueño pidió usar las imágenes del mod.
- **Batallas:** con el motor de Mi Dex (Showdown, `batalla.js`), no con las cartas ni los dados del mod.
- **Evolución, niveles y movimientos:** como en los juegos y Essentials, no con el sistema del juego de mesa.
- **Estado local:** mapa táctil, pueblos e iniciales, movimiento, turnos, búsqueda con cartas del mod y combates salvajes con PS y estados persistentes. Las victorias dan EXP y EVs, permiten subir de nivel y aprender ataques; la evolución queda para la tarea 8.

## Decisión: juego actual + progresión real

Se mantiene el juego actual: mapa, movimiento, búsqueda en árboles y arrecifes con las cartas del mod, combates, pueblos y turnos. Los niveles de los salvajes y la curación siguen iguales. La progresión de los Pokémon usa EXP, curvas de crecimiento, ataques por nivel, EVs, amistad y evolución como en los videojuegos.

Se incorporan los Bonguri, las recetas de Balls, los Puntos de Viaje como moneda, las recompensas, la huida, los espacios de equipo y los escondites del mod, con captura durante el combate como en los videojuegos. Captura con cartas, efectos de Destino, santuarios, campaña y las demás mecánicas propias del juego de mesa quedan aparcadas. Se conservan sin cambios `sinnoh_datos.js`, `spr/sinnoh_*.bin` y `herramientas/sinnoh/generar.py` por si después se quiere replicar el mod tal cual. Las reglas y propuestas históricas de más abajo se conservan como referencia, sujetas a esta decisión.

**Escondites y objetos equipables (tarea 11):** al empezar, o al cargar una partida antigua sin `run.hidden`, se barajan los contenidos entre las posiciones regulares y, por separado, entre las especiales de `SIN.tokens`. Se conserva el inventario real extraído: 21 alijos (3 por color), 6 campamentos, 8 estrellas, 6 Alfa y 11 artefactos. La asignación por casilla, su revelación y su permanencia se guardan; no se vuelven a sortear al recargar. Se revelan todas las casillas del camino en orden, incluidos los pasos intermedios. Antes de descubrirlos, la ficha no muestra su contenido.

Cada color tiene un alijo de **1, 2 y 3 Bonguri**; se recibe la cantidad al pasar y el alijo desaparece. Los **campamentos** permanecen boca arriba y permiten curar al equipo y comerciar con Ginkgo en su casilla, con los mismos límites compartidos por turno que los pueblos. No son pueblos ni permiten usar la Caja o volar.

**Pueblos y elaboración (tarea 12):** en pueblos y campamentos se puede **comerciar con Ginkgo una vez por turno** (`run.traded`). La carta actual (`run.ginkgo`, índice de 0 a 8) se sortea al comenzar o migrar una partida y persiste al recargar. El panel muestra su imagen y sus dos intercambios, deshabilitados si faltan ingredientes. Al confirmar uno se descuentan los Bonguri, se entregan los recibidos y se sortea una carta distinta. Se contrastaron visualmente las cartas 0, 3 y 6 con sus imágenes; coinciden con la transcripción.

En los **ocho pueblos iniciales** se puede **volar una vez por turno**, descartando un Bonguri del color elegido, hacia cualquiera de los otros siete. El vuelo mueve la ficha y centra el mapa sin gastar movimientos. `run.flown` guarda el uso y `run.grunts` guarda los nombres internos de los pueblos ocupados por Reclutas Galaxia: bloquean tanto salir como llegar. Por ahora la lista empieza vacía; los Reclutas se incorporan en la tarea 13. Los campamentos no permiten salir ni llegar por vuelo.

La **Bolsa** separa Balls, estofados y objetos de batalla. Todo se elabora fuera de combate y se guarda dentro de `ST.sin`; no modifica otros modos. Se incorpora **Spirit Ball: 2 negros + 1 rosa + 1 blanco**, con bono de captura **2,5**, también disponible al lanzar Balls durante un combate.

Cada estofado se consume al elaborarlo y solo puede elaborarse **una vez por turno por tipo** (`run.stews`):

| Estofado | Bonguri | Efecto adaptado |
|---|---|---|
| Restaurador | 1 amarillo + 1 azul | Cura completamente los PS y estados de todo el equipo, sin gastar la curación de pueblo/campamento. |
| Cautivador | 1 verde + 1 rojo | El primer intento de captura del próximo combate salvaje recibe bono de estado ×1,5 si el salvaje no tiene estado; si ya tiene, mantiene su bono habitual. No se acumula con él. Queda preparado entre turnos hasta comenzar ese combate; se gasta con el primer lanzamiento y caduca al terminar ese combate aunque no se lance ninguna Ball. |
| Sabroso | 1 blanco + 1 amarillo | +3 movimientos durante este turno; los Alfa revelados durante él no interrumpen el camino ni obligan a combatir. Permanecen revelados y se pueden combatir con «Buscar Pokémon Alfa» después. |
| Infundido | 1 rosa + 1 blanco | Permite elegir un Pokémon del equipo de nivel menor que 100: sube exactamente un nivel, actualiza EXP, amistad y PS y usa el flujo normal de aprendizaje y evolución, con decisiones persistentes. No da EVs ni recompensas de combate. |

Al terminar el turno se reinician comercio, vuelo y estofados; desaparecen los +3 movimientos y la protección del Sabroso. El Cautivador pendiente se conserva para el próximo combate salvaje. Las partidas antiguas reciben las claves nuevas y 0 Spirit Balls sin alterar sus inventarios existentes.

Los **seis objetos de batalla** fabricados van a `run.items` y se equipan o quitan con el mismo sistema de los artefactos. La interfaz usa `esItem()` para sus nombres oficiales y entrega los IDs reales al motor:

| Nombre del mod | Bonguri | Objeto real y adaptación |
|---|---|---|
| Cristal Explosivo | 3 rojos + 2 amarillos + 1 negro | Casco Dentado (`rockyhelmet`). |
| Escudo Estrella | 3 azules + 2 rosas + 1 negro | Banda Focus (`focussash`). |
| Huevo Suerte | 3 amarillos + 2 verdes + 1 negro | Huevo Suerte (`luckyegg`): ×1,5 de EXP para su portador en Sinnoh, también con el reparto de EXP; se redondea hacia abajo al final. |
| Mineral Evol | 3 rosas + 2 blancos + 1 negro | Mineral Evolutivo (`eviolite`). |
| Cinta Veloz | 3 verdes + 2 azules + 1 negro | Garra Rápida (`quickclaw`). |
| Cinta Elección | 3 blancos + 2 rojos + 1 negro | Cinta Elección (`choiceband`). |

Cada **estrella caída** desaparece, suma uno a `run.stars` y roba dos cartas aleatorias del mazo de 42 cartas de Cambio de Destino. La mano `run.fate` tiene máximo **5 cartas**: las sobrantes se pierden con aviso. El orden restante del mazo también se guarda, sin repetir cartas; si se agota, se avisa. Al terminar el turno, cada grupo de cuatro estrellas da otra carta (una desde la cuarta, dos desde la octava), respetando el mismo límite. La Bolsa muestra las imágenes de la mano; sus efectos quedan para la tarea 18.

Un **Alfa** interrumpe el movimiento en su casilla y ofrece una sola carta Fuerte del bioma y clima de su ficha, sin opción de rechazarla. El nivel es el del rango Fuerte **+5 (20–25)** y todos sus **IVs son 31**; `set.alpha = true` queda guardado. Su ratio de captura se multiplica por **0,5** y no huye al debilitar a uno de los tuyos. Da **4 PV** al capturarlo y **6 PV** al debilitarlo, además de la EXP/EVs habituales. La ficha desaparece al resolver el combate, incluida la derrota o huida voluntaria. Al recargar un combate pendiente se conserva el mismo Alfa. Capturarlo conserva la marca **Alfa**, visible en la barra y la Caja, y su objeto; la marca no ocupa la ranura de objeto ni se puede quitar.

Los **artefactos** encontrados desaparecen del mapa y van a `run.items`. La Bolsa permite equiparlos al equipo fuera de combate y quitar los equipados. Si se reemplaza un objeto, vuelve al inventario. Se guardan como `set.item` y se entregan al motor real de combate. Los objetos propios se registran al cargar `sinnoh.js` en `Dex.data.Items`, con nombres españoles, números negativos e IDs normalizados con `toID`; su evento `onBasePower` aplica **×1,2** a los dos tipos correspondientes, sin modificar `ps.js`:

| Objeto | Tipos potenciados |
|---|---|
| Huevo Marino | Psíquico y Agua |
| Piedra Espíritu | Siniestro y Fantasma |
| Piedra Magma | Fuego y Tierra |
| Llave Secreta | Fantasma y Eléctrico |
| Gracídea | Planta y Volador |
| Núcleo Rockice | Roca y Hielo |
| Núcleo Icesteel | Hielo y Acero |
| Núcleo Steelrock | Acero y Roca |

Diamansfera, Lustresfera y Griseosfera usan los objetos reales `adamantorb`, `lustrousorb` y `griseousorb`, con las reglas del motor y sus restricciones por especie. La búsqueda de legendarios mediante artefactos queda para la tarea 16.

**PV, recompensas, huida y Caja (tarea 10):** `run.pv` empieza en 0, también al migrar una partida antigua. La barra de turno muestra **PV: N** y **Equipo N/espacios**. Capturar entrega 1/2/3/4 PV por encuentro Débil/Moderado/Fuerte/Legendario; debilitar entrega esa cantidad más **2 PV**. Ambos resultados conservan los **3 Bonguri** del token y la EXP/EVs reales. El resultado guarda las recompensas para no repetirlas al recargar.

Solo al debilitar se ofrece **enseñar el movimiento característico de la carta** a un integrante vivo que no lo conozca, después de resolver EXP, ataques por nivel y evolución. Se busca el nombre español `d.move_name` entre los movimientos reales de Showdown mediante `esMove`, sin distinguir mayúsculas ni tildes; si no hay equivalente, se omite la oferta. Se puede elegir **No enseñar**. La elección usa la cola de aprendizaje existente: con cuatro ataques se pregunta cuál olvidar o si no aprender. La oferta, la elección y cualquier pregunta pendiente persisten al recargar.

Los salvajes Débiles/Moderados/Fuertes **huyen al debilitar a uno de los tuyos**, siempre que quede otro vivo. La huida termina el combate y el turno, conserva PS y estados y entrega **2/1/0 Bonguri** del árbol, o colores al azar del arrecife; no da PV, EXP, EVs, amistad, captura ni movimiento. Los legendarios no usan esta huida. Si ya no quedan Pokémon vivos, es una derrota normal: vuelves al pueblo natal y recuperas el equipo al terminar el turno.

El juego base tiene **3 espacios de equipo +1 por Fragmento**, con máximo 6; queda preparado `run.campaign === "ultra"` para dar 6. Una captura que exceda el límite va a la **Caja**. Las partidas antiguas conservan todos sus integrantes aunque superen sus espacios; solo se impiden nuevas incorporaciones hasta tener espacio. En la ficha del pueblo donde estás aparece **Caja (N)**: permite dejar, sacar e intercambiar Pokémon, mostrando especie, nivel, sexo y PS. Dejar o intercambiar exige que quede al menos un Pokémon vivo en el equipo; sacar exige espacio. Cada cambio se guarda al instante.

**Bonguri, Bolsa y captura (tarea 9):** Sinnoh no permite Teracristalización ni Dinamax; los demás modos conservan sus controles. Cada partida nueva empieza con **3 Poké Balls**, ninguna Super/Ultra Ball y todos los Bonguri en 0. La misma migración que completa EXP, sexo y amistad agrega este inventario a partidas antiguas sin él, una sola vez. Todo queda dentro de `ST.sin.run`: `bag` por color (`red`, `yellow`, `blue`, `pink`, `green`, `white`, `black`), `balls` por tipo (`poke`, `great`, `ultra`) y `box` para las capturas que excedan los espacios del equipo.

Vencer o capturar al salvaje de un árbol entrega **3 Bonguri de su color**. En un arrecife entrega **3 colores sorteados por separado** entre rojo, amarillo, azul, rosa, verde y blanco; pueden repetirse y nunca sale negro. El negro solo se obtiene de árboles negros. La oferta y el combate guardan el token de origen; los encuentros antiguos lo recuperan de la casilla y el lugar de la oferta. Perder o empatar sin huida no entrega Bonguri. El resultado guarda los colores recibidos para mostrarlos también después de recargar, sin volver a entregarlos.

El botón **Bolsa** de la barra de turno muestra colores, cantidades y recetas. Se puede fabricar en cualquier momento en el mapa, incluso después de combatir, sin consumir movimiento ni turno. Cada fabricación descuenta los ingredientes y entrega una Ball; si faltan ingredientes, el botón queda deshabilitado:

| Ball | Receta del mod | Bono de captura |
|---|---|---|
| Poké Ball | 1 Bonguri Rojo | 1 |
| Super Ball | 1 Azul + 1 Verde + 1 Rojo | 1,5 |
| Ultra Ball | 1 Negro + 1 Amarillo | 2 |

Los botones de Balls aparecen al elegir ataque, con su cantidad; no permiten lanzar durante la elección inicial, un cambio forzoso o un combate terminado. Lanzar descuenta y guarda la Ball antes de resolver la captura. Se usa `cr` de `sinSpeciesData` y la fórmula solicitada de generaciones VI–VII: `a = floor(((3·M − 2·H)·ratio·bonoBall)/(3·M))·bonoEstado`. `M` y `H` son los PS máximos y actuales del salvaje; basta el porcentaje que recibe el cliente. El bono de estado es **2,5** para sueño o congelación, **1,5** para parálisis, quemadura o veneno (también tóxico), y **1** sin estado. El redondeo se aplica antes del bono de estado.

Con `a ≥ 255` la captura es segura. En otro caso, `b = floor(65536/(255/a)^0,1875)` y deben superar **cuatro comprobaciones**: cada entero independiente entre 0 y 65.535 debe ser menor que `b`. Con `a = 0`, `b = 0` y no hay captura. Se muestra «La Ball se movió…» por cada comprobación superada, hasta tres mensajes. No se agregan capturas críticas ni otros bonos.

Si falla, se pierde el turno y el salvaje ataca. Antes de los mensajes se bloquean los controles igual que en `choose`: `lastReq = req`, `req = null`, `shown = false` y se vacía `ctl`. Después del fallo se envía al stream omnisciente:

```js
>eval const sd=battle.sides[0]; sd.clearChoice(); sd.choice.actions=[{choice:"pass",pokemon:sd.active[0],index:0}]; sd.choice.forcedPassesLeft=0; if (battle.allChoicesDone()) battle.commitChoices();
```

Si acierta, `sinCaught` marca la captura y `>forcewin p1` termina el combate. El set original del salvaje conserva sexo, IVs, ataques, nivel, EXP y amistad. Sus PS máximos se calculan con `calcStat`, y los actuales quedan en `ceil((H/M)·hpMax)`, con mínimo 1 y máximo `hpMax`; conserva su estado. Se incorpora al equipo si hay espacio o se envía a la Caja con aviso. Los Pokémon previos del equipo reciben EXP, EVs y amistad como al vencer; el recién capturado no recibe la recompensa de su propia captura. El resultado, la captura, la Bolsa y la Caja persisten al recargar.

**EXP y constantes:** `sinExpForLevel(gw, n)` devuelve EXP total, con nivel máximo 100 y 0 EXP en nivel 1. `floor` significa redondear hacia abajo. Curvas contrastadas con las [tablas de crecimiento de Pokémon Essentials](https://github.com/Maruno17/pokemon-essentials/blob/master/Data/Scripts/010_Data/001_Hardcoded%20data/001_GrowthRate.rb):

| `gw` | EXP total para nivel `n` (redondeada hacia abajo) | Nivel 100 |
|---|---|---|
| `Fast` | `4·n³/5` | 800.000 |
| `Medium` | `n³` | 1.000.000 |
| `Parabolic` | `6·n³/5 − 15·n² + 100·n − 140` (mínimo 0) | 1.059.860 |
| `Slow` | `5·n³/4` | 1.250.000 |
| `Erratic` | Hasta 50: `n³·(100−n)/50`; 51–68: `n³·(150−n)/100`; 69–98: `n³·floor((1911−10·n)/3)/500`; 99–100: `n³·(160−n)/100` | 600.000 |
| `Fluctuating` | Hasta 15: `n³·(floor((n+1)/3)+24)/50`; 16–35: `n³·(n+14)/50`; 36–100: `n³·(floor(n/2)+32)/50` | 1.640.000 |

Al vencer al salvaje: `EXP = floor((be·Lr/5)·((2·Lr+10)/(Lr+Lp+10))^2.5)+1`, con `be` del rival en `data.js`, `Lr` su nivel y `Lp` el nivel del receptor antes de subir. Cada participante vivo recibe el 100 %; cada no participante vivo recibe `floor(EXP·SIN_EXP_SHARE)`, con `SIN_EXP_SHARE = 0,5`. Los debilitados no reciben EXP ni EVs; perder o empatar tampoco da recompensas. La EXP acumulada se limita a la necesaria para nivel 100. Ejemplo: Chimchar Nv. 5 contra Bidoof Nv. 4 (`be=50`): `floor(40·(18/19)^2.5)+1 = 35 EXP`; uno del mismo nivel en la banca recibe 17.

Los receptores vivos suman los EVs del rival (`evs`, pares de stat y cantidad separados por comas), con máximo 252 por estadística y 510 en total. Se recalculan los PS con `calcStat`: los PS actuales aumentan en la diferencia de PS máximos por EVs y niveles, sin curar el daño previo ni los estados.

Los sets nuevos tienen IVs independientes entre 0 y 31, EVs en 0, naturaleza al azar y sexo sorteado según `gr`. Usan los últimos cuatro ataques distintos de `lv` hasta su nivel, excluyendo el nivel 0 reservado para evolución. Se usa la especie base si falta la forma en `data.js`; si falta también la especie, los ataques iniciales recurren al learnset del motor. Al cargar partidas antiguas se inicializan `exp`, el sexo y la amistad pendientes, conservando sus IVs y ataques.

El resultado, los niveles ganados y la cola de ataques quedan en `ST.sin.run.progress`. Se aprenden automáticamente si hay espacio; con cuatro ataques se pregunta, de uno en uno, cuál olvidar o si no aprender. No se vuelve al mapa hasta responder; recargar recupera el resultado y las preguntas sin repetir recompensas. El equipo del mapa muestra nivel, sexo y barras de PS y EXP.

**Amistad y evolución (tarea 8):** cada set guarda `friendship`, inicialmente el valor base `hp` de `data.js` (70 si falta), también para salvajes y partidas antiguas. Ganar un combate suma `SIN_FRIEND_WIN = 1` a cada Pokémon vivo. Cada nivel ganado suma +5 con amistad 0–99, +3 con 100–199 o +2 con 200–255, aplicando el tramo de nuevo por cada nivel y con tope 255. Perder o empatar no da amistad ni evoluciones.

Solo los Pokémon que subieron al menos un nivel revisan la primera evolución válida de `ev`, después de resolver los ataques del combate. Se implementan `Level`, `LevelDay`, `LevelNight`, `LevelFemale`, `LevelMale`, `Happiness`, `HappinessDay`, `HappinessNight` y `HasMove`. Los métodos de amistad exigen al menos **160**; los de sexo comprueban el sexo guardado y `HasMove` comprueba los ataques conocidos, incluidos los recién aprendidos. Se usa la hora local del dispositivo al ganar: día desde las 6:00 hasta las 19:59 y noche el resto. Se ignoran destinos inexistentes en Showdown.

El resultado ofrece **Evolucionar** o **Cancelar**. Cancelar conserva la especie y permite ofrecerla otra vez en la siguiente subida de nivel válida. Evolucionar conserva nivel, EXP, EVs, IVs, naturaleza, sexo, amistad y ataques, y mantiene la ranura de habilidad (`0`, `1` o `H`; respaldo `0`). Recalcula los PS máximos con `calcStat` y suma la diferencia a los actuales sin quitar el daño previo. Encola los ataques de nivel 0 y del nivel actual del destino con las mismas preguntas de aprendizaje. No encadena otra evolución hasta una próxima subida de nivel. Tanto la evolución pendiente como las preguntas y el resultado persisten al recargar; no se vuelve al mapa mientras falte una decisión.

Quedan pendientes hasta incorporar objetos las evoluciones por `Item`, `CableLinkItem` e intercambio, `TradeSpecies`, objetos equipados y los demás métodos especiales, incluidos `LevelRain`, `LevelWalk` y `LevelCoins`.

## Dónde están los archivos del mod (en el PC del dueño)

`C:\Users\GOLDEN GAMERS\Documents\My Games\Tabletop Simulator\Mods\`

| Qué | Ruta dentro de `Mods\` |
|---|---|
| Partida guardada con todos los objetos y sus scripts Lua | `Workshop\2880340481.json` (9,4 MB) |
| Imágenes | `Images\` |
| PDF de reglas (28 páginas escaneadas, sin texto) | `PDF\httpssteamusercontentaakamaihdnetugc1886473635294694547E435955619CE12C6069A33087E0D7760976D646D.pdf` |
| PDF de recetas de crafteo | `PDF\httpssteamusercontentaakamaihdnetugc18864731945778657133B64B68F89EA788D924DF3B7BB13C919621ACFD8.pdf` |

Sobre las imágenes de `Images\`:
- Se llaman como la URL sin caracteres no alfanuméricos, con el dominio nuevo de Steam.
- `herramientas/sinnoh/extraer_mod.py` genera `names.json` con la equivalencia entre URL y nombre de archivo.
- En este mod todas son `.png`.
- Son 247 imágenes en total. En una sesión anterior se copiaron 50; las demás siguen en la caché del PC.

Mods relacionados, también en el PC:
- `2943382971` "Legends of Sinnoh: The Sinnoh League Campaign"
- `2840694128` "LoS Generations"
- `2795954804` "Assa's QOL"

## Qué hay en el JSON del mod

Esto es lo que saca `extraer_mod.py` y escribe en `mod.json`.

**Mapa**
- 635 objetos `Custom_Model` forman hexágonos de cara plana. Todos usan la misma malla y el color de cada uno sale de `ColorDiffuse`.
- Al agruparlos quedan 352 celdas.
- Coordenadas: `c = round(posX / 1.65)`, `r = round(posZ / 0.95263)`, en coordenadas dobles: siempre se cumple que `c + r` es par.
- Elevación: las piezas gruesas (`scaleY` 2) se apilan cada 0,78 a partir de `posY` 0,59. `nivel = round((y_tope - 0,59) / 0,78)`.
- Agua: piezas con transparencia (`a` 0,2).
- Hay seis texturas distintas, que corresponden a variantes de bosque y al Mundo Distorsión.
- El **Mundo Distorsión** es la isla roja aparte, con `posY` negativo; se marca con `dw`.

**Tokens del mundo (`Custom_Token`)**
- Árboles de Bonguri y arrecifes:
  - Sus etiquetas traen el bioma (Plains, Forest, Mountain u Ocean), el clima (Cold, Temperate o Warm) y el nivel de encuentro (Weak, Moderate o Strong).
  - Árboles: rojo 16, azul 15, amarillo 14, rosa 10, blanco 11, verde 11 y negro 9.
  - Hay además 32 arrecifes y 6 árboles deformados del Mundo Distorsión.
- Pueblos: Canalave, Celestic, Eterna, Nesburgh, Sinnome, Snowpoint, Stark y Sunyshore, más Ultra Megalopolis.
- Unos 20 santuarios, las cavernas de los 3 lagos, ruinas, el Templo de Sinnoh, el comerciante Ginkgo y otros sitios.

**Escondites (`CardCustom`, boca abajo en el mapa)**
- Alijos de Bonguri.
- 6 campamentos.
- 8 estrellas caídas.
- 6 Pokémon Alfa, con bioma y clima.
- Artefactos: Seafarer Egg, Piedra Espíritu, Piedra Magma, Llave Secreta, Flor Gracídea, los núcleos Rockice, Icesteel y Steelrock (nombres del mod), y las esferas Diamansfera, Lustresfera y Griseosfera.

**Figuras (`Figurine_Custom`)**
- Entrenadores de cada pueblo.
- Legendarios: aves de Kanto, Regigigas, Celebi, Darkrai, Cresselia, Dialga, Palkia y Giratina.
- 9 Ultraentes y Necrozma.

**Mazos, con datos Lua en cada carta Pokémon**
- Weak 80, Moderate 95, Strong 98, Evolution 202, Starters 18 y Legendary 32.
- Galaxia: reclutas 8, comandantes 15 y jefe Helio 8.
- Sin texto, solo imagen: Destino 42, Santuario 35, Pueblo/Brecha 36, Acto 5, Entrenador 51 y Pueblo natal 9. Para programar sus efectos hay que leerlos desde las imágenes de las hojas de cartas.

Ejemplo de los datos de una carta Pokémon:

```lua
pokedex_name = "Cubone"   internal_name = "Cubone"   health = 6   initiative = 4
types = {"Ground"}   moves = {"Ground","Normal","Rock","Fighting"}   evolve_into = {"Marowak"}   evolve_cost = 6
encounter_tier = "Weak"   move_name = "Ataque Óseo"   move_type = "Ground"   move_attack_strength = "5"
```

Las etiquetas de la carta dan su bioma y clima.

**Cómo encuentra Pokémon el mod** (`search.lua`)
- Al buscar, se fija en el token que está bajo el entrenador y toma cartas del mazo de ese nivel cuyo bioma y clima coincidan con los del token.
- Débil da 3 cartas, Moderado 2, Fuerte 1, Legendario 1 (según el GMNotes) y una Puerta de Distorsión 3 (Fuerte, Moderado y Débil).

## Reglas del juego de mesa (resumen del PDF)

**Turno y mapa**
- Te mueves hasta 3 casillas, más 1 por cada Fragmento. No puedes subir ni bajar 2 o más niveles de elevación de una vez.
- Combatir termina tu turno.
- En los pueblos:
  - te curas por completo;
  - comercias con Ginkgo;
  - puedes volar a otro pueblo descartando 1 Bonguri.
  - Nunca hay reclutas Galaxia en dos pueblos a la vez.

**Búsqueda**
- En un árbol o arrecife se ofrecen 3 Pokémon Débiles, 2 Moderados o 1 Fuerte, según el bioma y el clima del lugar.

**Bonguri**
- Grado 1: rojo, amarillo y azul. Grado 2: rosa, verde y blanco. Grado 3: negro.
- Un árbol da hasta 3 de su color; un arrecife da colores mezclados.

**Recompensas**
- Si el Pokémon huye: 2, 1 o 0 Bonguri, según su nivel.
- Si lo capturas o lo debilitas: 1, 2, 3 o 4 Puntos de Viaje (PV) más 3 Bonguri.
- Si lo debilitas: además +2 PV y puedes enseñar su movimiento.
- Máximo 3 movimientos; el movimiento característico es fijo.

**Huidas y derrota**
- Un Pokémon salvaje huye después de debilitar a uno de los tuyos. Los legendarios solo huyen si debilitan a todo tu equipo.
- Si pierdes todo, vuelves a casa, tu equipo se restaura el turno siguiente y robas 1 carta de Destino.

**Combates**
- Contra entrenadores: el ganador se lleva 1 Artefacto o 2 cartas de Destino al azar.
- Los estados persisten después del combate.
- Enjambres en las 4 Puertas de Distorsión: un Débil, un Moderado y un Fuerte, por 7 PV.

**Crafteo**
- Balls:
  - Poké Ball: 1 rojo.
  - Super Ball: 1 azul + 1 verde + 1 rojo.
  - Ultra Ball: 1 negro + 1 amarillo.
  - Spirit Ball: negro + rosa + blanco ×2.
- Guisos, uno por turno:
  - amarillo + azul: curación completa;
  - verde + rojo;
  - blanco + amarillo: +3 de movimiento y sin peleas de Alfa;
  - rosa + blanco: evolución a mitad de costo.
- Objetos de combate (3 + 2 + 1 negro cada uno): Blast Crystal, Star Shield, Huevo Suerte, Mineral Evolutivo, Swiftness Sash y Cinta Elección (los nombres en inglés son propios del mod).

**Sellos de Viaje**
- Son 7 condiciones, cada una con su recompensa.

**Escondites**
- Alijos de Bonguri.
- Campamentos: curar y comerciar.
- Estrellas caídas: dan cartas de Destino.
- Alfas: +4 PS y cuentan como legendarios.
- Artefactos que invocan legendarios:
  - Seafarer Egg → Manaphy
  - Piedra Espíritu → Spiritomb
  - Piedra Magma → Heatran
  - Llave Secreta → Rotom
  - Gracídea → Shaymin
  - Núcleos → Regis
- Esferas celestiales: Diamansfera, Lustresfera y Griseosfera (Adamant, Lustrous y Griseous en el mod).

**Santuarios**
- Ofrenda de 1 Bonguri: robas un Evento de Santuario.
- Con 7 PV: robas 3 eventos y te quedas con 2.
- Los eventos legendarios colocan un legendario en su santuario.

**Dioses de Sinnoh**
- Dialga, Palkia y Giratina usan fichas de Fractura Celestial y Seguidor.
- Con el Aura Celestial, capturarlos requiere un 7 y el dios gana una segunda forma.

**Cartas de Destino**
- Máximo 5 en la mano, 1 por turno, y hay efectos de "juega 3".

**Campaña Corazón de Sinnoh**
- Prólogo: hay reclutas en cada pueblo natal.
- Acto I: 3 Bonguri rojos. Vence a 2 reclutas al azar en tu pueblo y ganas +2 de movimiento por turno.
- Acto II: los comandantes Venus (Lago Veraz, Fragmento de Emoción), Ceres (Lago Agudeza, Conocimiento) y Saturno (Lago Valor, Voluntad). Usan 2, 3 y 4 de sus 5 Pokémon. Cada fragmento da +1 al tamaño del equipo.
- Acto III: haz una ofrenda en el Santuario del Origen para obtener el Corazón de Sinnoh (+1 al ataque de los movimientos STAB). Luego pelea contra Helio con 6 de sus 8 Pokémon en el Templo de Sinnoh.
- Final: eliges entre Héroe y Traidor.
- El Equipo Galaxia elige a su siguiente Pokémon y usa las tácticas Plan B y Represalia Galáctica.

**Otra campaña: Ultra Explosión**
- Necrozma, 9 Ultraentes, porcentaje de brecha, armadura prisma y bendiciones de Arceus. Se deja para después de Corazón de Sinnoh.

## Propuestas anteriores (referencia; sujetas a la decisión actual)

| Tema | Decisión |
|---|---|
| Mapa | 2D hexagonal con el estilo del mod: hexágonos con los colores del mod, tokens con sus imágenes y texturas en los hexágonos especiales. |
| Combates | `newBattle` de `batalla.js`. PS y estados persisten entre combates hasta curarse en un pueblo o campamento. |
| Captura | Fórmula real de captura, con el tipo de Ball. |
| Puntos de Viaje | Se convierten en EXP. |
| Niveles, evolución y movimientos | Como en los juegos o Essentials, usando los learnsets y evoluciones de `Dex` del motor y de `data.js`. |
| Nivel de los salvajes | Escala según el nivel de encuentro (Débil, Moderado, Fuerte) y el acto. |
| Campaña | Primero Corazón de Sinnoh; Ultra Explosión después. |
| Cartas de Destino y objetos de combate | Se convierten en objetos reales del juego y en efectos sobre el mapa. |
| Jugadores | Un jugador contra bots, más hot-seat (varios en el mismo dispositivo). No está confirmado por el dueño. |

## Plan de trabajo

1. **Hecho:** se corrió `python herramientas/sinnoh/extraer_mod.py "<ruta>\Workshop\2880340481.json" sinnoh/datos` y se revisó el mapa con `vista_mapa.py`.
2. **Hecho con `generar.py`:** `python herramientas/sinnoh/generar.py sinnoh/datos "<ruta>\Mods\Images"` produce `sinnoh_datos.js` (índice de imágenes, mapa sin celdas aisladas, tokens y mazos con datos Lua) y `spr/sinnoh_*.bin` (WebP con transparencia, encabezado `MIDEXPAK` y máximo 15 MB por paquete). Reduce texturas, tokens, escondites y figuras, y recorta los frentes y reversos de las cartas de sus hojas. Ambas rutas tienen valores por defecto; puede repetirse para regenerar las mismas salidas.
3. Pasar los nombres de las cartas Pokémon a especies de Showdown (`Dex.species.get`). Ojo con las formas, los nombres en español entre paréntesis ("Zubat (Recluta del Equipo Galaxia)") y `internal_name`.
4. Crear `sinnoh.html` y `sinnoh.js`:
   - mapa con zoom y desplazamiento táctil;
   - movimiento con reglas de elevación;
   - turnos;
   - búsqueda;
   - Bonguri y crafteo;
   - guardado en `localStorage` con una clave propia.
5. Integrar las batallas: reutilizar `newBattle` sin duplicar código, con un archivo aparte como `escalada.js`, y devolver el resultado al mapa.
6. **Hecho (tarea 7):** EXP, curvas de crecimiento, niveles, EVs y aprendizaje de movimientos con preguntas persistentes. Evolución pendiente para la tarea 8.
7. **Aparcado:** campaña, legendarios, santuarios, escondites, sellos y cartas de Destino (leyendo los textos desde las imágenes de las cartas).
8. Botón en el menú, `SHELL` del service worker, `LEEME.md` y pruebas en pantalla de celular.
