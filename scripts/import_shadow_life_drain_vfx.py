#!/usr/bin/env python3
import csv, hashlib, io, json, zipfile
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
PREFIX="assets/library/capture/sprites/skills/"
IN=ROOT/"_incoming"
CAT=ROOT/"data/assets/catalog/global-visual-assets.v1.json"
SPECS={
"shadow_spell":("capture_shadow_spell_vfx_40frames.zip","cbbe9db7a24ed5a74beed25ce898fe8d23a61c86fdd68f6e0282a9dd5e9ba4e7","shadow","pack:capture:sprite-shadow-spell-01",["6be18cd0e05e0110bed4963c442dcddacbafb23cc703e775640285ed21cafefe","b0635eea36f990eed647b517900214bf7dc570358e96505de17079899a669166"]),
"life_drain":("capture_life_drain_vfx_40frames.zip","65b0f56649091fee8410811c4aafc9c0437a5f3d753509267aa0a5c0a94747e4","life_drain","pack:capture:sprite-life-drain-01",["6ce322797dc6d7ee6296ff324378368b7cb43b3f194bb63f73230561c9ab193e","bc89b2f4cf019dd5ee591ba6ca4ad53b268695c357f4cdd5f68a94e69381e3d0"])
}
def verify(folder,spec):
    filename,h,slug,pack,sources=spec
    p=IN/filename
    assert p.is_file(), "Both uploaded real ZIPs are required"
    b=p.read_bytes()
    assert hashlib.sha256(b).hexdigest()==h, "ZIP SHA-256 mismatch: "+filename
    with zipfile.ZipFile(io.BytesIO(b)) as z:
        names=z.namelist()
        assert len(names)==45 and len(set(names))==45 and z.testzip() is None
        assert sum(i.file_size for i in z.infolist())<40_000_000
        base=PREFIX+folder+"/"
        assert all(n.startswith(base) and ".." not in Path(n).parts for n in names)
        assert all(not i.is_dir() and ((i.external_attr>>16)&0o170000)!=0o120000 for i in z.infolist())
        files={name[len(base):]:z.read(name) for name in names}
    manifest="sprite_skill_"+folder+"_sequences_01.json"
    m=json.loads(files[manifest]); assert m["id"]==pack and m["frame_size"]==[512,512]
    assert set(m["sequences"])=={"cast","impact"} and m["source_grid"]==[5,4]
    rows=list(csv.DictReader(io.StringIO(files["provenance.csv"].decode())))
    assert len(rows)==40
    byname={row["output"]:row for row in rows}; assert len(byname)==40
    expected={manifest,"provenance.csv","README.md"}
    for role,ms,source in [("cast",70,sources[0]),("impact",65,sources[1])]:
        seq=m["sequences"][role]
        assert seq["frame_count"]==20 and seq["frame_ms"]==ms
        assert seq["playback_mode"]=="once" and seq["loop"] is False
        assert seq["source"]["sha256"]==source
        for i in range(1,21):
            f="frames/sprite_skill_"+slug+"_"+role+"_"+str(i).zfill(2)+".png"
            assert seq["frames"][i-1]==f and f in files and f in byname
            im=Image.open(io.BytesIO(files[f]));im.load()
            assert im.format=="PNG" and im.mode=="RGBA" and im.size==(512,512)
            assert im.getchannel("A").getextrema()[0]==0
            assert im.getchannel("A").getextrema()[1]>100
            assert hashlib.sha256(files[f]).hexdigest()==byname[f]["output_sha256"]
            assert byname[f]["source_sha256"]==source
            expected.add(f)
        atlas="atlases/sprite_skill_"+slug+"_"+role+"_atlas_01.webp"
        assert seq["atlas"]=={"file":atlas,"format":"sprite-strip","frameCount":20,"frameWidth":384,"frameHeight":384}
        im=Image.open(io.BytesIO(files[atlas]));im.load()
        assert im.format=="WEBP" and im.size==(7680,384) and "A" in im.getbands()
        expected.add(atlas)
    assert set(files)==expected and len(expected)==45
    return files,m
