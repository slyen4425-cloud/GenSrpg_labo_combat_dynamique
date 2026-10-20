import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { importCaptureTransferJsonV1, planCaptureTransferImportV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { applyCaptureTransferPlanToEditorStateV1, buildCaptureEditorDatabaseV1 } from "../../src/ui/capture-editor-file-transfer-v1.js";
import { humanConfiguredSkillLibraryEntriesV1, humanSkillEditorFieldsFromDraftV1, buildHumanSkillDraftV1 } from "../../src/ui/capture-editor-human-v2.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { PRIVATE_AUDIO_RUNTIME_ASSET_IDS_V1 } from "../../src/assets/private-audio-runtime-library-v1.js";
import { GLOBAL_VISUAL_LIBRARY } from "../../src/assets/global-visual-library.js";

const ID = "Tempete_metallique";
const path = "data/capture/showcase/Tempete_metallique.capture-skill-transfer-v1.json";
const archive = "data/capture/source-exports/gensrpg-capture-skill-Tempete_metallique-2026-10-20.json";
const originalSha256 = "f4c590274169e6f6201b206aa7f625ed871b73cd09ef1de503db3e9cbe8eaf27";
const text = p => readFile(new URL("../../" + p, import.meta.url), "utf8");
const sha256 = data => createHash("sha256").update(data).digest("hex");

test("Tempête métallique is a faithful single active author export with immutable provenance", async () => {
  const active = await text(path);
  const original = await text(archive);
  assert.equal(sha256(active), originalSha256, "Active transfer must match exact uploaded bytes");
  assert.equal(sha256(original), originalSha256, "Archive must match uploaded bytes");
  assert.equal(active, original);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p => p === path).length, 1);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p => p === archive).length, 0);
  const loaded = importCaptureTransferJsonV1(active);
  assert.equal(loaded.kind, "skill");
  const d = loaded.value.draft;
  assert.equal(d.id, ID);
  assert.equal(d.definition.id, ID);
  assert.equal(d.presentation.subjectId, ID);
  assert.equal(d.presentation.id, "skill:" + ID);
  assert.equal(d.description, "Envoie une pluie de metal qui fait saigner la ciblen");
  assert.equal(d.definition.name, "Tempête métallique");
  assert.equal(d.requiredLevel, 10);
  assert.deepEqual(d.usageScopes, ["capture", "combat"]);
  assert.equal(d.definition.category, "offensive");
  assert.equal(d.definition.form, "projectile");
  assert.equal(d.definition.projectileTargeting, "direct");
  assert.equal(d.definition.element, "steel");
  assert.equal(d.definition.loadoutSlot, "standard");
  assert.equal(d.definition.energyCost, 4);
  assert.equal(d.definition.preparationMs, 950);
  assert.equal(d.definition.travelMs, 700);
  assert.equal(d.definition.recoveryMs, 0);
  assert.equal(d.definition.cooldownMs, 45000);
  assert.deepEqual(d.definition.allowedDistances, ["short", "medium", "long"]);
  assert.deepEqual(d.definition.targetRelations, ["enemy"]);
  assert.equal(d.definition.projectileClash.power, 2);
  assert.equal(d.definition.effect.damage, 0, "Keep original legacy effect unmodified");
  assert.equal(d.definition.effects.length, 2);
  assert.deepEqual(d.definition.effects[0], {
    kind: "damage", targetScope: "target", amount: 15, channel: null,
    ignoreResistancePct: 0, ignoreDamageReductionPct: 0
  });
  const bleed = d.definition.effects[1];
  assert.equal(bleed.kind, "apply_status");
  assert.equal(bleed.targetScope, "target");
  assert.equal(bleed.status.id, "status-2");
  assert.equal(bleed.status.kind, "damage_over_time");
  assert.equal(bleed.status.polarity, "detrimental");
  assert.equal(bleed.status.durationMs, 16000);
  assert.equal(bleed.status.tickIntervalMs, 2000);
  assert.equal(bleed.status.amount, 6);
  assert.equal(bleed.status.channel, "steel");
  assert.equal(bleed.status.stacking, "stack");
  assert.equal(bleed.status.maxStacks, 5);
  assert.equal(d.presentation.version, 12);
  assert.equal(d.presentation.visual.icon.assetId, "pack:capture:icon-skill-lame-acier-01");
  assert.equal(d.presentation.visual.travel.assetId, "pack:capture:sprite-steel-wing-projectile-01");
  assert.equal(d.presentation.visual.travel.anchor, "mouth");
  assert.equal(d.presentation.visual.travel.displayScale, 1.5);
  assert.equal(d.presentation.visual.travel.playbackMode, "loop");
  assert.equal(d.presentation.visual.impact.assetId, "pack:capture:sprite-steel-wing-impact-01");
  assert.equal(d.presentation.visual.impact.opacity, 0.75);
  assert.equal(d.presentation.audio.travel.assetId, "gensrpg:sound:genrpg-pack2-963199e0");
  assert.equal(d.presentation.audio.travel.loop, true);
  assert.equal(d.presentation.audio.impact.assetId, "gensrpg:sound:tower-d4a4ecd5");
  assert.equal(d.presentation.audio.impact.loop, false);
});

test("Existing media and audio owners resolve exported IDs; no new visual library", async () => {
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch, "global-assets");
  for (const id of ["gensrpg:sound:genrpg-pack2-963199e0", "gensrpg:sound:tower-d4a4ecd5"]) {
    assert.ok(PRIVATE_AUDIO_RUNTIME_ASSET_IDS_V1.includes(id), id + " must resolve from the sole audio library");
  }
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p => p.includes(ID)).length, 1);
});

test("Runtime editor pathway inserts once in configuredSkills and reimport is idempotent", async () => {
  const transfer = importCaptureTransferJsonV1(await text(path));
  const statRegistry = normalizeCaptureStatRegistryV1(JSON.parse(await text("data/capture/monster-capture-stat-registry.v1.json")));
  const progressionRules = normalizeCaptureProgressionRulesV1(JSON.parse(await text("data/capture/monster-capture-progression-rules.v1.json")));
  const configuredSkills = new Map();
  const configuredCreatures = new Map();
  const args = {statRegistry, progressionRules, configuredSkills, configuredCreatures};
  const plan = planCaptureTransferImportV1({
    currentDatabase: buildCaptureEditorDatabaseV1(args), transfer, mode:"replace"
  });
  assert.equal(plan.action, "insert-skill");
  applyCaptureTransferPlanToEditorStateV1({plan, ...args});
  assert.equal(configuredSkills.size, 1);
  assert.deepEqual(configuredSkills.get(ID), transfer.value.draft);
  const entries = humanConfiguredSkillLibraryEntriesV1(configuredSkills);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].id, ID);
  const current = configuredSkills.get(ID);
  assert.deepEqual(buildHumanSkillDraftV1(humanSkillEditorFieldsFromDraftV1(current)), current);
  const second = planCaptureTransferImportV1({
    currentDatabase: buildCaptureEditorDatabaseV1(args), transfer, mode:"replace"
  });
  assert.equal(second.action, "noop");
  applyCaptureTransferPlanToEditorStateV1({plan:second, ...args});
  assert.equal(configuredSkills.size, 1);
});
