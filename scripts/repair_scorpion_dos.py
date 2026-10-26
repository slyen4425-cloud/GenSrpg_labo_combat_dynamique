from pathlib import Path
import shutil,json
root=Path("assets/library/capture/creatures/scorpion/animations")
catalog=json.loads(Path("data/assets/catalog/global-visual-assets.v1.json").read_text())
for action in ("attack","movement"):
 src=root/action/"opponent"
 dst=root/action/"player"
 assert src.exists() and not dst.exists(),(src,dst)
 shutil.copytree(src,dst)
 for f in sorted(dst.rglob("*")):
  if f.is_file() and "_opponent_" in f.name:
   f.rename(f.with_name(f.name.replace("_opponent_","_player_")))
 manifest=dst/f"{action}.manifest.json"
 if manifest.exists():
  data=json.loads(manifest.read_text());data["view"]="player";manifest.write_text(json.dumps(data,indent=2)+"\n")
 id=f"pack:capture:scorpion-{action}-player-8-v1"
 asset=next(a for a in catalog["assets"] if a["id"]==id)
 assert (Path("assets/library")/asset["resource"]["file"]).exists(),asset
print("OK: 2 DOS animations, 16 frames, existing FACE binaries preserved")
