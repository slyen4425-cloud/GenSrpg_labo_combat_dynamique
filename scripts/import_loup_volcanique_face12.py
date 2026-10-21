#!/usr/bin/env python3
"""Import strict des 2 animations face 12 frames validées du loup volcanique.

Source unique : ZIP déposé dans _incoming ; aucune régénération de pixels.
Ce script ne touche ni au runtime du loup ni au code de combat.
"""
import hashlib
import json
import pathlib
import struct
import zipfile

ROOT=pathlib.Path(__file__).resolve().parents[1]
NAME="LOUP_VOLCANIQUE_COURSE_ATTAQUE_FACE_12_FRAMES_GITHUB.zip"
ZIP=ROOT/"_incoming"/NAME
EXPECTED_SHA256="68286ad0546f5a129637b7338e079fe54d6607aa4a5c4b0417bd083bafc40951"
TARGET="assets/library/capture/creatures/loup_volcanique/animations/"
CATALOG=ROOT/"data/assets/catalog/global-visual-assets.v1.json"
SPECS={
    "movement":{"source":"course","playbackMode":"loop","frameMs":80},
    "attack":{"source":"attaque","playbackMode":"once","frameMs":99},
}

def sha(data):
    return hashlib.sha256(data).hexdigest()

def verify_png(data):
    assert data[:8]==b"\x89PNG\r\n\x1a\n", "not png"
    assert data[12:16]==b"IHDR", "not PNG IHDR"
    width,height,depth,kind,_,_,_=struct.unpack(">IIBBBBB",data[16:29])
    assert (width,height,depth,kind)==(512,512,8,6), (width,height,depth,kind)

def run():
    assert ZIP.is_file(),f"ZIP missing: {ZIP}"
    archive_bytes=ZIP.read_bytes()
    assert sha(archive_bytes)==EXPECTED_SHA256,"SOURCE ARCHIVE SHA MISMATCH"
    with zipfile.ZipFile(ZIP) as archive:
        infos=archive.infolist()
        assert archive.testzip() is None,"ZIP CRC failure"
        names=[item.filename for item in infos]
        assert len(names)==len(set(names)), "duplicate entry"
        assert len(names)==32, f"unexpected zip contents {len(names)}"
        for name in names:
            path=pathlib.PurePosixPath(name)
            assert not name.startswith("/") and ".." not in path.parts,"archive traversal"
            assert name.startswith(TARGET) or name in ("source_audit.json","RELEASE_README.md"),name
        files={info.filename:archive.read(info) for info in infos}
        assets=[]
        for action, spec in SPECS.items():
            folder=f"{TARGET}{action}/face/"
            manifest=json.loads(files[folder+action+".manifest.json"])
            asset_id=f"pack:capture:creature-loup-volcanique-{action}-face-12-v1"
            assert manifest["assetId"]==asset_id
            assert manifest["frameCount"]==12
            assert manifest["frameSize"]==[512,512]
            assert manifest["frameMs"]==spec["frameMs"]
            assert manifest["playbackMode"]==spec["playbackMode"]
            assert manifest["view"]=="face" and manifest["action"]==action
            assert manifest["creatureId"]=="loup_volcanique"
            assert len(manifest["frames"])==12
            hashes=[]
            for number, frame in enumerate(manifest["frames"],1):
                name=f"frames/loup_volcanique_{action}_face_{number:02d}.png"
                assert frame["index"]==number-1 and frame["file"]==name
                content=files[folder+name]
                verify_png(content)
                assert sha(content)==frame["sha256"]
                hashes.append(frame["sha256"])
            assert len(set(hashes))==12,"duplicate frames"
            atlas=manifest["atlas"]
            assert atlas["format"]=="sprite-strip" and atlas["frameCount"]==12
            assert (atlas["frameWidth"],atlas["frameHeight"])==(384,384)
            atlas_content=files[folder+atlas["file"]]
            assert atlas_content[:4]==b"RIFF" and atlas_content[8:12]==b"WEBP"
            assert sha(atlas_content)==atlas["sha256"]
            assert files[folder+manifest["preview"]][:6] in (b"GIF87a",b"GIF89a")
            assets.append({
               "id":asset_id,
               "label":f"Loup volcanique — {'course' if action=='movement' else 'attaque'} face (12 frames)",
               "assetType":"sprite","mediaType":"image","category":"creature",
               "tags":["capture","creature","loup-volcanique","fire","lava",action,"animated","face"],
               "source":{"scope":"pack","packId":"capture","author":"GenSrpG / user-approved 2026-10-21","license":"project-internal"},
               "resource":{"file":f"capture/creatures/loup_volcanique/animations/{action}/face/{atlas['file']}",
                           "format":"sprite-strip","mime":"image/webp",
                           "frameCount":12,"frameMs":spec["frameMs"],
                           "playbackMode":spec["playbackMode"]},
               "compatibility":{"uses":["combat","capture","editor"]}
            })
        # No output of any kind before every source is verified.
        catalog=json.loads(CATALOG.read_text())
        old_ids={item["id"] for item in catalog["assets"]}
        for asset in assets:
            assert asset["id"] not in old_ids,f"asset ID already exists: {asset['id']}"
            physical=ROOT/"assets/library"/asset["resource"]["file"]
            assert not physical.exists(),f"target already exists: {physical}"
        for name,data in files.items():
            if not name.startswith(TARGET):
                continue
            path=ROOT/name
            assert not path.exists(),f"refuse overwrite: {path}"
            path.parent.mkdir(parents=True,exist_ok=True)
            path.write_bytes(data)
        catalog["assets"].extend(assets)
        catalog["counts"]["assets"]+=2
        catalog["counts"]["sprites"]+=2
        catalog["counts"]["creatures"]+=2
        CATALOG.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n")
        print("Imported 24 verified PNGs, 2 atlases, 2 manifests, 2 previews; 2 new assetIds.")

if __name__=="__main__":
    run()
