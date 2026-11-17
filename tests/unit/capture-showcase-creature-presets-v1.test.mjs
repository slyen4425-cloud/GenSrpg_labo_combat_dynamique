import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1
} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {
  importCaptureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  normalizeCaptureStatRegistryV1
} from "../../src/contracts/capture-stat-registry-v1.js";

const registry = normalizeCaptureStatRegistryV1(
  JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/monster-capture-stat-registry.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  )
);

async function importedPreset(file) {
  const jsonText = await readFile(
    new URL("../../" + file, import.meta.url),
    "utf8"
  );
  return importCaptureTransferJsonV1(
    jsonText,
    { statRegistry: registry }
  );
}

test("showcase preset catalog discovers authored transfer files without duplicating creature ids", () => {
  assert.deepEqual(
    CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1,
    [
      "data/capture/showcase/crea_nat_1.capture-creature-transfer-v1.json",
      "data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json",
      "data/capture/showcase/crea_tox_2.capture-creature-transfer-v1.json",
      "data/capture/showcase/kitsune_lunaire.capture-creature-transfer-v1.json",
      "data/capture/showcase/crea-loup.capture-creature-transfer-v1.json",
      "data/capture/showcase/gorice.capture-creature-transfer-v1.json",
      "data/capture/showcase/crea_crys_2.capture-creature-transfer-v1.json",
      "data/capture/showcase/crea_maraileron.capture-creature-transfer-v1.json",
      "data/capture/showcase/crea_ailevent.capture-creature-transfer-v1.json",
      "data/capture/showcase/crea_voltik.capture-creature-transfer-v1.json",
      "data/capture/showcase/crea_dracendre.capture-creature-transfer-v1.json",
      "data/capture/showcase/crea_foudrillon.capture-creature-transfer-v1.json",
      "data/capture/showcase/crea_lumilo.capture-creature-transfer-v1.json",
      "data/capture/showcase/crea_ombre_2.capture-creature-transfer-v1.json",
      "data/capture/showcase/crea_scar_2.capture-creature-transfer-v1.json",
      "data/capture/showcase/crea_mer_3.capture-creature-transfer-v1.json",
      "data/capture/showcase/crea_sylvorne.capture-creature-transfer-v1.json",
      "data/capture/showcase/crea_selachombre.capture-creature-transfer-v1.json",
      "data/capture/showcase/crea_vyrame.capture-creature-transfer-v1.json",
      "data/capture/showcase/veuve-jaune.capture-creature-transfer-v1.json",
      "data/capture/showcase/Ephemus.capture-creature-transfer-v1.json",
      "data/capture/showcase/Veldra_crea.capture-creature-transfer-v1.json"
    ]
  );
});

test("Moussados showcase preset preserves the editor-authored model", async () => {
  const imported = await importedPreset(
    CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.find(path=>path.endsWith('/crea_mossback.capture-creature-transfer-v1.json'))
  );
  const record = imported.value;

  assert.equal(imported.kind, "creature");
  assert.equal(record.draft.id, "crea_mossback");
  assert.equal(record.draft.level, 1);
  assert.equal(record.statValues.values.health, 200);
  assert.equal(record.draft.presentation.profileId, "massive");
  assert.equal(record.draft.presentation.displayScale, 1.7);
  assert.equal(
    record.draft.resistances.find(
      (item) => item.kind === "element:fire"
    )?.value,
    50
  );
  assert.equal(
    record.draft.resistances.find(
      (item) => item.kind === "element:air"
    )?.value,
    -50
  );
  assert.deepEqual(
    record.loadout.slots.map((slot) => slot.skillId),
    [
      "cap_earth_atk_2",
      "lib_earth_guard",
      "cap_earth_atk_4",
      "cap_earth_atk_3",
      "cap_earth_atk_7"
    ]
  );
});

test("Loup volcanique showcase preset preserves health natural matchup visuals and planned loadout", async () => {
  const imported = await importedPreset(
    CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.find(path=>path.endsWith("/crea-loup.capture-creature-transfer-v1.json"))
  );
  const record = imported.value;

  assert.equal(imported.kind, "creature");
  assert.equal(record.draft.id, "crea-loup");
  assert.equal(record.draft.level, 1);
  assert.equal(record.statValues.values.health, 150);
  assert.equal(record.draft.presentation.profileId, "quadruped");
  assert.equal(record.draft.presentation.displayScale, 1.2);
  assert.equal(
    record.draft.resistances.find(
      (item) => item.kind === "element:fire"
    )?.value,
    35
  );
  assert.equal(
    record.draft.resistances.find(
      (item) => item.kind === "element:water"
    )?.value,
    -50
  );
  assert.deepEqual(
    record.loadout.slots.map((slot) => slot.skillId),
    [
      "claw",
      "fireball",
      "cap_fire_special_1",
      "lib_flame_bite",
      "cap_fire_atk_6"
    ]
  );
});

test("Human Editor hydrates showcase presets through the existing Transfer planner and state owner", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1/
  );
  assert.match(
    source,
    /hydrateCaptureShowcaseCreaturePresetsV1/
  );
  assert.match(
    source,
    /importCaptureTransferJsonV1/
  );
  assert.match(
    source,
    /planCaptureTransferImportV1/
  );
  assert.match(
    source,
    /applyCaptureTransferPlanToEditorStateV1/
  );
});

