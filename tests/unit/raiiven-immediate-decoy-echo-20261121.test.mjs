import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {normalizeBattleFormatDefinition} from "../../src/contracts/battle-format-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {reselectPrelockedDecoyV1} from "../../src/core/combat/decoy-hit-v1.js";
import {createBattleActorAiController} from "../../src/core/combat/battle-actor-ai-controller.js";

const skill=id=>normalizeSkillDefinition(JSON.parse(readFileSync(
  new URL("../../data/capture/showcase/"+id+".capture-skill-transfer-v1.json",import.meta.url),
  "utf8")).draft.definition);
const fighter=id=>({id,maxHp:160,initialHp:160,maxEnergy:30,initialEnergy:30,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,
  chargeTimeModifierPct:0});
const format=normalizeBattleFormatDefinition({
  id:"raiiven-immediate-decoy-echo-test",localActorId:"raiiven",
  teams:{players:["raiiven"],enemies:["enemy"]},
  actors:["raiiven","enemy"].map(id=>({actorId:id,creatureId:id,displayName:id,
    fighterConfigId:id,teamId:id==="raiiven"?"players":"enemies",
    controllerId:id==="raiiven"?"human-local":"ai-enemy"}))
});
const session=()=>createCombatSession({battleFormat:format,distance:"short",
  fighters:[fighter("raiiven"),fighter("enemy")]});
const decoyStatuses=state=>state.fighters.raiiven.statusEffects
  .filter(x=>x.definition.kind==="decoy");

test("Dédale creates its TWO genuine decoys immediately on activation (no five-second delay)",()=>{
  const spell=skill("raiiven-dedale-silhouettes");
  assert.equal(spell.preparationMs,0);
  const battle=session();
  assert.equal(decoyStatuses(battle.snapshot()).length,0);
  assert.equal(battle.useSkill({actorId:"raiiven",targetId:"raiiven",skill:spell}).ok,true);
  assert.equal(battle.snapshot().elapsedMs,0);
  assert.equal(decoyStatuses(battle.snapshot()).length,2);
});

test("A direct strike locked before Dédale is reselected among all three silhouettes",()=>{
  const battle=session();
  const shot=normalizeSkillDefinition({id:"prelocked-shot",name:"Tir en route",
    category:"offensive",form:"projectile",element:"fire",
    energyCost:0,preparationMs:0,travelMs:1000,recoveryMs:0,cooldownMs:0,
    allowedDistances:["short","medium","long"],targetRelations:["enemy"],
    effect:{damage:20,heal:0,interruptsPreparation:false,stunMs:0,tags:[]}});
  const locked=battle.startSkill({actorId:"enemy",targetId:"raiiven",skill:shot});
  assert.equal(locked.ok,true);
  assert.deepEqual(locked.action.targetDecoyIdsAtStart,[]);
  assert.equal(battle.useSkill({actorId:"raiiven",targetId:"raiiven",
    skill:skill("raiiven-dedale-silhouettes")}).ok,true);
  const possible=[0,1,2].map(serial=>reselectPrelockedDecoyV1({
    state:battle.snapshot(),action:{...locked.action,targetingSequence:serial}
  }));
  assert.deepEqual(new Set(possible.map(x=>x.decoyId)),
    new Set(["raiiven-decoy-left","raiiven-decoy-right",null]),
    "a prelocked attacker has no guaranteed knowledge of which horse is real");
  const wrong=possible.findIndex(x=>x.decoyId!==null);
  const resolution=battle.completeSkill({action:{...locked.action,targetingSequence:wrong}});
  assert.equal(resolution.outcome,"decoy");
  assert.ok(resolution.events.some(x=>x.type==="decoy-intercepted"));
  assert.equal(battle.snapshot().fighters.raiiven.hp,160,
    "a targeted decoy preserves real Raiiven HP");
  assert.equal(decoyStatuses(battle.snapshot()).length,1);
  assert.ok(battle.snapshot().fighters.enemy.hp<160,
    "the native decoy deals its retaliation, not a visual-only animation");
});

