import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { adaptCaptureSkillToSkillDefinition } from "../../src/adapters/input/capture/capture-skill-to-skill-definition.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { planSkillOutcomeFx } from "../../src/core/fx/skill-fx-plan.js";

function author(id) {
 const raw=readFileSync(new URL("../../data/capture/showcase/"+id+".capture-skill-transfer-v1.json",import.meta.url),"utf8");
 return importCaptureTransferJsonV1(raw).value.draft;
}
const fireballDraft=author("fireball");
const aerialDraft=author("cap_air_atk_3");
const fireball=adaptCaptureSkillToSkillDefinition({id:fireballDraft.id,definition:fireballDraft.definition},fireballDraft.presentation);
const aerial=adaptCaptureSkillToSkillDefinition({id:aerialDraft.id,definition:aerialDraft.definition},aerialDraft.presentation);
const ground=normalizeSkillDefinition({...aerialDraft.definition,id:"ground-movement-sentinel",name:"Ground movement",approachMode:"ground",effects:[],effect:{damage:0,heal:0,tags:[]},form:"contact",energyCost:1});
const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:100,initialEnergy:100,energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
function harness(){
 let now=0;let queue=[];let nextId=1;
 const clock={now:()=>now,setTimer(callback,delayMs){const id=nextId++;queue.push({id,callback,due:now+delayMs});return id},clearTimer(id){queue=queue.filter(x=>x.id!==id)},
  advanceTo(t){if(t<now)throw Error("clock reversed");let safety=0;while(queue.some(x=>x.due<=t)){if(++safety>80)throw Error("timer loop");queue.sort((a,b)=>a.due-b.due||a.id-b.id);const item=queue.shift();now=item.due;item.callback()}now=t}};
 const session=createCombatSession({fighters:[fighter("player"),fighter("opponent")]});
 const resolutions=[];
 const runtime=createCombatRuntime({session,now:clock.now,setTimer:clock.setTimer,clearTimer:clock.clearTimer,onResolved:x=>resolutions.push(x)});
 runtime.start();
 return {clock,session,runtime,resolutions};
}
function run({targetMotion=null,attack=fireball}={}){
 const h=harness();
 try{
  // Fireball is already travelling before the target's movement begins.
  assert.equal(h.runtime.startSkill({actorId:"opponent",targetId:"player",skill:attack}).ok,true);
  if(targetMotion)assert.equal(h.runtime.startSkill({actorId:"player",targetId:"opponent",skill:targetMotion}).ok,true);
  h.clock.advanceTo(3800);
  const result=h.resolutions.find(x=>x.skillId===attack.id);
  assert.ok(result,"real CombatRuntime should resolve the authored projectile");
  return {result,hp:h.session.snapshot().fighters.player.hp};
 } finally {h.runtime.dispose()}
}
test("Boule de feu auteur is a direct projectile restricted to surface; other authored media remain unchanged",()=>{
 assert.equal(fireball.projectileTargeting,"direct");
 assert.deepEqual(fireball.hitPresenceStates,["surface"]);
 assert.equal(fireball.element,"fire");
 assert.equal(fireballDraft.definition.effects[0].amount,25);
 assert.equal(fireballDraft.presentation.visual.cast.anchor,"mouth");
 assert.equal(fireballDraft.presentation.visual.cast.offsetX,30);
 assert.equal(fireballDraft.presentation.visual.travel.displayScale,2.5);
 assert.equal(fireballDraft.presentation.visual.impact.assetId,"pack:capture:sprite-fireball-2-impact-01");
 assert.equal(aerial.approachMode,"aerial");
 assert.deepEqual(aerial.evasion,{window:null,incomingForms:[]},"author aerial movement has no explicit evasion; presence rule must protect it");
});
test("authored direct fireball misses creature during actual aerial travel without explicit evasion",()=>{
 const {result,hp}=run({targetMotion:aerial});
 assert.equal(result.outcome,"evaded");
 assert.equal(result.evasionReason,"presence");
 assert.equal(result.targetPresence,"airborne");
 assert.equal(hp,100,"fireball must not damage airborne creature");
 assert.equal(result.events.some(x=>x.type==="hit"),false);
 const fx=planSkillOutcomeFx({resolution:result,actorSlot:"opponent",targetSlot:"player"});
 assert.ok(fx.some(x=>x.type==="miss"));
 assert.ok(!fx.some(x=>x.type==="impact"),"no hit impact FX on airborne creature");
});
test("authored direct fireball still hits moving ground target and stationary target",()=>{
 for(const targetMotion of [ground,null]){
  const {result,hp}=run({targetMotion});
  assert.equal(result.outcome,"hit",String(targetMotion?.id??"stationary"));
  assert.ok(hp<100,"ground target still takes damage");
 }
});
test("explicit anti-air coverage can hit a creature currently airborne",()=>{
 const antiAir=normalizeSkillDefinition({...fireball, id:"anti-air-author-sentinel",name:"Anti-air Sentinel",hitPresenceStates:["surface","airborne"]});
 const {result,hp}=run({targetMotion:aerial,attack:antiAir});
 assert.equal(result.outcome,"hit");
 assert.equal(result.targetPresence,"airborne");
 assert.ok(hp<100);
});
