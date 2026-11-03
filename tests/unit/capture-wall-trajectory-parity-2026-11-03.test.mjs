import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {barrierContactAllowedForTrajectoryV1} from "../../src/core/combat/combat-barrier-spatial-v1.js";
import {projectCombatArenaBarrierVisualSizeV1} from "../../src/adapters/renderer/combat-entity-overlay-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";

const source=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const skill=id=>normalizeSkillDefinition(JSON.parse(source("data/capture/showcase/"+id+".capture-skill-transfer-v1.json")).draft.definition);

test("RED: only lateral/intersecting attacks can contact a wall, vertical under-target and skyfall bypass",()=>{
  for(const mode of ["under_target","skyfall"]) {
    assert.equal(barrierContactAllowedForTrajectoryV1(mode),false,mode);
  }
  for(const mode of ["direct","arc",null,undefined]){
    assert.equal(barrierContactAllowedForTrajectoryV1(mode),true,String(mode));
  }
});

test("RED: wall sprite uses the SAME arena author scale as the approved phone/PC FX",()=>{
  const wall={visualScale:4,visualScaleX:1.5,visualScaleY:1};
  const phone=projectCombatArenaBarrierVisualSizeV1(wall,1);
  const desktop=projectCombatArenaBarrierVisualSizeV1(wall,2.5);
  assert.deepEqual(phone,{width:420,height:368,artHeight:280});
  assert.deepEqual(desktop,{width:1050,height:920,artHeight:700});
  assert.equal(desktop.width/phone.width,2.5);
  assert.equal(desktop.height/phone.height,2.5);
});

test("real author ice spikes tick directly on a fighter protected by a native ice wall",()=>{
  const combat=createCombatSession({fighters:[
    {id:"player",maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,statValuesById:{glace:30}},
    {id:"opponent",maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,energyChargeAmount:0}
  ]});
  const wall=skill("mur_de_glace");
  const cast=combat.startSkill({actorId:"player",targetId:"player",skill:wall});
  assert.equal(cast.ok,true);
  const completed=combat.completeSkill({action:cast.action});
  assert.equal(completed.ok,true);
  const before=combat.snapshot();
  assert.equal(before.combatEntities.length,1);
  const wallHp=before.combatEntities[0].hp;
  const spike=skill("pique_glace");
  assert.equal(spike.form,"area");
  const tick=combat.applyChannelingTickV1({actorId:"opponent",targetId:"player",skill:spike,atMs:1000});
  assert.equal(tick.ok,true);
  assert.equal(combat.snapshot().fighters.player.hp,93);
  assert.equal(combat.snapshot().combatEntities[0].hp,wallHp,"ice spikes never chip the wall");
});

test("wall-owning FX cast does not sit behind its wall simply because it is behind its caster",()=>{
  const fx=source("src/adapters/renderer/dom-skill-fx.js");
  const css=source("examples/dom-demo/demo.css");
  assert.match(fx,/data-fx-actor-side/);
  assert.match(css,/data-combat-entity-arena-active[^\\n]*skill-fx--layer-behind/);
});
