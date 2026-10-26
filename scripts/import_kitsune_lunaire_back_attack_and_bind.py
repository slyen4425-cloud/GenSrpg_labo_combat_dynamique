#!/usr/bin/env python3
"""Import user-supplied seven-frame back attack without inventing frames."""
import pathlib,subprocess,zipfile,io,json,hashlib
from PIL import Image
R=pathlib.Path(__file__).resolve().parents[1]
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
 raw=subprocess.check_output(["git","show","origin/main:monster_capture_attaque_7_frames.zip"],cwd=R)
 with zipfile.ZipFile(io.BytesIO(raw)) as z:
  assert z.testzip() is None
  paths=[f"attaque/frame_{i:02d}.png" for i in range(1,8)]
  assert set(z.namelist())==set(paths+["preview_attaque_7_frames.webp"])
  base=R/"assets/library/capture/creatures/creature_lunaire/animations/attack/player"
  images=[]
  for i,p in enumerate(paths,1):
   data=z.read(p)
   with Image.open(io.BytesIO(data)) as im:
    assert im.size==(512,512) and im.mode=="RGBA",(p,im.size,im.mode)
    assert im.getchannel("A").getextrema()[0]==0
    images.append(im.copy())
   dest=base/"frames"/f"creature_lunaire_attack_player_{i:02d}.png"
   dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
  atlas=Image.new("RGBA",(7*512,512))
  for i,im in enumerate(images):atlas.alpha_composite(im,(i*512,0))
  atlaspath=base/"atlases/creature_lunaire_attack_player_7_atlas.webp"
  atlaspath.parent.mkdir(parents=True,exist_ok=True);atlas.save(atlaspath,"WEBP",lossless=True,method=6)
  preview=z.read("preview_attaque_7_frames.webp")
  with Image.open(io.BytesIO(preview)) as p:assert p.n_frames==7,p.n_frames
  prev=base/"previews/creature_lunaire_attack_player_7_preview.webp"
  prev.parent.mkdir(parents=True,exist_ok=True);prev.write_bytes(preview)
  manifest={"schema":"capture-creature-animation-v1","creatureId":"creature_lunaire","action":"attack","view":"player","frameCount":7,"frameSize":[512,512],"frameMs":110,"playbackMode":"once","sourceArchive":"monster_capture_attaque_7_frames.zip","sourceArchiveSha256":sha(raw),"frames":[{"index":i-1,"file":f"frames/creature_lunaire_attack_player_{i:02d}.png","sha256":sha(z.read(paths[i-1]))} for i in range(1,8)],"atlas":{"file":"atlases/"+atlaspath.name,"format":"sprite-strip","frameCount":7,"frameWidth":512,"frameHeight":512},"preview":"previews/"+prev.name}
  (base/"attack.manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
  catpath=R/"data/assets/catalog/global-visual-assets.v1.json"
  cat=json.loads(catpath.read_text())
  aid="pack:capture:creature-lunaire-attack-player-7-v1"
  assert aid not in {a["id"] for a in cat["assets"]}
  cat["assets"].append({"id":aid,"label":"Kitsune Lunaire attaque dos 7f","assetType":"sprite","mediaType":"image","category":"creature","tags":["capture","creature","lunaire","animated","player","attack"],"source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},"resource":{"file":"capture/creatures/creature_lunaire/animations/attack/player/atlases/"+atlaspath.name,"format":"sprite-strip","mime":"image/webp","frameCount":7,"frameMs":110,"playbackMode":"once"},"compatibility":{"uses":["combat","capture","editor"]}})
  for k in ("assets","sprites","creatures"):cat["counts"][k]+=1
  catpath.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n")
  # Restore the authoritative showcase entry from the published laboratory and bind all 4.
  target=R/"data/capture/showcase/kitsune_lunaire.capture-creature-transfer-v1.json"
  assert not target.exists(),"Do not overwrite existing showcase author data"
  original=subprocess.check_output(["git","show","origin/gh-pages:"+target.relative_to(R).as_posix()],cwd=R)
  entry=json.loads(original)
  visual=entry["draft"]["presentation"]["visual"]
  for key,asset,frames in [
   ("movement","pack:capture:creature-lunaire-movement-opponent-8-v1",8),
   ("movementBack","pack:capture:creature-lunaire-movement-player-8-v1",8),
   ("rangedAttack","pack:capture:creature-lunaire-attack-opponent-8-v1",8),
   ("rangedAttackBack","pack:capture:creature-lunaire-attack-player-7-v1",7)]:
   visual[key]={"assetId":asset,"mode":"sprite","displayScale":1,"rotationTurns":0,"frameCount":frames,"transitionMs":110}
  visual["movementPlayback"]={"frameMs":110,"mode":"loop"}
  visual["rangedAttackPlayback"]={"frameMs":110,"mode":"once"}
  target.parent.mkdir(parents=True,exist_ok=True)
  target.write_text(json.dumps(entry,ensure_ascii=False,indent=2)+"\n")
  print("IMPORTED FOUR LUNAR ANIMATIONS, BOUND AUTHOR SHOWCASE; back attack has 7 real frames")
if __name__=="__main__":main()
