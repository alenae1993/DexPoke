# Tarea 4: mapa de Leyendas de Sinnoh (solo verlo, sin reglas de juego todavía)

## Objetivo
Agregar a la página de batalla un modo "Leyendas de Sinnoh" que dibuje el mapa hexagonal del mod con sus colores, elevación, texturas y tokens, con zoom y desplazamiento táctil, y una ficha al tocar una casilla.

## Contexto
- Rama `sinnoh`, solo local. No ejecutes comandos `git` que escriban.
- Lee `AGENTS.md` (sobre todo "Reglas de código" y "Agregar un modo de batalla") y `docs/sinnoh.md`.
- Datos: `sinnoh_datos.js` define `SIN` (lo genera `herramientas/sinnoh/generar.py`; **no lo edites a mano**):
  - `SIN.img[clave] = [paquete, inicio, bytes, ancho, alto]` dentro de `spr/` + `SIN.packs[paquete]`, imágenes WebP.
  - `SIN.hexes`: `{c, r, l, col, t, w?, col2?, dw?}`. Coordenadas dobles (`c + r` par). Hexágonos de **cara plana** (flat-top): columnas separadas 1,5·tamaño en x y filas 2·(√3/2)·tamaño en y; es decir `x = c·1.5·s`, `y = r·(√3/2)·s`. En el mod, `r` crece hacia el norte, así que en pantalla `y` va invertido. Comprueba la orientación comparando con `sinnoh/datos/mapa.png` (el Mundo Distorsión, la isla roja, queda arriba a la izquierda; la nieve arriba al centro).
  - `l` = nivel de elevación (0 = más bajo). `col` = color. `t` = índice de textura (`SIN.img["tex"+t]`). Las texturas son blancas/grises y en el mod se **multiplican** por el color de la casilla. `w` = agua (la capa de arriba es agua semitransparente y `col2` es el color del fondo). `dw` = Mundo Distorsión.
  - `SIN.tokens`: cada uno con `kind`, `n`, `tags`, `cell: [c, r]`, `b`/`k`/`tier` si tiene, e `img`/`img2` (claves de `SIN.img`).
- Para cargar imágenes reutiliza `packURL(ck, archivo, inicio, bytes, mime)` de `batalla.js` (ya cachea en `midex-spr`). Usa como clave de caché `spr/sin${SIN.v}/${clave}`.

## Archivos que se pueden tocar
- Crear: `sinnoh.js`.
- Editar, **con cambios mínimos**: `batalla.js` (entrada en `render()`, botón en `renderMenu`, y un ícono `const iconMap` junto a los demás íconos si hace falta), `batalla.html` (cargar `sinnoh_datos.js` y `sinnoh.js` después de `escalada.js`, y estilos del mapa si no los pones en `sinnoh.js`), `sw.js` (agregar `sinnoh.js` y `sinnoh_datos.js` a `SHELL` y subir `APP` a `midex-app-v15`).

## NO tocar
- `sinnoh_datos.js`, `spr/*`, `ps.js`, `index.html`, `LEEME.md`, ni ningún otro archivo.
- No cambies `STORE_KEY` ni la forma de lo ya guardado.
- Sin librerías nuevas: JavaScript clásico, global, `"use strict"`, como `escalada.js`.

## Qué hacer
1. **Entrada al modo:**
   - En `renderMenu`, un botón nuevo `data-act="sin"`: "Leyendas de Sinnoh" con una línea de descripción ("Explora Sinnoh en un mapa de hexágonos al estilo del juego de mesa." o similar).
   - En `render()`: `if (VIEW === "sin") return renderSin();`.
   - En `sinnoh.js`: el listener de clics propio (uno solo, que ignore `[data-info]`, como pide AGENTS.md) maneja `data-act="sin"` → `go("sin")`, y un botón "‹ Batalla" para volver al menú.
   - Guardado: `if (!ST.sin) ST.sin = {cam: null}` y `save()`; guarda ahí la cámara (posición y zoom) para que al volver quede igual.
