import test from "node:test";
import assert from "node:assert/strict";

import {
  planSkillOutcomeFx
} from "../../src/core/fx/skill-fx-plan.js";
import {
  createCombatResolutionPresenter
} from "../../src/adapters/renderer/combat-resolution-presenter.js";

function pureZoneResolution() {
  return {
    ok: true,
    actionType: "skill",
    actorId: "player",
    targetId: "opponent",
    skillId: "cap_fire_atk_6",
    outcome: "hit",
    events: [
      {
        type: "skill-release",
        atMs: 2000,
        actorId: "player",
        targetId: "opponent",
        skillId: "cap_fire_atk_6",
        form: "beam",
        element: "fire"
      },
      {
        type: "skill-arrive",
        atMs: 2000,
        actorId: "player",
        targetId: "opponent",
        skillId: "cap_fire_atk_6",
        outcome: "hit",
        form: "beam"
      },
      {
        type: "hit",
        atMs: 2000,
        actorId: "opponent",
        sourceActorId: "player",
        skillId: "cap_fire_atk_6",
        baseDamage: 0,
        damage: 0,
        absorbedByShield: 0,
        appliedDamage: 0,
        hpBefore: 100,
        hpAfter: 100
      }
    ]
  };
}

function presenterHarness() {
  const visualCalls = [];
  const fxCalls = [];

  const presenter =
    createCombatResolutionPresenter({
      visuals: {
        playEventFor(slot, event) {
          visualCalls.push([slot, event]);
          return Promise.resolve({
            status: "finished"
          });
        },
        cancelFor() {}
      },
      fx: {
        play(plan) {
          fxCalls.push(plan);
          return {
            status: "running",
            finished: Promise.resolve({
              status: "finished"
            })
          };
        }
      }
    });

  return {
    presenter,
    visualCalls,
    fxCalls
  };
}

test("pure persistent-zone activation does not fabricate a target impact FX", () => {
  assert.deepEqual(
    planSkillOutcomeFx({
      resolution: pureZoneResolution(),
      actorSlot: "player",
      targetSlot: "opponent"
    }),
    []
  );
});

test("pure persistent-zone activation does not fabricate target recoil", async () => {
  const h = presenterHarness();

  const result = h.presenter.presentOutcome({
    resolution: pureZoneResolution(),
    actorSlot: "player",
    targetSlot: "opponent"
  });

  await result.finished;

  assert.deepEqual(h.fxCalls, []);
  assert.deepEqual(
    h.visualCalls,
    [],
    "zone activation must not pretend the target was directly struck"
  );

  h.presenter.dispose();
});

test("real direct damage still keeps impact FX and target hit reaction", async () => {
  const resolution = pureZoneResolution();
  resolution.events[2] = {
    ...resolution.events[2],
    baseDamage: 20,
    damage: 20,
    appliedDamage: 20,
    hpAfter: 80
  };

  const plans = planSkillOutcomeFx({
    resolution,
    actorSlot: "player",
    targetSlot: "opponent"
  });
  assert.equal(plans.length, 1);
  assert.equal(plans[0].type, "impact");

  const h = presenterHarness();
  const result = h.presenter.presentOutcome({
    resolution,
    actorSlot: "player",
    targetSlot: "opponent"
  });
  await result.finished;

  assert.equal(
    h.fxCalls.some(
      (plan) => plan.type === "impact"
    ),
    true
  );
  assert.deepEqual(
    h.visualCalls,
    [["opponent", "hit"]]
  );

  h.presenter.dispose();
});

test("immediate status application keeps target impact presentation even with zero direct damage", async () => {
  const resolution = pureZoneResolution();
  resolution.skillId = "cendre-test";
  resolution.events.push({
    type: "status-applied",
    atMs: 2000,
    actorId: "opponent",
    sourceActorId: "player",
    skillId: "cendre-test",
    statusId: "slow"
  });

  const plans = planSkillOutcomeFx({
    resolution,
    actorSlot: "player",
    targetSlot: "opponent"
  });
  assert.equal(plans.length, 1);
  assert.equal(plans[0].type, "impact");

  const h = presenterHarness();
  const result = h.presenter.presentOutcome({
    resolution,
    actorSlot: "player",
    targetSlot: "opponent"
  });
  await result.finished;

  assert.deepEqual(
    h.visualCalls,
    [["opponent", "hit"]]
  );

  h.presenter.dispose();
});
