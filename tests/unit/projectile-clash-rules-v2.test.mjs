import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  projectileClashCandidate,
  resolveProjectileClash
} from "../../src/core/combat/projectile-clash.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";
import {
  createCombatRuntime
} from "../../src/core/combat/combat-runtime.js";

function rawSkill({
  id = "projectile",
  form = "projectile",
  element = "fire",
  projectileClash = undefined,
  damage = 10
} = {}) {
  return {
    id,
    name: id,
    category: "offensive",
    form,
    element,
    approachMode: "none",
    energyCost: 1,
    preparationMs: 100,
    travelMs: 1000,
    recoveryMs: 100,
    cooldownMs: 0,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    effect: { damage },
    ...(projectileClash === undefined
      ? {}
      : { projectileClash })
  };
}

function action(skill, actorId, targetId) {
  return Object.freeze({
    actionType: "skill",
    actionId: skill.id,
    actorId,
    targetId,
    skill,
    preparationMs: skill.preparationMs,
    travelMs: skill.travelMs,
    recoveryMs: skill.recoveryMs,
    releaseAtMs: skill.preparationMs,
    impactAtMs:
      skill.preparationMs + skill.travelMs,
    interruptibleDuringPreparation: true
  });
}

test("Projectile Clash V2 normalizes one tag with multiple directed rules", () => {
  const skill = normalizeSkillDefinition(
    rawSkill({
      id: "ice",
      projectileClash: {
        tag: "ice",
        rules: [
          { againstTag: "fire", strength: 2 },
          { againstTag: "shadow", strength: 3 }
        ]
      }
    })
  );

  assert.deepEqual(skill.projectileClash, {
    tag: "ice",
    rules: [
      { againstTag: "fire", strength: 2 },
      { againstTag: "shadow", strength: 3 }
    ]
  });
});

test("Projectile Clash V2 rejects duplicate opponent tags and non-projectile ownership", () => {
  assert.throws(
    () =>
      normalizeSkillDefinition(
        rawSkill({
          projectileClash: {
            tag: "ice",
            rules: [
              { againstTag: "fire", strength: 2 },
              { againstTag: "fire", strength: 3 }
            ]
          }
        })
      ),
    /duplicate|againstTag/i
  );

  assert.throws(
    () =>
      normalizeSkillDefinition(
        rawSkill({
          form: "contact",
          projectileClash: {
            tag: "ice",
            rules: [
              { againstTag: "fire", strength: 2 }
            ]
          }
        })
      ),
    /projectile/i
  );
});

test("Projectile Clash V2 never infers rules from element name or description", () => {
  const skill = normalizeSkillDefinition(
    rawSkill({
      id: "Glace qui bat le feu",
      element: "ice"
    })
  );

  assert.deepEqual(skill.projectileClash, {
    tag: null,
    rules: []
  });
});

test("stronger projectile wins while equal strength mutually cancels", () => {
  const ice = normalizeSkillDefinition(
    rawSkill({
      id: "ice",
      element: "ice",
      projectileClash: {
        tag: "ice",
        rules: [
          { againstTag: "fire", strength: 2 }
        ]
      }
    })
  );
  const fire = normalizeSkillDefinition(
    rawSkill({
      id: "fire",
      projectileClash: {
        tag: "fire",
        rules: [
          { againstTag: "ice", strength: 1 }
        ]
      }
    })
  );

  const candidate = projectileClashCandidate({
    leftAction: action(ice, "left", "right"),
    leftStartedAtClockMs: 0,
    rightAction: action(fire, "right", "left"),
    rightStartedAtClockMs: 0
  });

  assert.ok(candidate);
  assert.equal(candidate.leftStrength, 2);
  assert.equal(candidate.rightStrength, 1);
  assert.equal(candidate.outcome, "left_survives");

  const resolved = resolveProjectileClash({
    state: Object.freeze({ marker: "same" }),
    leftAction: action(ice, "left", "right"),
    leftStartedAtClockMs: 0,
    rightAction: action(fire, "right", "left"),
    rightStartedAtClockMs: 0,
    candidate
  });

  assert.equal(resolved.left, null);
  assert.equal(
    resolved.right.outcome,
    "clashed"
  );

  const equalFire = normalizeSkillDefinition(
    rawSkill({
      id: "equal-fire",
      projectileClash: {
        tag: "fire",
        rules: [
          { againstTag: "ice", strength: 2 }
        ]
      }
    })
  );
  const equalCandidate =
    projectileClashCandidate({
      leftAction: action(
        ice,
        "left",
        "right"
      ),
      leftStartedAtClockMs: 0,
      rightAction: action(
        equalFire,
        "right",
        "left"
      ),
      rightStartedAtClockMs: 0
    });

  assert.equal(
    equalCandidate.outcome,
    "mutual_cancel"
  );
});

