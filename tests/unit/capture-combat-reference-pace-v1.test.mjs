import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as paceContract from "../../src/contracts/capture-battle-setup-editor-draft-v1.js";
import { normalizeCaptureCombatExportV1 } from "../../src/contracts/capture-combat-export-v1.js";
import { buildHumanCreatureDraftV3, buildHumanLoadoutV1, buildHumanSkillDraftV1 } from "../../src/ui/capture-editor-human-v2.js";
import { buildCaptureEditorCombatTestV1 } from "../../src/ui/capture-editor-combat-test-v1.js";
import { adaptCaptureCombatExportStackV1 } from "../../src/adapters/input/capture/capture-export-adapter-stack-v1.js";
import { loadCoop2v2CombatSource } from "../../src/ui/combat-2v2-test-ui.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";

function fixture() {
  const skill = buildHumanSkillDraftV1({
    id: "strike", name: "Strike", description: "Reference pace fixture", requiredLevel: 1,
    usageScopes: ["capture", "combat"], category: "offensive", form: "contact", element: "fire",
    approachMode: "ground", energyCost: 1, preparationMs: 600, travelMs: 400,
    recoveryMs: 300, cooldownMs: 1200, allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"], damage: 7
  });
  const configuredCreatures = new Map(["local", "enemy"].map(id => {
    const draft = buildHumanCreatureDraftV3({
      id, displayName: id, description: "Reference pace fixture", level: 10,
      sourceStats: { force: 10, agility: 10, intelligence: 10, spirit: 10, endurance: 10, initiative: 10 },
      elements: [], resistances: {},
      capture: { capturable: true, captureRate: 30, spawnChance: 10, spawnTags: [], evolution: null },
      combat: { maxHp: 100, initialHp: 100, maxEnergy: 12, initialEnergy: 6,
        energyChargeAmount: 1, energyChargeIntervalMs: 1000, movementEnergyPerStep: 1, chargeTimeModifierPct: 0 },
      linkedSkillIds: ["strike"], profileId: "quadruped", displayScale: 1,
      visual: { frontAssetId: "pack:test:front", backAssetId: "pack:test:back", iconAssetId: "pack:test:icon" },
      sockets: [], audio: {}
    });
    return [id, { draft, loadout: buildHumanLoadoutV1({ creatureId: id, skillIds: ["strike"] }), statValues: null }];
  }));
  return { configuredCreatures, configuredSkills: new Map([["strike", skill]]),
    localCreatureIds: ["local"], opponentCreatureIds: ["enemy"], activePerTeam: 1, arenaId: "city",
    combatRules: { schema: "capture-combat-rules-editor-draft-v1", maxEnergy: 12, initialEnergy: 6,
      energyChargeAmount: 1, energyChargeIntervalMs: 1000, movementEnergyPerStep: 1, chargeTimeModifierPct: 0 } };
}

async function nativeSession(exported) {
  const native = adaptCaptureCombatExportStackV1(JSON.parse(JSON.stringify(exported)));
  const loaded = await loadCoop2v2CombatSource({ nativeCombatSource: native, fetchImpl() { throw Error("native export only"); } });
  const session = createCombatSession({ distance: "medium", fighters: loaded.fighters, skillSpeedMultiplier: loaded.skillSpeedMultiplier });
  return { loaded, session };
}

function timings({ loaded, session }) {
  const result = session.startSkill({ actorId: "local-1", targetId: "opponent-1", skill: loaded.skillsById.strike });
  assert.equal(result.ok, true);
  return [result.action.preparationMs, result.action.travelMs, result.action.recoveryMs];
}

test("new editor scenario defaults to the preferred native 0.5 pace throughout the real export chain", async () => {
  const input = fixture(), before = JSON.stringify([...input.configuredSkills.values()]);
  const exported = buildCaptureEditorCombatTestV1(input);
  assert.equal(exported.battle.skillSpeedMultiplier, 0.5);
  const native = await nativeSession(exported);
  assert.deepEqual(timings(native), [1200, 800, 600]);
  const recall = JSON.parse(await readFile(new URL("../../data/combat/commands/recall.command.json", import.meta.url), "utf8"));
  const recallSession = (await nativeSession(exported)).session;
  assert.equal(recallSession.startCommand({ actorId: "local-1", command: recall }).action.preparationMs, 2000);
  recallSession.advanceMs(1000);
  assert.equal(recallSession.snapshot().fighters["local-1"].energy, 7);
  assert.equal(JSON.stringify([...input.configuredSkills.values()]), before);
});

test("displayed x1 equals the old 0.5, x2 the old 1, and the native timing layer applies each only once", async () => {
  for (const [pace, expectedSpeed, expected] of [
    [0.5, 0.25, [2400, 1600, 1200]],
    [1, 0.5, [1200, 800, 600]],
    [2, 1, [600, 400, 300]],
    [4, 2, [300, 200, 150]]
  ]) {
    const speed = paceContract.captureCombatPaceToSkillSpeedV1(pace);
    assert.equal(speed, expectedSpeed);
    const exported = buildCaptureEditorCombatTestV1({ ...fixture(), skillSpeedMultiplier: speed });
    const native = await nativeSession(exported);
    assert.deepEqual(timings(native), expected);
  }
});

test("explicit native scenario speeds and legacy exports retain their original units and timings", async () => {
  for (const [speed, expected] of [[0.5, [1200, 800, 600]], [1, [600, 400, 300]], [2, [300, 200, 150]]]) {
    const exported = buildCaptureEditorCombatTestV1({ ...fixture(), skillSpeedMultiplier: speed });
    assert.equal(exported.battle.skillSpeedMultiplier, speed);
    assert.deepEqual(timings(await nativeSession(exported)), expected);
  }
  const old = JSON.parse(JSON.stringify(buildCaptureEditorCombatTestV1({ ...fixture(), skillSpeedMultiplier: 1 })));
  delete old.battle.skillSpeedMultiplier;
  const normalized = normalizeCaptureCombatExportV1(old);
  assert.equal(normalized.battle.skillSpeedMultiplier, 1);
  assert.deepEqual(timings(await nativeSession(normalized)), [600, 400, 300]);
});

test("reference pace refuses a nonpositive or nonfinite UI value before building a scenario", () => {
  for (const value of [0, -1, NaN, Infinity]) {
    assert.throws(() => paceContract.captureCombatPaceToSkillSpeedV1(value), RangeError);
  }
});
