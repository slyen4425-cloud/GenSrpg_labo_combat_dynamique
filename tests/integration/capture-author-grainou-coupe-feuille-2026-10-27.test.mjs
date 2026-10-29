import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
const read=async p=>readFile(new URL("../../"+p,import.meta.url),"utf8");
for(const [id,kind] of [["crea_nat_1","creature"],["coupe_feuille","skill"]]){
 test("author export "+id+" is preserved and registered once",async()=>{
  const suffix=kind==="creature"?"creature":"skill";
  const live="data/capture/showcase/"+id+".capture-"+suffix+"-transfer-v1.json";
  const archived="data/capture/source-exports/gensrpg-capture-"+suffix+"-"+id+"-2026-10-27.json";
  if(kind==="skill"){
    // Preserve the 2026-10-27 v9 source as immutable history, then validate
    // the current v11 author-approved export against its own dated archive.
    const historic=JSON.parse(await read(archived));
    assert.equal(historic.draft.presentation.version,9);
    const currentSource="data/capture/source-exports/gensrpg-capture-skill-"+id+"-2026-10-28.json";
    assert.deepEqual(JSON.parse(await read(live)),JSON.parse(await read(currentSource)));
  }else{
    const historical=JSON.parse(await read(archived));
    assert.equal(historical.draft.id,id,"2026-10-27 author creature archive remains untouched");
    const currentSource="data/capture/source-exports/gensrpg-capture-creature-crea_nat_1-2026-10-28-r2.json";
    const previous=JSON.parse(await read(currentSource));
    assert.equal(previous.loadout.slots[2].skillId,null,"previous r2 remains immutable");
    assert.equal(previous.draft.combat.reaction.activeWindowMs,400);
    const r3="data/capture/source-exports/gensrpg-capture-creature-crea_nat_1-2026-10-29-r3.json";
    assert.equal(JSON.parse(await read(r3)).draft.combat.reaction.maxCharges,2,
      "prior r3 remains untouched");
    const latest="data/capture/source-exports/gensrpg-capture-creature-crea_nat_1-2026-10-29-r4.json";
    assert.equal(await read(live),await read(latest),
      "active creature must equal newest author export, without erasing historical provenance");
  }
  const catalog=kind==="creature"?CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1:CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1;
  assert.equal(catalog.filter(p=>p===live).length,1);
  const registry=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
  const imported=importCaptureTransferJsonV1(await read(live),{statRegistry:registry});
  assert.equal(imported.kind,kind);
  assert.equal(imported.value.draft.id,id);
 });
}
test("Grainou points to the three approved Hériplante media assets",async()=>{
 const j=JSON.parse(await read("data/capture/showcase/crea_nat_1.capture-creature-transfer-v1.json"));
 assert.equal(j.draft.displayName,"Grainou");
 assert.deepEqual(["front","back","icon"].map(k=>j.draft.presentation.visual[k].assetId),[
  "pack:capture:creature-heriplante-opponent-01",
  "pack:capture:creature-heriplante-player-01",
  "pack:capture:creature-heriplante-icon-01"
 ]);
 assert.equal(j.loadout.slots.length,5);
});
test("Coupe feuille preserves the user-authored damage and resistance bypass",async()=>{
 const j=JSON.parse(await read("data/capture/showcase/coupe_feuille.capture-skill-transfer-v1.json"));
 assert.equal(j.draft.definition.element,"nature");
 assert.equal(j.draft.definition.effects[0].amount,15);
 assert.equal(j.draft.definition.effects[0].ignoreResistancePct,30);
 assert.equal(j.draft.definition.effects[0].ignoreDamageReductionPct,30);
});
