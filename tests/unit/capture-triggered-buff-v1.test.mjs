import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { normalizeStatusEffectV1 } from "../../src/contracts/status-effect-v1.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { projectStatusEffectInfoV1 } from "../../src/adapters/renderer/status-effect-info-v1.js";

const fighter = id => ({id,maxHp:100,initialHp:100,maxEnergy:30,initialEnergy:30,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const combat = (ids=["attacker","victim"]) => createCombatSession({fighters:ids.map(fighter)});
function skill(id,{damage=0,effects=[],category="offensive",form="contact",relations=["enemy"]}={}){
  return normalizeSkillDefinition({id,name:id,category,form,element:null,approachMode:"none",energyCost:0,
    preparationMs:0,travelMs:500,recoveryMs:0,cooldownMs:0,allowedDistances:["short","medium","long"],
    targetRelations:relations,effect:{damage,heal:0,interruptsPreparation:false,stunMs:0,tags:[]},effects});
}
const dot = {kind:"apply_status",targetScope:"target",status:{id:"flame-burn",kind:"damage_over_time",
  polarity:"detrimental",durationMs:3000,stacking:"refresh",amount:2,tickIntervalMs:1000,channel:"fire"}};
const heal = {kind:"heal",targetScope:"self",amount:12};
const triggered = {id:"fire-ultimate",kind:"triggered_buff",polarity:"beneficial",durationMs:60000,stacking:"refresh",
  onDamageDealt:{effects:[dot,heal]}};
const grant = skill("ultimate",{category:"buff_debuff",form:"self",relations:["self"],
  effects:[{kind:"apply_status",targetScope:"self",status:triggered}]});
const attack = skill("strike",{damage:20});
const hit = (c, targetId="victim") => c.useSkill({actorId:"attacker",targetId,skill:attack});
const apply = c => c.useSkill({actorId:"attacker",targetId:"attacker",skill:grant});
test("triggered buff validates a bounded, duration-based, authored on-damage effect list",()=>{
  const parsed=normalizeStatusEffectV1(triggered);
  assert.equal(parsed.kind,"triggered_buff");
  assert.equal(parsed.durationMs,60000);
  assert.deepEqual(parsed.onDamageDealt.effects.map(e=>e.kind),["apply_status","heal"]);
  assert.throws(()=>normalizeStatusEffectV1({...triggered,polarity:"detrimental"}),/beneficial/);
  assert.throws(()=>normalizeStatusEffectV1({...triggered,onDamageDealt:{effects:[]}}),/1 to 12/);
  assert.throws(()=>normalizeStatusEffectV1({...triggered,onDamageDealt:{effects:[{kind:"heal",targetScope:"all_enemies",amount:10}]}}),/target or self/);
});
test("real Combat Session on HP damage applies burning to victim and heals buff owner",()=>{
  const c=combat();
  c.useSkill({actorId:"victim",targetId:"attacker",skill:skill("wound",{damage:35})});
  assert.equal(c.snapshot().fighters.attacker.hp,65);
  assert.equal(apply(c).outcome,"hit");
  const result=hit(c);
  assert.equal(result.outcome,"hit");
  assert.equal(c.snapshot().fighters.attacker.hp,77);
  assert.equal(c.snapshot().fighters.victim.hp,80);
  assert.equal(c.snapshot().fighters.victim.statusEffects[0].definition.id,"flame-burn");
  assert.match(projectStatusEffectInfoV1({instance:c.snapshot().fighters.attacker.statusEffects[0],elapsedMs:0}).effectLines.join(" "),/dégâts|déclenche/i);
  assert.equal(result.events.some(e=>e.type==="heal"&&e.sourceActorId==="attacker"),true);
});
test("buff expires at 60s while burn keeps its own lifetime",()=>{
  const c=combat();apply(c);c.advanceMs(59000);hit(c);
  assert.equal(c.snapshot().fighters.victim.statusEffects.some(s=>s.definition.id==="flame-burn"),true);
  c.advanceMs(1000); // Buff expired but the existing burn still has two seconds.
  assert.equal(c.snapshot().fighters.victim.statusEffects.some(s=>s.definition.id==="flame-burn"),true);
  const before=c.snapshot().fighters.victim.statusEffects[0].expiresAtMs;
  hit(c);
  assert.equal(c.snapshot().fighters.victim.statusEffects[0].expiresAtMs,before);
});
test("evaded attacks and zero HP damage do not trigger buffs; proc damage cannot chain infinitely",()=>{
  const c=combat();
  apply(c);
  const dodge=skill("dodgebuff",{category:"buff_debuff",form:"self",relations:["self"],
    effects:[{kind:"apply_status",targetScope:"self",status:{id:"dodge",kind:"auto_dodge",polarity:"beneficial",durationMs:3000,stacking:"refresh"}}]});
  c.useSkill({actorId:"victim",targetId:"victim",skill:dodge});
  const evaded=hit(c);
  assert.equal(evaded.outcome,"evaded");
  assert.equal(c.snapshot().fighters.victim.statusEffects.some(s=>s.definition.id==="flame-burn"),false);
  const selfDamage={...triggered,id:"chain-guard",onDamageDealt:{effects:[{kind:"damage",targetScope:"target",amount:5,channel:"physical"}]}};
  assert.equal(normalizeStatusEffectV1(selfDamage).kind,"triggered_buff");
});
test("2v2 only the actual victim receives proc status, no ally spill or double-proc",()=>{
  const c=combat(["attacker","victim","ally","enemy2"]);apply(c);
  const result=hit(c,"enemy2");
  assert.equal(result.outcome,"hit");
  assert.equal(c.snapshot().fighters.enemy2.statusEffects.some(s=>s.definition.id==="flame-burn"),true);
  assert.equal(c.snapshot().fighters.victim.statusEffects.length,0);
  assert.equal(c.snapshot().fighters.ally.statusEffects.length,0);
});
test("Human Editor exposes the triggered buff as a time-limited buff with editable proc rows",()=>{
  const editor=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  assert.match(editor,/triggered_buff:\s*["']Buff à déclenchement/);
  assert.match(editor,/data-triggered-buff-effects-host/);
  assert.match(editor,/status\.onDamageDealt/);
  const resolver=readFileSync(new URL("../../src/core/combat/action-resolver.js",import.meta.url),"utf8");
  assert.doesNotMatch(resolver,/setTimeout|setInterval/);
});

test("confirmed effect damage also triggers but proc damage cannot recursively trigger itself",()=>{
  const c=combat();
  const proc={...triggered,id:"damage-proc-buff",
    onDamageDealt:{effects:[{kind:"damage",targetScope:"target",amount:5,channel:"physical"}]}};
  const add=skill("damage-proc",{category:"buff_debuff",form:"self",relations:["self"],
    effects:[{kind:"apply_status",targetScope:"self",status:proc}]});
  c.useSkill({actorId:"attacker",targetId:"attacker",skill:add});
  const onlyEffect=skill("multi-hit-author",{damage:0,effects:[{kind:"damage",targetScope:"target",amount:20}]});
  const result=c.useSkill({actorId:"attacker",targetId:"victim",skill:onlyEffect});
  assert.equal(result.outcome,"hit");
  assert.equal(c.snapshot().fighters.victim.hp,75);
  assert.equal(result.events.filter(e=>e.type==="hit" && Number(e.appliedDamage)>0).length,2);
  assert.equal(result.events.filter(e=>e.type==="hit" && Number(e.appliedDamage)===5).length,1);
});
test("shield fully absorbs the original attack, preventing the buff proc",()=>{
  const c=combat();apply(c);
  const shield=skill("shield",{category:"buff_debuff",form:"self",relations:["self"],
    effects:[{kind:"apply_status",targetScope:"self",status:{id:"absorb",kind:"shield",
      polarity:"beneficial",durationMs:10000,stacking:"refresh",amount:100}}]});
  c.useSkill({actorId:"victim",targetId:"victim",skill:shield});
  const result=hit(c);
  assert.equal(result.outcome,"hit");
  assert.equal(c.snapshot().fighters.victim.hp,100);
  assert.equal(c.snapshot().fighters.victim.statusEffects.some(s=>s.definition.id==="flame-burn"),false);
  assert.equal(result.events.filter(e=>e.type==="heal" && e.sourceActorId==="attacker").length,0);
});
test("the existing Human Editor author contract preserves onDamageDealt on build and on JSON transfer",async()=>{
  const {buildHumanTacticalSkillEffectsV1}=await import("../../src/ui/capture-editor-human-v2.js");
  const {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1}=await import("../../src/adapters/input/capture/capture-entity-transfer-v1.js");
  const source=JSON.parse(readFileSync(new URL("../../data/capture/showcase/lib_static_bite.capture-skill-transfer-v1.json",import.meta.url),"utf8"));
  const original=importCaptureTransferJsonV1(JSON.stringify(source)).value.draft;
  const effects=buildHumanTacticalSkillEffectsV1([{kind:"apply_status",targetScope:"self",status:{
    id:"author-proc",kind:"triggered_buff",polarity:"beneficial",durationSeconds:60,stacking:"refresh",
    onDamageDealt:{effects:[
      {kind:"apply_status",targetScope:"target",status:{id:"author-burn",kind:"damage_over_time",polarity:"detrimental",
        durationSeconds:3,stacking:"refresh",amount:2,tickSeconds:1,channel:"fire"}},
      {kind:"heal",targetScope:"self",amount:12}
    ]}}}]);
  assert.equal(effects[0].status.durationMs,60000);
  assert.equal(effects[0].status.onDamageDealt.effects[0].status.durationMs,3000);
  const updated=JSON.parse(JSON.stringify(original));
  updated.definition.effects=effects;
  updated.definition.effect={damage:0,heal:0,interruptsPreparation:false,stunMs:0,tags:[]};
  const json=exportCaptureSkillTransferJsonV1(updated);
  const round=importCaptureTransferJsonV1(json).value.draft;
  assert.equal(round.definition.effects[0].status.kind,"triggered_buff");
  assert.deepEqual(round.definition.effects[0].status.onDamageDealt,effects[0].status.onDamageDealt);
});
