#!/usr/bin/env python3
import zipfile, pathlib, re, json, hashlib, shutil, io
from PIL import Image
ROOT=pathlib.Path("assets/library/capture/creatures/creature_lunaire/animations/attack")
ARCHIVE=pathlib.Path("monster_capture_2_attaques_validees.zip")
with zipfile.ZipFile(ARCHIVE) as z:
    files=[n for n in z.namelist() if not n.endswith("/") and not n.startswith("__MACOSX/")]
    print("ARCHIVE CONTENTS:", *files, sep="\n")
    pngs=[n for n in files if n.lower().endswith(".png")]
    assert len(pngs)==16, f"Expected exactly 16 PNG frames, found {len(pngs)}"
    groups={}
    for name in pngs:
        key=str(pathlib.PurePosixPath(name).parent)
        groups.setdefault(key,[]).append(name)
    print("FRAME GROUPS:", json.dumps({k:len(v) for k,v in groups.items()}))
    assert len(groups)==2 and all(len(v)==8 for v in groups.values()), "Expected two directories of eight frames"
    # Use explicit semantic folder names; never silently swap front/back.
    def classify(folder):
        low=folder.lower()
        if any(t in low for t in ("dos","back","player")): return "player"
        if any(t in low for t in ("face","front","opponent")): return "opponent"
        raise ValueError("Cannot determine player/opponent orientation from folder: "+folder)
    assigned={}
    for folder,names in groups.items():
        view=classify(folder)
        assert view not in assigned, "Duplicate view "+view
        assigned[view]=sorted(names,key=lambda n:[int(x) for x in re.findall(r"\d+",pathlib.PurePosixPath(n).stem)] or [0])
    assert set(assigned)=={"player","opponent"}
    for view,names in assigned.items():
        dest=ROOT/view
        (dest/"frames").mkdir(parents=True,exist_ok=True)
        (dest/"atlases").mkdir(parents=True,exist_ok=True)
        (dest/"previews").mkdir(parents=True,exist_ok=True)
        images=[]
        entries=[]
        for i,name in enumerate(names,1):
            data=z.read(name)
            img=Image.open(io.BytesIO(data)).convert("RGBA")
            assert img.size==(512,512), f"Unexpected frame size {name}: {img.size}"
            target=f"creature_lunaire_attack_{view}_{i:02}.png"
            (dest/"frames"/target).write_bytes(data)
            images.append(img)
            entries.append({"index":i-1,"file":"frames/"+target,"sha256":hashlib.sha256(data).hexdigest()})
        atlas=Image.new("RGBA",(512*8,512),(0,0,0,0))
        for i,img in enumerate(images): atlas.paste(img,(512*i,0))
        atlasname=f"creature_lunaire_attack_{view}_8_atlas.webp"
        atlas.save(dest/"atlases"/atlasname,"WEBP",lossless=True)
        previewname=f"creature_lunaire_attack_{view}_8_preview.webp"
        preview=Image.new("RGBA",(512*8,512),(0,0,0,0))
        for i,img in enumerate(images):preview.paste(img,(512*i,0))
        preview.save(dest/"previews"/previewname,"WEBP",lossless=True)
        manifest={"schema":"capture-creature-animation-v1","creatureId":"creature_lunaire","action":"attack","view":view,"frameCount":8,"frameSize":[512,512],"frameMs":110,"playbackMode":"once","sourceArchive":ARCHIVE.name,"sourceArchiveSha256":hashlib.sha256(ARCHIVE.read_bytes()).hexdigest(),"frames":entries,"atlas":{"file":"atlases/"+atlasname,"format":"sprite-strip","frameCount":8,"frameWidth":512,"frameHeight":512},"preview":"previews/"+previewname}
        (dest/"attack.manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
        print("PUBLISHED",view,len(images))
