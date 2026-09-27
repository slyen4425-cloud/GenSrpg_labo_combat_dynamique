import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  adaptCapturePresentationBindings,
  adaptCaptureSkillPresentationBinding,
  adaptCaptureCreaturePresentationBinding
} from "../../src/adapters/input/capture/presentation-adapter.js";

function fixture() {
  return {
    schema: "capture-combat-export-v1",
    battle: {
      id: "preview",
      localActorId: "player"
    },
    teams: {
      players: ["player"],
      enemies: ["opponent"]
    },
    actors: [
      {
        actorId: "player",
        teamId: "players",
        creatureId: "maraileron",
        displayName: "Maraileron",
        controllerId: "human-local"
      },
      {
        actorId: "opponent",
        teamId: "enemies",
        creatureId: "braisombre",
        displayName: "Braisombre",
        controllerId: "ai-enemy"
      }
    ],
    creatures: [
      {
        id: "maraileron",
        displayName: "Maraileron",
        combat: {
          maxHp: 100,
          initialHp: 100,
          maxEnergy: 10,
          initialEnergy: 0,
          energyChargeAmount: 1,
          energyChargeIntervalMs: 2000,
          movementEnergyPerStep: 1,
          chargeTimeModifierPct: 0
        },
        skillIds: ["water-wave"]
      },
      {
        id: "braisombre",
        displayName: "Braisombre",
        combat: {
          maxHp: 120,
          initialHp: 120,
          maxEnergy: 10,
          initialEnergy: 0,
          energyChargeAmount: 1,
          energyChargeIntervalMs: 2000,
          movementEnergyPerStep: 3,
          chargeTimeModifierPct: 0
        },
        skillIds: ["fireball"]
      }
    ],
    skills: [
      {
        id: "water-wave",
        definition: {
          id: "water-wave",
          name: "Vague",
          category: "offensive",
          form: "projectile",
          element: "water",
          approachMode: "none",
          energyCost: 2,
          preparationMs: 600,
          travelMs: 600,
          recoveryMs: 400,
          allowedDistances: ["short", "medium", "long"],
          targetRelations: ["enemy"],
          effect: { damage: 18 }
        }
      },
      {
        id: "fireball",
        definition: {
          id: "fireball",
          name: "Boule de feu",
          category: "offensive",
          form: "projectile",
          element: "fire",
          approachMode: "none",
          energyCost: 3,
          preparationMs: 1000,
          travelMs: 700,
          recoveryMs: 500,
          allowedDistances: ["short", "medium", "long"],
          targetRelations: ["enemy"],
          effect: { damage: 30 }
        }
      }
    ],
    rosters: [],
    presentation: {
      bindings: [
        {
          schema: "presentation-binding-v1",
          subjectType: "skill",
          subjectId: "fireball",
          visual: {
            icon: {
              assetId: "core:icon-skill-fireball-01"
            },
            travel: {
              assetId: "pack:capture:sprite-fireball-travel-01",
              attachment: "path",
              trigger: "travel",
              displayScale: 2.8
            },
            impact: {
              assetId: "pack:capture:sprite-fireball-impact-01",
              attachment: "target",
              trigger: "impact"
            }
          },
          audio: {
            cast: {
              assetId: "gensrpg:sound:fire-cast-01",
              volume: 0.72
            }
          }
        },
        {
          schema: "presentation-binding-v1",
          subjectType: "creature",
          subjectId: "maraileron",
          visual: {
            player: {
              assetId: "project:maraileron-player"
            },
            opponent: {
              assetId: "project:maraileron-opponent"
            },
            icon: {
              assetId: "project:maraileron-icon"
            }
          }
        }
      ]
    }
  };
}

test("Capture presentation adapter returns native PresentationBindingV1 values", () => {
  const bindings = adaptCapturePresentationBindings(fixture());

  assert.equal(bindings.length, 2);
  assert.equal(bindings[0].subjectType, "skill");
  assert.equal(bindings[0].subjectId, "fireball");
  assert.equal(bindings[0].visual.travel.displayScale, 2.8);
  assert.equal(bindings[1].subjectType, "creature");
  assert.equal(bindings[1].subjectId, "maraileron");
  assert.equal(Object.isFrozen(bindings), true);
});

test("Capture presentation adapter rejects unknown skill and creature subjects", () => {
  const badSkill = fixture();
  badSkill.presentation.bindings[0].subjectId = "missing-skill";
  assert.throws(
    () => adaptCapturePresentationBindings(badSkill),
    /unknown.*skill/i
  );

  const badCreature = fixture();
  badCreature.presentation.bindings[1].subjectId = "missing-creature";
  assert.throws(
    () => adaptCapturePresentationBindings(badCreature),
    /unknown.*creature/i
  );
});

test("Capture presentation adapter rejects duplicate bindings for one subject", () => {
  const input = fixture();
  input.presentation.bindings.push(
    structuredClone(input.presentation.bindings[0])
  );

  assert.throws(
    () => adaptCapturePresentationBindings(input),
    /duplicate.*binding/i
  );
});

test("Capture presentation adapter treats missing bindings as no presentation", () => {
  const input = fixture();
  input.presentation = {};

  const bindings = adaptCapturePresentationBindings(input);

  assert.deepEqual(bindings, []);
  assert.equal(Object.isFrozen(bindings), true);
});

test("Capture skill and creature presentation lookups return binding or null", () => {
  const input = fixture();

  assert.equal(
    adaptCaptureSkillPresentationBinding(input, "fireball")?.subjectId,
    "fireball"
  );
  assert.equal(
    adaptCaptureSkillPresentationBinding(input, "water-wave"),
    null
  );
  assert.equal(
    adaptCaptureCreaturePresentationBinding(input, "maraileron")?.subjectId,
    "maraileron"
  );
  assert.equal(
    adaptCaptureCreaturePresentationBinding(input, "braisombre"),
    null
  );
});

test("Capture presentation adapter never infers old presentation maps", () => {
  const input = fixture();
  input.presentation = {
    skills: {
      fireball: {
        icon: "core:icon-skill-fireball-01"
      }
    },
    creatures: {
      maraileron: {
        playerAssetId: "project:maraileron-player"
      }
    }
  };

  assert.deepEqual(adaptCapturePresentationBindings(input), []);
});

test("invalid physical assets fail through PresentationBindingV1", () => {
  const input = fixture();
  input.presentation.bindings[0].visual.icon.assetId =
    "assets/icons/fireball.png";

  assert.throws(
    () => adaptCapturePresentationBindings(input),
    /assetId.*logical|physical|path|URL/i
  );
});

test("Capture presentation adapter has no resolver, gameplay, DOM, storage or network authority", async () => {
  const source = await readFile(
    "src/adapters/input/capture/presentation-adapter.js",
    "utf8"
  );

  assert.doesNotMatch(
    source,
    /demo-assets|global-visual-library|skill-definition|core\/combat/
  );
  assert.doesNotMatch(
    source,
    /window\.|document\.|localStorage|sessionStorage|indexedDB|MutationObserver|fetch\(|XMLHttpRequest/
  );
});
