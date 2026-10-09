import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { captureActiveSkillSlotsForLevelV1 } from "../../src/contracts/capture-progression-rules-v1.js";
import { projectCapturePlannedLoadoutsToCombatV1 } from "../../src/adapters/input/capture/capture-planned-loadout-to-combat-v1.js";
import { buildHumanProgressionRulesV1 } from "../../src/ui/capture-editor-human-v2.js";
import { buildCaptureEditorCombatTestV1 } from "../../src/ui/capture-editor-combat-test-v1.js";
import { exportCaptureEditorDraftsToCombatExportV3 } from "../../src/adapters/input/capture/capture-editor-exporter-v3.js";

const skillIds = ["skill-1", "skill-2", "skill-3", "skill-4", "skill-ultimate"];

function creature(id, level = 1) {
  return {
    schema: "capture-creature-editor-draft-v3", id, displayName: id, description: id,
    level,
    sourceStats: { force: 10, agility: 10, intelligence: 10, spirit: 10, endurance: 10, initiative: 10 },
    elements: [], resistances: [],
    capture: { capturable: true, captureRate: 30, spawnChance: 10, spawnTags: [], evolution: null },
    combat: { maxHp: 40, initialHp: 40, maxEnergy: 10, initialEnergy: 10,
      energyChargeAmount: 0, energyChargeIntervalMs: 2000, movementEnergyPerStep: 1, chargeTimeModifierPct: 0 },
    skillIds, presentation: null
  };
}

function skill(id, ultimate = false) {
  return {
    schema: "capture-skill-editor-draft-v1", id, description: id, requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    definition: {
      id, name: id, category: "offensive", form: "contact",
      loadoutSlot: ultimate ? "ultimate" : "standard",
      element: null, approachMode: "ground", energyCost: 1, preparationMs: 100,
      travelMs: 100, recoveryMs: 0, cooldownMs: 0,
      allowedDistances: ["short", "medium", "long"], targetRelations: ["enemy"],
      effect: { damage: 1 }
    },
    presentation: null
  };
}

function loadout(id) {
  return { schema: "capture-active-skill-loadout-v1", creatureId: id,
    slots: skillIds.map((skillId, index) => ({ id: index === 4 ? "slot-ultimate" : "slot-" + (index + 1), skillId })) };
}

const combatRules = {
  schema: "capture-combat-rules-editor-draft-v1",
  maxEnergy: 10, initialEnergy: 10, energyChargeAmount: 0,
  energyChargeIntervalMs: 2000, movementEnergyPerStep: 1, chargeTimeModifierPct: 0
};

function battle() {
  return {
    schema: "capture-battle-setup-editor-draft-v1", id: "progression-check", localActorId: "local-1",
    teams: [
      { id: "local-team", slots: [{ actorId: "local-1", creatureId: "crea-local", displayName: "Local", controllerId: "human-local", roster: null }] },
      { id: "enemy-team", slots: [{ actorId: "opponent-1", creatureId: "crea-enemy", displayName: "Enemy", controllerId: "ai-enemy", roster: null }] }
    ]
  };
}

const skills = skillIds.map((id, i) => skill(id, i === 4));

async function rules() {
  return JSON.parse(await readFile(new URL("../../data/capture/monster-capture-progression-rules.v1.json", import.meta.url), "utf8"));
}

test("default progression unlocks slots 1/2/3/4/5 at precisely levels 1/5/10/15/20", async () => {
  const actual = await rules();
  assert.equal(actual.maxActiveSkills, 5);
  assert.deepEqual(actual.slotUnlockSchedule, [
    { level: 1, slots: 1 }, { level: 5, slots: 2 }, { level: 10, slots: 3 },
    { level: 15, slots: 4 }, { level: 20, slots: 5 }
  ]);
  assert.deepEqual([1, 4, 5, 9, 10, 14, 15, 19, 20, 50]
    .map(level => captureActiveSkillSlotsForLevelV1(actual, level)), [1,1,2,2,3,3,4,4,5,5]);
  assert.equal(buildHumanProgressionRulesV1(actual).maxActiveSkills, 5);
});

test("four standards and one ultimate are unlocked without creating another standard slot", async () => {
  const progressionRules = await rules();
  for (const [level, ids] of [
    [1, skillIds.slice(0,1)], [5, skillIds.slice(0,2)],
    [10, skillIds.slice(0,3)], [15, skillIds.slice(0,4)],
    [20, skillIds]
  ]) {
    const result = projectCapturePlannedLoadoutsToCombatV1({
      progressionRules, creatureDrafts: [creature("crea-local", level)],
      skillDrafts: skills, loadouts: [loadout("crea-local")]
    });
    assert.deepEqual(result[0].slots.map(s => s.skillId).filter(Boolean), ids, "level " + level);
    assert.equal(result[0].slots.length, 5);
  }
});

test("editor combat preview defaults to level 20 for all combat participants without rewriting authored creature levels", async () => {
  const progressionRules = await rules();
  const locals = new Map([
    ["crea-local", { draft: creature("crea-local", 1), loadout: loadout("crea-local") }],
    ["crea-enemy", { draft: creature("crea-enemy", 5), loadout: loadout("crea-enemy") }]
  ]);
  const original = [...locals.values()].map(({draft, loadout}) => JSON.stringify({draft, loadout}));
  const configuredSkills = new Map(skills.map(d => [d.id, d]));
  const input = {
    configuredCreatures: locals, configuredSkills,
    localCreatureIds: ["crea-local"], opponentCreatureIds: ["crea-enemy"],
    activePerTeam: 1, arenaId: null, combatRules, progressionRules
  };
  const preview = buildCaptureEditorCombatTestV1(input);
  for (const member of preview.creatures) {
    assert.equal(member.level, 20);
    assert.deepEqual(member.skillIds, skillIds);
  }
  assert.deepEqual([...locals.values()].map(({draft,loadout}) => JSON.stringify({draft,loadout})), original);
  const atOne = buildCaptureEditorCombatTestV1({...input, previewLevel: 1});
  assert.deepEqual(atOne.creatures.map(c => c.level), [1,1]);
  assert.deepEqual(atOne.creatures.map(c => c.skillIds), [["skill-1"], ["skill-1"]]);
  assert.deepEqual([...locals.values()].map(({draft,loadout}) => JSON.stringify({draft,loadout})), original);
  const realGame = exportCaptureEditorDraftsToCombatExportV3({
    battleSetup: battle(), creatureDrafts: [...locals.values()].map(r=>r.draft),
    skillDrafts: skills, loadouts: [...locals.values()].map(r=>r.loadout), progressionRules
  });
  assert.deepEqual(realGame.creatures.map(c => c.level), [1,5]);
  assert.deepEqual(realGame.creatures.map(c => c.skillIds), [["skill-1"], ["skill-1","skill-2"]]);
});

test("editor exposes visible level 20 preview selector but authored new creatures retain level 1", async () => {
  const html = await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url), "utf8");
  assert.match(html, /data-test-creature-level[^>]*value="20"|value="20"[^>]*data-test-creature-level/);
  assert.match(html, /data-creature-level[^>]*value="1"|value="1"[^>]*data-creature-level/);
  const ui = await readFile(new URL("../../src/ui/capture-editor-human-v2.js", import.meta.url), "utf8");
  assert.match(ui, /data-test-creature-level/);
});
