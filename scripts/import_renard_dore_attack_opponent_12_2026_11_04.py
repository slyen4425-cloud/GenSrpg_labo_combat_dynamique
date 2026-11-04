#!/usr/bin/env python3
"""Install exact artist-approved WebP 12f as canonical opponent ATTACK, not movement."""
from __future__ import annotations

from pathlib import Path, PurePosixPath
from hashlib import sha1, sha256
from io import BytesIO
import json
import stat
import zipfile
from PIL import Image, ImageChops

ROOT=Path(__file__).resolve().parents[1]
SOURCE_NAME="RENARD_MAGIQUE_DORE_ATTAQUE_ADVERSAIRE_12F_VALIDE.zip"
SOURCE=ROOT/"_incoming"/SOURCE_NAME
SOURCE_BYTES=4358878
SOURCE_SHA256="7106cbcdbd2d97a985dd496d79549cf999702bfae6b88aa322bea4f03a436c3b"
SOURCE_GIT_BLOB="3355a2f465d03db5a617de284ef1253a602c16ea"
SRC_ROOT="RENARD_MAGIQUE_DORE_ATTAQUE_ADVERSAIRE_12F/"
PREFIX="renard_magique_dore_attaque_adversaire"
DEST=ROOT/"assets/library/capture/creatures/renard_magique_dore/animations/attack/opponent"
CATALOG=ROOT/"data/assets/catalog/global-visual-assets.v1.json"
ASSET_ID="pack:capture:creature-renard-magique-dore-attack-opponent-12-v1"
MARGIN=42
EXPECTED_PREVIEW_SHA="bb915db0f4ce66059e96f9bb293639f0d674e179d05a8245f064144157b73f57"

def digest(data:bytes)->str:return sha256(data).hexdigest()

def checked_image(data:bytes,format:str,size:tuple[int,int]|None=None,mode:str|None=None):
    with Image.open(BytesIO(data)) as img:
        if img.format!=format or (size is not None and img.size!=size) or (mode and img.mode!=mode):
            raise ValueError(f"Wrong {format} image size/type: {img.size}, {img.mode}")
        return img.copy()

def measured_margins(img):
    bb=img.getchannel("A").point(lambda a:255 if a>=8 else 0).getbbox()
    if bb is None:raise ValueError("Empty frame")
    margins=[bb[0],bb[1],512-bb[2],512-bb[3]]
    if min(margins)<MARGIN:raise ValueError("Frame enters the 42px guard band: "+str(margins))
    if img.getchannel("A").getextrema()!=(0,255):raise ValueError("RGBA must have fully transparent corners and visible content")
    return margins

