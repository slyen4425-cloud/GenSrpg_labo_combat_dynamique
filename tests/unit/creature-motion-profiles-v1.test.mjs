import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeVisualActor } from "../../src/contracts/visual-actor.js";
import { planAnimation } from "../../src/core/animation/plan-animation.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function actor(profile) {
  return normalizeVisualActor({
    id: profile + "-actor",
    creatureId: profile + "-creature",
    profile,
    asset: "test.webp",
    view: "player",
    facing: "right",
    scale: 1
  });
}

function event(type, actorId) {
  return {
    type,
    actorId,
    targetId: null,
    variant: "basic",
    intensity: 1,
    metadata: {}
  };
}

const profilePaths = Object.freeze({
  biped: "data/profiles/biped.profile.json",
  quadruped: "data/profiles/quadruped.profile.json",
  serpentine: "data/profiles/serpentine.profile.json",
  drake: "data/profiles/drake.profile.json",
  massive: "data/profiles/massive.profile.json"
});

test("all live creature profiles declare a data-driven locomotion preset", async () => {
  for (const [id, path] of Object.entries(profilePaths)) {
    const profile = await json(path);
    assert.equal(typeof profile.locomotion, "object", id + " locomotion");
    assert.equal(typeof profile.locomotion.style, "string", id + " locomotion.style");
    assert.ok(profile.locomotion.durationMs > 0, id + " locomotion.durationMs");
  }
});

test("biped quadruped and massive idle keep the base point fixed with a low pivot", async () => {
  for (const id of ["biped", "quadruped", "massive"]) {
    const profile = await json(profilePaths[id]);
    const plan = planAnimation({
      event: event("idle", id + "-actor"),
      actor: actor(id),
      profile
    });

    assert.equal(plan.transformOrigin?.x, "50%", id + " idle pivot x");
    assert.match(plan.transformOrigin?.y ?? "", /%$/, id + " idle pivot y");
    assert.ok(parseFloat(plan.transformOrigin.y) >= 85, id + " idle pivot must stay near feet");

    for (const segment of plan.segments) {
      assert.equal(segment.transform.translateX, 0, id + " idle must not slide X");
      assert.equal(segment.transform.translateY, 0, id + " idle must not lift feet");
    }
  }
});

test("serpentine idle remains essentially grounded while drake keeps visible vertical flight", async () => {
  const serpentine = await json(profilePaths.serpentine);
  const drake = await json(profilePaths.drake);

  const groundPlan = planAnimation({
    event: event("idle", "serpentine-actor"),
    actor: actor("serpentine"),
    profile: serpentine
  });
  const flightPlan = planAnimation({
    event: event("idle", "drake-actor"),
    actor: actor("drake"),
    profile: drake
  });

  assert.ok(
    Math.max(...groundPlan.segments.map((segment) => Math.abs(segment.transform.translateY))) <= 0.5,
    "serpentine idle should remain at ground contact"
  );
  assert.ok(
    Math.max(...flightPlan.segments.map((segment) => Math.abs(segment.transform.translateY))) >= 5,
    "flying idle should visibly oscillate vertically"
  );
});

test("move animation is morph-driven: crawler linear, biped short hop, quadruped longer bound", async () => {
  const plans = {};
  for (const id of ["serpentine", "biped", "quadruped"]) {
    const profile = await json(profilePaths[id]);
    plans[id] = planAnimation({
      event: event("move", id + "-actor"),
      actor: actor(id),
      profile
    });
  }

  const maxLift = (plan) =>
    Math.max(0, ...plan.segments.map((segment) => -segment.transform.translateY));

  assert.equal(maxLift(plans.serpentine), 0, "crawler movement must stay linear on ground");
  assert.ok(maxLift(plans.biped) > 0, "biped movement needs a small hop");
  assert.ok(
    maxLift(plans.quadruped) > maxLift(plans.biped),
    "quadruped bound must be longer/higher than biped hop"
  );
});

test("massive movement exposes explicit footfall cues instead of camera logic in Animation Core", async () => {
  const profile = await json(profilePaths.massive);
  const plan = planAnimation({
    event: event("move", "massive-actor"),
    actor: actor("massive"),
    profile
  });

  const footfalls = plan.cues?.filter((cue) => cue.type === "footfall") ?? [];
  assert.ok(footfalls.length >= 1, "massive locomotion requires footfall cues");
  assert.ok(
    footfalls.every((cue) => cue.atMs >= 0 && cue.atMs <= plan.segments.reduce((sum, item) => sum + item.durationMs, 0)),
    "footfall cues must be timed by Animation Core"
  );
  assert.equal(
    "cameraShake" in plan,
    false,
    "Animation Core must not own camera shake"
  );
});

test("FX Core translates a heavy footfall cue into a camera shake plan", async () => {
  const { planLocomotionCueFx } = await import(
    "../../src/core/fx/locomotion-fx-plan.js"
  );
  const profile = await json(profilePaths.massive);

  const plans = planLocomotionCueFx({
    profile,
    cue: { type: "footfall", intensity: 1 }
  });

  assert.equal(plans.length, 1);
  assert.equal(plans[0].type, "camera-shake");
  assert.ok(plans[0].durationMs > 0);
  assert.ok(plans[0].amplitudePx > 0);
});

test("contact shadow derives its scale from the actor display scale and is more pronounced", async () => {
  const css = await readFile("examples/dom-demo/demo.css", "utf8");
  const demoApp = await readFile("src/ui/demo-app.js", "utf8");

  assert.match(css, /--creature-display-scale/);
  assert.match(css, /fighter::before[\s\S]*var\(--creature-display-scale/);
  assert.match(css, /fighter::before[\s\S]*rgba\(0,\s*0,\s*0,\s*0\.(?:3[5-9]|[4-9]\d?)/);
  assert.match(
    demoApp,
    /--creature-display-scale[\s\S]*actor\.scale/,
    "the CSS shadow scale must be projected from VisualActor.scale"
  );
});
