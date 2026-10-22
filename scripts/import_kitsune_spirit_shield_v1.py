#!/usr/bin/env python3
"""Import the author's approved 20-frame Kitsune full-sphere VFX ZIP.

Never generate, replace or artistically edit frames: use the 20 original
RGBA 512x512 PNG assets supplied by the author, verifying ZIP/source/hash.
"""
from __future__ import annotations
import hashlib
import io
import json
import zipfile
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
INCOMING = ROOT / "_incoming/KITSUNE_BOUCLIER_SPIRITUEL_ORBE_20F.zip"
ZIP_SHA256 = "e546b3f9a9a98360f11cff8bee309bbd7089761ca371a568a3d271d08549a06c"
PREFIX = "KITSUNE_BOUCLIER_SPIRITUEL_ORBE_20F/"
SOURCE = PREFIX + "PLANCHE_bouclier_spirituel_orbe_20f.png"
SOURCE_SHA256 = "a8013d7bf2ee48c5b58586ed4a1f0f2d17118d742e0374c16fe860738893580c"
DEST = ROOT / "assets/library/capture/sprites/skills/kitsune_spirit_shield"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
ASSET_ID = "pack:capture:sprite-kitsune-lunaire-spirit-shield-01"
STEM = "sprite_skill_kitsune_spirit_shield"
FRAME_MS = 80

def sha256(data):
    return hashlib.sha256(data).hexdigest()

def validated_zip():
    assert INCOMING.is_file(), f"Approved ZIP is missing: {INCOMING}"
    raw = INCOMING.read_bytes()
    assert len(raw) == 17770373 and sha256(raw) == ZIP_SHA256, "Wrong/corrupt source ZIP"
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        records = archive.infolist()
        assert len(records) == 24 and archive.testzip() is None, "Unexpected ZIP members/CRC"
        assert len({rec.filename for rec in records}) == 24
        assert all(not rec.is_dir() and rec.filename.startswith(PREFIX)
                   and ".." not in Path(rec.filename).parts
                   and ((rec.external_attr >> 16) & 0o170000) != 0o120000
                   for rec in records), "Unsafe ZIP entries"
        assert sum(rec.file_size for rec in records) < 35_000_000
        expected = {
            SOURCE,
            PREFIX + "PREVIEW_bouclier_spirituel_orbe_20f.gif",
            PREFIX + "PREVIEW_bouclier_spirituel_orbe_20f.png",
            PREFIX + "README.txt",
        }
        expected.update(PREFIX + "frames/" + STEM + f"_{i:02}.png" for i in range(1,21))
        assert {rec.filename for rec in records} == expected, "Unexpected ZIP file set"
        payloads = {rec.filename: archive.read(rec.filename) for rec in records}
    return payloads

