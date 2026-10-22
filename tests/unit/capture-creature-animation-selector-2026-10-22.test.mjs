import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  captureEditorCreatureVisualKindV1,
  captureEditorAssetMatchesRoleV1,
  humanVisualAssetElementV1,
  humanVisualAssetGroupsV1
} from "../../src/ui/capture-editor-human-v2.js";
const creature=(id,role,{frames=12,element="nature",origin="pack",type="sprite"}={})=>({
  id,label:id,category:"creature",assetType:type,mediaType:"image",
  tags:["creature",element,role,role==="movement"?"loop":"attack","animated"],
  source:{scope:origin},resource:{file:"creatures/"+id+".webp",frameCount:frames},
  compatibility:{uses:["combat","capture","editor"]}
});
const face=creature("creature-renard-moon-movement-face","movement",{element:"shadow"});
const back=creature("creature-renard-moon-movement-back","movement",{element:"shadow"});
const attack=creature("creature-loup-attack-face","attack",{element:"fire"});
test("only animated sprite strips appear in movement and attack menus, never static models or one-frame art",()=>{
  for(const item of [face,back]){
    assert.equal(captureEditorCreatureVisualKindV1(item),"movement");
    assert.equal(captureEditorAssetMatchesRoleV1(item,"movement"),true);
    assert.equal(captureEditorAssetMatchesRoleV1(item,"attack"),false);
  }
  assert.equal(captureEditorAssetMatchesRoleV1(attack,"attack"),true);
  assert.equal(captureEditorAssetMatchesRoleV1(attack,"movement"),false);
  const still=creature("creature-lunaire-portrait","movement",{frames:1,type:"portrait"});
  assert.equal(captureEditorAssetMatchesRoleV1(still,"movement"),false);
  assert.equal(captureEditorAssetMatchesRoleV1({...face,resource:{...face.resource,frameCount:1}},"movement"),false);
  assert.equal(captureEditorAssetMatchesRoleV1({...face,resource:undefined},"movement"),false);
  assert.equal(captureEditorAssetMatchesRoleV1({...face,assetType:"portrait"},"movement"),false);
  const staticModel={id:"old-static-model",category:"creature",assetType:"portrait",mediaType:"image",tags:["creature"],compatibility:{uses:["editor"]}};
  assert.equal(captureEditorCreatureVisualKindV1(staticModel),"model");
  assert.equal(captureEditorAssetMatchesRoleV1(staticModel,"movement"),false);
  assert.equal(captureEditorAssetMatchesRoleV1(staticModel,"attack"),false);
  assert.equal(captureEditorAssetMatchesRoleV1(staticModel,"creature"),true);
});
test("element is derived from canonical tags, no additional asset database",()=>{
  assert.equal(humanVisualAssetElementV1(face),"shadow");
  assert.equal(humanVisualAssetElementV1(attack),"fire");
  const mixed=humanVisualAssetGroupsV1([face,back,attack]);
  assert.deepEqual(new Set(mixed.map(g=>g.element)),new Set(["fire","shadow"]));
  assert.equal(mixed.reduce((n,g)=>n+g.entries.length,0),3);
  const shadow=mixed.find(g=>g.element==="shadow");
  assert.deepEqual(new Set(shadow.entries.map(x=>x.id)),new Set([face.id,back.id]));
});
test("real mobile-native UI uses provenance and elementary category and preserves saved static asset",()=>{
  const body=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  assert.ok(body.includes("libraryGroup.label + \" · \" + elementGroup.label"));
  assert.ok(body.includes('group.dataset.assetElement = elementGroup.element ?? "none"'));
  assert.ok(body.includes('" — ancien choix (conservé, hors animations)"'));
  assert.ok(!body.includes('"Modèles fixes (compatibilité)"'));
  const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  assert.equal((html.match(/data-asset-role="movement"/g)||[]).length,2);
  assert.equal((html.match(/data-asset-role="attack"/g)||[]).length,2);
  assert.match(html,/Sprite de déplacement — DOS \(joueur\)/);
  assert.match(html,/Sprite d’attaque|Sprite d'attaque/);
});
