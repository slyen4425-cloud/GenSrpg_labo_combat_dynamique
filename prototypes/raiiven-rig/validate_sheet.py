#!/usr/bin/env python3
"""Validate Raiiven full-illustration-per-frame contract and optional PNG atlas.

Mechanical checks cannot prove coherent legs or image quality: human review required.
"""
import argparse
import json
from pathlib import Path

EXPECTED_LEGS = {
    "front-left-leg", "front-right-leg", "rear-left-leg", "rear-right-leg",
}


def validate_spec(spec):
    assert spec["creature"] == "raiiven"
    assert spec["prototypeOnly"] is True
    author = spec["authoring"]
    assert author["mode"] == "full-illustration-per-frame", "Every frame must be a complete illustration"
    assert author["cutoutAnimationAllowed"] is False, "No cutout animation"
    assert author["assembledLimbsInFinalAllowed"] is False, "No visible assembled pieces"
    assert author["lockedView"] is True, "View must remain locked"
    anatomy = author["anatomy"]
    assert anatomy["legCount"] == 4, "Quadruped must have exactly four legs"
    assert len(anatomy["limbIdentity"]) == 4 and set(anatomy["limbIdentity"]) == EXPECTED_LEGS
    assert anatomy["consistentAnatomyAcrossFrames"] is True
    assert author["motion"] == "horse-transverse-gallop-four-beat-right-lead", "Raiiven must gallop, not walk/trot"
    gait = author["gaitPlan"]
    assert len(gait) == 8 and [p["frame"] for p in gait] == list(range(1, 9))
    assert [p["contact"] for p in gait[1:5]] == [
        "left-hind", "right-hind", "left-fore", "right-fore"
    ], "Four beat right-lead gallop contacts incorrect"
    assert sum(p["contact"] == "none" for p in gait) >= 2, "No flight/suspension poses"
    export = spec["export"]
    assert export["frameCount"] == 8
    assert export["columns"] * export["rows"] == export["frameCount"]
    assert export["frameWidth"] == export["frameHeight"] == 512
    assert export["transparent"] is True
    assert spec["gates"]["productionPublishAllowed"] is False
    return export


def validate_sheet(path, exp):
    try:
        from PIL import Image
    except ImportError as exc:
        raise SystemExit("Install Pillow: python -m pip install Pillow") from exc
    im = Image.open(path)
    assert im.mode == "RGBA", "Atlas must be RGBA"
    cell_w, cell_h = exp["frameWidth"], exp["frameHeight"]
    assert im.size == (cell_w * exp["columns"], cell_h * exp["rows"])
    safe = exp["minSafeMarginPx"]
    for idx in range(exp["frameCount"]):
        x, y = idx % exp["columns"], idx // exp["columns"]
        frame = im.crop((x * cell_w, y * cell_h, (x + 1) * cell_w, (y + 1) * cell_h))
        box = frame.getchannel("A").getbbox()
        assert box is not None, f"Empty frame {idx + 1}"
        l, top, right, bottom = box
        assert min(l, top, cell_w - right, cell_h - bottom) >= safe, f"Unsafe margin in frame {idx + 1}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--spec", type=Path, required=True)
    parser.add_argument("--sheet", type=Path)
    args = parser.parse_args()
    exp = validate_spec(json.loads(args.spec.read_text(encoding="utf-8")))
    if args.sheet:
        validate_sheet(args.sheet, exp)
    print("PASS Raiiven full-frame image contract" + (" and atlas format" if args.sheet else " (metadata only)"))
    print("NOTE Limb count, anatomical continuity and artistic quality require visual approval")


if __name__ == "__main__":
    main()
