#!/usr/bin/env python3
"""Import exactly the author's approved 12-frame Maraileron FACE/opponent swim+attack ZIP."""
import hashlib, io, json, pathlib, shutil, zipfile
from PIL import Image, ImageChops

R=pathlib.Path(__file__).resolve().parents[1]
NAME="MARAILERON_FACE_2_ANIMATIONS_NAGE_ATTAQUE.zip"
SHA="96e5c35a577b73bda926dedc29ee4cf16b565e474283e925fc6bc9aa8fc6aa30"
SOURCE=R/"_incoming"/NAME
BASE=R/"assets/library/capture/creatures/maraileron/animations"
CAT=R/"data/assets/catalog/global-visual-assets.v1.json"
TEST=R/"tests/unit/maraileron-face12-assets.test.mjs"
TPL=R/"scripts/maraileron-face12.test.template.mjs"
ROOT="MARAILERON_FACE_2_ANIMATIONS/"
SEQUENCES={
 "movement":{"folder":"MOUVEMENT_NAGE_12_FRAMES","stem":"maraileron_face_nage",
             "gif":"MARAILERON_NAGE_12F_PREVIEW_FIDELE.gif",
             "webp":"MARAILERON_NAGE_12F_PREVIEW_FIDELE.webp",
             "planche":"MARAILERON_NAGE_12F_PLANCHE_EXTRAITE.png",
             "ms":110,"mode":"loop"},
 "attack":{"folder":"ATTAQUE_12_FRAMES","stem":"maraileron_face_attaque",
           "gif":"MARAILERON_ATTAQUE_12F_PREVIEW.gif",
           "webp":"MARAILERON_ATTAQUE_12F_PREVIEW_TRANSPARENT.webp",
           "planche":"MARAILERON_ATTAQUE_12F_PLANCHE_PREVIEW.png",
           "ms":110,"mode":"once"},
}
def sha(data):return hashlib.sha256(data).hexdigest()
def encode(image,fmt,**opts):
    b=io.BytesIO()
    image.save(b,format=fmt,**opts)
    return b.getvalue()
