import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCombatVisualEvent
} from "../../src/contracts/combat-visual-event.js";
import {
  normalizeVisualActor
} from "../../src/contracts/visual-actor.js";
import {
  planAnimation
} from "../../src/core/animation/plan-animation.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function actor(profile) {
  return normalizeVisualActor({
    id: profile + "-actor",
    creatureId: profile + "-creature",
    profile,
    asset: "test.png",
    view: "player",
    facing: "right",
    scale: 2
  });
}

function groundEvent(actorId) {
  return normalizeCombatVisualEvent({
    type: "ground-attack",
    actorId,
    targetId: "target",
    metadata: {
      targetTranslateX: 180,
      targetTranslateY: -30,
      arenaHeight: 800,
      travelMs: 900
    }
  });
}

test("grounded idle profiles keep the feet/base fixed", async () => {
  for (const path of [
    "data/profiles/biped.profile.json",
    "data/profiles/quadruped.profile.json"
  ]) {
    const profile = await json(path);
    assert.equal(profile.idle.motionStyle, "grounded");
    assert.equal(profile.idle.bobY, 0);
    assert.equal(profile.idle.swayRotate, 0);
    assert.equal(profile.idle.scaleXDelta, 0);
    assert.deepEqual(profile.idle.transformOrigin, {
      x: "50%",
      y: "100%"
    });

    const current = actor(profile.id);
    const plan = planAnimation({
      event: normalizeCombatVisualEvent({
        type: "idle",
        actorId: current.id
      }),
      actor: current,
      profile
    });

    assert.deepEqual(plan.transformOrigin, {
      x: "50%",
      y: "100%"
    });

    for (const segment of plan.segments) {
      assert.equal(segment.transform.translateX, 0);
      assert.equal(segment.transform.translateY, 0);
    }
  }
});

test("serpentine idle stays low with only subtle body motion", async () => {
  const profile = await json(
    "data/profiles/serpentine.profile.json"
  );

  assert.equal(profile.idle.motionStyle, "grounded");
  assert.equal(profile.idle.bobY, 0);
  assert.ok(Math.abs(profile.idle.swayRotate) <= 0.35);
  assert.ok(Math.abs(profile.idle.swayX) <= 0.25);
});

test("generic flying profile exists and owns a visible vertical idle", async () => {
  const profile = await json(
    "data/profiles/flying.profile.json"
  );

  assert.equal(profile.id, "flying");
  assert.equal(profile.idle.motionStyle, "floating");
  assert.ok(profile.idle.bobY >= 6);

  const current = actor("flying");
  const plan = planAnimation({
    event: normalizeCombatVisualEvent({
      type: "idle",
      actorId: current.id
    }),
    actor: current,
    profile
  });

  const ys = plan.segments.map(
    (segment) => segment.transform.translateY
  );
  assert.ok(ys.some((value) => value < 0));
  assert.ok(ys.some((value) => value > 0));
});

test("ground locomotion is profile-driven for crawling, biped and quadruped", async () => {
  const serpentine = await json(
    "data/profiles/serpentine.profile.json"
  );
  const biped = await json(
    "data/profiles/biped.profile.json"
  );
  const quadruped = await json(
    "data/profiles/quadruped.profile.json"
  );

  assert.equal(
    serpentine.specialMoves.ground.travelStyle,
    "linear"
  );
  assert.equal(
    biped.specialMoves.ground.travelStyle,
    "hop"
  );
  assert.equal(
    quadruped.specialMoves.ground.travelStyle,
    "hop"
  );
  assert.ok(
    biped.specialMoves.ground.hopCount >
      quadruped.specialMoves.ground.hopCount
  );
  assert.ok(
    biped.specialMoves.ground.hopHeight <
      quadruped.specialMoves.ground.hopHeight
  );

  const serpActor = actor("serpentine");
  const serpPlan = planAnimation({
    event: groundEvent(serpActor.id),
    actor: serpActor,
    profile: serpentine
  });
  assert.equal(
    serpPlan.segments[0].label,
    "ground-linear-impact"
  );

  const bipedActor = actor("biped");
  const bipedPlan = planAnimation({
    event: groundEvent(bipedActor.id),
    actor: bipedActor,
    profile: biped
  });
  assert.ok(
    bipedPlan.segments.some(
      (segment) => segment.label === "ground-hop-1-rise"
    )
  );

  const quadActor = actor("quadruped");
  const quadPlan = planAnimation({
    event: groundEvent(quadActor.id),
    actor: quadActor,
    profile: quadruped
  });
  assert.ok(
    quadPlan.segments.some(
      (segment) => segment.label === "ground-hop-1-rise"
    )
  );
});

