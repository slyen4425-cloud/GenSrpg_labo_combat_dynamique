import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {markerStatusDefinitionV1} from "../../src/contracts/capture-marker-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {applyImmediateTacticalEffectsV1} from "../../src/core/combat/immediate-tactical-effects-v1.js";
import {applyStatusEffectV1} from "../../src/core/combat/status-effect-runtime-v1.js";

const read=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const path="data/capture/showcase/cap_poison_atk_7.capture-skill-transfer-v1.json";
const archive="data/capture/source-exports/cap_poison_atk_7.author-export-2026-10-25.json";
const creaturePath="data/capture/showcase/crea_tox_2.capture-creature-transfer-v1.json";
const draft=()=>importCaptureTransferJsonV1(read(path)).value.draft;

test("Fléau primordial: exact authored transfer active once and archived byte-for-byte",()=>{
  assert.equal(read(path),read(archive));
  assert.equal(Buffer.byteLength(read(path),"utf8"),5345);
  assert.equal(createHash("sha256").update(read(path)).digest("hex"),
    "5632ddd70f6c6b082dd66187f1c9fba71c215fda0b1063fba2d5fa01a67f861e");
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===path).length,1);
  assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
  assert.equal(draft().id,"cap_poison_atk_7");
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft())).value.draft,draft());
});
test("Fléau primordial: exact ultimate requirements, marker mechanics and presentation",()=>{
  const raw=JSON.parse(read(path)).draft;
  const d=draft();
  assert.deepEqual(d,raw);
  assert.doesNotThrow(()=>normalizeSkillDefinition(d.definition));
  assert.equal(d.requiredLevel,20);
  assert.equal(d.definition.name,"Fléau primordial");
  assert.equal(d.definition.loadoutSlot,"ultimate");
  assert.equal(d.definition.preparationMs,1500);
  assert.equal(d.definition.travelMs,900);
  assert.equal(d.definition.energyCost,8);
  assert.equal(d.definition.maxUsesPerCombat,1);
  assert.equal(d.definition.projectileClash.power,2);
  assert.equal(d.definition.effects.length,1);
  const effect=d.definition.effects[0];
  assert.equal(effect.kind,"apply_marker");
  assert.equal(effect.charges,6);
  assert.equal(effect.marker.id,"poison");
  assert.equal(effect.marker.durationMs,25000);
  assert.equal(effect.marker.maxStacks,30);
  assert.equal(effect.marker.periodic.amount,5);
  assert.equal(effect.marker.periodic.intervalMs,5000);
  assert.equal(effect.marker.periodic.channel,"physical");
  assert.equal(d.presentation.visual.icon.assetId,"pack:capture:icon-skill-tempete-acide-01");
  assert.equal(d.presentation.visual.cast.assetId,"pack:capture:sprite-crachat-acide-impact-01");
  assert.equal(d.presentation.visual.travel.assetId,"pack:capture:sprite-crachat-acide-projectile-01");
  assert.equal(d.presentation.visual.impact.assetId,"pack:capture:sprite-crachat-acide-aura-01");
  assert.equal(d.presentation.feedback.cameraShake.amplitudePx,9);
  assert.equal(d.presentation.feedback.projectileTrail.count,7);
  assert.equal(d.presentation.feedback.impactBurst.count,12);
});
test("Venombre equips new unique ultimate and keeps four previous author skill slots",()=>{
  const c=JSON.parse(read(creaturePath));
  assert.equal(c.draft.id,"crea_tox_2");
  assert.deepEqual(c.loadout.slots.map(slot=>slot.skillId),[
    "cap_poison_atk_2","cap_poison_atk_3","cap_poison_special_2","cap_poison_atk_6","cap_poison_atk_7"
  ]);
  assert.equal(c.loadout.slots[4].id,"slot-ultimate");
});
test("Fléau primordial applies exactly six native Poison stacks to its target",()=>{
  const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,
    energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0});
  const state=createCombatState({fighters:[fighter("a"),fighter("b")]});
  const skill=draft().definition;
  const result=applyImmediateTacticalEffectsV1({state,actorId:"a",targetId:"b",skill,atMs:0,combatAtMs:0});
  assert.ok(result.state.fighters.b.statusEffects.some(x=>
    x.definition.id==="marker:poison" && x.stacks===6),"six native stacks");
  assert.equal(result.state.fighters.a.statusEffects.length,0);
});
