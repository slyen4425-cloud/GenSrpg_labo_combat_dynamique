import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  normalizeCaptureCreatureDefensiveReactionV1,
  captureCreatureReactionActionIdV1
} from "../../src/contracts/capture-creature-defensive-reaction-v1.js";
import { normalizeCaptureCreatureEditorDraftV3 } from "../../src/contracts/capture-creature-editor-draft-v3.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import {
  exportCaptureCreatureTransferJsonV1,
  importCaptureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { buildCaptureEditorCombatTestV1 } from "../../src/ui/capture-editor-combat-test-v1.js";
import { adaptCaptureCombatExportStackV1 } from "../../src/adapters/input/capture/capture-export-adapter-stack-v1.js";

import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatState } from "../../src/core/combat/combat-state.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { activateRechargeableActionV1 } from "../../src/core/combat/rechargeable-action-v1.js";
import { computeCombatDamageV1 } from "../../src/core/combat/combat-damage-v1.js";

const read = p => readFileSync(new URL("../../" + p, import.meta.url), "utf8");
const author = JSON.parse(read("data/capture/showcase/crea_foudrillon.capture-creature-transfer-v1.json"));
const registry = normalizeCaptureStatRegistryV1(JSON.parse(read("data/capture/monster-capture-stat-registry.v1.json")));
const reaction = Object.freeze({
  type: "defense", maxCharges: 3, rechargeMs: 30000,
  activeWindowMs: 500, damageReductionPct: 60
});

test("one strict creature reaction contract validates mode, charges, time and reduction", () => {
  assert.deepEqual(normalizeCaptureCreatureDefensiveReactionV1(reaction), reaction);
  assert.equal(normalizeCaptureCreatureDefensiveReactionV1(undefined), null);
  assert.equal(normalizeCaptureCreatureDefensiveReactionV1(null), null);
  assert.throws(() => normalizeCaptureCreatureDefensiveReactionV1({...reaction, type:"magic"}), /type/);
  assert.throws(() => normalizeCaptureCreatureDefensiveReactionV1({...reaction, maxCharges:0}), /maxCharges/);
  assert.throws(() => normalizeCaptureCreatureDefensiveReactionV1({...reaction, rechargeMs:-1}), /rechargeMs/);
  assert.throws(() => normalizeCaptureCreatureDefensiveReactionV1({...reaction, activeWindowMs:0}), /activeWindowMs/);
  assert.throws(() => normalizeCaptureCreatureDefensiveReactionV1({...reaction, damageReductionPct:101}), /damageReductionPct/);
  assert.throws(() => normalizeCaptureCreatureDefensiveReactionV1({...reaction, random:true}), /unknown field/);
  assert.equal(captureCreatureReactionActionIdV1("crea_foudrillon", "defense"),"capture-game-defense:crea_foudrillon");
  assert.notEqual(captureCreatureReactionActionIdV1("crea_foudrillon","dodge"),
    captureCreatureReactionActionIdV1("crea_mossback","dodge"));
});

test("author creature export stays legacy-compatible; explicit defense roundtrips through the only transfer owner", () => {
  const old = normalizeCaptureCreatureEditorDraftV3(author.draft);
  assert.equal(Object.hasOwn(old.combat,"reaction"),false);
  const draft = normalizeCaptureCreatureEditorDraftV3({
    ...author.draft,
    combat: {...author.draft.combat, reaction}
  });
  assert.deepEqual(draft.combat.reaction,reaction);
  assert.deepEqual(draft.presentation,old.presentation);
  assert.deepEqual(draft.sourceStats,old.sourceStats);
  assert.deepEqual(draft.skillIds,old.skillIds);
  const record = {
    draft, statValues: author.statValues, loadout: author.loadout
  };
  const restored = importCaptureTransferJsonV1(
    exportCaptureCreatureTransferJsonV1(record,{statRegistry:registry}),
    {statRegistry:registry}
  ).value;
  assert.deepEqual(restored.draft.combat.reaction,reaction);
  assert.deepEqual(restored.loadout,author.loadout);
  assert.deepEqual(restored.statValues,author.statValues);
});

function fighter(id, reactionConfig=null, name="creature") {
  return {
    id,maxHp:200,initialHp:200,maxEnergy:10,initialEnergy:10,
    energyChargeAmount:0,energyChargeIntervalMs:2000,
    movementEnergyPerStep:0,chargeTimeModifierPct:0,
    ...(reactionConfig ? {defensiveReaction:reactionConfig,defensiveCreatureId:name} : {})
  };
}

