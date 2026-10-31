import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
const data=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
function skill(patch={}){const f=data("data/combat/skills/fireball.skill.json");return normalizeSkillDefinition({
 ...f,id:"stage-pay-test",name:"Charge test",preparationMs:100,travelMs:100,recoveryMs:0,cooldownMs:0,energyCost:1,
 effect:{damage:0,heal:0,stunMs:0,interruptsPreparation:false,tags:[]},effects:[],
 chargedAttack:{baseDamage:3,bonusDamagePerCharge:3,maxCharges:3,reactivationWindowMs:200,sizeIncreasePct:10},...patch
});}
function fixture(energy=10){
 let nowMs=0,released=[];const session=createCombatSession({distance:"medium",fighters:[
 {...data("data/combat/fighters/maraileron.combat.json"),initialEnergy:energy,energyChargeIntervalMs:1000000},
 {...data("data/combat/fighters/braisombre.combat.json"),initialEnergy:0}
 ]});
 const runtime=createCombatRuntime({session,now:()=>nowMs,setTimer:()=>123,clearTimer:()=>{},onRelease:e=>released.push(e)});
 const advance=ms=>{nowMs+=ms;runtime.advanceToNow?.();};
 return {session,runtime,released,advance,now:()=>nowMs};
}
test("spam presses never add a charge until its full cast stage finishes",()=>{
 const {session,runtime,advance}=fixture(),s=skill();
 assert.equal(runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:s}).outcome,"started");
 assert.equal(session.snapshot().fighters.maraileron.energy,9);
 for(let i=0;i<20;i++){
   const denied=runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:s});
   assert.equal(denied.outcome,"charge_preparing");
 }
 assert.equal(runtime.activeActionFor("maraileron").chargeState.chargeCount,1);
 assert.equal(session.snapshot().fighters.maraileron.energy,9);
 advance(99);assert.equal(runtime.previewChargedSkillRetrigger({actorId:"maraileron",skillId:s.id}).outcome,"charge_preparing");
 advance(1);
 assert.equal(runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:s}).chargeCount,2);
 assert.equal(session.snapshot().fighters.maraileron.energy,8,"second successful tap costs 1 extra energy");
 assert.equal(runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:s}).outcome,"charge_preparing");
 advance(100);
 assert.equal(runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:s}).chargeCount,3);
 assert.equal(session.snapshot().fighters.maraileron.energy,7);
 assert.equal(runtime.activeActionFor("maraileron").releaseAtMs,300,"max charge still requires completion of final cast stage");
 runtime.dispose();
});
test("insufficient energy cannot grant free size or damage, nor double-charge per rejected press",()=>{
 const {session,runtime,advance}=fixture(1),s=skill();
 runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:s});
 assert.equal(session.snapshot().fighters.maraileron.energy,0);
 advance(100);
 for(let i=0;i<4;i++)assert.equal(runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill:s}).outcome,"insufficient_energy");
 assert.equal(runtime.activeActionFor("maraileron").chargeState.chargeCount,1);
 assert.equal(runtime.activeActionFor("maraileron").chargeState.sizeMultiplier,1);
 assert.equal(session.snapshot().fighters.maraileron.energy,0);
 runtime.dispose();
});
test("authored Boule de neige is a single canonical showcased transfer, intact settings and visuals",()=>{
 const path="data/capture/showcase/boule_neige.capture-skill-transfer-v1.json";
 assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===path).length,1);
 const transfer=data(path);
 assert.equal(transfer.draft.id,"boule_neige");
 assert.equal(transfer.draft.definition.energyCost,1);
 assert.equal(transfer.draft.definition.preparationMs,800);
 assert.deepEqual(transfer.draft.definition.chargedAttack,{baseDamage:3,bonusDamagePerCharge:3,maxCharges:10,reactivationWindowMs:700,sizeIncreasePct:10});
 assert.equal(transfer.draft.presentation.visual.cast.assetId,"pack:capture:sprite-boule-de-neige-cast-01");
 assert.equal(transfer.draft.presentation.visual.travel.assetId,"pack:capture:sprite-boule-de-neige-projectile-01");
 assert.equal(transfer.draft.presentation.visual.impact.assetId,"pack:capture:sprite-boule-de-neige-impact-01");
});
