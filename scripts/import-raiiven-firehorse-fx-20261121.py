#!/usr/bin/env python3
"""Import exact uploaded ZIPs into the ONE canonical global-assets library.

Run against two checkouts: SOURCE (Combat main/PR), CANONICAL (global-assets).
Never replace existing media, create parallel catalog authority, or modify gameplay.
"""
import hashlib
import io
import json
import re
import sys
from pathlib import Path
from zipfile import ZipFile
from PIL import Image

ARCHIVES = {
 "raiiven_assets_for_deposit.zip": "f9dde8ec7b5a849700666e4fc8d03d601c7da49f584ae27a77388d348db71b80",
 "face_cheval_feu.zip": "bc9a31244ecd01f62e5bc4a9cb62cd192ce9d711881e572bbba5dac00973a941",
 "dos_cheval_feu.zip": "d21d2124cd143550414d35cc335600830a72095eee2a4401adeac07f1608c1cc",
 "modeles_cheval_feu.zip": "0ae29b0d4beefc4b36636e752b807f791d17ba34ad8af322747163161398e9fd",
 "Colonne_Spectrale_12_Frames_PNG_512.zip": "fc616672e9ffe996c1bea1402e9d76ad81a8f5275199ca1a88a8b87a2625638b",
 "MC_FX_Cristaux_Telluriques_12Frames_V2_PROPOSITION.zip": "6c9a63f5e15d69052959810d27ecda94b660b584d90bc7b35d58b4fcce8870ac",
 "MC_FX_Floraison_Epineuse_12Frames_V1.zip": "9366d1487abdc08333a6f66abc9950c25666a95576831a8b13d2be68925385ad",
 "MC_FX_Geyser_Magma_12Frames_V2_CLEAN.zip": "b940bc9be4c56d744199eed6f95f8c8d16342dab591350c03dc3d5904b756c04",
 "MC_FX_Grele_de_Cristal_Chute_8Frames.zip": "eac16fdcfdc5a67316c0a5155d27aa640a486e481adb7baaf0b7d40a5e4655c1",
 "MC_FX_Grele_de_Cristal_Impact_8Frames.zip": "78890e6b98c60f2598922a99b5863915da72b5aa49314f3ac0a621e724a7b205",
 "MC_FX_Lance_Celeste_12Frames_V1.zip": "d22dd86be6e16e777d8b84b919bb6e3109649844c4e7ac71d998bc9494be7f84",
 "MC_FX_Meteore_12Frames.zip": "7d2fc03dde539aa201a7debfae642e1ea9806fd392b96c485d84ab04b8051fb9",
 "MC_FX_Pluie_de_Foudre_12Frames_V2.zip": "eb937423ea200d73173a6f03a1d546326829405eed21ff04c4ed77552ba64565",
 "MC_FX_RacinesPerforantes_8Frames_TEST.zip": "c824e471e64545cd07d13b41916239d4f4827eee6db1088b04e31f350d8e5c29",
 "MC_FX_Vortex_des_Abysses_12Frames_V1.zip": "fad4ba7ff09c046f1b792ade8a3122b263613a0f2871af5792a0594029078c38",
}
ICON_SKILLS = {
 "fer-maudit": 1,
 "dedale-silhouettes": 2,
 "vol-foulees": 3,
 "remanence-interdite": 4,
 "cavalcade-damnes": 5,
}
FX = {
 "colonne-spectrale": ("Colonne_Spectrale_12_Frames_PNG_512.zip",12),
 "cristaux-telluriques": ("MC_FX_Cristaux_Telluriques_12Frames_V2_PROPOSITION.zip",12),
 "floraison-epineuse": ("MC_FX_Floraison_Epineuse_12Frames_V1.zip",12),
 "geyser-magma": ("MC_FX_Geyser_Magma_12Frames_V2_CLEAN.zip",12),
 "grele-cristal-chute": ("MC_FX_Grele_de_Cristal_Chute_8Frames.zip",8),
 "grele-cristal-impact": ("MC_FX_Grele_de_Cristal_Impact_8Frames.zip",8),
 "lance-celeste": ("MC_FX_Lance_Celeste_12Frames_V1.zip",12),
 "meteore": ("MC_FX_Meteore_12Frames.zip",12),
 "pluie-de-foudre": ("MC_FX_Pluie_de_Foudre_12Frames_V2.zip",12),
 "racines-perforantes": ("MC_FX_RacinesPerforantes_8Frames_TEST.zip",8),
 "vortex-des-abysses": ("MC_FX_Vortex_des_Abysses_12Frames_V1.zip",12),
}
SOURCE={"scope":"pack","packId":"capture","author":"Author ZIP uploaded to Labo Combat, 2026-11-21","license":"project-internal"}
USES={"uses":["combat","capture","editor"]}

