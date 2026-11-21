import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {normalizeBattleFormatDefinition} from "../../src/contracts/battle-format-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {isCopyableReceivedSkillV1,projectNativeSkillEchoV1}
  from "../../src/core/combat/skill-echo-v1.js";

const echo=normalizeSkillDefinition(JSON.parse(readFileSync(
  "data/capture/showcase/raiiven-remanence-interdite.capture-skill-transfer-v1.json","utf8")).draft.definition);
const fighter=id=>({id,maxHp:200,initialHp:200,maxEnergy:50,initialEnergy:50,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const format=normalizeBattleFormatDefinition({
  id:"raiiven-real-reception-v1",localActorId:"raiiven",
  teams:{players:["raiiven"],enemies:["enemy"]},
  actors:["raiiven","enemy"].map(id=>({actorId:id,creatureId:id,
    displayName:id,fighterConfigId:id,teamId:id==="raiiven"?"players":"enemies",
    controllerId:id==="raiiven"?"human-local":"ai-enemy"}))
});
const session=()=>createCombatSession({
  battleFormat:format,distance:"short",fighters:[fighter("raiiven"),fighter("enemy")]});
const fireball=(changes={})=>normalizeSkillDefinition({
  id:"fireball",name:"Boule de feu",category:"offensive",form:"projectile",
  loadoutSlot:"standard",element:"fire",approachMode:"none",energyCost:0,
  preparationMs:500,travelMs:650,recoveryMs:300,cooldownMs:0,dodgeable:true,
  allowedDistances:["short","medium","long"],targetRelations:["enemy"],
  effect:{damage:20,heal:0,interruptsPreparation:false,stunMs:0,tags:[]},
  ...changes
});

test("A real received fireball arms ONLY Raiiven's slot 4, with identical projectile geometry and shadow damage",()=>{
  const battle=session();
  assert.equal(battle.inspectMemorizedEcho({actorId:"raiiven"}),null);
  assert.equal(battle.useSkill({actorId:"raiiven",targetId:"enemy",skill:echo}).outcome,"no_copy_source");
  const attack=fireball();
  assert.equal(battle.useSkill({actorId:"enemy",targetId:"raiiven",skill:attack}).ok,true);
  assert.equal(battle.inspectMemorizedEcho({actorId:"raiiven"}).skill.id,"fireball");
  assert.equal(battle.inspectMemorizedEcho({actorId:"enemy"}),null);
  const projected=battle.inspectEchoSource({actorId:"raiiven",targetId:"enemy",skill:echo});
  assert.equal(projected.ok,true);
  assert.equal(projected.skill.name,"Boule de feu");
  assert.equal(projected.skill.id,echo.id,"slot 4 owns ONE energy/cooldown ledger");
  assert.equal(projected.skill.echoSourceSkillId,"fireball");
  assert.equal(projected.skill.form,"projectile");
  assert.equal(projected.skill.preparationMs,500);
  assert.equal(projected.skill.travelMs,650);
  assert.equal(projected.skill.recoveryMs,300);
  assert.equal(projected.skill.effect.damage,20);
  assert.equal(projected.skill.element,"shadow");
  assert.deepEqual(projected.skill.allowedDistances,attack.allowedDistances);
  assert.equal(projected.skill.cooldownMs,echo.cooldownMs);
  const playerHp=battle.snapshot().fighters.raiiven.hp;
  assert.equal(playerHp,180);
  const copy=battle.useSkill({actorId:"raiiven",targetId:"enemy",skill:echo});
  assert.equal(copy.ok,true);
  assert.equal(copy.echoSourceSkillId,"fireball");
  assert.equal(battle.snapshot().fighters.enemy.hp,180);
  assert.equal(battle.inspectMemorizedEcho({actorId:"raiiven"}),null,"one use, no stale icon");
});

test("Rejected/unreceived actions and forbidden ultimates, aerial flight, siphons, author-disabled skills never replace a valid memory",()=>{
  const b=session();const original=fireball();
  assert.equal(b.useSkill({actorId:"enemy",targetId:"raiiven",skill:original}).ok,true);
  const previous=b.inspectMemorizedEcho({actorId:"raiiven"}).skill;
  for(const changes of [
    {id:"ultimate",loadoutSlot:"ultimate"},
    {id:"aerial-flight",approachMode:"aerial"},
    {id:"forbidden-by-editor",echoCopyable:false}
  ]){
    const variant=fireball(changes);
    assert.equal(isCopyableReceivedSkillV1(variant),false);
    // The battle can still use this original skill; only memory rejects it.
    const result=b.useSkill({actorId:"enemy",targetId:"raiiven",skill:variant});
    assert.equal(result.ok,true);
    assert.equal(b.inspectMemorizedEcho({actorId:"raiiven"}).skill.id,previous.id);
  }
  assert.equal(isCopyableReceivedSkillV1({
    ...original,evasionSiphon:{stealCharges:1}
  }),false);
  assert.equal(isCopyableReceivedSkillV1({
    ...original,effects:[{kind:"energy_drain",amount:5}]
  }),false);
  assert.equal(isCopyableReceivedSkillV1({
    ...original,effects:[{kind:"summon_entity",entityKind:"barrier"}]
  }),false);
  assert.equal(isCopyableReceivedSkillV1({...original,approachMode:"burrow"}),false);
  assert.equal(isCopyableReceivedSkillV1({...original,approachMode:"teleport"}),false);
  assert.equal(b.inspectMemorizedEcho({actorId:"raiiven"}).skill.id,"fireball");
});

test("A cast that misses, a decoy hit and an allied/self cast cannot arm the memory",()=>{
 const b=session();
 const own=normalizeSkillDefinition({id:"enemy-buff",name:"Buff ennemi",
  category:"defensive",form:"self",element:"light",energyCost:0,
  allowedDistances:["short","medium","long"],targetRelations:["self"],
  effect:{damage:0,heal:0,stunMs:0,interruptsPreparation:false,tags:[]}});
 assert.equal(b.useSkill({actorId:"enemy",targetId:"enemy",skill:own}).ok,true);
 assert.equal(b.inspectMemorizedEcho({actorId:"raiiven"}),null);
});

test("A friendly explicit uncopyable flag and echo-copy exclusions survive canonical skill normalization",()=>{
 const v=fireball({echoCopyable:false});
 assert.equal(v.echoCopyable,false);
 assert.notEqual(normalizeSkillDefinition(fireball()).echoCopyable,false,
   "default-allowed is implicit to keep legacy JSON byte-for-byte compatible");
 assert.equal(projectNativeSkillEchoV1({
   echoSkill:echo,sourceSkill:v,actorId:"raiiven",targetId:"enemy"
 }).outcome,"copy_source_forbidden");
});
