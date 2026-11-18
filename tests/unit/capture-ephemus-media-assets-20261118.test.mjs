import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";

const root=p=>new URL("../../"+p,import.meta.url);
const read=async p=>readFile(root(p));
const digest=b=>createHash("sha256").update(b).digest("hex");
const labels=["ephemus-poussiere-oubli","ephemus-battement-limbes","ephemus-chrysalide-fantome","ephemus-lanterne-ames","ephemus-danse-mille-ames"];

test("Éphémus: canonical single catalog, five real 128px icons, five 16-frame strips, exact SHA provenance",async()=>{
 const catalog=JSON.parse((await read("data/assets/catalog/global-visual-assets.v1.json")).toString("utf8"));
 const prov=JSON.parse((await read("docs/LAB_EPHEMUS_ASSET_PROVENANCE_2026_11_18.json")).toString("utf8"));
 assert.equal(catalog.storage.branch,"global-assets");
 assert.equal(catalog.counts.assets,catalog.assets.length);
 const allIDs=catalog.assets.map(x=>x.id); assert.equal(allIDs.length,new Set(allIDs).size);
 assert.equal(prov.publishedAssets.length,10);
 assert.equal(prov.sourceChecks.length,5);
 for(const src of prov.sourceArchives){
  assert.equal(digest(await read(src.path)),src.sha256,"source author ZIP changed");
 }
 for(const p of prov.publishedAssets){
  const b=await read(p.path);
  assert.ok(b.length>2000,"not a real image");
  assert.equal(b.toString("latin1",0,4),"RIFF");
  assert.equal(b.toString("latin1",8,12),"WEBP");
  assert.equal(digest(b),p.sha256,"actual official bytes changed");
  const found=catalog.assets.filter(x=>x.id===p.id);
  assert.equal(found.length,1,"canonical id missing or duplicated");
  assert.equal("assets/library/"+found[0].resource.file,p.path);
  if(p.id.includes("sprite-skill")){
   assert.equal(found[0].resource.frameCount,16);
   assert.equal(found[0].resource.format,"sprite-strip");
   assert.ok(found[0].resource.frameMs>=80);
  }
 }
 for(const id of labels){
  assert.ok(prov.publishedAssets.some(x=>x.id==="pack:capture:icon-skill-"+id+"-v1"));
  assert.ok(prov.publishedAssets.some(x=>x.id==="pack:capture:sprite-skill-"+id+"-v1"));
 }
 assert.equal(catalog.counts.assets,442);
 assert.equal(catalog.counts.icons,197);
 assert.equal(catalog.counts.sprites,213);
 for(const x of prov.sourceChecks) assert.equal(x.distinctFrames,16);
});
