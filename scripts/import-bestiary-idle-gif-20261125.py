#!/usr/bin/env python3
"""Import the four exact author-deposited GIF archives into the existing canonical catalog."""
import hashlib, io, json, re, sys
from pathlib import Path
from zipfile import ZipFile
from PIL import Image
SOURCE = Path(__file__).resolve().parents[1]
CAT = "data/assets/catalog/global-visual-assets.v1.json"
HASHES = [
 "18e9cfbebdad71264c86abbaf59429a02d175b2507745f11facdcfb54c634714",
 "a8859642a176eca270dc3f2a19978a4a9db60071166e017248f4bedc1b4762eb",
 "8b625f190ffda73749f112c865a21d8c6dbd45d9efac83f2ec5df3458269e4ab",
 "340005bef076400728ef2cab44f2ab50859062d51e68032d1776d1f4067a4dff"]
SPECS = {"veldra":"Veldra_crea","vipfer":"Vipfer","veuve_jaune":"veuve-jaune","raiiven":"raiiven","sylvorne":"crea_sylvorne","ailevent":"crea_ailevent","loup_volcanique":"crea-loup","polocendre":"polocendre","krakenor":"crea_mer_3","gorice":"gorice","freclairions":"crea_foudrillon","selachombre":"crea_selachombre","noctigriffe":"crea_ombre_2","lumilo":"crea_lumilo","moussados":"crea_mossback","gemmor":"crea_crys_2","maraileron":"crea_maraileron","grainou":"crea_nat_1","scarabacier":"crea_scar_2","venombre":"crea_tox_2","voltige":"crea_voltik","vyrame":"crea_vyrame","kitsune_lunaire":"kitsune_lunaire"}
RESERVES = {"grainou","scarabacier","gemmor"}
def sha(b): return hashlib.sha256(b).hexdigest()
def gitsha(b): return hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()
def save(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
def run(root,report):
    catfile=root/CAT
    cat=json.loads(catfile.read_text())
    assert cat["storage"]["branch"]=="global-assets"
    old_count=cat["counts"]["assets"]; old_sprites=cat["counts"]["sprites"]
    known={a["id"]:a for a in cat["assets"]}
    paths={a["resource"]["file"]:a["id"] for a in cat["assets"] if a.get("resource",{}).get("file")}
    assert len(known)==old_count==len(cat["assets"])
    records=[]; pending=[]; pairs={}; expected=set(SPECS)
    for lot, digest in enumerate(HASHES,1):
        archive=f"GensRPG_Idle_Depot_Lot_{lot}.zip"
        data=(root/"_incoming"/archive).read_bytes()
        assert sha(data)==digest,archive
        with ZipFile(io.BytesIO(data)) as z:
            assert z.testzip() is None
            manifest=json.loads(z.read("manifest.json"))
            assert manifest["lot"]==lot and manifest["size"]==[512,512] and manifest["loop"]
            assert set(z.namelist())=={"manifest.json"}|{m["file"] for m in manifest["entries"]}
            assert len(manifest["entries"])==[10,10,10,16][lot-1]
            for m in manifest["entries"]:
                key=m["creature"]; side=m["view"]
                assert key in expected and side in ("face","dos")
                assert m["file"]==f"{key}/{key}_idle_{side}.gif" and m["frames"]==12
                draft=json.loads((SOURCE/"data/capture/showcase"/(SPECS[key]+".capture-creature-transfer-v1.json")).read_text())["draft"]
                role,slot=("opponent","front") if side=="face" else ("player","back")
                portrait_id=draft["presentation"]["visual"][slot]["assetId"]
                portrait=known[portrait_id]
                portrait_path=portrait["resource"]["file"]
                master=(root/"assets/library"/portrait_path).read_bytes()
                assert gitsha(master)==m["sourceBlob"],(key,side,portrait_path,"master changed; review required")
                base=re.sub(r"-(opponent|player)-(01|v1)$","",portrait_id)
                assert base!=portrait_id and base.startswith("pack:capture:creature-")
                asset_id=f"{base}-idle-{role}-gif-v1"
                folder=Path(portrait_path).parent.parent
                rel=(folder/"animations"/"idle"/role/f"{key}_idle_{side}.gif").as_posix()
                raw=z.read(m["file"]); margins=[]
                with Image.open(io.BytesIO(raw)) as im:
                    assert im.format=="GIF" and im.size==(512,512) and im.n_frames==12 and im.info.get("loop")==0
                    for i in range(12):
                        im.seek(i); assert im.info.get("duration") in (80,90)
                        b=im.convert("RGBA").getchannel("A").getbbox()
                        assert b
                        margin=min(b[0],b[1],512-b[2],512-b[3]); assert margin>=42,(key,side,i,margin)
                        margins.append(margin)
                item={"id":asset_id,"label":f"{draft['displayName']} — idle {side.upper()} (GIF)","assetType":"sprite","mediaType":"image","category":"creature","tags":["capture","creature","idle","animated",role],"source":{"scope":"pack","packId":"capture","author":"GenSRPG / Rigby2D","license":"project-internal"},"resource":{"file":rel,"format":"animated-image","mime":"image/gif","frameCount":1,"playbackMode":"loop"},"compatibility":{"uses":["combat","capture","editor"]}}
                dest=root/"assets/library"/rel
                if asset_id in known:
                    assert known[asset_id]==item and paths.get(rel)==asset_id and dest.read_bytes()==raw
                else:
                    assert rel not in paths and not dest.exists()
                    pending.append((dest,raw,item)); known[asset_id]=item; paths[rel]=asset_id
                pair=pairs.setdefault(key,{"showcase":SPECS[key],"mode":"engine" if key in RESERVES else "gif"})
                assert slot+"AssetId" not in pair
                pair[slot+"AssetId"]=asset_id
                records.append({"creature":key,"view":side,"id":asset_id,"file":rel,"sourceArchive":archive,"sourceArchiveSha256":digest,"sourceBlob":m["sourceBlob"],"gifSha256":sha(raw),"minMargin":min(margins),"realFrames":12,"visualReserve":key in RESERVES})
    assert set(pairs)==expected and len(records)==46 and len({r["id"] for r in records})==46
    assert all({"frontAssetId","backAssetId"}<=p.keys() for p in pairs.values())
    assert len(pending) in (0,46),"partial import requires review"
    for dest,raw,item in pending:
        dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw);cat["assets"].append(item)
    if pending:
        cat["counts"]["assets"]+=46;cat["counts"]["sprites"]+=46
        assert len(cat["assets"])==len(known)==cat["counts"]["assets"]
        save(catfile,cat)
        # Keep only the catalog-total assertions synchronized; all per-asset assertions stay intact.
        for path in (root/"tests/unit").glob("*.test.mjs"):
            old=path.read_text()
            new=re.sub(r"(catalog\.(?:counts\.assets|assets\.length)\s*,\s*)"+str(old_count)+r"\b",lambda m:m[1]+str(old_count+46),old)
            new=re.sub(r"(catalog\.counts\.sprites\s*,\s*)"+str(old_sprites)+r"\b",lambda m:m[1]+str(old_sprites+46),new)
            if new!=old:path.write_text(new)
    save(report,{"schema":"bestiary-idle-import-v1","items":records,"bindings":pairs})
    print("PASS: 46 exact GIFs, 23 pairs; source hashes and margins verified; no legacy media replaced")
if __name__=="__main__":run(Path(sys.argv[1]),Path(sys.argv[2]))
