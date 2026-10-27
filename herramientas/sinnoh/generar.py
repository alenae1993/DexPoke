"""Genera los datos y las imágenes locales de Leyendas de Sinnoh.

Uso: python herramientas/sinnoh/generar.py sinnoh/datos "<ruta a Mods\\Images>"
Sin argumentos usa sinnoh/datos y la caché de Tabletop Simulator del usuario.
Escribe sinnoh_datos.js y spr/sinnoh_*.bin en la raíz del proyecto.
"""
import collections
import io
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
HEADER = b'MIDEXPAK' + bytes(8)
MAX_PACK = 15_000_000
VECINOS = ((1, 1), (1, -1), (-1, 1), (-1, -1), (0, 2), (0, -2))


def especie_showdown(nombre, interno=None):
    # El océano Este usa sufijo; el Oeste corresponde a la forma base.
    for prefijo, sufijo in (('East Ocean ', '-East'), ('West Ocean ', '')):
        if (interno or nombre).startswith(prefijo):
            return (nombre if interno else nombre[len(prefijo):]) + sufijo
    return nombre


def generar(datos, imagenes):
    def leer(nombre):
        return json.loads((datos / nombre).read_text(encoding='utf-8'))

    mod, urls, names = (leer(n) for n in ('mod.json', 'urls.json', 'names.json'))
    faltantes = [u for u in urls if not (imagenes / (names[u] + '.png')).is_file()]
    for u in faltantes:
        print(f'Imagen faltante ({urls[u]}): {names[u]}.png')

    # Cada trabajo describe una imagen; las hojas se abren una sola vez.
    trabajos = {}

    def pedir(clave, url, tipo, grilla=None, ancho=None, limite=None):
        if not url:
            return None
        trabajo = (url, tipo, grilla, ancho, limite)
        if clave in trabajos and trabajos[clave] != trabajo:
            raise ValueError(f'Clave de imagen repetida con datos distintos: {clave}')
        trabajos[clave] = trabajo
        return clave if url not in faltantes else None

    for numero, url in sorted(mod['tex'].items(), key=lambda e: int(e[0])):
        pedir('tex' + numero, url, 'tex', limite=512)

    claves = {}
    for url, tipo in urls.items():
        if tipo in ('tok', 'fig'):
            clave = 'k' + str(len(claves))
            claves[url] = pedir(clave, url, tipo, limite=256)

    # Las cartas sueltas son imágenes individuales, de hasta 256 px.
    for token in mod['tokens']:
        if token['kind'] != 'CardCustom':
            continue
        cid = token['cid']
        pedir(f'c{cid}', token['img'], 'card', limite=256)
        pedir(f'b{cid // 100}', token.get('img2'), 'card', limite=256)

    coords = {(h['c'], h['r']) for h in mod['hexes']}
    descartadas = [h for h in mod['hexes'] if not any(
        (h['c'] + dc, h['r'] + dr) in coords for dc, dr in VECINOS)]
    hexes = [h for h in mod['hexes'] if h not in descartadas]
    coords = {(h['c'], h['r']) for h in hexes}
    tokens = []
    for t in mod['tokens']:
        if t['kind'] not in ('Custom_Token', 'Custom_Tile', 'CardCustom', 'Figurine_Custom'):
            continue
        celda = t.get('cell')
        if celda is None:
            celda = [round(t['x'] / 1.65), round(t['z'] / 0.95263)]
        if tuple(celda) not in coords:
            continue
        token = {k: t[k] for k in ('kind', 'n', 'tags', 'b', 'k', 'tier') if k in t}
        token['cell'] = celda
        if t.get('gm'):
            token['gm'] = t['gm']
        if t['kind'] == 'CardCustom':
            token['img'] = pedir(f"c{t['cid']}", t['img'], 'card', limite=256)
            segunda = pedir(f"b{t['cid'] // 100}", t.get('img2'), 'card', limite=256)
        else:
            token['img'] = claves.get(t['img'])
            segunda = claves.get(t.get('img2'))
        if segunda:
            token['img2'] = segunda
        tokens.append(token)

    decks = []
    for mazo in mod['decks']:
        cartas = []
        for original in mazo['cards']:
            carta = dict(original)
            if 'd' in carta:
                d = carta['d'] = dict(carta['d'])
                d['sp'] = especie_showdown(d['pokedex_name'], d.get('internal_name'))
                if d.get('evolve_into'):
                    d['evo'] = [especie_showdown(n) for n in d['evolve_into']]
            cid = carta['cid']
            hoja_id, posicion = divmod(cid, 100)
            hoja = mazo['sheets'][str(hoja_id)]
            grilla = (hoja['w'], hoja['h'], posicion)
            carta['img'] = pedir(f'c{cid}', hoja['face'], 'deck', grilla, ancho=300)
            reverso = f'b{cid}' if hoja['uniqueBack'] else f'b{hoja_id}'
            carta['img2'] = pedir(reverso, hoja['back'], 'deck',
                                  grilla if hoja['uniqueBack'] else None, ancho=300)
            cartas.append(carta)
        decks.append(dict(n=mazo['n'], tags=mazo['tags'], cards=cartas))

    por_url = collections.defaultdict(list)
    for clave, trabajo in trabajos.items():
        por_url[trabajo[0]].append((clave, trabajo))

    carpeta = ROOT / 'spr'
    carpeta.mkdir(exist_ok=True)
    packs, tamanos, indice = [], [], {}
    cantidades = collections.Counter()
    archivo = None
    try:
        for url, grupo in por_url.items():
            if url in faltantes:
                continue
            with Image.open(imagenes / (names[url] + '.png')) as fuente:
                # RGBA conserva también la transparencia de paleta y tRNS.
                fuente = fuente.convert('RGBA')
                repetidas = {}
                for clave, (_, tipo, grilla, ancho, limite) in grupo:
                    firma = (grilla, ancho, limite)
                    if firma in repetidas:
                        indice[clave] = repetidas[firma]
                        cantidades[tipo] += 1
                        continue
                    imagen = fuente
                    if grilla:
                        w, h, pos = grilla
                        if not (w > 0 and h > 0 and 0 <= pos < w * h):
                            raise ValueError(f'Carta fuera de la grilla: {clave}')
                        x, y = pos % w, pos // w
                        imagen = fuente.crop((round(x * fuente.width / w),
                                              round(y * fuente.height / h),
                                              round((x + 1) * fuente.width / w),
                                              round((y + 1) * fuente.height / h)))
                    else:
                        imagen = fuente.copy()
                    if ancho:
                        imagen = imagen.resize((ancho, max(1, round(imagen.height * ancho / imagen.width))),
                                                Image.Resampling.LANCZOS)
                    else:
                        imagen.thumbnail((limite, limite), Image.Resampling.LANCZOS)
                    buffer = io.BytesIO()
                    imagen.save(buffer, format='WEBP', quality=80)
                    contenido = buffer.getvalue()
                    if len(contenido) + len(HEADER) > MAX_PACK:
                        raise ValueError(f'Imagen demasiado grande para un paquete: {clave}')
                    if archivo is None or archivo.tell() + len(contenido) > MAX_PACK:
                        if archivo:
                            tamanos.append(archivo.tell())
                            archivo.close()
                        nombre = f'sinnoh_{len(packs)}.bin'
                        packs.append(nombre)
                        archivo = (carpeta / nombre).open('wb')
                        archivo.write(HEADER)
                    entrada = [len(packs) - 1, archivo.tell(), len(contenido), imagen.width, imagen.height]
                    archivo.write(contenido)
                    indice[clave] = entrada
                    repetidas[firma] = entrada
                    cantidades[tipo] += 1
        if archivo:
            tamanos.append(archivo.tell())
    finally:
        if archivo:
            archivo.close()

    sin = dict(v=1, packs=packs, img=indice, hexes=hexes, tokens=tokens, decks=decks)
    salida = ROOT / 'sinnoh_datos.js'
    texto = ('// Datos e imágenes locales de Leyendas de Sinnoh; generado por herramientas/sinnoh/generar.py.\n'
             + 'const SIN=' + json.dumps(sin, ensure_ascii=False, separators=(',', ':')) + ';\n')
    salida.write_text(texto, encoding='utf-8', newline='\n')
    # Elimina únicamente los paquetes de Sinnoh sobrantes de una ejecución previa.
    for anterior in carpeta.glob('sinnoh_*.bin'):
        if anterior.stem[7:].isdigit() and anterior.name not in packs:
            anterior.unlink()

    print('Imágenes por tipo:', ', '.join(f'{k}: {v}' for k, v in sorted(cantidades.items())))
    print(f'Total: {len(indice)} entradas, {len({tuple(e) for e in indice.values()})} imágenes empaquetadas')
    for nombre, tamano in zip(packs, tamanos):
        print(f'spr/{nombre}: {tamano:,} bytes ({tamano / 1_000_000:.2f} MB)')
    print(f'sinnoh_datos.js: {salida.stat().st_size:,} bytes')
    print(f'Datos: {len(hexes)} celdas, {len(tokens)} tokens, {len(decks)} mazos, '
          f'{sum(len(d["cards"]) for d in decks)} cartas')
    print('Celdas descartadas:', [(h['c'], h['r']) for h in descartadas])
    print(f'Imágenes faltantes: {len(faltantes)}', dict(collections.Counter(urls[u] for u in faltantes)))


if __name__ == '__main__':
    datos = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'sinnoh/datos'
    imagenes = (Path(sys.argv[2]) if len(sys.argv) > 2 else
                Path.home() / 'Documents/My Games/Tabletop Simulator/Mods/Images')
    generar(datos, imagenes)
