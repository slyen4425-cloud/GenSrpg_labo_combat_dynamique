import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";

const ids=["morsure-ressort","etreinte-acier","mue-tranchante","couronne-eclats","broyeur-serpentin"];
const read=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const icon=s=>"pack:capture:icon-skill-vipfer-"+s+"-v1";
const sprite=s=>"pack:capture:sprite-skill-vipfer-"+s+"-v1";

test("Vipfer retains five exact stable skill IDs and author-approved media references",()=>{
 for(const slug of ids){
  const skillId="vipfer-"+slug;
  const raw=read("data/capture/showcase/"+skillId+".capture-skill-transfer-v1.json");
  const draft=normalizeCaptureSkillTransferV1(raw).draft;
  assert.equal(draft.id,skillId);
  assert.equal(draft.definition.id,skillId);
  assert.equal(draft.presentation.subjectId,skillId);
  const v=draft.presentation.visual;
  assert.equal(v.icon.assetId,icon(slug));
  const approved={ "morsure-ressort":"impact", "mue-tranchante":"cast", "couronne-eclats":"travel"}[slug];
  if(approved) {
   assert.equal(v[approved].assetId,sprite(slug));
   assert.equal(v[approved].playbackMode,approved==="travel"?"stretch":"once");
   assert.equal(v[approved].durationMs,approved==="travel"?550:720);
  }
  if(slug==="etreinte-acier"||slug==="broyeur-serpentin"){
   assert.deepEqual(Object.keys(v),["icon"],"never attach rejected human-silhouette FX");
  }
  if(slug==="couronne-eclats"){
   assert.equal(v.impact,undefined,"do not keep unrelated borrowed FX");
   assert.equal(draft.definition.salvo.shots,3);
   assert.equal(draft.definition.salvo.shotDurationMs,550);
  }
 }
});
test("Vipfer media references resolve only through canonical global-assets branch and cache revision",()=>{
 assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
 assert.equal(GLOBAL_VISUAL_LIBRARY.revision,"2026-11-26-v73-bestiary-idle-activation");
 assert.ok(GLOBAL_VISUAL_LIBRARY.catalogUrl.includes("/global-assets/data/assets/catalog/global-visual-assets.v1.json"));
 assert.ok(globalVisualAssetUrl("capture/icons/skills/vipfer/vipfer-morsure-ressort.webp").includes("/global-assets/assets/library/"));
});
