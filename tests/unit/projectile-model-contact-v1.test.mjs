import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";
import {
  createCombatRuntime
} from "../../src/core/combat/combat-runtime.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";
import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";

const SOLID_MASK = Object.freeze({
  width: 4,
  height: 4,
  opaque: new Uint8Array(16).fill(1)
});

function collisionFrame(rectangle) {
  return Object.freeze({
    mask: SOLID_MASK,
    origin: Object.freeze({
      x: rectangle.left,
      y: rectangle.top
    }),
    axisX: Object.freeze({
      x: rectangle.left + rectangle.width,
      y: rectangle.top
    }),
    axisY: Object.freeze({
      x: rectangle.left,
      y: rectangle.top + rectangle.height
    })
  });
}

function projectileContactHarness() {
  let frameCallback = null;
  const contacts = [];
  let removed = false;
  let cancelled = false;

  const projectileNode = {
    className: "",
    dataset: {},
    style: {},
    getBoundingClientRect() {
      return {
        left: 145,
        top: 95,
        width: 10,
        height: 10
      };
    },
    remove() {
      removed = true;
    }
  };

  const arena = {
    ownerDocument: {
      createElement() {
        return projectileNode;
      }
    },
    append() {},
    getBoundingClientRect() {
      return {
        left: 0,
        top: 0,
        width: 400,
        height: 300
      };
    }
  };

  const anchors = {
    player: {
      getBoundingClientRect() {
        return {
          left: 40,
          top: 220,
          width: 40,
          height: 40
        };
      }
    },
    opponent: {
      getBoundingClientRect() {
        return {
          left: 130,
          top: 80,
          width: 50,
          height: 50
        };
      }
    }
  };

  const targetAnchors = {
    player: anchors.player,
    opponent: {
      getBoundingClientRect() {
        return {
          left: 300,
          top: 120,
          width: 40,
          height: 40
        };
      }
    }
  };

  const renderer = createDomSkillFxRenderer({
    arena,
    anchors,
    targetAnchors,
    animate() {
      return {
        finished: new Promise(() => {}),
        cancel() {
          cancelled = true;
        }
      };
    },
    requestFrame(callback) {
      frameCallback = callback;
      return 1;
    },
    cancelFrame() {},
    onProjectileContact(contact) {
      contacts.push(contact);
    },
    targetCollisionModelFor() {
      return {
        snapshot() {
          return collisionFrame(
            anchors.opponent.getBoundingClientRect()
          );
        }
      };
    }
  });

  renderer.play({
    type: "projectile",
    skillId: "fireball",
    element: "fire",
    fromSlot: "player",
    targetSlot: "opponent",
    durationMs: 700
  });

  return {
    renderer,
    contacts,
    get frameCallback() {
      return frameCallback;
    },
    get removed() {
      return removed;
    },
    get cancelled() {
      return cancelled;
    }
  };
}

test("renderer reports live model contact once without resolving or removing the projectile itself", () => {
  const h = projectileContactHarness();

  assert.equal(typeof h.frameCallback, "function");
  h.frameCallback();

  assert.deepEqual(h.contacts, [
    {
      actorId: "player",
      targetId: "opponent",
      skillId: "fireball"
    }
  ]);
  assert.equal(h.renderer.activeCount, 1);
  assert.equal(h.removed, false);
  assert.equal(h.cancelled, false);

  if (typeof h.frameCallback === "function") {
    h.frameCallback();
  }
  assert.equal(h.contacts.length, 1);
});

function runtimeHarness(action) {
  let clock = 0;
  const completions = [];
  const resolutions = [];
  const releases = [];

  const state = {
    distance: "medium",
    fighters: {
      player: {
        id: "player",
        hp: 100,
        maxHp: 100,
        energy: 10,
        chargeTimeEffects: []
      },
      opponent: {
        id: "opponent",
        hp: 100,
        maxHp: 100,
        energy: 10,
        chargeTimeEffects: []
      }
    }
  };

  const session = {
    advanceMs() {},
    snapshot() {
      return state;
    },
    startSkill() {
      return Object.freeze({
        ok: true,
        outcome: "started",
        action
      });
    },
    completeAction(input) {
      completions.push(input);
      return Object.freeze({
        ok: true,
        actionType: "skill",
        actorId: input.action.actorId,
        targetId: input.action.targetId,
        skillId: input.action.skill.id,
        outcome: "hit",
        state,
        events: Object.freeze([
          Object.freeze({
            type: "skill-release",
            form: input.action.skill.form,
            atMs: input.action.releaseAtMs
          }),
          Object.freeze({
            type: "skill-arrive",
            atMs: input.action.impactAtMs
          })
        ])
      });
    }
  };

  const runtime = createCombatRuntime({
    session,
    now() {
      return clock;
    },
    onRelease(payload) {
      releases.push(payload);
    },
    onResolved(resolution) {
      resolutions.push(resolution);
    }
  });

  return {
    runtime,
    completions,
    resolutions,
    releases,
    setClock(value) {
      clock = value;
    }
  };
}

function projectileAction({
  releaseAtMs = 0,
  impactAtMs = 700,
  form = "projectile",
  targetId = "opponent"
} = {}) {
  return Object.freeze({
    actionType: "skill",
    actionId: "fireball",
    actorId: "player",
    targetId,
    skill: Object.freeze({
      id: "fireball",
      name: "Boule de feu",
      form
    }),
    preparationMs: releaseAtMs,
    travelMs: impactAtMs - releaseAtMs,
    recoveryMs: 300,
    releaseAtMs,
    impactAtMs,
    interruptibleDuringPreparation: true
  });
}

