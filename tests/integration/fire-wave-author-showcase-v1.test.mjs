import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const skillPath="../../data/capture/showcase/cap_fire_atk_5.capture-skill-transfer-v1.json";
const raw=readFileSync(new URL(skillPath,import.meta.url),"utf8");
const originalSha256="9e940251a53f66fd2d04e40c1bf4fb09d5abcbfdce074f47e674e29a382ee3c3";
const creature=JSON.parse(readFileSync(new URL(
  "../../data/capture/showcase/crea_dracendre.capture-creature-transfer-v1.json",import.meta.url),"utf8"));

test("the shipped Vague incendiaire preset is byte-identical to the user's latest transfer",()=>{
  assert.equal(createHash("sha256").update(raw).digest("hex"),originalSha256);
});
test("showcase routes the author's single stable Vague incendiaire into configuredSkills and Dracendre slot 4",()=>{
  const path="data/capture/showcase/cap_fire_atk_5.capture-skill-transfer-v1.json";
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===path).length,1);
  const draft=JSON.parse(raw).draft;
  assert.equal(draft.id,"cap_fire_atk_5");
  assert.equal(creature.draft.skillIds.filter(x=>x===draft.id).length,1);
  assert.equal(creature.loadout.slots.find(x=>x.id==="slot-4").skillId,draft.id);
  const imported=importCaptureTransferJsonV1(raw).value.draft;
  assert.equal(imported.definition.projectileTargeting,"expanding_wave");
  assert.deepEqual(imported.definition.expandingWave,{startRadiusPct:8,endRadiusPct:65,thicknessPct:8});
  assert.equal(imported.definition.cooldownMs,45000);
  assert.equal(imported.definition.projectileClash.power,4);
  assert.equal(imported.definition.hitsIntangible,false);
  assert.equal(imported.presentation.visual.travel.assetId,"pack:capture:sprite-fire-bubble-expansion-01");
  assert.equal(imported.presentation.visual.travel.opacity,1);
  assert.equal(imported.definition.effects[0].amount,25);
  assert.equal(imported.definition.effects[1].status.tickIntervalMs,2000);
  const roundtrip=importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(imported)).value.draft;
  assert.deepEqual(roundtrip,imported);
});
