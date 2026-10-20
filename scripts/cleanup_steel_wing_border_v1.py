#!/usr/bin/env python3
"""Conservative cleanup of steel wing projectile cell-outline leakage.

Only pixels in the outer 18px perimeter of each existing 512x512 frame may
change; source sheet, central artwork, gameplay and asset IDs stay untouched.
"""
import csv
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'assets/library/capture/sprites/skills/steel_wing_projectile'
MANIFEST = BASE / 'sprite_skill_steel_wing_projectile_sequences_01.json'
PROVENANCE = BASE / 'provenance.csv'
COUNT = 20
SIZE = 512
EDGE = 18
ASSET_ID = 'pack:capture:sprite-steel-wing-projectile-01'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def perimeter(shape, edge=EDGE):
    mask = np.ones(shape, dtype=bool)
    mask[edge:-edge, edge:-edge] = False
    return mask


def clean_frame(src):
    arr = np.asarray(src.convert('RGBA')).copy()
    if arr.shape != (SIZE, SIZE, 4):
        raise ValueError('Expected 512x512 RGBA frame')
    alpha = arr[:, :, 3]
    border = perimeter(alpha.shape)
    # Discard near-invisible compression noise only on the perimeter.
    remove = border & (alpha > 0) & (alpha < 19)
    count, labels, _, _ = cv2.connectedComponentsWithStats(
        np.uint8(alpha >= 19), connectivity=8)
    inner = ~border
    central_labels = np.unique(labels[EDGE:-EDGE, EDGE:-EDGE])
    eligible = np.ones(count, dtype=bool)
    eligible[0] = False
    eligible[central_labels] = False
    # Vectorized: a perimeter-only component is never part of central artwork.
    remove |= eligible[labels] & border
    # Strip long, isolated horizontal/vertical cell guidelines, not wings.
    for y in list(range(EDGE)) + list(range(SIZE - EDGE, SIZE)):
        width = np.count_nonzero(alpha[y, :] >= 19)
        if width < SIZE * .58:
            continue
        inward = min(SIZE - 1, y + 9) if y < EDGE else max(0, y - 9)
        if np.count_nonzero(alpha[inward, :] >= 19) < width * .52:
            remove[y, :] |= border[y, :]
    for x in list(range(EDGE)) + list(range(SIZE - EDGE, SIZE)):
        height = np.count_nonzero(alpha[:, x] >= 19)
        if height < SIZE * .58:
            continue
        inward = min(SIZE - 1, x + 9) if x < EDGE else max(0, x - 9)
        if np.count_nonzero(alpha[:, inward] >= 19) < height * .52:
            remove[:, x] |= border[:, x]
    removed = int(np.count_nonzero(remove & (alpha > 0)))
    total = int(np.count_nonzero(alpha > 0))
    perimeter_before = int(np.count_nonzero((alpha > 0) & border))
    if removed > total * .08:
        raise ValueError(f'Excessive edge removal: {removed}/{total}')
    assert not np.any(remove & inner), 'Central pixel edit is forbidden'
    arr[remove] = (0, 0, 0, 0)
    return Image.fromarray(arr, 'RGBA'), {
        'removedPixels': removed,
        'visiblePerimeterBefore': perimeter_before,
        'visiblePerimeterAfter': int(np.count_nonzero((arr[:, :, 3] > 0) & border)),
        'originalVisiblePixels': total,
    }


def contact(frames, output, title):
    canvas = Image.new('RGB', (1040, 860), (30, 36, 48))
    draw = ImageDraw.Draw(canvas)
    draw.text((18, 8), title, fill='white')
    for index, frame in enumerate(frames):
        x = 12 + index % 5 * 206
        y = 38 + index // 5 * 205
        for cy in range(0, 192, 16):
            for cx in range(0, 192, 16):
                draw.rectangle((x + cx, y + cy, x + cx + 15, y + cy + 15),
                               fill=(52, 58, 68) if (cx // 16 + cy // 16) % 2
                               else (75, 81, 91))
        thumbnail = frame.resize((192, 192), Image.Resampling.LANCZOS)
        canvas.paste(thumbnail, (x, y), thumbnail)
        draw.text((x + 2, y + 178), f'{index+1:02d}', fill='white')
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, optimize=True)


