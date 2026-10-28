import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {buildHumanTacticalSkillEffectsV1} from "../../src/ui/capture-editor-human-v2.js";

const fighter=id=>({id,maxHp:300,initialHp:300,maxEnergy:100,initialEnergy:100,
  movementEnergyPerStep:0,energyChargeAmount:0,energyChargeIntervalMs:0});
const skill=(id,effects=[],damage=0)=>normalizeSkillDefinition({
  id,name:id,category:"offensive",form:"projectile",element:"physical",
  approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,
  recoveryMs:0,cooldownMs:0,targetRelations:["enemy"],
  allowedDistances:["short","medium","long"],
  effect:{damage,heal:0,stunMs:0,tags:[]},effects
});

test("authoring Sommeil round-trips no timer and no manual ID",()=>{
  const original=[{kind:"apply_status",targetScope:"target",status:{
    id:"status-1",kind:"stun",polarity:"detrimental",
    durationModel:"until_damage",stacking:"refresh",tags:[]
  }}];
  const built=buildHumanTacticalSkillEffectsV1(original);
  assert.equal(built[0].status.durationModel,"until_damage");
  assert.equal("durationMs" in built[0].status,false);
  assert.deepEqual(buildHumanTacticalSkillEffectsV1(JSON.parse(JSON.stringify(built))),built);
  assert.equal(skill("somnifer",built).effects[0].status.durationModel,"until_damage");
});

test("authoring any immediate target effect retains its independent condition",()=>{
  const inputs=[
    {kind:"damage",targetScope:"target",amount:100,condition:{type:"sleep"}},
    {kind:"heal",targetScope:"self",amount:15,condition:{type:"status_kind",value:"shield"}},
    {kind:"energy_drain",targetScope:"target",amount:2,
      condition:{type:"marker",value:"venin",minimum:3}},
    {kind:"cleanse",targetScope:"target",statusTags:[],
      condition:{type:"status_kind",value:"stun",invert:true}}
  ];
  const effects=buildHumanTacticalSkillEffectsV1(inputs);
  assert.deepEqual(effects.map(x=>x.condition.type),["sleep","status_kind","marker","status_kind"]);
  assert.equal(effects[2].condition.minimum,3);
  assert.equal(effects[3].condition.invert,true);
  assert.deepEqual(buildHumanTacticalSkillEffectsV1(JSON.parse(JSON.stringify(effects))),effects);
});

test("a real combat action checks sleeping target before its initial direct hit wakes it",()=>{
  const session=createCombatSession({distance:"short",fighters:[fighter("a"),fighter("b")]});
  const sleeper=skill("sleep",[{
    kind:"apply_status",targetScope:"target",
    status:{id:"nap",kind:"stun",polarity:"detrimental",durationModel:"until_damage",stacking:"refresh",tags:[]}
  }]);
  assert.equal(session.useSkill({actorId:"a",targetId:"b",skill:sleeper}).ok,true);
  assert.equal(session.snapshot().fighters.b.statusEffects.length,1);
  const bonus=skill("punish",[{kind:"damage",targetScope:"target",amount:100,condition:{type:"sleep"}}],10);
  assert.equal(session.useSkill({actorId:"a",targetId:"b",skill:bonus}).ok,true);
  assert.equal(session.snapshot().fighters.b.hp,190,"10 direct + 100 bonus during the same hit");
  assert.equal(session.snapshot().fighters.b.statusEffects.length,0);
  assert.equal(session.useSkill({actorId:"a",targetId:"b",skill:bonus}).ok,true);
  assert.equal(session.snapshot().fighters.b.hp,180,"without sleep only original 10 applies");
});

test("Human Editor uses a single conditional selector with registered markers and sleep toggle",async()=>{
  const source=await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  const fields=await readFile(new URL("../../src/ui/capture-effect-condition-fields-v1.js",import.meta.url),"utf8");
  assert.match(source,/appendCaptureEffectConditionFieldsV1/);
  assert.match(source,/readCaptureEffectConditionV1\(rows\[index\]\)/);
  assert.match(source,/skillStatusSleepUntilDamage/);
  assert.match(fields,/markerOptions\(root\)/);
  assert.match(fields,/Sommeil|endormie/);
  assert.doesNotMatch(fields,/prompt\(|window\.prompt\(/);
});
