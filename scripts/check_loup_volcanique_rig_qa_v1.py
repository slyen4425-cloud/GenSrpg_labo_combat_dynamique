#!/usr/bin/env python3
"""Validate source-fidelity and create a combined playable 4-up rig art-review GIF.

Review only: does not generate creature pixels and does not change runtime media.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np, json, sys
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/"assets/library/capture/creatures/loup_volcanique"
REVIEW=BASE/"canonical_animation_review_v1"
MASTERS=BASE/"canonical_review_v1"
CANONICAL_EXTERNAL=Path(sys.argv[1]) if len(sys.argv)>1 else None
ORDER=[("movement","face"),("movement","dos"),("attack","face"),("attack","dos")]
ANIMATION_COUNT=20
FRAME_SIZE=512

def open_rgba(path:Path):
    with Image.open(path) as im:
        return im.convert("RGBA")

def alpha_bbox(img:Image.Image):
    alpha=np.asarray(img.getchannel("A"))
    yy,xx=np.nonzero(alpha>10)
    if len(xx)==0:raise AssertionError("Blank transparent frame")
    return [int(xx.min()),int(yy.min()),int(xx.max()),int(yy.max())]

def verify_official():
    source_map={"face":"loup_volcanique_opponent.webp","dos":"loup_volcanique_player.webp"}
    checked={}
    for view,f in source_map.items():
        path=(CANONICAL_EXTERNAL if CANONICAL_EXTERNAL else BASE/"runtime") / f
        canonical=open_rgba(path)
        if canonical.size!=(320,320):raise AssertionError(f"Unexpected canonical shape: {path}")
        master=open_rgba(MASTERS/f"{view}_master_512.png")
        ideal=canonical.resize((512,512),Image.Resampling.LANCZOS)
        same=np.array_equal(np.asarray(ideal),np.asarray(master))
        checked[view]=bool(same)
        if not same:
            diff=int(np.count_nonzero(np.any(np.asarray(ideal)!=np.asarray(master),axis=2)))
            raise AssertionError(f"Master {view} differs from actual published official source on {diff} pixels")
    return checked

same=verify_official()
frames_4=[]
metrics=[]
for action,view in ORDER:
    root=REVIEW/action/view
    model=open_rgba(MASTERS/f"{view}_master_512.png")
    arr_master=np.asarray(model)
    cur=[]
    per=[]
    for i in range(1,ANIMATION_COUNT+1):
        path=root/"frames"/f"loup_volcanique_{action}_{view}_{i:02d}.png"
        im=open_rgba(path)
        if im.size!=(FRAME_SIZE,FRAME_SIZE):raise AssertionError(f"Invalid 512 frame: {path}")
        data=np.asarray(im)
        bbox=alpha_bbox(im)
        dist=int(np.count_nonzero(np.any(data!=arr_master,axis=2)))
        xmin,ymin,xmax,ymax=bbox
        margins=[xmin,ymin,FRAME_SIZE-1-xmax,FRAME_SIZE-1-ymax]
        if min(margins)<28:
            raise AssertionError(f"{action} {view} frame {i} touches 28px safe margin: {margins}")
        if i in (1,20) and dist!=0:raise AssertionError("Frame 01 or 20 not pixel identical to master")
        per.append({"frame":i,"changedPixelsFromMaster":dist,"alphaBBox":bbox,
                    "transparentMarginsLTRB":margins})
        cur.append(im)
    moving=sum(1 for m in per[1:-1] if m["changedPixelsFromMaster"]>150)
    if moving<10:raise AssertionError(f"{action}-{view}: insufficient articulated frames ({moving})")
    metrics.append({"action":action,"view":view,"movingFrames":moving,
                    "medianChangedPixels":int(np.median([m["changedPixelsFromMaster"] for m in per])),
                    "minMargin":min(min(m["transparentMarginsLTRB"]) for m in per),
                    "frames":per})
    frames_4.append(cur)
    print(f"{action:8} {view:4}: moving={moving}, median changed={metrics[-1]['medianChangedPixels']}, minMargin={metrics[-1]['minMargin']}")

# Four-up preview, no creature rendering. Alpha-comp only already-authored sprites.
pages=[]
titles=("Déplacement FACE","Déplacement DOS","Attaque FACE","Attaque DOS")
for i in range(ANIMATION_COUNT):
    canvas=Image.new("RGBA",(744,812),(21,27,38,255))
    d=ImageDraw.Draw(canvas)
    d.text((20,11),"LOUP VOLCANIQUE — MODÈLES OFFICIELS — PROTOTYPE ARTICULÉ",fill=(246,246,246))
    for j in range(4):
        ox=16+(j%2)*372
        oy=39+(j//2)*376
        # Checkerboard is PREVIEW ONLY and never included in PNG/atlas.
        for yy in range(0,342,22):
            for xx in range(0,342,22):
                col=(44,51,63,255) if (xx//22+yy//22)%2 else (35,42,53,255)
                d.rectangle((ox+xx,oy+yy,ox+xx+21,oy+yy+21),fill=col)
        sprite=frames_4[j][i].resize((342,342),Image.Resampling.LANCZOS)
        canvas.alpha_composite(sprite,(ox,oy))
        d.text((ox+10,oy+346),titles[j],fill=(252,251,248))
    d.text((322,791),f"POSE {i+1:02d} / 20",fill=(250,250,250))
    pages.append(canvas.convert("RGB"))
out=REVIEW/"loup_volcanique_4_animations_modele_exact_PREVIEW.gif"
pages[0].save(out,format="GIF",save_all=True,
              append_images=pages[1:],duration=84,
              loop=0,optimize=False,disposal=2)
(REVIEW/"fidelity_qa_report.json").write_text(json.dumps({
    "status":"PREVIEW_ONLY_ART_REVIEW_REQUIRED",
    "publishedCanonicalMatches512Master":same,
    "strictFrame1And20":True,
    "untouchedApprovedCreatureModel":True,
    "noCreatureImageGeneration":True,
    "fourAnimations":metrics
},ensure_ascii=False,indent=2)+"\n")
print("READY four-up preview",str(out.relative_to(ROOT)))