test("Defense uses the existing rechargeable combat clock, reduces damage only in active window",()=>{
  const creatureId="crea_foudrillon",actorId="player";
  const initial=createCombatState({fighters:[
    fighter(actorId,reaction,creatureId),fighter("opponent")
  ]});
  const actionId=captureCreatureReactionActionIdV1(creatureId,"defense");
  const before=computeCombatDamageV1({state:initial,attackerId:"opponent",targetId:actorId,baseDamage:100,atMs:0});
  assert.equal(before.damage,100);
  const active=activateRechargeableActionV1({
    state:initial,actorId,actionId,maxCharges:3,rechargeMs:30000,activeWindowMs:500
  });
  assert.equal(active.ok,true);
  assert.equal(active.availability.charges,2);
  const during=computeCombatDamageV1({state:active.state,attackerId:"opponent",targetId:actorId,baseDamage:100,atMs:499});
  assert.equal(during.damage,40);
  assert.equal(during.damageReductionPct,60);
  const atExpiry=computeCombatDamageV1({state:active.state,attackerId:"opponent",targetId:actorId,baseDamage:100,atMs:500});
  assert.equal(atExpiry.damage,100);
  const penetrated=computeCombatDamageV1({
    state:active.state,attackerId:"opponent",targetId:actorId,baseDamage:100,
    atMs:250,ignoreDamageReductionPct:100
  });
  assert.equal(penetrated.damage,100);
  const other=createCombatState({fighters:[
    fighter(actorId,{...reaction,type:"dodge"},creatureId),fighter("opponent")
  ]});
  const used=activateRechargeableActionV1({
    state:other,actorId,actionId:captureCreatureReactionActionIdV1(creatureId,"dodge"),
    maxCharges:3,rechargeMs:30000,activeWindowMs:500
  });
  assert.equal(computeCombatDamageV1({state:used.state,attackerId:"opponent",targetId:actorId,baseDamage:100}).damage,100);
});

test("native Runtime activates Defense without a fake dodge and prevents double spend",()=>{
  const id="crea_foudrillon",actionId=captureCreatureReactionActionIdV1(id,"defense");
  const session=createCombatSession({fighters:[fighter("player",reaction,id),fighter("opponent")]});
  let timerId=0;
  const runtime=createCombatRuntime({
    session,now:()=>0,
    setTimer:()=>++timerId,clearTimer:()=>{}
  });
  runtime.start();
  const config={
    actorId:"player",recharge:{actionId,maxCharges:3,rechargeMs:30000},
    activeWindowMs:500
  };
  const first=runtime.activateRechargeableReaction(null,config);
  assert.equal(first.ok,true);
  assert.equal(first.window.active,true);
  assert.equal(runtime.rechargeableActionAvailability({actorId:"player",...config.recharge}).charges,2);
  assert.equal(computeCombatDamageV1({
    state:session.snapshot(),attackerId:"opponent",targetId:"player",baseDamage:50
  }).damage,20);
  const second=runtime.activateRechargeableReaction(null,config);
  assert.equal(second.ok,false);
  assert.equal(second.outcome,"already_active");
  assert.equal(runtime.rechargeableActionAvailability({actorId:"player",...config.recharge}).charges,2);
  runtime.dispose();
});

function tinyRecord(id,config) {
  return {
    draft: {
      schema:"capture-creature-editor-draft-v3",
      id,displayName:id,description:id,level:1,
      sourceStats:{force:1,agility:1,intelligence:1,spirit:1,endurance:1,initiative:1},
      elements:[],resistances:[],
      capture:{capturable:true,captureRate:50,spawnChance:50,spawnTags:[],evolution:null},
      combat:{maxHp:100,maxEnergy:0,...(config?{reaction:config}:{})},
      skillIds:[],presentation:null
    },
    statValues:null,
    loadout:{
      schema:"capture-active-skill-loadout-v1",creatureId:id,
      slots:["slot-1","slot-2","slot-3","slot-4","slot-ultimate"].map(slotId=>({id:slotId,skillId:null}))
    }
  };
}

