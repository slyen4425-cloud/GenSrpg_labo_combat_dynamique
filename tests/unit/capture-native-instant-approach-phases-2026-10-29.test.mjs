import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planAnimation } from '../../src/core/animation/plan-animation.js';

const profile = JSON.parse(readFileSync(new URL(
  '../../data/profiles/biped.profile.json', import.meta.url), 'utf8'));
const actor = {id:'hero',facing:'right'};

test('instant native approach keeps author phase order and never throws in visual Core', () => {
  for (const travelMs of [1, 2, 3, 6, 100, 900]) {
    const plan = planAnimation({ actor, profile, event:{
      type:'ground-attack',actorId:actor.id,
      metadata:{targetTranslateX:70,targetTranslateY:0,travelMs,arenaHeight:400}
    }});
    assert.ok(plan.segments.length >= profile.locomotion.phases.length);
    assert.ok(plan.segments.every(s => s.durationMs > 0),
      'every original authored motion phase needs positive visual duration');
    assert.equal(plan.segments.at(-1).label,'ground-home');
    assert.equal(plan.segments.at(-2).label,'ground-approach-impact');
    if(travelMs>=900)assert.equal(
      Math.round(plan.segments.slice(0,-1).reduce((sum,step)=>sum+step.durationMs,0)),
      travelMs,'normal timing must remain byte-for-byte numerically identical');
  }
});
