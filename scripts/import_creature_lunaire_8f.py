#!/usr/bin/env python3
"""Import approved 8f lunar creature animations without touching existing assets."""
import io,zipfile,hashlib,json,pathlib
from PIL import Image
R=pathlib.Path(__file__).resolve().parents[1]
ZIP="CREATURE_LUNAIRE_COURSE_ATTAQUE_8F_GITHUB.zip"
SRC=R/"_incoming"/ZIP
BASE=R/"assets/library/capture/creatures/creature_lunaire"
CAT=R/"data/assets/catalog/global-visual-assets.v1.json"
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
 raw=SRC.read_bytes()
 assert len(raw)==4576175, "Source archive changed"
 with zipfile.ZipFile(io.BytesIO(raw)) as z:
  assert z.testzip() is None
  names=set(z.namelist())
  assert "manifest.json" in names and "README_DEPOT.txt" in names
  cat=json.loads(CAT.read_text(encoding="utf8"))
  ids={a["id"] for a in cat["assets"]}
  assert len(ids)==len(cat["assets"])==cat["counts"]["assets"]
  entries=[]
  for action,folder,mode in (("movement","course","loop"),("attack","attaque","once")):
   dest=BASE/"animations"/action/"opponent"
   frames=[]
   for i in range(1,9):
    src=f"{folder}/frames/{folder}_{i:02d}.png"
    assert src in names,src
    data=z.read(src)
    with Image.open(io.BytesIO(data)) as im:
     assert im.size==(512,512) and im.mode=="RGBA",(src,im.size,im.mode)
     a=im.getchannel("A"); lo,hi=a.getextrema()
     assert lo==0 and hi>100,src
     frames.append(im.copy())
    out=dest/"frames"/f"creature_lunaire_{action}_opponent_{i:02d}.png"
    out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(data)
   assert len({sha(z.read(f"{folder}/frames/{folder}_{i:02d}.png")) for i in range(1,9)})==8
   # Lossless RGBA atlas: actual approved source frames, 8 x 512, no redraw.
   atlas=Image.new("RGBA",(4096,512),(0,0,0,0))
   for j,im in enumerate(frames):atlas.alpha_composite(im,(j*512,0))
   atlas_path=dest/"atlases"/f"creature_lunaire_{action}_opponent_8_atlas.webp"
   atlas_path.parent.mkdir(parents=True,exist_ok=True)
   atlas.save(atlas_path,"WEBP",lossless=True,method=6)
   with Image.open(atlas_path) as chk:assert chk.size==(4096,512)
   preview_src=f"{folder}/preview.webp"
   assert preview_src in names
   preview=z.read(preview_src)
   with Image.open(io.BytesIO(preview)) as im:
    assert im.n_frames==8,(preview_src,im.n_frames)
   prev=dest/"previews"/f"creature_lunaire_{action}_opponent_8_preview.webp"
   prev.parent.mkdir(parents=True,exist_ok=True);prev.write_bytes(preview)
   manifest={"schema":"capture-creature-animation-v1","creatureId":"creature_lunaire",
    "action":action,"view":"opponent","frameCount":8,"frameSize":[512,512],
    "frameMs":110,"playbackMode":mode,"sourceArchive":ZIP,
    "sourceArchiveSha256":sha(raw),
    "frames":[{"index":i-1,"file":f"frames/creature_lunaire_{action}_opponent_{i:02d}.png",
      "sha256":sha(z.read(f"{folder}/frames/{folder}_{i:02d}.png"))} for i in range(1,9)],
    "atlas":{"file":f"atlases/{atlas_path.name}","format":"sprite-strip","frameCount":8,"frameWidth":512,"frameHeight":512},
    "preview":f"previews/{prev.name}"}
   (dest/(action+".manifest.json")).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
   aid=f"pack:capture:creature-lunaire-{action}-opponent-8-v1"
   assert aid not in ids,aid
   entries.append({"id":aid,"label":f"Créature lunaire — {action} adversaire (8 frames)",
    "assetType":"sprite","mediaType":"image","category":"creature",
    "tags":["capture","creature","lunaire","animated","opponent",action],
    "source":{"scope":"pack","packId":"capture","author":"GenSrpG / approuvé 2026-10-25","license":"project-internal"},
    "resource":{"file":f"capture/creatures/creature_lunaire/animations/{action}/opponent/atlases/{atlas_path.name}",
      "format":"sprite-strip","mime":"image/webp","frameCount":8,"frameMs":110,"playbackMode":mode},
    "compatibility":{"uses":["combat","capture","editor"]}})
  cat["assets"].extend(entries)
  for k in ("assets","sprites","creatures"):cat["counts"][k]+=2
  CAT.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
  doc=R/"docs/LAB_CURRENT_WORK.md"
  doc.write_text("## 2026-10-25 — Créature lunaire : course et attaque 8f, vue adversaire\n\n"
   "- Source validée : _incoming/"+ZIP+" ; SHA256 "+sha(raw)+".\n"
   "- Branche : work/global-assets-creature-lunaire-8f-2026-10-25 ; base checkpoint/global-assets-ailevent-dos-green-2026-10-25.\n"
   "- 16 PNG RGBA 512px conservés, deux atlas WebP sans perte, deux previews originales, deux manifestes et deux IDs de catalogue.\n"
   "- Protégés : autres créatures, runtime modèles, réglages auteur, moteur, UI, main et gh-pages.\n"
   "- Aucune affectation automatique à une fiche de créature : l'identifiant métier définitif reste à confirmer.\n"
   "- CI et revue finale requises avant publication global-assets.\n\n---\n\n"
   +doc.read_text(encoding="utf8"),encoding="utf8")
 print("OK imported approved lunar creature movement and attack, 8f each")
if __name__=="__main__":main()
