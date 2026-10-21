import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { importCaptureTransferJsonV1, planCaptureTransferImportV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { buildCaptureEditorDatabaseV1, applyCaptureTransferPlanToEditorStateV1 } from "../../src/ui/capture-editor-file-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";
import { humanSkillEditorFieldsFromDraftV1, buildHumanSkillDraftV1 } from "../../src/ui/capture-editor-human-v2.js";
import { adaptCaptureSkillToSkillDefinition } from "../../src/adapters/input/capture/capture-skill-to-skill-definition.js";

const file = p => readFile(new URL("../../" + p, import.meta.url), "utf8");
const hash = s => createHash("sha256").update(s).digest("hex");
const targets = [
  {
    id: "sangsue",
    active: "data/capture/showcase/sangsue.capture-skill-transfer-v1.json",
    source: "data/capture/source-exports/gensrpg-capture-skill-sangsue-2026-10-21.json",
    sha256: "4f01446e69c1cbc7f058f6710b33b738574fc4acf8fb027f10e63a371fd7c82f"
  },
  {
    id: "tempete_rouille",
    active: "data/capture/showcase/tempete_rouille.capture-skill-transfer-v1.json",
    source: "data/capture/source-exports/gensrpg-capture-skill-tempete_rouille-2026-10-21.json",
    sha256: "d26de89a321526f9c69b64e9e9383e524f1396e20ed7574ab67013616f1a3bc8"
  }
];

test("each author JSON is archived byte-exact, has one canonical active preset and passes Transfer import", async () => {
  for (const spec of targets) {
    const [active, original] = await Promise.all([file(spec.active), file(spec.source)]);
    assert.equal(active, original, "active and archived source must be byte-identical");
    assert.equal(hash(active), spec.sha256, "author source bytes must never be silently changed");
    assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x => x === spec.active).length, 1);
    assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.includes(spec.source), false);
    const transfer = importCaptureTransferJsonV1(active);
    assert.equal(transfer.kind, "skill");
    assert.equal(transfer.value.draft.id, spec.id);
    assert.equal(transfer.value.draft.definition.id, spec.id);
    const combat = adaptCaptureSkillToSkillDefinition({
      id: spec.id, definition: transfer.value.draft.definition
    }, transfer.value.draft.presentation);
    assert.equal(combat.id, spec.id);
  }
});

test("Sangsue: 1s confirmed native contactHold, original 6 Nature damage + 100% lifesteal, no invented asset", async () => {
  const d = importCaptureTransferJsonV1(await file(targets[0].active)).value.draft;
  assert.equal(d.requiredLevel, 15);
  assert.equal(d.definition.form, "contact");
  assert.equal(d.definition.approachMode, "ground");
  assert.equal(d.definition.loadoutSlot, "standard");
  assert.equal(d.definition.contactHold.tickIntervalMs, 1000);
  assert.equal(d.definition.contactHold.maxDurationMs, 0);
  assert.deepEqual(d.definition.contactHold.effects.map(e => e.kind), ["damage", "life_steal"]);
  assert.equal(d.definition.contactHold.effects[0].amount, 6);
  assert.equal(d.definition.contactHold.effects[0].channel, "nature");
  assert.equal(d.definition.contactHold.effects[1].percent, 100);
  assert.equal(d.definition.effects.length, 0);
  assert.equal(d.presentation, null);
  const edited = buildHumanSkillDraftV1(humanSkillEditorFieldsFromDraftV1(d));
  assert.deepEqual(edited.definition.contactHold, d.definition.contactHold);
  assert.equal(edited.presentation, null);
});

test("Tempête de rouille: updated stable ID/ultimate/level and 15-second zone, visual binding unchanged", async () => {
  const d = importCaptureTransferJsonV1(await file(targets[1].active)).value.draft;
  assert.equal(d.requiredLevel, 20);
  assert.equal(d.definition.loadoutSlot, "ultimate");
  assert.equal(d.definition.element, "steel");
  const zone = d.definition.effects[0];
  assert.equal(zone.kind, "persistent_zone");
  assert.equal(zone.durationMs, 15000);
  assert.equal(zone.tickIntervalMs, 1000);
  assert.equal(zone.tickEffect.channel, "acier");
  assert.equal(zone.tickEffect.amount, 20);
  assert.equal(d.presentation.visual.icon.assetId, "pack:capture:icon-skill-tourbillons-rouille-01");
  assert.equal(d.presentation.visual.aura.assetId, "pack:capture:sprite-rust-whirlwind-cast-01");
  const edited = buildHumanSkillDraftV1(humanSkillEditorFieldsFromDraftV1(d));
  assert.equal(edited.definition.loadoutSlot, "ultimate");
  assert.equal(edited.definition.effects[0].durationMs, 15000);
});

test("same configuredSkills owner replaces old rust ID once and inserts Sangsue once; existing skills unaffected", async () => {
  const statRegistry = normalizeCaptureStatRegistryV1(JSON.parse(await file("data/capture/monster-capture-stat-registry.v1.json")));
  const progressionRules = normalizeCaptureProgressionRulesV1(JSON.parse(await file("data/capture/monster-capture-progression-rules.v1.json")));
  const oldRust = importCaptureTransferJsonV1(await file("data/capture/source-exports/gensrpg-capture-skill-tempete_rouille-2026-10-20.json")).value.draft;
  const configuredSkills = new Map([[oldRust.id, oldRust]]);
  const configuredCreatures = new Map();
  const dependencies = { configuredSkills, configuredCreatures, statRegistry, progressionRules };
  const unrelated = [...configuredSkills.keys()];
  for (const spec of targets) {
    const transfer = importCaptureTransferJsonV1(await file(spec.active));
    const plan = planCaptureTransferImportV1({
      currentDatabase: buildCaptureEditorDatabaseV1(dependencies),
      transfer, mode: "replace"
    });
    assert.equal(plan.action, spec.id === "sangsue" ? "insert-skill" : "replace-skill");
    applyCaptureTransferPlanToEditorStateV1({plan, ...dependencies});
  }
  assert.equal(configuredSkills.size, 2);
  assert.deepEqual([...configuredSkills.keys()].sort(), ["sangsue", "tempete_rouille"]);
  assert.equal(configuredSkills.get("tempete_rouille").definition.loadoutSlot, "ultimate");
  assert.equal(configuredSkills.get("tempete_rouille").requiredLevel, 20);
  assert.equal(configuredSkills.get("sangsue").definition.contactHold.tickIntervalMs, 1000);
  assert.equal(configuredCreatures.size, 0, "no authored creature or loadout is silently mutated");
  assert.deepEqual(unrelated, ["tempete_rouille"]);
  for (const spec of targets) {
    const transfer = importCaptureTransferJsonV1(await file(spec.active));
    const plan = planCaptureTransferImportV1({currentDatabase:buildCaptureEditorDatabaseV1(dependencies),transfer,mode:"replace"});
    assert.equal(plan.action,"noop");
  }
});
