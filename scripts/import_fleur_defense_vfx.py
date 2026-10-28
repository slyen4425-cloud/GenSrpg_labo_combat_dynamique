#!/usr/bin/env python3
"""Import the exact uploaded Fleur défense source from the canonical global-assets branch."""
import hashlib, io, json, zipfile
from pathlib import Path
from PIL import Image, ImageChops
ROOT=Path(__file__).resolve().parents[1]
ZIP=ROOT/"assets/library/capture/sprites/skills/fleur_defense_12_frames_512.zip"
DEST=ROOT/"assets/library/capture/sprites/skills/flower_defense"
CATALOG=ROOT/"data/assets/catalog/global-visual-assets.v1.json"
ID="pack:capture:sprite-flower-defense-shield-01"
SHA256="653c5012f182931b4add1bef4641ab8837e749358236dba6b33d5ed0c70f9169"
GIT_BLOB="5f3bb2b288f8fdc4dc9c22bb474dfce13bb9b3c4"
def sha(v): return hashlib.sha256(v).hexdigest()
def main():
 assert ZIP.is_file() and not DEST.exists(), "Uploaded source absent or already imported"
 raw=ZIP.read_bytes()
 assert len(raw)==6249269 and sha(raw)==SHA256 and hashlib.sha1(b"blob "+str(len(raw)).encode()+b"\0"+raw).hexdigest()==GIT_BLOB, "Author ZIP differs from verified source"
 with zipfile.ZipFile(io.BytesIO(raw)) as z:
  assert z.testzip() is None and len(z.infolist())==15, "ZIP CRC/count invalid"
  names={x.filename for x in z.infolist()}
  expected={"manifest.json","fleur_defense_preview_512.webp","fleur_defense_planche_512.png"}|{"frames/fleur_defense_%02d.png"%i for i in range(12)}
  assert names==expected and all(not x.is_dir() for x in z.infolist()), "Unexpected ZIP entries"
  data={x:z.read(x) for x in expected}
 manifest=json.loads(data["manifest.json"])
 assert manifest["type"]=="animation-once-hold-last" and manifest["dimensions"]==[512,512] and manifest["last_frame_hold"] is True
 frames=[data["frames/fleur_defense_%02d.png"%i] for i in range(12)]
 assert manifest["frames"]==["frames/fleur_defense_%02d.png"%i for i in range(12)]
 assert len(set(map(sha,frames)))==12
 images=[]
 for rawframe in frames:
  im=Image.open(io.BytesIO(rawframe))
  assert im.format=="PNG" and im.mode=="RGBA" and im.size==(512,512)
  amin,amax=im.getchannel("A").getextrema()
  assert amin==0 and amax>0
  images.append(im.copy())
 preview=Image.open(io.BytesIO(data["fleur_defense_preview_512.webp"]))
 assert preview.format=="WEBP" and preview.size==(512,512) and preview.n_frames==12
 preview.seek(0)
 assert preview.mode=="RGBA"
 cat=json.loads(CATALOG.read_text(encoding="utf8"))
 assert cat["storage"]["branch"]=="global-assets"
 assert len({a["id"] for a in cat["assets"]})==len(cat["assets"]) and ID not in {a["id"] for a in cat["assets"]}
 DEST.mkdir(parents=True)
 source_hashes={}
 for name,blob in data.items():
  p=DEST/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(blob)
  source_hashes[name]=sha(blob)
 framewebp=[]
 for i,im in enumerate(images):
  b=io.BytesIO();im.save(b,format="WEBP",lossless=True,method=4)
  name="frames_webp/fleur_defense_%02d.webp"%i
  p=DEST/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b.getvalue())
  framewebp.append(name)
 atlas=Image.new("RGBA",(12*512,512))
 for i,im in enumerate(images): atlas.paste(im,(512*i,0))
 atlas_path=DEST/"fleur_defense_atlas_12f.webp"
 atlas.save(atlas_path,format="WEBP",lossless=True,method=4)
 check=Image.open(atlas_path)
 assert check.mode=="RGBA" and check.size==(6144,512)
 for i,im in enumerate(images):
  assert ImageChops.difference(im,check.crop((i*512,0,(i+1)*512,512))).getbbox() is None, "Atlas pixels mismatch"
 seq={"id":ID,"label":"Fleur défensive — fermeture protectrice","frameSize":[512,512],"frame_count":12,"frame_ms":155,"playback_mode":"once","loop":False,"holdLastFrame":True,"holdFrameIndex":11,"holdUntil":"buff-removed","followTarget":True,"frames":framewebp,"sourceFrames":manifest["frames"],"preview":"fleur_defense_preview_512.webp","atlas":{"file":"fleur_defense_atlas_12f.webp","format":"sprite-strip","frameCount":12,"frameWidth":512,"frameHeight":512}}
 (DEST/"sprite_skill_fleur_defense_sequence_01.json").write_text(json.dumps(seq,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
 (DEST/"provenance.json").write_text(json.dumps({"originalArchive":"fleur_defense_12_frames_512.zip","originalArchiveSha256":SHA256,"originalGitBlobSha":GIT_BLOB,"originalFileSha256":source_hashes},ensure_ascii=False,indent=2)+"\n",encoding="utf8")
 (DEST/"README.md").write_text("# Fleur défensive — fermeture protectrice\n\n12 PNG RGBA originaux 512² conservés; 12 WebP lossless individuels, atlas WebP 6144×512 et preview animée source. Lecture once; demande de maintien de la dernière frame pendant le buff, à configurer dans la présentation du skill. Pas de changement de gameplay ni de liaison automatique. Source validée visuellement par l'auteur, avec quelques résidus du corps encore présents sur des images.\n",encoding="utf8")
 cat["assets"].append({"id":ID,"label":"Fleur défensive — fermeture protectrice","assetType":"sprite","mediaType":"image","category":"skill","tags":["capture","skill","nature","defense","flower","shield","animated","hold-last-frame"],"source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},"resource":{"file":"capture/sprites/skills/flower_defense/fleur_defense_atlas_12f.webp","format":"sprite-strip","mime":"image/webp","frameCount":12,"frameMs":155,"playbackMode":"once","holdLastFrame":True},"compatibility":{"uses":["combat","capture","editor"]}})
 cat["counts"]["assets"]=len(cat["assets"]);cat["counts"]["sprites"]=sum(a["assetType"]=="sprite" for a in cat["assets"])
 CATALOG.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
 ZIP.unlink()
 print("SUCCESS: 12 original RGBA PNG, 12 RGBA WEBP, pixel-exact WEBP atlas, source preview and unique catalog entry")
if __name__=="__main__":main()
