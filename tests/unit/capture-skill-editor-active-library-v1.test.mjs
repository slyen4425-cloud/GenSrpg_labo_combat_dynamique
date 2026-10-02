import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import * as humanEditor from "../../src/ui/capture-editor-human-v2.js";
import {
  importCaptureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  normalizeCaptureSkillEditorDraftV1
} from "../../src/contracts/capture-skill-editor-draft-v1.js";
import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";

async function text(relative) {
  return readFile(
    new URL("../../" + relative, import.meta.url),
    "utf8"
  );
}

async function tempeteDraft() {
  const transfer = importCaptureTransferJsonV1(
    await text(
      "data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json"
    )
  );
  return transfer.value.draft;
}

async function fireballDraft() {
  const catalog = JSON.parse(
    await text("data/combat/skills/catalog.v1.json")
  );
  const entry = catalog.entries.find(
    (item) => item.definition?.id === "fireball"
  );
  const definition = normalizeSkillDefinition(
    entry.definition
  );
  return normalizeCaptureSkillEditorDraftV1({
    schema: "capture-skill-editor-draft-v1",
    id: definition.id,
    description: "Capacité native du laboratoire.",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    definition,
    presentation: null
  });
}

test("active skill library entries come from configuredSkills and include Fireball plus showcase replacement", async () => {
  assert.equal(
    typeof humanEditor.humanConfiguredSkillLibraryEntriesV1,
    "function",
    "active configuredSkills library helper must exist"
  );

  const configuredSkills = new Map([
    ["fireball", await fireballDraft()],
    ["cap_fire_atk_6", await tempeteDraft()]
  ]);

  const entries =
    humanEditor.humanConfiguredSkillLibraryEntriesV1(
      configuredSkills
    );

  assert.deepEqual(
    entries.map((entry) => entry.id),
    ["fireball", "cap_fire_atk_6"]
  );
  assert.equal(
    entries.find((entry) => entry.id === "fireball")?.name,
    "Boule de feu"
  );
  assert.equal(
    entries.find((entry) => entry.id === "cap_fire_atk_6")
      ?.name,
    "Tempête de flammes"
  );
});

test("showcase Tempete draft expands to complete editable fields from the active configured draft", async () => {
  assert.equal(
    typeof humanEditor.humanSkillEditorFieldsFromDraftV1,
    "function",
    "complete active skill draft mapper must exist"
  );

  const fields =
    humanEditor.humanSkillEditorFieldsFromDraftV1(
      await tempeteDraft()
    );

  assert.equal(fields.id, "cap_fire_atk_6");
  assert.equal(fields.name, "Tempête de flammes");
  assert.equal(fields.requiredLevel, 20);
  assert.equal(fields.loadoutSlot, "ultimate");
  assert.equal(fields.form, "beam");
  assert.equal(fields.energyCost, 5);
  assert.equal(fields.preparationMs, 2000);
  assert.equal(fields.cooldownMs, 3500);
  assert.equal(fields.maxUsesPerCombat, 1);
  assert.equal(
    fields.activationRequirements.conditions[0].threshold,
    25000
  );
  assert.equal(fields.effects[0].kind, "persistent_zone");
  assert.equal(fields.effects[0].maxActivations, 3);
  assert.equal(
    fields.presentation.iconAssetId,
    "core:icon-skill-fire-breath-01"
  );
  assert.equal(
    fields.presentation.zoneAssetId,
    "pack:capture:sprite-fire-zone-loop-01"
  );
  assert.equal(fields.presentation.zoneDisplayScale, 3.5);
  assert.equal(fields.presentation.zoneDisplayScaleX, 2.3);
  assert.equal(fields.presentation.zoneDisplayScaleY, 1);
  assert.equal(fields.presentation.zoneOffsetX, 0);
  assert.equal(fields.presentation.zoneOffsetY, -50);
  assert.equal(
    fields.presentation.castAudioAssetId,
    "gensrpg:sound:effect-135ee2ed"
  );
});

test("Human Editor selection reads the active configured skill instead of merging a legacy template", async () => {
  const source = await text(
    "src/ui/capture-editor-human-v2.js"
  );

  const listenerStart = source.indexOf(
    'listen(librarySelect, "change"'
  );
  assert.ok(listenerStart >= 0);

  const listenerEnd = source.indexOf(
    'listen(newSkillButton, "click"',
    listenerStart
  );
  assert.ok(listenerEnd > listenerStart);

  const listener = source.slice(
    listenerStart,
    listenerEnd
  );

  assert.match(listener, /configuredSkills\.get\(abilityId\)/);
  assert.doesNotMatch(
    listener,
    /mergeCaptureLegacyAbilityTemplateIntoEditorFieldsV1/
  );
  assert.match(listener, /writeSkillDraftFields/);
});

test("active skill selector is refreshed after base hydration and showcase replacement", async () => {
  const source = await text(
    "src/ui/capture-editor-human-v2.js"
  );

  assert.match(
    source,
    /function refreshSkillLibraryOptions/
  );

  const showcaseApply = source.indexOf(
    "applyCaptureTransferBatchToEditorStateV1"
  );
  const showcaseHydrate = source.indexOf(
    "await hydrateCaptureShowcaseSkillPresetsV1"
  );
  const refreshAfterShowcase = source.indexOf(
    "refreshSkillLibraryOptions",
    showcaseHydrate
  );

  assert.ok(showcaseApply >= 0);
  assert.ok(showcaseHydrate >= 0);
  assert.ok(refreshAfterShowcase > showcaseHydrate);
});
