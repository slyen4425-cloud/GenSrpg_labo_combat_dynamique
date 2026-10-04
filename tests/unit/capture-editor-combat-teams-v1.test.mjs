import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildHumanCreatureDraftV3, buildHumanLoadoutV1, buildHumanSkillDraftV1 } from "../../src/ui/capture-editor-human-v2.js";
import { buildCaptureEditorCombatTestV1, prepareCaptureEditorCombatEditsV1, mountCaptureEditorCombatTeamControlsV1 } from "../../src/ui/capture-editor-combat-test-v1.js";
import { adaptCaptureCombatExportStackV1 } from "../../src/adapters/input/capture/capture-export-adapter-stack-v1.js";
import { loadCoop2v2CombatSource } from "../../src/ui/combat-2v2-test-ui.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { createRosterSession } from "../../src/core/combat/roster-session.js";

function fixture() {
  const skill = buildHumanSkillDraftV1({ id: "strike", name: "Strike", description: "Native strike fixture", requiredLevel: 1, usageScopes: ["capture", "combat"], category: "offensive", form: "contact", element: "fire", approachMode: "ground", energyCost: 1, preparationMs: 100, travelMs: 100, recoveryMs: 0, cooldownMs: 0, allowedDistances: ["short", "medium", "long"], targetRelations: ["enemy"], damage: 7 });
  const configuredCreatures = new Map(Array.from({ length: 8 }, (_, i) => {
    const id = "crea-" + i;
    const draft = buildHumanCreatureDraftV3({ id, displayName: "Creature " + i, description: "Native test fixture", level: 10, sourceStats: { force: 10, agility: 10, intelligence: 10, spirit: 10, endurance: 10, initiative: 10 }, elements: [], resistances: {}, capture: { capturable: true, captureRate: 30, spawnChance: 10, spawnTags: [], evolution: null }, combat: { maxHp: 100, initialHp: 100, maxEnergy: 12, initialEnergy: 12, energyChargeAmount: 0, energyChargeIntervalMs: 1000, movementEnergyPerStep: 1, chargeTimeModifierPct: 0 }, linkedSkillIds: [skill.id], profileId: "quadruped", displayScale: 1 + i / 10, visual: { frontAssetId: "pack:test:front-" + i, backAssetId: "pack:test:back-" + i, iconAssetId: "pack:test:icon-" + i }, sockets: [], audio: {} });
    return [id, Object.freeze({ draft, loadout: buildHumanLoadoutV1({ creatureId: id, skillIds: [skill.id] }), statValues: null })];
  }));
  return { configuredCreatures, configuredSkills: new Map([[skill.id, skill]]), localCreatureIds: ["crea-0"], opponentCreatureIds: ["crea-1"], activePerTeam: 1, arenaId: "city", combatRules: { schema: "capture-combat-rules-editor-draft-v1", maxEnergy: 12, initialEnergy: 12, energyChargeAmount: 0, energyChargeIntervalMs: 1000, movementEnergyPerStep: 1, chargeTimeModifierPct: 0 } };
}

for (const size of [1, 2, 3, 4, 5, 6]) {
  test("native test composes " + size + " distinct members per camp and preserves library records", () => {
    const input = fixture(), before = JSON.stringify([...input.configuredCreatures.values()]);
    const ids = Array.from({ length: size }, (_, i) => "crea-" + i);
    const exported = buildCaptureEditorCombatTestV1({ ...input, localCreatureIds: ids, opponentCreatureIds: [...ids] });
    assert.equal(exported.actors.length, 2);
    assert.equal(exported.creatures.length, size);
    assert.equal(exported.skills.length, 1);
    assert.deepEqual(exported.rosters.map(r => r.members.length), [size, size]);
    assert.equal(new Set(exported.rosters.flatMap(r => r.members.map(m => m.id))).size, size * 2);
    assert.equal(JSON.stringify([...input.configuredCreatures.values()]), before);
    assert.equal(exported.presentation.creatures["creature:crea-" + (size - 1)].displayScale, 1 + (size - 1) / 10);
  });
}

