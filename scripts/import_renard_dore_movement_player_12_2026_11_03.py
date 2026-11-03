#!/usr/bin/env python3
"""Import only the exact author-approved golden fox player movement into global-assets."""
from __future__ import annotations
from pathlib import Path, PurePosixPath
from hashlib import sha256, sha1
from io import BytesIO
import json
import stat
import zipfile
from PIL import Image, ImageChops

ROOT=Path(__file__).resolve().parents[1]
SOURCE_NAME="RENARD_MAGIQUE_DORE_DEPLACEMENT_JOUEUR_12F_VALIDE (1).zip"
SOURCE=ROOT/"_incoming"/SOURCE_NAME
SOURCE_SIZE=4840282
SOURCE_SHA256="58f2869f7bfde8faea1f339d998eae8d2833a88d3bd89e9ca94e65adb1542d8a"
SOURCE_GIT_BLOB="88fe0398f9856580fa63f2aa96a4ed12703904b2"
SOURCE_ROOT="RENARD_MAGIQUE_DORE_MOUVEMENT_JOUEUR_12F/"
TARGET=ROOT/"assets/library/capture/creatures/renard_magique_dore/animations/movement/player"
CATALOG=ROOT/"data/assets/catalog/global-visual-assets.v1.json"
ASSET_ID="pack:capture:creature-renard-magique-dore-movement-player-12-v1"
FRAME_NAME="renard_magique_dore_mouvement_joueur"
MARGIN=42

def digest(data:bytes)->str:return sha256(data).hexdigest()

def margin_for(im:Image.Image)->list[int]:
    bb=im.getchannel("A").point(lambda p: 255 if p>=8 else 0).getbbox()
    if bb is None:raise ValueError("A 12-frame sprite image is empty")
    margins=[bb[0],bb[1],512-bb[2],512-bb[3]]
    if min(margins)<MARGIN:raise ValueError("Sprite has content inside mandatory 42px border: "+str(margins))
    return margins

