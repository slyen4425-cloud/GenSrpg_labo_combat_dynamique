import test from "node:test";
import assert from "node:assert/strict";

import { normalizeStatusEffectV1 } from "../../src/contracts/status-effect-v1.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatState } from "../../src/core/combat/combat-state.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { applyCombatDamageV1 } from "../../src/core/combat/combat-damage-application-v1.js";
import { combatProtectionForIncomingV1 } from "../../src/core/combat/combat-protection-v1.js";
import { applyStatusEffectV1, advanceStatusEffectsV1 } from "../../src/core/combat/status-effect-runtime-v1.js";
import { applyImmediateTacticalEffectsV1 } from "../../src/core/combat/immediate-tactical-effects-v1.js";

const fighter = id => ({
  id, maxHp: 100, initialHp: 100, maxEnergy: 10, initialEnergy: 10,
  energyChargeAmount: 0, energyChargeIntervalMs: 2000,
  movementEnergyPerStep: 1, chargeTimeModifierPct: 0
});
const state = (ids = ["source", "target"]) =>
  createCombatState({ fighters: ids.map(fighter) });
const intangible = (overrides = {}) => normalizeStatusEffectV1({
  id: "phase", kind: "immunity", polarity: "beneficial",
  stacking: "refresh", durationMs: 2500,
  domains: ["damage", "negative_status"], intangible: true,
  ...overrides
});
const normalImmunity = () => normalizeStatusEffectV1({
  id: "other-immunity", kind: "immunity", polarity: "beneficial",
  stacking: "refresh", durationMs: 5000, domains: ["damage"]
});
function grant(s, status = intangible(), targetActorId = "target") {
  return applyStatusEffectV1({ state: s, sourceActorId: targetActorId,
    targetActorId, sourceSkillId: "phase-shift", status });
}
function skill(id, hitsIntangible, damage = 20, effects = []) {
  return normalizeSkillDefinition({
    id, name: id, category: "offensive", form: "contact",
    approachMode: "none", element: "physical",
    energyCost: 0, preparationMs: 0, travelMs: 0, recoveryMs: 0,
    cooldownMs: 0, allowedDistances: ["short", "medium", "long"],
    hitsIntangible, effect: { damage, heal: 0, tags: [] }, effects
  });
}

test("Intangible extends native immunity; legacy immunity remains independent", () => {
  assert.equal(intangible().intangible, true);
  assert.equal(normalImmunity().intangible ?? false, false);
  assert.throws(() => intangible({ domains: ["damage"] }), /intangible|domains/i);
  assert.throws(() => intangible({ polarity: "detrimental" }), /intangible|beneficial/i);
  assert.equal(skill("spirit-strike", true).hitsIntangible, true);
  assert.equal(skill("ordinary-strike", false).hitsIntangible, false);
  assert.throws(() => skill("invalid", "yes"), /hitsIntangible|boolean/i);
});

test("ordinary attacks and detrimental statuses pass through intangible without HP, shield or KO change", () => {
  let s = grant(state());
  const blocked = applyCombatDamageV1({
    state: s, sourceActorId: "source", targetActorId: "target",
    damage: 150, hitsIntangible: false
  });
  assert.equal(blocked.appliedDamage, 0);
  assert.equal(blocked.immuneDamage, 150);
  assert.equal(blocked.state.fighters.source.knockoutsTotal, 0);
  assert.equal(blocked.state.fighters.target.hp, 100);
  const detrimental = normalizeStatusEffectV1({
    id: "debuff", kind: "stun", polarity: "detrimental",
    stacking: "replace", durationMs: 1000
  });
  s = applyStatusEffectV1({ state: blocked.state, sourceActorId: "source",
    targetActorId: "target", sourceSkillId: "ordinary",
    status: detrimental, hitsIntangible: false });
  assert.equal(s.fighters.target.statusEffects.some(x => x.definition.id === "debuff"), false);
  assert.equal(combatProtectionForIncomingV1({state:s,targetActorId:"target",domain:"damage"}).protected,true);
});

