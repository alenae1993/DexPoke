# Tarea 18: Tarjetas de Entrenador (51 clases con 2 habilidades desbloqueables)

(Corresponde a la tarea 20 del plan.)

## Objetivo
Agregar las **Tarjetas de Entrenador** del mod: al empezar la partida eliges una clase; sus **2 habilidades** (azul y roja) empiezan bloqueadas y se desbloquean jugando; sus efectos se adaptan a los juegos.

## Contexto
- Rama `sinnoh`, solo local. No ejecutes comandos `git` que escriban.
- Lee primero `.tareas/plan-sinnoh-completo.md`, `AGENTS.md`, `docs/sinnoh.md` y `sinnoh.js` (tareas 5–17). Todo lo que nombran las tarjetas ya existe: movimiento y elevación (`sinReachable`), biomas de casilla (por los tokens cercanos o por `col`; usa el bioma del token de la casilla si existe y si no, deriva Océano de `h.w`), búsqueda/oferta, captura (`sinCaptureRoll`, bonos), huida, PV, Bonguri, Ginkgo, vuelo, estofados, objetos de batalla y artefactos (objetos en `Dex.data.Items`), ofrendas, legendarios, Seguidor y Destino, Sellos y "MT" de cartas, Caja, curación.
- Mazo: cartas con la etiqueta `"Trainer Card"` (51). Imagen del frente en `img`. Identifica cada carta por su imagen y deja en el código la tabla `clase → {azul, roja}` (abajo).
- El reglamento no explica las Tarjetas de Entrenador. Cada tarjeta muestra 3 estrellas (1 marcada) y "Derrota u obtén 1 Pokémon Moderado"; cada habilidad tiene un candado.

## Reglas (interpretación de Claude, anótala en la documentación como tal)
- **Elección:** al crear la partida (después del inicial y antes del Prólogo) se roban **3 tarjetas al azar** y eliges **1**. Partidas antiguas: al abrirlas se ofrece la misma elección una vez.
- **Desbloqueo:** la **habilidad azul** se desbloquea al **derrotar u obtener 1 Pokémon Moderado**; la **roja**, al **derrotar u obtener 1 Pokémon Fuerte** (o Alfa o legendario). Muestra un aviso al desbloquear. Los efectos "Cuando se desbloquea…" se aplican en ese momento.
- La tarjeta y sus candados se ven en un panel "Entrenador" (botón en la barra) con su imagen.

## Adaptación general (decisión del dueño: adaptar lo que use dados)
Implementa los efectos de combate como **condiciones de lado** propias en `Dex.data.Conditions` (con `onBasePower`, `onModifyDamage`, `onSourceModifyDamage`, `onModifyPriority`, `onSwitchIn`, `onResidual`, etc.) que se agregan a tu lado al empezar cada combate de Sinnoh mediante el `>eval` de `opts.pre` (`battle.sides[0].addSideCondition(...)`). **Comprueba primero en Node con el motor real** que una condición agregada así funciona antes del primer turno; si no, aplícala en el primer `>eval` posible y explícalo. Equivalencias:
- "+N fuerza de ataque" a un tipo o movimiento → **+20 %** de potencia (+N≥2 → +30 %).
- "+N iniciativa" → **+1 Velocidad** al entrar (N≥3 → +2). "−N iniciativa" → −1 Velocidad.
- "+N salud" → **+1 Defensa y +1 Def. Especial** al entrar (N≥5 → además cura 1/8 al final de cada turno). "−N salud" → −1 Defensa.
- "recibe N menos de daño" → **−15 %** de daño recibido de ese tipo/condición (N≥2 → −25 %).
- "daño máximo de un solo ataque" (6 o 3) → no puede perder más del **50 %** (o **30 %**) de su PS máxima con un solo golpe.
- "golpes críticos +2 / símbolos −1", "cambiar resultado de dados", "dados de amplificador" y otros que solo existen con dados → efecto equivalente razonable (p. ej. +1 nivel de crítico) **o omitido**; lista los omitidos.
- Efectos "Seguidor de Dialga/Palkia/Giratina/Arceus" → fija `run.follower` (Arceus: cuenta como seguidor de los 3 para "Juega 3" y para el +1 movimiento).
- "Busca a <Legendario> y añádelo a tu equipo" → añade ese legendario (nivel del jugador más alto del equipo, o 30 como mínimo) al equipo o a la Caja.
- Efectos con varios entrenadores (Gran Primicia, Ladrón de Ofrendas, Monopolio Comercial, robar artefactos, "no pueden ser tomados") → **omitidos en solitario** (la habilidad queda sin efecto; indícalo en el panel).
- Herramientas de dibujo, Rueda del Tiempo, Hoja de Recorrido u otros elementos de mesa → adapta a una mecánica equivalente simple o omite y lista.