def main():
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    seq = manifest['sequences']['projectile']
    assert seq['assetId'] == ASSET_ID
    assert seq['frameCount'] == COUNT
    assert seq['frameSize'] == [SIZE, SIZE]
    assert len(seq['frames']) == COUNT
    assert seq['atlas']['frameWidth'] == 384
    assert seq['atlas']['frameHeight'] == 384
    original, cleaned, diagnostics = [], [], []
    for index, rel in enumerate(seq['frames']):
        path = BASE / rel
        assert sha(path) == seq['frameSha256'][index], 'Unverified previous frame'
        before = Image.open(path).convert('RGBA')
        after, row = clean_frame(before)
        row.update(frame=index + 1, previousSha256=seq['frameSha256'][index])
        if row['removedPixels']:
            after.save(path, 'PNG', compress_level=6)
        seq['frameSha256'][index] = sha(path)
        original.append(before)
        cleaned.append(after)
        diagnostics.append(row)
    changed = [row for row in diagnostics if row['removedPixels']]
    if len(changed) < 3:
        raise ValueError('Expected edge leakage in at least three frames')
    previews = BASE / 'previews'
    previews.mkdir(exist_ok=True)
    contact(original, previews / 'steel_wing_projectile_before.png',
            'AVANT - Aile acier projectile (20 frames)')
    contact(cleaned, previews / 'steel_wing_projectile_after.png',
            'APRES - Aile acier projectile (20 frames)')
    cleaned[0].save(previews / 'steel_wing_projectile_after.webp', 'WEBP',
                    save_all=True, append_images=cleaned[1:], duration=65,
                    loop=0, quality=85, method=4, exact=True)
    atlas = Image.new('RGBA', (COUNT * 384, 384), (0, 0, 0, 0))
    for index, frame in enumerate(cleaned):
        atlas.alpha_composite(
            frame.resize((384, 384), Image.Resampling.LANCZOS),
            (index * 384, 0))
    atlas_path = BASE / seq['atlas']['file']
    atlas.save(atlas_path, 'WEBP', quality=82, method=2, exact=True)
    seq['atlas']['sha256'] = sha(atlas_path)
    seq['borderCleanup'] = {
        'version': 'edge-only-v1',
        'status': 'awaiting-author-ingame-validation',
        'preview': 'previews/steel_wing_projectile_after.webp',
        'report': 'previews/steel_wing_projectile_border_report.json',
        'sourceSheetUnchanged': True,
        'assetIdPreserved': True,
        'centralPixelsUnchanged': True,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n',
                        encoding='utf-8')
    with PROVENANCE.open('w', newline='', encoding='utf-8') as handle:
        writer = csv.writer(handle)
        writer.writerow(['key', 'frame', 'file', 'sha256', 'source_webp_sha256'])
        for index, rel in enumerate(seq['frames']):
            writer.writerow(['steel_wing_projectile_projectile', index + 1,
                             rel, seq['frameSha256'][index], seq['sourceWebpSha256']])
    (previews / 'steel_wing_projectile_border_report.json').write_text(
        json.dumps({
            'assetId': ASSET_ID, 'frames': diagnostics,
            'totalRemovedPixels': sum(r['removedPixels'] for r in diagnostics),
            'framesModified': len(changed), 'atlasSha256': seq['atlas']['sha256'],
            'requiresAuthorIngameTest': True,
        }, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({
        'framesModified': len(changed),
        'removedPixels': sum(r['removedPixels'] for r in diagnostics),
        'atlasSha256': seq['atlas']['sha256'],
    }))


if __name__ == '__main__':
    main()
