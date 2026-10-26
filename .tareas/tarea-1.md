# Tarea 1: limpiar archivos duplicados de la raíz

## Objetivo
Borrar de la raíz del repo los archivos duplicados o vacíos que quedaron por subidas manuales (Pendiente 2 de `AGENTS.md`).

## Archivos que se pueden tocar
Borrar (solo estos, en la raíz del repo):
- `icon-192.png`
- `icon-512.png`
- `icon-maskable-512.png`
- `apple-touch-icon.png`
- `favicon-32.png`
- `actualizar_datos.py` (el de la raíz; el bueno es `herramientas/actualizar_datos.py`)
- `download` (archivo vacío)

Editar:
- `AGENTS.md`: solo las secciones "Pendiente" y "Problemas conocidos".

## NO tocar
- Nada dentro de `icons/` ni `herramientas/`.
- `sw.js`, `index.html`, `batalla.html`, `manifest.webmanifest`, `LEEME.md` ni ningún otro archivo.
- No subas `APP` en `sw.js`: los archivos borrados no están en `SHELL`.

## Pasos
1. Antes de borrar, comprueba con `grep` que ningún `.html`, `.js`, `.webmanifest` ni `.md` use esos archivos de la raíz (todas las referencias deben apuntar a `icons/...` o `herramientas/...`). Si encuentras alguna referencia a un archivo de la raíz, detente y repórtala sin borrar nada.
2. Borra los 7 archivos como archivos normales (`Remove-Item` o `rm`), **sin usar git**. No ejecutes ningún comando `git` que escriba (`git rm`, `git add`…): el sandbox no deja escribir en `.git`. Claude los pasará a git después de revisar.
3. En `AGENTS.md`:
   - Quita el punto 2 de "Pendiente" ("Limpiar duplicados del repo…") y renumera los siguientes (3→2, 4→3, 5→4). Ojo: el punto 1 dice "Si no aparece, revisa `sw.js`…" y el de Escalada dice "(ver Pendiente 3)" en "Problemas conocidos": actualiza esa referencia al nuevo número.
   - Quita la línea "Hay duplicados en la raíz del repo (ver Pendiente 2)." de "Problemas conocidos".

## Reintento 1
El intento anterior se detuvo porque `git rm` falló con "Permission denied" en `.git/index.lock`. La comprobación con `grep` ya pasó: ningún archivo de la app usa los archivos de la raíz. Esta vez borra los archivos sin git (paso 2) y termina el paso 3.

## Terminado cuando
- Los 7 archivos ya no existen (`git status` puede mostrarlos como ` D`, borrados sin preparar).
- `icons/` sigue con sus 5 íconos y `herramientas/actualizar_datos.py` sigue existiendo.
- `AGENTS.md` no menciona los duplicados y la numeración de "Pendiente" es correcta.
- No hay otros cambios.

## Restricciones
- Modo 1 de `AGENTS.md`: solo esta tarea, sin commits.
- Al terminar, resume en español qué borraste, qué cambiaste en `AGENTS.md` y cómo lo comprobaste.