## Las 51 tarjetas (azul · roja)
1. **Criador Pokémon** — Movimiento Huevo: al evolucionar un Pokémon Débil, puede aprender el movimiento característico de su preevolución; ya no puede evolucionar. · IVs Casi Perfectos: los Pokémon con Movimiento Huevo ganan +5 salud y +5 iniciativa.
2. **Patinadora** — Patinaje sobre Ruedas: una vez por turno, hasta 2 casillas de Llanura gratis; los salvajes no legendarios solo huyen tras derrotar a 2 de tus Pokémon. · Equipo de Protección: daño máximo 6 de un solo ataque.
3. **Pokéfan** — Gran Encanto: tus Pokémon Débiles reciben como máximo 3 de daño de un solo ataque. · Carta de Fidelidad: al fabricar un objeto de batalla, ganas otro gratis.
4. **Dominguera** — Explorador del Bosque: una vez por turno, hasta 2 casillas de Bosque gratis; puedes volar a los Campamentos desde cualquier casilla descartando 1 Bonguri. · Cesta de Pícnic: al elaborar un estofado, obtienes el efecto de otro gratis.
5. **Nadador** — Nadar Rápido: una vez por turno, hasta 2 casillas de Océano gratis; tus Pokémon Agua +1 iniciativa. · Técnica de la Mariposa: al atacar con un movimiento Agua, puedes cambiarlo a tipo Bicho o Volador.
6. **Soldado Equipo Rocket** — Ladrón de Pokémon: en combate contra otro entrenador, puedes intentar capturar su Pokémon con −2 a la tirada. · Retribución: cuando uno de tus Pokémon se desmaya, inflige 2 de daño al rival; si te quedas sin Pokémon, puedes viajar a cualquier casilla y te restableces al comenzar el turno siguiente.
7. **Triatleta** — Nadar, Pedalear y Correr: una vez por turno, hasta 2 casillas no montañosas gratis. · Triple Amenaza: si tu Pokémon conoce movimientos de 3 tipos, puede cambiar el tipo de su ataque a cualquiera de ellos.
8. **Señorita Aroma** — Dulce Aroma: en las capturas en Árboles de Bonguri, 1 símbolo de estado cuenta como golpe normal. · Remedio Natural: con un movimiento Planta o Hada, el usuario se cura la mitad del daño infligido.
9. **Modelo** — Dama Afortunada: golpes críticos +2 de daño, símbolos de estado −1. · Carisma Natural: con movimientos Normal o Siniestro, los símbolos de estado infligen +1.
10. **Pokéabu** — Guardián del Santuario: en cada Ofrenda de Santuario robas 1 carta de Evento extra (eliges las mismas que normalmente). · Protector Legendario: cuando se activa Ultraimpulso, tus legendarios se curan 3, reinician su fatiga y su siguiente ataque gana +2.
11. **Domadragón** — Cría Suprema: al desbloquear, añade un Pokémon Débil de tipo Dragón del mazo con el objeto Dragón Supremo (no se desequipa); cuesta 5 PV extra evolucionar. · Fuerza Máxima: tu Dragón Supremo gana +6 salud, +2 iniciativa y +1 fuerza en todos sus movimientos.
12. **Bruja** — Magia Inestable: al infligir un estado, puedes tirar el dado de estado para infligir otro en su lugar. · Lanzador de Hechizos: puedes infligir estados adicionales si el objetivo no los tiene; tus movimientos Fantasma +1 fuerza.
13. **Periodistas** — Gran Primicia: cuando otro entrenador obtiene un Sello, puedes ir a desafiarlo y, si ganas, ganar ese Sello. · Análisis del Equipo: fuera de combate, intercambiar movimientos enseñados entre tus Pokémon (el receptor debe poder aprenderlo).
14. **Médium** — Alcance Telequinético: una vez por turno, interactuar con algo a hasta 2 casillas. · Manipulación Sutil: con Psíquico o Fantasma, cambiar el resultado de 1 dado.
15. **Veterana** — Experto Silvestre: al encontrar un Depósito de Bonguri, +2 Bonguri del mismo tipo y 1 movimiento adicional este turno. · Fuerza Vendaval: con Hielo o Dragón, añadir hasta 2 símbolos de estado.
16. **Artista** — Esquema Detallado: tras derrotar un salvaje, enseñar su movimiento a cualquier Pokémon sin importar sus tipos aprendibles. · Obra Maestra: si tu grupo tiene un movimiento de cada tipo, todos tus movimientos +2 fuerza.
17. **Jardinero** — Elección de Bonguri: una vez por turno, obtener 1 Bonguri del Árbol sobre el que estés. · Forma Recortada: Planta y Roca +3 iniciativa, −2 salud.
18. **Guitarrista** — Mejora de Potencia: dado de Amplificador que crece con símbolos de estado y añade daño. · Exceso de Amplificador: con Eléctrico, duplicar el amplificador una vez por combate.
19. **Cazabichos** — Frenesí de Captura: tras capturar un Bicho, +2 PV y un turno extra (no repetible en el turno extra). · Experto en Bichos: movimientos Bicho +2 iniciativa y +1 fuerza.
20. **Karateka** — Superentrenamiento: al derrotar un salvaje, +2 PV. · Espíritu de Lucha: fuera de combate, quemar a tu Pokémon; en tipos Lucha la quemadura aumenta su daño en 2 en vez de reducirlo.
21. **Entrenador Guay** — Creador de Equipo: reintentar una búsqueda una vez por encuentro; los objetos de batalla cuestan 1 de cada Bonguri de su receta. · Ventaja Competitiva: Pokémon Fuertes +1 iniciativa.
22. **Macarra** — Ladrón de Ofrendas: cuando otro entrenador hace una Ofrenda, ganas el Bonguri descartado. · Postura Intimidante: Siniestro y Veneno reciben −2 de daño.
23. **Ornitólogo** — Silbido de Pájaro: volar a un pueblo desde cualquier casilla descartando 1 Bonguri (sin Reclutas en el destino). · Maniobras Evasivas: Volador no recibe daño de ataques de 2 o menos.
24. **Niña Soñadora** — Estrella del Deseo: tus Pokémon se curan 1 extra cada vez que son curados. · Soñador Diurno: fuera de combate, dormir a tu Pokémon; en tipos Hada el sueño cura 1 al final de cada turno.
25. **Acólita de Diamante** — Devoción Temporal: al desbloquear, Seguidor de Dialga para siempre; la ficha cuenta como 2 cartas para "Juega 3" de Dialga. · Elegido de Dialga: al desbloquear, añade a Dialga a tu equipo (−1 salud e iniciativa por fragmento que falte).
26. **Pokécolector** — Colección de Sellos: reclamar dos veces cada recompensa de Sellos. · Coleccionista Pokémon: los movimientos de las recompensas de Sellos sirven para todo el equipo; los descartes se añaden a tu reserva.
27. **Pescador** — Súper Caña: en los Arrecifes, 1 símbolo cuenta como golpe; tras capturar en un Arrecife, tamaño de captura extra. · Captura del Día: salud según Tamaño de Captura; por 2 PV, subir el Tamaño de Captura.
28. **Chef** — Experto en la Materia: intercambiar Bonguri de la bolsa por otros del mismo nivel. · Estofado Maestro: cuesta 1 de cada Bonguri: tus Pokémon +1 fuerza a sus movimientos del mismo tipo hasta el final del combate.
29. **Mochilero** — Tienda Portable: restaurar al completo 1 Pokémon después de cada encuentro salvaje. · Capacidad de Carga: tus Pokémon pueden equipar 2 objetos distintos.
30. **Damisela** — Herencia Noble: al desbloquear, +7 PV; los costes de evolución cuestan 2 PV menos. · Hiperpoción: una vez por combate, restaurar vida y estados de un Pokémon no debilitado.
31. **Joven** — Amigos de la Infancia: Pokémon Débiles +1 salud y +1 iniciativa. · Carrera Futura: al desbloquear, roba 5 tarjetas de entrenador y cambia esta por una de ellas, activando sus efectos.
32. **Aristócrata** — Moneda Amuleto: tras capturar o derrotar un salvaje, el doble de Bonguri. · Gloria Ball: al desbloquear, recibes una Gloria Ball que captura automáticamente; al liberar al Pokémon la recuperas.
33. **Mercader Ginkgo** — Monopolio Comercial: cuando otro entrenador usa el Comercio Ginkgo, ganas los Bonguri que descarta. · Recursos Descartables: antes de atacar, descartar 1 Bonguri para fijar la fuerza de un movimiento en 4/5/6 este turno según su nivel.
34. **Esprit** — Planificación Anticipada: tras un combate, usar los movimientos restantes sin interactuar con nada más. · Golpe Oportuno: si inicias un combate salvaje sin haberte movido este turno, tu primer ataque hace el doble de daño.
35. **Montañero** — Equipo de Montaña: una vez por turno, hasta 2 casillas de Montaña gratis, sin importar la elevación. · Pies Firmes: Roca y Tierra +4 salud, −1 iniciativa.
36. **Prendefuegos** — Reunir Leña: una vez por turno, retirar un Árbol de Bonguri para obtener 3 de Leña. · Ignición Ardiente: con un movimiento Fuego, gastar 1 Leña para quemar al rival e infligirle 2 de daño.
37. **Acólita de Perla** — Devoción Espacial: Seguidor de Palkia para siempre (cuenta como 2). · Elegido de Palkia: añade a Palkia a tu equipo.
38. **Entrenador Aéreo** — Traje de Vuelo: moverte a casillas adyacentes 2+ niveles más abajo; después, hasta 4 casillas más mientras no subas. · Superioridad Aérea: Volador +1 fuerza si el rival no es Volador.
39. **Operario** — Ingeniero Civil: por 2 PV, construir Carreteras en casillas no oceánicas a las que te muevas este turno; moverse entre carreteras conectadas cuesta 1. · Obras Viales: cuando tus Pokémon Acero entran, la fatiga del rival +3 y no puede cambiar ni huir.
40. **Turista** — Recorrido Histórico: al visitar una Localización Legendaria de Artefactos, márcala y obtén una Instantánea Legendaria (clon de su carta). · Álbum de Vacaciones: enseñar las Instantáneas como movimientos; si completas el recorrido, +30 PV.
41. **Acólita Imparcial** — Devoción Eterna: Seguidor de Arceus (cuenta como seguidor de los 3 Dioses). · Sentencia de Arceus: después de atacar, el rival se debilita si le quedan 2 o menos de vida.
42. **Buceador** — Tesoro Hundido: una vez por turno en Océano, barajar los descartes de Puntos Ocultos, sacar uno y colocarlo en tu casilla. · Buceo: tras atacar con Agua, el usuario puede cambiarse y curarse los estados.
43. **Dama Parasol** — Previsión del Tiempo: elegir un clima de arena (3 PV en un santuario para cambiarlo); los movimientos de ese clima +2 fuerza. · Paraguas Útil: −2 de daño de los movimientos que coincidan con el clima actual.
44. **Chico Ninja** — Ataque Sorpresa: con Ventaja de Iniciativa, ir primero siempre. · Dardo Tóxico: con la Ventaja de Iniciativa, envenenar, confundir o adormecer al rival.
45. **Soldado Equipo Magma** — Túneles de Magma: al final del turno en una casilla de Montaña, moverte a cualquier otra de Montaña. · Tierra Desolada: en tus combates, Fuego +1 fuerza y los Pokémon Fuego reciben 1 menos de daño.
46. **Científica** — Observación de Campo: una vez por turno, buscar en un Árbol, Arrecife o Puerta sin combatir y enseñar los movimientos vistos. · Análisis de Debilidades: daño por ventaja de tipo +1.
47. **Soldado Equipo Aqua** — Inmersión Submarina: al final del turno en Océano, moverte a cualquier otra casilla de Océano. · Mar Primordial: Agua +1 fuerza y los Pokémon Agua reciben 1 menos de daño.
48. **Ruinamaníaco** — Cazador de Artefactos: una vez por turno, revelar 1 Punto Oculto Especial; si es un Artefacto, moverte hasta él y equiparlo. · Experto en Artefactos: tus Artefactos +1 fuerza a sus bonificaciones y no pueden ser tomados.
49. **Pokémaníaco** — Disfraz Pokémon: contra un salvaje, puedes usar su movimiento característico. · Sustituto Inesperado: al desbloquear, objeto Sustituto: el portador puede cambiarse justo antes de recibir un ataque.
50. **Acólita de Platino** — Devoción Renegada: Seguidor de Giratina (cuenta como 2). · Elegido de Giratina: añade a Giratina a tu equipo.
51. **Pokémon Ranger** — Rancho Pokémon: guardar Pokémon en los espacios bloqueados del equipo (no combaten). · Compañeros Leales: Pokémon Moderados +1 salud y +1 iniciativa por cada espacio desbloqueado (máximo +3 en Ultra Explosión).

