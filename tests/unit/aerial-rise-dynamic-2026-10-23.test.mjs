import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planAnimation } from "../../src/core/animation/plan-animation.js";
import { normalizeCombatVisualEvent } from "../../src/contracts/combat-visual-event.js";
import { normalizeVisualActor } from "../../src/contracts/visual-actor.js";
import { animationPlanToDomTimeline } from "../../src/adapters/renderer/dom-keyframes.js";

const profiles = ["biped", "flying", "massive", "quadruped", "serpentine"];
const originalRiseEasing = "cubic-bezier(0.42, 0, 0.58, 1)";
const expectedRiseEasing = "cubic-bezier(0.25, 0.65, 0.35, 1)";

function actor(profile) {
  return normalizeVisualActor({
    id: "aerial-tester", creatureId: "test", profile, asset: "test.webp",
    view: "player", position: { x: 0, y: 0 }, scale: 1
  });
}
function plan(profile, currentActor) {
  return planAnimation({
    actor: currentActor,
    profile,
    event: normalizeCombatVisualEvent({
      type: "aerial-attack", actorId: currentActor.id, targetId: "foe",
      metadata: {
        targetTranslateX: 210, targetTranslateY: 25,
        travelMs: 1000, arenaHeight: 420, arenaExitTranslateY: -350
      }
    })
  });
}
function baselineWithoutRiseEasing(profile) {
  const { riseEasing, ...aerial } = profile.specialMoves.aerial;
  return {
    ...profile,
    specialMoves: { ...profile.specialMoves, aerial }
  };
}
// Sample actual CSS cubic-bezier timing by solving its x-coordinate.
// This verifies speed/height, not merely that a profile string changed.
function timingProgress(easing, elapsedFraction) {
  const numbers = easing.match(/^cubic-bezier\(([^)]+)\)$/)?.[1]
    ?.split(",").map(Number);
  assert.equal(numbers?.length, 4, "a valid four-component CSS cubic-bezier is required");
  const [p1x, p1y, p2x, p2y] = numbers;
  const cubic = (a, b, t) => 3 * (1 - t) ** 2 * t * a +
    3 * (1 - t) * t ** 2 * b + t ** 3;
  let lo = 0, hi = 1;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (cubic(p1x, p2x, mid) < elapsedFraction) lo = mid;
    else hi = mid;
  }
  return cubic(p1y, p2y, (lo + hi) / 2);
}

test("five creature profiles reach most of their altitude earlier while preserving the dive's full velocity and timeline", () => {
  for (const id of profiles) {
    const profile = JSON.parse(readFileSync(new URL(
      `../../data/profiles/${id}.profile.json`, import.meta.url
    ), "utf8"));
    const currentActor = actor(id);
    const before = plan(baselineWithoutRiseEasing(profile), currentActor);
    const after = plan(profile, currentActor);
    assert.deepEqual(after.segments.map(s => s.label),
      ["aerial-arc-apex", "aerial-arc-impact", "aerial-home"], id);
    assert.equal(before.segments[0].easing, originalRiseEasing, id);
    assert.equal(after.segments[0].easing, expectedRiseEasing, id);
    assert.equal(after.segments[0].durationMs, before.segments[0].durationMs, id);
    assert.ok(after.segments[0].transform.translateY < 0, id);
    assert.equal(after.segments[0].transform.translateX, 0, id);
    assert.equal(after.segments[0].ground.translateX, 0, id);

    // All geometry, phase boundaries, shadow projection, dive and home stay identical.
    for (let i = 0; i < after.segments.length; i++) {
      assert.equal(after.segments[i].durationMs, before.segments[i].durationMs, id);
      assert.deepEqual(after.segments[i].transform, before.segments[i].transform, id);
      assert.deepEqual(after.segments[i].ground, before.segments[i].ground, id);
      if (i > 0) assert.equal(after.segments[i].easing, before.segments[i].easing, id);
    }
    assert.equal(after.segments[0].durationMs + after.segments[1].durationMs, 1000, id);
    assert.equal(after.segments[1].easing, profile.specialMoves.aerial.diveEasing, id);
    assert.equal(after.segments[1].transform.translateX,
      210 * (1 + profile.specialMoves.aerial.followThroughRatio), id);

    const quarterBefore = timingProgress(before.segments[0].easing, 0.25);
    const quarterAfter = timingProgress(after.segments[0].easing, 0.25);
    assert.ok(quarterBefore < 0.2, id + ": historically slow rise baseline");
    assert.ok(quarterAfter > 0.55 && quarterAfter < 0.7,
      id + ": prompt rise, not an instantaneous teleport");
    assert.ok(quarterAfter > quarterBefore * 3, id + ": materially faster at takeoff");
    assert.equal(timingProgress(after.segments[0].easing, 1), 1,
      id + ": same apex at exactly the same phase boundary");
  }
});

test("real DOM body+shadow keyframes use only the faster ascent easing; dive/home playback is unchanged", () => {
  const profile = JSON.parse(readFileSync(new URL(
    "../../data/profiles/flying.profile.json", import.meta.url
  ), "utf8"));
  const currentActor = actor("flying");
  const after = plan(profile, currentActor);
  const baseline = plan(baselineWithoutRiseEasing(profile), currentActor);
  const current = animationPlanToDomTimeline(after, currentActor);
  const old = animationPlanToDomTimeline(baseline, currentActor);

  assert.equal(current.options.duration, old.options.duration);
  assert.equal(current.keyframes.length, 4);
  assert.equal(current.keyframes[0].easing, expectedRiseEasing);
  assert.equal(current.shadowKeyframes[0].easing, expectedRiseEasing);
  assert.equal(current.keyframes[1].easing, profile.specialMoves.aerial.diveEasing);
  assert.equal(current.shadowKeyframes[1].easing, profile.specialMoves.aerial.diveEasing);
  for (let i = 0; i < current.keyframes.length; i++) {
    assert.equal(current.keyframes[i].offset, old.keyframes[i].offset);
    assert.equal(current.keyframes[i].transform, old.keyframes[i].transform);
    assert.equal(current.shadowKeyframes[i].transform, old.shadowKeyframes[i].transform);
    if (i > 0) {
      assert.equal(current.keyframes[i].easing, old.keyframes[i].easing);
      assert.equal(current.shadowKeyframes[i].easing, old.shadowKeyframes[i].easing);
    }
  }
});
