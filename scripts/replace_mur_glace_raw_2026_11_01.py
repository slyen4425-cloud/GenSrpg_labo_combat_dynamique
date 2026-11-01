#!/usr/bin/env python3
"""One-off, author-approved replacement of the existing arcane ice wall media.
This script is the only binary importer; it never alters Combat State or skill IDs.
"""
from __future__ import annotations
import hashlib, io, json, stat, zipfile
from pathlib import Path
from PIL import Image, ImageChops

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/"_incoming/MUR_GLACE_LABO_COMBAT.zip"
DEST=ROOT/"assets/library/capture/sprites/skills/murs_glace/mur_glace_arcanique"
PACK=ROOT/"assets/library/capture/sprites/skills/murs_glace"
CAT=ROOT/"data/assets/catalog/global-visual-assets.v1.json"
ARCHIVE_SHA="7e47f59f6424a7073f11670ac9424dfec5e2435fd4f1aed1e40acfb8ef9a6ad5"
ARCHIVE_BLOB="c1812d522112dd2b2882a2ed9ca9c315b20da89a"
SOURCE_SHA="acb4e7f803da857a8d4446253478cfe27869e23f33d84da7ec838e97477bd9b3"
ID="pack:capture:sprite-mur-glace-arcanique-01"
PREFIX="assets/library/capture/sprites/skills/murs_glace/mur_glace_arcanique/"
WEBP="mur_glace_arcanique_atlas_12f.webp"
GIF="preview_mur_glace_arcanique.gif"

def hash256(data):return hashlib.sha256(data).hexdigest()

def gitblob(data):return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\\0"+data).hexdigest()

def inspect_alpha(im,index):
    if im.format!="PNG" or im.mode!="RGBA" or im.size!=(512,512):
        raise ValueError(f"frame {index}: expected PNG RGBA 512x512")
    alpha=im.getchannel("A")
    # Ignore purely invisible alpha noise; protect ALL visually relevant pixels.
    bbox=alpha.point(lambda a:255 if a>=8 else 0).getbbox()
    if not bbox:raise ValueError(f"frame {index}: empty")
    left,top,right,bottom=bbox
    margins=(left,top,512-right,512-bottom)
    if min(margins)<42:raise ValueError(f"frame {index}: unsafe margins {margins}")
    return margins

