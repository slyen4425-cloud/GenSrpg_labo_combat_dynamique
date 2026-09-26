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

test("projectile clash defaults to none and requires explicit editable data", () => {
  const skill = normalizeSkillDefinition(rawSkill());

  assert.deepEqual(skill.projectileClash, {
    mode: "none",
    group: null
  });
});

test("mutual projectile clash requires a group and projectile form", () => {
  assert.throws(
    () =>
      normalizeSkillDefinition(
        rawSkill({
          projectileClash: {
            mode: "mutual_cancel"
          }
        })
      ),
    /projectileClash\.group is required/
  );

  assert.throws(
    () =>
      normalizeSkillDefinition(
        rawSkill({
          form: "contact",
          projectileClash: {
            mode: "mutual_cancel",
            group: "test"
          }
        })
      ),
    /requires form=projectile/
  );

  assert.throws(
    () =>
      normalizeSkillDefinition(
        rawSkill({
          projectileClash: {
            mode: "destroy_everything",
            group: "test"
          }
        })
      ),
    /Unsupported projectileClash\.mode/
  );
});

test("same-group reciprocal projectiles compute their real meeting time", () => {
  const skill = normalizeSkillDefinition(
    rawSkill({
      projectileClash: {
        mode: "mutual_cancel",
        group: "fire-orb"
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

  const candidate = projectileClashCandidate({
    leftAction: left,
    leftStartedAtClockMs: 0,
    rightAction: right,
    rightStartedAtClockMs: 200
  });

  assert.ok(candidate);
  assert.equal(candidate.atClockMs, 1450);
  assert.ok(
    Math.abs(candidate.leftProgress - 450 / 700) < 1e-9
  );
  assert.ok(
    Math.abs(candidate.rightProgress - 250 / 700) < 1e-9
  );
  assert.ok(
    Math.abs(
      candidate.leftProgress +
        candidate.rightProgress -
        1
    ) < 1e-9
  );
});

test("different clash groups or disabled clash never collide", () => {
  const fire = normalizeSkillDefinition(
    rawSkill({
      id: "fire",
      projectileClash: {
        mode: "mutual_cancel",
        group: "fire-orb"
      }
    })
  );
  const ice = normalizeSkillDefinition(
    rawSkill({
      id: "ice",
      projectileClash: {
        mode: "mutual_cancel",
        group: "ice-orb"
      }
    })
  );
  const disabled = normalizeSkillDefinition(
    rawSkill({ id: "plain" })
  );

  const playerFire = action({
    skill: fire,
    actorId: "player",
    targetId: "opponent"
  });

  assert.equal(
    projectileClashCandidate({
      leftAction: playerFire,
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

  assert.equal(
    projectileClashCandidate({
      leftAction: playerFire,
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

test("projectiles cannot clash after one travel window has already ended", () => {
  const skill = normalizeSkillDefinition(
    rawSkill({
      projectileClash: {
        mode: "mutual_cancel",
        group: "fire-orb"
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

test("clash resolution is semantic and applies no hit or damage event", () => {
  const skill = normalizeSkillDefinition(
    rawSkill({
      projectileClash: {
        mode: "mutual_cancel",
        group: "fire-orb"
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
  const candidate = projectileClashCandidate({
    leftAction: left,
    leftStartedAtClockMs: 0,
    rightAction: right,
    rightStartedAtClockMs: 0
  });
  const state = Object.freeze({ marker: "unchanged" });

  const resolutions = resolveProjectileClash({
    state,
    leftAction: left,
    leftStartedAtClockMs: 0,
    rightAction: right,
    rightStartedAtClockMs: 0,
    candidate
  });

  for (const resolution of [
    resolutions.left,
    resolutions.right
  ]) {
    assert.equal(resolution.outcome, "clashed");
    assert.equal(resolution.state, state);
    assert.equal(
      resolution.events.some(
        (event) => event.type === "hit"
      ),
      false
    );
    assert.equal(
      resolution.events.some(
        (event) =>
          event.type === "skill-cancelled" &&
          event.reason === "projectile_clash"
      ),
      true
    );
  }
});
