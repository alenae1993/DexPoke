# Tarea 16: Dioses de Sinnoh (Fractura Celestial, Seguidor, Aura Celestial) y cartas de Cambio de Destino

(Corresponde a las tareas 17 y 18 del plan.)

## Objetivo
Implementar los **Dioses de Sinnoh** (Dialga, Palkia y Giratina en el Santuario Origin, ficha de Seguidor, Aura Celestial y artefactos celestiales) y los **efectos de las 42 cartas de Cambio de Destino** (incluido "Juega 3"), adaptados sin dados.

## Contexto
- Rama `sinnoh`, solo local. No ejecutes comandos `git` que escriban.
- Lee primero `.tareas/plan-sinnoh-completo.md`, `AGENTS.md`, `docs/sinnoh.md` y `sinnoh.js` (tareas 5–15). Ya existen: `run.fate` (mano de Destino, máx. 5, con robo por estrellas y eventos), `run.fractures` (cuenta de Fracturas Celestiales de la tarea 15), `run.originGod` (vacío; bloquea las ofrendas del Santuario Origin), combates contra legendarios (sin huida, 4 PV), captura (`sinThrowBall`, fórmula y bonos), botones de combate de Sinnoh mediante `sinBallsHTML(me)` (enganche ya existente en `batalla.js`), movimiento (`sinReachable`, `sinMoveTo`), artefactos celestiales en `run.items` (`adamantorb`, `lustrousorb`, `griseousorb`).
- **Mazo de Destino** (`"Change of Fate Card"`, 42): por imagen, `cid` 373300 = **Dialga** (12), 373301 = **Palkia** (12), 373302 = **Giratina** (12), 373303 = **Arceus** (6). Frente en `img`.
- **Reglas del mod (reglamento p. 18–19):**
  - **Ficha de Seguidor:** empiezas con ella boca abajo. En la **primera Fractura Celestial** se voltea y eliges de qué Dios eres seguidor (Dialga, Palkia o Giratina). En cada Fractura Celestial puedes cambiarla en secreto. Después, la ficha del Dios con **más seguidores** va al Santuario Origin, reemplazando a la que hubiera (en solitario: el Dios que sigues).
  - **Mientras un Dios esté en el Santuario Origin:** sus seguidores ganan **+1 movimiento por turno**. No se puede hacer ofrenda allí (tampoco la del Corazón) hasta derrotarlo o capturarlo; al hacerlo, la ficha se retira. En la campaña Corazón de Sinnoh, si vences a un Dios, **juegas otro turno inmediatamente**.
  - **Aura Celestial:** al encontrarlo en el Santuario Origin **sin su artefacto celestial** (Diamansfera para Dialga, Lustresfera para Palkia, Griseosfera para Giratina): requiere una tirada de 7 para capturarlo y, tras derrotar su primera forma, pasa a su **segunda forma totalmente restaurada**. Con el artefacto, se evitan esos efectos.
  - **Cartas de Destino:** máximo 5 en la mano; **1 efecto por turno** (dentro o fuera de combate). "Juega 3" = jugar 3 cartas iguales juntas; **la ficha de Seguidor cuenta como 1 carta** de su Dios para "Juega 3"; **Arceus cuenta como cualquier carta** para "Juega 3". Las jugadas se descartan; si el mazo se acaba, se baraja la pila de descartes.

## Adaptación a los juegos (decisión del dueño: adaptar lo que use dados)
| Carta | Efecto ×1 | Efecto "Juega 3" |
|---|---|---|
| **Dialga** (Repite) | **Repetir una captura fallida:** al fallar un lanzamiento, en vez de perder el turno puedes jugar Dialga y repetir la tirada con la misma Ball (no se gasta otra). | **Repite cualquiera:** tras **perder** un combate (antes de volver al pueblo), repetirlo desde el principio contra los mismos rivales, con tu equipo como estaba al empezar. |
| **Palkia** (Teletransporte) | **Teletranspórtate** a cualquier casilla a **3 o menos** de distancia **sin importar la elevación** (fuera de combate; no gasta movimientos; revela escondites solo en la casilla destino). | **Teletransporte selectivo:** a **cualquier casilla** del mapa (excepto el Mundo Distorsión). |
| **Giratina** (Sacrifica) | En combate, antes de atacar: tu Pokémon activo pierde **1/8 de su PS máxima** y gana **+1 Ataque y +1 Ataque Especial**. | **Sacrifica todo:** tu Pokémon activo queda con **1 PS** y gana **+2 Ataque, +2 Ataque Especial y +1 Velocidad**. |
| **Arceus** (Comodín) | Sin efecto propio; cuenta como cualquier carta para "Juega 3". | **Bendición de Arceus:** en Corazón de Sinnoh, **cura y revive** a todo tu equipo (fuera de combate). (En Ultra Explosión será una Bendición de Arceus: tarea 21.) |

