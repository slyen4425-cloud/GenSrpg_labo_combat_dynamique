#!/usr/bin/env python3
"""Install verified, artist-approved Hériplante player animations, preserving all originals."""
from __future__ import annotations
from pathlib import Path, PurePosixPath
from zipfile import ZipFile
from io import BytesIO
from hashlib import sha1, sha256
from PIL import Image, ImageChops
import json, stat

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/"assets/library/capture/creatures/heriplante"
CATALOG=ROOT/"data/assets/catalog/global-visual-assets.v1.json"
SOURCES={
  "attack":{
    "archive":"heriplante_attaque_joueur_dos_12f.zip",
    "git":"b5ccd543d708808b5b9c0555dd0a8adfdd41f63f",
    "sha256":"9aefacb1ce72955d95f5b5867c52a01e86d331cd0e7d048fb9c8f4841f06006c",
    "prefix":"heriplante_attaque_joueur_dos_12f/",
    "frame":"frames/heriplante_attack_player_{:02d}.png",
    "manifest":"manifest.json",
    "atlas":"atlas/heriplante_attack_player_12_atlas.png",
    "preview":"previews/heriplante_attack_player_12f_512.webp",
    "source_preview":"previews/heriplante_attaque_dos_preview_12f.webp",
    "contact":"previews/heriplante_attaque_dos_contact_12f.jpg",
    "frameMs":125,"playbackMode":"once",
    "id":"pack:capture:creature-heriplante-attack-player-12-v1"
  },
  "movement":{
    "archive":"HERIPLANTE_COURSE_JOUEUR_12F_VALIDEE.zip",
    "git":"e32b4735c4cd84a7c63e8620b10f96e97e190f38",
    "sha256":"81de09ee0db5aa41ce32aa40e590de9bf164feb20a0b9191e80c37593c00ae08",
    "prefix":"HERIPLANTE_COURSE_JOUEUR_12F/",
    "frame":"frames/heriplante_course_joueur_{:02d}.png",
    "manifest":"movement.manifest.json",
    "atlas":"atlases/heriplante_course_joueur_12f.webp",
    "preview":"previews/heriplante_course_joueur_12f_preview.webp",
    "contact":"previews/heriplante_course_joueur_12f_contact.png",
    "frameMs":100,"playbackMode":"loop",
    "id":"pack:capture:creature-heriplante-movement-player-12-v1"
  }
}
def digest(b):return sha256(b).hexdigest()
def read_image(b,fmt,size):
    with Image.open(BytesIO(b)) as im:
        if im.format!=fmt or im.size!=size or im.mode!="RGBA" or getattr(im,"n_frames",1)!=1:
            raise ValueError("Unexpected image format, shape, mode or frames: "+str((im.format,im.size,im.mode)))
        return im.copy()
def margins(im):
    bb=im.getchannel("A").point(lambda p:255 if p>=8 else 0).getbbox()
    if bb is None:raise ValueError("Empty sprite")
    return [bb[0],bb[1],512-bb[2],512-bb[3]]
def validate_zip(name,cfg):
    b=(BASE/cfg["archive"]).read_bytes()
    if digest(b)!=cfg["sha256"]:raise ValueError("Unapproved source bytes: "+name)
    if sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()!=cfg["git"]:
        raise ValueError("Wrong GitHub blob: "+name)
    z=ZipFile(BytesIO(b))
    infos=z.infolist()
    if z.testzip() or len(set(i.filename for i in infos))!=len(infos) or len(infos)>50 or sum(i.file_size for i in infos)>60_000_000:
        raise ValueError("Invalid or unsafe ZIP envelope: "+name)
    for info in infos:
        p=PurePosixPath(info.filename)
        if info.filename.startswith("/") or ".." in p.parts or stat.S_ISLNK((info.external_attr>>16)&0xffff):
            raise ValueError("Unsafe ZIP member "+info.filename)
    return z

catalog=json.loads(CATALOG.read_text(encoding="utf8"))
if catalog["storage"]["branch"]!="global-assets" or catalog["counts"]["assets"]!=len(catalog["assets"]):
    raise ValueError("Wrong official catalog")
ids=[a["id"] for a in catalog["assets"]]
if len(set(ids))!=len(ids) or not all(c["id"] not in ids for c in SOURCES.values()):
    raise ValueError("Duplicate official asset IDs")
