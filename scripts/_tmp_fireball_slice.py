from pathlib import Path
from PIL import Image
import csv, json, math

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'assets/library/core/sprites/skills/fireball'
DST = ROOT / 'assets/library/capture/sprites/skills/fireball'
FRAMES_DIR = DST / 'frames'
ATLASES_DIR = DST / 'atlases'
FRAMES_DIR.mkdir(parents=True, exist_ok=True)
ATLASES_DIR.mkdir(parents=True, exist_ok=True)

SEQUENCES = {
    'cast': ('sprite_skill_fireball_cast_01.webp', 6),
    'impact': ('sprite_skill_fireball_impact_01.webp', 6),
    'travel_lr': ('sprite_skill_fireball_travel_lr_01.webp', 8),
    'travel_rl': ('sprite_skill_fireball_travel_rl_01.webp', 8),
    'travel_dr': ('sprite_skill_fireball_travel_dr_01.webp', 8),
    'travel_dl': ('sprite_skill_fireball_travel_dl_01.webp', 8),
}


def clean_frame(im: Image.Image) -> Image.Image:
    im = im.convert('RGBA')
    if im.size != (256, 256):
        im = im.resize((256, 256), Image.Resampling.LANCZOS)

    px = im.load()
    border = []
    for x in range(256):
        for y in (0,1,2,253,254,255):
            border.append(px[x,y][:3])
    for y in range(256):
        for x in (0,1,2,253,254,255):
            border.append(px[x,y][:3])
    border.sort(key=lambda c: c[0] + c[1] + c[2])
    bg = border[len(border)//2]

    out = Image.new('RGBA', (256,256), (0,0,0,0))
    opx = out.load()
    for y in range(256):
        for x in range(256):
            r,g,b,a = px[x,y]
            if a == 0:
                continue
            dr, dg, db = r-bg[0], g-bg[1], b-bg[2]
            dist = math.sqrt(dr*dr + dg*dg + db*db)
            mx, mn = max(r,g,b), min(r,g,b)
            sat = 0 if mx == 0 else (mx-mn)/mx
            warm = r > 70 and r >= g*0.92 and r >= b*1.08 and (r-g > 8 or r-b > 18)
            bright = mx > 210
            # Remove the panel/background globally while preserving warm fire and bright cores.
            if dist < 34 and not warm and not bright:
                na = 0
            elif dist < 74 and not warm and not bright:
                na = int(a * max(0.0, min(1.0, (dist-34)/40)))
            elif sat < 0.10 and mx < 105 and not warm:
                na = int(a * 0.20)
            else:
                na = a
            if na > 4:
                opx[x,y] = (r,g,b,na)

    # Clear a thin outer border to guarantee transparent corners and eliminate frame strokes.
    for i in range(5):
        for x in range(256):
            opx[x,i] = (0,0,0,0); opx[x,255-i] = (0,0,0,0)
        for y in range(256):
            opx[i,y] = (0,0,0,0); opx[255-i,y] = (0,0,0,0)
    return out


manifest_rows = []
sequence_json = {'frame_size':[256,256], 'sequences':{}}

for seq, (filename, count) in SEQUENCES.items():
    src = Image.open(SRC / filename).convert('RGBA')
    fw = src.width / count
    cleaned = []
    names = []
    for i in range(count):
        left = round(i * fw)
        right = round((i + 1) * fw)
        cell = src.crop((left, 0, right, src.height))
        frame = clean_frame(cell)
        name = f'sprite_skill_fireball_{seq}_{i+1:02d}.png'
        frame.save(FRAMES_DIR / name, optimize=True)
        cleaned.append(frame)
        names.append(f'frames/{name}')
        manifest_rows.append([seq, i+1, name, 256, 256])

    atlas = Image.new('RGBA', (count*256, 256), (0,0,0,0))
    for i, frame in enumerate(cleaned):
        atlas.alpha_composite(frame, (i*256, 0))
    atlas_name = f'sprite_skill_fireball_{seq}_atlas_01.png'
    atlas.save(ATLASES_DIR / atlas_name, optimize=True)
    sequence_json['sequences'][seq] = {
        'frame_count': count,
        'frames': names,
        'atlas': f'atlases/{atlas_name}'
    }

with (DST / 'manifest.csv').open('w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['sequence','frame','file','width','height'])
    w.writerows(manifest_rows)

with (DST / 'sprite_skill_fireball_sequences_01.json').open('w', encoding='utf-8') as f:
    json.dump(sequence_json, f, indent=2)
    f.write('\n')

readme = '''# GenSrpG — Fireball sprites Capture\n\nLot visuel Capture uniquement. Aucun raccord gameplay/runtime dans ce lot.\n\n- 44 frames individuelles PNG RGBA, 256×256\n- 6 atlas horizontaux nettoyés\n- cast: 6\n- impact: 6\n- travel_lr: 8\n- travel_rl: 8\n- travel_dr: 8\n- travel_dl: 8\n\nLes neuf variantes supplémentaires visibles sur la planche source ne sont pas synthétisées ici : elles devront être extraites de la planche originale pour éviter d'inventer ou dupliquer des visuels.\n\nSource de ce sous-lot : anciennes bandes WebP présentes dans `assets/library/core/sprites/skills/fireball/`, utilisées uniquement comme matière de migration.\n'''
(DST / 'README.md').write_text(readme, encoding='utf-8')

print(f'Generated {len(manifest_rows)} frames in {DST}')
