#!/usr/bin/env python3
"""Import the approved six-frame transparent thorn armor as a skill overlay.

The creature-composite preview is kept as review material only. No model,
ability or other asset is modified; catalog remains single-source.
"""
from __future__ import annotations
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import stat
import zipfile

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
ZIP_NAME = "armure_ronces_plante_carnivore_6f.zip"
ZIP_SHA256 = "0ec7c6cd52bc8a3677c214bf9d49a8e45f34a6ce7d285179e811313e95ddfcac"
ZIP_GIT_BLOB = "97750b8ab5cb623c6aa8e8aa6bf3b5c3e241249d"
ZIP_BYTES = 4439017
ARCHIVE_ROOT = "armure_ronces_plante_carnivore_6f/"
SRC = ROOT / "_incoming" / ZIP_NAME
DEST = ROOT / "assets/library/capture/sprites/skills/armure_ronces_plante_carnivore"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
ASSET_ID = "pack:capture:sprite-armure-ronces-plante-carnivore-01"
INPUT_META = "animation.json"
ATLAS = "armure_ronces_atlas_3x2.png"
MASK_PREVIEW = "armure_ronces_masque_preview.webp"
COMPOSITE_PREVIEW = "armure_ronces_sur_creature_preview.webp"
COMPOSITE_FINAL = "armure_ronces_sur_creature_pose_finale.png"
CONTROL = "armure_ronces_planche_controle_3x2.png"
FRAMES = [f"frames/armure_ronces_{i:02d}.png" for i in range(1, 7)]

