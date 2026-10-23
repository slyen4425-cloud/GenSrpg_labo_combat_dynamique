import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import { captureComplexNativeSkillDraftsV1 } from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import { capturePortableNativeSkillDraftsV1 } from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";

const presetPath = "data/capture/showcase/crea_ailevent.capture-creature-transfer-v1.json";
const raw = await readFile(new URL("../../" + presetPath,import.meta.url),"utf8");
const registry=JSON.parse(await readFile(new URL("../../data/capture/monster-capture-stat-registry.v1.json",import.meta.url),"utf8"));
const imported=importCaptureTransferJsonV1(raw,{statRegistry:registry});
const record=imported.value;

test("Ailevent author file and showcase catalog preserve exact export, only one canonical creature ID",async()=>{
  const previous=JSON.parse(raw);
  previous.draft.presentation.viewOverrides.opponent.displayScale=1.4;
  previous.draft.presentation.viewOverrides.opponent.position.y=0;
  previous.loadout.slots[3].skillId=null;
  previous.loadout.slots[4].skillId=null;
  assert.equal(createHash("sha256").update(JSON.stringify(previous,null,2)).digest("hex"),
    "6605ee3255f732ce9303be2f7f405aad1ec3f9b947255905944f46b5ce6d9af1");
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(x=>x===presetPath).length,1);
  assert.equal(imported.kind,"creature");
  assert.equal(record.draft.id,"crea_ailevent");
  assert.equal(record.draft.displayName,"Ailevent");
  assert.equal(record.draft.level,1);
  const legacyCatalog=JSON.parse(await readFile(new URL("../../data/capture/monster-capture-creatures.v1.json",import.meta.url),"utf8"));
  assert.equal(legacyCatalog.entries.filter(x=>x.id==="crea_ailevent").length,1);
  assert.equal(legacyCatalog.entries.filter(x=>x.id==="crea_rafalcor").length,1);
  assert.equal(record.draft.capture.evolution.targetId,"crea_rafalcor");
  assert.equal(record.draft.capture.evolution.level,16);
});

test("Ailevent authored stats, natural resistances, scale, sockets and sound are preserved",()=>{
  assert.deepEqual(record.draft.sourceStats,
    {force:9,agility:17,intelligence:0,spirit:9,endurance:7,initiative:20});
  assert.deepEqual(record.statValues.values,
    {health:170,speed:20,physical:0,defense:10,fire:0,water:0,earth:0,air:15,electric:0,light:0,shadow:0,poison:0});
  assert.equal(record.draft.combat.maxHp,170);
  assert.equal(record.draft.combat.approachTimeModifierPct,-20);
  assert.equal(record.draft.resistances.find(x=>x.kind==="element:earth")?.value,35);
  assert.equal(record.draft.resistances.find(x=>x.kind==="element:electric")?.value,-50);
  assert.equal(record.draft.resistances.length,13);
  assert.equal(record.draft.presentation.profileId,"flying");
  assert.equal(record.draft.presentation.viewOverrides.player.displayScale,1.8);
  assert.equal(record.draft.presentation.viewOverrides.opponent.displayScale,0.9);
  assert.equal(record.draft.presentation.viewOverrides.opponent.position.y,35);
  assert.equal(record.draft.presentation.sockets.length,5);
  assert.equal(record.draft.presentation.sockets[0].id,"mouth");
  assert.equal(record.draft.presentation.audio.movement.assetId,"gensrpg:sound:conflux-da9a4465");
  assert.equal(record.draft.presentation.visual.front.assetId,"pack:capture:creature-ailevent-opponent-01");
  assert.equal(record.draft.presentation.visual.back.assetId,"pack:capture:creature-ailevent-player-01");
});

test("Ailevent native abilities and 5-slot loadout retain author choices without inventing skills",()=>{
  const available = new Set([...capturePortableNativeSkillDraftsV1(),...captureComplexNativeSkillDraftsV1()].map(x=>x.id));
  assert.equal(record.draft.skillIds.length,11);
  for(const id of record.draft.skillIds) assert.ok(available.has(id),id);
  assert.deepEqual(record.loadout.slots.map(x=>x.skillId),
    ["lib_gust","cap_air_atk_3","lib_tailwind","cap_air_atk_4","cap_air_atk_7"]);
  assert.ok(record.draft.skillIds.includes("lib_gust"));
  assert.ok(record.draft.skillIds.includes("lib_tailwind"));
});
