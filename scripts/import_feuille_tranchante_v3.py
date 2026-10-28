#!/usr/bin/env python3
"""Import the approved original Feuille tranchante V3 WebP package into Capture's sole asset catalog."""
from __future__ import annotations
import hashlib
import io
import json
import stat
import zipfile
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ZIP_NAME = "FEUILLE_TRANCHANTE_STYLISE_V3_3x12_WEBP.zip"
ZIP_SHA256 = "1173442cfae9bacaf1a020b62f304a83644d3cca31553444fccafea08b285674"
INCOMING = ROOT / "_incoming" / ZIP_NAME
PREFIX = "FEUILLE_TRANCHANTE_STYLISE_V3"
DEST = ROOT / "assets/library/capture/sprites/skills/feuille_tranchante_v3"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
ROLES = {
    "cast": ("release", 75, "once"),
    "projectile": ("travel", 65, "loop"),
    "impact": ("impact", 85, "once"),
}

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def validate_webp(data: bytes, dimensions: tuple[int, int], frames: int = 1) -> None:
    image = Image.open(io.BytesIO(data))
    assert image.format == "WEBP" and image.size == dimensions, (image.format, image.size)
    assert getattr(image, "n_frames", 1) == frames, ("frame count", image.n_frames)
    for index in range(frames):
        if frames > 1:
            image.seek(index)
        alpha_min, alpha_max = image.convert("RGBA").getchannel("A").getextrema()
        assert alpha_min == 0 and alpha_max > 0, ("Transparent and visible pixels required", index)

def inspect_source() -> tuple[dict, dict[str, bytes], dict]:
    assert INCOMING.is_file(), "Missing approved author ZIP: " + str(INCOMING)
    raw = INCOMING.read_bytes()
    assert len(raw) == 3762696 and digest(raw) == ZIP_SHA256, "Approved ZIP changed"
    files = {}
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        infos = z.infolist()
        assert len(infos) == 47 and z.testzip() is None, "ZIP count / CRC invalid"
        assert sum(i.file_size for i in infos) < 55_000_000, "Unexpected ZIP expansion"
        for entry in infos:
            parts = Path(entry.filename).parts
            assert not entry.is_dir() and len(parts) > 1 and parts[0] == PREFIX, "Unexpected ZIP entry"
            assert ".." not in parts and not entry.filename.startswith("/"), "Path traversal forbidden"
            assert not stat.S_ISLNK((entry.external_attr >> 16) & 0xFFFF), "Symlink forbidden"
            name = str(Path(*parts[1:]))
            assert name not in files
            files[name] = z.read(entry)
    manifest = json.loads(files["manifest.json"])
    assert manifest["pack"] == PREFIX
    assert manifest["element"] == ["nature", "terre"]
    assert manifest["format"] == "webp" and manifest["transparency"] is True
    assert manifest["frameWidth"] == 512 and manifest["frameHeight"] == 512
    assert len(manifest["animations"]) == 3
    expected = {"README.txt", "manifest.json"}
    provenance = {"archive": ZIP_NAME, "archiveSha256": ZIP_SHA256, "archiveBytes": len(raw), "sourceFiles": {}}
    for role, (_, ms, mode) in ROLES.items():
        matches = [a for a in manifest["animations"] if a["role"] == role]
        assert len(matches) == 1
        authored = matches[0]
        assert authored["id"] == "pack:capture:sprite-feuille-tranchante-" + role + "-03"
        assert authored["frames"] == 12 and authored["frameDurationMs"] == ms
        assert authored["mode"] == mode and authored["width"] == 512 and authored["height"] == 512
        assert authored["framePattern"] == f"{role}/feuille_tranchante_{role}_NN.webp"
        unique_frames = set()
        for idx in range(1, 13):
            f = f"{role}/feuille_tranchante_{role}_{idx:02d}.webp"
            expected.add(f)
            validate_webp(files[f], (512, 512))
            hashed = digest(files[f])
            unique_frames.add(hashed)
            provenance["sourceFiles"][f] = hashed
        assert len(unique_frames) == 12, "Duplicate animation frame in " + role
        atlas = f"{role}/feuille_tranchante_{role}_atlas_12f.webp"
        assert authored["atlas"] == atlas
        expected.add(atlas)
        validate_webp(files[atlas], (6144, 512))
        provenance["sourceFiles"][atlas] = digest(files[atlas])
        preview = f"preview_feuille_tranchante_{role}.webp"
        assert authored["preview"] == preview
        expected.add(preview)
        validate_webp(files[preview], (512, 512), 12)
        expected.add(f"planche_feuille_tranchante_{role}_12f.jpg")
    assert set(files) == expected, "Unexpected ZIP file list"
    return manifest, files, provenance

