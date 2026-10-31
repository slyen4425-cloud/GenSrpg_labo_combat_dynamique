#!/usr/bin/env python3
"""Import and validate the exact uploaded snowball cast/projectile/impact ZIP.
One authoritative asset catalog; keep the original ZIP untouched.
"""
from __future__ import annotations
import hashlib, io, json, stat, zipfile
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
NAME="boule_de_neige_pack_complet_36_frames.zip"
SRC=ROOT/"_incoming"/NAME
DEST=ROOT/"assets/library/capture/sprites/skills/boule_de_neige"
CAT=ROOT/"data/assets/catalog/global-visual-assets.v1.json"
ZIP_SHA="a00b6b8272fc2dd960088c6814c0c6d193f063608e2183ab8ec94b6bc01d5abb"
GIT_BLOB="44b98ca229b569d3a64b63359fdad90f6b02e064"
ROLES={"cast":("release",100,"once"),"projectile":("travel",90,"loop"),"impact":("impact",90,"once")}

def digest(b): return hashlib.sha256(b).hexdigest()
def git_hash(b): return hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()
def load_image(b,kind,size):
    im=Image.open(io.BytesIO(b))
    assert im.format==kind and im.size==size,(kind,im.format,im.size)
    return im
def main():
    assert SRC.is_file(),"Author ZIP is missing"
    assert not DEST.exists(),"Refusing to overwrite an existing snowball pack"
    raw=SRC.read_bytes()
    assert len(raw)==20516596 and digest(raw)==ZIP_SHA and git_hash(raw)==GIT_BLOB,"Uploaded archive changed"
    files={}
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        infos=archive.infolist()
        assert len(infos)==82 and archive.testzip() is None,"ZIP entry count or CRC invalid"
        assert sum(i.file_size for i in infos)<26000000,"Unexpected ZIP expansion"
        for entry in infos:
            parts=Path(entry.filename).parts
            assert not entry.is_dir() and not entry.filename.startswith("/") and ".." not in parts
            assert not stat.S_ISLNK((entry.external_attr >> 16)&0xffff)
            assert entry.filename not in files
            files[entry.filename]=archive.read(entry)
    expected={"preview_boule_de_neige_3_animations.gif"}
    cat=json.loads(CAT.read_text(encoding="utf-8"))
    assert cat["storage"]["branch"]=="global-assets"
    assert cat["storage"]["libraryRoot"]=="assets/library/"
    old_ids=[a["id"] for a in cat["assets"]]
    assert len(old_ids)==len(set(old_ids)),"Duplicate IDs in source catalog"
    meta={"packId":"pack:capture:boule-de-neige-2026-10-31","frameSize":[512,512],"sourceArchive":NAME,"sourceArchiveSha256":ZIP_SHA,"sourceGitBlob":GIT_BLOB,"sequences":{}}
    for role,(category,frame_ms,playback) in ROLES.items():
        prefix=f"{role}/"
        frame_names=[f"{prefix}webp/boule_de_neige_{role}_{n:02}.webp" for n in range(1,13)]
        png_names=[f"{prefix}png/boule_de_neige_{role}_{n:02}.png" for n in range(1,13)]
        manifest_name=f"{prefix}manifest.json"
        preview_webp=f"{prefix}preview_boule_de_neige_{role}.webp"
        preview_gif=f"{prefix}preview_boule_de_neige_{role}.gif"
        expected.update(frame_names+png_names+[manifest_name,preview_webp,preview_gif])
        manifest=json.loads(files[manifest_name])
        assert manifest["effect"]==role and manifest["name"]=="Boule de neige"
        assert manifest["frames"]==12 and manifest["frameSize"]==[512,512]
        assert manifest["transparent"] is True
        assert manifest["recommendedFrameDurationMs"]==frame_ms
        assert manifest["recommendedLoop"]==(playback=="loop")
        assert manifest["files"]==[f"webp/boule_de_neige_{role}_{n:02}.webp" for n in range(1,13)]
        frames=[]
        for frame_name,png_name in zip(frame_names,png_names):
            im=load_image(files[frame_name],"WEBP",(512,512)).convert("RGBA")
            png=load_image(files[png_name],"PNG",(512,512)).convert("RGBA")
            assert im.getchannel("A").getextrema()[0]==0
            assert im.getchannel("A").getextrema()[1]>0
            assert png.getchannel("A").getextrema()[0]==0
            frames.append(im)
        assert len({digest(files[n]) for n in frame_names})==12,"Duplicate frames"
        prev=load_image(files[preview_webp],"WEBP",(512,512))
        assert getattr(prev,"n_frames",1)==12,"Animated preview wrong frame count"
        gif=Image.open(io.BytesIO(files[preview_gif]))
        assert gif.format=="GIF" and gif.n_frames==12
        atlas=Image.new("RGBA",(6144,512),(0,0,0,0))
        for n,frame in enumerate(frames): atlas.paste(frame,(n*512,0))
        name=f"boule_de_neige_{role}_atlas_12f.webp"
        asset_id=f"pack:capture:sprite-boule-de-neige-{role}-01"
        assert asset_id not in old_ids,"Conflicting asset ID"
        old_ids.append(asset_id)
        (DEST/role).mkdir(parents=True,exist_ok=False)
        atlas.save(DEST/role/name,"WEBP",lossless=True,method=4,exact=True)
        saved=load_image((DEST/role/name).read_bytes(),"WEBP",(6144,512)).convert("RGBA")
        assert saved.tobytes()==atlas.tobytes(),"Atlas must match all 12 source frames pixel-exactly"
        meta["sequences"][role]={"id":asset_id,"frameCount":12,"frameSize":[512,512],"frameMs":frame_ms,"playbackMode":playback,"atlas":f"{role}/{name}","preview":preview_webp,"sourceFrames":frame_names}
        resource={"file":f"capture/sprites/skills/boule_de_neige/{role}/{name}","format":"sprite-strip","mime":"image/webp","frameCount":12,"frameMs":frame_ms,"playbackMode":playback}
        if role=="projectile": resource["headingRad"]=0
        cat["assets"].append({
          "id":asset_id,"label":f"Boule de neige — {role} (Glace, 12f)",
          "assetType":"sprite","mediaType":"image","category":category,
          "tags":["capture","skill","ice","glace","snow","snowball","boule-de-neige",role,"animated"],
          "source":{"scope":"pack","packId":"capture","author":"GenSrpG / ChatGPT (author-approved visuals)","license":"project-internal"},
          "resource":resource,"compatibility":{"uses":["combat","capture","editor"]}
        })
    assert set(files)==expected,("Unexpected ZIP members",set(files)^expected)
    assert len(old_ids)==len(set(old_ids))
    for name,b in files.items():
        if name=="preview_boule_de_neige_3_animations.gif":
            target=DEST/"preview_boule_de_neige_3_animations.gif"
        else:
            target=DEST/name
        target.parent.mkdir(parents=True,exist_ok=True)
        assert not target.exists()
        target.write_bytes(b)
    (DEST/"sequence.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (DEST/"provenance.json").write_text(json.dumps({
       "archive":NAME,"archiveSha256":ZIP_SHA,"gitBlob":GIT_BLOB,
       "archiveSize":len(raw),"sourceFileSha256":{n:digest(b) for n,b in files.items()},
       "note":"Unmodified ZIP source stays in _incoming, source frames and previews copied byte-identically; atlas losslessly assembled."
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    cat["counts"]["assets"]=len(cat["assets"])
    cat["counts"]["sprites"]=sum(a["assetType"]=="sprite" for a in cat["assets"])
    CAT.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS snowball: exact source 82 ZIP files, 36 RGBA 512x512 WebP frames, 36 PNG, 3 pixel-identical atlas strips, preview, 3 unique IDs, canonical catalog 284.")
if __name__=="__main__":main()
