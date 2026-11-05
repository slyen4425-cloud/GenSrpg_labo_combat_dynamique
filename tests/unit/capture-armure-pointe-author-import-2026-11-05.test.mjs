import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {humanSkillEditorFieldsFromDraftV1,buildHumanSkillDraftV1} from "../../src/ui/capture-editor-human-v2.js";
import {normalizeSkillPresentationBinding} from "../../src/contracts/skill-presentation-binding.js";

const path="data/capture/showcase/armure-de-pointe.capture-skill-transfer-v1.json";
const id="armure-de-pointe";
const hash="5c7e28002d2beed3e5e1e0f087995fa3baab1583f0ed65b6fb99cffa0f3710dc";
const read=()=>readFileSync(path,"utf8");

test("RED: author-export Armure de pointe is published byte-for-byte without replacing any skill",()=>{
  const raw=read();
  assert.equal(createHash("sha256").update(raw).digest("hex"),hash,
    "the user's original 2903-byte skill transfer must be stored unchanged");
  assert.equal(Buffer.byteLength(raw),2903);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===path).length,1,
    "exactly one official active manifest entry");
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length,
    new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,"no duplicate manifest paths");
  const activeIds=CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.map(p=>JSON.parse(readFileSync(p,"utf8")).draft.id);
  assert.equal(activeIds.filter(x=>x===id).length,1,"one canonical active skill ID");
  assert.equal(activeIds.length,new Set(activeIds).size,"no duplicate active skill identities");
});

test("RED: published Armure de pointe retains exact user gameplay and artwork",()=>{
  const original=JSON.parse(read());
  const draft=original.draft;
  assert.equal(original.schema,"capture-skill-transfer-v1");
  assert.equal(original.version,1);
  assert.equal(draft.schema,"capture-skill-editor-draft-v1");
  assert.equal(draft.id,id);
  assert.equal(draft.definition.id,id);
  assert.equal(draft.presentation.subjectId,id);
  assert.equal(draft.definition.name,"Armure de pointe");
  assert.equal(draft.definition.element,"nature");
  assert.equal(draft.definition.category,"counter");
  assert.equal(draft.definition.form,"contact");
  assert.equal(draft.requiredLevel,5);
  assert.equal(draft.definition.energyCost,3);
  assert.equal(draft.definition.preparationMs,700);
  assert.equal(draft.definition.cooldownMs,30000);
  assert.deepEqual(draft.definition.targetRelations,["self"]);
  assert.deepEqual(draft.definition.effects,[{
    kind:"apply_status",targetScope:"self",status:{
      id:"status-1",kind:"damage_reflection",polarity:"detrimental",
      durationModel:"time_ms",durationMs:10000,stacking:"refresh",
      maxStacks:1,tags:[],percent:100,incomingKinds:["contact"]
    }
  }]);
  assert.equal(draft.presentation.visual.icon.assetId,
    "pack:capture:icon-skill-armure-de-pointe-01");
  const sprite=draft.presentation.statusVisuals["status-1"].sprite;
  assert.equal(sprite.assetId,"pack:capture:sprite-armure-ronces-plante-carnivore-back-01");
  assert.equal(sprite.playbackMode,"hold-last");
  assert.equal(sprite.offsetX,19);
  assert.equal(sprite.offsetY,0);
  assert.equal(sprite.displayScale,1.01);
  assert.equal(sprite.opacity,1);
  assert.equal("opponentAssetId" in sprite,false,
    "the author did not yet choose the optional adversary sprite");
  assert.deepEqual(normalizeSkillPresentationBinding(draft.presentation),draft.presentation);
});

test("RED: real Capture transfer import and editor reloading recover the authored Armure",()=>{
  const original=JSON.parse(read());
  const imported=importCaptureTransferJsonV1(read());
  assert.equal(imported.value.draft.id,id);
  assert.deepEqual(imported.value.draft,original.draft);
  const exported=JSON.parse(exportCaptureSkillTransferJsonV1(imported.value.draft));
  assert.deepEqual(exported.draft,original.draft);
  const ui=humanSkillEditorFieldsFromDraftV1(imported.value.draft);
  assert.equal(ui.id,id);
  assert.equal(ui.name,"Armure de pointe");
  assert.equal(ui.presentation.statusVisuals["status-1"].sprite.assetId,
    "pack:capture:sprite-armure-ronces-plante-carnivore-back-01");
  assert.equal(ui.presentation.statusVisuals["status-1"].sprite.playbackMode,"hold-last");
  assert.equal(buildHumanSkillDraftV1(ui).id,id);
});
