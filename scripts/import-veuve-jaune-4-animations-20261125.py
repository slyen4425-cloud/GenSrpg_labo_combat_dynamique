#!/usr/bin/env python3
"""Import four validated Veuve jaune sequences into the ONE global-assets library."""
import hashlib, io, json, re, sys
from pathlib import Path
from zipfile import ZipFile
from PIL import Image

ARCHIVES=[
 ("veuve_jaune_mouvement_face_6f_PROPOSITION.zip","bb6bf4f23ba0cd52c54f82c7b511ce541c9832b111315f2a4298e1fa863187a3","movement","opponent",6,5,120,"loop"),
 ("veuve_jaune_attaque_face_6f_VALIDE.zip","56251c9487d318ed8ba86aad0f423b1278d762352eaba01f4c9a529ea74e7e2c","attack","opponent",6,6,150,"once"),
 ("veuve_jaune_mouvement_dos_6f_VALIDE.zip","af0e7898b1fed998a3793719db9109e6b3b2460948f4620a8be2b1dd2a8592df","movement","player",6,6,140,"loop"),
 ("veuve_jaune_attaque_dos_9f_fluide_essai.zip","1143a3de8495e992fa99b72c4ce82ab7eb55a1e78d35cfb37899c760c1ef89fd","attack","player",9,9,90,"once"),
]
DIR="assets/library/capture/creatures/veuve_jaune/"
CAT="data/assets/catalog/global-visual-assets.v1.json"
ID="pack:capture:creature-veuve-jaune-"

def sha(data): return hashlib.sha256(data).hexdigest()

def frames_from_zip(z,action,side,count):
    name="veuve_jaune_"+("mouvement" if action=="movement" else "attaque")+"_"+("face" if side=="opponent" else "dos")+"_"
    matches=[]
    for p in z.namelist():
        if "/frames/" not in "/"+p or not p.endswith(".png"): continue
        m=re.fullmatch(re.escape(name)+r"(\d{2})\.png",Path(p).name)
        if m: matches.append((int(m[1]),p))
    matches.sort()
    assert [n for n,_ in matches]==list(range(1,count+1)),(name,matches)
    output=[]; hashes=[]
    for n,p in matches:
        b=z.read(p); hashes.append(sha(b))
        im=Image.open(io.BytesIO(b)).convert("RGBA")
        assert im.size==(512,512),p
        if action=="attack" and side=="opponent":
            # The approved picture contains alpha 0..9 dust from its original matte.
            # Technical clean only, no redraw, no move and no frame replacement.
            a=im.getchannel("A")
            im.putalpha(a.point(lambda v:0 if v<10 else v))
        a=im.getchannel("A")
        bb=a.point(lambda v:255 if v>=10 else 0).getbbox()
        assert bb and min(bb[0],bb[1],512-bb[2],512-bb[3])>=5,(p,bb)
        assert all(im.getpixel(x)[3]==0 for x in ((0,0),(511,0),(0,511),(511,511))),p
        output.append(im)
    return output,hashes

