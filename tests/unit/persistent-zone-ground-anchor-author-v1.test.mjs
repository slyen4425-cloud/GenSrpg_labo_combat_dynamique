import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";
import {humanSkillEditorFieldsFromDraftV1,buildHumanSkillEditorDraftV1} from "../../src/ui/capture-editor-human-v2.js";

async function json(relative) {
 return JSON.parse(await readFile(new URL("../../"+relative, import.meta.url),"utf8"));
}
function fakeNode(getBounds) {
 return {className:"",dataset:{},style:{},children:[],removed:false,
  append(child){this.children.push(child);},remove(){this.removed=true;},
  getBoundingClientRect(){return typeof getBounds==="function"?getBounds():getBounds;}};
}
function makeFx(presentationForSkill) {
 let bounds={left:80,top:180,width:40,height:40};
 const arena=fakeNode({left:0,top:0,width:400,height:300});
 const source=fakeNode(()=>bounds);
 arena.ownerDocument={createElement(){
  const node=fakeNode({left:0,top:0,width:40,height:40});
  node.ownerDocument=arena.ownerDocument; return node;
 }};
 const renderer=createDomSkillFxRenderer({
  arena,anchors:{player:source},targetAnchors:{player:source},presentationForSkill,
  animate(){return {finished:new Promise(()=>{}),cancel(){}};},
  requestFrame(){return null;},cancelFrame(){}
 });
 return {renderer,arena,move(left,top){bounds={...bounds,left,top};}};
}
function presentation(attachment) {
 const file={id:"skill:test",version:9,subjectType:"skill",subjectId:"test",
  visual:{aura:{assetId:"test:zone",displayScale:1,displayScaleX:1,displayScaleY:1,
   attachment,anchor:null,offsetX:0,offsetY:0,trigger:"impact",playbackMode:"loop",
   rotationDeg:0,opacity:1,layerByView:{player:"behind",opponent:"behind"},offsetMode:"same"}},
  audio:{},statusVisuals:{},feedback:{}};
 return createCaptureSkillPresentationAssetsV2({
  skillPresentations:{test:file},assetForId(){return {url:"zone.webp"};}
 }).presentationForSkill;
}
function zone(id) {
 return {id,skillId:"test",sourceActorId:"player",radius:"short",appliedAtMs:0,
  expiresAtMs:60000,durationMs:60000};
}
test("ground-fixed presentation attachment flows from SkillBinding through canonical presentation projection",()=>{
 assert.equal(presentation("fixed-source")("test",{sourceView:"player",fxType:"persistent-zone"}).persistentZone.attachment,"fixed-source");
 assert.equal(presentation("source")("test",{sourceView:"player",fxType:"persistent-zone"}).persistentZone.attachment,"source");
});
test("fixed-source zones freeze immediately, mobile/source zones follow, recall never steals owner",()=>{
 for(const [attachment,expected] of [["source","320px"],["fixed-source","100px"]]){
  const h=makeFx(presentation(attachment));
  h.renderer.syncPersistentZones([zone("player:test:mist")]);
  assert.equal(h.arena.children.length,1);
  const node=h.arena.children[0];
  assert.equal(node.style.left,"100px");
  assert.equal(node.style.top,"200px");
  h.move(300,20);
  h.renderer.syncPersistentZones([zone("player:test:mist")]);
  assert.equal(node.style.left,expected,attachment+" should have the correct owner");
  h.move(120,40);
  h.renderer.syncPersistentZones([{...zone("player:test:mist"),detachedFromSource:true,originRosterMemberId:"water"}]);
  assert.equal(node.style.left,expected,attachment+" remains at last owned ground position after recall");
  h.renderer.syncPersistentZones([]);
  assert.equal(node.removed,true);
  h.renderer.dispose();
 }
});
test("author capacity and Maraileron transfers keep their latest requested identity, attributes and loadout",async()=>{
 const skill=await json("data/capture/showcase/cap_water_special_2.capture-skill-transfer-v1.json");
 const creature=await json("data/capture/showcase/crea_maraileron.capture-creature-transfer-v1.json");
 const draft=importCaptureTransferJsonV1(JSON.stringify(skill)).value.draft;
 const aura=draft.presentation.visual.aura;
 assert.equal(draft.id,"cap_water_special_2");
 assert.equal(draft.definition.loadoutSlot,"ultimate");
 assert.equal(draft.definition.preparationMs,2000);
 assert.equal(draft.definition.maxUsesPerCombat,1);
 assert.equal(aura.attachment,"fixed-source");
 assert.equal(aura.displayScale,4);
 assert.equal(aura.offsetY,-35);
 assert.equal(draft.definition.effects[0].tickEffect.status.deltaPoints,100);
 assert.equal(draft.definition.effects[0].durationMs,60000);
 assert.equal(draft.definition.effects[0].persistAfterRecall,true);
 assert.equal(creature.draft.id,"crea_maraileron");
 assert.equal(creature.draft.presentation.viewOverrides.player.displayScale,1.5);
 assert.equal(creature.draft.presentation.viewOverrides.opponent.displayScale,0.92);
 assert.equal(creature.draft.combat.maxHp,140);
 assert.ok(creature.draft.skillIds.includes("lib_aqua_heal"));
 assert.equal(creature.loadout.slots.find(s=>s.id==="slot-4").skillId,"lib_aqua_heal");
 assert.equal(creature.loadout.slots.find(s=>s.id==="slot-ultimate").skillId,draft.id);
 assert.equal(JSON.parse(exportCaptureSkillTransferJsonV1(draft)).draft.presentation.visual.aura.attachment,"fixed-source");
});
test("Human Editor projects the zone attachment mode explicitly and HTML offers both choices",async()=>{
 const raw=await json("data/capture/showcase/cap_water_special_2.capture-skill-transfer-v1.json");
 const input=importCaptureTransferJsonV1(JSON.stringify(raw)).value.draft;
 const fields=humanSkillEditorFieldsFromDraftV1(input);
 assert.equal(fields.presentation.zoneAttachment,"fixed-source");
 const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
 assert.match(html,/data-skill-zone-attachment/);
 assert.match(html,/value="fixed-source"/);
 assert.match(html,/value="source"/);
 const editor=await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
 assert.match(editor,/zoneAttachment:/);
 assert.match(editor,/\[data-skill-zone-attachment\]/);
});
