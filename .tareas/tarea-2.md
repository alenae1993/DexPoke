# Tarea 2: generador de datos e imágenes de Leyendas de Sinnoh

## Objetivo
Crear `herramientas/sinnoh/generar.py`, que a partir de lo extraído del mod produce `sinnoh_datos.js` y los paquetes de imágenes `spr/sinnoh_*.bin`, y anotar en la documentación que Sinnoh es solo local.

## Contexto
- Rama de git: `sinnoh` (solo local, nunca se sube a GitHub). No ejecutes comandos `git` que escriban (`add`, `commit`, `rm`…): el sandbox no deja escribir en `.git`.
- Ya se corrió `herramientas/sinnoh/extraer_mod.py`; sus salidas están en `sinnoh/datos/` (`mod.json`, `urls.json`, `names.json`). Lee esos archivos para entender su forma.
- Imágenes del mod: `C:\Users\GOLDEN GAMERS\Documents\My Games\Tabletop Simulator\Mods\Images\<nombre de names.json>.png`. Hay 239 de 247; las 8 que faltan son de tipo `bag` y no hacen falta.
- Lee `docs/sinnoh.md` y `AGENTS.md` (formato `MIDEXPAK` de `spr/*.bin` y cómo lo lee `packURL` en `batalla.js`).

## Archivos que se pueden tocar
- Crear: `herramientas/sinnoh/generar.py`.
- Generar (con el script): `sinnoh_datos.js` en la raíz y `spr/sinnoh_0.bin`, `spr/sinnoh_1.bin`…
- Editar: `docs/sinnoh.md` y `AGENTS.md` (solo lo indicado abajo).

## NO tocar
- Ningún otro archivo: ni `batalla.js`, `index.html`, `sw.js`, `LEEME.md`, `extraer_mod.py`, ni nada de `spr/` que no sea `sinnoh_*.bin`.
- No instales librerías. Usa solo la biblioteca estándar de Python y Pillow (ya instalado).

## Qué debe hacer `generar.py`
Uso: `python herramientas/sinnoh/generar.py sinnoh/datos "<ruta a Mods\Images>"` (con valores por defecto para esas dos rutas). Debe poder correrse de nuevo y producir el mismo resultado.

1. **Imágenes**, convertidas a WebP (calidad ~80, conservando la transparencia):
   - Texturas de hexágono (`tex`, 4157 px): reducir a 512 px de lado.
   - Tokens (`tok`), cartas sueltas (`card`), figuras (`fig`): reducir para que el lado mayor sea como máximo 256 px.
   - Hojas de cartas de los mazos (`deck`, unos 8320×7281 con una grilla `w`×`h` en `sheets`): **recortar cada carta** de la hoja y reducirla a 300 px de ancho. La carta `cid` está en la hoja `cid // 100`, posición `cid % 100`, contando de izquierda a derecha y de arriba abajo. Los reversos: si `uniqueBack` es falso, el reverso es una sola imagen; si es verdadero, también es una grilla y se recorta igual.
   - `board` y `table`: omitir. `bag`: omitir.
   - Si falta una imagen, seguir y avisarlo en la salida.
2. **Paquetes:** juntar las imágenes en `spr/sinnoh_N.bin` con el mismo formato que los demás paquetes: encabezado de 16 bytes (`MIDEXPAK` + 8 bytes en cero) y los archivos pegados. Cada paquete de máximo ~15 MB.
3. **`sinnoh_datos.js`:** un script clásico que define `const SIN = {...}` con un comentario inicial en español que explique qué es y que lo genera `generar.py`. Debe contener:
   - `v`: número de versión (1).
   - `packs`: nombres de los paquetes.
   - `img`: índice `{clave: [paquete, inicio, bytes, ancho, alto]}`, donde `inicio` ya cuenta el encabezado (igual que `ASSET`). Claves cortas y legibles: `tex0`…`tex5`, `c<cid>` para el frente de cada carta, `b<idHoja>` o `b<cid>` para reversos, `k<n>` para tokens y figuras.
   - `hexes`: las celdas de `mod.json` (c, r, l, col, t, y w/col2/dw si existen). **Descarta las celdas sin ningún vecino** (hay un hexágono suelto lejos del mapa) e imprime cuáles descartaste. En coordenadas dobles los 6 vecinos de (c, r) son (c±1, r±1) y (c, r±2).
   - `tokens`: solo `Custom_Token`, `Custom_Tile`, `CardCustom` y `Figurine_Custom` que estén sobre el mapa (sin los `bag:*` ni `Custom_Board`), con: nombre, etiquetas, celda `[c, r]`, bioma/clima/nivel si los tienen, GMNotes si no está vacío, y la clave de su imagen (y de la segunda imagen si la tiene).
   - `decks`: cada mazo con su nombre, etiquetas, y sus cartas con `cid`, nombre, etiquetas, la clave de su frente y reverso, y los datos Lua de las cartas Pokémon tal como vienen en `mod.json`.
   - JSON compacto, sin sangría.
4. Al final, imprimir un resumen: cantidad de imágenes por tipo, paquetes y su tamaño, tamaño de `sinnoh_datos.js`, celdas descartadas e imágenes faltantes.

Estilo del script: como `extraer_mod.py` (Python simple, comentarios breves en español). Docstring inicial con el uso.

## Documentación
- En `docs/sinnoh.md`, al inicio (después del objetivo), agrega: **"Solo local: Leyendas de Sinnoh vive solo en la rama `sinnoh` del PC del dueño. No se sube a GitHub y el sitio publicado no la incluye."** Y en el plan de trabajo, deja escrito que el paso 1 ya se hizo y que el paso 2 lo hace `generar.py` (describe brevemente sus salidas).
- En `AGENTS.md`, en el punto de "Pendiente" de Leyendas de Sinnoh, agrega la misma nota de "solo local, rama `sinnoh`, no se sube".

## Terminado cuando
- `generar.py` corre sin errores y genera `sinnoh_datos.js` y `spr/sinnoh_*.bin`.
- Ningún paquete pasa de 15 MB.
- Se puede comprobar una imagen: leer su entrada de `SIN.img`, cortar esos bytes del paquete y abrirla como WebP válida con las medidas indicadas (hazlo con un pequeño chequeo en Python y repórtalo; no lo guardes en el repo).
- Revisa a ojo una carta recortada (por ejemplo la primera carta Pokémon del mazo Weak) guardándola en `sinnoh/datos/` y confirma que no quedó corrida ni cortada.
- La documentación tiene la nota de "solo local".

## Al terminar
Resume en español: archivos creados o cambiados, el resumen que imprimió el script, cómo comprobaste las imágenes y cualquier duda (por ejemplo cartas cuyo recorte no cuadra).
