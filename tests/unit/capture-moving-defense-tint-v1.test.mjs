import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeStatusEffectV1 } from "../../src/contracts/status-effect-v1.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { computeCombatDamageV1 } from "../../src/core/combat/combat-damage-v1.js";
import { buildHumanTacticalSkillEffectsV1 } from "../../src/ui/capture-editor-human-v2.js";
import { createDomStatusFxRenderer } from "../../src/adapters/renderer/dom-status-fx.js";

const armor = {id:"rolling-armor",kind:"stat_modifier",polarity:"beneficial",durationMs:5000,
  stacking:"refresh",statId:"defense",deltaPoints:50,activationCondition:"moving"};
const fighter = id => ({id,maxHp:200,initialHp:200,maxEnergy:10,initialEnergy:10,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,
  statValuesById:{defense:20},statEffectRulesById:{defense:{
    damageChannel:null,resistanceChannel:null,damagePctPerPoint:0,
    resistancePctPerPoint:0,chargeTimeReductionPctPerPoint:0,damageReductionPctPerPoint:.2
  }}});
function skill(id,{type="movement",effect=[],travelMs=1000,preparationMs=100}={}) {
  return normalizeSkillDefinition({
    id,name:id,category:type==="buff"?"buff_debuff":"offensive",
    form:type==="buff"?"self":"contact",
    element:null,approachMode:type==="buff"?"none":"ground",energyCost:0,
    preparationMs:type==="buff"?0:preparationMs,
    travelMs:type==="buff"?0:travelMs,recoveryMs:0,cooldownMs:0,
    allowedDistances:["short","medium","long"],
    targetRelations:type==="buff"?["self"]:["enemy"],
    effect:{damage:0,heal:0,interruptsPreparation:false,stunMs:0,tags:[]},
    effects:effect
  });
}
function setup() {
  const session=createCombatSession({fighters:[fighter("player"),fighter("opponent")]});
  const grant=skill("iron-shell",{type:"buff",effect:[{kind:"apply_status",targetScope:"self",status:armor}]});
  assert.equal(session.useSkill({actorId:"opponent",targetId:"opponent",skill:grant}).ok,true);
  let clock=0, tick=()=>{};
  const runtime=createCombatRuntime({session,now:()=>clock,setTimer:fn=>(tick=fn,1),clearTimer:()=>{}});
  runtime.start();
  const damage=()=>computeCombatDamageV1({state:session.snapshot(),attackerId:"player",targetId:"opponent",baseDamage:100,channel:"physical"});
  const step=ms=>{clock=ms;tick()};
  return {session,runtime,damage,step,move:()=>runtime.startSkill({
    actorId:"opponent",targetId:"player",skill:skill("roll")
  }),dispose:()=>runtime.dispose()};
}
test("author can condition an existing stat buff on real movement; legacy stays unchanged",()=>{
  assert.equal(normalizeStatusEffectV1(armor).activationCondition,"moving");
  assert.equal(normalizeStatusEffectV1({...armor,activationCondition:"always"}).activationCondition,undefined);
  assert.throws(()=>normalizeStatusEffectV1({...armor,activationCondition:"flying"}),/activationCondition/);
  const effects=buildHumanTacticalSkillEffectsV1([{kind:"apply_status",targetScope:"self",status:{
    ...armor,durationSeconds:5,durationMs:undefined
  }}]);
  assert.equal(effects[0].status.activationCondition,"moving");
  const editor=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  assert.match(editor,/data-skill-status-activation-condition/);
  assert.match(editor,/Uniquement pendant le déplacement réel/);
});
test("enemy Scarabacier gains defense only during the native approach phase",()=>{
  const h=setup();
  assert.equal(h.damage().damage,100);
  assert.equal(h.move().ok,true);
  assert.equal(h.damage().damage,100,"buff must not apply during charge");
  h.step(100);
  assert.equal(h.session.snapshot().fighters.opponent.movementActive,true);
  assert.equal(h.damage().damage,90,"+50 defense at 0.2% per point = 10% reduction");
  h.step(500);
  assert.equal(h.damage().damage,90);
  h.step(1100);
  assert.equal(h.session.snapshot().fighters.opponent.movementActive,false);
  assert.equal(h.damage().damage,100,"impact/recovery stops bonus");
  h.dispose();
});
test("interruption clears movement armor before any new incoming hit",()=>{
  const h=setup();
  h.move();h.step(100);
  assert.equal(h.damage().damage,90);
  h.runtime.cancelActionsForActor("opponent",{reason:"stun"});
  assert.equal(h.damage().damage,100);
  assert.equal(h.session.snapshot().fighters.opponent.movementActive,false);
  h.dispose();
});
function node(doc) {
  return {ownerDocument:doc,style:{},dataset:{},children:[],append(child){this.children.push(child)},
    remove(){this.removed=true}};
}
test("status tint rebinds to rolling shell, uses sphere mask, returns to standing body",()=>{
  const doc={createElement(){return node(doc)}};
  const motion=node(doc),image=node(doc),rolling=node(doc);
  image.src="https://example.test/standing.png";
  let tintHost=motion,maskUrl=null;
  const renderer=createDomStatusFxRenderer({
    targetFor:()=>({motion,image,tintHost,tintMaskUrl:maskUrl}),
    statusPresentationFor:()=>({mode:"tint",tintColor:"#dd8844",tintOpacity:.6})
  });
  const state={fighters:{opponent:{statusEffects:[{definition:{id:"shield-tint",kind:"stat_modifier",polarity:"beneficial"}}]}}};
  renderer.sync(state);
  assert.equal(motion.children.length,1);
  tintHost=rolling;
  maskUrl="https://example.test/rolling-ball.png";
  renderer.sync(state);
  assert.equal(motion.children[0].removed,true);
  assert.equal(rolling.children.length,1);
  assert.match(rolling.children[0].style.maskImage,/rolling-ball\.png/);
  assert.doesNotMatch(rolling.children[0].style.maskImage,/standing/);
  tintHost=motion;maskUrl=null;
  renderer.sync(state);
  assert.equal(rolling.children[0].removed,true);
  assert.equal(motion.children.length,2);
  renderer.dispose();
});
