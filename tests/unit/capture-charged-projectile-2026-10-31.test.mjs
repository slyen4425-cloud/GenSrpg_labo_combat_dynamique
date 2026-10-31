import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";
import {planSkillPreparationFx,planSkillReleaseFx} from "../../src/core/fx/skill-fx-plan.js";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";
import {buildHumanSkillDraftV1,humanSkillEditorFieldsFromDraftV1} from "../../src/ui/capture-editor-human-v2.js";
const json=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const base=json("data/combat/skills/fireball.skill.json");
const skill=()=>normalizeSkillDefinition({...base,id:"charging-projectile",name:"Orbe chargée",
  preparationMs:1000,travelMs:300,recoveryMs:0,cooldownMs:3000,
  effect:{damage:0,heal:0,stunMs:0,interruptsPreparation:false,tags:[]},effects:[],
  chargedAttack:{baseDamage:5,bonusDamagePerCharge:5,maxCharges:3,reactivationWindowMs:450,sizeIncreasePct:10}});
function clock(){let t=0;let queue=[];let id=0;return {now:()=>t,
  advance(ms){t+=ms;for(const task of [...queue]){queue=queue.filter(x=>x!==task);task.callback();}},
  setTimer(callback,delay){const x={id:++id,callback,delay};queue.push(x);return x.id;},
  clearTimer(key){queue=queue.filter(x=>x.id!==key);}};}
test("charged Attack contract has one damage authority and only direct projectiles",()=>{
  assert.equal(skill().chargedAttack.baseDamage,5);
  assert.throws(()=>normalizeSkillDefinition({...skill(),form:"beam"}),/chargedAttack|projectile/i);
  assert.throws(()=>normalizeSkillDefinition({...skill(),preparationMs:0}),/preparationMs/);
  assert.throws(()=>normalizeSkillDefinition({...skill(),effects:[{kind:"damage",targetScope:"target",amount:5}]}),/chargedAttack|damage/i);
  assert.throws(()=>normalizeSkillDefinition({...skill(),chargedAttack:{...skill().chargedAttack,maxCharges:0}}),/maxCharges/i);
});
test("same button press charges ONE paid projectile, bounded by tap interval and release",()=>{
  const session=createCombatSession({distance:"medium",fighters:[
    {...json("data/combat/fighters/maraileron.combat.json"),initialEnergy:10,initialHp:100,energyChargeIntervalMs:1000000},
    {...json("data/combat/fighters/braisombre.combat.json"),initialEnergy:10,initialHp:100}]});
  const c=clock(), released=[],resolved=[],progress=[];
  const runtime=createCombatRuntime({session,now:c.now,setTimer:c.setTimer,clearTimer:c.clearTimer,tickMs:50,
    onRelease:e=>released.push(e),onResolved:e=>resolved.push(e),onProgress:e=>progress.push(e)});
  runtime.start();
  const original=skill(), first=runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:original});
  assert.equal(first.outcome,"started");
  const energy=session.snapshot().fighters.maraileron.energy;
  c.advance(1000);
  assert.equal(runtime.previewChargedSkillRetrigger({actorId:"maraileron",skillId:original.id}).ok,true);
  assert.equal(runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:original}).chargeCount,2);
  c.advance(1000);
  assert.equal(runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:original}).chargeCount,3);
  assert.equal(runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:original}).outcome,"charge_max");
  assert.equal(session.snapshot().fighters.maraileron.energy,energy-2,"each accepted amplification has its own energy payment");
  assert.equal(session.snapshot().fighters.maraileron.skillUses?.[original.id]??1,1);
  c.advance(1000);
  assert.equal(released.length,1);
  assert.equal(released[0].action.chargeState.damage,15);
  assert.equal(released[0].action.chargeState.sizeMultiplier,1.2);
  assert.equal(planSkillReleaseFx({action:released[0].action})[0].sizeMultiplier,1.2);
  assert.equal(runtime.previewChargedSkillRetrigger({actorId:"maraileron",skillId:original.id}).ok,false);
  c.advance(300);
  assert.equal(resolved.length,1,"one hit event");
  assert.equal(resolved[0].events.find(x=>x.type==="hit").baseDamage,15);
  runtime.dispose();
});
test("late repeat fails, preserves charges, and cannot sneak a new cooldown payment",()=>{
  const s=skill(),session=createCombatSession({distance:"medium",fighters:[
    {...json("data/combat/fighters/maraileron.combat.json"),initialEnergy:10},
    {...json("data/combat/fighters/braisombre.combat.json"),initialEnergy:10}]});
  const c=clock(),runtime=createCombatRuntime({session,now:c.now,setTimer:c.setTimer,clearTimer:c.clearTimer});
  runtime.start();
  runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:s});
  c.advance(500);
  assert.equal(runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:s}).outcome,"charge_preparing");
  c.advance(1000);
  assert.equal(runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:s}).outcome,"charge_released");
  assert.equal(runtime.activeActionFor("maraileron").chargeState.chargeCount,1);
  runtime.dispose();
});
test("bestiary explains base, bonus, maximum and visible size without doubled damage",()=>{
  const text=describeCaptureSkillV1(skill()).sentences.join(" ");
  assert.match(text,/5 dégâts/);
  assert.match(text,/5 dégâts supplémentaires/);
  assert.match(text,/3 activations/);
  assert.match(text,/10 %/);
  assert.doesNotMatch(text,/Inflige 0 dégâts/);
});
test("real editor exposes charged configuration through native draft, no second editor",()=>{
  const editor=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  assert.match(editor,/data-skill-charged-enabled/);
  assert.match(editor,/data-skill-charged-base-damage/);
  assert.match(editor,/data-skill-charged-bonus-damage/);
  assert.match(editor,/data-skill-charged-max-charges/);
  assert.match(editor,/data-skill-charged-window/);
  assert.match(editor,/data-skill-charged-size-pct/);
});

