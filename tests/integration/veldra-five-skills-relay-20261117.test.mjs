import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createRosterSession} from "../../src/core/combat/roster-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";
import {combatSkillReserveTargetOptionsV2} from "../../src/ui/combat-2v2-test-ui.js";

const ids=["veldra-plume-solaire","veldra-percee-aurore","veldra-egide-zenith",
  "veldra-rayon-cardinal","veldra-releve-celeste"];
const registry=normalizeCaptureStatRegistryV1(JSON.parse(await readFile(
  new URL("../../data/capture/monster-capture-stat-registry.v1.json",import.meta.url),"utf8")));
async function fromFile(file){
  const raw=await readFile(new URL("../../"+file,import.meta.url),"utf8");
  return importCaptureTransferJsonV1(raw,{statRegistry:registry});
}
async function skill(id){
  return (await fromFile("data/capture/showcase/"+id+".capture-skill-transfer-v1.json")).value.draft.definition;
}
function fighter(id,initialHp=150){
  return {id,maxHp:150,initialHp,maxEnergy:100,initialEnergy:100,
    energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,
    chargeTimeModifierPct:0,resistancePctByChannel:{}};
}
function rosterFixture({reserveHp=0,recallCooldownMs=45000}={}){
  const configs={veldra:fighter("veldra",120),friend:fighter("friend",reserveHp),
    foe:fighter("foe",150),enemyReserve:fighter("enemyReserve",100)};
  const session=createCombatSession({fighters:[
    {...configs.veldra,id:"player"},{...configs.foe,id:"opponent"}
  ]});
  const roster=createRosterSession({combatSession:session,fighterConfigs:configs,
    recallCooldownMs,roster:{teams:{
      player:{slotId:"player",activeMemberId:"veldra-m",members:[
        {id:"veldra-m",creatureId:"Veldra_crea",displayName:"Veldra",fighterConfigId:"veldra"},
        {id:"friend-m",creatureId:"ally",displayName:"Allié",fighterConfigId:"friend"}]},
      opponent:{slotId:"opponent",activeMemberId:"foe-m",members:[
        {id:"foe-m",creatureId:"foe",displayName:"Ennemi",fighterConfigId:"foe"},
        {id:"enemy-m",creatureId:"enemyReserve",displayName:"Réserve ennemie",fighterConfigId:"enemyReserve"}]}
    }}});
  return {session,roster};
}
const ref=(teamId,memberId)=>({scope:"reserve",teamId,memberId});

test("Five exact Veldra skills are registered, authorable, normalized, and equipped in order",async()=>{
  const creature=(await fromFile("data/capture/showcase/Veldra_crea.capture-creature-transfer-v1.json")).value;
  assert.equal(creature.draft.presentation.version,10);
  assert.equal(creature.draft.presentation.viewOverrides.player.displayScale,2);
  assert.equal(creature.draft.presentation.viewOverrides.opponent.position.y,20);
  assert.deepEqual(creature.draft.skillIds,ids);
  assert.deepEqual(creature.loadout.slots.map(x=>x.skillId),ids);
  for(let i=0;i<ids.length;i++){
    const file="data/capture/showcase/"+ids[i]+".capture-skill-transfer-v1.json";
    assert.ok(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.includes(file));
    const imported=await fromFile(file);
    assert.equal(imported.kind,"skill");
    assert.equal(imported.value.draft.definition.id,ids[i]);
    assert.equal(imported.value.draft.requiredLevel,[1,5,10,15,20][i]);
    assert.equal(imported.value.draft.presentation.visual.icon.assetId.startsWith("pack:")||
      imported.value.draft.presentation.visual.icon.assetId.startsWith("core:"),true);
  }
  const plume=await skill(ids[0]);
  assert.equal(plume.effects[0].amount,10);
  assert.equal(plume.effects[1].marker.durationMs,5000);
  const dive=await skill(ids[1]);
  assert.equal(dive.approachMode,"aerial");
  assert.equal(dive.effects[0].amount,12);
  assert.deepEqual(dive.effects[1].condition.type,"marker");
  assert.equal(dive.effects[1].status.durationMs,2000);
  const aegis=await skill(ids[2]);
  assert.equal(aegis.effects[0].amount,25);
  assert.equal(aegis.effects[1].status.deltaPoints,200);
  assert.equal(aegis.effects[1].status.durationMs,6000);
  assert.equal(aegis.effects[2].slowOnly,true);
  const beam=await skill(ids[3]);
  assert.equal(beam.channeling.tickIntervalMs,400);
  assert.equal(beam.channeling.maxTicks,5);
  assert.equal(beam.channeling.effects[0].amount,8);
  assert.equal(beam.channeling.finalTickEffects[0].amount,10);
  const relay=await skill(ids[4]);
  assert.equal(relay.cooldownMs,110000);
  assert.deepEqual(relay.targetLocations,["reserve"]);
  assert.equal(relay.effects[0].healAmount,100);
  assert.equal(relay.effects[0].outgoingDamagePct,20);
  assert.equal(relay.effects[0].durationMs,30000);
});

