import test from "node:test";
import assert from "node:assert/strict";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createRosterSession } from "../../src/core/combat/roster-session.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";

function fighter(id, initialHp = 100) {
  return { id, maxHp: 100, initialHp, maxEnergy: 40, initialEnergy: 40,
    energyChargeAmount: 0, energyChargeIntervalMs: 2000, movementEnergyPerStep: 0,
    chargeTimeModifierPct: 0, resistancePctByChannel: { fire: 50 } };
}
const format = {
  actors: [
    { actorId: "player", teamId: "heroes" }, { actorId: "ally", teamId: "heroes" },
    { actorId: "opponent", teamId: "villains" }
  ],
  teamOf(id) { return this.actors.find(a => a.actorId === id)?.teamId ?? null; }
};
function skill({id="mixed", relations=["enemy"], locations=["active"], effects=[]}) {
  return normalizeSkillDefinition({ id, name:id, category:"buff_debuff", form:"aura",
    energyCost:5, preparationMs:0, travelMs:0, recoveryMs:0, cooldownMs:1500,
    allowedDistances:["medium"], targetRelations:relations, targetLocations:locations,
    effect: {damage:0, heal:0}, effects });
}
const damage = (amount, targetScope) =>
  ({kind:"damage", amount, channel:"physical", targetScope});
const heal = (amount, targetScope) =>
  ({kind:"heal", amount, targetScope});
function harness() {
  const configs = Object.fromEntries(
    ["p0","p1","p2","a0","a1","e0","e1","e2"].map(id => [id, fighter(id, id === "p1" || id === "p2" || id === "a1" ? 60 : 100)])
  );
  const session = createCombatSession({
    distance:"medium", battleFormat:format,
    fighters:[{...configs.p0,id:"player"},{...configs.a0,id:"ally"},{...configs.e0,id:"opponent"}]
  });
  function team(slotId, prefix, names) {
    return {slotId,activeMemberId:names[0],members:names.map((name,i)=>({
      id:name,creatureId:prefix + i,displayName:name,fighterConfigId:prefix + i
    }))};
  }
  const roster = createRosterSession({
    combatSession:session, fighterConfigs:configs, battleFormat:format,
    roster:{teams:{player:team("player","p",["p0","p1","p2"]),
      ally:team("ally","a",["a0","a1"]),
      opponent:team("opponent","e",["e0","e1","e2"])}}
  });
  const hp = (slot,id) => roster.snapshot()[slot].members.find(x=>x.id===id).hp;
  return {session,roster,hp};
}
test("mixed damage: 50 active plus 10 to EVERY alive enemy reserve, once per cast",()=>{
  const {session,roster,hp}=harness();
  const fire = skill({id:"splash-reserve",effects:[
    damage(50,"target"), damage(10,"all_enemy_reserves")
  ]});
  const result = roster.useSkillOnTarget({
    actorId:"player",targetRef:{scope:"active",actorId:"opponent"},skill:fire
  });
  assert.equal(result.ok,true);
  assert.equal(session.snapshot().fighters.opponent.hp,50);
  assert.equal(hp("opponent","e1"),90);
  assert.equal(hp("opponent","e2"),90);
  assert.equal(hp("player","p1"),60);
  assert.equal(session.snapshot().fighters.player.energy,35);
  assert.equal(session.snapshot().fighters.player.skillUseCounts["splash-reserve"],1);
  assert.equal(session.snapshot().fighters.player.damageDealtTotal,70);
  assert.equal(Object.keys(session.snapshot().fighters).some(x=>x.startsWith("__reserve__")),false);
});
test("mixed healing: 50 active plus 10 to each allied reserve (including teammate bench)",()=>{
  const {session,roster,hp}=harness();
  const harm=skill({id:"hurt",relations:["enemy"],locations:["reserve"],effects:[damage(40,"target")]});
  for(const member of ["p1","p2"]) {
    assert.equal(roster.useSkillOnTarget({
      actorId:"opponent",targetRef:{scope:"reserve",teamId:"player",memberId:member},skill:harm
    }).ok,true);
    // Clear cooldown between two distinct casts.
    session.advanceMs(1600);
  }
  const support=skill({id:"bulk-heal",relations:["self","ally"],effects:[
    heal(50,"target"),heal(10,"all_ally_reserves")
  ]});
  // Damage the active fighter first to verify a real 50 HP heal on the field.
  const enemy=skill({id:"strike",relations:["enemy"],effects:[damage(60,"target")]});
  assert.equal(roster.useSkillOnTarget({actorId:"opponent",targetRef:{scope:"active",actorId:"player"},skill:enemy}).ok,true);
  const response=roster.useSkillOnTarget({actorId:"player",targetRef:{scope:"active",actorId:"player"},skill:support});
  assert.equal(response.ok,true);
  assert.equal(session.snapshot().fighters.player.hp,90);
  assert.equal(hp("player","p1"),30);
  assert.equal(hp("player","p2"),30);
  assert.equal(hp("ally","a1"),70);
  assert.equal(hp("opponent","e1"),100);
  assert.equal(session.snapshot().fighters.player.energy,35);
});
test("single chosen enemy reserve damage and chosen ally reserve healing retain V1 isolation",()=>{
  const {session,roster,hp}=harness();
  const hit = skill({id:"single-bench",locations:["reserve"],effects:[damage(20,"target")]});
  assert.equal(roster.useSkillOnTarget({actorId:"player",
    targetRef:{scope:"reserve",teamId:"opponent",memberId:"e2"},skill:hit}).ok,true);
  assert.equal(hp("opponent","e2"),80);
  assert.equal(hp("opponent","e1"),100);
  assert.equal(session.snapshot().fighters.opponent.hp,100);
  const aid=skill({id:"single-bench-heal",relations:["ally"],locations:["reserve"],effects:[heal(15,"target")]});
  assert.equal(roster.useSkillOnTarget({actorId:"player",
    targetRef:{scope:"reserve",teamId:"player",memberId:"p1"},skill:aid}).ok,true);
  assert.equal(hp("player","p1"),75);
  assert.equal(hp("player","p2"),60);
});
test("reserve supplemental scopes are restricted to damage/heal and require an active anchor",()=>{
  assert.throws(()=>skill({effects:[{kind:"energy_drain",targetScope:"all_enemy_reserves",amount:5}]}),/reserve|damage|heal/i);
  assert.throws(()=>skill({locations:["reserve"],effects:[damage(10,"all_enemy_reserves")]}),/active|reserve/i);
});
test("combat session WITHOUT a roster rejects reserve supplements before charging energy",()=>{
  const session=createCombatSession({distance:"medium",fighters:[fighter("player"),fighter("opponent")],battleFormat:format});
  const mixed=skill({effects:[damage(50,"target"),damage(10,"all_enemy_reserves")]});
  const result=session.useSkill({actorId:"player",targetId:"opponent",skill:mixed});
  assert.equal(result.ok,false);
  assert.equal(result.outcome,"reserve_roster_required");
  assert.equal(session.snapshot().fighters.player.energy,40);
  assert.equal(session.snapshot().fighters.opponent.hp,100);
});
