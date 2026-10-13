import test from "node:test";
import assert from "node:assert/strict";
import { normalizeStatusEffectV1 } from "../../src/contracts/status-effect-v1.js";
import { normalizeSkillEffectV1 } from "../../src/contracts/skill-effect-v1.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatState } from "../../src/core/combat/combat-state.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { applyStatusEffectV1 } from "../../src/core/combat/status-effect-runtime-v1.js";
import { applyCombatDamageV1, applyCombatContactRetaliationV1 } from "../../src/core/combat/combat-damage-application-v1.js";
const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,
  energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const state=(ids=["attacker","defender"])=>createCombatState({fighters:ids.map(fighter)});
const reflect=(x={})=>normalizeStatusEffectV1({id:"thorns",kind:"damage_reflection",
 polarity:"beneficial",durationMs:8000,stacking:"refresh",percent:50,...x});
const add=(s,def=reflect(),id="defender")=>applyStatusEffectV1({
 state:s,status:def,sourceActorId:id,targetActorId:id});
const damage=(s,incomingKind="contact",amount=20)=>applyCombatDamageV1({
 state:s,sourceActorId:"attacker",targetActorId:"defender",damage:amount,incomingKind});
const ability=(form,amount)=>normalizeSkillDefinition({
 id:"test-"+form,name:"test-"+form,category:"offensive",form,approachMode:"none",
 element:"physical",energyCost:0,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
 allowedDistances:["short","medium","long"],targetRelations:["enemy"],
 effect:{damage:amount,heal:0,tags:[]}
});
const zone=(damageTrigger)=>normalizeSkillEffectV1({
 kind:"persistent_zone",targetScope:"all_enemies",zoneId:"spike-aura",radius:"short",
 durationMs:4000,tickIntervalMs:500,reactivation:"refresh",maxActivations:1,
 radiusGrowthSteps:0, ...(damageTrigger?{damageTrigger}:{}),
 tickEffect:{kind:"damage",targetScope:"target",amount:7,channel:"physical"}
});

test("selective reflection schema is optional, strict and preserves old defaults",()=>{
 assert.equal(reflect().incomingKinds,undefined);
 const s=reflect({incomingKinds:["contact","projectile"],contactDamage:8});
 assert.deepEqual(s.incomingKinds,["contact","projectile"]);
 assert.equal(s.contactDamage,8);
 assert.throws(()=>reflect({incomingKinds:["banana"]}),/incomingKinds|kind/i);
 assert.throws(()=>reflect({incomingKinds:[]}),/incomingKinds/i);
 assert.throws(()=>reflect({contactDamage:-2}),/contactDamage/i);
 assert.throws(()=>normalizeStatusEffectV1({
   id:"not-reflect",kind:"stun",polarity:"detrimental",
   durationMs:1000,stacking:"refresh",incomingKinds:["contact"]
 }),/unknown|field/i);
});
test("legacy reflect still responds to all damage categories and only HP lost",()=>{
 for(const source of ["contact","projectile","beam","area","zone","dot","scheduled"]){
   const r=damage(add(state()),source,20);
   assert.equal(r.state.fighters.attacker.hp,90,source);
   assert.equal(r.state.fighters.defender.hp,80,source);
 }
});
test("reflect only projectiles and beams or only melee, without double reaction",()=>{
 let x=add(state(),reflect({incomingKinds:["projectile","beam"]}));
 x=damage(x,"contact").state;
 assert.equal(x.fighters.attacker.hp,100);
 x=damage(x,"projectile").state;
 assert.equal(x.fighters.attacker.hp,90);
 x=damage(x,"zone").state;
 assert.equal(x.fighters.attacker.hp,90);
 const y=damage(add(state(),reflect({incomingKinds:["contact"]})),"contact");
 assert.equal(y.state.fighters.attacker.hp,90);
});
test("contact thorns deal fixed damage even without defender HP loss, respecting attacker immunity",()=>{
 const thorns=reflect({percent:0,contactDamage:14,incomingKinds:["contact"]});
 let x=add(state(),thorns);
 const shield=normalizeStatusEffectV1({id:"shield",kind:"shield",polarity:"beneficial",
 durationMs:8000,stacking:"replace",amount:50});
 x=add(x,shield);
 const incoming=damage(x,"contact",20);
 assert.equal(incoming.state.fighters.defender.hp,100);
 const retaliation=applyCombatContactRetaliationV1({state:incoming.state,
   attackerId:"attacker",defenderId:"defender",atMs:incoming.state.elapsedMs});
 assert.equal(retaliation.state.fighters.attacker.hp,86);
 assert.equal(retaliation.appliedDamage,14);
 const projectile=applyCombatContactRetaliationV1({state:retaliation.state,
   attackerId:"attacker",defenderId:"defender",incomingKind:"projectile"});
 assert.equal(projectile.appliedDamage,0);
 const immune=normalizeStatusEffectV1({id:"immune",kind:"immunity",polarity:"beneficial",
   durationMs:8000,stacking:"replace",domains:["damage"]});
 let z=add(state(),thorns);z=add(z,immune,"attacker");
 z=applyCombatContactRetaliationV1({state:z,attackerId:"attacker",defenderId:"defender"}).state;
 assert.equal(z.fighters.attacker.hp,100);
});
test("real skill contact hit triggers thorns, projectile cannot; 2v2 allies untouched",()=>{
 const session=createCombatSession({distance:"short",fighters:["attacker","defender","ally","foe"].map(fighter)});
 const armour=normalizeSkillDefinition({
  id:"armour",name:"Armour",category:"buff_debuff",form:"self",approachMode:"none",
  energyCost:0,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
  allowedDistances:["short","medium","long"],targetRelations:["self"],effect:{damage:0,heal:0,tags:[]},
  effects:[{kind:"apply_status",targetScope:"self",status:reflect({percent:0,contactDamage:12,incomingKinds:["contact"]})}]
 });
 assert.equal(session.useSkill({actorId:"defender",targetId:"defender",skill:armour}).ok,true);
 assert.equal(session.useSkill({actorId:"attacker",targetId:"defender",skill:ability("contact",0)}).ok,true);
 assert.equal(session.snapshot().fighters.attacker.hp,88);
 assert.equal(session.snapshot().fighters.ally.hp,100);
 assert.equal(session.snapshot().fighters.foe.hp,100);
 assert.equal(session.useSkill({actorId:"attacker",targetId:"defender",skill:ability("projectile",0)}).ok,true);
 assert.equal(session.snapshot().fighters.attacker.hp,88);
});
test("zone entry-only contract is specific to damaging zones and does not rewrite old ones",()=>{
 assert.equal(zone().damageTrigger,undefined);
 assert.equal(zone("entry_only").damageTrigger,"entry_only");
 assert.throws(()=>zone("invalid"),/damageTrigger/i);
 assert.throws(()=>normalizeSkillEffectV1({...zone("entry_only"),tickEffect:{
  kind:"apply_status",targetScope:"target",status:{id:"buff",kind:"stun",polarity:"detrimental",
  durationMs:1000,stacking:"refresh"}
 }}),/damageTrigger|zone/i);
});
