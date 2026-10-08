import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import {
  importCaptureTransferJsonV1,
  exportCaptureSkillTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { capturePortableNativeSkillDraftsV1 } from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import { captureComplexNativeSkillDraftsV1 } from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { planCaptureTransferImportV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { buildCaptureEditorDatabaseV1, applyCaptureTransferPlanToEditorStateV1 } from "../../src/ui/capture-editor-file-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";

const FILE = "data/capture/showcase/cap_water_atk_3.capture-skill-transfer-v1.json";
const HASH = "d799c2f54712f93982a2f8d135785aa163b4cd43234983f83b451ba75d304f55";
async function repoFile(path) {
  return readFile(new URL("../../" + path, import.meta.url), "utf8");
}
async function authorSkill() {
  const raw = JSON.parse(await repoFile(FILE));
  const transfer = importCaptureTransferJsonV1(JSON.stringify(raw));
  return { raw, transfer, draft: transfer.value.draft };
}

test("Jet pressurisé author transfer remains byte-semantic identical to uploaded V9 export", async () => {
  const {raw,transfer,draft} = await authorSkill();
  assert.equal(raw.schema,"capture-skill-transfer-v1");
  assert.equal(raw.version,1);
  assert.equal(transfer.kind,"skill");
  assert.equal(draft.id,"cap_water_atk_3");
  assert.equal(draft.definition.name,"Jet pressurisé");
  assert.equal(draft.requiredLevel,10);
  assert.equal(draft.presentation.version,9);
  assert.equal(createHash("sha256").update(JSON.stringify(raw)).digest("hex"),HASH);
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft)).value,transfer.value);
});

test("Jet pressurisé author choices are preserved: 25 water, 100% penetration and authored projectile sprite", async () => {
  const {draft:d} = await authorSkill();
  assert.equal(d.definition.form,"projectile");
  assert.equal(d.definition.element,"water");
  assert.equal(d.definition.energyCost,6);
  assert.equal(d.definition.preparationMs,2500);
  assert.equal(d.definition.travelMs,900);
  assert.equal(d.definition.recoveryMs,300);
  assert.equal(d.definition.cooldownMs,30000);
  assert.equal(d.definition.projectileClash.power,3);
  assert.deepEqual(d.definition.effects,[{
    kind:"damage",targetScope:"target",amount:25,channel:"water",
    ignoreResistancePct:100,ignoreDamageReductionPct:100
  }]);
  assert.equal(d.presentation.visual.icon.assetId,"core:icon-skill-aqua-dash-01");
  assert.equal(d.presentation.visual.cast.assetId,"pack:capture:sprite-cast-water-01");
  assert.equal(d.presentation.visual.travel.assetId,"pack:capture:sprite-frost-bolt-projectile-01");
  assert.equal(d.presentation.visual.travel.displayScale,2.5);
  assert.equal(d.presentation.visual.impact.assetId,"pack:capture:sprite-impact-water-01");
  assert.equal(d.presentation.visual.impact.durationMs,500);
  assert.deepEqual(d.presentation.audio,{});
});

test("Jet pressurisé is declared exactly once in native Showcase hydration after beam publication", async () => {
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(f=>f===FILE).length,1);
  const src=await repoFile("src/ui/capture-editor-human-v2.js");
  assert.match(src,/hydrateCaptureShowcaseSkillPresetsV1/);
  const html=await repoFile("examples/dom-demo/capture-editor-v2.html");
  assert.match(html,/<option value="beam">Rayon<\/option>/);
  const beamPreview=await repoFile("examples/dom-demo/pressurized-jet-preview.js");
  assert.match(beamPreview,/sprite-pressurized-jet-beam-body-01/);
});

test("Jet pressurisé uses the existing single import planner and its 25 damage bypasses ordinary mitigation", async () => {
  const {transfer,draft}=await authorSkill();
  const configuredSkills=new Map();
  for(const d of capturePortableNativeSkillDraftsV1())configuredSkills.set(d.id,d);
  for(const d of captureComplexNativeSkillDraftsV1())if(!configuredSkills.has(d.id))configuredSkills.set(d.id,d);
  const configuredCreatures=new Map();
  const registry=normalizeCaptureStatRegistryV1(JSON.parse(await repoFile("data/capture/monster-capture-stat-registry.v1.json")));
  const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(await repoFile("data/capture/monster-capture-progression-rules.v1.json")));
  const oldSize=configuredSkills.size;
  const already=configuredSkills.has("cap_water_atk_3");
  const currentDatabase=buildCaptureEditorDatabaseV1({statRegistry:registry,progressionRules,configuredCreatures,configuredSkills});
  const plan=planCaptureTransferImportV1({currentDatabase,transfer,mode:"replace"});
  assert.equal(plan.id,"cap_water_atk_3");
  assert.equal(plan.action,already?"replace-skill":"insert-skill");
  applyCaptureTransferPlanToEditorStateV1({plan,configuredCreatures,configuredSkills,statRegistry:registry,progressionRules});
  assert.equal(configuredSkills.size,oldSize+(already?0:1));
  assert.equal(configuredCreatures.size,0);
  assert.equal(configuredSkills.get("cap_water_atk_3").definition.name,"Jet pressurisé");
  const fighter=(id,extra={})=>({
    id,maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,
    energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0,...extra
  });
  const session=createCombatSession({fighters:[
    fighter("attacker"),fighter("target",{resistancePctByChannel:{water:70},damageReductionPct:50})
  ]});
  const r=session.useSkill({actorId:"attacker",targetId:"target",skill:draft.definition});
  assert.equal(r.ok,true);
  assert.equal(session.snapshot().fighters.target.hp,75,"100% penetration must ignore channel resistance and defense");
});