test("author skill draft retains charge values through canonical editor roundtrip",()=>{
  const exported=json("data/capture/showcase/lib_light_bolt.capture-skill-transfer-v1.json").draft;
  const loaded=humanSkillEditorFieldsFromDraftV1(exported);
  const charge={baseDamage:5,bonusDamagePerCharge:7,maxCharges:4,reactivationWindowMs:350,sizeIncreasePct:15};
  const authored=buildHumanSkillDraftV1({
    ...loaded,preparationMs:1200,chargedAttack:charge,effects:[],damage:0,
    presentation:{...loaded.presentation,travelTrajectoryMode:"linear"}
  });
  assert.deepEqual(authored.definition.chargedAttack,charge);
  const restored=humanSkillEditorFieldsFromDraftV1(authored);
  assert.deepEqual(restored.chargedAttack,charge);
  const exportedAgain=buildHumanSkillDraftV1(restored);
  assert.deepEqual(exportedAgain.definition.chargedAttack,charge);
  assert.equal(exportedAgain.definition.preparationMs,1200);
});

test("charged cast plan and release use the same authoritative size",()=>{
  const initial={skill:skill(),preparationMs:1000,chargeState:{chargeCount:1,sizeMultiplier:1}};
  assert.equal(planSkillPreparationFx({action:initial})[0].sizeMultiplier,1);
  const amplified={...initial,chargeState:{chargeCount:3,sizeMultiplier:1.2}};
  assert.equal(planSkillReleaseFx({action:amplified})[0].sizeMultiplier,1.2);
});

test("charge amplification updates ONE playing cast without restarting it",async()=>{
  const {createCombatResolutionPresenter}=await import("../../src/adapters/renderer/combat-resolution-presenter.js");
  const calls=[],changes=[],cancelled=[];
  const handle={status:"running",animation:{cancel:()=>cancelled.push("cast")},finished:new Promise(()=>{}),
    setSizeMultiplier:multiplier=>changes.push(multiplier)};
  const fx={play:plan=>{calls.push(plan);return handle;},cancelProjectileFor:()=>0};
  const visuals={playEventFor:()=>Promise.resolve(),cancelFor:()=>{}};
  const presenter=createCombatResolutionPresenter({visuals,fx});
  const action={actionType:"skill",actorId:"player",targetId:"opponent",preparationMs:1000,
    releaseAtMs:1000,travelMs:300,skill:skill(),chargeState:{chargeCount:1,sizeMultiplier:1}};
  presenter.presentPreparation({action,actorSlot:"player"});
  assert.equal(calls.length,1);
  presenter.presentChargeAmplification({actorSlot:"player",sizeMultiplier:1.1});
  presenter.presentChargeAmplification({actorSlot:"player",sizeMultiplier:1.2});
  assert.deepEqual(changes,[1.1,1.2]);
  assert.equal(calls.length,1,"do not restart the animated cast");
  presenter.presentRelease({action:{...action,chargeState:{chargeCount:3,sizeMultiplier:1.2}},actorSlot:"player",targetSlot:"opponent"});
  assert.equal(calls[1].sizeMultiplier,1.2);
  assert.equal(cancelled.length,1,"the original cast ends once on release");
  presenter.dispose();
});

test("author adds charged attack from Effets > Ajouter un effet, not Timing",()=>{
  const editor=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  const effects=editor.indexOf("<h2>Effets tactiques</h2>");
  const timing=editor.indexOf("<h2>Timing</h2>");
  const charged=editor.indexOf('aria-label="Attaque chargée"');
  assert.ok(effects>=0 && effects<charged && charged<timing,"charged controls belong to tactical effects");
  assert.match(editor,/data-skill-effect-add-kind/);
  assert.match(editor,/<option value="charged">Attaque chargée/);
});
