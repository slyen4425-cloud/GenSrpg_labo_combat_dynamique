import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeStatusEffectV1} from "../../src/contracts/status-effect-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {applyStatusEffectV1,advanceStatusEffectsV1,removeStatusEffectsV1} from "../../src/core/combat/status-effect-runtime-v1.js";
import {applyCombatHealV1} from "../../src/core/combat/combat-damage-application-v1.js";
import {buildHumanTacticalSkillEffectsV1} from "../../src/ui/capture-editor-human-v2.js";
import {describeCaptureStatusEffectV1} from "../../src/ui/capture-skill-explanation-v1.js";

const fighter=(id,hp=100)=>({id,maxHp:300,initialHp:hp,maxEnergy:10,initialEnergy:10});
const base=(hp=100)=>createCombatState({fighters:[fighter("caster"),fighter("victim",hp)]});
const curse=(percent=100,options={})=>normalizeStatusEffectV1({
  id:options.id??"heal-inversion-test",kind:"heal_inversion",polarity:"detrimental",
  durationModel:"time_ms",durationMs:options.durationMs??3000,
  stacking:options.stacking??"refresh",maxStacks:options.maxStacks??3,
  percent,tags:[]
});
const give=(s,status=curse(),target="victim",source="caster")=>
  applyStatusEffectV1({state:s,targetActorId:target,sourceActorId:source,
    sourceSkillId:status.id,status});
const heal=(s,amount=40,atMs=s.elapsedMs)=>
  applyCombatHealV1({state:s,targetActorId:"victim",amount,atMs});

test("RED — contract requires harmful, finite, configurable 0–100 percent",()=>{
  for(const pct of [0,25,50,100]){
    const s=curse(pct);
    assert.equal(s.kind,"heal_inversion");
    assert.equal(s.percent,pct);
    assert.equal(Object.isFrozen(s),true);
  }
  for(const pct of [-1,101,NaN,Infinity])
    assert.throws(()=>curse(pct),/percent/i);
  assert.throws(()=>normalizeStatusEffectV1({
    id:"beneficial-curse",kind:"heal_inversion",polarity:"beneficial",
    durationMs:1000,stacking:"refresh",percent:25
  }),/detrimental/i);
});

test("RED — 25/50/100% converts a real heal into canonical damage before residual healing",()=>{
  for(const [pct,damage,gain,after] of [
    [25,10,30,120],[50,20,20,100],[100,40,0,60]
  ]){
    const applied=heal(give(base(),curse(pct)));
    assert.equal(applied.convertedRequested,damage,pct+"% requested damage");
    assert.equal(applied.convertedDamage,damage,pct+"% real damage");
    assert.equal(applied.applied,gain,pct+"% remaining healing");
    assert.equal(applied.hpAfter,after,pct+"% final HP");
    assert.equal(applied.netHpDelta,after-100);
    assert.equal(applied.state.fighters.caster.damageDealtTotal,damage);
    assert.equal(applied.curseSourceActorId,"caster");
  }
});

test("normal heal, expiry, cleanse and 4-fighter isolation preserve ordinary owner",()=>{
  assert.equal(heal(base()).applied,40);
  const four=createCombatState({fighters:[
    fighter("caster"),fighter("victim"),fighter("ally"),fighter("enemy")
  ]});
  let s=give(four,curse(50));
  const victim=heal(s);
  assert.equal(victim.state.fighters.victim.hp,100);
  assert.equal(victim.state.fighters.ally.hp,100);
  assert.equal(victim.state.fighters.enemy.hp,100);
  assert.equal(heal(s,40,3001).applied,40,"status expires at 3000");
  s=removeStatusEffectsV1({state:s,targetActorId:"victim",polarity:"detrimental"});
  assert.equal(heal(s).applied,40,"existing cleanse owner removes the curse");
});

test("stacking and incoming heal modifiers use the one native clock and saturate at 100%",()=>{
  let s=give(base(),curse(40,{stacking:"stack"}));
  s=give(s,curse(40,{stacking:"stack"}));
  assert.equal(heal(s).convertedRequested,32,"two 40% stacks");
  s=give(s,curse(40,{stacking:"stack"}));
  const capped=heal(s);
  assert.equal(capped.convertedRequested,40);
  assert.equal(capped.applied,0,"120% must not turn into arbitrary amplification");
  const buff=normalizeStatusEffectV1({
    id:"healing-boost",kind:"incoming_effect_modifier",polarity:"beneficial",
    durationMs:3000,stacking:"refresh",modifierPct:50,affectedPolarity:"beneficial"
  });
  let boosted=give(base(),curse(25));
  boosted=give(boosted,buff);
  const out=heal(boosted);
  assert.equal(out.adjusted,60);
  assert.equal(out.convertedRequested,15);
  assert.equal(out.applied,45);
  assert.equal(out.hpAfter,130);
});

