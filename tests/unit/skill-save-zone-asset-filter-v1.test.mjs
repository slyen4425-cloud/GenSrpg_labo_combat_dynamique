import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHumanSkillDraftV1,
  captureSkillDraftHasUnsavedChangesV1,
  captureEditorAssetMatchesRoleV1
} from "../../src/ui/capture-editor-human-v2.js";

function ultimateFields() {
  return {
    id: "ultimate-fire-aura",
    name: "Aura ultime",
    description: "Zone persistante.",
    requiredLevel: 1,
    loadoutSlot: "ultimate",
    usageScopes: ["capture", "combat"],
    category: "offensive",
    form: "aura",
    element: "fire",
    approachMode: "none",
    energyCost: 5,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 0,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    effects: [
      {
        kind: "persistent_zone",
        targetScope: "all_enemies",
        zoneId: "ultimate-fire-aura",
        radius: "short",
        durationSeconds: 10,
        tickSeconds: 2,
        reactivation: "reinforce",
        maxActivations: 3,
        radiusGrowthSteps: 1,
        tickDamage: 5,
        channel: null
      }
    ],
    reaction: {
      blockForms: [],
      reflectForms: [],
      immuneElements: [],
      counterForms: [],
      evadeForms: [],
      evadeApproaches: []
    },
    projectileClash: { power: 0 },
    presentation: {
      iconAssetId: null,
      castAssetId: null,
      castDisplayScale: 1,
      travelAssetId: null,
      travelDisplayScale: 1,
      castLayerPlayer: "front",
      castLayerOpponent: "front",
      travelLayerPlayer: "front",
      travelLayerOpponent: "front",
      impactAssetId: null,
      impactDisplayScale: 1,
      zoneAssetId: "pack:capture:sprite-cast-fire-01",
      zoneDisplayScale: 1.5,
      socketId: null,
      castAudioAssetId: null,
      impactAudioAssetId: null
    }
  };
}

test("saved ultimate draft is clean even if a late mobile change event left the dirty flag stale", () => {
  const saved = buildHumanSkillDraftV1(ultimateFields());
  const configuredSkills = new Map([[saved.id, saved]]);
  const current = buildHumanSkillDraftV1(ultimateFields());

  assert.equal(
    captureSkillDraftHasUnsavedChangesV1({
      currentDraft: current,
      configuredSkills
    }),
    false
  );
});

test("canonical dirty check still detects a real skill modification", () => {
  const saved = buildHumanSkillDraftV1(ultimateFields());
  const configuredSkills = new Map([[saved.id, saved]]);
  const current = buildHumanSkillDraftV1({
    ...ultimateFields(),
    energyCost: 6
  });

  assert.equal(
    captureSkillDraftHasUnsavedChangesV1({
      currentDraft: current,
      configuredSkills
    }),
    true
  );
});

test("persistent-zone asset role excludes creature sprites and portraits", () => {
  for (const asset of [
    {
      id: "pack:capture:creature-loup-opponent-01",
      assetType: "sprite",
      mediaType: "image",
      category: "creature",
      tags: ["creature", "capture"],
      compatibility: { uses: ["editor"] }
    },
    {
      id: "pack:capture:creature-loup-icon-01",
      assetType: "portrait",
      mediaType: "image",
      category: "ui",
      tags: ["creature", "capture", "icon"],
      compatibility: { uses: ["editor"] }
    }
  ]) {
    assert.equal(
      captureEditorAssetMatchesRoleV1(asset, "zone"),
      false
    );
  }
});

test("persistent-zone asset role keeps skill FX and sprites", () => {
  for (const asset of [
    {
      id: "pack:capture:sprite-cast-fire-01",
      assetType: "sprite",
      mediaType: "image",
      category: "release",
      tags: ["skill", "cast", "fire", "capture"],
      compatibility: { uses: ["editor"] }
    },
    {
      id: "pack:capture:sprite-impact-fire-01",
      assetType: "sprite",
      mediaType: "image",
      category: "impact",
      tags: ["skill", "impact", "fire", "capture"],
      compatibility: { uses: ["editor"] }
    },
    {
      id: "pack:capture:fx-fireball-cast-01",
      assetType: "fx",
      mediaType: "image",
      category: "release",
      tags: ["fire", "magic", "cast", "capture"],
      compatibility: { uses: ["editor"] }
    }
  ]) {
    assert.equal(
      captureEditorAssetMatchesRoleV1(asset, "zone"),
      true
    );
  }
});
