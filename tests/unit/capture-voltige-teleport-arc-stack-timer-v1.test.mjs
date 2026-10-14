import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 as creatures } from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as skills } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { importCaptureTransferJsonV1, exportCaptureCreatureTransferJsonV1, exportCaptureSkillTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { projectStatusEffectInfoV1 } from "../../src/adapters/renderer/status-effect-info-v1.js";

const at = p => readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const skillPath="data/capture/showcase/teleport-strike.capture-skill-transfer-v1.json";
const creaturePath="data/capture/showcase/crea_voltik.capture-creature-transfer-v1.json";
const arcPath="data/capture/showcase/lib_chain_lightning.capture-skill-transfer-v1.json";
const registry=normalizeCaptureStatRegistryV1(JSON.parse(at("data/capture/monster-capture-stat-registry.v1.json")));

test("The official single-source showcase catalogs contain exactly one teleport strike and Voltige",()=>{
 assert.equal(skills.filter(p=>p===skillPath).length,1);
 assert.equal(creatures.filter(p=>p===creaturePath).length,1);
 assert.equal(new Set(skills).size,skills.length);
 assert.equal(new Set(creatures).size,creatures.length);
});
test("Voltige authored transfer replaces its previous entry without mutating other creature fields",()=>{
 const raw=JSON.parse(at(creaturePath)),tr=importCaptureTransferJsonV1(JSON.stringify(raw),{statRegistry:registry});
 assert.equal(tr.kind,"creature");
 assert.equal(tr.value.draft.id,"crea_voltik");
 assert.equal(tr.value.draft.presentation.profileId,"biped");
 assert.equal(tr.value.draft.combat.approachTimeModifierPct,-40);
 assert.equal(tr.value.statValues.values.health,120);
 assert.ok(tr.value.draft.skillIds.includes("teleport-strike"));
 assert.deepEqual(tr.value.loadout.slots.map(x=>x.skillId),["teleport-strike","lib_static_bite","lib_chain_lightning","dodge","cap_electric_special_2"]);
 assert.deepEqual(tr.value.draft.presentation.sockets,raw.draft.presentation.sockets);
 assert.deepEqual(importCaptureTransferJsonV1(exportCaptureCreatureTransferJsonV1(tr.value,{statRegistry:registry}),{statRegistry:registry}).value,tr.value);
});
test("Teleport strike author data survives official import/export and is discoverable",()=>{
 const raw=JSON.parse(at(skillPath)),tr=importCaptureTransferJsonV1(JSON.stringify(raw));
 assert.equal(tr.kind,"skill");
 assert.equal(tr.value.draft.id,"teleport-strike");
 assert.equal(tr.value.draft.definition.approachMode,"teleport");
 assert.equal(tr.value.draft.definition.form,"contact");
 assert.equal(tr.value.draft.definition.effects[0].amount,24);
 assert.equal(tr.value.draft.definition.energyCost,3);
 assert.equal(tr.value.draft.definition.cooldownMs,0);
 assert.equal(tr.value.draft.presentation.visual.icon.assetId,"core:icon-skill-teleport-strike-01");
 assert.equal(tr.value.draft.presentation.audio.travel.assetId,"gensrpg:sound:tower-6dbf268f");
 assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(tr.value.draft)).value,tr.value);
});
test("Arc électrique remains an authored beam with real native power 2 and unchanged presentation",()=>{
 const s=importCaptureTransferJsonV1(at(arcPath)).value.draft;
 assert.equal(s.id,"lib_chain_lightning");
 assert.equal(s.definition.projectileClash.power,2);
 assert.equal(s.definition.effects[0].amount,20);
 assert.equal(s.definition.effects[0].ignoreDamageReductionPct,30);
 assert.equal(s.definition.effects[1].status.durationMs,3000);
 assert.equal(s.presentation.visual.travel.assetId,"pack:capture:sprite-electric-yellow-beam-body-01");
 assert.equal(s.presentation.feedback.glow.strength,0.85);
 assert.equal(s.presentation.audio.travel.assetId,"gensrpg:sound:genrpg-pack2-c3350e1b");
});
test("Stack threshold timer uses native status expiry; no independent stack clocks",()=>{
 const instance={sourceActorId:"a",sourceSkillId:"lib_static_bite",appliedAtMs:3000,expiresAtMs:13000,remainingActionEnds:null,nextTickAtMs:null,stacks:2,shieldRemaining:null,
 definition:{id:"status-2",kind:"stack_counter",polarity:"detrimental",durationModel:"time_ms",durationMs:10000,stacking:"stack",maxStacks:3,tags:[],onStackThreshold:{count:3,consume:"reset",effects:[{kind:"damage",targetScope:"target",amount:1,channel:"electric"}]}}};
 const now=projectStatusEffectInfoV1({instance,elapsedMs:5000});
 const later=projectStatusEffectInfoV1({instance,elapsedMs:11000});
 assert.equal(now.remainingLabel,"8 s");
 assert.equal(later.remainingLabel,"2 s");
 assert.equal(now.stacksLabel,"2 / 3");
 const renderer=at("src/adapters/renderer/dom-status-fx.js");
 const css=at("examples/dom-demo/demo.css");
 assert.match(renderer,/status-icon__expiry/);
 assert.match(renderer,/instance\?\.definition\?\.onStackThreshold\?\.count/);
 assert.match(renderer,/info\.remainingLabel/);
 assert.doesNotMatch(renderer,/setInterval|setTimeout/);
 assert.match(css,/\.status-icon__expiry\s*\{/);
});

test("Real HUD shows the actual shared remaining lifetime alongside 2/3 then 1/3 and removes on expiry",async()=>{
 const {createDomStatusFxRenderer}=await import("../../src/adapters/renderer/dom-status-fx.js");
 const doc={createElement(){const n={className:"",dataset:{},style:{},hidden:false,textContent:"",children:[],append(...c){this.children.push(...c)},remove(){this.removed=true},setAttribute(){}};n.ownerDocument=doc;return n}};
 const statusHost=doc.createElement("div");
 const renderer=createDomStatusFxRenderer({targetFor:()=>({statusHost}),statusPresentationFor:()=>null,skillPresentationFor:()=>null,skillDefinitionFor:()=>null});
 const definition={id:"stack",kind:"stack_counter",polarity:"detrimental",durationModel:"time_ms",durationMs:10000,stacking:"stack",maxStacks:3,tags:[],onStackThreshold:{count:3,consume:"reset",effects:[{kind:"damage",targetScope:"target",amount:1,channel:"electric"}]}};
 const status=(stacks,expiresAtMs)=>({definition,sourceActorId:"enemy",sourceSkillId:"lib_static_bite",stacks,appliedAtMs:1000,expiresAtMs});
 const sync=(elapsedMs,instances)=>renderer.sync({elapsedMs,fighters:{enemy:{statusEffects:instances}}});
 sync(2000,[status(2,10000)]);
 const icon=statusHost.children[0];
 let badge=icon.children.find(c=>c.className==="status-icon__expiry");
 let count=icon.children.find(c=>c.className==="status-icon__stack");
 assert.equal(badge.textContent,"8 s");
 assert.equal(count.textContent,"2/3");
 sync(4000,[status(2,10000)]);
 assert.equal(badge.textContent,"6 s");
 // The native Runtime refreshes the shared expiry on a newly acquired charge.
 sync(5000,[status(3,15000)]);
 assert.equal(badge.textContent,"10 s");
 assert.equal(count.textContent,"3/3");
 sync(9000,[status(1,15000)]);
 assert.equal(badge.textContent,"6 s");
 assert.equal(count.textContent,"1/3");
 sync(15000,[]);
 assert.equal(icon.removed,true);
 renderer.dispose();
});
