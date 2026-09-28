import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const catalogUrl = new URL(
  "../../data/capture/skills/gensrpg-capture-legacy-skill-catalog.v1.json",
  import.meta.url
);

async function loadCatalog() {
  return JSON.parse(await readFile(catalogUrl, "utf8"));
}

test("legacy Capture skill catalog preserves the exact production source identity", async () => {
  const catalog = await loadCatalog();

  assert.equal(
    catalog.schema,
    "gensrpg-capture-legacy-skill-catalog-v1"
  );
  assert.deepEqual(catalog.source, {
    repository: "slyen4425-cloud/Zombicide-40k",
    commit: "49289784ee92a47fd51089815ca25954cdba4493",
    blob: "74e223b2c9877e6a88b6ad6726290d230f1f616e",
    inlineOwner: "builtinMonsterCapture162",
    constant: "MC162_ABILITIES"
  });
});

test("legacy Capture skill catalog contains all 173 unique abilities", async () => {
  const catalog = await loadCatalog();

  assert.equal(catalog.entries.length, 173);
  const ids = catalog.entries.map((entry) => entry.id);
  assert.equal(new Set(ids).size, 173);
});

test("legacy Capture skill catalog preserves representative complex semantics", async () => {
  const catalog = await loadCatalog();
  const byId = new Map(
    catalog.entries.map((entry) => [entry.id, entry])
  );

  assert.deepEqual(
    byId.get("lib_fireball")?.effects,
    [{ kind: "damage", base: 5, element: "fire" }]
  );

  assert.deepEqual(
    byId.get("cap_poison_special_1")?.effects,
    [
      {
        kind: "damage",
        base: 1,
        element: "poison",
        target: "enemy"
      },
      {
        kind: "dot",
        base: 2,
        value: 2,
        duration: 3,
        element: "poison",
        target: "enemy"
      }
    ]
  );

  assert.deepEqual(
    byId.get("rpg_slash_bleed")?.effects,
    [
      {
        kind: "damage",
        base: 3,
        scaleAttribute: "force",
        scaleCoeff: 0.5,
        target: "enemy",
        damageType: "physical",
        duration: 0
      },
      {
        kind: "dot",
        base: 2,
        scaleAttribute: "force",
        scaleCoeff: 0.15,
        target: "enemy",
        damageType: "physical",
        status: "bleed",
        duration: 3
      }
    ]
  );
});

test("legacy source catalog remains migration data, not a native SkillDefinition catalog", async () => {
  const catalog = await loadCatalog();

  assert.equal("nativeDefinitions" in catalog, false);
  assert.equal("convertedEntries" in catalog, false);

  const kinds = new Set(
    catalog.entries.flatMap((entry) =>
      (entry.effects ?? []).map((effect) =>
        String(effect.kind ?? "").toLowerCase()
      )
    )
  );

  for (const expected of [
    "damage",
    "heal",
    "buff",
    "debuff",
    "dot",
    "hot",
    "stat_mod",
    "attribute",
    "life_steal",
    "area_damage",
    "resistance_mod"
  ]) {
    assert.equal(
      kinds.has(expected),
      true,
      "missing preserved effect kind: " + expected
    );
  }
});