## Archivos que se pueden tocar
- Editar: `sinnoh.js`, `docs/sinnoh.md` (Tarjetas de Entrenador: reglas interpretadas, adaptación de cada una y lista de omitidas) y `AGENTS.md` (solo el punto de Sinnoh en "Pendiente").

## NO tocar
- `batalla.js` (si de verdad falta un enganche, detente y explícalo), `ps.js`, `data.js`, `sinnoh_datos.js`, `spr/*`, `sw.js`, ni ningún otro archivo. No uses `data-pick`. No cambies nada fuera de `ST.sin`.

## Qué hacer
1. Elección de tarjeta (nueva partida y migración), panel "Entrenador", desbloqueos con aviso.
2. Implementar las habilidades con la adaptación general. Prioriza las que tienen equivalente directo (movimiento gratis por bioma, PV extra, Bonguri extra, curaciones, Seguidor, legendario al equipo, potenciadores de tipo, reducción de daño, velocidad). Las que no tengan equivalente razonable: omitir y listar.
3. Cada habilidad muestra en el panel su texto original y, debajo, "En este juego: …" con la adaptación (o "Sin efecto en solitario").

## Cómo probar
- Node: elección y desbloqueos; al menos 10 habilidades de distinto tipo (movimiento por bioma, PV, potenciador de tipo en combate real con seed fijo, reducción de daño en combate real, Seguidor, legendario al equipo).
- Navegador (`python -m http.server 8000` → `http://localhost:8000/batalla.html` → Leyendas de Sinnoh): nueva partida con elección de tarjeta, desbloquear ambas habilidades derrotando un Moderado y un Fuerte, ver el panel. Revisa la consola: sin errores.

## Terminado cuando
- Se elige una tarjeta al empezar (y en partidas antiguas), se desbloquean sus 2 habilidades y sus efectos adaptados funcionan.
- La documentación lista la adaptación de cada tarjeta y las omitidas.
- No se tocó `batalla.js` ni nada fuera de lo permitido.

## Al terminar
Resume en español: cuántas habilidades quedaron implementadas, adaptadas y omitidas (lista), cómo verificaste las condiciones de lado en el motor y dudas.
