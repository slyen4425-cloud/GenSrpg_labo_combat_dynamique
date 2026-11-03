#!/usr/bin/env python3
"""Import only approved Gorice movement sprites, 12 player + 12 opponent, from the exact uploaded ZIP."""
from __future__ import annotations
from pathlib import Path, PurePosixPath
from hashlib import sha256, sha1
from PIL import Image
import io, json, zipfile, stat

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_NAME = "GORICE_DEPLACEMENTS_JOUEUR_ADVERSAIRE_24_FRAMES_VALIDES.zip"
ARCHIVE = ROOT / "_incoming" / ARCHIVE_NAME
EXPECTED_SHA256 = "4eb0515e387ba1bbad8ca193f6faed61029a4ed9a20004bff763f254abfc0948"
EXPECTED_GIT_BLOB = "1db42e0a4339bc6dfa3c5c0306fa251a5c7d68d1"
EXPECTED_SIZE = 12722008
DEST_ROOT = ROOT / "assets/library/capture/creatures/gorille_des_glaces/animations/movement"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
MARGIN = 42

def digest(b: bytes) -> str:
    return sha256(b).hexdigest()

def read_rgba(blob: bytes, dimensions=(512, 512)) -> Image.Image:
    with Image.open(io.BytesIO(blob)) as im:
        if im.format != "PNG" or im.mode != "RGBA" or im.size != dimensions:
            raise ValueError("Unexpected frame PNG format/dimensions")
        return im.copy()

def edges(im):
    # Ignore RGB of alpha=0 pixels; all non-negligible alpha, including ice sparkle, counts.
    alpha = im.getchannel("A").point(lambda a: 255 if a >= 8 else 0)
    bb = alpha.getbbox()
    if not bb: raise ValueError("Empty approved frame")
    margins = [bb[0],bb[1],im.width-bb[2],im.height-bb[3]]
    if min(margins) < MARGIN:
        raise ValueError("Sprite exceeds 42px safety zone: " + str(margins))
    return margins

def atlas_matches(atlas_bytes, images):
    with Image.open(io.BytesIO(atlas_bytes)) as im:
        if im.format != "WEBP" or im.size != (6144,512) or im.n_frames != 1:
            raise ValueError("Expected 12 x 512 horizontal WebP atlas")
        atlas = im.convert("RGBA")
    for index, reference in enumerate(images):
        sample = atlas.crop((512*index,0,512*(index+1),512))
        # WebP lossless normalizes RGB at alpha=0; visible colors and all alpha must be lossless.
        if sample.getchannel("A").tobytes() != reference.getchannel("A").tobytes():
            raise ValueError("Atlas alpha differs from PNG at frame " + str(index+1))
        for px,refpx in zip(sample.getdata(),reference.getdata()):
            if refpx[3] and px != refpx:
                raise ValueError("Atlas visible RGBA differs from PNG at frame " + str(index+1))

