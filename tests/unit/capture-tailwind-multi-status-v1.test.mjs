import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { projectStatusEffectInfoV1 } from "../../src/adapters/renderer/status-effect-info-v1.js";
import { buildHumanTacticalSkillEffectsV1, nextHumanTacticalStatusIdV1 } from "../../src/ui/capture-editor-human-v2.js";
import { createDomStatusFxRenderer } from "../../src/adapters/renderer/dom-status-fx.js";

const raw=readFileSync(new URL("../../data/capture/showcase/lib_tailwind.capture-skill-transfer-v1.json",import.meta.url),"utf8");
const exported=importCaptureTransferJsonV1(raw).value.draft;
const skill=exported.definition;
const fighter=id=>({
 id,maxHp:200,initialHp:200,maxEnergy:25,initialEnergy:20,
 energyChargeAmount:2,energyChargeIntervalMs:1000,
 statValuesById:{speed:20,defense:10},
 statEffectRulesById:{speed:{chargeTimeReductionPctPerPoint:1},defense:{damageReductionPctPerPoint:0.2}}
});
function fakeNode(){return {className:"",dataset:{},style:{},textContent:"",title:"",hidden:false,children:[],ownerDocument:null,append(...x){this.children.push(...x)},remove(){this.removed=true},setAttribute(k,v){this.attributes??={};this.attributes[k]=String(v)}}}
function fakeDocument(){const doc={createElement(){const node=fakeNode();node.ownerDocument=doc;return node}};return doc;}

test("Vent arrière retains four distinct status definitions and current author values",()=>{
 assert.equal(skill.id,"lib_tailwind");
 assert.deepEqual(skill.targetRelations,["self"]);
 assert.deepEqual(skill.effects.map(x=>x.targetScope),["self","self","self","self"]);
 assert.equal(skill.effects.length,4);
 assert.equal(new Set(skill.effects.map(x=>x.status.id)).size,4,"status IDs must be unique per skill to avoid runtime replacement");
 assert.deepEqual(skill.effects.map(x=>x.status.kind),[
  "stat_modifier","skill_cooldown_rate_modifier","energy_regen_modifier","stat_modifier"
 ]);
 assert.deepEqual(skill.effects.map(x=>x.status.durationMs),[15000,15000,15000,15000]);
 assert.equal(skill.effects[0].status.deltaPoints,30);
 assert.equal(skill.effects[1].status.modifierPct,150);
 assert.equal(skill.effects[2].status.modifierPct,100);
 assert.equal(skill.effects[3].status.deltaPoints,-100);
});

test("real CombatSession applies all 4 effects on same actor and HUD exposes 4 independent icons",()=>{
 const session=createCombatSession({fighters:[fighter("player"),fighter("opponent")]});
 const started=session.startSkill({actorId:"player",targetId:"player",skill});
 assert.equal(started.ok,true);
 session.advanceMs(1600);
 const completed=session.completeSkill({action:started.action});
 assert.equal(completed.ok,true,"combat runtime completes the queued cast explicitly");
 const state=session.snapshot();
 const statuses=state.fighters.player.statusEffects;
 assert.equal(statuses.length,4,"same-ID status previously erased its siblings");
 assert.equal(new Set(statuses.map(x=>x.definition.id)).size,4);
 const kinds=new Set(statuses.map(x=>x.definition.kind));
 for(const kind of ["stat_modifier","skill_cooldown_rate_modifier","energy_regen_modifier"])assert.ok(kinds.has(kind));
 const details=statuses.map(instance=>projectStatusEffectInfoV1({instance,elapsedMs:state.elapsedMs,fighter:state.fighters.player,sourceSkill:skill}));
 assert.equal(details.length,4);
 assert.ok(details.some(x=>x.effectLines?.some(s=>s.includes("recharge"))));
 assert.ok(details.some(x=>x.effectLines?.some(s=>s.includes("Énergie"))));
 const doc=fakeDocument(),statusHost=fakeNode(),motion=fakeNode(),image=fakeNode();
 for(const el of [statusHost,motion,image])el.ownerDocument=doc;
 image.src="https://example.test/creature.webp";
 const renderer=createDomStatusFxRenderer({targetFor:()=>({motion,image,statusHost}),statusPresentationFor:()=>null,skillDefinitionFor:()=>skill});
 renderer.sync(state);
 assert.equal(statusHost.children.filter(x=>!x.removed&&x.dataset.statusFx==="hud-icon").length,4);
 renderer.dispose();
});

test("Human Editor allocates unique new IDs and rejects manually colliding active effects",()=>{
 assert.equal(nextHumanTacticalStatusIdV1([]),"status-1");
 assert.equal(nextHumanTacticalStatusIdV1(["status","status-1","status-3"]),"status-2");
 assert.deepEqual(buildHumanTacticalSkillEffectsV1(skill.effects).map(x=>x.status.id),skill.effects.map(x=>x.status.id));
 const copy=skill.effects.map(x=>structuredClone(x));
 copy[2].status.id=copy[1].status.id;
 assert.throws(()=>buildHumanTacticalSkillEffectsV1(copy),/même identifiant|identifiant.*déjà utilisé/i);
});
