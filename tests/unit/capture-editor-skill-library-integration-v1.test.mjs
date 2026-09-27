import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  humanSkillFieldsFromLibraryDefinitionV1,
  buildHumanSkillDraftV1,
  buildHumanSkillDraftSetV1
} from "../../src/ui/capture-editor-human-v2.js";

import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";

function definition(id, overrides = {}) {
  return normalizeSkillDefinition({
    id,
    name: id,
    category: "offensive",
    form: "contact",
    element: null,
    approachMode: "ground",
    energyCost: 2,
    preparationMs: 500,
    travelMs: 600,
    recoveryMs: 300,
    cooldownMs: 1000,
    allowedDistances: ["short", "medium"],
    targetRelations: ["enemy"],
    reaction: {},
    evasion: {},
    projectileClash: { mode: "none" },
    effect: { damage: 2 },
    ...overrides
  });
}

test("library definition maps to human fields without losing advanced rules", () => {
  const source = definition("aerial-dive", {
    name: "Plongeon aérien",
    approachMode: "aerial",
    evasion: {
      window: "travel",
      incomingForms: ["contact", "projectile"]
    },
    effect: {
      damage: 22,
      tags: ["aerial"]
    }
  });

  const fields =
    humanSkillFieldsFromLibraryDefinitionV1(source);

  assert.equal(fields.id, "aerial-dive");
  assert.equal(fields.name, "Plongeon aérien");
  assert.equal(fields.damage, 22);
  assert.deepEqual(
    fields.evasion.incomingForms,
    ["contact", "projectile"]
  );
  assert.deepEqual(fields.effectTags, ["aerial"]);
  assert.equal(fields.baseDefinition, source);
});

test("editing a library skill preserves its advanced definition while overriding human controls", () => {
  const source = definition("dodge", {
    category: "defensive",
    form: "self",
    approachMode: "none",
    reaction: {
      evadeForms: ["contact", "projectile"]
    },
    effect: {
      damage: 0
    }
  });

  const fields =
    humanSkillFieldsFromLibraryDefinitionV1(source);

  const draft = buildHumanSkillDraftV1({
    ...fields,
    energyCost: 4,
    presentation: {}
  });

  assert.equal(draft.definition.energyCost, 4);
  assert.deepEqual(
    draft.definition.reaction.evadeForms,
    ["contact", "projectile"]
  );
});

test("skill draft set uses edited skill plus untouched equipped library definitions", () => {
  const fireball = definition("fireball", {
    name: "Boule de feu",
    form: "projectile",
    approachMode: "none",
    projectileClash: {
      mode: "mutual_cancel",
      group: "fire-orb",
      interactsWith: ["fire-orb"]
    }
  });
  const claw = definition("claw", {
    name: "Griffe"
  });

  const edited = buildHumanSkillDraftV1({
    ...humanSkillFieldsFromLibraryDefinitionV1(fireball),
    damage: 99,
    presentation: {}
  });

  const drafts = buildHumanSkillDraftSetV1({
    editedSkillDraft: edited,
    equippedSkillIds: ["fireball", "claw"],
    skillLibrary: {
      byId: {
        fireball,
        claw
      }
    }
  });

  assert.deepEqual(
    drafts.map((draft) => draft.id),
    ["fireball", "claw"]
  );
  assert.equal(
    drafts.find((draft) => draft.id === "fireball")
      .definition.effect.damage,
    99
  );
  assert.equal(
    drafts.find((draft) => draft.id === "claw")
      .definition.name,
    "Griffe"
  );
});

test("skill draft set rejects equipped ids absent from the real library", () => {
  const fireball = definition("fireball");
  const edited = buildHumanSkillDraftV1({
    ...humanSkillFieldsFromLibraryDefinitionV1(fireball),
    presentation: {}
  });

  assert.throws(
    () =>
      buildHumanSkillDraftSetV1({
        editedSkillDraft: edited,
        equippedSkillIds: ["fireball", "ghost"],
        skillLibrary: {
          byId: { fireball }
        }
      }),
    /inconnue.*ghost/i
  );
});

test("human editor page exposes a library selector and no hardcoded loadout skill options", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  assert.equal(
    html.includes("data-skill-library-select"),
    true
  );

  for (const select of html.matchAll(
    /<select data-loadout-slot>([\s\S]*?)<\/select>/g
  )) {
    assert.equal(
      /value="fireball"/.test(select[1]),
      false,
      "loadout options must come from Skill Library"
    );
  }
});

test("demo boot owns skill-library file loading, editor UI only receives normalized library", async () => {
  const boot = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.js",
      import.meta.url
    ),
    "utf8"
  );
  const ui = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.equal(
    boot.includes("loadCombatSkillLibraryV1"),
    true
  );
  assert.equal(
    boot.includes("data/combat/skills/catalog.v1.json"),
    true
  );
  assert.equal(
    ui.includes("data/combat/skills/catalog.v1.json"),
    false
  );
});