test("Relève céleste revives KO own reserve, heals 100, buffs and performs one native atomic switch",async()=>{
  const {session,roster}=rosterFixture({reserveHp:0});
  const ultimate=await skill(ids[4]);
  const preview=roster.previewSkillOnTarget({actorId:"player",
    targetRef:ref("player","friend-m"),skill:ultimate});
  assert.equal(preview.ok,true);
  const before=session.snapshot().fighters.player;
  const result=roster.useSkillOnTarget({actorId:"player",
    targetRef:ref("player","friend-m"),skill:ultimate});
  assert.equal(result.ok,true);
  assert.equal(result.outcome,"allied_relay");
  assert.equal(roster.snapshot().player.activeMemberId,"friend-m");
  assert.equal(session.snapshot().fighters.player.hp,100);
  assert.equal(result.events.filter(x=>x.type==="roster-allied-relay").length,1);
  const statuses=session.snapshot().fighters.player.statusEffects;
  const boost=statuses.find(x=>x.definition.kind==="outgoing_damage_modifier");
  assert.equal(boost.definition.modifierPct,20);
  assert.equal(boost.definition.durationMs,30000);
  const savedVeldra=roster.reserveMemberSnapshot("player","veldra-m");
  assert.equal(savedVeldra.hp,before.hp);
  assert.equal(savedVeldra.energy,before.energy-ultimate.energyCost);
  assert.equal(savedVeldra.skillUseCounts[ids[4]],1);
  assert.equal(roster.previewRecall("player").outcome,"recall_cooldown");
  assert.equal(Object.keys(session.snapshot().fighters).length,2,"bench never enters CombatState");
});

test("Relève céleste heals living reserve up to max and fails closed for enemy or non-own reserves",async()=>{
  const ultimate=await skill(ids[4]);
  const {session,roster}=rosterFixture({reserveHp:120});
  const wrong=roster.previewSkillOnTarget({actorId:"player",
    targetRef:ref("opponent","enemy-m"),skill:ultimate});
  assert.equal(wrong.ok,false);
  const before=session.snapshot().fighters.player.energy;
  assert.equal(roster.useSkillOnTarget({actorId:"player",
    targetRef:ref("opponent","enemy-m"),skill:ultimate}).ok,false);
  assert.equal(session.snapshot().fighters.player.energy,before);
  assert.equal(roster.useSkillOnTarget({actorId:"player",
    targetRef:ref("player","friend-m"),skill:ultimate}).ok,true);
  assert.equal(session.snapshot().fighters.player.hp,150);
  const cannotRecall=roster.previewSkillOnTarget({actorId:"player",
    targetRef:ref("player","veldra-m"),skill:ultimate});
  assert.equal(cannotRecall.ok,false);
  assert.equal(cannotRecall.outcome,"recall_cooldown");
});

test("Relève céleste skill contract never opens this operation to enemy-targeted or active-only skills",async()=>{
  const ultimate=await skill(ids[4]);
  assert.throws(()=>normalizeSkillDefinition({...ultimate,targetRelations:["enemy"]}),/ally_reserve_relay/);
  assert.throws(()=>normalizeSkillDefinition({...ultimate,targetLocations:["active"]}),/ally_reserve_relay/);
  assert.throws(()=>normalizeSkillDefinition({...ultimate,
    effects:[...ultimate.effects,{kind:"heal",targetScope:"target",amount:100}]}),/ally_reserve_relay/);
  assert.throws(()=>normalizeSkillDefinition({...ultimate,
    effects:[{...ultimate.effects[0],healAmount:0}]}),/healAmount/);
});

test("KO bench can only appear as a skill candidate for its own relay, not for ordinary reserve heals",async()=>{
  const {roster}=rosterFixture({reserveHp:0});
  const ultimate=await skill(ids[4]);
  const format={actors:[{actorId:"player",teamId:"a"},{actorId:"opponent",teamId:"b"}],
    teamOf(id){return id==="player"?"a":"b";}};
  const options=combatSkillReserveTargetOptionsV2({
    format,actorId:"player",skill:ultimate,rosterSnapshot:roster.snapshot(),
    previewTarget:options=>roster.previewSkillOnTarget(options)
  });
  assert.deepEqual(options.map(x=>x.targetRef),[ref("player","friend-m")]);
  const normal=normalizeSkillDefinition({...ultimate,id:"normal-heal",name:"Normal",
    category:"heal",form:"aura",effects:[{kind:"heal",targetScope:"target",amount:20}]});
  const filtered=combatSkillReserveTargetOptionsV2({
    format,actorId:"player",skill:normal,rosterSnapshot:roster.snapshot(),
    previewTarget:options=>roster.previewSkillOnTarget(options)
  });
  assert.equal(filtered.length,0);
});

test("Rayon cardinal has five deterministic native ticks and a conditional +10 fifth-only finisher",async()=>{
  const beam=await skill(ids[3]);
  const plume=await skill(ids[0]);
  async function execute(withMark){
    let time=0,tick=()=>{};
    const session=createCombatSession({fighters:[fighter("player",150),fighter("opponent",150)]});
    if(withMark){
      const marked=session.useSkill({actorId:"player",targetId:"opponent",skill:plume});
      assert.equal(marked.ok,true);
    }
    const normalized=normalizeSkillDefinition({...beam,preparationMs:0,travelMs:0,
      cooldownMs:0,energyCost:0});
    const ticks=[];
    const runtime=createCombatRuntime({session,now:()=>time,
      setTimer(fn){tick=fn;return 1;},clearTimer(){},onChannelTick:e=>ticks.push(e)});
    runtime.start();
    const start=runtime.startSkill({actorId:"player",targetId:"opponent",skill:normalized});
    assert.equal(start.ok,true);
    for(const t of [399,400,799,800,1199,1200,1599,1600,1999,2000,2400]){time=t;tick();}
    const result={hp:session.snapshot().fighters.opponent.hp,ticks:ticks.length,events:ticks};
    runtime.dispose();
    return result;
  }
  const marked=await execute(true),normal=await execute(false);
  assert.equal(normal.ticks,5);
  assert.equal(marked.ticks,5);
  assert.equal(normal.hp,110,"unmarked target gets exactly 5*8");
  assert.equal(marked.hp,90,"marked target receives plume 10 + 5*8 + final 10");
  assert.equal(marked.events[4].events.some(x=>x.type==="hit" && x.baseDamage===10),true);
});
