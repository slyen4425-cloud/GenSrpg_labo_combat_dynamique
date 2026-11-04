#!/usr/bin/env python3
"""Import the artist-approved Plante carnivore back-view thorn-only overlay.

Single-authority catalog import. Preserve the existing FACE armor and all
creature models; the creature composite is review-only, never the runtime atlas.
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
NAME = "armure_ronces_plante_carnivore_dos_6f.zip"
SRC = ROOT / "_incoming" / NAME
SIZE = 4597874
SHA256 = "d3cdba93cc9102b760a7fd0e0dc49e0b0f0ad9d6d524a10f6940388f7688a276"
GIT_SHA = "0587d83efb6a1a1f18f822e406065afec552a2d5"
PREFIX = "armure_ronces_plante_carnivore_dos_6f/"
DEST = ROOT / "assets/library/capture/sprites/skills/armure_ronces_plante_carnivore/back"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
ID = "pack:capture:sprite-armure-ronces-plante-carnivore-back-01"
FACE_ID = "pack:capture:sprite-armure-ronces-plante-carnivore-01"
ATLAS = "armure_ronces_dos_atlas_6f.webp"
CONTROL = "armure_ronces_dos_planche_controle_3x2.png"
PREVIEW = "armure_ronces_dos_preview_masque.webp"
COMPOSITE = "armure_ronces_dos_preview_sur_creature.webp"
FINAL_REVIEW = "armure_ronces_dos_pose_finale_sur_creature.png"
MASK_FINAL = "armure_ronces_pose_finale_masque.png"
SOURCE_ATLAS = "armure_ronces_dos_atlas_6f.png"
MANIFEST = "manifest.json"
FRAMES = [f"frames/armure_ronces_dos_{i:02}.png" for i in range(1,7)]

def digest(blob: bytes) -> str:
    return hashlib.sha256(blob).hexdigest()

def git_digest(blob: bytes) -> str:
    return hashlib.sha1(b"blob "+str(len(blob)).encode()+b"\0"+blob).hexdigest()

def image(blob: bytes, fmt: str, size: tuple[int,int], mode: str = "RGBA") -> Image.Image:
    im = Image.open(io.BytesIO(blob))
    assert im.format == fmt and im.size == size and im.mode == mode, (
        "image format/size/mode mismatch", im.format, im.size, im.mode)
    im.load()
    return im

def animated_webp(blob: bytes) -> None:
    with Image.open(io.BytesIO(blob)) as im:
        assert im.format == "WEBP" and im.size == (512,512)
        assert getattr(im, "n_frames", 1) == 6
        for n in range(6):
            im.seek(n)
            assert im.convert("RGBA").getchannel("A").getextrema()[0] == 0

def main() -> None:
    raw = SRC.read_bytes()
    assert len(raw) == SIZE and digest(raw) == SHA256 and git_digest(raw) == GIT_SHA, "Wrong approved ZIP"
    expected = set(FRAMES) | {
        ATLAS, CONTROL, PREVIEW, COMPOSITE, FINAL_REVIEW, MASK_FINAL, SOURCE_ATLAS, MANIFEST}
    files: dict[str,bytes] = {}
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        infos = archive.infolist()
        assert len(infos) == len(expected) == 14 and archive.testzip() is None, "ZIP content or CRC mismatch"
        assert sum(i.file_size for i in infos) < 60_000_000
        for entry in infos:
            name = entry.filename
            assert name.startswith(PREFIX) and name != PREFIX, ("Unexpected ZIP root", name)
            rel = name[len(PREFIX):]
            assert rel in expected and rel not in files, ("Unexpected/repeated filename",rel)
            assert ".." not in PurePosixPath(name).parts and not name.startswith("/")
            assert not stat.S_ISLNK((entry.external_attr >> 16) & 0xffff)
            files[rel] = archive.read(entry)
        assert set(files) == expected

    source = json.loads(files[MANIFEST])
    assert source["schema"] == "gensrpg-capture-overlay-sprite-v1"
    assert source["creature"] == "plante_carnivore" and source["view"] == "player_back"
    assert source["type"] == "defense_thorn_armor_overlay"
    assert source["frameCount"] == 6 and source["frameSize"] == [512,512]
    assert source["playback"] == "once" and source["holdLastFrame"] is True
    assert source["holdFrameIndex"] == 5 and source["holdUntil"] == "buff_removed"
    assert source["noAutoBinding"] is True
    assert source["atlas"] == {
        "file": ATLAS, "format": "sprite-strip", "frameWidth": 512,
        "frameHeight": 512, "frameCount": 6, "sha256": digest(files[ATLAS])}
    assert source["maskPreview"] == PREVIEW and source["compositedReviewOnly"] == COMPOSITE
    durations = source["frameDurationsMs"]
    assert len(durations) == 6 and all(isinstance(ms,int) and 60 <= ms <= 240 for ms in durations)

    raw_strip = image(files[SOURCE_ATLAS], "PNG", (3072,512))
    webp_strip = image(files[ATLAS], "WEBP", (3072,512))
    control = image(files[CONTROL], "PNG", (2096,1424))
    final_mask = image(files[MASK_FINAL], "PNG", (512,512))
    image(files[FINAL_REVIEW], "PNG", (512,512))
    animated_webp(files[PREVIEW])
    animated_webp(files[COMPOSITE])

    fields = []
    new_files: dict[Path,bytes] = {}
    seen = set()
    for i, name in enumerate(FRAMES):
        blob = files[name]
        im = image(blob,"PNG",(512,512))
        assert digest(blob) == source["frames"][i]["sha256"]
        assert source["frames"][i]["file"] == name
        alpha = im.getchannel("A")
        assert alpha.getextrema()[0] == 0 and alpha.getextrema()[1] == 255
        bounds = alpha.point(lambda a: 255 if a >= 16 else 0).getbbox()
        assert bounds
        margins = [bounds[0], bounds[1], 512-bounds[2], 512-bounds[3]]
        assert min(margins) >= 30, ("frame clipped",i+1,margins)
        # Exact media equivalence (no resampling or approximated extra frame).
        slice_box = (i*512,0,(i+1)*512,512)
        assert ImageChops.difference(raw_strip.crop(slice_box), im).getbbox() is None
        assert ImageChops.difference(webp_strip.crop(slice_box), im).getbbox() is None
        seen.add(digest(blob))
        new_files[DEST / name] = blob
        fields.append({"index":i,"file":name,"sha256":digest(blob),
                       "marginsLTRB":margins})
    assert len(seen)==6, "Non-distinct animation poses"
    assert ImageChops.difference(final_mask,image(files[FRAMES[5]],"PNG",(512,512))).getbbox() is None, "Final frame mismatch"
    assert control.getchannel("A").getextrema()[0] == 0

    atlas_name = "atlases/armure_ronces_dos_6f.webp"
    new_files[DEST / atlas_name] = files[ATLAS] # exact approved lossless source
    new_files[DEST / "previews/masque_6f.webp"] = files[PREVIEW]
    new_files[DEST / "previews/controle_3x2.png"] = files[CONTROL]
    # Separate review artifacts, not referenced by the runtime asset ID.
    new_files[DEST / "sources/revue_sur_creature.webp"] = files[COMPOSITE]
    new_files[DEST / "sources/revue_pose_finale_sur_creature.png"] = files[FINAL_REVIEW]
    new_files[DEST / "sources/atlas_source_6f.png"] = files[SOURCE_ATLAS]
    new_files[DEST / "sources/pose_finale_masque.png"] = files[MASK_FINAL]
    new_files[DEST / "sources/original_manifest.json"] = files[MANIFEST]
    sequence = {
        "schema":"capture-skill-overlay-v1",
        "assetId":ID,"creatureReference":"plante_carnivore",
        "referenceView":"player_back","role":"defense_thorn_armor_overlay",
        "runtimeMaskOnly":True,"frameCount":6,"frameSize":[512,512],
        "frameDurationsMs":durations,"frameMs":138,
        "playbackMode":"once","holdLastFrame":True,"holdFrameIndex":5,
        "holdUntil":"buff_removed","noAutoBinding":True,
        "sourceArchive":NAME,"sourceArchiveSha256":SHA256,"sourceGitBlobSha":GIT_SHA,
        "frames":fields,"atlas":{"file":atlas_name,"format":"sprite-strip",
                                 "width":3072,"height":512,"frameCount":6,
                                 "frameWidth":512,"frameHeight":512,
                                 "sha256":digest(files[ATLAS]),"lossless":True},
        "preview":{"mask":"previews/masque_6f.webp","control":"previews/controle_3x2.png"}
    }
    new_files[DEST / "sequence.manifest.json"] = (json.dumps(sequence,ensure_ascii=False,indent=2)+"\n").encode()
    cat=json.loads(CATALOG.read_text(encoding="utf8"))
    assert cat["storage"]["branch"] == "global-assets"
    assert cat["counts"]["assets"] == len(cat["assets"])
    assert cat["counts"]["sprites"] == sum(x["assetType"]=="sprite" for x in cat["assets"])
    ids=[x["id"] for x in cat["assets"]]
    assert len(ids)==len(set(ids)) and FACE_ID in ids and ID not in ids
    assert not DEST.exists(), "Cannot overwrite existing back-view sprite"
    assert all(not path.exists() for path in new_files), "Cannot replace existing media"
    atlas_resource = str((DEST / atlas_name).relative_to(ROOT / "assets/library"))
    cat["assets"].append({
        "id":ID,
        "label":"Armure de ronces — pointes seules, vue joueur dos (6f)",
        "assetType":"sprite","mediaType":"image","category":"skill",
        "tags":["capture","skill","nature","thorn","ronces","plante-carnivore",
                "defense","buff","status","overlay","player","back","dos","animated","hold-last-frame"],
        "source":{"scope":"pack","packId":"capture",
                  "author":"GenSrpG / artwork artist-approved",
                  "license":"project-internal"},
        "resource":{"file":atlas_resource,"format":"sprite-strip","mime":"image/webp",
                    "frameCount":6,"frameMs":138,"playbackMode":"once",
                    "holdLastFrame":True,"persistentFrameIndex":5},
        "compatibility":{"uses":["combat","capture","editor"]}
    })
    cat["counts"]["assets"]+=1
    cat["counts"]["sprites"]+=1
    assert cat["counts"]["assets"]==len(cat["assets"])
    for path,data in new_files.items():
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_bytes(data)
    CATALOG.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("PASS: approved back-view thorn overlay: source SHA/CRC, 6 RGBA poses, lossless atlas, exact previews, unique catalog ID, FACE unchanged")

if __name__ == "__main__":
    main()
