#!/usr/bin/env python3
"""Import original uploaded flower defense ZIP as a single canonical Capture sprite."""
from __future__ import annotations
import hashlib
import io
import json
import stat
import zipfile
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
ZIP_PATH = ROOT / "assets/library/capture/sprites/skills/fleur_defense_12_frames_512.zip"
DEST = ROOT / "assets/library/capture/sprites/skills/fleur_defense"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
ID = "pack:capture:sprite-fleur-defense-01"
EXPECTED_ZIP_SHA256 = "653c5012f182931b4add1bef4641ab8837e749358236dba6b33d5ed0c70f9169"
EXPECTED_GIT_BLOB = "5f3bb2b288f8fdc4dc9c22bb474dfce13bb9b3c4"
NAMES = [f"frames/fleur_defense_{index:02}.png" for index in range(12)]
PREVIEW = "fleur_defense_preview_512.webp"
SHEET = "fleur_defense_planche_512.png"
ATLAS = "fleur_defense_atlas_12f.webp"

def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def git_sha(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()

def verify_zip() -> tuple[dict, dict[str, bytes], list[Image.Image]]:
    raw = ZIP_PATH.read_bytes()
    assert len(raw) == 6249269, "Uploaded ZIP size changed"
    assert sha(raw) == EXPECTED_ZIP_SHA256, "Wrong ZIP digest"
    assert git_sha(raw) == EXPECTED_GIT_BLOB, "Wrong source Git blob"
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        infos = archive.infolist()
        assert len(infos) == 15 and archive.testzip() is None, "ZIP CRC or count"
        assert sum(i.file_size for i in infos) < 30_000_000, "Unexpected ZIP inflation"
        names = [i.filename for i in infos]
        assert len(names) == len(set(names)), "Duplicated ZIP filenames"
        assert set(names) == set([*NAMES, "manifest.json", PREVIEW, SHEET]), "Unexpected ZIP contents"
        for info in infos:
            assert not info.is_dir() and not info.filename.startswith("/") and ".." not in Path(info.filename).parts
            assert not stat.S_ISLNK((info.external_attr >> 16) & 0xffff)
        source = {name:archive.read(name) for name in names}
    manifest = json.loads(source["manifest.json"])
    assert manifest["frames"] == NAMES and manifest["dimensions"] == [512,512]
    assert manifest["type"] == "animation-once-hold-last"
    assert manifest["last_frame_hold"] is True and manifest["preview"] == PREVIEW
    assert len(manifest["duration_ms"]) == 12
    frames = []
    seen = set()
    for name in NAMES:
        data = source[name]
        im = Image.open(io.BytesIO(data))
        assert im.format == "PNG" and im.mode == "RGBA" and im.size == (512,512), name
        alpha = im.getchannel("A")
        assert alpha.getextrema() == (0,255) and alpha.getbbox() is not None, name
        bbox = alpha.getbbox()
        assert bbox[0] > 0 and bbox[1] > 0 and bbox[2] < 512 and bbox[3] < 512, "Cropping detected"
        seen.add(sha(data))
        frames.append(im.copy())
    assert len(seen) == 12, "Frame repetition"
    prev = Image.open(io.BytesIO(source[PREVIEW]))
    assert prev.format == "WEBP" and prev.size == (512,512) and getattr(prev,"n_frames",1) == 12
    for i,src in enumerate(frames):
        prev.seek(i)
        # WebP can be lossy, so compare alpha bounds and source without requiring exact RGB bytes.
        assert ImageChops.difference(prev.convert("RGBA").getchannel("A"),src.getchannel("A")).getbbox() is None, "Preview transparency mismatch"
    sh = Image.open(io.BytesIO(source[SHEET]))
    assert sh.format == "PNG" and sh.mode == "RGBA" and sh.width > 3000 and sh.height > 1000
    return manifest,source,frames

def main() -> None:
    assert ZIP_PATH.is_file() and not DEST.exists(), "Source missing or destination already exists"
    manifest, source, frames = verify_zip()
    cat = json.loads(CATALOG.read_text(encoding="utf-8"))
    ids = [a["id"] for a in cat["assets"]]
    assert len(set(ids)) == len(ids) and ID not in ids, "Duplicate asset"
    assert cat["storage"]["branch"] == "global-assets"
    DEST.mkdir(parents=True,exist_ok=False)
    for name, data in source.items():
        out = DEST / name
        out.parent.mkdir(parents=True,exist_ok=True)
        out.write_bytes(data) # Preserve real author bytes
    atlas = Image.new("RGBA",(6144,512),(0,0,0,0))
    for i,frame in enumerate(frames):
        atlas.paste(frame,(i*512,0))
    atlas.save(DEST / ATLAS, "WEBP", lossless=True, method=4)
    with Image.open(DEST / ATLAS) as check:
        assert check.size == (6144,512) and check.mode == "RGBA"
        for i,src in enumerate(frames):
            assert ImageChops.difference(check.crop((512*i,0,512*(i+1),512)),src).getbbox() is None
    seq = {
        "id": ID, "label": "Fleur défensive — fermeture protectrice (12f)",
        "frameSize":[512,512], "frame_count":12, "frame_ms":155,
        "playback_mode":"once", "loop":False,
        "holdLastFrame":True, "holdFrameIndex":11,
        "holdUntil":"buff-removed", "visualOnly":True,
        "frames":NAMES, "frameDurationsMs":manifest["duration_ms"],
        "preview":PREVIEW,
        "atlas":{"file":ATLAS,"format":"sprite-strip","frameCount":12,"frameWidth":512,"frameHeight":512}
    }
    (DEST / "sprite_skill_fleur_defense_sequence_01.json").write_text(
        json.dumps(seq,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    provenance={
       "originalArchive": ZIP_PATH.name, "originalArchiveBytes":6249269,
       "originalArchiveSha256":EXPECTED_ZIP_SHA256, "originalGitBlobSha":EXPECTED_GIT_BLOB,
       "originalFileSha256":{name:sha(data) for name,data in source.items()},
       "generatedAtlasSha256":sha((DEST / ATLAS).read_bytes())
    }
    (DEST / "provenance.json").write_text(
        json.dumps(provenance,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    cat["assets"].append({
      "id": ID, "label": seq["label"], "assetType":"sprite", "mediaType":"image",
      "category":"skill",
      "tags":["capture","skill","nature","flower","defense","buff","shield","animated","hold-last-frame"],
      "source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},
      "resource":{"file":f"capture/sprites/skills/fleur_defense/{ATLAS}","format":"sprite-strip",
                  "mime":"image/webp","frameCount":12,"frameMs":155,"playbackMode":"once","holdLastFrame":True},
      "compatibility":{"uses":["combat","capture","editor"]}
    })
    cat["counts"]["assets"] = len(cat["assets"])
    cat["counts"]["sprites"] = sum(item["assetType"]=="sprite" for item in cat["assets"])
    CATALOG.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    ZIP_PATH.unlink() # Exact source persists in Git history as SHA checked above
    print("IMPORTED: 12 original PNG 512x512 + original animated preview + transparent lossless WebP atlas, one catalog ID")

if __name__ == "__main__":
    main()
