#!/usr/bin/env python3
"""Copy audited CAST/STATUS RGBA rectangles into padded frames and lossless strips."""
import argparse
from io import BytesIO
import hashlib
import json
from pathlib import Path
import shutil
from PIL import Image

SHEETS = {
    "cast_charge": {
        "sha": "aac01479c103250ff2fd7cb459f7131364c089d6586d64d813b4da7c59706b69",
        "folder": "casts", "prefix": "cast", "category": "release", "frameMs": 60,
        "names": ["blade", "physical", "electric", "water", "nature"],
        "labels": ["Charge — Lame", "Charge — Physique", "Charge — Électrique", "Charge — Eau", "Charge — Nature"],
        "x": [(i*192, (i+1)*192) for i in range(8)],
        "rows": [(0,190), (200,407), (420,610), (625,810), (818,1024)],
        "xByFamily": {"electric": [(0,192), (192,384), (384,576), (576,768), (768,978), (978,1152), (1152,1344), (1344,1536)]},
    },
    "status_aura": {
        "sha": "bcc082152b0b5c83b34b51c890dc43bc48267751120740ad478801fcb8f19904",
        "folder": "statuses", "prefix": "status", "category": "skill", "frameMs": 90,
        "names": ["healing_aura", "energy_shield", "stone_shell", "poison", "regeneration", "purification", "curse"],
        "labels": ["Aura de soins", "Bouclier d’énergie", "Carapace", "Poison", "Régénération", "Purification", "Malédiction"],
        "x": [(120,284), (284,457), (457,628), (628,802), (802,974), (974,1147), (1147,1340), (1340,1536)],
        "y": [0, 138, 273, 412, 552, 688, 840, 1024],
    },
}
FRAME_SIZE = (256, 256)

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def save_image(image, path, format, **options):
    out = BytesIO()
    image.save(out, format=format, **options)
    path.write_bytes(out.getvalue())

