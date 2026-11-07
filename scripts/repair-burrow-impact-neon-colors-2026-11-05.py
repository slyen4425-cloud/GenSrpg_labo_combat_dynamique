#!/usr/bin/env python3
"""Remove proven out-of-palette neon RGB speckles from 20 earth-impact PNGs.

These are real bad pixels embedded in artist exports, not gameplay geometry.
Retain every non-neon pixel as authored. Rebuild the single lossless WebP atlas.
"""
from __future__ import annotations
import argparse
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMPACT = ROOT / "assets/library/capture/sprites/skills/burrow_terrain/impact"
ATLAS = IMPACT / "sprite_burrow_impact_atlas.webp"
FRAMES = IMPACT / "frames"
W = 512
TILE = 384
COUNT = 20

def file(i):
    return FRAMES / f"sprite_burrow_impact_{i:02}.png"

def bad_pixel(pixel):
    red,green,blue,alpha = pixel
    if alpha == 0:
        return False
    top = max(red,green,blue)
    return top >= 175 and (top - min(red,green,blue)) * 100 >= top * 88

def clean(image):
    if image.size != (W,W) or image.mode != "RGBA":
        raise ValueError("Expected real 512x512 RGBA frame")
    pixels = list(image.getdata())
    valid = sum(1 for p in pixels if p[3]>=8)
    indices = [i for i,p in enumerate(pixels) if bad_pixel(p)]
    removed = len(indices)
    if valid < 1000 or removed >= valid * .45:
        raise ValueError(f"Unacceptable artwork change: visible={valid}, removed={removed}")
    output = Image.new("RGBA",(W,W))
    clean_pixels = list(pixels)
    for i in indices:
        clean_pixels[i] = (0,0,0,0)
    output.putdata(clean_pixels)
    changed=set(indices)
    assert all(clean_pixels[i] == pixels[i] for i in range(len(pixels)) if i not in changed), "non-neon pixel changed"
    return output, removed, valid

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--write",action="store_true")
    parser.add_argument("--check",action="store_true")
    args=parser.parse_args()
    if args.write==args.check:
        parser.error("one of --write or --check required")
    with Image.open(ATLAS) as original:
        if original.size!=(COUNT*TILE,TILE):
            raise ValueError(f"Unexpected atlas size {original.size}")
        atlas=original.convert("RGBA")
    changed={}
    total=0
    for i in range(1,COUNT+1):
        with Image.open(file(i)) as f:
            image=f.convert("RGBA")
        revised,removed,visible=clean(image)
        if args.check and removed:
            raise ValueError(f"Vivid out-of-palette contamination in frame {i}: {removed} bad pixels")
        if args.write and removed:
            changed[i]=revised
            total += removed
            print(f"source frame={i:02} removed-neon={removed}, preserved-visible={visible-removed}")
    if args.write:
        if len(changed)<5 or total<500:
            raise ValueError(f"Unexpectedly few corrupted frames/pixels: {len(changed)}, {total}")
        for i,frame in changed.items():
            frame.save(file(i),format="PNG",optimize=True)
            atlas.paste(frame.resize((TILE,TILE),Image.Resampling.LANCZOS),((i-1)*TILE,0))
        atlas.save(ATLAS,format="WEBP",lossless=True,method=6,exact=True)
        print(f"REPAIRED {len(changed)} source PNGs, removed {total} neon pixels; atlas rebuilt losslessly")
    else:
        # Atlas must remain correct size and in a format capable of preserving
        # transparency; sprite source frames are the single audit authority.
        print(f"PASS: {COUNT} source PNGs contain no visibly saturated neon colors; atlas {atlas.size}")

if __name__=="__main__":
    main()
