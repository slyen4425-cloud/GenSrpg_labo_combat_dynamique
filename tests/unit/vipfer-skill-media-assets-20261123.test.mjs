import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";

const root = p => new URL("../../"+p,import.meta.url);
const read = p => readFile(root(p));
const hash = b => createHash("sha256").update(b).digest("hex");
const rootDir = "assets/library/";
const skills=["morsure-ressort","etreinte-acier","mue-tranchante","couronne-eclats","broyeur-serpentin"];
const animated=["morsure-ressort","mue-tranchante","couronne-eclats"];

test("Vipfer author's 5 actual skill icons, 3 transparent six-frame strips, previews and original source are canonical",async()=>{
 const [catBytes,proofBytes]=await Promise.all([
  read("data/assets/catalog/global-visual-assets.v1.json"),
  read("assets/library/capture/creatures/vipfer/vipfer-skill-media-proof-20261123.json")
 ]);
 const cat=JSON.parse(catBytes),p=JSON.parse(proofBytes);
 assert.equal(cat.catalogId,"gensrpg-global-visual-assets");
 assert.equal(cat.storage.branch,"global-assets");
 assert.equal(cat.counts.assets,503);
 assert.equal(cat.counts.icons,217);
 assert.equal(cat.counts.sprites,253);
 assert.equal(cat.assets.length,cat.counts.assets);
 assert.equal(new Set(cat.assets.map(x=>x.id)).size,cat.assets.length,"no duplicated media identity");
 assert.equal(p.sourceSha256,hash(await read(p.sourceArchive)),"original user ZIP changed");
 assert.equal(p.originalZIPPreserved,true);
 assert.deepEqual(p.excludedEffects,["vipfer-etreinte-acier","vipfer-broyeur-serpentin"]);
 assert.equal(p.assetIds.length,8);
 assert.equal(p.files.length,11);
 for(const media of p.files){
  const bytes=await read(media.path);
  assert.equal(bytes.length,media.bytes,"file bytes "+media.path);
  assert.equal(hash(bytes),media.sha256,"uploaded source bytes must be bit-identical "+media.path);
  if(media.path.endsWith(".gif")){
   assert.equal(bytes.toString("ascii",0,6),"GIF89a");
   assert.ok(media.previewOnly);
  }else{
   assert.equal(bytes.toString("ascii",0,4),"RIFF","real WebP "+media.path);
   assert.equal(bytes.toString("ascii",8,12),"WEBP","real WebP "+media.path);
  }
 }
 for(const slug of skills){
  const id="pack:capture:icon-skill-vipfer-"+slug+"-v1";
  assert.ok(p.assetIds.includes(id));
  const asset=cat.assets.find(x=>x.id===id);
  assert.equal(asset.assetType,"icon");
  assert.equal(asset.resource.file,"capture/icons/skills/vipfer/vipfer-"+slug+".webp");
 }
 for(const slug of animated){
  const id="pack:capture:sprite-skill-vipfer-"+slug+"-v1";
  assert.ok(p.assetIds.includes(id));
  const asset=cat.assets.find(x=>x.id===id);
  assert.equal(asset.assetType,"sprite");
  assert.equal(asset.resource.file,"capture/sprites/skills/vipfer/vipfer-"+slug+".webp");
  assert.equal(asset.resource.format,"sprite-strip");
  assert.equal(asset.resource.frameCount,6);
  assert.equal(asset.resource.frameMs,120);
  assert.ok(p.files.some(x=>x.path===rootDir+asset.resource.file));
  assert.ok(p.files.some(x=>x.path==="assets/library/capture/creatures/vipfer/previews/skills/vipfer-"+slug+".gif"));
 }
 for(const slug of ["etreinte-acier","broyeur-serpentin"]){
  assert.equal(cat.assets.filter(x=>x.id==="pack:capture:sprite-skill-vipfer-"+slug+"-v1").length,0,
    "user rejected human silhouettes; missing sprites must stay unregistered");
 }
});
