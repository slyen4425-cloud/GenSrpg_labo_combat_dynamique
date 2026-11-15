import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {hasActiveStatusKindV1, applyStatusEffectV1, removeStatusEffectsV1} from "../../src/core/combat/status-effect-runtime-v1.js";
import {createRosterSession} from "../../src/core/combat/roster-session.js";
import {applyImmediateTacticalEffectsV1} from "../../src/core/combat/immediate-tactical-effects-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";

const ids=[
  "veuve-jaune-fil-foudroyant","veuve-jaune-toile-paralysante",
  "veuve-jaune-morsure-neuroelectrique","veuve-jaune-emprise-de-soie",
  "veuve-jaune-domaine-de-la-veuve"
];
const read=path=>JSON.parse(readFileSync(new URL("../../"+path,import.meta.url),"utf8"));
const skills=ids.map(id=>importCaptureTransferJsonV1(
  readFileSync(new URL("../../data/capture/showcase/"+id+".capture-skill-transfer-v1.json",import.meta.url),"utf8")
).value.draft.definition);
const fighter=(id,electric=0)=>({id,maxHp:200,initialHp:200,maxEnergy:100,initialEnergy:100,
  energyChargeAmount:1,energyChargeIntervalMs:1000,statValuesById:{electric}});

test("Veuve jaune equips exactly five unique native skills, keeping all energy settings untouched",()=>{
  const creature=read("data/capture/showcase/veuve-jaune.capture-creature-transfer-v1.json");
  assert.deepEqual(creature.draft.skillIds,ids);
  assert.deepEqual(creature.loadout.slots.map(s=>s.skillId),ids);
  assert.equal(creature.draft.combat.maxEnergy,0);
  assert.equal(creature.draft.combat.energyChargeAmount,0);
  assert.deepEqual(skills.map(s=>s.id),ids);
  for(const id of ids)assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p.endsWith("/"+id+".capture-skill-transfer-v1.json")).length,1);
  assert.ok(skills.every(s=>s.element==="electric"||s.element==="nature"));
});

test("Fil slows 30 percent for three seconds; neuro bite schedules exactly three 4-point pulses",()=>{
  assert.equal(skills[0].cooldownMs,7000);
  assert.equal(skills[0].effects[0].amount,12);
  assert.equal(skills[0].effects[1].status.kind,"approach_time_modifier");
  assert.equal(skills[0].effects[1].status.modifierPct,30);
  assert.equal(skills[0].effects[1].status.durationMs,3000);
  assert.equal(skills[2].cooldownMs,18000);
  assert.deepEqual(skills[2].effects.filter(x=>x.kind==="scheduled_effect").map(x=>[x.trigger.delayMs,x.effects[0].amount]),
    [[1000,4],[2000,4],[3000,4]]);
});

test("Toile reuses native wall: 45 HP for 15 electric, twenty-second life and 70-second recharge",()=>{
  const wall=skills[1];
  assert.equal(wall.cooldownMs,70000);
  const e=wall.effects[0];
  assert.equal(e.kind,"summon_entity");
  assert.equal(e.entityKind,"barrier");
  assert.equal(e.statId,"electric");
  assert.equal(e.hpPerStatPoint,3);
  assert.equal(e.durationMs,20000);
  assert.equal(e.contactDamage,6);
  assert.equal(e.contactDamageIntervalMs,1000);
  assert.equal(e.contactImmobilizeMs,1500);
  assert.equal(e.contactImmobilizeCooldownMs,6000);
  const session=createCombatSession({fighters:[fighter("veuve",15),fighter("enemy")]});
  const begun=session.startSkill({actorId:"veuve",targetId:"veuve",skill:wall});
  assert.equal(begun.ok,true);
  assert.equal(session.completeSkill({action:begun.action}).ok,true);
  const entity=session.snapshot().combatEntities[0];
  assert.equal(entity.hp,45);
  assert.equal(entity.maxHp,45);
  assert.equal(entity.expiresAtMs-session.snapshot().elapsedMs,20000);
  const pulse=session.touchCombatBarrierV1({contactedEntityId:entity.id,hostileActorId:"enemy",atMs:0});
  assert.equal(pulse.ok,true);
  assert.equal(session.snapshot().fighters.enemy.hp,194);
  assert.equal(hasActiveStatusKindV1(session.snapshot(),"enemy","immobilize"),true);
  assert.equal(session.touchCombatBarrierV1({contactedEntityId:entity.id,hostileActorId:"enemy",atMs:0}).outcome,"contact_cooldown");
  session.advanceMs(20000);
  assert.equal(session.snapshot().combatEntities.length,0);
});

