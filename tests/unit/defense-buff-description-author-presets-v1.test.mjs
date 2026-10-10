import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { projectStatusEffectInfoV1, statusEffectInfoTextV1 } from "../../src/adapters/renderer/status-effect-info-v1.js";
import { createStatusEffectRuntimeInstanceV1 } from "../../src/core/combat/status-effect-instance-v1.js";
import { buildCaptureEditorDatabaseV1, applyCaptureTransferPlanToEditorStateV1 } from "../../src/ui/capture-editor-file-transfer-v1.js";
import { planCaptureTransferImportV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";
import { importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const read = path => readFile(new URL("../../" + path, import.meta.url), "utf8");
const paths = {
  carapace: "data/capture/showcase/lib_earth_guard.capture-skill-transfer-v1.json",
  attack: "data/capture/showcase/cap_earth_atk_2.capture-skill-transfer-v1.json"
};

function guardInstance(deltaPoints, statusId = "lib_earth_guard:0") {
  return {
    sourceActorId: "local-1",
    sourceSkillId: "lib_earth_guard",
    appliedAtMs: 0,
    expiresAtMs: 25000,
    remainingActionEnds: null,
    nextTickAtMs: null,
    stacks: 1,
    shieldRemaining: null,
    definition: {
      id: statusId, kind: "stat_modifier",
      polarity: deltaPoints > 0 ? "beneficial" : "detrimental",
      durationModel: "time_ms", durationMs: 25000,
      stacking: "refresh", maxStacks: 1, tags: ["buff"],
      statId: "defense", modifierMode: "points", deltaPoints
    }
  };
}
async function defenseInfo(deltaPoints) {
  const instance = guardInstance(deltaPoints);
  const registry = JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json"));
  const defense = registry.stats.find(row => row.id === "defense");
  assert.equal(defense.damageReductionPctPerPoint, 0.2);
  return projectStatusEffectInfoV1({
    instance, elapsedMs: 1000, sourceSkill: { id: "lib_earth_guard", name: "Carapace minérale" },
    fighter: { statValuesById: { defense: 0 }, statEffectRulesById: { defense }, statusEffects: [instance] }
  });
}

test("Carapace minérale: +200 defense really means 40 percent damage received REDUCED", async () => {
  const info = await defenseInfo(200);
  assert.equal(info.typeLabel, "Buff");
  assert.equal(info.sourceSkillName, "Carapace minérale");
  assert.deepEqual(info.effectLines, ["Dégâts reçus réduits de 40 %"]);
  assert.equal(info.remainingLabel, "24 s");
});
test("negative defense correctly means more damage received, not less", async () => {
  const info = await defenseInfo(-100);
  assert.equal(info.typeLabel, "Debuff");
  assert.deepEqual(info.effectLines, ["Dégâts reçus augmentés de 20 %"]);
});
test("zero defense bonus avoids misleading semantic status lines", async () => {
  const info = await defenseInfo(0);
  assert.ok(!info.effectLines.some(line => /Dégâts reçus/.test(line)));
});
test("both exported Earth abilities enter canonical configuredSkills only once and roundtrip with author parameters", async () => {
  for (const path of Object.values(paths)) {
    assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p => p === path).length, 1);
    const raw = JSON.parse(await read(path));
    const transfer = importCaptureTransferJsonV1(JSON.stringify(raw));
    assert.equal(transfer.kind, "skill");
    const draft = transfer.value.draft;
    assert.equal(draft.definition.id, draft.id);
    assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft)).value.draft, draft);
    if (draft.id === "lib_earth_guard") {
      assert.equal(draft.definition.name, "Carapace minérale");
      assert.equal(draft.requiredLevel, 5);
      assert.equal(draft.definition.energyCost, 2);
      assert.equal(draft.definition.cooldownMs, 45000);
      assert.equal(draft.definition.effects[0].status.statId, "defense");
      assert.equal(draft.definition.effects[0].status.deltaPoints, 200);
      assert.equal(draft.definition.effects[0].status.durationMs, 25000);
      assert.equal(draft.presentation.visual.icon.assetId, "pack:capture:icon-skill-earth-carapace-01");
      assert.equal(draft.presentation.statusVisuals["lib_earth_guard:0"].sprite.assetId, "pack:capture:sprite-status-stone-shell-01");
    } else if (draft.id === "cap_earth_atk_2") {
      assert.equal(draft.definition.name, "Coup minéral");
      assert.equal(draft.requiredLevel, 1);
      assert.equal(draft.definition.energyCost, 3);
      assert.equal(draft.definition.effects[0].amount, 8);
      assert.equal(draft.definition.effects[0].channel, "earth");
      assert.equal(draft.definition.effects[1].status.kind, "stun");
      assert.equal(draft.definition.effects[1].status.durationMs, 500);
      assert.equal(draft.presentation.visual.icon.assetId, "core:icon-skill-rock-smash-01");
      assert.equal(draft.presentation.visual.impact.assetId, "pack:capture:sprite-impact-nature-01");
    } else { assert.fail("unexpected skill ID " + draft.id); }
  }
  assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size, CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
});

