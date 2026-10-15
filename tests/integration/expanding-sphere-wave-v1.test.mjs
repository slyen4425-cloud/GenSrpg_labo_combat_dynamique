import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {humanSkillEditorFieldsFromDraftV1,buildHumanSkillDraftV1} from "../../src/ui/capture-editor-human-v2.js";
import {sweptExpandingWaveHitsOpaqueMaskV1} from "../../src/adapters/renderer/dom-visible-model-contact.js";
import {planSkillReleaseFx} from "../../src/core/fx/skill-fx-plan.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";

const wave=()=>normalizeSkillDefinition({
 id:"fire-wave",name:"Onde de feu",category:"offensive",form:"projectile",
 projectileTargeting:"expanding_wave",
 expandingWave:{startRadiusPct:3,endRadiusPct:65,thicknessPct:6},
 element:"fire",approachMode:"none",energyCost:0,preparationMs:0,
 travelMs:1000,recoveryMs:0,cooldownMs:0,
 hitPresenceStates:["surface","airborne"],
 allowedDistances:["short","medium","long"],
 targetRelations:["enemy"],
 effect:{damage:20,heal:0,tags:[]}
});
const base=id=>({id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,
 energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const fixture=()=>JSON.parse(readFileSync(
 new URL("../../data/capture/showcase/cap_fire_atk_5.capture-skill-transfer-v1.json",import.meta.url),"utf8"));
function frame(left,top=0){
 const mask={width:4,height:4,opaque:new Uint8Array(16).fill(1)};
 return {mask,origin:{x:left,y:top},axisX:{x:left+12,y:top},axisY:{x:left,y:top+12}};
}
function clock(){
 let time=0;let index=0;const scheduled=new Map();
 return {
  now:()=>time,setTime:t=>{time=t;},
  setTimer:fn=>{const id=++index;scheduled.set(id,fn);return id;},
  clearTimer:id=>scheduled.delete(id),
  fireNext:()=>{const [id,fn]=scheduled.entries().next().value ?? []; assert.ok(fn);scheduled.delete(id);fn();}
 };
}
function harness(){
 const session=createCombatSession({distance:"short",fighters:[base("player"),base("opponent")]});
 const c=clock(),resolutions=[];
 const runtime=createCombatRuntime({session,now:c.now,setTimer:c.setTimer,clearTimer:c.clearTimer,
  onResolved:result=>resolutions.push(result)});
 runtime.start();
 return {session,clock:c,runtime,resolutions};
}

test("expanding-wave is a strictly authored projectile mode, with bounded mobile relative geometry",()=>{
 const skill=wave();
 assert.equal(skill.form,"projectile");
 assert.equal(skill.projectileTargeting,"expanding_wave");
 assert.deepEqual(skill.expandingWave,{startRadiusPct:3,endRadiusPct:65,thicknessPct:6});
 const action={skill,travelMs:1000};
 const plan=planSkillReleaseFx({action,actorSlot:"player",targetSlot:"opponent"});
 assert.equal(plan.length,1);
 assert.deepEqual(plan[0].expandingWave,skill.expandingWave);
 const direct=normalizeSkillDefinition({...skill,id:"direct",projectileTargeting:"direct",expandingWave:undefined});
 assert.equal("expandingWave" in direct,false);
 assert.throws(()=>normalizeSkillDefinition({...skill,expandingWave:{...skill.expandingWave,endRadiusPct:2}}),/expandingWave/);
 assert.throws(()=>normalizeSkillDefinition({...skill,form:"self"}),/expanding_wave/);
});

test("wave collision sweeps a real transformed opaque alpha boundary, not a central projectile point",()=>{
 const center={x:0,y:6};
 assert.equal(sweptExpandingWaveHitsOpaqueMaskV1({
  center,previousRadiusPx:12,radiusPx:40,thicknessPx:5,frame:frame(30)
 }),true);
 assert.equal(sweptExpandingWaveHitsOpaqueMaskV1({
  center,previousRadiusPx:12,radiusPx:40,thicknessPx:5,frame:frame(95)
 }),false);
 assert.equal(sweptExpandingWaveHitsOpaqueMaskV1({
  center,previousRadiusPx:32,radiusPx:40,thicknessPx:5,frame:frame(12)
 }),false);
 assert.equal(sweptExpandingWaveHitsOpaqueMaskV1({
  center,previousRadiusPx:35,radiusPx:55,thicknessPx:5,
  previousFrame:frame(70),frame:frame(51)
 }),true);
});

test("the author can edit and transfer a wave via the canonical skill editor without modifying existing abilities",()=>{
 const native=importCaptureTransferJsonV1(JSON.stringify(fixture())).value.draft;
 const fields=humanSkillEditorFieldsFromDraftV1(native);
 const authored=buildHumanSkillDraftV1({
  ...fields,id:"fire-wave",name:"Onde de feu",form:"projectile",
  presentation:{...fields.presentation,travelTrajectoryMode:"expanding_wave",
   waveStartRadiusPct:4,waveEndRadiusPct:80,waveThicknessPct:7}
 });
 assert.equal(authored.definition.projectileTargeting,"expanding_wave");
 assert.deepEqual(authored.definition.expandingWave,{startRadiusPct:4,endRadiusPct:80,thicknessPct:7});
 const transferred=importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(authored)).value.draft;
 assert.deepEqual(transferred,authored);
 const roundtripFields=humanSkillEditorFieldsFromDraftV1(transferred);
 assert.equal(roundtripFields.presentation.travelTrajectoryMode,"expanding_wave");
 assert.equal(roundtripFields.presentation.waveEndRadiusPct,80);
 assert.equal(native.definition.projectileTargeting,"direct");
});

test("uncontacted wave can never auto-hit at its travel deadline",()=>{
 const {session,clock:c,runtime,resolutions}=harness();
 const result=runtime.startSkill({actorId:"player",targetId:"opponent",skill:wave()});
 assert.equal(result.ok,true);
 c.setTime(1200);c.fireNext();
 assert.equal(session.snapshot().fighters.opponent.hp,100);
 assert.equal(resolutions.length,1);
 assert.equal(resolutions[0].outcome,"evaded");
 runtime.dispose();
});

test("an opaque-wave contact during expansion resolves exactly one hit from CombatRuntime",()=>{
 const {session,clock:c,runtime,resolutions}=harness();
 assert.equal(runtime.startSkill({actorId:"player",targetId:"opponent",skill:wave()}).ok,true);
 c.setTime(500);
 const contact=runtime.reportActionContact({actorId:"player",targetId:"opponent",skillId:"fire-wave"});
 assert.equal(contact.ok,true);
 assert.equal(contact.outcome,"contact_resolved");
 assert.equal(session.snapshot().fighters.opponent.hp,80);
 assert.equal(resolutions.length,1);
 assert.equal(resolutions[0].outcome,"hit");
 c.setTime(1200);c.fireNext();
 assert.equal(session.snapshot().fighters.opponent.hp,80);
 runtime.dispose();
});

test("visual + rules are coupled only for wave; old direct projectile, skyfall and target presence stay unchanged",()=>{
 const waveSkill=wave();
 assert.deepEqual(waveSkill.hitPresenceStates,["surface","airborne"]);
 const previous=fixture().draft.definition;
 const direct=normalizeSkillDefinition(previous);
 assert.equal(direct.projectileTargeting,"direct");
 assert.equal(direct.expandingWave,undefined);
 assert.deepEqual(direct.hitPresenceStates,["surface","airborne"]);
 const visualSource=readFileSync(new URL("../../src/adapters/renderer/dom-skill-fx.js",import.meta.url),"utf8");
 assert.match(visualSource,/sweptExpandingWaveHitsOpaqueMaskV1/);
 assert.match(visualSource,/onProjectileContact/);
 assert.match(visualSource,/node\.getBoundingClientRect\(\)/);
});
