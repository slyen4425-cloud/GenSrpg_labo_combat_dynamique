#!/usr/bin/env python3
from __future__ import annotations
import base64, csv, hashlib, io, json, shutil, zipfile
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
TMP=ROOT/".tmp"/"stone-carapace-vfx-v1"
PACK=ROOT/"assets/library/capture/sprites/skills/stone_carapace"
SOURCE=ROOT/"assets/library/capture/sprites/source/stone_carapace_v1"
CATALOG=ROOT/"data/assets/catalog/global-visual-assets.v1.json"
WORKFLOW=ROOT/".github/workflows/build-stone-carapace-vfx-pack-v1.yml"
ARCHIVE_SHA256="fb37afab9c30ccc0dd898233a6fdae1e37d1dde521bf3658bfe050ed14a0e8b0"
SPECS={
 "cast":{"source_archive":"stone_carapace_cast_source_01.webp","source_name":"stone_carapace_cast_source_01.webp","source_sha256":"c33cf229667b24638bc2a6628c9c4ec397c9a040d80ac3d912e19fd2dc583289","count":16,"cols":4,"rows":4,"frame_ms":60,"playback":"once"},
 "aura":{"source_archive":"stone_carapace_aura_source_01.webp","source_name":"stone_carapace_aura_source_01.webp","source_sha256":"ee27569ec15d6010383d7bf781c72d5bd687a09355e82669238b07e7c4ad8e88","count":12,"cols":4,"rows":4,"frame_ms":90,"playback":"loop"},
}
def sha_bytes(data): return hashlib.sha256(data).hexdigest()
def sha_file(path): return sha_bytes(path.read_bytes())
def reconstruct_sources():
 parts=sorted((TMP/"source_b64").glob("part_*.txt"))
 if not parts: raise RuntimeError("stone carapace source transfer parts are missing")
 encoded="".join("".join(p.read_text(encoding="ascii").split()) for p in parts)
 archive=base64.b64decode(encoded,validate=True)
 if sha_bytes(archive)!=ARCHIVE_SHA256: raise RuntimeError("stone carapace source archive SHA mismatch")
 SOURCE.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(io.BytesIO(archive),"r") as zf:
  for spec in SPECS.values():
   data=zf.read(spec["source_archive"])
   if sha_bytes(data)!=spec["source_sha256"]: raise RuntimeError("source SHA mismatch: "+spec["source_archive"])
   (SOURCE/spec["source_name"]).write_bytes(data)
def frame_path(role,index): return PACK/"frames"/f"sprite_skill_stone_carapace_{role}_{index:02d}.png"
def atlas_path(role): return PACK/"atlases"/f"sprite_skill_stone_carapace_{role}_atlas_01.webp"
def build_role(role,spec):
 image=Image.open(SOURCE/spec["source_name"]).convert("RGBA"); w,h=image.size
 frames=[]; extrema=[]
 for idx in range(spec["count"]):
  row,col=divmod(idx,spec["cols"])
  x0=round(col*w/spec["cols"]); x1=round((col+1)*w/spec["cols"])
  y0=round(row*h/spec["rows"]); y1=round((row+1)*h/spec["rows"])
  frame=image.crop((x0,y0,x1,y1)).resize((512,512),Image.Resampling.LANCZOS)
  amin,amax=frame.getchannel("A").getextrema()
  if amin>=255 or amax<=0: raise RuntimeError(f"{role} frame {idx+1}: invalid alpha {amin}..{amax}")
  path=frame_path(role,idx+1); path.parent.mkdir(parents=True,exist_ok=True); frame.save(path,"PNG",optimize=True)
  frames.append(path); extrema.append([amin,amax])
 atlas=Image.new("RGBA",(512*spec["count"],512),(0,0,0,0))
 for idx,path in enumerate(frames):
  fr=Image.open(path).convert("RGBA"); atlas.paste(fr,(idx*512,0),fr)
 apath=atlas_path(role); apath.parent.mkdir(parents=True,exist_ok=True); atlas.save(apath,"WEBP",lossless=True,quality=100,method=6)
 if Image.open(apath).size!=atlas.size: raise RuntimeError(role+" atlas size mismatch")
 return {"source_size":[w,h],"source_sha256":sha_file(SOURCE/spec["source_name"]),"frame_count":spec["count"],"frame_size":[512,512],"frame_sha256":[sha_file(p) for p in frames],"alpha_extrema":extrema,"atlas":str(apath.relative_to(PACK)).replace("\\","/"),"atlas_size":list(atlas.size),"atlas_sha256":sha_file(apath)}
