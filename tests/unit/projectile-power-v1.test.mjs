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
      "../../src/contracts/projectile-power-v1.js",
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


test("real CombatRuntime keeps the stronger projectile active until target impact", () => {
  let clock = 0;
  let scheduled = null;
  const resolutions = [];

  const session = createCombatSession({
    fighters: [
      {
        id: "strong-actor",
        maxHp: 100,
        maxEnergy: 10,
        initialEnergy: 10
      },
      {
        id: "weak-actor",
        maxHp: 100,
        maxEnergy: 10,
        initialEnergy: 10
      }
    ]
  });

  const strong = skill({
    id: "strong-runtime",
    power: 2,
    damage: 20
  });
  const weak = skill({
    id: "weak-runtime",
    power: 1,
    damage: 15
  });

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
      actorId: "strong-actor",
      targetId: "weak-actor",
      skill: strong
    }).ok,
    true
  );
  assert.equal(
    runtime.startSkill({
      actorId: "weak-actor",
      targetId: "strong-actor",
      skill: weak
    }).ok,
    true
  );

  clock = 600;
  scheduled();

  assert.equal(
    runtime.hasActiveActionFor(
      "strong-actor"
    ),
    true
  );
  assert.equal(
    runtime.hasActiveActionFor(
      "weak-actor"
    ),
    false
  );
  assert.equal(
    session.snapshot().fighters[
      "weak-actor"
    ].hp,
    100
  );

  clock = 1100;
  scheduled();

  assert.equal(
    runtime.hasActiveActionFor(
      "strong-actor"
    ),
    false
  );
  assert.equal(
    session.snapshot().fighters[
      "weak-actor"
    ].hp,
    80
  );
  assert.equal(
    resolutions.some(
      (resolution) =>
        resolution.actorId ===
          "strong-actor" &&
        resolution.outcome === "hit"
    ),
    true
  );

  runtime.dispose();
});

test("Projectile Power owner stays independent from UI renderer storage and network", async () => {
  const sources = await Promise.all(
    [
      "../../src/contracts/projectile-power-v1.js",
      "../../src/core/combat/projectile-clash.js"
    ].map((relative) =>
      readFile(
        new URL(
          relative,
          import.meta.url
        ),
        "utf8"
      )
    )
  );

  for (const source of sources) {
    for (const forbidden of [
      "document.",
      "window.",
      "localStorage",
      "sessionStorage",
      "MutationObserver",
      "fetch(",
      "adapters/renderer",
      "src/ui/"
    ]) {
      assert.equal(
        source.includes(forbidden),
        false,
        "Projectile Power owner must not depend on " +
          forbidden
      );
    }
  }
});

test("non-projectile skill cannot own positive projectile power", () => {
  assert.throws(
    () =>
      normalizeSkillDefinition({
        id: "contact-power",
        name: "Contact",
        category: "offensive",
        form: "contact",
        element: null,
        approachMode: "none",
        energyCost: 1,
        preparationMs: 100,
        travelMs: 100,
        recoveryMs: 100,
        allowedDistances: ["short"],
        effect: {
          damage: 1
        },
        projectileClash: {
          power: 1
        }
      }),
    /requires form=projectile/i
  );
});
