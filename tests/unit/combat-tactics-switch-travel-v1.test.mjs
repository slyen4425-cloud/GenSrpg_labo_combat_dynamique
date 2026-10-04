import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { normalizeCombatCommandDefinition } from "../../src/contracts/combat-command-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { createRosterSession } from "../../src/core/combat/roster-session.js";
import { createBattleActorAiController } from "../../src/core/combat/battle-actor-ai-controller.js";
import { createCaptureCombatRosterControllerV1, mountCaptureCombatRosterPanelV1 } from "../../src/ui/capture-combat-roster-controller-v1.js";
import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";
import { buildHumanTacticalSkillEffectsV1 } from "../../src/ui/capture-editor-human-v2.js";
import { normalizeCaptureSkillEditorDraftV1 } from "../../src/contracts/capture-skill-editor-draft-v1.js";

const json = async path => JSON.parse(await readFile(new URL("../../" + path, import.meta.url), "utf8"));
const fighter = (id, extra = {}) => ({ id, maxHp: 200, initialHp: 200, maxEnergy: 12, initialEnergy: 12, energyChargeAmount: 0, ...extra });
const skill = (id, extra = {}) => normalizeSkillDefinition({ id, name: id, category: "offensive", form: "contact", approachMode: "ground", preparationMs: 100, travelMs: 1300, recoveryMs: 200, energyCost: 0, effect: { damage: 20 }, ...extra });
function clock(session, options = {}) {
  let now = 0, tick;
  const runtime = createCombatRuntime({ session, now: () => now, setTimer(fn) { tick = fn; return 1; }, clearTimer() {}, ...options });
  runtime.start();
  return { runtime, advance(ms) { now += ms; tick(); } };
}
function switching() {
  const configs = { first: fighter("first", { maxHp: 100, initialHp: 100, initialEnergy: 0, chargeTimeModifierPct: -50 }), second: fighter("second"), third: fighter("third", { maxHp: 300, initialHp: 300 }) };
  const session = createCombatSession({ fighters: [{ ...configs.first, id: "local" }, fighter("enemy")] });
  const definition = { teams: { local: { slotId: "local", activeMemberId: "one", members: ["first", "second", "third"].map((id, i) => ({ id: ["one", "two", "three"][i], creatureId: id, displayName: id, fighterConfigId: id })) } } };
  const roster = createRosterSession({ combatSession: session, roster: definition, fighterConfigs: configs });
  const visualCalls = [];
  const controller = createCaptureCombatRosterControllerV1({ session, rosterDefinition: definition, fighterConfigs: configs, skillIdsByCreature: { first: ["bite"], second: ["splash"] }, visuals: { setCreatureFor(...args) { visualCalls.push(["creature", ...args]); }, setSlotVisible(...args) { visualCalls.push(["visible", ...args]); } } });
  const c = clock(session, { onResolved: r => controller.applyCommandResolution(r) });
  return { configs, session, roster, controller, visualCalls, ...c };
}
const replacement = memberId => normalizeCombatCommandDefinition({ id: "switch", name: "Rappel et invocation", kind: "switch", energyCost: 0, preparationMs: 1000, recoveryMs: 0, effect: { rosterMemberId: memberId } });

test("the real roster panel enables reserve and replacement while only the enemy is attacking", () => {
  const h = switching();
  const nodes = [], listeners = {};
  const node = () => ({ dataset: {}, children: [], append(...items) { this.children.push(...items); }, setAttribute() {}, replaceChildren() { this.children = []; } });
  const host = node(), summary = node(), button = { ...node(), dataset: { combatRosterCommand: "switch" } };
  const panel = { querySelector: s => s.includes("summary") ? summary : host, querySelectorAll: () => [button], addEventListener: (type, fn) => { listeners[type] = fn; }, removeEventListener() {} };
  const root = { querySelector: () => panel, ownerDocument: { createElement() { const n = node(); nodes.push(n); return n; } } };
  const commands = { switch: { id: "switch", name: "Rappel et invocation", kind: "switch", energyCost: 0, preparationMs: 1000, recoveryMs: 0, effect: {} } };
  const ui = mountCaptureCombatRosterPanelV1({ root, controller: h.controller, format: { localActorId: "local", actors: [{ actorId: "local", teamId: "team" }], teamOf: () => "team" }, commands, session: h.session, getRuntime: () => h.runtime, isTransitionPending: () => false, setStatus() {} });
  try {
    h.runtime.startSkill({ actorId: "enemy", targetId: "local", skill: skill("incoming", { preparationMs: 500, travelMs: 1500 }) });
    ui.render();
    assert.equal(nodes.find(n => n.dataset.rosterMemberId === "two").disabled, false);
    assert.equal(button.disabled, false);
    listeners.click({ target: { closest: s => s.includes("roster-command") ? button : null } });
    assert.equal(h.runtime.activeActionFor("local").command.effect.rosterMemberId, "two");
    ui.render();
    assert.equal(button.disabled, true);
    h.advance(1000);
    assert.equal(h.controller.activeMember("local").id, "two");
  } finally { ui.dispose(); h.runtime.dispose(); h.controller.dispose(); }
});