test("The basic AI controller advances its choice among real body and both decoys",()=>{
  const activeStatus=id=>({definition:{id,kind:"decoy",durationMs:20000},
    appliedAtMs:0,expiresAtMs:20000});
  const state={elapsedMs:0,fighters:{
    raiiven:{hp:120,statusEffects:[
      activeStatus("left"),activeStatus("right")]},
    enemy:{hp:100,energy:30,maxEnergy:30,statusEffects:[]}
  }};
  const hit=normalizeSkillDefinition({id:"ai-direct-hit",name:"Direct",category:"offensive",
    form:"projectile",element:"fire",energyCost:0,preparationMs:0,travelMs:100,
    recoveryMs:0,cooldownMs:0,allowedDistances:["short","medium","long"],
    targetRelations:["enemy"],effect:{damage:10,heal:0,interruptsPreparation:false,
      stunMs:0,tags:[]}});
  const starts=[];
  const ai=createBattleActorAiController({actorId:"enemy",targetIds:["raiiven"],
    skillIds:[hit.id],skillsById:{[hit.id]:hit},
    session:{snapshot:()=>state,previewSkill:()=>({ok:true})},
    runtime:{hasActiveActionFor:()=>false,startSkill:args=>{
      starts.push(args);return {ok:true};
    }},tactics:{enabled:false}});
  for(let n=0;n<3;n++)assert.equal(ai.takeTurn().status,"skill_started");
  assert.deepEqual(new Set(starts.map(x=>x.decoyId)),
    new Set(["left","right",null]));
});

test("Rémanence copies full DAMAGE and the actual native DEBUFF duration/strength",()=>{
  const battle=session();
  const original=skill("ephemus-battement-limbes");
  const echo=skill("raiiven-remanence-interdite");
  assert.equal(echo.echoCopy.powerPct,100);
  const source=battle.useSkill({actorId:"enemy",targetId:"raiiven",skill:original});
  assert.equal(source.ok,true);
  const targetBefore=battle.snapshot().fighters.enemy.hp;
  const projection=battle.inspectEchoSource({actorId:"raiiven",targetId:"enemy",skill:echo});
  assert.equal(projection.ok,true);
  const shadowDamage=projection.skill.effects.find(x=>x.kind==="damage");
  assert.equal(shadowDamage.amount,10);
  assert.equal(shadowDamage.channel,"shadow");
  const copied=battle.useSkill({actorId:"raiiven",targetId:"enemy",skill:echo});
  assert.equal(copied.ok,true);
  assert.equal(copied.echoCopied,true);
  const state=battle.snapshot();
  assert.equal(state.fighters.enemy.hp,targetBefore-10);
  const sourceSlow=state.fighters.raiiven.statusEffects.find(x=>
    x.definition.kind==="approach_time_modifier");
  const copiedSlow=state.fighters.enemy.statusEffects.find(x=>
    x.definition.kind==="approach_time_modifier");
  assert.ok(sourceSlow&&copiedSlow,"the copied enemy must really have the debuff");
  assert.equal(copiedSlow.definition.modifierPct,sourceSlow.definition.modifierPct);
  assert.equal(copiedSlow.definition.durationMs,sourceSlow.definition.durationMs);
  assert.equal(copiedSlow.definition.polarity,"detrimental");
});

test("Real adaptive AI + real CombatSession actually hits a decoy, retaliates, and sometimes finds Raiiven",()=>{
  const attack=normalizeSkillDefinition({id:"live-ai-attack",name:"Projectile direct",
    category:"offensive",form:"projectile",element:"fire",energyCost:0,
    preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
    allowedDistances:["short","medium","long"],targetRelations:["enemy"],
    effect:{damage:14,heal:0,interruptsPreparation:false,stunMs:0,tags:[]}});
  const outcomes=new Set();
  for(let seed=1;seed<=32;seed++){
    const battle=session();
    assert.equal(battle.useSkill({actorId:"raiiven",targetId:"raiiven",
      skill:skill("raiiven-dedale-silhouettes")}).ok,true);
    const applied=[];
    const ai=createBattleActorAiController({
      actorId:"enemy",targetIds:["raiiven"],skillIds:[attack.id],
      skillsById:{[attack.id]:attack},session:battle,
      runtime:{hasActiveActionFor:()=>false,startSkill:args=>{
        const result=battle.useSkill(args);applied.push({args,result});return result;
      }},tactics:{enabled:true,seed}
    });
    const played=ai.takeTurn();
    assert.equal(played.status,"skill_started");
    assert.equal(applied.length,1);
    outcomes.add(played.result.outcome);
    if(played.result.outcome==="decoy"){
      assert.ok(applied[0].args.decoyId,"AI submitted a real native decoy ID");
      assert.equal(battle.snapshot().fighters.raiiven.hp,160);
      assert.ok(battle.snapshot().fighters.enemy.hp<160,"decoy retaliated in real combat");
      assert.equal(decoyStatuses(battle.snapshot()).length,1);
    }else if(played.result.outcome==="hit"){
      assert.equal(applied[0].args.decoyId,null);
      assert.ok(battle.snapshot().fighters.raiiven.hp<160);
      assert.equal(decoyStatuses(battle.snapshot()).length,0,"real hit reveals the original");
    }else{
      assert.fail("unexpected native outcome: "+played.result.outcome);
    }
  }
  assert.deepEqual(outcomes,new Set(["decoy","hit"]),
    "real AI sometimes chooses a false horse and sometimes the original");
});
