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
const biped = await loadJson("data/profiles/biped.profile.json");
const quadruped = await loadJson("data/profiles/quadruped.profile.json");
const massive = await loadJson("data/profiles/massive.profile.json");
const registry = createProfileRegistry([
  serpentine,
  drake,
  biped,
  quadruped,
  massive
]);

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
        travelMs
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
  assert.ok(plan.segments[0].transform.translateY < 0);
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


test("ground attack reaches target exactly at configured travel time then returns", () => {
  const current = actor();
  const travelMs = 1500;
  const plan = planAnimation({
    event: normalizeCombatVisualEvent({
      type: "ground-attack",
      actorId: current.id,
      targetId: "opponent-actor",
      metadata: {
        targetTranslateX: 170,
        targetTranslateY: -6,
        travelMs
      }
    }),
    actor: current,
    profile: registry.get(current.profile)
  });

  const approach = plan.segments.filter(
    (segment) => segment.label !== "ground-home"
  );
  const impact = approach.at(-1);

  assert.ok(approach.length >= 2);
  assert.equal(impact.label, "ground-approach-impact");
  assert.equal(
    approach.reduce((sum, segment) => sum + segment.durationMs, 0),
    travelMs
  );
  assert.equal(impact.transform.translateX, 170);
  assert.equal(impact.transform.translateY, -6);
  assert.equal(plan.segments.at(-1).transform.translateX, 0);
  assert.equal(plan.segments.at(-1).transform.translateY, 0);
});

test("ground approach grows toward player camera and shrinks toward arena depth", () => {
  const current = actor("drake");
  const profile = registry.get("drake");

  const towardCamera = planAnimation({
    event: normalizeCombatVisualEvent({
      type: "ground-attack",
      actorId: current.id,
      targetId: "target",
      metadata: {
        targetTranslateX: -140,
        targetTranslateY: 200,
        arenaHeight: 800,
        travelMs: 900
      }
    }),
    actor: current,
    profile
  });

  const towardDepth = planAnimation({
    event: normalizeCombatVisualEvent({
      type: "ground-attack",
      actorId: current.id,
      targetId: "target",
      metadata: {
        targetTranslateX: 140,
        targetTranslateY: -200,
        arenaHeight: 800,
        travelMs: 900
      }
    }),
    actor: current,
    profile
  });

  const cameraImpact = towardCamera.segments.find(
    (segment) => segment.label === "ground-approach-impact"
  );
  const depthImpact = towardDepth.segments.find(
    (segment) => segment.label === "ground-approach-impact"
  );

  assert.ok(
    cameraImpact.transform.scaleX >
      profile.specialMoves.ground.impactScaleX
  );
  assert.ok(
    cameraImpact.transform.scaleY >
      profile.specialMoves.ground.impactScaleY
  );
  assert.ok(
    depthImpact.transform.scaleX <
      profile.specialMoves.ground.impactScaleX
  );
  assert.ok(
    depthImpact.transform.scaleY <
      profile.specialMoves.ground.impactScaleY
  );

  assert.equal(
    towardCamera.segments
      .filter((segment) => segment.label !== "ground-home")
      .reduce((sum, segment) => sum + segment.durationMs, 0),
    900
  );
  assert.equal(
    towardDepth.segments
      .filter((segment) => segment.label !== "ground-home")
      .reduce((sum, segment) => sum + segment.durationMs, 0),
    900
  );
  assert.equal(
    towardCamera.segments.at(-1).transform.scaleX,
    1
  );
  assert.equal(
    towardCamera.segments.at(-1).transform.scaleY,
    1
  );
});

test("shared perspective scale respects configured visual bounds", () => {
  const current = actor("drake");
  const profile = registry.get("drake");
  const ground = profile.specialMoves.ground;
  const perspective = profile.specialMoves.perspective;

  const near = planAnimation({
    event: normalizeCombatVisualEvent({
      type: "ground-attack",
      actorId: current.id,
      targetId: "target",
      metadata: {
        targetTranslateX: 0,
        targetTranslateY: 10000,
        arenaHeight: 100,
        travelMs: 500
      }
    }),
    actor: current,
    profile
  });

  const far = planAnimation({
    event: normalizeCombatVisualEvent({
      type: "ground-attack",
      actorId: current.id,
      targetId: "target",
      metadata: {
        targetTranslateX: 0,
        targetTranslateY: -10000,
        arenaHeight: 100,
        travelMs: 500
      }
    }),
    actor: current,
    profile
  });

  const nearImpact = near.segments.find(
    (segment) => segment.label === "ground-approach-impact"
  );
  const farImpact = far.segments.find(
    (segment) => segment.label === "ground-approach-impact"
  );

  assert.equal(
    nearImpact.transform.scaleX,
    ground.impactScaleX * perspective.perspectiveScaleMax
  );
  assert.equal(
    farImpact.transform.scaleX,
    ground.impactScaleX * perspective.perspectiveScaleMin
  );
});

