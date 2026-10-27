import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { projectileClashCandidate, resolveProjectileClash } from "../../src/core/combat/projectile-clash.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { readHumanProjectilePowerV1 } from "../../src/ui/capture-editor-human-v2.js";

const skill = (id, form, power, travelMs=700, preparationMs=1000) =>
  normalizeSkillDefinition({
    id,name:id,category:"offensive",form,element:"electric",
    energyCost:1,preparationMs,travelMs,recoveryMs:0,cooldownMs:0,
    allowedDistances:["medium"],targetRelations:["enemy"],approachMode:"none",
    effect:{damage:10},projectileClash:{power}
  });
function action(actorId,targetId,skill) {
  return {actionType:"skill",actionId:skill.id,actorId,targetId,skill,
    releaseAtMs:skill.preparationMs,impactAtMs:skill.preparationMs+skill.travelMs,
    travelMs:skill.travelMs,recoveryMs:skill.recoveryMs};
}
function candidate(lhs,rhs,leftStart=0,rightStart=0) {
  return projectileClashCandidate({
    leftAction:action("player","opponent",lhs),leftStartedAtClockMs:leftStart,
    rightAction:action("opponent","player",rhs),rightStartedAtClockMs:rightStart
  });
}

test("The same clash power contract accepts beam 2, still rejects contact 2 and zero beams remain passive",()=>{
  assert.equal(skill("beam","beam",2).projectileClash.power,2);
  assert.throws(()=>skill("contact","contact",2),/form|power/i);
  assert.equal(candidate(skill("a","beam",0),skill("b","projectile",1)),null);
});

test("Beam and projectile collide at the beginning of their shared active interval and use the same power ordering",()=>{
  for(const [beamPower,projectilePower,outcome] of [[2,1,"left_survives"],[1,2,"right_survives"],[2,2,"mutual_cancel"]]){
    const c=candidate(skill("beam","beam",beamPower),skill("shot","projectile",projectilePower));
    assert.ok(c);
    assert.equal(c.atClockMs,1000);
    assert.equal(c.outcome,outcome);
    assert.equal(c.leftProgress,1);
    assert.equal(c.rightProgress,0);
  }
  const delayed=candidate(skill("beam","beam",2),skill("shot","projectile",1),250,0);
  assert.equal(delayed.atClockMs,1250);
  assert.ok(delayed.rightProgress>0 && delayed.rightProgress<1);
  assert.equal(candidate(skill("beam","beam",2),skill("shot","projectile",1),800,0),null,
    "expired projectile must not collide with late beam");
});

test("Opposite beams meet while both active, equal cancel and greater power survives; non-reciprocal skills do not clash",()=>{
  const left=skill("left","beam",2),equal=skill("equal","beam",2),weak=skill("weak","beam",1);
  const both=candidate(left,equal,0,200);
  assert.equal(both.atClockMs,1200);
  assert.equal(both.outcome,"mutual_cancel");
  assert.equal(both.leftProgress,0.5);
  assert.equal(both.rightProgress,0.5);
  assert.equal(candidate(left,weak).outcome,"left_survives");
  assert.equal(projectileClashCandidate({
    leftAction:action("player","opponent",left),leftStartedAtClockMs:0,
    rightAction:action("extra","player",equal),rightStartedAtClockMs:0
  }),null);
  const cancel=resolveProjectileClash({state:{},leftAction:action("player","opponent",left),
    leftStartedAtClockMs:0,rightAction:action("opponent","player",equal),
    rightStartedAtClockMs:0,candidate:candidate(left,equal)});
  assert.equal(cancel.left.outcome,"clashed");
  assert.equal(cancel.right.outcome,"clashed");
  assert.equal(cancel.left.events.some(e=>e.type==="hit"),false);
});

test("Arc électrique authored export remains a beam with native clash power 2 and FX unchanged",async()=>{
  const raw=JSON.parse(await readFile(new URL("../../data/capture/showcase/lib_chain_lightning.capture-skill-transfer-v1.json",import.meta.url),"utf8"));
  assert.equal(raw.draft.definition.id,"lib_chain_lightning");
  assert.equal(raw.draft.definition.form,"beam");
  assert.equal(raw.draft.definition.projectileClash.power,2);
  assert.equal(raw.draft.presentation.visual.travel.assetId,"pack:capture:sprite-electric-yellow-beam-body-01");
  assert.equal(raw.draft.presentation.feedback.glow.strength,0.85);
  assert.equal(normalizeSkillDefinition(raw.draft.definition).projectileClash.power,2);
});

test("Real Runtime resolves opposite beam vs projectile clash without a late hit and allows the stronger beam to land",()=>{
  const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,
    energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:1,chargeTimeModifierPct:0});
  const session=createCombatSession({distance:"medium",fighters:[fighter("player"),fighter("opponent")]});
  let clock=0, timer=null, seq=0;const resolutions=[];
  const runtime=createCombatRuntime({session,tickMs:50,now:()=>clock,
    setTimer(fn){timer=fn;return ++seq},clearTimer(){timer=null},
    onResolved:x=>resolutions.push(x)});
  const beam=skill("beam","beam",2),shot=skill("shot","projectile",1);
  const advance=next=>{clock=next;const cb=timer;timer=null;assert.equal(typeof cb,"function");cb()};
  runtime.start();
  assert.equal(runtime.startSkill({actorId:"player",targetId:"opponent",skill:beam}).ok,true);
  assert.equal(runtime.startSkill({actorId:"opponent",targetId:"player",skill:shot}).ok,true);
  advance(1000);
  assert.equal(resolutions.some(x=>x.outcome==="clashed" && x.actorId==="opponent"),true);
  assert.equal(session.snapshot().fighters.player.hp,100);
  advance(1750);
  assert.equal(resolutions.some(x=>x.actorId==="player" && x.events.some(e=>e.type==="hit")),true);
  assert.equal(session.snapshot().fighters.player.hp,100,"the weaker shot must never hit");
  assert.ok(session.snapshot().fighters.opponent.hp<100,"stronger beam keeps its native hit");
  runtime.dispose();
});

test("Human Editor saves projectile and beam power without erasing on edit; contact stays outside system", async()=>{
 const root={querySelector:selector=>selector==="[data-skill-projectile-power]"?{value:"2"}:null};
 assert.deepEqual(readHumanProjectilePowerV1(root,"beam"),{power:2});
 assert.deepEqual(readHumanProjectilePowerV1(root,"projectile"),{power:2});
 assert.deepEqual(readHumanProjectilePowerV1(root,"contact"),{power:0});
 const markup=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
 assert.match(markup,/Collision entre projectiles et rayons/);
 assert.match(markup,/Puissance de collision \(projectile \/ rayon\)/);
});
