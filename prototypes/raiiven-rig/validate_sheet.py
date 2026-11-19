#!/usr/bin/env python3
"""Validate Raiiven prototype metadata and optional exported 8-frame atlas.

Mechanical checks only. Passing does NOT certify anatomical continuity.
"""
import argparse
import json
from pathlib import Path

EXPECTED_LEGS = {
    "front-left-leg",
    "front-right-leg",
    "rear-left-leg",
    "rear-right-leg",
}


def validate_spec(spec):
    assert spec["creature"] == "raiiven", "Wrong creature"
    assert spec["prototypeOnly"] is True, "Prototype must remain isolated"
    rig = spec["authoring"]
    assert rig["lockedView"] is True, "View must remain locked"
    assert rig["legCount"] == 4, "Quadruped requires exactly four legs"
    assert len(rig["legs"]) == 4 and set(rig["legs"]) == EXPECTED_LEGS, "Missing/duplicate leg"
    assert len(set(rig["rigParts"])) == len(rig["rigParts"]), "Duplicate rig part"
    assert EXPECTED_LEGS.issubset(set(rig["rigParts"])), "Rig part missing"
    export = spec["export"]
    assert export["frameCount"] == 8, "Prototype requires eight frames"
    assert export["columns"] * export["rows"] == export["frameCount"], "Incorrect atlas grid"
    assert export["frameWidth"] == export["frameHeight"] == 512, "Unexpected frame size"
    assert export["transparent"] is True, "Transparent export required"
    assert spec["gates"]["productionPublishAllowed"] is False, "Publishing forbidden at this stage"
    return export


def validate_sheet(path, exp):
    try:
        from PIL import Image
    except ImportError as exc:
        raise SystemExit("Install Pillow for image validation: python -m pip install Pillow") from exc
    im = Image.open(path)
    assert im.mode == "RGBA", "Atlas must be RGBA"
    cell_w, cell_h = exp["frameWidth"], exp["frameHeight"]
    assert im.size == (cell_w * exp["columns"], cell_h * exp["rows"]), "Atlas size mismatch"
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
    print("PASS Raiiven prototype structural checks" + (" and atlas margins" if args.sheet else " (metadata only)"))
    print("NOTE anatomical continuity must still be reviewed visually")


if __name__ == "__main__":
    main()
