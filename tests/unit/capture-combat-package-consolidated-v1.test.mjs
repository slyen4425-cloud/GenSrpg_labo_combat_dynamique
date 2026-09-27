import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createRosterSession } from "../../src/core/combat/roster-session.js";
import {
  CAPTURE_COMBAT_PACKAGE_SCHEMA,
  buildCaptureCombatPackageV1
} from "../../src/adapters/input/capture/combat-package-v1.js";

function combat(maxHp, movementEnergyPerStep, initialEnergy = 10) {
  return {
    maxHp,
    initialHp: maxHp,
    maxEnergy: 10,
    initialEnergy,
    energyChargeAmount: 1,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep,
    chargeTimeModifierPct: 0
  };
}

function skill(id, name, form, damage) {
  return {
    id,
    definition: {
      id,
      name,
      category: "offensive",
      form,
      element: form === "projectile" ? "fire" : null,
      approachMode: form === "contact" ? "ground" : "none",
      energyCost: 2,
      preparationMs: 300,
      travelMs: form === "contact" ? 700 : 600,
      recoveryMs: 300,
      allowedDistances:
        form === "contact"
          ? ["short"]
          : ["short", "medium", "long"],
      targetRelations: ["enemy"],
      effect: { damage }
    }
  };
}

function fixture() {
  return {
    schema: "capture-combat-export-v1",
    battle: {
      id: "capture-package-2v2",
      localActorId: "player"
    },
    teams: {
      players: ["player", "ally"],
      enemies: ["opponent", "opponent-b"]
    },
    actors: [
      {
        actorId: "player",
        teamId: "players",
        creatureId: "wolf",
        displayName: "Loup",
        controllerId: "human-local"
      },
      {
        actorId: "ally",
        teamId: "players",
        creatureId: "golem",
        displayName: "Golem",
        controllerId: "ai-ally"
      },
      {
        actorId: "opponent",
        teamId: "enemies",
        creatureId: "maraileron",
        displayName: "Maraileron",
        controllerId: "ai-enemy-a"
      },
      {
        actorId: "opponent-b",
        teamId: "enemies",
        creatureId: "braisombre",
        displayName: "Braisombre",
        controllerId: "ai-enemy-b"
      }
    ],
    creatures: [
      {
        id: "wolf",
        displayName: "Loup",
        combat: combat(110, 1),
        skillIds: ["fireball", "claw"],
        metadata: { level: 99, defense: 999 }
      },
      {
        id: "golem",
        displayName: "Golem",
        combat: combat(150, 2),
        skillIds: ["claw"]
      },
      {
        id: "maraileron",
        displayName: "Maraileron",
        combat: combat(100, 1),
        skillIds: ["fireball"]
      },
      {
        id: "braisombre",
        displayName: "Braisombre",
        combat: combat(120, 3),
        skillIds: ["fireball"]
      }
    ],
    skills: [
      skill("fireball", "Boule de feu", "projectile", 30),
      skill("claw", "Griffe", "contact", 14)
    ],
    rosters: [
      {
        slotId: "player",
        activeMemberId: "player-wolf",
        members: [
          { id: "player-wolf", creatureId: "wolf", displayName: "Loup" },
          { id: "player-marai", creatureId: "maraileron", displayName: "Maraileron" }
        ]
      },
      {
        slotId: "opponent",
        activeMemberId: "enemy-marai",
        members: [
          { id: "enemy-marai", creatureId: "maraileron", displayName: "Maraileron" },
          { id: "enemy-braisombre", creatureId: "braisombre", displayName: "Braisombre" }
        ]
      }
    ],
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
              attachment: "path"
            }
          }
        },
        {
          schema: "presentation-binding-v1",
          subjectType: "creature",
          subjectId: "wolf",
          visual: {
            player: {
              assetId: "project:wolf-player"
            }
          }
        }
      ]
    },
    metadata: {
      producer: "editor-fixture",
      mustNotReachRuntimePackage: true
    }
  };
}

test("CaptureCombatPackageV1 composes a complete native 2v2 package", () => {
  const pkg = buildCaptureCombatPackageV1(fixture());

  assert.equal(
    CAPTURE_COMBAT_PACKAGE_SCHEMA,
    "capture-combat-package-v1"
  );
  assert.equal(pkg.schema, CAPTURE_COMBAT_PACKAGE_SCHEMA);
  assert.equal(pkg.battleFormat.actors.length, 4);
  assert.deepEqual(
    pkg.battleFormat.actors.map((actor) => actor.actorId),
    ["player", "ally", "opponent", "opponent-b"]
  );
  assert.deepEqual(Object.keys(pkg.fighterConfigs), [
    "wolf",
    "golem",
    "maraileron",
    "braisombre"
  ]);
  assert.deepEqual(
    pkg.initialFighters.map((fighter) => fighter.id),
    ["player", "ally", "opponent", "opponent-b"]
  );
  assert.equal(pkg.presentationBindings.length, 2);
  assert.equal(Object.isFrozen(pkg), true);
});

