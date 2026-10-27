import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCaptureSkillEditorDraftV1
} from "../../src/contracts/capture-skill-editor-draft-v1.js";
import {
  resolveCombatPresentationViewV1
} from "../../src/ui/combat-2v2-test-ui.js";

const baseVisual = {
  assetId: "pack:capture:sprite-fireball-travel-01",
  displayScale: 1,
  attachment: "trajectory",
  anchor: "projectile",
  offsetX: 0,
  offsetY: 0,
  trigger: "travel-start",
  playbackMode: "once",
  rotationDeg: 0,
  opacity: 1
};

function presentationV2() {
  return {
    id: "skill:fireball",
    version: 2,
    subjectType: "skill",
    subjectId: "fireball",
    visual: {
      cast: {
        ...baseVisual,
        assetId: "pack:capture:sprite-fireball-cast-01",
        attachment: "source",
        trigger: "preparation-start",
        layerByView: {
          player: "behind",
          opponent: "front"
        }
      },
      travel: {
        ...baseVisual,
        layerByView: {
          player: "behind",
          opponent: "front"
        }
      }
    },
    audio: {}
  };
}

test("SkillPresentationBindingV2 stores explicit player/opponent layers", async () => {
  const {
    normalizeSkillPresentationBindingV2
  } = await import(
    "../../src/contracts/skill-presentation-binding-v2.js"
  );

  const binding =
    normalizeSkillPresentationBindingV2(
      presentationV2()
    );

  assert.equal(binding.version, 2);
  assert.deepEqual(
    binding.visual.cast.layerByView,
    { player: "behind", opponent: "front" }
  );
  assert.deepEqual(
    binding.visual.travel.layerByView,
    { player: "behind", opponent: "front" }
  );
});

test("CaptureSkillEditorDraftV1 accepts the independently versioned V2 presentation", () => {
  const draft =
    normalizeCaptureSkillEditorDraftV1({
      schema: "capture-skill-editor-draft-v1",
      id: "fireball",
      description: "test",
      requiredLevel: 1,
      usageScopes: ["capture", "combat"],
      definition: {
        id: "fireball",
        name: "Boule de feu",
        category: "offensive",
        form: "projectile",
        element: "fire",
        approachMode: "none",
        energyCost: 1,
        preparationMs: 100,
        travelMs: 100,
        recoveryMs: 0,
        cooldownMs: 0,
        allowedDistances: ["short", "medium", "long"],
        targetRelations: ["enemy"],
        effect: { damage: 5 }
      },
      presentation: presentationV2()
    });

  assert.equal(draft.presentation.version, 2);
});

test("renderer presentation adapter resolves different layers by semantic view and keeps V1 compatible", async () => {
  const {
    createCaptureSkillPresentationAssetsV2
  } = await import(
    "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js"
  );

  const assets = createCaptureSkillPresentationAssetsV2({
    skillPresentations: {
      fireball: presentationV2(),
      legacy: {
        id: "skill:legacy",
        version: 1,
        subjectType: "skill",
        subjectId: "legacy",
        visual: {
          travel: {
            ...baseVisual,
            layer: "behind"
          }
        },
        audio: {}
      }
    },
    assetForId(assetId) {
      return { assetId, url: "https://example.invalid/" + assetId };
    }
  });

  assert.equal(
    assets.presentationForSkill(
      "fireball",
      { view: "player" }
    ).travelLayer,
    "behind"
  );
  assert.equal(
    assets.presentationForSkill(
      "fireball",
      { view: "opponent" }
    ).travelLayer,
    "front"
  );
  assert.equal(
    assets.presentationForSkill(
      "fireball",
      { view: "player" }
    ).castLayer,
    "behind"
  );
  assert.equal(
    assets.presentationForSkill(
      "fireball",
      { view: "opponent" }
    ).castLayer,
    "front"
  );

  assert.equal(
    assets.presentationForSkill(
      "legacy",
      { view: "opponent" }
    ).travelLayer,
    "behind"
  );
});

test("combat preview derives player/opponent presentation view from teams, not actor ids", () => {
  const format = {
    localActorId: "hero-alpha",
    actors: [
      { actorId: "hero-alpha", teamId: "blue" },
      { actorId: "friend-z", teamId: "blue" },
      { actorId: "foe-x", teamId: "red" },
      { actorId: "foe-y", teamId: "red" }
    ]
  };

  assert.equal(
    resolveCombatPresentationViewV1({
      format,
      actorId: "friend-z"
    }),
    "player"
  );
  assert.equal(
    resolveCombatPresentationViewV1({
      format,
      actorId: "foe-y"
    }),
    "opponent"
  );
});

test("human editor exposes separate cast and projectile depth controls for player and opponent views", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const marker of [
    "data-skill-cast-layer-player",
    "data-skill-cast-layer-opponent",
    "data-skill-travel-layer-player",
    "data-skill-travel-layer-opponent"
  ]) {
    assert.equal(
      html.includes(marker),
      true,
      "missing " + marker
    );
  }

  assert.equal(
    html.includes("data-skill-travel-layer>"),
    false,
    "single global projectile depth control must be removed"
  );
});
