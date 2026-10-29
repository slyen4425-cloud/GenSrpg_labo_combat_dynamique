import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";

const read=path=>readFile(new URL("../../"+path,import.meta.url),"utf8");
const hash=content=>createHash("sha256").update(content).digest("hex");
const creatureSource="data/capture/source-exports/gensrpg-capture-creature-crea_nat_1-2026-10-29-r5.json";
const skillSource="data/capture/source-exports/gensrpg-capture-skill-explosion_florale-2026-10-29.json";
const creatureActive="data/capture/showcase/crea_nat_1.capture-creature-transfer-v1.json";
const skillActive="data/capture/showcase/explosion_florale.capture-skill-transfer-v1.json";

test("RED: author skill Explosion florale is stored byte-exactly and indexed only once",async()=>{
  const source=await read(skillSource);
  assert.equal(hash(source),"5d5848c128f97682f8c632522f67832d1934d6164b04fa5aa15afee5d1daa97e");
  assert.equal(await read(skillActive),source);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(path=>path===skillActive).length,1);
  const value=importCaptureTransferJsonV1(source);
  assert.equal(value.kind,"skill");
  const skill=JSON.parse(source).draft;
  assert.equal(skill.id,"explosion_florale");
  assert.equal(skill.requiredLevel,15);
  assert.equal(skill.definition.element,"nature");
  assert.equal(skill.definition.energyCost,6);
  assert.equal(skill.definition.cooldownMs,3000);
  assert.deepEqual(skill.definition.effects,[{kind:"consume_marker",targetScope:"target",markerId:"graine-sansue",count:"all",minimum:1,perCharge:true,effects:[{kind:"damage",targetScope:"target",amount:25,channel:"nature"}]}]);
  assert.equal(skill.presentation.visual.impact.assetId,"pack:capture:sprite-spores-expansives-projectile-sphere-02");
});

test("RED: Grainou author r5 replaces existing one, equips Explosion florale in slot 4",async()=>{
  const source=await read(creatureSource);
  assert.equal(hash(source),"d9545f76bd143330558e527f282abc2f3341ed68fa8253546cf671c96514e24a");
  assert.equal(await read(creatureActive),source);
  const creature=JSON.parse(source);
  assert.equal(creature.draft.id,"crea_nat_1");
  assert.equal(creature.draft.skillIds.filter(id=>id==="explosion_florale").length,1);
  assert.deepEqual(creature.loadout.slots.map(x=>x.skillId),["coupe_feuille","graine_sansue_cap","Spore_soporifique","explosion_florale",null]);
  assert.equal(creature.draft.combat.reaction.maxCharges,5);
  assert.equal(creature.draft.presentation.visual.dodge.assetId,"pack:capture:sprite-fleur-defense-01");
  const registry=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
  assert.equal(importCaptureTransferJsonV1(source,{statRegistry:registry}).kind,"creature");
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(path=>path===creatureActive).length,1);
});

test("historical r4 and Spore sources are untouched; canonical registries contain no duplicate",async()=>{
  const r4=await read("data/capture/source-exports/gensrpg-capture-creature-crea_nat_1-2026-10-29-r4.json");
  assert.equal(hash(r4),"56af0e17f4aad906429bb25ed86330ef75c5b576dda1a367d739e4840e23fa9e");
  const spore=await read("data/capture/source-exports/gensrpg-capture-skill-Spore_soporifique-2026-10-29-r2.json");
  assert.equal(hash(spore),"45deeb29b981dd33d54b378b09a619d9efeb7ef8d9804b72a8a45550594b0a63");
  assert.equal(new Set(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.length);
  assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
});
