#!/usr/bin/env python3
"""Import the two author-approved Éphémus ZIPs into the single global-assets catalog.

Run only in isolated asset WORK branch. Never modifies user ZIPs, unrelated
species, skills, gameplay, or the main branch.
"""
import hashlib
import io
import json
from pathlib import Path
from zipfile import ZipFile, BadZipFile
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
ZIP_ICONS = ROOT / "_incoming" / "Ephemus_ICÔNES_5_competences.zip"
ZIP_SPRITES = ROOT / "_incoming" / "Ephemus_SPRITES_EFFETS_5_competences.zip"
EXPECTED = {
    ZIP_ICONS: "619d7cd322f0e5e3a8745902ae426eac73a81b05e20e171daa6fb7d29f27872d",
    ZIP_SPRITES: "a32b989be423e1f5db8a9b0812d925f3b8a1b87bd5b26f7294fc9bf7f244dbc2",
}
SKILLS = [
    ("01_poussiere_oubli", "ephemus-poussiere-oubli", "Poussière d'oubli", "travel", 80),
    ("02_battement_limbes", "ephemus-battement-limbes", "Battement des limbes", "travel", 100),
    ("03_chrysalide_fantome", "ephemus-chrysalide-fantome", "Chrysalide fantôme", "release", 100),
    ("04_lanterne_ames", "ephemus-lanterne-ames", "Lanterne des âmes", "skill", 100),
    ("05_danse_mille_ames", "ephemus-danse-mille-ames", "Danse des mille âmes", "travel", 100),
]
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
OUT = ROOT / "assets/library/capture"
PROVENANCE = ROOT / "docs/LAB_EPHEMUS_ASSET_PROVENANCE_2026_11_18.json"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def asset(asset_id, label, type_, cat, rel, tags, *, frames=None, frame_ms=None):
    resource = {"file": rel, "mime": "image/webp"}
    if frames:
        resource.update({"format": "sprite-strip", "frameCount": frames, "frameMs": frame_ms})
    return {
        "id": asset_id, "label": label, "assetType": type_, "mediaType": "image",
        "category": cat, "tags": tags,
        "source": {"scope": "pack", "packId": "capture",
                   "author": "GenSrpG / auteur (Éphémus, 2026-11-18)",
                   "license": "project-internal"},
        "resource": resource,
        "compatibility": {"uses": ["combat", "capture", "editor"]},
    }


def main():
    for path, expected in EXPECTED.items():
        assert path.is_file(), f"missing approved author ZIP {path}"
        assert sha(path.read_bytes()) == expected, f"source ZIP does not match author's approved upload: {path}"
    import subprocess
    branch = subprocess.check_output(["git", "branch", "--show-current"], text=True).strip()
    assert branch == "work/lab-ephemus-assets-20261118", f"refusing to modify branch {branch}"
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    assert catalog["storage"]["branch"] == "global-assets"
    assert len(catalog["assets"]) == catalog["counts"]["assets"]
    ids = {a["id"] for a in catalog["assets"]}
    assert len(ids) == len(catalog["assets"])
    assert not PROVENANCE.exists(), "provenance already exists: no overwrite"
    source_checks = []
    outputs = []
    with ZipFile(ZIP_ICONS) as zi, ZipFile(ZIP_SPRITES) as zs:
        assert zi.testzip() is None and zs.testzip() is None, "corrupt input ZIP"
        for prefix, slug, label, kind, frame_ms in SKILLS:
            icon_bytes = zi.read(f"icones_512/{prefix}.png")
            sheet_bytes = zs.read(f"planches_4x4/{prefix}.png")
            icon = Image.open(io.BytesIO(icon_bytes)).convert("RGBA")
            sheet = Image.open(io.BytesIO(sheet_bytes)).convert("RGBA")
            assert icon.size == (512, 512)
            assert sheet.size == (1024, 1024)
            strip = Image.new("RGBA", (16 * 256, 256), (0, 0, 0, 0))
            pixel_hashes = set()
            for index in range(16):
                fbytes = zs.read(f"frames/{prefix}/frame_{index + 1:02d}.png")
                frame = Image.open(io.BytesIO(fbytes)).convert("RGBA")
                assert frame.size == (256, 256), (prefix, index, frame.size)
                cell = sheet.crop(((index % 4) * 256, (index // 4) * 256, ((index % 4) + 1) * 256, ((index // 4) + 1) * 256))
                assert ImageChops.difference(cell, frame).getbbox() is None, f"sheet/frame mismatch {prefix} {index + 1}"
                pixel_hashes.add(sha(frame.tobytes()))
                strip.paste(frame, (index * 256, 0))
            assert len(pixel_hashes) >= 8, f"not a meaningful 16-frame animation: {prefix}"
            icon_path = OUT / "icons/skills/ephemus" / (slug + ".webp")
            sprite_path = OUT / "sprites/skills/ephemus" / (slug + ".webp")
            assert not icon_path.exists() and not sprite_path.exists(), f"refusing overwrite {slug}"
            icon_path.parent.mkdir(parents=True, exist_ok=True)
            sprite_path.parent.mkdir(parents=True, exist_ok=True)
            icon.resize((128, 128), Image.Resampling.LANCZOS).save(icon_path, format="WEBP", quality=90, method=6)
            strip.save(sprite_path, format="WEBP", quality=90, method=6)
            for path, size in [(icon_path, (128, 128)), (sprite_path, (4096, 256))]:
                with Image.open(path) as decoded:
                    assert decoded.format == "WEBP" and decoded.size == size
            icon_id = f"pack:capture:icon-skill-{slug}-v1"
            sprite_id = f"pack:capture:sprite-skill-{slug}-v1"
            assert icon_id not in ids and sprite_id not in ids
            ids.add(icon_id)
            ids.add(sprite_id)
            cat = "skill" if kind == "skill" else kind
            catalog["assets"].append(asset(icon_id, label, "icon", "skill", "capture/icons/skills/ephemus/" + slug + ".webp", ["ephemus", "spirit", "skill", "icon", "capture"]))
            catalog["assets"].append(asset(sprite_id, label + " — 16 images", "sprite", cat, "capture/sprites/skills/ephemus/" + slug + ".webp", ["ephemus", "spirit", "skill", kind, "capture"], frames=16, frame_ms=frame_ms))
            source_checks.append({"skill": slug, "sourceIconSha256": sha(icon_bytes), "sourceSheetSha256": sha(sheet_bytes), "distinctFrames": len(pixel_hashes)})
            outputs.extend([{"id": icon_id, "path": str(icon_path.relative_to(ROOT)), "sha256": sha(icon_path.read_bytes())},
                            {"id": sprite_id, "path": str(sprite_path.relative_to(ROOT)), "sha256": sha(sprite_path.read_bytes())}])
    assert len(outputs) == 10 and len(ids) == len(catalog["assets"])
    catalog["counts"]["assets"] += 10
    catalog["counts"]["icons"] += 5
    catalog["counts"]["sprites"] += 5
    assert catalog["counts"]["assets"] == len(catalog["assets"])
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    PROVENANCE.write_text(json.dumps({"schema": "ephemus-media-provenance-v1", "sourceArchives": [
        {"path": str(p.relative_to(ROOT)), "sha256": h} for p, h in EXPECTED.items()
    ], "sourceChecks": source_checks, "publishedAssets": outputs}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"PASS: 5 icons, 5 distinct 16-frame sprites, original ZIP hashes, canonical catalog 10 new IDs, all media decodable")


if __name__ == "__main__":
    main()
