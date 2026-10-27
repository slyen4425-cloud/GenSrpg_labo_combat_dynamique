import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  projectileClashCandidate,
  resolveProjectileClash
} from "../../src/core/combat/projectile-clash.js";

function rawSkill(overrides = {}) {
  return {
    id: "test-projectile",
    name: "Test projectile",
    category: "offensive",
    form: "projectile",
    element: "fire",
    energyCost: 1,
    preparationMs: 1000,
    travelMs: 700,
    recoveryMs: 300,
    allowedDistances: ["medium"],
    effect: { damage: 10 },
    approachMode: "none",
    ...overrides
  };
}

function action({
  skill,
  actorId,
  targetId,
  releaseAtMs = skill.preparationMs,
  travelMs = skill.travelMs
}) {
  return Object.freeze({
    actionType: "skill",
    actionId: skill.id,
    actorId,
    targetId,
    skill,
    preparationMs: releaseAtMs,
    travelMs,
    recoveryMs: skill.recoveryMs,
    releaseAtMs,
    impactAtMs:
      releaseAtMs + travelMs,
    interruptibleDuringPreparation: true
  });
}

test("projectile clash defaults to power zero", () => {
  const skill =
    normalizeSkillDefinition(
      rawSkill()
    );

  assert.deepEqual(
    skill.projectileClash,
    {
      power: 0
    }
  );
});

test("equal positive powers compute their real meeting time", () => {
  const skill =
    normalizeSkillDefinition(
      rawSkill({
        projectileClash: {
          power: 1
        }
      })
    );

  const left = action({
    skill,
    actorId: "player",
    targetId: "opponent"
  });
  const right = action({
    skill,
    actorId: "opponent",
    targetId: "player"
  });

  const candidate =
    projectileClashCandidate({
      leftAction: left,
      leftStartedAtClockMs: 0,
      rightAction: right,
      rightStartedAtClockMs: 200
    });

  assert.ok(candidate);
  assert.equal(
    candidate.atClockMs,
    1450
  );
  assert.equal(
    candidate.outcome,
    "mutual_cancel"
  );
  assert.equal(
    candidate.leftPower,
    1
  );
  assert.equal(
    candidate.rightPower,
    1
  );
  assert.ok(
    Math.abs(
      candidate.leftProgress -
        450 / 700
    ) <
      1e-9
  );
  assert.ok(
    Math.abs(
      candidate.rightProgress -
        250 / 700
    ) <
      1e-9
  );
});

test("power zero means no projectile collision", () => {
  const active =
    normalizeSkillDefinition(
      rawSkill({
        id: "active",
        projectileClash: {
          power: 1
        }
      })
    );
  const disabled =
    normalizeSkillDefinition(
      rawSkill({
        id: "disabled",
        projectileClash: {
          power: 0
        }
      })
    );

  assert.equal(
    projectileClashCandidate({
      leftAction: action({
        skill: active,
        actorId: "player",
        targetId: "opponent"
      }),
      leftStartedAtClockMs: 0,
      rightAction: action({
        skill: disabled,
        actorId: "opponent",
        targetId: "player"
      }),
      rightStartedAtClockMs: 0
    }),
    null
  );
});

test("stronger projectile survives", () => {
  const strong =
    normalizeSkillDefinition(
      rawSkill({
        id: "strong",
        projectileClash: {
          power: 2
        }
      })
    );
  const weak =
    normalizeSkillDefinition(
      rawSkill({
        id: "weak",
        projectileClash: {
          power: 1
        }
      })
    );

  const candidate =
    projectileClashCandidate({
      leftAction: action({
        skill: strong,
        actorId: "player",
        targetId: "opponent"
      }),
      leftStartedAtClockMs: 0,
      rightAction: action({
        skill: weak,
        actorId: "opponent",
        targetId: "player"
      }),
      rightStartedAtClockMs: 0
    });

  assert.ok(candidate);
  assert.equal(
    candidate.outcome,
    "left_survives"
  );

  const resolutions =
    resolveProjectileClash({
      state: Object.freeze({
        marker: "unchanged"
      }),
      leftAction: action({
        skill: strong,
        actorId: "player",
        targetId: "opponent"
      }),
      leftStartedAtClockMs: 0,
      rightAction: action({
        skill: weak,
        actorId: "opponent",
        targetId: "player"
      }),
      rightStartedAtClockMs: 0,
      candidate
    });

  assert.equal(
    resolutions.left,
    null
  );
  assert.equal(
    resolutions.right.outcome,
    "clashed"
  );
});

test("projectiles cannot clash after one travel window has ended", () => {
  const skill =
    normalizeSkillDefinition(
      rawSkill({
        projectileClash: {
          power: 1
        }
      })
    );

  assert.equal(
    projectileClashCandidate({
      leftAction: action({
        skill,
        actorId: "player",
        targetId: "opponent"
      }),
      leftStartedAtClockMs: 0,
      rightAction: action({
        skill,
        actorId: "opponent",
        targetId: "player"
      }),
      rightStartedAtClockMs: 800
    }),
    null
  );
});

test("mutual clash applies no hit and cancels both", () => {
  const skill =
    normalizeSkillDefinition(
      rawSkill({
        projectileClash: {
          power: 1
        }
      })
    );
  const left = action({
    skill,
    actorId: "player",
    targetId: "opponent"
  });
  const right = action({
    skill,
    actorId: "opponent",
    targetId: "player"
  });
  const candidate =
    projectileClashCandidate({
      leftAction: left,
      leftStartedAtClockMs: 0,
      rightAction: right,
      rightStartedAtClockMs: 0
    });
  const state =
    Object.freeze({
      marker: "unchanged"
    });

  const resolutions =
    resolveProjectileClash({
      state,
      leftAction: left,
      leftStartedAtClockMs: 0,
      rightAction: right,
      rightStartedAtClockMs: 0,
      candidate
    });

  assert.equal(
    resolutions.outcome,
    "mutual_cancel"
  );

  for (
    const resolution of [
      resolutions.left,
      resolutions.right
    ]
  ) {
    assert.equal(
      resolution.outcome,
      "clashed"
    );
    assert.equal(
      resolution.state,
      state
    );
    assert.equal(
      resolution.events.some(
        (event) =>
          event.type === "hit"
      ),
      false
    );
    assert.equal(
      resolution.events.some(
        (event) =>
          event.type ===
            "skill-cancelled" &&
          event.reason ===
            "projectile_clash"
      ),
      true
    );
  }
});
