#!/usr/bin/env python3
"""Author-approved Ice Walls -> one Capture asset catalog, preserving completed wall frame."""
from __future__ import annotations
import hashlib,io,json,stat,zipfile
from pathlib import Path
from PIL import Image,ImageChops

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/"_incoming/pack_murs_glace_suite_36_frames.zip"
DEST=ROOT/"assets/library/capture/sprites/skills/murs_glace"
CAT=ROOT/"data/assets/catalog/global-visual-assets.v1.json"
SOURCE_SHA="4cf5ac450117c0111079d0cf32caa26acd3d786e5d8d1e022c6d68d197bd03d1"
SOURCE_BLOB="29e729c96d23b2988c985cea94b139e8fc7c8458"
ROLES={
 "mur_glace":("mur-glace","Mur de glace — barrière cristalline",["ice","glace","wall","barrier","defense"]),
 "mur_glace_herisse":("mur-glace-herisse","Mur de glace hérissé — pointes",["ice","glace","wall","spikes","barrier"]),
 "mur_glace_arcanique":("mur-glace-arcanique","Mur de glace arcanique — protection",["ice","glace","wall","arcane","barrier"])
}
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
    blob=SRC.read_bytes()
    assert len(blob)==15386792 and sha(blob)==SOURCE_SHA,"Author ZIP is missing or its contents changed"
    assert hashlib.sha1(b"blob "+str(len(blob)).encode()+b"\0"+blob).hexdigest()==SOURCE_BLOB,"Source git blob mismatch"
    assert not DEST.exists(),"Existing official wall pack must not be overwritten"
    contents={}
    with zipfile.ZipFile(io.BytesIO(blob)) as z:
        infos=z.infolist()
        assert len(infos)==43 and z.testzip() is None,"ZIP CRC or count invalid"
        assert sum(i.file_size for i in infos)<20_000_000,"Unexpected ZIP expansion"
        for info in infos:
            n=info.filename
            assert not info.is_dir() and not n.startswith("/") and ".." not in Path(n).parts,"ZIP path unsafe"
            assert not stat.S_ISLNK((info.external_attr>>16)&0xffff),"ZIP symlink invalid"
            assert n not in contents,"Duplicate source file"
            contents[n]=z.read(n)
    expected={"preview_murs_glace_suite.gif"}
    catalog=json.loads(CAT.read_text("utf8"))
    assert catalog["storage"]["branch"]=="global-assets"
    assert catalog["storage"]["libraryRoot"]=="assets/library/"
    old_ids=[a["id"] for a in catalog["assets"]]
    assert len(set(old_ids))==len(old_ids)
    seq={"packId":"pack:capture:ice-persistent-walls-2026-11-01",
         "sourceArchive":SRC.name,"sourceArchiveSha256":SOURCE_SHA,"sourceGitBlob":SOURCE_BLOB,
         "frameSize":[512,512],"sequences":{}}
    for role,(slug,label,tags) in ROLES.items():
        manifest_file=role+"/manifest.json"
        preview_file=role+"/preview_"+role+".gif"
        frame_names=[f"{role}/png/{role}_{n:02}.png" for n in range(1,13)]
        expected.update((manifest_file,preview_file,*frame_names))
        m=json.loads(contents[manifest_file])
        assert m["name"]==role and m["frames"]==12 and m["frameSize"]==[512,512]
        assert m["transparent"] is True and m["recommendedFrameDurationMs"]==100
        assert m["files"]==[f"png/{role}_{n:02}.png" for n in range(1,13)]
        gif=Image.open(io.BytesIO(contents[preview_file]))
        assert gif.format=="GIF" and gif.n_frames==12
        frames=[]
        for name in frame_names:
            im=Image.open(io.BytesIO(contents[name]))
            assert im.format=="PNG" and im.mode=="RGBA" and im.size==(512,512)
            alpha_lo,alpha_hi=im.getchannel("A").getextrema()
            assert alpha_lo<=1 and alpha_hi>200,"Transparent RGBA sprite required"
            frames.append(im.copy())
        assert len({sha(contents[x]) for x in frame_names})==12
        atlas=Image.new("RGBA",(6144,512),(0,0,0,0))
        for index,img in enumerate(frames):atlas.paste(img,(index*512,0))
        file=role+"_atlas_12f.webp"
        target=DEST/role/file
        target.parent.mkdir(parents=True,exist_ok=False)
        atlas.save(target,"WEBP",lossless=True,method=4,exact=True)
        saved=Image.open(target).convert("RGBA")
        assert saved.size==(6144,512)
        for i,original in enumerate(frames):
            portion=saved.crop((512*i,0,512*(i+1),512))
            assert ImageChops.difference(portion,original).getbbox() is None,"Lossless atlas differs"
        asset_id="pack:capture:sprite-"+slug+"-01"
        assert asset_id not in old_ids,"Duplicate official wall ID"
        old_ids.append(asset_id)
        seq["sequences"][role]={
          "id":asset_id,"frameCount":12,"frameSize":[512,512],
          "constructionDurationMs":1200,"frameMs":100,"playbackMode":"once",
          "holdLastFrame":True,"persistentFrameIndex":11,"atlas":role+"/"+file,
          "preview":preview_file,"sourceFrames":frame_names,
          "note":"Construction plays once and finishes on an intact wall. Combat Barrier Runtime controls lifetime from HP, not this animation."
        }
        catalog["assets"].append({
          "id":asset_id,"label":label+" (12 images, état final persistant)",
          "assetType":"sprite","mediaType":"image","category":"skill",
          "tags":["capture","skill","summon","summoned","persistent","construct","ice","glace","wall","barrier","animated",*tags],
          "source":{"scope":"pack","packId":"capture","author":"GenSrpG / ChatGPT (author-approved visuals)","license":"project-internal"},
          "resource":{"file":"capture/sprites/skills/murs_glace/"+role+"/"+file,
                      "format":"sprite-strip","mime":"image/webp","frameCount":12,"frameMs":100,
                      "playbackMode":"once","holdLastFrame":True},
          "compatibility":{"uses":["combat","capture","editor"]}
        })
    assert set(contents)==expected,("Unexpected source files",set(contents)^expected)
    assert len(old_ids)==len(set(old_ids))
    for name,data in contents.items():
        target=DEST/name
        target.parent.mkdir(parents=True,exist_ok=True)
        assert not target.exists()
        target.write_bytes(data)
    (DEST/"sequence.json").write_text(json.dumps(seq,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    (DEST/"provenance.json").write_text(json.dumps({
      "originalZip":SRC.name,"sourceSha256":SOURCE_SHA,"gitBlob":SOURCE_BLOB,
      "originalBytes":len(blob),"sourceFileSha256":{name:sha(b) for name,b in contents.items()},
      "note":"Original ZIP remains in _incoming, 36 PNGs and previews copied byte-exact; 3 lossless WebP atlases; final frame held until summoned barrier is destroyed by combat rules."
    },ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    catalog["counts"]["assets"]=len(catalog["assets"])
    catalog["counts"]["sprites"]=sum(a["assetType"]=="sprite" for a in catalog["assets"])
    CAT.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("PASS: verified original ZIP, 36 PNG RGBA 512x512, 3 lossless WebP 6144x512, 3 new stable IDs, final frame persistent, no duplicate authority")
if __name__=="__main__":main()
