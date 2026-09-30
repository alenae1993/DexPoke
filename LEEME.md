# Mi Dex

Pokédex personal para iPhone y Android: 1.025 Pokémon, movimientos y habilidades en español e inglés con el % de sus efectos, simulador de IVs/EVs y comparador. Funciona sin internet una vez instalada.

App no oficial, de uso personal. Pokémon y sus nombres son marcas de Nintendo / Game Freak / The Pokémon Company. Las imágenes se cargan desde PokeAPI.

---

## 1. Publicarla en GitHub Pages (una sola vez, ~15 min)

1. Entra a **github.com** y crea una cuenta gratis (o inicia sesión).
2. Arriba a la derecha: **+ → New repository**.
   - Repository name: `midex` (o el que quieras; será parte de la dirección).
   - Déjalo en **Public** (GitHub Pages gratis requiere repositorio público).
   - Clic en **Create repository**.
3. En la página del repositorio vacío, clic en **uploading an existing file**.
4. Abre la carpeta `midex` en tu computador, selecciona **todo su contenido** (no la carpeta, lo que hay dentro: `index.html`, `data.js`, `sw.js`, `manifest.webmanifest`, la carpeta `icons`, etc.) y arrástralo a la página.
   - El archivo `.nojekyll` está oculto en Windows; si no lo ves, no pasa nada.
5. Abajo, clic en **Commit changes**.
6. Ve a **Settings → Pages** (menú izquierdo).
   - En *Branch* elige **main** y carpeta **/ (root)** → **Save**.
7. Espera 1–2 minutos y recarga esa página: aparecerá la dirección, algo como
   `https://TU-USUARIO.github.io/midex/`

## 2. Instalarla en el teléfono

**iPhone (Safari, obligatorio en iOS):**
1. Abre la dirección en **Safari**.
2. Toca el botón **Compartir** (cuadrado con flecha).
3. **Agregar a pantalla de inicio** → **Agregar**.

**Android (Chrome):**
1. Abre la dirección en **Chrome**.
2. Menú **⋮** → **Instalar app** (o *Agregar a la pantalla principal*).

Ábrela una vez con internet y navega un poco: desde ahí funciona sin conexión. Las imágenes se guardan a medida que las ves.

---

## 3. Actualizar los datos cuando cambies tu Power BI

Requisitos (una sola vez), en una terminal (PowerShell o CMD):

```
pip install pbixray pandas
```

Cada vez que actualices el `.pbix`:

```
cd ruta\a\la\carpeta\midex
python herramientas\actualizar_datos.py "C:\ruta\a\Pokemon_BI.pbix"
```

Eso regenera `data.js`. Súbelo a GitHub (en el repositorio: **Add file → Upload files**, arrastra `data.js`, **Commit changes**). Los teléfonos lo toman solos la próxima vez que abran la app (a veces hay que abrirla dos veces).

Qué hace el script:
- Lee tu modelo: Pokémon, movimientos, habilidades, niveles, evoluciones.
- Agrega desde PokeAPI las formas que tu modelo no tiene: megaevoluciones (incluidas las de Leyendas Z-A), Gigamax, formas regionales (Alola, Galar, Hisui, Paldea) y otras formas con stats distintos (Rotom, Deoxys, Tornadus Forma Tótem, Tauros de Paldea...). Las megas y gigamax usan los movimientos de su especie.
- Corrige tres cosas de tu modelo: Basculin (tu fila era la Forma Raya Blanca, Gen 8; la base es Raya Roja, Gen 5), la etiqueta de Giratina (sus stats son de la Forma Modificada, no Origen) y la Def. Esp. de Dipplin (90 → 80, valor oficial).
- Corrige el orden de stats de tu modelo (tus columnas SPA/SPD/SPE contienen en realidad Velocidad/At. Esp./Def. Esp.).
- Interpreta la columna `FunctionCode` para calcular qué stats sube o baja cada movimiento.
- Descarga de PokeAPI los nombres en inglés y los % de absorción, retroceso y curación (necesita internet).

Los efectos numéricos de las **habilidades** no vienen en tu modelo: están escritos a mano en `index.html` (busca `const AFX=`). Si quieres cambiar uno, se edita ahí.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La app (pantallas, cálculos, estilos) |
| `data.js` | Los datos que salen de tu `.pbix` |
| `sw.js` | Permite usarla sin internet y guarda las imágenes |
| `manifest.webmanifest` | Nombre, ícono y colores al instalarla |
| `icons/` | Íconos de la app |
| `herramientas/actualizar_datos.py` | Regenera `data.js` desde el `.pbix` |
| `tiers.js` | Categoría competitiva (tier) de cada Pokémon para la Pokédex |
| `batalla.html`, `batalla.js`, `ps.js`, `esx.js`, `reto.js` | Simulador de batallas y modo Desafío |
| `competitivo.js`, `comp.js` | Modo Competitivo, validación de equipos, sets competitivos y fichas en batalla |

## Batalla (batalla.html)

Simulador de batallas con las mismas reglas y cálculos que los juegos (Gen 9), usando el motor de Pokémon Showdown (`ps.js`, licencia MIT, ver `LICENCIA-motor-batalla.txt`).

- **Batalla rápida:** 6 Pokémon al azar para ti y para la CPU, con sets competitivos.
- **Mi equipo vs CPU:** arma tu equipo (movimientos, habilidad, objeto, naturaleza, EVs, IVs, teratipo). Desde la ficha de cualquier Pokémon en la Pokédex: "Agregar a mi equipo de batalla".
- **Importar / exportar:** acepta equipos en formato Pokémon Showdown (copiados desde Smogon o Showdown).
- Los equipos se guardan en este dispositivo.
- **Fichas en batalla:** botón **Fichas** (o “Ficha” en cada Pokémon de la pestaña Pokémon): stats reales, base, IVs, EVs, naturaleza, habilidad, objeto, teratipo, PP y efecto de cada movimiento, con los cambios de stats activos.

## Competitivo

- **Pokédex:** cada Pokémon muestra su tier de Smogon (Individual de Escarlata/Púrpura, National Dex y Dobles) y hay un filtro “Competitivo” (por ejemplo, “Permitido en OU”).
- **Batalla → Competitivo:** formatos Combate Clasificatorio (BSS, nivel 50, elige 3 de 6), Ubers, OU, UU, RU, NU, PU, ZU y National Dex OU. Revisa si tu equipo es legal con el validador de Showdown, juega con tu equipo o con equipos de ejemplo del formato.
- **Sets competitivos** en el editor de equipo: sets de Battle Factory / BSS Factory de Pokémon Showdown (licencia MIT).
- Los tiers vienen del motor incluido (`@pkmn/sim` 0.10.11). Smogon los cambia cada pocos meses; para actualizarlos hay que regenerar `ps.js`, `comp.js` y `tiers.js`.

