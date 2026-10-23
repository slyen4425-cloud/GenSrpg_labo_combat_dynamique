import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";

function fighter(id) {
  return {
    id, maxHp: 100, initialHp: 100, maxEnergy: 20, initialEnergy: 20,
    energyChargeAmount: 0, energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 0, chargeTimeModifierPct: 0
  };
}

function skill(id, { form = "contact", approachMode = "none",
  travelMs = 800, damage = 15, hitPresenceStates = null } = {}) {
  return normalizeSkillDefinition({
    id, name: id, category: "offensive", form, approachMode,
    energyCost: 0, preparationMs: 0, travelMs, recoveryMs: 0, cooldownMs: 0,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"], hitPresenceStates,
    effect: {
      damage, heal: 0, interruptsPreparation: false, stunMs: 0, tags: []
    }
  });
}

function harness() {
  let now = 0;
  const resolutions = [], interruptions = [];
  const session = createCombatSession({
    distance: "medium", fighters: [fighter("player"), fighter("opponent")]
  });
  const runtime = createCombatRuntime({
    session, now: () => now,
    onResolved: resolution => resolutions.push(resolution),
    onInterrupted: interruption => interruptions.push(interruption)
  });
  return {
    runtime, session, resolutions, interruptions,
    at(ms) { now = ms; },
    launchDive() {
      const res = runtime.startSkill({
        actorId: "player", targetId: "opponent",
        skill: skill("continuous-dive", {
          approachMode: "aerial", travelMs: 1600, damage: 26
        })
      });
      assert.equal(res.ok, true);
      this.at(300);
      const contact = runtime.reportActionContact({
        actorId: "player", targetId: "opponent", skillId: "continuous-dive"
      });
      assert.equal(contact.ok, true);
      assert.equal(contact.resolution.outcome, "hit");
      assert.equal(session.snapshot().fighters.opponent.hp, 74);
      assert.equal(resolutions.filter(x => x.skillId === "continuous-dive").length, 1);
    },
    attack({ startAt, impactAt, name = "ordinary", reach = null }) {
      this.at(startAt);
      const started = runtime.startSkill({
        actorId: "opponent", targetId: "player",
        skill: skill(name, {
          form: "projectile", travelMs: 600, damage: 21,
          hitPresenceStates: reach
        })
      });
      assert.equal(started.ok, true);
      this.at(impactAt);
      return runtime.reportActionContact({
        actorId: "opponent", targetId: "player", skillId: name
      });
    }
  };
}

test("contact damage does not end airborne presence: ordinary incoming attack after contact is evaded", () => {
  const h = harness();
  try {
    h.launchDive();
    assert.equal(h.session.snapshot().fighters.player.movementActive, true);
    assert.equal(h.runtime.hasActiveActionFor("player"), true);
    h.at(350);
    assert.equal(h.runtime.startSkill({
      actorId: "player", targetId: "opponent",
      skill: skill("cannot-chain", { approachMode: "ground" })
    }).outcome, "recovering");

    const incoming = h.attack({ startAt: 400, impactAt: 700 });
    assert.equal(incoming.ok, true);
    assert.equal(incoming.resolution.outcome, "evaded");
    assert.equal(incoming.resolution.evasionReason, "presence");
    assert.equal(incoming.resolution.targetPresence, "airborne");
    assert.equal(h.session.snapshot().fighters.player.hp, 100);
    assert.equal(h.session.snapshot().fighters.player.movementActive, true);
    assert.equal(h.resolutions.filter(x => x.skillId === "continuous-dive").length, 1);
  } finally { h.runtime.dispose(); }
});

test("explicit airborne reach still damages during the post-contact dive", () => {
  const h = harness();
  try {
    h.launchDive();
    const antiAir = h.attack({
      startAt: 400, impactAt: 700, name: "anti-air",
      reach: ["surface", "airborne"]
    });
    assert.equal(antiAir.ok, true);
    assert.equal(antiAir.resolution.outcome, "hit");
    assert.equal(antiAir.resolution.targetPresence, "airborne");
    assert.equal(h.session.snapshot().fighters.player.hp, 79);
  } finally { h.runtime.dispose(); }
});

test("post-contact flight naturally expires at the original travel deadline without replaying damage", () => {
  const h = harness();
  try {
    h.launchDive();
    const late = h.attack({ startAt: 1450, impactAt: 1700 });
    assert.equal(late.ok, true);
    assert.equal(late.resolution.outcome, "hit",
      "ordinary attack must hit again when the dive has actually ended");
    assert.equal(h.session.snapshot().fighters.player.hp, 79);
    assert.equal(h.session.snapshot().fighters.player.movementActive, false);
    assert.equal(h.runtime.hasActiveActionFor("player"), false);
    assert.equal(h.resolutions.filter(x => x.skillId === "continuous-dive").length, 1,
      "the original aerial damage is resolved only once at visible contact");
    h.at(1701);
    assert.equal(h.runtime.startSkill({
      actorId: "player", targetId: "opponent",
      skill: skill("next-turn", { form: "projectile" })
    }).ok, true);
  } finally { h.runtime.dispose(); }
});

test("an interrupted post-contact flight cancels its visible approach rather than leaving a false immunity", () => {
  const h = harness();
  try {
    h.launchDive();
    h.at(420);
    const cancelled = h.runtime.cancelActionsForActor("player", { reason: "stun" });
    assert.equal(cancelled.ok, true);
    assert.equal(h.interruptions.length, 1);
    assert.equal(h.interruptions[0].reason, "stun");
    assert.equal(h.session.snapshot().fighters.player.movementActive, false);
    assert.equal(h.runtime.hasActiveActionFor("player"), false);
    const ordinary = h.attack({ startAt: 430, impactAt: 650 });
    assert.equal(ordinary.resolution.outcome, "hit");
  } finally { h.runtime.dispose(); }
});
