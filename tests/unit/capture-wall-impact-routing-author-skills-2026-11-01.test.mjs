import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {planSkillOutcomeFx} from "../../src/core/fx/skill-fx-plan.js";
import {createCombatResolutionPresenter} from "../../src/adapters/renderer/combat-resolution-presenter.js";

const read = path => JSON.parse(readFileSync(new URL("../../"+path,import.meta.url),"utf8"));
test("RED: wall impact plans target the observed barrier, never the fighter",()=>{
  for(const form of ["projectile","beam","contact"]){
    const resolution={ok:true,outcome:"hit",skillId:"poing_givrant",
      events:[{type:"skill-release",form},{type:"combat-entity-hit",entityId:"barrier:hero:wall:hero",absorbedByEntity:12}],
      barrierImpactPoint:{x:175,y:215}};
    const plans=planSkillOutcomeFx({resolution,actorSlot:"enemy",targetSlot:"hero"});
    assert.equal(plans.length,1,form);
    assert.equal(plans[0].type,"impact",form);
    assert.equal(plans[0].combatEntityId,"barrier:hero:wall:hero",form);
    assert.deepEqual(plans[0].impactPoint,{x:175,y:215},form);
  }
});
test("RED: a wall-intercepted strike plays wall impact only; no protected-creature recoil or KO",async()=>{
  const animations=[],plans=[];
  const presenter=createCombatResolutionPresenter({
    visuals:{cancelFor(id){animations.push([id,"cancel"]);},
      playEventFor(id,event){animations.push([id,event]);return Promise.resolve({status:"finished"});}},
    fx:{play(plan){plans.push(plan);}}
  });
  const resolution={ok:true,outcome:"hit",skillId:"poing_givrant",
    events:[{type:"skill-release",form:"contact"},{type:"combat-entity-hit",
      entityId:"barrier:hero:mur_de_glace:hero",destroyedEntityId:"barrier:hero:mur_de_glace:hero",absorbedByEntity:5}],
    barrierImpactPoint:{x:80,y:110}};
  const out=presenter.presentOutcome({resolution,actorSlot:"enemy",targetSlot:"hero"});
  await out.finished;
  assert.deepEqual(animations,[],"no hit animation or KO on protected creature");
  assert.equal(out.ko,false);
  assert.equal(plans.length,1);
  assert.equal(plans[0].combatEntityId,"barrier:hero:mur_de_glace:hero");
  presenter.dispose();
});
test("real body hit and no wall retain original impact/recoil path",async()=>{
  const animations=[],plans=[];
  const presenter=createCombatResolutionPresenter({
    visuals:{cancelFor() {},playEventFor(id,event){animations.push([id,event]);return Promise.resolve({status:"finished"});}},
    fx:{play(plan){plans.push(plan);}}
  });
  const resolution={ok:true,outcome:"hit",skillId:"poing_givrant",
    events:[{type:"skill-release",form:"contact"},{type:"hit",actorId:"hero",appliedDamage:15,hpAfter:85}]};
  const out=presenter.presentOutcome({resolution,actorSlot:"enemy",targetSlot:"hero"});
  await out.finished;
  assert.deepEqual(animations,[["hero","hit"]]);
  assert.equal(plans[0].combatEntityId??null,null);
  presenter.dispose();
});
test("the active source exports have author values and stable IDs",()=>{
  const wall=read("data/capture/showcase/mur_de_glace.capture-skill-transfer-v1.json");
  const frost=read("data/capture/showcase/poing_givrant.capture-skill-transfer-v1.json");
  assert.equal(wall.draft.id,"mur_de_glace");
  assert.equal(frost.draft.id,"poing_givrant");
  const entity=wall.draft.definition.effects[0];
  assert.equal(entity.hpPerStatPoint,2);
  assert.deepEqual(entity.interceptKinds,["projectile","beam","contact"]);
  assert.equal(entity.placementMode,"arena");
  assert.equal(entity.arenaXPct,47);assert.equal(entity.arenaYPct,55);
  assert.equal(entity.visualScale,4);assert.equal(entity.visualScaleX,1.5);
  assert.equal(frost.draft.definition.effects[0].amount,15);
  assert.equal(frost.draft.definition.effects[1].status.kind,"incoming_effect_modifier");
});
