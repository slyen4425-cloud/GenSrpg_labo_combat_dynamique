import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {normalizeBattleFormatDefinition} from "../../src/contracts/battle-format-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";

const original=JSON.parse(readFileSync(new URL("../../data/capture/showcase/cap_earth_atk_4.capture-skill-transfer-v1.json",import.meta.url),"utf8"));
const rock=normalizeSkillDefinition(original.draft.definition);
assert.equal(rock.id,"cap_earth_atk_4");
assert.equal(rock.name,"Impact rocheux");
assert.equal(rock.projectileTargeting,"fixed_point");
assert.equal(rock.dodgeable,true);
assert.equal(rock.effects[0].targetScope,"all_enemies");

const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:40,initialEnergy:40,energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const ids=["caster","ally","protected","other"];
const format=normalizeBattleFormatDefinition({id:"rockfall-2v2",localActorId:"caster",teams:{casters:["caster","ally"],defenders:["protected","other"]},
  actors:ids.map((actorId,i)=>({actorId,teamId:i<2?"casters":"defenders",creatureId:actorId,displayName:actorId,fighterConfigId:actorId,controllerId:i?"ai":"human-local"}))});
const session=()=>createCombatSession({fighters:ids.map(fighter),battleFormat:format});
function skill(id,{effects=[],damage=0,dodgeable=true}={}){
 return normalizeSkillDefinition({id,name:id,category:damage>0?"offensive":"buff_debuff",form:damage>0?"projectile":"self",
  element:null,approachMode:"none",energyCost:0,preparationMs:0,travelMs:100,recoveryMs:0,cooldownMs:0,dodgeable,
  allowedDistances:["short","medium","long"],targetRelations:damage>0?["enemy"]:["self"],
  effect:{damage,heal:0,stunMs:0,interruptsPreparation:false,tags:[]},effects});
}
const dodgeBuff=skill("foudroyante",{effects:[{kind:"apply_status",targetScope:"self",status:{
 id:"foudroyante",kind:"auto_dodge",polarity:"beneficial",durationMs:3000,stacking:"refresh"}}]});
const applyBuff=s=>{const x=s.useSkill({actorId:"protected",targetId:"protected",skill:dodgeBuff});assert.equal(x.outcome,"hit");};
const fall=(s,attack=rock)=>s.useSkill({actorId:"caster",targetId:"protected",skill:attack});

test("RED: real authored Impact rocheux (skyfall fixed_point + all_enemies) is auto-dodged individually",()=>{
 const s=session();applyBuff(s);
 const hit=fall(s);
 assert.equal(hit.ok,true);
 assert.equal(hit.outcome,"hit","attack still lands for other unprotected enemy");
 assert.equal(s.snapshot().fighters.protected.hp,100,"buff holder must evade 30 earth damage");
 assert.equal(s.snapshot().fighters.other.hp,70,"unprotected teammate must still take damage");
 assert.equal(s.snapshot().fighters.caster.hp,100);
 assert.equal(s.snapshot().fighters.ally.hp,100);
 assert.equal(hit.events.filter(x=>x.type==="hit"&&x.actorId==="protected"&&x.appliedDamage>0).length,0);
 assert.equal(hit.events.some(x=>x.type==="skill-target-evaded"&&x.actorId==="protected"&&x.evasionReason==="auto_dodge"),true);
});
test("RED: protected ally can be any of 2v2 victims; target selection does not grant global immunity",()=>{
 const s=session();
 const grant=s.useSkill({actorId:"other",targetId:"other",skill:dodgeBuff});
 assert.equal(grant.ok,true);
 fall(s);
 assert.equal(s.snapshot().fighters.protected.hp,70);
 assert.equal(s.snapshot().fighters.other.hp,100);
});
test("RED: undodgeable rockfall penetrates buff; expiring buff stops protecting exactly at deadline",()=>{
 const s=session();applyBuff(s);
 const undodgeable=normalizeSkillDefinition({...rock,dodgeable:false});
 const outcome=fall(s,undodgeable);
 assert.equal(outcome.outcome,"hit");assert.equal(s.snapshot().fighters.protected.hp,70);
 const s2=session();applyBuff(s2);s2.advanceMs(3000);
 fall(s2);
 assert.equal(s2.snapshot().fighters.protected.hp,70);
});
test("RED: harmful all_enemies status is also skipped per protected victim, while unprotected remains affected",()=>{
 const s=session();applyBuff(s);
 const stun={kind:"apply_status",targetScope:"all_enemies",status:{id:"rock-stun",kind:"stun",polarity:"detrimental",durationMs:1500,stacking:"refresh"}};
 const rockPlus=normalizeSkillDefinition({...rock,effects:[...rock.effects,stun]});
 const outcome=fall(s,rockPlus);
 assert.equal(outcome.ok,true);
 assert.equal(s.snapshot().fighters.protected.statusEffects.some(x=>x.definition.id==="rock-stun"),false);
 assert.equal(s.snapshot().fighters.other.statusEffects.some(x=>x.definition.id==="rock-stun"),true);
});
test("RED: successful personal evasion from multi-target skyfall emits native evaded event for other onEvent buffs",()=>{
 const s=session();
 s.useSkill({actorId:"caster",targetId:"protected",skill:skill("wound",{damage:25})});
 const healing=skill("evade-heal",{effects:[{kind:"apply_status",targetScope:"self",status:{id:"evade-heal",kind:"triggered_buff",polarity:"beneficial",durationMs:3000,stacking:"refresh",onEvent:{event:"evaded",effects:[{kind:"heal",targetScope:"self",amount:10}]}}}]});
 s.useSkill({actorId:"protected",targetId:"protected",skill:healing});
 applyBuff(s);
 const result=fall(s);
 assert.equal(s.snapshot().fighters.protected.hp,85,"75 from first strike plus 10 on evade");
 assert.equal(s.snapshot().fighters.other.hp,70);
 assert.equal(result.events.filter(x=>x.type==="heal"&&x.actorId==="protected").length,1);
});
test("RED: direct single-target attacks remain protected and healing/positive effects are not dodged",()=>{
 const s=session();applyBuff(s);
 const direct=skill("direct",{damage:20});
 const blocked=s.useSkill({actorId:"caster",targetId:"protected",skill:direct});
 assert.equal(blocked.outcome,"evaded");
 assert.equal(s.snapshot().fighters.protected.hp,100);
 const harmless=normalizeSkillDefinition({...rock,category:"heal",effects:[{kind:"heal",targetScope:"all_enemies",amount:5}]});
 assert.equal(fall(s,harmless).ok,true);
});
