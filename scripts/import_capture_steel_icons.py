#!/usr/bin/env python3
"""Strict, idempotence-protected import of four real approved Capture steel skill icons."""
import hashlib, io, json, zipfile
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
ZIP=ROOT/"_incoming/icons_acier_labo_combat_webp_128.zip"
CAT=ROOT/"data/assets/catalog/global-visual-assets.v1.json"
DIR=ROOT/"assets/library/capture/icons/skills"
SHA="7f89231542fb2fc1933a6b7f5212f837e4f9dc8d0376f9b07e6b2b02263b6fc2"
SRC=[
 ("carapace_acier","Carapace d’acier","icon_skill_carapace_acier_01.webp","332456455798aa06e1984f3522ae8daed6540d2c6033c3749ba5436ab762c375","3a6a15bdde3270fd1dff25a5b91bb948a487e811965439e3ff4797e4630dcbad"),
 ("lame_acier","Lame d’acier","icon_skill_lame_acier_01.webp","6dd807852e19262846d2ae5a5836a090f7057a26f3d6841f0fa0f4bf804bb99a","bb2b3140dd5b4ac6d7446cac71a795d6c4188f7ade142d1bc8a334860d42dc54"),
 ("tourbillons_rouille","Tourbillons de rouille","icon_skill_tourbillons_rouille_01.webp","37e7e61f3e4d633c48dbbd6721941185a4b93ebfb1696f4484948583396a09dc","71660daa5f12cb622c17a8a31de28d7c9a17b542782ce3f0f1e80e0ed2a778b2"),
 ("aile_acier","Aile d’acier","icon_skill_aile_acier_01.webp","0cce9bc316c97d3c08b5790bc5577c0ca34748a302b66dfb46ae88c814944225","b87d2ff7474f5599345579b0e7fe0fee327efa23bc80c44c0b8e97dcd14d3911")
]
def digest(data): return hashlib.sha256(data).hexdigest()
def verify_media():
    assert ZIP.is_file(), "Real uploaded archive missing"
    b=ZIP.read_bytes()
    assert len(b)==10880 and digest(b)==SHA, "Original user ZIP SHA mismatch"
    with zipfile.ZipFile(io.BytesIO(b)) as z:
        entries=z.infolist()
        assert len(entries)==4 and z.testzip() is None, "ZIP file count or CRC"
        names=[e.filename for e in entries]
        assert len(set(names))==4 and set(names)=={x[2] for x in SRC}, "Unexpected names in ZIP"
        assert all(not e.is_dir() and (e.external_attr>>16)&0o170000 !=0o120000 for e in entries), "Invalid entry"
        assert sum(e.file_size for e in entries)<20_000, "Unexpected expanded ZIP size"
        payload={x:z.read(x) for x in names}
    for slug,label,filename,expected,source in SRC:
        raw=payload[filename]
        assert digest(raw)==expected, "Source media mismatch: "+filename
        with Image.open(io.BytesIO(raw)) as im:
            im.load()
            assert im.format=="WEBP" and im.mode=="RGB" and im.size==(128,128), "Not RGB 128px WEBP"
            assert im.getbbox() is not None and im.getpixel((64,64))!=(0,0,0), "Empty or black placeholder"
    return payload
