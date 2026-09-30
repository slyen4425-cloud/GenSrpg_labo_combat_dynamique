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
    impactAtMs: releaseAtMs + travelMs,
    interruptibleDuringPreparation: true
  });
}

function clash(tag, againstTag, strength = 1) {
  return {
    tag,
    rules:
      againstTag == null
        ? []
        : [
            {
              againstTag,
              strength
            }
          ]
  };
}

test("projectile clash defaults to no tag and no inferred rule", () => {
  const skill =
    normalizeSkillDefinition(
      rawSkill()
    );

  assert.deepEqual(
    skill.projectileClash,
    {
      tag: null,
      rules: []
    }
  );
});

test("same-tag reciprocal projectiles compute their real meeting time", () => {
  const skill =
    normalizeSkillDefinition(
      rawSkill({
        projectileClash:
          clash(
            "fire",
            "fire",
            1
          )
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

test("different tags without an explicit directed rule never clash", () => {
  const fire =
    normalizeSkillDefinition(
      rawSkill({
        id: "fire",
        projectileClash:
          clash(
            "fire",
            null
          )
      })
    );
  const ice =
    normalizeSkillDefinition(
      rawSkill({
        id: "ice",
        element: "ice",
        projectileClash:
          clash(
            "ice",
            null
          )
      })
    );

  assert.equal(
    projectileClashCandidate({
      leftAction: action({
        skill: fire,
        actorId: "player",
        targetId: "opponent"
      }),
      leftStartedAtClockMs: 0,
      rightAction: action({
        skill: ice,
        actorId: "opponent",
        targetId: "player"
      }),
      rightStartedAtClockMs: 0
    }),
    null
  );
});

test("one directed rule can make its projectile survive the clash", () => {
  const ice =
    normalizeSkillDefinition(
      rawSkill({
        id: "ice",
        element: "ice",
        projectileClash:
          clash(
            "ice",
            "fire",
            2
          )
      })
    );
  const fire =
    normalizeSkillDefinition(
      rawSkill({
        id: "fire",
        projectileClash:
          clash(
            "fire",
            null
          )
      })
    );

  const candidate =
    projectileClashCandidate({
      leftAction: action({
        skill: ice,
        actorId: "player",
        targetId: "opponent"
      }),
      leftStartedAtClockMs: 0,
      rightAction: action({
        skill: fire,
        actorId: "opponent",
        targetId: "player"
      }),
      rightStartedAtClockMs: 0
    });

  assert.ok(candidate);
  assert.equal(
    candidate.leftStrength,
    2
  );
  assert.equal(
    candidate.rightStrength,
    0
  );
  assert.equal(
    candidate.outcome,
    "left_survives"
  );
});

test("projectiles cannot clash after one travel window has already ended", () => {
  const skill =
    normalizeSkillDefinition(
      rawSkill({
        projectileClash:
          clash(
            "fire",
            "fire",
            1
          )
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

test("mutual clash resolution applies no hit and cancels both", () => {
  const skill =
    normalizeSkillDefinition(
      rawSkill({
        projectileClash:
          clash(
            "fire",
            "fire",
            1
          )
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