test("canonical recall is free and one second; invocation is free and immediate", async () => {
  const recall = normalizeCombatCommandDefinition(await json("data/combat/commands/recall.command.json"));
  const summon = normalizeCombatCommandDefinition(await json("data/combat/commands/summon.command.json"));
  assert.deepEqual([recall.energyCost, recall.preparationMs, recall.recoveryMs], [0, 1000, 0]);
  assert.deepEqual([summon.energyCost, summon.preparationMs, summon.recoveryMs], [0, 0, 0]);
});

test("zero-energy replacement keeps a target during 1000 ms and an enemy attack reaches the incoming member", () => {
  const h = switching();
  try {
    assert.equal(h.runtime.startSkill({ actorId: "enemy", targetId: "local", skill: skill("incoming", { preparationMs: 500, travelMs: 1500 }) }).ok, true);
    const result = h.runtime.startCommand({ actorId: "local", command: replacement("two") });
    assert.equal(result.ok, true);
    assert.equal(result.action.preparationMs, 1000);
    assert.equal(h.session.snapshot().fighters.local.energy, 0);
    h.advance(999);
    assert.equal(h.controller.activeMember("local").id, "one");
    assert.equal(h.controller.isPresent("local"), true);
    h.advance(1);
    assert.equal(h.controller.activeMember("local").id, "two");
    assert.equal(h.controller.isPresent("local"), true);
    assert.deepEqual(h.controller.skillIdsFor("local"), ["splash"]);
    assert.equal(h.runtime.hasActiveActionFor("enemy"), true);
    assert.ok(!h.visualCalls.some(c => c[0] === "visible" && c[2] === false));
    h.advance(1000);
    assert.equal(h.session.snapshot().fighters.local.hp, 180);
    assert.equal(h.controller.snapshot().local.members[0].hp, 100);
  } finally { h.runtime.dispose(); h.controller.dispose(); }
});

test("replacement captures the reserve at start and an interrupted recall changes no member", () => {
  const h = switching();
  try {
    h.runtime.startCommand({ actorId: "local", command: replacement("two") });
    h.controller.selectReserve("local", "three");
    h.advance(1000);
    assert.equal(h.controller.activeMember("local").id, "two");
    h.runtime.startCommand({ actorId: "local", command: replacement("one") });
    h.advance(400);
    assert.equal(h.runtime.interruptActive({ targetActorId: "local", reason: "stun" }).ok, true);
    h.advance(1000);
    assert.equal(h.controller.activeMember("local").id, "two");
  } finally { h.runtime.dispose(); h.controller.dispose(); }
});

test("a real stun impact interrupts the native replacement without an UI interruption handler", () => {
  const h = switching();
  try {
    h.runtime.startCommand({ actorId: "local", command: replacement("two") });
    h.runtime.startSkill({ actorId: "enemy", targetId: "local", skill: skill("stun", { preparationMs: 200, travelMs: 0, form: "projectile", approachMode: "none", effect: { stunMs: 2000, interruptsPreparation: true } }) });
    h.advance(200);
    assert.equal(h.runtime.hasActiveActionFor("local"), false);
    h.advance(1000);
    assert.equal(h.controller.activeMember("local").id, "one");
  } finally { h.runtime.dispose(); h.controller.dispose(); }
});

test("a timed DoT KO cancels recall on the native clock and lets the KO roster path replace the member", () => {
  const h = switching();
  try {
    h.session.useSkill({ actorId: "enemy", targetId: "local", skill: skill("dot", { effect: {}, effects: [{ kind: "apply_status", targetScope: "target", status: { id: "dot", kind: "damage_over_time", damageMode: "fixed", channel: "fire", amount: 150, tickIntervalMs: 500, durationMs: 2000, polarity: "detrimental", stacking: "refresh" } }] }) });
    h.runtime.startCommand({ actorId: "local", command: replacement("two") });
    h.advance(500);
    assert.equal(h.runtime.hasActiveActionFor("local"), false);
    assert.equal(h.controller.replaceKnockedOut("local").outcome, "ko_replaced");
    h.advance(1000);
    assert.equal(h.controller.activeMember("local").id, "two");
    assert.equal(h.controller.snapshot().local.members[0].hp, 0);
  } finally { h.runtime.dispose(); h.controller.dispose(); }
});