def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def git_blob_sha(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()

def check_animation(data: bytes, expected_frames: int = 6) -> None:
    with Image.open(io.BytesIO(data)) as image:
        assert image.format == "WEBP" and image.size == (512, 512)
        assert image.n_frames == expected_frames
        for i in range(expected_frames):
            image.seek(i)
            image.load()
            assert image.convert("RGBA").getchannel("A").getextrema()[0] == 0

def main() -> None:
    raw = SRC.read_bytes()
    assert len(raw) == ZIP_BYTES
    assert sha256(raw) == ZIP_SHA256, "Wrong source ZIP hash"
    assert git_blob_sha(raw) == ZIP_GIT_BLOB, "Wrong Git source blob"
    expected = set(FRAMES) | {INPUT_META, ATLAS, MASK_PREVIEW, COMPOSITE_PREVIEW,
                              COMPOSITE_FINAL, CONTROL}
    files: dict[str, bytes] = {}
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        infos = archive.infolist()
        assert len(infos) == len(expected) == 12, "Incorrect number of source entries"
        assert archive.testzip() is None, "ZIP CRC failure"
        assert sum(info.file_size for info in infos) < 60_000_000, "Excessive source size"
        for info in infos:
            name = info.filename
            assert name.startswith(ARCHIVE_ROOT), "Unexpected source archive root"
            rel = name[len(ARCHIVE_ROOT):]
            assert rel in expected and rel not in files, ("Unexpected or duplicate source", rel)
            assert ".." not in PurePosixPath(name).parts and not name.startswith("/")
            assert not stat.S_ISLNK((info.external_attr >> 16) & 0xffff)
            files[rel] = archive.read(info)
    assert set(files) == expected

    author_manifest = json.loads(files[INPUT_META])
    assert author_manifest["schema"] == "gensrpg-capture-overlay-sprite-v1"
    assert author_manifest["creature"] == "plante_carnivore"
    assert author_manifest["type"] == "defense_thorn_armor_overlay"
    assert author_manifest["frames"] == 6
    assert author_manifest["frameSize"] == [512, 512]
    assert author_manifest["layout"] == {"atlasColumns": 3, "atlasRows": 2}
    assert author_manifest["playback"] == "once"
    assert author_manifest["holdLastFrame"] is True
    assert author_manifest["holdFrameIndex"] == 5
    assert author_manifest["assets"]["atlas"] == ATLAS
    assert author_manifest["assets"]["maskPreview"] == MASK_PREVIEW
    assert author_manifest["assets"]["creatureCompositePreview"] == COMPOSITE_PREVIEW
    durations = author_manifest["frameDurationMs"]
    assert len(durations) == 6 and all(isinstance(x, int) and 60 <= x <= 250 for x in durations)

    source_atlas = Image.open(io.BytesIO(files[ATLAS]))
    assert source_atlas.mode == "RGBA" and source_atlas.size == (1536, 1024)
    strip = Image.new("RGBA", (3072, 512), (0, 0, 0, 0))
    frame_entries = []
    unique = set()
    pending: dict[Path, bytes] = {}
    for i, original in enumerate(FRAMES):
        data = files[original]
        with Image.open(io.BytesIO(data)) as image:
            assert image.mode == "RGBA" and image.size == (512, 512), original
            minimum, maximum = image.getchannel("A").getextrema()
            assert minimum == 0 and maximum > 0
            bbox = image.getchannel("A").point(lambda a: 255 if a >= 16 else 0).getbbox()
            assert bbox
            margins = [bbox[0], bbox[1], 512-bbox[2], 512-bbox[3]]
            assert min(margins) >= 30, ("Clipped thorns", original, margins)
            tile = source_atlas.crop(((i % 3)*512, (i//3)*512,
                                      ((i % 3)+1)*512, ((i//3)+1)*512))
            assert tile.tobytes() == image.tobytes(), ("Author atlas mismatch", original)
            strip.paste(image, (i*512,0))
        frame_name = f"frames/armure_ronces_{i+1:02d}.png"
        unique.add(sha256(data))
        frame_entries.append({"index":i, "file": frame_name,
                              "sha256": sha256(data), "marginsLTRB": margins})
        pending[DEST / frame_name] = data
    assert len(unique) == 6, "Repeated pose"

    check_animation(files[MASK_PREVIEW])
    check_animation(files[COMPOSITE_PREVIEW])
    with Image.open(io.BytesIO(files[CONTROL])) as sheet:
        assert sheet.mode == "RGBA" and sheet.size == (2096, 1424)
    with Image.open(io.BytesIO(files[COMPOSITE_FINAL])) as composite:
        assert composite.mode == "RGBA" and composite.size == (512,512)

    out = io.BytesIO()
    strip.save(out,"WEBP", lossless=True, method=6)
    atlas_bytes = out.getvalue()
    with Image.open(io.BytesIO(atlas_bytes)) as image:
        decoded = image.convert("RGBA")
        assert decoded.size == strip.size and image.format == "WEBP"
        assert decoded.getchannel("A").tobytes() == strip.getchannel("A").tobytes()
        visible = strip.getchannel("A").point(lambda a: 255 if a > 0 else 0)
        for channel in ("R","G","B"):
            delta = ImageChops.difference(decoded.getchannel(channel),
                                          strip.getchannel(channel))
            assert ImageChops.multiply(delta,visible).getbbox() is None, "Visible RGB changed"

    atlas_name = "atlases/armure_ronces_plante_carnivore_atlas_6f.webp"
    pending[DEST / atlas_name] = atlas_bytes
    pending[DEST / "previews/masque_6f.webp"] = files[MASK_PREVIEW]
    pending[DEST / "previews/controle_3x2.png"] = files[CONTROL]
    # Only a source review; never point runtime catalog at the composite.
    pending[DEST / "sources/revue_sur_creature.webp"] = files[COMPOSITE_PREVIEW]
    pending[DEST / "sources/revue_pose_finale.png"] = files[COMPOSITE_FINAL]
    pending[DEST / "sources/original_atlas_3x2.png"] = files[ATLAS]
    pending[DEST / "sources/author_manifest.json"] = files[INPUT_META]
    manifest = {
        "schema": "capture-skill-overlay-v1",
        "id": ASSET_ID,
        "creatureReference": "plante_carnivore",
        "type": "defense_thorn_armor_overlay",
        "frameCount": 6,
        "frameSize": [512,512],
        "frameDurationsMs": durations,
        "frameMs": 135,
        "mode": "once",
        "holdLastFrame": True,
        "holdFrameIndex": 5,
        "facingReference": "opponent",
        "sourceArchive": ZIP_NAME,
        "sourceSha256": ZIP_SHA256,
        "sourceGitBlob": ZIP_GIT_BLOB,
        "frames": frame_entries,
        "atlas": {"file":atlas_name, "format":"sprite-strip",
                  "frameCount":6,"frameWidth":512,"frameHeight":512,
                  "sha256":sha256(atlas_bytes),"lossless":True},
        "preview": {"mask":"previews/masque_6f.webp",
                    "control":"previews/controle_3x2.png"},
        "runtimeOnlyThorns": True,
        "noAutoBinding": True,
        "notes": "Overlay mask only; composite preserved as source review, not in asset catalog."
    }
    pending[DEST / "sequence.manifest.json"] = (json.dumps(manifest,ensure_ascii=False,indent=2)+"\n").encode("utf8")
    cat = json.loads(CATALOG.read_text(encoding="utf8"))
    assert cat["storage"]["branch"] == "global-assets"
    assert cat["counts"]["assets"] == len(cat["assets"])
    ids = [asset["id"] for asset in cat["assets"]]
    assert len(ids)==len(set(ids)) and ASSET_ID not in ids
    assert all(not path.exists() for path in pending), "Would overwrite existing asset"
    relative = str((DEST / atlas_name).relative_to(ROOT/"assets/library"))
    cat["assets"].append({
        "id": ASSET_ID,
        "label": "Armure de ronces — pointes seules (Plante carnivore, 6f)",
        "assetType":"sprite","mediaType":"image","category":"skill",
        "tags":["capture","skill","nature","thorn","ronces","plante-carnivore",
                "defense","buff","status","overlay","animated","hold-last-frame"],
        "source":{"scope":"pack","packId":"capture","author":"GenSrpG / artwork author approved",
                  "license":"project-internal"},
        "resource":{"file":relative,"format":"sprite-strip","mime":"image/webp",
                    "frameCount":6,"frameMs":135,"playbackMode":"once",
                    "holdLastFrame":True,"persistentFrameIndex":5},
        "compatibility":{"uses":["combat","capture","editor"]}
    })
    cat["counts"]["assets"] += 1
    cat["counts"]["sprites"] += 1
    assert cat["counts"]["assets"] == len(cat["assets"])
    assert cat["counts"]["sprites"] == sum(a["assetType"]=="sprite" for a in cat["assets"])
    for path,data in pending.items():
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_bytes(data)
    CATALOG.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("PASS: exact ZIP SHA/CRC, six RGBA thorn-only PNGs, WebP strip lossless,"
          " six-frame preview, canonical catalog +1, no creature image in runtime.")

if __name__=="__main__":
    main()