2. **Mapa** (SVG o canvas; elige lo que dé buen rendimiento en celular con 351 hexágonos y ~230 tokens):
   - Ocupa toda la pantalla bajo una barra superior (el `.wrap` tiene ancho limitado: haz que la vista del mapa use el ancho completo, por ejemplo con una clase en `body` mientras `VIEW === "sin"` que se quita al salir).
   - Cada hexágono con su `col` y su textura multiplicada encima (si usas SVG: imagen recortada al hexágono con `mix-blend-mode: multiply` o un filtro `feBlend` multiply).
   - **Elevación con aspecto 3D simple:** dibuja de abajo hacia arriba, levanta cada casilla unos píxeles por nivel (`l`) y muestra un costado más oscuro debajo, para que se vean los escalones como en el mod.
   - Agua: el color `col2` debajo y `col` semitransparente encima.
   - Fondo oscuro detrás del mapa (como la mesa del mod).
3. **Tokens:** dibuja solo los tokens cuya `cell` exista en `SIN.hexes`, centrados en su casilla y a un tamaño que quepa en el hexágono. Si una casilla tiene varios, muéstralos un poco desplazados o el principal más grande. Los escondites (`CardCustom`) van **boca abajo** (usa la imagen del reverso; revisa cuál de `img`/`img2` es el reverso). Las imágenes se cargan de forma diferida; mientras tanto, nada o un círculo tenue.
4. **Cámara:** arrastrar con un dedo o el mouse para mover; pellizcar con dos dedos y la rueda del mouse para hacer zoom (con límites razonables); botón "Centrar" que encuadra todo el mapa. Al abrir por primera vez, el mapa entero encuadrado.
5. **Ficha de casilla:** al tocar (no arrastrar) un hexágono, márcalo y muestra abajo una tarjeta con: coordenadas, nivel de elevación, agua/tierra, Mundo Distorsión si aplica, y sus tokens con nombre, bioma, clima y nivel de encuentro **en español** (Plains→Llanura, Forest→Bosque, Mountain→Montaña, Ocean→Océano; Cold→Frío, Temperate→Templado, Warm→Cálido; W/M/S/L/D→Débil/Moderado/Fuerte/Legendario/Distorsión; "Red/Blue/… Apricorn Tree"→"Árbol de Bonguri rojo/azul/…"). Los nombres propios de lugares quedan como vienen. Usa `esc()` en todo texto.
6. Estilo: el de la app (variables `--surface`, `--ink`, `--accent`, fuentes `--display`/`--body`), funciones cortas, template strings, `$()`.

## Cómo probar
- `python -m http.server 8000` en la carpeta y abrir `http://localhost:8000/batalla.html`.
- En el menú aparece "Leyendas de Sinnoh"; al entrar se ve el mapa completo y parecido a `sinnoh/datos/mapa.png` pero con texturas, elevación y tokens.
- Funciona a 390 px de ancho y en escritorio. Sin errores en la consola.
- Si no tienes navegador, al menos comprueba con Node que `sinnoh.js` no tiene errores de sintaxis (`node --check sinnoh.js`) y revisa la lógica de coordenadas contra `mapa.png`.

## Terminado cuando
- Se puede entrar y salir del modo sin romper el resto del menú (Batalla rápida, Escalada, etc. siguen igual).
- El mapa se ve completo con elevación, texturas, agua y tokens; zoom y desplazamiento funcionan con mouse y con dedos.
- Tocar una casilla muestra su ficha en español.
- `sw.js` tiene los archivos nuevos en `SHELL` y `APP` en v15.

## Al terminar
Resume en español: archivos cambiados y qué cambió en cada uno (en `batalla.js` deberían ser pocas líneas), cómo lo probaste y qué dudas quedaron (por ejemplo tokens que no supiste dónde ubicar).
