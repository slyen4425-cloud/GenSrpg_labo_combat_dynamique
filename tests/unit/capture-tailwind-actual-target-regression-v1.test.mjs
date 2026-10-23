import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { combatSkillTargetOptionsV1,resolveCombatSkillClickTargetV1 } from "../../src/ui/combat-2v2-test-ui.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createDomStatusFxRenderer } from "../../src/adapters/renderer/dom-status-fx.js";

const skillPath=new URL("../../data/capture/showcase/lib_tailwind.capture-skill-transfer-v1.json",import.meta.url);
const airPath=new URL("../../data/capture/showcase/cap_air_atk_3.capture-skill-transfer-v1.json",import.meta.url);
const creaturePath=new URL("../../data/capture/showcase/crea_ailevent.capture-creature-transfer-v1.json",import.meta.url);
const tailwind=importCaptureTransferJsonV1(fs.readFileSync(skillPath,"utf8")).value.draft.definition;
const air=importCaptureTransferJsonV1(fs.readFileSync(airPath,"utf8")).value.draft;
const ailevent=JSON.parse(fs.readFileSync(creaturePath,"utf8"));
const fighter=id=>({id,maxHp:200,initialHp:200,maxEnergy:25,initialEnergy:20,energyChargeAmount:2,energyChargeIntervalMs:1000,statValuesById:{speed:20,defense:10},statEffectRulesById:{speed:{chargeTimeReductionPctPerPoint:1},defense:{damageReductionPctPerPoint:0.2}}});
const format={actors:[{actorId:"local-1"},{actorId:"local-2"},{actorId:"opponent-1"}],teamOf(id){return id.startsWith("local")?"local-team":"enemy-team"}};
const state={fighters:{"local-1":{hp:200},"local-2":{hp:200},"opponent-1":{hp:200}}};
function doc(){const d={createElement(){const e={dataset:{},style:{},children:[],ownerDocument:d,append(...xs){this.children.push(...xs)},remove(){this.removed=true},setAttribute(){}};return e}};return d}

test("Vent arrière always auto-targets its caster when an enemy is selected (1v1 and 2v2)",()=>{
 assert.deepEqual(tailwind.targetRelations,["self"],"A support self buff must not accept enemy as the implicit selected target");
 assert.deepEqual(tailwind.effects.map(x=>x.targetScope),["self","self","self","self"],"3 bonuses and defense tradeoff must remain together");
 for(const present of [format.actors,[format.actors[0],format.actors[2]]]){
  const f={...format,actors:present};
  const candidates=combatSkillTargetOptionsV1({format:f,actorId:"local-1",skill:tailwind,state,previewSkill:()=>({ok:true})});
  assert.deepEqual(candidates.availableIds,["local-1"]);
  assert.equal(resolveCombatSkillClickTargetV1({actorId:"local-1",skill:tailwind,selectedTargetId:"opponent-1",availableIds:candidates.availableIds}),"local-1");
 }
});
test("actual button target then CombatSession show four statuses on player and zero on enemy",()=>{
 const options=combatSkillTargetOptionsV1({format,actorId:"local-1",skill:tailwind,state,previewSkill:()=>({ok:true})});
 const targetId=resolveCombatSkillClickTargetV1({actorId:"local-1",skill:tailwind,selectedTargetId:"opponent-1",availableIds:options.availableIds});
 assert.equal(targetId,"local-1");
 const session=createCombatSession({fighters:[fighter("local-1"),fighter("opponent-1")]});
 const start=session.startSkill({actorId:"local-1",targetId,skill:tailwind});
 assert.equal(start.ok,true);
 session.advanceMs(1600);
 assert.equal(session.completeSkill({action:start.action}).ok,true);
 const snapshot=session.snapshot();
 assert.equal(snapshot.fighters["local-1"].statusEffects.length,4);
 assert.equal(snapshot.fighters["opponent-1"].statusEffects.length,0);
 const document=doc(), statusHost={dataset:{},style:{},children:[],ownerDocument:document,append(...xs){this.children.push(...xs)}};
 const motion={ownerDocument:document,style:{}},image={ownerDocument:document,style:{},src:"https://example.test/test.webp"};
 const renderer=createDomStatusFxRenderer({targetFor:()=>({motion,image,statusHost}),statusPresentationFor:()=>null,skillDefinitionFor:()=>tailwind});
 renderer.sync(snapshot);
 assert.equal(statusHost.children.filter(x=>x.dataset.statusFx==="hud-icon"&&!x.removed).length,4);
 renderer.dispose();
});
test("Ailevent's assigned Charge aérienne remains configured; the other slots must keep their identifiers",()=>{
 assert.deepEqual(ailevent.loadout.slots.map(x=>x.skillId),["lib_gust","cap_air_atk_3","lib_tailwind","cap_air_atk_4","cap_air_atk_7"]);
 assert.equal(air.definition.id,"cap_air_atk_3");
 assert.equal(air.definition.form,"contact");
 assert.equal(air.definition.approachMode,"aerial");
 assert.equal(air.definition.effects[0].amount,15);
 assert.equal(air.presentation.visual.cast.assetId,"pack:capture:sprite-air-wind-charge-01");
 assert.equal(air.presentation.visual.cast.displayScale,2.5);
 assert.equal(air.presentation.visual.cast.opacity,0.2);
 assert.equal(air.presentation.audio.cast.assetId,"gensrpg:sound:tower-ccc16d37");
 assert.equal(air.presentation.audio.impact.assetId,"gensrpg:sound:effect-ee93278c");
});
