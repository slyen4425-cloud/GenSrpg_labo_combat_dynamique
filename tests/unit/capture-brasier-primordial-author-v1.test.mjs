import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1,planCaptureTransferImportV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCaptureProgressionRulesV1} from "../../src/contracts/capture-progression-rules-v1.js";
import {buildCaptureEditorDatabaseV1,applyCaptureTransferPlanToEditorStateV1} from "../../src/ui/capture-editor-file-transfer-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const path="data/capture/showcase/cap_fire_atk_7.capture-skill-transfer-v1.json";
const read=async path=>readFile(new URL("../../"+path,import.meta.url),"utf8");
const load=async()=>importCaptureTransferJsonV1(await read(path));

test("Brasier primordial: exact author gameplay and independent all-enemies + reserve scopes",async()=>{
  const transfer=await load();
  assert.equal(transfer.kind,"skill");
  const d=transfer.value.draft,skill=d.definition;
  assert.equal(d.id,"cap_fire_atk_7");
  assert.equal(d.description,"Attaque Feu de puissance 10. Disponible au niveau 46.");
  assert.equal(d.requiredLevel,20); // Retain author description and requiredLevel as distinct fields.
  assert.deepEqual(d.usageScopes,["capture","combat"]);
  assert.equal(skill.name,"Brasier primordial");
  assert.equal(skill.form,"projectile");
  assert.equal(skill.projectileTargeting,"fixed_point");
  assert.equal(skill.loadoutSlot,"ultimate");
  assert.equal(skill.element,"fire");
  assert.equal(skill.energyCost,0);
  assert.equal(skill.preparationMs,3500);
  assert.equal(skill.travelMs,1000);
  assert.equal(skill.recoveryMs,0);
  assert.equal(skill.cooldownMs,0);
  assert.equal(skill.projectileClash.power,0);
  assert.equal(skill.dodgeable,true);
  assert.deepEqual(skill.effects.map(x=>({kind:x.kind,scope:x.targetScope,amount:x.amount,channel:x.channel})),[
    {kind:"damage",scope:"all_enemies",amount:50,channel:"fire"},
    {kind:"damage",scope:"all_enemy_reserves",amount:50,channel:null}
  ]);
});

test("Brasier primordial: 3 original meteorite 20-frame asset IDs and the native skyfall presentation remain intact",async()=>{
  const transfer=await load(),p=transfer.value.draft.presentation;
  assert.equal(p.subjectId,"cap_fire_atk_7");
  assert.equal(p.version,10);
  assert.equal(p.visual.cast.assetId,"pack:capture:sprite-fluide-meteorite-cast-01");
  assert.equal(p.visual.travel.assetId,"pack:capture:sprite-fluide-meteorite-projectile-01");
  assert.equal(p.visual.impact.assetId,"pack:capture:sprite-fluide-meteorite-impact-01");
  assert.equal(p.visual.cast.opacity,0.4);
  assert.equal(p.visual.travel.trajectoryMode,"skyfall");
  assert.equal(p.visual.travel.fallHeightPx,400);
  assert.equal(p.visual.travel.displayScale,2.5);
  assert.equal(p.visual.impact.displayScale,1.4);
  assert.equal(p.visual.impact.durationMs,800);
  assert.equal(p.visual.impact.opacity,0.7);
  assert.equal(p.feedback.projectileTrail.count,7);
  assert.equal(p.feedback.impactBurst.count,12);
  assert.equal(p.feedback.aftermathSmoke.count,6);
  assert.equal(p.feedback.cameraShake.amplitudePx,9);
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(transfer.value.draft)).value.draft,transfer.value.draft);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===path).length,1);
});

test("canonical Capture transfer replaces Brasier primordial once and preserves Dracendre loadout",async()=>{
  const registry=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
  const progression=normalizeCaptureProgressionRulesV1(JSON.parse(await read("data/capture/monster-capture-progression-rules.v1.json")));
  const dracendre=importCaptureTransferJsonV1(await read("data/capture/showcase/crea_dracendre.capture-creature-transfer-v1.json"),{statRegistry:registry}).value;
  const skillTransfer=await load();
  const creatureRecord={draft:dracendre.draft,loadout:dracendre.loadout,statValues:dracendre.statValues};
  const configuredCreatures=new Map([[dracendre.draft.id,creatureRecord]]);
  const oldSkill={...skillTransfer.value.draft,
    definition:{...skillTransfer.value.draft.definition,projectileTargeting:"direct"},
    presentation:null};
  const configuredSkills=new Map([["cap_fire_atk_7",oldSkill]]);
  const creatureBefore=JSON.stringify(configuredCreatures.get("crea_dracendre"));
  const beforeSize=configuredSkills.size;
  const plan=planCaptureTransferImportV1({
    currentDatabase:buildCaptureEditorDatabaseV1({
      statRegistry:registry,progressionRules:progression,
      configuredCreatures,configuredSkills,metadata:{producer:"brasier-author-regression"}
    }),
    transfer:skillTransfer,mode:"replace"
  });
  assert.equal(plan.action,"replace-skill");
  applyCaptureTransferPlanToEditorStateV1({
    plan,configuredCreatures,configuredSkills,statRegistry:registry,progressionRules:progression
  });
  assert.equal(configuredSkills.size,beforeSize);
  assert.deepEqual(configuredSkills.get("cap_fire_atk_7"),skillTransfer.value.draft);
  assert.equal(configuredSkills.get("cap_fire_atk_7").presentation.version,10);
  assert.equal(JSON.stringify(configuredCreatures.get("crea_dracendre")),creatureBefore);
  assert.ok(dracendre.loadout.slots.some(slot=>slot.skillId==="cap_fire_atk_7"));
});
