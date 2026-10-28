# Tarea 19: Ajustes del dueño — sin enseñar el movimiento de la carta al derrotar, y sprites en vez de cartas al elegir Pokémon

## Objetivo
Dos cambios pedidos por el dueño, **sin borrar** nada que sirva para replicar el juego original más adelante:
1. **Desactivar** la opción de enseñar el **movimiento característico del Pokémon derrotado** (tarea 10), dejando la función guardada detrás de un interruptor.
2. En las pantallas donde se **elige un Pokémon**, mostrar el **sprite del Pokémon** en vez de la imagen de su carta del mod. Las imágenes de las cartas se conservan en los datos.

## Contexto
- Rama `sinnoh`, solo local. No ejecutes comandos `git` que escriban.
- Lee `AGENTS.md`, `docs/sinnoh.md` y `sinnoh.js`.
- **Movimiento característico:** hoy, al debilitar a un salvaje, la pantalla de resultado ofrece "Enseñar <Movimiento> a…" (`run.progress.signature`, `sinTeachSignature`, botones `data-act="sinsignature"`).
- **Sprites:** `batalla.js` ya tiene `sprUrl(nombre, espalda, variocolor, hembra)` + `sprLoad(id)` (sprite animado de frente de Essentials, tira de cuadros), `img(nombre)` (ilustración oficial de PokeAPI, respaldo) y `pimg(nombre)` (ícono). Úsalos; no agregues archivos.

## Archivos que se pueden tocar
- Editar: `sinnoh.js` y `docs/sinnoh.md` (anotar ambos ajustes como decisión del dueño).

## NO tocar
- `batalla.js`, `sinnoh_datos.js`, `spr/*`, ni ningún otro archivo. No borres funciones ni datos de las cartas.

## Qué hacer
1. **Interruptor** `const SIN_SIGNATURE_TEACH = false;` (con un comentario: "Regla del juego de mesa; se activa al replicar el juego original"). Con `false`:
   - No se crea `run.progress.signature` al ganar, ni se muestra la oferta "Enseñar…".
   - `sinTeachSignature` y el resto del código quedan como están (solo no se llaman).
   - Si una partida guardada tiene una oferta pendiente, se descarta al cargar para que no bloquee "Volver al mapa".
   - **No** afecta a otras mecánicas que enseñan movimientos: Sabiduría Antigua (santuario), "MT" de las recompensas de Sellos ni Disfraz Pokémon/Tarjetas. Esas siguen igual.
2. **Sprites al elegir Pokémon** — en todas las pantallas donde el jugador elige o ve un Pokémon que todavía no tiene (al menos: elección de **inicial**, **oferta de búsqueda** en árboles/arrecifes, oferta del **Alfa**, **legendarios** de santuario y de lugar, **Dios** de Sinnoh y, si ya existe, el **Enjambre**):
   - Reemplaza la imagen de la carta por una tarjeta propia: **sprite animado de frente** (`sprUrl` + `sprLoad`, mostrando el primer cuadro o animado si es simple) con respaldo en `img()` si no hay sprite; debajo el nombre (`esSp`), los **tipos** (chips de tipo con los colores de la app), el **nivel** que tendrá y su nivel de encuentro (Débil/Moderado/Fuerte/Legendario/Alfa).
   - Se ve bien a 390 px (3 opciones en una fila para la búsqueda Débil).
   - Las cartas de Pueblo natal, Acto, Santuario, Destino, Ginkgo y Tarjetas de Entrenador **no cambian** (no son Pokémon).
   - Las imágenes de las cartas Pokémon siguen en `sinnoh_datos.js`/`spr/sinnoh_*.bin`; deja la función que las dibuja (no la borres) para usarla al replicar el juego original, con un comentario.

## Cómo probar
- Navegador (`python -m http.server 8000` → `http://localhost:8000/batalla.html` → Leyendas de Sinnoh): nueva partida (iniciales con sprite), buscar en un árbol (oferta con sprites, tipos y nivel), derrotar al salvaje (`B.s.omniscient.write(">forcewin p1")`) y comprobar que **no** aparece "Enseñar…" y que se vuelve al mapa normalmente. Revisa la consola: sin errores.

## Terminado cuando
- No se ofrece enseñar el movimiento del derrotado y el interruptor lo puede reactivar.
- Las pantallas de elección de Pokémon usan sprites (con respaldo) en vez de cartas.
- No se borró ninguna función ni dato de las cartas.

## Al terminar
Resume en español: qué pantallas cambiaste, dónde está el interruptor y cómo lo probaste.
