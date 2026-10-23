import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { normalizeCaptureSkillTransferV1 } from "../../src/contracts/capture-skill-transfer-v1.js";
import { normalizeCaptureMarkerV1 } from "../../src/contracts/capture-marker-v1.js";
const load=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const entries=[
  ["Onde Spirituel","onde-spirituel"],
  ["fleche_spirituel","fleche-spirituel"]
];
for(const [id,archive] of entries){
 test("Author skill "+id+" is transferred once, exact archive and import works",()=>{
  const path="data/capture/showcase/"+id+".capture-skill-transfer-v1.json";
  const copy="data/capture/source-exports/gensrpg-capture-skill-"+archive+"-2026-10-22.json";
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===path).length,1);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.includes(copy),false);
  // Keep the immutable 22 October archive as historical author input.
  assert.notEqual(load(path),load(copy));
  const latest="data/capture/source-exports/gensrpg-capture-skill-"+archive+"-2026-10-23.json";
  assert.equal(load(path),load(latest));
  const raw=JSON.parse(load(path)),normalized=normalizeCaptureSkillTransferV1(raw);
  assert.equal(normalized.draft.id,id);
  assert.equal(normalized.draft.definition.id,id);
  const imported=importCaptureTransferJsonV1(load(path));
  assert.equal(imported.kind,"skill");
  assert.equal(imported.value.draft.id,id);
 });
}
test("Spirit mirror keeps original authored 2s reflection, no invented visuals",()=>{
 const {draft}=JSON.parse(load("data/capture/showcase/Onde Spirituel.capture-skill-transfer-v1.json"));
 assert.equal(draft.definition.element,"spirit");
 assert.deepEqual(draft.definition.targetRelations,["ally","self"]);
 const status=draft.definition.effects[0].status;
 assert.equal(status.kind,"projectile_mirror");
 assert.equal(status.durationMs,2000);
 assert.equal(draft.presentation.visual.icon.assetId,"pack:capture:icon-skill-miroir-magique-01");
});
test("Spirit arrow keeps both distinct original damage channels and shared marker",()=>{
 const {draft}=JSON.parse(load("data/capture/showcase/fleche_spirituel.capture-skill-transfer-v1.json"));
 assert.equal(draft.definition.form,"projectile");
 assert.equal(draft.definition.preparationMs,700);
 assert.equal(draft.definition.travelMs,850);
 assert.equal(draft.definition.cooldownMs,9000);
 assert.equal(draft.presentation.visual.travel.assetId,"pack:capture:sprite-kitsune-lunaire-projectile-01");
 const [markerEffect,damage]=draft.definition.effects;
 assert.equal(damage.channel,"spirit");
 assert.equal(damage.amount,9);
 assert.equal(markerEffect.marker.id,"eclat-spirituel");
 assert.equal(markerEffect.marker.durationMs,20000);
 assert.equal(markerEffect.marker.maxStacks,3);
 const effect=markerEffect.marker.onStackAdded.effects[0];
 assert.equal(effect.kind,"apply_status");
 assert.equal(effect.status.kind,"approach_time_modifier");
 assert.equal(effect.status.modifierPct,10);
 assert.equal(effect.status.stacking,"stack");
 assert.equal(normalizeCaptureMarkerV1(markerEffect.marker).id,"eclat-spirituel");
});
test("No active old skill was replaced with accidental re-export",()=>{
 assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p.endsWith("/fireball.capture-skill-transfer-v1.json")).length,1);
 assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.some(p=>p.includes("lib_fire_bolt")),false);
});
