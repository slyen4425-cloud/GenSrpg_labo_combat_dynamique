import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { normalizeCaptureBattleSetupEditorDraftV1 } from "../../src/contracts/capture-battle-setup-editor-draft-v1.js";
import { normalizeCombatCommandDefinition } from "../../src/contracts/combat-command-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";

const json = async path => JSON.parse(await readFile(new URL("../../" + path, import.meta.url), "utf8"));
const fighter = id => ({ id, maxHp: 100, initialHp: 100, maxEnergy: 100, initialEnergy: 100, energyChargeAmount: 0 });
const melee = normalizeSkillDefinition({ id: "melee", name: "Melee", category: "offensive", form: "contact", approachMode: "ground", preparationMs: 100, travelMs: 1500, recoveryMs: 0, energyCost: 0, effect: { damage: 1 } });
function harness(session, options = {}) {
  let now = 0, tick;
  const runtime = createCombatRuntime({ session, now: () => now, setTimer(fn) { tick = fn; return 1; }, clearTimer() {}, ...options });
  runtime.start();
  return { runtime, tick(ms) { now = ms; tick(); }, contact(ms, input) { now = ms; return runtime.reportActionContact(input); } };
}
async function zoneSession(activations = 1) {
  const transfer = await json("data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json");
  const storm = normalizeSkillDefinition({ ...transfer.draft.definition, energyCost: 0, preparationMs: 0, cooldownMs: 0, activationRequirements: { mode: "all", conditions: [] } });
  const format = { actors: [{ actorId: "local" }, { actorId: "enemy" }], teamOf: id => id };
  const session = createCombatSession({ fighters: [fighter("local"), fighter("enemy")], battleFormat: format });
  for (let i = 0; i < activations; i++) assert.equal(session.useSkill({ actorId: "enemy", targetId: "local", skill: storm }).ok, true);
  return session;
}
for (const activations of [1, 2]) test("native fire-zone entry occurs at an early accepted visible contact, radius " + activations, async () => {
  const session = await zoneSession(activations), deltas = [];
  const h = harness(session, { onHealthDelta: d => deltas.push(d) });
  h.runtime.startSkill({ actorId: "local", targetId: "enemy", skill: melee });
  h.tick(100);
  const result = h.contact(300, { actorId: "local", targetId: "enemy", skillId: melee.id });
  assert.equal(result.ok, true);
  assert.equal(session.snapshot().fighters.local.hp, 95, "model contact proves entry even before the nominal band threshold");
  assert.equal(deltas.filter(d => d.actorId === "local").reduce((s, d) => s + d.amount, 0), 5);
  h.runtime.dispose();
});
test("same-clock visible contact still enters the zone; rejected contact signals cannot damage", async () => {
  const session = await zoneSession(), h = harness(session);
  h.runtime.startSkill({ actorId: "local", targetId: "enemy", skill: melee });
  h.tick(300);
  assert.equal(h.contact(300, { actorId: "local", targetId: "enemy", skillId: "stale" }).outcome, "skill_mismatch");
  assert.equal(session.snapshot().fighters.local.hp, 100);
  assert.equal(h.contact(300, { actorId: "local", targetId: "enemy", skillId: melee.id }).ok, true);
  assert.equal(session.snapshot().fighters.local.hp, 95);
  h.runtime.dispose();
});
test("visible contact after a native band crossing does not add a second entry hit", async () => {
  const session = await zoneSession(), h = harness(session);
  h.runtime.startSkill({ actorId: "local", targetId: "enemy", skill: melee });
  h.tick(1110);
  const before = session.snapshot().fighters.local.hp;
  assert.equal(before, 95);
  h.contact(1110, { actorId: "local", targetId: "enemy", skillId: melee.id });
  assert.equal(session.snapshot().fighters.local.hp, before);
  h.runtime.dispose();
});
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
const lethal = { ok: true, actionType: "skill", actorId: "enemy", targetId: "local", outcome: "hit", events: [{ type: "hit", actorId: "local", hpAfter: 0 }] };
test("a cancelled lethal hit cannot play its deferred KO on the replacement", async () => {
  const hit = deferred(), calls = [];
  const presenter = createCombatResolutionPresenter({ visuals: { cancelFor() {}, playEventFor(id, type) { calls.push([id, type]); return type === "hit" ? hit.promise : Promise.resolve({ status: "finished" }); } } });
  const result = presenter.presentOutcome({ resolution: lethal, actorSlot: "enemy", targetSlot: "local" });
  hit.resolve({ status: "cancelled" });
  await result.finished;
  assert.deepEqual(calls, [["local", "hit"]]);
  presenter.dispose();
});
test("replacing a target invalidates its pending outcome continuation even if the old hit finishes", async () => {
  const hit = deferred(), calls = [];
  const presenter = createCombatResolutionPresenter({ visuals: { cancelFor() {}, playEventFor(id, type) { calls.push([id, type]); return type === "hit" ? hit.promise : Promise.resolve({ status: "finished" }); } } });
  const result = presenter.presentOutcome({ resolution: lethal, actorSlot: "enemy", targetSlot: "local" });
  presenter.cancelActionPresentation("local");
  hit.resolve({ status: "finished" });
  await result.finished;
  assert.deepEqual(calls, [["local", "hit"]]);
  presenter.dispose();
});
test("default trainer recall is two seconds, free, and independent of creature preparation", async () => {
  for (const kind of ["switch", "recall"]) {
    const command = normalizeCombatCommandDefinition(await json("data/combat/commands/" + kind + ".command.json"));
    assert.deepEqual([command.energyCost, command.preparationMs, command.recoveryMs], [0, 2000, 0]);
    const session = createCombatSession({ fighters: [{ ...fighter("local"), chargeTimeModifierPct: 50 }, fighter("enemy")] });
    assert.equal(session.previewCommand({ actorId: "local", command }).action.preparationMs, 2000);
  }
});
test("battle setup retains an optional validated recall duration; older setup keeps its shape", () => {
  const input = { schema: "capture-battle-setup-editor-draft-v1", id: "test", localActorId: "local", teams: [{ id: "team-local", slots: [{ actorId: "local", creatureId: "c", displayName: "C", controllerId: "human" }] }, { id: "team-enemy", slots: [{ actorId: "enemy", creatureId: "c", displayName: "C", controllerId: "ai" }] }] };
  assert.equal(normalizeCaptureBattleSetupEditorDraftV1({ ...input, recallPreparationMs: 3500 }).recallPreparationMs, 3500);
  assert.equal("recallPreparationMs" in normalizeCaptureBattleSetupEditorDraftV1(input), false);
  for (const value of [-1, Infinity, NaN]) assert.throws(() => normalizeCaptureBattleSetupEditorDraftV1({ ...input, recallPreparationMs: value }), /recallPreparationMs/);
});
