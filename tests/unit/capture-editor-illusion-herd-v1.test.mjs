import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {buildHumanSkillDraftV1,humanSkillEditorFieldsFromDraftV1}
  from "../../src/ui/capture-editor-human-v2.js";
import {captureDecoySettingsFromDefinitionV1,captureDecoyEffectsFromEditorV1,
  stampedeTravelMsV1,stampedeDirectDamageFromEffectsV1}
  from "../../src/ui/capture-editor-illusion-herd-v1.js";

const authored=name=>normalizeCaptureSkillTransferV1(JSON.parse(
  readFileSync("data/capture/showcase/"+name+".capture-skill-transfer-v1.json","utf8")
)).draft;

test("Dédale: two existing status IDs, duration, retaliation and original transfer roundtrip",()=>{
  const native=authored("raiiven-dedale-silhouettes");
  const fields=humanSkillEditorFieldsFromDraftV1(native);
  assert.equal(fields.decoy.enabled,true);
  assert.equal(fields.decoy.count,2);
  assert.equal(fields.decoy.retaliationDamage,10);
  const edited=buildHumanSkillDraftV1(fields);
  const statuses=edited.definition.effects.filter(x=>x.kind==="apply_status"&&x.status.kind==="decoy");
  assert.equal(statuses.length,2);
  assert.deepEqual(statuses.map(x=>x.status.id),native.definition.effects.map(x=>x.status.id));
  assert.equal(edited.definition.decoyFormation.reshuffleMs,5000);
  assert.equal(edited.definition.decoyFormation.spacingPct,56);
});
test("Dédale: native non-Raiiven author supports extra illusion with generated stable IDs and author spacing",()=>{
  const initial=authored("raiiven-dedale-silhouettes");
  const fields=humanSkillEditorFieldsFromDraftV1(initial);
  const edited=buildHumanSkillDraftV1({
    ...fields,id:"test-mage-illusion",name:"Illusion du mage",
    decoy:{...fields.decoy,count:4,retaliationDamage:17,
      reshuffleMs:3000,spacingPct:84}
  });
  const statuses=edited.definition.effects.filter(x=>x.status?.kind==="decoy");
  assert.equal(statuses.length,4);
  assert.equal(new Set(statuses.map(x=>x.status.id)).size,4);
  assert.ok(statuses.every(x=>x.status.retaliationDamage===17));
  assert.equal(edited.definition.decoyFormation.reshuffleMs,3000);
  assert.equal(edited.definition.decoyFormation.spacingPct,84);
});
test("Generic decoy helper preserves unrelated tactical effects and does not manufacture a new rules engine",()=>{
  const generic={kind:"apply_status",targetScope:"self",status:{
    id:"another-status",kind:"shield",durationMs:3000
  }};
  assert.deepEqual(captureDecoyEffectsFromEditorV1([generic],{enabled:false},"test","shadow"),[generic]);
  const v=captureDecoyEffectsFromEditorV1([generic],{
    enabled:true,count:1,durationMs:12000,retaliationDamage:9,templates:[]
  },"test","shadow");
  assert.equal(v.length,2);
  assert.equal(v[0],generic);
  assert.equal(v[1].status.kind,"decoy");
  assert.equal(v[1].status.id,"test-decoy-1");
  assert.throws(()=>captureDecoyEffectsFromEditorV1([],
    {enabled:true,count:7,durationMs:12000,retaliationDamage:5},"test","shadow"),/1 et 6/);
});
test("Cavalcade: native transfer edits real wave count, horse count and total travel without parallel damage",()=>{
  const native=authored("raiiven-cavalcade-damnes");
  const fields=humanSkillEditorFieldsFromDraftV1(native);
  assert.equal(fields.presentation.travelTrajectoryMode,"stampede");
  assert.equal(fields.stampede.cloneCount,5);
  const edited=buildHumanSkillDraftV1({
    ...fields,
    stampede:{passes:4,passDurationMs:1600,gapMs:400,cloneCount:7}
  });
  assert.equal(edited.definition.projectileTargeting,"stampede");
  assert.equal(edited.definition.stampede.passes,4);
  assert.equal(edited.definition.stampede.cloneCount,7);
  assert.equal(edited.definition.travelMs,7600);
  assert.equal(edited.definition.effect.damage,40);
  assert.equal(edited.definition.effects.length,0);
  assert.equal(stampedeTravelMsV1(edited.definition.stampede),7600);
  assert.equal(stampedeDirectDamageFromEffectsV1(fields.effects),40);
});
test("Stampede rejects multiple damage authorities instead of silently dropping configured effects",()=>{
  assert.throws(()=>stampedeDirectDamageFromEffectsV1([
    {kind:"damage",targetScope:"target",amount:40},
    {kind:"apply_status",targetScope:"target",status:{kind:"stun"}}
  ]),/exactement un effet/);
  assert.throws(()=>stampedeTravelMsV1({passes:1,passDurationMs:300,gapMs:500}),/2 à 6/);
});
