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
  flying: "data/profiles/flying.profile.json",
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

test("serpentine idle remains essentially grounded while flying keeps visible vertical flight", async () => {
  const serpentine = await json(profilePaths.serpentine);
  const flying = await json(profilePaths.flying);

  const groundPlan = planAnimation({
    event: event("idle", "serpentine-actor"),
    actor: actor("serpentine"),
    profile: serpentine
  });
  const flightPlan = planAnimation({
    event: event("idle", "flying-actor"),
    actor: actor("flying"),
    profile: flying
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

test("serpentine alternate idle anchors the base and sways the upper body both ways", async () => {
  const profile = await json(profilePaths.serpentine);
  const plan = planAnimation({
    event: event("idle", "serpentine-actor"),
    actor: actor("serpentine"),
    profile
  });

  assert.equal(profile.idle.swayMode, "alternate");
  assert.equal(plan.transformOrigin?.y, "94%");
  assert.deepEqual(
    plan.segments.map((segment) => segment.label),
    ["idle-right", "idle-center-1", "idle-left", "idle-home"]
  );
  assert.ok(plan.segments[0].transform.rotateDeg > 0);
  assert.ok(plan.segments[2].transform.rotateDeg < 0);
  for (const segment of plan.segments) {
    assert.equal(segment.transform.translateX, 0);
    assert.equal(segment.transform.translateY, 0);
  }
});

test("flying generic locomotion is one smooth arch with one apex and no footfalls", async () => {
  const profile = await json(profilePaths.flying);
  const plan = planAnimation({
    event: event("move", "flying-actor"),
    actor: actor("flying"),
    profile
  });

  assert.deepEqual(
    plan.segments.map((segment) => segment.label),
    ["flight-rise", "flight-apex", "flight-descent", "flight-settle"]
  );
  const lifts = plan.segments.map(
    (segment) => -segment.transform.translateY
  );
  assert.ok(lifts[0] > 0);
  assert.ok(lifts[1] > lifts[0]);
  assert.ok(lifts[2] > 0 && lifts[2] < lifts[1]);
  assert.equal(plan.segments[3].transform.translateY, 0);
  assert.ok(lifts[1] >= 18);
  assert.equal(
    (plan.cues ?? []).filter((cue) => cue.type === "footfall").length,
    0
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

test("contact shadow derives scale from actor and optional offset/opacity from profile presentation", async () => {
  const css = await readFile("examples/dom-demo/demo.css", "utf8");
  const demoApp = await readFile("src/ui/demo-app.js", "utf8");
  const flying = await json(profilePaths.flying);

  assert.match(css, /--creature-display-scale/);
  assert.match(
    css,
    /fighter__shadow[\s\S]*var\(--creature-display-scale/
  );
  assert.match(
    css,
    /bottom:\s*var\(--creature-shadow-bottom,\s*8%\)/
  );
  assert.match(
    css,
    /var\(--creature-shadow-opacity,\s*0\.42\)/
  );
  assert.match(
    demoApp,
    /profilePresentation[\s\S]*\.shadow[\s\S]*--creature-shadow-bottom[\s\S]*--creature-shadow-opacity/
  );
  assert.equal(typeof flying.presentation?.shadow?.bottomPct, "number");
  assert.equal(typeof flying.presentation?.shadow?.opacity, "number");
  assert.equal(
    "shadowBottomPct" in (flying.presentation ?? {}),
    false,
    "flat shadowBottomPct must not survive as a second presentation authority"
  );
});

test("massive true path reaches camera renderer through Animation Core and FX Core", async () => {
  const { animationPlanToDomTimeline } = await import(
    "../../src/adapters/renderer/dom-keyframes.js"
  );
  const { planLocomotionCueFx } = await import(
    "../../src/core/fx/locomotion-fx-plan.js"
  );
  const { createDomCameraFxRenderer } = await import(
    "../../src/adapters/renderer/dom-camera-fx.js"
  );

  const profile = await json(profilePaths.massive);
  const currentActor = actor("massive");
  const movePlan = planAnimation({
    event: event("move", currentActor.id),
    actor: currentActor,
    profile
  });

  const timeline = animationPlanToDomTimeline(
    movePlan,
    currentActor
  );
  assert.equal(timeline.totalDurationMs, profile.locomotion.durationMs);
  assert.equal(timeline.keyframes.at(-1).offset, 1);

  const footfall = movePlan.cues.find(
    (cue) => cue.type === "footfall"
  );
  assert.ok(footfall);

  const [cameraPlan] = planLocomotionCueFx({
    profile,
    cue: footfall
  });
  assert.equal(cameraPlan.type, "camera-shake");

  let captured = null;
  const cameraElement = {};
  const renderer = createDomCameraFxRenderer({
    element: cameraElement,
    animate(element, keyframes, options) {
      captured = { element, keyframes, options };
      return {
        finished: Promise.resolve(),
        cancel() {}
      };
    }
  });

  const handle = renderer.play(cameraPlan);
  assert.equal(handle.status, "running");
  assert.equal(captured.element, cameraElement);
  assert.equal(captured.options.duration, cameraPlan.durationMs);
  assert.match(
    captured.keyframes[1].transform,
    /translate3d/
  );
  await handle.finished;
  renderer.dispose();
});

test("distance renderer accepts the locomotion duration without owning morphology", async () => {
  const { createDomDistancePresenter } = await import(
    "../../src/adapters/renderer/dom-distance-presenter.js"
  );

  function style() {
    const values = {};
    return {
      left: "",
      top: "",
      setProperty(name, value) {
        values[name] = value;
      },
      getPropertyValue(name) {
        return values[name] ?? "";
      }
    };
  }

  const player = { style: style() };
  const opponent = { style: style() };
  const presenter = createDomDistancePresenter({
    fighters: { player, opponent }
  });

  const result = presenter.presentMovement({
    result: {
      ok: true,
      outcome: "moved",
      events: [
        {
          type: "distance-changed",
          from: "medium",
          to: "short"
        }
      ]
    },
    actorSlot: "player",
    durationMs: 330
  });

  assert.equal(result.durationMs, 330);
  assert.equal(
    player.style.getPropertyValue("--distance-move-duration"),
    "330ms"
  );
  assert.equal(
    opponent.style.getPropertyValue("--distance-move-duration"),
    "260ms"
  );
});

test("combat UI routes only real AI movement through the visual locomotion owner", async () => {
  const combatUi = await readFile(
    "src/ui/combat-test-ui.js",
    "utf8"
  );
  const visualController = await readFile(
    "src/ui/demo-app.js",
    "utf8"
  );

  assert.match(
    combatUi,
    /decision\.status === "moved"[\s\S]*visuals\.playMovementFor\(decision\.actorId\)/
  );
  assert.match(
    visualController,
    /function schedulePlanCues[\s\S]*planLocomotionCueFx/
  );
  assert.match(
    visualController,
    /function playMovementFor[\s\S]*type: "move"[\s\S]*schedulePlanCues/
  );
  assert.match(
    visualController,
    /function playApproachFor[\s\S]*schedulePlanCues/
  );
  assert.doesNotMatch(
    combatUi,
    /camera-shake|amplitudePx/
  );
});
