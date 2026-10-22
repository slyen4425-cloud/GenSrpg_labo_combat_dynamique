#!/usr/bin/env python3
"""Braisombre dos: import approved source ZIP with silhouette-based extraction."""
import io,json,hashlib,pathlib,zipfile,shutil
import numpy as np
import cv2
from PIL import Image
R=pathlib.Path(__file__).resolve().parents[1]
NAME="BRAISOMBRE_DOS_12F_VOL_ATTAQUE_APPROUVE_2026-10-22.zip"
SHA="e991b4e403cc40bd56a6b87577062aff3bc8fa3745eae95c04ae1e33473ea6a4"
SUB="braisombre_dos_animations_2026-10-22/"
OUT=R/"assets/library/capture/creatures/braisombre/animations"
CAT=R/"data/assets/catalog/global-visual-assets.v1.json"
CONFIG={"movement":("VOL","flight",90,"loop"),"attack":("ATTAQUE","attack",100,"once")}
def hash(b):return hashlib.sha256(b).hexdigest()
def save(im,typ,**opts):
 b=io.BytesIO();im.save(b,format=typ,**opts);return b.getvalue()
def frames(im):
 im=im.convert("RGBA")
 assert im.size==(1448,1086)
 raw=np.asarray(im).copy()
 n,labels,stats,center=cv2.connectedComponentsWithStats(
   np.ascontiguousarray((raw[:,:,3]>8).astype(np.uint8)),connectivity=8)
 ids=[i for i in range(1,n) if stats[i,4]>=15000]
 assert len(ids)==12,("not 12 real dragon silhouettes",len(ids))
 grid={}
 for idx in ids:
  x,y=center[idx];key=(min(2,int(y//362)),min(3,int(x//362)))
  assert key not in grid
  grid[key]=idx
 assert len(grid)==12
 items=[]
 for row in range(3):
  for col in range(4):
   idx=grid[row,col]
   x,y,w,h,area=map(int,stats[idx])
   xa,ya,xb,yb=max(x-4,0),max(y-4,0),min(x+w+4,1448),min(y+h+4,1086)
   seg=raw[ya:yb,xa:xb].copy()
   keep=cv2.dilate((labels[ya:yb,xa:xb]==idx).astype(np.uint8),
                   np.ones((5,5),np.uint8),iterations=1).astype(bool)
   seg[~keep]=0;seg[seg[:,:,3]<3]=0
   obj=Image.fromarray(seg,"RGBA")
   obj=obj.crop(obj.getchannel("A").getbbox())
   if obj.width>384 or obj.height>384:
    s=min(384/obj.width,384/obj.height)
    obj=obj.resize((round(obj.width*s),round(obj.height*s)),Image.Resampling.LANCZOS)
   frame=Image.new("RGBA",(512,512))
   frame.paste(obj,((512-obj.width)//2,(512-obj.height)//2))
   box=frame.getchannel("A").getbbox()
   assert box is not None
   margins=[box[0],box[1],512-box[2],512-box[3]]
   assert min(margins)>=64
   items.append((frame,{"sourceGridCell":[col,row],"sourceComponentAreaPx":area,
                         "sourceComponentBoundingBox":[x,y,x+w,y+h],
                         "marginsLTRB":margins}))
 return items
def main():
 zpath=R/"_incoming"/NAME
 assert zpath.is_file() and hash(zpath.read_bytes())==SHA
 assert not (R/"tests/unit/braisombre-dos12-assets.test.mjs").exists()
 catalog=json.loads(CAT.read_text(encoding="utf8"))
 assert catalog["counts"]["assets"]==len(catalog["assets"])
 oldids={a["id"] for a in catalog["assets"]}
 assert len(oldids)==len(catalog["assets"])
 pending={};add=[]
 with zipfile.ZipFile(zpath) as z:
  assert z.testzip() is None
  expected={SUB,SUB+"README.txt"}
  for action,(code,motion,ms,mode) in CONFIG.items():
   source="BRAISOMBRE_DOS_"+code+"_12F_APPROUVE_2026-10-22.png"
   expected.add(SUB+source)
   data=z.read(SUB+source)
   poses=frames(Image.open(io.BytesIO(data)))
   dir=OUT/action/"dos"
   id="pack:capture:creature-braisombre-"+action+"-dos-12-v1"
   assert id not in oldids
   manifest={"schema":"capture-creature-animation-v1",
    "creatureId":"braisombre","action":action,"motionKind":motion,"view":"dos",
    "assetId":id,"frameCount":12,"frameSize":[512,512],"frameMs":ms,
    "playbackMode":mode,"authorApproved":True,
    "approvalStatus":"approved_for_ingame_trial",
    "sourceSpriteSheet":"sources/"+source,"sourceSpriteSheetSha256":hash(data),
    "sourceLayout":[4,3],"isolation":"connected-alpha-silhouette",
    "isolationAlphaSeed":8,"frames":[]}
   distinct=set()
   strip=Image.new("RGBA",(4608,384))
   contact=Image.new("RGBA",(2048,1536))
   small=[]
   for i,(pose,details) in enumerate(poses):
    rel="frames/braisombre_"+action+"_dos_"+str(i+1).zfill(2)+".png"
    png=save(pose,"PNG",optimize=True)
    pending[dir/rel]=png;distinct.add(hash(png))
    manifest["frames"].append({"index":i,"file":rel,"sha256":hash(png),**details})
    strip.paste(pose.resize((384,384),Image.Resampling.LANCZOS),(i*384,0))
    contact.paste(pose,((i%4)*512,(i//4)*512))
    small.append(pose.resize((320,320),Image.Resampling.LANCZOS))
   assert len(distinct)==12
   rel="atlases/braisombre_"+motion+"_dos_12_atlas.webp"
   atlas=save(strip,"WEBP",quality=87,method=3)
   pending[dir/rel]=atlas
   manifest["atlas"]={"file":rel,"format":"sprite-strip","frameCount":12,
                      "frameWidth":384,"frameHeight":384,"sha256":hash(atlas)}
   key="braisombre_"+motion+"_dos_12"
   pr={"gif":"previews/"+key+"_preview.gif",
       "webp":"previews/"+key+"_preview_transparent.webp",
       "planche":"previews/"+key+"_planche.png"}
   pending[dir/pr["gif"]]=save(small[0],"GIF",save_all=True,
       append_images=small[1:],duration=ms,loop=0 if mode=="loop" else 1,
       optimize=False,disposal=2,transparency=0)
   pending[dir/pr["webp"]]=save(small[0],"WEBP",save_all=True,
       append_images=small[1:],duration=ms,loop=0 if mode=="loop" else 1,
       quality=87,method=3)
   pending[dir/pr["planche"]]=save(contact,"PNG",optimize=True)
   manifest["preview"]=pr["gif"];manifest["previews"]=pr
   pending[dir/(action+".manifest.json")]=(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n").encode()
   pending[OUT/"sources"/source]=data
   add.append({"id":id,
    "label":"Braisombre — "+("vol / déplacement" if action=="movement" else "attaque")+" dos (12 frames)",
    "assetType":"sprite","mediaType":"image","category":"creature",
    "tags":["capture","creature","braisombre","dragon","fire",action,"animated","dos"]+
           (["flight","flying"] if action=="movement" else []),
    "source":{"scope":"pack","packId":"capture","author":"GenSrpG / sprites auteur 2026-10-22","license":"project-internal"},
    "resource":{"file":"capture/creatures/braisombre/animations/"+action+"/dos/"+rel,
                "format":"sprite-strip","mime":"image/webp","frameCount":12,"frameMs":ms,"playbackMode":mode},
    "compatibility":{"uses":["combat","capture","editor"]}})
  assert set(z.namelist())==expected
 assert all(not p.exists() for p in pending)
 for p,b in pending.items():
  p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
 catalog["assets"].extend(add)
 for name in ("assets","sprites","creatures"):catalog["counts"][name]+=2
 assert catalog["counts"]["assets"]==len(catalog["assets"])
 CAT.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
 test=R/"tests/unit/braisombre-dos12-assets.test.mjs"
 test.parent.mkdir(parents=True,exist_ok=True)
 shutil.copyfile(R/"scripts/braisombre-dos12.test.template.mjs",test)
 journal=R/"docs/LAB_CURRENT_WORK.md"
 note="""## 2026-10-22 — Braisombre DOS, 12 frames Vol et Attaque

- Source auteur réelle : \`_incoming/BRAISOMBRE_DOS_12F_VOL_ATTAQUE_APPROUVE_2026-10-22.zip\` (SHA256 \`e991b4e403cc40bd56a6b87577062aff3bc8fa3745eae95c04ae1e33473ea6a4\`, Git blob \`9db159a1e82ebf1005e0099f2a702e3598ad618b\`). Deux planches approuvées 1448×1086 RGBA, 12 silhouettes chacune.
- Base \`global-assets@3611cc015206f4bb12614d844fcdafd6122b69f3\`, checkpoint départ \`checkpoint/global-assets-start-braisombre-dos12-2026-10-22\`, branche \`work/global-assets-braisombre-dos12-2026-10-22\`.
- Propriétaire : catalogue unique visuel Capture, IDs \`pack:capture:creature-braisombre-movement-dos-12-v1\` et \`pack:capture:creature-braisombre-attack-dos-12-v1\`. Import : 24 PNG RGBA 512px, deux atlases WebP, six previews, deux manifestes et deux sources. Découpe par silhouettes pour préserver les ailes hors cellules.
- Protégés : runtime Braisombre, deux animations FACE, autres créatures, moteurs et UI, \`main\`, \`gh-pages\`, GenSrpG et Exploration.
- Gates : contrôle médias réels, tests source/sha/alpha/frames, CI SHA final, checkpoint GREEN avant fast-forward \`global-assets\`. Le catalogue ne vaut pas affectation automatique ni essai réel en combat.
- Détail : \`docs/LAB_BRAISOMBRE_DOS12_VOL_ATTAQUE_2026-10-22.md\`.

---

"""
 assert journal.is_file()
 journal.write_text(note+journal.read_text(encoding="utf8"),encoding="utf8")
 print("Imported 24 original 512 RGBA frames, 2 atlas, 6 previews, 2 manifests, 2 sources, +2 catalog IDs")
if __name__=="__main__":main()
