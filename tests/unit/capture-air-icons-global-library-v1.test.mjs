import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { createCaptureSkillPresentationAssetsV2 } from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import { createGlobalPresentationAssetResolverV1 } from "../../src/assets/global-presentation-asset-resolver-v1.js";
import { GLOBAL_VISUAL_LIBRARY, globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";
const root = new URL("../../", import.meta.url);
const cases=[
 {skill:"lib_gust",label:"Rafale",icon:"pack:capture:icon-skill-rafale-01",file:"capture/icons/skills/icon_skill_rafale_01.webp",old:"core:icon-skill-energy-beam-01"},
 {skill:"cap_air_atk_3",label:"Charge aérienne",icon:"pack:capture:icon-skill-aerial-attack-01",file:"capture/icons/skills/icon_skill_attaque_aerienne_01.webp",old:"core:icon-skill-speed-dash-01"}
];
const paths=cases.map(x=>"data/capture/showcase/"+x.skill+".capture-skill-transfer-v1.json");
test("Air skill icons bind only existing author drafts through the canonical showcase transfer",async()=>{
 for(const [i,x] of cases.entries()){
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===paths[i]).length,1);
  const raw=await readFile(new URL(paths[i],root),"utf8");
  const imported=importCaptureTransferJsonV1(raw);
  assert.equal(imported.kind,"skill");
  assert.equal(imported.value.draft.definition.name,x.label);
  assert.equal(imported.value.draft.presentation.visual.icon.assetId,x.icon);
  assert.notEqual(imported.value.draft.presentation.visual.icon.assetId,x.old);
 }
 assert.ok(!CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.some(p=>/souffle/i.test(p)),"Souffle remains optional until a matching authored skill exists");
});
test("real assetId path: authored presentation -> presenter -> canonical global-assets URL, without runtime/gameplay fork",async()=>{
 assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
 assert.ok(Number(GLOBAL_VISUAL_LIBRARY.revision.match(/-v(\d+)-/)?.[1])>=29,"Existing Air icon cache must remain fresh");
 const definitions=cases.map(x=>({id:x.icon,label:x.label,assetType:"icon",mediaType:"image",category:"skill",resource:{file:x.file,mime:"image/webp"}}));
 definitions.push({id:"pack:capture:icon-skill-souffle-01",label:"Souffle",assetType:"icon",mediaType:"image",category:"skill",resource:{file:"capture/icons/skills/icon_skill_souffle_01.webp",mime:"image/webp"}});
 const canonicalResolver=createGlobalPresentationAssetResolverV1({assetCatalog:{assets:definitions},assetUrlForFile:globalVisualAssetUrl});
 const bindings={};for(const x of cases){const t=importCaptureTransferJsonV1(await readFile(new URL("data/capture/showcase/"+x.skill+".capture-skill-transfer-v1.json",root),"utf8")); bindings[x.skill]=t.value.draft.presentation;}
 const presenter=createCaptureSkillPresentationAssetsV2({skillPresentations:bindings,assetForId:(id)=>canonicalResolver(id)??{id,assetId:id,url:"fixture://existing-other-fx"}});
 for(const x of cases){const resolved=presenter.presentationForSkill(x.skill);assert.equal(resolved.icon.assetId,x.icon);const u=new URL(resolved.icon.url);assert.ok(u.pathname.endsWith("/global-assets/assets/library/"+x.file));assert.equal(u.searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);}
 const souffle=canonicalResolver("pack:capture:icon-skill-souffle-01");assert.equal(souffle.assetId,"pack:capture:icon-skill-souffle-01");assert.ok(souffle.url.includes("/global-assets/"));
});
