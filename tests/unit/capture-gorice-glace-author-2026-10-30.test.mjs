import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import { importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { projectCaptureStatEffectsV1 } from "../../src/core/combat/capture-stat-effects-v1.js";

const repoFile = (path) => readFile(new URL("../../" + path, import.meta.url), "utf8");
const goricePath = "data/capture/showcase/gorice.capture-creature-transfer-v1.json";
const goriceSourcePath = "data/capture/source-exports/gensrpg-capture-creature-gorice-2026-10-30.json";
const goriceLatestSourcePath = "data/capture/source-exports/gensrpg-capture-creature-gorice-author-2026-11-01.json";
const loupPath = "data/capture/showcase/crea-loup.capture-creature-transfer-v1.json";
const loupSourcePath = "data/capture/source-exports/gensrpg-capture-creature-crea-loup-2026-10-21.json";

async function registry() {
  return normalizeCaptureStatRegistryV1(JSON.parse(
    await repoFile("data/capture/monster-capture-stat-registry.v1.json")
  ));
}

test("Glace author stat uses native ice channel: 1 point = +1% power and +1% resistance", async () => {
  const all = await registry();
  const glace = all.stats.filter((entry) => entry.id === "glace");
  assert.equal(glace.length, 1, "glace must be registered exactly once");
  assert.equal(glace[0].label, "Glace");
  assert.equal(glace[0].damageChannel, "ice");
  assert.equal(glace[0].resistanceChannel, "ice");
  assert.equal(glace[0].damagePctPerPoint, 1);
  assert.equal(glace[0].resistancePctPerPoint, 1);
  const effects = projectCaptureStatEffectsV1({
    registry: all,
    statValues: {
      schema: "capture-creature-stat-values-v1",
      creatureId: "gorice",
      values: { glace: 7 }
    }
  });
  assert.equal(effects.damagePctByChannel.ice, 7);
  assert.equal(effects.resistancePctByChannel.ice, 7);
});

test("Gorice historical author source is preserved and new author revision loads through Showcase", async () => {
  const historical = await repoFile(goriceSourcePath);
  const source = await repoFile(goriceLatestSourcePath);
  assert.equal(JSON.parse(historical).draft.id, "gorice");
  assert.equal(JSON.parse(historical).statValues.values.glace, 0, "2026-10-30 archive must remain unchanged");
  assert.notEqual(source, historical, "new author export must not rewrite historical provenance");
  const active = await repoFile(goricePath);
  assert.equal(active, source, "active author payload must match original export byte-for-byte");
  const imported = importCaptureTransferJsonV1(active, { statRegistry: await registry() });
  assert.equal(imported.kind, "creature");
  const record = imported.value;
  assert.equal(record.draft.id, "gorice");
  assert.equal(record.draft.presentation.subjectId, "gorice");
  assert.equal(record.statValues.creatureId, "gorice");
  assert.equal(record.loadout.creatureId, "gorice");
  assert.deepEqual(record.draft.elements, ["ice"]);
  assert.equal(record.statValues.values.glace, 15);
  assert.equal(record.statValues.values.health, 140);
  assert.equal(record.statValues.values.defense, 50);
  assert.equal(record.draft.combat.reaction.maxCharges, 2);
  assert.equal(record.draft.presentation.visual.front.assetId, "pack:capture:creature-gorille-des-glaces-opponent-01");
  assert.equal(record.draft.presentation.visual.back.assetId, "pack:capture:creature-gorille-des-glaces-player-01");
  assert.equal(record.draft.presentation.visual.icon.assetId, "pack:capture:creature-gorille-des-glaces-icon-01");
  assert.deepEqual(record.draft.skillIds, ["fireball", "boule_neige", "poing_givrant", "mur_de_glace"], "latest author export owns the new skillIds");
  assert.deepEqual(record.loadout.slots.map((slot) => slot.skillId), ["boule_neige", "poing_givrant", "mur_de_glace", null, null]);
});

test("Showcase has one unique Gorice entry and preserves Loup volcanique as a different creature", async () => {
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter((p) => p === goricePath).length, 1);
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter((p) => p === loupPath).length, 1);
  assert.equal(new Set(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1).size,
    CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.length);

  const [original, active] = await Promise.all([repoFile(loupSourcePath), repoFile(loupPath)]);
  assert.equal(active, original, "Loup original and its archived author source remain byte-identical");
  assert.equal(createHash("sha256").update(active).digest("hex"),
    "d757279d7dcc0ca413dc27fa700ea342aac62dbd12f89af8e2e7f60c869641eb",
    "Loup V9 must not be overwritten by Gorice or by any other author import");

  const loup = importCaptureTransferJsonV1(active, { statRegistry: await registry() }).value;
  assert.equal(loup.draft.id, "crea-loup");
  assert.equal(loup.draft.displayName, "Loup volcanique");
  assert.deepEqual(loup.draft.elements, ["fire"]);
  assert.equal(loup.statValues.values.health, 150);
  assert.equal(loup.draft.presentation.visual.front.assetId,
    "pack:capture:creature-loup-volcanique-opponent-01");
});
