from pathlib import Path
import zipfile,json,hashlib
src=Path("creature_violette_attaque_course_8frames.zip")
assert src.exists()
root=Path("assets/library/capture/creatures/creature_violette/animations")
catalog_path=Path("data/assets/catalog/global-visual-assets.v1.json")
catalog=json.loads(catalog_path.read_text())
for action in ("attack","movement"):
    base=f"animations/{action}/"
    target=root/action/"opponent"
    target.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(src) as z:
        names=[n for n in z.namelist() if n.startswith(base)]
        assert len([n for n in names if "/frames/" in n and n.endswith(".png")])==8
        for n in names:
            if n.endswith("/"):continue
            rel=n[len(base):]
            if rel.startswith("frames/"):dest=target/rel
            elif rel.endswith("_atlas.webp"):dest=target/"atlases"/Path(rel).name
            elif rel=="preview_animated.webp":dest=target/"previews"/f"creature_violette_{action}_opponent_8_preview.webp"
            else:continue
            dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_bytes(z.read(n))
    atlas=f"capture/creatures/creature_violette/animations/{action}/opponent/atlases/creature_violette_{action}_face_atlas.webp"
    assert (Path("assets/library")/atlas).exists()
    id=f"pack:capture:creature-violette-{action}-opponent-8-v1"
    assert not any(a["id"]==id for a in catalog["assets"])
    catalog["assets"].append({"id":id,"label":f"Créature violette — {'Attaque' if action=='attack' else 'Course'} face (8 frames)","assetType":"sprite","mediaType":"image","category":"creature","tags":["capture","creature","violette","animated","opponent",action],"source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},"resource":{"file":atlas,"format":"sprite-strip","mime":"image/webp","frameCount":8,"frameMs":125,"playbackMode":"once" if action=="attack" else "loop"},"compatibility":{"uses":["combat","capture","editor"]}})
    (target/f"{action}.manifest.json").write_text(json.dumps({"action":action,"view":"opponent","frameCount":8,"sourceArchive":src.name,"sha256":hashlib.sha256(src.read_bytes()).hexdigest()},indent=2)+"\n")
catalog["counts"]["assets"]=len(catalog["assets"])
catalog["counts"]["sprites"]=sum(a.get("assetType")=="sprite" for a in catalog["assets"])
catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n")
print("IMPORTED",src.name,[(a["id"],a["resource"]["file"]) for a in catalog["assets"][-2:]])
