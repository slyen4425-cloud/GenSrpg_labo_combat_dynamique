#!/usr/bin/env python3
"""Produce four non-generative reference-anchored Loup volcanique review animations.

Faces and directions come EXCLUSIVELY from the two official WebP sources
in the global-assets branch. No frame is synthesized from a neighboring cell.
Frame 01 AND final frame are identical decoded RGBA to the corresponding
512x512 candidate master; no source artist model is overwritten.
Do not automatically register these drafts in the runtime asset catalog.
"""
from __future__ import annotations
import hashlib
import io
import json
import math
import zipfile
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"assets/library/capture/creatures/loup_volcanique/runtime"
ROOT_OUT=ROOT/"assets/library/capture/creatures/loup_volcanique/review_animation_20261019"
SIDE={"face":"loup_volcanique_opponent.webp","dos":"loup_volcanique_player.webp"}
FRAMES=20
CANVAS=512
PREVIEW_MS=83
ACTION={"attaque":"Morsure volcanique (animation de creature)","deplacement":"Course sur place"}
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def el(w,x0,y0,sx,sy):
    return np.exp(-0.5*((w[0]-x0)/sx)**2-0.5*((w[1]-y0)/sy)**2)
def reference_master(source):
    # Existing canonical source remains unchanged. 448px subject plus 32px safety
    # border make a 512px editable master candidate with intact perspective.
    im=Image.open(source).convert("RGBA")
    if im.size!=(320,320):
        raise ValueError(f"Unexpected canonical source resolution: {im.size}, {source}")
    resized=im.resize((448,448),Image.Resampling.LANCZOS)
    out=Image.new("RGBA",(CANVAS,CANVAS))
    out.alpha_composite(resized,(32,32))
    return out

def warped_reference(master, action, side, index):
    if index in (0,FRAMES-1):
        return master.copy()
    arr=np.asarray(master)
    h,w=arr.shape[:2]
    yy,xx=np.mgrid[:h,:w].astype(np.float32)
    nx=xx/512; ny=yy/512
    theta=math.tau*index/(FRAMES-1)
    target_left=side=="face"
    dx=np.zeros_like(xx); dy=np.zeros_like(yy)
    chest=el((nx,ny),0.5,0.6,0.33,0.3)
    frontleg=(0.30,0.75) if target_left else (0.76,0.76)
    hindleg=(0.77,0.78) if target_left else (0.23,0.78)
    tail=(0.75,0.34) if target_left else (0.27,0.34)
    muzzle=(0.22,0.57) if target_left else (0.82,0.55)
    head=el((nx,ny),muzzle[0],muzzle[1],0.18,0.19)
    tailf=el((nx,ny),tail[0],tail[1],0.20,0.17)
    fleg=el((nx,ny),frontleg[0],frontleg[1],0.11,0.17)
    hleg=el((nx,ny),hindleg[0],hindleg[1],0.12,0.16)
    if action=="deplacement":
        # A believable run cycle: feet alternate while back flexes and
        # head counterbalances; source orientation NEVER rotates.
        dy+=2.8*(1-math.cos(2*theta))*chest
        dx+=11*math.sin(theta)*fleg-10*math.sin(theta)*hleg
        dy+=5*math.cos(theta)*fleg-4*math.cos(theta)*hleg
        dy+=2.5*math.sin(theta+0.7)*head
        dx+=8*(math.sin(theta+0.6)-math.sin(0.6))*tailf
        dy+=5*(math.sin(theta+1.2)-math.sin(1.2))*tailf
    else:
        # Head darts in the direction it ALREADY faces; never flips.
        envelope=max(0.0,math.sin(math.pi*(index-2)/15))**1.55 if 2<index<17 else 0
        direction=-1 if target_left else 1
        dx+=7*direction*envelope*head
        dy+=-4*envelope*head
        dy+=4*envelope*chest
        dx+=4*direction*envelope*fleg
        dx+=5*(math.sin(theta+0.6)-math.sin(0.6))*tailf
    mapx=(xx-dx).astype(np.float32)
    mapy=(yy-dy).astype(np.float32)
    warped=cv2.remap(arr,mapx,mapy,cv2.INTER_LINEAR,
                     borderMode=cv2.BORDER_CONSTANT,borderValue=(0,0,0,0))
    return Image.fromarray(warped,"RGBA")

def ignite(base,side,index):
    # Attached breath from mouth only, not random disconnected foreign horns.
    # Fade back to the exact existing model by frame 17.
    t=(index-5)/10
    power=math.sin(math.pi*max(0,min(1,t)))**1.5 if 5<index<15 else 0
    if power < .01:
        return base
    origin=(int(512*(.19 if side=="face" else .83)),int(512*(.55 if side=="face" else .58)))
    direction=-1 if side=="face" else 1
    fx=Image.new("RGBA",base.size)
    halo=Image.new("RGBA",base.size)
    hd=ImageDraw.Draw(halo); d=ImageDraw.Draw(fx)
    reach=17+65*power
    # Three attached and progressively narrowing tongues of hot gas.
    for k in range(3):
        step=reach*(0.79+0.12*k)
        yshift=(k-1)*9
        bend=math.sin(index*.6+k)*7
        x0=origin[0]+direction*5
        y0=origin[1]+(k-1)*5
        x1=x0+direction*step
        y1=y0+yshift+bend
        widths=[(11+9*power),(7+5*power),(3+3*power)]
        col=[(236,56,11,125),(255,132,19,180),(255,225,88,215)][k]
        pts=[(x0,y0-widths[k]),(x0+direction*step*.43,y0-(widths[k]*.7)),
             (x1,y1),(x0+direction*step*.42,y0+widths[k]*.75),
             (x0,y0+widths[k])]
        hd.polygon(pts,fill=col)
        d.line([(x0,y0),(x0+direction*step*.6,y0+yshift*.5),(x1,y1)],fill=col,width=max(2,7-k*2))
    halo=halo.filter(ImageFilter.GaussianBlur(7))
    merged=Image.alpha_composite(base,halo)
    merged=Image.alpha_composite(merged,fx)
    return merged

