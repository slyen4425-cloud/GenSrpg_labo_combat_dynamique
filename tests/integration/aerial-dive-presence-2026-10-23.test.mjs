import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { skillPresenceReachV1 } from "../../src/core/combat/combat-presence-v1.js";

function fighter(id) {
  return { id, maxHp: 100, initialHp: 100, maxEnergy: 20,
    initialEnergy: 20, energyChargeAmount: 0, energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 0, chargeTimeModifierPct: 0 };
}
function skill(id, { form = "contact", approachMode = "none", travelMs = 800,
  damage = 15, hitPresenceStates = null, preparationMs = 0 } = {}) {
  return normalizeSkillDefinition({
    id, name: id, category: "offensive", form, approachMode,
    energyCost: 0, preparationMs, travelMs, recoveryMs: 0, cooldownMs: 0,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    hitPresenceStates,
    effect: { damage, heal: 0, interruptsPreparation: false, stunMs: 0, tags: [] }
  });
}
function combat() {
  const session = createCombatSession({
    distance: "medium", fighters: [fighter("player"), fighter("opponent")]
  });
  const queue = [];
  let now = 0, nextId = 1;
  const resolutions = [];
  const runtime = createCombatRuntime({
    session, now: () => now,
    setTimer: callback => {
      const id = nextId++;
      queue.push({id, callback});
      return id;
    },
    clearTimer: id => {
      const index = queue.findIndex(item => item.id === id);
      if (index >= 0) queue.splice(index, 1);
    },
    onResolved: resolution => resolutions.push(resolution)
  });
  runtime.start();
  return {
    session, runtime, resolutions,
    tick(atMs, id) {
      now = atMs;
      for (let i = 0; i < 12 && !resolutions.some(x => x.skillId === id); i++) {
        const task = queue.shift();
        assert.ok(task, "Combat Runtime must schedule its resolution");
        task.callback();
      }
      return resolutions.find(x => x.skillId === id);
    }
  };
}

test("aerial dive strikes the rival while a concurrent ordinary ground attack misses", () => {
  const { session, runtime, tick } = combat();
  try {
    const dive = skill("dive", { approachMode: "aerial", travelMs: 1600, damage: 27 });
    const claw = skill("claw", { approachMode: "ground", travelMs: 800, damage: 19 });
    assert.equal(runtime.startSkill({ actorId: "player", targetId: "opponent", skill: dive }).ok, true);
    assert.equal(runtime.startSkill({ actorId: "opponent", targetId: "player", skill: claw }).ok, true);
    const incoming = tick(800, "claw");
    assert.equal(incoming?.outcome, "evaded");
    assert.equal(incoming.evasionReason, "presence");
    assert.equal(incoming.targetPresence, "airborne");
    assert.equal(session.snapshot().fighters.player.hp, 100);
    const outgoing = tick(1600, "dive");
    assert.equal(outgoing?.outcome, "hit");
    assert.equal(session.snapshot().fighters.opponent.hp, 73);
  } finally { runtime.dispose(); }
});

test("simultaneous ordinary aerial attack cannot catch a target already airborne", () => {
  const { session, runtime, tick } = combat();
  try {
    const longFlight = skill("long-flight", { approachMode: "aerial", travelMs: 1600, damage: 15 });
    const chase = skill("chase", { approachMode: "aerial", travelMs: 800, damage: 23 });
    runtime.startSkill({ actorId: "player", targetId: "opponent", skill: longFlight });
    runtime.startSkill({ actorId: "opponent", targetId: "player", skill: chase });
    const incoming = tick(800, "chase");
    assert.equal(incoming?.outcome, "evaded");
    assert.equal(incoming.evasionReason, "presence");
    assert.equal(session.snapshot().fighters.player.hp, 100);
  } finally { runtime.dispose(); }
});

test("explicit anti-air still hits and flight never grants blanket damage immunity", () => {
  const { session, runtime, tick } = combat();
  try {
    const dive = skill("dive", { approachMode: "aerial", travelMs: 1600, damage: 10 });
    const antiAir = skill("anti-air", {
      form: "projectile", hitPresenceStates: ["surface", "airborne"], damage: 22
    });
    runtime.startSkill({ actorId: "player", targetId: "opponent", skill: dive });
    runtime.startSkill({ actorId: "opponent", targetId: "player", skill: antiAir });
    const incoming = tick(800, "anti-air");
    assert.equal(incoming?.outcome, "hit");
    assert.equal(incoming.targetPresence, "airborne");
    assert.equal(session.snapshot().fighters.player.hp, 78);
  } finally { runtime.dispose(); }
});

test("presence protection exists only during release-to-impact flight and leaves support alone", () => {
  const dive = skill("dive", { approachMode: "aerial", preparationMs: 250, travelMs: 1600 });
  const ordinary = skill("ordinary", { form: "projectile" });
  const action = {
    actionType: "skill", actionId: "dive-1", skill: dive,
    releaseAtMs: 250, impactAtMs: 1850
  };
  const reach = (elapsedMs, incoming = ordinary) => skillPresenceReachV1({
    skill: incoming, targetActionContext: { action, elapsedMs }
  });
  assert.equal(reach(249).reachable, true);
  assert.equal(reach(250).reachable, false);
  assert.equal(reach(1850).reachable, false);
  assert.equal(reach(1851).reachable, true);
  assert.equal(reach(1000, skill("air-hitter", {
    hitPresenceStates: ["surface", "airborne"]
  })).reachable, true);
  assert.equal(reach(1000, { category: "support", hitPresenceStates: null }).reachable, true);
});

test("existing Tornade, Arc and Ouragan explicitly retain their anti-air reach", () => {
  for (const id of ["cap_air_atk_4", "lib_chain_lightning", "cap_air_atk_7"]) {
    const data = JSON.parse(readFileSync(new URL(
      `../../data/capture/showcase/${id}.capture-skill-transfer-v1.json`, import.meta.url
    ), "utf8"));
    const authored = normalizeSkillDefinition(data.draft.definition);
    assert.deepEqual(authored.hitPresenceStates, ["surface", "airborne"], id);
    const flight = skill("flying-target", { approachMode: "aerial", travelMs: 2000 });
    const targetActionContext = { action: {
      actionType: "skill", actionId: "flight", skill: flight,
      releaseAtMs: 0, impactAtMs: 2000
    }, elapsedMs: 700 };
    assert.equal(skillPresenceReachV1({ skill: authored, targetActionContext }).reachable, true, id);
  }
});
