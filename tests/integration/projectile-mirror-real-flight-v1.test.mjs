import test from "node:test";
import assert from "node:assert/strict";

import { normalizeStatusEffectV1 } from "../../src/contracts/status-effect-v1.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { planSkillReleaseFx } from "../../src/core/fx/skill-fx-plan.js";

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

function scenario({ fighterIds, attackerId, defenderId, projectileDamage = 20 }) {
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
    skill: skill("direct-bolt", "projectile", projectileDamage)
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
    const contactPoint = { x: 127, y: 83 };
    const forwardContact = runtime.reportActionContact({
      actorId: attacker, targetId: defender, skillId: "direct-bolt", contactPoint
    });
    assert.equal(forwardContact.ok, true, "actual forward geometry contact is authoritative");
    assert.equal(session.snapshot().fighters[defender].hp, 100,
      "a mirrored projectile must not inflict damage on mirror owner");
    assert.equal(session.snapshot().fighters[attacker].hp, 100,
      "a reflected projectile cannot damage its original shooter instantly");
    assert.equal(releases.length, 2, "Combat Runtime must release a real returning flight");
    assert.equal(releases[1].action.actorId, defender, "the mirror is the return origin");
    assert.equal(releases[1].action.targetId, attacker, "the original shooter is the only return target");
    assert.deepEqual(releases[1].action.mirrorReturn?.contactPoint, contactPoint,
      "the return flight must inherit the real forward collision point");
    const [reverseFx] = planSkillReleaseFx({action:releases[1].action, actorSlot:defender, targetSlot:attacker});
    assert.equal(reverseFx.type, "projectile");
    assert.equal(reverseFx.fromSlot, defender);
    assert.equal(reverseFx.targetSlot, attacker);
    assert.deepEqual(reverseFx.fromPoint, contactPoint,
      "the existing renderer receives the exact observed collision as its new origin");

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

test("returning projectile never applies nominal damage when it misses its actual target", () => {
  const h = scenario({fighterIds:["player","opponent"],attackerId:"player",defenderId:"opponent"});
  h.advanceTo(250);
  assert.equal(h.runtime.reportActionContact({actorId:"player",targetId:"opponent",skillId:"direct-bolt"}).ok,true);
  assert.equal(h.releases.length,2);
  h.advanceTo(1800);
  assert.equal(h.session.snapshot().fighters.player.hp,100);
  assert.equal(h.session.snapshot().fighters.opponent.hp,100);
  assert.equal(h.resolutions.filter(r => r.outcome === "mirrored").length,1);
  assert.equal(h.resolutions.filter(r => r.outcome === "evaded").length,1);
  h.runtime.dispose();
});

test("two active mirrors have a bounded number of actual reverse flights and one final impact", () => {
  const h = scenario({fighterIds:["player","opponent"],attackerId:"player",defenderId:"opponent"});
  const mirrorCast=h.session.useSkill({actorId:"player",targetId:"player",skill:skill("mirror-attacker","self",0,[{
    kind:"apply_status",targetScope:"self",status:{...mirrorStatus,id:"mirror-player"}
  }])});
  assert.equal(mirrorCast.ok,true);
  h.advanceTo(250);
  h.runtime.reportActionContact({actorId:"player",targetId:"opponent",skillId:"direct-bolt"});
  h.advanceTo(450);
  h.runtime.reportActionContact({actorId:"opponent",targetId:"player",skillId:"direct-bolt"});
  assert.equal(h.releases.length,3,"bounce limit must permit exactly two actual reversals");
  h.advanceTo(650);
  const final=h.runtime.reportActionContact({actorId:"player",targetId:"opponent",skillId:"direct-bolt"});
  assert.equal(final.ok,true);
  assert.equal(h.session.snapshot().fighters.player.hp,100);
  assert.equal(h.session.snapshot().fighters.opponent.hp,80);
  assert.equal(h.releases.length,3,"mirror against mirror must never spin forever");
  h.runtime.dispose();
});

test("return impact credits KO to the reflector while retaining the original projectile's damage", () => {
  const h = scenario({fighterIds:["player","opponent"],attackerId:"player",defenderId:"opponent",projectileDamage:120});
  h.advanceTo(250);
  h.runtime.reportActionContact({actorId:"player",targetId:"opponent",skillId:"direct-bolt"});
  assert.equal(h.session.snapshot().fighters.player.hp,100);
  h.advanceTo(450);
  h.runtime.reportActionContact({actorId:"opponent",targetId:"player",skillId:"direct-bolt"});
  assert.equal(h.session.snapshot().fighters.player.hp,0);
  assert.equal(h.session.snapshot().fighters.opponent.hp,100);
  assert.equal(h.session.snapshot().fighters.opponent.knockoutsTotal,1);
  h.advanceTo(700);
  assert.equal(h.session.snapshot().fighters.opponent.knockoutsTotal,1);
  h.runtime.dispose();
});

test("the real returning record is eligible for the existing projectile clash scheduler", () => {
  const h = scenario({fighterIds:["player","opponent"],attackerId:"player",defenderId:"opponent"});
  h.advanceTo(250);
  h.runtime.reportActionContact({actorId:"player",targetId:"opponent",skillId:"direct-bolt"});
  const second = normalizeSkillDefinition({
    ...skill("intercept","projectile",10),
    projectileClash:{power:1},
    id:"intercept",name:"intercept"
  });
  // The original projectile must likewise be clash-eligible.
  assert.equal(h.runtime.startSkill({actorId:"player",targetId:"opponent",skill:second}).ok,true);
  h.advanceTo(800);
  assert.equal(h.session.snapshot().fighters.player.hp,100);
  assert.equal(h.session.snapshot().fighters.opponent.hp,100);
  h.runtime.dispose();
});
