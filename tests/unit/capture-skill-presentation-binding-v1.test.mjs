import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeSkillPresentationBindingV1
} from "../../src/contracts/skill-presentation-binding-v1.js";
import {
  adaptCaptureSkillPresentationBinding
} from "../../src/adapters/input/capture/capture-skill-presentation-adapter-v1.js";

function binding() {
  return {
    id: "skill:fireball",
    version: 1,
    subjectType: "skill",
    subjectId: "fireball",
    visual: {
      icon: {
        assetId: "core:icon-skill-fireball-01"
      },
      cast: {
        assetId: "pack:capture:sprite-cast-fire-01",
        displayScale: 1.5,
        attachment: "source",
        anchor: "mouth",
        offsetX: 2,
        offsetY: -3,
        layer: "front",
        trigger: "preparation-start",
        playbackMode: "loop",
        rotationDeg: 0,
        opacity: 0.9
      },
      travel: {
        assetId: "pack:capture:sprite-projectile-fire-01",
        attachment: "trajectory",
        trigger: "travel-start"
      },
      impact: {
        assetId: "pack:capture:sprite-impact-fire-01",
        attachment: "target",
        trigger: "impact",
        layer: "front"
      }
    },
    audio: {
      cast: {
        assetId: "core:sound-fire-cast-01",
        volume: 0.7,
        loop: false
      },
      impact: {
        assetId: "core:sound-fire-impact-01"
      }
    }
  };
}

function exported({ withPresentation = true } = {}) {
  const skill = {
    id: "fireball",
    definition: {
      id: "fireball",
      name: "Boule de feu",
      category: "offensive",
      form: "projectile",
      element: "fire"
    },
    presentationId: withPresentation ? "skill:fireball" : null
  };

  return {
    schema: "capture-combat-export-v1",
    battle: {
      id: "duel",
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
        creatureId: "a",
        displayName: "A",
        controllerId: "human-local"
      },
      {
        actorId: "opponent",
        teamId: "enemies",
        creatureId: "b",
        displayName: "B",
        controllerId: "ai-enemy"
      }
    ],
    creatures: [
      {
        id: "a",
        displayName: "A",
        combat: { maxHp: 100, maxEnergy: 10 },
        skillIds: ["fireball"]
      },
      {
        id: "b",
        displayName: "B",
        combat: { maxHp: 100, maxEnergy: 10 },
        skillIds: []
      }
    ],
    skills: [skill],
    presentation: withPresentation
      ? {
          skills: {
            "skill:fireball": binding()
          }
        }
      : {}
  };
}

test("SkillPresentationBindingV1 normalizes visual and audio data only", () => {
  const result = normalizeSkillPresentationBindingV1(binding());

  assert.equal(result.id, "skill:fireball");
  assert.equal(result.version, 1);
  assert.equal(result.subjectType, "skill");
  assert.equal(result.subjectId, "fireball");
  assert.deepEqual(result.visual.icon, {
    assetId: "core:icon-skill-fireball-01"
  });
  assert.equal(result.visual.cast.displayScale, 1.5);
  assert.equal(result.visual.cast.anchor, "mouth");
  assert.equal(result.visual.cast.offsetX, 2);
  assert.equal(result.visual.cast.offsetY, -3);
  assert.equal(result.visual.cast.opacity, 0.9);
  assert.equal(result.audio.cast.volume, 0.7);
  assert.equal(result.audio.cast.loop, false);
  assert.equal(Object.isFrozen(result), true);
});

test("SkillPresentationBindingV1 applies presentation-only defaults", () => {
  const input = binding();
  input.visual.travel = {
    assetId: "pack:capture:sprite-projectile-fire-01",
    attachment: "trajectory",
    trigger: "travel-start"
  };
  input.audio.impact = {
    assetId: "core:sound-fire-impact-01"
  };

  const result = normalizeSkillPresentationBindingV1(input);

  assert.deepEqual(result.visual.travel, {
    assetId: "pack:capture:sprite-projectile-fire-01",
    displayScale: 1,
    attachment: "trajectory",
    anchor: null,
    offsetX: 0,
    offsetY: 0,
    layer: "front",
    trigger: "travel-start",
    playbackMode: "once",
    rotationDeg: 0,
    opacity: 1
  });
  assert.deepEqual(result.audio.impact, {
    assetId: "core:sound-fire-impact-01",
    volume: 1,
    loop: false
  });
});