test("massive locomotion marks each landing as a semantic footfall cue", async () => {
  const profile = await json(
    "data/profiles/massive.profile.json"
  );
  assert.equal(
    profile.specialMoves.ground.travelStyle,
    "heavy-step"
  );

  const current = actor("massive");
  const plan = planAnimation({
    event: groundEvent(current.id),
    actor: current,
    profile
  });

  const footfalls = plan.segments.filter(
    (segment) => segment.cues.includes("footfall")
  );

  assert.equal(
    footfalls.length,
    profile.specialMoves.ground.stepCount
  );
  assert.ok(footfalls.length >= 2);
});

test("FX Core maps massive footfall cue to camera shake only when profile requests it", async () => {
  const {
    planCreatureMotionCueFx
  } = await import(
    "../../src/core/fx/creature-motion-fx-plan.js"
  );

  const massive = await json(
    "data/profiles/massive.profile.json"
  );
  const biped = await json(
    "data/profiles/biped.profile.json"
  );

  const massiveFx = planCreatureMotionCueFx({
    cue: "footfall",
    profile: massive,
    actorScale: 2
  });
  assert.equal(massiveFx.length, 1);
  assert.equal(massiveFx[0].type, "camera-shake");
  assert.ok(massiveFx[0].amplitudePx > 0);
  assert.ok(massiveFx[0].durationMs > 0);

  assert.deepEqual(
    planCreatureMotionCueFx({
      cue: "footfall",
      profile: biped,
      actorScale: 2
    }),
    []
  );
});

test("DOM camera FX returns to neutral transform after each shake", async () => {
  const {
    createDomCameraFxRenderer
  } = await import(
    "../../src/adapters/renderer/dom-camera-fx.js"
  );

  let capturedKeyframes = null;
  const animation = {
    finished: Promise.resolve(),
    cancel() {}
  };
  const element = {
    style: { transform: "" },
    animate(keyframes) {
      capturedKeyframes = keyframes;
      return animation;
    }
  };

  const renderer = createDomCameraFxRenderer({
    element
  });
  const handle = renderer.play({
    type: "camera-shake",
    amplitudePx: 4,
    durationMs: 120
  });

  await handle.finished;

  assert.ok(capturedKeyframes.length >= 3);
  assert.equal(
    capturedKeyframes.at(-1).transform,
    "translate3d(0px, 0px, 0)"
  );
  assert.equal(element.style.transform, "");
});

test("contact shadow follows creature displayScale and is more pronounced", async () => {
  const css = await readFile(
    "examples/dom-demo/demo.css",
    "utf8"
  );
  const demo = await readFile(
    "src/ui/demo-app.js",
    "utf8"
  );

  assert.match(
    css,
    /\.fighter::before\s*\{[\s\S]*?scale\(var\(--creature-display-scale, 1\)\)[\s\S]*?rgba\(0,\s*0,\s*0,\s*0\.4[0-9]?\)/s
  );
  assert.match(
    demo,
    /--creature-display-scale[\s\S]*actor\.scale/
  );
});

test("Capture preview really loads the generic flying profile exposed by the editor", async () => {
  const source = await readFile(
    "examples/dom-demo/capture-editor-v2.js",
    "utf8"
  );

  assert.match(
    source,
    /data\/profiles\/flying\.profile\.json/
  );
});
