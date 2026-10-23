import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planAnimation } from "../../src/core/animation/plan-animation.js";
import { restingTargetCenterForApproachV1 } from "../../src/ui/demo-app.js";

function profile(id) {
  return JSON.parse(readFileSync(new URL(`../../data/profiles/${id}.profile.json`, import.meta.url), "utf8"));
}
function aerialPlan(p) {
  return planAnimation({
    actor: { id: "dragon", facing: "right" },
    profile: p,
    event: {
      type: "aerial-attack", actorId: "dragon", intensity: 1,
      metadata: {
        targetTranslateX: 220, targetTranslateY: 35, travelMs: 1000,
        arenaHeight: 420, arenaExitTranslateY: -350
      }
    }
  });
}

test("all data profiles rise vertically and dive rapidly toward the rival camp", () => {
  for (const id of ["biped", "flying", "massive", "quadruped", "serpentine"]) {
    const p = profile(id);
    assert.ok(p.specialMoves.aerial.riseRatio > 0.6 &&
      p.specialMoves.aerial.riseRatio < 0.8, id);
    const plan = aerialPlan(p);
    const [rise, dive, home] = plan.segments;
    assert.equal(plan.eventType, "aerial-attack");
    assert.equal(rise.label, "aerial-arc-apex");
    assert.equal(rise.transform.translateX, 0, id + " must not chase during ascent");
    assert.equal(rise.ground.translateX, 0, id + " shadow must remain at launch camp");
    assert.equal(rise.ground.translateY, 0);
    assert.ok(rise.transform.translateY < 0);
    assert.equal(dive.label, "aerial-arc-impact");
    assert.equal(dive.transform.translateX, 220 * (1 + p.specialMoves.aerial.followThroughRatio));
    assert.equal(dive.transform.translateY, 35);
    assert.equal(dive.ground.translateX, 220 * (1 + p.specialMoves.aerial.followThroughRatio));
    assert.equal(dive.easing, p.specialMoves.aerial.diveEasing);
    assert.ok(dive.durationMs < rise.durationMs, id + " dive must be quicker than ascent");
    assert.equal(rise.durationMs + dive.durationMs, 1000,
      id + " combat impact timing must not shift");
    assert.equal(home.transform.translateX, 0);
    assert.equal(home.transform.translateY, 0);
    assert.equal(home.durationMs, p.specialMoves.aerial.returnMs);
    assert.equal(plan.restoreBaseState, true);
  }
});

test("the rival-camp visual anchor does not follow an opponent animation", () => {
  const target = {
    container: {
      offsetWidth: 200,
      getBoundingClientRect: () => ({left:500,top:100,width:100,height:80})
    },
    actor: {position:{x:20,y:-10}}
  };
  assert.deepEqual(restingTargetCenterForApproachV1(target), {x:560,y:135});
  const source = readFileSync(new URL("../../src/ui/demo-app.js", import.meta.url), "utf8");
  assert.match(source, /targetAim = approachMode === "aerial" \|\| airborneTarget\s*\? restingTargetCenterForApproachV1\(target\)/);
});
