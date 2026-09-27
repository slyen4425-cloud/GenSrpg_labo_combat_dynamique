import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCombatSkillLibraryManifestV1,
  loadCombatSkillLibraryV1
} from "../../src/adapters/input/combat-skill-library-v1.js";

const expectedIds = [
  "aerial-dive",
  "claw",
  "contact-counter",
  "dodge",
  "fire-immunity",
  "fireball",
  "mirror-shield",
  "stun-bolt",
  "teleport-strike"
];

async function readJson(path) {
  return JSON.parse(
    await readFile(
      new URL(path, import.meta.url),
      "utf8"
    )
  );
}

test("Combat Skill Library manifest indexes all current lab skills exactly once", async () => {
  const manifest = await readJson(
    "../../data/combat/skills/catalog.v1.json"
  );

  const normalized =
    normalizeCombatSkillLibraryManifestV1(manifest);

  assert.deepEqual(
    normalized.entries.map((entry) => entry.id).sort(),
    [...expectedIds].sort()
  );
});

test("Combat Skill Library loads and normalizes the real skill files", async () => {
  const manifest = await readJson(
    "../../data/combat/skills/catalog.v1.json"
  );

  const library = await loadCombatSkillLibraryV1({
    manifest,
    loadDefinition: async (source) =>
      readJson("../../data/combat/skills/" + source)
  });

  assert.equal(library.skills.length, expectedIds.length);
  assert.equal(library.byId.fireball.name, "Boule de feu");
  assert.equal(library.byId.claw.form, "contact");
  assert.equal(
    library.byId["teleport-strike"].approachMode,
    "teleport"
  );
  assert.equal(Object.isFrozen(library), true);
  assert.equal(Object.isFrozen(library.skills), true);
});

test("Combat Skill Library refuses manifest/definition id mismatch", async () => {
  const manifest = {
    schema: "combat-skill-library-v1",
    entries: [
      {
        id: "fireball",
        source: "claw.skill.json"
      }
    ]
  };

  await assert.rejects(
    () =>
      loadCombatSkillLibraryV1({
        manifest,
        loadDefinition: async () => ({
          id: "claw",
          name: "Griffe",
          category: "offensive",
          form: "contact",
          element: null,
          approachMode: "ground",
          energyCost: 2,
          preparationMs: 100,
          travelMs: 100,
          recoveryMs: 100,
          allowedDistances: ["short"],
          targetRelations: ["enemy"],
          effect: { damage: 1 }
        })
      }),
    /manifest.*fireball.*definition.*claw/i
  );
});

test("Combat Skill Library refuses duplicate ids and unsafe sources", () => {
  assert.throws(
    () =>
      normalizeCombatSkillLibraryManifestV1({
        schema: "combat-skill-library-v1",
        entries: [
          { id: "fireball", source: "fireball.skill.json" },
          { id: "fireball", source: "other.skill.json" }
        ]
      }),
    /duplicate/i
  );

  for (const source of [
    "https://example.com/fireball.json",
    "/absolute/fireball.json",
    "../outside.json"
  ]) {
    assert.throws(
      () =>
        normalizeCombatSkillLibraryManifestV1({
          schema: "combat-skill-library-v1",
          entries: [
            { id: "fireball", source }
          ]
        }),
      /source/i
    );
  }
});

test("Combat Skill Library adapter stays independent from UI, runtime, storage and GenSrpG", async () => {
  const source = await readFile(
    new URL(
      "../../src/adapters/input/combat-skill-library-v1.js",
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
    "Zombicide-40k",
    "captureFix",
    "combat-runtime",
    "renderer/"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      "skill library adapter must not contain " + forbidden
    );
  }
});