test("Roster Session rejects dead/same reserves and restores native member state on an atomic round trip", () => {
  const h = switching();
  try {
    const buff = skill("root", { form: "self", approachMode: "none", targetRelations: ["self"], effect: {}, effects: [{ kind: "apply_status", targetScope: "self", status: { id: "root", kind: "immobilize", durationMs: 5000, polarity: "detrimental", stacking: "refresh" } }] });
    h.session.useSkill({ actorId: "local", targetId: "local", skill: buff });
    h.session.replaceFighter("local", { ...h.session.snapshot().fighters.local, initialHp: 37, initialEnergy: 4, skillCooldowns: { bite: 900 }, skillUseCounts: { bite: 2 } });
    const before = h.session.snapshot().fighters.local;
    assert.equal(h.roster.previewSwitch("local", "one").outcome, "member_already_active");
    assert.equal(h.roster.switchMember("local", "two").outcome, "switched");
    assert.equal(h.roster.switchMember("local", "one").ok, true);
    const restored = h.session.snapshot().fighters.local;
    for (const key of ["hp", "energy", "statusEffects", "skillCooldowns", "skillUseCounts", "damageDealtTotal", "damageTakenTotal", "knockoutsTotal"]) assert.deepEqual(restored[key], before[key], key);
    h.session.replaceFighter("local", { ...h.configs.first, id: "local", initialHp: 0 });
    h.roster.snapshot();
    h.roster.replaceKnockedOut("local");
    assert.equal(h.roster.previewSwitch("local", "one").outcome, "reserve_ko");
  } finally { h.runtime.dispose(); h.controller.dispose(); }
});

function zoneAi(energy = 12) {
  const battleFormat = { actors: [{ actorId: "ai" }, { actorId: "target" }], teamOf: id => id === "ai" ? "enemy" : "local" };
  const session = createCombatSession({ battleFormat, fighters: [fighter("ai", { initialEnergy: energy, energyChargeAmount: 1, energyChargeIntervalMs: 1800 }), fighter("target", { maxHp: 10000, initialHp: 10000 })] });
  const strike = skill("plain", { preparationMs: 0, travelMs: 0, recoveryMs: 0, energyCost: 2 });
  const zone = skill("zone-skill", { preparationMs: 2000, travelMs: 0, recoveryMs: 0, cooldownMs: 3500, energyCost: 5, form: "aura", approachMode: "none", effect: {}, effects: [{ kind: "persistent_zone", targetScope: "all_enemies", zoneId: "zone", radius: "short", durationMs: 7000, tickIntervalMs: 1000, reactivation: "reinforce", maxActivations: 3, radiusGrowthSteps: 1, tickEffect: { kind: "damage", targetScope: "all_enemies", amount: 5 } }] });
  const c = clock(session);
  const ai = createBattleActorAiController({ session, runtime: c.runtime, actorId: "ai", targetIds: ["target"], skillIds: [strike.id, zone.id], skillsById: { [strike.id]: strike, [zone.id]: zone } });
  return { ai, session, zone, ...c };
}

test("AI banks enough energy, grows short to medium to long, then resumes skill variety", () => {
  const h = zoneAi(7);
  try {
    const bank = h.ai.takeTurn();
    assert.equal(bank.status, "saving");
    assert.equal(bank.skillId, "zone-skill");
    assert.equal(bank.requiredEnergy, 12);
    h.advance(9000);
    assert.equal(h.ai.takeTurn().skillId, "zone-skill");
    h.advance(2000);
    assert.equal(h.session.snapshot().persistentZones[0].radius, "short");
    assert.equal(h.ai.takeTurn().status, "waiting");
    assert.equal(h.runtime.hasActiveActionFor("ai"), false);
    h.advance(1500);
    assert.equal(h.ai.takeTurn().skillId, "zone-skill");
    h.advance(2000);
    assert.equal(h.session.snapshot().persistentZones[0].radius, "medium");
    h.advance(1500);
    assert.equal(h.ai.takeTurn().skillId, "zone-skill");
    h.advance(2000);
    assert.equal(h.session.snapshot().persistentZones[0].radius, "long");
    assert.equal(h.session.snapshot().persistentZones[0].activations, 3);
    assert.equal(h.ai.takeTurn().skillId, "plain");
  } finally { h.runtime.dispose(); }
});

