import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  importCaptureTransferJsonV1,
  exportCaptureSkillTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  applyCaptureTransferBatchToEditorStateV1
} from "../../src/ui/capture-editor-file-transfer-v1.js";
import {
  CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1
} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {
  capturePortableNativeSkillDraftsV1
} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {
  captureComplexNativeSkillDraftsV1
} from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";

const PRESET = "data/capture/showcase/cap_water_atk_3.capture-skill-transfer-v1.json";
const EXPECTED_SEMANTIC_SHA256 = "d17d57096c9e694023fca2727ff24f35bb9abb05421954a34c83d7727be1b6df";
async function read(path) {
  return readFile(new URL("../../" + path, import.meta.url), "utf8");
}
async function author() {
  const source = await read(PRESET);
  return { raw: JSON.parse(source), transfer: importCaptureTransferJsonV1(source) };
}
function fighter(id) {
  return {
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 20,
    initialEnergy: 20,
    energyChargeAmount: 0,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 1,
    chargeTimeModifierPct: 0,
    resistancePctByChannel: { water: 40 },
    damageReductionPct: 20
  };
}
test("Jet pressurisé Showcase is declared once and preserves exact authored JSON", async () => {
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p => p === PRESET).length, 1);
  const { raw, transfer } = await author();
  assert.equal(raw.schema, "capture-skill-transfer-v1");
  assert.equal(raw.version, 1);
  assert.equal(transfer.kind, "skill");
  assert.equal(transfer.value.draft.id, "cap_water_atk_3");
  const digest = createHash("sha256").update(JSON.stringify(raw)).digest("hex");
  assert.equal(digest, EXPECTED_SEMANTIC_SHA256, "do not change the author's skill silently");
  const exported = exportCaptureSkillTransferJsonV1(transfer.value.draft);
  assert.deepEqual(importCaptureTransferJsonV1(exported).value, transfer.value);
});
test("Jet pressurisé preserves updated Beam author semantics, water effect and 100% penetration", async () => {
  const { raw } = await author();
  const d = raw.draft;
  assert.equal(d.definition.name, "Jet pressurisé");
  assert.equal(d.requiredLevel, 10);
  assert.equal(d.definition.form, "beam");
  assert.equal(d.definition.energyCost, 6);
  assert.equal(d.definition.preparationMs, 2500);
  assert.equal(d.definition.travelMs, 900);
  assert.equal(d.definition.recoveryMs, 300);
  assert.equal(d.definition.cooldownMs, 30000);
  assert.equal(d.definition.projectileClash.power, 0);
  assert.deepEqual(d.definition.effects, [{
    kind: "damage",
    targetScope: "target",
    amount: 25,
    channel: "water",
    ignoreResistancePct: 100,
    ignoreDamageReductionPct: 100
  }]);
  assert.equal(d.presentation.version, 9);
  assert.equal(d.presentation.visual.beamStart.assetId, "pack:capture:sprite-pressurized-jet-beam-start-01");
  assert.equal(Object.hasOwn(d.presentation.visual, "cast"), false);
  assert.equal(d.presentation.visual.travel.assetId, "pack:capture:sprite-pressurized-jet-beam-body-01");
  assert.equal(d.presentation.visual.impact.assetId, "pack:capture:sprite-impact-water-01");
  assert.equal(d.presentation.visual.travel.displayScale, 0.7);
  assert.equal(d.presentation.visual.impact.durationMs, 500);
  assert.deepEqual(d.presentation.audio, {
    travel: { assetId: "gensrpg:sound:xel-48520d94", volume: 1, loop: true },
    impact: { assetId: "gensrpg:sound:sanctuary-17b7fa2c", volume: 1, loop: false }
  });
  assert.equal(d.presentation.feedback.glow.radiusPx, 48);
});
test("Jet pressurisé replaces historical skill through atomic canonical batch and preserves creatures", async () => {
  const { transfer } = await author();
  const skills = new Map();
  for (const d of capturePortableNativeSkillDraftsV1()) skills.set(d.id, d);
  for (const d of captureComplexNativeSkillDraftsV1()) if (!skills.has(d.id)) skills.set(d.id, d);
  assert.ok(skills.has("cap_water_atk_3"), "native historical skill must exist for replacement");
  const before = skills.size;
  const creatures = new Map();
  const statRegistry = normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
  const progressionRules = normalizeCaptureProgressionRulesV1(JSON.parse(await read("data/capture/monster-capture-progression-rules.v1.json")));
  const result = applyCaptureTransferBatchToEditorStateV1({
    transfers: [transfer],
    configuredCreatures: creatures,
    configuredSkills: skills,
    statRegistry, progressionRules,
    mode: "replace"
  });
  assert.deepEqual(result.actions.map(({ action, id }) => [action,id]), [["replace-skill","cap_water_atk_3"]]);
  assert.equal(skills.size,before);
  assert.equal(creatures.size,0);
  assert.equal(skills.get("cap_water_atk_3").definition.form,"beam");
  assert.equal(skills.get("cap_water_atk_3").presentation.visual.travel.assetId,"pack:capture:sprite-pressurized-jet-beam-body-01");
});
test("Jet pressurisé deals 25 water damage despite 40% water resistance and 20% defence in Combat Session", async () => {
  const { transfer } = await author();
  const session = createCombatSession({distance:"medium",fighters:[fighter("actor"),fighter("opponent")]});
  const used = session.useSkill({actorId:"actor",targetId:"opponent",skill:transfer.value.draft.definition});
  assert.equal(used.ok,true);
  assert.equal(session.snapshot().fighters.opponent.hp,75,"100% penetration bypasses both positive mitigations");
  assert.equal(session.snapshot().fighters.actor.energy,14);
});
