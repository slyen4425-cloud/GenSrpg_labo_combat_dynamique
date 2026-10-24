#!/usr/bin/env python3
"""Import the EXACT author-approved, artifact-cleaned golden cyber-wasp player animations."""
import io, hashlib, json, pathlib, shutil, zipfile
from PIL import Image

R=pathlib.Path(__file__).resolve().parents[1]
ZIP="GUEPE_CYBERNETIQUE_MOUVEMENT_ATTAQUE_12F_NETTOYES.zip"
SHA="3912ff41f69f0e999ee47abf834030e19f2a991ec30ede72cad26156515f4923"
SOURCE=R/"_incoming"/ZIP
PREFIX="GUEPE_CYBERNETIQUE_12F_ARTEFACTS_CORRIGES/"
BASE=R/"assets/library/capture/creatures/guepe_cybernetique/animations"
CAT=R/"data/assets/catalog/global-visual-assets.v1.json"
TEMPLATE=R/"scripts/guepe-cybernetique-player12.test.template.mjs"
TEST=R/"tests/unit/guepe-cybernetique-player12-assets.test.mjs"
CONFIG={
 "movement":{"fr":"mouvement","ms":100,"mode":"loop",
   "planche":"GUEPE_CYBERNETIQUE_MOUVEMENT_12F_PLANCHE_CORRIGEE.png",
   "gif":"GUEPE_CYBERNETIQUE_MOUVEMENT_12F_PREVIEW_CORRIGEE.gif",
   "webp":"GUEPE_CYBERNETIQUE_MOUVEMENT_12F_PREVIEW_CORRIGEE.webp"},
 "attack":{"fr":"attaque","ms":100,"mode":"once",
   "planche":"GUEPE_CYBERNETIQUE_ATTAQUE_12F_PLANCHE_CORRIGEE.png",
   "gif":"GUEPE_CYBERNETIQUE_ATTAQUE_12F_PREVIEW_CORRIGEE.gif",
   "webp":"GUEPE_CYBERNETIQUE_ATTAQUE_12F_PREVIEW_CORRIGEE.webp"}
}
def sha(b):return hashlib.sha256(b).hexdigest()
def validate_image(data,size,mode=None,frames=1):
    with Image.open(io.BytesIO(data)) as im:
        assert im.size==size,(im.size,size)
        if mode: assert im.mode==mode,(im.mode,mode)
        assert getattr(im,"n_frames",1)==frames,(getattr(im,"n_frames",1),frames)
        im.load()
        if frames>1:
            im.seek(frames-1)
            im.load()
