# Tarea 11: Puntos ocultos (escondites), Pokémon Alfa, artefactos y objetos equipables

## Objetivo
Que los escondites "?" del mapa funcionen como en el mod: se barajan al empezar, se **revelan al pasar por encima** y aplican su efecto (alijos de Bonguri, campamentos, estrellas caídas, Pokémon Alfa, artefactos). Agregar el sistema de **objetos equipables** (con objetos propios del mod creados en el motor en tiempo de ejecución) que usarán también las tareas 12, 15 y 16.

## Contexto
- Rama `sinnoh`, solo local. No ejecutes comandos `git` que escriban.
- Lee primero `.tareas/plan-sinnoh-completo.md` (decisiones del dueño), `AGENTS.md`, `docs/sinnoh.md` y `sinnoh.js` (tareas 5–10).
- **Reglas del mod (reglamento p. 16–17):**
  - Hay puntos ocultos **regulares** (marrones) y **especiales** (dorados). Se revelan al **pasar por encima** y se resuelve su efecto.
  - Regulares: **Alijos de Bonguri** (3 por color; dan 1, 2 o 3 Bonguri de su color; se descartan), **Campamentos** (6; curar el equipo completo y comerciar con Ginkgo una vez por turno como en los pueblos, pero **no se puede volar** hacia/desde ellos; **quedan en el mapa** boca arriba), **Estrellas Caídas** (8; robas **2 cartas de Cambio de Destino**; se retiran; **por cada 4 estrellas** recogidas, al inicio de cada turno robas 1 carta de Destino durante el resto de la partida).
  - Especiales: **Pokémon Alfa** (6–7; al revelarse **estás obligado a combatir**: buscas en ese punto y el Pokémon encontrado lleva la ficha Alfa: **+4 de salud y cuenta como legendario** — no huye tras debilitar a uno tuyo, necesita 6+ para capturarse — y da **4 PV**; si lo capturas, se queda con la ficha, que no se puede quitar; si pierdes, la ficha se descarta) y **Artefactos** (13: Huevo Marino, Piedra Espíritu, Piedra Magma, Llave Secreta, Gracídea, Núcleos Rockice/Icesteel/Steelrock, Artefactos Adamante/Lustroso/Griseo; aumentan en 1 la fuerza de ataque de 2 tipos y sirven para encontrar a su legendario — eso último es la tarea 16).
  - Mano de cartas de Destino: máximo 5 (sus efectos son la tarea 18; aquí solo se guardan).
- **Datos:** en `SIN.tokens`, los escondites son `kind: "CardCustom"` sobre el mapa: nombres `"<Color> Apricorn Stash"`, `"Campsite"`, `"Fallen Star"`, `"Alpha Pokémon"` (con bioma/clima en etiquetas y `"Strong Encounter Card"`), y los artefactos (`"Seafarer Egg"`, `"Odd Keystone"` = Piedra Espíritu, `"Magma Stone"`, `"Secret Key"`, `"Gracidea Flower"`, `"Rockice Core"`, `"Icesteel Core"`, `"Steelrock Core"`, `"Adamant Artifact"`, `"Lustrous Artifact"`, `"Griseous Artifact"`). Su imagen boca arriba está en `img` o `img2` (la otra es el reverso; la tarea 4 ya muestra el reverso). Mazo de Destino: cartas con la etiqueta `"Change of Fate Card"` (42).
- **Objetos propios en el motor (probado, sin modificar `ps.js`):** se pueden agregar a `Dex.data.Items` antes de los combates y el motor los usa. Ejemplo probado (mismo seed: 15 de daño sin objeto, 18 con objeto):
  ```js
  Dex.data.Items.seafareregg = {name: "Seafarer Egg", num: -9001, gen: 9, onBasePowerPriority: 15,
    onBasePower(bp, user, target, move) { if (["Psychic", "Water"].includes(move.type)) return this.chainModify([4915, 4096]); }};
  ```
  `Dex.items.get("seafareregg").exists` da `true` y `Teams.pack` lo acepta como `item`.

## Adaptación a los juegos (decisión del dueño: adaptar lo que use dados)
- "+1 fuerza de ataque a 2 tipos" → **+20 % de potencia** a esos 2 tipos (como los objetos potenciadores de los juegos).
- Alfa "+4 salud" → el salvaje Alfa tiene **nivel del rango Fuerte + 5** e **IVs 31** en todo (como los Alfa de Leyendas Arceus); marcado `alpha: true`.
- "Necesita 6+ para capturarse" → su ratio de captura se multiplica por **0,5**.
- Los Artefactos Adamante/Lustroso/Griseo existen en los juegos como **Diamansfera, Lustresfera y Griseosfera** (`adamantorb`, `lustrousorb`, `griseousorb`): usa esos objetos reales. Si la Gracídea no existe como objeto en Showdown, créala como objeto propio con su potenciador de tipos (Planta y Volador).
- Tabla de tipos de cada artefacto (reglamento p. 17): Huevo Marino Psíquico+Agua; Piedra Espíritu Siniestro+Fantasma; Piedra Magma Fuego+Tierra; Llave Secreta Fantasma+Eléctrico; Gracídea Planta+Volador; Núcleo Rockice Roca+Hielo; Núcleo Icesteel Hielo+Acero; Núcleo Steelrock Acero+Roca.

