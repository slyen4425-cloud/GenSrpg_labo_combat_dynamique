import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCaptureSkillEditorDraftV1
} from "../../src/contracts/capture-skill-editor-draft-v1.js";
import {
  adaptCaptureSkillToSkillDefinition
} from "../../src/adapters/input/capture/capture-skill-to-skill-definition.js";

const DEMO_SKILL_FILES = Object.freeze([
  "fireball.skill.json",
  "claw.skill.json",
  "aerial-dive.skill.json",
  "teleport-strike.skill.json"
]);

test("showcase skills declare a real non-zero cooldown", async () => {
  for (const file of DEMO_SKILL_FILES) {
    const raw = JSON.parse(
      await readFile(
        new URL(
          "../../data/combat/skills/" + file,
          import.meta.url
        ),
        "utf8"
      )
    );

    assert.equal(
      Number.isFinite(raw.cooldownMs),
      true,
      file + " must declare cooldownMs explicitly"
    );
    assert.ok(
      raw.cooldownMs > 0,
      file + " must have a non-zero cooldown"
    );
  }
});

test("Capture editor cooldown crosses the authoritative export definition boundary intact", () => {
  const draft = normalizeCaptureSkillEditorDraftV1({
    schema: "capture-skill-editor-draft-v1",
    id: "cooldown-probe",
    description: "",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    definition: {
      id: "cooldown-probe",
      name: "Cooldown Probe",
      category: "offensive",
      form: "contact",
      element: null,
      approachMode: "ground",
      energyCost: 1,
      preparationMs: 100,
      travelMs: 100,
      recoveryMs: 100,
      cooldownMs: 2750,
      allowedDistances: ["short"],
      targetRelations: ["enemy"],
      effect: { damage: 1 }
    },
    presentation: null
  });

  const definition =
    adaptCaptureSkillToSkillDefinition(draft);

  assert.equal(draft.definition.cooldownMs, 2750);
  assert.equal(definition.cooldownMs, 2750);
});

test("Capture combat preview renders authoritative cooldown remaining from the existing runtime clock", async () => {
  const [uiSource, runtimeSource] = await Promise.all([
    readFile(
      new URL(
        "../../src/ui/combat-2v2-test-ui.js",
        import.meta.url
      ),
      "utf8"
    ),
    readFile(
      new URL(
        "../../src/core/combat/combat-runtime.js",
        import.meta.url
      ),
      "utf8"
    )
  ]);

  assert.match(uiSource, /remainingCooldownMs/);
  assert.match(uiSource, /data\.combatCooldown/);
  assert.match(uiSource, /onClock\s*\(/);
  assert.match(runtimeSource, /onClock\s*=\s*\(\)\s*=>\s*\{\}/);
  assert.match(runtimeSource, /onClock\(/);
  assert.equal(/cooldown/i.test(runtimeSource), false);
});