test("explicit skill pierces ONLY intangible immunity, not independent ordinary immunity", () => {
  let s = grant(state());
  const actual = applyCombatDamageV1({ state:s, sourceActorId:"source",
    targetActorId:"target",damage:25,hitsIntangible:true });
  assert.equal(actual.appliedDamage, 25);
  assert.equal(actual.state.fighters.target.hp, 75);
  const normal = grant(actual.state, normalImmunity());
  const stillBlocked = applyCombatDamageV1({ state:normal, sourceActorId:"source",
    targetActorId:"target",damage:150,hitsIntangible:true });
  assert.equal(stillBlocked.appliedDamage,0);
  assert.equal(stillBlocked.state.fighters.target.hp,75);
  assert.equal(stillBlocked.state.fighters.source.knockoutsTotal,0);
});

test("intangible admits positive buffs but pierced attacks may apply negative statuses", () => {
  let s = grant(state());
  const buff = normalizeStatusEffectV1({
    id:"blessing",kind:"shield",polarity:"beneficial",amount:11,
    durationMs:2000,stacking:"refresh"
  });
  const stun = normalizeStatusEffectV1({
    id:"spirit-stun",kind:"stun",polarity:"detrimental",
    durationMs:1000,stacking:"replace"
  });
  s = applyStatusEffectV1({state:s,sourceActorId:"source",targetActorId:"target",
    sourceSkillId:"blessing",status:buff});
  assert.equal(s.fighters.target.statusEffects.some(x=>x.definition.id==="blessing"),true);
  s = applyStatusEffectV1({state:s,sourceActorId:"source",targetActorId:"target",
    sourceSkillId:"spirit-strike",status:stun,hitsIntangible:true});
  assert.equal(s.fighters.target.statusEffects.some(x=>x.definition.id==="spirit-stun"),true);
});

test("direct true CombatSession impact and tactical effects respect explicit intangible strike", () => {
  for(const hitsIntangible of [false,true]){
    const session = createCombatSession({fighters:[fighter("source"),fighter("target")]});
    const granted = session.useSkill({actorId:"target",targetId:"target",skill:normalizeSkillDefinition({
      id:"phase-self",name:"phase-self",category:"buff_debuff",form:"self",
      approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,recoveryMs:0,
      cooldownMs:0,allowedDistances:["short","medium","long"],targetRelations:["self"],
      effect:{damage:0,heal:0},effects:[{kind:"apply_status",targetScope:"self",
        status:intangible()}]
    })});
    assert.equal(granted.ok,true);
    const impact = session.useSkill({actorId:"source",targetId:"target",
      skill:skill(hitsIntangible ? "piercing" : "ordinary",hitsIntangible,20,
        [{kind:"apply_status",targetScope:"target",status:{
          id:"wound",kind:"stun",polarity:"detrimental",durationMs:900,stacking:"replace"
        }}])});
    assert.equal(impact.ok,true);
    const snap=session.snapshot();
    assert.equal(snap.fighters.target.hp,hitsIntangible?80:100);
    assert.equal(snap.fighters.target.statusEffects.some(x=>x.definition.id==="wound"),hitsIntangible);
  }
});

test("tactical damage and status use same protection owner for 1v1 and 2v2 actors", () => {
  for (const ids of [["source","target"],["source","partner","target","other"]]) {
    for(const hitsIntangible of [false,true]) {
      const s=grant(state(ids));
      const result=applyImmediateTacticalEffectsV1({state:s,actorId:"source",
        targetId:"target",atMs:0,skill:{id:"tactical",element:"physical",
          hitsIntangible,effects:[{kind:"damage",amount:20,targetScope:"target"},
            {kind:"apply_status",targetScope:"target",status:normalizeStatusEffectV1({
              id:"curse",kind:"silence",polarity:"detrimental",
              durationMs:1000,stacking:"replace"
            })}] }});
      assert.equal(result.state.fighters.target.hp,hitsIntangible?80:100);
      assert.equal(result.state.fighters.target.statusEffects.some(x=>x.definition.id==="curse"),hitsIntangible);
      if(ids.length===4)assert.equal(result.state.fighters.partner.hp,100);
    }
  }
});

test("expiration restores ordinary contact and damage while non-target teammates stay unchanged", () => {
  const s=advanceStatusEffectsV1({state:grant(state(["source","target","teammate"])),deltaMs:3000});
  const hit=applyCombatDamageV1({state:s,sourceActorId:"source",targetActorId:"target",
    damage:120,hitsIntangible:false});
  assert.equal(hit.state.fighters.target.hp,0);
  assert.equal(hit.state.fighters.source.knockoutsTotal,1);
  assert.equal(hit.state.fighters.teammate.hp,100);
});


