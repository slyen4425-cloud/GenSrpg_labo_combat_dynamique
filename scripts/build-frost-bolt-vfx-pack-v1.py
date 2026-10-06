#!/usr/bin/env python3
from __future__ import annotations
import base64, csv, hashlib, io, json, shutil, zipfile
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
TMP=ROOT/".tmp"/"frost-bolt-vfx-v1"
PACK=ROOT/"assets/library/capture/sprites/skills/frost_bolt"
SOURCE=ROOT/"assets/library/capture/sprites/source/frost_bolt_v1"
CATALOG=ROOT/"data/assets/catalog/global-visual-assets.v1.json"
WORKFLOW=ROOT/".github/workflows/build-frost-bolt-vfx-pack-v1.yml"
ARCHIVE_SHA256="fedb4e34afff8a2b775d685b5be3b71cabb6be6c22c583328d21f155e54a6054"
SPECS={
 "cast":{"source_name":"frost_bolt_cast_source_01.webp","source_sha256":"b3cd6e8534c0cd02a7fe10f81d5f11161eea0cd0633c3f1910792758bfc20946","count":16,"cols":4,"rows":4,"frame_ms":60,"playback":"once","row_bounds":None},
 "projectile":{"source_name":"frost_bolt_projectile_source_01.webp","source_sha256":"2fec6b023bbdceecb6ee75d9bc9348abfcd539e152f4c8660b60f779a4f4b876","count":12,"cols":4,"rows":3,"frame_ms":45,"playback":"loop","row_bounds":[220,552,862,1200]},
 "impact":{"source_name":"frost_bolt_impact_source_01.webp","source_sha256":"54143d3bb9dc0ff71876bb35ab5a35a0bde39170b425603162963cfea1ff49a0","count":12,"cols":4,"rows":3,"frame_ms":45,"playback":"once","row_bounds":[50,450,850,1250]},
 "status_aura":{"source_name":"frost_bolt_aura_source_01.webp","source_sha256":"82139f9f16e55d91b5b8838fe05e5842c4283d7cc57f1cdfad62a55e6474476d","count":16,"cols":4,"rows":4,"frame_ms":250,"playback":"loop","row_bounds":None},
}
def sha_bytes(data): return hashlib.sha256(data).hexdigest()
def sha_file(path): return sha_bytes(path.read_bytes())
def reconstruct_sources():
    parts=sorted((TMP/"source_b64").glob("part_*.txt"))
    if not parts: raise RuntimeError("frost bolt source transfer parts are missing")
    encoded="".join("".join(p.read_text(encoding="ascii").split()) for p in parts)
    archive=base64.b64decode(encoded,validate=True)
    if sha_bytes(archive)!=ARCHIVE_SHA256: raise RuntimeError("frost bolt source archive SHA mismatch")
    SOURCE.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(archive),"r") as zf:
        for spec in SPECS.values():
            data=zf.read(spec["source_name"])
            if sha_bytes(data)!=spec["source_sha256"]: raise RuntimeError("source SHA mismatch: "+spec["source_name"])
            (SOURCE/spec["source_name"]).write_bytes(data)
