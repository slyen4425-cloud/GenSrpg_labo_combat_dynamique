import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {captureMarkerExportSnapshotV1} from "../../src/ui/capture-marker-export-v1.js";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {normalizeCaptureMarkerLibraryV1} from "../../src/contracts/capture-marker-v1.js";

const read=path=>readFile(new URL("../../"+path,import.meta.url),"utf8");
const path="data/capture/showcase/lib_paralyze.capture-skill-transfer-v1.json";

test("author's empty markers file must NOT erase a marker embedded in an exported skill",async()=>{
  const uploaded=JSON.parse(await read("data/capture/showcase/gensrpg-marqueurs-2.original.json"));
  assert.deepEqual(uploaded,{schema:"capture-markers-v1",markers:[]});
  const ability=normalizeCaptureSkillTransferV1(JSON.parse(await read(path))).draft;
  const original=JSON.stringify(ability);
  const snapshot=captureMarkerExportSnapshotV1({
    markers: normalizeCaptureMarkerLibraryV1(uploaded.markers),
    configuredSkills: new Map(),
    currentDraft:ability
  });
  assert.equal(snapshot.length,1);
  assert.equal(snapshot[0].id,"venin-static");
  assert.equal(snapshot[0].permanent,true);
  assert.equal(snapshot[0].maxStacks,20);
  assert.equal(snapshot[0].periodic.intervalMs,5000);
  assert.equal(snapshot[0].periodic.amount,2);
  assert.equal(snapshot[0].periodic.channel,"electric");
  assert.equal(snapshot[0].onStackThreshold.count,20);
  assert.equal(snapshot[0].onStackThreshold.effects[0].kind,"knockout");
  assert.equal(snapshot[0].iconAssetId,"pack:capture:icon-skill-toxine-01");
  assert.equal(JSON.stringify(ability),original,"export MUST NOT mutate the authored ability");
});
test("canonical configuredSkills and locally authored markers are included without duplication",async()=>{
  const draft=normalizeCaptureSkillTransferV1(JSON.parse(await read(path))).draft;
  const marker=draft.definition.effects.find(x=>x.kind==="apply_marker").marker;
  const result=captureMarkerExportSnapshotV1({
    markers: new Map([["venin-static",marker]]),
    configuredSkills:new Map([["lib_paralyze",draft]]),
    currentDraft:draft
  });
  assert.equal(result.length,1);
  assert.deepEqual(result[0],marker);
  assert.equal(result[0].permanent,true);
});
test("an unsaved skill marker is included and unrelated standalone markers survive",async()=>{
  const draft=normalizeCaptureSkillTransferV1(JSON.parse(await read(path))).draft;
  const standalone={id:"ward",name:"Protection",durationMs:10000,maxStacks:5,polarity:"beneficial"};
  const result=captureMarkerExportSnapshotV1({
    markers:[standalone],configuredSkills:[],currentDraft:draft
  });
  assert.deepEqual(result.map(x=>x.id).sort(),["venin-static","ward"]);
});
test("different definitions with identical marker ID are never silently reconciled",async()=>{
  const draft=normalizeCaptureSkillTransferV1(JSON.parse(await read(path))).draft;
  const altered={...draft.definition.effects[1].marker,maxStacks:19};
  assert.throws(()=>captureMarkerExportSnapshotV1({
    markers:[altered],configuredSkills:new Map([["lib_paralyze",draft]])
  }),/conflit|conflit|conflict/i);
});
