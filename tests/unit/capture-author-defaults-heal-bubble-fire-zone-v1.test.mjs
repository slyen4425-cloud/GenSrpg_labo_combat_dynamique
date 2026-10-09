import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1, exportCaptureCreatureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {buildCaptureCreatureHistoricalLoadoutV1} from "../../src/catalogs/capture-creature-historical-loadout-v1.js";
import {buildCaptureEditorCombatTestV1} from "../../src/ui/capture-editor-combat-test-v1.js";
import {buildHumanSkillDraftV1, humanSkillEditorFieldsFromDraftV1} from "../../src/ui/capture-editor-human-v2.js";
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";

const readJson = async file => JSON.parse(await readFile(new URL("../../" + file, import.meta.url), "utf8"));
const bubbleId = "pack:capture:sprite-water-healing-bubble-01";
const fireId = "cap_fire_atk_6";

test("the source-owned identities of all 110 historical entries and 3 showcase transfers start at level 1", async () => {
  const catalog = await readJson("data/capture/monster-capture-creatures.v1.json");
  assert.equal(catalog.entries.length, 110);
  assert.equal(catalog.entries.every(c => c.level === 1), true);
  const paths = [
    "data/capture/showcase/crea-loup.capture-creature-transfer-v1.json",
    "data/capture/showcase/crea_maraileron.capture-creature-transfer-v1.json",
    "data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json"
  ];
  for (const path of paths) {
    const transfer = await readJson(path);
    assert.equal(transfer.draft.level, 1, path);
    assert.deepEqual(importCaptureTransferJsonV1(
      exportCaptureCreatureTransferJsonV1(
        importCaptureTransferJsonV1(JSON.stringify(transfer)).value
      )
    ).value.draft, importCaptureTransferJsonV1(JSON.stringify(transfer)).value.draft);
  }
});

test("planned historical loadout keeps all 4 future moves even with source identity level 1; runtime alone gates them", async () => {
  const catalog = await readJson("data/capture/monster-capture-creatures.v1.json");
  const creature = catalog.entries.find(c => c.id === "crea_maraileron");
  assert.equal(creature.level, 1);
  const planned = buildCaptureCreatureHistoricalLoadoutV1({
    creatureId: creature.id, level: creature.level,
    abilityIds: creature.abilityIds,
    runtimeSkillIds: new Set(creature.abilityIds),
    selectionMode: "planned"
  });
  assert.deepEqual(planned.historicalActiveIds, creature.abilityIds.slice(0, 4));
  assert.deepEqual(planned.loadout.slots.map(x => x.skillId),
    [...creature.abilityIds.slice(0, 4), null]);
});

test("latest water-healing bubble replaces only the authored persistent status sprite", async () => {
  const file = await readJson("data/capture/showcase/lib_aqua_heal.capture-skill-transfer-v1.json");
  const draft = importCaptureTransferJsonV1(JSON.stringify(file)).value.draft;
  assert.equal(draft.id, "lib_aqua_heal");
  assert.equal(draft.requiredLevel, 15);
  assert.equal(draft.definition.effects[0].amount, 5);
  assert.equal(draft.definition.effects[1].status.amount, 3);
  assert.equal(draft.definition.effects[1].status.tickIntervalMs, 3000);
  assert.equal(draft.definition.effects[1].status.durationMs, 20000);
  assert.equal(draft.presentation.statusVisuals.lib_aqua_heal_regeneration.sprite.assetId, bubbleId);
  assert.equal(draft.presentation.statusVisuals.lib_aqua_heal_regeneration.sprite.opacity, 0.45);
  assert.equal(draft.presentation.statusVisuals.lib_aqua_heal_regeneration.sprite.displayScale, 1.7);
  assert.equal(draft.presentation.visual.icon.assetId, "core:icon-skill-recall-01");
  const restored = importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft)).value.draft;
  assert.deepEqual(restored, draft);
  assert.deepEqual(buildHumanSkillDraftV1(humanSkillEditorFieldsFromDraftV1(draft)).presentation,
    draft.presentation);
  const resolved = createCaptureSkillPresentationAssetsV2({
    skillPresentations: {[draft.id]: draft.presentation},
    assetForId: id => ({assetId: id, url: "/water-bubble-atlas.webp", frameCount: 20, frameMs: 70})
  });
  const status = resolved.statusPresentationFor("lib_aqua_heal_regeneration", {sourceSkillId: draft.id, view: "player"});
  assert.equal(status.sprite.assetId, bubbleId);
  assert.equal(status.sprite.frameCount, 20);
  assert.equal(status.sprite.opacity, 0.45);
});

test("the existing level-20 ultimate Tempête de flammes preserves its zone and becomes 50 percent opaque", async () => {
  const file = await readJson("data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json");
  const draft = importCaptureTransferJsonV1(JSON.stringify(file)).value.draft;
  assert.equal(draft.id, fireId);
  assert.equal(draft.definition.name, "Tempête de flammes");
  assert.equal(draft.requiredLevel, 20);
  assert.equal(draft.definition.loadoutSlot, "ultimate");
  assert.equal(draft.presentation.visual.aura.assetId, "pack:capture:sprite-fire-zone-loop-01");
  assert.equal(draft.presentation.visual.aura.opacity, 0.5);
  assert.equal(draft.definition.effects[0].kind, "persistent_zone");
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft)).value.draft, draft);
  const view = createCaptureSkillPresentationAssetsV2({
    skillPresentations: {[draft.id]: draft.presentation},
    assetForId: id => ({assetId:id,url:"/fire-zone.webp",frameCount:8,frameMs:90})
  }).presentationForSkill(draft.id, {view:"player"});
  assert.equal(view.persistentZone.opacity, 0.5);
  assert.equal(view.persistentZoneLayer, "behind");
});
