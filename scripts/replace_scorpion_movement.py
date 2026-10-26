from pathlib import Path
from PIL import Image
import zipfile,io,json,hashlib
src=Path("scorpion_course_corrigee_8_frames_depot.zip")
assert src.exists()
with zipfile.ZipFile(src) as z:
 assert z.testzip() is None
 names=z.namelist()
 print("ARCHIVE",names,flush=True)
 pngs=sorted(n for n in names if n.lower().endswith(".png"))
 assert len(pngs)==8,("Expected exactly 8 PNG frames",pngs)
 dest=Path("assets/library/capture/creatures/scorpion/animations/movement/opponent")
 (dest/"frames").mkdir(parents=True,exist_ok=True)
 frames=[]
 for i,n in enumerate(pngs,1):
  im=Image.open(io.BytesIO(z.read(n))).convert("RGBA")
  assert im.size==(512,512),(n,im.size)
  frames.append(im)
  im.save(dest/"frames"/f"scorpion_movement_opponent_{i:02d}.png",optimize=True)
 (dest/"atlases").mkdir(exist_ok=True)
 atlas=Image.new("RGBA",(4096,512))
 for i,im in enumerate(frames):atlas.alpha_composite(im,(i*512,0))
 atlas.save(dest/"atlases"/"scorpion_movement_opponent_8_atlas.webp",lossless=True,method=5)
 (dest/"previews").mkdir(exist_ok=True)
 frames[0].save(dest/"previews"/"scorpion_movement_opponent_8_preview.webp",save_all=True,append_images=frames[1:],duration=130,loop=0,lossless=True)
 (dest/"movement.manifest.json").write_text(json.dumps({"action":"movement","view":"opponent","frames":8,"source":src.name,"sha256":hashlib.sha256(src.read_bytes()).hexdigest()},indent=2)+"\n")
 cat=json.loads(Path("data/assets/catalog/global-visual-assets.v1.json").read_text())
 id="pack:capture:scorpion-movement-opponent-8-v1"
 assert sum(a["id"]==id for a in cat["assets"])==1
 assert any(a["id"]=="pack:capture:scorpion-attack-opponent-8-v1" for a in cat["assets"])
 print("SUCCESS: updated 8 course frames; catalog IDs unchanged")
