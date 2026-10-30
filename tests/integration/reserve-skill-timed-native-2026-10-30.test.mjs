import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createRosterSession} from "../../src/core/combat/roster-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {buildCaptureDodgeReactionSkillV1} from "../../src/contracts/capture-game-options-v1.js";

const data=JSON.parse(readFileSync(new URL("../../data/capture/showcase/liane_venimeuse.capture-skill-transfer-v1.json",import.meta.url)));
const skill=normalizeSkillDefinition(data.draft.definition);
const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0});
const format={actors:[{actorId:"player",teamId:"heroes"},{actorId:"opponent",teamId:"enemies"}],
  teamOf(id){return this.actors.find(a=>a.actorId===id)?.teamId??null;}};
function harness(){
  const configs=Object.fromEntries(["p0","e0","e1"].map(id=>[id,fighter(id)]));
  const session=createCombatSession({distance:"medium",battleFormat:format,
    fighters:[{...configs.p0,id:"player"},{...configs.e0,id:"opponent"}]});
  const team=(slotId,ids)=>({slotId,activeMemberId:ids[0],members:ids.map(id=>({id,creatureId:id,displayName:id,fighterConfigId:id}))});
  const changes=[];
  const roster=createRosterSession({combatSession:session,battleFormat:format,fighterConfigs:configs,
    recallCooldownMs:45000,cancelActiveActionForForcedSwitch:id=>changes.push(id),
    roster:{teams:{player:team("player",["p0"]),opponent:team("opponent",["e0","e1"])}}});
  const targetRef={scope:"reserve",teamId:"opponent",memberId:"e1"};
  let time=0,ids=0;
  const queued=new Map(),events=[];
  const runtime=createCombatRuntime({
    session,now:()=>time,setTimer:cb=>{const id=++ids;queued.set(id,cb);return id;},
    clearTimer:id=>queued.delete(id),
    onRelease:({action})=>events.push(["release",time,action.skill.id]),
    onResolved:resolution=>{
      events.push(["resolved",time,resolution.outcome]);
      if(resolution.skillId==="liane_venimeuse")
        events.push(["reserve",time,roster.useSkillOnTarget({actorId:"player",targetRef,skill,completedResolution:resolution}).outcome]);
    },
    onInterrupted:result=>events.push(["interrupted",time,result.outcome])
  });
  runtime.start();
  function step(t){time=t;const callbacks=[...queued.values()];queued.clear();for(const cb of callbacks)cb();}
  return {session,roster,runtime,targetRef,events,step,changes};
}

test("TDD RED: true native cast preserves source timelines and reserve is untouched until beam arrival",()=>{
  const h=harness();
  const staged=h.roster.prepareSkillOnTarget({actorId:"player",targetRef:h.targetRef,skill});
  assert.equal(staged.ok,true);
  assert.deepEqual(staged.skill.effects,[],"the visible opponent must not receive bench effects");
  const begun=h.runtime.startSkill({actorId:"player",targetId:staged.targetId,skill:staged.skill});
  assert.equal(begun.ok,true);
  assert.equal(begun.action.releaseAtMs,2200);
  assert.equal(begun.action.impactAtMs,3000);
  assert.equal(h.roster.snapshot().opponent.activeMemberId,"e0");
  assert.equal(h.session.snapshot().fighters.player.energy,14,"cost spent exactly once at start");
  h.step(2199);
  assert.equal(h.roster.snapshot().opponent.activeMemberId,"e0");
  assert.equal(h.events.length,0);
  h.step(2200);
  assert.deepEqual(h.events[0],["release",2200,"liane_venimeuse"]);
  assert.equal(h.roster.snapshot().opponent.activeMemberId,"e0","no instantaneous swap on beam release");
  h.step(2999);
  assert.equal(h.roster.snapshot().opponent.activeMemberId,"e0");
  h.step(3000);
  assert.equal(h.events.find(x=>x[0]==="resolved")?.[2],"hit");
  assert.deepEqual(h.events.find(x=>x[0]==="reserve")?.slice(0,3),["reserve",3000,"forced_switched"]);
  assert.equal(h.roster.snapshot().opponent.activeMemberId,"e1");
  const status=h.session.snapshot().fighters.opponent.statusEffects;
  assert.equal(status.find(x=>x.definition.id==="marker:graine-sansue")?.stacks,2);
  assert.equal(status.find(x=>x.definition.id==="marker:poison")?.stacks,2);
  assert.equal(h.session.snapshot().fighters.player.skillUseCounts["liane_venimeuse"],1);
  assert.equal(h.session.snapshot().fighters.player.energy,14,"no double charge at impact");
  h.runtime.dispose();
});

test("TDD RED: defender dodge through native Runtime cancels forced switch and all reserve effects",()=>{
  const h=harness();
  const staged=h.roster.prepareSkillOnTarget({actorId:"player",targetRef:h.targetRef,skill});
  assert.equal(h.runtime.startSkill({actorId:"player",targetId:staged.targetId,skill:staged.skill}).ok,true);
  const dodge=buildCaptureDodgeReactionSkillV1({dodge:{enabled:true,maxCharges:1,rechargeMs:2000}});
  assert.equal(h.runtime.reactWithRechargeableAction(dodge,{againstActorId:"player",
    recharge:{actionId:dodge.id,maxCharges:1,rechargeMs:2000}}).ok,true);
  h.step(2200);
  h.step(3000);
  assert.ok(h.events.some(x=>x[0]==="resolved"&&x[2]==="evaded"),JSON.stringify(h.events));
  assert.equal(h.roster.snapshot().opponent.activeMemberId,"e0");
  assert.equal(h.roster.reserveMemberSnapshot("opponent","e1").statusEffects.length,0);
  assert.equal(h.session.snapshot().fighters.player.energy,14);
  h.runtime.dispose();
});

test("TDD RED: impact settlement is idempotent and forged/mismatched resolutions cannot switch",()=>{
  const h=harness();
  const staged=h.roster.prepareSkillOnTarget({actorId:"player",targetRef:h.targetRef,skill});
  assert.equal(staged.ok,true);
  assert.equal(h.roster.useSkillOnTarget({actorId:"player",targetRef:h.targetRef,skill,
    completedResolution:{ok:true,outcome:"hit",actorId:"opponent",targetId:"opponent",skillId:"liane_venimeuse"}}).ok,false);
  const started=h.runtime.startSkill({actorId:"player",targetId:staged.targetId,skill:staged.skill});
  assert.equal(started.ok,true);
  h.runtime.cancelActive("player");
  h.step(4000);
  assert.equal(h.roster.snapshot().opponent.activeMemberId,"e0");
  assert.equal(h.session.snapshot().fighters.player.skillUseCounts["liane_venimeuse"],1);
  h.runtime.dispose();
});
