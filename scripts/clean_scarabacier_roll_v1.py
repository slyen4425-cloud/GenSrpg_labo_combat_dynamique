#!/usr/bin/env python3
"""Conservative media-only cleanup of the 16 existing Scarabacier roll frames.

Non-generative: preserves all RGBA pixels connected to the creature silhouette.
Runs only on a work branch. Preview and manifest required before PR review.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "assets/library/capture/creatures/scarabacier/animations/roll"
FRAMES = BASE / "frames"
ATLAS = BASE / "atlases/scarabacier_roll_atlas.webp"
MANIFEST = BASE / "scarabacier_roll.manifest.json"
PREVIEWS = BASE / "previews"
COUNT = 16
CELL = 384


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def clean(arr: np.ndarray) -> tuple[np.ndarray, int, float]:
    """Retain every legitimate limb; remove red fringe and foreign isolated scraps.

    A raw 'largest connected component only' strategy cropped 11.56% of one
    original frame because legitimate legs are separated by transparent gaps.
    Never blindly discard those body parts.
    """
    alpha = arr[:, :, 3]
    visible = alpha > 0
    total = int(np.count_nonzero(visible))
    if total == 0:
        raise ValueError("Empty original frame")
    filled = np.uint8(alpha > 24)
    # Bridge natural gaps between multiple claws/armor segments before deciding
    # which component belongs to the body.
    bridged = cv2.dilate(filled, np.ones((19, 19), dtype=np.uint8))
    count, labels, stats, _ = cv2.connectedComponentsWithStats(bridged, connectivity=8)
    if count < 2:
        keep = np.ones(alpha.shape, dtype=bool)
    else:
        main = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        # Preserve soft antialiasing and adjacent detached appendages.
        keep = cv2.dilate(np.uint8(labels == main), np.ones((5, 5), dtype=np.uint8)).astype(bool)

    # Neon-red pixels are remnants of the old crowded source sprite sheet,
    # unrelated to Scarabacier's gold / steel / cyan coloring.
    rgb = arr[:, :, :3].astype(np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    saturated_red = visible & (r >= 180) & (g < 72) & (b < 86) & (r > 2 * g) & (r > 2 * b)

    # If core segmentation would discard substantial content, preserve all
    # disconnected legitimate body pieces and remove only extreme red fringe.
    proposed_removed = int(np.count_nonzero(visible & ~keep))
    if proposed_removed / total > 0.03:
        keep = np.ones(alpha.shape, dtype=bool)

    remove = (visible & ~keep) | saturated_red
    out = arr.copy()
    out[remove, :] = 0
    removed = int(np.count_nonzero(remove))
    return out, removed, removed / total

def contact(frames: list[Image.Image], heading: str, out: Path) -> None:
    canvas = Image.new("RGB", (1024, 1060), (28, 36, 48))
    draw = ImageDraw.Draw(canvas)
    draw.text((14, 8), heading, fill=(245, 246, 248))
    for index, image in enumerate(frames):
        x = (index % 4) * 256
        y = 33 + (index // 4) * 256
        # Visual review checkerboard only; source files stay transparent.
        for cy in range(0, 244, 22):
            for cx in range(0, 244, 22):
                col = (43, 49, 59) if ((cx//22 + cy//22) % 2) else (59, 65, 76)
                draw.rectangle((x+cx+6, y+cy+6, x+cx+27, y+cy+27), fill=col)
        tile = image.copy()
        tile.thumbnail((236, 236), Image.Resampling.LANCZOS)
        canvas.paste(tile, (x + (256-tile.width)//2, y+8), mask=tile.getchannel("A"))
        draw.text((x+12, y+237), f"{index+1:02d}", fill=(255, 255, 255))
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, optimize=True)


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if manifest.get("assetId") != "pack:capture:creature-scarabacier-roll-01":
        raise ValueError("Wrong canonical assetId")
    if manifest.get("frameCount") != COUNT or manifest.get("atlas", {}).get("frameCount") != COUNT:
        raise ValueError("Unexpected roll atlas contract")

    old, new, report = [], [], []
    for i in range(1, COUNT+1):
        framepath = FRAMES / f"scarabacier_roll_{i:02d}.png"
        original = Image.open(framepath).convert("RGBA")
        if original.size != (512, 512):
            raise ValueError(f"Unexpected dimensions: {framepath}")
        arr, removed, fraction = clean(np.asarray(original).copy())
        result = Image.fromarray(arr, "RGBA")
        if result.size != original.size:
            raise ValueError("Resizing source frames is prohibited")
        old.append(original)
        new.append(result)
        report.append({"frame": i, "removed_pixels": removed, "fraction": round(fraction, 6),
                       "previous_sha256": sha(framepath)})
        if removed:
            result.save(framepath, optimize=True)

    PREVIEWS.mkdir(parents=True, exist_ok=True)
    contact(old, "Scarabacier roulade - AVANT - 16 frames", PREVIEWS / "roll_avant.png")
    contact(new, "Scarabacier roulade - APRES - 16 frames", PREVIEWS / "roll_apres.png")
    new[0].save(PREVIEWS / "roll_apres.webp", format="WEBP", save_all=True,
                append_images=new[1:], duration=85, loop=0, quality=83,
                method=5, exact=True)

    atlas = Image.new("RGBA", (COUNT * CELL, CELL), (0, 0, 0, 0))
    for i, image in enumerate(new):
        atlas.alpha_composite(image.resize((CELL, CELL), Image.Resampling.LANCZOS), (i*CELL, 0))
    atlas.save(ATLAS, "WEBP", quality=87, method=5, exact=True)

    for i, entry in enumerate(manifest["frames"]):
        entry["sha256"] = sha(FRAMES / entry["file"])
    manifest["atlas"]["sha256"] = sha(ATLAS)
    manifest["cleanup"] = {
        "version": "non-generative-v1",
        "input": "existing sixteen RGBA roll frames",
        "status": "ready_for_author_ingame_review",
        "report": "previews/cleanup_report.json",
        "preview": "previews/roll_apres.webp",
        "originalAssetIdPreserved": True
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (PREVIEWS / "cleanup_report.json").write_text(
        json.dumps({"frames": report,
                    "totalRemovedPixels": sum(row["removed_pixels"] for row in report),
                    "atlasSha256": sha(ATLAS),
                    "requiresAuthorPreview": True}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8")
    print(json.dumps({"frames": COUNT, "removed": sum(row["removed_pixels"] for row in report),
                      "atlasSha256": sha(ATLAS)}))


if __name__ == "__main__":
    main()
