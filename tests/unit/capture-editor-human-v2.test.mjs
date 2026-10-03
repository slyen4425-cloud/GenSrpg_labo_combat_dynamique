import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizedSocketPointV2,
  buildHumanCreatureDraftV2,
  buildHumanCreatureDraftV3,
  buildHumanSkillDraftV1,
  buildHumanLoadoutV1,
  buildHumanBattleSetupV1,
  buildHumanEditorExportV2,
  buildHumanEditorExportV3
} from "../../src/ui/capture-editor-human-v2.js";

function creatureFields() {
  return {
    id: "crea-loup",
    displayName: "Loup volcanique",
    description: "Créature de test.",
    level: 10,
    sourceStats: {
      force: 12,
      agility: 14,
      intelligence: 8,
      spirit: 9,
      endurance: 13,
      initiative: 15
    },
    elements: ["fire"],
    resistances: {
      fire: 35,
      water: -20
    },
    capture: {
      capturable: true,
      captureRate: 40,
      spawnChance: 20,
      spawnTags: ["fire"],
      evolution: null
    },
    combat: {
      maxHp: 60,
      initialHp: 60,
      maxEnergy: 12,
      initialEnergy: 2,
      energyChargeAmount: 1,
      energyChargeIntervalMs: 1800,
      movementEnergyPerStep: 2,
      chargeTimeModifierPct: 0
    },
    linkedSkillIds: ["fireball", "claw"],
    profileId: "quadruped",
    visual: {
      frontAssetId: "pack:capture:creature-loup-volcanique-opponent-01",
      backAssetId: "pack:capture:creature-loup-volcanique-player-01",
      iconAssetId: "pack:capture:creature-loup-volcanique-icon-01"
    },
    sockets: [
      {
        id: "mouth",
        label: "Bouche",
        front: { x: 0.52, y: 0.2 },
        back: { x: 0.48, y: 0.22 }
      }
    ],
    audio: {}
  };
}

function skillFields() {
  return {
    id: "fireball",
    name: "Boule de feu",
    description: "Projectile de feu.",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    category: "offensive",
    form: "projectile",
    element: "fire",
    approachMode: "none",
    energyCost: 3,
    preparationMs: 900,
    travelMs: 650,
    recoveryMs: 450,
    cooldownMs: 2800,
    allowedDistances: ["medium", "long"],
    targetRelations: ["enemy"],
    damage: 4,
    heal: 0,
    stunMs: 0,
    interruptsPreparation: false,
    reaction: {
      blockForms: [],
      reflectForms: [],
      immuneElements: [],
      counterForms: [],
      evadeForms: [],
      evadeApproaches: []
    },
    projectileClash: {
      mode: "mutual_cancel",
      group: "fire-orb",
      interactsWith: ["fire-orb"]
    },
    presentation: {
      iconAssetId: "core:icon-skill-fireball-01",
      castAssetId: null,
      travelAssetId: "pack:capture:sprite-projectile-fire-01",
      impactAssetId: "pack:capture:sprite-impact-fire-01",
      socketId: "mouth",
      castAudioAssetId: null,
      impactAudioAssetId: null
    }
  };
}

function opponentCreature() {
  return {
    schema: "capture-creature-editor-draft-v2",
    id: "crea-enemy",
    displayName: "Adversaire",
    description: "Fixture.",
    level: 1,
    sourceStats: {
      force: 10,
      agility: 10,
      intelligence: 10,
      spirit: 10,
      endurance: 10,
      initiative: 10
    },
    elements: [],
    resistances: [],
    capture: {
      capturable: true,
      captureRate: 30,
      spawnChance: 10,
      spawnTags: [],
      evolution: null
    },
    combat: {
      maxHp: 50,
      initialHp: 50,
      maxEnergy: 10,
      initialEnergy: 0,
      energyChargeAmount: 1,
      energyChargeIntervalMs: 2000,
      movementEnergyPerStep: 2,
      chargeTimeModifierPct: 0
    },
    skillIds: ["enemy-hit"],
    presentation: null
  };
}