def alpha_image(img):
    img=img.convert("RGBA")
    return img

def frame_atlas(frames):
    if not frames: raise ValueError("Empty animation")
    assert all(f.size==(512,512) for f in frames)
    atlas=Image.new("RGBA",(512*len(frames),512),(0,0,0,0))
    for index,frame in enumerate(frames):
        atlas.paste(frame,(index*512,0))
    return atlas

def open_rgba(z,path):
    img=Image.open(io.BytesIO(z.read(path)))
    img.load()
    return alpha_image(img)

def image_record(asset_id,label,category,resource,tags,kind="sprite"):
    return {
      "id":asset_id,"label":label,
      "assetType":kind,"mediaType":"image","category":category,
      "tags":["capture","2026-11-21","author-upload",*tags],
      "source":SOURCE,"resource":resource,"compatibility":USES
    }

def run(source_root,canonical_root):
    source_root=Path(source_root)
    canonical_root=Path(canonical_root)
    catpath=canonical_root/"data/assets/catalog/global-visual-assets.v1.json"
    cat=json.loads(catpath.read_text(encoding="utf8"))
    assert cat["storage"]["branch"]=="global-assets"
    assert cat["counts"]["assets"]==len(cat["assets"])
    known={x["id"] for x in cat["assets"]}
    assert len(known)==len(cat["assets"])
    root=canonical_root/"assets/library"
    archives={}
    for name,expected in ARCHIVES.items():
        raw=(source_root/name).read_bytes()
        digest=hashlib.sha256(raw).hexdigest()
        assert digest==expected,(name,digest)
        z=ZipFile(io.BytesIO(raw))
        assert z.testzip() is None,name
        archives[name]=z
    added=[]
    output_meta=[]

    def publish(image,dest,id,label,category,tags,kind="sprite",framecount=1,frame_ms=120,playback="once"):
        assert id not in known,("Existing catalog ID",id)
        assert not (root/dest).exists(),("Existing canonical file",dest)
        path=root/dest
        path.parent.mkdir(parents=True,exist_ok=True)
        image.save(path,"WEBP",lossless=True,method=6)
        assert path.is_file() and path.stat().st_size>100
        resource={"file":dest,"mime":"image/webp"}
        if framecount>1:
            resource.update(format="sprite-strip",frameCount=framecount,
                            frameMs=frame_ms,playbackMode=playback)
        known.add(id)
        added.append(image_record(id,label,category,resource,tags,kind))
        output_meta.append({"id":id,"file":dest,"frameCount":framecount})
        print("IMPORT",id,dest,image.size,flush=True)

    # Real user-approved archive. Five separate icons, one per named skill.
    z=archives["raiiven_assets_for_deposit.zip"]
    skill_titles={
     "fer-maudit":"Fer maudit",
     "dedale-silhouettes":"Dédale des silhouettes",
     "vol-foulees":"Vol de foulées",
     "remanence-interdite":"Rémanence interdite",
     "cavalcade-damnes":"Cavalcade des damnés",
    }
    for short,index in ICON_SKILLS.items():
        token="raiiven_skill_"+str(index)+"_"
        members=[n for n in z.namelist() if n.endswith("_icon.png") and n.split("/")[-1].startswith(token)]
        assert len(members)==1,(short,members)
        image=open_rgba(z,members[0])
        assert image.size==(1254,1254),members[0]
        image=image.resize((512,512),Image.Resampling.LANCZOS)
        publish(image,
            f"capture/icons/skills/raiiven/{short}.webp",
            f"pack:capture:icon-skill-raiiven-{short}-v1",
            "Raiiven — "+skill_titles[short],"skill",["raiiven","shadow",short],kind="icon")
    sheets=[n for n in z.namelist() if n.endswith("raiiven_skill_4_forbidden_echo_copy_sprite_sheet.png")]
    assert len(sheets)==1,sheets
    sheet=open_rgba(z,sheets[0])
    assert sheet.size==(1774,887),sheet.size
    frames=[]
    for row in range(2):
      for col in range(4):
        left=round(col*sheet.width/4);right=round((col+1)*sheet.width/4)
        top=round(row*sheet.height/2);bottom=round((row+1)*sheet.height/2)
        crop=sheet.crop((left,top,right,bottom)).resize((512,512),Image.Resampling.LANCZOS)
        # ImageGen sheet contains residual near-invisible alpha/checker dust;
        # clear only those low-alpha pixels, never redraw author pixels.
        a=crop.getchannel("A").point(lambda p:p if p>=28 else 0)
        crop.putalpha(a)
        assert crop.getchannel("A").getbbox()
        frames.append(crop)
    for name,subset,frame_ms,playback in [
      ("cast",frames[0:2],135,"once"),
      ("projectile",frames[2:5],120,"loop"),
      ("impact",frames[5:8],115,"once"),
    ]:
        publish(frame_atlas(subset),
            f"capture/sprites/skills/raiiven/remanence-interdite-{name}.webp",
            f"pack:capture:sprite-skill-raiiven-remanence-interdite-{name}-v1",
            "Raiiven — Rémanence interdite / "+name,
            "skill",["raiiven","shadow","echo","animated",name],
            framecount=len(subset),frame_ms=frame_ms,playback=playback)

    # The 11 user-uploaded FX are catalog entries, not arbitrarily bound to skills.
    for short,(filename,count) in FX.items():
        z=archives[filename]
        entries=[n for n in z.namelist() if n.lower().endswith(".png")
                 and ("/frames/" in "/"+n or n.startswith("frames/"))]
        entries.sort(key=lambda n:int(Path(n).stem.rsplit("_",1)[-1]))
        assert len(entries)==count,(short,len(entries),entries)
        imgs=[open_rgba(z,n) for n in entries]
        assert all(img.size==(512,512) for img in imgs),short
        publish(frame_atlas(imgs),
           f"capture/sprites/skills/author-uploads-20261121/{short}.webp",
           f"pack:capture:sprite-skill-author-fx-{short}-20261121",
           short.replace("-"," ").title()+f" ({count} images)",
           "skill",["fx","animated","new-import","unassigned",short],
           framecount=count,frame_ms=120,playback="once")

    # Fire-horse visual MODEL only: no invented creature identity/loadout or
    # replacement of approved Raiiven horse morphotype reference.
    z=archives["modeles_cheval_feu.zip"]
    for view,prefix in [("opponent","face"),("player","dos")]:
        img=open_rgba(z,f"modeles_cheval_feu/{prefix}/{prefix}_512.png")
        assert img.size==(512,512)
        publish(img,f"capture/creatures/cheval-de-feu/runtime/{prefix}.webp",
          f"pack:capture:creature-cheval-de-feu-{view}-v1",
          "Cheval de feu — "+prefix,"creature",["fire","cheval-de-feu",view,"model"])
    for view,folder,filename,move_count in [
      ("opponent","face","face_cheval_feu.zip",6),
      ("player","dos","dos_cheval_feu.zip",7),
    ]:
        z=archives[filename]
        for action,nframes in [("movement",move_count),("attack",5)]:
            fr="mouvement" if action=="movement" else "attaque"
            member=f"{folder}/{fr}/{fr}_{folder}_atlas.png"
            img=open_rgba(z,member)
            assert img.size==(512*nframes,512),(member,img.size)
            publish(img,
                f"capture/creatures/cheval-de-feu/animations/{action}-{view}.webp",
                f"pack:capture:creature-cheval-de-feu-{action}-{view}-{nframes}-v1",
                f"Cheval de feu — {action} {view} ({nframes} images)",
                "creature",["fire","cheval-de-feu",view,action,"animated"],
                framecount=nframes,frame_ms=130 if action=="movement" else 180,
                playback="loop" if action=="movement" else "once")

    assert len(added)==25,len(added)
    assert sum(x["assetType"]=="icon" for x in added)==5
    assert sum(x["assetType"]=="sprite" for x in added)==20
    cat["assets"].extend(added)
    cat["counts"]["assets"]+=len(added)
    cat["counts"]["icons"]+=5
    cat["counts"]["sprites"]+=20
    assert cat["counts"]["assets"]==len(cat["assets"])
    assert len({x["id"] for x in cat["assets"]})==len(cat["assets"])
    catpath.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    manifest=canonical_root/"assets/library/capture/author-uploads-20261121.manifest.json"
    assert not manifest.exists()
    manifest.write_text(json.dumps({
       "schema":"capture-author-media-import-v1",
       "sourceBranch":"main","canonicalBranch":"global-assets",
       "archives":ARCHIVES,"items":output_meta,
       "skillsConnectedOnMain":["raiiven-fer-maudit","raiiven-dedale-silhouettes",
         "raiiven-vol-foulees","raiiven-remanence-interdite","raiiven-cavalcade-damnes"],
       "fireHorse":"media only; no invented creature definition",
       "fx":"11 author sequences selectable in catalog; not assigned to unrelated skills",
    },ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("PASS 5 icons, 3 shadow echo phase strips, 11 general FX strips, 6 fire-horse media, ONE canonical catalog",flush=True)

if __name__=="__main__":
    if len(sys.argv)!=3: raise SystemExit("Usage: import...py SOURCE CANONICAL")
    run(*sys.argv[1:])
