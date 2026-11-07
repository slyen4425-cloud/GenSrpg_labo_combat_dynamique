import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";
import {normalizeCaptureMarkerV1} from "../../src/contracts/capture-marker-v1.js";
const read=path=>readFile(new URL("../../"+path,import.meta.url),"utf8");
const source="data/capture/showcase/cap_shadow_atk_5.capture-skill-transfer-v1.json";
const markers="data/capture/showcase/markers.capture-markers-v1.json";

test("Peste noire: one hit applies three permanent canonical Peste stacks and temporary 100% heal inversion",async()=>{
  const active=JSON.parse(await read(source)).draft;
  const official=normalizeCaptureMarkerV1(JSON.parse(await read(markers)).markers.find(m=>m.id==="peste"));
  const def=normalizeSkillDefinition(active.definition);
  assert.equal(def.id,"cap_shadow_atk_5");
  assert.equal(active.requiredLevel,20);
  assert.equal(def.loadoutSlot,"ultimate");
  assert.equal(def.form,"projectile");
  assert.equal(def.element,"shadow");
  assert.equal(def.maxUsesPerCombat,1);
  assert.equal(def.energyCost,12);
  assert.equal(def.preparationMs,3500);
  assert.equal(def.travelMs,1200);
  assert.equal(def.effect.damage,0,"no invented direct damage");
  assert.equal(def.effects.length,2);
  const [plague,inversion]=def.effects;
  assert.equal(plague.kind,"apply_marker");
  assert.equal(plague.targetScope,"target");
  assert.equal(plague.charges,3);
  assert.deepEqual(plague.marker,official,"one canonical marker definition");
  assert.equal(official.permanent,true);
  assert.equal(official.maxStacks,20);
  assert.equal(official.periodic.amount,15);
  assert.equal(official.periodic.intervalMs,30000);
  assert.equal(inversion.kind,"apply_status");
  assert.equal(inversion.targetScope,"target");
  assert.equal(inversion.status.kind,"heal_inversion");
  assert.equal(inversion.status.polarity,"detrimental");
  assert.equal(inversion.status.percent,100);
  assert.equal(inversion.status.durationMs,30000);
  assert.equal(inversion.status.stacking,"refresh");
  assert.equal(inversion.status.maxStacks,1);
});

test("Peste noire: Bestiaire describes both real configured effects",async()=>{
  const draft=JSON.parse(await read(source)).draft;
  const {sentences}=describeCaptureSkillV1(draft.definition);
  const prose=sentences.join(" ");
  assert.match(prose,/3 charges de Peste/i);
  assert.match(prose,/sans limite de durée/i);
  assert.match(prose,/15 dégâts d.Ombre/i);
  assert.match(prose,/toutes les 30 secondes/i);
  assert.match(prose,/Transforme 100 % des soins reçus en dégâts/i);
  assert.match(prose,/pendant 30 secondes sur la cible/i);
  assert.match(prose,/une fois par combat/i);
  assert.doesNotMatch(prose,/Aucun effet de combat défini/i);
});

test("Peste noire: canonical icon is shared with marker without duplicating asset files",async()=>{
  const draft=JSON.parse(await read(source)).draft;
  const icon=draft.presentation.visual.icon.assetId;
  assert.equal(icon,"pack:capture:icon-skill-toxine-01");
  assert.equal(icon,draft.definition.effects[0].marker.iconAssetId);
  assert.deepEqual(draft.presentation.audio,{});
});
