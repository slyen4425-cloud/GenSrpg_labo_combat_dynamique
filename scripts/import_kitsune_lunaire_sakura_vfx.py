#!/usr/bin/env python3
"""Import the four approved Kitsune Sakura sheets, without image generation."""
from __future__ import annotations
import hashlib
import io
import json
import zipfile
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / '_incoming/KITSUNE_LUNAIRE_SAKURA_FX_4_PLANCHES_20F.zip'
SOURCE_SHA256 = '32eb218cb63844791c3d8882c8c803f51ae82162d509e82a1b5bc8c92b2d1d5d'
DEST = ROOT / 'assets/library/capture/sprites/skills/kitsune_lunaire_sakura'
CATALOG = ROOT / 'data/assets/catalog/global-visual-assets.v1.json'
ROLES = {
    'aura': ('01_aura_lunaire_PLANCHE_20f.png', 'Aura lunaire Sakura', 'skill', 85, 'loop'),
    'cast': ('02_charge_sakura_PLANCHE_20f.png', 'Charge lunaire Sakura', 'release', 70, 'once'),
    'projectile': ('03_projectile_sakura_PLANCHE_20f.png', 'Projectile lunaire Sakura', 'travel', 55, 'loop'),
    'impact': ('04_impact_sakura_PLANCHE_20f.png', 'Impact lunaire Sakura', 'impact', 60, 'once'),
}

def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def extract_sheets():
    assert SOURCE.is_file(), 'Archive originale absente: ' + str(SOURCE)
    data = SOURCE.read_bytes()
    assert len(data) < 30_000_000 and sha(data) == SOURCE_SHA256, 'Archive non conforme aux sources validees'
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        names = z.namelist()
        assert len(names) == 4 and set(names) == {spec[0] for spec in ROLES.values()}
        assert z.testzip() is None, 'Archive ZIP corrompue'
        return {role: (z.read(spec[0]), spec) for role, spec in ROLES.items()}

def main():
    assert not DEST.exists(), 'Le dossier cible existe deja : import non idempotent refuse'
    sheets = extract_sheets()
    catalogue = json.loads(CATALOG.read_text(encoding='utf-8'))
    assert catalogue['storage']['branch'] == 'global-assets'
    used = {item['id'] for item in catalogue['assets']}
    payload = {}
    manifest = {'id': 'pack:capture:kitsune-lunaire-sakura-vfx-v1', 'frame_size': [512, 512], 'sequences': {}, 'source': {'sha256': SOURCE_SHA256, 'sheet_size': [2944, 2360], 'grid': [5, 4], 'cell_spacing_px': 72, 'outer_margin_px': 48}}
    provenance = {}
    for role, (raw, (filename, label, category, frame_ms, playback)) in sheets.items():
        original = Image.open(io.BytesIO(raw))
        original.load()
        assert original.format == 'PNG' and original.mode == 'RGBA' and original.size == (2944, 2360), filename
        frames = []
        hashes = []
        for i in range(20):
            row, col = divmod(i, 5)
            x, y = 48 + col * 584, 48 + row * 584
            frame = original.crop((x, y, x + 512, y + 512))
            alpha = frame.getchannel('A')
            bbox = alpha.getbbox()
            assert bbox is not None and alpha.getextrema()[0] == 0 and alpha.getextrema()[1] > 100
            assert min(bbox[0], bbox[1], 512-bbox[2], 512-bbox[3]) >= 6, (role, i, bbox)
            buf = io.BytesIO()
            frame.save(buf, format='PNG')
            frame_bytes = buf.getvalue()
            rel = f'frames/sprite_skill_kitsune_lunaire_{role}_{i+1:02}.png'
            payload[rel] = frame_bytes
            frames.append(rel)
            hashes.append(sha(frame_bytes))
        assert len(set(hashes)) == 20, f'Frames dupliquees pour {role}'
        strip = Image.new('RGBA', (384 * 20, 384), (0, 0, 0, 0))
        for i, rel in enumerate(frames):
            frame = Image.open(io.BytesIO(payload[rel])).convert('RGBA')
            strip.alpha_composite(frame.resize((384, 384), Image.Resampling.LANCZOS), (384*i, 0))
        atlas_rel = f'atlases/sprite_skill_kitsune_lunaire_{role}_atlas_01.webp'
        buf = io.BytesIO()
        strip.save(buf, 'WEBP', lossless=True, method=6)
        atlas_data = buf.getvalue()
        check = Image.open(io.BytesIO(atlas_data))
        assert check.size == (7680, 384) and 'A' in check.getbands()
        payload[atlas_rel] = atlas_data
        aid = f'pack:capture:sprite-kitsune-lunaire-{role}-01'
        assert aid not in used, aid
        used.add(aid)
        manifest['sequences'][role] = {
            'id': aid, 'label': label, 'frame_count': 20, 'frame_ms': frame_ms,
            'loop': playback == 'loop', 'playback_mode': playback,
            'frames': frames,
            'atlas': {'file': atlas_rel, 'format': 'sprite-strip', 'frameCount': 20, 'frameWidth': 384, 'frameHeight': 384},
            'source_sheet_sha256': sha(raw),
        }
        provenance[role] = {'source': filename, 'source_sha256': sha(raw), 'frames_sha256': hashes, 'atlas_sha256': sha(atlas_data)}
        catalogue['assets'].append({
            'id': aid, 'label': label, 'assetType': 'sprite', 'mediaType': 'image',
            'category': category, 'tags': ['capture','skill','kitsune','lunaire','sakura','rose','violet','animated',role],
            'source': {'scope': 'pack', 'packId': 'capture', 'author': 'GenSrpG', 'license': 'project-internal'},
            'resource': {'file': 'capture/sprites/skills/kitsune_lunaire_sakura/'+atlas_rel,
                         'format': 'sprite-strip', 'mime': 'image/webp', 'frameCount': 20,
                         'frameMs': frame_ms, 'playbackMode': playback},
            'compatibility': {'uses': ['combat', 'capture', 'editor']},
        })
    assert len(used) == len(catalogue['assets'])
    for rel, binary in payload.items():
        path = DEST / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(binary)
    (DEST / 'sprite_skill_kitsune_lunaire_sequences_01.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (DEST / 'provenance.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (DEST / 'README.md').write_text('# Kitsune lunaire — FX Sakura\n\n80 PNG 512×512 RGBA extraits pixel pour pixel des quatre planches approuvées, avec marges et espacement de 72 px entre cases sources. 4 atlas WebP RGBA 7680×384. Aura et projectile en boucle, charge et impact en une lecture. Catalogue via 4 assetId ; aucune capacité ou fiche créature modifiée automatiquement.\n', encoding='utf-8')
    catalogue['counts']['assets'] = len(catalogue['assets'])
    catalogue['counts']['sprites'] = sum(item['assetType'] == 'sprite' for item in catalogue['assets'])
    CATALOG.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    SOURCE.unlink()
    print('OK: 80 PNG RGBA 512px, 4 WebP atlases, 4 stable catalogue assetIds; source verified')

if __name__ == '__main__':
    main()
