#!/usr/bin/env python3
"""Remove only the rogue fragment above the official player's mane.

Strictly preserves every decoded RGBA pixel outside the bounded review polygon.
Backups available through checkpoint branch; no ID or gameplay changes.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np,hashlib,json

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/"assets/library/capture/creatures/loup_volcanique"
TARGET=BASE/"runtime/loup_volcanique_player.webp"
META=BASE/"loup_volcanique.meta.json"
REPORT=BASE/"player_cleanup_2026_10_20"
REPORT.mkdir(exist_ok=True,parents=True)
OLD_IMAGE=Image.open(TARGET).convert("RGBA")
if OLD_IMAGE.size!=(320,320):raise ValueError("unexpected source shape")
old=np.asarray(OLD_IMAGE).copy()
polygon=[(223,78),(233,79),(244,89),(253,102),
         (249,108),(238,111),(221,103),(217,91)]
mask=Image.new("L",(320,320),0)
ImageDraw.Draw(mask).polygon(polygon,fill=255)
r=(np.asarray(mask)>0)
out=old.copy()
out[r,:]=0
removed=int(np.count_nonzero((old[:,:,3]>0)&r))
if not 350<=removed<=520:
    raise ValueError(f"candidate changed unexpectedly: {removed}")
im=Image.fromarray(out,"RGBA")
# Fully lossless WebP so surviving pixels do not become lossy/compressed
# and the alpha mask can be bit-accurate outside the polygon.
im.save(TARGET,format="WEBP",lossless=True,method=6,exact=True)
roundtrip=np.asarray(Image.open(TARGET).convert("RGBA"))
if not np.array_equal(roundtrip[~r],old[~r]):
    idx=np.count_nonzero(np.any(roundtrip[~r]!=old[~r],axis=1))
    raise ValueError(f"Out-of-mask difference in original pixels: {idx}")
if not np.array_equal(roundtrip[r],out[r]):
    raise ValueError("Removed region has nonzero new pixels")
j=json.loads(META.read_text(encoding="utf-8"))
if j["assetIds"]["player"]!="pack:capture:creature-loup-volcanique-player-01":
    raise ValueError("Wrong canonical author ID")
j["visualRevision"]="validated-front-back-opponent-fix-2026-09-27+player-artifact-clean-2026-10-20"
j.setdefault("notes","")
j["notes"] += " Nettoyage ciblé de l'artefact de roche au-dessus de la crinière joueur (20/10/2026) ; vue et identité inchangées."
META.write_text(json.dumps(j,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
OLD_IMAGE.save(REPORT/"before.png")
im.save(REPORT/"after.png")
(REPORT/"cleanup_report.json").write_text(json.dumps({
  "assetId":j["assetIds"]["player"],"cleanedArtifact":"dark detached shard above player mane",
  "source":"official 320x320 player.webp","removedNonTransparentPixels":removed,
  "polygon":polygon,"pixelPerfectOutsidePolygon":True,
  "faceViewUntouched":True,"iconUntouched":True,
  "otherAssetIdsUnchanged":True,
  "sha256":hashlib.sha256(TARGET.read_bytes()).hexdigest()
},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"Cleaned {removed} source pixels, all other pixels bit-identical; canonical runtime WebP updated.")
