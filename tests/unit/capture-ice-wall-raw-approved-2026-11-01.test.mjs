import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolve} from "node:path";
const root=resolve("assets/library/capture/sprites/skills/murs_glace/mur_glace_arcanique");
const sha=(b)=>createHash("sha256").update(b).digest("hex");
const asset="pack:capture:sprite-mur-glace-arcanique-01";
test("the approved author 2.5D ice wall actually replaces the old binary at the canonical path",()=>{
  const atlas=readFileSync(resolve(root,"mur_glace_arcanique_atlas_12f.webp"));
  assert.equal(sha(atlas),"15430cedd8a6993a8256a85b95fd3271a69beee521f974ee738eaea079356496");
  const frame=readFileSync(resolve(root,"png/mur_glace_arcanique_12.png"));
  assert.equal(sha(frame),"975e56bc7412ace7ae5950dcd69493cd98804595ba9d12e3a0d979d8e6c2476c");
  const manifest=JSON.parse(readFileSync(resolve(root,"manifest.json"),"utf8"));
  assert.equal(manifest.frames,12);
  assert.equal(manifest.sourceSheetSha256,"acb4e7f803da857a8d4446253478cfe27869e23f33d84da7ec838e97477bd9b3");
  assert.equal(manifest.holdLastFrame,true);
  assert.equal(manifest.persistentFrameIndex,11);
  const report=JSON.parse(readFileSync(resolve(root,"approved-replacement-2026-11-01.json"),"utf8"));
  assert.equal(report.assetId,asset);
  assert.equal(report.atlasSha256,sha(atlas));
  assert.equal(report.frameCount,12);
  assert.equal(Math.min(...report.measuredMargins.flat()),43);
});
test("same single global-assets ID, no new lookup authority, other two walls protected",()=>{
  const cat=JSON.parse(readFileSync("data/assets/catalog/global-visual-assets.v1.json","utf8"));
  assert.equal(cat.storage.branch,"global-assets");
  assert.equal(cat.assets.filter(x=>x.id===asset).length,1);
  assert.equal(cat.assets.find(x=>x.id===asset).resource.file,"capture/sprites/skills/murs_glace/mur_glace_arcanique/mur_glace_arcanique_atlas_12f.webp");
  for(const suffix of ["mur-glace-01","mur-glace-herisse-01"]){
    assert.equal(cat.assets.filter(x=>x.id==="pack:capture:sprite-"+suffix).length,1);
  }
});