test("CaptureCombatPackageV1 keeps FighterConfig values explicit and actor-scoped", () => {
  const pkg = buildCaptureCombatPackageV1(fixture());

  assert.equal(pkg.fighterConfigs.wolf.maxHp, 110);
  assert.equal(pkg.fighterConfigs.wolf.movementEnergyPerStep, 1);
  assert.equal(pkg.initialFighters[0].id, "player");
  assert.equal(pkg.initialFighters[0].maxHp, 110);
  assert.equal("metadata" in pkg.fighterConfigs.wolf, false);
  assert.equal("level" in pkg.fighterConfigs.wolf, false);
});

test("CaptureCombatPackageV1 exposes native skills and preserves creature skill order", () => {
  const pkg = buildCaptureCombatPackageV1(fixture());

  assert.deepEqual(Object.keys(pkg.skills), ["fireball", "claw"]);
  assert.equal(pkg.skills.fireball.form, "projectile");
  assert.equal(pkg.skills.claw.form, "contact");
  assert.deepEqual(
    pkg.skillsByCreature.wolf.map((skill) => skill.id),
    ["fireball", "claw"]
  );
  assert.deepEqual(
    pkg.skillsByCreature.golem.map((skill) => skill.id),
    ["claw"]
  );
});

test("CaptureCombatPackageV1 preserves BattleFormat teams and controllers", () => {
  const pkg = buildCaptureCombatPackageV1(fixture());

  assert.equal(pkg.battleFormat.teamOf("ally"), "players");
  assert.equal(pkg.battleFormat.teamOf("opponent-b"), "enemies");
  assert.equal(
    pkg.battleFormat.actor("ally").controllerId,
    "ai-ally"
  );
  assert.equal(
    pkg.battleFormat.actor("opponent-b").controllerId,
    "ai-enemy-b"
  );
});

test("CaptureCombatPackageV1 keeps presentation separate from gameplay", () => {
  const pkg = buildCaptureCombatPackageV1(fixture());

  assert.equal(
    pkg.presentationBindings[0].subjectId,
    "fireball"
  );
  assert.equal(
    pkg.presentationBindings[0].visual.icon.assetId,
    "core:icon-skill-fireball-01"
  );
  assert.equal("presentation" in pkg.skills.fireball, false);
  assert.equal("assetId" in pkg.skills.fireball, false);
  assert.equal("metadata" in pkg, false);
});

test("CaptureCombatPackageV1 initial fighters are accepted by the real CombatSession", () => {
  const pkg = buildCaptureCombatPackageV1(fixture());
  const session = createCombatSession({
    fighters: pkg.initialFighters
  });

  const state = session.snapshot();
  assert.equal(Object.keys(state.fighters).length, 4);
  assert.equal(state.fighters.player.maxHp, 110);
  assert.equal(state.fighters["opponent-b"].maxHp, 120);
});

test("CaptureCombatPackageV1 roster is accepted by the real RosterSession", () => {
  const pkg = buildCaptureCombatPackageV1(fixture());
  const combatSession = createCombatSession({
    fighters: pkg.initialFighters
  });
  const rosterSession = createRosterSession({
    combatSession,
    roster: pkg.roster,
    fighterConfigs: pkg.fighterConfigs
  });

  const snapshot = rosterSession.snapshot();
  assert.equal(snapshot.player.activeMemberId, "player-wolf");
  assert.equal(snapshot.player.members.length, 2);
  assert.equal(snapshot.opponent.activeMemberId, "enemy-marai");
});

test("a native skill from CaptureCombatPackageV1 is resolvable by CombatSession", () => {
  const pkg = buildCaptureCombatPackageV1(fixture());
  const session = createCombatSession({
    fighters: pkg.initialFighters
  });

  const result = session.previewSkill({
    actorId: "player",
    targetId: "opponent",
    skill: pkg.skills.fireball
  });

  assert.equal(result.ok, true);
});

test("CaptureCombatPackageV1 composer has no UI, storage, network or GenSrpG authority", async () => {
  const source = await readFile(
    "src/adapters/input/capture/combat-package-v1.js",
    "utf8"
  );

  assert.doesNotMatch(
    source,
    /Zombicide-40k|github\.com|window\.|document\.|localStorage|sessionStorage|indexedDB|MutationObserver|fetch\(|XMLHttpRequest/
  );
  assert.doesNotMatch(
    source,
    /demo-assets|global-visual-library|setTimeout|setInterval/
  );
});
