#!/usr/bin/env python3
"""Publish user-approved POURPRE adversary animations; never touch creature_violette."""
from pathlib import Path
from PIL import Image
import hashlib, io, json, zipfile

SOURCE=Path("_incoming/creature_pourpre_face_mouvement_attaque_12f_valide.zip")
SOURCE_SHA256="9817f86f4c76d5e09f785cafa99b6cace5e910dd9d4ba7e76267a9b38279619c"
SOURCE_BLOB_SHA="f5a16e641ebc0ed79663825b1b72349fc7847582"
CATALOG=Path("data/assets/catalog/global-visual-assets.v1.json")
CREATURE_ROOT=Path("assets/library/capture/creatures/creature_pourpre")
MASTER=CREATURE_ROOT/"runtime/creature_pourpre_face.png"
SPECS={
    "movement":dict(src="mouvement_face",stem="mouvement",frame_ms=83,loop=True,label="Créature pourpre — Course face (12 frames)"),
    "attack":dict(src="attaque_face",stem="attaque",frame_ms=83,loop=False,label="Créature pourpre — Attaque face (12 frames)"),
}

def sha256(data):return hashlib.sha256(data).hexdigest()
def gitsha(data):return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()
def same_visible(a,b):
    if a.size!=b.size or a.getchannel("A").tobytes()!=b.getchannel("A").tobytes():return False
    back=Image.new("RGBA",a.size,(0,0,0,255))
    return Image.alpha_composite(back,a).tobytes()==Image.alpha_composite(back,b).tobytes()

def check_frame(img,action,n):
    assert img.mode=="RGBA" and img.size==(512,512),(action,n,img.mode,img.size)
    alpha=img.getchannel("A");bbox=alpha.getbbox()
    assert bbox,(action,n,"empty")
    left,top,right,bottom=bbox
    margins=(left,top,512-right,512-bottom)
    assert min(margins)>=42,(action,n,"margins",margins)
    assert alpha.getextrema()==(0,255),(action,n,"invalid transparency")
    return margins

