#!/usr/bin/env python3
"""Import artist-approved Ailevent back animations and replace ONLY player model."""
import io, zipfile,hashlib,json,pathlib,shutil
from PIL import Image
R=pathlib.Path(__file__).resolve().parents[1]
ZIP="AILEVENT_DOS_2_ANIMATIONS_PLUS_MODELE_JOUEUR.zip"
SHA="5a72b3644c8bc99ffe7f00c39f51551398824ca0d2651f9f6d7bea4f4cd25ee8"
ROOT="AILEVENT_DOS_PACKAGE_VALIDEE/"
BASE=R/"assets/library/capture/creatures/ailevent"
CAT=R/"data/assets/catalog/global-visual-assets.v1.json"
def sha(b):return hashlib.sha256(b).hexdigest()
def check(im,size,mode=None,frames=1):
 assert im.size==size,(im.size,size)
 if mode:assert im.mode==mode,(im.mode,mode)
 assert getattr(im,"n_frames",1)==frames
 im.load()
 if frames>1:im.seek(frames-1);im.load()
def main():
 raw=(R/"_incoming"/ZIP).read_bytes()
 assert len(raw)==13416024 and sha(raw)==SHA
 cat=json.loads(CAT.read_text(encoding="utf8"));assert len(cat["assets"])==cat["counts"]["assets"]
 existing={a["id"] for a in cat["assets"]};assert len(existing)==len(cat["assets"])
 outputs={};added=[]
 with zipfile.ZipFile(io.BytesIO(raw)) as z:
  assert z.testzip() is None and len(z.namelist())==35
  image=z.read(ROOT+"MODELE_JOUEUR_REMPLACEMENT/ailevent_player_model.png")
  assert sha(image)=="ab45843596adba23fd2b20a8383deb938ae7baed254e3205c853f761f7af9324"
  with Image.open(io.BytesIO(image)) as im:
   check(im,(1254,1254),"RGBA")
   player=im.convert("RGBA")
   # Runtime original uses compact display size; preserve exact source geometry, no artistic edits.
   player=player.resize((320,320),Image.Resampling.LANCZOS)
   b=io.BytesIO();player.save(b,"WEBP",quality=95,method=6)
   model_webp=b.getvalue()
  outputs[BASE/"runtime"/"ailevent_player.webp"]=model_webp
  outputs[BASE/"sources"/"ailevent_player_approved_2026-10-25.png"]=image
  for action,folder,n,mode in [("movement","MOUVEMENT_10F",10,"loop"),("attack","ATTAQUE_12F",12,"once")]:
   dest=BASE/"animations"/action/"player"
   manifest={"schema":"capture-creature-animation-v1","creatureId":"ailevent",
     "action":action,"view":"player","frameCount":n,"frameSize":[512,512],
     "frameMs":100,"playbackMode":mode,"sourceArchive":ZIP,
     "sourceArchiveSha256":SHA,"sourceModelSha256":sha(image),"frames":[]}
   hashes=set()
   for i in range(1,n+1):
    name=f"{ROOT}{folder}/"+(f"ailevent_dos_vol_{i:02d}.png" if action=="movement" else f"ailevent_dos_attaque_{i:02d}.png")
    data=z.read(name)
    with Image.open(io.BytesIO(data)) as im:
     check(im,(512,512),"RGBA")
     mn,mx=im.getchannel("A").getextrema();assert mn==0 and mx>100
    h=sha(data);hashes.add(h)
    rel=f"frames/ailevent_{action}_player_{i:02d}.png"
    outputs[dest/rel]=data
    manifest["frames"].append({"index":i-1,"file":rel,"sha256":h})
   assert len(hashes)>=n-1,(action,len(hashes))
   atlas=z.read(f"{ROOT}{folder}/atlas.webp")
   with Image.open(io.BytesIO(atlas)) as im:
    check(im,(n*384,384),"RGBA")
   rel=f"atlases/ailevent_{action}_player_{n}_atlas.webp"
   outputs[dest/rel]=atlas
   manifest["atlas"]={"file":rel,"format":"sprite-strip","frameCount":n,"frameWidth":384,"frameHeight":384,"sha256":sha(atlas)}
   previews={}
   prefix=("AILEVENT_DOS_VOL_10F_NETTOYE_" if action=="movement" else "AILEVENT_DOS_ATTAQUE_12F_")
   for ext,kind in [("gif","gif"),("webp","webp"),("png","planche")]:
    original=prefix+("PLANCHE.png" if kind=="planche" else "PREVIEW."+ext)
    data=z.read(f"{ROOT}{folder}/{original}")
    with Image.open(io.BytesIO(data)) as im:
     assert getattr(im,"n_frames",1)==(1 if kind=="planche" else n), (original,im.n_frames)
    destrel=f"previews/ailevent_{action}_player_{n}_{kind}.{ext}"
    outputs[dest/destrel]=data;previews[kind]=destrel
   manifest["previews"]=previews;manifest["preview"]=previews["gif"]
   outputs[dest/(action+".manifest.json")]=(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n").encode()
   aid=f"pack:capture:creature-ailevent-{action}-player-{n}-v1"
   assert aid not in existing
   added.append({"id":aid,"label":f"Ailevent — {'vol' if action=='movement' else 'attaque'} vue joueur / dos ({n} frames)",
      "assetType":"sprite","mediaType":"image","category":"creature",
      "tags":["capture","creature","ailevent","air","flying","animated","player","dos",action],
      "source":{"scope":"pack","packId":"capture","author":"GenSrpG / source approuvée 2026-10-25","license":"project-internal"},
      "resource":{"file":f"capture/creatures/ailevent/animations/{action}/player/{rel}","format":"sprite-strip","mime":"image/webp","frameCount":n,"frameMs":100,"playbackMode":mode},
      "compatibility":{"uses":["combat","capture","editor"]}})
  assert len(outputs)==(2+10+1+3+1+12+1+3+1)
  assert all(not p.exists() for p in outputs if p.name!="ailevent_player.webp")
  for p,data in outputs.items():
   p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
  cat["assets"].extend(added)
  for key in ("assets","sprites","creatures"):cat["counts"][key]+=2
  CAT.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
  meta=BASE/"ailevent.meta.json"
  mj=json.loads(meta.read_text(encoding="utf8"));mj["visualRevision"]="player-model-approved-2026-10-25"
  meta.write_text(json.dumps(mj,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
  test=R/"tests/unit/ailevent-player12-assets.test.mjs"
  shutil.copyfile(R/"scripts/ailevent-player.test.template.mjs",test)
  journal=R/"docs/LAB_CURRENT_WORK.md"
  journal.write_text(
     "## 2026-10-25 — Ailevent joueur dos (10f vol / 12f attaque, remplacement image joueur)\n\n"
     "- Source : _incoming/"+ZIP+" ; SHA256 "+SHA+" ; Git blob aa635e35374b685fa6d8bc2e507317e6779f0af7.\n"
     "- Base : global-assets@6b3162ec087c3e2b46f03cdb7fc905ee7c24e13a ; checkpoint/global-assets-before-ailevent-dos-2026-10-25 ; work/global-assets-ailevent-dos-2026-10-25.\n"
     "- 22 PNG RGBA 512px, deux atlas WebP, previews d'origine, deux manifestes, source modèle PNG identique à l'image validée, nouveau runtime player WebP. Deux IDs catalogue.\n"
     "- Protégés : opponent/icon, autres créatures, animations déjà validées, moteurs, UI, données auteur, main, gh-pages. Validation mobile distincte.\n\n---\n\n"
     + journal.read_text(encoding="utf8"), encoding="utf8")
 print("Imported Ailevent player back 10+12 sprites, real previews and replacement model")
if __name__=="__main__":main()
