import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
const root=new URL("../../",import.meta.url);
const source="a00b6b8272fc2dd960088c6814c0c6d193f063608e2183ab8ec94b6bc01d5abb";
const read=(p)=>readFileSync(new URL(p,root));
const roles={cast:["release",100,"once"],projectile:["travel",90,"loop"],impact:["impact",90,"once"]};
test("Snowball source ZIP is the exact approved author upload",()=>{
  const bytes=read("_incoming/boule_de_neige_pack_complet_36_frames.zip");
  assert.equal(createHash("sha256").update(bytes).digest("hex"),source);
});
test("All 3 snowball VFX use one catalog and real WebP strips, without duplicating IDs",()=>{
  const data=JSON.parse(read("data/assets/catalog/global-visual-assets.v1.json"));
  assert.equal(data.storage.branch,"global-assets");
  assert.equal(data.counts.assets,data.assets.length);
  assert.equal(data.counts.sprites,data.assets.filter(x=>x.assetType==="sprite").length);
  assert.equal(new Set(data.assets.map(x=>x.id)).size,data.assets.length);
  const dir="assets/library/capture/sprites/skills/boule_de_neige/";
  const sequence=JSON.parse(read(dir+"sequence.json"));
  assert.equal(sequence.sourceArchiveSha256,source);
  for(const [role,[category,ms,mode]] of Object.entries(roles)){
    const id="pack:capture:sprite-boule-de-neige-"+role+"-01";
    const entries=data.assets.filter(a=>a.id===id);
    assert.equal(entries.length,1);
    const a=entries[0];
    assert.equal(a.category,category);
    assert.equal(a.resource.frameCount,12);
    assert.equal(a.resource.frameMs,ms);
    assert.equal(a.resource.playbackMode,mode);
    assert.equal(a.resource.format,"sprite-strip");
    assert.equal(a.resource.file, "capture/sprites/skills/boule_de_neige/"+role+"/boule_de_neige_"+role+"_atlas_12f.webp");
    assert.equal(sequence.sequences[role].id,id);
    const atlas=read("assets/library/"+a.resource.file);
    assert.equal(atlas.toString("ascii",0,4),"RIFF");
    assert.equal(atlas.toString("ascii",8,12),"WEBP");
    for(let n=1;n<=12;n++){
      const file=dir+role+"/webp/boule_de_neige_"+role+"_"+String(n).padStart(2,"0")+".webp";
      assert.equal(existsSync(new URL(file,root)),true);
    }
    const preview=dir+role+"/preview_boule_de_neige_"+role+".webp";
    assert.equal(existsSync(new URL(preview,root)),true);
  }
  assert.equal(data.assets.length,284,"281 existing assets + exactly three snowball sprite sequences");
});