test("copies of the same configured model have independent native combat HP and reserve snapshots", async () => {
  const input = fixture();
  const exported = buildCaptureEditorCombatTestV1({ ...input, localCreatureIds: Array(6).fill("crea-0"), opponentCreatureIds: Array(6).fill("crea-0") });
  assert.equal(exported.creatures.length, 1);
  const native = adaptCaptureCombatExportStackV1(exported);
  const loaded = await loadCoop2v2CombatSource({ nativeCombatSource: native, fetchImpl() { throw Error("must use native export"); } });
  assert.equal(loaded.roster, native.roster, "generic combat client must retain the native roster");
  assert.equal(loaded.fighterConfigs, native.fighterConfigs);
  const session = createCombatSession({ distance: "medium", fighters: loaded.fighters });
  let now = 0, callback;
  const runtime = createCombatRuntime({ session, now: () => now, setTimer(fn) { callback = fn; return 1; }, clearTimer() {} });
  runtime.start();
  assert.equal(runtime.startSkill({ actorId: "local-1", targetId: "opponent-1", skill: loaded.skillsById.strike }).ok, true);
  now = 220; callback();
  assert.equal(session.snapshot().fighters["local-1"].hp, 100);
  assert.equal(session.snapshot().fighters["opponent-1"].hp, 93);
  const roster = createRosterSession({ combatSession: session, roster: native.roster, fighterConfigs: native.fighterConfigs });
  roster.recall("opponent-1");
  const reserve = roster.snapshot()["opponent-1"].members[1].id;
  assert.equal(roster.summon("opponent-1", reserve).ok, true);
  assert.equal(session.snapshot().fighters["opponent-1"].hp, 100);
  assert.equal(roster.snapshot()["opponent-1"].members[0].hp, 93);
  runtime.dispose();
});

test("six-member 2v2 uses the native four slots with reserves divided between owners", () => {
  const input = fixture(), ids = Array.from({ length: 6 }, (_, i) => "crea-" + i);
  const exported = buildCaptureEditorCombatTestV1({ ...input, localCreatureIds: ids, opponentCreatureIds: ids, activePerTeam: 2 });
  assert.deepEqual(exported.actors.map(a => a.actorId), ["local-1", "local-2", "opponent-1", "opponent-2"]);
  assert.deepEqual(exported.rosters.map(r => r.members.map(m => m.creatureId)), [["crea-0", "crea-2", "crea-4"], ["crea-1", "crea-3", "crea-5"], ["crea-0", "crea-2", "crea-4"], ["crea-1", "crea-3", "crea-5"]]);
  assert.deepEqual(exported.actors.map(a => a.controllerId), ["human-local", "ai-ally", "ai-enemy", "ai-enemy"]);
});

test("opponent beyond the old demo list uses its canonical presentation and all six KO replacements", () => {
  const input = fixture();
  const exported = buildCaptureEditorCombatTestV1({ ...input, opponentCreatureIds: ["crea-7", "crea-6", "crea-5", "crea-4", "crea-3", "crea-2"] });
  assert.equal(exported.actors[1].creatureId, "crea-7");
  assert.equal(exported.presentation.creatures["creature:crea-7"].displayScale, 1.7);
  const native = adaptCaptureCombatExportStackV1(exported);
  const session = createCombatSession({ distance: "medium", fighters: native.fighters });
  const roster = createRosterSession({ combatSession: session, roster: native.roster, fighterConfigs: native.fighterConfigs });
  for (let i = 0; i < 6; i++) {
    session.replaceFighter("opponent-1", { ...native.fighterConfigs["crea-" + (7 - i)], id: "opponent-1", initialHp: 0 });
    const result = roster.replaceKnockedOut("opponent-1");
    assert.equal(result.outcome, i === 5 ? "team_defeated" : "ko_replaced");
  }
  assert.equal(roster.snapshot()["opponent-1"].members.filter(m => m.hp === 0).length, 6);
});

test("test composition rejects missing IDs, empty/oversized teams and impossible active counts", () => {
  const input = fixture();
  for (const patch of [{ opponentCreatureIds: ["missing"] }, { localCreatureIds: [] }, { opponentCreatureIds: Array(7).fill("crea-0") }, { activePerTeam: 2 }, { activePerTeam: 3 }]) {
    assert.throws(() => buildCaptureEditorCombatTestV1({ ...input, ...patch }), /créature|équipe|actif|actives|introuvable|1|2|6/i);
  }
  const asymmetric = buildCaptureEditorCombatTestV1({ ...input, opponentCreatureIds: ["crea-7", "crea-6", "crea-5"] });
  assert.deepEqual(asymmetric.rosters.map(r => r.members.length), [1, 3]);
});

test("test action commits valid pending edits once through the active owners without moving loadout IDs", () => {
  const input = fixture(), original = input.configuredCreatures.get("crea-0"), skill = input.configuredSkills.get("strike");
  const updatedSkill = { ...skill, definition: { ...skill.definition, travelMs: 1700 } };
  const updatedCreature = { ...original, draft: { ...original.draft, displayName: "Edited", presentation: { ...original.draft.presentation, displayScale: 2 } } };
  const result = prepareCaptureEditorCombatEditsV1({ ...input, selectedSkillId: "strike", selectedCreatureId: "crea-0", readSkillDraft: () => updatedSkill, readCreatureRecord() { assert.equal(input.configuredSkills.get("strike"), updatedSkill); return updatedCreature; }, buildExport: () => buildCaptureEditorCombatTestV1({ ...input, opponentCreatureIds: ["crea-0"] }) });
  assert.equal(result.exported.skills[0].definition.travelMs, 1700);
  assert.equal(result.exported.creatures[0].displayName, "Edited");
  assert.equal(input.configuredSkills.size, 1);
  assert.equal(input.configuredCreatures.size, 8);
  assert.equal(input.configuredCreatures.get("crea-0").loadout, original.loadout);
  assert.equal(input.configuredSkills.get("strike"), updatedSkill);
});

