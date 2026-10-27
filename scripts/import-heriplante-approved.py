from pathlib import Path
import json, zipfile, struct
root=Path("assets/library/capture/creatures")
src=root/"heriplante_2_vues_icone.zip"
dst=root/"heriplante"/"runtime"
dst.mkdir(parents=True,exist_ok=True)
names={"opponent":"heriplante_adversaire_face.png","player":"heriplante_joueur_dos.png","icon":"heriplante_icone.png"}
with zipfile.ZipFile(src) as z:
    assert z.testzip() is None
    assert set(names.values()).issubset(set(z.namelist())),z.namelist()
    for name in names.values():
        data=z.read(name)
        assert data[:8]==bytes.fromhex("89504e470d0a1a0a")
        w,h,depth,color=struct.unpack(">IIBB",data[16:26])
        assert (w,h)==(512,512) and color==6,(name,w,h,color)
        (dst/name).write_bytes(data)
meta={"id":"heriplante","name":"Hériplante","profile":"quadruped","views":{k:"runtime/"+v for k,v in {"player":names["player"],"opponent":names["opponent"],"icon":names["icon"]}.items()},"runtimePreview":{k:"runtime/"+v for k,v in {"player":names["player"],"opponent":names["opponent"],"icon":names["icon"]}.items()},"defaultFacing":{"opponent":"left","player":"right"},"canvas":{"combat":[512,512],"icon":[512,512]},"transformOrigin":{"x":"50%","y":"88%"},"assetIds":{k:"pack:capture:creature-heriplante-"+k+"-01" for k in names},"source":{"scope":"pack","packId":"capture","library":"global-assets"},"visualRevision":"user-approved-2026-10-27"}
(root/"heriplante"/"heriplante.meta.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n")
p=Path("data/assets/catalog/global-visual-assets.v1.json")
catalog=json.loads(p.read_text())
assert not any("creature-heriplante-" in a["id"] for a in catalog["assets"])
for role,name in names.items():
    catalog["assets"].append({"id":meta["assetIds"][role],"label":"Hériplante — "+role,"assetType":"sprite" if role!="icon" else "portrait","mediaType":"image","category":"creature" if role!="icon" else "ui","tags":["creature","capture","heriplante",role,"nature"],"source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},"resource":{"file":"capture/creatures/heriplante/runtime/"+name,"mime":"image/png"},"compatibility":{"uses":["combat","capture","editor"]}})
catalog["counts"]["assets"]+=3
catalog["counts"]["sprites"]+=2
catalog["counts"]["portraits"]+=1
catalog["counts"]["creatures"]+=3
p.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n")
print("PIEUVRE_ASSETS_READY",len(catalog["assets"]))
