import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_USED_ABILITY_CATALOG_V2,
  normalizeCaptureUsedAbilityCatalogV2,
  captureUsedAbilityTemplateV2
} from "../../src/catalogs/capture-used-ability-catalog-v2.js";

function catalog() {
  return normalizeCaptureUsedAbilityCatalogV2(
    CAPTURE_USED_ABILITY_CATALOG_V2
  );
}

test("used Capture catalog contains exactly the 103 abilities referenced by creature abilityIds", () => {
  const value = catalog();

  assert.equal(value.abilities.length, 103);
  assert.equal(
    new Set(value.abilities.map((ability) => ability.id)).size,
    103
  );

  const cap = value.abilities.filter((ability) =>
    ability.id.startsWith("cap_")
  );
  const lib = value.abilities.filter((ability) =>
    ability.id.startsWith("lib_")
  );

  assert.equal(cap.length, 72);
  assert.equal(lib.length, 31);
  assert.equal(
    value.abilities.some((ability) =>
      ability.id.startsWith("cap_neutral_")
    ),
    false
  );
});

test("used Capture catalog preserves representative modern and historical abilities", () => {
  const value = catalog();
  const byId = new Map(
    value.abilities.map((ability) => [ability.id, ability])
  );

  for (const id of [
    "cap_fire_atk_1",
    "cap_poison_special_1",
    "lib_fireball",
    "lib_regen"
  ]) {
    assert.equal(byId.has(id), true, id);
  }

  assert.equal(
    byId.get("cap_fire_atk_1").name,
    "Étincelle"
  );
  assert.equal(
    byId.get("lib_fireball").name,
    "Boule de braise"
  );
  assert.equal(
    byId.get("lib_regen").effects.some(
      (effect) => effect.kind === "hot"
    ),
    true
  );
  assert.equal(
    byId.get("cap_poison_special_1").effects.some(
      (effect) => effect.kind === "dot"
    ),
    true
  );
});

test("used Capture catalog keeps duplicate names as distinct ids instead of silently merging them", () => {
  const value = catalog();
  const grouped = new Map();

  for (const ability of value.abilities) {
    const list = grouped.get(ability.name) ?? [];
    list.push(ability.id);
    grouped.set(ability.name, list);
  }

  assert.deepEqual(
    grouped.get("Morsure de marée")?.sort(),
    ["cap_water_atk_2", "lib_tidal_bite"].sort()
  );
  assert.deepEqual(
    grouped.get("Impact rocheux")?.sort(),
    ["cap_earth_atk_4", "lib_rock_slam"].sort()
  );
});

test("used Capture template never invents modern combat timing, form, energy or presentation", () => {
  const value = catalog();
  const ability = value.abilities.find(
    (entry) => entry.id === "lib_fireball"
  );
  const template = captureUsedAbilityTemplateV2(
    ability
  );

  for (const forbidden of [
    "form",
    "approachMode",
    "energyCost",
    "preparationMs",
    "travelMs",
    "recoveryMs",
    "cooldownMs",
    "presentation"
  ]) {
    assert.equal(
      forbidden in template,
      false,
      forbidden
    );
  }

  assert.equal(template.id, "lib_fireball");
  assert.equal(template.name, "Boule de braise");
});

test("human editor library is wired to the used 103-entry catalog", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-skill-catalog-v1.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /capture-used-ability-catalog-v2/
  );
});

test("used catalog module stays independent from runtime, storage, UI and production repository", async () => {
  const source = await readFile(
    new URL(
      "../../src/catalogs/capture-used-ability-catalog-v2.js",
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
    "Zombicide-40k",
    "../ui/"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      forbidden
    );
  }
});
