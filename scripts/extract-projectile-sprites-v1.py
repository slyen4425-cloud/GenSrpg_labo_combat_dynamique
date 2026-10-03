#!/usr/bin/env python3
"""Extract audited RGBA projectile phases; no matting, painting or resampling."""
import argparse
from io import BytesIO
import hashlib
import json
import math
from pathlib import Path
import shutil
from PIL import Image

NAMES = ["fire", "water", "earth", "thorn", "electric", "ice", "light", "shadow"]
LABELS = ["Feu", "Eau", "Terre", "Plante", "Électrique", "Glace", "Lumière", "Ombre"]
SOURCE_SHA = "ad41429d03909e3b7799eedb2d1745ec6a41b7110efc919dc4c95624268b8914"
X = [(94, 274), (274, 448), (448, 622), (622, 796), (796, 970),
     (976, 1146), (1146, 1320), (1320, 1536)]
Y = [0, 122, 251, 381, 510, 640, 769, 893, 1024]
FRAME_SIZE = (256, 256)
# Audited principal head / tip in phase 04 of the transparent sheet.
HEADS = [(755, 36), (748, 164), (747, 297), (773, 404),
         (766, 548), (771, 665), (743, 806), (749, 938)]
TAILS = [(637, 100), (637, 225), (637, 354), (637, 484),
         (637, 609), (637, 740), (637, 862), (637, 992)]

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def save_image(image, path, format, **options):
    buffer = BytesIO()
    image.save(buffer, format=format, **options)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_bytes(buffer.getvalue())
    temporary.replace(path)

def extract(root, original_path, transparent_path, prompt_file):
    root = root.resolve()
    original = Image.open(original_path)
    sheet = Image.open(transparent_path)
    assert original.format == "JPEG" and original.mode == "RGB" and original.size == (1536, 1024)
    assert digest(original_path) == SOURCE_SHA
    assert sheet.mode == "RGBA" and sheet.size == original.size
    alpha = sheet.getchannel("A")
    assert alpha.getextrema()[0] == 0
    assert sum(alpha.histogram()[1:255]) > 1000
    folder = Path("assets/library/capture/sprites/source")
    (root / folder).mkdir(parents=True, exist_ok=True)
    original_rel = folder / "projectile_elemental_source_01.jpg"
    transparent_rel = folder / "projectile_elemental_transparent_01.png"
    shutil.copyfile(original_path, root / original_rel)
    shutil.copyfile(transparent_path, root / transparent_rel)
    manifest = {
        "schema": "projectile-elemental-extraction-v1",
        "original": {"file": original_rel.as_posix(), "sha256": SOURCE_SHA,
                     "mode": "RGB", "format": "JPEG", "uploadedFilename": original_path.name, "size": list(original.size)},
        "transparent": {"file": transparent_rel.as_posix(),
                        "sha256": digest(root / transparent_rel),
                        "mode": "RGBA", "size": list(sheet.size)},
        "backgroundExtraction": {
            "tool": "imagegen", "transparentBackground": True,
            "prompt": json.loads(prompt_file.read_text(encoding="utf-8")),
            "note": "AI-assisted alpha extraction from flattened RGB. This is an audited derived image, not a pixel-identical RGB original. All phases and dark shadow cores were inspected on light and dark backgrounds."
        },
        "extraction": "Unmodified RGBA rectangular copies, centered with transparent padding. No resizing, color key, alpha threshold, paint or rotation.",
        "frameSize": list(FRAME_SIZE), "frameMs": 45, "families": []
    }
    for row, (name, label) in enumerate(zip(NAMES, LABELS)):
        family_root = Path("assets/library/capture/sprites/projectiles") / name
        frames_dir, atlas_dir = family_root / "frames", family_root / "atlases"
        (root / frames_dir).mkdir(parents=True, exist_ok=True)
        (root / atlas_dir).mkdir(parents=True, exist_ok=True)
        head, tail = HEADS[row], TAILS[row]
        phase4_width, phase4_height = X[3][1] - X[3][0], Y[row+1] - Y[row]
        offset4 = [(256-phase4_width)//2, (256-phase4_height)//2]
        anchor = {"x": (head[0]-X[3][0]+offset4[0])/256,
                  "y": (head[1]-Y[row]+offset4[1])/256}
        heading = math.atan2(head[1]-tail[1], head[0]-tail[0])
        family = {"name": name, "label": label, "sourceRow": row,
                  "assetId": "pack:capture:sprite-projectile-" + name + "-01",
                  "presentation": {"headingRad": heading, "coreAnchor": anchor},
                  "calibration": {"phase": 4, "headSourcePoint": list(head),
                                  "tailSourcePoint": list(tail),
                                  "note": "Static visual anchor calibrated on principal phase 04; decorative sparks and first/last phases do not define collision."},
                  "frames": []}
        atlas = Image.new("RGBA", (256*8, 256), (0, 0, 0, 0))
        for col in range(8):
            rect = (X[col][0], Y[row], X[col][1], Y[row+1])
            crop = sheet.crop(rect)
            dx, dy = (256-crop.width)//2, (256-crop.height)//2
            assert dx >= 8 and dy >= 8
            frame = Image.new("RGBA", FRAME_SIZE, (0, 0, 0, 0))
            frame.paste(crop, (dx, dy))  # Copy RGBA directly, never double-multiply alpha.
            rel = frames_dir / ("sprite_projectile_" + name + "_" + str(col+1).zfill(2) + ".png")
            save_image(frame, root / rel, "PNG", optimize=True)
            atlas.paste(frame, (col*256, 0))
            family["frames"].append({"file": rel.as_posix(), "sha256": digest(root / rel),
                                     "sourceRect": list(rect), "offset": [dx, dy]})
        atlas_rel = atlas_dir / ("sprite_projectile_" + name + "_atlas_01.webp")
        save_image(atlas, root / atlas_rel, "WEBP", lossless=True, quality=100, method=6, exact=True)
        decoded = Image.open(root / atlas_rel).convert("RGBA")
        assert decoded.tobytes() == atlas.tobytes(), "Lossless atlas must preserve every RGBA byte."
        family["atlas"], family["atlasSha256"] = atlas_rel.as_posix(), digest(root / atlas_rel)
        family["atlasSize"] = list(atlas.size)
        manifest["families"].append(family)
    target = root / folder / "projectile_elemental_extraction_v1.json"
    target.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"manifest": str(target), "families": 8, "pngFrames": 64, "losslessWebpAtlases": 8,
                      "frameSize": list(FRAME_SIZE), "matteSHA256": manifest["transparent"]["sha256"]}))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--transparent", type=Path, required=True)
    parser.add_argument("--prompt-file", type=Path, required=True)
    args = parser.parse_args()
    extract(args.root, args.source, args.transparent, args.prompt_file)