test("aerial attack can rise completely above arena before diving", () => {
  const current = actor("drake");
  const plan = planAnimation({
    event: normalizeCombatVisualEvent({
      type: "aerial-attack",
      actorId: current.id,
      targetId: "opponent-actor",
      metadata: {
        targetTranslateX: 140,
        targetTranslateY: 10,
        arenaExitTranslateY: -340,
        travelMs: 850
      }
    }),
    actor: current,
    profile: registry.get(current.profile)
  });

  assert.equal(plan.segments[0].label, "aerial-rise");
  assert.equal(plan.segments[0].transform.translateY, -340);
  assert.equal(plan.segments[1].opacity, 0);
  assert.ok(plan.segments[1].transform.translateY <= -340);

  const impactMs =
    plan.segments[0].durationMs +
    plan.segments[1].durationMs +
    plan.segments[2].durationMs;
  assert.equal(impactMs, 850);
});


test("aerial approach shrinks toward arena depth and grows toward player camera", () => {
  const current = actor("drake");
  const profile = registry.get("drake");

  const towardDepth = planAnimation({
    event: normalizeCombatVisualEvent({
      type: "aerial-attack",
      actorId: current.id,
      targetId: "target",
      metadata: {
        targetTranslateX: 140,
        targetTranslateY: -200,
        arenaHeight: 800,
        arenaExitTranslateY: -340,
        travelMs: 850
      }
    }),
    actor: current,
    profile
  });

  const towardCamera = planAnimation({
    event: normalizeCombatVisualEvent({
      type: "aerial-attack",
      actorId: current.id,
      targetId: "target",
      metadata: {
        targetTranslateX: -140,
        targetTranslateY: 200,
        arenaHeight: 800,
        arenaExitTranslateY: -340,
        travelMs: 850
      }
    }),
    actor: current,
    profile
  });

  const depthImpact = towardDepth.segments.find(
    (segment) => segment.label === "aerial-dive-impact"
  );
  const cameraImpact = towardCamera.segments.find(
    (segment) => segment.label === "aerial-dive-impact"
  );

  assert.ok(depthImpact.transform.scaleX < 1.05);
  assert.ok(depthImpact.transform.scaleY < 0.96);
  assert.ok(cameraImpact.transform.scaleX > 1.05);
  assert.ok(cameraImpact.transform.scaleY > 0.96);

  const depthImpactMs =
    towardDepth.segments[0].durationMs +
    towardDepth.segments[1].durationMs +
    towardDepth.segments[2].durationMs;
  const cameraImpactMs =
    towardCamera.segments[0].durationMs +
    towardCamera.segments[1].durationMs +
    towardCamera.segments[2].durationMs;

  assert.equal(depthImpactMs, 850);
  assert.equal(cameraImpactMs, 850);
  assert.equal(towardDepth.segments.at(-1).transform.scaleX, 1);
  assert.equal(towardDepth.segments.at(-1).transform.scaleY, 1);
  assert.equal(towardCamera.segments.at(-1).transform.scaleX, 1);
  assert.equal(towardCamera.segments.at(-1).transform.scaleY, 1);
});

