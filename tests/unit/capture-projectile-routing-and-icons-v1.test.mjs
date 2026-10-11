import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {adaptCaptureSkillToSkillDefinition} from "../../src/adapters/input/capture/capture-skill-to-skill-definition.js";

async function draft(id) {
  const raw=await readFile(new URL("../../data/capture/showcase/"+id+".capture-skill-transfer-v1.json",import.meta.url),"utf8");
  return JSON.parse(raw).draft;
}
test("the two skill icons match their real Capture skill names", async () => {
  const ash=await draft("cap_fire_special_1");
  const bite=await draft("lib_flame_bite");
  assert.equal(ash.presentation.visual.icon.assetId,"pack:capture:icon-skill-blinding-ash-01");
  assert.equal(bite.presentation.visual.icon.assetId,"pack:capture:icon-skill-burning-bite-01");
});
test("Capture export adapter carries existing skyfall trajectory into Combat Rules without an asset dependency", async () => {
  const falling=await draft("cap_earth_atk_4");
  const fireball=await draft("fireball");
  assert.equal(adaptCaptureSkillToSkillDefinition({id: falling.id, definition: falling.definition},falling.presentation).projectileTargeting,"fixed_point");
  assert.equal(adaptCaptureSkillToSkillDefinition({id: fireball.id, definition: fireball.definition},fireball.presentation).projectileTargeting,"direct");
});