def run(src,can):
    src=Path(src);can=Path(can)
    catalogfile=can/CAT
    catalog=json.loads(catalogfile.read_text(encoding="utf-8"))
    assert catalog["storage"]["branch"]=="global-assets"
    assert catalog["counts"]["assets"]==len(catalog["assets"])==503
    assert catalog["counts"]["sprites"]==253
    known={a["id"] for a in catalog["assets"]}
    assert len(known)==503
    metapath=can/(DIR+"veuve_jaune.meta.json")
    meta=json.loads(metapath.read_text(encoding="utf-8"))
    assert meta["id"]=="veuve_jaune"
    baseline_views=json.dumps(meta["views"],sort_keys=True)
    baseline_ids={k:meta["assetIds"][k] for k in ("player","opponent","icon")}
    provenancepath=can/(DIR+"veuve_jaune.animations.provenance.json")
    assert not provenancepath.exists(),"the 4 animations are already imported"
    items=[]
    for file,ziphash,action,side,original,exported,frame_ms,mode in ARCHIVES:
        source=(src/file).read_bytes()
        assert sha(source)==ziphash,(file,sha(source))
        with ZipFile(io.BytesIO(source)) as z:
            assert z.testzip() is None,file
            frames,sourcehashes=frames_from_zip(z,action,side,original)
        if action=="movement" and side=="opponent":
            assert frames[0].tobytes()==frames[-1].tobytes(),"duplicate terminal pose changed"
            frames=frames[:-1] # no visual pause in the approved 5-frame preview
        assert len(frames)==exported
        assetid=ID+action+"-"+side+"-"+str(exported)+"-20261125"
        filename=action+"-"+side+"-"+str(exported)+"f-20261125.webp"
        rel="capture/creatures/veuve_jaune/animations/"+filename
        dest=can/"assets/library"/rel
        assert assetid not in known and not dest.exists(),("duplicate",assetid,rel)
        strip=Image.new("RGBA",(512*exported,512),(0,0,0,0))
        for i,img in enumerate(frames): strip.paste(img,(512*i,0))
        dest.parent.mkdir(parents=True,exist_ok=True)
        strip.save(dest,"WEBP",lossless=True,method=6)
        with Image.open(dest) as check:
            assert check.format=="WEBP" and check.size==(512*exported,512)
        raw=dest.read_bytes()
        assert raw[:4]==b"RIFF" and raw[8:12]==b"WEBP" and len(raw)>2000
        new={
          "id":assetid,
          "label":"Veuve jaune — "+("déplacement" if action=="movement" else "attaque")+" "+("face" if side=="opponent" else "dos")+f" ({exported} frames)",
          "assetType":"sprite","mediaType":"image","category":"creature",
          "tags":["capture","veuve_jaune","creature","2026-11-25","author-approved","animated",action,side],
          "source":{"scope":"pack","packId":"capture","author":"Séquence auteur approuvée 23-25 novembre 2026","license":"project-internal"},
          "resource":{"file":rel,"mime":"image/webp","format":"sprite-strip","frameCount":exported,"frameMs":frame_ms,"playbackMode":mode},
          "compatibility":{"uses":["combat","capture","editor"]}
        }
        catalog["assets"].append(new);known.add(assetid)
        key=action+side.capitalize()
        meta.setdefault("animations",{})[key]="animations/"+filename
        meta["assetIds"][key]=assetid
        items.append({"id":assetid,"file":rel,"sha256":sha(raw),"bytes":len(raw),
         "sourceArchive":file,"sourceSha256":ziphash,"sourceFrames":original,"sourceFrameSha256":sourcehashes,
         "runtimeFrames":exported,"frameMs":frame_ms,"playbackMode":mode,
         "note":"Approved face-walk duplicate end frame omitted only from loop" if original!=exported else
                ("alpha matte below 10/255 cleared without changing pose" if action=="attack" and side=="opponent" else "poses unchanged")})
        print("IMPORTED",assetid,rel,exported,flush=True)
    assert len(items)==4 and len(known)==507
    assert meta["id"]=="veuve_jaune" and json.dumps(meta["views"],sort_keys=True)==baseline_views
    assert {k:meta["assetIds"][k] for k in baseline_ids}==baseline_ids
    catalog["counts"]["assets"]+=4
    catalog["counts"]["sprites"]+=4
    assert catalog["counts"]["assets"]==len(catalog["assets"])==507
    assert catalog["counts"]["sprites"]==257
    catalogfile.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    meta["animationProvenance"]="veuve_jaune.animations.provenance.json"
    metapath.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    provenancepath.write_text(json.dumps({
      "schema":"gensrpg-veuve-jaune-4-animations-v1","sourceBranch":"main","canonicalBranch":"global-assets",
      "status":"validated by author in conversation 23-25 November 2026","items":items,
      "preserved":"Original face/dos/icon, abilities and all other creatures untouched; original ZIP uploads remain in Combat main"
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    for path in [
      "tests/unit/capture-ephemus-media-assets-20261118.test.mjs",
      "tests/unit/veldra-skill-media-assets-20261118.test.mjs",
      "tests/unit/capture-cheval-de-feu-icon-catalog-20261121.test.mjs",
    ]:
        f=can/path
        if not f.exists():continue
        old=f.read_text(encoding="utf-8")
        new=old.replace("catalog.counts.assets,503","catalog.counts.assets,507")
        new=new.replace("catalog.assets.length,503","catalog.assets.length,507")
        new=new.replace("catalog.counts.sprites,253","catalog.counts.sprites,257")
        assert new!=old,("missing previous exact-count sentinel",path)
        f.write_text(new,encoding="utf-8")
    print("SUCCESS: four 512px WebP strips; four unique IDs; no gameplay changes",flush=True)

if __name__=="__main__":
    if len(sys.argv)!=3: raise SystemExit("Usage: importer.py SOURCE_ROOT CANONICAL_ROOT")
    run(sys.argv[1],sys.argv[2])