test("AI respects native activation conditions and usage limits instead of holding an illegal reinforcement goal", () => {
  const h = zoneAi();
  try {
    const unavailable = normalizeSkillDefinition({ ...h.zone, activationRequirements: { conditions: [{ type: "combat_elapsed_ms", threshold: 25000 }] } });
    const plain = skill("plain", { preparationMs: 0, travelMs: 0 });
    const ai = createBattleActorAiController({ session: h.session, runtime: h.runtime, actorId: "ai", targetIds: ["target"], skillIds: [plain.id, unavailable.id], skillsById: { plain, [unavailable.id]: unavailable } });
    assert.equal(ai.takeTurn().skillId, "plain");
  } finally { h.runtime.dispose(); }
});

function travelHarness(modifierPct = 50, stacking = "refresh") {
  const session = createCombatSession({ fighters: [fighter("a"), fighter("b")] });
  const slow = skill("slow", { preparationMs: 0, travelMs: 0, recoveryMs: 0, form: "self", approachMode: "none", effect: {}, effects: [{ kind: "apply_status", targetScope: "target", status: { id: "slow", kind: "approach_time_modifier", modifierPct, durationMs: 3000, polarity: "detrimental", stacking, maxStacks: 2, tags: ["movement"] } }] });
  session.useSkill({ actorId: "b", targetId: "a", skill: slow });
  return { session, slow };
}

test("approach status gives 1300 to 1950 ms without changing preparation, recovery or cooldown", () => {
  const { session } = travelHarness();
  const bite = skill("bite", { cooldownMs: 4000 });
  const { action } = session.startSkill({ actorId: "a", targetId: "b", skill: bite });
  assert.deepEqual([action.preparationMs, action.travelMs, action.impactAtMs, action.recoveryMs], [100, 1950, 2050, 200]);
  assert.equal(session.snapshot().fighters.a.skillCooldowns.bite, 4000);
  assert.equal(bite.travelMs, 1300);
  const approaches = [];
  const presenter = createCombatResolutionPresenter({ visuals: { playEventFor() {}, playApproachFor(id, mode, options) { approaches.push({ id, mode, travelMs: options.travelMs }); }, cancelFor() {} } });
  presenter.presentRelease({ action, actorSlot: "a", targetSlot: "b" });
  assert.equal(approaches[0].travelMs, 1950);
  presenter.dispose();
});

test("approach modifiers stack and expire/cleanse through native status ownership", () => {
  const { session, slow } = travelHarness(50, "stack");
  session.useSkill({ actorId: "b", targetId: "a", skill: slow });
  const bite = skill("bite");
  assert.equal(session.startSkill({ actorId: "a", targetId: "b", skill: bite }).action.travelMs, 2600);
  session.useSkill({ actorId: "a", targetId: "a", skill: skill("cleanse", { targetRelations: ["self"], form: "self", approachMode: "none", effect: {}, effects: [{ kind: "cleanse", targetScope: "self", statusTags: ["movement"] }] }) });
  assert.equal(session.startSkill({ actorId: "a", targetId: "b", skill: bite }).action.travelMs, 1300);
  session.useSkill({ actorId: "b", targetId: "a", skill: slow });
  session.advanceMs(3000);
  assert.equal(session.startSkill({ actorId: "a", targetId: "b", skill: bite }).action.travelMs, 1300);
});

test("speed buffs clamp at zero and projectile/teleport timings remain unchanged", () => {
  const { session } = travelHarness(-50);
  for (const [mode, form, expected] of [["ground", "contact", 650], ["aerial", "contact", 650], ["teleport", "contact", 1300], ["none", "projectile", 1300]]) {
    const s = skill("travel-" + mode, { approachMode: mode, form });
    assert.equal(session.startSkill({ actorId: "a", targetId: "b", skill: s }).action.travelMs, expected);
  }
  const faster = travelHarness(-150);
  assert.equal(faster.session.startSkill({ actorId: "a", targetId: "b", skill: skill("fast") }).action.travelMs, 0);
});

test("human editor exports the signed percentage through the native skill draft contract", () => {
  const effects = buildHumanTacticalSkillEffectsV1([{ kind: "apply_status", targetScope: "target", status: { id: "slow", kind: "approach_time_modifier", modifierPct: 50, polarity: "detrimental", durationSeconds: 3, stacking: "refresh" } }]);
  assert.equal(effects[0].status.modifierPct, 50);
  const draft = normalizeCaptureSkillEditorDraftV1({ schema: "capture-skill-editor-draft-v1", id: "slow", description: "", requiredLevel: 1, definition: { ...skill("slow"), effect: {}, effects }, presentation: null });
  assert.equal(draft.definition.effects[0].status.modifierPct, 50);
});