def main():
    archive_bytes = ARCHIVE.read_bytes()
    if len(archive_bytes)!=EXPECTED_SIZE or digest(archive_bytes)!=EXPECTED_SHA256:
        raise ValueError("Uploaded approved ZIP changed or was replaced")
    gitblob=sha1(b"blob " + str(len(archive_bytes)).encode() + b"\0" + archive_bytes).hexdigest()
    if gitblob!=EXPECTED_GIT_BLOB:raise ValueError("Git source blob mismatch")
    catalog=json.loads(CATALOG.read_text(encoding="utf-8"))
    assert catalog["storage"]["branch"]=="global-assets"
    assert catalog["counts"]["assets"]==len(catalog["assets"])
    existing={x["id"] for x in catalog["assets"]}
    assert len(existing)==len(catalog["assets"])
    if DEST_ROOT.exists():
        raise ValueError("Movement pack already installed; importer must not overwrite approved art")
    outputs={}
    additions=[]
    with zipfile.ZipFile(io.BytesIO(archive_bytes)) as z:
        entries=z.infolist()
        if len(entries)!=35 or z.testzip() is not None:raise ValueError("ZIP CRC/count invalid")
        seen=set()
        for entry in entries:
            n=entry.filename
            if n in seen or entry.is_dir() or n.startswith("/") or ".." in PurePosixPath(n).parts or stat.S_ISLNK((entry.external_attr>>16)&0xffff):
                raise ValueError("Unexpected/unsafe path in ZIP: "+n)
            seen.add(n)
        expected={"LISEZ-MOI.txt","verification_24_frames.json"}
        for view,locale in (("player","JOUEUR"),("opponent","ADVERSAIRE")):
            label="joueur" if view=="player" else "adversaire"
            srcroot="GORICE_deplacement_"+locale+"_12f/"
            framepaths=[srcroot+f"frames/gorice_deplacement_{label}_{i:02d}.png" for i in range(1,13)]
            atlaspath=srcroot+f"atlases/gorice_deplacement_{label}_12f.webp"
            gifpath=srcroot+f"previews/gorice_deplacement_{label}_12f.gif"
            webppath=srcroot+f"previews/gorice_deplacement_{label}_12f.webp"
            authorpath=srcroot+"manifest.json"
            expected.update(framepaths+[atlaspath,gifpath,webppath,authorpath])
            if view=="player":expected.add(srcroot+"verification_marges.json")
            author=json.loads(z.read(authorpath))
            if author["role"]!="movement" or author["view"]!=view or author["frameCount"]!=12 or author["playbackMode"]!="loop" or not author["approvedByUser"]:
                raise ValueError("Invalid author-approved movement manifest "+view)
            if author["frameDurationsMs"] != ([130]*11+[400] if view=="player" else [110]*12):
                raise ValueError("Unexpected author-approved frame durations")
            folder=DEST_ROOT/view
            images=[]
            frames=[]
            unique=set()
            for i,name in enumerate(framepaths):
                blob=z.read(name)
                image=read_rgba(blob)
                margins=edges(image)
                if digest(blob) in unique:raise ValueError("Duplicate frame in "+view)
                unique.add(digest(blob))
                file=f"frames/gorice_deplacement_{label}_{i+1:02d}.png"
                outputs[folder/file]=blob
                frames.append({"index":i,"file":file,"sha256":digest(blob),"marginsLTRB":margins})
                images.append(image)
            atlas=z.read(atlaspath)
            atlas_matches(atlas,images)
            for path,fmt in [(gifpath,"GIF"),(webppath,"WEBP")]:
                with Image.open(io.BytesIO(z.read(path))) as preview:
                    if preview.format!=fmt or preview.n_frames!=12:
                        raise ValueError("Preview is not a genuine 12-frame animation: "+path)
            atlasrel=f"atlases/gorice_deplacement_{label}_12f.webp"
            outputs[folder/atlasrel]=atlas
            previews={
                "gif":f"previews/gorice_deplacement_{label}_12f.gif",
                "animatedWebp":f"previews/gorice_deplacement_{label}_12f.webp",
            }
            outputs[folder/previews["gif"]]=z.read(gifpath)
            outputs[folder/previews["animatedWebp"]]=z.read(webppath)
            aid=f"pack:capture:creature-gorille-des-glaces-movement-{view}-12-v1"
            if aid in existing:raise ValueError("Duplicate official assetId "+aid)
            manifest={
                "schema":"capture-creature-animation-v1",
                "assetId":aid,"creatureId":"gorille_des_glaces","action":"movement",
                "view":view,"frameCount":12,"frameSize":[512,512],
                "frameMs":130 if view=="player" else 110,
                "frameDurationsMs":author["frameDurationsMs"],
                "playbackMode":"loop","safeMarginMinPx":MARGIN,
                "atlas":{"file":atlasrel,"format":"sprite-strip","frameCount":12,
                         "frameWidth":512,"frameHeight":512,"sha256":digest(atlas),"lossless":True},
                "frames":frames,"previews":previews,
                "sourceArchive":ARCHIVE_NAME,"sourceArchiveSha256":EXPECTED_SHA256,
                "sourceGitBlob":EXPECTED_GIT_BLOB,
                "approval":"artist-approved 2026-11-03",
                "authorMasterFrame01":"not-certified-pixel-identical; user approved animated preview with this limitation disclosed",
                "notes":"Frames imported byte-exact from approved ZIP; source poses and orientation preserved. No automatic assignment to creature data; author chooses movement asset using the standard editor."
            }
            outputs[folder/"movement.manifest.json"]=(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n").encode()
            additions.append({
                "id":aid,
                "label":f"Gorice — déplacement {'joueur / dos' if view=='player' else 'adversaire / face'} (12 frames)",
                "assetType":"sprite","mediaType":"image","category":"creature",
                "tags":["capture","creature","gorille-des-glaces","gorice","ice","animated","movement",view, "dos" if view=="player" else "face"],
                "source":{"scope":"pack","packId":"capture","author":"GenSrpG / preview approuvée 2026-11-03","license":"project-internal"},
                "resource":{"file":f"capture/creatures/gorille_des_glaces/animations/movement/{view}/{atlasrel}",
                            "format":"sprite-strip","mime":"image/webp","frameCount":12,
                            "frameMs":130 if view=="player" else 110,"playbackMode":"loop"},
                "compatibility":{"uses":["combat","capture","editor"]}
            })
        if set(z.namelist()) != expected:
            raise ValueError("ZIP file whitelist mismatch: extra "+str(set(z.namelist())-expected)+" missing "+str(expected-set(z.namelist())))
    if len(outputs)!=32:raise ValueError("Expected 24 frames, two atlases, four previews, two manifests: "+str(len(outputs)))
    for dest,b in outputs.items():
        dest.parent.mkdir(parents=True,exist_ok=True)
        dest.write_bytes(b)
    catalog["assets"].extend(additions)
    for key in ("assets","sprites","creatures"):catalog["counts"][key]+=2
    CATALOG.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Gorice movement imported: 12 player + 12 opponent, 2 lossless WebP atlases, 4 previews, single canonical catalog, no gameplay changes.")

if __name__=="__main__":main()
