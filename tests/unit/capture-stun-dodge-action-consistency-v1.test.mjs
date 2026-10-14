import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";

const authoredArc = normalizeSkillDefinition(JSON.parse(readFileSync(
  new URL("../../data/capture/showcase/lib_chain_lightning.capture-skill-transfer-v1.json",import.meta.url),"utf8"
)).draft.definition);
assert.equal(authoredArc.name,"Arc électrique");
assert.equal(authoredArc.effects.some(e=>e.kind==="apply_status"&&e.status.kind==="stun"),true);

const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:100,initialEnergy:100,
 energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
function skill(id,{prep=200,travel=6000,recovery=0,interruptible=true,form="contact",approach="ground"}={}){
 return normalizeSkillDefinition({id,name:id,category:"offensive",form,element:null,approachMode:approach,
 energyCost:0,preparationMs:prep,travelMs:travel,recoveryMs:recovery,cooldownMs:0,
 interruptibleDuringPreparation:interruptible,allowedDistances:["short","medium","long"],
 targetRelations:["enemy"],effect:{damage:25,heal:0,interruptsPreparation:false,stunMs:0,tags:[]}});
}
function harness(){
 let clock=0,tick=()=>{},interrupts=[],resolutions=[];
 const session=createCombatSession({fighters:["victim","caster"].map(fighter)});
 const runtime=createCombatRuntime({session,now:()=>clock,setTimer:fn=>(tick=fn,1),clearTimer:()=>{},
   onInterrupted:x=>interrupts.push(x),onResolved:x=>resolutions.push(x)});
 runtime.start();
 return {session,runtime,interrupts,resolutions,step(ms){clock=ms;tick()},dispose(){runtime.dispose()}};
}
const dodge={actorId:"victim",recharge:{actionId:"capture-game-dodge",maxCharges:2,rechargeMs:30000},activeWindowMs:250};

test("RED: authentic Arc électrique stun interrupts even an uninterruptible preparation",()=>{
 const h=harness();
 assert.equal(h.runtime.startSkill({actorId:"victim",targetId:"caster",skill:skill("long-charge",{prep:4500,interruptible:false})}).ok,true);
 assert.equal(h.runtime.startSkill({actorId:"caster",targetId:"victim",skill:authoredArc}).ok,true);
 h.step(1600);
 assert.equal(h.session.snapshot().fighters.victim.statusEffects.some(x=>x.definition.kind==="stun"),true);
 assert.equal(h.runtime.hasActiveActionFor("victim"),false);
 assert.equal(h.interrupts.filter(x=>x.action?.actorId==="victim"&&x.reason==="stun").length,1);
 h.step(9000);assert.equal(h.session.snapshot().fighters.caster.hp,100);
 h.dispose();
});
test("RED: authentic Arc stun cancels active post-release melee approach rather than allowing a late hit",()=>{
 const h=harness();
 h.runtime.startSkill({actorId:"victim",targetId:"caster",skill:skill("charging-attack",{prep:150,travel:7000})});
 h.runtime.startSkill({actorId:"caster",targetId:"victim",skill:authoredArc});
 h.step(1600);
 assert.equal(h.runtime.hasActiveActionFor("victim"),false);
 assert.equal(h.interrupts.filter(x=>x.action?.actorId==="victim"&&x.reason==="stun").length,1);
 h.step(9000);
 assert.equal(h.session.snapshot().fighters.caster.hp,100,"cancelled attack must never land");
 h.dispose();
});
test("RED: an ordinary dodge is not activated mid-attack and never spends charges",()=>{
 const h=harness();
 h.runtime.startSkill({actorId:"victim",targetId:"caster",skill:skill("long-attack",{prep:500,travel:2000,recovery:500})});
 const chargeCount=()=>h.runtime.rechargeableActionAvailability({actorId:dodge.actorId,...dodge.recharge}).charges;
 assert.equal(chargeCount(),2);
 for(const t of [0,650,2650]){
   h.step(t);
   const x=h.runtime.activateRechargeableReaction(null,dodge);
   assert.equal(x.ok,false,"dodge must be rejected during own prep/travel/recovery at "+t);
   assert.match(x.outcome,/action_in_progress|recovering/);
   assert.equal(chargeCount(),2,"rejected dodge must never burn a charge");
 }
 h.step(3300);
 const ok=h.runtime.activateRechargeableReaction(null,dodge);
 assert.equal(ok.ok,true,"dodge should work after recovery");
 assert.equal(chargeCount(),1);
 h.dispose();
});
test("RED: UI's dodge availability shares lockedByAction with the action bar",()=>{
 const ui=readFileSync(new URL("../../src/ui/combat-2v2-test-ui.js",import.meta.url),"utf8");
 assert.match(ui,/dodgeButton\.disabled\s*=\s*\n?\s*!localAlive\s*\|\|\s*lockedByAction/);
});
