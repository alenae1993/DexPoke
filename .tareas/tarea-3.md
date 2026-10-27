# Tarea 3: nombres de especie de Showdown en las cartas de Sinnoh

## Objetivo
Que cada carta Pokémon de `sinnoh_datos.js` diga qué especie de Showdown es (y a cuáles evoluciona), y dejar un script que lo verifique contra el motor.

## Contexto
- Rama `sinnoh`, solo local. No ejecutes comandos `git` que escriban.
- Las cartas Pokémon de `SIN.decks[].cards[]` tienen los datos Lua en `d` (`pokedex_name`, `internal_name`, `evolve_into`…). Los genera `herramientas/sinnoh/generar.py` (tarea 2).
- Ya se comprobó: con `pokedex_name` se resuelven las 556 cartas en `Dex.species.get`. Lo que falla son las formas de Shellos y Gastrodon:
  - `internal_name` "East Ocean Shellos" / "West Ocean Shellos" / "East Ocean Gastrodon" / "West Ocean Gastrodon".
  - En `evolve_into` aparecen "East Ocean Gastrodon" y "West Ocean Gastrodon", que no existen en Showdown.
  - En Showdown son `Shellos` (oeste, forma base), `Shellos-East`, `Gastrodon` (oeste, forma base) y `Gastrodon-East`.
- Los nombres entre paréntesis del campo `n` ("Zubat (Recluta del Equipo Galaxia)", "Arceus (Helio)", "Necrozma (Fase 1)"…) son solo etiquetas; la especie es `pokedex_name`.

## Archivos que se pueden tocar
- Editar: `herramientas/sinnoh/generar.py`.
- Crear: `herramientas/sinnoh/verificar.js`.
- Regenerar con el script: `sinnoh_datos.js` (y los `spr/sinnoh_*.bin` si el script los reescribe; no deben cambiar).

## NO tocar
- Ningún otro archivo. Nada de `ps.js`, `batalla.js`, `data.js`, documentación.
- Sin librerías nuevas: `verificar.js` usa solo Node (sin npm) y carga `ps.js` y `sinnoh_datos.js` con `vm`.

## Qué hacer
1. En `generar.py`, para cada carta con datos Lua (`d`), agrega:
   - `d.sp`: nombre de especie de Showdown. Regla: `pokedex_name`; si `internal_name` empieza con "East Ocean ", usa `<pokedex_name>-East`. "West Ocean " es la forma base (sin sufijo).
   - `d.evo`: la lista `evolve_into` convertida con la misma regla ("East Ocean Gastrodon" → `Gastrodon-East`, "West Ocean Gastrodon" → `Gastrodon`). Si no hay `evolve_into`, no agregues `evo`.
   - Deja los campos originales tal cual.
   - Usa un diccionario pequeño o una función clara, comentada en español; no hardcodees carta por carta.
2. Regenera `sinnoh_datos.js` con el script.
3. Crea `herramientas/sinnoh/verificar.js` (uso: `node herramientas/sinnoh/verificar.js`, desde la raíz):
   - Carga `ps.js` y `sinnoh_datos.js` en un contexto `vm` (el bundle expone `PS`; `PS.Dex` es el Dex).
   - Para cada carta con `d`: comprueba que `Dex.species.get(d.sp).exists` y que todo `d.evo` existe.
   - Comprueba también que cada entrada de `SIN.img` apunta dentro de su paquete (`inicio + bytes <= tamaño del archivo`) y que todas las claves de imagen usadas en `tokens` y `decks` existen en `SIN.img`.
   - Imprime un resumen (cartas revisadas, especies distintas, errores) y sale con código 1 si hay errores.
   - Comentario inicial en español explicando para qué sirve.

## Terminado cuando
- `python herramientas/sinnoh/generar.py` corre sin errores.
- `node herramientas/sinnoh/verificar.js` termina con 0 errores.
- Los `spr/sinnoh_*.bin` quedan idénticos a los actuales (compara el SHA-256 antes y después).
- En `sinnoh_datos.js`, las cartas de Shellos/Gastrodon Este tienen `sp` con `-East` y ninguna `evo` contiene "Ocean".

## Al terminar
Resume en español: qué cambiaste en `generar.py`, la salida de `verificar.js`, la comprobación de SHA-256 y cualquier duda.
