import test from "node:test";
import assert from "node:assert/strict";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {createCombatBarrierV1} from "../../src/core/combat/combat-entity-v1.js";
import {applyCombatDamageV1} from "../../src/core/combat/combat-damage-application-v1.js";

test("native wall creation, raw damage and destruction are projected even when fighter HP does not change", () => {
  let state = createCombatState({fighters:[
    {id:"hero",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace:10}},
    {id:"enemy",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10}
  ]});
  let nowMs = 0;
  const callbacks = [];
  const snapshots = [];
  const hpFeedbacks = [];
  const runtime = createCombatRuntime({
    session:{snapshot:()=>state,advanceMs:()=>state},
    now:()=>nowMs,
    tickMs:25,
    setTimer:callback=>{callbacks.push(callback);return callbacks.length;},
    clearTimer:()=>{},
    onState:current=>snapshots.push({
      fighterHp:current.fighters.hero.hp,
      wallHp:current.combatEntities?.[0]?.hp??null
    }),
    onHealthDelta:event=>hpFeedbacks.push(event)
  });
  const tick = () => {nowMs+=25;const callback=callbacks.shift();assert.equal(typeof callback,"function");callback();};
  try {
    runtime.start();
    assert.deepEqual(snapshots,[{fighterHp:100,wallHp:null}]);
    const wall = createCombatBarrierV1({
      state,sourceActorId:"hero",protectedActorId:"hero",sourceSkillId:"ice-wall",
      effect:{kind:"summon_entity",entityKind:"barrier",statId:"glace",
        hpPerStatPoint:1,interceptKinds:["projectile","beam","contact"]}
    });
    state=wall.state;
    tick();
    assert.deepEqual(snapshots.at(-1),{fighterHp:100,wallHp:10},"spawn must refresh wall overlay");
    const hit=applyCombatDamageV1({
      state,sourceActorId:"enemy",targetActorId:"hero",damage:4,
      incomingKind:"projectile",contactedEntityId:wall.record.id
    });
    state=hit.state;
    assert.equal(hit.absorbedByEntity,4);
    assert.equal(hit.appliedDamage,0);
    tick();
    assert.deepEqual(snapshots.at(-1),{fighterHp:100,wallHp:6},"wall HP loss must trigger onState");
    const beforeIdle=snapshots.length;
    tick();
    assert.equal(snapshots.length,beforeIdle,"unchanged combat state must not spam UI updates");
    state=applyCombatDamageV1({
      state,sourceActorId:"enemy",targetActorId:"hero",damage:6,
      incomingKind:"projectile",contactedEntityId:wall.record.id
    }).state;
    tick();
    assert.deepEqual(snapshots.at(-1),{fighterHp:100,wallHp:null},"destruction must remove persistent wall sprite");
    assert.equal(snapshots.length,beforeIdle+1);
    assert.equal(hpFeedbacks.length,0,"absorbed barrier damage is not fighter HP damage");
  } finally {
    runtime.dispose();
  }
});