def main():
    raw=SRC.read_bytes()
    if len(raw)!=3431755 or hash256(raw)!=ARCHIVE_SHA or gitblob(raw)!=ARCHIVE_BLOB:
        raise ValueError("Uploaded author ZIP differs from approved GitHub blob")
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        infos=z.infolist()
        if z.testzip() is not None:raise ValueError("ZIP CRC invalid")
        if sum(i.file_size for i in infos)>15_000_000:raise ValueError("ZIP expansion exceeds limit")
        paths=[i.filename for i in infos]
        if len(paths)!=len(set(paths)):raise ValueError("duplicate archive member")
        expected={PREFIX+"manifest.json", PREFIX+WEBP, PREFIX+GIF,
                  *[PREFIX+f"png/mur_glace_arcanique_{i:02}.png" for i in range(1,13)],
                  "README_DEPOT.md","validation_marges.json","verification_12_frames.png"}
        if set(paths)!=expected:raise ValueError(f"Unexpected ZIP files: {set(paths)^expected}")
        for i in infos:
            if i.is_dir() or i.filename.startswith("/") or ".." in Path(i.filename).parts:
                raise ValueError("unsafe ZIP path")
            if stat.S_ISLNK((i.external_attr>>16)&0xffff):
                raise ValueError("ZIP symlink")
        extracted={p:z.read(p) for p in expected}
    manifest=json.loads(extracted[PREFIX+"manifest.json"])
    if (manifest["name"]!="mur_glace_arcanique" or manifest["frames"]!=12 or
        manifest["frameSize"]!=[512,512] or manifest["sourceSheetSha256"]!=SOURCE_SHA or
        manifest["holdLastFrame"] is not True or manifest["persistentFrameIndex"]!=11):
        raise ValueError("Imported manifest differs from approved 12f persistent wall")
    names=[f"png/mur_glace_arcanique_{i:02}.png" for i in range(1,13)]
    if manifest["files"]!=names:raise ValueError("frame manifest order mismatch")
    images=[];margins=[]
    for index,name in enumerate(names,1):
        img=Image.open(io.BytesIO(extracted[PREFIX+name]))
        margins.append(inspect_alpha(img,index))
        images.append(img.convert("RGBA"))
    if len(set(hash256(extracted[PREFIX+name]) for name in names))!=12:
        raise ValueError("duplicate frame")
    atlas=Image.open(io.BytesIO(extracted[PREFIX+WEBP])).convert("RGBA")
    if atlas.size!=(6144,512):raise ValueError("atlas not horizontal 12x512")
    for i,img in enumerate(images):
        tile=atlas.crop((i*512,0,(i+1)*512,512))
        if ImageChops.difference(tile,img).getbbox() is not None:
            raise ValueError(f"atlas differs from frame {i+1}")
    if images[11].getchannel("A").point(lambda a:255 if a>=8 else 0).getbbox()[3]<400:
        raise ValueError("the complete final wall is missing its base")
    gif=Image.open(io.BytesIO(extracted[PREFIX+GIF]))
    if gif.format!="GIF" or gif.n_frames!=12:raise ValueError("bad animation preview")

    # The single canonical catalog already contains the right ID and path.
    catalog=json.loads(CAT.read_text(encoding="utf-8"))
    if catalog["storage"]["branch"]!="global-assets":raise ValueError("wrong catalog owner")
    matches=[a for a in catalog["assets"] if a["id"]==ID]
    if len(matches)!=1:raise ValueError("missing/duplicate existing asset id")
    item=matches[0]
    if item["resource"]["file"]!="capture/sprites/skills/murs_glace/mur_glace_arcanique/"+WEBP:
        raise ValueError("asset path mutated")
    if not (item["resource"]["frameCount"]==12 and
            item["resource"]["playbackMode"]=="once" and
            item["resource"]["holdLastFrame"] is True):
        raise ValueError("persistent animation contract changed")
    item["label"]="Mur de glace brut 2.5D — formation naturelle (12 images, état final persistant)"
    # Preserve ID, media type, lookup path, ownership and compatibility.
    CAT.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\\n",encoding="utf-8")

    # Source snapshot and provenance are inert metadata, not runtime sources.
    for name in ["manifest.json",WEBP,GIF,*names]:
        target=DEST/name
        if not target.exists():raise ValueError(f"canonical asset target absent: {target}")
        target.write_bytes(extracted[PREFIX+name])
    report={"schema":"capture-wall-author-visual-replacement-v1","assetId":ID,
        "approvedZip":SRC.name,"zipSha256":ARCHIVE_SHA,"gitBlob":ARCHIVE_BLOB,
        "sourceSheetSha256":SOURCE_SHA,"frameCount":12,"frameSize":[512,512],
        "safeMarginPx":42,"measuredMargins":margins,
        "atlas":WEBP,"atlasSha256":hash256(extracted[PREFIX+WEBP]),
        "preview":GIF,"playbackMode":"once","holdLastFrame":True,
        "persistentFrameIndex":11,"validation":"actual PNG alpha and pixel-exact lossless atlas verified",
        "replacedExistingAsset":True}
    (DEST/"approved-replacement-2026-11-01.json").write_text(
        json.dumps(report,ensure_ascii=False,indent=2)+"\\n",encoding="utf-8")
    seqpath=PACK/"sequence.json"
    seq=json.loads(seqpath.read_text(encoding="utf-8"))
    entry=seq["sequences"]["mur_glace_arcanique"]
    if entry["id"]!=ID:raise ValueError("sequence not canonical")
    entry["sourceArchive"]=SRC.name
    entry["sourceArchiveSha256"]=ARCHIVE_SHA
    entry["sourceGitBlob"]=ARCHIVE_BLOB
    entry["sourceSheetSha256"]=SOURCE_SHA
    entry["approvedVisual"]="brut-2.5d-angle-3q"
    entry["safeMarginPx"]=42
    seqpath.write_text(json.dumps(seq,ensure_ascii=False,indent=2)+"\\n",encoding="utf-8")
    print("PASS: exact author Git blob, 12 framed PNGs (>=42px margins), 12 exact lossless atlas tiles, GIF preview and 1 canonical ID")
if __name__=="__main__":main()
