import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  resolveCoop2v2CombatData
} from "../../src/ui/combat-2v2-test-ui.js";
import {
  buildCaptureCombatPackageV1
} from "../../src/adapters/input/capture/combat-package-v1.js";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function nativeSetup() {
  const format = Object.freeze({
    id: "native-test",
    localActorId: "player",
    teams: Object.freeze({
      players: Object.freeze(["player", "ally"]),
      enemies: Object.freeze(["opponent", "opponent-b"])
    }),
    actors: Object.freeze([
      Object.freeze({
        actorId: "player",
        teamId: "players",
        creatureId: "loup_volcanique",
        displayName: "Loup volcanique",
        fighterConfigId: "loup_volcanique",
        controllerId: "human-local"
      }),
      Object.freeze({
        actorId: "ally",
        teamId: "players",
        creatureId: "golem_moussu",
        displayName: "Golem moussu",
        fighterConfigId: "golem_moussu",
        controllerId: "ai-ally"
      }),
      Object.freeze({
        actorId: "opponent",
        teamId: "enemies",
        creatureId: "maraileron",
        displayName: "Maraileron",
        fighterConfigId: "maraileron",
        controllerId: "ai-enemy-a"
      }),
      Object.freeze({
        actorId: "opponent-b",
        teamId: "enemies",
        creatureId: "braisombre",
        displayName: "Braisombre",
        fighterConfigId: "braisombre",
        controllerId: "ai-enemy-b"
      })
    ]),
    actor(actorId) {
      return this.actors.find((actor) => actor.actorId === actorId) ?? null;
    },
    teamOf(actorId) {
      return Object.entries(this.teams)
        .find(([, ids]) => ids.includes(actorId))?.[0] ?? null;
    }
  });

  const fighter = Object.freeze({
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 10,
    initialEnergy: 0,
    energyChargeAmount: 1,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 1,
    chargeTimeModifierPct: 0
  });

  const skillA = Object.freeze({
    id: "fireball",
    name: "Boule de feu"
  });
  const skillB = Object.freeze({
    id: "claw",
    name: "Griffe"
  });

  return Object.freeze({
    format,
    fighterConfigs: Object.freeze({
      loup_volcanique: fighter,
      golem_moussu: fighter,
      maraileron: fighter,
      braisombre: fighter
    }),
    fighters: Object.freeze(
      format.actors.map((actor) =>
        Object.freeze({
          ...fighter,
          id: actor.actorId
        })
      )
    ),
    skillsById: Object.freeze({
      fireball: skillA,
      claw: skillB
    }),
    localSkills: Object.freeze([skillA, skillB])
  });
}

test("2v2 data seam accepts a native combatSetup without fetching gameplay JSON", async () => {
  let fetchCalls = 0;
  const setup = nativeSetup();

  const resolved = await resolveCoop2v2CombatData({
    combatSetup: setup,
    fetchImpl: async () => {
      fetchCalls += 1;
      throw new Error("native setup must not fetch");
    }
  });

  assert.equal(fetchCalls, 0);
  assert.equal(resolved.format, setup.format);
  assert.equal(resolved.fighterConfigs, setup.fighterConfigs);
  assert.equal(resolved.fighters, setup.fighters);
  assert.equal(resolved.skillsById, setup.skillsById);
  assert.deepEqual(
    resolved.skills.map((skill) => skill.id),
    ["fireball", "claw"]
  );
});

test("2v2 native seam preserves package-local skills rather than injecting the demo library", async () => {
  const setup = nativeSetup();
  const resolved = await resolveCoop2v2CombatData({
    combatSetup: setup,
    fetchImpl: async () => {
      throw new Error("must not fetch");
    }
  });

  assert.deepEqual(
    resolved.skills.map((skill) => skill.id),
    ["fireball", "claw"]
  );
  assert.equal("aerial-dive" in resolved.skillsById, false);
  assert.equal("teleport-strike" in resolved.skillsById, false);
});

test("2v2 UI keeps its historical JSON fallback and stays Capture-agnostic", async () => {
  const source = await readFile(
    "src/ui/combat-2v2-test-ui.js",
    "utf8"
  );

  assert.match(source, /combatSetup\s*=\s*null/);
  assert.match(source, /DATA_URLS\.format/);
  assert.match(source, /DATA_URLS\.fighters\.maraileron/);
  assert.match(source, /DATA_URLS\.skills/);
  assert.doesNotMatch(
    source,
    /capture-combat|CaptureCombat|buildCapture|capture-export|presentation-adapter/
  );
});

test("coop bootstrap selects Capture export source only through the existing page query", async () => {
  const source = await readFile(
    "examples/dom-demo/coop-2v2.js",
    "utf8"
  );
  const html = await readFile(
    "examples/dom-demo/coop-2v2.html",
    "utf8"
  );

  assert.match(source, /URLSearchParams/);
  assert.match(source, /source/);
  assert.match(source, /capture-export/);
  assert.match(source, /buildCaptureCombatPackageV1/);
  assert.match(source, /demo-editor-export-2v2\.capture\.json/);
  assert.match(source, /combatSetup/);
  assert.match(
    html,
    /<script type="module" src="\.\/coop-2v2\.js"><\/script>/
  );
  assert.doesNotMatch(html, /capture-export/);
});

test("editor export fixture builds the consolidated package with current 2v2 actors and all AI skills", async () => {
  const input = await readJson(
    "data/capture/demo-editor-export-2v2.capture.json"
  );
  const pkg = buildCaptureCombatPackageV1(input);

  assert.equal(pkg.battleFormat.localActorId, "player");
  assert.deepEqual(
    pkg.battleFormat.actors.map((actor) => actor.actorId),
    ["player", "ally", "opponent", "opponent-b"]
  );
  assert.deepEqual(
    pkg.battleFormat.actors.map((actor) => actor.creatureId),
    [
      "loup_volcanique",
      "golem_moussu",
      "maraileron",
      "braisombre"
    ]
  );

  assert.deepEqual(Object.keys(pkg.skills), [
    "fireball",
    "claw",
    "aerial-dive",
    "teleport-strike"
  ]);

  assert.deepEqual(
    pkg.skillsByCreature.loup_volcanique.map((skill) => skill.id),
    ["fireball", "claw"]
  );

  for (const creatureId of [
    "golem_moussu",
    "maraileron",
    "braisombre"
  ]) {
    assert.deepEqual(
      pkg.skillsByCreature[creatureId].map((skill) => skill.id),
      ["fireball", "claw", "aerial-dive", "teleport-strike"]
    );
  }
});

test("coop bootstrap and 2v2 UI still use one CombatSession path", async () => {
  const bootstrap = await readFile(
    "examples/dom-demo/coop-2v2.js",
    "utf8"
  );
  const ui = await readFile(
    "src/ui/combat-2v2-test-ui.js",
    "utf8"
  );

  assert.equal(
    (ui.match(/createCombatSession\s*\(/g) ?? []).length,
    1
  );
  assert.match(bootstrap, /mountCoop2v2Test/);
  assert.doesNotMatch(bootstrap, /createCombatSession|createCombatRuntime/);
});
