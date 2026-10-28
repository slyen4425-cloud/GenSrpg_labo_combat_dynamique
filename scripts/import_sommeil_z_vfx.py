#!/usr/bin/env python3
"""Import user-approved Sommeil Z media unchanged into the sole Capture assets catalog."""
from __future__ import annotations

import hashlib
import io
import json
import stat
import zipfile
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
ZIP_NAME = "GENSRPG_SOMMEIL_Z_12F_WEBP.zip"
ZIP_SHA256 = "c54544b0d60519738ffa5bf81b1c5de57e1782d70eb5964fe65ee987449d02c6"
GIT_BLOB_SHA = "6d6e5d763e55133935726dbf95043ac9f1e1a445"
INCOMING = ROOT / "_incoming" / ZIP_NAME
DEST = ROOT / "assets/library/capture/sprites/skills/sommeil_z"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
ASSET_ID = "pack:capture:sprite-sommeil-z-status-01"

def sha256(blob: bytes) -> str:
    return hashlib.sha256(blob).hexdigest()

def git_blob(blob: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(blob)).encode() + b"\0" + blob).hexdigest()

def validate_webp(blob: bytes, width: int, height: int, nframes: int = 1) -> Image.Image:
    img = Image.open(io.BytesIO(blob))
    assert img.format == "WEBP" and img.size == (width, height), ("Wrong WebP media", img.format, img.size)
    assert getattr(img, "n_frames", 1) == nframes, ("Wrong frame count", img.n_frames, nframes)
    for i in range(nframes):
        if nframes > 1:
            img.seek(i)
        assert img.mode == "RGBA", ("No original RGBA mode", img.mode)
        amin, amax = img.getchannel("A").getextrema()
        assert amin == 0 and amax > 0, ("Transparent and visible pixels required", i)
    return img

def inspect_author_zip() -> tuple[dict, dict[str, bytes], dict]:
    assert INCOMING.is_file(), "Expected user ZIP on the dedicated work branch"
    raw = INCOMING.read_bytes()
    assert len(raw) == 4413627, "Author ZIP length differs"
    assert sha256(raw) == ZIP_SHA256 and git_blob(raw) == GIT_BLOB_SHA, "Original author ZIP modified"
    media: dict[str, bytes] = {}
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        infos = z.infolist()
        assert len(infos) == 17 and z.testzip() is None, "ZIP CRC or file count failure"
        assert sum(x.file_size for x in infos) < 50_000_000, "ZIP expansion limit"
        for entry in infos:
            name = entry.filename
            parts = Path(name).parts
            assert name and not entry.is_dir() and not name.startswith("/") and ".." not in parts
            assert not stat.S_ISLNK((entry.external_attr >> 16) & 0xFFFF)
            assert len(parts) <= 2 and name not in media, "Unexpected duplicate/nested file"
            media[name] = z.read(entry)
    manifest = json.loads(media["manifest.json"])
    assert manifest["packId"] == "pack:capture:sommeil-z-status-fx-v1"
    assert manifest["assetId"] == ASSET_ID
    assert manifest["frameCount"] == 12 and manifest["frameSize"] == [512, 512]
    assert manifest["frameDurationMs"] == 110 and manifest["playbackMode"] == "loop"
    assert manifest["loopUntil"] == "status-removed" and manifest["followTarget"] is True
    assert manifest["anchor"] == "above-head" and manifest["visualOnly"] is True
    assert manifest["alpha"] is True and manifest["format"] == "webp"
    atlas = manifest["atlas"]
    assert atlas == {"file": "sommeil_z_atlas_12f.webp", "frameWidth": 512, "frameHeight": 512, "frameCount": 12}
    names = [f"frames/sommeil_z_{k:02}.webp" for k in range(1, 13)]
    assert manifest["frameFiles"] == names
    assert manifest["preview"] == "preview_sommeil_z_12f.webp"
    expected = {"README.txt", "manifest.json", atlas["file"], manifest["preview"], "planche_sommeil_z_12f.png"}
    expected.update(names)
    assert set(media) == expected, "Unexpected source ZIP content"
    frames = [validate_webp(media[fn], 512, 512) for fn in names]
    assert len({sha256(media[fn]) for fn in names}) == 12, "Duplicate frames"
    sprite_strip = validate_webp(media[atlas["file"]], 6144, 512)
    for index, src in enumerate(frames):
        crop = sprite_strip.crop((512 * index, 0, 512 * (index + 1), 512))
        assert ImageChops.difference(src.convert("RGBA"), crop.convert("RGBA")).getbbox() is None, \
            ("Atlas frame differs from approved source", index + 1)
    validate_webp(media[manifest["preview"]], 512, 512, 12)
    source_sheet = Image.open(io.BytesIO(media["planche_sommeil_z_12f.png"]))
    source_sheet.verify()
    assert Image.open(io.BytesIO(media["planche_sommeil_z_12f.png"])).format == "PNG"
    provenance = {
        "originalArchive": ZIP_NAME,
        "originalArchiveSha256": ZIP_SHA256,
        "originalArchiveBytes": len(raw),
        "originalGitBlobSha": GIT_BLOB_SHA,
        "originalFileSha256": {name: sha256(blob) for name, blob in media.items()},
    }
    return manifest, media, provenance