test("native DoT keeps the original skill's intangible authorization across later ticks", () => {
  let s = state();
  const dot = id => normalizeStatusEffectV1({
    id, kind:"damage_over_time", polarity:"detrimental",
    durationMs:3000, tickIntervalMs:1000, stacking:"replace",
    amount:12, channel:"physical", damageMode:"fixed"
  });
  s = applyStatusEffectV1({state:s,targetActorId:"target",sourceActorId:"source",
    sourceSkillId:"ordinary-poison",status:dot("ordinary-dot")});
  s = applyStatusEffectV1({state:s,targetActorId:"target",sourceActorId:"source",
    sourceSkillId:"phase-poison",status:dot("phase-dot"),hitsIntangible:true});
  s=grant(s);
  s=advanceStatusEffectsV1({state:s,deltaMs:1000});
  assert.equal(s.fighters.target.hp,88,"ordinary DoT blocked; explicit phase DoT uses same native tick");
  assert.equal(s.fighters.source.damageDealtTotal,12);
});

test("persistent damage zone inherits authored intangible strike without a second tick authority", () => {
  for (const hitsIntangible of [false,true]) {
    const format = {
      actors:[{actorId:"source"},{actorId:"target"}],
      teamOf:id=>id==="source"?"local":"enemy"
    };
    const session=createCombatSession({
      distance:"short",fighters:[fighter("source"),fighter("target")],
      battleFormat:format
    });
    assert.equal(session.useSkill({actorId:"target",targetId:"target",
      skill:normalizeSkillDefinition({
        id:"phase-self",name:"phase-self",category:"buff_debuff",form:"self",
        approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,
        recoveryMs:0,cooldownMs:0,allowedDistances:["short","medium","long"],
        targetRelations:["self"],effect:{damage:0},effects:[{
          kind:"apply_status",targetScope:"self",status:intangible()
        }]
      })
    }).ok,true);
    const zoneSkill=normalizeSkillDefinition({
      id:"phase-flames",name:"phase-flames",category:"offensive",form:"aura",
      approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,
      recoveryMs:0,cooldownMs:0,allowedDistances:["short","medium","long"],
      targetRelations:["enemy"],hitsIntangible,effect:{damage:0},
      effects:[{
        kind:"persistent_zone",targetScope:"all_enemies",zoneId:"phase-zone",
        radius:"short",durationMs:3000,tickIntervalMs:1000,
        reactivation:"reinforce",maxActivations:1,radiusGrowthSteps:0,
        tickEffect:{kind:"damage",targetScope:"all_enemies",
          amount:15,channel:"physical"}
      }]
    });
    assert.equal(session.useSkill({actorId:"source",targetId:"target",skill:zoneSkill}).ok,true);
    assert.equal(session.snapshot().persistentZones.length,1);
    session.advanceMs(1000);
    assert.equal(session.snapshot().fighters.target.hp,hitsIntangible?85:100);
  }
});


test("legacy preparation-interrupt flag is still a negative effect even when its damage is zero", () => {
  const session=createCombatSession({fighters:[fighter("source"),fighter("target")]});
  session.useSkill({actorId:"target",targetId:"target",
    skill:normalizeSkillDefinition({id:"ghost",name:"ghost",category:"buff_debuff",
      form:"self",energyCost:0,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
      targetRelations:["self"],effect:{damage:0},effects:[{
        kind:"apply_status",targetScope:"self",status:intangible()
      }]})
  });
  const attack=(hitsIntangible)=>normalizeSkillDefinition({
    id:hitsIntangible?"phase-stun":"ordinary-stun",name:"stun",
    category:"offensive",form:"contact",approachMode:"none",
    energyCost:0,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
    hitsIntangible,effect:{damage:0,interruptsPreparation:true,stunMs:700}
  });
  const result=session.useSkill({actorId:"source",targetId:"target",skill:attack(false)});
  assert.equal(result.ok,true);
  assert.equal(result.events.some(e=>e.type==="charge-interrupt"),false);
  const piercing=session.useSkill({actorId:"source",targetId:"target",skill:attack(true)});
  assert.equal(piercing.ok,true);
  assert.equal(piercing.events.some(e=>e.type==="charge-interrupt"),true);
});
