#!/usr/bin/env python3
"""Import approved Raiiven motions into the ONE official global-assets library.

Usage: python scripts/publish-raiiven-animations-20261119.py SOURCE_CHECKOUT CANONICAL_CHECKOUT
Source author ZIP files are never overwritten; catalog, models and other creatures
are protected. The unapproved opponent attack PROTO is deliberately excluded.
"""
from __future__ import annotations

import hashlib
import io
import json
import sys
import zipfile
from pathlib import Path

from PIL import Image

ARCHIVES = (
    {
        "zip": "raiiven_galop_7_frames_valide.zip",
        "sha": "22389bbc0a20914d33a123038b2169118c8a146783bd09f621e7c1abc2071324",
        "action": "movement", "view": "player", "frame_count": 7,
        "frame_ms": 120, "playback": "loop",
        "members": "raiiven_galop/frame_{index:02}.png",
        "master": "raiiven_dos.png",
        "label": "Raiiven — galop dos (7 frames)",
    },
    {
        "zip": "raiiven_attaque_5_frames_preview.zip",
        "sha": "78c4f0eece6708b34980ca42014d953e9658f8bdf9664b26cdfc16b624bb049b",
        "action": "attack", "view": "player", "frame_count": 5,
        "frame_ms": 180, "playback": "once",
        "members": "raiiven_attaque_frame_{index:02}.png",
        "master": "raiiven_dos.png",
        "label": "Raiiven — attaque dos (5 frames)",
    },
    {
        "zip": "raiiven_mouvement_adversaire_6_frames.zip",
        "sha": "05c68d5b2b96ec0b092c4c1b0da30d30e4d20fc5eb82c0be1dfe4be745bb163f",
        "action": "movement", "view": "opponent", "frame_count": 6,
        "frame_ms": 130, "playback": "loop",
        "members": "raiiven_mouvement_adversaire_frame_{index:02}.png",
        "master": "raiiven_face.png",
        "label": "Raiiven — mouvement adversaire face (6 frames)",
    },
)

def digest(blob: bytes) -> str:
    return hashlib.sha256(blob).hexdigest()

def approved_master(directory: Path, filename: str) -> Image.Image:
    path = directory / "runtime" / filename
    image = Image.open(path).convert("RGBA")
    assert image.size == (512, 512), path
    assert image.getpixel((0, 0))[3] == 0, path
    return image

def author_frame(z: zipfile.ZipFile, member: str) -> Image.Image:
    assert member in z.namelist(), f"Missing original author frame: {member}"
    image = Image.open(io.BytesIO(z.read(member))).convert("RGBA")
    assert image.size == (512, 512), member
    # Remove low-alpha extraction dust, particularly the transparent-checker
    # residue on the approved 7-frame gallop. This does NOT redraw any creature.
    alpha = image.getchannel("A").point(lambda opacity: opacity if opacity >= 45 else 0)
    image.putalpha(alpha)
    assert alpha.getbbox(), f"Empty author frame: {member}"
    assert image.getpixel((0, 0))[3] == 0, member
    return image

def one_media(spec: dict, source: Path, canonical: Path, catalog: dict) -> dict:
    archive = source / spec["zip"]
    blob = archive.read_bytes()
    assert digest(blob) == spec["sha"], f"Unexpected ZIP bytes: {archive}"
    root = canonical / "assets/library/capture/creatures/raiiven"
    count = spec["frame_count"]
    output = root / "animations" / spec["action"] / spec["view"]
    output.mkdir(parents=True, exist_ok=True)
    atlas_path = output / f"raiiven_{spec['action']}_{spec['view']}_{count}f.webp"
    manifest_path = output / "animation.manifest.json"

    with zipfile.ZipFile(io.BytesIO(blob)) as z:
        originals = [
            author_frame(z, spec["members"].format(index=n))
            for n in range(1, count + 1)
        ]

    # The approved PNG makes the FIRST rendered frame exactly canonical.
    frames = [approved_master(root, spec["master"])] + originals[1:]
    atlas = Image.new("RGBA", (512 * count, 512), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        atlas.paste(frame, (i * 512, 0))
    atlas.save(atlas_path, format="WEBP", lossless=True, method=6)
    reread = Image.open(atlas_path).convert("RGBA")
    assert reread.size == (512 * count, 512)
    assert reread.crop((0, 0, 512, 512)).tobytes() == frames[0].tobytes(), "Master frame changed"

    # The accepted ZIP continues to be the sole author source; no duplicate
    # PNG frames or previews are copied into the public library.
    info = {
        "schema": "capture-creature-animation-v1",
        "creatureId": "raiiven",
        "action": spec["action"],
        "view": spec["view"],
        "frameCount": count,
        "frameSize": [512, 512],
        "frameMs": spec["frame_ms"],
        "playbackMode": spec["playback"],
        "sourceArchive": spec["zip"],
        "sourceArchiveSha256": spec["sha"],
        "firstFrame": "approved-static-master",
        "firstFrameRgbaSha256": digest(frames[0].tobytes()),
        "unapprovedOpponentAttackExcluded": True,
        "frames": [
            {"index": i, "rgbaSha256": digest(frame.tobytes())}
            for i, frame in enumerate(frames)
        ],
        "atlas": {
            "file": atlas_path.relative_to(canonical / "assets/library").as_posix(),
            "format": "sprite-strip",
            "frameCount": count,
            "frameWidth": 512,
            "frameHeight": 512,
        },
    }
    manifest_path.write_text(json.dumps(info, ensure_ascii=False, indent=2) + "\n", encoding="utf8")

    asset_id = f"pack:capture:creature-raiiven-{spec['action']}-{spec['view']}-{count}-v1"
    return {
        "id": asset_id,
        "label": spec["label"],
        "assetType": "sprite", "mediaType": "image", "category": "creature",
        "tags": ["capture", "creature", "raiiven", "animated", spec["view"],
                 spec["action"], "spirit", "approved-20261119"],
        "source": {"scope": "pack", "packId": "capture",
                   "author": "GenSRPG / visuels auteur approuvés", "license": "project-internal"},
        "resource": {
            "file": info["atlas"]["file"],
            "format": "sprite-strip", "mime": "image/webp",
            "frameCount": count, "frameMs": spec["frame_ms"],
            "playbackMode": spec["playback"],
        },
        "compatibility": {"uses": ["combat", "capture", "editor"]},
    }

def run(source: Path, canonical: Path) -> None:
    assert not (source / "assets/library/capture/creatures/raiiven/animations").exists(), "Duplicate media owner"
    catalog_path = canonical / "data/assets/catalog/global-visual-assets.v1.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf8"))
    assert catalog["storage"]["branch"] == "global-assets"
    assert catalog["counts"]["assets"] == len(catalog["assets"])
    ids = {entry["id"] for entry in catalog["assets"]}
    items = []
    for spec in ARCHIVES:
        item = one_media(spec, source, canonical, catalog)
        assert item["id"] not in ids, f"Conflicting existing ID: {item['id']}"
        ids.add(item["id"])
        items.append(item)
    catalog["assets"].extend(items)
    catalog["counts"]["assets"] += len(items)
    catalog["counts"]["sprites"] += len(items)
    assert catalog["counts"]["assets"] == len(catalog["assets"])
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print("PASS Raiiven approved animated clips: 7f player movement, 5f player attack, 6f opponent movement")
    print("PASS canonical first frame and one global-assets catalog; opponent attack PROTO excluded")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: publish-raiiven-animations-20261119.py SOURCE CANONICAL")
    run(Path(sys.argv[1]), Path(sys.argv[2]))
