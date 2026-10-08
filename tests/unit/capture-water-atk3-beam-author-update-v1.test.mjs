import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  importCaptureTransferJsonV1,
  exportCaptureSkillTransferJsonV1,
  planCaptureTransferImportV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  buildCaptureEditorDatabaseV1,
  applyCaptureTransferPlanToEditorStateV1
} from "../../src/ui/capture-editor-file-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { demoPresentationAssets } from "../../examples/dom-demo/demo-assets.js";
import { PRIVATE_AUDIO_RUNTIME_ASSET_IDS_V1 } from "../../src/assets/private-audio-runtime-library-v1.js";

const PRESET = "data/capture/showcase/cap_water_atk_3.capture-skill-transfer-v1.json";
async function json(path) {
  return JSON.parse(await readFile(new URL("../../" + path, import.meta.url), "utf8"));
}

test("Jet pressurisé Showcase author export is one exact Beam skill with three linked phases and two sounds", async () => {
  const saved = await json(PRESET);
  const transfer = importCaptureTransferJsonV1(JSON.stringify(saved));
  assert.equal(transfer.kind, "skill");
  const draft = transfer.value.draft;
  assert.equal(saved.schema, "capture-skill-transfer-v1");
  assert.equal(draft.id, "cap_water_atk_3");
  assert.equal(draft.definition.id, draft.id);
  assert.equal(draft.definition.name, "Jet pressurisé");
  assert.equal(draft.requiredLevel, 10);
  assert.equal(draft.definition.form, "beam");
  assert.equal(draft.definition.loadoutSlot, "standard");
  assert.equal(draft.definition.projectileClash.power, 0);
  assert.equal(draft.definition.energyCost, 6);
  assert.equal(draft.definition.preparationMs, 2500);
  assert.equal(draft.definition.travelMs, 900);
  assert.equal(draft.definition.recoveryMs, 300);
  assert.equal(draft.definition.cooldownMs, 30000);
  assert.deepEqual(draft.definition.effects, [{
    kind: "damage", targetScope: "target", amount: 25, channel: "water",
    ignoreResistancePct: 100, ignoreDamageReductionPct: 100
  }]);

  const visuals = draft.presentation.visual;
  assert.equal(Object.hasOwn(saved.draft.presentation.visual, "cast"), false);
  assert.equal(visuals.beamStart.assetId, "pack:capture:sprite-pressurized-jet-beam-start-01");
  assert.equal(visuals.beamStart.anchor, "mouth");
  assert.equal(visuals.beamStart.displayScale, 1.2);
  assert.equal(visuals.beamStart.playbackMode, "loop");
  assert.equal(visuals.travel.assetId, "pack:capture:sprite-pressurized-jet-beam-body-01");
  assert.equal(visuals.travel.displayScale, 0.7);
  assert.equal(visuals.travel.playbackMode, "stretch");
  assert.equal(visuals.impact.assetId, "pack:capture:sprite-impact-water-01");
  assert.equal(visuals.impact.displayScale, 1.3);
  assert.equal(visuals.impact.durationMs, 500);
  assert.equal(draft.presentation.audio.travel.assetId, "gensrpg:sound:xel-48520d94");
  assert.equal(draft.presentation.audio.travel.loop, true);
  assert.equal(draft.presentation.audio.impact.assetId, "gensrpg:sound:sanctuary-17b7fa2c");
  assert.equal(draft.presentation.audio.impact.loop, false);

  for (const slot of ["beamStart", "travel", "impact"]) {
    assert.ok(demoPresentationAssets.asset(visuals[slot].assetId), "Unresolved visual " + slot);
  }
  for (const phase of ["travel", "impact"]) {
    assert.ok(PRIVATE_AUDIO_RUNTIME_ASSET_IDS_V1.includes(draft.presentation.audio[phase].assetId),
      "Unresolved audio " + phase);
  }

  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(path => path === PRESET).length, 1);
  assert.deepEqual(
    importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft)).value.draft,
    draft,
    "Author export must round-trip without silently changing author values"
  );
});

test("Jet pressurisé updates one configuredSkills record without changing Maraileron's loadout", async () => {
  const registry = normalizeCaptureStatRegistryV1(await json("data/capture/monster-capture-stat-registry.v1.json"));
  const progressionRules = normalizeCaptureProgressionRulesV1(await json("data/capture/monster-capture-progression-rules.v1.json"));
  const transfer = importCaptureTransferJsonV1(JSON.stringify(await json(PRESET)));
  const sourceCreature = await json("data/capture/showcase/crea_maraileron.capture-creature-transfer-v1.json");
  const expectedLoadout = structuredClone(sourceCreature.loadout);
  const configuredCreatures = new Map([["crea_maraileron", sourceCreature]]);
  const oldDraft = {
    ...transfer.value.draft,
    definition: { ...transfer.value.draft.definition, form: "projectile" }
  };
  const configuredSkills = new Map([["cap_water_atk_3", oldDraft]]);
  const originalSize = configuredSkills.size;
  const plan = planCaptureTransferImportV1({
    currentDatabase: buildCaptureEditorDatabaseV1({
      statRegistry: registry, progressionRules, configuredCreatures: new Map(),
      configuredSkills, metadata: { producer: "author-beam-skill-test" }
    }),
    transfer, mode: "replace"
  });
  assert.equal(plan.action, "replace-skill");
  applyCaptureTransferPlanToEditorStateV1({
    plan, configuredCreatures, configuredSkills,
    statRegistry: registry, progressionRules
  });
  assert.equal(configuredSkills.size, originalSize);
  assert.equal(configuredSkills.get("cap_water_atk_3").definition.form, "beam");
  assert.deepEqual(configuredCreatures.get("crea_maraileron").loadout, expectedLoadout);
  assert.equal(expectedLoadout.slots[2].skillId, "cap_water_atk_3");
});
