import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {normalizeBattleFormatDefinition} from "../../src/contracts/battle-format-definition.js";
import {combatHealthDeltaEventsV1} from "../../src/core/combat/combat-health-feedback-v1.js";

const echo=normalizeSkillDefinition(JSON.parse(readFileSync(
  "data/capture/showcase/raiiven-remanence-interdite.capture-skill-transfer-v1.json","utf8"
)).draft.definition);
const shot=normalizeSkillDefinition({
  id:"echo-native-projectile-source",name:"Frappe projectile ennemie",
  category:"offensive",form:"projectile",element:"fire",approachMode:"none",
  energyCost:0,preparationMs:0,travelMs:650,recoveryMs:0,cooldownMs:0,
  allowedDistances:["short","medium","long"],targetRelations:["enemy"],
  effect:{damage:20,heal:0,interruptsPreparation:false,stunMs:0,tags:[]}
});
const fighter=id=>({id,maxHp:160,initialHp:160,maxEnergy:30,initialEnergy:30,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const format=normalizeBattleFormatDefinition({
  id:"echo-native-contact-regression",localActorId:"raiiven",
  teams:{players:["raiiven"],enemies:["enemy"]},
  actors:["raiiven","enemy"].map(actorId=>({
    actorId,teamId:actorId==="raiiven"?"players":"enemies",
    creatureId:actorId,displayName:actorId,fighterConfigId:actorId,
    controllerId:actorId==="raiiven"?"human-local":"ai-enemy"
  }))
});

function fakeFxArena(){
  let moved=false;
  const frames=[],animations=[],created=[];
  const bounds={left:0,top:0,width:800,height:400};
  const sourceBounds={left:90,top:90,width:60,height:60};
  const targetBounds={left:600,top:105,width:80,height:80};
  const doc={createElement(tag){
    const node={
      ownerDocument:doc,tag,className:"",dataset:{},style:{},children:[],
      append(child){this.children.push(child);},
      remove(){this.removed=true;},
      querySelector(){return null;},
      getBoundingClientRect(){
        // The ONLY projectile geometry is the rendered shadow orb. Mimic
        // its native WAAPI movement between sampled animation frames.
        return this.dataset.shadowEcho==="true"
          ? (moved?{left:616,top:120,width:56,height:56}
            :{left:92,top:92,width:56,height:56})
          : {left:600,top:105,width:80,height:80};
      }
    };
    created.push(node);
    return node;
  }};
  const arena={ownerDocument:doc,dataset:{},style:{getPropertyValue(){return "";}},
    append(node){created.push(node);},
    getBoundingClientRect(){return bounds;}};
  const anchors={
    raiiven:{getBoundingClientRect(){return sourceBounds;}},
    enemy:{getBoundingClientRect(){return targetBounds;}}
  };
  const mask={width:8,height:8,opaque:new Uint8Array(64).fill(1)};
  const frame={mask,origin:{x:600,y:105},axisX:{x:680,y:105},axisY:{x:600,y:185}};
  return {arena,anchors,created,animations,frames,
    move(){moved=true;},
    flushOne(){const fn=frames.shift();assert.ok(fn,"one authoritative RAF observation");fn();},
    animate(node,keyframes,options){
      const animation={node,keyframes,options,finished:new Promise(()=>{}),cancel(){}};
      animations.push(animation);
      return animation;
    },
    requestFrame(fn){frames.push(fn);return frames.length;},
    targetCollisionModelFor(){return {snapshot:()=>frame};}
  };
}

test("Raiiven skill 4 shadow projectile uses native visible-mask contact, converts 20 to 12 shadow damage, and emits a damage number",()=>{
  const session=createCombatSession({battleFormat:format,distance:"short",
    fighters:[fighter("raiiven"),fighter("enemy")]});
  const enemyShot=session.useSkill({actorId:"enemy",targetId:"raiiven",skill:shot});
  assert.equal(enemyShot.ok,true,"the enemy actually casts a copyable projectile");
  const prior=session.snapshot(),ui=fakeFxArena(),contacts=[],resolutions=[];
  const renderer=createDomSkillFxRenderer({
    arena:ui.arena,anchors:ui.anchors,targetAnchors:ui.anchors,
    presentationForSkill:()=>null,
    animate:ui.animate,requestFrame:ui.requestFrame,cancelFrame(){},
    targetCollisionModelFor:ui.targetCollisionModelFor,
    onProjectileContact(contact){
      contacts.push(contact);
      const result=session.useSkill({actorId:"raiiven",targetId:"enemy",skill:echo});
      resolutions.push(result);
      return {ok:result.ok,outcome:result.outcome};
    }
  });
  const projectile=renderer.play({type:"projectile",shadowEcho:true,
    skillId:echo.id,fromSlot:"raiiven",targetSlot:"enemy",durationMs:650});
  assert.equal(projectile.status,"running");
  assert.equal(ui.created.filter(x=>x.dataset.shadowEcho==="true").length,2,
    "one orb object appears in created list and arena append; no alternative visual authority");
  assert.equal(contacts.length,0,"visual emission is not damage");
  ui.move();
  ui.flushOne();
  assert.equal(contacts.length,1,"shadow projectile reports real opaque-model contact exactly once");
  assert.equal(contacts[0].actorId,"raiiven");
  assert.equal(contacts[0].targetId,"enemy");
  assert.equal(resolutions[0].ok,true);
  assert.equal(resolutions[0].outcome,"hit");
  assert.equal(resolutions[0].echoCopied,true);
  assert.equal(session.snapshot().fighters.enemy.hp,prior.fighters.enemy.hp-12,
    "Remanence applies 60% native damage only after the visible contact");
  const deltas=combatHealthDeltaEventsV1(prior,session.snapshot());
  assert.deepEqual(deltas.filter(e=>e.actorId==="enemy").map(e=>[e.kind,e.amount]),
    [["damage",12]],"normal CombatRuntime health-delta fires the floating 12 damage cue");
  renderer.dispose();
});

test("Non-damaging copied skills are not assigned fictitious shadow damage",()=>{
  const session=createCombatSession({battleFormat:format,distance:"short",
    fighters:[fighter("raiiven"),fighter("enemy")]});
  const shield=normalizeSkillDefinition({
    id:"copyable-support",name:"Fortification",category:"defensive",form:"self",
    element:"earth",approachMode:"none",energyCost:0,
    preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
    allowedDistances:["short","medium","long"],targetRelations:["self"],
    effect:{damage:0,heal:0,interruptsPreparation:false,stunMs:0,tags:[]}
  });
  assert.equal(session.useSkill({actorId:"enemy",targetId:"enemy",skill:shield}).ok,true);
  const projected=session.inspectEchoSource({actorId:"raiiven",targetId:"enemy",skill:echo});
  assert.equal(projected.ok,true);
  assert.equal(projected.skill.effect.damage,0);
  assert.equal(projected.targetId,"raiiven","support copied skill targets Raiiven, not the enemy");
});
