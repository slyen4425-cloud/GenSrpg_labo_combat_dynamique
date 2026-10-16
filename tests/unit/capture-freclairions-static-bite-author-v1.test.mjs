import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1, exportCaptureCreatureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";
import { CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { buildCaptureEditorDatabaseV1, applyCaptureTransferBatchToEditorStateV1 } from "../../src/ui/capture-editor-file-transfer-v1.js";
import { importMonsterCaptureCreatureRecordV1 } from "../../src/adapters/input/capture/monster-capture-creature-import-v1.js";
import { importMonsterCaptureStatValuesV1 } from "../../src/adapters/input/capture/monster-capture-stat-values-v1.js";
import { buildCaptureCreatureHistoricalLoadoutV1 } from "../../src/catalogs/capture-creature-historical-loadout-v1.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { normalizeCaptureSkillEditorDraftV1 } from "../../src/contracts/capture-skill-editor-draft-v1.js";
import { capturePortableNativeSkillDraftsV1 } from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import { captureComplexNativeSkillDraftsV1 } from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";

const creaturePath = "data/capture/showcase/crea_foudrillon.capture-creature-transfer-v1.json";
const skillPath = "data/capture/showcase/lib_static_bite.capture-skill-transfer-v1.json";
const read = path => readFileSync(new URL("../../" + path, import.meta.url));
const json = path => JSON.parse(read(path));
const sha256 = data => createHash("sha256").update(data).digest("hex");
const registry = normalizeCaptureStatRegistryV1(json("data/capture/monster-capture-stat-registry.v1.json"));
const progressionRules = normalizeCaptureProgressionRulesV1(json("data/capture/monster-capture-progression-rules.v1.json"));
const creature = () => importCaptureTransferJsonV1(read(creaturePath).toString("utf8"), {statRegistry:registry});
const skill = () => importCaptureTransferJsonV1(read(skillPath).toString("utf8"));

test("Freclairions + Crocs statiques retain the exact uploaded author files and unique stable IDs",()=>{
  assert.equal(read(creaturePath).length,4983);
  assert.equal(sha256(read(creaturePath)),"7f13981162c99acd08420575ab4ec11eb98c37f2e555cbea5d178a0cab055b41");
  assert.equal(read(skillPath).length,4163);
  assert.equal(sha256(read(skillPath)),"4e49c4e48fc83727d100c5beabc3df72c12e7e121376dfdb260de7c1be6b3a99");
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(p=>p===creaturePath).length,1);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===skillPath).length,1);
  assert.equal(new Set(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.length);
  assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
  assert.equal(creature().kind,"creature");
  assert.equal(skill().kind,"skill");
  assert.deepEqual(
    importCaptureTransferJsonV1(exportCaptureCreatureTransferJsonV1(creature().value,{statRegistry:registry}),{statRegistry:registry}).value,
    creature().value
  );
  assert.deepEqual(
    importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(skill().value.draft)).value,
    skill().value
  );
});

test("Crocs statiques preserves author's 8 electric damage, stun after 3 stacks and real effects",()=>{
  const d=skill().value.draft,def=d.definition,p=d.presentation;
  assert.equal(d.id,"lib_static_bite");
  assert.equal(d.description,"Morsure électrique.");
  assert.equal(d.requiredLevel,5);
  assert.equal(def.name,"Crocs statiques");
  assert.equal(def.element,"electric");
  assert.equal(def.form,"contact");
  assert.equal(def.approachMode,"ground");
  assert.equal(def.energyCost,3);
  assert.equal(def.preparationMs,600);
  assert.equal(def.travelMs,600);
  assert.equal(def.cooldownMs,6000);
  assert.equal(def.effects[0].amount,8);
  assert.equal(def.effects[0].targetScope,"target");
  assert.equal(def.effects[0].channel,"electric");
  const stacks=def.effects[1].status;
  assert.equal(stacks.kind,"stack_counter");
  assert.equal(stacks.durationMs,10000);
  assert.equal(stacks.maxStacks,3);
  assert.equal(stacks.onStackThreshold.count,3);
  assert.equal(stacks.onStackThreshold.consume,"reset");
  assert.equal(stacks.onStackThreshold.effects[0].status.kind,"stun");
  assert.equal(stacks.onStackThreshold.effects[0].status.durationMs,3000);
  assert.equal(p.visual.icon.assetId,"pack:capture:icon-skill-croc-electrique-01");
  assert.equal(p.visual.impact.assetId,"pack:capture:sprite-impact-electric-01");
  assert.equal(p.audio.impact.assetId,"gensrpg:sound:genrpg-pack2-af938ec6");
});

