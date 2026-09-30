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

function skill({
  id,
  power = 0,
  damage = 10
}) {
  return normalizeSkillDefinition({
    id,
    name: id,
    category: "offensive",
    form: "projectile",
    element: null,
    approachMode: "none",
    energyCost: 1,
    preparationMs: 100,
    travelMs: 1000,
    recoveryMs: 100,
    allowedDistances: [
      "short",
      "medium",
      "long"
    ],
    effect: {
      damage
    },
    projectileClash: {
      power
    }
  });
}

function action(
  skillDefinition,
  actorId,
  targetId
) {
  return Object.freeze({
    actionType: "skill",
    actionId: skillDefinition.id,
    actorId,
    targetId,
    skill: skillDefinition,
    preparationMs:
      skillDefinition.preparationMs,
    travelMs:
      skillDefinition.travelMs,
    recoveryMs:
      skillDefinition.recoveryMs,
    releaseAtMs:
      skillDefinition.preparationMs,
    impactAtMs:
      skillDefinition.preparationMs +
      skillDefinition.travelMs,
    interruptibleDuringPreparation: true
  });
}

test("Projectile Clash canonical data is one power only", () => {
  const normalized = skill({
    id: "power-only",
    power: 3
  });

  assert.deepEqual(
    normalized.projectileClash,
    {
      power: 3
    }
  );
});

test("power zero opts out of projectile collision", () => {
  const left = skill({
    id: "left",
    power: 0
  });
  const right = skill({
    id: "right",
    power: 2
  });

  assert.equal(
    projectileClashCandidate({
      leftAction: action(
        left,
        "left",
        "right"
      ),
      leftStartedAtClockMs: 0,
      rightAction: action(
        right,
        "right",
        "left"
      ),
      rightStartedAtClockMs: 0
    }),
    null
  );
});

test("stronger projectile survives and equal power mutually cancels", () => {
  const strong = skill({
    id: "strong",
    power: 3
  });
  const weak = skill({
    id: "weak",
    power: 1
  });

  const candidate =
    projectileClashCandidate({
      leftAction: action(
        strong,
        "left",
        "right"
      ),
      leftStartedAtClockMs: 0,
      rightAction: action(
        weak,
        "right",
        "left"
      ),
      rightStartedAtClockMs: 0
    });

  assert.equal(
    candidate.leftPower,
    3
  );
  assert.equal(
    candidate.rightPower,
    1
  );
  assert.equal(
    candidate.outcome,
    "left_survives"
  );

  const resolved =
    resolveProjectileClash({
      state: Object.freeze({}),
      leftAction: action(
        strong,
        "left",
        "right"
      ),
      leftStartedAtClockMs: 0,
      rightAction: action(
        weak,
        "right",
        "left"
      ),
      rightStartedAtClockMs: 0,
      candidate
    });

  assert.equal(
    resolved.left,
    null
  );
  assert.equal(
    resolved.right.outcome,
    "clashed"
  );

  const equal = skill({
    id: "equal",
    power: 3
  });
  const equalCandidate =
    projectileClashCandidate({
      leftAction: action(
        strong,
        "left",
        "right"
      ),
      leftStartedAtClockMs: 0,
      rightAction: action(
        equal,
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

test("Human Editor exposes only projectile power for clash configuration", async () => {
  const [html, ui] =
    await Promise.all([
      readFile(
        new URL(
          "../../examples/dom-demo/capture-editor-v2.html",
          import.meta.url
        ),
        "utf8"
      ),
      readFile(
        new URL(
          "../../src/ui/capture-editor-human-v2.js",
          import.meta.url
        ),
        "utf8"
      )
    ]);

  assert.equal(
    html.includes(
      "data-skill-projectile-power"
    ),
    true
  );

  for (const removed of [
    "data-skill-projectile-clash-tag",
    "data-skill-projectile-clash-rules",
    "data-skill-projectile-clash-add",
    "data-skill-projectile-clash-against-tag",
    "data-skill-projectile-clash-strength",
    "againstTag",
    "projectileClash.rules",
    "projectileClash.tag"
  ]) {
    assert.equal(
      html.includes(removed) ||
      ui.includes(removed),
      false,
      removed + " must be removed"
    );
  }
});

test("Projectile Clash contract contains no tag or directed-rule authority", async () => {
  const source = await readFile(
    new URL(
      "../../src/contracts/projectile-clash-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const removed of [
    "againstTag",
    "strength",
    "rules",
    "tag"
  ]) {
    assert.equal(
      source.includes(removed),
      false,
      removed + " must not remain in contract"
    );
  }

  assert.match(
    source,
    /power/
  );
});
