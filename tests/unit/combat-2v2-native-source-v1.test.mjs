import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  loadCoop2v2CombatSource
} from "../../src/ui/combat-2v2-test-ui.js";

function fighter(id, hp) {
  return {
    id,
    maxHp: hp,
    initialHp: hp,
    maxEnergy: 10,
    initialEnergy: 5,
    energyChargeAmount: 1,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 1,
    chargeTimeModifierPct: 0
  };
}

function injectedSource() {
  return {
    battleFormat: {
      id: "injected-2v2",
      localActorId: "local",
      teams: {
        players: ["local", "ally-x"],
        enemies: ["enemy-a", "enemy-b"]
      },
      actors: [
        {
          actorId: "local",
          teamId: "players",
          creatureId: "crea-local",
          displayName: "Local",
          fighterConfigId: "crea-local",
          controllerId: "human-local"
        },
        {
          actorId: "ally-x",
          teamId: "players",
          creatureId: "crea-ally",
          displayName: "Allié",
          fighterConfigId: "crea-ally",
          controllerId: "ai-ally"
        },
        {
          actorId: "enemy-a",
          teamId: "enemies",
          creatureId: "crea-enemy-a",
          displayName: "Ennemi A",
          fighterConfigId: "crea-enemy-a",
          controllerId: "ai-enemy"
        },
        {
          actorId: "enemy-b",
          teamId: "enemies",
          creatureId: "crea-enemy-b",
          displayName: "Ennemi B",
          fighterConfigId: "crea-enemy-b",
          controllerId: "ai-enemy"
        }
      ]
    },
    fighters: [
      fighter("local", 91),
      fighter("ally-x", 82),
      fighter("enemy-a", 73),
      fighter("enemy-b", 64)
    ],
    skills: {
      "injected-hit": {
        id: "injected-hit",
        name: "Injected hit",
        category: "offensive",
        form: "contact",
        allowedDistances: ["short", "medium", "long"],
        targetRelations: ["enemy"],
        energyCost: 2,
        preparationMs: 100,
        travelMs: 200,
        recoveryMs: 300,
        cooldownMs: 900,
        effect: {
          damage: 7
        }
      }
    },
    skillIdsByActor: {
      local: ["injected-hit"],
      "ally-x": ["injected-hit"],
      "enemy-a": ["injected-hit"],
      "enemy-b": ["injected-hit"]
    },
    skillIdsByCreature: {
      "crea-local": ["injected-hit"],
      "crea-reserve": ["injected-hit"],
      "crea-ally": ["injected-hit"],
      "crea-enemy-a": ["injected-hit"],
      "crea-enemy-b": ["injected-hit"]
    },
    fighterConfigs: {
      "crea-local": fighter("crea-local", 91),
      "crea-reserve": fighter("crea-reserve", 123),
      "crea-ally": fighter("crea-ally", 82),
      "crea-enemy-a": fighter("crea-enemy-a", 73),
      "crea-enemy-b": fighter("crea-enemy-b", 64)
    },
    roster: {
      teams: {
        local: {
          slotId: "local",
          activeMemberId: "member-local",
          members: [
            {
              id: "member-local",
              creatureId: "crea-local",
              displayName: "Local",
              fighterConfigId: "crea-local"
            },
            {
              id: "member-reserve",
              creatureId: "crea-reserve",
              displayName: "Réserve",
              fighterConfigId: "crea-reserve"
            }
          ]
        }
      }
    }
  };
}

test("2v2 combat bootstrap accepts an injected native source without fetching demo fixtures", async () => {
  let fetchCount = 0;
  const source = await loadCoop2v2CombatSource({
    nativeCombatSource: injectedSource(),
    fetchImpl: async () => {
      fetchCount += 1;
      throw new Error("demo fetch must not run");
    }
  });

  assert.equal(fetchCount, 0);
  assert.equal(source.format.id, "injected-2v2");
  assert.equal(source.format.localActorId, "local");
  assert.deepEqual(
    source.fighters.map((item) => [item.id, item.maxHp]),
    [
      ["local", 91],
      ["ally-x", 82],
      ["enemy-a", 73],
      ["enemy-b", 64]
    ]
  );
  assert.deepEqual(Object.keys(source.skillsById), ["injected-hit"]);
  assert.equal(source.skillsById["injected-hit"].effect.damage, 7);
  assert.equal(
    source.roster.teams.local.activeMemberId,
    "member-local"
  );
  assert.equal(
    source.roster.teams.local.members[1].creatureId,
    "crea-reserve"
  );
  assert.equal(
    source.fighterConfigs["crea-reserve"].maxHp,
    123
  );
  assert.deepEqual(
    source.skillIdsByCreature["crea-reserve"],
    ["injected-hit"]
  );
});

test("2v2 mount consumes the shared source loader instead of rebuilding a second mapping", async () => {
  const source = await readFile(
    "src/ui/combat-2v2-test-ui.js",
    "utf8"
  );

  assert.match(
    source,
    /export async function loadCoop2v2CombatSource/
  );
  assert.match(
    source,
    /const \{\s*format,\s*fighters,\s*skills,\s*skillsById/
  );
  assert.match(
    source,
    /await loadCoop2v2CombatSource\(/
  );
  assert.doesNotMatch(
    source,
    /nativeCombatSource[\s\S]*capture-combat-export/i
  );
  assert.doesNotMatch(
    source,
    /nativeCombatSource[\s\S]*Zombicide-40k/i
  );
});


test("2v2 Encounter UI wires injected roster through the existing Roster Session and Combat Runtime commands", async () => {
  const source = await readFile(
    "src/ui/combat-2v2-test-ui.js",
    "utf8"
  );
  const html = await readFile(
    "examples/dom-demo/exploration-encounter.html",
    "utf8"
  );

  assert.match(source, /createRosterSession/);
  assert.match(source, /normalizeCombatCommandDefinition/);
  assert.match(source, /runtime\.startCommand/);
  assert.match(source, /roster\.applyCommandResolution/);
  assert.match(source, /skillIdsByCreature/);
  assert.match(source, /visuals\.setCreatureFor/);

  assert.match(html, /data-combat-team-actions/);
  assert.match(html, /data-roster-reserve="local-1"/);
  assert.match(html, /data-team-selection/);
});

test("Exploration Encounter visual source loads every configured party creature, not only the active member", async () => {
  const source = await readFile(
    "examples/dom-demo/exploration-encounter.js",
    "utf8"
  );

  assert.match(
    source,
    /configuredCreatureTransfers[\s\S]*visualMetaFor/
  );
  assert.doesNotMatch(
    source,
    /creatureMetas\s*=\s*await Promise\.all\(\[\s*visualMetaFor\(\s*local\.creatureId/
  );
});