test("Freclairions preserves authored historical ID, 22 learned entries, five slots and exact presentation",()=>{
  const c=creature().value,d=c.draft;
  assert.equal(d.id,"crea_foudrillon");
  assert.equal(d.displayName,"Freclairions");
  assert.equal(d.description,"Frelon électrique.");
  assert.equal(d.level,1);
  assert.deepEqual(d.elements,["air","electric"]);
  assert.deepEqual(d.sourceStats,{force:25,agility:44,intelligence:0,spirit:27,endurance:16,initiative:53});
  assert.equal(d.resistances.find(x=>x.kind==="element:earth").value,-50);
  assert.equal(d.resistances.find(x=>x.kind==="element:air").value,35);
  assert.equal(d.resistances.find(x=>x.kind==="element:electric").value,35);
  assert.equal(d.capture.captureRate,17);
  assert.equal(d.capture.spawnChance,2);
  assert.equal(d.combat.maxHp,120);
  assert.equal(d.combat.maxEnergy,0);
  assert.equal(d.combat.approachTimeModifierPct,-40);
  assert.equal(c.statValues.values.health,120);
  assert.equal(c.statValues.values.speed,15);
  assert.equal(d.skillIds.length,22);
  assert.ok(d.skillIds.includes("lib_static_bite"));
  assert.deepEqual(c.loadout.slots.map(x=>x.skillId),
    ["lib_gust","lib_static_bite","lib_tailwind","lib_chain_lightning","cap_air_atk_7"]);
  assert.equal(d.presentation.profileId,"flying");
  assert.equal(d.presentation.visual.front.assetId,"pack:capture:creature-guepe-cybernetique-opponent-01");
  assert.equal(d.presentation.visual.back.assetId,"pack:capture:creature-guepe-cybernetique-player-01");
  assert.equal(d.presentation.visual.icon.assetId,"pack:capture:creature-guepe-cybernetique-icon-01");
  assert.equal(d.presentation.visual.dodge.assetId,"pack:capture:sprite-electric-yellow-beam-impact-01");
  assert.equal(d.presentation.sockets.length,1);
  assert.equal(d.presentation.sockets[0].id,"mouth");
  assert.equal(d.presentation.sockets[0].front.x,0.30824741971900577);
  assert.equal(d.presentation.sockets[0].back.x,0.6896906945737669);
  assert.equal(d.presentation.audio.movement.assetId,"gensrpg:sound:effect-79dd62d8");
  assert.equal(d.presentation.audio.movement.mode,"loop");
});

test("canonical Transfer batch replaces the native Foudrillon and skill without duplication or moved equipment",()=>{
  const native=json("data/combat/skills/catalog.v1.json");
  const configuredSkills=new Map();
  for(const entry of native.entries) {
    const definition=normalizeSkillDefinition(entry.definition);
    const draft=normalizeCaptureSkillEditorDraftV1({schema:"capture-skill-editor-draft-v1",
      id:definition.id,description:"Natif",requiredLevel:1,
      usageScopes:["capture","combat"],definition,presentation:null});
    configuredSkills.set(draft.id,draft);
  }
  for(const draft of capturePortableNativeSkillDraftsV1()) if(!configuredSkills.has(draft.id)) configuredSkills.set(draft.id,draft);
  for(const draft of captureComplexNativeSkillDraftsV1()) if(!configuredSkills.has(draft.id)) configuredSkills.set(draft.id,draft);
  for(const file of CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1){
    const draft=importCaptureTransferJsonV1(read(file).toString("utf8")).value.draft;
    configuredSkills.set(draft.id,draft);
  }
  const historical=json("data/capture/monster-capture-creatures.v1.json").entries.filter(x=>x.id==="crea_foudrillon");
  assert.equal(historical.length,1);
  assert.equal(historical[0].name,"Foudrillon");
  const imported=importMonsterCaptureCreatureRecordV1(historical[0]);
  const builtLoadout=buildCaptureCreatureHistoricalLoadoutV1({
    creatureId:imported.draft.id,level:imported.draft.level,
    abilityIds:imported.draft.skillIds,
    runtimeSkillIds:new Set(configuredSkills.keys())
  });
  const configuredCreatures=new Map([["crea_foudrillon",{
    draft:imported.draft,
    statValues:importMonsterCaptureStatValuesV1(historical[0],registry),
    loadout:builtLoadout.loadout
  }]]);
  const beforeCreatureSize=configuredCreatures.size;
  const authorSkill=skill().value.draft;
  // Recreate the already published pre-import skill, not the new
  // showcase file; otherwise the canonical planner rightly says noop.
  const oldSkill=normalizeCaptureSkillEditorDraftV1({
    ...authorSkill,
    definition:{
      ...authorSkill.definition,
      effects: authorSkill.definition.effects.map((effect,index)=>
        index===0?{...effect,amount:4}:effect
      )
    },
    presentation:{
      ...authorSkill.presentation,
      visual:{
        ...authorSkill.presentation.visual,
        icon:{assetId:"pack:capture:icon-skill-burning-bite-01"}
      }
    }
  });
  configuredSkills.set("lib_static_bite",oldSkill);
  const beforeSkillSize=configuredSkills.size;
  const action=applyCaptureTransferBatchToEditorStateV1({
    transfers:[skill(),creature()],configuredCreatures,configuredSkills,
    statRegistry:registry,progressionRules,mode:"replace"
  });
  assert.deepEqual(action.actions.map(x=>x.id),["lib_static_bite","crea_foudrillon"]);
  assert.deepEqual(action.actions.map(x=>x.action),["replace-skill","replace-creature"]);
  assert.equal(configuredCreatures.size,beforeCreatureSize);
  assert.equal(configuredSkills.size,beforeSkillSize);
  assert.deepEqual(configuredCreatures.get("crea_foudrillon"),creature().value);
  assert.deepEqual(configuredSkills.get("lib_static_bite"),skill().value.draft);
  assert.deepEqual(configuredCreatures.get("crea_foudrillon").loadout.slots.map(x=>x.skillId),
    ["lib_gust","lib_static_bite","lib_tailwind","lib_chain_lightning","cap_air_atk_7"]);
  const database=buildCaptureEditorDatabaseV1({
    statRegistry:registry,progressionRules,configuredCreatures,configuredSkills
  });
  assert.equal(database.creatures.filter(x=>x.draft.id==="crea_foudrillon").length,1);
  assert.equal(database.skills.filter(x=>x.id==="lib_static_bite").length,1);
});