function opponentSkill() {
  return {
    schema: "capture-skill-editor-draft-v1",
    id: "enemy-hit",
    description: "Fixture.",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    definition: {
      id: "enemy-hit",
      name: "Attaque",
      category: "offensive",
      form: "contact",
      element: null,
      approachMode: "ground",
      energyCost: 1,
      preparationMs: 500,
      travelMs: 500,
      recoveryMs: 300,
      cooldownMs: 1000,
      allowedDistances: ["short", "medium", "long"],
      targetRelations: ["enemy"],
      effect: { damage: 2 }
    },
    presentation: null
  };
}

function opponentLoadout() {
  return {
    schema: "capture-active-skill-loadout-v1",
    creatureId: "crea-enemy",
    slots: [
      { id: "slot-1", skillId: "enemy-hit" },
      { id: "slot-2", skillId: null },
      { id: "slot-3", skillId: null },
      { id: "slot-4", skillId: null }
    ]
  };
}

test("human editor converts touch/click geometry to normalized socket coordinates", () => {
  assert.deepEqual(
    normalizedSocketPointV2({
      clientX: 150,
      clientY: 250,
      rect: {
        left: 100,
        top: 200,
        width: 200,
        height: 100
      }
    }),
    { x: 0.25, y: 0.5 }
  );

  assert.deepEqual(
    normalizedSocketPointV2({
      clientX: 50,
      clientY: 500,
      rect: {
        left: 100,
        top: 200,
        width: 200,
        height: 100
      }
    }),
    { x: 0, y: 1 }
  );
});

test("creature views: human draft and Transfer preserve both views and common defaults without changing combat", async () => {
  const { exportCaptureCreatureTransferJsonV1, importCaptureTransferJsonV1 } = await import("../../src/adapters/input/capture/capture-entity-transfer-v1.js");
  const statRegistry = JSON.parse(await readFile(new URL("../../data/capture/monster-capture-stat-registry.v1.json", import.meta.url), "utf8"));
  const baseline = buildHumanCreatureDraftV3({ ...creatureFields(), displayScale: 1.2 });
  const draft = buildHumanCreatureDraftV3({
    ...creatureFields(), displayScale: 1.2,
    viewOverrides: {
      player: { displayScale: 1.5, position: { x: 20, y: -10 } },
      opponent: { displayScale: 0.8, position: { x: -15, y: 8 } }
    }
  });
  assert.deepEqual(draft.combat, baseline.combat);
  assert.deepEqual(draft.presentation.sockets, baseline.presentation.sockets);
  const record = {
    draft,
    statValues: { schema: "capture-creature-stat-values-v1", creatureId: draft.id, values: {} },
    loadout: { schema: "capture-active-skill-loadout-v1", creatureId: draft.id,
      slots: [ { id: "slot-1", skillId: "fireball" }, { id: "slot-2", skillId: "claw" },
        { id: "slot-3", skillId: null }, { id: "slot-4", skillId: null } ] }
  };
  const transfer = exportCaptureCreatureTransferJsonV1(record, { statRegistry });
  const restored = importCaptureTransferJsonV1(transfer, { statRegistry });
  assert.deepEqual(restored.value.draft.presentation, draft.presentation);
  assert.equal("viewOverrides" in baseline.presentation, false);
});


