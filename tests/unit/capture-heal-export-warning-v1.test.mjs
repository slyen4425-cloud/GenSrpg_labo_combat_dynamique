import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  humanSkillHealExportWarningV1,
  buildHumanSkillDraftV1
} from "../../src/ui/capture-editor-human-v2.js";

const read=(p)=>readFile(new URL("../../"+p,import.meta.url),"utf8");

test("an authored heal skill with no HP effect exports with a clear warning, not silent success",async()=>{
  const transfer=JSON.parse(await read("data/capture/showcase/lib_aqua_heal.capture-skill-transfer-v1.json"));
  // Preserve the missing-heal sentinel with an explicit unfinished draft;
  // the published authored lib_aqua_heal now has real healing by request.
  const unfinished={...transfer.draft,definition:{...transfer.draft.definition,effect:{...transfer.draft.definition.effect,heal:0},effects:[]}};
  const warning=humanSkillHealExportWarningV1(unfinished);
  assert.match(warning,/soin|PV/i);
  assert.match(warning,/effet|périodique/i);
});

test("true positive healing and over-time healing do not raise missing-heal warnings",()=>{
  const candidate={definition:{category:"heal",effect:{heal:0},effects:[]}};
  const positive=(effects)=>({definition:{...candidate.definition,effects}});
  assert.equal(humanSkillHealExportWarningV1(positive([
    {kind:"heal",targetScope:"self",amount:5}
  ])),null);
  assert.equal(humanSkillHealExportWarningV1(positive([
    {kind:"apply_status",targetScope:"self",status:{
      id:"regen",kind:"heal_over_time",amount:7,tickIntervalMs:1500,durationMs:6000,
      polarity:"beneficial",stacking:"refresh",tags:[]
    }}
  ])),null);
  assert.equal(humanSkillHealExportWarningV1({
    definition:{category:"heal",effect:{heal:5},effects:[]}
  }),null);
  assert.equal(humanSkillHealExportWarningV1({
    definition:{category:"offensive",effect:{heal:0},effects:[]}
  }),null);
});

test("scheduled heal eventually counts as healing, while unrelated statuses still warn",()=>{
  const c=(effects)=>({definition:{category:"heal",effect:{heal:0},effects}});
  assert.equal(humanSkillHealExportWarningV1(c([
    {kind:"scheduled_effect",targetScope:"target",effects:[
      {kind:"heal",targetScope:"target",amount:12}
    ]}
  ])),null);
  assert.match(humanSkillHealExportWarningV1(c([
    {kind:"apply_status",targetScope:"self",status:{kind:"stun",amount:0}}
  ])),/soin|PV/i);
});

test("the real Human Editor export handler surfaces a missing-healing warning without refusing user JSON export",async()=>{
  const source=await read("src/ui/capture-editor-human-v2.js");
  assert.match(source,/humanSkillHealExportWarningV1\(draft\)/);
  assert.match(source,/exportCaptureSkillTransferJsonV1\(\s*draft\s*\)/);
  assert.match(source,/downloadCaptureJsonFileV1\(\s*filename,\s*json/);
});