def main() -> None:
    assert not DEST.exists(), "Refuse to overwrite existing imported pack"
    source, files, provenance = inspect_source()
    catalogue = json.loads(CATALOG.read_text(encoding="utf8"))
    assert catalogue["storage"]["branch"] == "global-assets"
    assert catalogue["storage"]["libraryRoot"] == "assets/library/"
    existing_ids = {a["id"] for a in catalogue["assets"]}
    assert len(existing_ids) == len(catalogue["assets"]), "Duplicate IDs before import"
    seq = {"id": "pack:capture:feuille-tranchante-v3", "frameSize": [512, 512], "sequences": {}}
    for role, (category, ms, playback) in ROLES.items():
        asset_id = "pack:capture:sprite-feuille-tranchante-" + role + "-03"
        assert asset_id not in existing_ids, "Existing catalog entry: " + asset_id
        existing_ids.add(asset_id)
        atlas = f"{role}/feuille_tranchante_{role}_atlas_12f.webp"
        seq["sequences"][role] = {
            "id": asset_id, "frame_count": 12, "frame_ms": ms,
            "loop": playback == "loop", "playback_mode": playback,
            "frames": [f"{role}/feuille_tranchante_{role}_{n:02d}.webp" for n in range(1, 13)],
            "atlas": {"file": atlas, "format": "sprite-strip", "frameCount": 12, "frameWidth": 512, "frameHeight": 512}
        }
        catalogue["assets"].append({
            "id": asset_id,
            "label": "Feuille tranchante V3 — " + role + " (Nature / Terre, 12f)",
            "assetType": "sprite", "mediaType": "image", "category": category,
            "tags": ["capture", "skill", "nature", "terre", "earth", "foliage", "leaf", role, "animated"],
            "source": {"scope": "pack", "packId": "capture", "author": "GenSrpG", "license": "project-internal"},
            "resource": {
                "file": f"capture/sprites/skills/feuille_tranchante_v3/{atlas}",
                "format": "sprite-strip", "mime": "image/webp",
                "frameCount": 12, "frameMs": ms, "playbackMode": playback
            },
            "compatibility": {"uses": ["combat", "capture", "editor"]}
        })
    assert len(existing_ids) == len(catalogue["assets"])
    for relpath, original in files.items():
        dest = DEST / relpath
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(original)  # Original authored bytes are preserved unchanged.
    (DEST / "sprite_skill_feuille_tranchante_v3_sequences.json").write_text(
        json.dumps(seq, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    (DEST / "provenance.json").write_text(
        json.dumps(provenance, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    (DEST / "README.md").write_text(
        "# Feuille tranchante V3 — Nature / Terre\n\n"
        "Three author animations, 12 original transparent WebP 512x512 frames each; three "
        "original 6144x512 WebP atlas strips; three original animated previews. "
        "Cast and impact play once, projectile loops. Assets registered only in "
        "global-assets' canonical Capture catalogue. No skill auto-assignment.\n", encoding="utf8")
    catalogue["counts"]["assets"] = len(catalogue["assets"])
    catalogue["counts"]["sprites"] = sum(a["assetType"] == "sprite" for a in catalogue["assets"])
    CATALOG.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    INCOMING.unlink()  # The author ZIP remains retrievable in the preceding Git commit.
    print("PASS: 36 original frames, three original atlas strips, previews, manifest and canonical catalog")

if __name__ == "__main__":
    main()