test("human preview shares one configured creature across both camps and keeps conflicting duplicates invalid", async () => {
  const draft = buildHumanCreatureDraftV3({
    ...creatureFields(), linkedSkillIds: ["fireball"],
    viewOverrides: {
      player: { displayScale: 1.2, position: { x: 20, y: -10 } },
      opponent: { displayScale: 0.8, position: { x: -15, y: 8 } }
    }
  });
  const loadout = buildHumanLoadoutV1({ creatureId: draft.id, skillIds: ["fireball", null, null, null] });
  const statRegistry = JSON.parse(await readFile(new URL("../../data/capture/monster-capture-stat-registry.v1.json", import.meta.url), "utf8"));
  const values = { schema: "capture-creature-stat-values-v1", creatureId: draft.id, values: {} };
  const input = {
    creatureDraft: draft, opponentCreatureDraft: structuredClone(draft),
    skillDrafts: [buildHumanSkillDraftV1(skillFields())], opponentSkillDrafts: [],
    loadout, opponentLoadout: structuredClone(loadout), statRegistry, statValues: [values, structuredClone(values)],
    battleSetup: buildHumanBattleSetupV1({ battleId: "shared-model-preview", arenaId: "city", localCreatureId: draft.id,
      opponentCreatureId: draft.id, localDisplayName: draft.displayName, opponentDisplayName: draft.displayName, activePerTeam: 1 })
  };
  const exported = buildHumanEditorExportV3(input);
  assert.equal(exported.creatures.length, 1);
  assert.equal(exported.actors.length, 2);
  assert.notEqual(exported.actors[0].id, exported.actors[1].id);
  assert.deepEqual(exported.creaturePresentations[0].viewOverrides, draft.presentation.viewOverrides);
  assert.throws(() => buildHumanEditorExportV3({ ...input, opponentCreatureDraft: { ...draft, displayName: "Conflicting definition" } }), /duplicate creature draft id/i);
});

test("human creature form produces CaptureCreatureEditorDraftV2 without technical JSON", () => {
  const draft = buildHumanCreatureDraftV2(creatureFields());

  assert.equal(draft.schema, "capture-creature-editor-draft-v2");
  assert.equal(draft.presentation.profileId, "quadruped");
  assert.equal(
    draft.presentation.visual.front.assetId,
    "pack:capture:creature-loup-volcanique-opponent-01"
  );
  assert.equal(draft.presentation.sockets[0].id, "mouth");
  assert.deepEqual(
    draft.skillIds,
    ["fireball", "claw"]
  );
});

test("human skill controls produce real SkillDefinition including cooldown", () => {
  const draft = buildHumanSkillDraftV1(skillFields());

  assert.equal(draft.definition.category, "offensive");
  assert.equal(draft.definition.form, "projectile");
  assert.equal(draft.definition.cooldownMs, 2800);
  assert.equal(draft.definition.effect.damage, 4);
  assert.equal(
    draft.presentation.visual.travel.anchor,
    "mouth"
  );
});

test("human loadout exposes four standard slots plus one ultimate slot", () => {
  const loadout = buildHumanLoadoutV1({
    creatureId: "crea-loup",
    skillIds: ["fireball", "claw", null, null]
  });

  assert.equal(loadout.slots.length, 5);
  assert.deepEqual(
    loadout.slots.map((slot) => slot.skillId),
    ["fireball", "claw", null, null, null]
  );
  assert.equal("equippedSkillIds" in loadout, false);
});

