import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";

const f=p=>new URL("../../"+p,import.meta.url);
const load=async p=>readFile(f(p));
const hash=b=>createHash("sha256").update(b).digest("hex");
const slugs=["plume-solaire","percee-aurore","egide-zenith","rayon-cardinal","releve-celeste"];

test("Veldra: author ZIP SHA, ten actual WebP binaries, unique IDs and native 16-frame strips",async()=>{
 const catalog=JSON.parse((await load("data/assets/catalog/global-visual-assets.v1.json")).toString("utf8"));
 const provenance=JSON.parse((await load("docs/LAB_VELDRA_SKILL_MEDIA_PROVENANCE_2026_11_18.json")).toString("utf8"));
 assert.equal(catalog.storage.branch, "global-assets");
 assert.equal(catalog.counts.assets,452);
 assert.equal(catalog.counts.icons,202);
 assert.equal(catalog.counts.sprites,218);
 assert.equal(catalog.assets.length,452);
 assert.equal(new Set(catalog.assets.map(x=>x.id)).size,catalog.assets.length);
 assert.equal(provenance.authorZips.length,2);
 for(const z of provenance.authorZips)assert.equal(hash(await load(z.path)),z.sha256,"author ZIP changed");
 assert.equal(provenance.assets.length,10);
 assert.equal(provenance.skillMatches.length,5);
 for(const a of provenance.assets){
  const b=await load(a.path);
  assert.ok(b.length>2000);
  assert.equal(hash(b),a.sha256,"media bytes differ from recorded provenance");
  assert.equal(b.subarray(0,4).toString("latin1"),"RIFF");
  assert.equal(b.subarray(8,12).toString("latin1"),"WEBP");
  const found=catalog.assets.filter(x=>x.id===provenance.skillMatches.find(y=>y.iconAssetId===x.id || y.spriteAssetId===x.id)?.iconAssetId ||
    x.id===provenance.skillMatches.find(y=>y.iconAssetId===x.id || y.spriteAssetId===x.id)?.spriteAssetId);
  // Catalog reference is authoritative; require the physical file path match exactly.
  assert.equal(found.filter(x=>"assets/library/"+x.resource.file===a.path).length,1,"catalog or file mismatch "+a.path);
 }
 for(const [i,key] of slugs.entries()){
  const entry=provenance.skillMatches[i];
  assert.equal(entry.skill,key);
  assert.ok(entry.distinctFrames>=8);
  assert.ok(entry.maxWebpFrameError<9);
  assert.equal(entry.iconAssetId,"pack:capture:icon-skill-veldra-"+key+"-v1");
  assert.equal(entry.spriteAssetId,"pack:capture:sprite-skill-veldra-"+key+"-v1");
  const src=catalog.assets.find(x=>x.id===entry.spriteAssetId);
  assert.equal(src.assetType,"sprite");
  assert.equal(src.resource.frameCount,16);
  assert.equal(src.resource.format,"sprite-strip");
 }
});
