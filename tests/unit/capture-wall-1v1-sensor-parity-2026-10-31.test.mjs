import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {createCombatBarrierV1} from "../../src/core/combat/combat-entity-v1.js";
import {applyCombatDamageV1} from "../../src/core/combat/combat-damage-application-v1.js";
import {sweptSegmentRectContactV1} from "../../src/core/combat/combat-barrier-spatial-v1.js";

const ui=readFileSync(new URL("../../src/ui/combat-test-ui.js",import.meta.url),"utf8");

test("1v1 must resolve wall sprites through the same canonical asset binding as 2v2",()=>{
  const setup=ui.match(/const combatEntityOverlay=createCombatEntityOverlayV1\(([\s\S]*?)\);\s*const hpRefs/);
  assert.ok(setup,"native overlay is mounted before 1v1 HUD");
  assert.match(setup[1],/assetForId:\s*assetId\s*=>\s*presentationAssets\?\.visualAsset\?\.\(assetId\)/,
    "1v1 overlay must resolve selected real wall asset via CaptureSkillPresentationAssetsV2");
  assert.match(setup[1],/\?\?presentationAssets\?\.asset\?\.\(assetId\)/,
    "standalone demo still resolves the same asset through its historical adapter method");
});

test("1v1 must pass visible native wall collision geometry to the existing projectile renderer",()=>{
  const setup=ui.match(/const fx = createDomSkillFxRenderer\(\{([\s\S]*?)\n  \}\);/);
  assert.ok(setup,"1v1 uses the canonical FX renderer");
  assert.match(setup[1],/barrierCollisionRectsFor\(\{sourceActorId,targetActorId\}\)\s*\{[\s\S]*?return combatEntityOverlay\.collisionRectsFor\(\{sourceActorId,targetActorId\}\);\s*\}/,
    "1v1 must use the same sensor and runtime contact path as 2v2");
  assert.match(setup[1],/onProjectileContact\(contact\)\s*\{\s*runtime\?\.reportActionContact\(contact\);\s*\}/);
});

test("1v1 physical wall geometry decides real native interception rather than timeout",()=>{
  const state=createCombatState({fighters:[
    {id:"player",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace:50}},
    {id:"opponent",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10}
  ]});
  const placed=createCombatBarrierV1({state,sourceActorId:"player",protectedActorId:"player",sourceSkillId:"ice-wall",
    effect:{kind:"summon_entity",entityKind:"barrier",statId:"glace",hpPerStatPoint:2,
      interceptKinds:["projectile","beam","contact"]}});
  const rect={left:40,top:20,width:18,height:60};
  const hitPoint=sweptSegmentRectContactV1({from:{x:0,y:45},to:{x:90,y:45},rect});
  const missPoint=sweptSegmentRectContactV1({from:{x:0,y:10},to:{x:90,y:10},rect});
  assert.deepEqual(hitPoint,{x:40,y:45});
  assert.equal(missPoint,null);
  const hit=applyCombatDamageV1({state:placed.state,sourceActorId:"opponent",targetActorId:"player",
    incomingKind:"projectile",damage:30,contactedEntityId:hitPoint?placed.record.id:null});
  assert.equal(hit.absorbedByEntity,30);
  assert.equal(hit.state.combatEntities[0].hp,70);
  assert.equal(hit.state.fighters.player.hp,100);
  const miss=applyCombatDamageV1({state:placed.state,sourceActorId:"opponent",targetActorId:"player",
    incomingKind:"projectile",damage:30,contactedEntityId:missPoint?placed.record.id:null});
  assert.equal(miss.absorbedByEntity,0);
  assert.equal(miss.state.combatEntities[0].hp,100);
  assert.equal(miss.state.fighters.player.hp,70);
});

test("public 1v1 entry refreshes the exact editor module, without touching 2v2",()=>{
  const demo=readFileSync(new URL("../../examples/dom-demo/demo.js",import.meta.url),"utf8");
  const html=readFileSync(new URL("../../examples/dom-demo/index.html",import.meta.url),"utf8");
  assert.match(demo,/combat-test-ui\.js\?v=wall-1v1-sensor-parity-20261031/);
  assert.match(html,/demo\.js\?v=wall-1v1-sensor-parity-20261031/);
});
