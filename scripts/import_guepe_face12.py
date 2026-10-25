#!/usr/bin/env python3
"""Import exact cleaned FACE cybernetic wasp sprites from user-uploaded ZIP."""
import hashlib,io,json,pathlib,zipfile,shutil
from PIL import Image
R=pathlib.Path(__file__).resolve().parents[1]
ZIP="GUEPE_CYBERNETIQUE_FACE_MOUVEMENT_ATTAQUE_12F_NETTOYES.zip"
SHA="082eb38273f46f306fef3076bfac287985a3bc38d057e00c8e5e51a04a48b4fa"
P="GUEPE_CYBERNETIQUE_FACE_12F_ARTEFACTS_CORRIGES/"
DEST=R/"assets/library/capture/creatures/guepe_cybernetique/animations"
CAT=R/"data/assets/catalog/global-visual-assets.v1.json"
def digest(b):return hashlib.sha256(b).hexdigest()
def main():
 data=(R/"_incoming"/ZIP).read_bytes()
 assert len(data)==11948531 and digest(data)==SHA
 cat=json.loads(CAT.read_text(encoding="utf8"))
 assert cat["counts"]["assets"]==len(cat["assets"])
 existing={a["id"] for a in cat["assets"]};assert len(existing)==len(cat["assets"])
 outputs={};added=[]
 with zipfile.ZipFile(io.BytesIO(data)) as z:
  assert z.testzip() is None and len(z.namelist())==33
  source=json.loads(z.read(P+"manifest.json"))
  assert "remove detached glow fragments" in source["correction"]
  outputs[DEST/"sources"/"guepe_face12_cleaning_manifest.json"]=z.read(P+"manifest.json")
  for action,fr,mode in [("movement","mouvement","loop"),("attack","attaque","once")]:
   orig=source["sprites"][fr]
   assert orig["count"]==12 and orig["canvas"]==[512,512]
   assert orig["playback_mode"]==mode
   target=DEST/action/"opponent"
   aid=f"pack:capture:creature-guepe-cybernetique-{action}-opponent-12-v1"
   assert aid not in existing
   manifest={"schema":"capture-creature-animation-v1","creatureId":"guepe_cybernetique",
     "action":action,"view":"opponent","assetId":aid,"frameCount":12,
     "frameSize":[512,512],"frameMs":100,"playbackMode":mode,
     "authorApproved":True,"approvalStatus":"approved_for_ingame_trial",
     "sourceArchive":"_incoming/"+ZIP,"sourceArchiveSha256":SHA,
     "cleanup":"left detached glows removed by author-approved source",
     "frames":[]}
   unique=set()
   for i in range(1,13):
    src=f"{P}{fr}/frames/guepe_face_{fr}_{i:02d}.png"
    raw=z.read(src)
    with Image.open(io.BytesIO(raw)) as im:
     assert im.size==(512,512) and im.mode=="RGBA"
     alpha=im.getchannel("A")
     mn,mx=alpha.getextrema()
     assert mn==0 and mx>=250
     bbox=alpha.point(lambda v:255 if v>8 else 0).getbbox()
     assert bbox is not None
     margins=[bbox[0],bbox[1],512-bbox[2],512-bbox[3]]
     assert min(margins)>=65, (src,margins)
    h=digest(raw);assert h==orig["frames"][i-1]["sha256"] and h not in unique
    unique.add(h)
    rel=f"frames/guepe_cybernetique_{action}_opponent_{i:02d}.png"
    outputs[target/rel]=raw
    manifest["frames"].append({"index":i-1,"file":rel,"sha256":h,"marginsLTRB":margins})
   assert len(unique)==12
   atlas=z.read(orig["atlas"])
   with Image.open(io.BytesIO(atlas)) as im:
    assert im.format=="WEBP" and im.size==(4608,384)
   atlasrel=f"atlases/guepe_cybernetique_{action}_opponent_12_atlas.webp"
   outputs[target/atlasrel]=atlas
   manifest["atlas"]={"file":atlasrel,"format":"sprite-strip","frameCount":12,"frameWidth":384,"frameHeight":384,"sha256":digest(atlas)}
   previews={}
   for kind in ("gif","webp","planche"):
    src=orig[{"gif":"gif_preview","webp":"webp_preview","planche":"planche"}[kind]]
    b=z.read(src)
    with Image.open(io.BytesIO(b)) as im:
     if kind=="planche": assert im.size==(2288,1728)
     else: assert im.size==(384,384) and im.n_frames==12
    ext="png" if kind=="planche" else kind
    rel=f"previews/guepe_cybernetique_{action}_opponent_12_{kind}.{ext}"
    outputs[target/rel]=b;previews[kind]=rel
   manifest["previews"]=previews;manifest["preview"]=previews["gif"]
   outputs[target/(action+".manifest.json")]=(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n").encode()
   added.append({"id":aid,"label":f"Guêpe cybernétique — {'vol / déplacement' if action=='movement' else 'attaque'} face (12 frames nettoyées)","assetType":"sprite","mediaType":"image","category":"creature",
    "tags":["capture","creature","guepe-cybernetique","electric","insect","cybernetic",action,"animated","opponent","face"]+(["flight","flying"] if action=="movement" else []),
    "source":{"scope":"pack","packId":"capture","author":"GenSrpG / sprites auteur nettoyés 2026-10-24","license":"project-internal"},
    "resource":{"file":f"capture/creatures/guepe_cybernetique/animations/{action}/opponent/{atlasrel}","format":"sprite-strip","mime":"image/webp","frameCount":12,"frameMs":100,"playbackMode":mode},
    "compatibility":{"uses":["combat","capture","editor"]}})
 assert len(outputs)==35,len(outputs)
 assert all(not p.exists() for p in outputs)
 for p,b in outputs.items():
  p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
 cat["assets"].extend(added)
 for k in ("assets","sprites","creatures"):cat["counts"][k]+=2
 CAT.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
 test=R/"tests/unit/guepe-face12-assets.test.mjs"
 assert not test.exists()
 shutil.copyfile(R/"scripts/guepe-face12.test.template.mjs",test)
 journal=R/"docs/LAB_CURRENT_WORK.md"
 note=f"""## 2026-10-25 — Guêpe cybernétique FACE : nage/vol et attaque, 12 frames nettoyées

- Source : \`_incoming/{ZIP}\`, taille 11948531, SHA256 {SHA}, Git blob c86cd66adedbed199b73d93c9c909eab4556a24c.
- Owner : catalogue unique global-assets ; base d269ac78012feb9f22f5e30abf2b06ba83877d45 ; checkpoint checkpoint/global-assets-before-guepe-face12-2026-10-25 ; branche work/global-assets-guepe-face12-2026-10-25.
- Portée : deux animations Guêpe cybernétique en vue opponent (3/4 face). 24 PNG RGBA 512×512 réels (octets validés par le manifeste auteur), 2 atlas WebP, 6 aperçus et 3 manifestes. Catalogue +2 IDs de sprites, sans modifier les modèles runtime ni les animations player déjà GREEN.
- Protégés : autres créatures, sprites déjà validés, profils, UI, moteur, données auteur, main, gh-pages et GenSrpG. Aucune auto-affectation d'animation à la fiche.
- Gates : import des vrais fichiers, sentinelle SHA/marges/dimensions/transparence, CI finale, revue diff, checkpoint GREEN et fast-forward global-assets ; essai Android distinct.
- Rapport : docs/LAB_GUEPE_FACE12_2026-10-25.md.

---

"""
 journal.write_text(note+journal.read_text(encoding="utf8"),encoding="utf8")
 print("Imported 24 exact PNG / 2 WebP strips / 6 previews / 2 manifests / 1 source manifest and 2 catalog IDs.")
if __name__=="__main__":main()