test("teleport approach uses the same camera-depth perspective rule", () => {
  const current = actor("drake");
  const profile = registry.get("drake");

  const towardDepth = planAnimation({
    event: normalizeCombatVisualEvent({
      type: "teleport-attack",
      actorId: current.id,
      targetId: "target",
      metadata: {
        targetTranslateX: 140,
        targetTranslateY: -200,
        arenaHeight: 800,
        travelMs: 500
      }
    }),
    actor: current,
    profile
  });

  const towardCamera = planAnimation({
    event: normalizeCombatVisualEvent({
      type: "teleport-attack",
      actorId: current.id,
      targetId: "target",
      metadata: {
        targetTranslateX: -140,
        targetTranslateY: 200,
        arenaHeight: 800,
        travelMs: 500
      }
    }),
    actor: current,
    profile
  });

  const depthImpact = towardDepth.segments.find(
    (segment) => segment.label === "teleport-impact"
  );
  const cameraImpact = towardCamera.segments.find(
    (segment) => segment.label === "teleport-impact"
  );

  assert.ok(depthImpact.transform.scaleX < 1.04);
  assert.ok(depthImpact.transform.scaleY < 0.98);
  assert.ok(cameraImpact.transform.scaleX > 1.04);
  assert.ok(cameraImpact.transform.scaleY > 0.98);

  assert.equal(
    towardDepth.segments[0].durationMs +
      towardDepth.segments[1].durationMs,
    500
  );
  assert.equal(
    towardCamera.segments[0].durationMs +
      towardCamera.segments[1].durationMs,
    500
  );
  assert.equal(towardDepth.segments.at(-1).transform.scaleX, 1);
  assert.equal(towardDepth.segments.at(-1).transform.scaleY, 1);
  assert.equal(towardCamera.segments.at(-1).transform.scaleX, 1);
  assert.equal(towardCamera.segments.at(-1).transform.scaleY, 1);
});


test("shared perspective stays clearly visible at the smallest live arena depth delta", () => {
  const current = actor("drake");
  const profile = registry.get("drake");
  const arenaHeight = 800;
  const targetTranslateY = 128;
  const cases = [
    {
      type: "ground-attack",
      impactLabel: "ground-approach-impact",
      baseScaleX: profile.specialMoves.ground.impactScaleX,
      travelMs: 900
    },
    {
      type: "aerial-attack",
      impactLabel: "aerial-dive-impact",
      baseScaleX: 1.05,
      travelMs: 850
    },
    {
      type: "teleport-attack",
      impactLabel: "teleport-impact",
      baseScaleX: 1.04,
      travelMs: 500
    }
  ];

  for (const item of cases) {
    const towardDepth = planAnimation({
      event: normalizeCombatVisualEvent({
        type: item.type,
        actorId: current.id,
        targetId: "target",
        metadata: {
          targetTranslateX: 140,
          targetTranslateY: -targetTranslateY,
          arenaHeight,
          arenaExitTranslateY: -340,
          travelMs: item.travelMs
        }
      }),
      actor: current,
      profile
    });

    const towardCamera = planAnimation({
      event: normalizeCombatVisualEvent({
        type: item.type,
        actorId: current.id,
        targetId: "target",
        metadata: {
          targetTranslateX: -140,
          targetTranslateY,
          arenaHeight,
          arenaExitTranslateY: -340,
          travelMs: item.travelMs
        }
      }),
      actor: current,
      profile
    });

    const depthImpact = towardDepth.segments.find(
      (segment) => segment.label === item.impactLabel
    );
    const cameraImpact = towardCamera.segments.find(
      (segment) => segment.label === item.impactLabel
    );

    assert.ok(
      depthImpact.transform.scaleX <= item.baseScaleX * 0.81,
      `${item.type} should visibly shrink toward arena depth`
    );
    assert.ok(
      cameraImpact.transform.scaleX >= item.baseScaleX * 1.19,
      `${item.type} should visibly grow toward player camera`
    );
  }
});

test("profiles expose one shared perspective preset instead of ground-only duplicates", () => {
  for (const profile of [registry.get("drake"), registry.get("serpentine")]) {
    assert.deepEqual(
      Object.keys(profile.specialMoves.perspective).sort(),
      [
        "perspectiveScaleMax",
        "perspectiveScaleMin",
        "perspectiveScaleStrength"
      ]
    );
    assert.equal(
      "perspectiveScaleStrength" in profile.specialMoves.ground,
      false
    );
    assert.equal(
      "perspectiveScaleMin" in profile.specialMoves.ground,
      false
    );
    assert.equal(
      "perspectiveScaleMax" in profile.specialMoves.ground,
      false
    );
  }
});


