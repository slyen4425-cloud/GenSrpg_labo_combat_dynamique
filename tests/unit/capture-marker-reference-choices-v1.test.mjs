import test from "node:test";
import assert from "node:assert/strict";
import {
  captureMarkerChannelChoicesV1,
  captureMarkerIconChoicesV1
} from "../../src/ui/capture-marker-reference-choices-v1.js";

test("marker channels reuse the native element and live author stat owners",()=>{
  const nativeElements=[{id:"fire",label:"Feu"},{id:"poison",label:"Poison"}];
  const initial=captureMarkerChannelChoicesV1({nativeElements});
  assert.deepEqual(initial.map(x=>x.id),["physical","fire","poison"]);
  const extended=captureMarkerChannelChoicesV1({
    nativeElements,
    statRegistry:{stats:[
      {id:"arcane-poison-stat",label:"Poison arcanique",damageChannel:"arcane-poison",resistanceChannel:"fire"},
      {id:"psychic-stat",label:"Esprit",resistanceChannel:"psychic"}
    ]}
  });
  assert.deepEqual(extended.map(x=>x.id),["physical","fire","poison","arcane-poison","psychic"]);
  assert.equal(extended.find(x=>x.id==="arcane-poison").label,"Poison arcanique");
  const imported=captureMarkerChannelChoicesV1({
    nativeElements,statRegistry:{stats:[]},selectedId:"legacy-custom-damage"
  });
  assert.equal(imported.find(x=>x.id==="legacy-custom-damage").label,"legacy-custom-damage (conservé)");
});

test("marker icon choices always follow the shared author catalog and keep imported unavailable IDs",()=>{
  const options=captureMarkerIconChoicesV1({catalogOptions:[
    {id:"pack:icon:fire",label:"Boule de feu"},
    {id:"user:venin",label:"Ma toxine"},
    {id:"pack:icon:fire",label:"Doublon"}
  ]});
  assert.equal(options.length,2);
  assert.equal(options.some(x=>x.id==="user:venin"),true);
  const missing=captureMarkerIconChoicesV1({catalogOptions:options,selectedId:"pack:legacy:icon"});
  assert.equal(missing.length,3);
  assert.match(missing.find(x=>x.id==="pack:legacy:icon").label,/conservée/);
});