def main():
    data=SOURCE.read_bytes()
    if len(data)!=SOURCE_SIZE or digest(data)!=SOURCE_SHA256:raise ValueError("Unapproved ZIP or changed bytes")
    blob=sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()
    if blob!=SOURCE_GIT_BLOB:raise ValueError("Git source blob mismatch")
    if TARGET.exists():raise ValueError("Existing movement target: refusing to overwrite without migration")
    catalog=json.loads(CATALOG.read_text(encoding="utf8"))
    assert catalog["storage"]["branch"]=="global-assets"
    assert catalog["counts"]["assets"]==len(catalog["assets"])
    existing={x["id"] for x in catalog["assets"]}
    if len(existing)!=len(catalog["assets"]) or ASSET_ID in existing:raise ValueError("Duplicate official asset ID")

    expected={"LISEZ_MOI.txt"}
    outputs={}
    with zipfile.ZipFile(BytesIO(data)) as z:
        infos=z.infolist()
        if len(infos)!=19 or z.testzip() is not None:raise ValueError("Unexpected ZIP file count or CRC")
        if sum(i.file_size for i in infos)>20_000_000:raise ValueError("Unexpected expanded ZIP size")
        paths=[i.filename for i in infos]
        if len(set(paths))!=len(paths):raise ValueError("Duplicate ZIP paths")
        for info in infos:
            path=PurePosixPath(info.filename)
            if info.is_dir() or info.filename.startswith("/") or ".." in path.parts or stat.S_ISLNK((info.external_attr>>16)&0xffff):
                raise ValueError("Unsafe archive path: "+info.filename)

        src_manifest=SOURCE_ROOT+"movement.manifest.json"
        src_verification=SOURCE_ROOT+"verification_frames.json"
        src_frames=[SOURCE_ROOT+f"frames/{FRAME_NAME}_{i:02}.png" for i in range(1,13)]
        src_atlas=SOURCE_ROOT+f"atlases/{FRAME_NAME}_12f.webp"
        src_previews={
           "animatedWebp":SOURCE_ROOT+f"previews/{FRAME_NAME}_12f_anime.webp",
           "gif":SOURCE_ROOT+f"previews/{FRAME_NAME}_12f_preview.gif",
           "contactSheet":SOURCE_ROOT+f"previews/{FRAME_NAME}_12f_contact.png",
        }
        expected.update([src_manifest,src_verification,src_atlas,*src_frames,*src_previews.values()])
        if set(paths)!=expected:raise ValueError("Unexpected ZIP structure: "+str(set(paths)^expected))

        artist=json.loads(z.read(src_manifest))
        verification=json.loads(z.read(src_verification))
        if artist["schema"]!="capture-creature-animation-v1" or artist["creatureId"]!="renard_magique_dore" or artist["action"]!="movement" or artist["view"]!="player":
            raise ValueError("Wrong manifest target")
        if artist["orientation"]!="right" or artist["frameCount"]!=12 or artist["frameSize"]!=[512,512]:
            raise ValueError("Wrong frame count, size or orientation")
        if artist["playbackMode"]!="loop" or artist["frameMs"]!=120 or artist["frameDurationsMs"]!=[120]*12:
            raise ValueError("Wrong playback cadence")
        if artist["safeMarginMinPx"]!=42 or artist["measuredMinMarginPx"]<42:raise ValueError("Wrong source margin policy")
        if len(artist["frames"])!=12:raise ValueError("Author manifest incomplete")

        frames=[]
        images=[]
        for i,path in enumerate(src_frames):
            blob=z.read(path)
            with Image.open(BytesIO(blob)) as im:
                if im.format!="PNG" or im.mode!="RGBA" or im.size!=(512,512):
                    raise ValueError("Expected transparent 512×512 RGBA PNG")
                actual=im.copy()
            meta=artist["frames"][i]
            m=margin_for(actual)
            if meta["index"]!=i+1 or meta["marginsLTRB"]!=m or meta["sha256"]!=digest(blob):
                raise ValueError("Source manifest frame mismatch: "+str(i+1))
            alpha=actual.getchannel("A").getextrema()
            if alpha[0]!=0 or alpha[1]<200:raise ValueError("No true transparency: "+str(i+1))
            rel=f"frames/{FRAME_NAME}_{i+1:02}.png"
            outputs[TARGET/rel]=blob
            frames.append({"index":i,"file":rel,"sha256":digest(blob),"marginsLTRB":m})
            images.append(actual)
        if len(set(x["sha256"] for x in frames))!=12:raise ValueError("Frames duplicated")

        atlas=z.read(src_atlas)
        with Image.open(BytesIO(atlas)) as im:
            if im.format!="WEBP" or im.size!=(6144,512) or im.n_frames!=1:raise ValueError("Atlas is not 12x512 lossless strip")
            atlas_img=im.convert("RGBA")
        for i,ref in enumerate(images):
            tile=atlas_img.crop((512*i,0,512*(i+1),512))
            if ImageChops.difference(tile.getchannel("A"),ref.getchannel("A")).getbbox():
                raise ValueError("Atlas alpha differs from original PNG "+str(i+1))
            # Lossless WebP is permitted to canonicalize fully transparent RGB only.
            if any(a!=b for a,b in zip(tile.getdata(),ref.getdata()) if b[3]>0):
                raise ValueError("Atlas visible pixels differ from original PNG "+str(i+1))
        atlas_rel=f"atlases/{FRAME_NAME}_12f.webp"
        outputs[TARGET/atlas_rel]=atlas

        previews={}
        for kind,src in src_previews.items():
            blob=z.read(src)
            with Image.open(BytesIO(blob)) as im:
                if kind=="contactSheet":
                    if im.format!="PNG":raise ValueError("Contact sheet unavailable")
                elif im.n_frames!=12 or im.format!=("WEBP" if kind=="animatedWebp" else "GIF"):
                    raise ValueError("Preview does not contain 12 poses")
            rel="previews/"+PurePosixPath(src).name
            outputs[TARGET/rel]=blob
            previews[kind]=rel

        manifest={
          "schema":"capture-creature-animation-v1","assetId":ASSET_ID,
          "creatureId":"renard_magique_dore","action":"movement","view":"player",
          "orientation":"right","frameCount":12,"frameSize":[512,512],
          "frameMs":120,"frameDurationsMs":[120]*12,"playbackMode":"loop",
          "safeMarginMinPx":MARGIN,"frames":frames,
          "atlas":{"file":atlas_rel,"format":"sprite-strip","frameCount":12,
                   "frameWidth":512,"frameHeight":512,"sha256":digest(atlas),"lossless":True},
          "previews":previews,"sourceArchive":SOURCE_NAME,
          "sourceArchiveSha256":SOURCE_SHA256,"sourceGitBlob":SOURCE_GIT_BLOB,
          "approval":"artist-approved moving preview 2026-11-03",
          "frame01MasterIdentical":False,
          "notes":"Original 12 approved frames are unchanged. Frame 01 pixel identity with author master is NOT certified; do not replace the model master. No automatic skill or movement assignment."
        }
        outputs[TARGET/"movement.manifest.json"]=(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n").encode()

    if len(outputs)!=18:raise ValueError("Wrong number of output files: "+str(len(outputs)))
    entry={
      "id":ASSET_ID,"label":"Renard magique doré — vol ondulant, déplacement joueur (12 frames)",
      "assetType":"sprite","mediaType":"image","category":"creature",
      "tags":["capture","creature","renard-magique-dore","gold","light","spirit","fox","flying","movement","animated","player","dos"],
      "source":{"scope":"pack","packId":"capture","author":"GenSrpG / animation approuvée 2026-11-03","license":"project-internal"},
      "resource":{"file":"capture/creatures/renard_magique_dore/animations/movement/player/"+atlas_rel,
        "format":"sprite-strip","mime":"image/webp","frameCount":12,"frameMs":120,"playbackMode":"loop"},
      "compatibility":{"uses":["combat","capture","editor"]}
    }
    for dest,blob in outputs.items():
        dest.parent.mkdir(parents=True,exist_ok=True)
        dest.write_bytes(blob)
    catalog["assets"].append(entry)
    for key in ("assets","sprites","creatures"):catalog["counts"][key]+=1
    CATALOG.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("PASS: exact approved gold fox movement ZIP, 12 RGBA frames, lossless 6144x512 WebP, previews, one canonical catalog ID")

if __name__=="__main__":main()
