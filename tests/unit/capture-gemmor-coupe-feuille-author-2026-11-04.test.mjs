import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const creaturePath="data/capture/showcase/crea_crys_2.capture-creature-transfer-v1.json";
const skillPath="data/capture/showcase/coupe_feuille.capture-skill-transfer-v1.json";
const creature=JSON.parse(readFileSync(creaturePath,"utf8"));
const skill=JSON.parse(readFileSync(skillPath,"utf8"));

test("RED: Gemmor player and opponent authored scales remain exactly the uploaded values",()=>{
  assert.equal(creature.schema,"capture-creature-transfer-v1");
  assert.equal(creature.draft.schema,"capture-creature-editor-draft-v3");
  assert.equal(creature.draft.id,"crea_crys_2");
  assert.equal(creature.draft.displayName,"Gemmor");
  assert.equal(creature.draft.presentation.subjectId,"crea_crys_2");
  assert.equal(creature.draft.presentation.viewOverrides.player.displayScale,1.4);
  assert.equal(creature.draft.presentation.viewOverrides.opponent.displayScale,0.7);
  assert.equal(creature.statValues.creatureId,"crea_crys_2");
  assert.equal(creature.loadout.creatureId,"crea_crys_2");
  assert.equal(creature.loadout.slots.find(s=>s.id==="slot-1")?.skillId,"coupe_feuille");
  assert.equal(creature.draft.presentation.visual.front.assetId,"pack:capture:creature-plante-carnivore-opponent-01");
  assert.equal(creature.draft.presentation.visual.back.assetId,"pack:capture:creature-plante-carnivore-player-01");
});

test("RED: Coupe feuille author projectile collision strength and status preserved",()=>{
  assert.equal(skill.schema,"capture-skill-transfer-v1");
  assert.equal(skill.draft.schema,"capture-skill-editor-draft-v1");
  assert.equal(skill.draft.id,"coupe_feuille");
  assert.equal(skill.draft.definition.id,"coupe_feuille");
  assert.equal(skill.draft.definition.element,"nature");
  assert.equal(skill.draft.definition.projectileClash.power,1);
  assert.equal(skill.draft.definition.effects.length,1);
  assert.deepEqual(skill.draft.definition.effects[0],{
    kind:"damage",targetScope:"target",amount:15,channel:null,
    ignoreResistancePct:30,ignoreDamageReductionPct:30
  });
  assert.equal(skill.draft.presentation.visual.travel.assetId,"pack:capture:sprite-feuille-tranchante-projectile-03");
});

test("Showcase contains exactly one canonical preset per already existing authored ID",()=>{
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(f=>f===creaturePath).length,1);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(f=>f===skillPath).length,1);
});
