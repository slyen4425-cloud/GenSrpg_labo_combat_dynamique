from pathlib import Path
from PIL import Image
import zipfile,io,json,hashlib
base=Path("assets/library/capture/creatures/venombre/animations")
with zipfile.ZipFile("venombre_joueur_attaque_move.zip") as z:
 readme=z.read("README.txt").decode("utf-8-sig",errors="replace").lower()
 print("PLAYER ZIP README:",readme)
 import re
 # Require source README to explicitly identify animation 1/2, never guess
 mapping={}
 for i in (1,2):
  hits=[line for line in readme.splitlines() if re.search(r"animation[_\\s-]*"+str(i)+r"\\b",line)]
  actions=set()
  for line in hits:
   if any(w in line for w in ("attaque","attack")):actions.add("attack")
   if any(w in line for w in ("course","movement","déplacement","deplacement")):actions.add("movement")
  assert len(actions)==1,("ambiguous player animation",i,hits)
  mapping[actions.pop()]=i
 assert set(mapping)=={"attack","movement"},mapping
sources=[
 ("venombre_joueur_attaque_move.zip","attack","player",f"animation_{mapping['attack']}_validee/frame_"),
 ("venombre_joueur_attaque_move.zip","movement","player",f"animation_{mapping['movement']}_validee/frame_"),
 ("venombre_oposent_move.zip","movement","opponent","course/course_"),
 ("venombre_opposenr_attaque.zip","attack","opponent","attaque_"),
]
cat=json.loads(Path("data/assets/catalog/global-visual-assets.v1.json").read_text())
results=[]
for archive,action,view,prefix in sources:
 with zipfile.ZipFile(archive) as z:
  assert z.testzip() is None
  frames=[]
  for i in range(1,9):
   n=f"{prefix}{i:02d}.png"
   im=Image.open(io.BytesIO(z.read(n))).convert("RGBA")
   assert im.size==(512,512),(n,im.size)
   assert im.getextrema()[3][0]==0,(n,"no transparent pixels")
   frames.append(im)
  folder=base/action/view
  folder.mkdir(parents=True,exist_ok=True)
  frame_dir=folder/"frames"
  frame_dir.mkdir(parents=True,exist_ok=True)
  for old in frame_dir.glob("*.png"):old.unlink()
  for i,im in enumerate(frames,1):
   im.save(frame_dir/f"venombre_{action}_{view}_{i:02d}.png",optimize=True)
  atlas=Image.new("RGBA",(4096,512))
  for i,im in enumerate(frames):atlas.alpha_composite(im,(512*i,0))
  asset_id=f"pack:capture:venombre-{action}-{view}-8-v1"
  matches=[a for a in cat["assets"] if a["id"]==asset_id]
  assert len(matches)==1,asset_id
  a=matches[0]
  relative=a["resource"]["file"]
  dest=Path("assets/library")/relative
  assert dest.parent==folder/"atlases",dest
  dest.parent.mkdir(parents=True,exist_ok=True)
  for old in dest.parent.glob("*.webp"):
   if old!=dest:old.unlink()
  atlas.save(dest,lossless=True,method=5)
  preview=folder/"previews"/f"venombre_{action}_{view}_8_preview.webp"
  preview.parent.mkdir(parents=True,exist_ok=True)
  for old in preview.parent.glob("*.webp"):
   if old!=preview:old.unlink()
  frames[0].save(preview,save_all=True,append_images=frames[1:],duration=130,loop=0,lossless=True)
  manifest=folder/f"{action}.manifest.json"
  manifest.write_text(json.dumps({"action":action,"view":view,"frameCount":8,"sourceZip":archive,"sourceSha256":hashlib.sha256(Path(archive).read_bytes()).hexdigest(),"atlas":relative},indent=2)+"\n")
  results.append({"assetId":asset_id,"frames":8,"atlas":relative,"source":archive})
Path("VENOMBRE_DELIVERY_AUDIT.json").write_text(json.dumps(results,indent=2)+"\n")
assert len(results)==4
print("SUCCESS: all four source animations normalized, atlas paths match canonical catalog")
