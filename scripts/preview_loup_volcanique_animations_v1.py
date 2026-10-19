#!/usr/bin/env python3
"""Build FOUR 20-frame pre-integration previews from the canonical Loup volcanique.

No generative reinterpretation of creature anatomy; 2D nonrotating local warps of
the approved original source model. F01 is pixel-identical to the derived 512x512
RGBA master saved here. All sources come from the single global-assets library.
These are ART REVIEW CANDIDATES; nothing is attached to the runtime catalog.
"""
from __future__ import annotations
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import hashlib
import json
import math
import numpy as np
import cv2

ROOT = Path(__file__).resolve().parents[1]
CREATURE = ROOT/"assets/library/capture/creatures/loup_volcanique"
OUT = CREATURE/"animation_previews_v1"
COUNT=20
SIZE=512
FPS=12
VIEWS={
    "face":dict(file="loup_volcanique_opponent.webp",heading=-1,head=(.20,.49),
        mouth=(.15,.53),tail=(.75,.29),front=(.35,.72),rear=(.74,.74)),
    "dos":dict(file="loup_volcanique_player.webp",heading=1,head=(.78,.48),
        mouth=(.82,.52),tail=(.27,.30),front=(.78,.72),rear=(.23,.72)),
}

def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def influence(X,Y,center,sx,sy):
    px,py=center
    return np.exp(-((X-px)**2/(2*sx*sx)+(Y-py)**2/(2*sy*sy))).astype(np.float32)

def warp(master,view,action,t):
    """Texture-preserving displacement map; never rotate camera or redesign parts."""
    phase=2*math.pi*t
    u=math.sin(phase)
    bounce=max(0.0,math.sin(phase)) if action=="movement" else 0.
    # Attack eases forward and fully recoils to original anchor.
    lunge=max(0,math.sin(math.pi*t))**2 if action=="attack" else 0.
    h=VIEWS[view]["heading"]
    Y,X=np.mgrid[0:SIZE,0:SIZE].astype(np.float32)
    dx=np.zeros((SIZE,SIZE),dtype=np.float32)
    dy=np.zeros((SIZE,SIZE),dtype=np.float32)
    # All movements applied *within* the single validated fixed perspective.
    head=np.array(VIEWS[view]["head"],dtype=np.float32)*SIZE
    tail=np.array(VIEWS[view]["tail"],dtype=np.float32)*SIZE
    front=np.array(VIEWS[view]["front"],dtype=np.float32)*SIZE
    rear=np.array(VIEWS[view]["rear"],dtype=np.float32)*SIZE
    H=influence(X,Y,head,81,77)
    T=influence(X,Y,tail,67,76)
    F=influence(X,Y,front,52,71)
    R=influence(X,Y,rear,54,72)

    if action=="movement":
        # quadruped running in place, alternating paws, back rises and falls
        dx += 2.2*h*u
        dy += -7.2*bounce
        dx += h * (4.2*u)*H + (14*u)*F + (-13*u)*R + (8*u)*T
        dy += (-3.4*math.cos(phase))*H + (-5*max(0,u))*F + (-5*max(0,-u))*R
        dy += (3.5*math.cos(phase))*T
    else:
        # body compression, forward lunge of shoulders/head, sweeping tail
        dx += h*12*lunge
        dx += (h*11*lunge)*H + (h*9*lunge)*F + (-h*5*lunge)*T
        dy += -3.5*lunge
        dy += (-5.7*lunge)*H + (2*lunge)*F
        dx += (5.3*math.sin(2*math.pi*t))*T
        dy += (-3.4*math.sin(2*math.pi*t))*T
    # A remap samples from source position (output - desired forward motion).
    # Keep transparent border and premultiply alpha to avoid dark halos.
    rgba=np.asarray(master,dtype=np.uint8).astype(np.float32)
    alpha=rgba[:,:,3:4]/255.
    prem=np.concatenate([rgba[:,:,:3]*alpha,rgba[:,:,3:4]],axis=2)
    out=cv2.remap(prem,X-dx,Y-dy,cv2.INTER_LINEAR,
                  borderMode=cv2.BORDER_CONSTANT,borderValue=(0,0,0,0))
    a=out[:,:,3:4]
    rgb=np.divide(out[:,:,:3]*255,a,out=np.zeros_like(out[:,:,:3]),where=a>0.5)
    return Image.fromarray(np.uint8(np.clip(np.concatenate([rgb,a],axis=2),0,255)), "RGBA")

def fire_attack(img,view,t):
    """Attached muzzle flare only at strike climax; not a replacement for skill FX."""
    strength=max(0,1-abs(t-.55)/.22)
    if strength<=0: return img
    mouth=VIEWS[view]["mouth"]
    mx,my=mouth[0]*SIZE,mouth[1]*SIZE
    direction=VIEWS[view]["heading"]
    layer=Image.new("RGBA",img.size,(0,0,0,0))
    d=ImageDraw.Draw(layer)
    r=6+6*strength
    # Three connected, overlapping tongues of orange flame.
    for j in range(3):
        offset=(j-1)*7
        x0=mx+direction*4
        x1=mx+direction*(12+24*strength+j*3)
        y0=my+offset
        d.polygon([(x0,y0-6*strength),(x1,y0-2-5*strength),
                   (x0+direction*8,y0+5*strength)],fill=(255,93+28*j,8,int(180*strength)))
    glow=layer.filter(ImageFilter.GaussianBlur(radius=8))
    base=Image.alpha_composite(img,glow)
    return Image.alpha_composite(base,layer)

