import test from "node:test";
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
