#!/usr/bin/env python3
"""Sube el número de versión de Cuentas Claras en todos los sitios a la vez.

Uso:
  python3 herramientas/nueva-version.py 2.7.0 "Primer cambio" "Segundo cambio"

Actualiza js/version.js (VERSION y una entrada nueva en CAMBIOS con la fecha de hoy),
version.json (aviso de versión nueva) y los ?v= de index.html (para que los navegadores
no usen archivos antiguos de la caché).
"""
import datetime, json, pathlib, re, sys

raiz = pathlib.Path(__file__).resolve().parent.parent
if len(sys.argv) < 3 or not re.fullmatch(r'\d+\.\d+\.\d+', sys.argv[1]):
    sys.exit(__doc__)
nueva, cambios = sys.argv[1], sys.argv[2:]

vjs = raiz / 'js' / 'version.js'
txt = vjs.read_text(encoding='utf-8')
actual = re.search(r"const VERSION='([\d.]+)'", txt).group(1)
if tuple(map(int, nueva.split('.'))) <= tuple(map(int, actual.split('.'))):
    sys.exit(f'La versión nueva ({nueva}) tiene que ser mayor que la actual ({actual}).')
hoy = datetime.date.today().isoformat()
entrada = " {v:'%s',f:'%s',c:[%s]}," % (nueva, hoy, ','.join(json.dumps(c, ensure_ascii=False).replace("'", "\\'").replace('"', "'") for c in cambios))
txt = txt.replace(f"const VERSION='{actual}';", f"const VERSION='{nueva}';", 1)
txt = txt.replace('const CAMBIOS=[\n', 'const CAMBIOS=[\n' + entrada + '\n', 1)
vjs.write_text(txt, encoding='utf-8')

(raiz / 'version.json').write_text(json.dumps({'version': nueva}) + '\n', encoding='utf-8')

idx = raiz / 'index.html'
html = idx.read_text(encoding='utf-8')
html = re.sub(r'\?v=[\d.]+', f'?v={nueva}', html)
idx.write_text(html, encoding='utf-8')
print(f'Versión {actual} → {nueva}. Revisa los cambios, ejecuta las pruebas (npm test) y sube a GitHub.')