def main():
    catalog=json.loads(CAT.read_text())
    assert catalog["storage"]["branch"]=="global-assets"
    assert all(not (ROOT/PREFIX/folder).exists() for folder in SPECS)
    material={key:verify(key,spec) for key,spec in SPECS.items()}
    existing={a["id"] for a in catalog["assets"]}
    for folder,(files,manifest) in material.items():
        slug=SPECS[folder][2]
        for role,category,ms in [("cast","release",70),("impact","impact",65)]:
            ident="pack:capture:sprite-"+folder.replace("_","-")+"-"+role+"-01"
            assert ident not in existing
            existing.add(ident)
            catalog["assets"].append({
               "id":ident,"label":manifest["label"]+" — "+("Cast" if role=="cast" else "Impact"),
               "assetType":"sprite","mediaType":"image","category":category,
               "tags":["capture","skill","shadow","magic","animated",role],
               "source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},
               "resource":{"file":"capture/sprites/skills/"+folder+"/"+manifest["sequences"][role]["atlas"]["file"],
                 "format":"sprite-strip","mime":"image/webp","frameCount":20,"frameMs":ms,"playbackMode":"once"},
               "compatibility":{"uses":["combat","capture","editor"]}
            })
    for folder,(files,_) in material.items():
        for rel,content in files.items():
            path=ROOT/PREFIX/folder/rel;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(content)
    catalog["counts"]["assets"]=len(catalog["assets"])
    catalog["counts"]["sprites"]=sum(a["assetType"]=="sprite" for a in catalog["assets"])
    CAT.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n")
    report=ROOT/"docs/LAB_SHADOW_LIFE_DRAIN_VFX_V1.md"
    report.write_text("# Ombre et Drain de vie — 80 frames réelles\n\n4 séquences : 2 Cast, 2 Impact. PNG RGBA 512x512 par agrandissement de 4 planches 1402x1122 (non-natif). Quatre atlas WebP 7680x384. Octets, SHA-256 sources et provenance vérifiés. Catalogue unique enrichi de 4 IDs. Aucun gameplay modifié. Test réel sur smartphone à confirmer.\n")
    test=ROOT/"tests/unit/capture-shadow-life-drain-assets-v1.test.mjs"
    test.write_text(TEST_CODE)
    current=ROOT/"docs/LAB_CURRENT_WORK.md"
    current.write_text("## 2026-10-18 — Ombre / Drain de vie : 80 médias réellement importés\n\n- ZIP strictement contrôlés avec SHA-256, 80 PNG RGBA, 4 atlas, 4 assetId uniques. CI et publication officialisées après tests; preview utilisateur encore nécessaire.\n\n"+current.read_text())
    for filename, *_ in SPECS.values(): (IN/filename).unlink()
    print("Verified 80 real RGBA PNG + 4 real WebP and imported 4 canonical IDs")
TEST_CODE=r'''import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync,readdirSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const cat=JSON.parse(readFileSync(resolve(root,"data/assets/catalog/global-visual-assets.v1.json")));
test("Shadow/Life Drain physical RGBA frames and SHA256; atlas + unique catalog IDs",()=>{
 assert.equal(cat.counts.assets,cat.assets.length);
 assert.equal(cat.counts.sprites,cat.assets.filter(x=>x.assetType==="sprite").length);
 assert.equal(new Set(cat.assets.map(x=>x.id)).size,cat.assets.length);
 for(const [folder,slug] of [["shadow_spell","shadow"],["life_drain","life_drain"]]){
  const base=resolve(root,"assets/library/capture/sprites/skills/"+folder);
  const m=JSON.parse(readFileSync(resolve(base,"sprite_skill_"+folder+"_sequences_01.json")));
  const rows=readFileSync(resolve(base,"provenance.csv"),"utf8").trim().split(/\r?\n/).slice(1);
  const hashes=new Map(rows.map(x=>{let a=x.split(",");return [a[4],a[5]];}));
  assert.equal(rows.length,40);assert.equal(readdirSync(resolve(base,"frames")).length,40);
  assert.equal(readdirSync(resolve(base,"atlases")).length,2);
  for(const [role,category,ms] of [["cast","release",70],["impact","impact",65]]){
   const seq=m.sequences[role],id="pack:capture:sprite-"+folder.replaceAll("_","-")+"-"+role+"-01";
   const a=cat.assets.find(x=>x.id===id);assert.ok(a);assert.equal(a.category,category);
   assert.equal(a.resource.frameMs,ms);assert.equal(a.resource.frameCount,20);
   assert.ok(a.compatibility.uses.includes("editor"));
   assert.ok(existsSync(resolve(root,cat.storage.libraryRoot,a.resource.file)));
   assert.equal(seq.frames.length,20);
   for(let n=1;n<=20;n++){
    const rel="frames/sprite_skill_"+slug+"_"+role+"_"+String(n).padStart(2,"0")+".png";
    assert.equal(seq.frames[n-1],rel);
    const b=readFileSync(resolve(base,rel));assert.equal(b.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
    assert.equal(b.readUInt32BE(16),512);assert.equal(b.readUInt32BE(20),512);assert.equal(b[25],6);
    assert.equal(createHash("sha256").update(b).digest("hex"),hashes.get(rel));
   }
   const atlas=readFileSync(resolve(base,seq.atlas.file));
   assert.equal(atlas.toString("ascii",0,4),"RIFF");
   assert.equal(atlas.toString("ascii",8,12),"WEBP");
   assert.equal(1+atlas.readUIntLE(24,3),7680);
   assert.equal(1+atlas.readUIntLE(27,3),384);
  }
 }
});
'''
if __name__=="__main__": main()
