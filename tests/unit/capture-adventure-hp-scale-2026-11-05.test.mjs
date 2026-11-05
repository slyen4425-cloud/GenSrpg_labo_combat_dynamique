import test from "node:test";
import assert from "node:assert/strict";
import {applyCaptureEncounterHpMultiplierV1} from "../../src/ui/capture-encounter-combat-source-v1.js";

const base=()=>{
 const local={id:"local-1",maxHp:100,initialHp:80,maxEnergy:9,defensiveCreatureId:"crea_nature"};
 const enemy={id:"opponent-1",maxHp:83,initialHp:83,maxEnergy:10};
 return Object.freeze({
  fighters:Object.freeze([Object.freeze(local),Object.freeze(enemy)]),
  fighterConfigs:Object.freeze({
   crea_nature:Object.freeze({...local,id:"crea_nature"}),
   crea_enemy:Object.freeze({...enemy,id:"crea_enemy"}),
   "roster/opponent-1/member-1":Object.freeze({...enemy,id:"opponent-1"})
  }),
  roster:Object.freeze({teams:{local:{members:[{id:"member-1",fighterConfigId:"crea_nature"}]}}}),
  skillIdsByActor:Object.freeze({"local-1":["leaf"]}),exported:Object.freeze({schema:"capture-combat-export-v3"})
 });
};

test("RED: real Adventure multiplier quarters canonical max/initial HP on both sides, without changing published exports",()=>{
 const original=base();
 const result=applyCaptureEncounterHpMultiplierV1(original,0.25);
 assert.equal(result.fighters[0].maxHp,25);
 assert.equal(result.fighters[0].initialHp,20);
 assert.equal(result.fighters[1].maxHp,21);
 assert.equal(result.fighters[1].initialHp,21);
 assert.equal(result.fighters[0].maxEnergy,9);
 assert.equal(result.fighterConfigs.crea_nature.maxHp,25);
 assert.equal(result.fighterConfigs.crea_enemy.maxHp,21);
 assert.equal(result.fighterConfigs["roster/opponent-1/member-1"].maxHp,21);
 assert.equal(result.exported,original.exported,"author source remains authoritative");
 assert.equal(result.roster,original.roster);
 assert.equal(result.skillIdsByActor,original.skillIdsByActor);
 assert.equal(original.fighters[0].maxHp,100);
 assert.equal(original.fighterConfigs.crea_enemy.maxHp,83);
});

test("RED: legacy Test mode remains full strength; invalid policies fail closed",()=>{
 const source=base();
 assert.equal(applyCaptureEncounterHpMultiplierV1(source,1),source);
 assert.throws(()=>applyCaptureEncounterHpMultiplierV1(source,0),/multiplier/i);
 assert.throws(()=>applyCaptureEncounterHpMultiplierV1(source,-0.1),/multiplier/i);
 assert.throws(()=>applyCaptureEncounterHpMultiplierV1(source,1.1),/multiplier/i);
 assert.throws(()=>applyCaptureEncounterHpMultiplierV1(source,Number.NaN),/multiplier/i);
});

test("RED: no rounding down to zero and no second scaling after applying a Combat projection",()=>{
 const source=Object.freeze({
  ...base(),
  fighters:Object.freeze([{id:"local-1",maxHp:1.5,initialHp:1.5}]),
  fighterConfigs:Object.freeze({a:{id:"a",maxHp:1.5}})
 });
 const result=applyCaptureEncounterHpMultiplierV1(source,0.25);
 assert.equal(result.fighters[0].maxHp,1);
 assert.equal(result.fighters[0].initialHp,1);
 assert.equal(result.fighterConfigs.a.maxHp,1);
 assert.throws(()=>applyCaptureEncounterHpMultiplierV1(result,0.25),/already scaled/i);
});
