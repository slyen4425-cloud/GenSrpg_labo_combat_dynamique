#!/usr/bin/env python3
"""Convert the exact user-approved 36 PNG frames into 3 lossless WebP atlases.
Register only in global-assets. Never change skills, creatures or historic media.
"""
from __future__ import annotations
import hashlib,io,json,stat,zipfile
from pathlib import Path
from PIL import Image, ImageChops

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"_incoming/pack_sprites_glace_suite_36_frames.zip"
DEST=ROOT/"assets/library/capture/sprites/skills/glace_suite"
CAT=ROOT/"data/assets/catalog/global-visual-assets.v1.json"
SHA256="33f5dce30a96a52990f53e652b21ec0c840f1ab4917c756d2ccfc01135dc1506"
BLOB="7fdd00d190a9c8fd142b465ba7c1befd39602ae6"
ROLES={
    "zone_gelee":("zone-gelee","Zone gelée — sol glacé","skill",100,["zone","ground","freeze","gel","area"]),
    "pointe_glace":("pointe-glace","Pointe de glace — éruption","impact",90,["impact","spike","ground","eruption","crystal"]),
    "brouillard_gelant":("brouillard-gelant","Brouillard gelant — brume givrée","skill",100,["zone","fog","mist","aura","freeze"]),
}
def digest(b):return hashlib.sha256(b).hexdigest()
def main():
    raw=SOURCE.read_bytes()
    assert len(raw)==13489375 and digest(raw)==SHA256, "uploaded ZIP differs from author pack"
    assert hashlib.sha1(b"blob "+str(len(raw)).encode()+b"\0"+raw).hexdigest()==BLOB, "wrong source git blob"
    assert not DEST.exists(),"do not overwrite imported VFX"
    members={}
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        info=z.infolist()
        assert len(info)==43 and z.testzip() is None,"ZIP CRC/count invalid"
        assert sum(i.file_size for i in info)<19000000,"expanded ZIP exceeds limit"
        for f in info:
            name=f.filename
            assert not f.is_dir() and not name.startswith("/") and ".." not in Path(name).parts
            assert not stat.S_ISLNK((f.external_attr >> 16)&0xffff),"ZIP symlink"
            assert name not in members,"duplicate ZIP member"
            members[name]=z.read(name)
    expected={"preview_sprites_glace_suite.gif"}
    cat=json.loads(CAT.read_text(encoding="utf8"))
    assert cat["storage"]["branch"]=="global-assets"
    assert cat["storage"]["libraryRoot"]=="assets/library/"
    ids=[a["id"] for a in cat["assets"]]
    assert len(ids)==284 and len(ids)==len(set(ids)), "unexpected baseline catalog"
    sequence={"packId":"pack:capture:ice-ground-spike-fog-2026-10-31",
              "sourceArchive":SOURCE.name,"sourceArchiveSha256":SHA256,"sourceGitBlob":BLOB,
              "frameSize":[512,512],"sequences":{}}
    for role,(slug,label,category,ms,tags) in ROLES.items():
        manifest_name=role+"/manifest.json"
        preview=role+"/preview_"+role+".gif"
        frames=[role+"/png/"+role+"_"+f"{n:02d}"+".png" for n in range(1,13)]
        expected.update([manifest_name,preview,*frames])
        m=json.loads(members[manifest_name])
        assert m["name"]==role and m["frames"]==12 and m["frameSize"]==[512,512]
        assert m["transparent"] is True and m["recommendedFrameDurationMs"]==ms
        assert m["files"]==["png/"+role+"_"+f"{n:02d}"+".png" for n in range(1,13)]
        gif=Image.open(io.BytesIO(members[preview]))
        assert gif.format=="GIF" and gif.n_frames==12
        images=[]
        for name in frames:
            img=Image.open(io.BytesIO(members[name]))
            assert img.format=="PNG" and img.size==(512,512) and img.mode=="RGBA"
            min_a,max_a=img.getchannel("A").getextrema()
            assert min_a==0 and max_a>0,"transparent alpha and nonempty pixels required"
            images.append(img.copy())
        assert len({digest(members[name]) for name in frames})==12,"duplicate frame"
        atlas=Image.new("RGBA",(6144,512),(0,0,0,0))
        for index,frame in enumerate(images): atlas.paste(frame,(index*512,0))
        atlas_name=role+"_atlas_12f.webp"
        output=DEST/role/atlas_name
        output.parent.mkdir(parents=True,exist_ok=False)
        atlas.save(output,"WEBP",lossless=True,method=4,exact=True)
        check=Image.open(output).convert("RGBA")
        assert check.size==(6144,512)
        for index,frame in enumerate(images):
            assert ImageChops.difference(check.crop((index*512,0,(index+1)*512,512)),frame).getbbox() is None,"atlas differs from original PNG frame"
        asset_id="pack:capture:sprite-"+slug+"-01"
        assert asset_id not in ids
        ids.append(asset_id)
        sequence["sequences"][role]={
          "id":asset_id,"frameSize":[512,512],"frameCount":12,"frameMs":ms,
          "playbackMode":"once","holdLastFrame":True,
          "atlas":role+"/"+atlas_name,"preview":preview,"sourceFrames":frames
        }
        cat["assets"].append({
          "id":asset_id,"label":label+" (Glace, 12f)",
          "assetType":"sprite","mediaType":"image","category":category,
          "tags":["capture","skill","glace","ice","frost","animated",*tags],
          "source":{"scope":"pack","packId":"capture","author":"GenSrpG / ChatGPT (approved Ice VFX)","license":"project-internal"},
          "resource":{"file":"capture/sprites/skills/glace_suite/"+role+"/"+atlas_name,
                      "format":"sprite-strip","mime":"image/webp","frameCount":12,
                      "frameMs":ms,"playbackMode":"once","holdLastFrame":True},
          "compatibility":{"uses":["combat","capture","editor"]}
        })
    assert set(members)==expected,("unexpected source files",set(members)^expected)
    assert len(ids)==287 and len(ids)==len(set(ids))
    for name,b in members.items():
        dest=DEST/name
        dest.parent.mkdir(parents=True,exist_ok=True)
        assert not dest.exists()
        dest.write_bytes(b)
    (DEST/"sequence.json").write_text(json.dumps(sequence,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    (DEST/"provenance.json").write_text(json.dumps({
      "originalZip":SOURCE.name,"sourceSha256":SHA256,"gitBlob":BLOB,
      "originalBytes":len(raw),"sourceFileSha256":{p:digest(b) for p,b in members.items()},
      "note":"Author 36 PNG frames, GIF previews and metadata copied unchanged. Three atlas WebP assembled losslessly. Source ZIP remains in _incoming."
    },ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    cat["counts"]["assets"]=len(cat["assets"])
    cat["counts"]["sprites"]=sum(a["assetType"]=="sprite" for a in cat["assets"])
    CAT.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("SUCCESS: 43 verified ZIP members, 36 transparent PNG 512x512, 3 real lossless atlas WebP 6144x512 and 3 official unique IDs, no double catalog.")
if __name__=="__main__":main()
