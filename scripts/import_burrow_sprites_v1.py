#!/usr/bin/env python3
"""Import exactly the three author-approved underground FX ZIPs.
The 60 input RGBA frames remain byte-identical. Only a compact lossless
horizontal WebP atlas is generated for browser playback.
"""
from pathlib import Path
from PIL import Image
import hashlib, io, json, re, zipfile

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/"assets/library/capture/sprites/skills/burrow_terrain"
PACKS={
  "start":("ATTAQUE_SOUTERRAINE_FX_01_DEPART_20F.zip","86617c6de286429961377499e327d40e765ea241c20ac7c2f05796019c9b762f","start_creusement_depart"),
  "travel":("ATTAQUE_SOUTERRAINE_FX_02_TRAJET_20F.zip","962f45d5a8b29fb741fb3314945b7497f71f0c7a2d06f90d09b3b18f0685959a","travel_sillon_trajet"),
  "impact":("ATTAQUE_SOUTERRAINE_FX_03_IMPACT_20F.zip","94f53ce435de7d07b59b19546c2cde7217f36956b561b852cde0dbd36ba79ca4","impact_emergence_impact")
}
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
  assert not DEST.exists(),"Refuse overwrite of published assets"
  manifest={"schema":"capture-burrow-terrain-sprites-v1","frameCount":20,"frameWidth":384,"frameHeight":384,"sourceFrameSize":[512,512],"stages":{}}
  for stage,(name,expected,folder) in PACKS.items():
    src=ROOT/"_incoming"/name
    raw=src.read_bytes()
    assert sha(raw)==expected,f"Wrong author ZIP {name}"
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
      assert z.testzip() is None
      contents={}
      for member in z.infolist():
        if member.is_dir():continue
        assert not member.filename.startswith("/") and ".." not in Path(member.filename).parts
        if re.fullmatch(r".*/frames/sprite_burrow_"+stage+r"_\d\d\.png",member.filename):
          contents[Path(member.filename).name]=z.read(member.filename)
    names=[f"sprite_burrow_{stage}_{n:02}.png" for n in range(1,21)]
    assert set(contents)==set(names),f"Missing or extra frames: {stage}"
    p=DEST/stage/"frames";p.mkdir(parents=True)
    atlas=Image.new("RGBA",(20*384,384),(0,0,0,0))
    hashes=[]
    for i,frameName in enumerate(names):
      blob=contents[frameName]
      frame=Image.open(io.BytesIO(blob));frame.load()
      assert frame.format=="PNG" and frame.mode=="RGBA" and frame.size==(512,512)
      assert frame.getchannel("A").getextrema()[0]==0 and frame.getchannel("A").getextrema()[1]>100
      (p/frameName).write_bytes(blob)
      atlas.alpha_composite(frame.resize((384,384),Image.Resampling.LANCZOS),(i*384,0))
      hashes.append(sha(blob))
    atlas_path=DEST/stage/(f"sprite_burrow_{stage}_atlas.webp")
    atlas.save(atlas_path,"WEBP",lossless=True,method=5)
    assert Image.open(atlas_path).size==(7680,384)
    manifest["stages"][stage]={
      "id":f"burrow:{stage}",
      "file":f"{stage}/{atlas_path.name}",
      "sourceZip":name,"sourceZipSha256":expected,"atlasSha256":sha(atlas_path.read_bytes()),
      "sourceFrameHashes":hashes,
      "frameCount":20,"frameMs":60 if stage=="travel" else 70,
      "playback":"loop" if stage=="travel" else "once"
    }
    src.unlink()
  (DEST/"manifest.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
  print("Imported all 60 approved PNGs, 3 verified alpha WebP atlases and manifest.")
if __name__=="__main__":main()
