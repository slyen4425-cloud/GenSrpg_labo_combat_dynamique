import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1, planCaptureTransferImportV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { buildCaptureEditorDatabaseV1, applyCaptureTransferPlanToEditorStateV1 } from "../../src/ui/capture-editor-file-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";
import { capturePortableNativeSkillDraftsV1 } from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import { captureComplexNativeSkillDraftsV1 } from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import { humanSkillEditorFieldsFromDraftV1 } from "../../src/ui/capture-editor-human-v2.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1, CAPTURE_SHOWCASE_RETIRED_NATIVE_SKILL_IDS_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const read = async path => readFile(new URL("../../" + path, import.meta.url), "utf8");
const FILE = "data/capture/showcase/cap_earth_atk_4.capture-skill-transfer-v1.json";
const ID = "cap_earth_atk_4";
const RETIRED = "lib_rock_slam";

test("author transfer replaces cap_earth_atk_4 exactly once with V10 skyfall, without changing author settings", async () => {
  const paths = CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(path => path.includes("cap_earth_atk_4"));
  assert.deepEqual(paths, [FILE]);
  const transfer = importCaptureTransferJsonV1(await read(FILE));
  assert.equal(transfer.kind, "skill");
  const d = transfer.value.draft;
  assert.equal(d.id, ID);
  assert.equal(d.definition.id, ID);
  assert.equal(d.definition.name, "Impact rocheux");
  assert.equal(d.requiredLevel, 10);
  assert.equal(d.description, "Attaque Terre de puissance 6. Disponible au niveau 16.");
  assert.equal(d.definition.form, "projectile");
  assert.deepEqual(d.definition.targetRelations, ["enemy"]);
  assert.deepEqual(d.definition.effects, [{
    kind:"damage", targetScope:"all_enemies", amount:30, channel:"earth",
    ignoreResistancePct:0, ignoreDamageReductionPct:0
  }]);
  assert.equal(d.definition.energyCost, 5);
  assert.equal(d.definition.preparationMs, 2500);
  assert.equal(d.definition.travelMs, 1200);
  assert.equal(d.definition.cooldownMs, 30000);
  assert.equal(d.definition.projectileClash.power, 0);
  assert.equal(d.presentation.version, 10);
  assert.equal(d.presentation.visual.icon.assetId, "core:icon-skill-rock-smash-01");
  assert.equal(d.presentation.visual.cast.assetId, "pack:capture:sprite-stone-carapace-cast-01");
  assert.equal(d.presentation.visual.travel.assetId, "pack:capture:sprite-falling-rock-skyfall-01");
  assert.equal(d.presentation.visual.travel.trajectoryMode, "skyfall");
  assert.equal(d.presentation.visual.travel.fallHeightPx, 650);
  assert.equal(d.presentation.visual.travel.fallOffsetXPx, 0);
  assert.equal(d.presentation.visual.travel.displayScale, 2);
  assert.equal(d.presentation.visual.impact.assetId, "pack:capture:sprite-rock-impact-upward-01");
  assert.equal(d.presentation.visual.impact.displayScale, 1);
  assert.equal(d.presentation.visual.impact.offsetY, -25);
  assert.equal(d.presentation.visual.impact.durationMs, 750);
  assert.equal(d.presentation.feedback.cameraShake.amplitudePx, 600);
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(d)).value.draft, d);
  const fields = humanSkillEditorFieldsFromDraftV1(d);
  assert.equal(fields.presentation.travelTrajectoryMode, "skyfall");
  assert.equal(fields.presentation.fallHeightPx, 650);
  assert.equal(fields.presentation.fallOffsetXPx, 0);
});

test("actual editor import replaces existing id instead of appending duplicate, preserving all other skills", async () => {
  const skills = new Map(capturePortableNativeSkillDraftsV1().map(d => [d.id,d]));
  for (const d of captureComplexNativeSkillDraftsV1()) if (!skills.has(d.id)) skills.set(d.id,d);
  const historical = skills.get(ID);
  assert.ok(historical, "historical native skill must exist");
  assert.notEqual(historical.definition.form, "projectile");
  const beforeSize = skills.size;
  const retained = skills.get("cap_earth_atk_2");
  const stats = normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
  const progression = normalizeCaptureProgressionRulesV1(JSON.parse(await read("data/capture/monster-capture-progression-rules.v1.json")));
  const transfer = importCaptureTransferJsonV1(await read(FILE));
  const creatures = new Map();
  const database = buildCaptureEditorDatabaseV1({
    statRegistry:stats, progressionRules:progression,
    configuredCreatures:creatures,configuredSkills:skills,
    metadata:{producer:"impact-rocheux-test"}
  });
  const plan = planCaptureTransferImportV1({currentDatabase:database,transfer,mode:"replace"});
  assert.equal(plan.action, "replace-skill");
  applyCaptureTransferPlanToEditorStateV1({
    plan,configuredCreatures:creatures,configuredSkills:skills,
    statRegistry:stats,progressionRules:progression
  });
  assert.equal(skills.size,beforeSize);
  assert.deepEqual(skills.get(ID),transfer.value.draft);
  assert.equal(skills.get("cap_earth_atk_2"),retained);
});

test("retired duplicate is excluded from every active native hydration path and no baseline creature can still equip it", async () => {
  assert.deepEqual(CAPTURE_SHOWCASE_RETIRED_NATIVE_SKILL_IDS_V1, [RETIRED]);
  const ui = await read("src/ui/capture-editor-human-v2.js");
  assert.match(ui,/CAPTURE_SHOWCASE_RETIRED_NATIVE_SKILL_IDS_V1/);
  assert.match(ui,/retiredNativeSkillIds\.has\(skillId\)/);
  assert.match(ui,/retiredNativeSkillIds\.has\(draft\.id\)/);
  const monsters=JSON.parse(await read("data/capture/monster-capture-creatures.v1.json")).entries;
  assert.equal(monsters.length,110);
  assert.equal(monsters.filter(c=>c.abilityIds.includes(RETIRED)).length,0);
  assert.ok(monsters.find(c=>c.id==="crea_rockhorn").abilityIds.includes("lib_guard_break"));
  assert.ok(monsters.find(c=>c.id==="crea_mossback").abilityIds.includes("lib_earth_guard"));
  assert.ok(monsters.find(c=>c.id==="crea_poussroc").abilityIds.includes(ID));
  const statRegistry=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
  const mossback=importCaptureTransferJsonV1(await read("data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json"),{statRegistry}).value;
  assert.equal(mossback.draft.skillIds.includes(RETIRED),false);
  assert.equal(mossback.loadout.slots.some(slot=>slot.skillId===RETIRED),false);
  assert.equal(mossback.loadout.slots.find(slot=>slot.id==="slot-4").skillId,null);
  assert.ok(mossback.loadout.slots.some(slot=>slot.skillId==="lib_earth_guard"));
});