def main():
    assert SOURCE.is_file(), "ZIP original missing"
    data=SOURCE.read_bytes()
    assert len(data)==10481378 and sha(data)==SHA,"ZIP author SHA mismatch"
    assert not TEST.exists() and TPL.is_file(),"test template/output conflict"
    cat=json.loads(CAT.read_text(encoding="utf8"))
    assert cat["counts"]["assets"]==len(cat["assets"])
    ids={a["id"] for a in cat["assets"]}
    assert len(ids)==len(cat["assets"])
    assert (BASE/"movement"/"player"/"movement.manifest.json").is_file()
    assert (BASE/"attack"/"player"/"attack.manifest.json").is_file()
    planned={}
    assets=[]
    expected={ROOT+"README.txt"}
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        assert z.testzip() is None,"ZIP CRC error"
        assert len(z.namelist())==31 and len(set(z.namelist()))==31
        for filename in z.namelist():
            p=pathlib.PurePosixPath(filename)
            assert not filename.startswith("/") and ".." not in p.parts and not filename.endswith("/")
        for action,spec in SEQUENCES.items():
            folder=spec["folder"]
            src=ROOT+folder+"/"
            target=BASE/action/"opponent"
            asset_id="pack:capture:creature-maraileron-"+action+"-opponent-12-v1"
            assert asset_id not in ids
            sheet_name=src+spec["planche"]
            expected.add(sheet_name)
            sheet_data=z.read(sheet_name)
            with Image.open(io.BytesIO(sheet_data)) as f:
                sheet=f.convert("RGBA")
            assert sheet.size==(2048,1536),"invalid approved original sheet dimensions"
            manifest={"schema":"capture-creature-animation-v1",
                "creatureId":"maraileron","action":action,"view":"opponent",
                "profile":"serpentine","assetId":asset_id,"frameCount":12,
                "frameSize":[512,512],"frameMs":spec["ms"],"playbackMode":spec["mode"],
                "authorApproved":True,"approvalStatus":"approved_for_ingame_trial",
                "sourceArchive":"_incoming/"+NAME,"sourceArchiveSha256":SHA,
                "sourceSpriteSheet":"sources/"+spec["planche"],
                "sourceSpriteSheetSha256":sha(sheet_data),"frames":[]}
            atlas=Image.new("RGBA",(12*384,384),(0,0,0,0))
            seen=set()
            for i in range(12):
                source=src+spec["stem"]+"_"+str(i+1).zfill(2)+".png"
                expected.add(source)
                frame_data=z.read(source)
                with Image.open(io.BytesIO(frame_data)) as p:
                    assert p.size==(512,512) and p.mode=="RGBA"
                    frame=p.copy()
                assert frame.getchannel("A").getextrema()==(0,255)
                bbox=frame.getchannel("A").point(lambda a:255 if a>8 else 0).getbbox()
                assert bbox is not None
                margins=[bbox[0],bbox[1],512-bbox[2],512-bbox[3]]
                assert min(margins)>=7,("already clipped source frame",source,margins)
                original_crop=sheet.crop(((i%4)*512,(i//4)*512,(i%4+1)*512,(i//4+1)*512))
                assert ImageChops.difference(frame,original_crop).getbbox() is None,("source and frame pixels differ",source)
                h=sha(frame_data)
                assert h not in seen,("duplicate frame",i)
                seen.add(h)
                rel="frames/maraileron_"+action+"_opponent_"+str(i+1).zfill(2)+".png"
                planned[target/rel]=frame_data
                manifest["frames"].append({
                    "index":i,"file":rel,"sha256":h,
                    "marginsLTRB":margins,"sourceGridCell":[i%4,i//4],"zipPath":source})
                atlas.paste(frame.resize((384,384),Image.Resampling.LANCZOS),(i*384,0))
            assert len(seen)==12
            rel_atlas="atlases/maraileron_"+action+"_opponent_12_atlas.webp"
            atlas_bytes=encode(atlas,"WEBP",quality=90,method=4)
            planned[target/rel_atlas]=atlas_bytes
            manifest["atlas"]={"file":rel_atlas,"format":"sprite-strip",
                                "frameCount":12,"frameWidth":384,"frameHeight":384,
                                "sha256":sha(atlas_bytes)}
            previews={}
            for kind in ("gif","webp","planche"):
                source=src+spec[kind]
                expected.add(source)
                preview=z.read(source)
                if kind=="gif":
                    with Image.open(io.BytesIO(preview)) as p:
                        assert p.format=="GIF" and p.n_frames==12
                elif kind=="webp":
                    with Image.open(io.BytesIO(preview)) as p:
                        assert p.format=="WEBP" and p.n_frames==12
                elif kind=="planche":
                    assert preview==sheet_data
                ext="png" if kind=="planche" else kind
                dest="previews/maraileron_"+action+"_opponent_12_"+kind+"."+ext
                planned[target/dest]=preview
                previews[kind]=dest
            manifest["preview"]=previews["gif"]
            manifest["previews"]=previews
            planned[target/(action+".manifest.json")]=(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n").encode()
            planned[BASE/"sources"/spec["planche"]]=sheet_data
            assets.append({"id":asset_id,
                "label":"Maraileron — "+("nage ondulante" if action=="movement" else "attaque")+" vue de face / adversaire (12 frames)",
                "assetType":"sprite","mediaType":"image","category":"creature",
                "tags":["capture","creature","maraileron","water","serpentine",
                        action,"animated","opponent","face"]+
                        (["swim","swimming"] if action=="movement" else []),
                "source":{"scope":"pack","packId":"capture",
                          "author":"GenSrpG / planches auteur validées 2026-10-24",
                          "license":"project-internal"},
                "resource":{"file":"capture/creatures/maraileron/animations/"+
                                    action+"/opponent/"+rel_atlas,
                            "format":"sprite-strip","mime":"image/webp",
                            "frameCount":12,"frameMs":spec["ms"],"playbackMode":spec["mode"]},
                "compatibility":{"uses":["combat","capture","editor"]}})
        assert set(z.namelist())==expected,("Missing or unexpected source files",set(z.namelist())^expected)
        planned[BASE/"sources"/"maraileron_face12_readme.txt"]=z.read(ROOT+"README.txt")
    assert len(planned)==37,len(planned)
    assert all(not p.exists() for p in planned),"Target asset already exists"
    for p,b in planned.items():
        p.parent.mkdir(parents=True,exist_ok=True)
        p.write_bytes(b)
    cat["assets"].extend(assets)
    for k in ("assets","sprites","creatures"):cat["counts"][k]+=2
    assert cat["counts"]["assets"]==len(cat["assets"])
    CAT.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    TEST.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(TPL,TEST)
    doc=R/"docs/LAB_CURRENT_WORK.md"
    note=(
      "## 2026-10-24 — Maraileron FACE/adversaire, nage + attaque (12 frames)\n\n"
      "- Source auteur approuvée : _incoming/MARAILERON_FACE_2_ANIMATIONS_NAGE_ATTAQUE.zip ; 10 481 378 octets ; SHA256 "+
      SHA+" ; Git blob 0af1f0ca910817f7a444edb0bc220ea7b682e62b ; CRC OK.\n"
      "- Base global-assets@2ac2d5ce48bdbfd2c490aec7cd2369b2ba29a8ea ; checkpoint checkpoint/global-assets-before-maraileron-face12-2026-10-24 ; branche work/global-assets-maraileron-face12-2026-10-24.\n"
      "- Autorité : Asset Library / catalogue unique. Deux IDs pack:capture:creature-maraileron-movement-opponent-12-v1 et pack:capture:creature-maraileron-attack-opponent-12-v1.\n"
      "- Fichiers : 24 PNG RGBA 512px originaux conservés octet pour octet, 2 atlas WebP 384px/frame, 6 previews originales, 2 manifestes, 2 planches source, README. Poses pixel-identiques aux planches approuvées ; aucune génération ou interpolation nouvelle.\n"
      "- Protégés : Maraileron PLAYER (6f+12f), runtime et fiche modèle, autres créatures, compétences, moteur, UI, main, gh-pages, GenSrpG et Exploration. Pas d'affectation automatique à un profil auteur.\n"
      "- Gate : médias réels, CI complète sur commit final, revue diff strict, checkpoint GREEN et fast-forward sous lease global-assets. Validation en jeu sur smartphone séparée.\n"
      "- Détail docs/LAB_MARAILERON_FACE12_2026-10-24.md.\n\n---\n\n")
    doc.write_text(note+doc.read_text(encoding="utf8"),encoding="utf8")
    print("Imported 24 authentic opponent PNGs +2 WebP atlases +6 previews +2 manifests +2 sheets +readme; +2 IDs.")
if __name__=="__main__":main()