def main():
    assert SOURCE.is_file(),"ZIP uploaded to _incoming missing"
    raw=SOURCE.read_bytes()
    assert len(raw)==13036446 and sha(raw)==SHA,"ZIP byte hash mismatch"
    assert TEMPLATE.is_file() and not TEST.exists(),"Test template/output conflict"
    assert (R/"assets/library/capture/creatures/guepe_cybernetique/guepe_cybernetique.meta.json").is_file()
    cat=json.loads(CAT.read_text(encoding="utf8"))
    assert cat["counts"]["assets"]==len(cat["assets"])
    oldids={a["id"] for a in cat["assets"]}
    assert len(oldids)==len(cat["assets"])
    output={};added=[];expected={PREFIX+"manifest.json"}
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        assert z.testzip() is None,"Original ZIP CRC failed"
        assert len(z.namelist())==33 and len(set(z.namelist()))==33
        for name in z.namelist():
            assert not name.startswith("/") and ".." not in pathlib.PurePosixPath(name).parts and not name.endswith("/")
        original=z.read(PREFIX+"manifest.json")
        provenance=json.loads(original)
        assert "remove detached glow fragments" in provenance["correction"]
        output[BASE/"sources"/"guepe_cybernetique_player12_cleaning_manifest.json"]=original
        for action,cfg in CONFIG.items():
            fr=cfg["fr"]
            root=BASE/action/"player"
            original_role=provenance["sprites"][fr]
            assert original_role["count"]==12 and original_role["canvas"]==[512,512]
            assert original_role["playback_mode"]==cfg["mode"]
            assert original_role["preview_frame_ms"]==cfg["ms"]
            id="pack:capture:creature-guepe-cybernetique-"+action+"-player-12-v1"
            assert id not in oldids,"Do not overwrite an already registered asset"
            manifest={"schema":"capture-creature-animation-v1",
              "creatureId":"guepe_cybernetique","action":action,"view":"player",
              "assetId":id,"frameCount":12,"frameSize":[512,512],"frameMs":cfg["ms"],
              "playbackMode":cfg["mode"],"authorApproved":True,
              "approvalStatus":"approved_for_ingame_trial",
              "sourceArchive":"_incoming/"+ZIP,"sourceArchiveSha256":SHA,
              "cleanup":"detached left-side visual artifacts removed in author-approved source",
              "sourceCleaningManifest":"sources/guepe_cybernetique_player12_cleaning_manifest.json",
              "frames":[]}
            unique=set()
            for i in range(1,13):
                src=PREFIX+fr+"/frames/guepe_"+fr+"_"+str(i).zfill(2)+".png"
                expected.add(src)
                png=z.read(src)
                validate_image(png,(512,512),"RGBA")
                with Image.open(io.BytesIO(png)) as im:
                    a=im.getchannel("A")
                    assert a.getextrema()[0]==0 and a.getextrema()[1]>=250,("invalid alpha",src,a.getextrema())
                    bbox=a.point(lambda x:255 if x>8 else 0).getbbox()
                assert bbox is not None
                margins=[bbox[0],bbox[1],512-bbox[2],512-bbox[3]]
                assert min(margins)>=70,(src,margins)
                h=sha(png)
                assert h==original_role["frames"][i-1]["sha256"],src
                assert h not in unique,("duplicate poses",src)
                unique.add(h)
                rel="frames/guepe_cybernetique_"+action+"_player_"+str(i).zfill(2)+".png"
                output[root/rel]=png
                manifest["frames"].append({"index":i-1,"file":rel,"sha256":h,
                    "marginsLTRB":margins,"zipPath":src})
            assert len(unique)==12
            atlas_src=PREFIX+fr+"/guepe_"+fr+"_12f_atlas.webp"
            expected.add(atlas_src)
            atlas=z.read(atlas_src)
            validate_image(atlas,(4608,384),"RGBA")
            assert atlas[:4]==b"RIFF" and atlas[8:12]==b"WEBP"
            atlas_rel="atlases/guepe_cybernetique_"+action+"_player_12_atlas.webp"
            output[root/atlas_rel]=atlas
            manifest["atlas"]={"file":atlas_rel,"format":"sprite-strip",
                "frameCount":12,"frameWidth":384,"frameHeight":384,
                "sha256":sha(atlas)}
            prev={}
            for kind in ("gif","webp","planche"):
                src=cfg[kind]
                expected.add(src)
                b=z.read(src)
                if kind=="gif":
                    validate_image(b,(384,384),frames=12)
                    assert b.startswith(b"GIF8")
                elif kind=="webp":
                    validate_image(b,(384,384),frames=12)
                    assert b[:4]==b"RIFF" and b[8:12]==b"WEBP"
                else:
                    validate_image(b,(2288,1728),"RGBA")
                ext="png" if kind=="planche" else kind
                rel="previews/guepe_cybernetique_"+action+"_player_12_"+kind+"."+ext
                output[root/rel]=b;prev[kind]=rel
            manifest["preview"]=prev["gif"]
            manifest["previews"]=prev
            output[root/(action+".manifest.json")]=(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n").encode("utf8")
            added.append({"id":id,"label":"Guêpe cybernétique — "+
             ("vol / déplacement" if action=="movement" else "attaque")+
             " côté joueur (12 frames nettoyées)",
             "assetType":"sprite","mediaType":"image","category":"creature",
             "tags":["capture","creature","guepe-cybernetique","insect","cybernetic",
               "electric","lightning",action,"animated","player","dos"]+
               (["flight","flying"] if action=="movement" else []),
             "source":{"scope":"pack","packId":"capture",
                 "author":"GenSrpG / source validée et nettoyée 2026-10-24",
                 "license":"project-internal"},
             "resource":{"file":"capture/creatures/guepe_cybernetique/animations/"+
                         action+"/player/"+atlas_rel,"format":"sprite-strip",
                         "mime":"image/webp","frameCount":12,"frameMs":cfg["ms"],
                         "playbackMode":cfg["mode"]},
             "compatibility":{"uses":["combat","capture","editor"]}})
        assert set(z.namelist())==expected,("Unexpected ZIP content",set(z.namelist())^expected)
    assert len(output)==35,("Unexpected media count",len(output))
    assert all(not p.exists() for p in output),"Existing assets cannot be overwritten"
    for p,data in output.items():
        p.parent.mkdir(parents=True,exist_ok=True)
        p.write_bytes(data)
    cat["assets"].extend(added)
    for k in ("assets","sprites","creatures"):cat["counts"][k]+=2
    assert len(cat["assets"])==cat["counts"]["assets"]
    CAT.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    TEST.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(TEMPLATE,TEST)
    journal=R/"docs/LAB_CURRENT_WORK.md"
    note=(
      "## 2026-10-24 — Guêpe cybernétique PLAYER : vol + attaque (12f nettoyées)\n\n"
      "- Source réelle : global-assets/_incoming/"+ZIP+" ; 13 036 446 octets ; SHA256 "+SHA+" ; Git blob ef16670bf80892dbb550125d4709b5beb23562b1 ; CRC OK. Nettoyage des artefacts lumineux à gauche déjà validé par l'auteur. Aucune nouvelle génération ou retouche.\n"
      "- Base : global-assets@dd45ec7848aed0aa60136cd064eaa905f4cddd95 (CI 40128651363 SUCCESS) ; checkpoint checkpoint/global-assets-before-guepe-cybernetique-player12-2026-10-24 ; branche work/global-assets-guepe-cybernetique-player12-2026-10-24.\n"
      "- Owner : bibliothèque visuelle / catalogue unique. Deux IDs pack:capture:creature-guepe-cybernetique-{movement,attack}-player-12-v1 ; view=player (modèle auteur 3/4 dos).\n"
      "- Import : 24 PNG RGBA 512px conservés octet pour octet, 2 atlas WebP 4608x384, 6 previews GIF/WebP/planche, 2 manifestes et manifeste source de nettoyage (35 médias).\n"
      "- Protégés : runtime guêpe (player, opponent, icon), autres créatures, moteurs/UI, données auteur, main, gh-pages et dépôt principal. Aucune auto-affectation aux paramètres de créature.\n"
      "- Gates : vrai contenu/sha/marge/transparence, CI au SHA final, revue diff, checkpoint GREEN, FF global-assets ; essai Android distinct.\n"
      "- Documentation : docs/LAB_GUEPE_CYBERNETIQUE_PLAYER12_2026-10-24.md.\n\n---\n\n")
    journal.write_text(note+journal.read_text(encoding="utf8"),encoding="utf8")
    print("Imported 35 physical files: 24 PNG originals, 2 WebP sprite strips, 6 preview files, 2 manifests, source cleaning manifest. +2 catalog entries.")
if __name__=="__main__":main()
