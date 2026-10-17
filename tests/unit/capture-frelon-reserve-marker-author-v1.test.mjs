import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {
  importCaptureTransferJsonV1,
  exportCaptureSkillTransferJsonV1,
  exportCaptureCreatureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";

const read=async path=>(await readFile(new URL("../../"+path,import.meta.url)));
const json=async path=>JSON.parse((await read(path)).toString("utf8"));
const registry=normalizeCaptureStatRegistryV1(await json("data/capture/monster-capture-stat-registry.v1.json"));
const creature="data/capture/showcase/crea_foudrillon.capture-creature-transfer-v1.json";
const vol="data/capture/showcase/vol_eclaire.capture-skill-transfer-v1.json";
const nid="data/capture/showcase/Nid_frelon.capture-skill-transfer-v1.json";
const originalNid="data/capture/source-exports/gensrpg-capture-skill-Nid_frelon-2026-10-17.json";
const sources=[
  {path:creature,length:5054,hash:"75c41b16850972b102396595b221ba2a161239466b626d0b464d067753bfaba9"},
  {path:vol,length:3947,hash:"9bd952448526afa70aba8029c054a0a09a8dff50977e2f35dc3dbd0c34bde188"},
  {path:originalNid,length:4595,hash:"90e95343c834ebd5411bf0f4bad11ccccc67395a8da13bbd4a11ba7efc14af9e"}
];

test("all three user uploads are preserved, original Nid is archived, and canonical catalog IDs are single",async()=>{
  for(const {path,length,hash} of sources){
    const raw=await read(path);
    assert.equal(raw.length,length,path+" original bytes");
    assert.equal(createHash("sha256").update(raw).digest("hex"),hash,path+" exact author hash");
  }
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(p=>p===creature).length,1);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===vol).length,1);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===nid).length,1);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length,36);
  assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,36);
});

test("Vol eclaire imported as authored: 20 electric damage, TWO actual charges, not description's three",async()=>{
  const imported=importCaptureTransferJsonV1((await read(vol)).toString("utf8"));
  const skill=imported.value.draft;
  assert.equal(skill.id,"vol_eclaire");
  assert.equal(skill.requiredLevel,15);
  assert.equal(skill.definition.form,"contact");
  assert.equal(skill.definition.approachMode,"aerial");
  assert.equal(skill.definition.effects[0].amount,20);
  assert.equal(skill.definition.effects[0].channel,"electric");
  assert.equal(skill.definition.effects[1].kind,"apply_marker");
  assert.equal(skill.definition.effects[1].charges,2);
  assert.equal(skill.definition.effects[1].marker.id,"venin-static");
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(skill)).value.draft,skill);
});
test("Nid source had NO effects due blocker: only 2 explicit five-charge marker placements are added",async()=>{
  const source=await json(originalNid),active=await json(nid);
  assert.equal(source.draft.definition.effects.length,0);
  const actual=active.draft.definition.effects;
  assert.deepEqual(actual.map(x=>[x.kind,x.targetScope,x.charges,x.marker.id]),[
    ["apply_marker","all_enemies",5,"venin-static"],
    ["apply_marker","all_enemy_reserves",5,"venin-static"]
  ]);
  const dard=await json("data/capture/showcase/lib_paralyze.capture-skill-transfer-v1.json");
  const canonical=dard.draft.definition.effects.find(x=>x.kind==="apply_marker").marker;
  assert.deepEqual(actual[0].marker,canonical);
  assert.deepEqual(actual[1].marker,canonical);
  assert.deepEqual({...active,draft:{...active.draft,definition:{...active.draft.definition,effects:[]}}},source,
    "no invented fields, changed timings, sounds, cost or visual assets");
  const imported=importCaptureTransferJsonV1(JSON.stringify(active)).value.draft;
  assert.equal(imported.id,"Nid_frelon");
  assert.equal(imported.requiredLevel,20);
  assert.equal(imported.definition.maxUsesPerCombat,1);
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(imported)).value.draft,imported);
});
test("latest Freclairions retains 26 learned skills and author loadout of Vol/Nid without auto-equipping elsewhere",async()=>{
  const imported=importCaptureTransferJsonV1((await read(creature)).toString("utf8"),{statRegistry:registry});
  const c=imported.value;
  assert.equal(c.draft.id,"crea_foudrillon");
  assert.equal(c.draft.level,1);
  assert.equal(c.draft.skillIds.length,26);
  assert.ok(c.draft.skillIds.includes("vol_eclaire"));
  assert.ok(c.draft.skillIds.includes("Nid_frelon"));
  assert.deepEqual(c.loadout.slots.map(x=>x.skillId),
    ["lib_paralyze","choc_venin","lib_tailwind","vol_eclaire","Nid_frelon"]);
  assert.deepEqual(importCaptureTransferJsonV1(
    exportCaptureCreatureTransferJsonV1(c,{statRegistry:registry}),{statRegistry:registry}).value,c);
});