test("actual authored Carapace effect projects as reduced incoming damage in HUD info text", async () => {
  const transfer = importCaptureTransferJsonV1(await read(paths.carapace));
  const status = transfer.value.draft.definition.effects[0].status;
  const instance = createStatusEffectRuntimeInstanceV1({
    definition: status, sourceActorId: "local-1", sourceSkillId: "lib_earth_guard", appliedAtMs: 0
  });
  const registry = JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json"));
  const defenseRule = registry.stats.find(stat => stat.id === "defense");
  const info = projectStatusEffectInfoV1({
    instance, elapsedMs: 1000, sourceSkill: transfer.value.draft.definition,
    fighter: { statValuesById: { defense: 0 }, statEffectRulesById: { defense: defenseRule }, statusEffects: [instance] }
  });
  const hudText = statusEffectInfoTextV1(info);
  assert.match(hudText, /Origine : Carapace minérale/);
  assert.match(hudText, /Dégâts reçus réduits de 40 %/);
  assert.doesNotMatch(hudText, /Dégâts reçus augmentés/);
});

test("authored Earth transfers use replace-by-ID in canonical configuredSkills without lost native skills", async () => {
  const transfers = await Promise.all(Object.values(paths).map(async path => importCaptureTransferJsonV1(await read(path))));
  const statRegistry = normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
  const progressionRules = normalizeCaptureProgressionRulesV1(JSON.parse(await read("data/capture/monster-capture-progression-rules.v1.json")));
  const guard = transfers[0].value.draft;
  const oldGuard = { ...guard, definition: { ...guard.definition, energyCost: 99 } };
  const native = { ...guard, id: "native-retained", definition: { ...guard.definition, id: "native-retained" }, presentation: { ...guard.presentation, subjectId: "native-retained", id: "skill:native-retained" } };
  const configuredSkills = new Map([[oldGuard.id, oldGuard], [native.id, native]]);
  const configuredCreatures = new Map();
  for (const transfer of transfers) {
    const database = buildCaptureEditorDatabaseV1({
      statRegistry, progressionRules, configuredSkills, configuredCreatures,
      metadata: { producer: "earth-presets-regression-test" }
    });
    const plan = planCaptureTransferImportV1({
      currentDatabase: database, transfer,
      mode: configuredSkills.has(transfer.value.draft.id) ? "replace" : "add"
    });
    applyCaptureTransferPlanToEditorStateV1({
      plan, configuredSkills, configuredCreatures, statRegistry, progressionRules
    });
  }
  assert.equal(configuredSkills.size, 3);
  assert.deepEqual(configuredSkills.get("lib_earth_guard"), transfers[0].value.draft);
  assert.deepEqual(configuredSkills.get("cap_earth_atk_2"), transfers[1].value.draft);
  assert.deepEqual(configuredSkills.get("native-retained"), native);
});