def main():
    zbytes=SOURCE.read_bytes()
    if len(zbytes)!=SOURCE_BYTES or digest(zbytes)!=SOURCE_SHA256:
        raise ValueError("Approved ZIP source bytes changed")
    source_blob=sha1(b"blob "+str(len(zbytes)).encode()+b"\0"+zbytes).hexdigest()
    if source_blob!=SOURCE_GIT_BLOB:raise ValueError("Git uploaded blob hash differs")
    if DEST.exists():raise ValueError("Target already exists; refuse implicit overwrite")
    catalog=json.loads(CATALOG.read_text(encoding="utf-8"))
    if catalog["storage"]["branch"]!="global-assets" or catalog["counts"]["assets"]!=len(catalog["assets"]):
        raise ValueError("Invalid single-authority official catalog")
    ids=[x["id"] for x in catalog["assets"]]
    if len(set(ids))!=len(ids) or ASSET_ID in ids:raise ValueError("Duplicate catalog IDs")
    if "pack:capture:creature-renard-magique-dore-movement-player-12-v1" not in ids:
        raise ValueError("Do not register attack without protecting previous player movement")

    paths={}
    with zipfile.ZipFile(BytesIO(zbytes)) as z:
        names=z.namelist()
        if len(names)!=17 or len(set(names))!=len(names) or z.testzip() is not None:
            raise ValueError("ZIP content count, duplicate names or CRC invalid")
        if sum(x.file_size for x in z.infolist())>20_000_000:
            raise ValueError("Excessive expanded ZIP size")
        for info in z.infolist():
            parts=PurePosixPath(info.filename)
            if info.is_dir() or info.filename.startswith("/") or ".." in parts.parts or stat.S_ISLNK((info.external_attr>>16)&0xffff):
                raise ValueError("Unsafe ZIP member "+info.filename)
        original=SRC_ROOT+"attack.manifest.json"
        frames_src=[SRC_ROOT+f"frames/{PREFIX}_{n:02}.png" for n in range(1,13)]
        atlas_src=SRC_ROOT+f"atlases/{PREFIX}_12f.webp"
        preview_src=SRC_ROOT+f"previews/{PREFIX}_12f_valide.webp"
        contact_src=SRC_ROOT+f"previews/{PREFIX}_12f_contact.png"
        readme_src=SRC_ROOT+"LISEZ_MOI.txt"
        if set(names)!={original,atlas_src,preview_src,contact_src,readme_src,*frames_src}:
            raise ValueError("Approved ZIP whitelist mismatch")
        approved=json.loads(z.read(original))
        required={
            "schema":"capture-creature-animation-v1",
            "creatureId":"renard_magique_dore",
            "action":"attack","view":"opponent",
            "variant":"ondulation-spirituelle","direction":"left",
            "frameCount":12,"frameSize":[512,512],"frameMs":115,
            "frameDurationsMs":[115]*12,"playbackMode":"once",
            "returnToIdle":True,"holdLastFrame":False,
            "safeMarginMinPx":42,"measuredMinMarginPx":66,
            "frame01MasterIdentical":False
        }
        for key,value in required.items():
            if approved.get(key)!=value:raise ValueError("Author manifest mismatch: "+key)
        if len(approved["frames"])!=12:raise ValueError("Wrong source manifest frames")
        if approved["sourceApprovedAnimationSha256"]!=EXPECTED_PREVIEW_SHA:
            raise ValueError("Preview SHA in manifest does not match approval")

        frames=[];decoded=[]
        for i,source in enumerate(frames_src):
            binary=z.read(source)
            img=checked_image(binary,"PNG",(512,512),"RGBA")
            margins=measured_margins(img)
            author=approved["frames"][i]
            if author.get("index")!=i or author.get("sha256")!=digest(binary) or author.get("marginsLTRB")!=margins:
                raise ValueError("Original frame not consistent with approved manifest: "+str(i))
            rel=f"frames/{PREFIX}_{i+1:02}.png"
            paths[DEST/rel]=binary
            frames.append({"index":i,"file":rel,"sha256":digest(binary),"marginsLTRB":margins})
            decoded.append(img)
        if len(set(x["sha256"] for x in frames))!=12:
            raise ValueError("Duplicate frames not a real 12-frame animation")

        atlas_data=z.read(atlas_src)
        atlas=checked_image(atlas_data,"WEBP",(6144,512)).convert("RGBA")
        if approved["atlas"]["sha256"]!=digest(atlas_data) or not approved["atlas"]["lossless"]:
            raise ValueError("Atlas source mismatch")
        for i,img in enumerate(decoded):
            tile=atlas.crop((i*512,0,(i+1)*512,512))
            if ImageChops.difference(tile.getchannel("A"),img.getchannel("A")).getbbox():
                raise ValueError("Atlas alpha not identical to approved frame "+str(i+1))
            for a,b in zip(tile.getdata(),img.getdata()):
                if b[3] and a!=b:raise ValueError("Atlas visible pixel differs from approved frame "+str(i+1))

        preview_data=z.read(preview_src)
        if digest(preview_data)!=EXPECTED_PREVIEW_SHA:raise ValueError("Approved preview WebP is not byte-identical")
        with Image.open(BytesIO(preview_data)) as preview:
            if preview.format!="WEBP" or preview.n_frames!=12 or preview.size!=(512,512):
                raise ValueError("Expected exact animated WebP, 12 RGBA frames")
        contact_data=z.read(contact_src)
        with Image.open(BytesIO(contact_data)) as contact:
            if contact.format!="PNG":raise ValueError("Missing review contact sheet")

        atlas_rel=f"atlases/{PREFIX}_12f.webp"
        preview_rel=f"previews/{PREFIX}_12f_valide.webp"
        contact_rel=f"previews/{PREFIX}_12f_contact.png"
        paths[DEST/atlas_rel]=atlas_data
        paths[DEST/preview_rel]=preview_data
        paths[DEST/contact_rel]=contact_data
        manifest={
            "schema":"capture-creature-animation-v1","assetId":ASSET_ID,
            "creatureId":"renard_magique_dore","action":"attack","variant":"ondulation-spirituelle",
            "view":"opponent","direction":"left","frameCount":12,"frameSize":[512,512],
            "frameMs":115,"frameDurationsMs":[115]*12,"playbackMode":"once",
            "returnToIdle":True,"holdLastFrame":False,
            "safeMarginMinPx":MARGIN,"measuredMinMarginPx":min(min(f["marginsLTRB"]) for f in frames),
            "frames":frames,
            "atlas":{"file":atlas_rel,"format":"sprite-strip","frameCount":12,
                     "frameWidth":512,"frameHeight":512,"sha256":digest(atlas_data),"lossless":True},
            "previews":{"animatedWebp":preview_rel,"contactSheet":contact_rel},
            "sourceArchive":SOURCE_NAME,"sourceArchiveSha256":SOURCE_SHA256,
            "sourceGitBlob":SOURCE_GIT_BLOB,"approvedPreviewSha256":EXPECTED_PREVIEW_SHA,
            "frame01MasterIdentical":False,
            "notes":"Artwork approved as animated WebP; installed as ATTACK opponent, one playback, not movement. Master original and author creature unchanged."
        }
        paths[DEST/"attack.manifest.json"]=(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n").encode()

    if len(paths)!=16:raise ValueError("Incorrect file emission count "+str(len(paths)))
    for target,blob in paths.items():
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(blob)
    catalog["assets"].append({
      "id":ASSET_ID,"label":"Renard magique doré — attaque spirituelle adversaire (12 frames)",
      "assetType":"sprite","mediaType":"image","category":"creature",
      "tags":["capture","creature","renard-magique-dore","gold","light","spirit","fox","attack","animated","opponent","face"],
      "source":{"scope":"pack","packId":"capture","author":"GenSrpG / WebP approved 2026-11-04","license":"project-internal"},
      "resource":{"file":"capture/creatures/renard_magique_dore/animations/attack/opponent/"+atlas_rel,
                  "format":"sprite-strip","mime":"image/webp","frameCount":12,"frameMs":115,"playbackMode":"once"},
      "compatibility":{"uses":["combat","capture","editor"]}
    })
    for key in ("assets","sprites","creatures"):catalog["counts"][key]+=1
    CATALOG.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS: 12 original RGBA frames, approved WebP, lossless atlas, 66px margin, ATTACK OPPONENT ONCE, source-authoritative catalog")

if __name__=="__main__":main()