test("Emprise gives 18 Nature damage + unbreakable 20s roster lock, no stun",()=>{
  const skill=skills[3];
  assert.equal(skill.cooldownMs,35000);
  assert.equal(skill.effects[0].amount,18);
  const status=skill.effects[1].status;
  assert.equal(status.kind,"roster_lock");
  assert.equal(status.durationMs,20000);
  assert.equal(skill.effects.some(e=>e.kind==="summon_entity"),false);
  assert.equal(skill.effects.some(e=>e.kind==="apply_status"&&e.status.kind==="stun"),false);
});

test("Ultimate waits thirty seconds, once per combat, with exactly +40 for slow OR immobilize",()=>{
  const ultimate=skills[4];
  assert.equal(ultimate.effects[0].amount,40);
  const bonus=ultimate.effects.find(e=>e.condition?.type==="status_kind_any");
  assert.equal(bonus.amount,40);
  assert.deepEqual(bonus.condition.values,["approach_time_modifier","immobilize"]);
  assert.deepEqual(ultimate.effects.filter(e=>e.kind==="scheduled_effect").map(e=>e.effects[0].amount),[7,7,7]);
  assert.equal(ultimate.maxUsesPerCombat,1);
  assert.equal(ultimate.activationRequirements.conditions[0].type,"combat_elapsed_ms");
  assert.equal(ultimate.activationRequirements.conditions[0].threshold,30000);
  const session=createCombatSession({fighters:[fighter("veuve",15),fighter("enemy")]});
  assert.equal(session.startSkill({actorId:"veuve",targetId:"enemy",skill:ultimate}).ok,false);
  session.advanceMs(30000);
  assert.equal(session.startSkill({actorId:"veuve",targetId:"enemy",skill:ultimate}).ok,true);
  const state=createCombatState({fighters:[fighter("veuve",15),fighter("enemy")]});
  const single=applyImmediateTacticalEffectsV1({state,actorId:"veuve",targetId:"enemy",skill:ultimate,atMs:0});
  assert.equal(single.state.fighters.enemy.hp,160,"normal target takes only the base 40 instantly");
});

test("Emprise's native lock rejects actual recall/switch, resists cleanse, then expires at 20 s",()=>{
  const rosterDefinition=read("data/combat/rosters/demo-2v2.roster.json");
  const maraileron=read("data/combat/fighters/maraileron.combat.json");
  const braisombre=read("data/combat/fighters/braisombre.combat.json");
  const session=createCombatSession({fighters:[
    {...maraileron,id:"player",initialHp:100,initialEnergy:9},
    {...braisombre,id:"opponent",initialHp:100,initialEnergy:9}
  ]});
  const roster=createRosterSession({combatSession:session,roster:rosterDefinition,
    fighterConfigs:{maraileron,braisombre},recallCooldownMs:0});
  assert.equal(roster.previewRecall("opponent").ok,true);
  assert.equal(roster.previewSwitch("opponent").ok,true);
  const hit=applyImmediateTacticalEffectsV1({state:session.snapshot(),
    actorId:"player",targetId:"opponent",skill:skills[3],atMs:0});
  assert.equal(hit.state.fighters.opponent.hp,82);
  session.replaceFighter("opponent",hit.state.fighters.opponent);
  assert.equal(roster.previewRecall("opponent").outcome,"roster_locked");
  assert.equal(roster.previewSwitch("opponent").outcome,"roster_locked");
  assert.equal(roster.recall("opponent").outcome,"roster_locked");
  assert.equal(roster.switchMember("opponent").outcome,"roster_locked");
  const cleansed=removeStatusEffectsV1({state:session.snapshot(),
    targetActorId:"opponent",polarity:"detrimental"});
  assert.equal(hasActiveStatusKindV1(cleansed,"opponent","roster_lock"),true);
  session.advanceMs(19999);
  assert.equal(roster.previewRecall("opponent").outcome,"roster_locked");
  session.advanceMs(1);
  assert.equal(roster.previewRecall("opponent").ok,true);
  assert.equal(roster.previewSwitch("opponent").ok,true);
});

test("Ultimate bonus is exactly 40 with either slowing, immobilization, or both",()=>{
  const ultimate=skills[4],target="enemy",source="veuve";
  const slow=skills[0].effects[1].status;
  const root={id:"veuve-jaune-immobilise-test",kind:"immobilize",polarity:"detrimental",
    durationModel:"time_ms",durationMs:3000,stacking:"refresh",maxStacks:1,tags:[]};
  const simulated=(statuses)=>{
    let state=createCombatState({fighters:[fighter(source,15),fighter(target)]});
    for(const status of statuses)state=applyStatusEffectV1({state,targetActorId:target,
      sourceActorId:source,sourceSkillId:"setup",status,atMs:0});
    return applyImmediateTacticalEffectsV1({state,actorId:source,targetId:target,skill:ultimate,atMs:0}).state.fighters[target].hp;
  };
  assert.equal(simulated([]),160);
  assert.equal(simulated([slow]),120);
  assert.equal(simulated([root]),120);
  assert.equal(simulated([slow,root]),120);
});
