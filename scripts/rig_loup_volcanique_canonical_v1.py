#!/usr/bin/env python3
"""Conservative, jointed 2-D paper puppet using ONLY official wolf model pixels.

No diffusion or recreation of wolf. The limbs are independent rigid cutouts
rotated at anatomical joints. Original exact master in F01. Candidate PREVIEW,
not runtime-ready: shoulder seams require author review.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import math, hashlib, json, numpy as np

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/"assets/library/capture/creatures/loup_volcanique"
MASTER=BASE/"canonical_review_v1"
OUT=BASE/"canonical_animation_review_v1"
CANVAS=512
COUNT=20
OUT.mkdir(parents=True, exist_ok=True)

# Coordinates in source 320×320. Anatomical pivots estimated on official model;
# these are 2D joints only, NEVER a perspective rotation.
RIG = {
    "face": {
       "front_far":  {"pivot":(67,207), "poly":[(56,187),(91,185),(104,222),(101,249),(83,274),(39,268),(24,250),(35,221)],"sign":-1},
       "front_near": {"pivot":(125,209),"poly":[(105,187),(148,183),(169,219),(151,257),(126,277),(88,273),(88,244)],"sign":1},
       "hind":       {"pivot":(267,206),"poly":[(249,189),(293,193),(310,235),(307,267),(279,278),(258,266),(249,232)],"sign":-1},
       "jaw":        {"pivot":(79,177),"poly":[(37,160),(92,165),(105,198),(78,208),(44,201)],"sign":1}
    },
    "dos":{
       "rear_far":   {"pivot":(92,195),"poly":[(82,169),(127,180),(128,215),(104,250),(95,273),(43,271),(32,249),(49,221)],"sign":-1},
       "rear_near":  {"pivot":(170,205),"poly":[(147,187),(196,188),(214,226),(213,265),(189,291),(150,285),(143,251)],"sign":1},
       "front":      {"pivot":(255,201),"poly":[(229,179),(266,176),(296,214),(309,245),(304,270),(272,274),(250,247)],"sign":-1},
       "head":       {"pivot":(269,161),"poly":[(237,132),(286,125),(315,170),(306,210),(269,220),(253,196)],"sign":1}
    }
}

def sha(p:Path):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def poly_mask(poly):
    m=Image.new("L",(CANVAS,CANVAS),0)
    xy=[(round(x*CANVAS/320),round(y*CANVAS/320)) for x,y in poly]
    ImageDraw.Draw(m).polygon(xy,fill=255)
    return m

def pieces(master,view,action):
    m=np.array(master)
    layers=[]
    holes=np.zeros((CANVAS,CANVAS),dtype=np.float32)
    Y=np.arange(CANVAS)[:,None]
    for key,part in RIG[view].items():
        if action=="movement" and key in ("jaw","head"):
            continue
        if action=="attack" and key in ("hind","rear_far","rear_near"):
            continue
        mask=poly_mask(part["poly"])
        layer=Image.new("RGBA",(CANVAS,CANVAS))
        layer.paste(master,(0,0),mask=mask)
        # Do not turn exact source textures into blurry painted limbs.
        px,py=part["pivot"]
        pivot=(round(px*CANVAS/320),round(py*CANVAS/320))
        # Remove old distal leg/foot only, keep the torso and pivot intact.
        # Head/jaw: tightly scoped action, direct cutout with a soft overlap
        # so cranial texture remains stable at the neck.
        if key in ("head","jaw"):
            erase=np.asarray(mask,dtype=np.float32)/255 * np.clip((Y-(pivot[1]+4))/(22),0,1)
        else:
            erase=np.asarray(mask,dtype=np.float32)/255 * np.clip((Y-(pivot[1]+9))/(26),0,1)
        holes=np.maximum(holes,erase)
        layers.append((key,pivot,part["sign"],layer))
    base=np.array(master).astype(np.float32)
    base[:,:,3]*=(1-np.clip(holes,0,1))
    return Image.fromarray(np.clip(base,0,255).astype("uint8"),"RGBA"),layers

def frame(master,base,layers,view,action,i):
    if i==0 or i==19: return master.copy()
    t=i/19
    progress=2*math.pi*t
    current=base.copy()
    for key,pivot,sign,img in layers:
        if action=="movement":
            # Distinct diagonal-leg stride phases; rigid ankle-leg sections
            # pivot in alternating directions and actually move the feet.
            angle=sign*8.5*math.sin(progress*2.0)
            if key.startswith("rear") or key=="hind":
                angle=-angle
        else:
            # A bite/lunge has staged crouch, thrust and recovery.
            thrust=math.sin(math.pi*t)**2
            if key in ("jaw","head"):
                angle=(5 if view=="face" else -6)*math.sin(2*math.pi*t)*thrust
            else:
                angle=sign*9.0*thrust
        part=img.rotate(angle,resample=Image.Resampling.BICUBIC,center=pivot,
                        expand=False,fillcolor=(0,0,0,0))
        current.alpha_composite(part)
    return current

def contact(frames,title,path):
    paper=Image.new("RGB",(5*206,4*218+38),(20,25,34))
    d=ImageDraw.Draw(paper)
    d.text((10,9),title,fill=(255,255,255))
    for i,im in enumerate(frames):
        x=(i%5)*206;y=(i//5)*218+38
        d.rectangle((x+3,y+2,x+199,y+197),fill=(43,49,62))
        thumb=im.resize((194,194),Image.Resampling.LANCZOS)
        paper.paste(thumb.convert("RGB"),(x+5,y+4),mask=thumb.getchannel("A"))
        d.text((x+9,y+202),f"POSE {i+1:02d}",fill=(245,245,245))
    paper.save(path,quality=88)

manifest={"model":"loup_volcanique","status":"DRAFT_AUTHOR_REVIEW",
          "runtimeIntegrated":False,"generatedCreatureArt":False,
          "method":"rigid pixel cutouts of exact official wolf master; jointed animation prototype",
          "warnings":["Visible seam risk at shoulder/hips; artist approval required",
                      "Model player has isolated polygon artifact surgically removed in candidate master",
                      "Needs visual examination of all 80 frames; not a production animation yet"],
          "actions":[]}
for view in ("face","dos"):
    master=Image.open(MASTER/f"{view}_master_512.png").convert("RGBA")
    for action in ("movement","attack"):
        dest=OUT/action/view
        framesdir=dest/"frames"
        framesdir.mkdir(parents=True,exist_ok=True)
        base,layers=pieces(master,view,action)
        frames=[]
        for i in range(COUNT):
            im=frame(master,base,layers,view,action,i)
            frames.append(im)
            im.save(framesdir/f"loup_volcanique_{action}_{view}_{i+1:02d}.png",optimize=True)
        assert np.array_equal(np.asarray(frames[0]),np.asarray(master))
        assert np.array_equal(np.asarray(frames[-1]),np.asarray(master))
        sheet=Image.new("RGBA",(2560,2048))
        for idx,f in enumerate(frames):
            sheet.alpha_composite(f,((idx%5)*512,(idx//5)*512))
        sheet.save(dest/"atlas.png",optimize=True)
        frames[0].save(dest/"preview.webp","WEBP",save_all=True,
                       append_images=frames[1:],duration=83,loop=0,quality=85,method=4,exact=True)
        contact(frames,action.upper()+"  "+view.upper()+" — EXACT MASTER PIXELS, RIG PROTOTYPE",
                dest/"poses.jpg")
        manifest["actions"].append({
            "view":view,"action":action,"frames":20,"frameOneEqualsMaster":True,
            "masterSha256":sha(MASTER/f"{view}_master_512.png"),
            "path":str(dest.relative_to(OUT)),"preview":"preview.webp"})
(OUT/"rig_manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
print(json.dumps([{"action":x["action"],"view":x["view"],"exact":x["frameOneEqualsMaster"]} for x in manifest["actions"]]))
