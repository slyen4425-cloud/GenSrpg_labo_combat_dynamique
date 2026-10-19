#!/usr/bin/env python3
"""Import SHA-verified Scarabacier 16-frame roll animation. Assets only."""
from __future__ import annotations
import hashlib, io, json, shutil, zipfile
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
INCOMING=ROOT/"_incoming/scarabacier_roll_frames_16_ready.zip"
SHA="e082f9da7d8eb5604d2e3b2e1177808ae53f9408cb644ec9e4659e0564c631e4"
BASE=ROOT/"assets/library/capture/creatures/scarabacier/animations/roll"
CATALOG=ROOT/"data/assets/catalog/global-visual-assets.v1.json"
ASSET_ID="pack:capture:creature-scarabacier-roll-01"
COUNT=16
CELL=384
FRAME_MS=85
NAMES=[f"scarabacier_roll_{i:02d}.png" for i in range(1,17)]
def digest(b): return hashlib.sha256(b).hexdigest()

def main():
    raw=INCOMING.read_bytes()
    assert digest(raw)==SHA, "Archive source SHA mismatch: abort"
    assert zipfile.is_zipfile(io.BytesIO(raw)), "Not ZIP"
    catalog=json.loads(CATALOG.read_text("utf-8"))
    assert catalog["storage"]["branch"]=="global-assets"
    assert ASSET_ID not in [a["id"] for a in catalog["assets"]], "Existing ID"
    assert not BASE.exists(), "Output directory already exists"
    (BASE/"frames").mkdir(parents=True)
    (BASE/"atlases").mkdir(parents=True)
    strip=Image.new("RGBA",(COUNT*CELL,CELL),(0,0,0,0))
    records=[]
    hashes=set()
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        assert len(z.namelist())==COUNT and set(z.namelist())==set(NAMES), "Unknown entries"
        assert z.testzip() is None, "CRC failure"
        for n,name in enumerate(NAMES):
            info=z.getinfo(name)
            assert not info.is_dir() and 3000<info.file_size<3000000, "Unexpected entry"
            payload=z.read(name)
            assert payload.startswith(b"\x89PNG\r\n\x1a\n")
            with Image.open(io.BytesIO(payload)) as img:
                img.load()
                assert img.format=="PNG" and img.mode=="RGBA" and img.size==(512,512), name
                assert img.getchannel("A").getextrema()==(0,255)
                assert img.getpixel((0,0))[3]==0
                frame=img.copy()
            (BASE/"frames"/name).write_bytes(payload)
            h=digest(payload)
            assert h not in hashes, "Duplicate frame content"
            hashes.add(h)
            records.append({"index":n,"file":"frames/"+name,"sha256":h})
            strip.alpha_composite(frame.resize((CELL,CELL),Image.Resampling.LANCZOS),(n*CELL,0))
    atlaspath=BASE/"atlases/scarabacier_roll_atlas.webp"
    strip.save(atlaspath,"WEBP",quality=87,method=5,exact=True)
    with Image.open(atlaspath) as chk:
        chk.load()
        assert chk.size==(COUNT*CELL,CELL) and "A" in chk.getbands()
        assert chk.getchannel("A").getextrema()[0]==0
    manifest={
        "schema":"capture-creature-animation-v1",
        "creatureId":"scarabacier",
        "animation":"roll",
        "assetId":ASSET_ID,
        "sourceZip":"_incoming/scarabacier_roll_frames_16_ready.zip",
        "sourceSha256":SHA,
        "sourceSheetSize":[1254,1254],
        "sourceGrid":[4,4],
        "frameCount":COUNT,
        "frameSize":[512,512],
        "native512":False,
        "frameMs":FRAME_MS,
        "playbackMode":"loop",
        "frames":records,
        "atlas":{"file":"atlases/scarabacier_roll_atlas.webp",
                 "format":"sprite-strip","frameWidth":CELL,"frameHeight":CELL,
                 "frameCount":COUNT,"sha256":digest(atlaspath.read_bytes())},
        "note":"Only asset catalog: runtime binding for the movement transformation is separate."
    }
    (BASE/"scarabacier_roll.manifest.json").write_text(
        json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    catalog["assets"].append({
        "id":ASSET_ID,
        "label":"Scarabacier — boule roulante (déplacement, 16 frames)",
        "assetType":"sprite","mediaType":"image","category":"creature",
        "tags":["capture","creature","scarabacier","steel","movement","roll","animated"],
        "source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},
        "resource":{"file":"capture/creatures/scarabacier/animations/roll/atlases/scarabacier_roll_atlas.webp",
                    "format":"sprite-strip","mime":"image/webp","frameCount":COUNT,
                    "frameMs":FRAME_MS,"playbackMode":"loop"},
        "compatibility":{"uses":["combat","capture","editor"]}
    })
    ids=[item["id"] for item in catalog["assets"]]
    assert len(ids)==len(set(ids))
    catalog["counts"]["assets"]=len(catalog["assets"])
    catalog["counts"]["sprites"]=sum(a["assetType"]=="sprite" for a in catalog["assets"])
    CATALOG.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    template=ROOT/"scripts/scarabacier_roll_asset.test.template.mjs"
    test=ROOT/"tests/unit/capture-scarabacier-roll-asset-20261019.test.mjs"
    assert template.is_file() and not test.exists()
    shutil.copyfile(template,test)
    print(json.dumps({"assetId":ASSET_ID,"frames":COUNT,"atlasSha256":manifest["atlas"]["sha256"],
                     "catalogCount":catalog["counts"]["assets"]},ensure_ascii=False))

if __name__=="__main__": main()
