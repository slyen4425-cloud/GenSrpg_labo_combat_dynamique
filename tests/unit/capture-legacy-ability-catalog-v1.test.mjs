import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_LEGACY_ABILITY_CATALOG_SCHEMA,
  CAPTURE_LEGACY_ABILITY_CATALOG_V1,
  normalizeCaptureLegacyAbilityCatalogV1,
  classifyCaptureLegacyAbilityV1,
  captureLegacyAbilityTemplateV1
} from "../../src/catalogs/capture-legacy-ability-catalog-v1.js";

function catalog() {
  return normalizeCaptureLegacyAbilityCatalogV1(
    CAPTURE_LEGACY_ABILITY_CATALOG_V1
  );
}

test("legacy Capture ability catalog preserves the 84-entry historical roster", () => {
  const value = catalog();

  assert.equal(
    CAPTURE_LEGACY_ABILITY_CATALOG_SCHEMA,
    "capture-legacy-ability-catalog-v1"
  );
  assert.equal(value.abilities.length, 84);
  assert.equal(
    new Set(
      value.abilities.map(
        (ability) => ability.id
      )
    ).size,
    84
  );

  const byElement = Object.fromEntries(
    [
      "fire",
      "water",
      "earth",
      "air",
      "electric",
      "light",
      "shadow",
      "poison",
      "neutral"
    ].map((element) => [
      element,
      value.abilities.filter(
        (ability) =>
          (
            ability.element ||
            "neutral"
          ) === element
      ).length
    ])
  );

  assert.deepEqual(byElement, {
    fire: 9,
    water: 9,
    earth: 9,
    air: 9,
    electric: 9,
    light: 9,
    shadow: 9,
    poison: 9,
    neutral: 12
  });
});

test("legacy catalog source provenance is explicit and stable", () => {
  const value = catalog();

  assert.equal(
    value.source.repository,
    "slyen4425-cloud/Zombicide-40k"
  );
  assert.equal(
    value.source.commit,
    "49289784ee92a47fd51089815ca25954cdba4493"
  );
  assert.equal(
    value.source.indexBlob,
    "74e223b2c9877e6a88b6ad6726290d230f1f616e"
  );
  assert.equal(
    value.source.functionName,
    "gensCaptureExpandedAbilityRoster"
  );
});

test("legacy ability classification is based only on explicit effect kinds", () => {
  const value = catalog();

  const portable = value.abilities.filter(
    (ability) =>
      classifyCaptureLegacyAbilityV1(
        ability
      ) ===
      "portable-basic-effects"
  );
  const status = value.abilities.filter(
    (ability) =>
      classifyCaptureLegacyAbilityV1(
        ability
      ) ===
      "requires-status-effect-v1"
  );

  assert.equal(portable.length, 66);
  assert.equal(status.length, 18);

  const renamed = {
    ...portable[0],
    name:
      "Nom volontairement trompeur",
    desc:
      "buff debuff poison dot projectile"
  };

  assert.equal(
    classifyCaptureLegacyAbilityV1(
      renamed
    ),
    "portable-basic-effects"
  );
});

test("legacy ability template exposes explicit portable fields and never invents form or timing", () => {
  const value = catalog();

  const fire = value.abilities.find(
    (ability) =>
      ability.id ===
      "cap_fire_atk_1"
  );
  const template =
    captureLegacyAbilityTemplateV1(
      fire
    );

  assert.equal(
    template.id,
    "cap_fire_atk_1"
  );
  assert.equal(
    template.name,
    "Étincelle"
  );
  assert.equal(
    template.category,
    "offensive"
  );
  assert.equal(
    template.element,
    "fire"
  );
  assert.equal(
    template.requiredLevel,
    1
  );
  assert.equal(
    template.effect.damage,
    3
  );
  assert.equal(
    template.effect.heal,
    0
  );
  assert.equal(
    template.migrationState,
    "portable-basic-effects"
  );

  for (const forbidden of [
    "form",
    "approachMode",
    "energyCost",
    "preparationMs",
    "travelMs",
    "recoveryMs",
    "cooldownMs"
  ]) {
    assert.equal(
      forbidden in template,
      false
    );
  }
});

test("legacy catalog preserves historical boundary entries exactly", () => {
  const value = catalog();
  const first = value.abilities[0];
  const last = value.abilities.at(-1);

  assert.deepEqual(first, {
    id: "cap_fire_atk_1",
    name: "Étincelle",
    category: "spell",
    type: "active",
    desc:
      "Attaque Feu de puissance 3. Disponible au niveau 1.",
    element: "fire",
    power: 3,
    requiredLevel: 1,
    effects: [
      {
        kind: "damage",
        base: 3,
        element: "fire",
        target: "enemy"
      }
    ],
    activeMeta: {
      manaCost: 0,
      weapon: "",
      cooldown: 0
    },
    usageScopes: [
      "captureCreature",
      "enemy"
    ],
    builtin: true,
    builtinCreature: true,
    captureRoster: true
  });

  assert.equal(
    last.id,
    "cap_neutral_12"
  );
  assert.equal(
    last.name,
    "Dernier recours"
  );
  assert.equal(
    last.desc,
    "Technique neutre de puissance 12. Disponible au niveau 55."
  );
  assert.equal(last.power, 12);
  assert.equal(
    last.requiredLevel,
    55
  );
});

test("status-dependent legacy abilities remain visible but are not falsely flattened", () => {
  const value = catalog();
  const debuff = value.abilities.find(
    (ability) =>
      ability.id ===
      "cap_fire_special_1"
  );
  const template =
    captureLegacyAbilityTemplateV1(
      debuff
    );

  assert.equal(
    template.migrationState,
    "requires-status-effect-v1"
  );
  assert.equal(
    template.effect.damage,
    2
  );
  assert.equal(
    template.legacyStatusEffects.length,
    1
  );
  assert.deepEqual(
    template.legacyStatusEffects[0],
    {
      kind: "debuff",
      stat: "agility",
      value: -2,
      duration: 2,
      target: "enemy"
    }
  );
});

test("legacy catalog module is independent from UI, runtime, storage and GenSrpG", async () => {
  const source = await readFile(
    new URL(
      "../../src/catalogs/capture-legacy-ability-catalog-v1.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const forbidden of [
    "document.",
    "window.",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "fetch(",
    "XMLHttpRequest",
    "captureFix",
    "combat-runtime",
    "../ui/"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `catalog module must not contain ${forbidden}`
    );
  }
});