## Archivos que se pueden tocar
- Editar: `sinnoh.js`, `docs/sinnoh.md` (sección de la decisión) y `AGENTS.md` (solo el punto de Sinnoh en "Pendiente").

## NO tocar
- `batalla.js`, `ps.js`, `data.js`, `sinnoh_datos.js`, `spr/*`, `sw.js`, ni ningún otro archivo.
- No uses `data-pick`. No cambies `STORE_KEY` ni nada fuera de `ST.sin`.

## Qué hacer
1. **Barajar al empezar** una partida nueva: los escondites regulares entre las posiciones regulares, y los especiales entre las especiales (las posiciones son las de `SIN.tokens`). Guarda la asignación en `run.hidden` (por posición: qué contiene, si está revelado y si sigue en el mapa). Partidas antiguas sin `run.hidden`: barájalo al cargar.
2. **Revelar al pasar:** al moverse, todas las casillas del **camino** (no solo el destino) revelan sus escondites, en orden. El dibujo del mapa muestra los revelados con su imagen boca arriba mientras sigan en el mapa (campamentos siempre; los demás desaparecen al resolverse).
3. **Alijos:** a cada alijo asígnale 1, 2 o 3 (los 3 de cada color: uno de cada cantidad) al barajar; al revelarlo, suma esos Bonguri y muéstralo ("¡Encontraste 2 Bonguri Azules!").
4. **Campamentos:** en su casilla, la ficha ofrece "Curar equipo" (una vez por turno, como el pueblo) y deja preparado un botón "Comerciar con Ginkgo" deshabilitado con el texto "(próximamente)" (se hace en la tarea 12).
5. **Estrellas caídas:** roba 2 cartas al azar del mazo de Destino a `run.fate` (máximo 5 en la mano; si está llena, las sobrantes se pierden y se avisa). Lleva la cuenta `run.stars`; desde la 4.ª (y 8.ª), al terminar cada turno roba 1 carta (o 2) más. Muestra la mano en la Bolsa (imágenes de las cartas, sin efectos todavía).
6. **Pokémon Alfa:** al revelarse, el movimiento se detiene ahí y se abre directamente la oferta de un salvaje Fuerte del bioma/clima de la ficha (1 carta; no se puede rechazar). El salvaje: nivel del rango Fuerte + 5, IVs 31, `alpha: true`, ratio de captura × 0,5, **no huye** tras debilitar a uno tuyo, y da **4 PV** (más +2 si se debilita). Si lo capturas, conserva `alpha: true` (muéstralo con una marca "Alfa" en la barra y en la Caja). Si pierdes o huyes del combate, el escondite se descarta.
7. **Artefactos:** al revelarse, van a `run.items` (inventario de objetos). Créalos como objetos del motor (o usa los reales indicados) al cargar `sinnoh.js`.
8. **Objetos equipables** (base para tareas 12, 15 y 16): en la Bolsa, sección "Objetos", cada objeto de `run.items` se puede **equipar** a un Pokémon del equipo (fuera de combate; si ya tenía uno, vuelve al inventario) y **quitar**. Se guarda en `set.item` y el combate lo usa. Nombres en español (para los propios del mod usa los del reglamento: Huevo Marino, Piedra Espíritu, Piedra Magma, Llave Secreta, Gracídea, Núcleo Rockice/Icesteel/Steelrock). Los Pokémon capturados con objeto lo conservan.
9. Corrige el texto "Ganaste 1 Puntos de Viaje" → "Ganaste 1 Punto de Viaje" (singular con 1).

## Cómo probar
- Node: barajado (mismas cantidades, posiciones regulares/especiales respetadas), cantidades de alijos, robo de Destino con mano llena, cálculo del Alfa, objetos propios existentes en `Dex.items` y un combate real con un artefacto que muestre el +20 % (con seed fijo).
- Navegador (`python -m http.server 8000` → `http://localhost:8000/batalla.html` → Leyendas de Sinnoh): moverte sobre escondites y ver cada efecto; un Alfa obliga a combatir; equipar un artefacto y combatir; recargar y comprobar que todo persiste.

## Terminado cuando
- Los escondites se barajan, se revelan al pasar y aplican su efecto; los campamentos curan y permanecen.
- Las estrellas dan cartas de Destino (guardadas) y el bonus cada 4.
- El Alfa obliga a combatir con sus reglas adaptadas.
- Los artefactos se obtienen, se equipan y potencian sus tipos en combate.
- Todo persiste al recargar; partidas antiguas se migran.

## Al terminar
Resume en español: cambios, cómo creaste los objetos propios, comprobaciones (incluido el +20 % con seed fijo), cómo lo probaste y dudas.
