import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {normalizeBattleFormatDefinition} from "../../src/contracts/battle-format-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {applyCombatDamageV1} from "../../src/core/combat/combat-damage-application-v1.js";
const source=id=>normalizeCaptureSkillTransferV1(JSON.parse(readFileSync(
  new URL("../../data/capture/showcase/"+id+".capture-skill-transfer-v1.json",import.meta.url),
  "utf8"))).draft.definition;
const descriptions=id=>describeCaptureSkillV1(source(id)).sentences.join(" ");

test("Bestiary derives all five Raiiven abilities from their active canonical definitions",()=>{
  const mark=descriptions("raiiven-fer-maudit");
  assert.match(mark,/12 dégâts/);
  assert.match(mark,/6 secondes/);
  assert.match(mark,/8 dégâts/);
  assert.match(mark,/prochaine compétence offensive/);
  const decoys=descriptions("raiiven-dedale-silhouettes");
  assert.match(decoys,/2 leurres/);
  assert.match(decoys,/20 secondes/);
  assert.match(decoys,/10 dégâts/);
  const siphon=descriptions("raiiven-vol-foulees");
  assert.match(siphon,/5 \+ 5 dégâts/);
  assert.match(siphon,/MAXIMALE/);
  assert.match(siphon,/Vole jusqu'à 1 charge/);
  const echo=descriptions("raiiven-remanence-interdite");
  assert.match(echo,/dernière compétence/);
  assert.match(echo,/hors ultime/);
  assert.match(echo,/60 %/);
  const charge=descriptions("raiiven-cavalcade-damnes");
  assert.match(charge,/3 passages/);
  assert.match(charge,/40 dégâts/);
  assert.match(charge,/5 chevaux/);
});

test("DoT damage on the real Raiiven removes all native decoy statuses, but zero HP loss does not",()=>{
  const format=normalizeBattleFormatDefinition({
    id:"raiiven-dot-decoy-regression",localActorId:"raiiven",
    teams:{players:["raiiven"],enemies:["enemy"]},
    actors:[
      {actorId:"raiiven",teamId:"players",creatureId:"raiiven",displayName:"Raiiven",
        fighterConfigId:"raiiven",controllerId:"human-local"},
      {actorId:"enemy",teamId:"enemies",creatureId:"enemy",displayName:"Enemy",
        fighterConfigId:"enemy",controllerId:"ai-enemy"}
    ]});
  const fighter=id=>({id,maxHp:160,initialHp:160,maxEnergy:30,initialEnergy:30,
    energyChargeAmount:0,energyChargeIntervalMs:2000,
    movementEnergyPerStep:0,chargeTimeModifierPct:0});
  const session=createCombatSession({battleFormat:format,fighters:[fighter("raiiven"),fighter("enemy")]});
  assert.equal(session.useSkill({actorId:"raiiven",targetId:"raiiven",
    skill:source("raiiven-dedale-silhouettes")}).ok,true);
  const original=session.snapshot();
  const active=s=>s.fighters.raiiven.statusEffects.filter(x=>x.definition.kind==="decoy");
  assert.equal(active(original).length,2);
  const zero=applyCombatDamageV1({state:original,sourceActorId:"enemy",targetActorId:"raiiven",
    incomingKind:"dot",damage:0});
  assert.equal(zero.appliedDamage,0);
  assert.equal(active(zero.state).length,2);
  const realTick=applyCombatDamageV1({state:original,sourceActorId:"enemy",
    targetActorId:"raiiven",incomingKind:"dot",damage:9});
  assert.equal(realTick.appliedDamage,9);
  assert.equal(realTick.state.fighters.raiiven.hp,151);
  assert.equal(active(realTick.state).length,0,
    "a poison/burn tick must expose the original without adding a parallel combat authority");
});