test("invalid creature or scenario rolls back staged edits and preserves the original owner references", () => {
  for (const failAt of ["creature", "scenario"]) {
    const input = fixture(), skill = input.configuredSkills.get("strike"), original = input.configuredCreatures.get("crea-0");
    assert.throws(() => prepareCaptureEditorCombatEditsV1({ ...input, selectedSkillId: "strike", selectedCreatureId: "crea-0", readSkillDraft: () => ({ ...skill, requiredLevel: 4 }), readCreatureRecord() { if (failAt === "creature") throw Error("invalid creature"); return { ...original, draft: { ...original.draft, level: 20 } }; }, buildExport() { throw Error("invalid scenario"); } }), /invalid/);
    assert.equal(input.configuredSkills.get("strike"), skill);
    assert.equal(input.configuredCreatures.get("crea-0"), original);
  }
});

test("pending new IDs cannot silently replace existing library entries", () => {
  const input = fixture();
  assert.throws(() => prepareCaptureEditorCombatEditsV1({ ...input, selectedSkillId: null, selectedCreatureId: "crea-0", readSkillDraft: () => input.configuredSkills.get("strike"), readCreatureRecord: () => null, buildExport() {} }), /existe déjà/);
  assert.throws(() => prepareCaptureEditorCombatEditsV1({ ...input, selectedSkillId: "strike", selectedCreatureId: null, readSkillDraft: () => null, readCreatureRecord: () => input.configuredCreatures.get("crea-0"), buildExport() {} }), /existe déjà/);
});

class Select {
  constructor(value = "") { this.value = value; this.options = []; this.handlers = new Map(); this.disabled = false; }
  set textContent(value) { this.options = []; this.value = ""; }
  append(o) { this.options.push(o); }
  addEventListener(type, fn) { this.handlers.set(type, fn); }
  removeEventListener(type, fn) { if (this.handlers.get(type) === fn) this.handlers.delete(type); }
  change(value) { this.value = value; this.handlers.get("change")?.(); }
}

test("team selectors refresh from the active owner after create/replacement and keep independent member choices", () => {
  const input = fixture();
  const localCount = new Select("1"), enemyCount = new Select("1"), active = new Select("1");
  const locals = Array.from({ length: 5 }, () => new Select()), enemies = Array.from({ length: 6 }, () => new Select());
  const wrappers = Array.from({ length: 11 }, (_, i) => ({ dataset: { testTeam: i < 5 ? "local" : "opponent", testTeamIndex: String(i < 5 ? i + 1 : i - 5) }, hidden: false }));
  const selectors = { "[data-test-local-team-size]": localCount, "[data-test-opponent-team-size]": enemyCount, "[data-active-per-team]": active };
  const root = { ownerDocument: { createElement: () => ({ value: "", textContent: "" }) }, querySelector: s => selectors[s] ?? null, querySelectorAll: s => s === "[data-test-local-creature]" ? locals : s === "[data-test-opponent-creature]" ? enemies : s === "[data-test-team-member]" ? wrappers : [] };
  const controller = mountCaptureEditorCombatTeamControlsV1({ root, configuredCreatures: input.configuredCreatures, getSelectedCreatureId: () => "crea-0" });
  assert.equal(enemies[0].options.length, 8);
  enemyCount.change("6"); localCount.change("3");
  enemies[5].value = "crea-7"; locals[0].value = "crea-6";
  const replaced = input.configuredCreatures.get("crea-7");
  input.configuredCreatures.set("crea-7", { ...replaced, draft: { ...replaced.draft, displayName: "Renamed" } });
  controller.refresh();
  assert.equal(enemies[5].value, "crea-7");
  assert.equal(enemies[5].options.find(o => o.value === "crea-7").textContent, "Renamed · crea-7");
  assert.deepEqual(controller.read(), { localCreatureIds: ["crea-0", "crea-6", "crea-0"], opponentCreatureIds: ["crea-0", "crea-0", "crea-0", "crea-0", "crea-0", "crea-7"], activePerTeam: 1 });
  assert.equal(wrappers[2].hidden, true);
  controller.dispose();
  assert.equal(localCount.handlers.size, 0);
});

test("mobile action bar remains fixed, reserves space, and communicates direct testing of edits", async () => {
  const css = await readFile(new URL("../../examples/dom-demo/capture-editor-v2.css", import.meta.url), "utf8");
  const html = await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url), "utf8");
  assert.doesNotMatch(css, /\.editor-footer\s*\{[^}]*position:\s*static/s);
  assert.match(css, /--editor-footer-space/);
  assert.match(css, /scroll-padding-bottom/);
  assert.match(html, /data-test-local-team-size/);
  assert.match(html, /data-test-opponent-team-size/);
  assert.match(html, /modifications.*enregistrées.*test/is);
});
