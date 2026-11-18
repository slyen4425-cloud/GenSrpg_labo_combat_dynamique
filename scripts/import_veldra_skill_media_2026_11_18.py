#!/usr/bin/env python3
"""Strict importer of author's Veldra media into the sole canonical global-assets catalog."""
import hashlib
import io
import json
import shutil
import subprocess
from pathlib import Path
from zipfile import ZipFile
from PIL import Image, ImageStat, ImageChops

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "_incoming/Veldra_ICÔNES_5_competences.zip"
SPRITES = ROOT / "_incoming/Veldra_SPRITES_EFFETS_5_competences.zip"
SOURCES = {
    ICONS: ("0400c87c2a7aca845726456d3765b673562a6373c368261a8d2f97d40ee4fe5f", "ba1348e3253859beca2626f4385b95713f05d6bb"),
    SPRITES: ("44664b2e076ad2e6e5df8719a5e4c07c0fe83ecf83b42378a8eddd6d07ec5982", "05c41a704cb4bdd8919328dd27d57a97671bf216"),
}
SKILLS = (
    ("01_plume_solaire", "plume-solaire", "Plume solaire", "travel", 80),
    ("02_percee_aurore", "percee-aurore", "Percée d'aurore", "impact", 80),
    ("03_egide_zenith", "egide-zenith", "Égide du zénith", "release", 90),
    ("04_rayon_cardinal", "rayon-cardinal", "Rayon cardinal", "impact", 100),
    ("05_releve_celeste", "releve-celeste", "Relève céleste", "release", 100),
)
CAT = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
PROVENANCE = ROOT / "docs/LAB_VELDRA_SKILL_MEDIA_PROVENANCE_2026_11_18.json"


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def gitblob(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def asimage(data, fmt, size, mode=None):
    with Image.open(io.BytesIO(data)) as img:
        img.load()
        assert img.format == fmt and img.size == size, (img.format, img.size, fmt, size)
        if mode:
            assert img.mode == mode, (img.mode, mode)
        return img.convert("RGBA")


def entry(id_, label, kind, category, mediafile, frame_ms=None):
    resource = {"file": mediafile, "mime": "image/webp"}
    if frame_ms is not None:
        resource.update({"format": "sprite-strip", "frameCount": 16, "frameMs": frame_ms})
    return {
        "id": id_, "label": label, "assetType": kind, "mediaType": "image",
        "category": category, "tags": ["capture", "veldra", "skill", "light", "author-approved"],
        "source": {"scope": "pack", "packId": "capture",
                   "author": "GenSrpG / auteur Veldra (2026-11-18)",
                   "license": "project-internal"},
        "resource": resource,
        "compatibility": {"uses": ["combat", "capture", "editor"]}
    }


def main():
    branch = subprocess.check_output(["git", "branch", "--show-current"], cwd=ROOT, text=True).strip()
    assert branch == "work/lab-veldra-skill-media-20261118", f"refusing to modify {branch!r}"
    for path, (sha, blob) in SOURCES.items():
        assert path.is_file(), f"author ZIP missing: {path}"
        data = path.read_bytes()
        assert sha256(data) == sha and gitblob(data) == blob, f"author ZIP bytes changed: {path}"
    catalog = json.loads(CAT.read_text(encoding="utf-8"))
    assert catalog["storage"]["branch"] == "global-assets"
    assert catalog["counts"]["assets"] == len(catalog["assets"])
    existing = {a["id"] for a in catalog["assets"]}
    assert len(existing) == len(catalog["assets"]), "catalog has duplicate IDs"
    assert not PROVENANCE.exists(), "provenance already exists: no destructive replacement"

    registered = []
    output_files = []
    with ZipFile(ICONS) as zi, ZipFile(SPRITES) as zs:
        assert zi.testzip() is None and zs.testzip() is None, "ZIP CRC mismatch"
        for prefix, key, label, category, frame_ms in SKILLS:
            png = zi.read(f"icones/png_512/{prefix}.png")
            icon = zi.read(f"icones/webp_128/{prefix}.webp")
            sheet = zs.read(f"sprites/planches_4x4/{prefix}.png")
            strip = zs.read(f"sprites/runtime_webp_strip/{prefix}.webp")
            icon_src = asimage(png, "PNG", (512, 512))
            icon_final = asimage(icon, "WEBP", (128, 128))
            sheet_img = asimage(sheet, "PNG", (1024, 1024))
            strip_img = asimage(strip, "WEBP", (4096, 256))
            assert strip_img.getchannel("A").getextrema() == (0, 255), "missing alpha transparency"
            expected_icon = icon_src.resize((128, 128), Image.Resampling.LANCZOS)
            icon_error = sum(ImageStat.Stat(ImageChops.difference(expected_icon, icon_final)).mean) / 4
            assert icon_error < 16, f"icon differs from PNG master: {label}: {icon_error:.3f}"
            seen = set()
            max_strip_error = 0
            for i in range(16):
                frame_bytes = zs.read(f"sprites/frames_256/{prefix}_frame_{i+1:02d}.png")
                original = asimage(frame_bytes, "PNG", (256, 256), "RGBA")
                sheet_frame = sheet_img.crop(((i % 4)*256, (i // 4)*256, ((i % 4)+1)*256, ((i // 4)+1)*256))
                assert original.tobytes() == sheet_frame.tobytes(), f"sheet/frame mismatch: {label}, {i+1}"
                seen.add(sha256(original.tobytes()))
                compressed_frame = strip_img.crop((i*256, 0, (i+1)*256, 256))
                difference = ImageStat.Stat(ImageChops.difference(original, compressed_frame)).mean
                strip_error = sum(difference) / 4
                max_strip_error = max(max_strip_error, strip_error)
                assert strip_error < 9, f"wrong sprite sequence: {label}, frame {i+1}, error {strip_error}"
            assert len(seen) >= 8, f"animation has too few distinct frames: {label}"
            targets = [
                (f"capture/icons/skills/veldra/veldra-{key}.webp", icon),
                (f"capture/sprites/skills/veldra/veldra-{key}.webp", strip),
            ]
            for rel, binary in targets:
                path = ROOT / "assets/library" / rel
                assert not path.exists(), f"refusing to overwrite {path}"
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(binary)
                assert path.read_bytes() == binary
                output_files.append({"path": str(path.relative_to(ROOT)), "size": len(binary),
                                     "sha256": sha256(binary), "gitBlobSha": gitblob(binary)})
            icon_id = f"pack:capture:icon-skill-veldra-{key}-v1"
            sprite_id = f"pack:capture:sprite-skill-veldra-{key}-v1"
            assert icon_id not in existing and sprite_id not in existing, f"colliding id {key}"
            existing.update((icon_id, sprite_id))
            catalog["assets"].append(entry(icon_id, label, "icon", "skill", targets[0][0]))
            catalog["assets"].append(entry(sprite_id, label + " — 16 frames", "sprite", category, targets[1][0], frame_ms))
            registered.append({"skill": key, "iconAssetId": icon_id, "spriteAssetId": sprite_id,
                               "distinctFrames": len(seen), "maxWebpFrameError": round(max_strip_error, 3),
                               "iconOriginalSha256": sha256(png), "sheetOriginalSha256": sha256(sheet)})
    assert len(output_files) == 10 and len(registered) == 5
    assert len(existing) == len(catalog["assets"])
    catalog["counts"]["assets"] += 10
    catalog["counts"]["icons"] += 5
    catalog["counts"]["sprites"] += 5
    assert len(catalog["assets"]) == catalog["counts"]["assets"]
    CAT.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    PROVENANCE.write_text(json.dumps({
        "schema": "veldra-skill-media-provenance-v1",
        "authorZips": [{"path": str(p.relative_to(ROOT)), "sha256": v[0], "gitBlobSha": v[1]} for p,v in SOURCES.items()],
        "assets": output_files, "skillMatches": registered
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("PASS: 5 authentic Veldra icons + 5 sixteen-frame effects; complete 10-asset catalog, original author ZIP verified")


if __name__ == "__main__":
    main()
