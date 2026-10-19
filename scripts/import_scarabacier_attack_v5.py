#!/usr/bin/env python3
"""Import EXACT user-approved Scarabacier V5 attack face/dos (two 20-frame ZIPs).

Run only from isolated global-assets review branch after both source files have
actually arrived; do not create substitute or blank sprites.
"""
from __future__ import annotations
import hashlib
import io
import json
from pathlib import Path
import zipfile
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
INCOMING=ROOT/"_incoming"
BASE=ROOT/"assets/library/capture/creatures/scarabacier/animations/attack_wings_v5"
CATALOG=ROOT/"data/assets/catalog/global-visual-assets.v1.json"
PACKS={
 "face":("Scarabacier_ATTAQUE_V5_FACE_20FRAMES_POUR_GITHUB.zip","bae11b8e055aa8eed906d863233a88653f7a9dc7022fcacfd0e6f30f2bbdaf0a"),
 "dos":("Scarabacier_ATTAQUE_V5_DOS_20FRAMES_POUR_GITHUB.zip","35db08e5b0cb7001a72891d3b02a303a1b24a9efc8972031d1d8e129e2418dee")
}
COUNT=20
CELL=384

def digest(blob:bytes)->str:
    return hashlib.sha256(blob).hexdigest()

def asset(view):
    viewName="face adversaire" if view=="face" else "dos joueur"
    return {
      "id":f"pack:capture:creature-scarabacier-attack-{view}-v5",
      "label":f"Scarabacier — attaque ailes V5 ({viewName}, 20 frames)",
      "assetType":"sprite","mediaType":"image","category":"creature",
      "tags":["capture","creature","scarabacier","steel","attack","animated",view,"wing"],
      "source":{"scope":"pack","packId":"capture","author":"GenSrpG / user-approved 2026-10-19","license":"project-internal"},
      "resource":{
        "file":f"capture/creatures/scarabacier/animations/attack_wings_v5/{view}/atlases/scarabacier_attack_wings_{view}_atlas.webp",
        "format":"sprite-strip", "mime":"image/webp", "frameCount":COUNT,"frameMs":83,"playbackMode":"once"
      },
      "compatibility":{"uses":["combat","capture","editor"]}
    }

def main():
    if any(not (INCOMING/name).is_file() for name,_ in PACKS.values()):
        print("WAITING_FOR_USER_BINARY_SOURCE: both exact ZIP files must be uploaded; no generated media and no catalog mutation.")
        return
    outputs=[]
    for view,(filename,expectsha) in PACKS.items():
        raw=(INCOMING/filename).read_bytes()
        if digest(raw)!=expectsha:
            raise ValueError(f"Source SHA256 mismatch ({filename}), refusing approximation/replacement")
        fdir=BASE/view/"frames"; adir=BASE/view/"atlases"; pdir=BASE/view/"previews"
        for p in (fdir,adir,pdir):p.mkdir(parents=True,exist_ok=True)
        frames=[]; descriptors=[]
        with zipfile.ZipFile(io.BytesIO(raw)) as z:
            names=set(z.namelist())
            for i in range(1,COUNT+1):
                name=f"frames/crea_scarabacier_attack_wings_{view}_{i:02d}.png"
                if name not in names:raise ValueError("Missing authentic frame "+name)
                original=z.read(name)
                with Image.open(io.BytesIO(original)) as im:
                    im.load()
                    if im.size!=(512,512) or im.mode!="RGBA":
                        raise ValueError(f"Wrong frame format {name}: {im.size}, {im.mode}")
                    if im.getextrema()[-1]==(255,255):
                        raise ValueError(f"No transparency: {name}")
                    frames.append(im.copy())
                destination=fdir/f"scarabacier_attack_wings_{view}_{i:02d}.png"
                destination.write_bytes(original)  # exact bytes from approved V5
                descriptors.append({"index":i-1,"file":f"frames/{destination.name}","sha256":digest(original)})
        strip=Image.new("RGBA",(CELL*COUNT,CELL),(0,0,0,0))
        for i,img in enumerate(frames):
            strip.alpha_composite(img.resize((CELL,CELL),Image.Resampling.LANCZOS),(CELL*i,0))
        atlas=adir/f"scarabacier_attack_wings_{view}_atlas.webp"
        strip.save(atlas,"WEBP",quality=88,method=6,exact=True)
        frames[0].save(pdir/f"scarabacier_attack_wings_{view}_preview.webp","WEBP",
             save_all=True,append_images=frames[1:],duration=83,loop=0,
             quality=84,method=4,exact=True)
        manifest={
          "schema":"capture-creature-animation-v1",
          "creatureId":"scarabacier","action":"attack_wings","view":view,
          "sourceZip":f"_incoming/{filename}","sourceSha256":expectsha,
          "assetId":asset(view)["id"],"frameCount":COUNT,"frameSize":[512,512],
          "frames":descriptors,
          "atlas":{"file":f"atlases/{atlas.name}","format":"sprite-strip",
                   "frameCount":COUNT,"frameWidth":CELL,"frameHeight":CELL,
                   "sha256":digest(atlas.read_bytes())},
          "status":"awaiting_runtime_and_master_pixel_review",
          "authorApprovedMovementV5":True
        }
        (BASE/view/"attack_wings.manifest.json").write_text(
          json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        outputs.append({"view":view,"assetId":asset(view)["id"],"frames":COUNT,
                        "sha256":manifest["atlas"]["sha256"]})
    j=json.loads(CATALOG.read_text(encoding="utf-8"))
    for view in ("face","dos"):
        definition=asset(view)
        ids=[i for i,a in enumerate(j["assets"]) if a["id"]==definition["id"]]
        if len(ids)>1:raise ValueError("Duplicate canonical assetId")
        if ids:j["assets"][ids[0]]=definition
        else:j["assets"].append(definition)
    # These authoritative derived counts are sentinels for all historical
    # sprite packs. Update them whenever the one catalog gains assets.
    j["counts"]["assets"] = len(j["assets"])
    j["counts"]["sprites"] = sum(a.get("assetType") == "sprite" for a in j["assets"])
    CATALOG.write_text(json.dumps(j,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(outputs,ensure_ascii=False))

if __name__=="__main__":
    main()
