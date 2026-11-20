import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {normalizeBattleFormatDefinition} from "../../src/contracts/battle-format-definition.js";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";
import {createRosterSession} from "../../src/core/combat/roster-session.js";
import {buildCaptureDodgeReactionSkillV1} from "../../src/contracts/capture-game-options-v1.js";

const format=normalizeBattleFormatDefinition({id:"raiiven-stampede-2v2",localActorId:"player",
  teams:{players:["player","ally"],enemies:["opponent","opponent-b"]},
  actors:["player","ally","opponent","opponent-b"].map(actorId=>({actorId,
    teamId:["player","ally"].includes(actorId)?"players":"enemies",
    creatureId:actorId,displayName:actorId,fighterConfigId:actorId,controllerId:"human-local"}))});
const fighter=(id,hp=160)=>({id,maxHp:160,initialHp:hp,maxEnergy:20,initialEnergy:20,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const stampede=()=>normalizeSkillDefinition({id:"raiiven-cavalcade-damnes",name:"Cavalcade des damnés",
  category:"offensive",form:"projectile",projectileTargeting:"stampede",
  stampede:{passes:3,passDurationMs:1800,gapMs:600,cloneCount:5},loadoutSlot:"ultimate",
  element:"shadow",approachMode:"none",energyCost:10,preparationMs:0,
  travelMs:6600,recoveryMs:200,cooldownMs:0,maxUsesPerCombat:1,
  targetRelations:["enemy"],allowedDistances:["short","medium","long"],
  effect:{damage:40,heal:0,interruptsPreparation:false,stunMs:0,tags:[]}});
const clock=()=>{let t=0,id=0;const timers=new Map();return {now:()=>t,setTime:x=>{t=x;},
  setTimer:cb=>{const key=++id;timers.set(key,cb);return key;},
  clearTimer:key=>timers.delete(key),fireNext(){const [key,fn]=timers.entries().next().value??[];if(fn){timers.delete(key);fn();}}};};
function game(hp=160){const session=createCombatSession({distance:"medium",battleFormat:format,
  fighters:[fighter("player"),fighter("ally"),fighter("opponent",hp),fighter("opponent-b")]});
  const timer=clock(),resolutions=[];
  const runtime=createCombatRuntime({session,now:timer.now,setTimer:timer.setTimer,
    clearTimer:timer.clearTimer,enableExpandingWaveMultiTarget:true,
    onResolved:resolution=>resolutions.push(resolution)});
  runtime.start();return {session,timer,runtime,resolutions};}
const contact=(g,passIndex,targetId)=>g.runtime.reportExpandingWaveTargetContact({actorId:"player",
  targetId,skillId:"raiiven-cavalcade-damnes",passIndex});

test("Raiiven stampede resolves 3 native contacts per enemy in 2v2, energy paid exactly once",()=>{
  const g=game();const s=stampede();assert.equal(g.runtime.startSkill({actorId:"player",targetId:"opponent",skill:s}).ok,true);
  assert.equal(g.session.snapshot().fighters.player.energy,10);
  for(let pass=0;pass<3;pass++){
    g.timer.setTime(500+pass*2800);
    assert.equal(contact(g,pass,"opponent").ok,true);
    assert.equal(contact(g,pass,"opponent-b").ok,true);
    assert.equal(contact(g,pass,"opponent").outcome,"already_contacted");
    assert.equal(g.session.snapshot().fighters.opponent.hp,160-40*(pass+1));
    assert.equal(g.session.snapshot().fighters["opponent-b"].hp,160-40*(pass+1));
  }
  assert.equal(g.session.snapshot().fighters.player.energy,10);
  assert.equal(g.resolutions.length,6);
  assert.equal(new Set(g.resolutions.map(x=>x.stampedePassIndex)).size,3);
  g.runtime.dispose();
});

test("Raiiven stampede preserves future passes after KO and hits new occupant of the SAME slot",()=>{
  const g=game(30),s=stampede();g.runtime.startSkill({actorId:"player",targetId:"opponent",skill:s});
  g.timer.setTime(500);assert.equal(contact(g,0,"opponent").ok,true);
  assert.equal(g.session.snapshot().fighters.opponent.hp,0);
  assert.equal(g.runtime.hasActiveActionFor("player"),true);
  g.session.replaceFighter("opponent",fighter("opponent",130));
  g.timer.setTime(3300);assert.equal(contact(g,1,"opponent").ok,true);
  assert.equal(g.session.snapshot().fighters.opponent.hp,90);
  g.timer.setTime(6100);assert.equal(contact(g,2,"opponent").ok,true);
  assert.equal(g.session.snapshot().fighters.opponent.hp,50);
  g.runtime.dispose();
});

test("Raiiven stampede rejects fake passes and outside-of-pass collision windows",()=>{
  const g=game();g.runtime.startSkill({actorId:"player",targetId:"opponent",skill:stampede()});
  g.timer.setTime(500);assert.equal(contact(g,2,"opponent").ok,false);
  g.timer.setTime(2100);assert.equal(contact(g,0,"opponent").ok,false);
  g.timer.setTime(3300);assert.equal(contact(g,1,"ally").ok,false);
  g.timer.setTime(6100);assert.equal(contact(g,4,"opponent").ok,false);
  g.runtime.dispose();
});

test("Raiiven authored ultimate is portable and bound to the existing creature without editing other skills",()=>{
  const transfer=JSON.parse(readFileSync("data/capture/showcase/raiiven-cavalcade-damnes.capture-skill-transfer-v1.json","utf8"));
  const skill=normalizeCaptureSkillTransferV1(transfer);
  assert.equal(skill.draft.definition.projectileTargeting,"stampede");
  assert.equal(skill.draft.definition.effect.damage,40);
  assert.equal(skill.draft.requiredLevel,20);
  const creature=JSON.parse(readFileSync("data/capture/showcase/raiiven.capture-creature-transfer-v1.json","utf8"));
  assert.equal(creature.loadout.slots.find(s=>s.id==="slot-ultimate").skillId,skill.draft.id);
  assert.equal(creature.draft.presentation.visual.movementBack.assetId,"pack:capture:creature-raiiven-movement-player-7-v1");
});

test("Raiiven stampede native rechargeable dodge evades only the SECOND pass for one target",()=>{
  const g=game(),s=stampede();
  g.runtime.startSkill({actorId:"player",targetId:"opponent",skill:s});
  g.timer.setTime(500);assert.equal(contact(g,0,"opponent").ok,true);
  assert.equal(contact(g,0,"opponent-b").ok,true);
  const dodge=buildCaptureDodgeReactionSkillV1({dodge:{enabled:true,maxCharges:2,rechargeMs:30000,activeWindowMs:500}});
  g.timer.setTime(3300);
  const armed=g.runtime.activateRechargeableReaction(dodge,{
    actorId:"opponent",recharge:{actionId:dodge.id,maxCharges:2,rechargeMs:30000},
    activeWindowMs:500
  });
  assert.equal(armed.ok,true);
  const missed=contact(g,1,"opponent");
  assert.equal(missed.ok,true);
  assert.equal(missed.resolution.outcome,"evaded");
  assert.equal(contact(g,1,"opponent-b").resolution.outcome,"hit");
  assert.equal(g.session.snapshot().fighters.opponent.hp,120);
  assert.equal(g.session.snapshot().fighters["opponent-b"].hp,80);
  g.timer.setTime(6100);
  assert.equal(contact(g,2,"opponent").resolution.outcome,"hit");
  assert.equal(g.session.snapshot().fighters.opponent.hp,80);
  g.runtime.dispose();
});

test("Raiiven stampede integrates with canonical RosterSession KO replacement",()=>{
  const rosterData=JSON.parse(readFileSync("data/combat/rosters/demo-2v2.roster.json","utf8"));
  const marai=JSON.parse(readFileSync("data/combat/fighters/maraileron.combat.json","utf8"));
  const braisombre=JSON.parse(readFileSync("data/combat/fighters/braisombre.combat.json","utf8"));
  const g=game(30);
  const roster=createRosterSession({combatSession:g.session,roster:rosterData,
    battleFormat:format,fighterConfigs:{maraileron:marai,braisombre}});
  g.runtime.startSkill({actorId:"player",targetId:"opponent",skill:stampede()});
  g.timer.setTime(500);
  assert.equal(contact(g,0,"opponent").ok,true);
  assert.equal(g.session.snapshot().fighters.opponent.hp,0);
  const next=roster.replaceKnockedOut("opponent");
  assert.equal(next.outcome,"ko_replaced");
  assert.equal(next.creatureId,"maraileron");
  g.timer.setTime(3300);
  const second=contact(g,1,"opponent");
  assert.equal(second.ok,true);
  assert.equal(second.resolution.outcome,"hit");
  assert.equal(g.session.snapshot().fighters.opponent.hp,marai.initialHp-40);
  g.runtime.dispose();
});
