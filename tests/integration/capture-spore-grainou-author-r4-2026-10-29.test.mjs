import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
const read=path=>readFile(new URL("../../"+path,import.meta.url),"utf8");
const sha=s=>createHash("sha256").update(s,"utf8").digest("hex");
const skillSrc="data/capture/source-exports/gensrpg-capture-skill-Spore_soporifique-2026-10-29-r2.json";
const creatureSrc="data/capture/source-exports/gensrpg-capture-creature-crea_nat_1-2026-10-29-r4.json";
const skillActive="data/capture/showcase/Spore_soporifique.capture-skill-transfer-v1.json";
const creatureActive="data/capture/showcase/crea_nat_1.capture-creature-transfer-v1.json";
test("Spore soporifique r2 author bytes, canonical active identity and true expansion media",async()=>{
 const src=await read(skillSrc);
 assert.equal(sha(src),"45deeb29b981dd33d54b378b09a619d9efeb7ef8d9804b72a8a45550594b0a63");
 const expected=JSON.parse(src);
 expected.draft.presentation.visual.icon={assetId:"pack:capture:icon-skill-spore-soporifique-01"};
 expected.draft.presentation.audio={
   travel:{assetId:"gensrpg:sound:genrpg-pack2-879fc11a",volume:1,loop:true},
   impact:{assetId:"gensrpg:sound:tower-ccc16d37",volume:1,loop:false}
 };
 assert.deepEqual(JSON.parse(await read(skillActive)),expected,
   "archive r2 is immutable; Oct 30 author adds only icon and two sounds");
 const d=JSON.parse(src).draft;
 assert.equal(d.id,"Spore_soporifique");
 assert.equal(d.definition.projectileTargeting,"expanding_wave");
 assert.deepEqual(d.definition.expandingWave,{startRadiusPct:3,endRadiusPct:65,thicknessPct:6});
 assert.equal(d.definition.effects[0].status.kind,"stun");
 assert.equal(d.definition.effects[0].status.durationModel,"time_ms");
 assert.equal(d.definition.effects[0].status.durationMs,10000);
 assert.equal(d.presentation.visual.travel.assetId,"pack:capture:sprite-spores-expansives-projectile-sphere-02");
 assert.equal(d.presentation.statusVisuals["status-1"].sprite.assetId,"pack:capture:sprite-sommeil-z-status-01");
 assert.equal(importCaptureTransferJsonV1(src).kind,"skill");
 assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===skillActive).length,1);
});
test("Grainou r4 author bytes, active reaction defense and skill slot unchanged",async()=>{
 const src=await read(creatureSrc);
 assert.equal(sha(src),"56af0e17f4aad906429bb25ed86330ef75c5b576dda1a367d739e4840e23fa9e");
 assert.notEqual(await read(creatureActive),src,"Grainou r5 supersedes the archived r4 author file");
 const d=JSON.parse(src);
 assert.equal(d.draft.id,"crea_nat_1");
 assert.equal(d.draft.combat.reaction.type,"defense");
 assert.equal(d.draft.combat.reaction.maxCharges,5);
 assert.equal(d.draft.combat.reaction.rechargeMs,20000);
 assert.equal(d.draft.combat.reaction.activeWindowMs,800);
 assert.equal(d.draft.presentation.visual.dodge.assetId,"pack:capture:sprite-fleur-defense-01");
 assert.equal(d.draft.presentation.visual.dodge.durationMs,1800);
 assert.deepEqual(d.loadout.slots.map(s=>s.skillId),
   ["coupe_feuille","graine_sansue_cap","Spore_soporifique",null,null]);
 const registry=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
 assert.equal(importCaptureTransferJsonV1(src,{statRegistry:registry}).kind,"creature");
 assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(x=>x===creatureActive).length,1);
});
test("prior author archives remain byte-stable and all canonical IDs unique",async()=>{
 const oldSkill=await read("data/capture/source-exports/gensrpg-capture-skill-Spore_soporifique-2026-10-28.json");
 assert.equal(sha(oldSkill),"b1ac566d24a3aaff996661a7127c2e95f9dd3011b5e09436df1050a3d681fbf2");
 const oldCreature=await read("data/capture/source-exports/gensrpg-capture-creature-crea_nat_1-2026-10-29-r3.json");
 assert.equal(sha(oldCreature),"70a9390ff81d42d7f2dc9ec574091078a31e20bdad48f8540a23ea627c78a72b");
 assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
 assert.equal(new Set(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.length);
});
