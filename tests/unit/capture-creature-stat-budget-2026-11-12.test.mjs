import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {evaluateCaptureNewCreatureStatBudgetV1,assertCaptureNewCreatureStatBudgetV1,
 CAPTURE_NEW_CREATURE_STAT_BUDGETS_V1,CAPTURE_HEALTH_PV_PER_BUDGET_POINT_V1
} from '../../src/contracts/capture-creature-stat-budget-v1.js';
const read=path=>readFile(new URL('../../'+path,import.meta.url),'utf8');
const registry=JSON.parse(await read('data/capture/monster-capture-stat-registry.v1.json'));
const s=JSON.parse(await read('data/capture/showcase/crea_selachombre.capture-creature-transfer-v1.json')).statValues;
const clone=x=>JSON.parse(JSON.stringify(x));
test('Standard rarity is the only active 100-point authoring budget',()=>{
 assert.deepEqual(CAPTURE_NEW_CREATURE_STAT_BUDGETS_V1,{standard:100});
 assert.equal(CAPTURE_HEALTH_PV_PER_BUDGET_POINT_V1,5);
 assert.equal(assertCaptureNewCreatureStatBudgetV1({statValues:s,statRegistry:registry}).spent,100);
 assert.throws(()=>evaluateCaptureNewCreatureStatBudgetV1({statValues:s,statRegistry:registry,tier:'epic'}),/not-yet-approved/);
});
test('Increasing HP must reduce another stat without exceeding the budget',()=>{
 const grown=clone(s);
 grown.values.health+=25;
 const excessive=evaluateCaptureNewCreatureStatBudgetV1({statValues:grown,statRegistry:registry});
 assert.equal(excessive.spent,105);
 assert.equal(excessive.remaining,-5);
 assert.throws(()=>assertCaptureNewCreatureStatBudgetV1({statValues:grown,statRegistry:registry}),/allocated 105/);
 grown.values.speed-=5;
 assert.equal(assertCaptureNewCreatureStatBudgetV1({statValues:grown,statRegistry:registry}).spent,100);
});
test('Only documented Capture registry stats can spend points, old transfer schema remains unchanged',()=>{
 const bad=clone(s);bad.values.fakeCustom=10;
 assert.throws(()=>evaluateCaptureNewCreatureStatBudgetV1({statValues:bad,statRegistry:registry}),/unknown stat id/);
});
