import test from "node:test";
import assert from "node:assert/strict";

import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";
import {
  createCombatRuntime
} from "../../src/core/combat/combat-runtime.js";

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
  const contact = h.runtime.reportProjectileContact({
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

test("Combat Runtime rejects contact before release, wrong target and non-projectile actions", () => {
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
    const result = h.runtime.reportProjectileContact({
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
    const result = h.runtime.reportProjectileContact({
      actorId: "player",
      targetId: "player"
    });
    assert.equal(result.ok, false);
    assert.equal(result.outcome, "target_mismatch");
    assert.equal(h.completions.length, 0);
    h.runtime.dispose();
  }

  {
    const h = runtimeHarness(
      projectileAction({
        form: "contact"
      })
    );
    h.runtime.startSkill({
      actorId: "player",
      targetId: "opponent",
      skill: { id: "claw" }
    });
    h.setClock(100);
    const result = h.runtime.reportProjectileContact({
      actorId: "player",
      targetId: "opponent"
    });
    assert.equal(result.ok, false);
    assert.equal(result.outcome, "not_projectile");
    assert.equal(h.completions.length, 0);
    h.runtime.dispose();
  }
});