def frame_path(role,index): return PACK/"frames"/f"sprite_skill_frost_bolt_{role}_{index:02d}.png"
def atlas_path(role): return PACK/"atlases"/f"sprite_skill_frost_bolt_{role}_atlas_01.webp"
def square_contain(crop):
    w,h=crop.size
    scale=min(512/w,512/h)
    nw=max(1,round(w*scale)); nh=max(1,round(h*scale))
    resized=crop.resize((nw,nh),Image.Resampling.LANCZOS)
    canvas=Image.new("RGBA",(512,512),(0,0,0,0))
    canvas.alpha_composite(resized,((512-nw)//2,(512-nh)//2))
    return canvas
def build_role(role,spec):
    image=Image.open(SOURCE/spec["source_name"]).convert("RGBA"); w,h=image.size
    frames=[]; extrema=[]
    for idx in range(spec["count"]):
        row,col=divmod(idx,spec["cols"])
        x0=round(col*w/spec["cols"]); x1=round((col+1)*w/spec["cols"])
        if spec["row_bounds"]:
            y0=spec["row_bounds"][row]; y1=spec["row_bounds"][row+1]
        else:
            y0=round(row*h/spec["rows"]); y1=round((row+1)*h/spec["rows"])
        frame=square_contain(image.crop((x0,y0,x1,y1)))
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
    (PACK/"README.md").write_text(
      "# Trait de givre — sprites Capture HD\n\n"
      "Pack visuel additif de givre. Aucun changement gameplay ou moteur.\n\n"
      "- cast/charge : 16 PNG RGBA 512×512\n"
      "- projectile : 12 PNG RGBA 512×512\n"
      "- impact : 12 PNG RGBA 512×512\n"
      "- aura créature givrée : 16 PNG RGBA 512×512\n"
      "- 56 frames individuelles au total\n"
      "- 4 atlas WebP horizontaux\n"
      "- l'aura utilise 250 ms/frame : les 8 dernières phases quasi fixes maintiennent visuellement l'état givré ~2 s avant la boucle\n"
      "- sources de transport WebP Q90 avec alpha conservées sous assets/library/capture/sprites/source/frost_bolt_v1/\n\n"
      "Les atlas sont les ressources runtime du catalogue. Le pack est additif et ne remplace aucun asset glace existant.\n",
      encoding="utf-8")
    with (PACK/"manifest.csv").open("w",newline="",encoding="utf-8") as fh:
        wr=csv.writer(fh,lineterminator="\n"); wr.writerow(["sequence","frame","file","width","height","sha256"])
        for role,spec in SPECS.items():
            for idx in range(1,spec["count"]+1):
                p=frame_path(role,idx); wr.writerow([role,idx,str(p.relative_to(PACK)).replace("\\","/"),512,512,sha_file(p)])
    seq={"frame_size":[512,512],"sequences":{}}
    for role,spec in SPECS.items():
        seq["sequences"][role]={"frame_count":spec["count"],"frame_ms":spec["frame_ms"],"frames":[f"frames/sprite_skill_frost_bolt_{role}_{i:02d}.png" for i in range(1,spec["count"]+1)],"atlas":f"atlases/sprite_skill_frost_bolt_{role}_atlas_01.webp","playback_mode":spec["playback"]}
    (PACK/"sprite_skill_frost_bolt_sequences_01.json").write_text(json.dumps(seq,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    provenance={"version":1,"source":"OpenAI image generation, user-approved frost bolt sheets","transport":"Q90 WebP with alpha, derived from generated transparent PNG sheets before GitHub transfer","source_archive_sha256":ARCHIVE_SHA256,"generation_ids":{"cast":"c7078f27-9492-4e03-b667-8fec8c138e1f","projectile":"212d4d11-f9cc-4cab-ad49-0b1c69ea08ca","impact":"bb03e3de-5136-47ad-8800-ac3dbf1bb646","status_aura":"b64af66f-5802-4613-a7c6-ca3dd6d427f0"},"crop_policy":"four equal columns; cast/aura proportional rows; projectile and impact audited row bands; contain-resize centered to 512x512","results":results}
    (PACK/"provenance.json").write_text(json.dumps(provenance,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
def update_catalog():
    cat=json.loads(CATALOG.read_text(encoding="utf-8")); ids={a["id"] for a in cat["assets"]}
    entries=[
      {"id":"pack:capture:sprite-frost-bolt-cast-01","label":"Trait de givre — charge","assetType":"sprite","mediaType":"image","category":"release","tags":["skill","ice","frost","magic","cast","capture","hd"],"source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},"resource":{"file":"capture/sprites/skills/frost_bolt/atlases/sprite_skill_frost_bolt_cast_atlas_01.webp","format":"sprite-strip","mime":"image/webp","frameCount":16,"frameMs":60},"compatibility":{"uses":["combat","capture","editor"]}},
      {"id":"pack:capture:sprite-frost-bolt-projectile-01","label":"Trait de givre — projectile","assetType":"sprite","mediaType":"image","category":"travel","tags":["skill","ice","frost","magic","projectile","capture","hd"],"source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},"resource":{"file":"capture/sprites/skills/frost_bolt/atlases/sprite_skill_frost_bolt_projectile_atlas_01.webp","format":"sprite-strip","mime":"image/webp","frameCount":12,"frameMs":45,"headingRad":0,"coreAnchor":{"x":0.76,"y":0.5},"playbackMode":"loop"},"compatibility":{"uses":["combat","capture","editor"]}},
      {"id":"pack:capture:sprite-frost-bolt-impact-01","label":"Trait de givre — impact","assetType":"sprite","mediaType":"image","category":"impact","tags":["skill","ice","frost","magic","impact","capture","hd"],"source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},"resource":{"file":"capture/sprites/skills/frost_bolt/atlases/sprite_skill_frost_bolt_impact_atlas_01.webp","format":"sprite-strip","mime":"image/webp","frameCount":12,"frameMs":45},"compatibility":{"uses":["combat","capture","editor"]}},
      {"id":"pack:capture:sprite-frost-bolt-status-aura-01","label":"Trait de givre — créature givrée","assetType":"sprite","mediaType":"image","category":"skill","tags":["skill","status","aura","frozen","ice","frost","animated","capture","hd"],"source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},"resource":{"file":"capture/sprites/skills/frost_bolt/atlases/sprite_skill_frost_bolt_status_aura_atlas_01.webp","format":"sprite-strip","mime":"image/webp","frameCount":16,"frameMs":250,"playbackMode":"loop"},"compatibility":{"uses":["combat","capture","editor"]}}
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
    print("frost bolt vfx pack built:",sum(s["count"] for s in SPECS.values()),"frames")
if __name__=="__main__": main()
