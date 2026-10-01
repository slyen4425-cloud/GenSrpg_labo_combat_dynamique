import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createCombatRuntime
} from "../../src/core/combat/combat-runtime.js";

function fighter(id) {
  return {
    id,
    hp: 100,
    maxHp: 100,
    energy: 10,
    maxEnergy: 10,
    energyChargeProgressMs: 0,
    chargeTimeEffects: [],
    skillCooldowns: {}
  };
}

test("CombatRuntime emits onState when only persistentZones radius or lifetime changes", () => {
  let nowMs = 0;
  let scheduled = null;
  let state = {
    elapsedMs: 0,
    distance: "medium",
    fighters: {
      local: fighter("local"),
      enemy: fighter("enemy")
    },
    persistentZones: [
      {
        id: "local:ultimate-zone:flames",
        skillId: "ultimate-zone",
        sourceActorId: "local",
        radius: "short",
        activations: 1
      }
    ]
  };

  let advanceCount = 0;
  const session = {
    snapshot() {
      return state;
    },
    advanceMs(deltaMs) {
      advanceCount += 1;
      state = {
        ...state,
        elapsedMs: state.elapsedMs + deltaMs,
        persistentZones:
          advanceCount === 1
            ? [
                {
                  ...state.persistentZones[0],
                  radius: "medium",
                  activations: 2
                }
              ]
            : []
      };
      return state;
    }
  };

  const seen = [];
  const runtime = createCombatRuntime({
    session,
    now() {
      return nowMs;
    },
    setTimer(callback) {
      scheduled = callback;
      return 1;
    },
    clearTimer() {},
    onState(nextState) {
      seen.push(
        nextState.persistentZones.map((zone) => ({
          radius: zone.radius,
          activations: zone.activations
        }))
      );
    }
  });

  runtime.start();
  assert.deepEqual(seen, [
    [{ radius: "short", activations: 1 }]
  ]);

  nowMs = 50;
  scheduled();
  assert.deepEqual(
    seen.at(-1),
    [{ radius: "medium", activations: 2 }],
    "radius reinforcement must be emitted even when fighters/distance are unchanged"
  );

  nowMs = 100;
  scheduled();
  assert.deepEqual(
    seen.at(-1),
    [],
    "zone expiry/removal must also be emitted without relying on the clock presentation callback"
  );

  runtime.dispose();
});

test("2v2 combat projects persistent zones only from renderState/onState, not onClock", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/combat-2v2-test-ui.js",
      import.meta.url
    ),
    "utf8"
  );

  const renderStart = source.indexOf(
    "function renderState(state = session.snapshot())"
  );
  const renderEnd = source.indexOf(
    "function renderAvailability()",
    renderStart
  );
  assert.ok(renderStart >= 0 && renderEnd > renderStart);
  const renderBlock = source.slice(
    renderStart,
    renderEnd
  );

  assert.match(
    renderBlock,
    /fx\.syncPersistentZones\(state\.persistentZones \?\? \[\]\)/
  );

  const clockStart = source.indexOf(
    "onClock(state)"
  );
  const clockEnd = source.indexOf(
    "onStarted(",
    clockStart
  );
  assert.ok(clockStart >= 0 && clockEnd > clockStart);
  const clockBlock = source.slice(
    clockStart,
    clockEnd
  );

  assert.doesNotMatch(
    clockBlock,
    /syncPersistentZones/
  );
  assert.doesNotMatch(
    source,
    /setInterval\([^\n]*persistent/i
  );
});