def main() -> None:
    assert not DEST.exists(), "Refusing to overwrite original Sommeil Z pack"
    manifest, media, provenance = inspect_author_zip()
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    assert catalog["storage"]["branch"] == "global-assets"
    assert catalog["storage"]["libraryRoot"] == "assets/library/"
    ids = [a["id"] for a in catalog["assets"]]
    assert len(ids) == len(set(ids)) and ASSET_ID not in ids, "Catalog collision"
    sequence = {
        "id": ASSET_ID, "label": manifest["label"],
        "frameSize": [512, 512], "frame_count": 12, "frame_ms": 110,
        "playback_mode": "loop", "loop": True,
        "loopUntil": manifest["loopUntil"], "anchor": manifest["anchor"],
        "followTarget": True, "visualOnly": True,
        "frames": manifest["frameFiles"], "preview": manifest["preview"],
        "atlas": {"file": "sommeil_z_atlas_12f.webp", "format": "sprite-strip",
                  "frameCount": 12, "frameWidth": 512, "frameHeight": 512},
    }
    catalog["assets"].append({
        "id": ASSET_ID, "label": manifest["label"],
        "assetType": "sprite", "mediaType": "image", "category": "skill",
        "tags": ["capture", "skill", "status", "stun", "sleep", "somnolence", "sommeil", "z", "animated", "fx"],
        "source": {"scope": "pack", "packId": "capture", "author": "GenSrpG", "license": "project-internal"},
        "resource": {
            "file": "capture/sprites/skills/sommeil_z/sommeil_z_atlas_12f.webp",
            "format": "sprite-strip", "mime": "image/webp",
            "frameCount": 12, "frameMs": 110, "playbackMode": "loop",
        },
        "compatibility": {"uses": ["combat", "capture", "editor"]},
    })
    assert len({a["id"] for a in catalog["assets"]}) == len(catalog["assets"])
    for rel, blob in media.items():
        output = DEST / rel
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(blob)  # Exact approved WebP/PNG/manifest bytes.
    (DEST / "sprite_skill_sommeil_z_sequence_01.json").write_text(
        json.dumps(sequence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (DEST / "provenance.json").write_text(
        json.dumps(provenance, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (DEST / "README.md").write_text(
        "# Sommeil — Z flottants (FX Capture)\n\n"
        "User-approved original 12 RGBA WebP 512×512 frames, atlas 6144×512, animated "
        "12-frame preview and original control sheet preserved without artistic changes. "
        "Animation loops every 110 ms/frame. Source metadata requests followTarget, "
        "above-head anchor, and loopUntil=status-removed. These are media/configuration "
        "intent only; no automatic Stun rule or combat renderer modification was made. "
        "The canonical global-assets catalog owns the asset ID.\n", encoding="utf-8")
    catalog["counts"]["assets"] = len(catalog["assets"])
    catalog["counts"]["sprites"] = sum(x["assetType"] == "sprite" for x in catalog["assets"])
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    INCOMING.unlink()  # Original binary remains available in previous git commit for provenance.
    print("SUCCESS: original Sommeil-Z 12 RGBA WebP frames, original strip+preview, 1 authoritative catalog ID")

if __name__ == "__main__":
    main()
