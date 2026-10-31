import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";
const data=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const skill=()=>normalizeSkillDefinition({
  ...data("data/combat/skills/fireball.skill.json"),id:"charge-release-window",name:"Orbe active",
  preparationMs:100,travelMs:300,recoveryMs:0,cooldownMs:1000,
  effect:{damage:0,heal:0,stunMs:0,interruptsPreparation:false,tags:[]},effects:[],
  chargedAttack:{baseDamage:5,bonusDamagePerCharge:5,maxCharges:4,reactivationWindowMs:500,sizeIncreasePct:10}
});
function clock(){let t=0;let queue=[];let id=0;return {now:()=>t,
  advance(ms){t+=ms;for(const task of [...queue]){queue=queue.filter(x=>x!==task);task.callback();}},
  setTimer(callback,delay){const x={id:++id,callback};queue.push(x);return x.id;},
  clearTimer(key){queue=queue.filter(x=>x.id!==key);}
};}
function setup(){
  const c=clock(),released=[],resolved=[];
  const session=createCombatSession({distance:"medium",fighters:[
    {...data("data/combat/fighters/maraileron.combat.json"),initialEnergy:10,initialHp:100,energyChargeIntervalMs:1000000},
    {...data("data/combat/fighters/braisombre.combat.json"),initialEnergy:10,initialHp:100}
  ]});
  const runtime=createCombatRuntime({session,now:c.now,setTimer:c.setTimer,clearTimer:c.clearTimer,
    onRelease:e=>released.push(e),onResolved:e=>resolved.push(e)});
  runtime.start();
  return {c,session,runtime,released,resolved};
}
test("short preparation can be shorter than charge gap: independently valid",()=>{
  assert.equal(skill().preparationMs,100);
  assert.equal(skill().chargedAttack.reactivationWindowMs,500);
  assert.match(describeCaptureSkillV1(skill()).sentences.join(" "),/fenêtre|recharge|dernière|activation/i);
});
test("the projectile waits for each new tap instead of firing at initial preparation deadline",()=>{
  const {c,session,runtime,released,resolved}=setup(),s=skill();
  const first=runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:s});
  assert.equal(first.outcome,"started");
  assert.equal(runtime.activeActionFor("maraileron").releaseAtMs,600);
  const energy=session.snapshot().fighters.maraileron.energy;
  c.advance(200);
  assert.equal(released.length,0,"original 100ms preparation must not fire while charge window open");
  assert.equal(runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:s}).chargeCount,2);
  assert.equal(runtime.activeActionFor("maraileron").releaseAtMs,800);
  c.advance(400);
  assert.equal(runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:s}).chargeCount,3);
  assert.equal(runtime.activeActionFor("maraileron").releaseAtMs,1200);
  c.advance(599);assert.equal(released.length,0);
  c.advance(1);assert.equal(released.length,1);
  assert.equal(released[0].action.chargeState.damage,15);
  assert.equal(released[0].action.chargeState.sizeMultiplier,1.2);
  assert.equal(released[0].action.impactAtMs,1500);
  assert.equal(session.snapshot().fighters.maraileron.energy,energy-2,"each reinforcement is paid");
  c.advance(300);assert.equal(resolved.length,1);
  runtime.dispose();
});
test("max charges releases as soon as preparation is satisfied, and no taps never hang",()=>{
  const {c,runtime,released}=setup(),s=normalizeSkillDefinition({...skill(),chargedAttack:{...skill().chargedAttack,maxCharges:2}});
  runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:s});
  c.advance(200);
  const result=runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:s});
  assert.equal(result.chargeCount,2);
  assert.equal(released.length,0,"maximum charge must complete its cast stage");
  c.advance(100);
  assert.equal(released.length,1);
  assert.equal(released[0].action.releaseAtMs,300);
  runtime.dispose();
  const once=setup();
  once.runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:s});
  once.c.advance(600);
  assert.equal(once.released.length,1,"uncharged base fires after window expiry");
  once.runtime.dispose();
});
test("author never forces preparation up to reactivation window",()=>{
  const source=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  assert.doesNotMatch(source,/Number\(preparation\.value\)<Number\(windowMs\.value\)/);
});