def main():
    files=verify_media()   # validate ALL actual bytes before modifying any repository files
    cat=json.loads(CAT.read_text(encoding="utf-8"))
    assert cat["storage"]["branch"]=="global-assets", "Not the authorized media owner"
    ids={x["id"] for x in cat["assets"]}
    existing_files=[DIR/x[2] for x in SRC]
    assert not any(p.exists() for p in existing_files), "Steel icon file already exists, refusing overwrite"
    entries=[]
    provenance=[]
    for slug,label,filename,expected,source in SRC:
        id="pack:capture:icon-skill-"+slug.replace("_","-")+"-01"
        assert id not in ids, "Canonical asset ID collision: "+id
        ids.add(id)
        entries.append({
            "id":id,"label":label,"assetType":"icon","mediaType":"image","category":"skill",
            "tags":["skill","capture","steel","metal","rust" if "rouille" in slug else "armor" if "carapace" in slug else "attack"],
            "source":{"scope":"pack","packId":"capture","author":"GenSrpG / ChatGPT (user-approved steel icon, framed)","license":"project-internal"},
            "resource":{"file":"capture/icons/skills/"+filename,"mime":"image/webp"},
            "compatibility":{"uses":["combat","capture","editor"]}
        })
        provenance.append({"assetId":id,"label":label,"sourceSha256":source,"originalPixels":[1254,1254],"derivedFile":filename,"derivedSha256":expected,"bytes":len(files[filename])})
    assert len(ids)==len(cat["assets"])+4
    # Preserve all unrelated assets and append 4 icons to the authoritative catalog.
    for filename,raw in files.items():
        (DIR/filename).write_bytes(raw)
    cat["assets"].extend(entries)
    cat["counts"]["assets"]=len(cat["assets"])
    cat["counts"]["icons"]=sum(a["assetType"]=="icon" for a in cat["assets"])
    CAT.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (DIR/"capture_four_steel_icons_2026_10_18.provenance.json").write_text(
        json.dumps({"schema":"capture-four-steel-icons-v1","sourceArchive":"icons_acier_labo_combat_webp_128.zip",
        "sourceArchiveSha256":SHA,"sourceDimensions":[1254,1254],"runtimeDimensions":[128,128],
        "format":"WebP RGB VP8 opaque","settings":{"resampling":"LANCZOS","quality":30,"method":6},
        "assets":provenance,"license":"project-internal"},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (ROOT/"docs/LAB_CAPTURE_STEEL_ICONS_2026_10_18.md").write_text(
        "# Capture — 4 icônes Acier — 18 octobre 2026\n\n"
        "Quatre médias source approuvés par l’utilisateur (Carapace d’acier, Lame d’acier, Tourbillons de rouille, Aile d’acier), "
        "issus de PNG RGB 1254px, convertis en WebP RGB opaques 128x128 au format du labo avec Pillow LANCZOS (qualité 30). "
        "Vérification SHA-256 de l’archive et de chacun des 4 vrais WebP, dimensions, mode, décompression et CRC.\n\n"
        "Dossier : assets/library/capture/icons/skills/. Catalogue unique : data/assets/catalog/global-visual-assets.v1.json. "
        "Quatre IDs pack:capture:icon-skill-{carapace-acier,lame-acier,tourbillons-rouille,aile-acier}-01.\n\n"
        "Aucun moteur, gameplay, loadout ou compétence auteur modifié. Actualiser séparément gh-pages après publication "
        "global-assets. Tests automatiques et contrôle visuel sur téléphone requis. Source, SHA et tailles : manifeste de provenance.\n")
    test=ROOT/"tests/unit/capture-steel-icons-2026-10-18.test.mjs"
    test.write_text(TEST_CODE,encoding="utf-8")
    work=ROOT/"docs/LAB_CURRENT_WORK.md"
    work.write_text(
        "## 2026-10-18 — Icônes Acier : quatre médias physiques importés sous ownership global-assets\n\n"
        "- Source originale importée : ZIP SHA-256 "+SHA+" ; 4 WebP RGB 128×128 réels, 4 nouveaux assetIds uniques ; provenance et test de vrais octets.\n"
        "- Domaine protégé : combat, éditeur, compétences auteur, main, Zombicide et autres médias intacts.\n"
        "- Lot démarré sur f92814097634e0a80b3b8dfc1fbc6631a1a988e1 ; branche work/lab-capture-steel-icons-2026-10-18 ; checkpoint lab-start-capture-steel-icons-2026-10-18.\n"
        "- Prochaine action : CI complète, publication fast-forward global-assets, cache du labo gh-pages, preview mobile.\n\n"
        + work.read_text(encoding="utf-8"),encoding="utf-8")
    ZIP.unlink()
    print("Imported 4 verified original 128x128 WebP RGB, source provenance, single authoritative catalog; zip removed.")
TEST_CODE=r'''import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const base=resolve(root,"assets/library/capture/icons/skills");
const cat=JSON.parse(readFileSync(resolve(root,"data/assets/catalog/global-visual-assets.v1.json")));
const prov=JSON.parse(readFileSync(resolve(base,"capture_four_steel_icons_2026_10_18.provenance.json")));
test("Four real user-approved Steel skill icons: unique catalog IDs and expected RGB WebP source bytes",()=>{
 assert.equal(cat.storage.branch,"global-assets");
 assert.equal(cat.counts.assets,cat.assets.length);
 assert.equal(cat.counts.icons,cat.assets.filter(x=>x.assetType==="icon").length);
 assert.equal(new Set(cat.assets.map(x=>x.id)).size,cat.assets.length);
 assert.equal(prov.assets.length,4);
 assert.equal(prov.sourceArchiveSha256,"7f89231542fb2fc1933a6b7f5212f837e4f9dc8d0376f9b07e6b2b02263b6fc2");
 for(const item of prov.assets){
  const asset=cat.assets.find(x=>x.id===item.assetId);assert.ok(asset,item.assetId);
  assert.equal(asset.assetType,"icon");assert.equal(asset.category,"skill");
  assert.equal(asset.resource.mime,"image/webp");assert.ok(asset.compatibility.uses.includes("editor"));
  assert.equal(asset.resource.file,"capture/icons/skills/"+item.derivedFile);
  const p=resolve(root,cat.storage.libraryRoot,asset.resource.file);assert.ok(existsSync(p));
  const b=readFileSync(p);
  assert.equal(b.length,item.bytes);
  assert.equal(createHash("sha256").update(b).digest("hex"),item.derivedSha256);
  assert.equal(b.toString("ascii",0,4),"RIFF");
  assert.equal(b.toString("ascii",8,12),"WEBP");
  assert.equal(b.toString("ascii",12,16),"VP8 ");
 }
});
'''
if __name__==="__main__":main()
