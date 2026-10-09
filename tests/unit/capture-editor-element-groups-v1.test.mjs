import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  captureEditorCreatureElementGroupsV1,
  captureEditorAssetElementIdsV1,
  captureEditorVisualAssetGroupsV1,
  captureEditorDuplicateSkillNamesV1
} from "../../src/ui/capture-editor-element-groups-v1.js";

test("active creature selector groups by declared elements without losing or duplicating IDs", () => {
  const entries = [
    { id: "c1", name: "Braiseau", elements: ["fire"] },
    { id: "c2", name: "Aquafin", elements: ["water"] },
    { id: "c3", name: "Ailevent", elements: ["air"] },
    { id: "c4", name: "Dracendre", elements: ["air", "fire"] },
    { id: "c5", name: "Sans type", elements: [] },
    { id: "c6", name: "Inconnue", elements: ["crystal"] }
  ];
  const groups = captureEditorCreatureElementGroupsV1(entries);
  assert.ok(groups.find(x => x.label === "Feu"));
  assert.ok(groups.find(x => x.label === "Eau"));
  assert.ok(groups.find(x => x.label === "Air"));
  assert.ok(groups.find(x => x.label === "Feu + Air"));
  assert.ok(groups.find(x => x.label === "Neutre"));
  assert.ok(groups.find(x => x.label === "Crystal"));
  const all = groups.flatMap(x => x.entries.map(y => y.id));
  assert.equal(all.length, entries.length);
  assert.equal(new Set(all).size, entries.length);
  assert.deepEqual(new Set(all), new Set(entries.map(x => x.id)));
  assert.equal(groups.find(x => x.label === "Feu + Air").entries[0].id, "c4");
  assert.deepEqual(entries[3].elements, ["air", "fire"], "grouping must not mutate authored elements");
});

test("sprites classify using authoritative tags first and unambiguous label tokens second", () => {
  assert.deepEqual(
    captureEditorAssetElementIdsV1({ tags: ["sprite", "fire", "air"], label: "Eau décorative" }),
    ["fire", "air"],
    "tags must own classification when explicit"
  );
  assert.deepEqual(
    captureEditorAssetElementIdsV1({ tags: ["sprite"], label: "Charge — Électrique" }),
    ["electric"]
  );
  assert.deepEqual(
    captureEditorAssetElementIdsV1({ tags: ["sprite"], label: "Boule de feu — impact" }),
    ["fire"]
  );
  assert.deepEqual(
    captureEditorAssetElementIdsV1({ tags: ["sprite"], label: "Soin régénérant" }),
    [],
    "healing is not necessarily water"
  );
  assert.deepEqual(
    captureEditorAssetElementIdsV1({ tags: ["sprite"], label: "firefly spell" }),
    [],
    "do not infer element from substring"
  );
});

test("visual selectors keep provenance groups and exactly one option per assetId", () => {
  const assets = [
    { id: "core:fire", label: "Boule de feu", tags: ["fire"], source: { scope: "core" } },
    { id: "core:water", label: "Charge Eau", tags: ["water"], source: { scope: "pack" } },
    { id: "user:fire", label: "Sprite feu", tags: ["creator"], source: { scope: "user" } },
    { id: "user:neutral", label: "Aurore", tags: ["creator"], source: { scope: "user" } }
  ];
  const groups = captureEditorVisualAssetGroupsV1(assets);
  assert.ok(groups.some(x => x.label === "Bibliothèque GenSrpG · Feu"));
  assert.ok(groups.some(x => x.label === "Bibliothèque GenSrpG · Eau"));
  assert.ok(groups.some(x => x.label === "Mes assets · Feu"));
  assert.ok(groups.some(x => x.label === "Mes assets · Autres / non classés"));
  const all = groups.flatMap(x => x.entries.map(y => y.id));
  assert.deepEqual(new Set(all), new Set(assets.map(x => x.id)));
  assert.equal(all.length, assets.length);
});

test("identical skill display names keep both configured IDs and are explicitly disambiguated", () => {
  const entries = [
    { id: "lib_tidal_bite", name: "Morsure de marée" },
    { id: "cap_water_atk_2", name: "Morsure de marée" },
    { id: "lib_aqua_heal", name: "Onde régénérante" }
  ];
  assert.deepEqual(
    [...captureEditorDuplicateSkillNamesV1(entries)].sort(),
    ["cap_water_atk_2", "lib_tidal_bite"]
  );
});

test("presentation-only grouping never alters canonical editor data or destructive ownership", async () => {
  const source = await readFile(
    new URL("../../src/ui/capture-editor-human-v2.js", import.meta.url),
    "utf8"
  );
  assert.match(source, /captureEditorCreatureElementGroupsV1/);
  assert.match(source, /captureEditorVisualAssetGroupsV1/);
  assert.match(source, /configuredCreatures\.values\(\)/);
  assert.match(source, /humanConfiguredSkillLibraryEntriesV1/);
  assert.match(source, /captureEditorDuplicateSkillNamesV1/);
});
