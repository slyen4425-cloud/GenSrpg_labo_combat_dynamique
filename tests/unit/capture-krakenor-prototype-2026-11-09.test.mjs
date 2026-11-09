import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const cases = [
  {
    "id": "krakenor-perle-pression",
    "level": 1,
    "energy": 3,
    "cd": 15000
  },
  {
    "id": "krakenor-etau-tentaculaire",
    "level": 5,
    "energy": 5,
    "cd": 23000
  },
  {
    "id": "krakenor-voile-encre",
    "level": 10,
    "energy": 6,
    "cd": 30000
  },
  {
    "id": "krakenor-bulle-implosion",
    "level": 15,
    "energy": 7,
    "cd": 34000
  },
  {
    "id": "krakenor-abysse-huit-bras",
    "level": 20,
    "energy": 10,
    "cd": 0
  }
];
const expectedIds = cases.map(entry => entry.id);
test("Krakenor prototypes are five distinct valid native skill transfers, pending activation", async () => {
  assert.equal(new Set(expectedIds).size, 5);
  assert.deepEqual(cases.map(c=>c.level),[1,5,10,15,20]);
  for (const c of cases) {
    const path = new URL("../../data/capture/showcase/" + c.id + ".capture-skill-transfer-v1.json", import.meta.url);
    const transfer = normalizeCaptureSkillTransferV1(JSON.parse(await readFile(path,"utf8")));
    assert.equal(transfer.draft.id,c.id);
    assert.equal(transfer.draft.definition.id,c.id);
    assert.equal(transfer.draft.presentation.subjectId,c.id);
    assert.equal(transfer.draft.definition.element,"water");
    assert.equal(transfer.draft.requiredLevel,c.level);
    assert.equal(transfer.draft.definition.energyCost,c.energy);
    assert.equal(transfer.draft.definition.cooldownMs,c.cd);
    assert.ok(transfer.draft.definition.effects.length > 0);
    assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.some(p=>p.endsWith("/"+c.id+".capture-skill-transfer-v1.json")),false,"must not activate without approved visuals");
  }
});
test("Pressure rupture, ink weakening, delayed detonation and ultimate consumption are native", async () => {
 const get=async id => normalizeCaptureSkillTransferV1(JSON.parse(await readFile(new URL("../../data/capture/showcase/"+id+".capture-skill-transfer-v1.json",import.meta.url),"utf8"))).draft.definition;
 const l1=await get("krakenor-perle-pression");
 const press=l1.effects.find(x=>x.kind==="apply_marker").marker;
 assert.equal(press.id,"krakenor-pression");
 assert.equal(press.onStackThreshold.count,3);
 assert.equal(press.onStackThreshold.consume,"reset");
 assert.equal(press.onStackThreshold.effects[0].amount,8);
 const l5=await get("krakenor-etau-tentaculaire");
 assert.equal(l5.effects.find(x=>x.kind==="apply_marker").marker.id,press.id);
 assert.equal(l5.effects.find(x=>x.kind==="apply_status").status.kind,"immobilize");
 const l10=await get("krakenor-voile-encre");
 assert.equal(l10.effects.find(x=>x.kind==="apply_marker").marker.onStackAdded.effects[0].status.modifierPct,-20);
 const l15=await get("krakenor-bulle-implosion");
 assert.equal(l15.effects[0].kind,"scheduled_effect");
 assert.equal(l15.effects[0].trigger.delayMs,2200);
 assert.equal(l15.effects[0].effects.some(x=>x.kind==="apply_marker"),true);
 const l20=await get("krakenor-abysse-huit-bras");
 assert.equal(l20.maxUsesPerCombat,1);
 const consume=l20.effects.find(x=>x.kind==="consume_marker");
 assert.equal(consume.markerId,press.id);
 assert.equal(consume.perCharge,true);
 assert.equal(consume.count,3);
});