test("Veuve jaune retains author identity, stats and visuals with its validated five-skill loadout", async () => {
  const imported = await importedPreset(
    "data/capture/showcase/veuve-jaune.capture-creature-transfer-v1.json"
  );
  const record = imported.value;
  assert.equal(imported.kind, "creature");
  assert.equal(record.draft.id, "veuve-jaune");
  assert.equal(record.draft.displayName, "Veuve jaune");
  assert.equal(record.draft.capture.rarity, "mythic");
  assert.deepEqual(record.draft.elements, ["electric", "nature"]);
  assert.equal(record.draft.combat.maxHp, 110);
  assert.equal(record.draft.combat.reaction.type, "dodge");
  assert.equal(record.draft.combat.reaction.maxCharges, 5);
  assert.equal(record.statValues.creatureId, "veuve-jaune");
  assert.equal(record.statValues.values.electric, 15);
  assert.equal(record.loadout.creatureId, "veuve-jaune");
  assert.deepEqual(record.loadout.slots.map(slot => slot.skillId), [
    "veuve-jaune-fil-foudroyant", "veuve-jaune-toile-paralysante",
    "veuve-jaune-morsure-neuroelectrique", "veuve-jaune-emprise-de-soie",
    "veuve-jaune-domaine-de-la-veuve"
  ]);
  assert.equal(record.draft.presentation.id, "creature:veuve-jaune");
  assert.equal(record.draft.presentation.subjectId, "veuve-jaune");
  assert.equal(record.draft.presentation.profileId, "serpentine");
  assert.deepEqual(record.draft.presentation.viewOverrides.player,
    { displayScale: 1.5, position: { x: 0, y: 0 } });
  assert.deepEqual(record.draft.presentation.viewOverrides.opponent,
    { displayScale: 0.9, position: { x: 0, y: 50 } });
  assert.equal(record.draft.presentation.visual.front.assetId,
    "pack:capture:creature-veuve-jaune-opponent-01");
  assert.equal(record.draft.presentation.visual.back.assetId,
    "pack:capture:creature-veuve-jaune-player-01");
  assert.equal(record.draft.presentation.visual.icon.assetId,
    "pack:capture:creature-veuve-jaune-icon-01");
  assert.deepEqual(record.draft.presentation.sockets[0].front,
    { x: 0.41310657310523774, y: 0.6176207782480855 });
  assert.deepEqual(record.draft.presentation.sockets[0].back,
    { x: 0.6520260391179431, y: 0.5321092882416535 });
});

test("Ephemus and Veldra stay author-exact, selectable in Combat, and ready for visual round-trips without provisional skills", async () => {
  for (const expected of [
    {
      file: "data/capture/showcase/Ephemus.capture-creature-transfer-v1.json",
      id: "Ephemus", name: "Ephemus", type: "psy", rarity: "mythic",
      hp: 120, speed: 10, defense: 0, physical: 0, special: "esprit", specialValue: 20,
      charges: 4, rechargeMs: 30000, windowMs: 600,
      assetBase: "ephemus"
    },
    {
      file: "data/capture/showcase/Veldra_crea.capture-creature-transfer-v1.json",
      id: "Veldra_crea", name: "Veldra", type: "light", rarity: "legendary",
      hp: 200, speed: 20, defense: 10, physical: 10, special: "light", specialValue: 20,
      charges: 2, rechargeMs: 35000, windowMs: 1500,
      assetBase: "veldra"
    }
  ]) {
    assert.ok(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.includes(expected.file));
    const original = JSON.parse(await readFile(new URL("../../" + expected.file, import.meta.url), "utf8"));
    const imported = await importedPreset(expected.file);
    assert.equal(imported.kind, "creature");
    const { draft, statValues, loadout } = imported.value;
    assert.equal(draft.id, expected.id);
    assert.equal(draft.displayName, expected.name);
    assert.deepEqual(draft.elements, [expected.type]);
    assert.equal(draft.capture.rarity, expected.rarity);
    assert.equal(draft.combat.maxHp, expected.hp);
    assert.equal(statValues.creatureId, expected.id);
    assert.equal(statValues.values.health, expected.hp);
    assert.equal(statValues.values.speed, expected.speed);
    assert.equal(statValues.values.defense, expected.defense);
    assert.equal(statValues.values.physical, expected.physical);
    assert.equal(statValues.values[expected.special], expected.specialValue);
    assert.equal(draft.combat.reaction.maxCharges, expected.charges);
    assert.equal(draft.combat.reaction.rechargeMs, expected.rechargeMs);
    assert.equal(draft.combat.reaction.activeWindowMs, expected.windowMs);
    assert.equal(draft.presentation.profileId, "flying");
    assert.equal(draft.presentation.subjectId, expected.id);
    assert.equal(draft.presentation.id, "creature:" + expected.id);
    assert.deepEqual(draft.presentation.viewOverrides, original.draft.presentation.viewOverrides);
    assert.deepEqual(draft.presentation.sockets, original.draft.presentation.sockets);
    assert.equal(draft.presentation.visual.front.assetId,
      "pack:capture:creature-" + expected.assetBase + "-opponent-01");
    assert.equal(draft.presentation.visual.back.assetId,
      "pack:capture:creature-" + expected.assetBase + "-player-01");
    assert.equal(draft.presentation.visual.icon.assetId,
      "pack:capture:creature-" + expected.assetBase + "-icon-01");
    assert.deepEqual(draft.skillIds, []);
    assert.equal(loadout.creatureId, expected.id);
    assert.deepEqual(loadout.slots.map(({ skillId }) => skillId),
      [null, null, null, null, null]);
  }
});
