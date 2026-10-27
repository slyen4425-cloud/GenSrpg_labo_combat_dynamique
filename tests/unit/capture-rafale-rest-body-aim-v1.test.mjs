import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { restingProjectileAimRectV1 } from "../../src/adapters/renderer/dom-skill-fx.js";

const rect=(left,top,width,height)=>({left,top,width,height});
const slot=rect(350,160,60,50);
const restingMotion=rect(350,160,60,50);
const restingBody=rect(357,205,36,30);
const geometry=(motion,body)=>restingProjectileAimRectV1({slotRect:slot,motionRect:motion,visibleRect:body});

test("Rafale visible body aim must use opaque shape at resting pose rather than slot center",()=>{
 const target=geometry(restingMotion,restingBody);
 assert.equal(target.left,375);
 assert.equal(target.top,220);
 assert.equal(target.width,0);
 assert.equal(target.height,0);
 assert.notEqual(target.top,slot.top+slot.height/2);
});

test("direct projectile aim is stable when target rises or burrows; the physical live collision remains elsewhere",()=>{
 const rest=geometry(restingMotion,restingBody);
 const flying=geometry(rect(350,20,60,50),rect(357,65,36,30));
 const burrow=geometry(rect(350,300,60,50),rect(357,345,36,30));
 assert.deepEqual(flying,rest);
 assert.deepEqual(burrow,rest);
});
test("without ready opaque model, direct projectiles retain old stable combat slot",()=>{
 assert.deepEqual(geometry(restingMotion,null),slot);
});
test("Rafale clash power becomes exactly 2 without modifying its original assets, timing, and damage",()=>{
 const path=new URL("../../data/capture/showcase/lib_gust.capture-skill-transfer-v1.json",import.meta.url);
 const skill=importCaptureTransferJsonV1(readFileSync(path,"utf8")).value.draft;
 assert.equal(skill.definition.projectileClash.power,2);
 assert.equal(skill.definition.form,"projectile");
 assert.equal(skill.definition.projectileTargeting,"direct");
 assert.equal(skill.definition.travelMs,700);
 assert.equal(skill.definition.effects[0].amount,4);
 assert.equal(skill.presentation.visual.travel.assetId,"pack:capture:sprite-air-wind-bolt-01");
 assert.equal(skill.presentation.visual.impact.assetId,"pack:capture:sprite-air-wind-impact-01");
});
