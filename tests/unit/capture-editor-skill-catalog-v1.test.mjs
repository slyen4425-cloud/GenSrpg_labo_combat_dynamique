import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  captureLegacySkillLibraryEntriesV1,
  mergeCaptureLegacyAbilityTemplateIntoEditorFieldsV1,
  captureLegacyAbilityEditorStateV1
} from "../../src/ui/capture-editor-skill-catalog-v1.js";

function currentFields() {
  return {
    id: "custom-skill",
    name: "Capacité en cours",
    description: "Texte",
    requiredLevel: 3,
    category: "offensive",
    form: "projectile",
    element: "water",
    approachMode: "teleport",
    energyCost: 7,
    preparationMs: 1234,
    travelMs: 567,
    recoveryMs: 890,
    cooldownMs: 4321,
    damage: 9,
    heal: 0,
    stunMs: 500,
    allowedDistances: ["short"],
    targetRelations: ["ally"],
    effects: [],
    presentation: {
      iconAssetId: "core:icon-custom",
      castAssetId: "core:fx-custom-cast",
      travelAssetId: "core:fx-custom-travel",
      impactAssetId: "core:fx-custom-impact",
      socketId: "mouth"
    }
  };
}

test("editor skill library exposes the 103 abilities actually used by Capture creatures", () => {
  const entries = captureLegacySkillLibraryEntriesV1();

  assert.equal(entries.length, 103);
  assert.equal(
    new Set(entries.map((entry) => entry.id)).size,
    103
  );
  assert.equal(
    entries.some((entry) =>
      entry.id === "cap_fire_atk_1" &&
      entry.name === "Étincelle"
    ),
    true
  );
  assert.equal(
    entries.some((entry) =>
      entry.id.startsWith("cap_neutral_")
    ),
    false
  );
  assert.equal(
    entries.some((entry) =>
      entry.id === "lib_regen"
    ),
    true
  );
});

test("basic historical template only replaces fields explicitly known from legacy data", () => {
  const before = currentFields();
  const after =
    mergeCaptureLegacyAbilityTemplateIntoEditorFieldsV1(
      before,
      "cap_fire_atk_1"
    );

  assert.equal(after.id, "cap_fire_atk_1");
  assert.equal(after.name, "Étincelle");
  assert.equal(after.description, "Attaque Feu de puissance 3. Disponible au niveau 1.");
  assert.equal(after.category, "offensive");
  assert.equal(after.element, "fire");
  assert.equal(after.requiredLevel, 1);
  assert.deepEqual(after.effects, [
    {
      kind: "damage",
      targetScope: "target",
      amount: 3,
      channel: "fire"
    }
  ]);
  assert.equal("damage" in after, false);
  assert.equal("heal" in after, false);
  assert.equal("stunMs" in after, false);
  assert.equal("allowedDistances" in after, false);
  assert.equal("targetRelations" in after, false);

  assert.equal(after.form, before.form);
  assert.equal(after.approachMode, before.approachMode);
  assert.equal(after.energyCost, before.energyCost);
  assert.equal(after.preparationMs, before.preparationMs);
  assert.equal(after.travelMs, before.travelMs);
  assert.equal(after.recoveryMs, before.recoveryMs);
  assert.equal(after.cooldownMs, before.cooldownMs);
  assert.deepEqual(after.presentation, before.presentation);
});

test("status-dependent template remains explicitly unavailable as a complete runtime skill", () => {
  const state = captureLegacyAbilityEditorStateV1(
    "cap_fire_special_1"
  );

  assert.equal(
    state.migrationState,
    "requires-status-effect-v1"
  );
  assert.equal(state.runtimeReady, false);
  assert.match(state.message, /StatusEffectV1/i);
  assert.deepEqual(state.legacyStatusEffects, [
    {
      kind: "debuff",
      stat: "agility",
      value: -2,
      duration: 2,
      target: "enemy"
    }
  ]);
});

test("portable basic template is editable but still requires explicit modern gameplay fields from the editor", () => {
  const state = captureLegacyAbilityEditorStateV1(
    "cap_water_atk_1"
  );

  assert.equal(
    state.migrationState,
    "portable-basic-effects"
  );
  assert.equal(state.runtimeReady, true);
  assert.equal(state.template.name, "Goutte vive");

  for (const forbidden of [
    "form",
    "approachMode",
    "energyCost",
    "preparationMs",
    "travelMs",
    "recoveryMs",
    "cooldownMs"
  ]) {
    assert.equal(forbidden in state.template, false);
  }
});

test("catalog editor adapter rejects unknown historical ids instead of guessing", () => {
  assert.throws(
    () =>
      mergeCaptureLegacyAbilityTemplateIntoEditorFieldsV1(
        currentFields(),
        "fireball-looking-name"
      ),
    /unknown historical ability/i
  );
});

test("human editor page reserves a real historical ability library surface and no hardcoded Fireball-only library", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const marker of [
    "data-skill-library-select",
    "data-skill-library-state",
    "data-skill-create",
    "data-skill-update",
    "data-loadout-slot"
  ]) {
    assert.equal(
      html.includes(marker),
      true,
      `human editor must contain ${marker}`
    );
  }
});

test("catalog editor adapter is independent from runtime, storage and production repository", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-skill-catalog-v1.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const forbidden of [
    "createCombatSession",
    "createCombatRuntime",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "captureFix",
    "Zombicide-40k",
    "fetch("
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `catalog UI adapter must not contain ${forbidden}`
    );
  }
});
