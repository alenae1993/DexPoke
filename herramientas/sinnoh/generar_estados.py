"""Recorta los 6 íconos de estado del dado de estados del mod y los guarda en sinnoh_estados.js (data URI).

Uso: python herramientas/sinnoh/generar_estados.py "<ruta a Mods\\Images>"
El dado es una textura de 8315×8315 con las caras en una grilla; se toma el círculo central de cada cara.
"""
import base64
import io
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
DIE = 'httpssteamusercontentaakamaihdnetugc169052640142618948722590B21B121BFE5895D61BDAFC774109EDF3DF5.png'
# Centro (x, y) de cada cara en la textura original y radio del círculo.
FACES = {'par': (1359, 4154), 'brn': (4154, 4154), 'frz': (6945, 4154),
         'conf': (1359, 6945), 'psn': (4154, 6945), 'drw': (6945, 6945)}
RADIUS, SIZE = 890, 64


def generar(images):
    die = Image.open(Path(images) / DIE).convert('RGBA')
    out = {}
    for key, (x, y) in FACES.items():
        im = die.crop((x - RADIUS, y - RADIUS, x + RADIUS, y + RADIUS)).resize((SIZE, SIZE), Image.LANCZOS)
        mask = Image.new('L', (SIZE * 4, SIZE * 4), 0)
        ImageDraw.Draw(mask).ellipse((2, 2, SIZE * 4 - 3, SIZE * 4 - 3), fill=255)
        im.putalpha(mask.resize((SIZE, SIZE), Image.LANCZOS))
        buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True)
        out[key] = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()
    (ROOT / 'sinnoh_estados.js').write_text(
        '// Íconos de estado del dado de estados del mod (solo local); generado por herramientas/sinnoh/generar_estados.py.\n'
        'const SIN_STATUS_ICONS=' + json.dumps(out, separators=(',', ':')) + ';\n', encoding='utf-8')
    print('íconos:', ', '.join(out))


if __name__ == '__main__':
    generar(sys.argv[1] if len(sys.argv) > 1 else Path.home() / 'Documents' / 'My Games' / 'Tabletop Simulator' / 'Mods' / 'Images')
