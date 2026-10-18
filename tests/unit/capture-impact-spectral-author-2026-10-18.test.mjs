import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as catalog } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1, planCaptureTransferImportV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { buildCaptureEditorDatabaseV1, applyCaptureTransferPlanToEditorStateV1 } from "../../src/ui/capture-editor-file-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";
import { capturePortableNativeSkillDraftsV1 } from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import { captureComplexNativeSkillDraftsV1 } from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";

const id = "cap_shadow_atk_4";
const showcase = "data/capture/showcase/" + id + ".capture-skill-transfer-v1.json";
const archive = "data/capture/source-exports/gensrpg-capture-skill-cap_shadow_atk_4-2026-10-18.json";
const expectedHash = "f3b1babb771f0948e8d9b39f035c2d366fb870403cf4bc8f0c41249090f2611a";
const read = path => readFile(new URL("../../" + path, import.meta.url), "utf8");

test("first Impact spectral author revision remains archived with its original bytes", async () => {
  assert.equal(catalog.filter(path => path === showcase).length, 1, "unique active import");
  assert.equal(new Set(catalog).size, catalog.length);
  // Verify first authored Impact spectral in immutable historical archive.
  const raw = await read(archive);
  assert.equal(JSON.parse(await read(showcase)).draft.id, id);
  assert.equal(createHash("sha256").update(raw).digest("hex"), expectedHash);
  const transfer = importCaptureTransferJsonV1(raw);
  assert.equal(transfer.kind, "skill");
  const draft = transfer.value.draft;
  assert.equal(draft.id, id);
  assert.equal(draft.definition.id, id);
  assert.equal(draft.definition.name, "Impact spectral");
  assert.equal(draft.definition.element, "shadow");
  assert.equal(draft.requiredLevel, 15);
  assert.equal(draft.description, "Attaque Ombre de puissance 6. Disponible au niveau 16.");
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft)).value.draft, draft, "canonical import/export roundtrip");
});

test("Impact spectral: authored gameplay and media are unmodified", async () => {
  const {draft} = JSON.parse(await read(showcase));
  const skill = draft.definition;
  assert.equal(skill.form, "projectile");
  assert.equal(skill.energyCost, 6);
  assert.equal(skill.preparationMs, 1600);
  assert.equal(skill.travelMs, 800);
  assert.equal(skill.cooldownMs, 30000);
  assert.equal(skill.hitsIntangible, true);
  assert.equal(skill.projectileClash.power, 1);
  assert.deepEqual(skill.targetRelations, ["enemy"]);
  assert.deepEqual(skill.effects.map(effect => effect.kind), ["damage", "apply_status"]);
  assert.equal(skill.effects[0].amount, 15);
  assert.equal(skill.effects[0].channel, "shadow");
  assert.equal(skill.effects[0].ignoreDamageReductionPct, 100);
  const status = skill.effects[1].status;
  assert.equal(status.kind, "stun");
  assert.equal(status.durationMs, 2500);
  assert.equal(status.stacking, "refresh");
  const visual = draft.presentation.visual;
  assert.equal(visual.icon.assetId, "pack:capture:icon-skill-malediction-feline-01");
  assert.equal(visual.cast.assetId, "pack:capture:sprite-shadow-spell-cast-01");
  assert.equal(visual.travel.assetId, "pack:capture:sprite-projectile-shadow-01");
  assert.equal(visual.impact.assetId, "pack:capture:sprite-shadow-spell-impact-01");
  assert.equal(visual.impact.opacity, 0.5);
});

test("Impact spectral replaces ID in real configuredSkills without changing other skills", async () => {
  const statRegistry = normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
  const progressionRules = normalizeCaptureProgressionRulesV1(JSON.parse(await read("data/capture/monster-capture-progression-rules.v1.json")));
  const configuredCreatures = new Map();
  const configuredSkills = new Map(capturePortableNativeSkillDraftsV1().map(skill => [skill.id, skill]));
  for (const skill of captureComplexNativeSkillDraftsV1()) if (!configuredSkills.has(skill.id)) configuredSkills.set(skill.id, skill);
  const untouched = new Map(configuredSkills);
  const previousSkill = configuredSkills.get(id);
  const beforeSize = configuredSkills.size;
  const transfer = importCaptureTransferJsonV1(await read(showcase));
  const plan = planCaptureTransferImportV1({
    currentDatabase: buildCaptureEditorDatabaseV1({statRegistry, progressionRules, configuredCreatures, configuredSkills}),
    transfer,
    mode: "replace"
  });
  assert.equal(plan.action, previousSkill ? "replace-skill" : "add-skill");
  applyCaptureTransferPlanToEditorStateV1({plan, configuredCreatures, configuredSkills, statRegistry, progressionRules});
  assert.deepEqual(configuredSkills.get(id), transfer.value.draft);
  assert.equal(configuredSkills.size, beforeSize + (previousSkill ? 0 : 1));
  for (const [otherId, otherSkill] of untouched) {
    if (otherId !== id) assert.equal(configuredSkills.get(otherId), otherSkill, otherId + " untouched");
  }
});
