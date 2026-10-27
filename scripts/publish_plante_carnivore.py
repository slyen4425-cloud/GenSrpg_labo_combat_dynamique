#!/usr/bin/env python3
"""Publish the user-approved carnivorous plant masters into the canonical global-assets library."""
import io, json, pathlib, subprocess, tempfile, zipfile
from PIL import Image

ROOT=pathlib.Path.cwd()
def git(*args,cwd=ROOT):
    return subprocess.check_output(["git",*args],cwd=cwd,text=True).strip()
git("fetch","origin","gh-pages","global-assets")
source=subprocess.check_output(["git","show","origin/gh-pages:plante_carnivore_face_dos_icon.zip"])
with zipfile.ZipFile(io.BytesIO(source)) as z:
    expected={f"plante_carnivore_{view}.png" for view in ("face","dos","icon")}
    assert set(z.namelist())==expected, f"Unexpected archive contents: {z.namelist()}"
    images={}
    for view in ("face","dos","icon"):
        name=f"plante_carnivore_{view}.png"
        data=z.read(name)
        im=Image.open(io.BytesIO(data))
        assert im.format=="PNG" and im.mode=="RGBA" and im.size==(512,512),name
        assert im.getpixel((0,0))[3]==0,name
        images[view]=data
with tempfile.TemporaryDirectory() as temp:
    target=pathlib.Path(temp)/"library"
    git("worktree","add","--detach",str(target),"origin/global-assets")
    try:
        root=target/"assets/library/capture/creatures/plante_carnivore"
        runtime=root/"runtime"
        runtime.mkdir(parents=True,exist_ok=True)
        for view,data in images.items():
            (runtime/f"plante_carnivore_{view}.png").write_bytes(data)
        meta={
            "id":"plante_carnivore","name":"Plante carnivore","profile":"plant",
            "views":{"player":"runtime/plante_carnivore_dos.png","opponent":"runtime/plante_carnivore_face.png","icon":"runtime/plante_carnivore_icon.png"},
            "runtimePreview":{"player":"runtime/plante_carnivore_dos.png","opponent":"runtime/plante_carnivore_face.png","icon":"runtime/plante_carnivore_icon.png"},
            "defaultFacing":{"opponent":"left","player":"right"},
            "canvas":{"combat":[512,512],"icon":[512,512]},
            "transformOrigin":{"x":"50%","y":"88%"},
            "assetIds":{"player":"pack:capture:creature-plante-carnivore-player-01","opponent":"pack:capture:creature-plante-carnivore-opponent-01","icon":"pack:capture:creature-plante-carnivore-icon-01"},
            "source":{"scope":"pack","packId":"capture","library":"global-assets"},
            "visualRevision":"user-approved-2026-10-27",
            "notes":"Modèles approuvés face, dos et icône, PNG RGBA 512x512, sans modification de pixels."
        }
        (root/"plante_carnivore.meta.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n")
        path=target/"data/assets/catalog/global-visual-assets.v1.json"
        catalog=json.loads(path.read_text())
        entries=[]
        for view,role in (("face","opponent"),("dos","player"),("icon","icon")):
            entries.append({
                "id":meta["assetIds"][role],"label":"Plante carnivore — "+role,
                "assetType":"portrait" if role=="icon" else "sprite","mediaType":"image",
                "category":"ui" if role=="icon" else "creature",
                "tags":["creature","capture","plante-carnivore",role],
                "source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},
                "resource":{"file":f"capture/creatures/plante_carnivore/runtime/plante_carnivore_{view}.png","mime":"image/png"},
                "compatibility":{"uses":["combat","capture","editor"]}
            })
        ids={e["id"] for e in entries}
        existing=[a for a in catalog["assets"] if a["id"] in ids]
        assert not existing, "Canonical IDs already exist; manual reconciliation required"
        catalog["assets"].extend(entries)
        catalog["counts"]["assets"]+=3
        catalog["counts"]["sprites"]+=2
        catalog["counts"]["portraits"]+=1
        catalog["counts"]["creatures"]+=1
        path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n")
        assert all((target/"assets/library"/e["resource"]["file"]).is_file() for e in entries)
        git("config","user.name","github-actions[bot]",cwd=target)
        git("config","user.email","41898282+github-actions[bot]@users.noreply.github.com",cwd=target)
        git("add","assets/library/capture/creatures/plante_carnivore","data/assets/catalog/global-visual-assets.v1.json",cwd=target)
        git("diff","--cached","--check",cwd=target)
        git("commit","-m","assets(capture): register approved carnivorous plant face, back and icon",cwd=target)
        git("push","origin","HEAD:global-assets",cwd=target)
        print("PUBLISHED",git("rev-parse","HEAD",cwd=target))
    finally:
        git("worktree","remove","--force",str(target))
