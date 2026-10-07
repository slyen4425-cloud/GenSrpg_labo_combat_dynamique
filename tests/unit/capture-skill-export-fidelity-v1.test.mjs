import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildHumanSkillDraftV1,
  humanSkillEditorFieldsFromDraftV1,
  syncCaptureSkillSocketOptionsV1
} from "../../src/ui/capture-editor-human-v2.js";
import {
  readSkillSpriteControlsV1,
  writeSkillSpriteControlsV1
} from "../../src/ui/capture-editor-sprite-controls-v1.js";
import {
  exportCaptureSkillTransferJsonV1,
  importCaptureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";

function presentationFields() {
  return {
    bindingVersion: 9,
    iconAssetId: "pack:capture:icon-skill-fireball-01",
    socketId: "mouth",

    castAssetId: "pack:capture:sprite-fireball-2-cast-01",
    castDisplayScale: 1.6,
    castPlaybackMode: "loop",
    castOffsetX: 30,
    castOffsetY: 0,
    castOffsetMode: "mirror_x",
    castOpponentOffsetX: -30,
    castOpponentOffsetY: 0,
    castLayerPlayer: "behind",
    castLayerOpponent: "front",

    travelAssetId: "pack:capture:sprite-fireball-travel-01",
    travelDisplayScale: 2.5,
    travelPlaybackMode: "loop",
    travelLayerPlayer: "behind",
    travelLayerOpponent: "front",

    impactAssetId: "pack:capture:sprite-fireball-2-impact-01",
    impactDisplayScale: 1.7,
    impactDurationMs: 420,
    impactPlaybackMode: "once",
    impactOffsetX: 17,
    impactOffsetY: -9,
    impactOffsetMode: "custom",
    impactOpponentOffsetX: -23,
    impactOpponentOffsetY: -7,
    impactLayerPlayer: "front",
    impactLayerOpponent: "behind",

    zoneAssetId: "pack:capture:sprite-fire-zone-01",
    zoneDisplayScale: 1.25,
    zoneDisplayScaleX: 1.4,
    zoneDisplayScaleY: 0.9,
    zonePlaybackMode: "stretch",
    zoneOffsetX: 14,
    zoneOffsetY: 6,
    zoneOffsetMode: "same",
    zoneOpponentOffsetX: 14,
    zoneOpponentOffsetY: 6,
    zoneLayerPlayer: "behind",
    zoneLayerOpponent: "front",

    castAudioAssetId: "gensrpg:sound:effect-135ee2ed",
    travelAudioAssetId: "gensrpg:sound:genrpg-pack2-a30f1071",
    impactAudioAssetId: "gensrpg:sound:genrpg-pack2-a3d02c0f",
    zoneAudioAssetId: "gensrpg:sound:test-aura",

    fxGlowColor: "#ff6a1f",
    fxGlowStrength: 0.85,
    fxGlowRadiusPx: 32,
    impactFlashColor: "#fff2c2",
    impactFlashOpacity: 0.8,
    impactFlashDurationMs: 120,
    impactFlashScale: 1.65,
    impactShakeAmplitudePx: 5,
    impactShakeDurationMs: 150,
    castBurstColor: "#ffb347",
    castBurstCount: 7,
    castBurstSpreadPx: 48,
    castBurstSizePx: 7,
    castBurstRisePx: 34,
    castBurstDurationMs: 580,
    castBurstOpacity: 0.8,
    projectileTrailColor: "#ff6a1f",
    projectileTrailCount: 7,
    projectileTrailLengthPx: 56,
    projectileTrailSizePx: 7,
    projectileTrailOpacity: 0.8,
    projectileTrailAnchorX: 0.37,
    projectileTrailAnchorY: 0.63,
    impactBurstColor: "#ffd27a",
    impactBurstCount: 12,
    impactBurstSpreadPx: 72,
    impactBurstSizePx: 9,
    impactBurstDurationMs: 380,
    impactBurstOpacity: 0.9,
    aftermathSmokeColor: "#594943",
    aftermathSmokeCount: 6,
    aftermathSmokeSpreadPx: 58,
    aftermathSmokeSizePx: 36,
    aftermathSmokeRisePx: 56,
    aftermathSmokeDurationMs: 1250,
    aftermathSmokeOpacity: 0.64,

    statusVisuals: {
      burn: {
        mode: "both",
        tintColor: "#ff5a24",
        tintOpacity: 0.35,
        sprite: {
          assetId: "pack:capture:sprite-fire-zone-01",
          displayScale: 1.1,
          opacity: 0.75,
          playbackMode: "loop",
          offsetX: 8,
          offsetY: -4,
          offsetMode: "custom",
          opponentOffsetX: -11,
          opponentOffsetY: -5,
          layerByView: {
            player: "front",
            opponent: "behind"
          }
        }
      }
    }
  };
}

function completeSkillFields() {
  return {
    id: "export-fidelity-test",
    name: "Export Fidelity",
    description: "Sentinelle de fidélité export/import.",
    requiredLevel: 5,
    usageScopes: ["capture", "combat"],
    category: "offensive",
    form: "projectile",
    loadoutSlot: "ultimate",
    element: "fire",
    approachMode: "none",
    hitPresenceStates: ["surface", "airborne"],
    dodgeable: false,
    targetLocations: ["active", "reserve"],
    energyCost: 6,
    preparationMs: 2500,
    travelMs: 1300,
    recoveryMs: 400,
    cooldownMs: 20000,
    maxUsesPerCombat: 3,
    activationRequirements: {
      mode: "all",
      conditions: []
    },
    effects: [
      {
        kind: "damage",
        targetScope: "target",
        amount: 25,
        channel: "fire"
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
    projectileClash: {
      power: 4
    },
    presentation: presentationFields()
  };
}

function selectorRoot(initial = {}) {
  const nodes = new Map();
  for (const [selector, value] of Object.entries(initial)) {
    nodes.set(selector, { value: String(value) });
  }
  return {
    dataset: {},
    querySelector(selector) {
      return nodes.get(selector) ?? null;
    },
    node(selector) {
      return nodes.get(selector) ?? null;
    }
  };
}

test("Fireball regression: DOM sprite translator keeps horizontal 30 as X and vertical 0 as Y", () => {
  const root = selectorRoot({
    "[data-skill-cast-playback]": "loop",
    "[data-skill-cast-offset-x]": 30,
    "[data-skill-cast-offset-y]": 0,
    "[data-skill-cast-offset-mode]": "mirror_x",
    "[data-skill-cast-opponent-offset-x]": -30,
    "[data-skill-cast-opponent-offset-y]": 0,
    "[data-skill-cast-layer-player]": "behind",
    "[data-skill-cast-layer-opponent]": "front"
  });

  const fields = readSkillSpriteControlsV1(root);

  assert.equal(fields.castOffsetX, 30);
  assert.equal(fields.castOffsetY, 0);
  assert.equal(fields.castOffsetMode, "mirror_x");
  assert.equal(fields.castOpponentOffsetX, -30);
  assert.equal(fields.castOpponentOffsetY, 0);
});

test("sprite controls read/write round-trip keeps playback, X/Y, side mode, opponent offsets and layers", () => {
  const root = selectorRoot(
    Object.fromEntries(
      ["cast", "impact", "zone"].flatMap((role) => [
        [`[data-skill-${role}-playback]`, "once"],
        [`[data-skill-${role}-offset-x]`, 0],
        [`[data-skill-${role}-offset-y]`, 0],
        [`[data-skill-${role}-offset-mode]`, "same"],
        [`[data-skill-${role}-opponent-offset-x]`, 0],
        [`[data-skill-${role}-opponent-offset-y]`, 0],
        [`[data-skill-${role}-layer-player]`, "front"],
        [`[data-skill-${role}-layer-opponent]`, "front"]
      ])
    )
  );

  const expected = {
    bindingVersion: 9,
    castPlaybackMode: "loop",
    castOffsetX: 30,
    castOffsetY: -5,
    castOffsetMode: "mirror_x",
    castOpponentOffsetX: -30,
    castOpponentOffsetY: -5,
    castLayerPlayer: "behind",
    castLayerOpponent: "front",
    impactPlaybackMode: "stretch",
    impactOffsetX: 11,
    impactOffsetY: 13,
    impactOffsetMode: "custom",
    impactOpponentOffsetX: -17,
    impactOpponentOffsetY: 19,
    impactLayerPlayer: "front",
    impactLayerOpponent: "behind",
    zonePlaybackMode: "loop",
    zoneOffsetX: 21,
    zoneOffsetY: 23,
    zoneOffsetMode: "same",
    zoneOpponentOffsetX: 21,
    zoneOpponentOffsetY: 23,
    zoneLayerPlayer: "behind",
    zoneLayerOpponent: "front"
  };

  writeSkillSpriteControlsV1(root, expected);
  const actual = readSkillSpriteControlsV1(root);

  for (const [key, value] of Object.entries(expected)) {
    assert.equal(actual[key], value, key);
  }
});

test("skill transfer round-trip preserves the complete durable draft and presentation", () => {
  const firstDraft = buildHumanSkillDraftV1(completeSkillFields());
  const firstJson = exportCaptureSkillTransferJsonV1(firstDraft);
  const imported = importCaptureTransferJsonV1(firstJson);

  assert.equal(imported.kind, "skill");

  const editorFields = humanSkillEditorFieldsFromDraftV1(imported.value.draft);
  const secondDraft = buildHumanSkillDraftV1(editorFields);
  const secondJson = exportCaptureSkillTransferJsonV1(secondDraft);

  assert.deepEqual(
    JSON.parse(secondJson).draft,
    JSON.parse(firstJson).draft
  );

  const cast = JSON.parse(secondJson).draft.presentation.visual.cast;
  assert.equal(cast.anchor, "mouth");
  assert.equal(cast.offsetX, 30);
  assert.equal(cast.offsetY, 0);
});

test("socket synchronization never silently resets an authored skill socket to center", () => {
  const result = syncCaptureSkillSocketOptionsV1({
    existingValue: "mouth",
    existingOptions: [
      { value: "", label: "Centre par défaut" },
      { value: "mouth", label: "Bouche" }
    ],
    sockets: []
  });

  assert.equal(result.value, "mouth");
  assert.equal(
    result.options.some((option) => option.value === "mouth"),
    true
  );
});

test("current skill editor keeps the durable presentation controls under export coverage", async () => {
  const [html, humanSource, spriteSource] = await Promise.all([
    readFile(
      new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../../src/ui/capture-editor-human-v2.js", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../../src/ui/capture-editor-sprite-controls-v1.js", import.meta.url),
      "utf8"
    )
  ]);

  for (const marker of [
    "data-skill-socket",
    "data-skill-cast-scale",
    "data-skill-travel-scale",
    "data-skill-travel-playback",
    "data-skill-impact-scale",
    "data-skill-impact-duration",
    "data-skill-zone-scale",
    "data-skill-zone-scale-x",
    "data-skill-zone-scale-y",
    "data-skill-cast-audio",
    "data-skill-travel-audio",
    "data-skill-impact-audio",
    "data-skill-zone-audio",
    "data-skill-fx-glow-color",
    "data-skill-impact-flash-opacity",
    "data-skill-cast-burst-count",
    "data-skill-projectile-trail-count",
    "data-skill-impact-burst-count",
    "data-skill-aftermath-smoke-count"
  ]) {
    assert.match(html, new RegExp(marker));
    assert.match(humanSource, new RegExp(marker));
  }

  for (const role of ["cast", "impact", "zone"]) {
    for (const suffix of [
      "playback",
      "offset-x",
      "offset-y",
      "offset-mode",
      "opponent-offset-x",
      "opponent-offset-y",
      "layer-player",
      "layer-opponent"
    ]) {
      assert.match(
        html,
        new RegExp("data-skill-" + role + "-" + suffix)
      );
    }
  }

  for (const controlName of [
    "PlaybackMode",
    "OffsetX",
    "OffsetY",
    "OffsetMode",
    "OpponentOffsetX",
    "OpponentOffsetY",
    "LayerPlayer",
    "LayerOpponent"
  ]) {
    assert.match(spriteSource, new RegExp(controlName));
  }
});