test("human battle controls use one data path for 1v1 or 2v2 only", () => {
  for (const activePerTeam of [1, 2]) {
    const draft = buildHumanBattleSetupV1({
      battleId: "human-preview",
      localCreatureId: "crea-loup",
      localDisplayName: "Loup",
      opponentCreatureId: "crea-enemy",
      opponentDisplayName: "Adversaire",
      arenaId: "city",
      activePerTeam
    });

    assert.equal(draft.teams[0].slots.length, activePerTeam);
    assert.equal(draft.teams[1].slots.length, activePerTeam);
    assert.equal(
      draft.teams.flatMap((team) => team.slots).length,
      activePerTeam * 2
    );
  }

  for (const activePerTeam of [3, 4]) {
    assert.throws(
      () => buildHumanBattleSetupV1({
        battleId: "human-preview",
        localCreatureId: "crea-loup",
        localDisplayName: "Loup",
        opponentCreatureId: "crea-enemy",
        opponentDisplayName: "Adversaire",
        activePerTeam
      }),
      /1v1|2v2/i
    );
  }
});
test("human editor composes the real Exporter V2 path", () => {
  const localSkill = buildHumanSkillDraftV1(skillFields());
  const creature = buildHumanCreatureDraftV2(creatureFields());
  const loadout = buildHumanLoadoutV1({
    creatureId: creature.id,
    skillIds: ["fireball", "claw", null, null]
  });
  const battleSetup = buildHumanBattleSetupV1({
    battleId: "human-preview",
    localCreatureId: creature.id,
    localDisplayName: creature.displayName,
    opponentCreatureId: "crea-enemy",
    opponentDisplayName: "Adversaire",
    arenaId: "city",
    activePerTeam: 2
  });

  const claw = buildHumanSkillDraftV1({
    ...skillFields(),
    id: "claw",
    name: "Griffe",
    form: "contact",
    element: null,
    approachMode: "ground",
    cooldownMs: 1200,
    projectileClash: {
      mode: "none",
      group: null,
      interactsWith: []
    },
    presentation: {
      iconAssetId: "core:icon-skill-claw-01",
      castAssetId: null,
      travelAssetId: null,
      impactAssetId: "pack:capture:sprite-impact-physical-01",
      socketId: null,
      castAudioAssetId: null,
      impactAudioAssetId: null
    }
  });

  const exported = buildHumanEditorExportV2({
    creatureDraft: creature,
    skillDrafts: [localSkill, claw],
    loadout,
    battleSetup,
    opponentCreatureDraft: opponentCreature(),
    opponentSkillDrafts: [opponentSkill()],
    opponentLoadout: opponentLoadout()
  });

  assert.equal(exported.schema, "capture-combat-export-v1");
  assert.equal(exported.actors.length, 4);
  assert.deepEqual(
    exported.creatures.find(
      (item) => item.id === "crea-loup"
    ).skillIds,
    ["fireball", "claw"]
  );
});

test("human editor page has three normal tabs and no JSON editor fields", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const marker of [
    'data-editor-tab="creature"',
    'data-editor-tab="combat"',
    'data-editor-tab="skills"',
    "data-creature-front-select",
    "data-creature-back-select",
    "data-creature-icon-select",
    "data-creature-profile",
    "data-socket-surface",
    "data-loadout-slot",
    "data-active-per-team",
    "data-skill-category",
    "data-skill-form",
    "data-skill-cooldown",
    "data-skill-cast-fx",
    "data-skill-travel-fx",
    "data-skill-impact-fx",
    "data-editor-validate"
  ]) {
    assert.equal(
      html.includes(marker),
      true,
      `human editor page must contain ${marker}`
    );
  }

  for (const forbidden of [
    "definitionJson",
    "presentationJson",
    "SkillDefinition JSON",
    "Présentation JSON"
  ]) {
    assert.equal(
      html.includes(forbidden),
      false,
      `human editor must not expose ${forbidden}`
    );
  }
});

test("human editor source does not own Runtime, renderer, storage or GenSrpG", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const forbidden of [
    "createCombatRuntime",
    "createCombatSession",
    "renderer/",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "captureFix",
    "Zombicide-40k",
    "is2v2"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `human editor UI must not contain ${forbidden}`
    );
  }

  assert.equal(
    source.includes("exportCaptureEditorDraftsToCombatExportV2"),
    true
  );
});


test("human editor wires selected creature views into socket placement surfaces", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.equal(
    source.includes("[data-socket-front-preview]"),
    true,
    "front creature preview must feed the front socket surface"
  );
  assert.equal(
    source.includes("[data-socket-back-preview]"),
    true,
    "back creature preview must feed the back socket surface"
  );
});


test("human editor routes asset-catalog listeners through the disposable listener owner", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.equal(
    source.includes("hydrateAssetCatalog(root, listen)"),
    true,
    "asset catalog hydration must register listeners through the mount-owned listener registrar"
  );
});