if "pack:capture:creature-heriplante-player-01" not in ids:
    raise ValueError("Hériplante player master missing")
if (BASE/"animations").exists():
    raise ValueError("Refusing to overwrite pre-existing Hériplante animation files")

outputs={}
new_entries=[]
for action,cfg in SOURCES.items():
    with validate_zip(action,cfg) as z:
        prefix=cfg["prefix"]
        source=json.loads(z.read(prefix+cfg["manifest"]))
        if action=="attack":
            if (source["schema"]!="gensrpg-artistic-animation-bundle-v1" or
                source["creatureSlug"]!="heriplante" or source["action"]!="attack" or
                source["sourceView"]!="player_dos" or source["frameCount"]!=12 or
                not source["frame01ExactMasterRGBA"]):
                raise ValueError("Attack author manifest mismatch")
        else:
            if (source["schema"]!="capture-creature-animation-v1" or
                source["creatureId"]!="heriplante" or source["action"]!="movement" or
                source["view"]!="player" or source["variant"]!="run" or
                source["frameCount"]!=12 or source["playbackMode"]!="loop"):
                raise ValueError("Movement author manifest mismatch")
        dest=BASE/"animations"/action/"player"
        frame_objects=[]; frame_list=[]
        for i in range(1,13):
            src_rel=cfg["frame"].format(i)
            frame_bytes=z.read(prefix+src_rel)
            img=read_image(frame_bytes,"PNG",(512,512))
            m=margins(img)
            if min(m)<16 or any(img.getpixel(p)[3]!=0 for p in ((0,0),(511,0),(0,511),(511,511))):
                raise ValueError("Clipped frame or missing transparency: "+src_rel)
            if action=="movement":
                met=source["frames"][i-1]
                if met["sha256"]!=digest(frame_bytes) or met["marginsLTRB"]!=m or met["index"]!=i-1:
                    raise ValueError("Movement source frame mismatch: "+src_rel)
            else:
                manifest_hash=next((item["sha256"] for item in source["files"] if item["path"]==src_rel),None)
                if manifest_hash!=digest(frame_bytes):
                    raise ValueError("Attack source frame mismatch: "+src_rel)
            rel="frames/heriplante_"+action+"_player_"+str(i).zfill(2)+".png"
            outputs[dest/rel]=frame_bytes
            frame_objects.append(img)
            frame_list.append({"index":i-1,"file":rel,"sha256":digest(frame_bytes),"marginsLTRB":m})
        if len({f["sha256"] for f in frame_list})!=12:raise ValueError("Duplicate pose frames")
        if action=="attack":
            master=z.read(prefix+"reference/heriplante_joueur_dos_master.png")
            if z.read(prefix+cfg["frame"].format(1))!=master or master!=(BASE/"runtime/heriplante_joueur_dos.png").read_bytes():
                raise ValueError("Frame 01 not exactly equal to official Hériplante player master")
            atlas_review=z.read(prefix+cfg["atlas"])
            grid=read_image(atlas_review,"PNG",(2048,1536))
            for i,im in enumerate(frame_objects):
                x,y=(i%4)*512,(i//4)*512
                got=grid.crop((x,y,x+512,y+512))
                if ImageChops.difference(got.getchannel("A"),im.getchannel("A")).getbbox():
                    raise ValueError("Approved 4x3 atlas frame alpha differs")
            outputs[dest/"sources/heriplante_attack_player_4x3_original.png"]=atlas_review
            strip=Image.new("RGBA",(6144,512))
            for i,im in enumerate(frame_objects):strip.paste(im,(512*i,0))
            buffer=BytesIO();strip.save(buffer,format="WEBP",lossless=True,method=6)
            atlas_data=buffer.getvalue()
        else:
            atlas_data=z.read(prefix+cfg["atlas"])
            atlas=Image.open(BytesIO(atlas_data)).convert("RGBA")
            if atlas.size!=(6144,512):
                raise ValueError("Movement source atlas must be 12 frames strip")
            for i,im in enumerate(frame_objects):
                tile=atlas.crop((i*512,0,(i+1)*512,512))
                if ImageChops.difference(tile.getchannel("A"),im.getchannel("A")).getbbox():
                    raise ValueError("Movement atlas alpha differs from approved frames")
                if any(a!=b for a,b in zip(tile.getdata(),im.getdata()) if b[3]>0):
                    raise ValueError("Movement atlas visible pixels differ from approved frames")
            if source["atlas"]["sha256"]!=digest(atlas_data):
                raise ValueError("Wrong original movement atlas hash")
        with Image.open(BytesIO(atlas_data)) as original_atlas:
            if original_atlas.format!="WEBP" or original_atlas.size!=(6144,512):raise ValueError("Wrong atlas WebP")
        atlas_rel="atlases/heriplante_"+action+"_player_12f.webp"
        outputs[dest/atlas_rel]=atlas_data
        preview_data=z.read(prefix+cfg["preview"])
        with Image.open(BytesIO(preview_data)) as pv:
            if pv.format!="WEBP" or pv.size!=(512,512) or pv.n_frames!=12:
                raise ValueError("Preview not the approved 12-frame WebP")
        preview_rel="previews/heriplante_"+action+"_player_preview_12f.webp"
        outputs[dest/preview_rel]=preview_data
        contact_data=z.read(prefix+cfg["contact"])
        contact_ext="jpg" if action=="attack" else "png"
        contact_rel="previews/heriplante_"+action+"_player_contact_12f."+contact_ext
        outputs[dest/contact_rel]=contact_data
        if action=="attack":
            original_preview=z.read(prefix+cfg["source_preview"])
            outputs[dest/"sources/heriplante_attack_author_approved_preview_12f.webp"]=original_preview
        manifest={
          "schema":"capture-creature-animation-v1","assetId":cfg["id"],"creatureId":"heriplante",
          "action":action,"view":"player","direction":"right","frameCount":12,"frameSize":[512,512],
          "frameMs":cfg["frameMs"],"frameDurationsMs":[cfg["frameMs"]]*12,
          "playbackMode":cfg["playbackMode"],"returnToIdle":action=="attack",
          "holdLastFrame":False,"frames":frame_list,
          "measuredMinMarginPx":min(min(f["marginsLTRB"]) for f in frame_list),
          "sourceMasterFrame01Identical":True if action=="attack" else "not_verified",
          "atlas":{"file":atlas_rel,"format":"sprite-strip","frameCount":12,
                   "frameWidth":512,"frameHeight":512,"sha256":digest(atlas_data),"lossless":True},
          "previews":{"animatedWebp":preview_rel,"contactSheet":contact_rel},
          "sourceArchive":cfg["archive"],"sourceArchiveSha256":cfg["sha256"],
          "sourceGitBlob":cfg["git"],
          "notes":("Original approved poses unchanged. Attack source master has 18 px margin, less than 32 px guideline; requires artist visual acceptance at runtime."
                   if action=="attack" else
                   "Original approved running poses preserved. Running silhouette is smaller than source master; test in actual editor before production claim.")
        }
        outputs[dest/(action+".manifest.json")]=(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n").encode()
        new_entries.append({
          "id":cfg["id"],
          "label":"Hériplante — "+("attaque des lianes" if action=="attack" else "course") +" joueur, dos (12 frames)",
          "assetType":"sprite","mediaType":"image","category":"creature",
          "tags":["capture","creature","heriplante","nature",action,"animated","player","dos"],
          "source":{"scope":"pack","packId":"capture","author":"GenSrpG / approuvé 2026-11-04","license":"project-internal"},
          "resource":{"file":"capture/creatures/heriplante/animations/"+action+"/player/"+atlas_rel,
                      "format":"sprite-strip","mime":"image/webp","frameCount":12,
                      "frameMs":cfg["frameMs"],"playbackMode":cfg["playbackMode"]},
          "compatibility":{"uses":["combat","capture","editor"]}
        })
for target,content in outputs.items():
    target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(content)
catalog["assets"].extend(new_entries)
for k in ("assets","sprites","creatures"): catalog["counts"][k]+=2
CATALOG.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("PASS: preserved exact approved 12+12 RGBA frames, 2 canonical WebP strips, previews, 2 manifests, 2 unique official IDs")
print("WARN: attack model requires 18px canvas margin, running poses have a smaller silhouette; editor real-scale test mandatory")
