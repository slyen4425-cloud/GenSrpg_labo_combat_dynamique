#!/usr/bin/env python3
"""Audit canonical Loup volcanique WebPs and propose minimal isolated-artifact cleanup.

Never creates an invented creature. Never modifies existing runtime media.
Writes only review candidates and a detailed component report.
"""
from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import cv2
import numpy as np
import json
import hashlib

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/"assets/library/capture/creatures/loup_volcanique"
REVIEW=BASE/"canonical_review_v1"
REVIEW.mkdir(exist_ok=True,parents=True)

def hash_file(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def audit(view, source):
    rgba=np.array(Image.open(source).convert("RGBA"))
    if rgba.shape!=(320,320,4):raise ValueError((view,rgba.shape))
    alpha=rgba[:,:,3]
    n,l,stats,cent=cv2.connectedComponentsWithStats((alpha>=40).astype("uint8"),8)
    comps=[]
    for k in range(1,n):
        x,y,w,h,area=map(int,stats[k])
        comps.append({"label":k,"bbox":[x,y,w,h],"area":area,"center":list(map(float,cent[k]))})
    comps.sort(key=lambda c:-c["area"])
    baseline=Image.fromarray(rgba,"RGBA")
    baseline.save(REVIEW/f"{view}_master_original_320.png")
    # Diagnostic preview does not alter pixels.
    diagnostic=Image.new("RGBA",(960,960),(29,33,42,255))
    large=baseline.resize((960,960),Image.Resampling.NEAREST)
    diagnostic.alpha_composite(large)
    d=ImageDraw.Draw(diagnostic)
    for c in comps:
        x,y,w,h=c["bbox"]
        if c["area"]<7:continue
        color=(255,64,100,255) if c["area"]<160 else (0,220,200,255)
        d.rectangle((3*x,3*y,3*(x+w),3*(y+h)),outline=color,width=2)
        d.text((3*x,3*y),str(c["label"]),fill=(255,255,255,255))
    diagnostic.convert("RGB").save(REVIEW/f"{view}_components_audit.jpg",quality=95)
    target=None;candidate=baseline.copy()
    if view=="dos":
        # Suspect fragment floating above wolf head, around image coord (229,85).
        # Safe to remove ONLY a small fully disconnected component here.
        suspects=[c for c in comps if 196<=c["center"][0]<=256 and
                  60<=c["center"][1]<=112 and c["area"]<=350 and
                  c["bbox"][2]<45 and c["bbox"][3]<43]
        if suspects:
            target=sorted(suspects,key=lambda c:
                abs(c["center"][0]-228)+abs(c["center"][1]-85))[0]
            if target["area"]>=8:
                # Preserve glowing flame particles: only remove dark stone-like
                # RGB pixels inside chosen component. If mixed colors, refuse.
                region=(l==target["label"])
                colors=rgba[:,:,:3][region]
                is_dark=((colors[:,0]<165)&(colors[:,1]<125)).mean() if len(colors) else 0
                if is_dark > .8:
                    # Remove entire component and 1px feather ring, not body.
                    region=cv2.dilate(region.astype("uint8"),np.ones((3,3),np.uint8)).astype(bool)
                    arr=rgba.copy()
                    arr[region]=0
                    candidate=Image.fromarray(arr,"RGBA")
                    target={**target,"removedPixels":int(region.sum()),"darkFraction":float(is_dark)}
                else:
                    target={**target,"refusalReason":f"Selected component is not dark (fraction {is_dark:.3f})"}
    candidate.save(REVIEW/f"{view}_candidate_320.png")
    # Also save canonical-based 512px *masters* for frame 01 equality tests.
    candidate.resize((512,512),Image.Resampling.LANCZOS).save(REVIEW/f"{view}_master_512.png")
    orig=baseline.resize((512,512),Image.Resampling.LANCZOS)
    cand=candidate.resize((512,512),Image.Resampling.LANCZOS)
    canvas=Image.new("RGB",(1070,566),(24,30,40))
    for idx,im in enumerate((orig,cand)):
        x=18+idx*532;y=42
        canvas.paste(im.convert("RGB"),(x,y),mask=im.getchannel("A"))
    d=ImageDraw.Draw(canvas)
    d.text((24,14),f"{view.upper()} ORIGINAL",fill=(255,255,255))
    d.text((552,14),f"{view.upper()} CANDIDATE",fill=(255,255,255))
    canvas.save(REVIEW/f"{view}_before_after.jpg",quality=93)
    return {"view":view,"source":str(source.relative_to(ROOT)),"sourceSha256":hash_file(source),
            "connectedComponents":comps,"candidateRemoved":target,
            "candidateChanged":not np.array_equal(rgba,np.array(candidate)),
            "candidateSha256":hash_file(REVIEW/f"{view}_candidate_320.png")}

records=[audit("dos",BASE/"runtime/loup_volcanique_player.webp"),
         audit("face",BASE/"runtime/loup_volcanique_opponent.webp")]
(REVIEW/"audit_report.json").write_text(json.dumps({"notes":[
    "Published official models never overwritten by this operation",
    "Master 512px derived from exact canonical 320 source (after any tiny artifact removal)",
    "New animation frame 01 MUST match 512px master RGBA pixel-for-pixel",
    "Cannot use old V3 animation pose sheets (different creature)"
],"records":records},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps([{"view":x["view"],"candidateRemoved":x["candidateRemoved"],
    "components":len(x["connectedComponents"])} for x in records],ensure_ascii=False))
