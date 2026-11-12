#!/usr/bin/env python3
"""Turbo Patiler güncelleme paketi hazırlar.

Kullanım:  python3 paketle.py [not]
- version.txt içindeki sayı oyun sürümüdür. Yeni güncelleme için 1 artırın.
- Bu klasörün bir üstüne game.zip ve version.json yazar (GitHub deposunun kök klasörü).
- İsterseniz --android <yol> ile Android projesinin assets/www klasörünü de günceller.
"""
import hashlib, json, os, sys, zipfile, shutil, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
SKIP = {'paketle.py', '.DS_Store', 'Thumbs.db'}
FIXED = (2026, 1, 1, 0, 0, 0)  # aynı içerik → aynı zip (gereksiz güncelleme olmasın)

def files():
    for root, dirs, fs in os.walk(HERE):
        dirs[:] = sorted(d for d in dirs if not d.startswith('.') and d != '__pycache__')
        for f in sorted(fs):
            if f in SKIP or f.startswith('.'):
                continue
            p = os.path.join(root, f)
            yield p, os.path.relpath(p, HERE).replace(os.sep, '/')

def main():
    args = sys.argv[1:]
    android = None
    if '--android' in args:
        i = args.index('--android'); android = args[i + 1]; del args[i:i + 2]
    note = ' '.join(args)
    ver = int(open(os.path.join(HERE, 'version.txt')).read().strip())
    # ui.js içindeki WEB_VERSION ile version.txt aynı olmalı
    ui = open(os.path.join(HERE, 'js', 'ui.js'), encoding='utf-8').read()
    assert f'const WEB_VERSION = {ver};' in ui, 'js/ui.js içindeki WEB_VERSION, version.txt ile aynı değil'
    zp = os.path.join(OUT, 'game.zip')
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p, rel in files():
            zi = zipfile.ZipInfo(rel, FIXED); zi.compress_type = zipfile.ZIP_DEFLATED; zi.external_attr = 0o644 << 16
            z.writestr(zi, open(p, 'rb').read())
    sha = hashlib.sha256(open(zp, 'rb').read()).hexdigest()
    info = {'version': ver, 'file': 'game.zip', 'sha256': sha, 'minApp': 1,
            'date': datetime.date.today().isoformat(), 'notes': note or f'Sürüm {ver}'}
    with open(os.path.join(OUT, 'version.json'), 'w', encoding='utf-8') as f:
        json.dump(info, f, ensure_ascii=False, indent=2); f.write('\n')
    if android:
        www = os.path.join(android, 'app', 'src', 'main', 'assets', 'www')
        shutil.rmtree(www, ignore_errors=True)
        for p, rel in files():
            d = os.path.join(www, rel); os.makedirs(os.path.dirname(d), exist_ok=True); shutil.copy2(p, d)
    print(f'sürüm {ver} · game.zip {os.path.getsize(zp) // 1024} KB · sha256 {sha[:12]}…')

if __name__ == '__main__':
    main()
