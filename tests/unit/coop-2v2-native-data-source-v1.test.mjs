import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  loadDemoCoop2v2NativeData,
  resolveCoop2v2NativeData
} from "../../src/ui/coop-2v2-data-source.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

test("demo 2v2 loadouts preserve the historically validated skill orders", async () => {
  const loadouts = await json(
    "data/combat/loadouts/demo-coop-2v2.loadouts.json"
  );

  assert.deepEqual(loadouts, {
    player: [
      "fireball",
      "claw",
      "aerial-dive",
      "teleport-strike"
    ],
    ally: [
      "claw",
      "fireball",
      "aerial-dive",
      "teleport-strike"
    ],
    opponent: [
      "fireball",
      "claw",
      "aerial-dive",
      "teleport-strike"
    ],
    "opponent-b": [
      "aerial-dive",
      "fireball",
      "claw",
      "teleport-strike"
    ]
  });
});

test("demo native data source produces normalized actor loadouts", async () => {
  const data = await loadDemoCoop2v2NativeData({
    fetchImpl: async (url) => {
      const pathname = new URL(url).pathname;
      const marker = "/GenSrpg_labo_combat_dynamique/";
      const markerIndex = pathname.indexOf(marker);
      const path =
        markerIndex >= 0
          ? pathname.slice(markerIndex + marker.length)
          : pathname.replace(/^\//, "");
      const value = await json(path);
      return {
        ok: true,
        async json() {
          return value;
        }
      };
    }
  });

  assert.equal(data.battleFormat.id, "coop-2v2-lab-v1");
  assert.equal(data.fighters.length, 4);
  assert.equal(data.skills.fireball.id, "fireball");
  assert.deepEqual(data.skillIdsByActor.ally, [
    "claw",
    "fireball",
    "aerial-dive",
    "teleport-strike"
  ]);
  assert.equal(Object.isFrozen(data), true);
  assert.equal(Object.isFrozen(data.skillIdsByActor.ally), true);
});

test("native injected data bypasses demo fetching", async () => {
  const injected = Object.freeze({
    battleFormat: Object.freeze({
      id: "injected",
      localActorId: "player",
      actors: Object.freeze([]),
      teams: Object.freeze({})
    }),
    fighterConfigs: Object.freeze({}),
    fighters: Object.freeze([]),
    skills: Object.freeze({}),
    skillIdsByActor: Object.freeze({})
  });

  const resolved = await resolveCoop2v2NativeData({
    combatData: injected,
    fetchImpl: async () => {
      throw new Error("demo fetch must not run");
    }
  });

  assert.equal(resolved, injected);
});

test("2v2 controller consumes actor loadouts instead of hardcoded skill arrays", async () => {
  const source = await readFile(
    "src/ui/combat-2v2-test-ui.js",
    "utf8"
  );

  assert.match(source, /combatData/);
  assert.match(source, /resolveCoop2v2NativeData/);
  assert.match(
    source,
    /skillIdsByActor\[format\.localActorId\]/
  );
  assert.match(source, /skillIdsByActor\["ally"\]/);
  assert.match(source, /skillIdsByActor\["opponent"\]/);
  assert.match(source, /skillIdsByActor\["opponent-b"\]/);

  assert.doesNotMatch(
    source,
    /skillIds:\s*\["claw",\s*"fireball",\s*"aerial-dive",\s*"teleport-strike"\]/
  );
  assert.doesNotMatch(
    source,
    /skillIds:\s*\["fireball",\s*"claw",\s*"aerial-dive",\s*"teleport-strike"\]/
  );
  assert.doesNotMatch(
    source,
    /skillIds:\s*\["aerial-dive",\s*"fireball",\s*"claw",\s*"teleport-strike"\]/
  );
});

test("native data-source lot does not alter validated 2v2 visual files", async () => {
  const html = await readFile(
    "examples/dom-demo/coop-2v2.html",
    "utf8"
  );
  const css = await readFile(
    "examples/dom-demo/demo.css",
    "utf8"
  );

  assert.equal(
    (html.match(/data-demo-slot=/g) ?? []).length,
    4
  );
  assert.match(
    css,
    /\.arena--coop-2v2 \.fighter--ally\s*\{[\s\S]*?top:\s*66%[\s\S]*?left:\s*66%/
  );
  assert.match(
    css,
    /\.skill-fx--clash-impact\s*\{[\s\S]*?z-index:\s*12/
  );
});
