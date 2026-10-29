import test from "node:test";
import assert from "node:assert/strict";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createRosterSession} from "../../src/core/combat/roster-session.js";

const marker={id:"ronce-test",name:"Ronce",polarity:"detrimental",permanent:true,maxStacks:5};
const fx=[{kind:"force_reserve_switch",targetScope:"target"},{kind:"apply_marker",targetScope:"target",marker,charges:2}];
const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0});
const format={actors:[{actorId:"player",teamId:"heroes"},{actorId:"opponent",teamId:"enemies"}],
  teamOf(id){return this.actors.find(a=>a.actorId===id)?.teamId??null;}};
const forceSkill=(overrides={})=>normalizeSkillDefinition({id:"capture-vine",name:"Liane",
  category:"buff_debuff",form:"beam",element:"nature",approachMode:"none",
  energyCost:4,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:3000,
  allowedDistances:["medium"],targetRelations:["enemy"],targetLocations:["reserve"],
  effects:fx,effect:{damage:0,heal:0,interruptsPreparation:false,stunMs:0,tags:[]},...overrides});
function harness(){
  const configs=Object.fromEntries(["p0","p1","e0","e1","e2"].map(id=>[id,fighter(id)]));
  const session=createCombatSession({distance:"medium",battleFormat:format,
    fighters:[{...configs.p0,id:"player"},{...configs.e0,id:"opponent"}]});
  const team=(slotId,ids)=>({slotId,activeMemberId:ids[0],members:ids.map(id=>({
    id,creatureId:id,displayName:id,fighterConfigId:id
  }))});
  let cancelled=[];
  const roster=createRosterSession({combatSession:session,battleFormat:format,fighterConfigs:configs,
    recallCooldownMs:45000,
    cancelActiveActionForForcedSwitch(id){cancelled.push(id);},
    roster:{teams:{player:team("player",["p0","p1"]),opponent:team("opponent",["e0","e1","e2"])}}});
  const cast=(memberId,skill=forceSkill(),preview=false,teamId="opponent")=>
    roster.useSkillOnTarget({actorId:"player",targetRef:{scope:"reserve",teamId,memberId},skill,preview});
  const stacks=state=>state.statusEffects.find(e=>e.definition.id==="marker:ronce-test")?.stacks??0;
  return {session,roster,cast,stacks,cancelled};
}
test("RED: contract serializes force_reserve_switch, allows only enemy reserve target",()=>{
  assert.deepEqual(normalizeSkillEffectV1(fx[0]),fx[0]);
  assert.throws(()=>normalizeSkillEffectV1({kind:"force_reserve_switch",targetScope:"self"}),/target/i);
  assert.deepEqual(forceSkill().effects[0],fx[0]);
  assert.throws(()=>forceSkill({targetLocations:["active"]}),/reserve/i);
  assert.throws(()=>forceSkill({targetRelations:["ally"]}),/enemy/i);
});
test("RED: selecting enemy bench forces its live arrival and adds markers to arriving member",()=>{
  const h=harness();
  // Set old active HP before switching; restore exactly when it returns.
  h.session.replaceFighter("opponent",{...h.session.snapshot().fighters.opponent,initialHp:61});
  const result=h.cast("e2");
  assert.equal(result.ok,true);
  assert.equal(result.outcome,"forced_switched");
  assert.equal(result.teamId,"opponent");
  assert.equal(result.recalledMemberId,"e0");
  assert.equal(result.memberId,"e2");
  assert.deepEqual(h.cancelled,["opponent"]);
  assert.equal(h.roster.snapshot().opponent.activeMemberId,"e2");
  assert.equal(h.roster.snapshot().opponent.members.find(x=>x.id==="e0").hp,61);
  assert.equal(h.stacks(h.session.snapshot().fighters.opponent),2);
  assert.equal(h.session.snapshot().fighters.player.energy,16);
  assert.equal(h.session.snapshot().fighters.player.skillUseCounts["capture-vine"],1);
  assert.equal(Object.keys(h.session.snapshot().fighters).some(id=>id.startsWith("__reserve__")),false);
  const recalled=h.roster.switchMember("opponent","e0");
  assert.equal(recalled.ok,true,"forced swap must not trigger voluntary recall cooldown");
  assert.equal(h.session.snapshot().fighters.opponent.hp,61);
  assert.equal(h.stacks(h.roster.reserveMemberSnapshot("opponent","e2")),2);
});
test("RED: preview and invalid reserve targets are atomic, with no payment",()=>{
  const h=harness();
  assert.equal(h.cast("e1",forceSkill(),true).outcome,"ready");
  assert.equal(h.roster.snapshot().opponent.activeMemberId,"e0");
  assert.deepEqual(h.cancelled,[]);
  assert.equal(h.session.snapshot().fighters.player.energy,20);
  assert.equal(h.cast("p1",forceSkill(),false,"player").ok,false);
  assert.equal(h.session.snapshot().fighters.player.energy,20);
  const skill=forceSkill();
  assert.equal(h.cast("e1",skill).ok,true);
  const after=h.cast("e2",skill);
  assert.equal(after.ok,false);
  assert.equal(after.outcome,"cooldown");
  assert.equal(h.roster.snapshot().opponent.activeMemberId,"e1");
  assert.equal(h.session.snapshot().fighters.player.energy,16);
});
test("RED: replacing a KO reserve is prohibited and does not reset enemy active",()=>{
  const h=harness();
  const state=h.roster.useSkillOnTarget({actorId:"player",
    targetRef:{scope:"reserve",teamId:"opponent",memberId:"e1"},
    skill:normalizeSkillDefinition({...forceSkill(),id:"kill-reserve",energyCost:0,cooldownMs:0,
      effects:[{kind:"damage",targetScope:"target",amount:200,channel:"physical"}]})});
  assert.equal(state.ok,true);
  assert.equal(h.cast("e1").outcome,"reserve_ko");
  assert.equal(h.roster.snapshot().opponent.activeMemberId,"e0");
  assert.deepEqual(h.cancelled,[]);
});

test("editor authoring preserves force switch without inventing amount, target remains an enemy reserve",async()=>{
  const {buildHumanTacticalSkillEffectsV1,humanSkillTargetRelationsFromTacticalEffectsV1}=
    await import("../../src/ui/capture-editor-human-v2.js");
  const built=buildHumanTacticalSkillEffectsV1(fx);
  assert.deepEqual(built[0],fx[0]);
  assert.equal(built[1].marker.id,"ronce-test");
  assert.deepEqual(humanSkillTargetRelationsFromTacticalEffectsV1(built,{form:"beam"}),["enemy"]);
});