test("ground attack consumes morphology locomotion while still arriving exactly at impact time", () => {
  const travelMs = 1000;
  const target = {
    targetTranslateX: 200,
    targetTranslateY: -20,
    arenaHeight: 800,
    travelMs
  };

  const plans = Object.fromEntries(
    ["serpentine", "biped", "quadruped", "massive"].map((profileId) => {
      const current = actor(profileId);
      return [
        profileId,
        planAnimation({
          event: normalizeCombatVisualEvent({
            type: "ground-attack",
            actorId: current.id,
            targetId: "opponent-actor",
            metadata: target
          }),
          actor: current,
          profile: registry.get(profileId)
        })
      ];
    })
  );

  const approachSegments = (plan) =>
    plan.segments.filter((segment) => segment.label !== "ground-home");
  const impactTime = (plan) =>
    approachSegments(plan).reduce((sum, segment) => sum + segment.durationMs, 0);
  const maxRelativeLift = (plan) =>
    Math.max(
      0,
      ...approachSegments(plan).map((segment, index, items) => {
        const progress =
          items.slice(0, index + 1).reduce((sum, item) => sum + item.durationMs, 0) /
          travelMs;
        const linearY = target.targetTranslateY * progress;
        return linearY - segment.transform.translateY;
      })
    );

  assert.equal(impactTime(plans.serpentine), travelMs);
  assert.equal(impactTime(plans.biped), travelMs);
  assert.equal(impactTime(plans.quadruped), travelMs);
  assert.equal(impactTime(plans.massive), travelMs);

  assert.equal(maxRelativeLift(plans.serpentine), 0);
  assert.ok(maxRelativeLift(plans.biped) > 0);
  assert.ok(
    maxRelativeLift(plans.quadruped) > maxRelativeLift(plans.biped),
    "quadruped must visibly bound higher/longer than biped"
  );

  assert.ok(
    approachSegments(plans.massive).length >= 4,
    "massive ground approach must expose its heavy steps"
  );
  assert.ok(
    (plans.massive.cues ?? []).filter((cue) => cue.type === "footfall").length >= 2,
    "massive ground approach must emit footfalls for camera FX"
  );

  for (const plan of Object.values(plans)) {
    const impact = approachSegments(plan).at(-1);
    assert.equal(impact.transform.translateX, target.targetTranslateX);
    assert.equal(impact.transform.translateY, target.targetTranslateY);
  }
});


test("motion tuning v2 gives quadruped two bounds and a stronger but smaller biped hop", () => {
  const travelMs = 1000;
  const metadata = {
    targetTranslateX: 200,
    targetTranslateY: 0,
    arenaHeight: 800,
    travelMs
  };

  function groundPlan(profileId) {
    const current = actor(profileId);
    return planAnimation({
      event: normalizeCombatVisualEvent({
        type: "ground-attack",
        actorId: current.id,
        targetId: "opponent-actor",
        metadata
      }),
      actor: current,
      profile: registry.get(profileId)
    });
  }

  const bipedPlan = groundPlan("biped");
  const quadrupedPlan = groundPlan("quadruped");

  const bipedApproach = bipedPlan.segments.filter(
    (segment) => segment.label !== "ground-home"
  );
  const quadrupedApproach = quadrupedPlan.segments.filter(
    (segment) => segment.label !== "ground-home"
  );

  const bipedLift = Math.max(
    ...bipedApproach.map((segment) => -segment.transform.translateY)
  );
  const quadrupedLifts = quadrupedApproach.filter(
    (segment) => segment.transform.translateY < -5
  );

  assert.ok(
    bipedLift >= 8,
    "biped hop should be slightly stronger than V1"
  );
  assert.equal(
    quadrupedLifts.length,
    2,
    "quadruped approach should expose two distinct airborne bounds"
  );
  assert.ok(
    Math.max(...quadrupedLifts.map((segment) => -segment.transform.translateY)) >
      bipedLift,
    "quadruped bounds must remain more pronounced than biped hop"
  );

  assert.equal(
    bipedApproach.reduce((sum, segment) => sum + segment.durationMs, 0),
    travelMs
  );
  assert.equal(
    quadrupedApproach.reduce((sum, segment) => sum + segment.durationMs, 0),
    travelMs
  );
  assert.equal(
    quadrupedApproach.at(-1).label,
    "ground-approach-impact"
  );
});


