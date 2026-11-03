#!/usr/bin/env python3
"""Import the artist-approved recut ice gorilla opponent animation on a work branch.

Strictly consumes the exact reviewed package. Does not alter other creatures,
the existing player animation, runtime or skill bindings.
"""
from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import zipfile

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_NAME = "gorille_des_glaces_adversaire_charge_12f_RECOUPE.zip"
SOURCE = ROOT / "_incoming" / ARCHIVE_NAME
SOURCE_SHA256 = "487b1cc772c4dcf1f4daa541ec99f6c04eaaf88bc8e27d19e6c3db201e2d84ba"
ASSET_ID = "pack:capture:creature-gorille-des-glaces-attack-opponent-12-charge-v1"
DEST = ROOT / "assets/library/capture/creatures/gorille_des_glaces/animations/attack/opponent"
CAT = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
FRAMES = [f"frames/gorille_des_glaces_adversaire_charge_{i:02d}.png" for i in range(1, 13)]
ATLAS = "atlas_strip_12f.webp"
PREVIEW = "preview_canalisation.webp"
SHEET = "planche_controle_4x3.png"
MANIFEST = "animation.manifest.json"

def digest(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()

def check_webp_animation(data: bytes, frame_count: int = 12) -> None:
    with Image.open(io.BytesIO(data)) as image:
        assert image.format == "WEBP" and image.is_animated
        assert image.n_frames == frame_count and image.size == (512, 512)
        for i in range(frame_count):
            image.seek(i)
            image.load()

def main() -> None:
    raw = SOURCE.read_bytes()
    assert digest(raw) == SOURCE_SHA256, "Source package differs from reviewed asset"
    git_sha = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
    pending: dict[Path, bytes] = {}
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        names = archive.namelist()
        expected = set(FRAMES) | {ATLAS, PREVIEW, SHEET, MANIFEST}
        assert len(names) == len(set(names)) == len(expected) == 16
        assert set(names) == expected, "Unexpected ZIP entries"
        assert all(not n.startswith("/") and ".." not in PurePosixPath(n).parts for n in names)
        assert archive.testzip() is None, "Archive CRC error"
        source_manifest = json.loads(archive.read(MANIFEST))
        assert source_manifest["frameCount"] == 12
        assert source_manifest["view"] == "opponent"
        assert source_manifest["holdLastFrame"] is True
        assert source_manifest["persistentFrameIndex"] == 11
        durations = source_manifest["frameDurationsMs"]
        assert len(durations) == 12
        assert all(isinstance(d, int) and 60 <= d <= 250 for d in durations)
        rgba = []
        frame_entries = []
        unique = set()
        for i, filename in enumerate(FRAMES):
            data = archive.read(filename)
            with Image.open(io.BytesIO(data)) as image:
                assert image.mode == "RGBA" and image.size == (512, 512)
                assert image.getchannel("A").getextrema()[0] == 0
                mask = image.getchannel("A").point(lambda a: 255 if a >= 32 else 0)
                box = mask.getbbox()
                assert box
                margin = [box[0], box[1], 512-box[2], 512-box[3]]
                assert min(margin) >= 30, f"Frame {i + 1} cropped: {margin}"
                rgba.append(image.copy())
            unique.add(digest(data))
            output = f"frames/gorille_des_glaces_charge_opponent_{i+1:02d}.png"
            frame_entries.append({"index": i, "file": output, "sha256": digest(data),
                                  "marginsLTRB": margin})
            pending[DEST / output] = data
        assert len(unique) == 12, "Identical poses found"
        strip = Image.new("RGBA", (6144, 512), (0, 0, 0, 0))
        for i, frame in enumerate(rgba):
            strip.paste(frame, (i * 512, 0))
        atlas_data = archive.read(ATLAS)
        with Image.open(io.BytesIO(atlas_data)) as image:
            assert image.format == "WEBP" and image.size == (6144, 512)
            reconstructed = image.convert("RGBA")
            assert reconstructed.getchannel("A").tobytes() == strip.getchannel("A").tobytes(), "Atlas alpha mismatch"
            visible = strip.getchannel("A").point(lambda a: 255 if a > 0 else 0)
            for ch in ("R", "G", "B"):
                delta = ImageChops.difference(reconstructed.getchannel(ch),
                                              strip.getchannel(ch))
                assert ImageChops.multiply(delta, visible).getbbox() is None, "Atlas visible pixels differ"
        preview_data = archive.read(PREVIEW)
        check_webp_animation(preview_data)
        with Image.open(io.BytesIO(archive.read(SHEET))) as sheet:
            assert sheet.mode == "RGBA" and sheet.size == (2768, 2096)
        pending[DEST / "atlases/gorille_des_glaces_charge_opponent_12_atlas.webp"] = atlas_data
        pending[DEST / "previews/canalisation.webp"] = preview_data
        pending[DEST / "previews/controle_4x3.png"] = archive.read(SHEET)
        pending[DEST / "sources/source_manifest.json"] = archive.read(MANIFEST)
        atlas_relative = "atlases/gorille_des_glaces_charge_opponent_12_atlas.webp"
        manifest = {
            "schema": "capture-creature-animation-v1",
            "assetId": ASSET_ID,
            "creatureId": "gorille_des_glaces",
            "action": "attack",
            "variant": "charge-canalisation",
            "view": "opponent",
            "frameCount": 12,
            "frameSize": [512, 512],
            "frameMs": 110,
            "frameDurationsMs": durations,
            "playbackMode": "once",
            "holdLastFrame": True,
            "persistentFrameIndex": 11,
            "sourceArchive": ARCHIVE_NAME,
            "sourceArchiveSha256": SOURCE_SHA256,
            "sourceGitBlob": git_sha,
            "atlas": {"file": atlas_relative, "format": "sprite-strip",
                      "frameCount": 12, "frameWidth": 512, "frameHeight": 512,
                      "sha256": digest(atlas_data), "lossless": True},
            "frames": frame_entries,
            "previews": {"canalisation": "previews/canalisation.webp",
                         "planche": "previews/controle_4x3.png"},
            "approvalStatus": "artist_requested_import",
            "notes": "Fixed opponent-facing art, final pose held, no automatic binding."
        }
        pending[DEST / "attack.manifest.json"] = (json.dumps(manifest, ensure_ascii=False,
                                                           indent=2)+"\n").encode()
    catalog = json.loads(CAT.read_text(encoding="utf-8"))
    assert catalog["counts"]["assets"] == len(catalog["assets"])
    ids = [a["id"] for a in catalog["assets"]]
    assert len(ids) == len(set(ids)) and ASSET_ID not in ids
    assert all(not p.exists() for p in pending), "Media already exists: refusing overwrite"
    catalog["assets"].append({
        "id": ASSET_ID,
        "label": "Gorille des glaces — charge / canalisation, attaque adversaire face (12 frames)",
        "assetType": "sprite", "mediaType": "image", "category": "creature",
        "tags": ["capture", "creature", "gorille-des-glaces", "ice", "animated",
                 "attack", "charge", "channeling", "face", "opponent"],
        "source": {"scope": "pack", "packId": "capture",
                   "author": "GenSrpG / art valide, recoupe technique 2026-11-03",
                   "license": "project-internal"},
        "resource": {"file": str((DEST / atlas_relative).relative_to(ROOT / "assets/library")),
                     "format": "sprite-strip", "mime": "image/webp", "frameCount": 12,
                     "frameMs": 110, "playbackMode": "once",
                     "holdLastFrame": True, "persistentFrameIndex": 11},
        "compatibility": {"uses": ["combat", "capture", "editor"]}
    })
    for key in ("assets", "sprites", "creatures"):
        catalog["counts"][key] += 1
    assert catalog["counts"]["assets"] == len(catalog["assets"])
    for path, content in pending.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    CAT.write_text(json.dumps(catalog, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print("PASS: validated 12 opponent frames, lossless atlas, alpha, margins and catalog single authority.")

if __name__ == "__main__":
    main()
