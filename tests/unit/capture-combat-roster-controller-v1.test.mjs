import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createCaptureCombatRosterControllerV1 } from "../../src/ui/capture-combat-roster-controller-v1.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { normalizeCombatCommandDefinition } from "../../src/contracts/combat-command-definition.js";

async function harness() {
  const base = JSON.parse(await readFile(new URL("../../data/combat/fighters/maraileron.combat.json", import.meta.url), "utf8"));
  const configs = { first: { ...base, id: "first", maxHp: 100, initialHp: 100, maxEnergy: 12, initialEnergy: 12 }, second: { ...base, id: "second", maxHp: 50, initialHp: 50, maxEnergy: 12, initialEnergy: 12 } };
  const session = createCombatSession({ distance: "medium", fighters: [{ ...configs.first, id: "local-1" }, { ...configs.first, id: "opponent-1" }] });
  const roster = { teams: Object.fromEntries(["local-1", "opponent-1"].map(id => [id, { slotId: id, activeMemberId: id + "-first", members: [{ id: id + "-first", creatureId: "first", displayName: "First", fighterConfigId: "first" }, { id: id + "-second", creatureId: "second", displayName: "Second", fighterConfigId: "second" }] }])) };
  const visualCalls = [], changed = [];
  const controller = createCaptureCombatRosterControllerV1({ session, rosterDefinition: roster, fighterConfigs: configs, skillIdsByCreature: { first: ["strike-first"], second: ["strike-second"] }, visuals: { setCreatureFor(...args) { visualCalls.push(["creature", ...args]); }, setSlotVisible(...args) { visualCalls.push(["visible", ...args]); } }, onActorChanged: id => changed.push(id) });
  let now = 0, tick;
  const runtime = createCombatRuntime({ session, now: () => now, setTimer(fn) { tick = fn; return 1; }, clearTimer() {}, onResolved: result => controller.applyCommandResolution(result) });
  runtime.start();
  const commands = Object.fromEntries(await Promise.all(["recall", "summon"].map(async kind => [kind, normalizeCombatCommandDefinition(JSON.parse(await readFile(new URL("../../data/combat/commands/" + kind + ".command.json", import.meta.url), "utf8")))])));
  return { session, configs, controller, runtime, commands, visualCalls, changed, advance(ms) { now += ms; tick(); } };
}

test("native command completion recalls/summons the selected reserve and reloads its own skill IDs", async () => {
  const h = await harness();
  assert.deepEqual(h.controller.skillIdsFor("local-1"), ["strike-first"]);
  assert.equal(h.runtime.startCommand({ actorId: "local-1", command: h.commands.recall }).ok, true);
  h.advance(2000);
  assert.equal(h.controller.isPresent("local-1"), false);
  assert.equal(h.controller.isPresent("opponent-1"), true);
  assert.equal(h.controller.selectReserve("local-1", "local-1-second").ok, true);
  assert.equal(h.runtime.startCommand({ actorId: "local-1", command: h.commands.summon }).ok, true);
  h.advance(2800);
  assert.equal(h.controller.isPresent("local-1"), true);
  assert.equal(h.session.snapshot().fighters["local-1"].maxHp, 50);
  assert.deepEqual(h.controller.skillIdsFor("local-1"), ["strike-second"]);
  assert.equal(h.controller.activeMember("local-1").displayName, "Second");
  assert.ok(h.visualCalls.some(c => c[0] === "visible" && c[1] === "local-1" && c[2] === false));
  assert.ok(h.visualCalls.some(c => c[0] === "creature" && c[1] === "local-1" && c[2] === "second"));
  h.runtime.dispose(); h.controller.dispose();
});

test("interrupted commands leave the roster untouched and manual selection cannot affect the opposite actor", async () => {
  const h = await harness();
  const before = h.controller.snapshot();
  h.controller.applyCommandResolution({ ok: false, outcome: "interrupted", actionType: "command", actorId: "local-1", commandKind: "recall" });
  assert.deepEqual(h.controller.snapshot(), before);
  assert.throws(() => h.controller.selectReserve("local-1", "opponent-1-second"), /Unknown/);
  assert.deepEqual(h.controller.snapshot()["opponent-1"], before["opponent-1"]);
  h.runtime.dispose(); h.controller.dispose();
});

test("KO uses Roster Session replacement and snapshots without changing the canonical fighter configs", async () => {
  const h = await harness(), before = JSON.stringify(h.configs);
  h.session.replaceFighter("opponent-1", { ...h.configs.first, id: "opponent-1", initialHp: 0 });
  assert.equal(h.controller.replaceKnockedOut("opponent-1").outcome, "ko_replaced");
  assert.equal(h.session.snapshot().fighters["opponent-1"].hp, 50);
  assert.equal(h.controller.snapshot()["opponent-1"].members[0].hp, 0);
  assert.equal(h.controller.snapshot()["local-1"].members[0].hp, 100);
  assert.equal(JSON.stringify(h.configs), before);
  h.session.replaceFighter("opponent-1", { ...h.configs.second, id: "opponent-1", initialHp: 0 });
  assert.equal(h.controller.replaceKnockedOut("opponent-1").outcome, "team_defeated");
  assert.equal(h.controller.isPresent("opponent-1"), false);
  h.runtime.dispose(); h.controller.dispose();
});

test("disposed preview controller no longer changes native roster or visuals", async () => {
  const h = await harness(), before = h.controller.snapshot();
  h.controller.dispose();
  assert.equal(h.controller.applyCommandResolution({ ok: true, outcome: "completed", actorId: "local-1", commandKind: "recall" }).outcome, "disposed");
  assert.deepEqual(h.controller.snapshot(), before);
  assert.equal(h.changed.length, 0);
  h.runtime.dispose();
});
