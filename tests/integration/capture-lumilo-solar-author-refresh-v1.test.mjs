import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const entries=[
  {archive:"data/capture/source-exports/gensrpg-capture-creature-crea_lumilo-2026-10-18-r2.json",
   active:"data/capture/showcase/crea_lumilo.capture-creature-transfer-v1.json",
   sha:"d3856255f406ed55ae673a0d377af9cb99211337bfdc7f8302b210058815541f",
   kind:"creature",id:"crea_lumilo",catalog:CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1},
  {archive:"data/capture/source-exports/gensrpg-capture-skill-cap_light_atk_3-2026-10-18-r2.json",
   active:"data/capture/showcase/cap_light_atk_3.capture-skill-transfer-v1.json",
   sha:"86543d6efbb5928d9776c51523c372e0228f0c6eff35683f0855d32d72d304eb",
   kind:"skill",id:"cap_light_atk_3",catalog:CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1}
];
const read=async p=>readFile(new URL("../../"+p,import.meta.url));
test("RED: Lumilo and Charge solaire exports are archived and active byte-exact, once per canonical catalog",async()=>{
  for(const item of entries){
    const [source,active]=await Promise.all([read(item.archive),read(item.active)]);
    assert.equal(createHash("sha256").update(source).digest("hex"),item.sha);
    assert.deepEqual(active,source,"active transfer must match author export without extra repairs");
    assert.equal(item.catalog.filter(x=>x===item.active).length,1);
    const parsed=importCaptureTransferJsonV1(active.toString("utf8"));
    assert.equal(parsed.kind,item.kind);
    assert.equal(parsed.value.draft.id,item.id);
  }
});
test("RED: new Charge solaire author timings, targeting and visuals preserved",async()=>{
  const skill=importCaptureTransferJsonV1((await read(entries[1].active)).toString("utf8")).value.draft;
  assert.equal(skill.definition.preparationMs,800);
  assert.equal(skill.definition.cooldownMs,45000);
  assert.equal(skill.definition.energyCost,3);
  assert.deepEqual(skill.definition.effects.map(e=>[e.kind,e.targetScope,e.status?.modifierPct,e.status?.durationMs]),[
    ["apply_status","target",50,30000],["apply_status","all_ally_reserves",50,30000]
  ]);
  assert.equal(skill.presentation.visual.icon.assetId,"pack:capture:icon-skill-healing-wave-01");
  assert.equal(skill.presentation.audio.impact.assetId,"gensrpg:sound:conflux-43060f16");
});
test("RED: Lumilo canonical loadout selects Charge solaire in slot 4, preserving evolution, visuals and reactions",async()=>{
  const creature=importCaptureTransferJsonV1((await read(entries[0].active)).toString("utf8")).value;
  const bySlot=Object.fromEntries(creature.loadout.slots.map(x=>[x.id,x.skillId]));
  assert.equal(bySlot["slot-4"],"cap_light_atk_3");
  assert.equal(creature.draft.capture.evolution.targetId,"crea_solarys");
  assert.equal(creature.draft.combat.reaction.type,"dodge");
  assert.equal(creature.draft.presentation.visual.front.assetId,"pack:capture:creature-renard-magique-dore-opponent-01");
});
