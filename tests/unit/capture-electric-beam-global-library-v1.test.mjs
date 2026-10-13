import test from "node:test";
import assert from "node:assert/strict";
import { GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";
import { createGlobalPresentationAssetResolverV1 } from "../../src/assets/global-presentation-asset-resolver-v1.js";
import { createCaptureSkillPresentationAssetsV2 } from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
const cases=[
 {id:"pack:capture:sprite-electric-yellow-beam-cast-01",part:"cast",filename:"sprite_skill_electric_beam_cast_atlas_01.webp",count:20,ms:60,mode:"once",category:"release"},
 {id:"pack:capture:sprite-electric-yellow-beam-body-01",part:"travel",filename:"sprite_skill_electric_beam_beam_body_atlas_01.webp",count:12,ms:45,mode:"loop",category:"travel"},
 {id:"pack:capture:sprite-electric-yellow-beam-impact-01",part:"impact",filename:"sprite_skill_electric_beam_impact_atlas_01.webp",count:12,ms:45,mode:"once",category:"impact"}
];
const catalog={assets:cases.map(x=>({id:x.id,label:"Rayon électrique jaune",assetType:"sprite",category:x.category,resource:{file:"capture/sprites/skills/electric_beam_yellow/atlases/"+x.filename,format:"sprite-strip",mime:"image/webp",frameCount:x.count,frameMs:x.ms,playbackMode:x.mode}}))};
test("one published cache revision exposes the three new electric ray atlas URLs",()=>{
 assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
 assert.equal(GLOBAL_VISUAL_LIBRARY.revision,"2026-10-13-v30-capture-electric-beam-yellow");
 assert.equal(new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl).searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
 const resolve=createGlobalPresentationAssetResolverV1({assetCatalog:catalog,assetUrlForFile:globalVisualAssetUrl});
 for(const x of cases){
  const a=resolve(x.id);assert.ok(a);assert.equal(a.frameCount,x.count);assert.equal(a.frameMs,x.ms);assert.equal(a.playbackMode,x.mode);
  const u=new URL(a.url);assert.ok(u.pathname.endsWith("/global-assets/assets/library/capture/sprites/skills/electric_beam_yellow/atlases/"+x.filename));
  assert.equal(u.searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
 }
 assert.equal(resolve("pack:capture:sprite-electric-yellow-beam-start-01"),null,"No fourth start sprite was authored");
});
test("Cast/Corps/Impact bind through the original generic Beam presenter, without skill-specific code",()=>{
 const resolve=createGlobalPresentationAssetResolverV1({assetCatalog:catalog,assetUrlForFile:globalVisualAssetUrl});
 const presenter=createCaptureSkillPresentationAssetsV2({
  skillPresentations:{"test_electric_beam":{id:"skill:test_electric_beam",version:9,subjectType:"skill",subjectId:"test_electric_beam",visual:{
   cast:{assetId:cases[0].id,attachment:"source",trigger:"preparation-start",playbackMode:"once",offsetX:0,offsetY:0},
   travel:{assetId:cases[1].id,attachment:"trajectory",trigger:"travel-start",playbackMode:"stretch",offsetX:0,offsetY:0},
   impact:{assetId:cases[2].id,attachment:"fixed-target",trigger:"impact",playbackMode:"once",offsetX:0,offsetY:0}
  },audio:{},statusVisuals:{}}},
  assetForId:resolve
 });
 const r=presenter.presentationForSkill("test_electric_beam");
 assert.equal(r.cast.assetId,cases[0].id);assert.equal(r.travel.assetId,cases[1].id);assert.equal(r.impact.assetId,cases[2].id);
 assert.equal(r.beamStart,null);
 assert.ok(r.travel.url.includes("/global-assets/"));
});
