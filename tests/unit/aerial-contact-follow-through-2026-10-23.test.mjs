import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeVisualActor } from "../../src/contracts/visual-actor.js";
import { normalizeCombatVisualEvent } from "../../src/contracts/combat-visual-event.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { planAnimation } from "../../src/core/animation/plan-animation.js";
import { createDomActorRenderer } from "../../src/adapters/renderer/dom-actor-renderer.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";

const profile = JSON.parse(readFileSync(new URL("../../data/profiles/flying.profile.json", import.meta.url), "utf8"));
const skill = normalizeSkillDefinition(JSON.parse(readFileSync(new URL(
  "../../data/combat/skills/aerial-dive.skill.json", import.meta.url), "utf8")));

function fighter(id) {
  return {id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,
    energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,
    chargeTimeModifierPct:0};
}
function flightPlan(actor) {
  return planAnimation({
    actor, profile, event: normalizeCombatVisualEvent({
      type:"aerial-attack",actorId:actor.id,targetId:"opponent",
      metadata:{targetTranslateX:220,targetTranslateY:24,travelMs:skill.travelMs,
        arenaHeight:420,arenaExitTranslateY:-370}
    })
  });
}
function deferred() {
  let resolve, reject;
  const promise=new Promise((a,b)=>{resolve=a;reject=b});
  return {promise,resolve,reject};
}

test("true aerial contact damages exactly once without interrupting the original full WAAPI dive and return", async () => {
  const actor=normalizeVisualActor({id:"player",creatureId:"flying-test",profile:"flying",
    asset:"test.webp",view:"player",position:{x:0,y:0},scale:1});
  const body={style:{}}, shadow={style:{}}, calls=[];
  const renderer=createDomActorRenderer({
    element:body,shadowElement:shadow,actor,
    animate(target,keyframes,options) {
      const done=deferred();
      const handle={finished:done.promise,ready:Promise.resolve(),startTime:1,
        cancelled:false,cancel(){this.cancelled=true;const e=new Error("cancelled");e.name="AbortError";done.reject(e)}};
      calls.push({target,keyframes,options,handle,done});
      return handle;
    }
  });
  const plan=flightPlan(actor);
  const visual=renderer.play(plan);
  assert.equal(calls.length,2,"one native body and one native shadow timeline");

  const session=createCombatSession({distance:"medium",
    fighters:[fighter("player"),fighter("opponent")]});
  let now=0, nextTimer=0;
  const resolutions=[];
  const runtime=createCombatRuntime({session,now:()=>now,
    setTimer:()=>++nextTimer,clearTimer:()=>{},
    onResolved:resolution=>resolutions.push(resolution)});
  try {
    assert.equal(runtime.startSkill({actorId:"player",targetId:"opponent",skill}).ok,true);
    now=skill.preparationMs+Math.floor(skill.travelMs*.6);
    const first=runtime.reportActionContact({actorId:"player",targetId:"opponent",skillId:skill.id});
    assert.equal(first.ok,true);
    assert.equal(first.outcome,"contact_resolved");
    assert.equal(resolutions.length,1);
    assert.equal(resolutions[0].outcome,"hit");
    assert.equal(session.snapshot().fighters.opponent.hp,78);
    assert.equal(renderer.hasActiveAnimation,true,"contact cannot end the full dive");
    assert.equal(calls.length,2,"no contact-triggered return animation or replacement timeline");
    assert.equal(calls.some(c=>c.handle.cancelled),false);
    const repeated=runtime.reportActionContact({actorId:"player",targetId:"opponent",skillId:skill.id});
    assert.equal(repeated.ok,false);
    assert.equal(resolutions.length,1,"no duplicate damages after model continues through target");
    assert.equal(session.snapshot().fighters.opponent.hp,78);
    assert.ok(plan.segments[1].transform.translateX>220,"dive carries beyond enemy camp anchor");
    calls.forEach(c=>c.done.resolve());
    const end=await visual.finished;
    assert.equal(end.status,"finished");
    assert.equal(renderer.hasActiveAnimation,false);
    assert.equal(plan.segments.at(-1).transform.translateX,0);
    assert.equal(plan.segments.at(-1).transform.translateY,0);
  } finally {
    runtime.dispose();
    renderer.dispose();
  }
});

test("flight follow-through is profile driven and never alters ground or teleport paths",()=>{
  const actor=normalizeVisualActor({id:"player",creatureId:"flight-test",profile:"flying",
    asset:"test.webp",view:"player",scale:1});
  const flight=flightPlan(actor);
  const ratio=profile.specialMoves.aerial.followThroughRatio;
  assert.ok(ratio>0 && ratio<=.8);
  assert.deepEqual(flight.segments.map(s=>s.label),
    ["aerial-arc-apex","aerial-arc-impact","aerial-home"]);
  assert.equal(flight.segments[0].transform.translateX,0);
  assert.equal(flight.segments[1].transform.translateX,220*(1+ratio));
  assert.equal(flight.segments[1].ground.translateX,220*(1+ratio));
  assert.equal(flight.segments[0].durationMs+flight.segments[1].durationMs,skill.travelMs);
  assert.equal(flight.segments.at(-1).durationMs,profile.specialMoves.aerial.returnMs);
  assert.equal(flight.restoreBaseState,true);
  for(const wrong of [-0.01,.81,Infinity]){
    const p={...profile,specialMoves:{...profile.specialMoves,
      aerial:{...profile.specialMoves.aerial,followThroughRatio:wrong}}};
    assert.throws(()=>planAnimation({actor,profile:p,event:normalizeCombatVisualEvent({
      type:"aerial-attack",actorId:actor.id,
      metadata:{targetTranslateX:220,targetTranslateY:24,travelMs:850,
        arenaHeight:420,arenaExitTranslateY:-370}
    })}),/followThroughRatio/);
  }
});

test("real Demo UI sends the first aerial silhouette contact to Runtime without stopping the outbound plan",()=>{
  const source=readFileSync(new URL("../../src/ui/demo-app.js",import.meta.url),"utf8");
  const begin=source.indexOf("function playApproachFor(");
  const watcher=source.indexOf("watchVisibleModelContact({",begin);
  const aerial=source.indexOf('if (approachMode === "aerial") {',watcher);
  const ground=source.indexOf("contactStoppedOutbound = true;",watcher);
  assert.ok(begin>=0 && watcher>begin && aerial>watcher && ground>aerial);
  const branch=source.slice(aerial,ground);
  assert.match(branch,/onContact\(\);\s*return;/);
  assert.doesNotMatch(branch,/returnActiveToBaseFromCurrent|cueSchedule\.clear/);
  assert.match(source.slice(ground,ground+1000),/returnActiveToBaseFromCurrent/,
    "ground contact and hold keep their existing early-return authority");
});
