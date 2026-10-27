import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  humanCreatureSelectorGroupsV1,
  humanVisualAssetElementV1,
  humanVisualAssetGroupsV1,
  humanSkillDuplicateNameIdsV1
} from "../../src/ui/capture-editor-human-v2.js";
import {
  canonicalCaptureCreatureRecordsV1
} from "../../src/catalogs/capture-canonical-creature-catalog-v1.js";

const read = (path) => readFile(new URL("../../" + path, import.meta.url), "utf8");

test("creature selector groups real draft IDs under their primary element, with secondary element readable", () => {
  const records = [
    { draft: { id: "fire-b", displayName: "Zorro", elements: ["fire", "air"] } },
    { draft: { id: "water", displayName: "Aquafin", elements: ["water"] } },
    { draft: { id: "fire-a", displayName: "Braize", elements: ["fire"] } },
    { draft: { id: "neutral", displayName: "Neutre", elements: [] } }
  ];
  const groups = humanCreatureSelectorGroupsV1(records);
  assert.deepEqual(groups.map(x => x.label), ["Feu", "Eau", "Neutre"]);
  assert.deepEqual(groups[0].entries.map(x => x.id), ["fire-a", "fire-b"]);
  assert.deepEqual(groups[0].entries[1].elements, ["fire", "air"]);
  assert.equal(groups.flatMap(x => x.entries).length, 4);
  assert.equal(new Set(groups.flatMap(x => x.entries.map(y => y.id))).size, 4);
});

test("asset grouping uses metadata first then tokenized personal labels, never infers from substring light/lightning", () => {
  assert.equal(humanVisualAssetElementV1({tags:["fire","cast"],label:"Charge"}), "fire");
  assert.equal(humanVisualAssetElementV1({tags:["creator","impact"],label:"Sprite eau 12f"}), "water");
  assert.equal(humanVisualAssetElementV1({tags:["creator","travel"],label:"Sprite foudre"}), "electric");
  assert.equal(humanVisualAssetElementV1({tags:["creator"],label:"Sprite lumière"}), "light");
  assert.equal(humanVisualAssetElementV1({tags:["creator"],label:"Mon sprite mystère"}), null);
  assert.equal(humanVisualAssetElementV1({tags:["creator"],label:"Sprite lightnings"}), null);
});

test("sprite/portrait/icon lists group by element, alphabetically, without losing selected asset identities or duplicates-by-id", () => {
  const assets = [
    {id:"f1",label:"Flammes B",tags:["fire"],source:{scope:"pack"}},
    {id:"w1",label:"Sprite eau",tags:["creator"],source:{scope:"user"}},
    {id:"f2",label:"Flammes A",tags:["fire"],source:{scope:"pack"}},
    {id:"n1",label:"Sans type",tags:["creator"],source:{scope:"user"}},
    {id:"f1",label:"Flammes B (shadow copy)",tags:["fire"],source:{scope:"pack"}}
  ];
  const groups = humanVisualAssetGroupsV1(assets);
  assert.deepEqual(groups.map(x=>x.label),["Feu","Eau","Autres / non classés"]);
  assert.deepEqual(groups[0].entries.map(x=>x.id),["f2","f1"]);
  assert.deepEqual(groups.flatMap(x=>x.entries).map(x=>x.id),["f2","f1","w1","n1"]);
});

test("same-name skills under different IDs are reported, not deleted or merged", () => {
  const skills = [
    {id:"lib_tidal_bite",name:"Morsure de marée"},
    {id:"cap_water_atk_2",name:"Morsure de marée"},
    {id:"unique",name:"Lumière"}
  ];
  assert.deepEqual(
    [...humanSkillDuplicateNameIdsV1(skills)].sort(),
    ["cap_water_atk_2","lib_tidal_bite"]
  );
});

test("historical 110 sources and eight aliases still yield 102 canonical unique creatures", async () => {
  const catalog=JSON.parse(await read("data/capture/monster-capture-creatures.v1.json"));
  assert.equal(catalog.entries.length,110);
  const canonical=canonicalCaptureCreatureRecordsV1(catalog.entries);
  assert.equal(canonical.length,102);
  assert.equal(new Set(canonical.map(x=>x.id)).size,102);
});

test("editor grouping remains a read-only projection of active owners and retains asset role filters", async () => {
  const source=await read("src/ui/capture-editor-human-v2.js");
  assert.match(source,/humanCreatureSelectorGroupsV1\(\s*\[\.\.\.configuredCreatures\.values\(\)\]/);
  assert.match(source,/humanVisualAssetGroupsV1\(\s*groupAssets\s*\)/);
  assert.match(source,/captureEditorAssetMatchesRoleV1/);
  assert.match(source,/humanSkillDuplicateNameIdsV1/);
  assert.match(source,/Bibliothèque GenSrpG/);
  assert.match(source,/Mes assets/);
});
