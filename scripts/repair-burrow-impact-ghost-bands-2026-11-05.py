#!/usr/bin/env python3
"""One-time source fix for detached ghost bands in burrow impact frames 15–20.

The already-authoritative 20 PNGs and the lossless 20-frame WebP atlas are
modified together. Only the visually isolated upper artifact band is removed.
All gameplay, timing, coordinates, effects and the 14 other frames stay intact.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMPACT = ROOT / "assets/library/capture/sprites/skills/burrow_terrain/impact"
FRAME_DIR = IMPACT / "frames"
ATLAS = IMPACT / "sprite_burrow_impact_atlas.webp"
FIRST = 15
LAST = 20
CLEAR_BEFORE_Y = 100
TILE = 384


def frame_path(i: int) -> Path:
    return FRAME_DIR / f"sprite_burrow_impact_{i:02}.png"


def alpha_count(image: Image.Image, top: int, bottom: int) -> int:
    alpha = image.getchannel("A")
    return sum(1 for value in alpha.crop((0, top, 512, bottom)).getdata() if value >= 8)


def clean_frame(image: Image.Image, i: int) -> Image.Image:
    if image.size != (512, 512) or image.mode != "RGBA":
        raise ValueError(f"frame {i}: expected 512x512 RGBA")
    # RED proof from source: distinct strip near the top, followed by a
    # transparent gap and then the legitimate eruption/crater far below.
    ghost = alpha_count(image, 0, 80)
    gap = alpha_count(image, 80, CLEAR_BEFORE_Y)
    body = alpha_count(image, CLEAR_BEFORE_Y, 512)
    if not 10 <= ghost <= 15000 or gap != 0 or body < 10000:
        raise ValueError(f"frame {i}: source changed or ghost separation not proved: "
                         f"ghost={ghost}, gap={gap}, body={body}")
    result = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    result.paste(image.crop((0, CLEAR_BEFORE_Y, 512, 512)),
                 (0, CLEAR_BEFORE_Y))
    assert alpha_count(result, 0, CLEAR_BEFORE_Y) == 0
    assert result.crop((0, CLEAR_BEFORE_Y, 512, 512)).tobytes() == (
        image.crop((0, CLEAR_BEFORE_Y, 512, 512)).tobytes()
    ), "legitimate lower sprite was modified"
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.write == args.check:
        parser.error("choose exactly --write or --check")

    if args.write:
        with Image.open(ATLAS) as source:
            if source.size != (20 * TILE, TILE):
                raise ValueError(f"unexpected atlas size {source.size}")
            atlas = source.convert("RGBA")
        repaired: dict[int, Image.Image] = {}
        # Validate every input before writing any file.
        for i in range(FIRST, LAST + 1):
            with Image.open(frame_path(i)) as source:
                repaired[i] = clean_frame(source.convert("RGBA"), i)
        # Preserve all existing atlas tiles 01..14, and only rebuild 15..20.
        unaffected = atlas.crop((0, 0, (FIRST - 1) * TILE, TILE)).tobytes()
        for i, sprite in repaired.items():
            atlas.paste(sprite.resize((TILE, TILE), Image.Resampling.LANCZOS),
                        ((i - 1) * TILE, 0))
        assert atlas.crop((0, 0, (FIRST - 1) * TILE, TILE)).tobytes() == unaffected
        for i, sprite in repaired.items():
            sprite.save(frame_path(i), format="PNG", optimize=True)
        atlas.save(ATLAS, format="WEBP", lossless=True, method=6, exact=True)
        print("REPAIRED source PNGs 15–20 + full lossless WebP atlas", ATLAS)

    if args.check:
        with Image.open(ATLAS) as source:
            if source.size != (20 * TILE, TILE):
                raise ValueError("atlas geometry changed")
            atlas = source.convert("RGBA")
        for i in range(1, 21):
            with Image.open(frame_path(i)) as source:
                src = source.convert("RGBA")
            if src.size != (512, 512):
                raise ValueError(f"frame {i} geometry changed")
            if i >= FIRST:
                if alpha_count(src, 0, CLEAR_BEFORE_Y) != 0:
                    raise ValueError(f"frame {i} still contains upper ghost pixels")
                if alpha_count(src, CLEAR_BEFORE_Y, 512) < 10000:
                    raise ValueError(f"frame {i} lost legitimate eruption artwork")
                tile = atlas.crop(((i - 1) * TILE, 0, i * TILE, TILE))
                if any(value >= 8 for value in tile.getchannel("A").crop((0, 0, TILE, 72)).getdata()):
                    raise ValueError(f"atlas tile {i} still has a top ghost band")
        print("PASS: 20 frame source files, atlas dimensions, cleaned ghost bands and preserved eruption")


if __name__ == "__main__":
    main()