def main():
    raw=SOURCE.read_bytes()
    assert sha256(raw)==SOURCE_SHA256, "approved archive SHA256 mismatch"
    assert gitsha(raw)==SOURCE_BLOB_SHA,"Git blob mismatch"
    catalog=json.loads(CATALOG.read_text(encoding="utf8"))
    old=list(catalog["assets"])
    old_ids={a["id"] for a in old}
    assert len(old_ids)==len(old)
    assert "pack:capture:creature-pourpre-opponent-01" in old_ids
    assert "pack:capture:creature-pourpre-movement-player-8-v1" in old_ids
    assert "pack:capture:creature-pourpre-attack-player-8-v1" in old_ids
    assert "pack:capture:creature-violette-movement-opponent-8-v1" in old_ids
    with Image.open(MASTER) as im:master=im.convert("RGBA")
    check_frame(master,"master",1)
    new_entries=[]
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        assert z.testzip() is None, "corrupt author archive"
        meta=json.loads(z.read("manifest.json"))
        assert meta.get("count_per_animation")==12
        assert meta.get("view","").startswith("face")
        with Image.open(io.BytesIO(z.read("master/creature_pourpre_face_modele_original.png"))) as im:
            supplied_master=im.convert("RGBA")
        print("SOURCE_MASTER_EQUALS_CANONICAL",supplied_master.tobytes()==master.tobytes())
        for action, spec in SPECS.items():
            folder=CREATURE_ROOT/"animations"/action/"opponent"
            frames_folder=folder/"frames";atlas_folder=folder/"atlases";preview_folder=folder/"previews"
            for d in (frames_folder,atlas_folder,preview_folder):d.mkdir(parents=True,exist_ok=True)
            frames=[];frame_sha=[];source_sha=[];frame_margins=[]
            for i in range(1,13):
                entry=f"{spec['src']}/frames/creature_pourpre_{spec['stem']}_face_{i:02d}.png"
                original=z.read(entry)
                source_sha.append(sha256(original))
                with Image.open(io.BytesIO(original)) as im:frame=im.convert("RGBA")
                assert frame.size==(512,512),"wrong original source dimensions"
                # Exact first pose must match the already-published, artist-approved
                # face model, as the author's archive warns it currently does not.
                # This targeted single-frame correction does not repaint any other frame.
                if i==1:
                    print("REPLACE_NONIDENTICAL_FRAME_01",action,"was_same_master",frame.tobytes()==master.tobytes())
                    frame=master.copy()
                frame_margins.append(check_frame(frame,action,i))
                frames.append(frame)
                dest=frames_folder/f"creature_pourpre_{action}_opponent_{i:02d}.png"
                frame.save(dest,format="PNG",optimize=True)
                frame_sha.append(sha256(dest.read_bytes()))
            assert len(set(f.tobytes() for f in frames))==12,action
            assert frames[0].tobytes()==master.tobytes(), "first frame not master"
            atlas=Image.new("RGBA",(12*512,512),(0,0,0,0))
            for index,frame in enumerate(frames):
                atlas.alpha_composite(frame,(index*512,0))
            atlas_name=f"creature_pourpre_{action}_opponent_12_atlas.webp"
            atlas_path=atlas_folder/atlas_name
            atlas.save(atlas_path,format="WEBP",lossless=True,method=6)
            with Image.open(atlas_path) as readback:
                assert same_visible(atlas,readback.convert("RGBA")),(action,"bad atlas")
            preview_name=f"creature_pourpre_{action}_opponent_12_preview.webp"
            preview_path=preview_folder/preview_name
            frames[0].save(preview_path,format="WEBP",save_all=True,append_images=frames[1:],
                           duration=spec["frame_ms"],loop=0,lossless=True,method=6)
            with Image.open(preview_path) as check:
                assert check.n_frames==12,(action,"bad preview",check.n_frames)
                for index,frame in enumerate(frames):
                    check.seek(index)
                    assert same_visible(frame,check.convert("RGBA")),(action,"preview frame",index+1)
            id=f"pack:capture:creature-pourpre-{action}-opponent-12-v1"
            assert id not in old_ids
            relative=f"capture/creatures/creature_pourpre/animations/{action}/opponent/atlases/{atlas_name}"
            asset={
                "id":id, "label":spec["label"], "assetType":"sprite", "mediaType":"image",
                "category":"creature", "tags":["capture","creature","pourpre","animated","opponent",action],
                "source":{"scope":"pack","packId":"capture","author":"GenSRPG / artist approved","license":"project-internal"},
                "resource":{"file":relative,"format":"sprite-strip","mime":"image/webp",
                    "frameCount":12,"frameWidth":512,"frameHeight":512,"frameMs":spec["frame_ms"],
                    "playbackMode":"loop" if spec["loop"] else "once"},
                "compatibility":{"uses":["combat","capture","editor"]},
            }
            new_entries.append(asset)
            summary={
                "creature":"creature_pourpre","view":"opponent","orientation":"face-three-quarter-toward-left",
                "action":action,"frameCount":12,"frameWidth":512,"frameHeight":512,
                "frameMs":spec["frame_ms"],"playbackMode":asset["resource"]["playbackMode"],
                "sourceZip":str(SOURCE),"sourceSha256":SOURCE_SHA256,"sourceGitBlobSha":SOURCE_BLOB_SHA,
                "sourceFrameSha256":source_sha,"frameSha256Png":frame_sha,"margins":frame_margins,
                "masterSource":"runtime/creature_pourpre_face.png",
                "firstFrameReplacedWithCanonicalMaster":True,
                "allOtherFramesRetainedFromApprovedZip":True,
                "atlasFile":f"atlases/{atlas_name}","previewFile":f"previews/{preview_name}",
            }
            (folder/f"{action}.manifest.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
            print("READY",id,"frames",len(frames),"minmargin",min(min(m) for m in frame_margins))
    catalog["assets"].extend(new_entries)
    assert catalog["assets"][:len(old)]==old,"previous catalog entries changed"
    assert len({a["id"] for a in catalog["assets"]})==len(catalog["assets"])
    catalog["counts"]["assets"]=len(catalog["assets"])
    catalog["counts"]["sprites"]=sum(a.get("assetType")=="sprite" for a in catalog["assets"])
    CATALOG.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("NEW ASSETS",*[a["id"] for a in new_entries])
if __name__=="__main__":main()