def write_metadata(results):
 PACK.mkdir(parents=True,exist_ok=True)
 (PACK/"README.md").write_text("# Carapace de pierre — sprites Capture HD\n\nPack visuel additif pour armure / carapace de pierre. Aucun changement gameplay ou moteur.\n\n- charge/cast : 16 PNG RGBA 512×512\n- aura protectrice : 12 PNG RGBA 512×512\n- 28 frames individuelles au total\n- charge atlas 8192×512 ; aura atlas 6144×512\n- sources de transport WebP Q95 conservées sous `assets/library/capture/sprites/source/stone_carapace_v1/`\n\nLes atlas sont les ressources runtime du catalogue. Le pack est additif et ne remplace aucune capacité existante.\n",encoding="utf-8")
 with (PACK/"manifest.csv").open("w",newline="",encoding="utf-8") as fh:
  wr=csv.writer(fh, lineterminator="\n"); wr.writerow(["sequence","frame","file","width","height","sha256"])
  for role,spec in SPECS.items():
   for idx in range(1,spec["count"]+1):
    p=frame_path(role,idx); wr.writerow([role,idx,str(p.relative_to(PACK)).replace("\\","/"),512,512,sha_file(p)])
 seq={"frame_size":[512,512],"sequences":{}}
 for role,spec in SPECS.items():
  seq["sequences"][role]={"frame_count":spec["count"],"frame_ms":spec["frame_ms"],"frames":[f"frames/sprite_skill_stone_carapace_{role}_{i:02d}.png" for i in range(1,spec["count"]+1)],"atlas":f"atlases/sprite_skill_stone_carapace_{role}_atlas_01.webp","playback_mode":spec["playback"]}
 (PACK/"sprite_skill_stone_carapace_sequences_01.json").write_text(json.dumps(seq,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 provenance={"version":1,"source":"OpenAI image generation, user-approved stone carapace sheets","transport":"Q95 WebP with alpha, derived from generated transparent PNG sheets before GitHub transfer","source_archive_sha256":ARCHIVE_SHA256,"generation_ids":{"cast":"489a9b38-ab14-4346-876e-d00c24a9a449","aura":"8592b7cd-b6b5-4ffa-b979-a829ef0baf47"},"crop_policy":"proportional 4x4 grid boundaries, row-major, LANCZOS resize to 512x512","results":results}
 (PACK/"provenance.json").write_text(json.dumps(provenance,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
def update_catalog():
 cat=json.loads(CATALOG.read_text(encoding="utf-8")); ids={a["id"] for a in cat["assets"]}
 entries=[
  {"id":"pack:capture:sprite-stone-carapace-cast-01","label":"Carapace de pierre — charge","assetType":"sprite","mediaType":"image","category":"release","tags":["skill","earth","stone","armor","carapace","cast","capture","hd"],"source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},"resource":{"file":"capture/sprites/skills/stone_carapace/atlases/sprite_skill_stone_carapace_cast_atlas_01.webp","format":"sprite-strip","mime":"image/webp","frameCount":16,"frameMs":60},"compatibility":{"uses":["combat","capture","editor"]}},
  {"id":"pack:capture:sprite-stone-carapace-aura-01","label":"Carapace de pierre — aura","assetType":"sprite","mediaType":"image","category":"skill","tags":["skill","status","aura","protective","earth","stone","armor","carapace","animated","capture","hd"],"source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},"resource":{"file":"capture/sprites/skills/stone_carapace/atlases/sprite_skill_stone_carapace_aura_atlas_01.webp","format":"sprite-strip","mime":"image/webp","frameCount":12,"frameMs":90,"playbackMode":"loop"},"compatibility":{"uses":["combat","capture","editor"]}}
 ]
 for e in entries:
  if e["id"] in ids: raise RuntimeError("catalog id already exists: "+e["id"])
  cat["assets"].append(e); ids.add(e["id"])
 cat["counts"]["assets"]=len(cat["assets"]); cat["counts"]["sprites"]=sum(1 for a in cat["assets"] if a.get("assetType")=="sprite")
 CATALOG.write_text(json.dumps(cat,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
def cleanup():
 shutil.rmtree(TMP,ignore_errors=True)
 if WORKFLOW.exists(): WORKFLOW.unlink()
def main():
 reconstruct_sources()
 if PACK.exists(): shutil.rmtree(PACK)
 results={role:build_role(role,spec) for role,spec in SPECS.items()}
 write_metadata(results); update_catalog(); cleanup()
 print("stone carapace vfx pack built:",sum(s["count"] for s in SPECS.values()),"frames")
if __name__=="__main__": main()
