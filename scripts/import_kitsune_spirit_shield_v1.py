#!/usr/bin/env python3
"""Import the existing approved full-sphere spiritual shield sprite sheet.

This script NEVER generates new artwork. It crops the user's exact 5x4 PNG
sheet, isolates each cell to remove cross-frame splatter, preserves alpha,
and publishes 20 RGBA frames plus a reusable lossless WebP atlas.
"""
from __future__ import annotations
import csv
import hashlib
import io
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "_incoming/Sprites de boucliers magiques lunaires.png"
DEST = ROOT / "assets/library/capture/sprites/skills/kitsune_spirit_shield"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
ASSET_ID = "pack:capture:sprite-kitsune-lunaire-spirit-shield-01"
FRAME_MS = 80
CANVAS = 512
ATLAS_WIDTH = 384
OUTPUT_PREFIX = "sprite_skill_kitsune_spirit_shield"
ROWS, COLS = 4, 5
SOURCE_SIZE = (1491, 1055)

def digest(data):
    return hashlib.sha256(data).hexdigest()

def isolate_cell(cell):
    """Soft ellipse removes inter-frame magenta/white bleed at cell corners.

    Original center artwork is unchanged; only alpha at the external edge
    is multiplied by a soft isolation mask, then isotropically letterboxed.
    """
    cell = cell.convert("RGBA")
    w, h = cell.size
    mask = Image.new("L", (w, h), 0)
    brush = ImageDraw.Draw(mask)
    brush.ellipse((8, 7, w - 8, h - 7), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(6))
    alpha = ImageChops.multiply(cell.getchannel("A"), mask)
    cell.putalpha(alpha)
    bound = alpha.getbbox()
    assert bound is not None, "Empty frame"
    scale = 454 / max(w, h)
    tw, th = round(w * scale), round(h * scale)
    resized = cell.resize((tw, th), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    out.alpha_composite(resized, ((CANVAS - tw) // 2, (CANVAS - th) // 2))
    bounds = out.getchannel("A").getbbox()
    assert bounds is not None
    assert min(bounds[0], bounds[1], CANVAS-bounds[2], CANVAS-bounds[3]) >= 20, bounds
    return out

def main():
    assert INPUT.is_file(), f"Missing approved full-sphere sheet: {INPUT}"
    assert not DEST.exists(), "Target folder already exists; no blind overwrite"
    original_bytes = INPUT.read_bytes()
    assert 150_000 < len(original_bytes) < 15_000_000, "Unreasonable source size"
    im = Image.open(io.BytesIO(original_bytes))
    im.load()
    assert im.format == "PNG" and im.size == SOURCE_SIZE, (
        "Wrong sheet! Expected the APPROVED full-sphere 1491x1055 image."
    )
    assert im.mode == "RGBA", "Source must contain a real alpha channel"
    assert im.getchannel("A").getextrema()[0] == 0, "Source transparency missing"
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    assert catalog["storage"]["branch"] == "global-assets"
    assert ASSET_ID not in {a["id"] for a in catalog["assets"]}
    frames, provenance = [], []
    atlas = Image.new("RGBA", (20 * ATLAS_WIDTH, ATLAS_WIDTH), (0, 0, 0, 0))
    for idx in range(20):
        row, col = divmod(idx, COLS)
        # Fractional source grid: consistent boundaries, never cumulative offsets.
        x0 = round(col * im.width / COLS)
        x1 = round((col + 1) * im.width / COLS)
        y0 = round(row * im.height / ROWS)
        y1 = round((row + 1) * im.height / ROWS)
        cropped = isolate_cell(im.crop((x0,y0,x1,y1)))
        relative = f"frames/{OUTPUT_PREFIX}_{idx+1:02}.png"
        frames.append(relative)
        buf = io.BytesIO()
        cropped.save(buf, "PNG")
        data = buf.getvalue()
        file = DEST / relative
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(data)
        atlas.alpha_composite(cropped.resize((ATLAS_WIDTH, ATLAS_WIDTH), Image.Resampling.LANCZOS),(idx*ATLAS_WIDTH,0))
        provenance.append({"frame": idx + 1, "source_rect": [x0,y0,x1,y1], "file": relative, "sha256": digest(data)})
    assert len(set(x["sha256"] for x in provenance)) == 20, "Duplicated source frames"
    atlas_path = f"atlases/{OUTPUT_PREFIX}_atlas_01.webp"
    (DEST / "atlases").mkdir(exist_ok=True)
    atlas.save(DEST / atlas_path, "WEBP", lossless=True, method=6)
    atlas_check = Image.open(DEST / atlas_path)
    assert atlas_check.size == (7680,384) and "A" in atlas_check.getbands()
    manifest = {
        "id": ASSET_ID,
        "type": "capture_skill_sprite_sequence",
        "label": "Kitsune lunaire — Bouclier spirituel (sphère complète)",
        "element": "spirit",
        "frame_size": [512,512], "frame_count": 20, "frame_ms": FRAME_MS,
        "loop": False, "playback_mode": "once",
        "hold_last_frame": True, "hold_frame_index": 19,
        "frames": frames,
        "atlas": {"file": atlas_path,"format": "sprite-strip","frameCount":20,"frameWidth":384,"frameHeight":384},
        "source": {"file": INPUT.name,"sha256":digest(original_bytes),"pixel_size":list(SOURCE_SIZE),"grid":[5,4],"resampled": True,"note":"Original approved 1491x1055 image. 20 independent source cells isotropically rescaled and letterboxed to 512px; not native 512 artwork. Per-cell soft alpha mask cleans bleed."},
    }
    (DEST / f"{OUTPUT_PREFIX}_sequence.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",encoding="utf-8")
    (DEST / "provenance.json").write_text(json.dumps({"source_sha256":digest(original_bytes),"frames":provenance,"atlas_sha256":digest((DEST/atlas_path).read_bytes())},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (DEST / "README.md").write_text("# Kitsune lunaire — Bouclier spirituel\n\nSphère complète rose-violette approuvée. 20 PNG RGBA 512×512, 1 atlas WebP transparent 7680×384. Lecture unique et dernière frame figée pour le bouclier persistant. Découpage de la source existante, sans nouvelle génération. La source de 1491×1055 ne produit pas des détails natifs 512×512. Aucune fiche de compétence modifiée.\n",encoding="utf-8")
    catalog["assets"].append({
        "id":ASSET_ID,"label":manifest["label"],"assetType":"sprite","mediaType":"image","category":"skill",
        "tags":["capture","skill","spirit","shield","barrier","lunar","kitsune","pink","purple","animated","hold-last-frame"],
        "source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},
        "resource":{"file":"capture/sprites/skills/kitsune_spirit_shield/"+atlas_path,"format":"sprite-strip","mime":"image/webp","frameCount":20,"frameMs":FRAME_MS,"playbackMode":"once"},
        "compatibility":{"uses":["combat","capture","editor"]},
    })
    catalog["counts"]["assets"] = len(catalog["assets"])
    catalog["counts"]["sprites"] = sum(a["assetType"]=="sprite" for a in catalog["assets"])
    assert len(set(a["id"] for a in catalog["assets"])) == len(catalog["assets"])
    CATALOG.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    INPUT.unlink()
    print("OK: 20 approved RGBA frames 512x512 + 1 lossless WEBP atlas + 1 catalog assetId")

if __name__ == "__main__":
    main()
