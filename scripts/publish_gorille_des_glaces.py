#!/usr/bin/env python3
"""Merge existing approved gorilla PNG Git blobs into canonical library without redrawing."""
import json,pathlib,subprocess,tempfile
def git(*args,cwd=None):
    return subprocess.check_output(["git",*args],cwd=cwd,text=True).strip()
git("fetch","origin","global-assets","work/gorille-des-glaces-assets-2026-10-27")
with tempfile.TemporaryDirectory() as temp:
    target=pathlib.Path(temp)/"library"
    git("worktree","add","--detach",str(target),"origin/global-assets")
    try:
        root=target/"assets/library/capture/creatures/gorille_des_glaces"
        models=root/"runtime"
        models.mkdir(parents=True,exist_ok=True)
        source="origin/work/gorille-des-glaces-assets-2026-10-27"
        for role in ("face","dos","icon"):
            path=f"assets/library/capture/creatures/gorille_des_glaces/models/gorille_des_glaces_{role}.png"
            data=subprocess.check_output(["git","show",f"{source}:{path}"])
            assert data[:8]==b"\\x89PNG\\r\\n\\x1a\\n",role
            (models/f"gorille_des_glaces_{role}.png").write_bytes(data)
        meta={
            "id":"gorille_des_glaces","name":"Gorille des glaces","profile":"gorilla",
            "views":{"player":"runtime/gorille_des_glaces_dos.png","opponent":"runtime/gorille_des_glaces_face.png","icon":"runtime/gorille_des_glaces_icon.png"},
            "runtimePreview":{"player":"runtime/gorille_des_glaces_dos.png","opponent":"runtime/gorille_des_glaces_face.png","icon":"runtime/gorille_des_glaces_icon.png"},
            "defaultFacing":{"opponent":"left","player":"right"},
            "canvas":{"combat":[512,512],"icon":[512,512]},
            "transformOrigin":{"x":"50%","y":"88%"},
            "assetIds":{"player":"pack:capture:creature-gorille-des-glaces-player-01","opponent":"pack:capture:creature-gorille-des-glaces-opponent-01","icon":"pack:capture:creature-gorille-des-glaces-icon-01"},
            "source":{"scope":"pack","packId":"capture","library":"global-assets"},
            "visualRevision":"user-approved-2026-10-27",
            "notes":"Modèles face, dos, icône issus des blobs Git approuvés, sans modification des pixels."
        }
        (root/"gorille_des_glaces.meta.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n")
        path=target/"data/assets/catalog/global-visual-assets.v1.json"
        catalog=json.loads(path.read_text())
        entries=[]
        for view,role in (("face","opponent"),("dos","player"),("icon","icon")):
            entries.append({
                "id":meta["assetIds"][role],"label":"Gorille des glaces — "+role,
                "assetType":"portrait" if role=="icon" else "sprite","mediaType":"image",
                "category":"ui" if role=="icon" else "creature",
                "tags":["creature","capture","gorille-des-glaces",role],
                "source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},
                "resource":{"file":f"capture/creatures/gorille_des_glaces/runtime/gorille_des_glaces_{view}.png","mime":"image/png"},
                "compatibility":{"uses":["combat","capture","editor"]}
            })
        assert not any(e["id"] in {a["id"] for a in catalog["assets"]} for e in entries)
        catalog["assets"].extend(entries)
        catalog["counts"]["assets"]+=3
        catalog["counts"]["sprites"]+=2
        catalog["counts"]["portraits"]+=1
        catalog["counts"]["creatures"]+=1
        path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n")
        assert all((target/"assets/library"/e["resource"]["file"]).is_file() for e in entries)
        git("config","user.name","github-actions[bot]",cwd=target)
        git("config","user.email","41898282+github-actions[bot]@users.noreply.github.com",cwd=target)
        git("add","assets/library/capture/creatures/gorille_des_glaces","data/assets/catalog/global-visual-assets.v1.json",cwd=target)
        git("diff","--cached","--check",cwd=target)
        git("commit","-m","assets(capture): register approved ice gorilla masters",cwd=target)
        git("push","origin","HEAD:global-assets",cwd=target)
        print("PUBLISHED",git("rev-parse","HEAD",cwd=target))
    finally:
        git("worktree","remove","--force",str(target))