def checkerboard(width,height):
    b=Image.new("RGBA",(width,height),(29,34,40,255))
    d=ImageDraw.Draw(b)
    for y in range(0,height,24):
        for x in range(0,width,24):
            if (x//24+y//24)%2==0:
                d.rectangle((x,y,x+23,y+23),fill=(45,51,57,255))
    return b

def make_review_sheet(frames,path,title):
    contact=Image.new("RGB",(5*215,4*223+35),(20,25,32))
    d=ImageDraw.Draw(contact)
    d.text((14,8),title,fill="white")
    for n,img in enumerate(frames):
        x=(n%5)*215
        y=(n//5)*223+35
        block=checkerboard(202,202)
        block.alpha_composite(img.resize((202,202),Image.Resampling.LANCZOS))
        contact.paste(block.convert("RGB"),(x+6,y))
        d.text((x+10,y+205),str(n+1).zfill(2),fill=(240,240,240))
    contact.save(path,quality=87)

def build():
    OUT.mkdir(parents=True,exist_ok=True)
    records=[]
    for view,data in VIEWS.items():
        source=CREATURE/"runtime"/data["file"]
        with Image.open(source) as src:
            if src.size!=(320,320):
                raise ValueError("Unexpected canonical 320x320 source: "+str(src.size))
            base=src.convert("RGBA")
            if base.getextrema()[3][0]>=255:
                raise ValueError("Official original has no transparency!")
        master=base.resize((SIZE,SIZE),Image.Resampling.LANCZOS)
        masterpath=OUT/"masters"/f"loup_volcanique_{view}_master_512.png"
        masterpath.parent.mkdir(parents=True,exist_ok=True)
        master.save(masterpath,optimize=True)
        for action in ("attack","movement"):
            folder=OUT/action/view
            framesdir=folder/"frames";framesdir.mkdir(parents=True,exist_ok=True)
            frames=[];descriptors=[]
            for i in range(COUNT):
                # first EXACT master, final master also for clean return to idle
                if i==0 or i==COUNT-1:
                    frame=master.copy()
                else:
                    progress=i/(COUNT-1)
                    frame=warp(master,view,action,progress)
                    if action=="attack":frame=fire_attack(frame,view,progress)
                p=framesdir/f"loup_volcanique_{action}_{view}_{i+1:02d}.png"
                frame.save(p,optimize=True)
                frames.append(frame)
                descriptors.append({"frame":i+1,"file":p.relative_to(OUT).as_posix(),"sha256":digest(p)})
            if np.any(np.asarray(frames[0])!=np.asarray(master)):
                raise AssertionError("First frame is not pixel-exact master")
            if np.any(np.asarray(frames[-1])!=np.asarray(master)):
                raise AssertionError("Last frame does not return to master")
            sprite=Image.new("RGBA",(COUNT*SIZE//4,4*SIZE))
            for j,frame in enumerate(frames):
                sprite.alpha_composite(frame,((j%5)*SIZE,(j//5)*SIZE))
            # 5 columns by 4 rows = 2560x2048
            atlas=folder/f"loup_volcanique_{action}_{view}_atlas_5x4.png"
            sprite.save(atlas,optimize=True)
            pwebp=folder/f"loup_volcanique_{action}_{view}_preview.webp"
            frames[0].save(pwebp,"WEBP",save_all=True,append_images=frames[1:],
                           duration=round(1000/FPS),loop=0,quality=82,method=4,exact=True)
            sheet=folder/f"loup_volcanique_{action}_{view}_contact.jpg"
            make_review_sheet(frames,sheet,f"Loup volcanique - {action.upper()} - {view.upper()} (20 poses)")
            records.append({"action":action,"view":view,"frameCount":COUNT,
                "canvas":[SIZE,SIZE],"sourceCanonical":source.relative_to(ROOT).as_posix(),
                "sourceSha256":digest(source),"master":masterpath.relative_to(OUT).as_posix(),
                "masterSha256":digest(masterpath),"frameOneExact":True,
                "atlas":atlas.relative_to(OUT).as_posix(),
                "preview":pwebp.relative_to(OUT).as_posix(),
                "contact":sheet.relative_to(OUT).as_posix(),"frames":descriptors})
            print("DONE",action,view,"frame1 exact",len(frames))
    # Broad contact grid 2x2, poster-only.
    poster=Image.new("RGB",(900,910),(19,25,34))
    d=ImageDraw.Draw(poster)
    d.text((25,14),"LOUP VOLCANIQUE — 4 ANIMATIONS / PREVISUALISATION",fill="white")
    for index,entry in enumerate(records):
        img=Image.open(OUT/entry["contact"]).convert("RGB")
        thumb=img.resize((425,405),Image.Resampling.LANCZOS)
        x=18+(index%2)*442
        y=48+(index//2)*425
        poster.paste(thumb,(x,y))
    poster.save(OUT/"quatre_animations_contact.jpg",quality=85)
    manifest={"schema":"capture-creature-animation-review-v1",
        "creatureId":"loup_volcanique","status":"PREVIEW_READY_AWAITING_AUTHOR_APPROVAL",
        "catalogChanged":False,"runtimeIntegrated":False,
        "baseSource":"global-assets canonical creature models 320x320 RGBA",
        "frameMaster":"canonical model upscaled to 512x512 and saved as approved-origin candidate",
        "technique":"non-generative deformable 2D motion prototype; fixed 3/4 viewpoint; no skeletal reconstruction",
        "frame1":"exact RGBA pixels of saved master 512","frameCount":COUNT,
        "notes":["No creature orientation inversion, rotation or replacement",
                 "Locomotion is a provisional run-in-place; attack is a provisional fiery lunge",
                 "User review and approval of both actions and both perspectives is REQUIRED before any catalog import"],
        "outputs":records}
    (OUT/"review_manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

if __name__=="__main__":
    build()