test("Combat Runtime is the only authority that accepts model contact and resolves at the accepted contact time", () => {
  const h = runtimeHarness(projectileAction());

  assert.equal(
    h.runtime.startSkill({
      actorId: "player",
      targetId: "opponent",
      skill: { id: "fireball" }
    }).ok,
    true
  );
  assert.equal(h.releases.length, 1);

  h.setClock(260);
  const contact = h.runtime.reportActionContact({
    actorId: "player",
    targetId: "opponent"
  });

  assert.equal(contact.ok, true);
  assert.equal(contact.outcome, "contact_resolved");
  assert.equal(contact.impactAtMs, 260);
  assert.equal(h.completions.length, 1);
  assert.equal(h.completions[0].action.impactAtMs, 260);
  assert.equal(h.completions[0].action.travelMs, 260);
  assert.equal(h.resolutions.length, 1);
  assert.equal(h.resolutions[0].events.at(-1).atMs, 260);
  assert.equal(h.runtime.hasActiveActionFor("player"), false);

  h.runtime.dispose();
});

test("Combat Runtime rejects contact before release and wrong target", () => {
  {
    const h = runtimeHarness(
      projectileAction({
        releaseAtMs: 200,
        impactAtMs: 700
      })
    );
    h.runtime.startSkill({
      actorId: "player",
      targetId: "opponent",
      skill: { id: "fireball" }
    });
    h.setClock(100);
    const result = h.runtime.reportActionContact({
      actorId: "player",
      targetId: "opponent"
    });
    assert.equal(result.ok, false);
    assert.equal(result.outcome, "not_released");
    assert.equal(h.completions.length, 0);
    h.runtime.dispose();
  }

  {
    const h = runtimeHarness(projectileAction());
    h.runtime.startSkill({
      actorId: "player",
      targetId: "opponent",
      skill: { id: "fireball" }
    });
    h.setClock(100);
    const result = h.runtime.reportActionContact({
      actorId: "player",
      targetId: "player"
    });
    assert.equal(result.ok, false);
    assert.equal(result.outcome, "target_mismatch");
    assert.equal(h.completions.length, 0);
    h.runtime.dispose();
  }

});


test("both combat composition roots route projectile model contact to the generic Combat Runtime contact authority", async () => {
  const [duelSource, coopSource] = await Promise.all([
    readFile(
      new URL(
        "../../src/ui/combat-test-ui.js",
        import.meta.url
      ),
      "utf8"
    ),
    readFile(
      new URL(
        "../../src/ui/combat-2v2-test-ui.js",
        import.meta.url
      ),
      "utf8"
    )
  ]);

  for (const source of [duelSource, coopSource]) {
    assert.match(
      source,
      /onProjectileContact\(contact\)[\s\S]{0,120}runtime\?\.reportActionContact\(contact\)/
    );
    assert.doesNotMatch(
      source,
      /onProjectileContact\(contact\)[\s\S]{0,220}(damage|hp\s*=|presentOutcome\()/
    );
  }
});


test("accepted model contact applies real Combat Session damage at the same effective impact timestamp", async () => {
  const rawFireball = JSON.parse(
    await readFile(
      new URL(
        "../../data/combat/skills/fireball.skill.json",
        import.meta.url
      ),
      "utf8"
    )
  );
  const fireball = normalizeSkillDefinition(rawFireball);

  const fighter = (id) => ({
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 10,
    initialEnergy: 10,
    energyChargeAmount: 0,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 1,
    chargeTimeModifierPct: 0
  });

  const session = createCombatSession({
    distance: "medium",
    fighters: [
      fighter("player"),
      fighter("opponent")
    ]
  });

  let clock = 0;
  let scheduled = null;
  let timerSequence = 0;
  const releases = [];
  const resolutions = [];

  const runtime = createCombatRuntime({
    session,
    tickMs: 50,
    now() {
      return clock;
    },
    setTimer(callback) {
      scheduled = callback;
      timerSequence += 1;
      return timerSequence;
    },
    clearTimer() {
      scheduled = null;
    },
    onRelease(payload) {
      releases.push(payload);
    },
    onResolved(resolution) {
      resolutions.push(resolution);
    }
  });

  function advanceTo(nextClock) {
    clock = nextClock;
    const callback = scheduled;
    scheduled = null;
    assert.equal(typeof callback, "function");
    callback();
  }

  runtime.start();
  assert.equal(
    runtime.startSkill({
      actorId: "player",
      targetId: "opponent",
      skill: fireball
    }).ok,
    true
  );

  advanceTo(fireball.preparationMs);

  assert.equal(releases.length, 1);
  assert.equal(
    session.snapshot().fighters.opponent.hp,
    100,
    "release must not apply damage"
  );

  const earlyContactAt =
    fireball.preparationMs +
    Math.max(1, Math.floor(fireball.travelMs / 3));
  advanceTo(earlyContactAt);

  assert.equal(
    session.snapshot().fighters.opponent.hp,
    100,
    "travel before contact must not apply damage"
  );

  const result = runtime.reportActionContact({
    actorId: "player",
    targetId: "opponent"
  });

  assert.equal(result.ok, true);
  assert.equal(result.impactAtMs, earlyContactAt);
  assert.equal(resolutions.length, 1);
  assert.ok(
    session.snapshot().fighters.opponent.hp < 100,
    "accepted contact must apply real damage immediately"
  );

  const arrive = resolutions[0].events.find(
    (event) => event.type === "skill-arrive"
  );
  const hit = resolutions[0].events.find(
    (event) => event.type === "hit"
  );

  assert.equal(arrive?.atMs, earlyContactAt);
  assert.equal(hit?.atMs, earlyContactAt);
  assert.equal(
    result.resolution.events.find(
      (event) => event.type === "skill-arrive"
    )?.atMs,
    earlyContactAt
  );

  runtime.dispose();
});