test("one directed rule is sufficient and no rules on either side means no clash", () => {
  const ice = normalizeSkillDefinition(
    rawSkill({
      id: "ice",
      projectileClash: {
        tag: "ice",
        rules: [
          { againstTag: "fire", strength: 2 }
        ]
      }
    })
  );
  const fireNoRule = normalizeSkillDefinition(
    rawSkill({
      id: "fire",
      projectileClash: {
        tag: "fire",
        rules: []
      }
    })
  );

  const oneSided = projectileClashCandidate({
    leftAction: action(ice, "left", "right"),
    leftStartedAtClockMs: 0,
    rightAction: action(
      fireNoRule,
      "right",
      "left"
    ),
    rightStartedAtClockMs: 0
  });

  assert.equal(oneSided.outcome, "left_survives");
  assert.equal(oneSided.rightStrength, 0);

  const neutralA = normalizeSkillDefinition(
    rawSkill({
      id: "a",
      projectileClash: {
        tag: "a",
        rules: []
      }
    })
  );
  const neutralB = normalizeSkillDefinition(
    rawSkill({
      id: "b",
      projectileClash: {
        tag: "b",
        rules: []
      }
    })
  );

  assert.equal(
    projectileClashCandidate({
      leftAction: action(
        neutralA,
        "left",
        "right"
      ),
      leftStartedAtClockMs: 0,
      rightAction: action(
        neutralB,
        "right",
        "left"
      ),
      rightStartedAtClockMs: 0
    }),
    null
  );
});

test("Human Editor exposes tag plus multiple clash rules and no V1 authority", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );
  const ui = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const marker of [
    "data-skill-projectile-clash-tag",
    "data-skill-projectile-clash-rules",
    "data-skill-projectile-clash-add",
    "data-skill-projectile-clash-against-tag",
    "data-skill-projectile-clash-strength"
  ]) {
    assert.equal(
      html.includes(marker) ||
      ui.includes(marker),
      true,
      marker + " must exist"
    );
  }

  for (const legacy of [
    "data-skill-clash-group",
    "projectileClash.mode",
    "projectileClash.group",
    "projectileClash.interactsWith",
    "data-skill-interrupts"
  ]) {
    assert.equal(
      html.includes(legacy) ||
      ui.includes(legacy),
      false,
      legacy + " must not remain an active editor authority"
    );
  }
});


test("real CombatRuntime keeps the stronger projectile active until its later target impact", () => {
  let clock = 0;
  let scheduled = null;
  const resolutions = [];

  const session = createCombatSession({
    fighters: [
      {
        id: "ice-actor",
        maxHp: 100,
        maxEnergy: 10,
        initialEnergy: 10
      },
      {
        id: "fire-actor",
        maxHp: 100,
        maxEnergy: 10,
        initialEnergy: 10
      }
    ]
  });

  const ice = normalizeSkillDefinition(
    rawSkill({
      id: "ice-runtime",
      element: "ice",
      damage: 20,
      projectileClash: {
        tag: "ice",
        rules: [
          {
            againstTag: "fire",
            strength: 2
          }
        ]
      }
    })
  );
  const fire = normalizeSkillDefinition(
    rawSkill({
      id: "fire-runtime",
      damage: 15,
      projectileClash: {
        tag: "fire",
        rules: [
          {
            againstTag: "ice",
            strength: 1
          }
        ]
      }
    })
  );

  const runtime = createCombatRuntime({
    session,
    tickMs: 10,
    now: () => clock,
    setTimer(callback) {
      scheduled = callback;
      return 1;
    },
    clearTimer() {},
    onResolved(resolution) {
      resolutions.push(resolution);
    }
  });

  runtime.start();

  assert.equal(
    runtime.startSkill({
      actorId: "ice-actor",
      targetId: "fire-actor",
      skill: ice
    }).ok,
    true
  );
  assert.equal(
    runtime.startSkill({
      actorId: "fire-actor",
      targetId: "ice-actor",
      skill: fire
    }).ok,
    true
  );

  clock = 600;
  scheduled();

  assert.equal(
    runtime.hasActiveActionFor(
      "ice-actor"
    ),
    true,
    "stronger projectile must continue"
  );
  assert.equal(
    runtime.hasActiveActionFor(
      "fire-actor"
    ),
    false,
    "weaker projectile must be cancelled"
  );
  assert.equal(
    session.snapshot().fighters[
      "fire-actor"
    ].hp,
    100,
    "winner has not reached its target at clash time"
  );

  clock = 1100;
  scheduled();

  assert.equal(
    runtime.hasActiveActionFor(
      "ice-actor"
    ),
    false
  );
  assert.equal(
    session.snapshot().fighters[
      "fire-actor"
    ].hp,
    80,
    "surviving projectile must resolve its original hit"
  );
  assert.equal(
    resolutions.some(
      (resolution) =>
        resolution.actorId ===
          "ice-actor" &&
        resolution.outcome === "hit"
    ),
    true
  );

  runtime.dispose();
});
