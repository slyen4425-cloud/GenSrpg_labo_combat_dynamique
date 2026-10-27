import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {CAPTURE_USED_ABILITY_CATALOG_V2} from "../../src/catalogs/capture-used-ability-catalog-v2.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";

const text=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const active="data/capture/showcase/crea_tox_2.capture-creature-transfer-v1.json";
const archived="data/capture/source-exports/gensrpg-capture-creature-crea_tox_2-2026-10-24.json";
const newest="data/capture/source-exports/crea_tox_2.author-export-2026-10-25-v2.json";
const original="data/capture/source-exports/crea_tox_2.author-export-2026-10-23.json";
const parse=p=>JSON.parse(text(p));
const latest=parse(active);
const expectedSlots=["cap_poison_atk_2","cap_poison_atk_3","cap_poison_special_2","cap_poison_atk_6","cap_poison_atk_7"];
const registry=normalizeCaptureStatRegistryV1(parse("data/capture/monster-capture-stat-registry.v1.json"));

test("published Venombre keeps immutable 24 Oct provenance and uses the exact newest author file",()=>{
  assert.equal(createHash("sha256").update(text(archived)).digest("hex"),
    "4c07c583c9361a75072fa02f013fe2876d1c68d2c2130cd8d2b58092113a45b3");
  assert.equal(latest.draft.id,parse(newest).draft.id);
  assert.ok(Buffer.byteLength(text(active),"utf8")>4570);
  assert.ok(latest.draft.presentation.visual);
  assert.equal(latest.schema,"capture-creature-transfer-v1");
  assert.equal(latest.draft.id,"crea_tox_2");
  assert.equal(latest.statValues.creatureId,"crea_tox_2");
  assert.equal(latest.loadout.creatureId,"crea_tox_2");
  assert.ok(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.includes(active));
});

test("Venombre 25 Oct export changes only author-selected ultimate vs 24 Oct archive",()=>{
  const historical=parse(archived);
  assert.deepEqual(latest.draft.combat,historical.draft.combat);
  assert.equal(latest.loadout.slots.at(-1).skillId,"cap_poison_atk_7");
});

test("author's 4 exact positions and five loadout slots are preserved",()=>{
  assert.deepEqual(latest.draft.presentation.viewOverrides,{
    player:{displayScale:1.4,position:{x:0,y:10}},
    opponent:{displayScale:0.8,position:{x:0,y:40}}
  });
  assert.deepEqual(latest.loadout.slots.map(x=>x.id),
    ["slot-1","slot-2","slot-3","slot-4","slot-ultimate"]);
  assert.deepEqual(latest.loadout.slots.map(x=>x.skillId),expectedSlots);
  assert.equal(latest.draft.presentation.profileId,"biped");
  assert.deepEqual(latest.draft.presentation.sockets,[{
    id:"mouth",label:"Bouche",
    front:{x:0.27525774084298277,y:0.5811630884806315},
    back:{x:0.6587628603683366,y:0.3934898376464844}
  }]);
});

test("all other combat stats, resistance, visuals and authored skill library remain unchanged",()=>{
  const previous=parse(original);
  // The 2023 export used the old quadruped default before the author explicitly approved 'biped'.
  assert.deepEqual(latest.draft.combat,previous.draft.combat);
  assert.deepEqual(latest.statValues,previous.statValues);
});

test("every equipped skill resolves as an existing unique Capture ability",()=>{
  const abilityIds=new Set(CAPTURE_USED_ABILITY_CATALOG_V2.abilities.map(x=>x.id));
  assert.equal(abilityIds.size,CAPTURE_USED_ABILITY_CATALOG_V2.abilities.length);
  const equipped=expectedSlots.filter(Boolean);
  assert.equal(new Set(equipped).size,equipped.length);
  for(const id of equipped)assert.ok(abilityIds.has(id),id);
});

test("full author transfer passes the real Capture transfer importer",()=>{
  const imported=importCaptureTransferJsonV1(text(active),{statRegistry:registry});
  assert.equal(imported.kind,"creature");
  assert.equal(imported.value.draft.id,"crea_tox_2");
  assert.deepEqual(imported.value.draft.presentation.viewOverrides,
    latest.draft.presentation.viewOverrides);
  assert.deepEqual(imported.value.loadout.slots,latest.loadout.slots);
  assert.deepEqual(imported.value.statValues.values,latest.statValues.values);
});
