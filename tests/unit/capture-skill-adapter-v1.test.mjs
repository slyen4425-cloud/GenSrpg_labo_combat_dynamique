import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  adaptCaptureSkillToSkillDefinition
} from "../../src/adapters/input/capture/capture-skill-to-skill-definition.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";

function exportedSkill() {
  return {
    id: "fireball",
    definition: {
      id: "fireball",
      name: "Boule de feu",
      category: "offensive",
      form: "projectile",
      element: "fire",
      energyCost: 3,
      preparationMs: 1200,
      travelMs: 700,
      recoveryMs: 500,
      allowedDistances: ["medium", "long"],
      effect: {
        damage: 30,
        tags: ["burn-capable"]
      },
      projectileClash: {
        mode: "mutual_cancel",
        group: "fire-orb",
        interactsWith: ["fire-orb"]
      }
    },
    presentationId: "skill:fireball",
    metadata: {
      legacyLabel: "attaque feu"
    }
  };
}

test("Capture skill adapter delegates semantic validation to native SkillDefinition", () => {
  const skill = adaptCaptureSkillToSkillDefinition(exportedSkill());

  assert.equal(skill.id, "fireball");
  assert.equal(skill.name, "Boule de feu");
  assert.equal(skill.form, "projectile");
  assert.equal(skill.element, "fire");
  assert.equal(skill.energyCost, 3);
  assert.deepEqual(skill.allowedDistances, ["medium", "long"]);
  assert.deepEqual(skill.targetRelations, ["enemy"]);
  assert.equal(skill.approachMode, "none");
  assert.equal(skill.effect.damage, 30);
  assert.equal(skill.projectileClash.mode, "mutual_cancel");
});

test("Capture skill adapter preserves native defaults instead of owning another default layer", () => {
  const input = exportedSkill();
  delete input.definition.projectileClash;
  delete input.definition.approachMode;
  delete input.definition.targetRelations;

  const skill = adaptCaptureSkillToSkillDefinition(input);

  assert.equal(skill.approachMode, "none");
  assert.deepEqual(skill.targetRelations, ["enemy"]);
  assert.deepEqual(skill.projectileClash, {
    mode: "none",
    group: null,
    interactsWith: []
  });
});

test("Capture skill adapter rejects mismatched export and definition ids", () => {
  const input = exportedSkill();
  input.definition.id = "other";

  assert.throws(
    () => adaptCaptureSkillToSkillDefinition(input),
    /definition\.id/i
  );
});

test("Capture skill adapter never infers behavior from labels or ids", () => {
  const input = exportedSkill();
  input.id = "looks-like-fireball";
  input.definition.id = "looks-like-fireball";
  input.definition.name = "Boule de feu";
  input.definition.form = "contact";
  input.definition.element = "water";
  input.definition.projectileClash = {
    mode: "none"
  };

  const skill = adaptCaptureSkillToSkillDefinition(input);

  assert.equal(skill.form, "contact");
  assert.equal(skill.element, "water");
  assert.equal(skill.projectileClash.mode, "none");
});

test("Capture skill adapter keeps presentation and metadata out of SkillDefinition", () => {
  const input = exportedSkill();
  input.presentationId = "skill:very-specific-visual";
  input.metadata = {
    icon: "should-not-enter-gameplay",
    legacyCode: "captureFix144"
  };

  const skill = adaptCaptureSkillToSkillDefinition(input);

  assert.equal("presentationId" in skill, false);
  assert.equal("metadata" in skill, false);
  assert.equal("icon" in skill, false);
});

test("Capture skill adapter preserves native SkillDefinition errors", () => {
  const invalidCategory = exportedSkill();
  invalidCategory.definition.category = "legacy_magic_attack";
  assert.throws(
    () => adaptCaptureSkillToSkillDefinition(invalidCategory),
    /Unsupported skill category/i
  );

  const invalidClash = exportedSkill();
  invalidClash.definition.form = "contact";
  assert.throws(
    () => adaptCaptureSkillToSkillDefinition(invalidClash),
    /requires form=projectile/i
  );
});

test("adapted Capture skill works through the real CombatSession preview path", () => {
  const skill = adaptCaptureSkillToSkillDefinition(exportedSkill());
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      {
        id: "player",
        maxHp: 100,
        maxEnergy: 10,
        initialEnergy: 10
      },
      {
        id: "opponent",
        maxHp: 100,
        maxEnergy: 10,
        initialEnergy: 10
      }
    ]
  });

  const result = session.previewSkill({
    actorId: "player",
    targetId: "opponent",
    skill
  });

  assert.equal(result.ok, true);
  assert.equal(result.outcome, "hit");
});

test("Capture skill adapter has no GenSrpG, DOM, storage or presentation authority", async () => {
  const source = await readFile(
    "src/adapters/input/capture/capture-skill-to-skill-definition.js",
    "utf8"
  );

  assert.doesNotMatch(
    source,
    /Zombicide-40k|captureFix\d+|github\.com|window\.|document\.|localStorage|sessionStorage|indexedDB|MutationObserver|fetch\(|XMLHttpRequest|assetId|presentationId/
  );
});
