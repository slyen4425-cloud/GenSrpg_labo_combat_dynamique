import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  importCaptureTransferJsonV1,
  exportCaptureSkillTransferJsonV1,
  planCaptureTransferImportV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  buildCaptureEditorDatabaseV1,
  applyCaptureTransferPlanToEditorStateV1
} from "../../src/ui/capture-editor-file-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const FILE = "data/capture/showcase/lib_aqua_heal.capture-skill-transfer-v1.json";
async function read(path) {
  return readFile(new URL("../../" + path, import.meta.url), "utf8");
}

test("Onde régénérante edited preset is registered once and preserves unrelated original fields", async () => {
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(path => path === FILE).length, 1);
  const text = await read(FILE);
  const raw = JSON.parse(text);
  assert.equal(raw.schema, "capture-skill-transfer-v1");
  assert.equal(raw.version, 1);
  const transfer = importCaptureTransferJsonV1(text);
  assert.equal(transfer.kind, "skill");
  const draft = transfer.value.draft;
  assert.equal(draft.id, "lib_aqua_heal");
  assert.equal(draft.definition.id, draft.id);
  assert.equal(draft.definition.name, "Onde régénérante");
  assert.equal(draft.description, "Rend des PV à une cible alliée.");
  assert.equal(draft.requiredLevel, 15);
  assert.equal(draft.definition.category, "heal");
  assert.equal(draft.definition.element, "water");
  assert.equal(draft.definition.form, "self");
  assert.deepEqual(draft.definition.targetRelations, ["self"]);
  assert.equal(draft.definition.energyCost, 8);
  assert.equal(draft.definition.preparationMs, 2500);
  assert.equal(draft.definition.travelMs, 0);
  assert.equal(draft.definition.recoveryMs, 0);
  assert.equal(draft.definition.cooldownMs, 30000);
  assert.equal(draft.definition.effect.heal, 0, "tactical healing must not double legacy healing");
  assert.equal(draft.definition.effects.length, 2, "requested immediate and periodic healing only");
  assert.equal(draft.presentation?.visual?.icon?.assetId, "core:icon-skill-recall-01");
  assert.equal(draft.presentation?.statusVisuals?.lib_aqua_heal_regeneration?.sprite?.assetId, "pack:capture:sprite-status-healing-aura-01");
  assert.equal(draft.presentation?.statusVisuals?.lib_aqua_heal_regeneration?.sprite?.opacity, 0.45);
  assert.deepEqual(
    importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft)).value.draft,
    draft
  );
});

test("canonical Capture Transfer replaces local skill by stable ID without touching other skills", async () => {
  const text = await read(FILE);
  const transfer = importCaptureTransferJsonV1(text);
  const registry = normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
  const progressionRules = normalizeCaptureProgressionRulesV1(JSON.parse(await read("data/capture/monster-capture-progression-rules.v1.json")));
  const old = { ...transfer.value.draft, definition: { ...transfer.value.draft.definition, energyCost: 13 } };
  const other = { ...transfer.value.draft, id: "independent-preserved", definition: { ...transfer.value.draft.definition, id: "independent-preserved" } };
  const configuredSkills = new Map([[old.id, old], [other.id, other]]);
  const configuredCreatures = new Map();
  const plan = planCaptureTransferImportV1({
    currentDatabase: buildCaptureEditorDatabaseV1({
      statRegistry: registry, progressionRules, configuredCreatures, configuredSkills,
      metadata: {producer:"aqua-heal-author-preset-test"}
    }),
    transfer, mode: "replace"
  });
  assert.equal(plan.action, "replace-skill");
  assert.equal(plan.id, "lib_aqua_heal");
  applyCaptureTransferPlanToEditorStateV1({
    plan, configuredSkills, configuredCreatures, statRegistry: registry, progressionRules
  });
  assert.equal(configuredSkills.size, 2);
  assert.deepEqual(configuredSkills.get("lib_aqua_heal"), transfer.value.draft);
  assert.deepEqual(configuredSkills.get("independent-preserved"), other);
  assert.equal(configuredCreatures.size, 0);
});

test("authored +5 immediate and periodic healing runs through canonical Combat Session", async () => {
  const transfer = importCaptureTransferJsonV1(await read(FILE));
  const fighter = (id, hp) => ({
    id, maxHp: 100, initialHp: hp, maxEnergy: 100,
    initialEnergy: 100, energyChargeAmount: 0, energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 1, chargeTimeModifierPct: 0
  });
  const session = createCombatSession({
    distance: "short", fighters: [fighter("self", 40), fighter("enemy", 100)]
  });
  const result = session.useSkill({
    actorId: "self", targetId: "self", skill: transfer.value.draft.definition
  });
  assert.equal(result.ok, true);
  assert.equal(session.snapshot().fighters.self.hp, 45);
  session.advanceMs(3000);
  assert.equal(session.snapshot().fighters.self.hp, 48);
  assert.equal(session.snapshot().fighters.self.energy, 92);
});

test("showcase startup reads author presets from same canonical owner before loading creatures", async () => {
  const source = await read("src/ui/capture-editor-human-v2.js");
  assert.match(source, /CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1/);
  assert.match(source, /applyCaptureTransferBatchToEditorStateV1/);
  assert.ok(source.indexOf("await hydrateCaptureShowcaseSkillPresetsV1") <
            source.indexOf("await hydrateCaptureShowcaseCreaturePresetsV1"));
  assert.match(source, /refreshSkillLibraryOptions/);
});
