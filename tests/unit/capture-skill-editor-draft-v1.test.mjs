import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_SKILL_EDITOR_DRAFT_SCHEMA,
  normalizeCaptureSkillEditorDraftV1
} from "../../src/contracts/capture-skill-editor-draft-v1.js";

function validDraft() {
  return {
    schema: "capture-skill-editor-draft-v1",
    id: "fireball",
    description: "Projectile de feu configurable.",
    requiredLevel: 5,
    usageScopes: ["capture", "combat"],
    definition: {
      id: "fireball",
      name: "Boule de feu",
      category: "offensive",
      form: "projectile",
      element: "fire",
      approachMode: "none",
      energyCost: 3,
      preparationMs: 900,
      travelMs: 650,
      recoveryMs: 450,
      allowedDistances: ["medium", "long"],
      targetRelations: ["enemy"],
      projectileClash: {
        mode: "mutual_cancel",
        group: "fire-orb",
        interactsWith: ["fire-orb"]
      },
      effect: {
        damage: 4,
        tags: ["fire"]
      }
    },
    presentation: {
      id: "skill:fireball",
      version: 1,
      subjectType: "skill",
      subjectId: "fireball",
      visual: {
        icon: {
          assetId: "capture:icon-fireball"
        },
        travel: {
          assetId: "capture:fx-fireball",
          attachment: "trajectory",
          trigger: "travel-start"
        },
        impact: {
          assetId: "capture:fx-fire-impact",
          attachment: "fixed-target",
          trigger: "impact"
        }
      },
      audio: {
        release: {
          assetId: "core:audio-fire-release",
          volume: 0.8,
          loop: false
        }
      }
    }
  };
}

test("CaptureSkillEditorDraftV1 composes the native skill and presentation contracts", () => {
  const value = normalizeCaptureSkillEditorDraftV1(validDraft());

  assert.equal(
    CAPTURE_SKILL_EDITOR_DRAFT_SCHEMA,
    "capture-skill-editor-draft-v1"
  );
  assert.equal(value.schema, CAPTURE_SKILL_EDITOR_DRAFT_SCHEMA);
  assert.equal(value.id, "fireball");
  assert.equal(value.definition.form, "projectile");
  assert.equal(value.definition.energyCost, 3);
  assert.equal(value.presentation.subjectId, "fireball");
  assert.equal(
    value.presentation.visual.travel.assetId,
    "capture:fx-fireball"
  );
  assert.deepEqual(value.usageScopes, ["capture", "combat"]);
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.definition), true);
  assert.equal(Object.isFrozen(value.presentation), true);
  assert.equal(Object.isFrozen(value.usageScopes), true);
});

test("CaptureSkillEditorDraftV1 never infers form from a legacy-looking name", () => {
  const input = validDraft();
  input.definition.name = "Boule de feu projectile";
  delete input.definition.form;

  assert.throws(
    () => normalizeCaptureSkillEditorDraftV1(input),
    /form/i
  );
});

test("CaptureSkillEditorDraftV1 never infers category from description or element", () => {
  const input = validDraft();
  input.description = "Attaque offensive qui inflige des dégâts.";
  delete input.definition.category;

  assert.throws(
    () => normalizeCaptureSkillEditorDraftV1(input),
    /category/i
  );
});

test("CaptureSkillEditorDraftV1 requires draft id and SkillDefinition id to match", () => {
  const input = validDraft();
  input.definition.id = "legacy-fireball";

  assert.throws(
    () => normalizeCaptureSkillEditorDraftV1(input),
    /definition\.id.*match/i
  );
});

test("CaptureSkillEditorDraftV1 validates optional presentation against the same skill", () => {
  const input = validDraft();
  input.presentation.subjectId = "another-skill";

  assert.throws(
    () => normalizeCaptureSkillEditorDraftV1(input),
    /presentation\.subjectId.*match/i
  );

  const withoutPresentation = validDraft();
  withoutPresentation.presentation = null;
  const value = normalizeCaptureSkillEditorDraftV1(withoutPresentation);
  assert.equal(value.presentation, null);
});

test("CaptureSkillEditorDraftV1 validates editor progression metadata without gameplay inference", () => {
  const badLevel = validDraft();
  badLevel.requiredLevel = 0;
  assert.throws(
    () => normalizeCaptureSkillEditorDraftV1(badLevel),
    /requiredLevel/i
  );

  const duplicateScopes = validDraft();
  duplicateScopes.usageScopes.push("capture");
  assert.throws(
    () => normalizeCaptureSkillEditorDraftV1(duplicateScopes),
    /usageScopes.*duplicate/i
  );
});

test("CaptureSkillEditorDraftV1 rejects unknown editor semantic fields", () => {
  const input = validDraft();
  input.legacyPower = 9;

  assert.throws(
    () => normalizeCaptureSkillEditorDraftV1(input),
    /unknown field/i
  );
});

test("CaptureSkillEditorDraftV1 is independent from UI, storage, network and GenSrpG", async () => {
  const source = await readFile(
    new URL(
      "../../src/contracts/capture-skill-editor-draft-v1.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const forbidden of [
    "document.",
    "window.",
    "localStorage",
    "sessionStorage",
    "fetch(",
    "XMLHttpRequest",
    "Zombicide-40k",
    "captureFix",
    "openAbilityLibrary"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `contract source must not contain ${forbidden}`
    );
  }
});
