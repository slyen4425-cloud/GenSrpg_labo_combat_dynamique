import test from "node:test";
import assert from "node:assert/strict";
import { createEmbeddedCombatLifecycleV1 } from "../../src/ui/embedded-combat-lifecycle-v1.js";

const actors=[
 {actorId:"player",teamId:"allies"},
 {actorId:"ally",teamId:"allies"},
 {actorId:"opponent",teamId:"wild"},
 {actorId:"opponent-b",teamId:"wild"}
];
const format={actors,localActorId:"player",teamOf(id){return actors.find(a=>a.actorId===id)?.teamId;}};
const state=(hp)=>({fighters:Object.fromEntries(Object.entries(hp).map(([id,value])=>[id,{hp:value,maxHp:100}]))});
const start=()=>createEmbeddedCombatLifecycleV1({format});

test("native Lab session remains running until every active member of one team is KO",async()=>{
 const life=start();
 assert.equal(life.observe(state({player:100,ally:60,opponent:30,"opponent-b":90})),false);
 assert.equal(life.observe(state({player:100,ally:0,opponent:30,"opponent-b":90})),false);
 assert.equal(life.observe(state({player:100,ally:0,opponent:0,"opponent-b":90})),false);
 assert.equal(life.observe(state({player:100,ally:0,opponent:0,"opponent-b":0})),true);
 const done=await life.completion;
 assert.equal(done.outcome,"victory");
 assert.deepEqual(done.state.fighters["opponent-b"],{hp:0,maxHp:100});
 assert.equal(life.observe(state({player:100,ally:0,opponent:0,"opponent-b":0})),false);
 assert.equal(life.flee(state({player:90,ally:0,opponent:0,"opponent-b":0})),false);
});
test("flee only resolves once with the last genuine native snapshot",async()=>{
 const life=start(),s=state({player:75,ally:62,opponent:23,"opponent-b":14});
 life.observe(s);
 assert.equal(life.flee(s),true);
 assert.equal(life.flee(s),false);
 assert.deepEqual(await life.completion,{outcome:"flee",state:s});
});
test("invalid or incomplete Lab snapshots never settle or fabricate missing HP",()=>{
 const life=start();
 assert.throws(()=>life.observe(state({player:99,ally:99,opponent:99})),/missing/i);
 assert.throws(()=>life.flee(state({player:99,ally:99,opponent:99})),/missing/i);
});
test("real format partition decides defeat, not a GenSrpg UI outcome",async()=>{
 const life=start();
 life.observe(state({player:0,ally:0,opponent:90,"opponent-b":0}));
 assert.equal((await life.completion).outcome,"defeat");
});
