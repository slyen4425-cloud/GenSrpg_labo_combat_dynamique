from pathlib import Path
from PIL import Image
import zipfile,json,io,hashlib
src=Path("CREATURE_VIOLETTE_DOS_COURSE_ATTAQUE_8F_VALIDEES.zip")
assert src.exists(),"Source ZIP missing"
root=Path("assets/library/capture/creatures/creature_violette/animations")
catfile=Path("data/assets/catalog/global-visual-assets.v1.json")
catalog=json.loads(catfile.read_text())
with zipfile.ZipFile(src) as z:
    names=z.namelist()
    print("ARCHIVE ENTRIES",names)
    assert z.testzip() is None,"Corrupt ZIP"
    pngs=[n for n in names if n.lower().endswith(".png")]
    for action,aliases in (("movement",("course","movement")),("attack",("attaque","attack"))):
        selected=[n for n in pngs if any(a in n.lower() for a in aliases)]
        assert len(selected)==8,(action,selected)
        selected.sort()
        dest=root/action/"player"
        (dest/"frames").mkdir(parents=True,exist_ok=True)
        frames=[]
        for i,n in enumerate(selected,1):
            im=Image.open(io.BytesIO(z.read(n))).convert("RGBA")
            assert im.size==(512,512),(n,im.size)
            frames.append(im)
            im.save(dest/"frames"/f"creature_violette_{action}_player_{i:02d}.png",optimize=True)
        atlas=Image.new("RGBA",(4096,512))
        for i,im in enumerate(frames):atlas.alpha_composite(im,(i*512,0))
        (dest/"atlases").mkdir(exist_ok=True)
        atlas.save(dest/"atlases"/f"creature_violette_{action}_player_8_atlas.webp",lossless=True,method=5)
        (dest/"previews").mkdir(exist_ok=True)
        frames[0].save(dest/"previews"/f"creature_violette_{action}_player_8_preview.webp",save_all=True,append_images=frames[1:],duration=125,loop=0,lossless=True)
        id=f"pack:capture:creature-violette-{action}-player-8-v1"
        assert not any(a["id"]==id for a in catalog["assets"]),"Duplicate ID"
        rel=f"capture/creatures/creature_violette/animations/{action}/player/atlases/creature_violette_{action}_player_8_atlas.webp"
        catalog["assets"].append({"id":id,"label":f"Créature violette — {'Course' if action=='movement' else 'Attaque'} dos (8 frames)","assetType":"sprite","mediaType":"image","category":"creature","tags":["capture","creature","violette","animated","player",action],"source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},"resource":{"file":rel,"format":"sprite-strip","mime":"image/webp","frameCount":8,"frameMs":125,"playbackMode":"loop" if action=="movement" else "once"},"compatibility":{"uses":["combat","capture","editor"]}})
        (dest/f"{action}.manifest.json").write_text(json.dumps({"view":"player","action":action,"frameCount":8,"sourceArchive":src.name,"sha256":hashlib.sha256(src.read_bytes()).hexdigest()},indent=2)+"\n")
catalog["counts"]["assets"]=len(catalog["assets"])
catalog["counts"]["sprites"]=sum(a.get("assetType")=="sprite" for a in catalog["assets"])
catfile.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n")
print("OK DOS",len(pngs),[a["id"] for a in catalog["assets"][-2:]])
