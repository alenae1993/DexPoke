"""Empaqueta las imágenes del área de entrenador del mod (bolsa, espacios del equipo, fila de Poké Balls,
Fragmentos del Corazón, Tarjeta de Entrenador y Sellos de Viaje) para el panel inferior de Leyendas de Sinnoh.

Uso: python herramientas/sinnoh/generar_panel.py "<ruta a Mods\\Images>"
Escribe spr/sinnoh_panel.bin (formato MIDEXPAK, WebP) y sinnoh_panel.js con el índice SIN_PANEL.
"""
import io
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
HEADER = b'MIDEXPAK' + bytes(8)
# clave: (fragmento del nombre en la caché de Tabletop Simulator, ancho final)
PIEZAS = {
    'bag': ('F74E49F1909D60440DDC09B14D6C831098A737B9', 520),
    'heart': ('5E437E58B782DB0534B89315EC741DFDB415DE38', 520),
    'heart_full': ('37A262DD87C96DFE7551E2CDD7626FBCA208D56D', 520),
    'stamps': ('2BC76465C90D25BC03BA02ABD67D7B92AB3F74F7', 520),
    'slots_heart': ('2451B9D842C7F5B13C74BB13FC683B1997A910BD5B53', 1800),
    'slots_ultra': ('5577792EE2092329876C4C6021B49893A81AC3F21067', 1800),
    'balls': ('33438391BFF0160DA54C556079C903B41BDE0809FA79', 1800),
}


def generar(images):
    files = list(Path(images).iterdir())
    data, idx = bytearray(HEADER), {}
    for key, (frag, width) in PIEZAS.items():
        path = next((f for f in files if frag in f.name), None)
        if not path:
            print('Falta', key); continue
        im = Image.open(path).convert('RGBA')
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        buf = io.BytesIO(); im.save(buf, 'WEBP', quality=85)
        idx[key] = [0, len(data), len(buf.getvalue()), im.width, im.height]
        data.extend(buf.getvalue())
    (ROOT / 'spr' / 'sinnoh_panel.bin').write_bytes(bytes(data))
    (ROOT / 'sinnoh_panel.js').write_text(
        '// Imágenes del área de entrenador del mod (solo local); generado por herramientas/sinnoh/generar_panel.py.\n'
        'const SIN_PANEL=' + json.dumps({'v': 1, 'packs': ['sinnoh_panel.bin'], 'img': idx}, separators=(',', ':')) + ';\n', encoding='utf-8')
    print(f'{len(idx)} piezas, {len(data) // 1024} KB')


if __name__ == '__main__':
    generar(sys.argv[1] if len(sys.argv) > 1 else Path.home() / 'Documents' / 'My Games' / 'Tabletop Simulator' / 'Mods' / 'Images')
