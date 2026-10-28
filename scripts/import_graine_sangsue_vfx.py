#!/usr/bin/env python3
"""Import approved Graine sansue author assets into the sole global-assets Capture catalog."""
from __future__ import annotations

import hashlib
import io
import json
import stat
import zipfile
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
ZIP_NAME = "GRAINE_SANSUE_PROJECTILE_DEBUFF_2x12_WEBP.zip"
ZIP_SHA = "0f32fb77e24f8ad44c166fa78155f159bc2d85bc80f2464310cd65668ed74840"
GIT_BLOB_SHA = "14b5778ca3efbe84d6edd03eeddb78aacb2a93d6"
INCOMING = ROOT / "_incoming" / ZIP_NAME
DEST = ROOT / "assets/library/capture/sprites/skills/graine_sangsue"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
ROLES = {
    "projectile": ("travel", 72, "loop"),
    "debuff": ("skill", 115, "once"),
}

def hash256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def git_hash(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()

def webp(data: bytes, size: tuple[int, int], frames: int = 1) -> Image.Image:
    image = Image.open(io.BytesIO(data))
    assert image.format == "WEBP" and image.size == size, (image.format, image.size)
    assert getattr(image, "n_frames", 1) == frames, (image.n_frames, frames)
    for number in range(frames):
        if frames != 1:
            image.seek(number)
        assert image.mode == "RGBA", (image.mode, "missing RGBA")
        mini, maxi = image.getchannel("A").getextrema()
        assert mini == 0 and maxi > 0, ("Missing real alpha and visible subject", number)
    return image

def get_source() -> tuple[dict, dict[str, bytes], dict]:
    assert INCOMING.is_file(), "Author source ZIP not present in _incoming"
    raw = INCOMING.read_bytes()
    assert len(raw) == 9566663, "Author ZIP size changed"
    assert hash256(raw) == ZIP_SHA and git_hash(raw) == GIT_BLOB_SHA, "Wrong author ZIP bytes"
    files: dict[str, bytes] = {}
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        infos = z.infolist()
        assert len(infos) == 35 and z.testzip() is None, "Invalid ZIP entry count/CRC"
        assert sum(x.file_size for x in infos) < 65_000_000, "ZIP expands too much"
        for info in infos:
            name = info.filename
            parts = Path(name).parts
            assert not info.is_dir() and name and not name.startswith("/") and ".." not in parts, "Unsafe ZIP path"
            assert not stat.S_ISLNK((info.external_attr >> 16) & 0xffff), "Symlink forbidden"
            assert len(parts) <= 3 and name not in files, "Duplicate/unexpected path"
            files[name] = z.read(info)
    source = json.loads(files["manifest.json"])
    assert source["packId"] == "pack:capture:graine-sangsue-v1"
    assert source["format"] == "webp" and source["background"] == "transparent" and source["element"] == "nature"
    assert set(source["sprites"]) == set(ROLES)
    expected = {"README.txt", "manifest.json",
                "planche_graine_sangsue_projectile_12f.png", "planche_graine_sangsue_debuff_12f.png",
                "source/sprite_anime_de_graine_magique_verte.png",
                "source/a_clean_graphic_sprite_sheet_style_illustration_on.png",
                "debuff/graine_sangsue_debuff_hold.webp"}
    for role, (_, ms, mode) in ROLES.items():
        item = source["sprites"][role]
        assert item["assetId"] == f"pack:capture:sprite-graine-sangsue-{role}-01"
        assert item["frames"] == 12 and item["frameSize"] == [512, 512] and item["frameMs"] == ms
        assert item["playback"] == ("once-hold-last" if role == "debuff" else mode)
        frame_files = [f"{role}/graine_sangsue_{role}_{index:02}.webp" for index in range(1, 13)]
        assert item["frameFiles"] == frame_files
        expected.update(frame_files)
        distinct = set()
        frame_alpha = []
        for file in frame_files:
            im = webp(files[file], (512, 512))
            frame_alpha.append(im.getchannel("A"))
            distinct.add(hash256(files[file]))
        assert len(distinct) == 12, "Duplicate author animation frames"
        atlas_file = f"{role}/graine_sangsue_{role}_atlas_12f.webp"
        assert item["atlas"] == atlas_file
        expected.add(atlas_file)
        atlas = webp(files[atlas_file], (6144, 512))
        # Verify that every strip frame has the same real alpha mask as the approved standalone frame.
        for index, alpha in enumerate(frame_alpha):
            atlas_alpha = atlas.crop((index * 512, 0, (index + 1) * 512, 512)).getchannel("A")
            assert ImageChops.difference(alpha, atlas_alpha).getbbox() is None, ("Frame not matching author strip", role, index)
        preview_file = f"preview_graine_sangsue_{role}_12f.webp"
        assert item["preview"] == preview_file
        expected.add(preview_file)
        webp(files[preview_file], (512, 512), 12)
    assert set(files) == expected, "Unexpected archive file paths"
    held = source["debuffDisplay"]
    assert held["freezeOnFrame"] == 12 and held["holdFrame"] == "debuff/graine_sangsue_debuff_hold.webp"
    assert held["holdUntil"] == "debuff removed by gameplay" and held["followTarget"] is True
    webp(files[held["holdFrame"]], (512, 512))
    assert files[held["holdFrame"]] == files["debuff/graine_sangsue_debuff_12.webp"], "Hold must use exact final frame"
    provenance = {
        "originalArchive": ZIP_NAME, "originalArchiveSha256": ZIP_SHA,
        "originalGitBlobSha": GIT_BLOB_SHA, "originalArchiveBytes": len(raw),
        "originalFileSha256": {name: hash256(data) for name, data in files.items()},
    }
    return source, files, provenance

def main() -> None:
    assert not DEST.exists(), "Refuse to overwrite already imported Graine sansue media"
    source, files, provenance = get_source()
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    assert catalog["storage"]["branch"] == "global-assets" and catalog["storage"]["libraryRoot"] == "assets/library/"
    ids = {a["id"] for a in catalog["assets"]}
    assert len(ids) == len(catalog["assets"]), "Existing catalog duplicates"
    sequences = {"id": source["packId"], "frameSize": [512, 512], "sequences": {}}
    for role, (category, ms, playback) in ROLES.items():
        asset_id = source["sprites"][role]["assetId"]
        assert asset_id not in ids, ("Asset collision", asset_id)
        ids.add(asset_id)
        atlas = source["sprites"][role]["atlas"]
        sequence = {
            "id": asset_id, "frame_count": 12, "frame_ms": ms, "playback_mode": playback,
            "loop": playback == "loop", "frames": source["sprites"][role]["frameFiles"],
            "atlas": {"file": atlas, "format": "sprite-strip", "frameCount": 12,
                      "frameWidth": 512, "frameHeight": 512},
        }
        if role == "debuff":
            # Explicit desired behavior in data. Runtime still owns FX/status lifetime; do not fake an in-game attachment.
            sequence.update({"holdLastFrame": True, "holdFrameIndex": 11,
                             "holdFrame": source["debuffDisplay"]["holdFrame"],
                             "holdUntil": "status-removed", "followTarget": True})
        sequences["sequences"][role] = sequence
        resource = {
            "file": "capture/sprites/skills/graine_sangsue/" + atlas,
            "format": "sprite-strip", "mime": "image/webp",
            "frameCount": 12, "frameMs": ms, "playbackMode": playback,
        }
        if role == "debuff":
            resource["holdLastFrame"] = True
        catalog["assets"].append({
            "id": asset_id, "label": "Graine sansue — " + ("Projectile" if role == "projectile" else "Débuff : bourgeons fleuris") + " (12f)",
            "assetType": "sprite", "mediaType": "image", "category": category,
            "tags": ["capture", "skill", "nature", "seed", "sangsue", "graine", role, "animated"]
                    + (["debuff", "status", "flower", "bud", "hold-last"] if role == "debuff" else []),
            "source": {"scope": "pack", "packId": "capture", "author": "GenSrpG", "license": "project-internal"},
            "resource": resource,
            "compatibility": {"uses": ["combat", "capture", "editor"]},
        })
    assert len(ids) == len(catalog["assets"])
    for relative, original in files.items():
        output = DEST / relative
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(original)  # Original approved author bytes, no recomposition.
    (DEST / "sprite_skill_graine_sangsue_sequences_01.json").write_text(
        json.dumps(sequences, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (DEST / "provenance.json").write_text(
        json.dumps(provenance, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (DEST / "README.md").write_text(
        "# Graine sansue — original approved projectile + bud debuff\n\n"
        "This Capture media pack retains all 35 original author ZIP members byte-for-byte, "
        "24 real transparent 512×512 WebP animation frames, two original WebP strips at 6144×512, "
        "two original animated previews, plus the final debuff hold sprite. "
        "Only the canonical global-assets catalog owns both asset IDs. "
        "The debuff's desired follow-target and hold-until-status-removed behavior is documented "
        "in the manifest; actual visual persistence remains owned by the combat FX/status runtime. "
        "No skill profile or gameplay is automatically changed.\n", encoding="utf-8")
    catalog["counts"]["assets"] = len(catalog["assets"])
    catalog["counts"]["sprites"] = sum(a["assetType"] == "sprite" for a in catalog["assets"])
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    INCOMING.unlink()  # ZIP retained in Git parent commit; avoid redundant 9.6 MB in published branch.
    print("SUCCESS: original Graine sansue 2x12 WebP, 2 original atlas strips, both previews, hold sprite and unique catalog IDs")

if __name__ == "__main__":
    main()
