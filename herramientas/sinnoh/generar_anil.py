"""Empaqueta recursos del juego Pokémon Añil para Leyendas de Sinnoh (solo local).

Uso: python herramientas/sinnoh/generar_anil.py "<carpeta de Pokemon Anil>"
Sin argumentos usa la carpeta del Escritorio del dueño.
Escribe spr/anil_0.bin (formato MIDEXPAK) y anil_datos.js con el índice ANIL:
  ANIL.img[clave] = [paquete, inicio, bytes, ancho, alto]   (PNG)
  ANIL.snd[clave] = [paquete, inicio, bytes]                (OGG)
Claves: "tr/<NOMBRE>" (Graphics/Trainers), "ball/<NOMBRE>" y "ball/<NOMBRE>_open"
(Graphics/Battle animations), "fx/<nombre>" (destellos) y sonidos de captura.
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
HEADER = b'MIDEXPAK' + bytes(8)
BALLS = ['POKEBALL', 'GREATBALL', 'ULTRABALL', 'DUSKBALL', 'CHERISHBALL', 'MASTERBALL']
FX = ['ballBurst_star', 'ballBurst_ring1', 'ballBurst_particle']
SOUNDS = {'throw': 'Battle throw.ogg', 'hit': 'Battle ball hit.ogg', 'shake': 'Battle ball shake.ogg',
          'click': 'Battle catch click.ogg', 'drop': 'Battle ball drop.ogg', 'recall': 'Battle recall.ogg',
          'jump': 'Battle jump to ball.ogg'}


def generar(anil):
    gfx, data, img, snd = anil / 'Graphics', bytearray(HEADER), {}, {}

    def agregar(path):
        raw = path.read_bytes()
        start = len(data)
        data.extend(raw)
        return start, len(raw)

    def imagen(clave, path):
        if not path.exists():
            print('Falta', path)
            return
        start, size = agregar(path)
        w, h = Image.open(path).size
        img[clave] = [0, start, size, w, h]

    for path in sorted((gfx / 'Trainers').glob('*.png')):
        imagen('tr/' + path.stem, path)
    for ball in BALLS:
        imagen('ball/' + ball, gfx / 'Battle animations' / f'ball_{ball}.png')
        imagen('ball/' + ball + '_open', gfx / 'Battle animations' / f'ball_{ball}_open.png')
    for fx in FX:
        imagen('fx/' + fx, gfx / 'Battle animations' / f'{fx}.png')
    for clave, nombre in SOUNDS.items():
        path = anil / 'Audio' / 'SE' / nombre
        if path.exists():
            start, size = agregar(path)
            snd[clave] = [0, start, size]
        else:
            print('Falta', path)

    (ROOT / 'spr' / 'anil_0.bin').write_bytes(bytes(data))
    datos = {'v': 1, 'packs': ['anil_0.bin'], 'img': img, 'snd': snd}
    (ROOT / 'anil_datos.js').write_text(
        '// Sprites de entrenadores, Balls y sonidos de captura de Pokémon Añil (solo local); generado por herramientas/sinnoh/generar_anil.py.\n'
        'const ANIL=' + json.dumps(datos, separators=(',', ':')) + ';\n', encoding='utf-8')
    print(f'{len(img)} imágenes, {len(snd)} sonidos, paquete de {len(data) // 1024} KB')


if __name__ == '__main__':
    carpeta = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / 'Desktop' / 'pokemon añil' / 'Pokemon Anil'
    generar(carpeta)