def make_contact(frames,action,side,out):
    sheet=Image.new("RGB",(1200,1058),(23,29,39))
    d=ImageDraw.Draw(sheet)
    d.text((18,9),f"LOUP VOLCANIQUE | {action.upper()} | {side.upper()} | 20 POSES",fill="white")
    for i,im in enumerate(frames):
        x=(i%5)*240; y=40+(i//5)*254
        for v in range(0,226,18):
            for u in range(0,226,18):
                shade=(50,58,70) if ((u//18+v//18)%2) else (37,44,55)
                d.rectangle((x+u+7,y+v+5,x+u+24,y+v+22),fill=shade)
        f=im.resize((226,226),Image.Resampling.LANCZOS)
        sheet.paste(f,(x+7,y+5),f.getchannel("A"))
        d.text((x+9,y+231),f"{i+1:02d} / 20",fill=(239,240,244))
    sheet.save(out,optimize=True)

def run():
    ROOT_OUT.mkdir(parents=True,exist_ok=True)
    masters={}
    for side,name in SIDE.items():
        master=reference_master(SOURCE/name)
        (ROOT_OUT/"masters").mkdir(exist_ok=True)
        path=ROOT_OUT/"masters"/f"loup_volcanique_{side}_candidate_master_512.png"
        master.save(path,optimize=True)
        masters[side]=master
    meta={"source":"official global-assets Loup volcanique player/opponent WebP",
          "createdAt":"2026-10-19",
          "reviewStatus":"PREVIEW_READY_NOT_AUTHORIZED_FOR_CATALOG",
          "scope":"review-only; canonical creature masters and runtime are not modified",
          "subject":"loup_volcanique","framesPerAnimation":20,
          "frameSize":[512,512],"framesPerSecondPreview":12.05,
          "masterStatus":"512x512 RGBA candidates derived from canonical 320x320 WebP; approval required",
          "views":{"face":"opponent facing left","dos":"player facing right"},
          "animations":{}}
    for action in ACTION:
        for side,master in masters.items():
            part=ROOT_OUT/"animations"/action/side
            dframes=part/"frames";dframes.mkdir(parents=True,exist_ok=True)
            frames=[]
            hashes=[]
            for i in range(FRAMES):
                img=warped_reference(master,action,side,i)
                if action=="attaque":
                    img=ignite(img,side,i)
                p=dframes/f"loup_volcanique_{action}_{side}_{i+1:02d}.png"
                img.save(p,optimize=True)
                frames.append(img)
                hashes.append(digest(p))
                arr=np.asarray(img)
                assert img.size==(512,512) and arr.shape[2]==4
                assert arr[0,0,3]==0 and arr[511,511,3]==0
            assert np.array_equal(np.asarray(frames[0]),np.asarray(master))
            assert np.array_equal(np.asarray(frames[-1]),np.asarray(master))
            atlas=Image.new("RGBA",(2560,2048))
            for i,img in enumerate(frames):
                atlas.alpha_composite(img,((i%5)*512,(i//5)*512))
            (part/"atlas").mkdir(exist_ok=True)
            atlas_path=part/"atlas"/f"loup_volcanique_{action}_{side}_5x4.png"
            atlas.save(atlas_path,optimize=True)
            previews=part/"previews";previews.mkdir(exist_ok=True)
            frames[0].save(previews/f"loup_volcanique_{action}_{side}_preview.webp",
                "WEBP",save_all=True,append_images=frames[1:],duration=PREVIEW_MS,
                loop=0,quality=87,method=4,exact=True)
            make_contact(frames,action,side,previews/"contact_sheet.png")
            key=action+"_"+side
            meta["animations"][key]={
               "masterSha256":digest(ROOT_OUT/"masters"/f"loup_volcanique_{side}_candidate_master_512.png"),
               "firstFrameExact":True,
               "lastFrameExact":True,
               "frameCount":FRAMES,
               "frameHashes":hashes,
               "atlas":"animations/"+action+"/"+side+"/atlas/"+atlas_path.name,
               "preview":"animations/"+action+"/"+side+"/previews/loup_volcanique_"+key+"_preview.webp"}
    (ROOT_OUT/"preview_manifest.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    # One portable review package, not a playable or registered runtime asset.
    archive=ROOT_OUT/"loup_volcanique_four_animations_review.zip"
    with zipfile.ZipFile(archive,"w",zipfile.ZIP_DEFLATED,compresslevel=4) as z:
        for p in sorted(ROOT_OUT.rglob("*")):
            if p.is_file() and p!=archive:
                z.write(p,p.relative_to(ROOT_OUT))
    print(json.dumps({"reviewRoot":str(ROOT_OUT.relative_to(ROOT)),
                       "sequences":list(meta["animations"]), "frames":80,
                       "zipBytes":archive.stat().st_size,
                       "masterPixelEqualityVerified":True}))

if __name__=="__main__":
    run()
