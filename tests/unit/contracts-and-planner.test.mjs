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

test("CombatVisualEvent normalizes stable defaults", () => {
  const event = normalizeCombatVisualEvent({
    type: "attack",
    actorId: "maraileron-a",
    targetId: "braisombre-b"
  });
  assert.equal(event.variant, "basic");
  assert.equal(event.intensity, 1);
  assert.deepEqual(event.metadata, {});
});

test("VisualActor defaults facing from combat view", () => {
  const opponent = normalizeVisualActor({
    id: "m-a",
    creatureId: "maraileron",
    profile: "serpentine",
    asset: "maraileron_opponent.png",
    view: "opponent"
  });
  const player = normalizeVisualActor({
    id: "m-b",
    creatureId: "maraileron",
    profile: "serpentine",
    asset: "maraileron_player.png",
    view: "player"
  });
  assert.equal(opponent.facing, "left");
  assert.equal(player.facing, "right");
});

test("profile registry contains serpentine and drake", () => {
  assert.equal(registry.has("serpentine"), true);
  assert.equal(registry.has("drake"), true);
  assert.deepEqual(registry.ids(), ["serpentine", "drake"]);
});

test("serpentine attack planner is deterministic and facing-aware", () => {
  const actor = normalizeVisualActor({
    id: "maraileron-a",
    creatureId: "maraileron",
    profile: "serpentine",
    asset: "maraileron_player.png",
    view: "player"
  });
  const event = normalizeCombatVisualEvent({
    type: "attack",
    actorId: actor.id,
    targetId: "braisombre-b"
  });

  const plan = planAnimation({ event, actor, profile: registry.get(actor.profile) });

  assert.equal(plan.eventType, "attack");
  assert.equal(plan.loop, false);
  assert.equal(plan.restoreBaseState, true);
  assert.equal(plan.segments.length, 3);
  assert.equal(plan.segments[1].transform.translateX, 40);
  assert.equal(plan.segments.at(-1).transform.translateX, 0);
});

test("hit planner uses profile-driven impact filter then returns neutral", () => {
  const actor = normalizeVisualActor({
    id: "hit-filter",
    creatureId: "maraileron",
    profile: "serpentine",
    asset: "maraileron_player.png",
    view: "player"
  });

  const plan = planAnimation({
    actor,
    profile: registry.get("serpentine"),
    event: normalizeCombatVisualEvent({ type: "hit", actorId: actor.id })
  });

  assert.deepEqual(plan.segments[0].filter, serpentine.hit.filter);
  assert.deepEqual(plan.segments.at(-1).filter, {
    brightness: 1,
    saturate: 1,
    sepia: 0,
    hueRotateDeg: 0
  });
});

test("opponent facing mirrors horizontal attack direction", () => {
  const actor = normalizeVisualActor({
    id: "braisombre-a",
    creatureId: "braisombre",
    profile: "drake",
    asset: "braisombre_opponent.png",
    view: "opponent"
  });
  const event = normalizeCombatVisualEvent({
    type: "attack",
    actorId: actor.id
  });

  const plan = planAnimation({ event, actor, profile: registry.get(actor.profile) });
  assert.equal(plan.segments[1].transform.translateX, -48);
});

test("idle loops while KO does not restore through a looping state", () => {
  const actor = normalizeVisualActor({
    id: "m",
    creatureId: "maraileron",
    profile: "serpentine",
    asset: "maraileron_opponent.png"
  });

  const idle = planAnimation({
    actor,
    profile: registry.get("serpentine"),
    event: normalizeCombatVisualEvent({ type: "idle", actorId: actor.id })
  });
  const ko = planAnimation({
    actor,
    profile: registry.get("serpentine"),
    event: normalizeCombatVisualEvent({ type: "ko", actorId: actor.id })
  });

  assert.equal(idle.loop, true);
  assert.equal(idle.restoreBaseState, false);
  assert.equal(ko.loop, false);
  assert.equal(ko.restoreBaseState, false);
  assert.equal(ko.segments[0].opacity, 0);
});

test("planner has no renderer or DOM authority", async () => {
  const source = await readFile("src/core/animation/plan-animation.js", "utf8");
  assert.doesNotMatch(source, /document\.|window\.|querySelector|HTMLElement|canvas|getContext/);
});

test("unsupported V1 event fails instead of silently inventing behavior", () => {
  const actor = normalizeVisualActor({
    id: "b",
    creatureId: "braisombre",
    profile: "drake",
    asset: "braisombre_player.png",
    view: "player"
  });

  assert.throws(() => planAnimation({
    actor,
    profile: registry.get("drake"),
    event: normalizeCombatVisualEvent({ type: "dodge", actorId: actor.id })
  }), /No V1 animation planner/);
});

test("VisualActor carries a stable transform origin", () => {
  const actor = normalizeVisualActor({
    id: "b-anchor",
    creatureId: "braisombre",
    profile: "drake",
    asset: "braisombre_player.png",
    view: "player",
    transformOrigin: { x: "50%", y: "88%" }
  });

  assert.deepEqual(actor.transformOrigin, { x: "50%", y: "88%" });
});

test("idle profiles encode the requested morphology differences", () => {
  assert.ok(serpentine.idle.bobY > serpentine.idle.swayX);
  assert.ok(drake.idle.bobY < serpentine.idle.bobY);
  assert.ok(drake.idle.swayX <= 0.5);
  assert.ok(drake.idle.swayRotate < serpentine.idle.swayRotate);
  assert.ok(drake.idle.scaleYDelta > 0);
});

test("planner consumes idle scale deltas from profile data", () => {
  const actor = normalizeVisualActor({
    id: "drake-idle",
    creatureId: "braisombre",
    profile: "drake",
    asset: "braisombre_opponent.png",
    view: "opponent"
  });

  const plan = planAnimation({
    actor,
    profile: registry.get("drake"),
    event: normalizeCombatVisualEvent({ type: "idle", actorId: actor.id })
  });

  assert.equal(plan.segments[0].transform.scaleX, 0.997);
  assert.equal(plan.segments[0].transform.scaleY, 1.012);
  assert.equal(plan.segments[0].transform.translateX, 0);
  assert.equal(plan.segments[0].transform.translateY, -0.5);
});
