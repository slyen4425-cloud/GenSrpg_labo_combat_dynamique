import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";
import {createGlobalPresentationAssetResolverV1} from "../../src/assets/global-presentation-asset-resolver-v1.js";
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
const icons=[{"id":"pack:capture:icon-skill-croc-electrique-01","label":"Croc électrique","path":"capture/icons/skills/icon_skill_croc_electrique_01.webp"},{"id":"pack:capture:icon-skill-beam-electrique-01","label":"Beam électrique","path":"capture/icons/skills/icon_skill_beam_electrique_01.webp"},{"id":"pack:capture:icon-skill-attaque-teleporte-01","label":"Attaque téléporte","path":"capture/icons/skills/icon_skill_attaque_teleporte_01.webp"},{"id":"pack:capture:icon-skill-armure-de-pointe-01","label":"Armure de pointe","path":"capture/icons/skills/icon_skill_armure_de_pointe_01.webp"},{"id":"pack:capture:icon-skill-miroir-magique-01","label":"Miroir magique","path":"capture/icons/skills/icon_skill_miroir_magique_01.webp"},{"id":"pack:capture:icon-skill-drain-de-vie-01","label":"Drain de vie","path":"capture/icons/skills/icon_skill_drain_de_vie_01.webp"},{"id":"pack:capture:icon-skill-comete-01","label":"Comète","path":"capture/icons/skills/icon_skill_comete_01.webp"},{"id":"pack:capture:icon-skill-pique-de-pierre-01","label":"Pique de pierre","path":"capture/icons/skills/icon_skill_pique_de_pierre_01.webp"}];
const catalog={assets:icons.map(x=>({id:x.id,label:x.label,assetType:"icon",mediaType:"image",category:"skill",resource:{file:x.path,mime:"image/webp"}}))};
test("Eight real icon identifiers have unique production URLs with new cache revision",()=>{
 assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
 assert.equal(GLOBAL_VISUAL_LIBRARY.revision,"2026-10-13-v31-capture-eight-skill-icons");
 assert.equal(new Set(icons.map(x=>x.id)).size,8);
 const resolve=createGlobalPresentationAssetResolverV1({assetCatalog:catalog,assetUrlForFile:globalVisualAssetUrl});
 for(const x of icons){
  const result=resolve(x.id);assert.ok(result,x.id);assert.equal(result.assetId,x.id);
  const url=new URL(result.url);
  assert.ok(url.pathname.endsWith("/global-assets/assets/library/"+x.path),x.id);
  assert.equal(url.searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
 }
});
test("Generic presenter binds each icon by assetId without special-case changes to skills",()=>{
 const resolve=createGlobalPresentationAssetResolverV1({assetCatalog:catalog,assetUrlForFile:globalVisualAssetUrl});
 const presentations={};
 for(const [i,x] of icons.entries())presentations["icon-preview-"+i]={id:"skill:icon-preview-"+i,version:9,subjectType:"skill",subjectId:"icon-preview-"+i,visual:{icon:{assetId:x.id}}};
 const presenter=createCaptureSkillPresentationAssetsV2({skillPresentations:presentations,assetForId:resolve});
 for(const [i,x] of icons.entries()){
  const result=presenter.presentationForSkill("icon-preview-"+i);
  assert.equal(result.icon.assetId,x.id);assert.ok(result.icon.url.includes("/global-assets/"));
 }
});
test("Real media preview tests images without a placeholder fallback",()=>{
 const html=readFileSync(new URL("../../examples/dom-demo/capture-eight-skill-icons-preview.html",import.meta.url),"utf8");
 assert.match(html,/globalVisualAssetUrl/);assert.match(html,/addEventListener\("error"/);
 assert.doesNotMatch(html,/placeholder|fallback\./i);
 for(const x of icons){assert.ok(html.includes(x.id),x.id);assert.ok(html.includes(x.path),x.path);}
});
