import test from "node:test";
import assert from "node:assert/strict";

import { normalizeStatusEffectV1 } from "../../src/contracts/status-effect-v1.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";

const fighter = (id) => ({
  id, maxHp: 100, initialHp: 100,
  maxEnergy: 10, initialEnergy: 10,
  energyChargeAmount: 0, energyChargeIntervalMs: 2000,
  movementEnergyPerStep: 1, chargeTimeModifierPct: 0
});

const mirrorStatus = {
  id: "actual-projectile-mirror", kind: "projectile_mirror",
  polarity: "beneficial", durationMs: 5000,
  stacking: "refresh", tags: ["mirror"]
};

function skill(id, form, damage, effects = []) {
  return normalizeSkillDefinition({
    id, name: id, category: damage ? "offensive" : "buff_debuff",
    form, approachMode: "none", element: "physical",
    projectileTargeting: "direct",
    energyCost: 0, preparationMs: 0, travelMs: form === "projectile" ? 1000 : 0,
    recoveryMs: 0, cooldownMs: 0,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: damage ? ["enemy"] : ["self"],
    effect: { damage, heal: 0, tags: [] },
    effects
  });
}

function scenario({ fighterIds, attackerId, defenderId }) {
  const session = createCombatSession({
    distance: "medium", fighters: fighterIds.map(fighter)
  });
  const cast = session.useSkill({
    actorId: defenderId, targetId: defenderId,
    skill: skill("cast-mirror", "self", 0, [{
      kind: "apply_status", targetScope: "self", status: mirrorStatus
    }])
  });
  assert.equal(cast.ok, true);

  let clock = 0;
  let pending = null;
  let timerId = 0;
  const releases = [];
  const resolutions = [];
  const runtime = createCombatRuntime({
    session, tickMs: 25, now: () => clock,
    setTimer(callback) { pending = callback; return ++timerId; },
    clearTimer() { pending = null; },
    onRelease(payload) { releases.push(payload); },
    onResolved(resolution) { resolutions.push(resolution); }
  });
  function advanceTo(ms) {
    clock = ms;
    const cb = pending;
    pending = null;
    assert.equal(typeof cb, "function");
    cb();
  }
  runtime.start();
  const started = runtime.startSkill({
    actorId: attackerId, targetId: defenderId,
    skill: skill("direct-bolt", "projectile", 20)
  });
  assert.equal(started.ok, true);
  return { session, runtime, releases, resolutions, advanceTo };
}

test("Mirror is a beneficial native projectile status distinct from percent damage_reflection", () => {
  const normalized = normalizeStatusEffectV1(mirrorStatus);
  assert.equal(normalized.kind, "projectile_mirror");
  assert.equal(normalized.polarity, "beneficial");
  assert.equal(normalized.durationMs, 5000);
  assert.equal(normalized.stacking, "refresh");
  assert.equal(normalized.percent, undefined);
});

for (const fighters of [
  ["player", "opponent"],
  ["player-1", "player-2", "opponent-1", "opponent-2"]
]) {
  const attacker = fighters.length === 2 ? "player" : "player-2";
  const defender = fighters.length === 2 ? "opponent" : "opponent-2";
  test(`real mirror projectile contact and return ${fighters.length === 2 ? "1v1" : "2v2"}`, () => {
    const { session, runtime, releases, resolutions, advanceTo } = scenario({
      fighterIds: fighters, attackerId: attacker, defenderId: defender
    });

    assert.equal(releases.length, 1);
    assert.equal(releases[0].action.actorId, attacker);

    advanceTo(250);
    const forwardContact = runtime.reportActionContact({
      actorId: attacker, targetId: defender, skillId: "direct-bolt"
    });
    assert.equal(forwardContact.ok, true, "actual forward geometry contact is authoritative");
    assert.equal(session.snapshot().fighters[defender].hp, 100,
      "a mirrored projectile must not inflict damage on mirror owner");
    assert.equal(session.snapshot().fighters[attacker].hp, 100,
      "a reflected projectile cannot damage its original shooter instantly");
    assert.equal(releases.length, 2, "Combat Runtime must release a real returning flight");
    assert.equal(releases[1].action.actorId, defender, "the mirror is the return origin");
    assert.equal(releases[1].action.targetId, attacker, "the original shooter is the only return target");

    advanceTo(450);
    assert.equal(session.snapshot().fighters[attacker].hp, 100,
      "without visual return contact there is still no damage");
    const reverseContact = runtime.reportActionContact({
      actorId: defender, targetId: attacker, skillId: "direct-bolt"
    });
    assert.equal(reverseContact.ok, true, "reverse flight has its own actual collision");
    assert.equal(session.snapshot().fighters[attacker].hp, 80);
    assert.equal(session.snapshot().fighters[defender].hp, 100);
    if (fighters.length === 4) {
      assert.equal(session.snapshot().fighters["player-1"].hp, 100);
      assert.equal(session.snapshot().fighters["opponent-1"].hp, 100);
    }
    assert.equal(
      resolutions.flatMap(r => r.events || []).filter(e => e.type === "hit" && e.actorId === attacker).length,
      1, "a real return must resolve its damage only once"
    );
    runtime.dispose();
  });
}
