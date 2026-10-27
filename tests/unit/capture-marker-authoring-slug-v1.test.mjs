import test from "node:test";
import assert from "node:assert/strict";
import {captureMarkerAuthorSlugV1} from "../../src/ui/capture-marker-library-v1.js";
import {normalizeCaptureMarkerV1} from "../../src/contracts/capture-marker-v1.js";

test("mobile author name derives a stable lowercase marker ID without changing canonical contracts",()=>{
  assert.equal(captureMarkerAuthorSlugV1("Venin"),"venin");
  assert.equal(captureMarkerAuthorSlugV1("  Brûlure électrique   "), "brulure-electrique");
  assert.equal(captureMarkerAuthorSlugV1("Poïson"),"poison");
  assert.equal(captureMarkerAuthorSlugV1("   "), "");
  assert.equal(captureMarkerAuthorSlugV1("A".repeat(100)),"a".repeat(64));
  assert.equal(captureMarkerAuthorSlugV1("♡"), "");
  const id=captureMarkerAuthorSlugV1("Vénin");
  const marker=normalizeCaptureMarkerV1({id,name:"Vénin",polarity:"detrimental",durationMs:20000,maxStacks:10,
    periodic:{kind:"damage",amount:5,intervalMs:5000,damageMode:"fixed",channel:"physical"}});
  assert.equal(marker.id,"venin");
  assert.equal(marker.name,"Vénin");
  assert.throws(()=>normalizeCaptureMarkerV1({...marker,id:"Vénin"}),/lowercase slug/);
});
