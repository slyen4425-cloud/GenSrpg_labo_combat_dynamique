import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillPresentationBinding} from "../../src/contracts/skill-presentation-binding.js";
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {buildHumanSkillDraftV1, humanSkillEditorFieldsFromDraftV1} from "../../src/ui/capture-editor-human-v2.js";
import {exportCaptureSkillTransferJsonV1,importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";

const player="pack:capture:sprite-armor-spines-back-01";
const opponent="pack:capture:sprite-armor-spines-front-01";
const sprite=(both=false)=>({
  assetId:player, ...(both?{opponentAssetId:opponent}:{}),
  displayScale:1.3,opacity:0.85,playbackMode:"hold-last",
  offsetX:9,offsetY:-2,layerByView:{player:"front",opponent:"front"}
});
const binding=(both=false)=>({
  id:"skill:armure-de-pointes",version:3,subjectType:"skill",subjectId:"armure-de-pointes",
  visual:{},audio:{},statusVisuals:{"epines":{mode:"sprite",sprite:sprite(both)}}
});
const fields=(both=false)=>({
  id:"armure-de-pointes",name:"Armure de pointes",description:"Protection de pointes",requiredLevel:1,
  usageScopes:["capture","combat"],category:"buff_debuff",form:"self",element:"nature",
  approachMode:"none",energyCost:1,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:4000,
  allowedDistances:["short","medium","long"],targetRelations:["self"],damage:0,heal:0,stunMs:0,
  interruptsPreparation:false,effects:[{kind:"apply_status",targetScope:"self",status:{
    id:"epines",kind:"stat_modifier",statId:"defense",deltaPoints:10,
    polarity:"beneficial",durationMs:60000,stacking:"refresh",maxStacks:1
  }}],
  reaction:{blockForms:[],reflectForms:[],immuneElements:[],counterForms:[],evadeForms:[],evadeApproaches:[]},
  projectileClash:{mode:"none"},
  presentation:{statusVisuals:{"epines":{mode:"sprite",sprite:sprite(both)}}}
});

function adapter(input) {
  return createCaptureSkillPresentationAssetsV2({
    skillPresentations:{"armure-de-pointes":input},
    assetForId:id=>({assetId:id,url:"/"+id.split(":").at(-1)+".webp",frameCount:8,frameMs:90})
  });
}

test("RED: optional opponent-specific status sprite is canonical and survives export/import",()=>{
  const normalized=normalizeSkillPresentationBinding(binding(true));
  assert.equal(normalized.statusVisuals.epines.sprite.opponentAssetId,opponent);
  const draft=buildHumanSkillDraftV1(fields(true));
  assert.equal(draft.presentation.statusVisuals.epines.sprite.opponentAssetId,opponent);
  const transfer=importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft));
  assert.deepEqual(transfer.value.draft,draft);
  assert.deepEqual(buildHumanSkillDraftV1(humanSkillEditorFieldsFromDraftV1(draft)),draft);
});

test("RED: status resolver selects the opposing asset only for semantic opponent view",()=>{
  const adapted=adapter(binding(true));
  const view=v=>adapted.statusPresentationFor("epines",{sourceSkillId:"armure-de-pointes",view:v}).sprite;
  assert.equal(view("player").assetId,player);
  assert.equal(view("opponent").assetId,opponent);
  assert.match(view("player").url,/spines-back/);
  assert.match(view("opponent").url,/spines-front/);
  assert.equal(view("player").playbackMode,"hold-last");
  assert.equal(view("opponent").offsetX,9);
  assert.equal(view("opponent").displayScale,1.3);
});

test("RED: one-sprite legacy status remains one sprite on both sides without reauthoring",()=>{
  const legacy=binding(false);
  const validated=normalizeSkillPresentationBinding(legacy);
  assert.equal(Object.hasOwn(validated.statusVisuals.epines.sprite,"opponentAssetId"),false);
  assert.equal(adapter(legacy).statusPresentationFor("epines",{view:"opponent"}).sprite.assetId,player);
  assert.equal(adapter(legacy).statusPresentationFor("epines",{view:"player"}).sprite.assetId,player);
  assert.equal(buildHumanSkillDraftV1(fields(false)).presentation.statusVisuals.epines.sprite.opponentAssetId,undefined);
});

test("RED: second sprite is valid only with a stable asset ID",()=>{
  const broken=binding(true);
  broken.statusVisuals.epines.sprite.opponentAssetId="not a catalogue id";
  assert.throws(()=>normalizeSkillPresentationBinding(broken),/opponentAssetId/);
});

test("RED: editor exposes a hidden-by-default explicit opponent sprite picker, never mandatory",()=>{
  const src=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  assert.match(src,/data-skill-status-opponent-visual-enabled/);
  assert.match(src,/data-skill-status-opponent-visual-asset/);
  assert.match(src,/opponentAssetId/);
});
