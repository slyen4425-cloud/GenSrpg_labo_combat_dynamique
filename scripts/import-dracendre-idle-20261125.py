#!/usr/bin/env python3
"""Promote ONLY the two existing validated Dracendre/Braisombre Rigby idle GIFs."""
import hashlib, io, json, sys
from pathlib import Path
from PIL import Image

CANON=Path(sys.argv[1]).resolve()
ARTIFACT=Path(sys.argv[2]).resolve()
CAT=CANON/"data/assets/catalog/global-visual-assets.v1.json"
EXPECTED={
 "face":("opponent","f65b7bf068d04a7dda64748a3e12a8ae8c70f65432ccaa0ff46c31b9b8beaf46"),
 "dos":("player","164f839b07d537e84755eff03e54711694d4701a5aceaf5ff4c89b4cdf767275")
}
def digest(value):return hashlib.sha256(value).hexdigest()
catalog=json.loads(CAT.read_text(encoding="utf-8"))
assert catalog["storage"]["branch"]=="global-assets"
assert catalog["counts"]["assets"]==len(catalog["assets"])
byid={a["id"]:a for a in catalog["assets"]}
assert len(byid)==len(catalog["assets"])
assert all(f"pack:capture:creature-braisombre-{view}-01" in byid for view in ("opponent","player"))
written=[]
for view,(role,expected) in EXPECTED.items():
 src=ARTIFACT/"dracendre"/view/"idle"/"preview.gif"
 raw=src.read_bytes()
 assert digest(raw)==expected,(view,"unexpected source GIF")
 with Image.open(io.BytesIO(raw)) as image:
  assert image.format=="GIF" and image.size==(512,512) and image.n_frames==12
  assert image.info.get("loop")==0
  for index in range(12):
   image.seek(index)
   assert image.info.get("duration") in (80,90)
   bbox=image.convert("RGBA").getchannel("A").getbbox()
   assert bbox and min(bbox[0],bbox[1],512-bbox[2],512-bbox[3])>=42
 asset_id=f"pack:capture:creature-braisombre-idle-{role}-gif-v1"
 rel=f"capture/creatures/braisombre/animations/idle/{role}/braisombre_idle_{view}.gif"
 dst=CANON/"assets/library"/rel
 if asset_id in byid:
  assert byid[asset_id]["resource"]["file"]==rel
  assert dst.exists() and digest(dst.read_bytes())==expected
  continue
 assert not dst.exists(),("refuse overwrite",rel)
 dst.parent.mkdir(parents=True,exist_ok=True)
 dst.write_bytes(raw)
 asset={"id":asset_id,"label":f"Dracendre (Braisombre) — idle {view.upper()} (GIF)",
   "assetType":"sprite","mediaType":"image","category":"creature",
   "tags":["capture","creature","idle","animated",role,"dracendre","braisombre"],
   "source":{"scope":"pack","packId":"capture","author":"GenSRPG / Rigby2D",
             "license":"project-internal"},
   "resource":{"file":rel,"format":"animated-image","mime":"image/gif",
               "frameCount":1,"playbackMode":"loop"},
   "compatibility":{"uses":["combat","capture","editor"]}}
 catalog["assets"].append(asset)
 byid[asset_id]=asset
 written.append(asset_id)
catalog["counts"]["assets"]=len(catalog["assets"])
catalog["counts"]["sprites"]+=len(written)
assert len(byid)==len(catalog["assets"])
CAT.write_text(json.dumps(catalog,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
print(json.dumps({"added":written,"total":catalog["counts"]["assets"],
                  "gif_sha256":{k:v[1] for k,v in EXPECTED.items()}},ensure_ascii=False))