- Los efectos en combate (Giratina) se aplican con `>eval` sobre `battle.sides[0].active[0]` (por ejemplo `p.damage(...)`/`p.sethp(...)` y `p.boostBy({atk:1, spa:1})`), escribiendo el mensaje con `say(me, …)`. Pruébalo primero en Node con el motor real.
- **Aura Celestial adaptada:** sin artefacto, el ratio de captura del Dios se multiplica por **0,25**; al derrotar su forma normal, comienza **en seguida un segundo combate** contra su **Forma Origen** (`Dialga-Origin`, `Palkia-Origin`, `Giratina-Origin`) con PS completos, y tu equipo como quedó del primero. Con su artefacto, un solo combate y ratio normal.
- **Niveles de los Dioses:** 50 (constante).
- **Victoria contra un Dios:** se retira de Origin, 4 PV (+2 si lo debilitaste) y, en Corazón de Sinnoh, **otro turno inmediato** (`turn++`, se reinician movimientos y acciones del turno como en "Terminar turno", sin pasar por la recuperación de derrota).

## Archivos que se pueden tocar
- Editar: `sinnoh.js`, `docs/sinnoh.md` (Dioses, Seguidor, Aura, Destino y adaptaciones) y `AGENTS.md` (solo el punto de Sinnoh en "Pendiente").

## NO tocar
- `batalla.js` (usa el enganche `sinBallsHTML` para mostrar en combate también los botones de Destino; si de verdad falta otro enganche, detente y explícalo), `ps.js`, `data.js`, `sinnoh_datos.js`, `spr/*`, `sw.js`, ni ningún otro archivo. No uses `data-pick`. No cambies nada fuera de `ST.sin`.

## Qué hacer
1. **Seguidor:** `run.follower` (`null` boca abajo, luego `"dialga" | "palkia" | "giratina"`). Al resolver una Fractura Celestial (tarea 15), además de robar la carta: pantalla para elegir/cambiar de Dios (la primera vez es obligatorio elegir), y colocar a ese Dios en el Santuario Origin (`run.originGod`), reemplazando al anterior. Muestra la ficha de Seguidor en la Bolsa.
2. **Dios en el mapa:** dibuja su ficha en el Santuario Origin. Mientras esté, +1 movimiento por turno si lo sigues. En la casilla: "Combatir contra <Dios>" (con el aviso de Aura Celestial si no tienes su artefacto).
3. **Combate contra un Dios** con las reglas de arriba (Aura: ratio ×0,25 y segunda fase en Forma Origen; sin artefacto vs con artefacto). Música `bgm_final`. Al derrotarlo o capturarlo: `run.originGod = null`, recompensas y otro turno inmediato.
4. **Mano de Destino:** en la Bolsa, la mano con las imágenes; botones para jugar ×1 o "Juega 3" cuando aplique (contando Seguidor y Arceus). Controla **1 efecto por turno** (`run.fatePlayed`, se reinicia al terminar turno y al jugar el turno extra).
5. **Efectos fuera de combate:** Palkia ×1/×3 (modo de selección en el mapa: resalta las casillas válidas y al tocarlas te mueve), Arceus ×3 (curar y revivir).
6. **Efectos en combate** (botones junto a las Balls vía `sinBallsHTML`): Giratina ×1/×3. Dialga ×1 aparece como opción tras un lanzamiento fallido (antes de pasar el turno). Dialga ×3 aparece en la pantalla de derrota de Sinnoh ("Repetir combate").
7. Descartes del mazo de Destino (`run.fateDeck`, `run.fateDiscard`) y rebarajado; partidas antiguas se migran (la mano actual se conserva).

## Cómo probar
- Node: conteo del mazo (12/12/12/6), reglas de "Juega 3" con Seguidor y Arceus, límite de 1 efecto por turno, `>eval` de Giratina en un combate real (PS y boosts), Aura Celestial (ratio y segunda fase con Forma Origen en el motor).
- Navegador (`python -m http.server 8000` → `http://localhost:8000/batalla.html` → Leyendas de Sinnoh): forzar una Fractura Celestial (por consola), elegir Dios, verlo en Origin, +1 movimiento; usar Palkia ×1 y ×3; Giratina en combate; fallar una captura y usar Dialga; perder y usar Dialga ×3; combatir a un Dios sin artefacto (dos fases) y con artefacto. Revisa la consola: sin errores.

## Terminado cuando
- Los Dioses, el Seguidor y el Aura Celestial funcionan con sus reglas adaptadas.
- Las 4 cartas de Destino tienen sus efectos ×1 y "Juega 3", con el límite por turno.
- Todo persiste al recargar; partidas antiguas se migran.
- No se tocó `batalla.js` ni nada fuera de lo permitido.

## Al terminar
Resume en español: cambios, cómo lo probaste (incluidos los `>eval` en el motor real) y dudas.
