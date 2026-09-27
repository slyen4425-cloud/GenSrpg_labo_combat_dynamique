import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  adaptCaptureCombatPackage
} from "../../src/adapters/input/capture-combat-package-adapter.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";
import {
  createRosterSession
} from "../../src/core/combat/roster-session.js";

function packageFixture() {
  return {
    schema: "capture-combat-package",
    version: 1,
    metadata: {
      sourceId: "capture-editor-preview",
      sourceLabel: "Capture editor preview"
    },
    creatures: [
      {
        id: "maraileron",
        displayName: "Maraileron",
        fighterConfigId: "maraileron",
        fighterConfig: {
          id: "maraileron",
          maxHp: 100,
          initialHp: 100,
          maxEnergy: 10,
          initialEnergy: 10,
          energyChargeAmount: 1,
          energyChargeIntervalMs: 2000,
          movementEnergyPerStep: 1,
          chargeTimeModifierPct: 0
        },
        skillIds: ["fireball"]
      },
      {
        id: "braisombre",
        displayName: "Braisombre",
        fighterConfigId: "braisombre",
        fighterConfig: {
          id: "braisombre",
          maxHp: 100,
          initialHp: 100,
          maxEnergy: 10,
          initialEnergy: 10,
          energyChargeAmount: 1,
          energyChargeIntervalMs: 2000,
          movementEnergyPerStep: 1,
          chargeTimeModifierPct: 0
        },
        skillIds: ["fireball"]
      }
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
        preparationMs: 2000,
        travelMs: 700,
        recoveryMs: 700,
        allowedDistances: ["short", "medium", "long"],
        targetRelations: ["enemy"],
        projectileClash: {
          mode: "mutual_cancel",
          group: "fire-orb",
          interactsWith: ["fire-orb"]
        },
        effect: {
          damage: 30,
          tags: ["burn-capable"]
        }
      }
    ],
    roster: {
      teams: {
        player: {
          slotId: "player",
          activeMemberId: "player-marai",
          members: [
            {
              id: "player-marai",
              creatureId: "maraileron",
              displayName: "Maraileron",
              fighterConfigId: "maraileron"
            }
          ]
        },
        opponent: {
          slotId: "opponent",
          activeMemberId: "opponent-drakon",
          members: [
            {
              id: "opponent-drakon",
              creatureId: "braisombre",
              displayName: "Braisombre",
              fighterConfigId: "braisombre"
            }
          ]
        }
      }
    },
    battleFormat: {
      id: "capture-preview-1v1",
      localActorId: "player",
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
          fighterConfigId: "maraileron",
          controllerId: "human-local"
        },
        {
          actorId: "opponent",
          teamId: "enemies",
          creatureId: "braisombre",
          displayName: "Braisombre",
          fighterConfigId: "braisombre",
          controllerId: "ai-enemy"
        }
      ]
    },
    presentation: {
      creatures: {
        maraileron: {
          profileId: "floating",
          frontAssetId: "pack:capture:creature-maraileron-front-01",
          iconAssetId: "pack:capture:creature-maraileron-icon-01"
        },
        braisombre: {
          profileId: "flying",
          frontAssetId: "pack:capture:creature-braisombre-front-01",
          iconAssetId: "pack:capture:creature-braisombre-icon-01"
        }
      },
      skills: {
        fireball: {
          iconAssetId: "pack:capture:icon-skill-fireball-01",
          castFxAssetId: "pack:capture:sprite-fireball-cast-01",
          travelFxAssetId: "pack:capture:sprite-fireball-travel-01",
          impactFxAssetId: "pack:capture:sprite-fireball-impact-01"
        }
      }
    }
  };
}

test("Capture package adapter builds actor fighters and skills without mutating input", () => {
  const input = packageFixture();
  const before = JSON.stringify(input);
  const model = adaptCaptureCombatPackage(input);

  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(
    model.fighters.map((fighter) => fighter.id),
    ["player", "opponent"]
  );
  assert.equal(model.fighters[0].maxHp, 100);
  assert.equal(model.fighterConfigs.maraileron.id, "maraileron");
  assert.equal(model.creatures.maraileron.fighterConfigId, "maraileron");
  assert.equal(model.skillsByActor.player[0].id, "fireball");
  assert.equal(model.skillsByActor.opponent[0].id, "fireball");
  assert.equal(model.presentation.skills.fireball.travelFxAssetId,
    "pack:capture:sprite-fireball-travel-01");
  assert.equal(Object.isFrozen(model), true);
  assert.equal(Object.isFrozen(model.fighters), true);
  assert.equal(Object.isFrozen(model.skillsByActor.player), true);
});

test("Capture package adapter requires an explicit battle format for preview", () => {
  const input = packageFixture();
  delete input.battleFormat;

  assert.throws(
    () => adaptCaptureCombatPackage(input),
    /battleFormat is required/
  );
});

test("Capture package adapter feeds the real Combat Session without owning gameplay", () => {
  const model = adaptCaptureCombatPackage(packageFixture());
  const session = createCombatSession({
    distance: "medium",
    fighters: model.fighters
  });

  const result = session.useSkill({
    actorId: "player",
    targetId: "opponent",
    skill: model.skillsByActor.player[0]
  });

  assert.equal(result.ok, true);
  assert.equal(result.outcome, "hit");
  assert.equal(session.snapshot().fighters.player.energy, 7);
  assert.equal(session.snapshot().fighters.opponent.hp, 70);
});

test("Capture package adapter feeds the existing Roster Session", () => {
  const model = adaptCaptureCombatPackage(packageFixture());
  const combatSession = createCombatSession({
    distance: "medium",
    fighters: model.fighters
  });
  const rosterSession = createRosterSession({
    combatSession,
    roster: model.roster,
    fighterConfigs: model.fighterConfigs
  });

  const snapshot = rosterSession.snapshot();
  assert.equal(snapshot.player.activeMemberId, "player-marai");
  assert.equal(snapshot.opponent.activeMemberId, "opponent-drakon");
  assert.equal(snapshot.player.members[0].hp, 100);
});

test("Capture package adapter remains a pure input adapter", async () => {
  const source = await readFile(
    "src/adapters/input/capture-combat-package-adapter.js",
    "utf8"
  );

  assert.doesNotMatch(
    source,
    /Zombicide-40k|\bwindow\b|\bdocument\b|localStorage|sessionStorage|indexedDB|MutationObserver|XMLHttpRequest|\bfetch\s*\(/
  );
  assert.doesNotMatch(source, /setTimeout|setInterval|addEventListener/);
  assert.match(source, /normalizeCaptureCombatPackage/);
  assert.doesNotMatch(source, /damage\s*[-+*/]?=|hp\s*[-+*/]?=/);
});
