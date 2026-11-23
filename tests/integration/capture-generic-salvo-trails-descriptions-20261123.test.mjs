import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";
import {buildHumanSkillDraftV1,humanSkillEditorFieldsFromDraftV1}
  from "../../src/ui/capture-editor-human-v2.js";

const read=name=>JSON.parse(readFileSync(new URL(
  "../../data/capture/showcase/"+name+".capture-skill-transfer-v1.json",import.meta.url),"utf8")).draft;
const salvo=read("vipfer-couronne-eclats");
const reflection=read("vipfer-mue-tranchante");
const trail=read("polocendre-trainee-feu");
const explain=definition=>describeCaptureSkillV1(definition).sentences.join(" ");

test("automatic text says fixed first-contact retaliation, never 0% reflection",()=>{
  const description=explain(reflection.definition);
  assert.match(description,/200 points pendant 8 secondes/);
  assert.match(description,/25 dégâts fixes/);
  assert.match(description,/une seule fois/);
  assert.doesNotMatch(description,/Renvoie 0|0 % des dégâts/i);
  const configured=normalizeSkillDefinition({...reflection.definition,
    effects:reflection.definition.effects.map(effect=>effect.status?.kind==="damage_reflection"
      ? {...effect,status:{...effect.status,contactDamage:17,consumeOnContact:false}}
      : effect)});
  const custom=explain(configured);
  assert.match(custom,/17 dégâts fixes/);
  assert.doesNotMatch(custom,/une seule fois/);
});

test("generic salvo text scales with authored 2/3/4 projectiles, damage and slowdown",()=>{
  for(const shots of [2,3,4]){
    const duration=600,gap=100;
    const effects=salvo.definition.effects.map(effect=>effect.kind==="damage"
      ? {...effect,amount:7}
      : {...effect,status:{...effect.status,durationMs:11000,modifierPct:22}});
    const skill=normalizeSkillDefinition({...salvo.definition,
      travelMs:shots*duration+(shots-1)*gap,
      salvo:{shots,shotDurationMs:duration,gapMs:gap},effects});
    const description=explain(skill);
    assert.match(description,new RegExp(shots+" projectiles successifs"));
    assert.match(description,/esquivables séparément/);
    assert.match(description,/7 dégâts d['’]Acier chacun/);
    assert.match(description,new RegExp(shots*7+" dégâts maximum"));
    assert.match(description,/22 %/);
    assert.match(description,/11 secondes/);
    assert.equal((description.match(/7 dégâts d['’]Acier chacun/g)||[]).length,1);
    const saved=buildHumanSkillDraftV1(humanSkillEditorFieldsFromDraftV1({
      ...salvo,definition:skill
    }));
    assert.equal(saved.definition.salvo.shots,shots);
    assert.equal(saved.definition.effects.find(e=>e.kind==="damage").amount,7);
  }
});

test("generic 2/3/4 trail zones keep positions and author values on save/reopen",()=>{
  const first=trail.definition.effects.find(e=>e.kind==="persistent_zone");
  const baseDamage=trail.definition.effects.find(e=>e.kind==="damage");
  for(const count of [2,3,4]){
    const zones=Array.from({length:count},(_,i)=>({
      ...first,zoneId:"test-trail-"+(i+1),trailIndex:i+1,trailCount:count,
      durationMs:12000,
      tickEffect:{...first.tickEffect,amount:9}
    }));
    const definition=normalizeSkillDefinition({...trail.definition,
      effects:[baseDamage,...zones]});
    const fields=humanSkillEditorFieldsFromDraftV1({...trail,definition});
    const saved=buildHumanSkillDraftV1(fields);
    const savedZones=saved.definition.effects.filter(e=>e.kind==="persistent_zone");
    assert.equal(savedZones.length,count);
    assert.deepEqual(savedZones.map(z=>z.trailIndex),
      Array.from({length:count},(_,i)=>i+1));
    assert.ok(savedZones.every(z=>z.trailCount===count&&z.tickEffect.amount===9&&
      z.durationMs===12000&&z.damageTrigger==="entry_only"));
    const desc=explain(saved.definition);
    assert.match(desc,new RegExp(count+" traînées de Feu"));
    assert.match(desc,/Chaque zone traversée inflige 9 dégâts de Feu/);
    assert.equal((desc.match(/Chaque zone traversée inflige/g)||[]).length,1);
  }
});

test("persistent-zone user editor exposes generic optional trail position and count controls",()=>{
  const ui=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  for(const selector of ["data-skill-zone-trail-enabled","data-skill-zone-trail-index",
    "data-skill-zone-trail-count"])assert.match(ui,new RegExp(selector));
  assert.match(ui,/trailIndex:positiveInteger\(/);
  assert.match(ui,/trailCount:positiveInteger\(/);
});