test("real editor combat export -> native fighter adapter carries creature Defense despite global energy rules",()=>{
  const current=new Map([
    ["local",tinyRecord("local",reaction)],
    ["enemy",tinyRecord("enemy",{...reaction,type:"none"})]
  ]);
  const exported=buildCaptureEditorCombatTestV1({
    configuredCreatures:current,configuredSkills:new Map(),
    localCreatureIds:["local"],opponentCreatureIds:["enemy"],
    activePerTeam:1,arenaId:null,
    combatRules:{
      schema:"capture-combat-rules-editor-draft-v1",
      maxEnergy:15,initialEnergy:4,energyChargeAmount:2,
      energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0
    },previewLevel:20
  });
  assert.equal(exported.creatures.find(c=>c.id==="local").combat.reaction.type,"defense");
  assert.equal(exported.creatures.find(c=>c.id==="local").combat.maxEnergy,15);
  const native=adaptCaptureCombatExportStackV1(exported);
  assert.deepEqual(native.fighterConfigs.local.defensiveReaction,reaction);
  assert.equal(native.fighterConfigs.local.defensiveCreatureId,"local");
  assert.equal(native.fighterConfigs.enemy.defensiveReaction.type,"none");
  assert.equal(native.fighterConfigs.local.maxEnergy,15);
  assert.equal(native.fighterConfigs.local.initialEnergy,4);
});


test("the real CombatSession resolves a non-dodgeable projectile through Defense, not as a dodge",()=>{
  const id="crea_foudrillon",actionId=captureCreatureReactionActionIdV1(id,"defense");
  const session=createCombatSession({
    fighters:[fighter("player",reaction,id),fighter("opponent")],
    distance:"medium"
  });
  const incoming=normalizeSkillDefinition({
    id:"defense-test-projectile",name:"Projectile",category:"offensive",
    form:"projectile",element:null,approachMode:"none",
    energyCost:0,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
    dodgeable:false,allowedDistances:["short","medium","long"],
    targetRelations:["enemy"],
    effect:{damage:50,heal:0,interruptsPreparation:false,stunMs:0,tags:[]}
  });
  assert.equal(session.activateRechargeableAction({
    actorId:"player",actionId,maxCharges:3,rechargeMs:30000,
    activeWindowMs:500
  }).ok,true);
  const guarded=session.useSkill({actorId:"opponent",targetId:"player",skill:incoming});
  assert.equal(guarded.ok,true);
  assert.equal(guarded.outcome,"hit");
  assert.equal(session.snapshot().fighters.player.hp,180); // 50 damage reduced 60% -> 20
  session.advanceMs(500);
  const after=session.useSkill({actorId:"opponent",targetId:"player",skill:incoming});
  assert.equal(after.ok,true);
  assert.equal(session.snapshot().fighters.player.hp,130);
});

test("roster replacement retains each creature's independent cooldown and prevents guard leaking to the next member",()=>{
  const original="crea_foudrillon",reserve="crea_mossback";
  const first=captureCreatureReactionActionIdV1(original,"defense");
  const second=captureCreatureReactionActionIdV1(reserve,"defense");
  const session=createCombatSession({
    fighters:[fighter("player",reaction,original),fighter("opponent")]
  });
  assert.equal(session.activateRechargeableAction({
    actorId:"player",actionId:first,maxCharges:1,
    rechargeMs:30000,activeWindowMs:500
  }).ok,true);
  assert.equal(session.rechargeableActionAvailability({
    actorId:"player",actionId:first,maxCharges:1,rechargeMs:30000
  }).charges,0);
  session.replaceFighter("player",fighter("player",reaction,reserve));
  assert.equal(computeCombatDamageV1({
    state:session.snapshot(),attackerId:"opponent",
    targetId:"player",baseDamage:100
  }).damage,100,"Foudrillon's guard must not protect Moussados");
  assert.equal(session.rechargeableActionAvailability({
    actorId:"player",actionId:second,maxCharges:1,rechargeMs:30000
  }).charges,1);
  assert.equal(session.activateRechargeableAction({
    actorId:"player",actionId:second,maxCharges:1,
    rechargeMs:30000,activeWindowMs:500
  }).ok,true);
  assert.equal(computeCombatDamageV1({
    state:session.snapshot(),attackerId:"opponent",
    targetId:"player",baseDamage:100
  }).damage,40);
  session.replaceFighter("player",fighter("player",reaction,original));
  assert.equal(session.rechargeableActionAvailability({
    actorId:"player",actionId:first,maxCharges:1,rechargeMs:30000
  }).charges,0,"switching back cannot refresh original charges");
});
