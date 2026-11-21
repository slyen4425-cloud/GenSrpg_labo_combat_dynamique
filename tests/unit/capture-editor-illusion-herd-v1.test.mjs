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
  assert.equal(fields.decoy.scale,1,"100% default for legacy authored transfers");
  const edited=buildHumanSkillDraftV1(fields);
  const statuses=edited.definition.effects.filter(x=>x.kind==="apply_status"&&x.status.kind==="decoy");
  assert.equal(statuses.length,2);
  assert.deepEqual(statuses.map(x=>x.status.id),native.definition.effects.map(x=>x.status.id));
  assert.equal(edited.definition.decoyFormation.reshuffleMs,0);
  assert.equal(edited.definition.decoyFormation.spacingPct,56);
  assert.equal(edited.definition.decoyFormation.scale,1);
});
test("Dédale: native non-Raiiven author supports extra illusion with generated stable IDs and author spacing",()=>{
  const initial=authored("raiiven-dedale-silhouettes");
  const fields=humanSkillEditorFieldsFromDraftV1(initial);
  const edited=buildHumanSkillDraftV1({
    ...fields,id:"test-mage-illusion",name:"Illusion du mage",
    decoy:{...fields.decoy,count:4,retaliationDamage:17,
      reshuffleMs:3000,spacingPct:84,scale:1.3}
  });
  const statuses=edited.definition.effects.filter(x=>x.status?.kind==="decoy");
  assert.equal(statuses.length,4);
  assert.equal(new Set(statuses.map(x=>x.status.id)).size,4);
  assert.ok(statuses.every(x=>x.status.retaliationDamage===17));
  assert.equal(edited.definition.decoyFormation.reshuffleMs,3000);
  assert.equal(edited.definition.decoyFormation.spacingPct,84);
  assert.equal(edited.definition.decoyFormation.scale,1.3,"editor size for different creatures survives export");
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

test("Decoy scale is a single validated authored parameter, no second visual authority",()=>{
  const base=authored("raiiven-dedale-silhouettes");
  const fields=humanSkillEditorFieldsFromDraftV1(base);
  assert.throws(()=>buildHumanSkillDraftV1({
    ...fields,decoy:{...fields.decoy,scale:2.5}
  }),/scale 0.5..2/);
  const within=buildHumanSkillDraftV1({
    ...fields,decoy:{...fields.decoy,scale:0.7}
  });
  assert.equal(within.definition.decoyFormation.scale,0.7);
  assert.equal(within.definition.effects.filter(x=>x.status?.kind==="decoy").length,2);
});

test("Capture editor exposes native clone and Cavalcade controls together in Tactical Effects, not buried in FX",()=>{
  const html=readFileSync("examples/dom-demo/capture-editor-v2.html","utf8");
  const start=html.indexOf("<h2>Effets tactiques</h2>");
  const end=html.indexOf("<h2>Effets visuels</h2>");
  assert.ok(start>=0&&end>start);
  const section=html.slice(start,end);
  assert.match(section,/<option value="decoy">Créer des clones/);
  assert.match(section,/<option value="stampede">Charge de troupeau/);
  assert.match(section,/data-skill-decoy-panel hidden/);
  assert.match(section,/data-skill-stampede-panel hidden/);
  assert.match(section,/data-skill-stampede-passes/);
  assert.match(section,/data-skill-stampede-gap-ms/);
  assert.match(section,/data-skill-stampede-pass-ms/);
  assert.match(section,/data-skill-stampede-clones/);
  assert.match(section,/value="0" data-skill-decoy-shuffle/);
  assert.equal(html.match(/data-skill-decoy-panel/g).length,1);
  assert.equal(html.match(/data-skill-stampede-panel/g).length,1);
  const editor=readFileSync("src/ui/capture-editor-human-v2.js","utf8");
  assert.match(editor,/syncGuidedEffectPanelsV1\("decoy"\)/);
  assert.match(editor,/syncGuidedEffectPanelsV1\("stampede"\)/);
});

test("Loading and saving an ultimate preserves waves, its only damage owner, and edited parameters",()=>{
  const native=authored("raiiven-cavalcade-damnes");
  const fields=humanSkillEditorFieldsFromDraftV1(native);
  assert.equal(fields.loadoutSlot,"ultimate");
  assert.equal(fields.effects.length,1,"one visible damage effect to edit");
  assert.equal(fields.effects[0].amount,40);
  const next=buildHumanSkillDraftV1({...fields,
    effects:[{...fields.effects[0],amount:48}],
    stampede:{passes:5,passDurationMs:800,gapMs:250,cloneCount:6}
  });
  assert.equal(next.definition.loadoutSlot,"ultimate");
  assert.equal(next.definition.stampede.passes,5);
  assert.equal(next.definition.stampede.cloneCount,6);
  assert.equal(next.definition.travelMs,5000);
  assert.equal(next.definition.effect.damage,48);
  assert.equal(next.definition.effects.length,0,"no duplicate tactical damage authority");
});