def main():
    assert not DEST.exists(), "Target exists: refusing overwrite"
    files = validated_zip()
    source = Image.open(io.BytesIO(files[SOURCE]))
    source.load()
    assert source.format == "PNG" and source.mode == "RGBA" and source.size == (1402,1122)
    assert source.getchannel("A").getextrema()[0] == 0
    assert sha256(files[SOURCE]) == SOURCE_SHA256
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    assert catalog["storage"]["branch"] == "global-assets"
    assert ASSET_ID not in {a["id"] for a in catalog["assets"]}, "Existing duplicate ID"

    frame_relpaths, provenance = [], []
    atlas = Image.new("RGBA", (20*384,384), (0,0,0,0))
    for i in range(1,21):
        original = PREFIX + "frames/" + STEM + f"_{i:02}.png"
        data = files[original]
        frame = Image.open(io.BytesIO(data))
        frame.load()
        assert frame.format == "PNG" and frame.mode == "RGBA" and frame.size == (512,512), original
        alpha = frame.getchannel("A")
        assert alpha.getextrema()[0] == 0 and alpha.getextrema()[1] > 100
        assert len(data) > 10000, "Invalid tiny/source-less frame"
        assert frame.getpixel((0,0))[3] == 0, "Frame canvas is not transparent"
        rel = "frames/" + STEM + f"_{i:02}.png"
        fp = DEST/rel
        fp.parent.mkdir(parents=True,exist_ok=True)
        fp.write_bytes(data)  # EXACT approved RGBA bytes; no recut and no image generation.
        frame_relpaths.append(rel)
        provenance.append({"index":i,"file":rel,"sha256":sha256(data)})
        atlas.alpha_composite(frame.resize((384,384), Image.Resampling.LANCZOS), (384*(i-1),0))
    assert len({x["sha256"] for x in provenance}) == 20
    atlas_rel = "atlases/" + STEM + "_atlas_01.webp"
    atlas_fp = DEST/atlas_rel
    atlas_fp.parent.mkdir(parents=True,exist_ok=True)
    atlas.save(atlas_fp,"WEBP",lossless=True,method=6)
    webp = Image.open(atlas_fp);webp.load()
    assert webp.size == (7680,384) and "A" in webp.getbands(), "Atlas must retain real alpha"

    manifest = {
        "id": ASSET_ID,
        "type": "capture_skill_sprite_sequence",
        "label": "Kitsune lunaire — Bouclier spirituel (sphère complète)",
        "element": "spirit", "frame_size": [512,512], "frame_count":20,
        "frame_ms":FRAME_MS, "loop":False, "playback_mode":"once",
        "hold_last_frame":True,"hold_frame_index":19,
        "frames":frame_relpaths,
        "atlas":{"file":atlas_rel,"format":"sprite-strip","frameCount":20,
                 "frameWidth":384,"frameHeight":384},
        "source":{"file":INCOMING.name,"sha256":ZIP_SHA256,
                  "original_sheet_file":"PLANCHE_bouclier_spirituel_orbe_20f.png",
                  "original_sheet_sha256":SOURCE_SHA256,"pixel_size":[1402,1122],"grid":[5,4],
                  "frame_pngs_preserved_byte_for_byte":True,
                  "note":"20 original author-approved 512px PNGs, no re-generation or re-slicing. Source sheet originally 1402x1122, 5x4."}
    }
    (DEST/(STEM+"_sequence.json")).write_text(
       json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (DEST/"provenance.json").write_text(json.dumps({
       "source_zip_sha256":ZIP_SHA256,"original_sheet_sha256":SOURCE_SHA256,
       "frames":provenance,"atlas_sha256":sha256(atlas_fp.read_bytes()),
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (DEST/"README.md").write_text(
       "# Kitsune lunaire — Bouclier spirituel\n\n"
       "20 PNG RGBA authentiques 512×512 conservés octet pour octet depuis le ZIP approuvé. "
       "Atlas WebP lossless 7680×384. Animation de formation 20 frames / 80 ms et dernière frame persistante en données, "
       "à valider en jeu. Source planche 1402×1122 ; les détails ne sont pas nativement peints en 512 px. "
       "Aucune capacité auteur ni moteur modifié.\n",encoding="utf-8")
    catalog["assets"].append({
       "id":ASSET_ID,"label":manifest["label"],"assetType":"sprite","mediaType":"image",
       "category":"skill",
       "tags":["capture","skill","spirit","shield","barrier","lunar","kitsune","sakura","pink","purple","animated","hold-last-frame"],
       "source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},
       "resource":{"file":"capture/sprites/skills/kitsune_spirit_shield/"+atlas_rel,
                   "format":"sprite-strip","mime":"image/webp","frameCount":20,
                   "frameMs":FRAME_MS,"playbackMode":"once"},
       "compatibility":{"uses":["combat","capture","editor"]}
    })
    catalog["counts"]["assets"]=len(catalog["assets"])
    catalog["counts"]["sprites"]=sum(a["assetType"]=="sprite" for a in catalog["assets"])
    assert len({a["id"] for a in catalog["assets"]}) == len(catalog["assets"])
    CATALOG.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    INCOMING.unlink()
    print(f"IMPORTED: 20 original physical RGBA PNG + 1 alpha WebP atlas; ID {ASSET_ID}")
if __name__=="__main__":
    main()