test("SkillPresentationBindingV1 requires stable asset ids and rejects paths or URLs", () => {
  for (const assetId of [
    "assets/fx/fire.png",
    "https://example.com/fire.png",
    "../fire.png",
    "fire.png"
  ]) {
    const input = binding();
    input.visual.cast.assetId = assetId;
    assert.throws(
      () => normalizeSkillPresentationBindingV1(input),
      /assetId/i
    );
  }
});

test("SkillPresentationBindingV1 validates scale offsets opacity and audio volume", () => {
  const badScale = binding();
  badScale.visual.cast.displayScale = 0;
  assert.throws(
    () => normalizeSkillPresentationBindingV1(badScale),
    /displayScale/i
  );

  const badOffset = binding();
  badOffset.visual.cast.offsetX = Infinity;
  assert.throws(
    () => normalizeSkillPresentationBindingV1(badOffset),
    /offsetX/i
  );

  const badOpacity = binding();
  badOpacity.visual.cast.opacity = 1.2;
  assert.throws(
    () => normalizeSkillPresentationBindingV1(badOpacity),
    /opacity/i
  );

  const badVolume = binding();
  badVolume.audio.cast.volume = -0.1;
  assert.throws(
    () => normalizeSkillPresentationBindingV1(badVolume),
    /volume/i
  );
});

test("SkillPresentationBindingV1 refuses gameplay or unknown fields", () => {
  const gameplayTop = binding();
  gameplayTop.damage = 50;
  assert.throws(
    () => normalizeSkillPresentationBindingV1(gameplayTop),
    /unknown field/i
  );

  const gameplaySlot = binding();
  gameplaySlot.visual.cast.energyCost = 3;
  assert.throws(
    () => normalizeSkillPresentationBindingV1(gameplaySlot),
    /unknown field/i
  );
});

test("Capture presentation adapter returns null when a skill has no binding", () => {
  assert.equal(
    adaptCaptureSkillPresentationBinding(
      exported({ withPresentation: false }),
      "fireball"
    ),
    null
  );
});

test("Capture presentation adapter validates binding identity against exported skill", () => {
  const input = exported();
  input.presentation.skills["skill:fireball"].subjectId = "other";

  assert.throws(
    () => adaptCaptureSkillPresentationBinding(input, "fireball"),
    /subjectId/i
  );

  const badId = exported();
  badId.presentation.skills["skill:fireball"].id = "skill:other";
  assert.throws(
    () => adaptCaptureSkillPresentationBinding(badId, "fireball"),
    /presentationId|binding id/i
  );
});

test("Capture presentation adapter returns a normalized binding without gameplay", () => {
  const result = adaptCaptureSkillPresentationBinding(
    exported(),
    "fireball"
  );

  assert.equal(result.subjectId, "fireball");
  assert.equal(result.visual.travel.attachment, "trajectory");
  assert.equal("damage" in result, false);
  assert.equal("energyCost" in result, false);
});

test("presentation contract and adapter have no asset resolution, DOM, storage or network authority", async () => {
  const contract = await readFile(
    "src/contracts/skill-presentation-binding-v1.js",
    "utf8"
  );
  const adapter = await readFile(
    "src/adapters/input/capture/capture-skill-presentation-adapter-v1.js",
    "utf8"
  );

  for (const source of [contract, adapter]) {
    assert.doesNotMatch(
      source,
      /raw\.githubusercontent|github\.com|new URL|window\.|document\.|localStorage|sessionStorage|indexedDB|MutationObserver|fetch\(|XMLHttpRequest/
    );
  }

  assert.doesNotMatch(
    contract,
    /damage|heal|energyCost|cooldown|allowedDistances|targetRelations/
  );
});
