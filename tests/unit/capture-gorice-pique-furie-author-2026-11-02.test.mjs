import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const read = (path) => readFileSync(new URL("../../" + path, import.meta.url), "utf8");
const paths = {
  gorice: "data/capture/showcase/gorice.capture-creature-transfer-v1.json",
  pique: "data/capture/showcase/pique_glace.capture-skill-transfer-v1.json",
  furie: "data/capture/showcase/furie_bestiale.capture-skill-transfer-v1.json",
  goriceArchive: "data/capture/source-exports/gensrpg-capture-creature-gorice-author-2026-11-02.json",
  piqueArchive: "data/capture/source-exports/gensrpg-capture-skill-pique_glace-author-2026-11-02.json",
  furieArchive: "data/capture/source-exports/gensrpg-capture-skill-furie_bestiale-author-2026-11-02.json"
};
const registry = normalizeCaptureStatRegistryV1(JSON.parse(read("data/capture/monster-capture-stat-registry.v1.json")));
const validate = (live, archive, checksum, kind) => {
  const source = read(archive);
  assert.equal(createHash("sha256").update(source).digest("hex"), checksum, "preserve supplied author source bytes");
  assert.deepEqual(JSON.parse(read(live)), JSON.parse(source), "published file must match author source");
  const imported = importCaptureTransferJsonV1(read(live), { statRegistry: registry });
  assert.equal(imported.kind, kind);
  return imported.value;
};

test("Gorice: latest author transfer equips Pique de glace and Furie bestiale on one creature", () => {
  const record = validate(paths.gorice, paths.goriceArchive,
    "77ddd3f10f315e2fdee56aa02b4f5579eb2fec5e11ba4676b9411b7bf376d9f2", "creature");
  assert.equal(record.draft.id, "gorice");
  assert.deepEqual(record.draft.skillIds,
    ["fireball","boule_neige","poing_givrant","mur_de_glace","pique_glace","furie_bestiale"]);
  assert.deepEqual(record.loadout.slots.map(x=>x.skillId),
    ["boule_neige","poing_givrant","mur_de_glace","pique_glace","furie_bestiale"]);
  assert.equal(record.statValues.values.glace, 15);
  assert.equal(record.statValues.values.health, 140);
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(p=>p===paths.gorice).length, 1);
});

test("Pique de glace: author transfer preserves canalisation and fixed ice spike trajectory", () => {
  const record = validate(paths.pique, paths.piqueArchive,
    "927cd4a1fb2a9f8e4b6e9517975bda7bec98f1935dc31db7b066aadb0df8648b", "skill");
  assert.equal(record.draft.id, "pique_glace");
  const d = record.draft.definition;
  assert.equal(d.channeling.maxTicks, 10);
  assert.equal(d.channeling.tickIntervalMs, 1000);
  assert.equal(d.channeling.effects[0].amount, 7);
  assert.equal(d.channeling.energyCostPerTick, 1);
  assert.equal(d.cooldownMs, 45000);
  const visual = record.draft.presentation.visual;
  assert.equal(visual.icon.assetId, "core:icon-skill-ice-spikes-01");
  assert.equal(visual.travel.trajectoryMode, "under_target");
  assert.equal(visual.travel.groundMotion, "fixed");
  assert.equal(visual.travel.groundOffsetYPx, 15);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===paths.pique).length, 1);
});

test("Furie bestiale: new ultimate enters same library and keeps the author status effects", () => {
  const record = validate(paths.furie, paths.furieArchive,
    "5454c262bc0fae990ac317b2cb1382cef87c9313fecc206e2e62e3c0c7b0fea7", "skill");
  assert.equal(record.draft.id, "furie_bestiale");
  assert.equal(record.draft.requiredLevel, 20);
  const d = record.draft.definition;
  assert.equal(d.loadoutSlot, "ultimate");
  assert.equal(d.energyCost, 6);
  assert.equal(d.maxUsesPerCombat, 1);
  assert.equal(d.effects[0].status.statId, "glace");
  assert.equal(d.effects[0].status.deltaPoints, 100);
  assert.equal(d.effects[1].status.amount, 10);
  assert.equal(d.effects[1].status.tickIntervalMs, 10000);
  assert.equal(record.draft.presentation.statusVisuals["status-1"].sprite.assetId,
    "pack:capture:sprite-air-wind-charge-01");
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===paths.furie).length, 1);
});

test("Showcase keeps unique creature and skill IDs, including installed Gorice loadout", () => {
  assert.equal(new Set(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1).size, CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.length);
  assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size, CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
  for (const skill of ["pique_glace", "furie_bestiale"]) {
    assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p.endsWith("/"+skill+".capture-skill-transfer-v1.json")).length, 1);
  }
});
