import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { normalizeSkillEffectV1 } from "../../src/contracts/skill-effect-v1.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { applyImmediateTacticalEffectsV1 } from "../../src/core/combat/immediate-tactical-effects-v1.js";
import { createCombatState } from "../../src/core/combat/combat-state.js";
import { buildHumanTacticalSkillEffectsV1 } from "../../src/ui/capture-editor-human-v2.js";
const fighter=(id,hp=100)=>({id,maxHp:100,initialHp:hp,maxEnergy:30,initialEnergy:30,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const life=(percent=50,maxHeal)=>({kind:"life_steal",targetScope:"self",percent,
  ...(maxHeal===undefined?{}:{maxHeal})});
function skill(id,baseDamage=20,effects=[life()],form="projectile"){
 return normalizeSkillDefinition({id,name:id,category:"offensive",form,approachMode:"none",
  element:"physical",energyCost:0,preparationMs:0,travelMs:500,
  recoveryMs:0,cooldownMs:0,allowedDistances:["short","medium","long"],
  targetRelations:["enemy"],effect:{damage:baseDamage,heal:0,tags:[]},effects});
}
const status=(kind,extras)=>({id:kind,kind,polarity:"beneficial",
 durationMs:10000,stacking:"replace",...extras});
function castBuff(session,id,def){const cast=normalizeSkillDefinition({id,name:id,
 category:"buff_debuff",form:"self",approachMode:"none",energyCost:0,preparationMs:0,
 travelMs:0,recoveryMs:0,cooldownMs:0,
 allowedDistances:["short","medium","long"],targetRelations:["self"],
 effect:{damage:0,heal:0,tags:[]},
 effects:[{kind:"apply_status",targetScope:"self",status:def}]
 });assert.equal(session.useSkill({actorId:id,targetId:id,skill:cast}).ok,true)}
function battle(hpA=40,hpB=100){
 return createCombatSession({distance:"short",fighters:[fighter("a",hpA),fighter("b",hpB)]});
}

test("life steal V1 is an explicit self-only effect, with percent and optional maxHeal",()=>{
 assert.deepEqual(normalizeSkillEffectV1(life()),life());
 assert.deepEqual(normalizeSkillEffectV1(life(65,12)),life(65,12));
 assert.throws(()=>normalizeSkillEffectV1({...life(),targetScope:"target"}),/self|targetScope/i);
 assert.throws(()=>normalizeSkillEffectV1(life(101)),/percent/i);
 assert.throws(()=>normalizeSkillEffectV1(life(-1)),/percent/i);
 assert.throws(()=>normalizeSkillEffectV1(life(25,-1)),/maxHeal/i);
 assert.throws(()=>normalizeSkillEffectV1({...life(),amount:10}),/unknown field/i);
});
test("drain based on actual enemy HP lost, not requested damage; one canonical heal event",()=>{
 const s=battle();const res=s.useSkill({actorId:"a",targetId:"b",skill:skill("bite",40)});
 assert.equal(res.ok,true);assert.equal(s.snapshot().fighters.b.hp,60);
 assert.equal(s.snapshot().fighters.a.hp,60);
 const heals=res.events.filter(x=>x.type==="heal"&&x.lifeSteal===true);
 assert.equal(heals.length,1);assert.equal(heals[0].applied,20);
});
test("overkill and healing maximum cap; missing health also caps applied heal",()=>{
 const s=battle(25,11);
 const result=s.useSkill({actorId:"a",targetId:"b",skill:skill("bite",100,[life(50,3)])});
 assert.equal(result.ok,true);assert.equal(s.snapshot().fighters.b.hp,0);
 assert.equal(s.snapshot().fighters.a.hp,28);
 const healed=result.events.find(x=>x.lifeSteal===true);
 assert.equal(healed.requested,3);assert.equal(healed.applied,3);
 const nearlyFull=battle(98,100);
 nearlyFull.useSkill({actorId:"a",targetId:"b",skill:skill("big-hit",40)});
 assert.equal(nearlyFull.snapshot().fighters.a.hp,100);
});
test("immune enemy, shield absorption and zero damage never heal the attacker",()=>{
 const shielded=battle();
 castBuff(shielded,"b",status("shield",{amount:35}));
 shielded.useSkill({actorId:"a",targetId:"b",skill:skill("shielded",20)});
 assert.equal(shielded.snapshot().fighters.a.hp,40);
 assert.equal(shielded.snapshot().fighters.b.hp,100);
 const partial=battle();
 castBuff(partial,"b",status("shield",{amount:15}));
 partial.useSkill({actorId:"a",targetId:"b",skill:skill("partial",25)});
 assert.equal(partial.snapshot().fighters.a.hp,45);
 assert.equal(partial.snapshot().fighters.b.hp,90);
 const immune=battle();
 castBuff(immune,"b",status("immunity",{domains:["damage"]}));
 immune.useSkill({actorId:"a",targetId:"b",skill:skill("immune",40)});
 assert.equal(immune.snapshot().fighters.a.hp,40);
 assert.equal(immune.snapshot().fighters.b.hp,100);
});
test("tactical multi-target immediate damage feeds one lifesteal after all native hits (2v2)",()=>{
 const teams={a:"ally",b:"enemy",c:"ally",d:"enemy"};
 const battleFormat={actors:["a","b","c","d"].map(actorId=>({actorId})),
    teamOf(id){return teams[id];}};
 const s=createCombatSession({distance:"short",battleFormat,
    fighters:[fighter("a",30),fighter("b"),fighter("c"),fighter("d",15)]});
 const multi=skill("vampire-area",0,[{kind:"damage",targetScope:"all_enemies",amount:20,channel:"physical"},life(50,18)],"area");
 const result=s.useSkill({actorId:"a",targetId:"b",skill:multi});
 assert.equal(result.ok,true);assert.equal(s.snapshot().fighters.b.hp,80);
 assert.equal(s.snapshot().fighters.d.hp,0);
 assert.equal(s.snapshot().fighters.a.hp,47.5);
 assert.equal(s.snapshot().fighters.c.hp,100);
 assert.equal(result.events.filter(x=>x.type==="heal"&&x.lifeSteal===true).length,1);
});
test("reflection damage is not included in lifesteal and mirrored action cannot double heal",()=>{
 const s=battle(50);
 castBuff(s,"b",status("damage_reflection",{percent:50}));
 const res=s.useSkill({actorId:"a",targetId:"b",skill:skill("bite-mirror",20)});
 assert.equal(res.ok,true);
 assert.equal(s.snapshot().fighters.b.hp,80);
 assert.equal(s.snapshot().fighters.a.hp,50,"reflects 10 damage then lifesteals 10 real damage");
 assert.equal(res.events.filter(x=>x.lifeSteal).length,1);
});
test("editor contract round trip exports percent/cap unchanged and never confuses energy drain",()=>{
 const output=buildHumanTacticalSkillEffectsV1([life(35,8)]);
 assert.deepEqual(output,[life(35,8)]);
 const withoutCap=buildHumanTacticalSkillEffectsV1([life(25)]);
 assert.deepEqual(withoutCap,[life(25)]);
});

test("explicit mirror-return guard forbids a second drain even if tactical damage resolves",()=>{
 const base=createCombatState({fighters:[fighter("a",40),fighter("b")]});
 const skillDefinition=skill("reflected-tactical",0,[
  {kind:"damage",targetScope:"target",amount:20,channel:"physical"},
  life(50)
 ]);
 const returned=applyImmediateTacticalEffectsV1({
  state:base,actorId:"a",targetId:"b",skill:skillDefinition,
  atMs:0,combatAtMs:0,allowLifeSteal:false,directDamageApplied:20
 });
 assert.equal(returned.state.fighters.b.hp,80);
 assert.equal(returned.state.fighters.a.hp,40);
 assert.equal(returned.events.filter(x=>x.lifeSteal).length,0);
});
test("life steal does not resurrect a caster killed by the reflected damage",()=>{
 const s=battle(5);
 castBuff(s,"b",status("damage_reflection",{percent:100}));
 const res=s.useSkill({actorId:"a",targetId:"b",skill:skill("fatal-bite",20)});
 assert.equal(res.ok,true);
 assert.equal(s.snapshot().fighters.a.hp,0);
 assert.equal(res.events.filter(x=>x.lifeSteal).length,0);
});
test("life steal authoring fields remain available in the Human Editor without rewriting beam slots",async()=>{
 const {readFile}=await import("node:fs/promises");
 const ui=await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
 for(const marker of ["skillEffectLifeStealPercent","skillEffectLifeStealMaxHeal",
  "data-skill-effect-life-steal-percent","data-skill-effect-life-steal-max-heal"]){
  assert.ok(ui.includes(marker),marker);
 }
});
