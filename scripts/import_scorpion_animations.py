from pathlib import Path
from PIL import Image
import zipfile,io,json,hashlib
src=Path("scorpion_2_animations_validees_8_frames.zip")
assert src.exists()
with zipfile.ZipFile(src) as z:
 assert z.testzip() is None
 names=z.namelist()
 print("ARCHIVE",names,flush=True)
 pngs=[n for n in names if n.lower().endswith(".png")]
 assert len(pngs)==16,("Expected 16 frames",pngs)
 groups={}
 for n in pngs:
  group=n.rsplit("/",1)[0] if "/" in n else n.split("_")[0]
  groups.setdefault(group,[]).append(n)
 assert len(groups)==2 and all(len(v)==8 for v in groups.values()),groups
 labels=list(groups)
 for group,action in zip(labels,("attack","movement")):
  if any(k in group.lower() for k in ("course","run","move")):action="movement"
  elif any(k in group.lower() for k in ("attaque","attack")):action="attack"
  groups[group]=(action,sorted(groups[group]))
 assert len(set(x[0] for x in groups.values()))==2,groups
 catpath=Path("data/assets/catalog/global-visual-assets.v1.json")
 cat=json.loads(catpath.read_text())
 for group,(action,items) in groups.items():
  dest=Path("assets/library/capture/creatures/scorpion/animations")/action/"opponent"
  (dest/"frames").mkdir(parents=True,exist_ok=True)
  frames=[]
  for i,n in enumerate(items,1):
   im=Image.open(io.BytesIO(z.read(n))).convert("RGBA")
   assert im.size==(512,512),(n,im.size)
   frames.append(im)
   im.save(dest/"frames"/f"scorpion_{action}_opponent_{i:02d}.png",optimize=True)
  (dest/"atlases").mkdir(exist_ok=True)
  atlas=Image.new("RGBA",(4096,512))
  for i,im in enumerate(frames):atlas.alpha_composite(im,(i*512,0))
  atlas.save(dest/"atlases"/f"scorpion_{action}_opponent_8_atlas.webp",lossless=True,method=5)
  (dest/"previews").mkdir(exist_ok=True)
  frames[0].save(dest/"previews"/f"scorpion_{action}_opponent_8_preview.webp",save_all=True,append_images=frames[1:],duration=130,loop=0,lossless=True)
  (dest/f"{action}.manifest.json").write_text(json.dumps({"action":action,"view":"opponent","frames":8,"source":src.name,"sha256":hashlib.sha256(src.read_bytes()).hexdigest()},indent=2)+"\n")
  assetid=f"pack:capture:scorpion-{action}-opponent-8-v1"
  assert not any(a["id"]==assetid for a in cat["assets"])
  cat["assets"].append({"id":assetid,"label":f"Scorpion — {'Course' if action=='movement' else 'Attaque'} face (8 frames)","assetType":"sprite","mediaType":"image","category":"creature","tags":["capture","creature","scorpion","animated","opponent",action],"source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},"resource":{"file":f"capture/creatures/scorpion/animations/{action}/opponent/atlases/scorpion_{action}_opponent_8_atlas.webp","format":"sprite-strip","mime":"image/webp","frameCount":8,"frameMs":130,"playbackMode":"loop" if action=="movement" else "once"},"compatibility":{"uses":["combat","capture","editor"]}})
 cat["counts"]["assets"]=len(cat["assets"])
 cat["counts"]["sprites"]=sum(a.get("assetType")=="sprite" for a in cat["assets"])
 catpath.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n")
 print("SUCCESS",[(x[0],x[1][0]) for x in groups.values()])
