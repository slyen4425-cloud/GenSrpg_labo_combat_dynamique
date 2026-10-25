#!/usr/bin/env python3
"""Import only the three validated lunar creature animations, preserving source frames."""
import io,json,zipfile,pathlib,hashlib
from PIL import Image
R=pathlib.Path(__file__).resolve().parents[1]
ZIP="CREATURE_LUNAIRE_FACE_2_ANIMATIONS_ET_COURSE_DOS_8F.zip"
CAT=R/"data/assets/catalog/global-visual-assets.v1.json"
BASE=R/"assets/library/capture/creatures/creature_lunaire/animations"
def sha(x):return hashlib.sha256(x).hexdigest()
def main():
 raw=(R/"_incoming"/ZIP).read_bytes()
 with zipfile.ZipFile(io.BytesIO(raw)) as z:
  assert z.testzip() is None
  cat=json.loads(CAT.read_text())
  ids={a["id"] for a in cat["assets"]}
  additions=[]
  for folder,action,view,source,mode in [
   ("face/course","movement","opponent","course","loop"),
   ("face/attaque","attack","opponent","attaque","once"),
   ("dos/course","movement","player","course_dos","loop")]:
   dest=BASE/action/view
   frames=[]
   for i in range(1,9):
    src=f"{folder}/frames/{source}_{i:02d}.png"
    data=z.read(src)
    with Image.open(io.BytesIO(data)) as im:
     assert im.size==(512,512) and im.mode=="RGBA",src
     assert im.getchannel("A").getextrema()[0]==0,src
     frames.append(im.copy())
    out=dest/"frames"/f"creature_lunaire_{action}_{view}_{i:02d}.png"
    out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(data)
   assert len({sha(z.read(f"{folder}/frames/{source}_{i:02d}.png")) for i in range(1,9)})==8
   atlas=Image.new("RGBA",(4096,512))
   for i,im in enumerate(frames):atlas.alpha_composite(im,(i*512,0))
   atlas_path=dest/"atlases"/f"creature_lunaire_{action}_{view}_8_atlas.webp"
   atlas_path.parent.mkdir(parents=True,exist_ok=True)
   atlas.save(atlas_path,"WEBP",lossless=True,method=6)
   preview=z.read(f"{folder}/preview.webp")
   with Image.open(io.BytesIO(preview)) as p:assert p.n_frames==8
   prev=dest/"previews"/f"creature_lunaire_{action}_{view}_8_preview.webp"
   prev.parent.mkdir(parents=True,exist_ok=True);prev.write_bytes(preview)
   manifest={"schema":"capture-creature-animation-v1","creatureId":"creature_lunaire","action":action,"view":view,"frameCount":8,"frameSize":[512,512],"frameMs":110,"playbackMode":mode,"sourceArchive":ZIP,"sourceArchiveSha256":sha(raw),"frames":[{"index":i-1,"file":f"frames/creature_lunaire_{action}_{view}_{i:02d}.png","sha256":sha(z.read(f"{folder}/frames/{source}_{i:02d}.png"))} for i in range(1,9)],"atlas":{"file":f"atlases/{atlas_path.name}","format":"sprite-strip","frameCount":8,"frameWidth":512,"frameHeight":512},"preview":f"previews/{prev.name}"}
   (dest/(action+".manifest.json")).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
   aid=f"pack:capture:creature-lunaire-{action}-{view}-8-v1"
   assert aid not in ids,aid
   additions.append({"id":aid,"label":f"Créature lunaire {action} {view} 8f","assetType":"sprite","mediaType":"image","category":"creature","tags":["capture","creature","lunaire","animated",view,action],"source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},"resource":{"file":f"capture/creatures/creature_lunaire/animations/{action}/{view}/atlases/{atlas_path.name}","format":"sprite-strip","mime":"image/webp","frameCount":8,"frameMs":110,"playbackMode":mode},"compatibility":{"uses":["combat","capture","editor"]}})
  cat["assets"].extend(additions)
  for k in ("assets","sprites","creatures"):cat["counts"][k]+=len(additions)
  CAT.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n")
  print("Imported three validated animations; attack player is not supplied")
if __name__=="__main__":main()
