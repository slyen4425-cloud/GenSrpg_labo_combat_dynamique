#!/usr/bin/env python3
"""Import approved Ailevent FACE animation previews as genuine frame assets; no invented detail."""
from pathlib import Path
from io import BytesIO
from PIL import Image
import zipfile, hashlib,json,shutil
R=Path(__file__).resolve().parents[1]
ZIP="AILEVENT_FACE_2_ANIMATIONS_VALIDEE.zip"
HASH="dde8c1bab4d8a2b0812e5593a7c268d0b0ae2c4f8ec5e5bccbb9179c4bdabca5"
ROOT="AILEVENT_FACE_PACKAGE_VALIDE/"
BASE=R/"assets/library/capture/creatures/ailevent/animations"
CAT=R/"data/assets/catalog/global-visual-assets.v1.json"
def sha(b):return hashlib.sha256(b).hexdigest()
def check(im,size,frames=1):
 assert im.size==size,(im.size,size)
 assert getattr(im,"n_frames",1)==frames
def main():
 b=(R/"_incoming"/ZIP).read_bytes()
 assert len(b)==8500736 and sha(b)==HASH
 cat=json.loads(CAT.read_text("utf8"))
 assert cat["counts"]["assets"]==len(cat["assets"])
 existing={a["id"] for a in cat["assets"]}
 assert len(existing)==len(cat["assets"])
 outputs={};add=[]
 with zipfile.ZipFile(BytesIO(b)) as z:
  assert z.testzip() is None and len(z.namelist())==7
  for action,folder,name,play in [("movement","VOL","VOL","loop"),("attack","ATTAQUE","ATTAQUE","once")]:
   dest=BASE/action/"opponent"
   stem=f"AILEVENT_FACE_{name}_12F_"
   wb=z.read(f"{ROOT}{folder}/{stem}PREVIEW.webp")
   gb=z.read(f"{ROOT}{folder}/{stem}PREVIEW.gif")
   pb=z.read(f"{ROOT}{folder}/{stem}PLANCHE.png")
   frames=[];unique=set()
   with Image.open(BytesIO(wb)) as im:
    check(im,(512,512),12)
    for i in range(12):
     im.seek(i);f=im.convert("RGBA")
     assert f.getchannel("A").getextrema()==(0,255)
     bbox=f.getchannel("A").point(lambda a:255 if a>8 else 0).getbbox()
     assert bbox and min(bbox[0],bbox[1],512-bbox[2],512-bbox[3])>=30,(action,i,bbox)
     buff=BytesIO();f.save(buff,"PNG",optimize=True);p=buff.getvalue()
     unique.add(sha(p))
     frames.append((p,f))
   assert len(unique)>=11,(action,len(unique))
   with Image.open(BytesIO(gb)) as im:check(im,(512,512),12)
   with Image.open(BytesIO(pb)) as im:assert im.width>500 and im.height>500
   manifest={"schema":"capture-creature-animation-v1","creatureId":"ailevent","view":"opponent",
      "action":action,"frameCount":12,"frameSize":[512,512],"frameMs":100,
      "playbackMode":play,"sourceArchive":"_incoming/"+ZIP,"sourceArchiveSha256":HASH,
      "extractionSource":"approved animated WebP previews (lossy, 512x512); PNGs preserve decoded frames, not original illustration pixels",
      "frames":[]}
   strip=Image.new("RGBA",(384*12,384),(0,0,0,0))
   for i,(p,f) in enumerate(frames):
    rel=f"frames/ailevent_{action}_opponent_{i+1:02d}.png"
    outputs[dest/rel]=p
    manifest["frames"].append({"index":i,"file":rel,"sha256":sha(p)})
    strip.alpha_composite(f.resize((384,384),Image.Resampling.LANCZOS),(384*i,0))
   atlasbuf=BytesIO();strip.save(atlasbuf,"WEBP",quality=95,method=4)
   atlas=atlasbuf.getvalue()
   atlasrel=f"atlases/ailevent_{action}_opponent_12_atlas.webp"
   outputs[dest/atlasrel]=atlas
   manifest["atlas"]={"file":atlasrel,"format":"sprite-strip","frameCount":12,"frameWidth":384,"frameHeight":384,"sha256":sha(atlas)}
   previews={}
   for kind,data,ext in [("gif",gb,"gif"),("webp",wb,"webp"),("planche",pb,"png")]:
    rel=f"previews/ailevent_{action}_opponent_12_{kind}.{ext}"
    outputs[dest/rel]=data;previews[kind]=rel
   manifest["preview"]=previews["gif"];manifest["previews"]=previews
   outputs[dest/(action+".manifest.json")]=(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n").encode()
   aid=f"pack:capture:creature-ailevent-{action}-opponent-12-v1"
   assert aid not in existing
   add.append({"id":aid,"label":f"Ailevent — {'vol' if action=='movement' else 'attaque'} vue adversaire / face (12 frames)",
     "assetType":"sprite","mediaType":"image","category":"creature",
     "tags":["capture","creature","ailevent","air","flying","animated","opponent","face",action],
     "source":{"scope":"pack","packId":"capture","author":"GenSrpG / preview approuvée 2026-10-25","license":"project-internal"},
     "resource":{"file":f"capture/creatures/ailevent/animations/{action}/opponent/{atlasrel}","format":"sprite-strip","mime":"image/webp","frameCount":12,"frameMs":100,"playbackMode":play},
     "compatibility":{"uses":["combat","capture","editor"]}})
 assert len(outputs)==34,len(outputs)
 assert all(not p.exists() for p in outputs)
 for p,data in outputs.items():
  p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
 cat["assets"].extend(add)
 for k in ("assets","sprites","creatures"):cat["counts"][k]+=2
 CAT.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n","utf8")
 test=R/"tests/unit/ailevent-face12-assets.test.mjs"
 assert not test.exists()
 shutil.copyfile(R/"scripts/ailevent-face12.test.template.mjs",test)
 journal=R/"docs/LAB_CURRENT_WORK.md"
 journal.write_text(
  "## 2026-10-25 — Ailevent adversaire face : 12f vol + 12f attaque\n\n"
  "- Source originale déposée : _incoming/"+ZIP+" ; SHA256 "+HASH+" ; blob GitHub 2ecfa7695a5fc3bcdb9163187cd73f914045ef78.\n"
  "- Précision : le ZIP contient seulement deux planches et les GIF/WebP animés (pas de PNG individuels). Les 24 PNG ont donc été extraits des WebP animés approuvés, **sans prétendre reconstituer les pixels des illustrations sources**.\n"
  "- Catalogue unique global-assets ; base aad3a3b5fa71edad546f53fb9918b263fb1b2280 ; checkpoint checkpoint/global-assets-before-ailevent-face-2026-10-25 ; work/global-assets-ailevent-face-2026-10-25.\n"
  "- Deux animations view=opponent ; 24 PNG RGBA 512px, 2 strips WebP, previews GIF/WebP/planche, manifestes. Runtime opponent/player, animations dos, autres créatures, moteur et UI protégés. Aucun auto-raccord de la fiche auteur.\n"
  "- Gates : SHA ZIP, contrôle 12 frames alpha/marges, CI finale sur vrais médias, revue diff, checkpoint GREEN, fast-forward global-assets ; test mobile distinct.\n\n---\n\n"+journal.read_text("utf8"),"utf8")
 print("OK Ailevent face: 24 PNG decoded from animated WebP previews, 2 atlases, 6 previews, 2 manifests, catalog +2")
if __name__=="__main__":main()
