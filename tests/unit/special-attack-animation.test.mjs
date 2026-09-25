import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeCombatVisualEvent } from "../../src/contracts/combat-visual-event.js";
import { normalizeVisualActor } from "../../src/contracts/visual-actor.js";
import { planAnimation } from "../../src/core/animation/plan-animation.js";
import { createProfileRegistry } from "../../src/core/profiles/profile-registry.js";

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const serpentine = await loadJson("data/profiles/serpentine.profile.json");
const drake = await loadJson("data/profiles/drake.profile.json");
const registry = createProfileRegistry([serpentine, drake]);

function actor(profile = "serpentine") {
  return normalizeVisualActor({
    id: "player-actor",
    creatureId: "test-creature",
    profile,
    asset: "test.png",
    view: "player",
    facing: "right",
    position: { x: 0, y: 0 },
    scale: 1
  });
}

test("teleport attack disappears, reaches target exactly at impact time, then returns home", () => {
  const current = actor();
  const travelMs = 120;
  const plan = planAnimation({
    event: normalizeCombatVisualEvent({
      type: "teleport-attack",
      actorId: current.id,
      targetId: "opponent-actor",
      metadata: {
        targetTranslateX: 180,
        targetTranslateY: -12,
        travelMs
      }
    }),
    actor: current,
    profile: registry.get(current.profile)
  });

  assert.deepEqual(
    plan.segments.map((segment) => segment.label),
    [
      "teleport-vanish",
      "teleport-impact",
      "teleport-return-vanish",
      "teleport-home"
    ]
  );

  assert.equal(
    plan.segments[0].durationMs + plan.segments[1].durationMs,
    travelMs
  );
  assert.equal(plan.segments[0].opacity, 0);
  assert.equal(plan.segments[1].transform.translateX, 180);
  assert.equal(plan.segments[1].transform.translateY, -12);
  assert.equal(plan.segments[1].opacity, 1);
  assert.equal(plan.segments.at(-1).transform.translateX, 0);
  assert.equal(plan.segments.at(-1).transform.translateY, 0);
  assert.equal(plan.segments.at(-1).opacity, 1);
});

test("aerial attack rises, vanishes, dives to target at impact, then returns", () => {
  const current = actor("drake");
  const travelMs = 850;
  const plan = planAnimation({
    event: normalizeCombatVisualEvent({
      type: "aerial-attack",
      actorId: current.id,
      targetId: "opponent-actor",
      metadata: {
        targetTranslateX: 150,
        targetTranslateY: 8,
        travelMs,
        arenaExitTranslateY: -360
      }
    }),
    actor: current,
    profile: registry.get(current.profile)
  });

  assert.deepEqual(
    plan.segments.map((segment) => segment.label),
    [
      "aerial-rise",
      "aerial-reposition",
      "aerial-dive-impact",
      "aerial-home"
    ]
  );

  const impactMs =
    plan.segments[0].durationMs +
    plan.segments[1].durationMs +
    plan.segments[2].durationMs;

  assert.equal(impactMs, travelMs);
  assert.equal(plan.segments[0].transform.translateY, -360);
  assert.equal(plan.segments[1].opacity, 0);
  assert.equal(plan.segments[2].transform.translateX, 150);
  assert.equal(plan.segments[2].transform.translateY, 8);
  assert.equal(plan.segments[2].opacity, 1);
  assert.equal(plan.segments.at(-1).transform.translateX, 0);
  assert.equal(plan.segments.at(-1).transform.translateY, 0);
});

test("special attack event contract rejects missing positive travel time in planner", () => {
  const current = actor();

  assert.throws(
    () =>
      planAnimation({
        event: normalizeCombatVisualEvent({
          type: "teleport-attack",
          actorId: current.id,
          metadata: {
            targetTranslateX: 100,
            targetTranslateY: 0,
            travelMs: 0
          }
        }),
        actor: current,
        profile: registry.get(current.profile)
      }),
    /travelMs/
  );
});


test("ground contact attack reaches configured target fraction exactly at travelMs", () => {
  const current = actor("serpentine");
  const travelMs = 1500;
  const plan = planAnimation({
    event: normalizeCombatVisualEvent({
      type: "ground-attack",
      actorId: current.id,
      targetId: "opponent-actor",
      metadata: {
        targetTranslateX: 200,
        targetTranslateY: 20,
        travelMs
      }
    }),
    actor: current,
    profile: registry.get(current.profile)
  });

  assert.deepEqual(
    plan.segments.map((segment) => segment.label),
    [
      "ground-approach-impact",
      "ground-home"
    ]
  );
  assert.equal(plan.segments[0].durationMs, 1500);
  assert.equal(plan.segments[0].transform.translateX, 144);
  assert.ok(
    Math.abs(plan.segments[0].transform.translateY - 6.4) < 1e-9
  );
  assert.equal(plan.segments.at(-1).transform.translateX, 0);
  assert.equal(plan.segments.at(-1).transform.translateY, 0);
});

test("ground animation consumes arbitrary configured travel timing", () => {
  const current = actor();

  for (const travelMs of [500, 900, 1500]) {
    const plan = planAnimation({
      event: normalizeCombatVisualEvent({
        type: "ground-attack",
        actorId: current.id,
        targetId: "opponent-actor",
        metadata: {
          targetTranslateX: 160,
          targetTranslateY: 0,
          travelMs
        }
      }),
      actor: current,
      profile: registry.get(current.profile)
    });

    assert.equal(plan.segments[0].durationMs, travelMs);
  }
});

test("aerial rise uses the arena exit offset and can fully leave the combat viewport", () => {
  const current = actor("drake");
  const plan = planAnimation({
    event: normalizeCombatVisualEvent({
      type: "aerial-attack",
      actorId: current.id,
      targetId: "opponent-actor",
      metadata: {
        targetTranslateX: 120,
        targetTranslateY: 0,
        travelMs: 850,
        arenaExitTranslateY: -480
      }
    }),
    actor: current,
    profile: registry.get(current.profile)
  });

  assert.equal(plan.segments[0].transform.translateY, -480);
  assert.equal(plan.segments[1].transform.translateY, -480);
  assert.equal(plan.segments[1].opacity, 0);
});
