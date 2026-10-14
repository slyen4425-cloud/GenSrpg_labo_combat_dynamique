import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeStatusEffectV1} from "../../src/contracts/status-effect-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {buildHumanTacticalSkillEffectsV1} from "../../src/ui/capture-editor-human-v2.js";

const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:30,initialEnergy:30,
 energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const make=ids=>createCombatSession({fighters:ids.map(fighter)});
function skill(id,{category="offensive",damage=0,targetRelations=["enemy"],effects=[]}={}){
 return normalizeSkillDefinition({id,name:id,category,form:category==="offensive"?"projectile":"self",
 element:null,approachMode:"none",energyCost:0,preparationMs:0,travelMs:500,recoveryMs:0,cooldownMs:0,
 allowedDistances:["short","medium","long"],targetRelations,
 effect:{damage,heal:0,interruptsPreparation:false,stunMs:0,tags:[]},effects});
}
const trigger=(id,event,effects,polarity="beneficial")=>({id,kind:"triggered_buff",polarity,durationMs:60000,
 stacking:"refresh",onEvent:{event,effects}});
const heal={kind:"heal",targetScope:"self",amount:12};
const hurt={kind:"damage",targetScope:"self",amount:7,channel:"physical"};
function give(session,target,status,source=target){
 const cast=skill("grant-"+status.id,{category:"buff_debuff",targetRelations:[target===source?"self":"enemy"],
 effects:[{kind:"apply_status",targetScope:target===source?"self":"target",status}]});
 const res=session.useSkill({actorId:source,targetId:target,skill:cast});
 assert.equal(res.ok,true);return res;
}
const strike=(s,actorId="a",targetId="b",damage=20)=>
 s.useSkill({actorId,targetId,skill:skill("strike-"+actorId,{damage})});
test("generic event contract accepts status on movement, evade, incoming and outgoing damage and legacy",()=>{
 for(const e of ["damage_dealt","damage_taken","movement","evaded"]){
  const norm=normalizeStatusEffectV1(trigger("e-"+e,e,[heal]));
  assert.equal(norm.onEvent.event,e);
 }
 assert.equal(normalizeStatusEffectV1(trigger("c","movement",[hurt],"detrimental")).polarity,"detrimental");
 assert.throws(()=>normalizeStatusEffectV1(trigger("bad","invisible",[heal])),/event/);
 assert.throws(()=>normalizeStatusEffectV1({...trigger("dup","movement",[heal]),onDamageDealt:{effects:[heal]}}),/both|exclusive|either/i);
 const legacy=normalizeStatusEffectV1({id:"old",kind:"triggered_buff",polarity:"beneficial",
 durationMs:60000,stacking:"refresh",onDamageDealt:{effects:[heal]}});
 assert.deepEqual(legacy.onDamageDealt.effects.map(x=>x.kind),["heal"]);
});
test("a detrimental timed status damages its holder on successful tactical movement only",()=>{
 const s=make(["a","b"]);
 give(s,"b",trigger("steps-curse","movement",[hurt],"detrimental"),"a");
 const before=s.snapshot().fighters.b.hp;
 assert.equal(s.previewMovement("b","long").outcome,"moved");
 assert.equal(s.snapshot().fighters.b.hp,before,"preview never mutates");
 const result=s.move("b","long");
 assert.equal(result.outcome,"moved");assert.equal(s.snapshot().fighters.b.hp,before-7);
 assert.equal(result.events.some(e=>e.type==="hit"&&e.actorId==="b"&&e.appliedDamage===7),true);
 s.move("b","long");assert.equal(s.snapshot().fighters.b.hp,before-7,"no no-op movement proc");
 s.advanceMs(60000);s.move("b","short");
 assert.equal(s.snapshot().fighters.b.hp,before-7,"expired curse never fires");
});
test("an evaded attack triggers a self-heal on the actual defender, not the attacker",()=>{
 const s=make(["a","b"]);strike(s,"a","b",40);assert.equal(s.snapshot().fighters.b.hp,60);
 give(s,"b",trigger("evasion-reward","evaded",[heal]));
 give(s,"b",{id:"auto",kind:"auto_dodge",polarity:"beneficial",durationMs:5000,stacking:"refresh"});
 const miss=strike(s,"a","b");
 assert.equal(miss.outcome,"evaded");assert.equal(s.snapshot().fighters.b.hp,72);
 assert.equal(s.snapshot().fighters.a.hp,100);
});
test("damage_taken triggers on actual HP loss for victim while damage_dealt remains V1 compatible",()=>{
 const s=make(["a","b"]);
 give(s,"b",trigger("guard","damage_taken",[heal]));
 strike(s,"a","b",20);
 assert.equal(s.snapshot().fighters.b.hp,92,"lost 20, healed 12");
 give(s,"a",{id:"legacy",kind:"triggered_buff",polarity:"beneficial",durationMs:10000,
 stacking:"refresh",onDamageDealt:{effects:[heal]}});
 strike(s,"b","a",30); // a loses HP and can recover from subsequent offense
 strike(s,"a","b",20);
 assert.equal(s.snapshot().fighters.a.hp,82);
});
test("2v2 moving and evading triggers never affect unrelated fighters",()=>{
 const s=make(["a","b","c","d"]);
 give(s,"b",trigger("steps-curse","movement",[hurt],"detrimental"),"a");
 s.move("d","short");assert.equal(s.snapshot().fighters.b.hp,100);
 s.move("b","long");assert.equal(s.snapshot().fighters.b.hp,93);
 assert.equal(s.snapshot().fighters.d.hp,100);
});
test("author UI builds event+effects as a single exported status and exposes the event picker",()=>{
 const built=buildHumanTacticalSkillEffectsV1([{kind:"apply_status",targetScope:"target",
 status:{id:"movement-curse",kind:"triggered_buff",polarity:"detrimental",durationSeconds:60,
 stacking:"refresh",onEvent:{event:"movement",effects:[{kind:"damage",targetScope:"self",amount:7,channel:"fire"}]}}}]);
 assert.equal(built[0].status.onEvent.event,"movement");
 assert.equal(built[0].status.onEvent.effects[0].amount,7);
 const ui=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
 assert.match(ui,/data-triggered-buff-event/);
 assert.match(ui,/triggered-buff-effects-host/);
});
