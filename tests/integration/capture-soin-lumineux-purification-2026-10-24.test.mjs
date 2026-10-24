import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";

const transfer=()=>JSON.parse(readFileSync(new URL(
  "../../data/capture/showcase/cap_light_special_1.capture-skill-transfer-v1.json",import.meta.url),"utf8"));
const config=(id,effects,relations=["enemy"])=>normalizeSkillDefinition({
  id,name:id,category:"buff_debuff",form:"self",element:"light",
  approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,
  recoveryMs:0,cooldownMs:0,
  allowedDistances:["short","medium","long"],targetRelations:relations,
  effects
});
const fighter=(id,hp=100)=>({id,maxHp:100,initialHp:hp,maxEnergy:50,initialEnergy:50,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const cast=(session,actorId,targetId,skill)=>{
  const response=session.useSkill({actorId,targetId,skill});
  assert.equal(response.ok,true,JSON.stringify(response));
};
const marker=(id,polarity)=>({
  kind:"apply_marker",targetScope:"target",charges:3,
  marker:{id,name:id,polarity,durationMs:30000,maxStacks:10}
});
const status=(id,polarity,pct)=>({
  kind:"apply_status",targetScope:"target",
  status:{id,kind:"outgoing_damage_modifier",polarity,durationMs:30000,
    stacking:"refresh",modifierPct:pct,tags:[]}
});
test("Soin lumineux creator revision has heal + native cleanse without consuming beneficial markers or dealing damage",()=>{
  const d=transfer().draft;
  assert.equal(d.id,"cap_light_special_1");
  assert.equal(d.definition.name,"Soin lumineux");
  assert.deepEqual(d.definition.effects,[{kind:"heal",targetScope:"target",amount:35},
    {kind:"cleanse",targetScope:"target",statusTags:[]}]);
  assert.deepEqual(d.definition.targetRelations,["ally","self"]);
  assert.deepEqual(d.definition.targetLocations,["active","reserve"]);
  assert.equal(d.definition.energyCost,5);
  assert.equal(d.definition.cooldownMs,30000);
  assert.equal(d.presentation.version,9);
  assert.equal(d.presentation.visual.icon.assetId,"core:icon-skill-healing-heart-01");
});
test("native CombatSession cleanses negative status and marker; keeps positive/neutral ones; heals 35 without hurting ally",()=>{
  const s=createCombatSession({fighters:[fighter("player",40),fighter("opponent")]});
  // All effects are applied through actual native combat skill resolution.
  cast(s,"opponent","player",config("debuff",
    [status("slow-test","detrimental",-25),marker("venin-test","detrimental")]));
  cast(s,"player","player",config("buff",
    [status("strength-test","beneficial",20),marker("boost-test","beneficial")],["self"]));
  cast(s,"player","player",config("neutral",
    [marker("mark-neutral-test","neutral")],["self"]));
  const before=s.snapshot().fighters.player.statusEffects;
  assert.equal(before.length,5);
  assert.equal(before.filter(x=>x.definition.polarity==="detrimental").length,2);
  const d=transfer().draft.definition;
  cast(s,"player","player",d);
  const after=s.snapshot().fighters.player;
  assert.equal(after.hp,75);
  assert.equal(after.energy,45);
  assert.deepEqual(after.statusEffects.map(x=>x.definition.id).sort(),
    ["marker:boost-test","marker:mark-neutral-test","strength-test"].sort());
  assert.equal(after.statusEffects.some(x=>x.definition.id==="marker:venin-test"),false);
  assert.equal(after.statusEffects.some(x=>x.definition.id==="slow-test"),false);
});
test("Soin lumineux heals even with no markers; it does not require consuming one",()=>{
  const s=createCombatSession({fighters:[fighter("player",10),fighter("opponent")]});
  cast(s,"player","player",transfer().draft.definition);
  assert.equal(s.snapshot().fighters.player.hp,45);
  assert.equal(s.snapshot().fighters.player.energy,45);
  assert.deepEqual(s.snapshot().fighters.player.statusEffects,[]);
});
test("Bestiary describes all negative effects and markers, never charges or bonus damage",()=>{
  const d=transfer().draft.definition;
  const text=describeCaptureSkillV1(d).sentences.join(" ");
  assert.match(text,/Rend 35 PV à la cible et supprime tous ses effets et marqueurs négatifs/);
  assert.doesNotMatch(text,/Consomme.*charges|10 dégâts|marqueur « \* »|retire des bonus/);
});