test("hop fluidity v3 uses regular small arcs with equal step distances", () => {
  const travelMs = 1200;
  const targetX = 300;
  const metadata = {
    targetTranslateX: targetX,
    targetTranslateY: 0,
    arenaHeight: 800,
    travelMs
  };

  function planFor(profileId) {
    const current = actor(profileId);
    return planAnimation({
      event: normalizeCombatVisualEvent({
        type: "ground-attack",
        actorId: current.id,
        targetId: "opponent-actor",
        metadata
      }),
      actor: current,
      profile: registry.get(profileId)
    });
  }

  const bipedApproach = planFor("biped").segments.filter(
    (segment) => segment.label !== "ground-home"
  );
  const quadrupedApproach = planFor("quadruped").segments.filter(
    (segment) => segment.label !== "ground-home"
  );

  const bipedAirborne = bipedApproach.filter(
    (segment) => segment.transform.translateY < 0
  );
  const quadrupedAirborne = quadrupedApproach.filter(
    (segment) => segment.transform.translateY < 0
  );
  const bipedLandings = bipedApproach.filter(
    (segment) => Math.abs(segment.transform.translateY) < 1e-9
  );
  const quadrupedLandings = quadrupedApproach.filter(
    (segment) => Math.abs(segment.transform.translateY) < 1e-9
  );

  assert.equal(bipedAirborne.length, 3);
  assert.equal(bipedLandings.length, 3);
  assert.equal(quadrupedAirborne.length, 2);
  assert.equal(quadrupedLandings.length, 2);

  const equalLandingSteps = (segments, expectedStep) => {
    let previousX = 0;
    for (const segment of segments) {
      const step = segment.transform.translateX - previousX;
      assert.ok(
        Math.abs(step - expectedStep) < 1e-9,
        `expected regular step of ${expectedStep}px, got ${step}px`
      );
      previousX = segment.transform.translateX;
    }
  };

  equalLandingSteps(bipedLandings, targetX / 3);
  equalLandingSteps(quadrupedLandings, targetX / 2);

  const bipedLift = Math.max(
    ...bipedAirborne.map((segment) => -segment.transform.translateY)
  );
  const quadrupedLift = Math.max(
    ...quadrupedAirborne.map((segment) => -segment.transform.translateY)
  );

  assert.ok(bipedLift >= 11);
  assert.ok(quadrupedLift > bipedLift);

  assert.equal(
    bipedApproach.reduce((sum, segment) => sum + segment.durationMs, 0),
    travelMs
  );
  assert.equal(
    quadrupedApproach.reduce((sum, segment) => sum + segment.durationMs, 0),
    travelMs
  );
  assert.equal(bipedApproach.at(-1).transform.translateX, targetX);
  assert.equal(quadrupedApproach.at(-1).transform.translateX, targetX);
});


test("massive gait v1 uses four equal heavy arcs with one footfall per landing", () => {
  const travelMs = 1600;
  const targetX = 320;
  const metadata = {
    targetTranslateX: targetX,
    targetTranslateY: 0,
    arenaHeight: 800,
    travelMs
  };

  const current = actor("massive");
  const plan = planAnimation({
    event: normalizeCombatVisualEvent({
      type: "ground-attack",
      actorId: current.id,
      targetId: "opponent-actor",
      metadata
    }),
    actor: current,
    profile: registry.get("massive")
  });

  const approach = plan.segments.filter(
    (segment) => segment.label !== "ground-home"
  );
  const airborne = approach.filter(
    (segment) => segment.transform.translateY < 0
  );
  const landings = approach.filter(
    (segment) => Math.abs(segment.transform.translateY) < 1e-9
  );

  assert.equal(airborne.length, 4);
  assert.equal(landings.length, 4);

  let previousX = 0;
  for (const landing of landings) {
    const stepDistance = landing.transform.translateX - previousX;
    assert.ok(
      Math.abs(stepDistance - targetX / 4) < 1e-9,
      `expected regular massive step of ${targetX / 4}px, got ${stepDistance}px`
    );
    previousX = landing.transform.translateX;
  }

  const massiveLift = Math.max(
    ...airborne.map((segment) => -segment.transform.translateY)
  );

  const quadrupedActor = actor("quadruped");
  const quadrupedPlan = planAnimation({
    event: normalizeCombatVisualEvent({
      type: "ground-attack",
      actorId: quadrupedActor.id,
      targetId: "opponent-actor",
      metadata
    }),
    actor: quadrupedActor,
    profile: registry.get("quadruped")
  });
  const quadrupedLift = Math.max(
    ...quadrupedPlan.segments
      .filter((segment) => segment.label !== "ground-home")
      .map((segment) => -segment.transform.translateY)
  );

  assert.ok(
    massiveLift > quadrupedLift,
    "massive arcs must be more pronounced than quadruped bounds"
  );

  const footfalls = (plan.cues ?? []).filter(
    (cue) => cue.type === "footfall"
  );
  assert.equal(footfalls.length, 4);
  assert.deepEqual(
    footfalls.map((cue) => cue.atMs),
    [400, 800, 1200, 1600]
  );

  assert.equal(
    approach.reduce((sum, segment) => sum + segment.durationMs, 0),
    travelMs
  );
  assert.equal(approach.at(-1).transform.translateX, targetX);
  assert.equal(approach.at(-1).transform.translateY, 0);
});