def extract(root, key, source_path, transparent_path, prompt_file):
    cfg = SHEETS[key]
    original = Image.open(source_path)
    sheet = Image.open(transparent_path)
    assert original.format == "JPEG" and original.mode == "RGB" and original.size == (1536, 1024)
    assert digest(source_path) == cfg["sha"], "audited original is required"
    assert sheet.mode == "RGBA" and sheet.size == original.size
    alpha = sheet.getchannel("A")
    assert alpha.getextrema()[0] == 0 and sum(alpha.histogram()[1:255]) > 1000
    source_dir = Path("assets/library/capture/sprites/source")
    (root / source_dir).mkdir(parents=True, exist_ok=True)
    original_rel = source_dir / (key + "_source_01.jpg")
    transparent_rel = source_dir / (key + "_transparent_01.png")
    shutil.copyfile(source_path, root / original_rel)
    shutil.copyfile(transparent_path, root / transparent_rel)
    manifest = {
        "schema": "cast-status-source-extraction-v1",
        "original": {"file": original_rel.as_posix(), "sha256": cfg["sha"], "format": "JPEG",
                     "mode": "RGB", "size": list(original.size), "uploadedFilename": source_path.name},
        "transparent": {"file": transparent_rel.as_posix(), "sha256": digest(root / transparent_rel),
                        "mode": "RGBA", "size": list(sheet.size)},
        "backgroundExtraction": {"tool": "imagegen", "transparentBackground": True,
            "prompt": json.loads(prompt_file.read_text(encoding="utf-8")),
            "note": "AI-assisted alpha extraction from flattened JPEG. Audited derivative, not pixel-identical original RGB. Original is archived unchanged. Labels/panels removed; light/dark inspection includes black curse cores."},
        "extraction": "Exact rectangular RGBA copies with transparent padding. No resampling, color-key, alpha threshold, rotation, per-frame recentering or painting.",
        "frameSize": list(FRAME_SIZE), "frameMs": cfg["frameMs"], "families": []
    }
    catalog_path = root / "data/assets/catalog/global-visual-assets.v1.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    for row, (name, label) in enumerate(zip(cfg["names"], cfg["labels"])):
        family_dir = Path("assets/library/capture/sprites") / cfg["folder"] / name
        frames_dir, atlas_dir = family_dir / "frames", family_dir / "atlases"
        (root / frames_dir).mkdir(parents=True, exist_ok=True)
        (root / atlas_dir).mkdir(parents=True, exist_ok=True)
        asset_id = "pack:capture:sprite-" + cfg["prefix"] + "-" + name.replace("_", "-") + "-01"
        family = {"name": name, "label": label, "sourceRow": row, "assetId": asset_id, "frames": []}
        atlas = Image.new("RGBA", (2048, 256), (0, 0, 0, 0))
        for col in range(8):
            left, right = cfg.get("xByFamily", {}).get(name, cfg["x"])[col]
            top, bottom = cfg["rows"][row] if "rows" in cfg else (cfg["y"][row], cfg["y"][row+1])
            rect = (left, top, right, bottom)
            crop = sheet.crop(rect)
            dx, dy = (256-crop.width)//2, (256-crop.height)//2
            assert dx >= 8 and dy >= 8, "transparent frame border required"
            frame = Image.new("RGBA", FRAME_SIZE, (0, 0, 0, 0))
            frame.paste(crop, (dx, dy))
            frame_rel = frames_dir / ("sprite_" + cfg["prefix"] + "_" + name + "_" + str(col+1).zfill(2) + ".png")
            save_image(frame, root / frame_rel, "PNG", optimize=True)
            family["frames"].append({"file": frame_rel.as_posix(), "sha256": digest(root / frame_rel),
                                      "sourceRect": list(rect), "offset": [dx, dy]})
            atlas.paste(frame, (col*256, 0))
        atlas_rel = atlas_dir / ("sprite_" + cfg["prefix"] + "_" + name + "_atlas_01.webp")
        save_image(atlas, root / atlas_rel, "WEBP", lossless=True, quality=100, method=4, exact=True)
        assert Image.open(root / atlas_rel).convert("RGBA").tobytes() == atlas.tobytes()
        family.update({"atlas": atlas_rel.as_posix(), "atlasSha256": digest(root / atlas_rel), "atlasSize": [2048, 256]})
        sequence_rel = family_dir / ("sprite_" + cfg["prefix"] + "_" + name + "_sequence.json")
        sequence = {"id": cfg["prefix"] + "_" + name,
            "type": "cast_charge_sprite_sequence" if cfg["folder"] == "casts" else "status_aura_sprite_sequence",
            "frame_ms": cfg["frameMs"], "loop": cfg["folder"] == "statuses",
            "progression": "build_up" if cfg["folder"] == "casts" else "cycle",
            "frames": [str(Path("frames") / Path(f["file"]).name) for f in family["frames"]],
            "atlas": {"file": str(Path("atlases") / atlas_rel.name), "format": "sprite-strip",
                      "frameCount": 8, "frameWidth": 256, "frameHeight": 256},
            "sourceManifest": "../../source/" + key + "_extraction_v1.json"}
        (root / sequence_rel).write_text(json.dumps(sequence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        family["sequence"] = sequence_rel.as_posix()
        manifest["families"].append(family)
        matches = [a for a in catalog["assets"] if a["id"] == asset_id]
        assert len(matches) == (1 if cfg["folder"] == "casts" else 0), "stable casts and new status IDs only"
        if matches:
            asset = matches[0]
            asset["label"] = label
        else:
            asset = {"id": asset_id, "label": label, "assetType": "sprite", "mediaType": "image",
                "category": cfg["category"], "tags": ["skill", "status", "aura", "animated", "capture"],
                "source": {"scope": "pack", "packId": "capture", "author": "GenSrpG", "license": "project-internal"},
                "compatibility": {"uses": ["combat", "capture", "editor"]}}
            catalog["assets"].append(asset)
        asset["resource"] = {"file": str(atlas_rel.relative_to("assets/library")),
            "format": "sprite-strip", "mime": "image/webp", "frameCount": 8, "frameMs": cfg["frameMs"]}
        if cfg["folder"] == "statuses":
            asset["resource"]["playbackMode"] = "loop"
    catalog["counts"]["assets"] = len(catalog["assets"])
    catalog["counts"]["sprites"] = sum(a["assetType"] == "sprite" for a in catalog["assets"])
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    target = root / source_dir / (key + "_extraction_v1.json")
    target.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"sheet": key, "families": len(cfg["names"]), "frames": len(cfg["names"])*8,
        "atlases": len(cfg["names"]), "transparentSHA256": manifest["transparent"]["sha256"]}))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--sheet", choices=SHEETS, required=True)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--transparent", type=Path, required=True)
    parser.add_argument("--prompt-file", type=Path, required=True)
    args = parser.parse_args()
    extract(args.root.resolve(), args.sheet, args.source, args.transparent, args.prompt_file)