test("conversion uses canonical shield/immunity/KO owner; no resurrection or reflected loop",()=>{
  const shield=normalizeStatusEffectV1({
    id:"shield",kind:"shield",polarity:"beneficial",durationMs:3000,
    stacking:"refresh",amount:15
  });
  let protectedState=give(base(),curse());
  protectedState=give(protectedState,shield);
  const shieldHit=heal(protectedState);
  assert.equal(shieldHit.convertedRequested,40);
  assert.equal(shieldHit.absorbedByShield,15);
  assert.equal(shieldHit.convertedDamage,25);
  assert.equal(shieldHit.hpAfter,75);
  const immunity=normalizeStatusEffectV1({
    id:"immune-damage",kind:"immunity",polarity:"beneficial",
    durationMs:3000,stacking:"refresh",domains:["damage"]
  });
  const immune=heal(give(give(base(),curse()),immunity));
  assert.equal(immune.convertedDamage,0);
  assert.equal(immune.immuneDamage,40);
  assert.equal(immune.hpAfter,100);
  const lethal=heal(give(base(20),curse(50)));
  assert.equal(lethal.convertedDamage,20);
  assert.equal(lethal.applied,0,"remaining heal cannot revive converted KO");
  assert.equal(lethal.hpAfter,0);
  assert.equal(lethal.state.fighters.caster.knockoutsTotal,1);
  const atMax=heal(give(base(300),curse(100)));
  assert.equal(atMax.hpAfter,260,"convert before maxHP cap");
});

test("HoT and marker healing share the one central conversion, never another periodic damage tick",()=>{
  const hot=normalizeStatusEffectV1({
    id:"regen",kind:"heal_over_time",polarity:"beneficial",
    durationMs:3000,stacking:"refresh",amount:20,tickIntervalMs:1000
  });
  let s=give(base(),curse());
  s=give(s,hot,"victim","victim");
  const after=advanceStatusEffectsV1({state:s,deltaMs:1000});
  assert.equal(after.fighters.victim.hp,80,
    "native HoT tick should become exactly 20 converted damage");
  assert.equal(after.fighters.caster.damageDealtTotal,20);
});

test("real CombatSession applies curse to an opponent and emits dedicated conversion for a heal",()=>{
  const mk=(id,effects,form="self",targetRelations=["self"])=>normalizeSkillDefinition({
    id,name:id,category:"buff_debuff",form,approachMode:"none",
    targetRelations,allowedDistances:["short","medium","long"],
    energyCost:0,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
    effect:{damage:0,heal:0,tags:[]},effects
  });
  const session=createCombatSession({
    distance:"short",fighters:[fighter("caster",70),fighter("victim",100)]
  });
  const debuff=mk("inverse",[{kind:"apply_status",targetScope:"target",
    status:curse(100)}],"area",["enemy"]);
  assert.equal(session.useSkill({actorId:"victim",targetId:"caster",skill:debuff}).ok,true);
  const cure=mk("cure",[{kind:"heal",targetScope:"self",amount:30}]);
  const result=session.useSkill({actorId:"caster",targetId:"caster",skill:cure});
  assert.equal(result.ok,true);
  assert.equal(session.snapshot().fighters.caster.hp,40);
  assert.equal(result.events.some(e=>e.type==="heal-converted" &&
    e.appliedDamage===30 && e.sourceActorId==="victim"),true);
  assert.equal(result.events.some(e=>e.type==="heal" && e.applied>0),false,
    "the UI cannot report converted damage as an effective cure");
});

test("author editor exports native effect and Bestiary explains rate/duration/target",()=>{
  const effects=buildHumanTacticalSkillEffectsV1([{
    kind:"apply_status",targetScope:"target",status:{
      id:"curse",kind:"heal_inversion",polarity:"detrimental",
      durationSeconds:20,stacking:"stack",maxStacks:3,percent:50,tags:[]
    }
  }]);
  assert.equal(effects[0].status.kind,"heal_inversion");
  assert.equal(effects[0].status.percent,50);
  assert.equal(effects[0].status.durationMs,20000);
  assert.equal(effects[0].status.maxStacks,3);
  const prose=describeCaptureStatusEffectV1(effects[0]).join(" ");
  assert.match(prose,/50 % des soins reçus/i);
  assert.match(prose,/cible/i);
  const editor=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  assert.match(editor,/skillStatusHealInversionPercent/);
  assert.match(editor,/skillZoneStatusHealInversionPercent/);
  assert.match(editor,/heal_inversion:"Soin inversé/);
});
