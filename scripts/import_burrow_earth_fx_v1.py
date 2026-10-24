#!/usr/bin/env python3
"""Import author-approved underground FX frames from three split archives.

This script does not generate artwork or change game/runtime state; it only
verifies the 60 source PNG files, installs identical bytes, and builds 3
transparent WebP strips + manifests. Staging stays on the isolated branch.
"""
from __future__ import annotations
import hashlib
import io
import json
import zipfile
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "assets/library/capture/sprites/skills/burrow_earth"
INPUT = ROOT / "_incoming"
DEFS = (
    ("start", "ATTAQUE_SOUTERRAINE_FX_01_DEPART_20F.zip",
     "86617c6de286429961377499e327d40e765ea241c20ac7c2f05796019c9b762f",
     "start_creusement_depart","Départ — creusement",70,"once"),
    ("travel", "ATTAQUE_SOUTERRAINE_FX_02_TRAJET_20F.zip",
     "962f45d5a8b29fb741fb3314945b7497f71f0c7a2d06f90d09b3b18f0685959a",
     "travel_sillon_trajet","Trajet — sillon souterrain",60,"loop"),
    ("impact", "ATTAQUE_SOUTERRAINE_FX_03_IMPACT_20F.zip",
     "94f53ce435de7d07b59b19546c2cde7217f36956b561b852cde0dbd36ba79ca4",
     "impact_emergence_impact","Impact — émergence",70,"once"),
)
ROOT_IN_ZIP = "ATTAQUE_SOUTERRAINE_FX_3_SPRITES_20F_512"
ID_ROOT = "pack:capture:sprite-burrow-earth"

def sha(data):
    return hashlib.sha256(data).hexdigest()

def main():
    assert not BASE.exists(), "Refuse to overwrite already-imported assets"
    for key,name,checksum,folder,label,frame_ms,playback in DEFS:
        raw = (INPUT/name).read_bytes()
        assert sha(raw)==checksum, "Wrong archive: "+name
        with zipfile.ZipFile(io.BytesIO(raw)) as archive:
            assert archive.testzip() is None, "ZIP CRC failure: "+name
            infos = archive.infolist()
            assert all(
                info.file_size < 15_000_000
                and ".." not in Path(info.filename).parts
                and not info.is_dir()
                and ((info.external_attr>>16)&0o170000) != 0o120000
                for info in infos
            ), "Unsafe ZIP file: "+name
            prefix=f"{ROOT_IN_ZIP}/{folder}/frames/"
            expected={prefix+f"sprite_burrow_{key}_{i:02}.png" for i in range(1,21)}
            assert expected.issubset({i.filename for i in infos}), "Missing frames "+name
            frames=[]
            frame_info=[]
            strip=Image.new("RGBA",(20*384,384),(0,0,0,0))
            for i in range(1,21):
                inner=prefix+f"sprite_burrow_{key}_{i:02}.png"
                data=archive.read(inner)
                im=Image.open(io.BytesIO(data));im.load()
                assert im.format=="PNG" and im.mode=="RGBA" and im.size==(512,512)
                assert im.getchannel("A").getextrema()[0]==0
                assert im.getchannel("A").getextrema()[1]>100
                assert im.getpixel((0,0))[3]==0, "Expected transparent frame corners"
                path=BASE/key/"frames"/f"sprite_burrow_{key}_{i:02}.png"
                path.parent.mkdir(parents=True,exist_ok=True)
                path.write_bytes(data) # 1:1 source preservation
                frames.append("frames/"+path.name)
                frame_info.append({"frame":i,"file":path.name,"sha256":sha(data)})
                strip.alpha_composite(im.resize((384,384),Image.Resampling.LANCZOS),((i-1)*384,0))
            atlas=BASE/key/"atlases"/f"sprite_burrow_{key}_atlas.webp"
            atlas.parent.mkdir(parents=True,exist_ok=True)
            strip.save(atlas,"WEBP",lossless=True,method=6)
            verify=Image.open(atlas);verify.load()
            assert verify.size==(7680,384) and "A" in verify.getbands()
            manifest={
                "id":f"{ID_ROOT}-{key}-01","label":label,
                "category":"skill","frameCount":20,"frameWidth":384,
                "frameHeight":384,"frameMs":frame_ms,
                "playbackMode":playback,"frames":frames,
                "atlas":"atlases/"+atlas.name,
                "sourceArchive":name,"sourceZipSHA256":checksum,
                "frameDataPreservedExactly":True,
                "framesProvenance":frame_info,
                "atlasSHA256":sha(atlas.read_bytes())
            }
            (BASE/key/"manifest.json").write_text(
                json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf-8"
            )
            print("IMPORTED",key,"20 RGBA frames",atlas.name)
    print("STAGING COMPLETE: 60 real frames + 3 lossless WebP atlases")

if __name__=="__main__":
    main()
