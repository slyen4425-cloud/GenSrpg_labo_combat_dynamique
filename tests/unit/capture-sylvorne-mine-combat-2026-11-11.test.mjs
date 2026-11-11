import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";

const load=id=>JSON.parse(readFileSync(
  new URL("../../data/capture/showcase/"+id+".capture-skill-transfer-v1.json",import.meta.url),"utf8"
)).draft.definition;

const root=load("sylvorne-eclat-racinaire");
const mine=normalizeSkillDefinition(load("sylvorne-vrilles-du-sous-bois"));
const ultimate=normalizeSkillDefinition({
  ...load("sylvorne-foret-souveraine"),preparationMs:0,recoveryMs:0,energyCost:0
});
const marker=root.effects.find(x=>x.kind==="apply_marker");
const seed=normalizeSkillDefinition({
  ...root,id:"test-sylvorne-seed",name:"Test Germination native",
  category:"offensive",form:"area",energyCost:0,preparationMs:0,
  travelMs:0,recoveryMs:0,cooldownMs:0,
  effects:[marker],projectileClash:{power:0}
});
const create=()=>createCombatSession({
  fighters:[
    {id:"hero",maxHp:500,initialHp:500,maxEnergy:20,initialEnergy:20,energyChargeAmount:0},
    {id:"enemy",maxHp:500,initialHp:500,maxEnergy:20,initialEnergy:20,energyChargeAmount:0}
  ],
  battleFormat:{
    actors:[{actorId:"hero"},{actorId:"enemy"}],
    teamOf(id){return id==="hero"?"player":id==="enemy"?"opponent":null;}
  }
});
const cast=(session,skill)=>session.useSkill({actorId:"hero",targetId:"enemy",skill});

test("Sylvorne root mine uses native scheduler: exactly 15 Nature after 2 s, 4 energy and no unmarked stun",()=>{
  assert.equal(mine.form,"area");
  assert.equal(mine.cooldownMs,0);
  assert.equal(mine.energyCost,4);
  const session=create();
  assert.equal(cast(session,mine).ok,true);
  assert.equal(session.snapshot().fighters.hero.energy,16);
  assert.equal(session.snapshot().scheduledEffects.length,1);
  assert.equal(session.snapshot().scheduledEffects[0].dueAtMs,2000);
  assert.equal(session.snapshot().scheduledEffects[0].visualCue,"ground_mine");
  assert.equal(session.snapshot().fighters.enemy.hp,500);
  session.advanceMs(1999);
  assert.equal(session.snapshot().fighters.enemy.hp,500);
  session.advanceMs(1);
  assert.equal(session.snapshot().fighters.enemy.hp,485);
  assert.equal(session.snapshot().scheduledEffects.length,0);
  assert.equal(session.snapshot().fighters.enemy.statusEffects.some(s=>s.definition.kind==="stun"),false);
  session.advanceMs(10000);
  assert.equal(session.snapshot().fighters.enemy.hp,485);
});

test("Germination is checked by the native mine at explosion, not at placement",()=>{
  const session=create();
  assert.equal(cast(session,mine).ok,true);
  // Apply Germination AFTER laying the trap: the delayed payload must inspect
  // the actual marker state at 2000ms, not capture a stale flag at cast time.
  assert.equal(cast(session,seed).ok,true);
  assert.equal(session.snapshot().fighters.enemy.statusEffects.some(
    s=>s.definition.id==="marker:sylvorne-germination"),true);
  session.advanceMs(2000);
  assert.equal(session.snapshot().fighters.enemy.hp,485);
  assert.equal(session.snapshot().fighters.enemy.statusEffects.some(
    s=>s.definition.kind==="stun" && s.definition.durationMs===2000),true);
});

test("Germination threshold keeps two native stacks so the ultimate consumes both for +12 damage",()=>{
  const session=create();
  assert.equal(cast(session,seed).ok,true);
  assert.equal(cast(session,seed).ok,true);
  const before=session.snapshot().fighters.enemy.hp;
  assert.equal(session.snapshot().fighters.enemy.statusEffects.some(
    s=>s.definition.id==="marker:sylvorne-germination" && s.stacks===2),true);
  assert.equal(cast(session,ultimate).ok,true);
  assert.equal(session.snapshot().fighters.enemy.hp,before-62);
  assert.equal(session.snapshot().fighters.enemy.statusEffects.some(
    s=>s.definition.id==="marker:sylvorne-germination"),false);
  assert.equal(session.snapshot().fighters.enemy.statusEffects.some(
    s=>s.definition.kind==="immobilize" && s.definition.durationMs===10000),true);
});
