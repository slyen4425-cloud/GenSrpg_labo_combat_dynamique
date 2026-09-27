import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCaptureCombatBundle
} from "../../src/adapters/input/capture/combat-bundle-v1.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";

function creature(id, displayName, {
  hp = 100,
  energy = 5,
  skillIds = ["fireball"]
} = {}) {
  return {
    id,
    displayName,
    combat: {
      maxHp: hp,
      initialHp: hp,
      maxEnergy: 10,
      initialEnergy: energy,
      energyChargeAmount: 1,
      energyChargeIntervalMs: 2000,
      movementEnergyPerStep: 1,
      chargeTimeModifierPct: 0
    },
    stats: {
      agilite: 10,
      defense: 10
    },
    progression: { level: 1 },
    skillIds
  };
}

function fixture() {
  return {
    version: 1,
    localMemberId: "p1",
    creatures: [
      creature("wolf", "Loup volcanique"),
      creature("golem", "Golem moussu"),
      creature("dolphin", "Maraileron"),
      creature("dragon", "Braisombre"),
      creature("reserve", "Réserve", { skillIds: [] })
    ],
    skills: [
      {
        id: "fireball",
        name: "Boule de feu",
        category: "offensive",
        form: "projectile",
        element: "fire",
        approachMode: "none",
        energyCost: 3,
        preparationMs: 1000,
        travelMs: 700,
        recoveryMs: 400,
        allowedDistances: ["short", "medium", "long"],
        targetRelations: ["enemy"],
        projectileClash: {
          mode: "mutual_cancel",
          group: "fire-orb",
          interactsWith: ["fire-orb"]
        },
        effect: {
          damage: 25
        }
      }
    ],
    teams: [
      {
        id: "players",
        members: [
          {
            id: "p1",
            creatureId: "wolf",
            controllerId: "human-local",
            active: true
          },
          {
            id: "p2",
            creatureId: "golem",
            controllerId: "ai-ally",
            active: true
          },
          {
            id: "p-reserve",
            creatureId: "reserve",
            controllerId: "reserve",
            active: false
          }
        ]
      },
      {
        id: "enemies",
        members: [
          {
            id: "e1",
            creatureId: "dolphin",
            controllerId: "ai-enemy-a",
            active: true
          },
          {
            id: "e2",
            creatureId: "dragon",
            controllerId: "ai-enemy-b",
            active: true
          }
        ]
      }
    ]
  };
}

test("Capture combat bundle builds four active native fighters for 2v2", () => {
  const bundle = buildCaptureCombatBundle(
    fixture(),
    { battleFormatId: "capture-preview-2v2" }
  );

  assert.equal(bundle.battleFormat.id, "capture-preview-2v2");
  assert.deepEqual(
    bundle.fighters.map((fighter) => fighter.id),
    ["p1", "p2", "e1", "e2"]
  );
  assert.equal(
    bundle.fighters.some((fighter) => fighter.id === "p-reserve"),
    false
  );

  assert.equal(bundle.fighters[0].maxHp, 100);
  assert.equal(bundle.fighters[0].initialEnergy, 5);
  assert.ok(Object.isFrozen(bundle));
  assert.ok(Object.isFrozen(bundle.fighters));
  assert.ok(Object.isFrozen(bundle.skillsByActor));
});

test("Capture combat bundle resolves actor skills from creature assignments", () => {
  const input = fixture();
  input.creatures[1].skillIds = [];

  const bundle = buildCaptureCombatBundle(input);

  assert.deepEqual(
    bundle.skillsByActor.p1.map((skill) => skill.id),
    ["fireball"]
  );
  assert.deepEqual(bundle.skillsByActor.p2, []);
  assert.deepEqual(
    bundle.skillsByActor.e1.map((skill) => skill.id),
    ["fireball"]
  );
});

test("CaptureExportV1 reaches real Combat Session rules without injected final state", () => {
  const bundle = buildCaptureCombatBundle(fixture());
  const session = createCombatSession({
    distance: "medium",
    fighters: bundle.fighters
  });

  const before = session.snapshot();
  assert.equal(before.fighters.p1.energy, 5);
  assert.equal(before.fighters.e1.hp, 100);

  const skill = bundle.skillsByActor.p1.find(
    (item) => item.id === "fireball"
  );
  const resolution = session.useSkill({
    actorId: "p1",
    targetId: "e1",
    skill
  });

  assert.equal(resolution.ok, true);
  assert.equal(resolution.outcome, "hit");

  const after = session.snapshot();
  assert.equal(after.fighters.p1.energy, 2);
  assert.equal(after.fighters.e1.hp, 75);
  assert.equal(
    resolution.events.some(
      (event) =>
        event.type === "hit" &&
        event.actorId === "e1" &&
        event.damage === 25
    ),
    true
  );
});
