#!/usr/bin/env python3
"""Import ONLY the two user-approved pourpre rear-view animations into global assets."""
from __future__ import annotations
from pathlib import Path
import hashlib, io, json, re, zipfile
from PIL import Image

BASE = Path("assets/library/capture/creatures/creature_pourpre/animations")
CATALOG_PATH = Path("data/assets/catalog/global-visual-assets.v1.json")
PACKS = [
    dict(action="movement", zip="_incoming/pourpre_course_dos_8f_corrigee.zip",
         sha="1f393e086aa4de24f5f1762df482d4cb466805bfa2c2e01da5c3860e2bef9155",
         gitsha="804f472ea91c8487409d96df8ac141ba6f7b7edc", duration=83,
         label="Créature pourpre — Course dos (8 frames)", playback="loop"),
    dict(action="attack", zip="_incoming/pourpre_attaque_dos_8f.zip",
         sha="ed64a6e27a3642fe96023e8081f7e742bdaf609f59fa66a5f9f5f1e8ca99ac66",
         gitsha="f1e2fa943e05537d604e17d31166f0afecc083a7", duration=120,
         label="Créature pourpre — Attaque dos (8 frames)", playback="once"),
]

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def git_digest(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()

def inspect_safe_frame(img: Image.Image, n: int, action: str) -> None:
    assert img.size == (512, 512), (action, n, img.size)
    assert img.mode == "RGBA", (action, n, img.mode)
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    assert bbox, (action, n, "fully transparent")
    left, top, right, bottom = bbox
    margins = (left, top, 512 - right, 512 - bottom)
    assert min(margins) >= 42, (action, n, margins)
    assert alpha.getextrema()[0] == 0 and alpha.getextrema()[1] > 0, (action, n, "alpha invalid")


def visibly_identical(a: Image.Image, b: Image.Image) -> bool:
    # Some lossless WebP decoders normalize RGB underneath alpha=0.
    # Exact alpha and exact visible composited pixels are the relevant invariants.
    if a.size != b.size or a.getchannel("A").tobytes() != b.getchannel("A").tobytes():
        return False
    black = Image.new("RGBA", a.size, (0,0,0,255))
    return Image.alpha_composite(black, a).tobytes() == Image.alpha_composite(black, b).tobytes()

def export(pack):
    raw = Path(pack["zip"]).read_bytes()
    assert digest(raw) == pack["sha"], ("wrong source zip", pack["zip"])
    assert git_digest(raw) == pack["gitsha"], ("Git blob changed", pack["zip"])
    action = pack["action"]
    dest = BASE / action / "player"
    frame_dir = dest / "frames"
    atlas_dir = dest / "atlases"
    preview_dir = dest / "previews"
    for folder in (frame_dir, atlas_dir, preview_dir):
        folder.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        assert z.testzip() is None, ("CRC", pack["zip"])
        files = {}
        for name in z.namelist():
            match = re.search(r"(?:^|/)frame_(\d\d)\.png$", name, re.I)
            if match:
                num = int(match.group(1))
                assert 1 <= num <= 8 and num not in files, ("duplicate/extra frame", name)
                files[num] = name
        assert sorted(files) == list(range(1, 9)), (action, sorted(files))
        approved_manifest = None
        if action == "movement":
            matches = [n for n in z.namelist() if n.endswith("/manifest.json")]
            assert len(matches) == 1
            approved_manifest = json.loads(z.read(matches[0]))
            assert approved_manifest["frame_count"] == 8
        frames = []
        sha_list = []
        for num in range(1, 9):
            source_bytes = z.read(files[num])
            if approved_manifest:
                assert digest(source_bytes) == approved_manifest["frames"][num-1]["sha256_png"], (action, num, "approved frame SHA mismatch")
            with Image.open(io.BytesIO(source_bytes)) as source_img:
                img = source_img.convert("RGBA")
            if action == "attack":
                assert img.size == (443,443), ("unexpected attack source size", num, img.size)
                # Pad the approved 443x443 drawing; no scaling, repainting or interpolation.
                canvas = Image.new("RGBA", (512,512), (0,0,0,0))
                canvas.alpha_composite(img, (34,34))
                img = canvas
            inspect_safe_frame(img, num, action)
            frames.append(img)
            path = frame_dir / f"creature_pourpre_{action}_player_{num:02d}.png"
            img.save(path, format="PNG", optimize=True)
            sha_list.append(digest(path.read_bytes()))
    atlas = Image.new("RGBA", (512*8, 512), (0,0,0,0))
    for idx, img in enumerate(frames):
        atlas.paste(img, (512*idx,0))
        assert atlas.crop((512*idx,0,512*(idx+1),512)).tobytes() == img.tobytes()
    atlas_name = f"creature_pourpre_{action}_player_8_atlas.webp"
    atlas_path = atlas_dir / atlas_name
    atlas.save(atlas_path, format="WEBP", lossless=True, method=6)
    with Image.open(atlas_path) as decoded:
        got = decoded.convert("RGBA")
        assert got.size == (4096,512)
        assert visibly_identical(got, atlas), ("atlas visible pixels or alpha differ", action)
    preview_name = f"creature_pourpre_{action}_player_8_preview.webp"
    frames[0].save(preview_dir / preview_name, format="WEBP", save_all=True,
                   append_images=frames[1:], duration=pack["duration"],
                   loop=0 if action == "movement" else 1, lossless=True, method=6)
    with Image.open(preview_dir / preview_name) as p:
        assert p.n_frames == 8, (action, p.n_frames)
        for idx, img in enumerate(frames):
            p.seek(idx)
            assert visibly_identical(p.convert("RGBA"), img), ("preview visible pixels or alpha differ", action, idx)
    manifest = {
        "creature": "creature_pourpre",
        "view": "player",
        "orientation": "rear-three-quarter-facing-upper-right",
        "action": action,
        "frameCount": 8,
        "frameWidth": 512,
        "frameHeight": 512,
        "frameMs": pack["duration"],
        "playbackMode": pack["playback"],
        "sourceZip": pack["zip"],
        "sourceSha256": pack["sha"],
        "sourceGitBlobSha": pack["gitsha"],
        "sourceSize": [512,512] if action == "movement" else [443,443],
        "paddingTo512": [0,0] if action == "movement" else [34,34],
        "frameSha256Png": sha_list,
        "atlasFile": f"atlases/{atlas_name}",
        "previewFile": f"previews/{preview_name}",
    }
    (dest / f"{action}.manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n")
    (dest / f"{action}.provenance.json").write_text(json.dumps({
        "originalSourceZip":pack["zip"], "zipSha256":pack["sha"],
        "zipGitBlobSha":pack["gitsha"], "approvedByUser":True,
        "noRepaint":True, "notes":"Exact user-corrected running frames; attack source padded without image resampling."
    }, ensure_ascii=False, indent=2)+"\n")
    return {
        "id":f"pack:capture:creature-pourpre-{action}-player-8-v1",
        "label":pack["label"],"assetType":"sprite", "mediaType":"image", "category":"creature",
        "tags":["capture","creature","pourpre","animated","player",action],
        "source":{"scope":"pack","packId":"capture","author":"GenSRPG / validated November 2026","license":"project-internal"},
        "resource":{"file":f"capture/creatures/creature_pourpre/animations/{action}/player/atlases/{atlas_name}",
            "format":"sprite-strip","mime":"image/webp","frameCount":8,"frameWidth":512,
            "frameHeight":512,"frameMs":pack["duration"],"playbackMode":pack["playback"]},
        "compatibility":{"uses":["combat","capture","editor"]}
    }

def main():
    catalog = json.loads(CATALOG_PATH.read_text())
    prior_assets = list(catalog["assets"])
    previous_ids = {a["id"] for a in prior_assets}
    assert len(previous_ids) == len(prior_assets)
    assert "pack:capture:creature-pourpre-player-01" in previous_ids
    assert "pack:capture:creature-violette-movement-player-8-v1" in previous_ids
    new_entries = [export(pack) for pack in PACKS]
    assert all(a["id"] not in previous_ids for a in new_entries), "Duplicate IDs"
    catalog["assets"].extend(new_entries)
    catalog["counts"]["assets"] = len(catalog["assets"])
    catalog["counts"]["sprites"] = sum(a["assetType"]=="sprite" for a in catalog["assets"])
    assert catalog["assets"][:len(prior_assets)] == prior_assets, "Previously published assets modified"
    assert len({a["id"] for a in catalog["assets"]}) == len(catalog["assets"])
    CATALOG_PATH.write_text(json.dumps(catalog, ensure_ascii=False, indent=2)+"\n")
    print("IMPORTED only creature_pourpre rear-view animations:", [a["id"] for a in new_entries])

if __name__ == "__main__":
    main()
